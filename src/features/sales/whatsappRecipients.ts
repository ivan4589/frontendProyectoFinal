import type { WhatsAppLog } from '../../api/sales.api';

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 8 ? `591${digits}` : digits;
}

export function wasSuccessfullySent(logs: WhatsAppLog[], phone: string): boolean {
  return logs.some(log => log.phoneNumber === normalizeWhatsAppPhone(phone) && log.status !== 'FAILED');
}
