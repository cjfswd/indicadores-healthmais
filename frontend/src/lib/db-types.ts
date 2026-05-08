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
export type DbRequest<T = any> = {
  collection: string;
  // Nome do campo que receberá o Buffer binário enviado no body (opcional)
  fileField?: keyof T | string; 
} & (
  | { action: 'find'; query?: any }
  | { action: 'insert'; data: T }
  | { action: 'update'; id: string; data: any }
  | { action: 'delete'; id: string }
  | { action: 'bulkInsert'; documents: T[] }
  | { action: 'bulkUpdate'; documents: { filter: any; update: any }[] }
  | { action: 'bulkDelete'; query: any }
  | { action: 'getFile'; id: string; fieldName?: string }
  | { action: 'generateReport'; data?: any }
);

export interface DbResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  duration?: string;
}
