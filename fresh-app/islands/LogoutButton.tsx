import { LogOut } from "../components/icons.tsx";

export default function LogoutButton() {
  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    document.cookie = "auth_token=; path=/; max-age=0";
    globalThis.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      class="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-blue-100 hover:text-white rounded transition-colors"
      style="background: none; border: none; cursor: pointer;"
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <LogOut size={20} class="shrink-0" />
      Sair
    </button>
  );
}
