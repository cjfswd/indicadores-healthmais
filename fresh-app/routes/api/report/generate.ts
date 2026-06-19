import { define } from "@/utils.ts";
import { generatePdf, generatePptx, ReportPayload } from "../../../core/report.ts";

export const handlers = define.handlers({
  async POST(ctx) {
    let payload: ReportPayload;
    try {
      payload = await ctx.req.json();
    } catch {
      return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
    }

    if (!payload.format || !["pdf", "pptx"].includes(payload.format)) {
      return Response.json({ success: false, message: "format must be pdf or pptx" }, { status: 400 });
    }

    try {
      let bytes: Uint8Array;
      let contentType: string;
      let extension: string;

      if (payload.format === "pdf") {
        bytes = await generatePdf(payload);
        contentType = "application/pdf";
        extension = "pdf";
      } else {
        bytes = await generatePptx(payload);
        contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        extension = "pptx";
      }

      const date = new Date().toISOString().slice(0, 10);
      return new Response(bytes, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="relatorio_${date}.${extension}"`,
          "Content-Length": bytes.length.toString(),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report";
      return Response.json({ success: false, message }, { status: 500 });
    }
  },
});