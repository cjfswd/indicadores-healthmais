import http2 from 'node:http2';
import fs from 'node:fs';
import path from 'node:path';
import { MongoClient, ObjectId, Db } from 'mongodb';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import type { DbRequest, DbResponse } from './types';
import { logger } from './logger';
import { defaultOperators, defaultIndicators, defaultSubindicatorsList, camperjPatients, unimedPatients } from './data/seed-data';

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'coringa_db';

const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB

import { MongoMemoryServer } from 'mongodb-memory-server';

let dbClient: MongoClient;
let mongoServer: MongoMemoryServer;

async function seedDatabase(db: Db) {
  const operatorsCollection = db.collection('operators');
  
  // Seed Operators safely
  for (const op of defaultOperators) {
    await operatorsCollection.updateOne(
      { name: op.name },
      { $setOnInsert: { name: op.name, createdAt: new Date(), updatedAt: new Date(), deletedAt: null } },
      { upsert: true }
    );
  }

  // Seed Indicators safely
  const indicatorsCollection = db.collection('indicators');
  for (const ind of defaultIndicators) {
    await indicatorsCollection.updateOne(
      { name: ind.name },
      { $setOnInsert: { ...ind, createdAt: new Date(), updatedAt: new Date(), deletedAt: null } },
      { upsert: true }
    );
  }
  
  // Seed Subindicators safely
  const subindicatorsCollection = db.collection('subindicators');
  const parentIndicators = await indicatorsCollection.find({}).toArray();
  const getParentId = (namePrefix: string) => {
    const parent = parentIndicators.find(i => i.name.startsWith(namePrefix));
    return parent ? parent._id.toString() : "";
  };
  
  for (const sub of defaultSubindicatorsList) {
    const parentId = getParentId(sub.parentPrefix);
    if (parentId) {
      await subindicatorsCollection.updateOne(
        { name: sub.name, parentIndicatorId: parentId },
        { $setOnInsert: { 
            name: sub.name, 
            parentIndicatorId: parentId, 
            targetType: sub.targetType,
            targetDirection: sub.targetDirection,
            targetValue: sub.targetValue,
            observations: "", 
            createdAt: new Date(), 
            updatedAt: new Date(), 
            deletedAt: null 
          } 
        },
        { upsert: true }
      );
    }
  }

  // Seed Patients safely
  const patientsCollection = db.collection('patients');
  const existingOperators = await operatorsCollection.find({}).toArray();
  const camperjId = existingOperators.find(op => op.name === "Camperj")?._id.toString() || "";
  const unimedId = existingOperators.find(op => op.name === "Unimed")?._id.toString() || "";

  if ((await patientsCollection.countDocuments()) === 0) {
    logger.info('🌱 Seeding default patients...');
    const patients = [
      ...camperjPatients.map((name, index) => ({
        name,
        operatorId: camperjId,
        modality: "",
        admissionDate: "",
        birthDate: "",
        observations: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      })),
      ...unimedPatients.map((name, index) => ({
        name,
        operatorId: unimedId,
        modality: "",
        admissionDate: "",
        birthDate: "",
        observations: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }))
    ];
    await patientsCollection.insertMany(patients);
  } else {
    // Migrate existing patients that have empty operatorId
    const missingCount = await patientsCollection.countDocuments({ operatorId: "" });
    if (missingCount > 0) {
      logger.info(`🌱 Fixing operatorId for ${missingCount} existing patients...`);
      await patientsCollection.updateMany(
        { name: { $in: camperjPatients }, operatorId: "" },
        { $set: { operatorId: camperjId } }
      );
      await patientsCollection.updateMany(
        { name: { $in: unimedPatients }, operatorId: "" },
        { $set: { operatorId: unimedId } }
      );
    }
  }
  
  logger.info('🌱 Database seeding validation completed.');
}

