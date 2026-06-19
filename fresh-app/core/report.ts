export interface ReportPayload {
  format: "pdf" | "pptx";
  title: string;
  subtitle: string;
  headers: Record<string, string>;
  data: Record<string, unknown>[];
  charts: Array<{ title: string; image: string }>;
}

async function callPython(payload: ReportPayload): Promise<Uint8Array> {
  const scriptPath = new URL("../report_generator.py", import.meta.url).pathname
    .replace(/^\/([A-Za-z]:)/, "$1");

  const cmd = new Deno.Command("python", {
    args: [scriptPath],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const proc = cmd.spawn();
  const writer = proc.stdin.getWriter();
  await writer.write(new TextEncoder().encode(JSON.stringify(payload)));
  await writer.close();

  const { code, stdout, stderr } = await proc.output();
  if (code !== 0) {
    throw new Error(`Python report failed: ${new TextDecoder().decode(stderr)}`);
  }
  return stdout;
}

export async function generatePdf(payload: ReportPayload): Promise<Uint8Array> {
  return callPython({ ...payload, format: "pdf" });
}

export async function generatePptx(payload: ReportPayload): Promise<Uint8Array> {
  return callPython({ ...payload, format: "pptx" });
}
