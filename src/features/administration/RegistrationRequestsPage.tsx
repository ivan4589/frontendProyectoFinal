import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  approveRegistration,
  getRegistrationRequests,
  rejectRegistration,
} from '../../api/auth.api';
import type { RegistrationRequest, UserRole } from '../../types/auth.types';

function message(error: unknown) {
  const value = error as any;
  const response = value?.response?.data?.message;
  return Array.isArray(response) ? response.join(', ') : response || value?.message || 'No se pudo completar la acción.';
}

export function RegistrationRequestsPage() {
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<Record<number, UserRole>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requests = useQuery({ queryKey: ['registration-requests'], queryFn: getRegistrationRequests });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['registration-requests'] });

  const approve = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) => approveRegistration(id, role),
    onSuccess: () => { setNotice('Solicitud aprobada.'); setError(null); refresh(); },
    onError: (value) => setError(message(value)),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectRegistration(id, reason),
    onSuccess: () => { setNotice('Solicitud rechazada.'); setError(null); refresh(); },
    onError: (value) => setError(message(value)),
  });

  const handleReject = (request: RegistrationRequest) => {
    const reason = window.prompt(`Motivo para rechazar la solicitud de ${request.name}:`);
    if (reason?.trim()) reject.mutate({ id: request.id, reason: reason.trim() });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={800}>Solicitudes de acceso</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Verifica el correo y asigna el rol definitivo. Los vendedores tendrán acceso a todas las localidades.</Typography>
      {notice && <Alert severity="success" onClose={() => setNotice(null)} sx={{ mb: 2 }}>{notice}</Alert>}
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {requests.isLoading && <Typography>Cargando solicitudes...</Typography>}
      {requests.isError && <Alert severity="error">{message(requests.error)}</Alert>}
      <Stack spacing={2}>
        {(requests.data ?? []).map((request) => {
          const selectedRole = roles[request.id] || request.requestedRole;
          const ready = request.status === 'PENDING_ADMIN_APPROVAL';
          return (
            <Paper key={request.id} sx={{ p: 2.5 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800}>{request.name}</Typography>
                  <Typography variant="body2">{request.email}{request.phone ? ` · ${request.phone}` : ''}</Typography>
                  <Chip size="small" sx={{ mt: 1 }} color={ready ? 'warning' : 'default'} label={ready ? 'Pendiente de aprobación' : 'Correo sin verificar'} />
                </Box>
                <TextField select size="small" label="Rol asignado" value={selectedRole} onChange={(event) => setRoles({ ...roles, [request.id]: event.target.value as UserRole })} sx={{ minWidth: 190 }}>
                  <MenuItem value="VENDEDOR">Vendedor</MenuItem>
                  <MenuItem value="COBRADOR">Cobrador</MenuItem>
                </TextField>
                <Button variant="contained" disabled={!ready || approve.isPending} onClick={() => approve.mutate({ id: request.id, role: selectedRole })}>Aprobar</Button>
                <Button color="error" disabled={reject.isPending} onClick={() => handleReject(request)}>Rechazar</Button>
              </Stack>
            </Paper>
          );
        })}
        {!requests.isLoading && (requests.data ?? []).length === 0 && <Alert severity="info">No hay solicitudes pendientes.</Alert>}
      </Stack>
    </Box>
  );
}
