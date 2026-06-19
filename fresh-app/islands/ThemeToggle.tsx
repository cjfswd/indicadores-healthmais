import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Moon, Sun } from "../components/icons.tsx";

export default function ThemeToggle() {
  const isDark = useSignal(false);

  useEffect(() => {
    const saved = localStorage.getItem("app_theme") ?? "light";
    isDark.value = saved === "dark";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function toggle() {
    const next = isDark.value ? "light" : "dark";
    isDark.value = !isDark.value;
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("app_theme", next);
  }

  return (
    <button
      onClick={toggle}
      class="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-blue-100 hover:text-white rounded transition-colors"
      style="background: none; border: none; cursor: pointer;"
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
      title={isDark.value ? "Modo Claro" : "Modo Escuro"}
    >
      {isDark.value ? <Sun size={20} class="shrink-0" /> : <Moon size={20} class="shrink-0" />}
      {isDark.value ? "Modo Claro" : "Modo Escuro"}
    </button>
  );
}
