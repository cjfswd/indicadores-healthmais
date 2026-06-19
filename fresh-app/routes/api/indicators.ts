import { define } from "@/utils.ts";
import { getDb } from "../../core/db.ts";

export const handlers = define.handlers({
  async GET(_ctx) {
    const db = await getDb();
    const result = await db
      .collection("indicators")
      .find({ deletedAt: null })
      .toArray();

    return Response.json(result);
  },
});
