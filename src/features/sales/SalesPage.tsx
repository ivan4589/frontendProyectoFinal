import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
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
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import {
  Fragment,
  useMemo,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getClients } from '../../api/clients.api';
import { getProducts } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';
import { getSubCategories } from '../../api/subCategories.api';

import {
  cancelSale,
  confirmSale,
  createSale,
  createSaleReturn,
  getSales,
  sendSaleWhatsApp,
  updateSale,
} from '../../api/sales.api';

import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';

import { useAuth } from '../auth/AuthContext';

import { formatCurrency } from '../../utils/formatCurrency';
import {
  formatDate,
  formatDateTime,
} from '../../utils/formatDate';

import { getImageUrl } from '../../utils/getImageUrl';

import type {
  CreateSaleRequest,
  CreateSaleReturnRequest,
  PaymentStatus,
  Sale,
  SaleStatus,
} from '../../types/sale.types';

import { SaleFormDialog } from './SaleFormDialog';
import { SaleReturnDialog } from './SaleReturnDialog';

function getErrorMessage(error: unknown) {
  const requestError = error as {
    response?: {
      status?: number;
      data?: {
        message?: string | string[];
        error?: string;
      };
    };
    code?: string;
    message?: string;
  };

  const message =
    requestError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  const errorText =
    requestError.response?.data?.error;

  if (typeof errorText === 'string') {
    return errorText;
  }

  if (
    requestError.code ===
    'ERR_NETWORK'
  ) {
    return 'No se pudo conectar con el backend.';
  }

  if (
    requestError.response?.status ===
    403
  ) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (
    requestError.response?.status ===
    401
  ) {
    return 'Tu sesión expiró.';
  }

  return (
    requestError.message ||
    'Ocurrió un error inesperado.'
  );
}

function getSaleStatusLabel(
  status: SaleStatus,
) {
  const labels: Record<
    SaleStatus,
    string
  > = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Anulada',
  };

  return labels[status];
}

function getPaymentStatusLabel(
  status: PaymentStatus,
) {
  const labels: Record<
    PaymentStatus,
    string
  > = {
    PENDING: 'Sin pago',
    PARTIALLY_PAID: 'Pago parcial',
    PAID: 'Pagada',
  };

  return labels[status];
}

function getSaleStatusStyle(
  status: SaleStatus,
) {
  const styles: Record<
    SaleStatus,
    {
      backgroundColor: string;
      color: string;
    }
  > = {
    PENDING: {
      backgroundColor: '#fff8e1',
      color: '#ef6c00',
    },
    CONFIRMED: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
    },
    CANCELLED: {
      backgroundColor: '#ffebee',
      color: '#d32f2f',
    },
  };

  return styles[status];
}

function getPaymentStatusStyle(
  status: PaymentStatus,
) {
  const styles: Record<
    PaymentStatus,
    {
      backgroundColor: string;
      color: string;
    }
  > = {
    PENDING: {
      backgroundColor: '#ffebee',
      color: '#d32f2f',
    },
    PARTIALLY_PAID: {
      backgroundColor: '#fff8e1',
      color: '#ef6c00',
    },
    PAID: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
    },
  };

  return styles[status];
}

