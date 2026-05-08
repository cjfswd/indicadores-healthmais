import type { Filter, UpdateFilter, Document } from 'mongodb';

/**
 * Ações disponíveis no Proxy
 */
export type DbAction = 
  | 'find' 
  | 'insert' 
  | 'update' 
  | 'delete' 
  | 'bulkInsert' 
  | 'bulkUpdate' 
  | 'bulkDelete' 
  | 'getFile'
  | 'generateReport';

/**
 * Estrutura de metadados (enviada no header x-db-meta)
 */
export type DbRequest<T extends Document = any> = {
  collection: string;
  // Nome do campo que receberá o Buffer binário enviado no body (opcional)
  fileField?: keyof T | string; 
} & (
  | { action: 'find'; query?: Filter<T> }
  | { action: 'insert'; data: T }
  | { action: 'update'; id: string; data: UpdateFilter<T> | Partial<T> }
  | { action: 'delete'; id: string }
  | { action: 'bulkInsert'; documents: T[] }
  | { action: 'bulkUpdate'; documents: { filter: Filter<T>; update: UpdateFilter<T> | Partial<T> }[] }
  | { action: 'bulkDelete'; query: Filter<T> }
  | { action: 'getFile'; id: string; fieldName?: string }
  | { action: 'generateReport'; data: any }
);

export interface DbResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  duration?: string;
}
