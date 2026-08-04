function normalizeUrl(
  value: string | undefined,
  name: string,
  requiredInProduction: boolean,
): string | undefined {
  const candidate = value?.trim();
  if (!candidate) {
    if (import.meta.env.PROD && requiredInProduction) {
      throw new Error(`${name} es obligatorio en producción`);
    }
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${name} debe ser una URL absoluta válida`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} solo admite HTTP o HTTPS`);
  }
  if (import.meta.env.PROD && url.protocol !== 'https:') {
    throw new Error(`${name} debe usar HTTPS en producción`);
  }
  return url.toString().replace(/\/$/, '');
}

const apiOrigin = normalizeUrl(
  import.meta.env.VITE_API_URL,
  'VITE_API_URL',
  true,
) || 'http://localhost:3000';

export const environment = Object.freeze({
  apiUrl: apiOrigin.endsWith('/api') ? apiOrigin : `${apiOrigin}/api`,
  monitoringUrl: normalizeUrl(
    import.meta.env.VITE_MONITORING_URL,
    'VITE_MONITORING_URL',
    false,
  ),
  release: import.meta.env.VITE_RELEASE?.trim() || 'development',
  production: import.meta.env.PROD,
});
