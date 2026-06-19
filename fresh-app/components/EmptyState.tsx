interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({ message = "Nenhum dado encontrado", icon = "📭" }: EmptyStateProps) {
  return (
    <div class="flex flex-col items-center justify-center py-16 text-slate-400">
      <span class="text-5xl mb-4">{icon}</span>
      <p class="text-base">{message}</p>
    </div>
  );
}
