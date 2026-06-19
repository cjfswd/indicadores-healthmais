import { ArrowLeft } from "../components/icons.tsx";

interface BackButtonProps {
  color?: string;
}

export default function BackButton({ color = "#1565C0" }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={() => globalThis.history?.back()}
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition"
      style={`border: 1px solid ${color}40; color: ${color}; background: none; cursor: pointer;`}
    >
      <ArrowLeft size={16} />
      Voltar
    </button>
  );
}
