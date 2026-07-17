export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';

  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}