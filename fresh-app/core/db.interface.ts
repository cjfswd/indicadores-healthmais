export interface FindCursor {
  sort(spec: Record<string, unknown>): FindCursor;
  skip(n: number): FindCursor;
  limit(n: number): FindCursor;
  toArray(): Promise<Record<string, unknown>[]>;
}

export interface ICollection {
  find(filter: Record<string, unknown>): FindCursor;
  findOne(filter: Record<string, unknown>): Promise<Record<string, unknown> | null>;
  countDocuments(filter: Record<string, unknown>): Promise<number>;
  insertOne(doc: Record<string, unknown>): Promise<{ insertedId: unknown }>;
  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: { upsert?: boolean },
  ): Promise<{ modifiedCount: number; upsertedId?: unknown }>;
}

export interface IDb {
  collection(name: string): ICollection;
}

// Minimal ObjectId abstraction shared by both implementations
export interface IObjectId {
  toString(): string;
}
