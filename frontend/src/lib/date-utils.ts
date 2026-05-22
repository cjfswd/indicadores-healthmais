export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  // Garante que a data YYYY-MM-DD não sofra shift de timezone no navegador
  // definindo o horário para o meio-dia UTC/Local.
  const safeDateStr = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
  return new Date(safeDateStr).toLocaleDateString('pt-BR');
}
