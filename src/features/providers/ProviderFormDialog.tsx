import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  CreateProviderRequest,
  Provider,
} from '../../types/provider.types';

interface ProviderFormDialogProps {
  open: boolean;
  provider?: Provider | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateProviderRequest) => void;
}

interface ProviderFormValues {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
}

export function ProviderFormDialog({
  open,
  provider,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ProviderFormDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProviderFormValues>({
    defaultValues: {
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        companyName: provider?.companyName || '',
        contactName: provider?.contactName || '',
        phone: provider?.phone || '',
        email: provider?.email || '',
      });

      setLocalError(null);
    }
  }, [open, provider, reset]);

  const submitForm = (values: ProviderFormValues) => {
    setLocalError(null);

    const data: CreateProviderRequest = {
      companyName: values.companyName.trim(),
      contactName: values.contactName.trim() || undefined,
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
    };

    if (!data.companyName) {
      setLocalError('El nombre de la empresa es obligatorio');
      return;
    }

    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {provider ? 'Editar proveedor' : 'Nuevo proveedor'}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(submitForm)}>
        <DialogContent dividers>
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || localError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nombre de la empresa"
            placeholder="Ej: AgroLogística Yungas"
            margin="normal"
            error={Boolean(errors.companyName)}
            helperText={errors.companyName?.message}
            {...register('companyName', {
              required: 'El nombre de la empresa es obligatorio',
              minLength: {
                value: 2,
                message: 'Debe tener al menos 2 caracteres',
              },
            })}
          />

          <TextField
            fullWidth
            label="Responsable / Contacto"
            placeholder="Ej: Juan Pérez"
            margin="normal"
            {...register('contactName')}
          />

          <TextField
            fullWidth
            label="Teléfono"
            placeholder="Ej: +591 71234567"
            margin="normal"
            {...register('phone')}
          />

          <TextField
            fullWidth
            label="Correo"
            placeholder="Ej: ventas@proveedor.com"
            margin="normal"
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email', {
              validate: (value) => {
                if (!value) return true;

                return /\S+@\S+\.\S+/.test(value) || 'Correo inválido';
              },
            })}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : provider ? 'Actualizar' : 'Crear proveedor'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}