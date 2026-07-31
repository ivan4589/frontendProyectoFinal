import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { AdminConfirmation } from '../../types/administration.types';

interface AdminConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  severity?: 'info' | 'warning' | 'error';
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (confirmation: AdminConfirmation) => void;
}

export function AdminConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  severity = 'warning',
  loading = false,
  error,
  onClose,
  onConfirm,
}: AdminConfirmationDialogProps) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setCode('');
      setReason('');
    }
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm({
      password,
      code,
      reason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <Stack component="form" onSubmit={submit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity={severity}>{description}</Alert>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Confirma tu identidad de administrador. Estos datos se verifican
              en el servidor y no se almacenan en el navegador.
            </Typography>
            <TextField
              label="Tu contraseña de administrador"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="Código del autenticador"
              required
              value={code}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              helperText="Código TOTP de 6 dígitos."
            />
            <TextField
              label="Motivo"
              required
              multiline
              minRows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              helperText="Mínimo 5 caracteres. Quedará registrado en auditoría."
              slotProps={{ htmlInput: { minLength: 5, maxLength: 300 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={severity === 'error' ? 'error' : 'primary'}
            disabled={
              loading ||
              password.length === 0 ||
              code.length !== 6 ||
              reason.trim().length < 5
            }
          >
            {loading ? 'Confirmando...' : confirmLabel}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
