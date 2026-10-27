import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getClientContacts } from '../../api/clients.api';
import { getSaleWhatsAppLogs, sendSaleWhatsAppRecipient } from '../../api/sales.api';
import type { Sale } from '../../types/sale.types';
import { formatCurrency } from '../../utils/formatCurrency';
import { normalizeWhatsAppPhone, wasSuccessfullySent } from './whatsappRecipients';

const statusLabels = { SENT: 'Aceptado por Meta', DELIVERED: 'Entregado', READ: 'Leído', FAILED: 'Fallido' };
export function WhatsAppRecipientsDialog({ sale, onClose, onUpdated }: { sale: Sale | null; onClose: () => void; onUpdated: () => void }) {
  const queryClient = useQueryClient();
  const [selection, setSelected] = useState<string[] | null>(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const contacts = useQuery({ queryKey: ['client-contacts', sale?.clientId], queryFn: () => getClientContacts(sale!.clientId), enabled: !!sale, staleTime: 0 });
  const logs = useQuery({ queryKey: ['sale-whatsapp-logs', sale?.id], queryFn: () => getSaleWhatsAppLogs(sale!.id), enabled: !!sale, staleTime: 0 });
  const recipients = useMemo(() => [
    ...(sale?.clientPhone ? [{ id: 'principal', name: `${sale.clientName} (principal)`, phone: sale.clientPhone, authorized: sale.clientWhatsAppConsent, preferred: true }] : []),
    ...(contacts.data || []).filter(c => c.isActive).map(c => ({ id: c.id, name: `${c.name}${c.relationship ? ` (${c.relationship})` : ''}`, phone: c.phone, authorized: c.whatsappConsent, preferred: c.isDefault })),
  ], [sale, contacts.data]);
  const selected = selection ?? (contacts.isSuccess && logs.isSuccess && !contacts.isFetching && !logs.isFetching
    ? recipients.filter(r => r.authorized && r.preferred && !wasSuccessfullySent(logs.data, r.phone)).map(r => r.id)
    : []);
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const send = async () => {
    if (!sale || !logs.data || !selected.length) return;
    const chosen = recipients.filter(r => selected.includes(r.id));
    const already = chosen.filter(r => wasSuccessfullySent(logs.data, r.phone));
    if (already.length && !window.confirm(`Se volverá a enviar la nota a: ${already.map(r => r.name).join(', ')}. ¿Confirmas el reenvío?`)) return;
    setSending(true);
    setResults({});
    try {
      for (const recipient of chosen) {
        const resend = already.some(r => r.id === recipient.id);
        try {
          const result = await sendSaleWhatsAppRecipient(sale.id, recipient.id, resend);
          setResults(previous => ({ ...previous, [recipient.id]: result.status === 'SENT' ? 'Aceptado por Meta; pendiente de entrega.' : `No se pudo enviar: ${result.error || 'error desconocido'}` }));
        } catch {
          setResults(previous => ({ ...previous, [recipient.id]: 'Resultado desconocido. Verifica el historial antes de reintentar.' }));
        }
      }
      setSelected([]);
      await queryClient.invalidateQueries({ queryKey: ['sale-whatsapp-logs', sale.id] });
      onUpdated();
    } finally { setSending(false); }
  };
  return <Dialog open={!!sale} onClose={sending ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Enviar nota {sale?.saleNumber}</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2">Cliente: {sale?.clientName}</Typography>
      <Typography variant="body2">Total: {formatCurrency(sale?.total)} · Pagado: {formatCurrency(sale?.paidAmount)} · Saldo: {formatCurrency(sale?.balance)}</Typography>
      <Alert severity="info" sx={{ my: 2 }}>La plantilla envía el total de la venta. Verifica el saldo actual antes de cobrar; el PDF puede no reflejar pagos posteriores.</Alert>
      {(contacts.isLoading || logs.isLoading) && <Typography>Cargando destinatarios e historial...</Typography>}
      {(contacts.isError || logs.isError) && <Alert severity="error">No se pudieron cargar los contactos o el historial. Comprueba que el backend actualizado esté disponible y vuelve a intentarlo.</Alert>}
      {contacts.isSuccess && logs.isSuccess && recipients.length === 0 && <Alert severity="warning">Este cliente no tiene teléfonos registrados.</Alert>}
      {contacts.isSuccess && logs.isSuccess && recipients.map(recipient => {
        const last = logs.data.find(log => log.phoneNumber === normalizeWhatsAppPhone(recipient.phone));
        return <Box key={recipient.id} sx={{ borderBottom: 1, borderColor: 'divider', py: 1 }}>
          <FormControlLabel control={<Checkbox disabled={!recipient.authorized || sending} checked={selected.includes(recipient.id)} onChange={() => toggle(recipient.id)} />} label={`${recipient.name} · ${recipient.phone}`} />
          <Typography variant="body2" color="text.secondary">{!recipient.authorized ? 'Sin autorización para recibir documentos' : last ? `Último estado: ${statusLabels[last.status]}` : 'Sin envíos registrados'}</Typography>
          {last?.status === 'FAILED' && last.errorMessage && <Typography variant="body2" color="error">{last.errorMessage}</Typography>}
          {results[recipient.id] && <Typography variant="body2">{results[recipient.id]}</Typography>}
        </Box>;
      })}
      {Object.keys(results).length > 0 && <Alert severity="info" sx={{ mt: 2 }}>El estado puede actualizarse después mediante WhatsApp. Revisa el historial antes de repetir un envío.</Alert>}
    </DialogContent>
    <DialogActions><Stack direction="row" spacing={1}><Button onClick={onClose} disabled={sending}>Cerrar</Button><Button variant="contained" onClick={send} disabled={sending || !selected.length || !contacts.isSuccess || !logs.isSuccess || contacts.isFetching || logs.isFetching}>{sending ? 'Enviando...' : `Enviar a ${selected.length}`}</Button></Stack></DialogActions>
  </Dialog>;
}
