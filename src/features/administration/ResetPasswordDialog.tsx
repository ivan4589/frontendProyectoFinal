import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import type { SystemUser } from '../../types/administration.types';

interface ResetPasswordDialogProps {
  open: boolean;
  user: SystemUser;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

interface PasswordValues {
  password: string;
  confirmation: string;
}

export function ResetPasswordDialog({
  open,
  user,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ResetPasswordDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PasswordValues>({
    defaultValues: {
      password: '',
      confirmation: '',
    },
  });

  const password = useWatch({ control, name: 'password' });

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Restablecer contraseña</DialogTitle>

      <Box
        component="form"
        onSubmit={handleSubmit((values) => onSubmit(values.password))}
      >
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Se cambiará la contraseña de <strong>{user.name}</strong>.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              autoFocus
              type="password"
              label="Nueva contraseña"
              error={Boolean(errors.password)}
              helperText={
                errors.password?.message ??
                'Debe tener entre 8 y 72 caracteres.'
              }
              {...register('password', {
                required: 'La nueva contraseña es obligatoria',
                minLength: {
                  value: 8,
                  message: 'Debe tener al menos 8 caracteres',
                },
                maxLength: {
                  value: 72,
                  message: 'No debe superar 72 caracteres',
                },
              })}
            />

            <TextField
              fullWidth
              type="password"
              label="Confirmar nueva contraseña"
              error={Boolean(errors.confirmation)}
              helperText={errors.confirmation?.message}
              {...register('confirmation', {
                required: 'Confirma la nueva contraseña',
                validate: (value) =>
                  value === password || 'Las contraseñas no coinciden',
              })}
            />

            <Alert severity="info">
              Por seguridad, la contraseña no se mostrará ni quedará guardada
              en el historial de administración.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Restableciendo...' : 'Restablecer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
