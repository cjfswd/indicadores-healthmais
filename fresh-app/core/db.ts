import type { IDb, IObjectId } from "./db.interface.ts";

const isDev = Deno.env.get("DENO_ENV") !== "production";

let _db: IDb | null = null;

export async function getDb(): Promise<IDb> {
  if (_db) return _db;

  if (isDev) {
    const { getDevDb } = await import("./db.dev.ts");
    _db = getDevDb();
    console.log("[db] using in-memory database (dev mode)");
    const { seedDevDb } = await import("./seed.ts");
    await seedDevDb(_db);
    return _db;
  }

  const { MongoClient } = await import("npm:mongodb");
  const uri = Deno.env.get("MONGO_URI");
  const dbName = Deno.env.get("DB_NAME");
  if (!uri) throw new Error("MONGO_URI environment variable is not set");
  if (!dbName) throw new Error("DB_NAME environment variable is not set");

  const client = new MongoClient(uri);
  await client.connect();
  _db = client.db(dbName) as unknown as IDb;
  return _db;
}

export async function createObjectId(id?: string): Promise<IObjectId> {
  if (isDev) {
    const { DevObjectId } = await import("./db.dev.ts");
    return new DevObjectId(id);
  }
  const { ObjectId } = await import("npm:mongodb");
  return new ObjectId(id) as unknown as IObjectId;
}

export async function closeDb(): Promise<void> {
  _db = null;
}
