export function formatCurrency(value: number | null | undefined): string {
  const amount = value || 0;

  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
  }).format(amount);
}