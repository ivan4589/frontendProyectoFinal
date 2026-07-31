import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelWarehouseTransfer,
  createWarehouseTransfer,
  getWarehouseTransfers,
} from '../../api/warehouseTransfers.api';
import { getWarehouse, getWarehouses } from '../../api/warehouses.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import type { WarehouseTransfer } from '../../types/warehouse-transfer.types';
import type { WarehouseStock } from '../../types/warehouse.types';
import { formatDateTime } from '../../utils/formatDate';
import { requestEconomicReason } from '../../utils/economicOperation';

interface TransferDetailDraft {
  key: string;
  productId: string;
  quantity: string;
}

function createDraftDetail(): TransferDetailDraft {
  return {
    key: `${Date.now()}-${Math.random()}`,
    productId: '',
    quantity: '',
  };
}

function getErrorMessage(error: unknown) {
  const requestError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };
  const message = requestError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return requestError.message || 'No se pudo completar la operación.';
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 3,
  }).format(value);
}

export function WarehouseTransfersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [originWarehouseId, setOriginWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [observations, setObservations] = useState('');
  const [details, setDetails] = useState<TransferDetailDraft[]>([
    createDraftDetail(),
  ]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [transferToCancel, setTransferToCancel] =
    useState<WarehouseTransfer | null>(null);

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const transfersQuery = useQuery({
    queryKey: ['warehouse-transfers'],
    queryFn: getWarehouseTransfers,
  });

  const originQuery = useQuery({
    queryKey: ['warehouses', originWarehouseId],
    queryFn: () => getWarehouse(originWarehouseId),
    enabled: dialogOpen && Boolean(originWarehouseId),
  });

  const activeWarehouses = useMemo(
    () =>
      (warehousesQuery.data || []).filter((warehouse) => warehouse.isActive),
    [warehousesQuery.data],
  );

  const availableStocks = useMemo(
    () =>
      (originQuery.data?.stocks || []).filter(
        (stock) => stock.availableStock > 0,
      ),
    [originQuery.data?.stocks],
  );

  const stocksByProductId = useMemo(
    () => new Map(availableStocks.map((stock) => [stock.productId, stock])),
    [availableStocks],
  );

  const areDetailsValid = useMemo(() => {
    if (details.length === 0) {
      return false;
    }

    const productIds = details.map((detail) => detail.productId);
    const hasRepeatedProducts =
      new Set(productIds).size !== productIds.length;

    if (hasRepeatedProducts) {
      return false;
    }

    return details.every((detail) => {
      const stock = stocksByProductId.get(detail.productId);
      const quantity = Number(detail.quantity);

      return (
        Boolean(detail.productId) &&
        detail.quantity.trim() !== '' &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        Boolean(stock) &&
        quantity <= (stock?.availableStock ?? 0)
      );
    });
  }, [details, stocksByProductId]);

  const canAddProduct =
    areDetailsValid && details.length < availableStocks.length;

  const canSubmitTransfer =
    Boolean(originWarehouseId) &&
    Boolean(destinationWarehouseId) &&
    originWarehouseId !== destinationWarehouseId &&
    areDetailsValid;

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['warehouse-transfers'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['warehouses'],
      }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createWarehouseTransfer,
    onSuccess: async () => {
      setDialogOpen(false);
      setActionError(null);
      await refreshData();
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelWarehouseTransfer(id, reason),
    onSuccess: async () => {
      setTransferToCancel(null);
      setActionError(null);
      await refreshData();
    },
    onError: (error) => {
      setActionError(getErrorMessage(error));
      setTransferToCancel(null);
    },
  });

  const openCreateDialog = () => {
    const origin =
      activeWarehouses.find((warehouse) => warehouse.isDefault) ||
      activeWarehouses[0];
    const destination = activeWarehouses.find(
      (warehouse) => warehouse.id !== origin?.id,
    );

    setOriginWarehouseId(origin?.id || '');
    setDestinationWarehouseId(destination?.id || '');
    setObservations('');
    setDetails([createDraftDetail()]);
    setActionError(null);
    setDialogOpen(true);
  };

  const changeOrigin = (warehouseId: string) => {
    setOriginWarehouseId(warehouseId);
    setDetails([createDraftDetail()]);

    if (warehouseId === destinationWarehouseId) {
      const destination = activeWarehouses.find(
        (warehouse) => warehouse.id !== warehouseId,
      );

      setDestinationWarehouseId(destination?.id || '');
    }
  };

  const updateDetail = (
    key: string,
    field: 'productId' | 'quantity',
    value: string,
  ) => {
    setDetails((current) =>
      current.map((detail) =>
        detail.key === key
          ? {
              ...detail,
              [field]: value,
            }
          : detail,
      ),
    );
  };

  const removeDetail = (key: string) => {
    setDetails((current) =>
      current.length === 1
        ? current
        : current.filter((detail) => detail.key !== key),
    );
  };

  const addDetail = () => {
    if (!areDetailsValid) {
      setActionError(
        'Selecciona un producto e ingresa una cantidad válida antes de agregar otro.',
      );
      return;
    }

    setActionError(null);
    setDetails((current) => [...current, createDraftDetail()]);
  };

  const submitTransfer = () => {
    setActionError(null);

    if (
      !originWarehouseId ||
      !destinationWarehouseId ||
      originWarehouseId === destinationWarehouseId
    ) {
      setActionError('Selecciona dos almacenes diferentes.');
      return;
    }

    const productIds = details.map((detail) => detail.productId);

    if (
      productIds.some((productId) => !productId) ||
      new Set(productIds).size !== productIds.length
    ) {
      setActionError('Selecciona productos diferentes en cada fila.');
      return;
    }

    const normalizedDetails = details.map((detail) => ({
      productId: detail.productId,
      quantity: Number(detail.quantity),
    }));

    for (const detail of normalizedDetails) {
      const stock = stocksByProductId.get(detail.productId);

      if (!Number.isFinite(detail.quantity) || detail.quantity <= 0) {
        setActionError('Todas las cantidades deben ser mayores a cero.');
        return;
      }

      if (!stock || detail.quantity > stock.availableStock) {
        setActionError(
          `La cantidad de ${stock?.product.name || 'un producto'} supera el stock disponible.`,
        );
        return;
      }
    }

    createMutation.mutate({
      originWarehouseId,
      destinationWarehouseId,
      observations: observations.trim() || undefined,
      details: normalizedDetails,
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  if (warehousesQuery.isLoading || transfersQuery.isLoading) {
    return <Loading />;
  }

  if (warehousesQuery.isError) {
    return <ErrorMessage message={getErrorMessage(warehousesQuery.error)} />;
  }

  if (transfersQuery.isError) {
    return <ErrorMessage message={getErrorMessage(transfersQuery.error)} />;
  }

  const transfers = transfersQuery.data || [];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Transferencias
          </Typography>
          <Typography color="text.secondary">
            Mueve productos entre el Depósito y el Almacén Central con
            actualización inmediata.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<SwapHorizIcon />}
          onClick={openCreateDialog}
          disabled={activeWarehouses.length < 2}
        >
          Nueva transferencia
        </Button>
      </Stack>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {activeWarehouses.map((warehouse) => (
          <Card key={warehouse.id}>
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <WarehouseIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center' }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {warehouse.name}
                    </Typography>
                    {warehouse.isDefault && (
                      <Chip size="small" color="primary" label="Principal" />
                    )}
                  </Stack>
                  <Typography color="text.secondary">
                    {warehouse.productsCount || 0} productos con existencias
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {formatQuantity(warehouse.totalStock || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    unidades totales
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Historial de transferencias
          </Typography>
        </Box>
        <Divider />

        {transfers.length === 0 ? (
          <Box
            sx={{
              p: 5,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Inventory2Icon sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Todavía no se registraron transferencias.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={48} />
                  <TableCell>Número</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Ruta</TableCell>
                  <TableCell align="right">Productos</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((transfer) => {
                  const expanded = expandedIds.has(transfer.id);

                  return [
                    <TableRow key={transfer.id} hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpanded(transfer.id)}
                        >
                          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>
                          {transfer.transferNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(transfer.transferredAt)}
                      </TableCell>
                      <TableCell>
                        {transfer.originWarehouse.name}
                        {' → '}
                        {transfer.destinationWarehouse.name}
                      </TableCell>
                      <TableCell align="right">
                        {transfer.details.length}
                      </TableCell>
                      <TableCell>{transfer.user.name}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={
                            transfer.status === 'COMPLETED'
                              ? 'success'
                              : 'default'
                          }
                          label={
                            transfer.status === 'COMPLETED'
                              ? 'Completada'
                              : 'Anulada'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {transfer.status === 'COMPLETED' && (
                          <Tooltip title="Anular transferencia">
                            <IconButton
                              color="error"
                              onClick={() => setTransferToCancel(transfer)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>,
                    <TableRow key={`${transfer.id}-details`}>
                      <TableCell
                        colSpan={8}
                        sx={{
                          py: 0,
                          borderBottom: expanded ? undefined : 0,
                        }}
                      >
                        <Collapse in={expanded} unmountOnExit>
                          <Box sx={{ py: 2, px: 3 }}>
                            <Stack spacing={1}>
                              {transfer.details.map((detail) => (
                                <Stack
                                  key={detail.id}
                                  direction="row"
                                  spacing={2}
                                  sx={{
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <Typography>{detail.product.name}</Typography>
                                  <Typography
                                    sx={{
                                      fontWeight: 700,
                                    }}
                                  >
                                    {formatQuantity(detail.quantity)}{' '}
                                    {detail.product.unit}
                                  </Typography>
                                </Stack>
                              ))}
                              {transfer.observations && (
                                <Alert severity="info">
                                  {transfer.observations}
                                </Alert>
                              )}
                              {transfer.cancelledAt && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Anulada el{' '}
                                  {formatDateTime(transfer.cancelledAt)}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>,
                  ];
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={
          createMutation.isPending ? undefined : () => setDialogOpen(false)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Nueva transferencia</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Al confirmar, el stock saldrá del origen e ingresará al destino
              inmediatamente.
            </Alert>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1fr',
                },
                gap: 2,
              }}
            >
              <TextField
                select
                fullWidth
                label="Almacén de origen"
                value={originWarehouseId}
                onChange={(event) => changeOrigin(event.target.value)}
              >
                {activeWarehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Almacén de destino"
                value={destinationWarehouseId}
                onChange={(event) =>
                  setDestinationWarehouseId(event.target.value)
                }
              >
                {activeWarehouses
                  .filter((warehouse) => warehouse.id !== originWarehouseId)
                  .map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            <Divider />

            <Stack spacing={2}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Productos
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addDetail}
                  disabled={!canAddProduct}
                >
                  Agregar producto
                </Button>
              </Stack>

              {originQuery.isLoading && (
                <Loading message="Consultando stock del origen..." />
              )}

              {!originQuery.isLoading && availableStocks.length === 0 && (
                <Alert severity="warning">
                  El almacén de origen no tiene stock disponible para
                  transferir.
                </Alert>
              )}

              {!originQuery.isLoading &&
                availableStocks.length > 0 &&
                details.map((detail) => {
                  const selectedStock = stocksByProductId.get(detail.productId);
                  const selectedByOthers = new Set(
                    details
                      .filter((item) => item.key !== detail.key)
                      .map((item) => item.productId),
                  );

                  return (
                    <Box
                      key={detail.key}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: 'minmax(0, 2fr) minmax(160px, 1fr) auto',
                        },
                        gap: 1.5,
                        alignItems: 'start',
                      }}
                    >
                      <TextField
                        select
                        fullWidth
                        label="Producto"
                        value={detail.productId}
                        onChange={(event) =>
                          updateDetail(
                            detail.key,
                            'productId',
                            event.target.value,
                          )
                        }
                      >
                        {availableStocks.map((stock: WarehouseStock) => (
                          <MenuItem
                            key={stock.productId}
                            value={stock.productId}
                            disabled={selectedByOthers.has(stock.productId)}
                          >
                            {stock.product.name} —{' '}
                            {formatQuantity(stock.availableStock)} disponibles
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        type="number"
                        label="Cantidad"
                        value={detail.quantity}
                        onChange={(event) =>
                          updateDetail(
                            detail.key,
                            'quantity',
                            event.target.value,
                          )
                        }
                        helperText={
                          selectedStock
                            ? `Máximo: ${formatQuantity(
                                selectedStock.availableStock,
                              )} ${selectedStock.product.unit}`
                            : 'Selecciona un producto'
                        }
                        slotProps={{
                          htmlInput: {
                            min: 0.001,
                            max: selectedStock?.availableStock,
                            step: 0.001,
                          },
                        }}
                      />

                      <IconButton
                        color="error"
                        onClick={() => removeDetail(detail.key)}
                        disabled={details.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  );
                })}
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Observaciones (opcional)"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              slotProps={{
                htmlInput: {
                  maxLength: 500,
                },
              }}
            />

            {actionError && <Alert severity="error">{actionError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            onClick={submitTransfer}
            disabled={
              createMutation.isPending ||
              originQuery.isLoading ||
              availableStocks.length === 0 ||
              !canSubmitTransfer
            }
          >
            {createMutation.isPending
              ? 'Transfiriendo...'
              : 'Confirmar transferencia'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(transferToCancel)}
        onClose={
          cancelMutation.isPending ? undefined : () => setTransferToCancel(null)
        }
      >
        <DialogTitle>Anular transferencia</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se intentará devolver todo el stock de{' '}
            <strong>{transferToCancel?.destinationWarehouse.name}</strong> a{' '}
            <strong>{transferToCancel?.originWarehouse.name}</strong>. La
            anulación solo será posible si el destino todavía tiene disponibles
            todos los productos.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTransferToCancel(null)}
            disabled={cancelMutation.isPending}
          >
            Volver
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (transferToCancel) {
                const reason = requestEconomicReason(
                  `anular la transferencia ${transferToCancel.transferNumber}`,
                );
                if (reason) {
                  cancelMutation.mutate({ id: transferToCancel.id, reason });
                }
              }
            }}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Anulando...' : 'Sí, anular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
