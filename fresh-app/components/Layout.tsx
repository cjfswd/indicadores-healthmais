import { ComponentChildren } from "preact";
import { LayoutDashboard, Users, CalendarDays } from "./icons.tsx";
import LogoutButton from "../islands/LogoutButton.tsx";
import ThemeToggle from "../islands/ThemeToggle.tsx";

interface LayoutProps {
  children: ComponentChildren;
  title: string;
  currentPath: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel",    icon: <LayoutDashboard size={20} class="shrink-0" /> },
  { href: "/pacientes", label: "Pacientes", icon: <Users size={20} class="shrink-0" /> },
  { href: "/eventos",   label: "Eventos",   icon: <CalendarDays size={20} class="shrink-0" /> },
];

export default function Layout({ children, title, currentPath }: LayoutProps) {
  return (
    <div class="flex min-h-screen" style="background: var(--bg-main);">
      <aside class="w-52 flex flex-col fixed h-full text-white" style="background: #1565C0;">
        <div class="px-4 py-3 border-b" style="border-color: rgba(255,255,255,0.15);">
          <h1 class="font-bold text-white leading-tight" style="font-size: 15px;">Healthmais Dashboard</h1>
        </div>
        <nav class="flex-1 py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                class={`flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-blue-100 hover:text-white"
                }`}
                style={isActive ? "background: rgba(255,255,255,0.18);" : ""}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>
        <div class="py-2 px-2 border-t" style="border-color: rgba(255,255,255,0.15);">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      <main class="flex-1 ml-52">
        <header class="px-6 py-3" style="background: var(--bg-surface); border-bottom: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
          <h2 class="font-semibold" style="font-size: 16px; color: var(--text-primary);">{title}</h2>
        </header>
        <div class="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
