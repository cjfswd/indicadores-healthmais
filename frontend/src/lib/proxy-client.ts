import type { DbRequest, DbResponse } from './db-types';
import { logger } from './logger';

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'https://localhost:3000/db/execute';

export async function dbExecute<T = any>(
  meta: DbRequest,
  fileBuffer?: ArrayBuffer | Blob
): Promise<DbResponse<T>> {
  logger.debug(`[Proxy Client] Executing ${meta.action} on ${meta.collection}`, meta);
  
  const headers: Record<string, string> = {
    'x-db-meta': JSON.stringify(meta),
  };

  const options: RequestInit = {
    method: 'POST',
    headers,
  };

  if (fileBuffer) {
    logger.debug(`[Proxy Client] Attaching binary payload of ${fileBuffer instanceof Blob ? fileBuffer.size : fileBuffer.byteLength} bytes`);
    options.body = fileBuffer;
  }

  const startTime = performance.now();
  
  try {
    const response = await fetch(PROXY_URL, options);
    const duration = (performance.now() - startTime).toFixed(2);

    if (meta.action === 'getFile' || meta.action === 'generateReport') {
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      logger.info(`[Proxy Client] Fetched file (${blob.size} bytes) in ${duration}ms`);
      return { success: true, result: blob as any };
    }

    const data: DbResponse<T> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Database execution failed');
    }

    logger.info(`[Proxy Client] Success ${meta.action} on ${meta.collection} in ${duration}ms`, data.duration ? `(Backend: ${data.duration})` : '');
    return data;
  } catch (error: any) {
    logger.error(`[Proxy Client] Failed ${meta.action} on ${meta.collection}`, error.message);
    throw error;
  }
}
