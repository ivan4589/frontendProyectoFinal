import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPayments,
  reversePayment,
  type EconomicPayment,
} from '../../api/payments.api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { requestEconomicReason } from '../../utils/economicOperation';

const methodLabels = {
  CASH: 'Efectivo',
  QR: 'QR',
  BANK_TRANSFER: 'Transferencia',
} as const;

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = candidate.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string'
    ? message
    : candidate.message || 'No se pudo revertir el pago.';
}

export function PaymentReversalsPanel() {
  const queryClient = useQueryClient();
  const paymentsQuery = useQuery({
    queryKey: ['payments', 'administration'],
    queryFn: getPayments,
  });

  const reversalMutation = useMutation({
    mutationFn: ({ payment, reason }: { payment: EconomicPayment; reason: string }) =>
      reversePayment(payment.id, reason),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['collections', 'debts'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const reversiblePayments = (paymentsQuery.data || [])
    .filter(
      (payment) =>
        payment.amount > 0 &&
        !payment.isReversal &&
        !payment.cancelledAt,
    )
    .slice(0, 20);

  const handleReverse = (payment: EconomicPayment) => {
    const reason = requestEconomicReason(
      `revertir el pago de ${formatCurrency(payment.amount)} del cliente ${payment.clientName}`,
    );
    if (!reason) return;
    reversalMutation.mutate({ payment, reason });
  };

  return (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Reversión de pagos
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Los pagos no se editan ni eliminan. Una anulación crea un movimiento
          inverso y conserva toda la trazabilidad.
        </Typography>
      </Box>

      {reversalMutation.isError && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {errorMessage(reversalMutation.error)}
        </Alert>
      )}

      {paymentsQuery.isError && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          {errorMessage(paymentsQuery.error)}
        </Alert>
      )}

      {!paymentsQuery.isLoading && reversiblePayments.length === 0 ? (
        <Alert severity="info" sx={{ m: 2 }}>
          No existen pagos activos disponibles para reversión.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Venta</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reversiblePayments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>{formatDateTime(payment.receivedAt)}</TableCell>
                  <TableCell>{payment.clientName}</TableCell>
                  <TableCell>{payment.saleId.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={methodLabels[payment.method]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{payment.reference || '—'}</TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 800 }}>
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<UndoIcon />}
                        disabled={reversalMutation.isPending}
                        onClick={() => handleReverse(payment)}
                      >
                        Revertir
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
