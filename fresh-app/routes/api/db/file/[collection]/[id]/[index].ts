import { define } from "@/utils.ts";
import { getDb, createObjectId } from "../../../../../../core/db.ts";
import type { IObjectId } from "../../../../../../core/db.interface.ts";

export const handlers = define.handlers({
  async GET(ctx) {
    const { collection, id, index: _index } = ctx.params;

    let docId: IObjectId;
    try {
      docId = await createObjectId(id);
    } catch {
      return new Response("Invalid document ID", { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection(collection).findOne({ _id: docId });

    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }

    const file = doc.file as { name: string; type: string; data: string } | null;

    if (!file?.data) {
      return new Response("File not found in document", { status: 404 });
    }

    // Decodificar base64
    let bytes: Uint8Array;
    try {
      const binary = atob(file.data);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    } catch {
      return new Response("Failed to decode file", { status: 500 });
    }

    return new Response(bytes, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Length": bytes.length.toString(),
      },
    });
  },
});