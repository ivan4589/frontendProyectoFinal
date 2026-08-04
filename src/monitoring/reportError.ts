import { environment } from '../config/environment';

export interface ErrorContext {
  source: string;
  requestId?: string;
  status?: number;
  method?: string;
  path?: string;
}

const reports: number[] = [];

function withinRateLimit() {
  const cutoff = Date.now() - 60_000;
  while (reports[0] && reports[0] < cutoff) reports.shift();
  if (reports.length >= 20) return false;
  reports.push(Date.now());
  return true;
}

export function reportClientError(error: unknown, context: ErrorContext) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const payload = {
    event: 'frontend_error',
    message: normalized.message.slice(0, 500),
    stack: normalized.stack?.slice(0, 4_000),
    context,
    release: environment.release,
    path: `${window.location.pathname}${window.location.search}`.slice(0, 1_000),
    userAgent: navigator.userAgent.slice(0, 500),
    timestamp: new Date().toISOString(),
  };

  if (!environment.monitoringUrl || !withinRateLimit()) return;
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      environment.monitoringUrl,
      new Blob([body], { type: 'application/json' }),
    );
    return;
  }
  void fetch(environment.monitoringUrl, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => undefined);
}

export function installGlobalErrorMonitoring() {
  window.addEventListener('error', (event) => {
    reportClientError(event.error || event.message, { source: 'window.error' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason, { source: 'unhandledrejection' });
  });
}
