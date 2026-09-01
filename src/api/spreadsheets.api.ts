import { api } from './axios';
import type {
  SpreadsheetImportPreview,
  SpreadsheetImportResult,
} from '../types/spreadsheet.types';

function responseFilename(disposition: string | undefined, fallback: string) {
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

export async function downloadSpreadsheet(url: string, fallback: string) {
  const response = await api.get<Blob>(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = responseFilename(
    response.headers['content-disposition'],
    fallback,
  );
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function formData(file: File) {
  const data = new FormData();
  data.append('file', file);
  return data;
}

export async function previewSpreadsheet(url: string, file: File) {
  const response = await api.post<SpreadsheetImportPreview>(url, formData(file));
  return response.data;
}

export async function importSpreadsheet(url: string, file: File) {
  const response = await api.post<SpreadsheetImportResult>(url, formData(file));
  return response.data;
}
