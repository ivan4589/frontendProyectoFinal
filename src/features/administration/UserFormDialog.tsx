import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type {
  CreateSystemUserRequest,
  SystemUser,
  UpdateSystemUserRequest,
} from '../../types/administration.types';
import type { UserRole } from '../../types/auth.types';

type CreateUserDraft = Omit<CreateSystemUserRequest, 'confirmation'>;

interface UserFormDialogProps {
  open: boolean;
  user?: SystemUser | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateUserDraft | UpdateSystemUserRequest) => void;
}

interface UserFormValues {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: 'Acceso total, usuarios, costos, reportes y configuración.',
  VENDEDOR: 'Consulta todas las ventas y opera únicamente sus ventas propias.',
  COBRADOR: 'Acceso a cobranzas, ventas y pagos que tenga asignados.',
};

export function UserFormDialog({
  open,
  user,
  loading = false,
  error,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const isEditing = Boolean(user);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'VENDEDOR',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        role: user?.role ?? 'VENDEDOR',
      });
    }
  }, [open, reset, user]);

  const selectedRole = useWatch({ control, name: 'role' }) ?? 'VENDEDOR';

  const submitForm = (values: UserFormValues) => {
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      role: values.role,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEditing ? 'Editar usuario' : 'Dar de alta un usuario'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(submitForm)}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nombre completo"
              autoFocus
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 2,
                  message: 'Debe tener al menos 2 caracteres',
                },
              })}
            />
            <TextField
              fullWidth
              type="email"
              label="Correo electrónico"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: 'Ingresa un correo válido',
                },
              })}
            />
            <TextField
              fullWidth
              label="Teléfono"
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message ?? 'Opcional.'}
              {...register('phone', {
                maxLength: {
                  value: 30,
                  message: 'No debe superar 30 caracteres',
                },
              })}
            />
            <FormControl fullWidth error={Boolean(errors.role)}>
              <InputLabel id="user-role-label">Rol del sistema</InputLabel>
              <Select
                labelId="user-role-label"
                label="Rol del sistema"
                defaultValue={user?.role ?? 'VENDEDOR'}
                {...register('role', {
                  required: 'Selecciona un rol',
                })}
              >
                <MenuItem value="ADMIN">Administrador</MenuItem>
                <MenuItem value="VENDEDOR">Vendedor</MenuItem>
                <MenuItem value="COBRADOR">Cobrador</MenuItem>
              </Select>
              <FormHelperText>
                {errors.role?.message ?? roleDescriptions[selectedRole]}
              </FormHelperText>
            </FormControl>

            {!isEditing && (
              <Alert severity="info">
                El servidor generará una contraseña temporal segura. Solo se
                mostrará una vez y deberá cambiarse en el primer acceso.
              </Alert>
            )}

            {selectedRole === 'ADMIN' && (
              <Alert severity="warning">
                Este rol permite administrar usuarios, costos, reportes y
                operaciones críticas. La creación o asignación se confirmará
                con tu contraseña y segundo factor.
              </Alert>
            )}

            {isEditing && (
              <Typography variant="body2" color="text.secondary">
                Cambiar el correo o el rol cerrará todas las sesiones del
                usuario y requerirá confirmación reforzada.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading
              ? 'Guardando...'
              : isEditing
                ? 'Continuar'
                : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
