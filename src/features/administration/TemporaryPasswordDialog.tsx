import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface TemporaryPasswordDialogProps {
  open: boolean;
  password: string;
  userName?: string;
  onClose: () => void;
}

export function TemporaryPasswordDialog({
  open,
  password,
  userName,
  onClose,
}: TemporaryPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Contraseña temporal</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="warning">
            Esta contraseña solo se mostrará ahora. Entrégala de forma privada
            {userName ? ` a ${userName}` : ''}. El usuario deberá cambiarla en
            su primer acceso.
          </Alert>
          <TextField
            label="Contraseña temporal"
            value={password}
            fullWidth
            slotProps={{ input: { readOnly: true } }}
          />
          {copied && <Alert severity="success">Contraseña copiada.</Alert>}
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={copyPassword}
          >
            Copiar contraseña
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Ya la guardé
        </Button>
      </DialogActions>
    </Dialog>
  );
}
