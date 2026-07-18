import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProviders } from '../../api/providers.api';
import { getProducts } from '../../api/products.api';
import {
  cancelPurchase,
  createPurchase,
  getPurchases,
  receivePurchase,
  updatePurchase,
} from '../../api/purchases.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type {
  CreatePurchaseRequest,
  Purchase,
  PurchaseStatus,
} from '../../types/purchase.types';
import { PurchaseFormDialog } from './PurchaseFormDialog';
import { ReceivePurchaseDialog } from './ReceivePurchaseDialog';

function getErrorMessage(error: unknown) {
  const anyError = error as any;
  const message = anyError?.response?.data?.message;
  const errorText = anyError?.response?.data?.error;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  if (typeof errorText === 'string') return errorText;

  if (anyError?.response?.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (anyError?.response?.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (anyError?.message) return anyError.message;

  return 'Ocurrió un error inesperado.';
}

function getStatusLabel(status: PurchaseStatus) {
  const labels: Record<PurchaseStatus, string> = {
    PENDING: 'Pendiente',
    RECEIVED: 'Recibida',
    CANCELLED: 'Anulada',
  };

  return labels[status] || status;
}

function getStatusColors(status: PurchaseStatus) {
  const colors: Record<PurchaseStatus, { bg: string; color: string }> = {
    PENDING: {
      bg: '#fff8e1',
      color: '#f57c00',
    },
    RECEIVED: {
      bg: '#e8f5e9',
      color: '#2e7d32',
    },
    CANCELLED: {
      bg: '#ffebee',
      color: '#d32f2f',
    },
  };

  return colors[status];
}

function getProviderName(purchase: Purchase) {
  return purchase.providerName || purchase.provider?.companyName || '-';
}

function getPdfUrl(pdfUrl?: string | null) {
  if (!pdfUrl) return '';

  if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
    return pdfUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  return `${apiUrl}${pdfUrl}`;
}

export function PurchasesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const canCreate = user?.role === 'ADMIN' ;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'ALL'>('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const {
    data: purchases = [],
    isLoading: purchasesLoading,
    isError: purchasesIsError,
    error: purchasesError,
  } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => getPurchases(),
  });

  const {
    data: providers = [],
    isLoading: providersLoading,
    isError: providersIsError,
    error: providersError,
  } = useQuery({
    queryKey: ['providers'],
    queryFn: getProviders,
  });

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsIsError,
    error: productsError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const filteredPurchases = useMemo(() => {
    const text = search.trim().toLowerCase();

    return purchases.filter((purchase) => {
      const matchesText =
        !text ||
        [
          purchase.id,
          getProviderName(purchase),
          purchase.userName,
          purchase.observations,
          ...purchase.details.map((detail) => detail.productName),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text));

      const matchesStatus =
        statusFilter === 'ALL' || purchase.status === statusFilter;

      const matchesProvider =
        providerFilter === 'ALL' || purchase.providerId === providerFilter;

      return matchesText && matchesStatus && matchesProvider;
    });
  }, [purchases, search, statusFilter, providerFilter]);

  const summary = useMemo(() => {
    const pending = purchases.filter((purchase) => purchase.status === 'PENDING');
    const received = purchases.filter((purchase) => purchase.status === 'RECEIVED');
    const cancelled = purchases.filter((purchase) => purchase.status === 'CANCELLED');

    const totalReceived = received.reduce(
      (sum, purchase) => sum + purchase.total,
      0,
    );

    return {
      total: purchases.length,
      pending: pending.length,
      received: received.length,
      cancelled: cancelled.length,
      totalReceived,
    };
  }, [purchases]);

  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setFormOpen(false);
      setSelectedPurchase(null);
      setFormError(null);
    },
    onError: (mutationError) => {
      setFormError(getErrorMessage(mutationError));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePurchaseRequest }) =>
      updatePurchase(id, {
        observations: data.observations,
        details: data.details,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      setFormOpen(false);
      setSelectedPurchase(null);
      setFormError(null);
    },
    onError: (mutationError) => {
      setFormError(getErrorMessage(mutationError));
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, updatePrices }: { id: string; updatePrices: boolean }) =>
      receivePurchase(id, { updatePrices }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setReceiveOpen(false);
      setSelectedPurchase(null);
      setReceiveError(null);
    },
    onError: (mutationError) => {
      setReceiveError(getErrorMessage(mutationError));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (mutationError) => {
      alert(getErrorMessage(mutationError));
    },
  });

  const handleCreate = () => {
    setSelectedPurchase(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setFormError(null);
    setFormOpen(true);
  };

  const handleReceive = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setReceiveError(null);
    setReceiveOpen(true);
  };

  const handleCancel = (purchase: Purchase) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas anular la compra del proveedor "${getProviderName(
        purchase,
      )}"?`,
    );

    if (!confirmed) return;

    cancelMutation.mutate(purchase.id);
  };

  const handleSubmit = (data: CreatePurchaseRequest) => {
    if (selectedPurchase) {
      updateMutation.mutate({
        id: selectedPurchase.id,
        data,
      });

      return;
    }

    createMutation.mutate(data);
  };

  if (purchasesLoading || providersLoading || productsLoading) {
    return <Loading message="Cargando compras..." />;
  }

  if (purchasesIsError) {
    return <ErrorMessage message={getErrorMessage(purchasesError)} />;
  }

  if (providersIsError) {
    return <ErrorMessage message={getErrorMessage(providersError)} />;
  }

  if (productsIsError) {
    return <ErrorMessage message={getErrorMessage(productsError)} />;
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Gestión de Compras
        </Typography>

        <Typography color="text.secondary">
          Registro de compras a proveedores, recepción de mercadería y actualización de stock.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                TOTAL COMPRAS
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {summary.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registradas
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}>
              <ReceiptLongIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            PENDIENTES
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.pending}
          </Typography>
          <Typography variant="caption" color="warning.main">
            Por recibir
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            RECIBIDAS
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.received}
          </Typography>
          <Typography variant="caption" color="success.main">
            Stock actualizado
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            ANULADAS
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.cancelled}
          </Typography>
          <Typography variant="caption" color="error.main">
            Canceladas
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            VALOR RECIBIDO
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {formatCurrency(summary.totalReceived)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Compras recibidas
          </Typography>
        </Card>
      </Box>

      {!canCreate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tu rol no tiene permisos para registrar compras.
        </Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Listado de Compras
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredPurchases.length} de {purchases.length} compras
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar compra..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              label="Estado"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PurchaseStatus | 'ALL')
              }
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="PENDING">Pendiente</MenuItem>
              <MenuItem value="RECEIVED">Recibida</MenuItem>
              <MenuItem value="CANCELLED">Anulada</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Proveedor"
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.companyName}
                </MenuItem>
              ))}
            </TextField>

            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                sx={{
                  backgroundColor: '#005b3f',
                  fontWeight: 800,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#00432f',
                  },
                }}
              >
                Nueva compra
              </Button>
            )}
          </Stack>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    fontWeight: 800,
                    fontSize: 12,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    backgroundColor: '#f7f9fb',
                  },
                }}
              >
                <TableCell>Compra</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Detalle</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredPurchases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="info">
                      No se encontraron compras con los filtros seleccionados.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredPurchases.map((purchase) => {
                const statusColors = getStatusColors(purchase.status);
                const canModifyPending =
                  isAdmin && purchase.status === 'PENDING';

                return (
                  <TableRow
                    key={purchase.id}
                    hover
                    sx={{
                      '& td': {
                        borderColor: '#edf0f2',
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                          }}
                        >
                          <LocalShippingIcon fontSize="small" />
                        </Avatar>

                        <Box>
                          <Typography fontWeight={800}>
                            Compra #{purchase.id.slice(0, 8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Registró: {purchase.userName || `Usuario ${purchase.userId}`}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={700}>{getProviderName(purchase)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {purchase.observations || 'Sin observaciones'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={getStatusLabel(purchase.status)}
                        sx={{
                          bgcolor: statusColors.bg,
                          color: statusColors.color,
                          fontWeight: 800,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        {purchase.details.slice(0, 2).map((detail) => (
                          <Typography
                            key={detail.id || detail.productId}
                            variant="body2"
                          >
                            {detail.quantity} x{' '}
                            {detail.productName || detail.product?.name || 'Producto'}{' '}
                            ({formatCurrency(detail.unitPrice)})
                          </Typography>
                        ))}

                        {purchase.details.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            + {purchase.details.length - 2} productos más
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={900}>
                        {formatCurrency(purchase.total)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{formatDate(purchase.date)}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      {purchase.pdfUrl && (
                        <Tooltip title="Descargar PDF">
                          <IconButton
                            size="small"
                            component="a"
                            href={getPdfUrl(purchase.pdfUrl)}
                            target="_blank"
                          >
                            <FileDownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {canModifyPending && (
                        <>
                          <Tooltip title="Recibir compra">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleReceive(purchase)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar compra pendiente">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(purchase)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {isAdmin && purchase.status !== 'CANCELLED' && (
                        <Tooltip title="Anular compra">
                          <IconButton
                            size="small"
                            color="error"
                            disabled={cancelMutation.isPending}
                            onClick={() => handleCancel(purchase)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {!isAdmin && (
                        <Chip
                          size="small"
                          label="Solo lectura"
                          sx={{
                            bgcolor: '#eef2f4',
                            color: 'text.secondary',
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PurchaseFormDialog
        open={formOpen}
        purchase={selectedPurchase}
        providers={providers}
        products={products}
        loading={createMutation.isPending || updateMutation.isPending}
        error={formError}
        onClose={() => {
          setFormOpen(false);
          setSelectedPurchase(null);
          setFormError(null);
        }}
        onSubmit={handleSubmit}
      />

      <ReceivePurchaseDialog
        open={receiveOpen}
        purchase={selectedPurchase}
        loading={receiveMutation.isPending}
        error={receiveError}
        onClose={() => {
          setReceiveOpen(false);
          setSelectedPurchase(null);
          setReceiveError(null);
        }}
        onConfirm={(updatePrices) => {
          if (!selectedPurchase) return;

          receiveMutation.mutate({
            id: selectedPurchase.id,
            updatePrices,
          });
        }}
      />
    </>
  );
}