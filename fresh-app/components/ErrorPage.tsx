import { LayoutDashboard } from "./icons.tsx";
import BackButton from "../islands/BackButton.tsx";

interface ErrorPageProps {
  status: number;
  title: string;
  description: string;
  showHome?: boolean;
  showBack?: boolean;
}

const STATUS_COLOR: Record<number, string> = {
  400: "#f59e0b",
  401: "#f59e0b",
  403: "#f59e0b",
  404: "#1565C0",
  422: "#f59e0b",
  429: "#7c3aed",
  500: "#d32f2f",
  503: "#7c3aed",
};

export default function ErrorPage({ status, title, description, showHome = true, showBack = false }: ErrorPageProps) {
  const color = STATUS_COLOR[status] ?? "#6b7280";

  return (
    <div
      class="min-h-screen flex flex-col items-center justify-center px-4"
      style="background: var(--bg-main, #f8fafc);"
    >
      {/* Large watermark number */}
      <p
        class="font-black leading-none select-none"
        style={`font-size: clamp(80px, 18vw, 160px); color: ${color}18; letter-spacing: -4px;`}
      >
        {status}
      </p>

      {/* Message */}
      <div class="text-center -mt-6 mb-8">
        <h1 class="text-2xl font-bold mb-2" style="color: var(--text-primary, #111827);">
          {title}
        </h1>
        <p class="text-base max-w-sm" style="color: var(--text-secondary, #6b7280);">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div class="flex items-center gap-3">
        {showBack && <BackButton color={color} />}
        {showHome && (
          <a
            href="/dashboard"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition"
            style={`background: ${color}; text-decoration: none;`}
          >
            <LayoutDashboard size={16} />
            Ir ao Painel
          </a>
        )}
      </div>

      <p class="mt-12 text-xs" style="color: var(--text-secondary, #9ca3af);">
        Healthmais Dashboard — código {status}
      </p>
    </div>
  );
}
