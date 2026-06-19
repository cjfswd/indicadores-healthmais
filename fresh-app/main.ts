import { App, staticFiles, HttpError } from "fresh";
import { router } from "./utils.ts";

function isApiRequest(req: Request): boolean {
  return new URL(req.url).pathname.startsWith("/api/");
}

function errorToStatus(err: unknown): number {
  if (err instanceof HttpError) return err.status;
  return 500;
}

async function errorMiddleware(ctx: { req: Request; next: () => Promise<Response> }): Promise<Response> {
  try {
    return await ctx.next();
  } catch (err: unknown) {
    const status = errorToStatus(err);

    if (status >= 500) {
      console.error(`[${status}] ${ctx.req.url}`, err);
    } else {
      console.warn(`[${status}] ${ctx.req.url}`);
    }

    if (isApiRequest(ctx.req)) {
      const message = err instanceof Error ? err.message : "Erro interno";
      return Response.json({ success: false, message, status }, { status });
    }

    const meta = ERROR_META[status] ?? ERROR_META[500];
    const html = renderErrorHtml(status, meta.title, meta.description);
    return new Response(html, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

const ERROR_META: Record<number, { title: string; description: string }> = {
  400: { title: "Requisição inválida",    description: "Os dados enviados são inválidos ou estão incompletos." },
  401: { title: "Não autenticado",        description: "Faça login para acessar esta página." },
  403: { title: "Acesso negado",          description: "Você não tem permissão para acessar este recurso." },
  404: { title: "Página não encontrada",  description: "O endereço que você acessou não existe ou foi movido." },
  422: { title: "Dados não processáveis", description: "O servidor não conseguiu processar os dados enviados." },
  429: { title: "Muitas requisições",     description: "Você fez muitas requisições. Tente novamente em breve." },
  500: { title: "Erro interno",           description: "Algo inesperado aconteceu no servidor. Tente novamente." },
  503: { title: "Serviço indisponível",   description: "O serviço está temporariamente fora do ar. Tente em breve." },
};

const STATUS_COLOR: Record<number, string> = {
  400: "#f59e0b", 401: "#f59e0b", 403: "#f59e0b", 404: "#1565C0",
  422: "#f59e0b", 429: "#7c3aed", 500: "#d32f2f", 503: "#7c3aed",
};

function renderErrorHtml(status: number, title: string, description: string): string {
  const color = STATUS_COLOR[status] ?? "#6b7280";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${status} — Healthmais</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Roboto',sans-serif;background:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:1rem}
    h1{font-size:1.5rem;font-weight:700;color:#111827;margin-bottom:.5rem}
    p.desc{color:#6b7280;max-width:360px;text-align:center;line-height:1.5}
    .watermark{font-size:clamp(80px,18vw,160px);font-weight:900;line-height:1;letter-spacing:-4px;color:${color}18;user-select:none}
    .actions{display:flex;gap:.75rem;margin-top:2rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;font-size:.875rem;font-weight:500;border-radius:.5rem;cursor:pointer;text-decoration:none;transition:opacity .15s}
    .btn:hover{opacity:.85}
    .btn-outline{border:1px solid ${color}40;color:${color};background:none}
    .btn-solid{background:${color};color:#fff;border:none}
    footer{margin-top:3rem;font-size:.75rem;color:#9ca3af}
  </style>
</head>
<body>
  <p class="watermark">${status}</p>
  <div style="text-align:center;margin-top:-1.5rem">
    <h1>${title}</h1>
    <p class="desc">${description}</p>
  </div>
  <div class="actions">
    <button class="btn btn-outline" onclick="history.back()">← Voltar</button>
    <a class="btn btn-solid" href="/dashboard">Ir ao Painel</a>
  </div>
  <footer>Healthmais Dashboard — código ${status}</footer>
</body>
</html>`;
}

export const app = new App()
  .use(staticFiles())
  // deno-lint-ignore no-explicit-any
  .use(errorMiddleware as any)
  .use(router)
  .fsRoutes();

if (import.meta.main) {
  await app.listen({ port: 8000 });
}
