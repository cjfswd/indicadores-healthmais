import { define } from "@/utils.ts";
import { getDb } from "../../../core/db.ts";
import { appendEvent, StreamType } from "../../../core/events.ts";

type Action = "find" | "findOne" | "insert" | "update" | "delete";

interface DbMeta {
  action: Action;
  collection: string;
  query?: Record<string, unknown>;
  skip?: number;
  limit?: number;
  sort?: Record<string, unknown>;
  id?: string;
  data?: Record<string, unknown>;
}

async function makeObjectId(id: string) {
  if (Deno.env.get("DENO_ENV") !== "production") {
    const { DevObjectId } = await import("../../../core/db.dev.ts");
    return new DevObjectId(id);
  }
  const { ObjectId } = await import("npm:mongodb");
  return new ObjectId(id);
}

async function newObjectId(): Promise<string> {
  if (Deno.env.get("DENO_ENV") !== "production") {
    const { DevObjectId } = await import("../../../core/db.dev.ts");
    return new DevObjectId().toString();
  }
  const { ObjectId } = await import("npm:mongodb");
  return new ObjectId().toString();
}

function extractActorFromRequest(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  if (!token) return "";
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "";
    const payload = JSON.parse(atob(parts[1]));
    return payload.email ?? "";
  } catch {
    return "";
  }
}

export const handlers = define.handlers({
  async POST(ctx) {
    const metaHeader = ctx.req.headers.get("x-db-meta");
    if (!metaHeader) {
      return Response.json({ success: false, message: "x-db-meta header required" }, { status: 400 });
    }

    let meta: DbMeta;
    try {
      meta = JSON.parse(metaHeader);
    } catch {
      return Response.json({ success: false, message: "Invalid x-db-meta JSON" }, { status: 400 });
    }

    const actor = extractActorFromRequest(ctx.req);
    const db = await getDb();
    const col = db.collection(meta.collection);

    try {
      if (meta.action === "find") {
        const filter = { deletedAt: null, ...(meta.query ?? {}) };
        const skip = meta.skip ?? 0;
        const limit = meta.limit ?? 10;
        const sort = meta.sort ?? {};
        const [result, total] = await Promise.all([
          col.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
          col.countDocuments(filter),
        ]);
        return Response.json({ result, total, success: true });
      }

      if (meta.action === "findOne") {
        const filter = meta.id
          ? { _id: await makeObjectId(meta.id), deletedAt: null }
          : { deletedAt: null, ...(meta.query ?? {}) };
        const result = await col.findOne(filter);
        return Response.json({ result, success: true });
      }

      if (meta.action === "insert") {
        const id = await newObjectId();
        const result = await appendEvent(
          db,
          meta.collection as StreamType,
          id,
          "CREATE",
          meta.data ?? {},
          actor,
        );
        return Response.json({ result, success: true });
      }

      if (meta.action === "update") {
        if (!meta.id) {
          return Response.json({ success: false, message: "id required for update" }, { status: 400 });
        }
        const result = await appendEvent(
          db,
          meta.collection as StreamType,
          meta.id,
          "UPDATE",
          meta.data ?? {},
          actor,
        );
        return Response.json({ result, success: true });
      }

      if (meta.action === "delete") {
        if (!meta.id) {
          return Response.json({ success: false, message: "id required for delete" }, { status: 400 });
        }
        const result = await appendEvent(
          db,
          meta.collection as StreamType,
          meta.id,
          "SOFT_DELETE",
          {},
          actor,
        );
        return Response.json({ result, success: true });
      }

      return Response.json({ success: false, message: `Unknown action: ${meta.action}` }, { status: 400 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return Response.json({ success: false, message }, { status: 500 });
    }
  },
});
