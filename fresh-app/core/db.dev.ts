import type { FindCursor, ICollection, IDb, IObjectId } from "./db.interface.ts";

// Minimal ObjectId that works like MongoDB's for dev purposes
export class DevObjectId implements IObjectId {
  readonly #id: string;

  constructor(id?: string) {
    this.#id = id ?? crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  }

  toString(): string {
    return this.#id;
  }

  toJSON(): string {
    return this.#id;
  }
}

type Doc = Record<string, unknown>;

function valueToString(v: unknown): string {
  if (v instanceof DevObjectId) return v.toString();
  return String(v);
}

// Resolve dot-notation paths: "operator._id" → doc.operator._id
function getNestedValue(doc: Doc, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = doc;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Doc)[part];
  }
  return current;
}

function matchesFilter(doc: Doc, filter: Doc): boolean {
  for (const [key, value] of Object.entries(filter)) {
    const docVal = key.includes(".") ? getNestedValue(doc, key) : doc[key];

    if (value === null || value === undefined) {
      if (docVal !== null && docVal !== undefined) return false;
      continue;
    }

    if (typeof value === "object" && !(value instanceof DevObjectId)) {
      // Handle MongoDB query operators
      const ops = value as Record<string, unknown>;
      if ("$in" in ops) {
        const arr = (ops.$in as unknown[]).map(valueToString);
        if (!arr.includes(valueToString(docVal))) return false;
        continue;
      }
      if ("$ne" in ops) {
        if (valueToString(docVal) === valueToString(ops.$ne)) return false;
        continue;
      }
      if ("$regex" in ops) {
        const flags = typeof ops.$options === "string" ? ops.$options : "";
        const re = new RegExp(String(ops.$regex), flags);
        if (!re.test(valueToString(docVal))) return false;
        continue;
      }
      if ("$gte" in ops || "$lte" in ops || "$gt" in ops || "$lt" in ops) {
        const n = Number(docVal);
        if ("$gte" in ops && n < Number(ops.$gte)) return false;
        if ("$lte" in ops && n > Number(ops.$lte)) return false;
        if ("$gt" in ops && n <= Number(ops.$gt)) return false;
        if ("$lt" in ops && n >= Number(ops.$lt)) return false;
        continue;
      }
      // No recognized operator — fall through to string comparison
    }

    if (valueToString(docVal) !== valueToString(value)) return false;
  }
  return true;
}

function applySortSkipLimit(
  docs: Doc[],
  sortSpec: Record<string, unknown>,
  skipN: number,
  limitN: number,
): Doc[] {
  let result = [...docs];

  const sortKeys = Object.entries(sortSpec);
  if (sortKeys.length > 0) {
    result.sort((a, b) => {
      for (const [key, dir] of sortKeys) {
        const av = a[key];
        const bv = b[key];
        const cmp = av instanceof Date && bv instanceof Date
          ? av.getTime() - bv.getTime()
          : typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
        if (cmp !== 0) return dir === -1 ? -cmp : cmp;
      }
      return 0;
    });
  }

  if (skipN > 0) result = result.slice(skipN);
  if (limitN > 0) result = result.slice(0, limitN);

  return result;
}

class InMemoryFindCursor implements FindCursor {
  #docs: Doc[];
  #sortSpec: Record<string, unknown> = {};
  #skipN = 0;
  #limitN = 0;

  constructor(docs: Doc[]) {
    this.#docs = docs;
  }

  sort(spec: Record<string, unknown>): this {
    this.#sortSpec = spec;
    return this;
  }

  skip(n: number): this {
    this.#skipN = n;
    return this;
  }

  limit(n: number): this {
    this.#limitN = n;
    return this;
  }

  async toArray(): Promise<Doc[]> {
    return applySortSkipLimit(this.#docs, this.#sortSpec, this.#skipN, this.#limitN);
  }
}

class InMemoryCollection implements ICollection {
  #store: Map<string, Doc>;
  #name: string;

  constructor(name: string, store: Map<string, Doc>) {
    this.#name = name;
    this.#store = store;
  }

  get name() {
    return this.#name;
  }

  find(filter: Doc): FindCursor {
    const matching = [...this.#store.values()].filter((doc) => matchesFilter(doc, filter));
    return new InMemoryFindCursor(matching);
  }

  async findOne(filter: Doc): Promise<Doc | null> {
    const docs = await this.find(filter).limit(1).toArray();
    return docs[0] ?? null;
  }

  async countDocuments(filter: Doc): Promise<number> {
    return [...this.#store.values()].filter((doc) => matchesFilter(doc, filter)).length;
  }

  async insertOne(doc: Doc): Promise<{ insertedId: unknown }> {
    const idObj = (doc._id as IObjectId | undefined) ?? new DevObjectId();
    const id = idObj.toString();
    const stored = { ...doc, _id: idObj };
    this.#store.set(id, stored);
    return { insertedId: idObj };
  }

  async updateOne(
    filter: Doc,
    update: Doc,
    options: { upsert?: boolean } = {},
  ): Promise<{ modifiedCount: number; upsertedId?: unknown }> {
    const entries = [...this.#store.entries()];
    const found = entries.find(([, doc]) => matchesFilter(doc, filter));

    if (found) {
      const [key, existing] = found;
      const setFields = (update.$set ?? {}) as Doc;
      this.#store.set(key, { ...existing, ...setFields });
      return { modifiedCount: 1 };
    }

    if (options.upsert) {
      const idObj = (filter._id as IObjectId | undefined) ?? new DevObjectId();
      const id = idObj.toString();
      const setFields = (update.$set ?? {}) as Doc;
      this.#store.set(id, { ...setFields, _id: idObj });
      return { modifiedCount: 0, upsertedId: idObj };
    }

    return { modifiedCount: 0 };
  }
}

class InMemoryDb implements IDb {
  #collections = new Map<string, Map<string, Doc>>();

  collection(name: string): ICollection {
    if (!this.#collections.has(name)) {
      this.#collections.set(name, new Map());
    }
    return new InMemoryCollection(name, this.#collections.get(name)!);
  }
}

// Singleton in-memory DB for the dev session
const devDb = new InMemoryDb();

export function getDevDb(): IDb {
  return devDb;
}
