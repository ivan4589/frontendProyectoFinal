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

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  CreateSaleReturnRequest,
  Sale,
} from '../../types/sale.types';

import { formatCurrency } from '../../utils/formatCurrency';

interface SaleReturnDialogProps {
  open: boolean;
  sale?: Sale | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (
    data: CreateSaleReturnRequest,
  ) => void;
}

export function SaleReturnDialog({
  open,
  sale,
  loading = false,
  error,
  onClose,
  onSubmit,
}: SaleReturnDialogProps) {
  const [quantities, setQuantities] =
    useState<Record<string, number>>({});

  const [observations, setObservations] =
    useState('');

  const [localError, setLocalError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuantities({});
    setObservations('');
    setLocalError(null);
  }, [open, sale]);

  const returnTotal = useMemo(() => {
    if (!sale) {
      return 0;
    }

    return sale.details.reduce(
      (sum, detail) =>
        sum +
        Number(
          quantities[detail.id] || 0,
        ) *
          detail.unitPrice,
      0,
    );
  }, [sale, quantities]);

  const submitReturn = () => {
    setLocalError(null);

    if (!sale) {
      return;
    }

    const details = sale.details
      .map((detail) => ({
        saleDetailId: detail.id,
        quantity:
          Number(
            quantities[detail.id] || 0,
          ),
      }))
      .filter(
        (detail) =>
          detail.quantity > 0,
      );

    if (details.length === 0) {
      setLocalError(
        'Selecciona al menos un producto para devolver',
      );
      return;
    }

    const invalid = details.some(
      (returnDetail) => {
        const saleDetail =
          sale.details.find(
            (detail) =>
              detail.id ===
              returnDetail.saleDetailId,
          );

        if (!saleDetail) {
          return true;
        }

        const available =
          saleDetail.quantity -
          saleDetail.returnedQuantity;

        return (
          !Number.isInteger(
            returnDetail.quantity,
          ) ||
          returnDetail.quantity <= 0 ||
          returnDetail.quantity >
            available
        );
      },
    );

    if (invalid) {
      setLocalError(
        'Una de las cantidades de devolución no es válida',
      );
      return;
    }

    const reason = observations.trim();
    if (reason.length < 10) {
      setLocalError('El motivo de la devolución debe tener al menos 10 caracteres');
      return;
    }

    onSubmit({
      details,
      observations: reason,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={
        loading ? undefined : onClose
      }
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Registrar devolución
      </DialogTitle>

      <DialogContent dividers>
        {(error || localError) && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error || localError}
          </Alert>
        )}

        <Alert
          severity="warning"
          sx={{ mb: 2 }}
        >
          Los productos devueltos
          regresarán al stock y se
          recalculará el total y saldo de
          la venta.
        </Alert>

        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ mb: 2 }}
        >
          Venta: {sale?.saleNumber}
        </Typography>

        <Stack spacing={1.5}>
          {sale?.details.map((detail) => {
            const available =
              detail.quantity -
              detail.returnedQuantity;

            return (
              <Box
                key={detail.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '2fr 1fr 1fr 1fr',
                  },
                  gap: 1.5,
                  alignItems: 'center',
                  border:
                    '1px solid #edf0f2',
                  borderRadius: 2,
                  p: 1.5,
                }}
              >
                <Box>
                  <Typography
                    fontWeight={800}
                  >
                    {detail.productName}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Vendido:{' '}
                    {detail.quantity} ·
                    Devuelto:{' '}
                    {
                      detail.returnedQuantity
                    }
                  </Typography>
                </Box>

                <Typography>
                  Disponible para devolver:{' '}
                  <strong>
                    {available}
                  </strong>
                </Typography>

                <TextField
                  type="number"
                  size="small"
                  label="Cantidad"
                  value={
                    quantities[
                      detail.id
                    ] || ''
                  }
                  onChange={(event) =>
                    setQuantities(
                      (current) => ({
                        ...current,
                        [detail.id]:
                          event.target
                            .value === ''
                            ? 0
                            : Number(
                                event.target
                                  .value,
                              ),
                      }),
                    )
                  }
                  inputProps={{
                    min: 0,
                    max: available,
                    step: 1,
                  }}
                  disabled={
                    available <= 0
                  }
                />

                <Typography
                  fontWeight={800}
                >
                  {formatCurrency(
                    Number(
                      quantities[
                        detail.id
                      ] || 0,
                    ) *
                      detail.unitPrice,
                  )}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Motivo de la devolución"
          value={observations}
          required
          helperText="Obligatorio, entre 10 y 500 caracteres."
          slotProps={{ htmlInput: { maxLength: 500 } }}
          onChange={(event) =>
            setObservations(
              event.target.value,
            )
          }
          sx={{ mt: 2 }}
        />

        <Box
          sx={{
            mt: 2,
            textAlign: 'right',
          }}
        >
          <Typography
            variant="h6"
            fontWeight={900}
          >
            Total devolución:{' '}
            {formatCurrency(returnTotal)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          color="warning"
          onClick={submitReturn}
          disabled={loading}
        >
          {loading
            ? 'Registrando...'
            : 'Confirmar devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}