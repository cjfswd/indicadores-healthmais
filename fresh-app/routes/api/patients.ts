import { define } from "@/utils.ts";
import { getDb } from "../../core/db.ts";

export const handlers = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
    const skip = parseInt(url.searchParams.get("skip") ?? "0", 10);

    const db = await getDb();
    const result = await db
      .collection("patients")
      .find({ deletedAt: null })
      .skip(skip)
      .limit(limit)
      .toArray();

    return Response.json(result);
  },
});
