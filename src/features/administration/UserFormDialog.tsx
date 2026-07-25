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
import { useForm, useWatch } from 'react-hook-form';
import type {
  CreateSystemUserRequest,
  SystemUser,
  UpdateSystemUserRequest,
} from '../../types/administration.types';
import type { UserRole } from '../../types/auth.types';

interface UserFormDialogProps {
  open: boolean;
  user?: SystemUser | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (
    data: CreateSystemUserRequest | UpdateSystemUserRequest,
  ) => void;
}

interface UserFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: 'Acceso total, usuarios, costos, reportes y configuración.',
  VENDEDOR: 'Ventas, clientes, inventario y consultas operativas.',
  COBRADOR: 'Cobranzas, pagos, deudas y consultas permitidas.',
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
    formState: { errors },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      confirmPassword: '',
      role: user?.role ?? 'VENDEDOR',
    },
  });

  const selectedRole =
    useWatch({ control, name: 'role' }) ?? 'VENDEDOR';
  const password = useWatch({ control, name: 'password' });

  const submitForm = (values: UserFormValues) => {
    const commonData = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
    };

    if (isEditing) {
      onSubmit(commonData);
      return;
    }

    onSubmit({
      ...commonData,
      password: values.password,
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

            {!isEditing && (
              <>
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña temporal"
                  error={Boolean(errors.password)}
                  helperText={
                    errors.password?.message ??
                    'Debe tener entre 8 y 72 caracteres.'
                  }
                  {...register('password', {
                    required: 'La contraseña es obligatoria',
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
                  label="Confirmar contraseña"
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Confirma la contraseña',
                    validate: (value) =>
                      value === password || 'Las contraseñas no coinciden',
                  })}
                />
              </>
            )}

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

            {selectedRole === 'ADMIN' && (
              <Alert severity="warning">
                Este rol podrá administrar usuarios y acceder a toda la
                información del sistema.
              </Alert>
            )}

            {isEditing && (
              <Typography variant="body2" color="text.secondary">
                La contraseña se restablece desde la acción independiente de
                seguridad.
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
                ? 'Guardar cambios'
                : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
