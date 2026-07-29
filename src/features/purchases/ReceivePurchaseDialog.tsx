import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { PurchaseProviderGroup } from '../../types/purchase.types';
import { formatCurrency } from '../../utils/formatCurrency';

interface ReceivePurchaseDialogProps {
  open: boolean;
  purchase?: PurchaseProviderGroup | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (updatePrices: boolean) => void;
}

export function ReceivePurchaseDialog({
  open,
  purchase,
  loading = false,
  error,
  onClose,
  onConfirm,
}: ReceivePurchaseDialogProps) {
  const [updatePrices, setUpdatePrices] = useState(true);

  useEffect(() => {
    if (open) {
      setUpdatePrices(true);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Recibir compra</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 2 }}>
          Al recibir la compra se aumentará el stock de los productos. Esta
          acción solo debería realizarse cuando la mercadería ya ingresó al
          almacén.
        </Alert>

        {purchase && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 800 }}>
              Proveedor: {purchase.providerName || '-'}
            </Typography>

            <Typography color="text.secondary">
              Total: {formatCurrency(purchase.total)}
            </Typography>
          </Box>
        )}

        <Stack spacing={1}>
          {(purchase?.details ?? []).map((detail) => (
            <Box
              key={detail.id || detail.productId}
              sx={{
                border: '1px solid #edf0f2',
                borderRadius: 2,
                p: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>
                {detail.productName || detail.productId}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Cantidad: {detail.quantity} | Precio compra:{' '}
                {formatCurrency(detail.unitPrice)} | Subtotal:{' '}
                {formatCurrency(detail.subtotal)}
              </Typography>
            </Box>
          ))}
        </Stack>

        <FormControlLabel
          sx={{ mt: 2 }}
          control={
            <Checkbox
              checked={updatePrices}
              onChange={(event) => setUpdatePrices(event.target.checked)}
              disabled={loading}
            />
          }
          label="Actualizar precios de venta según los márgenes configurados del producto"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={() => onConfirm(updatePrices)}
          disabled={loading || !purchase}
        >
          {loading ? 'Recibiendo...' : 'Confirmar recepción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}