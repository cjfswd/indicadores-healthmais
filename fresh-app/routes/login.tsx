import { page } from "fresh";
import { define } from "@/utils.ts";
import LoginButton from "../islands/LoginButton.tsx";

interface LoginData {
  googleClientId: string;
  isDev: boolean;
}

export const handler = define.handlers({
  GET(_ctx) {
    return page<LoginData>({
      googleClientId: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
      isDev: Deno.env.get("DENO_ENV") !== "production",
    });
  },
});

export default define.page<typeof handler>(({ data }) => {
  return (
    <div
      class="min-h-screen w-full flex items-center justify-center"
      style="background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%); font-size: 14px;"
    >
      <div
        class="bg-white rounded-lg text-center w-full"
        style="max-width: 400px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);"
      >
        {/* Logo placeholder matching Vue's Google logo placement */}
        <div class="flex justify-center mb-6">
          <div
            class="flex items-center justify-center rounded-full"
            style="width: 64px; height: 64px; background: #1565C0;"
          >
            <svg viewBox="0 0 24 24" fill="white" style="width: 36px; height: 36px;">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
          </div>
        </div>

        <h1 class="font-bold text-gray-900 mb-2" style="font-size: 20px;">
          Bem-vindo ao Healthmais
        </h1>
        <p class="text-gray-500 mb-8" style="font-size: 13px;">
          Entre com sua conta Google para acessar o painel administrativo.
        </p>

        <LoginButton googleClientId={data.googleClientId} isDev={data.isDev} />

        <div class="mt-6 pt-4 border-t border-gray-100">
          <p class="text-gray-400" style="font-size: 11px;">
            © {new Date().getFullYear()} Healthmais. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
});
