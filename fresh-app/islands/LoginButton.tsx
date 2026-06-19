import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

function setAuthCookie(token: string) {
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

interface LoginButtonProps {
  googleClientId: string;
  isDev?: boolean;
}

export default function LoginButton({ googleClientId, isDev }: LoginButtonProps) {
  const isLoading = useSignal(false);
  const error = useSignal("");

  useEffect(() => {
    // Verificar se voltou do Google com #access_token
    const hash = globalThis.location?.hash ?? "";
    if (!hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.slice(1)); // remove o #
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    // Limpar hash da URL
    globalThis.history?.replaceState(null, "", globalThis.location.pathname);

    // Autenticar
    isLoading.value = true;
    fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthCookie(data.token);
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
          globalThis.location.href = "/dashboard";
        } else {
          error.value = data.message ?? "Erro ao autenticar";
          isLoading.value = false;
        }
      })
      .catch(() => {
        error.value = "Erro de conexão";
        isLoading.value = false;
      });
  }, []);

  function handleLogin() {
    const origin = globalThis.location?.origin ?? "";
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: `${origin}/login`,
      response_type: "token",
      scope: "email profile",
      prompt: "select_account",
    });
    globalThis.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  if (isLoading.value) {
    return (
      <div class="flex items-center gap-3 text-slate-600">
        <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Autenticando...</span>
      </div>
    );
  }

  async function handleDevLogin() {
    isLoading.value = true;
    error.value = "";
    try {
      const res = await fetch("/api/auth/dev", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAuthCookie(data.token);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        globalThis.location.href = "/dashboard";
      } else {
        error.value = data.error ?? "Erro no login dev";
        isLoading.value = false;
      }
    } catch {
      error.value = "Erro de conexão";
      isLoading.value = false;
    }
  }

  return (
    <div class="flex flex-col gap-3 w-full">
      {error.value && (
        <p class="text-red-600 text-sm text-center">{error.value}</p>
      )}
      {isDev && (
        <button
          onClick={handleDevLogin}
          class="w-full flex items-center justify-center gap-2 font-medium"
          style="padding: 10px 24px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#d97706")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f59e0b")}
        >
          ⚡ Entrar como Dev (bypass)
        </button>
      )}
      <button
        onClick={handleLogin}
        class="w-full flex items-center justify-center gap-3 font-medium"
        style="padding: 10px 24px; background: white; color: #3c4043; border: 1px solid #dadce0; border-radius: 4px; cursor: pointer; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)")}
      >
        <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Entrar com Google
      </button>
    </div>
  );
}
