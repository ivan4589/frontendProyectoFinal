import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type {
  Client,
  ClientType,
  CreateClientRequest,
  Location,
} from '../../types/client.types';

interface ClientFormDialogProps {
  open: boolean;
  client?: Client | null;
  locations: Location[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateClientRequest) => void;
}

interface ClientFormValues {
  fullName: string;
  alias: string;
  type: ClientType;
  locationId: string;
  phone: string;
  additionalInfo: string;
}

const clientTypes: { value: ClientType; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ESPECIAL', label: 'Especial' },
  { value: 'CAMINO', label: 'Camino' },
];

export function ClientFormDialog({
  open,
  client,
  locations,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ClientFormDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    defaultValues: {
      fullName: '',
      alias: '',
      type: 'NORMAL',
      locationId: '',
      phone: '',
      additionalInfo: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: client?.fullName || '',
        alias: client?.alias || '',
        type: client?.type || 'NORMAL',
        locationId: client?.locationId || '',
        phone: client?.phone || '',
        additionalInfo: client?.additionalInfo || '',
      });

      setLocalError(null);
    }
  }, [open, client, reset]);

  const submitForm = (values: ClientFormValues) => {
    setLocalError(null);

    if (!values.locationId) {
      setLocalError('Debes seleccionar una localidad');
      return;
    }

    const data: CreateClientRequest = {
      fullName: values.fullName.trim(),
      alias: values.alias.trim() || undefined,
      type: values.type,
      locationId: values.locationId,
      phone: values.phone.trim() || undefined,
      additionalInfo: values.additionalInfo.trim() || undefined,
    };

    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{client ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>

      <Box component="form" onSubmit={handleSubmit(submitForm)}>
        <DialogContent dividers>
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || localError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nombre completo"
            placeholder="Ej: Tienda Don Mario"
            margin="normal"
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            {...register('fullName', {
              required: 'El nombre del cliente es obligatorio',
              minLength: {
                value: 2,
                message: 'Debe tener al menos 2 caracteres',
              },
            })}
          />

          <TextField
            fullWidth
            label="Alias / Referencia"
            placeholder="Ej: Don Mario"
            margin="normal"
            {...register('alias')}
          />

          <TextField
            select
            fullWidth
            label="Tipo de cliente"
            margin="normal"
            defaultValue="NORMAL"
            {...register('type', {
              required: 'El tipo de cliente es obligatorio',
            })}
          >
            {clientTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Localidad"
            margin="normal"
            error={Boolean(errors.locationId)}
            helperText={errors.locationId?.message}
            defaultValue=""
            {...register('locationId', {
              required: 'La localidad es obligatoria',
            })}
          >
            <MenuItem value="">Seleccionar localidad</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {location.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Teléfono"
            placeholder="Ej: +591 71234567"
            margin="normal"
            {...register('phone')}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Información adicional"
            placeholder="Referencia, dirección, observaciones..."
            margin="normal"
            {...register('additionalInfo')}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : client ? 'Actualizar' : 'Crear cliente'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}