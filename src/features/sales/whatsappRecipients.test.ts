import { describe, expect, it } from 'vitest';
import { normalizeWhatsAppPhone, wasSuccessfullySent } from './whatsappRecipients';
import type { WhatsAppLog } from '../../api/sales.api';

const log = (phoneNumber: string, status: WhatsAppLog['status']): WhatsAppLog => ({ id: '1', phoneNumber, status, createdAt: '2026-01-01' });
describe('destinatarios de WhatsApp', () => {
  it('reconoce el teléfono local y con código de Bolivia', () => {
    expect(normalizeWhatsAppPhone('7123-4567')).toBe('59171234567');
    expect(normalizeWhatsAppPhone('+591 71234567')).toBe('59171234567');
  });
  it('evalúa envíos por destinatario y no considera exitoso un fallo', () => {
    const logs = [log('59171234567', 'DELIVERED'), log('59161234567', 'FAILED')];
    expect(wasSuccessfullySent(logs, '71234567')).toBe(true);
    expect(wasSuccessfullySent(logs, '61234567')).toBe(false);
    expect(wasSuccessfullySent(logs, '72222222')).toBe(false);
  });
  it('requiere confirmar reenvío aunque un intento posterior haya fallado', () => {
    expect(wasSuccessfullySent([log('59171234567', 'FAILED'), log('59171234567', 'SENT')], '71234567')).toBe(true);
  });
});
