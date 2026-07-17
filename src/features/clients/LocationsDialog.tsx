import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useState } from 'react';
import type { Location } from '../../types/client.types';

interface LocationsDialogProps {
  open: boolean;
  locations: Location[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (location: Location) => void;
}

export function LocationsDialog({
  open,
  locations,
  loading = false,
  error,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: LocationsDialogProps) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Location | null>(null);

  const handleSave = () => {
    const cleanName = name.trim();

    if (!cleanName) return;

    if (editing) {
      onUpdate(editing.id, cleanName);
    } else {
      onCreate(cleanName);
    }

    setName('');
    setEditing(null);
  };

  const handleEdit = (location: Location) => {
    setEditing(location);
    setName(location.name);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setName('');
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Localidades</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label={editing ? 'Editar localidad' : 'Nueva localidad'}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
          />

          <Button variant="contained" onClick={handleSave} disabled={loading || !name.trim()}>
            {editing ? 'Actualizar' : 'Agregar'}
          </Button>

          {editing && (
            <Button onClick={handleCancelEdit} disabled={loading}>
              Cancelar
            </Button>
          )}
        </Stack>

        <Stack spacing={1}>
          {locations.length === 0 && (
            <Alert severity="info">Todavía no hay localidades registradas.</Alert>
          )}

          {locations.map((location) => (
            <Box
              key={location.id}
              sx={{
                border: '1px solid #edf0f2',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnIcon color="success" />
                <Box>
                  <Typography fontWeight={800}>{location.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {location.id.slice(0, 8)}
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <IconButton size="small" onClick={() => handleEdit(location)} disabled={loading}>
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(location)}
                  disabled={loading}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}