async function connectDB() {
  if (!dbClient) {
    let uri = MONGO_URI;
    
    // In development or if MONGO_URI is default, use in-memory DB
    if (process.env.NODE_ENV !== 'production' && (!process.env.MONGO_URI || process.env.MONGO_URI === 'mongodb://localhost:27017')) {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      logger.info(`🧠 Running MongoDB in-memory: \${uri}`);
    }

    dbClient = new MongoClient(uri);
    await dbClient.connect();
    logger.info('✅ Connected to MongoDB');
    
    await seedDatabase(dbClient.db(DB_NAME));
  }
  return dbClient.db(DB_NAME);
}

const isProd = process.env.NODE_ENV === 'production';

const server = isProd
  ? http2.createServer()
  : http2.createSecureServer({
      allowHTTP1: true,
      key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
    });

server.on('error', (err) => logger.error('HTTP/2 Server Error', err));

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'x-db-meta, content-type',
  'access-control-max-age': '86400',
};

server.on('stream', async (stream: http2.ServerHttp2Stream, headers) => {
  if (headers[':method'] === 'OPTIONS') {
    stream.respond({ ':status': 204, ...CORS_HEADERS });
    stream.end();
    return;
  }

  // Google OAuth Endpoint
  if (headers[':method'] === 'POST' && headers[':path'] === '/auth/google') {
    let bodyBuffer = Buffer.alloc(0);
    stream.on('data', (chunk: Buffer) => { bodyBuffer = Buffer.concat([bodyBuffer, chunk]) });
    stream.on('end', async () => {
      try {
        const { credential } = JSON.parse(bodyBuffer.toString());
        const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID, 
        });
        
        const payload = ticket.getPayload();
        if (!payload) throw new Error('No payload in token');

        const db = dbClient.db(DB_NAME);
        const users = db.collection('users');
        
        let user = await users.findOne({ email: payload.email });
        if (!user) {
          const newUser = {
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            createdAt: new Date(),
            deletedAt: null
          };
          const insertRes = await users.insertOne(newUser);
          user = { _id: insertRes.insertedId, ...newUser };
          logger.info(`New user registered via Google: ${user.email}`);
        } else {
          logger.info(`User logged in via Google: ${user.email}`);
        }

        const token = jwt.sign(
          { id: user._id, email: user.email }, 
          process.env.JWT_SECRET || 'coringa_secret_key', 
          { expiresIn: '7d' }
        );

        stream.respond({ ':status': 200, 'content-type': 'application/json', ...CORS_HEADERS });
        stream.end(JSON.stringify({ success: true, token, user }));
      } catch (error: any) {
        logger.error('Google Auth Failed:', error);
        stream.respond({ ':status': 401, 'content-type': 'application/json', ...CORS_HEADERS });
        stream.end(JSON.stringify({ success: false, error: 'Authentication failed' }));
      }
    });
    return;
  }

  if (headers[':method'] !== 'POST' || headers[':path'] !== '/db/execute') {
    stream.respond({ ':status': 404, ...CORS_HEADERS });
    stream.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const metaHeader = headers['x-db-meta'];
  if (!metaHeader || typeof metaHeader !== 'string') {
    stream.respond({ ':status': 400, ...CORS_HEADERS });
    stream.end(JSON.stringify({ error: 'Missing or invalid x-db-meta header' }));
    return;
  }

  let metadata: DbRequest;
  try {
    metadata = JSON.parse(metaHeader) as DbRequest;
    logger.info(`Incoming Request`, { action: metadata.action, collection: metadata.collection });
  } catch (err) {
    logger.error('Invalid JSON in x-db-meta header');
    stream.respond({ ':status': 400, ...CORS_HEADERS });
    stream.end(JSON.stringify({ error: 'Invalid JSON in x-db-meta header' }));
    return;
  }

  const startTime = Date.now();
  let bodyBuffer = Buffer.alloc(0);

  stream.on('data', (chunk: Buffer) => {
    bodyBuffer = Buffer.concat([bodyBuffer, chunk]);
    if (bodyBuffer.length > MAX_PAYLOAD_SIZE) {
      logger.warn(`Payload too large (> 5MB) for action ${metadata.action} on ${metadata.collection}`);
      stream.respond({ ':status': 413, ...CORS_HEADERS });
      stream.end(JSON.stringify({ error: 'Payload Too Large (Max 5MB)' }));
      stream.destroy();
    }
  });

  stream.on('end', async () => {
    if (stream.destroyed) return;

    try {
      const db = await connectDB();
      const collection = db.collection(metadata.collection);

      // --- AUDIT TRAIL HELPER ---
      const logAudit = async (action: string, targetId: string, docBefore: any, docAfter: any) => {
        if (metadata.collection === 'audit_logs') return; 
        await db.collection('audit_logs').insertOne({
          targetCollection: metadata.collection,
          targetId,
          action,
          timestamp: new Date(),
          documentBefore: docBefore,
          documentAfter: docAfter
        }).catch(err => logger.error('Falha ao salvar Audit Log', err));
      };
      // --------------------------

      // Handle binary injection if specified
      if (metadata.fileField && bodyBuffer.length > 0) {
        logger.info(`Injecting binary payload of ${bodyBuffer.length} bytes into field '${metadata.fileField as string}'`);
        if (metadata.action === 'insert') {
          (metadata.data as any)[metadata.fileField as string] = bodyBuffer;
        } else if (metadata.action === 'update') {
          const updateData = metadata.data as any;
          if (updateData.$set) {
            updateData.$set[metadata.fileField as string] = bodyBuffer;
          } else {
            // If no $set, assume partial and just inject
            updateData[metadata.fileField as string] = bodyBuffer;
          }
        }
      }

      let result: any;
      let responsePayload: DbResponse;

      // Routing the actions
      switch (metadata.action) {
        case 'find': {
          const filter = metadata.query || {};
          if (!filter.deletedAt) {
            filter.deletedAt = null; // Soft delete default filter
          }
          result = await collection.find(filter).toArray();
          responsePayload = { success: true, result };
          break;
        }
        case 'insert': {
          const insertDoc = { ...metadata.data as any, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
          const insertRes = await collection.insertOne(insertDoc);
          result = { _id: insertRes.insertedId, ...insertDoc };
          
          await logAudit('insert', insertRes.insertedId.toString(), null, result);
          responsePayload = { success: true, result };
          break;
        }
        case 'update': {
          const filter = { _id: new ObjectId(metadata.id) };
          const docBefore = await collection.findOne(filter);
          
          let updateDoc = metadata.data as any;
          if (!updateDoc.$set) {
             updateDoc = { $set: updateDoc };
          }
          updateDoc.$set.updatedAt = new Date();
          
          const updateRes = await collection.findOneAndUpdate(filter, updateDoc, { returnDocument: 'after' });
          if (!updateRes) throw new Error('Document not found or deleted');
          
          if (docBefore && updateRes) {
            await logAudit('update', metadata.id!, docBefore, updateRes);
          }
          result = updateRes;
          responsePayload = { success: true, result };
          break;
        }
        case 'delete': {
          const filter = { _id: new ObjectId(metadata.id), deletedAt: null };
          const docBefore = await collection.findOne(filter);
          const deleteRes = await collection.findOneAndUpdate(filter, { $set: { deletedAt: new Date(), updatedAt: new Date() } }, { returnDocument: 'after' });
          
          if (!deleteRes) throw new Error('Document not found or already deleted');
          
          if (docBefore && deleteRes) {
            await logAudit('delete', metadata.id!, docBefore, deleteRes);
          }
          result = deleteRes;
          responsePayload = { success: true, result };
          break;
        }
        case 'bulkInsert': {
          const docs = metadata.documents.map(d => ({ ...d, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }));
          const bulkInsertRes = await collection.insertMany(docs as any);
          responsePayload = { success: true, result: bulkInsertRes };
          break;
        }
        case 'bulkUpdate': {
          const bulkOps = metadata.documents.map(op => {
            let updateDoc = op.update as any;
            if (!updateDoc.$set) updateDoc = { $set: updateDoc };
            updateDoc.$set.updatedAt = new Date();
            const filter = { ...op.filter, deletedAt: null };
            return { updateOne: { filter, update: updateDoc } };
          });
          const bulkUpdateRes = await collection.bulkWrite(bulkOps);
          responsePayload = { success: true, result: bulkUpdateRes };
          break;
        }
        case 'bulkDelete': {
          const filter = { ...metadata.query, deletedAt: null };
          const bulkDeleteRes = await collection.updateMany(filter, { $set: { deletedAt: new Date(), updatedAt: new Date() } });
          responsePayload = { success: true, result: bulkDeleteRes };
          break;
        }
        case 'getFile': {
          const filter = { _id: new ObjectId(metadata.id) };
          const doc = await collection.findOne(filter);
          if (!doc) throw new Error('Document not found or deleted');
          
          const fieldName = metadata.fieldName || 'file';
          const fileData = doc[fieldName];
          
          if (!fileData) throw new Error(`File field ${fieldName} not found`);
          
          stream.respond({
            ':status': 200,
            'content-type': 'application/octet-stream',
            ...CORS_HEADERS
          });
          stream.end(fileData.buffer || fileData);
          return; // Early return because we don't send JSON response payload
        }
        case 'generateReport': {
          const { spawn } = require('child_process');
          const scriptPath = path.join(__dirname, 'scripts', 'generate_report.py');
          const pythonExec = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
          
          const pythonProcess = spawn(pythonExec, [scriptPath]);
          let stdoutData = '';
          let stderrData = '';
          
          pythonProcess.stdout.on('data', (data: any) => { stdoutData += data.toString(); });
          pythonProcess.stderr.on('data', (data: any) => { stderrData += data.toString(); });
          
          const bodyData = bodyBuffer.length > 0 ? JSON.parse(bodyBuffer.toString()) : {};
          const reportData = { ...(metadata as any).data || {}, ...(Array.isArray(bodyData) ? { data: bodyData } : bodyData) };
          
          logger.info(`[Report] Spawning Python for ${reportData.title}`, { format: reportData.format, rows: reportData.data?.length });
          pythonProcess.stdin.write(JSON.stringify(reportData));
          pythonProcess.stdin.end();
          
          await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code: number) => {
              if (code !== 0) {
                reject(new Error(`Python script failed: ${stderrData}`));
              } else {
                resolve(null);
              }
            });
          });
          
          let resultJson: any;
          try {
            resultJson = JSON.parse(stdoutData);
          } catch (e) {
            logger.error('[Report] Failed to parse Python stdout:', stdoutData);
            throw new Error(`Invalid response from report script: ${stdoutData.substring(0, 100)}`);
          }
          if (resultJson.error) throw new Error(resultJson.error);
          
          const fileBuffer = fs.readFileSync(resultJson.filePath);
          fs.unlinkSync(resultJson.filePath);
          
          const mimeTypes: any = {
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          };
          const format = ((metadata as any).data as any).format || 'pdf';
          
          stream.respond({
            ':status': 200,
            'content-type': mimeTypes[format] || 'application/octet-stream',
            'content-disposition': `attachment; filename="report.${format}"`,
            ...CORS_HEADERS
          });
          stream.end(fileBuffer);
          return;
        }
        default:
          throw new Error(`Unknown action: ${(metadata as any).action}`);
      }

      const duration = Date.now() - startTime;
      responsePayload.duration = `${duration}ms`;

      logger.info(`[${metadata.collection}] ${metadata.action} completed successfully`, { duration: `${duration}ms`, resultSize: Array.isArray(result) ? result.length : 'N/A' });

      stream.respond({
        ':status': 200,
        'content-type': 'application/json',
        ...CORS_HEADERS
      });
      stream.end(JSON.stringify(responsePayload));
      
    } catch (error: any) {
      logger.error(`[DB Error] ${metadata.collection} ${metadata.action}:`, error);
      stream.respond({ ':status': 500, 'content-type': 'application/json', ...CORS_HEADERS });
      stream.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 Coringa Proxy Server listening on https://localhost:${PORT}`);
});
