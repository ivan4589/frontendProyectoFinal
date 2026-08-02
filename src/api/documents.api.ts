import { api } from './axios';

function normalizeProtectedPath(value: string): string {
  const raw = value.startsWith('http://') || value.startsWith('https://')
    ? `${new URL(value).pathname}${new URL(value).search}`
    : value;

  if (raw.startsWith('/api/')) return raw.slice(4);
  if (raw === '/api') return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function filenameFromDisposition(
  disposition: string | undefined,
  fallback: string,
): string {
  if (!disposition) return fallback;

  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8.replace(/["']/g, ''));

  const regular = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return regular?.trim() || fallback;
}

export async function downloadProtectedDocument(
  documentUrl: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await api.get<Blob>(normalizeProtectedPath(documentUrl), {
    responseType: 'blob',
    headers: { Accept: 'application/pdf,application/octet-stream' },
  });

  const blobUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filenameFromDisposition(
    response.headers['content-disposition'],
    fallbackFilename,
  );
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000);
}