function getDocumentUrl(
  value?: string | null,
) {
  if (!value) {
    return '';
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000';

  return `${apiUrl}${value}`;
}

function isInsideDateRange(
  date: string,
  dateFrom: string,
  dateTo: string,
) {
  const current = new Date(date);

  if (dateFrom) {
    const minimum = new Date(
      `${dateFrom}T00:00:00`,
    );

    if (current < minimum) {
      return false;
    }
  }

  if (dateTo) {
    const maximum = new Date(
      `${dateTo}T23:59:59.999`,
    );

    if (current > maximum) {
      return false;
    }
  }

  return true;
}

export function SalesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canManageSales =
    user?.role === 'ADMIN' ||
    user?.role === 'VENDEDOR';

  const isAdmin =
    user?.role === 'ADMIN';

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<SaleStatus | 'ALL'>('ALL');

  const [
    paymentStatusFilter,
    setPaymentStatusFilter,
  ] =
    useState<PaymentStatus | 'ALL'>(
      'ALL',
    );

  const [clientFilter, setClientFilter] =
    useState('ALL');

  const [dateFrom, setDateFrom] =
    useState('');

  const [dateTo, setDateTo] =
    useState('');

  const [
    expandedSaleId,
    setExpandedSaleId,
  ] = useState<string | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [returnOpen, setReturnOpen] =
    useState(false);

  const [selectedSale, setSelectedSale] =
    useState<Sale | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [returnError, setReturnError] =
    useState<string | null>(null);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [actionSuccess, setActionSuccess] =
    useState<string | null>(null);

  const {
    data: sales = [],
    isLoading: salesLoading,
    isError: salesIsError,
    error: salesError,
  } = useQuery({
    queryKey: ['sales'],
    queryFn: () => getSales(),
  });

  const {
    data: clients = [],
    isLoading: clientsLoading,
    isError: clientsIsError,
    error: clientsError,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
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

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesIsError,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const {
    data: subCategories = [],
    isLoading: subCategoriesLoading,
    isError: subCategoriesIsError,
    error: subCategoriesError,
  } = useQuery({
    queryKey: ['sub-categories'],
    queryFn: () =>
      getSubCategories(),
  });

  const filteredSales = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return sales.filter((sale) => {
      const searchableValues = [
        sale.saleNumber,
        sale.clientName,
        sale.clientAlias,
        sale.clientLocation,
        sale.userName,
        sale.observations,
        ...sale.details.map(
          (detail) =>
            detail.productName,
        ),
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(
                normalizedSearch,
              ),
          );

      const matchesStatus =
        statusFilter === 'ALL' ||
        sale.status === statusFilter;

      const matchesPayment =
        paymentStatusFilter ===
          'ALL' ||
        sale.paymentStatus ===
          paymentStatusFilter;

      const matchesClient =
        clientFilter === 'ALL' ||
        sale.clientId === clientFilter;

      const matchesDate =
        isInsideDateRange(
          sale.date,
          dateFrom,
          dateTo,
        );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesClient &&
        matchesDate
      );
    });
  }, [
    sales,
    search,
    statusFilter,
    paymentStatusFilter,
    clientFilter,
    dateFrom,
    dateTo,
  ]);

  const summary = useMemo(() => {
    const confirmed = sales.filter(
      (sale) =>
        sale.status === 'CONFIRMED',
    );

    const withDebt = sales.filter(
      (sale) =>
        sale.status !== 'CANCELLED' &&
        sale.balance > 0,
    );

    return {
      total: sales.length,

      pending: sales.filter(
        (sale) =>
          sale.status === 'PENDING',
      ).length,

      confirmed: confirmed.length,

      withDebt: withDebt.length,

      confirmedTotal:
        confirmed.reduce(
          (sum, sale) =>
            sum + sale.total,
          0,
        ),
    };
  }, [sales]);

  const refreshSales = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['sales'],
      }),

      queryClient.invalidateQueries({
        queryKey: ['products'],
      }),

      queryClient.invalidateQueries({
        queryKey: ['dashboard'],
      }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createSale,

    onSuccess: async () => {
      await refreshSales();

      setFormOpen(false);
      setSelectedSale(null);
      setFormError(null);
    },

    onError: (mutationError) =>
      setFormError(
        getErrorMessage(mutationError),
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateSaleRequest;
    }) =>
      updateSale(id, {
        clientId: data.clientId,
        details: data.details,
        discount: data.discount,
        observations:
          data.observations,
        saleType: data.saleType,
        dueDate: data.dueDate,
      }),

    onSuccess: async () => {
      await refreshSales();

      setFormOpen(false);
      setSelectedSale(null);
      setFormError(null);
    },

    onError: (mutationError) =>
      setFormError(
        getErrorMessage(mutationError),
      ),
  });

  const confirmMutation = useMutation({
    mutationFn: confirmSale,

    onSuccess: async () => {
      await refreshSales();
      setActionError(null);
    },

    onError: (mutationError) =>
      setActionError(
        getErrorMessage(mutationError),
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSale,

    onSuccess: async () => {
      await refreshSales();
      setActionError(null);
    },

    onError: (mutationError) =>
      setActionError(
        getErrorMessage(mutationError),
      ),
  });

  const returnMutation = useMutation({
    mutationFn: ({
      saleId,
      data,
    }: {
      saleId: string;
      data: CreateSaleReturnRequest;
    }) =>
      createSaleReturn(
        saleId,
        data,
      ),

    onSuccess: async () => {
      await refreshSales();

      setReturnOpen(false);
      setSelectedSale(null);
      setReturnError(null);
    },

    onError: (mutationError) =>
      setReturnError(
        getErrorMessage(mutationError),
      ),
  });

  const whatsAppMutation = useMutation({
    mutationFn: ({
      saleId,
      resend,
    }: {
      saleId: string;
      resend: boolean;
    }) =>
      sendSaleWhatsApp(
        saleId,
        resend,
      ),

    onSuccess: async (result) => {
      await refreshSales();
      setActionError(null);
      setActionSuccess(
        `Nota de venta enviada por WhatsApp a ${result.phoneNumber}.`,
      );
    },

    onError: (mutationError) => {
      setActionSuccess(null);
      setActionError(
        getErrorMessage(mutationError),
      );
    },
  });

  const handleCreateSale = () => {
    setSelectedSale(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEditSale = (
    sale: Sale,
  ) => {
    if (
      sale.status !== 'PENDING'
    ) {
      setActionError(
        'Solo se pueden editar ventas pendientes.',
      );
      return;
    }

    setSelectedSale(sale);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmitSale = (
    data: CreateSaleRequest,
  ) => {
    if (selectedSale) {
      updateMutation.mutate({
        id: selectedSale.id,
        data,
      });

      return;
    }

    createMutation.mutate(data);
  };

  const handleConfirmSale = (
    sale: Sale,
  ) => {
    const confirmed =
      window.confirm(
        `¿Confirmar la venta ${sale.saleNumber}? Se descontará el stock reservado.`,
      );

    if (!confirmed) {
      return;
    }

    confirmMutation.mutate(
      sale.id,
    );
  };

  const handleCancelSale = (
    sale: Sale,
  ) => {
    const confirmed =
      window.confirm(
        `¿Anular la venta ${sale.saleNumber}? La venta continuará en el historial.`,
      );

    if (!confirmed) {
      return;
    }

    cancelMutation.mutate(
      sale.id,
    );
  };

  const handleReturn = (
    sale: Sale,
  ) => {
    setSelectedSale(sale);
    setReturnError(null);
    setReturnOpen(true);
  };

  const handleSendWhatsApp = (
    sale: Sale,
  ) => {
    const resend = Boolean(
      sale.whatsappLastSentAt,
    );

    if (
      resend &&
      !window.confirm(
        `La nota ${sale.saleNumber} ya fue enviada. ¿Deseas reenviarla?`,
      )
    ) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    whatsAppMutation.mutate({
      saleId: sale.id,
      resend,
    });
  };

  const hasFilters =
    Boolean(search) ||
    statusFilter !== 'ALL' ||
    paymentStatusFilter !== 'ALL' ||
    clientFilter !== 'ALL' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setClientFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const formLoading =
    createMutation.isPending ||
    updateMutation.isPending;

  const actionLoading =
    confirmMutation.isPending ||
    cancelMutation.isPending ||
    whatsAppMutation.isPending;

  if (
    salesLoading ||
    clientsLoading ||
    productsLoading ||
    categoriesLoading ||
    subCategoriesLoading
  ) {
    return (
      <Loading message="Cargando ventas..." />
    );
  }

  if (salesIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          salesError,
        )}
      />
    );
  }

  if (clientsIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          clientsError,
        )}
      />
    );
  }

  if (productsIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          productsError,
        )}
      />
    );
  }

  if (categoriesIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          categoriesError,
        )}
      />
    );
  }

  if (subCategoriesIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          subCategoriesError,
        )}
      />
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Gestión de Ventas
        </Typography>

        <Typography color="text.secondary">
          Registro, confirmación,
          seguimiento de pagos y
          devoluciones de productos.
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
          <Stack
            direction="row"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
              >
                TOTAL VENTAS
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
              >
                {summary.total}
              </Typography>
            </Box>

            <Avatar
              sx={{
                bgcolor: '#e3f2fd',
                color: '#1565c0',
              }}
            >
              <ReceiptLongIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
          >
            PENDIENTES
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {summary.pending}
          </Typography>

          <Typography
            variant="caption"
            color="warning.main"
          >
            Stock reservado
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
          >
            CONFIRMADAS
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {summary.confirmed}
          </Typography>

          <Typography
            variant="caption"
            color="success.main"
          >
            Stock descontado
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
          >
            CON DEUDA
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {summary.withDebt}
          </Typography>

          <Typography
            variant="caption"
            color="error.main"
          >
            Cobranza pendiente
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
          >
            VALOR CONFIRMADO
          </Typography>

          <Typography
            variant="h5"
            fontWeight={800}
          >
            {formatCurrency(
              summary.confirmedTotal,
            )}
          </Typography>
        </Card>
      </Box>

      {user?.role === 'COBRADOR' && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
        >
          El rol cobrador visualiza las
          ventas con saldo pendiente.
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          onClose={() =>
            setActionError(null)
          }
          sx={{ mb: 2 }}
        >
          {actionError}
        </Alert>
      )}

      {actionSuccess && (
        <Alert
          severity="success"
          onClose={() =>
            setActionSuccess(null)
          }
          sx={{ mb: 2 }}
        >
          {actionSuccess}
        </Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction={{
            xs: 'column',
            lg: 'row',
          }}
          justifyContent="space-between"
          alignItems={{
            xs: 'stretch',
            lg: 'center',
          }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
            >
              Listado de Ventas
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Mostrando{' '}
              {filteredSales.length} de{' '}
              {sales.length} ventas
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: 'column',
              md: 'row',
            }}
            spacing={1.2}
            useFlexGap
            flexWrap="wrap"
          >
            <TextField
              size="small"
              placeholder="Buscar venta..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
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
                setStatusFilter(
                  event.target
                    .value as
                    | SaleStatus
                    | 'ALL',
                )
              }
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ALL">
                Todos
              </MenuItem>

              <MenuItem value="PENDING">
                Pendiente
              </MenuItem>

              <MenuItem value="CONFIRMED">
                Confirmada
              </MenuItem>

              <MenuItem value="CANCELLED">
                Anulada
              </MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Pago"
              value={
                paymentStatusFilter
              }
              onChange={(event) =>
                setPaymentStatusFilter(
                  event.target
                    .value as
                    | PaymentStatus
                    | 'ALL',
                )
              }
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">
                Todos
              </MenuItem>

              <MenuItem value="PENDING">
                Sin pago
              </MenuItem>

              <MenuItem value="PARTIALLY_PAID">
                Pago parcial
              </MenuItem>

              <MenuItem value="PAID">
                Pagada
              </MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Cliente"
              value={clientFilter}
              onChange={(event) =>
                setClientFilter(
                  event.target.value,
                )
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">
                Todos
              </MenuItem>

              {clients.map((client) => (
                <MenuItem
                  key={client.id}
                  value={client.id}
                >
                  {client.fullName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value,
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  max: dateTo || undefined,
                },
              }}
              sx={{ minWidth: 150 }}
            />

            <TextField
              size="small"
              type="date"
              label="Hasta"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value,
                )
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  min: dateFrom || undefined,
                },
              }}
              sx={{ minWidth: 150 }}
            />

            {hasFilters && (
              <Button
                onClick={clearFilters}
              >
                Limpiar
              </Button>
            )}

            {canManageSales && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateSale}
                sx={{
                  backgroundColor:
                    '#005b3f',
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                Nueva venta
              </Button>
            )}
          </Stack>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={50} />
                <TableCell>
                  Venta
                </TableCell>
                <TableCell>
                  Cliente
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
                <TableCell>
                  Pago
                </TableCell>
                <TableCell>
                  Total
                </TableCell>
                <TableCell>
                  Fecha
                </TableCell>
                <TableCell align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredSales.length ===
                0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Alert severity="info">
                      No se encontraron
                      ventas.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredSales.map(
                (sale) => {
                  const expanded =
                    expandedSaleId ===
                    sale.id;

                  const saleStyle =
                    getSaleStatusStyle(
                      sale.status,
                    );

                  const paymentStyle =
                    getPaymentStatusStyle(
                      sale.paymentStatus,
                    );

                  const documentUrl =
                    sale.status ===
                      'CANCELLED' &&
                    sale.cancelledPdfUrl
                      ? sale.cancelledPdfUrl
                      : sale.pdfUrl;

                  const whatsappDisabledReason =
                    !sale.clientPhone
                      ? 'El cliente no tiene teléfono'
                      : !sale.clientWhatsAppConsent
                        ? 'El cliente no autorizó envíos por WhatsApp'
                        : !sale.pdfUrl
                          ? 'La venta no tiene un PDF disponible'
                          : null;

                  const sendingThisSale =
                    whatsAppMutation.isPending &&
                    whatsAppMutation.variables
                      ?.saleId === sale.id;

                  return (
                    <Fragment key={sale.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedSaleId(
                                expanded
                                  ? null
                                  : sale.id,
                              )
                            }
                          >
                            {expanded ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              variant="rounded"
                              sx={{
                                bgcolor:
                                  saleStyle.backgroundColor,
                                color:
                                  saleStyle.color,
                              }}
                            >
                              <ShoppingCartIcon />
                            </Avatar>

                            <Box>
                              <Typography
                                fontWeight={800}
                              >
                                {
                                  sale.saleNumber
                                }
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Vendedor:{' '}
                                {sale.userName}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={700}
                          >
                            {sale.clientName}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {sale.clientLocation ||
                              '-'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={getSaleStatusLabel(
                              sale.status,
                            )}
                            sx={{
                              bgcolor:
                                saleStyle.backgroundColor,
                              color:
                                saleStyle.color,
                              fontWeight: 800,
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={getPaymentStatusLabel(
                              sale.paymentStatus,
                            )}
                            sx={{
                              bgcolor:
                                paymentStyle.backgroundColor,
                              color:
                                paymentStyle.color,
                              fontWeight: 800,
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={900}
                          >
                            {formatCurrency(
                              sale.total,
                            )}
                          </Typography>

                          {sale.balance > 0 && (
                            <Typography
                              variant="caption"
                              color="error.main"
                            >
                              Saldo:{' '}
                              {formatCurrency(
                                sale.balance,
                              )}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            sale.date,
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {documentUrl && (
                            <Tooltip title="Abrir recibo">
                              <IconButton
                                size="small"
                                component="a"
                                href={getDocumentUrl(
                                  documentUrl,
                                )}
                                target="_blank"
                              >
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canManageSales &&
                            sale.status ===
                              'PENDING' && (
                              <>
                                <Tooltip title="Confirmar venta">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleConfirmSale(
                                        sale,
                                      )
                                    }
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Editar venta">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEditSale(
                                        sale,
                                      )
                                    }
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                          {canManageSales &&
                            sale.status ===
                              'CONFIRMED' && (
                              <Tooltip title="Registrar devolución">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() =>
                                    handleReturn(
                                      sale,
                                    )
                                  }
                                >
                                  <ReplayIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                          {canManageSales &&
                            sale.status ===
                              'CONFIRMED' && (
                              <Tooltip
                                title={
                                  whatsappDisabledReason ||
                                  (sale.whatsappLastSentAt
                                    ? 'Reenviar nota por WhatsApp'
                                    : 'Enviar nota por WhatsApp')
                                }
                              >
                                <span>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    disabled={
                                      Boolean(
                                        whatsappDisabledReason,
                                      ) ||
                                      actionLoading
                                    }
                                    onClick={() =>
                                      handleSendWhatsApp(
                                        sale,
                                      )
                                    }
                                    aria-label={
                                      sale.whatsappLastSentAt
                                        ? 'Reenviar nota por WhatsApp'
                                        : 'Enviar nota por WhatsApp'
                                    }
                                  >
                                    <WhatsAppIcon
                                      fontSize="small"
                                      sx={{
                                        opacity:
                                          sendingThisSale
                                            ? 0.45
                                            : 1,
                                      }}
                                    />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}

                          {isAdmin &&
                            sale.status !==
                              'CANCELLED' && (
                              <Tooltip title="Anular venta">
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={
                                    actionLoading
                                  }
                                  onClick={() =>
                                    handleCancelSale(
                                      sale,
                                    )
                                  }
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell
                          colSpan={8}
                          sx={{ py: 0 }}
                        >
                          <Collapse
                            in={expanded}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                py: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  display:
                                    'grid',
                                  gridTemplateColumns:
                                    {
                                      xs: '1fr',
                                      md: 'repeat(4, 1fr)',
                                    },
                                  gap: 2,
                                  mb: 2,
                                }}
                              >
                                <Paper
                                  variant="outlined"
                                  sx={{ p: 1.5 }}
                                >
                                  <Typography variant="caption">
                                    Subtotal
                                  </Typography>

                                  <Typography fontWeight={800}>
                                    {formatCurrency(
                                      sale.subtotal,
                                    )}
                                  </Typography>
                                </Paper>

                                <Paper
                                  variant="outlined"
                                  sx={{ p: 1.5 }}
                                >
                                  <Typography variant="caption">
                                    Descuento
                                  </Typography>

                                  <Typography fontWeight={800}>
                                    {formatCurrency(
                                      sale.discount,
                                    )}
                                  </Typography>
                                </Paper>

                                <Paper
                                  variant="outlined"
                                  sx={{ p: 1.5 }}
                                >
                                  <Typography variant="caption">
                                    Pagado
                                  </Typography>

                                  <Typography
                                    fontWeight={800}
                                    color="success.main"
                                  >
                                    {formatCurrency(
                                      sale.paidAmount,
                                    )}
                                  </Typography>
                                </Paper>

                                <Paper
                                  variant="outlined"
                                  sx={{ p: 1.5 }}
                                >
                                  <Typography variant="caption">
                                    Saldo
                                  </Typography>

                                  <Typography
                                    fontWeight={800}
                                    color={
                                      sale.balance >
                                      0
                                        ? 'error.main'
                                        : 'success.main'
                                    }
                                  >
                                    {formatCurrency(
                                      sale.balance,
                                    )}
                                  </Typography>
                                </Paper>
                              </Box>

                              {sale.observations && (
                                <Alert
                                  severity="info"
                                  sx={{ mb: 2 }}
                                >
                                  {
                                    sale.observations
                                  }
                                </Alert>
                              )}

                              <TableContainer
                                component={Paper}
                                variant="outlined"
                              >
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>
                                        Producto
                                      </TableCell>
                                      <TableCell align="right">
                                        Cantidad
                                      </TableCell>
                                      <TableCell align="right">
                                        Precio
                                      </TableCell>
                                      <TableCell align="right">
                                        Devuelto
                                      </TableCell>
                                      <TableCell align="right">
                                        Subtotal
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>

                                  <TableBody>
                                    {sale.details.map(
                                      (
                                        detail,
                                      ) => (
                                        <TableRow
                                          key={
                                            detail.id
                                          }
                                        >
                                          <TableCell>
                                            <Stack
                                              direction="row"
                                              spacing={
                                                1
                                              }
                                              alignItems="center"
                                            >
                                              {detail.productImageUrl && (
                                                <Box
                                                  component="img"
                                                  src={getImageUrl(
                                                    detail.productImageUrl,
                                                  )}
                                                  alt={
                                                    detail.productName
                                                  }
                                                  sx={{
                                                    width:
                                                      36,
                                                    height:
                                                      36,
                                                    objectFit:
                                                      'cover',
                                                    borderRadius:
                                                      1,
                                                  }}
                                                />
                                              )}

                                              <Box>
                                                <Typography
                                                  fontWeight={
                                                    700
                                                  }
                                                >
                                                  {
                                                    detail.productName
                                                  }
                                                </Typography>

                                                <Typography
                                                  variant="caption"
                                                  color="text.secondary"
                                                >
                                                  {
                                                    detail.presentation
                                                  }
                                                </Typography>
                                              </Box>
                                            </Stack>
                                          </TableCell>

                                          <TableCell align="right">
                                            {
                                              detail.quantity
                                            }
                                          </TableCell>

                                          <TableCell align="right">
                                            {formatCurrency(
                                              detail.unitPrice,
                                            )}
                                          </TableCell>

                                          <TableCell align="right">
                                            {
                                              detail.returnedQuantity
                                            }
                                          </TableCell>

                                          <TableCell align="right">
                                            <Typography
                                              fontWeight={
                                                800
                                              }
                                            >
                                              {formatCurrency(
                                                detail.subtotal,
                                              )}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      ),
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display:
                                    'block',
                                  mt: 1,
                                }}
                              >
                                Registrado:{' '}
                                {formatDateTime(
                                  sale.createdAt ||
                                    sale.date,
                                )}
                              </Typography>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                },
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <SaleFormDialog
        open={formOpen}
        sale={selectedSale}
        clients={clients}
        products={products}
        categories={categories}
        subCategories={
          subCategories
        }
        userRole={user?.role}
        loading={formLoading}
        error={formError}
        onClose={() => {
          setFormOpen(false);
          setSelectedSale(null);
          setFormError(null);
        }}
        onSubmit={handleSubmitSale}
      />

      <SaleReturnDialog
        open={returnOpen}
        sale={selectedSale}
        loading={
          returnMutation.isPending
        }
        error={returnError}
        onClose={() => {
          setReturnOpen(false);
          setSelectedSale(null);
          setReturnError(null);
        }}
        onSubmit={(data) => {
          if (!selectedSale) {
            return;
          }

          returnMutation.mutate({
            saleId:
              selectedSale.id,
            data,
          });
        }}
      />
    </>
  );
}
