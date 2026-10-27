import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createClientContact, getClientContacts, updateClientContact } from '../../api/clients.api';
import type { Client, ClientContact, ClientContactInput } from '../../types/client.types';

const empty: ClientContactInput = { name: '', relationship: '', phone: '', whatsappConsent: false, isDefault: false };
function errorText(error: unknown): string {
  const e = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = e?.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || e?.message || 'No se pudo completar la operación';
}
export function ClientContactsDialog({ client, onClose }: { client: Client | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ClientContact | null>(null);
  const [form, setForm] = useState<ClientContactInput>(empty);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['client-contacts', client?.id], queryFn: () => getClientContacts(client!.id), enabled: !!client });
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ClientContactInput | Partial<ClientContactInput> }) => id ? updateClientContact(client!.id, id, data) : createClientContact(client!.id, data as ClientContactInput),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['client-contacts', client?.id] }); setEditing(null); setForm(empty); setFormOpen(false); setError(''); },
    onError: e => setError(errorText(e)),
  });
  const edit = (contact: ClientContact) => { setEditing(contact); setForm({ name: contact.name, relationship: contact.relationship || '', phone: contact.phone, whatsappConsent: contact.whatsappConsent, isDefault: contact.isDefault }); setFormOpen(true); setError(''); };
  return <Dialog open={!!client} onClose={mutation.isPending ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Contactos de {client?.fullName}</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" sx={{ mb: 2 }}>El teléfono principal se edita en la ficha del cliente. Registra la autorización de cada persona para recibir notas.</Typography>
      {query.isLoading && <Typography>Cargando contactos...</Typography>}
      {query.isError && <Alert severity="error">No se pudieron cargar los contactos. {errorText(query.error)}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {query.data?.length === 0 && <Typography>No hay contactos adicionales.</Typography>}
      {query.data?.map(contact => <Box key={contact.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1 }}>
        <Typography fontWeight={700}>{contact.name} {contact.relationship ? `— ${contact.relationship}` : ''}</Typography>
        <Typography variant="body2">{contact.phone} · {contact.isActive ? 'Activo' : 'Inactivo'} · {contact.whatsappConsent ? 'Autorizado' : 'Sin autorización'}{contact.isDefault ? ' · Habitual' : ''}</Typography>
        <Button size="small" disabled={mutation.isPending} onClick={() => edit(contact)}>Editar</Button>
        <Button size="small" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: contact.id, data: { isActive: !contact.isActive } })}>{contact.isActive ? 'Desactivar' : 'Activar'}</Button>
      </Box>)}
      {!formOpen && <Button onClick={() => { setEditing(null); setForm(empty); setError(''); setFormOpen(true); }}>Agregar contacto</Button>}
      {formOpen && <Box component="form" onSubmit={e => { e.preventDefault(); if (!form.name.trim() || !/^(?:\+?591)?[ -]?(?:\d[ -]?){8}$/.test(form.phone)) { setError('Indica un nombre y un teléfono boliviano válido de 8 dígitos.'); return; } mutation.mutate({ id: editing?.id, data: { ...form, name: form.name.trim(), phone: form.phone.trim() } }); }}>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>{editing ? 'Editar contacto' : 'Nuevo contacto'}</Typography>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField label="Nombre" required value={form.name} inputProps={{ maxLength: 160 }} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField label="Relación (encargado, familiar...)" value={form.relationship} inputProps={{ maxLength: 100 }} onChange={e => setForm({ ...form, relationship: e.target.value })} />
          <TextField label="WhatsApp" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value, whatsappConsent: editing && e.target.value !== editing.phone ? false : form.whatsappConsent })} />
          <FormControlLabel control={<Checkbox checked={form.whatsappConsent} onChange={e => setForm({ ...form, whatsappConsent: e.target.checked })} />} label="Autorizó recibir documentos por WhatsApp" />
          <FormControlLabel control={<Checkbox checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />} label="Seleccionar habitualmente para notas" />
          <Stack direction="row" spacing={1}><Button type="submit" variant="contained" disabled={mutation.isPending}>Guardar contacto</Button><Button disabled={mutation.isPending} onClick={() => { setFormOpen(false); setError(''); }}>Cancelar</Button></Stack>
        </Stack>
      </Box>}
    </DialogContent>
    <DialogActions><Button onClick={onClose} disabled={mutation.isPending}>Cerrar</Button></DialogActions>
  </Dialog>;
}
