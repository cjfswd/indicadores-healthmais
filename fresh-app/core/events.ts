import type { IDb, IObjectId } from "./db.interface.ts";

export type EventType = "CREATE" | "UPDATE" | "SOFT_DELETE";
export type StreamType = "patients" | "operators" | "indicators" | "users";

export interface StoreEvent {
  streamId: string;
  streamType: StreamType;
  eventType: EventType;
  version: number;
  data: Record<string, unknown>;
  timestamp: Date;
  actor: string;
}

async function getObjectId(id?: string): Promise<IObjectId> {
  if (Deno.env.get("DENO_ENV") !== "production") {
    const { DevObjectId } = await import("./db.dev.ts");
    return new DevObjectId(id);
  }
  const { ObjectId } = await import("npm:mongodb");
  return new ObjectId(id) as unknown as IObjectId;
}

async function getNextVersion(db: IDb, streamType: string, streamId: string): Promise<number> {
  const allEvents = await db.collection("events_store")
    .find({ streamId, streamType })
    .toArray();
  if (allEvents.length === 0) return 1;
  const maxVersion = allEvents.reduce((max, ev) => Math.max(max, (ev.version as number) ?? 0), 0);
  return maxVersion + 1;
}

async function materializeSnapshot(
  db: IDb,
  streamType: string,
  streamId: string,
  data: Record<string, unknown>,
  eventType: EventType,
): Promise<Record<string, unknown>> {
  const collection = db.collection(streamType);
  const now = new Date();
  const _id = await getObjectId(streamId);

  if (eventType === "CREATE") {
    const doc = {
      ...data,
      _id,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await collection.updateOne(
      { _id },
      { $set: doc },
      { upsert: true },
    );
    return doc;
  }

  if (eventType === "UPDATE") {
    const updateFields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k !== "_id" && k !== "createdAt" && k !== "deletedAt") {
        updateFields[k] = v;
      }
    }
    updateFields.updatedAt = now;
    await collection.updateOne({ _id }, { $set: updateFields });
    const updated = await collection.findOne({ _id });
    return updated as Record<string, unknown>;
  }

  // SOFT_DELETE
  await collection.updateOne(
    { _id },
    { $set: { deletedAt: now, updatedAt: now } },
  );
  const deleted = await collection.findOne({ _id });
  return deleted as Record<string, unknown>;
}

export async function appendEvent(
  db: IDb,
  streamType: StreamType,
  streamId: string,
  eventType: EventType,
  data: Record<string, unknown>,
  actor: string = "",
): Promise<Record<string, unknown>> {
  const version = await getNextVersion(db, streamType, streamId);

  const event: StoreEvent = {
    streamId,
    streamType,
    eventType,
    version,
    data,
    timestamp: new Date(),
    actor,
  };

  await db.collection("events_store").insertOne(event as unknown as Record<string, unknown>);

  return await materializeSnapshot(db, streamType, streamId, data, eventType);
}

export async function getStreamEvents(
  db: IDb,
  streamType: string,
  streamId: string,
): Promise<StoreEvent[]> {
  return await db
    .collection("events_store")
    .find({ streamId, streamType })
    .toArray() as unknown as StoreEvent[];
}
