import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
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
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SearchIcon from '@mui/icons-material/Search';
import WarehouseIcon from '@mui/icons-material/Warehouse';

import { useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { getProviders } from '../../api/providers.api';
import { getProducts } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';

import {
  cancelPurchase,
  cancelPurchaseProvider,
  createPurchase,
  getPurchases,
  receivePurchaseProvider,
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
  PurchaseProviderGroup,
  PurchaseProviderStatus,
  PurchaseStatus,
  UpdatePurchaseRequest,
} from '../../types/purchase.types';
import { PurchaseFormDialog } from './PurchaseFormDialog';
import type {
  CreateProductFromPurchaseState,
  PurchaseFormDraft,
  ReturnToPurchaseState,
} from './PurchaseFormDialog';

type ConfirmAction =
  | {
      kind: 'RECEIVE_PROVIDER';
      purchase: Purchase;
      providerGroup: PurchaseProviderGroup;
    }
  | {
      kind: 'CANCEL_PROVIDER';
      purchase: Purchase;
      providerGroup: PurchaseProviderGroup;
    }
  | {
      kind: 'CANCEL_PURCHASE';
      purchase: Purchase;
    }
  | null;

interface CategoryDetailGroup {
  categoryId: string;
  categoryName: string;
  details: PurchaseProviderGroup['details'];
  subtotal: number;
}

const statusLabels: Record<
  PurchaseStatus | PurchaseProviderStatus,
  string
> = {
  PENDING: 'Pendiente',
  RECEIVED: 'Recibida',
  CANCELLED: 'Anulada',
};

const statusStyles: Record<
  PurchaseStatus | PurchaseProviderStatus,
  {
    backgroundColor: string;
    color: string;
  }
> = {
  PENDING: {
    backgroundColor: '#fff8e1',
    color: '#ef6c00',
  },
  RECEIVED: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  CANCELLED: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  },
};

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

  const message = requestError.response?.data?.message;
  const errorText = requestError.response?.data?.error;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (typeof errorText === 'string') {
    return errorText;
  }

  if (requestError.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el backend. Verifica que NestJS esté ejecutándose.';
  }

  if (requestError.response?.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (requestError.response?.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (requestError.response?.status === 404) {
    return 'La compra o el proveedor seleccionado no fue encontrado.';
  }

  if (requestError.response?.status === 400) {
    return 'No se pudo completar la operación. Revisa el estado y los datos de la compra.';
  }

  if (requestError.response?.status === 500) {
    return 'Ocurrió un error interno en el servidor.';
  }

  if (requestError.message) {
    return requestError.message;
  }

  return 'Ocurrió un error inesperado.';
}

function getStatusLabel(
  status: PurchaseStatus | PurchaseProviderStatus,
) {
  return statusLabels[status] || status;
}

function getStatusStyle(
  status: PurchaseStatus | PurchaseProviderStatus,
) {
  return statusStyles[status] || statusStyles.PENDING;
}

function getPdfUrl(pdfUrl?: string | null) {
  if (!pdfUrl) {
    return '';
  }

  if (
    pdfUrl.startsWith('http://') ||
    pdfUrl.startsWith('https://')
  ) {
    return pdfUrl;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000';

  return `${apiUrl}${pdfUrl}`;
}

function getPurchaseGroups(purchase: Purchase) {
  return Array.isArray(purchase.providerGroups)
    ? purchase.providerGroups
    : [];
}

function canEditPurchase(purchase: Purchase) {
  const groups = getPurchaseGroups(purchase);

  return (
    purchase.status === 'PENDING' &&
    groups.length > 0 &&
    groups.every(
      (group) => group.status === 'PENDING',
    )
  );
}

function getPurchaseProgress(purchase: Purchase) {
  const groups = getPurchaseGroups(purchase);

  const total = groups.length;

  const pending = groups.filter(
    (group) => group.status === 'PENDING',
  ).length;

  const received = groups.filter(
    (group) => group.status === 'RECEIVED',
  ).length;

  const cancelled = groups.filter(
    (group) => group.status === 'CANCELLED',
  ).length;

  const processed = received + cancelled;

  return {
    total,
    pending,
    received,
    cancelled,
    processed,
    percentage:
      total > 0 ? (processed / total) * 100 : 0,
  };
}

function groupDetailsByCategory(
  providerGroup: PurchaseProviderGroup,
): CategoryDetailGroup[] {
  const categoryMap = new Map<
    string,
    CategoryDetailGroup
  >();

  for (const detail of providerGroup.details || []) {
    const categoryId =
      detail.categoryId || 'without-category';

    const categoryName =
      detail.categoryName || 'Sin categoría';

    const existing = categoryMap.get(categoryId);

    if (existing) {
      existing.details.push(detail);
      existing.subtotal += Number(
        detail.subtotal || 0,
      );
    } else {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        details: [detail],
        subtotal: Number(detail.subtotal || 0),
      });
    }
  }

  return Array.from(categoryMap.values()).sort(
    (first, second) =>
      first.categoryName.localeCompare(
        second.categoryName,
      ),
  );
}

function isDateInsideRange(
  value: string,
  dateFrom: string,
  dateTo: string,
) {
  const currentDate = new Date(value);

  if (Number.isNaN(currentDate.getTime())) {
    return true;
  }

  if (dateFrom) {
    const minimumDate = new Date(
      `${dateFrom}T00:00:00`,
    );

    if (currentDate < minimumDate) {
      return false;
    }
  }

  if (dateTo) {
    const maximumDate = new Date(
      `${dateTo}T23:59:59.999`,
    );

    if (currentDate > maximumDate) {
      return false;
    }
  }

  return true;
}

export function PurchasesPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const returnState =
    location.state as ReturnToPurchaseState | null;
  const initialReturnState =
    returnState?.returnToPurchase
      ? returnState
      : null;

  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<PurchaseStatus | 'ALL'>('ALL');
  const [providerFilter, setProviderFilter] =
    useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [expandedPurchaseId, setExpandedPurchaseId] =
    useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(
    Boolean(initialReturnState),
  );
  const [selectedPurchase, setSelectedPurchase] =
    useState<Purchase | null>(null);
  const [initialDraft, setInitialDraft] =
    useState<PurchaseFormDraft | null>(
      initialReturnState?.purchaseDraft || null,
    );
  const [createdProductId, setCreatedProductId] =
    useState<string | null>(
      initialReturnState?.createdProductId || null,
    );
  const [resumePurchaseId, setResumePurchaseId] =
    useState<string | null>(
      initialReturnState?.purchaseId || null,
    );

  const [formError, setFormError] = useState<
    string | null
  >(null);

  const [actionError, setActionError] = useState<
    string | null
  >(null);

  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction>(null);

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

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesIsError,
    error: categoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  useEffect(() => {
    if (!returnState?.returnToPurchase) {
      return;
    }

    navigate('/purchases', {
      replace: true,
      state: null,
    });
  }, [navigate, returnState]);

  const purchaseForForm =
    selectedPurchase ||
    (resumePurchaseId
      ? purchases.find(
          (purchase) =>
            purchase.id === resumePurchaseId,
        ) || null
      : null);

  const filteredPurchases = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return purchases.filter((purchase) => {
      const groups = getPurchaseGroups(purchase);

      const searchableValues: Array<
        string | number | null | undefined
      > = [
        purchase.id,
        purchase.userName,
        purchase.observations,
        ...groups.flatMap((group) => [
          group.providerName,
          ...group.details.flatMap((detail) => [
            detail.productName,
            detail.categoryName,
          ]),
        ]),
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues
          .filter(
            (
              value,
            ): value is string | number =>
              value !== null &&
              value !== undefined,
          )
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(normalizedSearch),
          );

      const matchesStatus =
        statusFilter === 'ALL' ||
        purchase.status === statusFilter;

      const matchesProvider =
        providerFilter === 'ALL' ||
        groups.some(
          (group) =>
            group.providerId === providerFilter,
        );

      const matchesDate = isDateInsideRange(
        purchase.date,
        dateFrom,
        dateTo,
      );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProvider &&
        matchesDate
      );
    });
  }, [
    purchases,
    search,
    statusFilter,
    providerFilter,
    dateFrom,
    dateTo,
  ]);

  const summary = useMemo(() => {
    let pendingGroups = 0;
    let receivedGroups = 0;
    let receivedValue = 0;

    for (const purchase of purchases) {
      for (const group of getPurchaseGroups(
        purchase,
      )) {
        if (group.status === 'PENDING') {
          pendingGroups += 1;
        }

        if (group.status === 'RECEIVED') {
          receivedGroups += 1;
          receivedValue += Number(group.total || 0);
        }
      }
    }

    return {
      totalPurchases: purchases.length,

      pendingPurchases: purchases.filter(
        (purchase) =>
          purchase.status === 'PENDING',
      ).length,

      receivedPurchases: purchases.filter(
        (purchase) =>
          purchase.status === 'RECEIVED',
      ).length,

      cancelledPurchases: purchases.filter(
        (purchase) =>
          purchase.status === 'CANCELLED',
      ).length,

      pendingGroups,
      receivedGroups,
      receivedValue,
    };
  }, [purchases]);

  const refreshPurchasesAndProducts = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['purchases'],
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
    mutationFn: createPurchase,

    onSuccess: async () => {
      await refreshPurchasesAndProducts();

      setFormOpen(false);
      setSelectedPurchase(null);
      setInitialDraft(null);
      setCreatedProductId(null);
      setResumePurchaseId(null);
      setFormError(null);
      setActionError(null);
    },

    onError: (mutationError) => {
      setFormError(
        getErrorMessage(mutationError),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePurchaseRequest;
    }) => updatePurchase(id, data),

    onSuccess: async () => {
      await refreshPurchasesAndProducts();

      setFormOpen(false);
      setSelectedPurchase(null);
      setInitialDraft(null);
      setCreatedProductId(null);
      setResumePurchaseId(null);
      setFormError(null);
      setActionError(null);
    },

    onError: (mutationError) => {
      setFormError(
        getErrorMessage(mutationError),
      );
    },
  });

  const receiveProviderMutation = useMutation({
    mutationFn: ({
      purchaseId,
      providerGroupId,
    }: {
      purchaseId: string;
      providerGroupId: string;
    }) =>
      receivePurchaseProvider(
        purchaseId,
        providerGroupId,
      ),

    onSuccess: async () => {
      await refreshPurchasesAndProducts();

      setConfirmAction(null);
      setActionError(null);
    },

    onError: (mutationError) => {
      setActionError(
        getErrorMessage(mutationError),
      );
      setConfirmAction(null);
    },
  });

  const cancelProviderMutation = useMutation({
    mutationFn: ({
      purchaseId,
      providerGroupId,
    }: {
      purchaseId: string;
      providerGroupId: string;
    }) =>
      cancelPurchaseProvider(
        purchaseId,
        providerGroupId,
      ),

    onSuccess: async () => {
      await refreshPurchasesAndProducts();

      setConfirmAction(null);
      setActionError(null);
    },

    onError: (mutationError) => {
      setActionError(
        getErrorMessage(mutationError),
      );
      setConfirmAction(null);
    },
  });

  const cancelPurchaseMutation = useMutation({
    mutationFn: cancelPurchase,

    onSuccess: async () => {
      await refreshPurchasesAndProducts();

      setConfirmAction(null);
      setActionError(null);
    },

    onError: (mutationError) => {
      setActionError(
        getErrorMessage(mutationError),
      );
      setConfirmAction(null);
    },
  });

  const handleCreatePurchase = () => {
    setSelectedPurchase(null);
    setInitialDraft(null);
    setCreatedProductId(null);
    setResumePurchaseId(null);
    setFormError(null);
    setActionError(null);
    setFormOpen(true);
  };

  const handleEditPurchase = (
    purchase: Purchase,
  ) => {
    if (!canEditPurchase(purchase)) {
      setActionError(
        'La compra ya tiene proveedores recibidos o anulados y no puede editarse.',
      );
      return;
    }

    setSelectedPurchase(purchase);
    setInitialDraft(null);
    setCreatedProductId(null);
    setResumePurchaseId(null);
    setFormError(null);
    setActionError(null);
    setFormOpen(true);
  };

  const handleCreateNewProduct = (
    purchaseDraft: PurchaseFormDraft,
  ) => {
    const navigationState: CreateProductFromPurchaseState = {
      fromPurchase: true,
      purchaseDraft,
      purchaseId: purchaseForForm?.id || null,
    };

    navigate('/products', {
      state: navigationState,
    });
  };

  const handleSubmitPurchase = (
    data: CreatePurchaseRequest,
  ) => {
    if (purchaseForForm) {
      updateMutation.mutate({
        id: purchaseForForm.id,
        data,
      });

      return;
    }

    createMutation.mutate(data);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) {
      return;
    }

    if (
      confirmAction.kind ===
      'RECEIVE_PROVIDER'
    ) {
      receiveProviderMutation.mutate({
        purchaseId:
          confirmAction.purchase.id,
        providerGroupId:
          confirmAction.providerGroup.id,
      });

      return;
    }

    if (
      confirmAction.kind ===
      'CANCEL_PROVIDER'
    ) {
      cancelProviderMutation.mutate({
        purchaseId:
          confirmAction.purchase.id,
        providerGroupId:
          confirmAction.providerGroup.id,
      });

      return;
    }

    cancelPurchaseMutation.mutate(
      confirmAction.purchase.id,
    );
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setProviderFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters =
    Boolean(search) ||
    statusFilter !== 'ALL' ||
    providerFilter !== 'ALL' ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const actionLoading =
    receiveProviderMutation.isPending ||
    cancelProviderMutation.isPending ||
    cancelPurchaseMutation.isPending;

  const formLoading =
    createMutation.isPending ||
    updateMutation.isPending;

  if (
    purchasesLoading ||
    providersLoading ||
    productsLoading ||
    categoriesLoading
  ) {
    return (
      <Loading message="Cargando compras..." />
    );
  }

  if (purchasesIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          purchasesError,
        )}
      />
    );
  }

  if (providersIsError) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          providersError,
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

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          Gestión de Compras
        </Typography>

        <Typography color="text.secondary">
          Registro de compras con varios
          proveedores, recepción de mercadería
          y actualización de precios y stock.
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
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                TOTAL COMPRAS
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
              >
                {summary.totalPurchases}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Comprobantes registrados
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
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                COMPRAS PENDIENTES
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
              >
                {summary.pendingPurchases}
              </Typography>

              <Typography
                variant="caption"
                color="warning.main"
              >
                En proceso
              </Typography>
            </Box>

            <Avatar
              sx={{
                bgcolor: '#fff8e1',
                color: '#ef6c00',
              }}
            >
              <PendingActionsIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                PROVEEDORES PENDIENTES
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
              >
                {summary.pendingGroups}
              </Typography>

              <Typography
                variant="caption"
                color="warning.main"
              >
                Mercadería por recibir
              </Typography>
            </Box>

            <Avatar
              sx={{
                bgcolor: '#fff3e0',
                color: '#e65100',
              }}
            >
              <LocalShippingIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                COMPRAS RECIBIDAS
              </Typography>

              <Typography
                variant="h4"
                fontWeight={800}
              >
                {summary.receivedPurchases}
              </Typography>

              <Typography
                variant="caption"
                color="success.main"
              >
                Stock actualizado
              </Typography>
            </Box>

            <Avatar
              sx={{
                bgcolor: '#e8f5e9',
                color: '#2e7d32',
              }}
            >
              <WarehouseIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography
            variant="caption"
            fontWeight={800}
            color="text.secondary"
          >
            VALOR RECIBIDO
          </Typography>

          <Typography
            variant="h5"
            fontWeight={800}
          >
            {formatCurrency(
              summary.receivedValue,
            )}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Suma de proveedores recibidos
          </Typography>
        </Card>
      </Box>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tu rol permite consultar las compras.
          La creación, edición, recepción y
          anulación están reservadas para el
          administrador.
        </Alert>
      )}

      {actionError && (
        <Alert
          severity="error"
          onClose={() => setActionError(null)}
          sx={{ mb: 2 }}
        >
          {actionError}
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
              Listado de Compras
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Mostrando{' '}
              {filteredPurchases.length} de{' '}
              {purchases.length} compras
            </Typography>
          </Box>

          <Stack
            direction={{
              xs: 'column',
              md: 'row',
            }}
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              size="small"
              placeholder="Buscar compra..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              sx={{ minWidth: 210 }}
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
                  event.target.value as
                    | PurchaseStatus
                    | 'ALL',
                )
              }
              sx={{ minWidth: 145 }}
            >
              <MenuItem value="ALL">
                Todos
              </MenuItem>

              <MenuItem value="PENDING">
                Pendientes
              </MenuItem>

              <MenuItem value="RECEIVED">
                Recibidas
              </MenuItem>

              <MenuItem value="CANCELLED">
                Anuladas
              </MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Proveedor"
              value={providerFilter}
              onChange={(event) =>
                setProviderFilter(
                  event.target.value,
                )
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">
                Todos
              </MenuItem>

              {providers.map((provider) => (
                <MenuItem
                  key={provider.id}
                  value={provider.id}
                >
                  {provider.companyName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(event.target.value)
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
                setDateTo(event.target.value)
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
                variant="outlined"
                startIcon={<FilterAltOffIcon />}
                onClick={clearFilters}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Limpiar
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePurchase}
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
                <TableCell width={50} />

                <TableCell>
                  Compra
                </TableCell>

                <TableCell>
                  Proveedores
                </TableCell>

                <TableCell>
                  Estado
                </TableCell>

                <TableCell>
                  Progreso
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
              {filteredPurchases.length ===
                0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Alert severity="info">
                      No se encontraron compras
                      con los filtros seleccionados.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredPurchases.map(
                (purchase) => {
                  const groups =
                    getPurchaseGroups(purchase);

                  const statusStyle =
                    getStatusStyle(
                      purchase.status,
                    );

                  const progress =
                    getPurchaseProgress(
                      purchase,
                    );

                  const expanded =
                    expandedPurchaseId ===
                    purchase.id;

                  return (
                    <>
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
                          <Tooltip
                            title={
                              expanded
                                ? 'Ocultar detalle'
                                : 'Ver detalle'
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                setExpandedPurchaseId(
                                  expanded
                                    ? null
                                    : purchase.id,
                                )
                              }
                            >
                              {expanded ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </Tooltip>
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
                                width: 38,
                                height: 38,
                                bgcolor:
                                  statusStyle.backgroundColor,
                                color:
                                  statusStyle.color,
                              }}
                            >
                              <ReceiptLongIcon fontSize="small" />
                            </Avatar>

                            <Box>
                              <Typography
                                fontWeight={800}
                              >
                                Compra #
                                {purchase.id.slice(
                                  0,
                                  8,
                                )}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Registró:{' '}
                                {purchase.userName ||
                                  `Usuario ${purchase.userId}`}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                          >
                            {groups
                              .slice(0, 2)
                              .map((group) => (
                                <Chip
                                  key={group.id}
                                  size="small"
                                  label={
                                    group.providerName
                                  }
                                  variant="outlined"
                                />
                              ))}

                            {groups.length > 2 && (
                              <Chip
                                size="small"
                                label={`+${
                                  groups.length - 2
                                }`}
                              />
                            )}

                            {groups.length ===
                              0 && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Sin proveedores
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={getStatusLabel(
                              purchase.status,
                            )}
                            sx={{
                              bgcolor:
                                statusStyle.backgroundColor,
                              color:
                                statusStyle.color,
                              fontWeight: 800,
                            }}
                          />
                        </TableCell>

                        <TableCell
                          sx={{ minWidth: 170 }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {
                              progress.processed
                            }{' '}
                            de {progress.total}{' '}
                            proveedores procesados
                          </Typography>

                          <LinearProgress
                            variant="determinate"
                            value={
                              progress.percentage
                            }
                            sx={{
                              mt: 0.75,
                              height: 7,
                              borderRadius: 4,
                            }}
                          />

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Pendientes:{' '}
                            {progress.pending} ·
                            Recibidos:{' '}
                            {progress.received} ·
                            Anulados:{' '}
                            {progress.cancelled}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={900}
                          >
                            {formatCurrency(
                              purchase.total,
                            )}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(
                              purchase.date,
                            )}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          {purchase.pdfUrl && (
                            <Tooltip title="Abrir comprobante PDF">
                              <IconButton
                                size="small"
                                component="a"
                                href={getPdfUrl(
                                  purchase.pdfUrl,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {isAdmin &&
                            canEditPurchase(
                              purchase,
                            ) && (
                              <Tooltip title="Editar compra">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleEditPurchase(
                                      purchase,
                                    )
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

                          {isAdmin &&
                            purchase.status !==
                              'CANCELLED' && (
                              <Tooltip title="Anular compra completa">
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={
                                    actionLoading
                                  }
                                  onClick={() =>
                                    setConfirmAction(
                                      {
                                        kind: 'CANCEL_PURCHASE',
                                        purchase,
                                      },
                                    )
                                  }
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                        </TableCell>
                      </TableRow>

                      <TableRow
                        key={`${purchase.id}-detail`}
                      >
                        <TableCell
                          colSpan={8}
                          sx={{
                            py: 0,
                            borderBottom:
                              expanded
                                ? undefined
                                : 'none',
                          }}
                        >
                          <Collapse
                            in={expanded}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                py: 2,
                                px: {
                                  xs: 0,
                                  md: 2,
                                },
                              }}
                            >
                              {purchase.observations && (
                                <Alert
                                  severity="info"
                                  sx={{ mb: 2 }}
                                >
                                  <strong>
                                    Observación:
                                  </strong>{' '}
                                  {
                                    purchase.observations
                                  }
                                </Alert>
                              )}

                              <Stack spacing={2}>
                                {groups.map(
                                  (
                                    providerGroup,
                                  ) => {
                                    const providerStatusStyle =
                                      getStatusStyle(
                                        providerGroup.status,
                                      );

                                    const categoryGroups =
                                      groupDetailsByCategory(
                                        providerGroup,
                                      );

                                    return (
                                      <Paper
                                        key={
                                          providerGroup.id
                                        }
                                        variant="outlined"
                                        sx={{
                                          overflow:
                                            'hidden',
                                        }}
                                      >
                                        <Stack
                                          direction={{
                                            xs: 'column',
                                            md: 'row',
                                          }}
                                          justifyContent="space-between"
                                          alignItems={{
                                            xs: 'stretch',
                                            md: 'center',
                                          }}
                                          spacing={1.5}
                                          sx={{
                                            px: 2,
                                            py: 1.5,
                                            bgcolor:
                                              '#f7f9fb',
                                          }}
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={1.5}
                                            alignItems="center"
                                          >
                                            <Avatar
                                              variant="rounded"
                                              sx={{
                                                bgcolor:
                                                  providerStatusStyle.backgroundColor,
                                                color:
                                                  providerStatusStyle.color,
                                              }}
                                            >
                                              <LocalShippingIcon />
                                            </Avatar>

                                            <Box>
                                              <Typography
                                                fontWeight={
                                                  900
                                                }
                                              >
                                                {
                                                  providerGroup.providerName
                                                }
                                              </Typography>

                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Total:{' '}
                                                {formatCurrency(
                                                  providerGroup.total,
                                                )}
                                              </Typography>
                                            </Box>

                                            <Chip
                                              size="small"
                                              label={getStatusLabel(
                                                providerGroup.status,
                                              )}
                                              sx={{
                                                bgcolor:
                                                  providerStatusStyle.backgroundColor,
                                                color:
                                                  providerStatusStyle.color,
                                                fontWeight:
                                                  800,
                                              }}
                                            />
                                          </Stack>

                                          <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                          >
                                            {providerGroup.receivedAt && (
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Recibido:{' '}
                                                {formatDate(
                                                  providerGroup.receivedAt,
                                                )}
                                              </Typography>
                                            )}

                                            {providerGroup.cancelledAt && (
                                              <Typography
                                                variant="caption"
                                                color="text.secondary"
                                              >
                                                Anulado:{' '}
                                                {formatDate(
                                                  providerGroup.cancelledAt,
                                                )}
                                              </Typography>
                                            )}

                                            {isAdmin &&
                                              providerGroup.status ===
                                                'PENDING' && (
                                                <Button
                                                  size="small"
                                                  variant="contained"
                                                  color="success"
                                                  startIcon={
                                                    <CheckCircleIcon />
                                                  }
                                                  disabled={
                                                    actionLoading
                                                  }
                                                  onClick={() =>
                                                    setConfirmAction(
                                                      {
                                                        kind: 'RECEIVE_PROVIDER',
                                                        purchase,
                                                        providerGroup,
                                                      },
                                                    )
                                                  }
                                                  sx={{
                                                    textTransform:
                                                      'none',
                                                    fontWeight:
                                                      800,
                                                  }}
                                                >
                                                  Recibir
                                                </Button>
                                              )}

                                            {isAdmin &&
                                              providerGroup.status !==
                                                'CANCELLED' && (
                                                <Button
                                                  size="small"
                                                  variant="outlined"
                                                  color="error"
                                                  startIcon={
                                                    <CancelIcon />
                                                  }
                                                  disabled={
                                                    actionLoading
                                                  }
                                                  onClick={() =>
                                                    setConfirmAction(
                                                      {
                                                        kind: 'CANCEL_PROVIDER',
                                                        purchase,
                                                        providerGroup,
                                                      },
                                                    )
                                                  }
                                                  sx={{
                                                    textTransform:
                                                      'none',
                                                    fontWeight:
                                                      800,
                                                  }}
                                                >
                                                  Anular
                                                </Button>
                                              )}
                                          </Stack>
                                        </Stack>

                                        <Box
                                          sx={{
                                            p: 2,
                                          }}
                                        >
                                          <Stack spacing={2}>
                                            {categoryGroups.map(
                                              (
                                                categoryGroup,
                                              ) => (
                                                <Box
                                                  key={
                                                    categoryGroup.categoryId
                                                  }
                                                >
                                                  <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    sx={{
                                                      mb: 1,
                                                    }}
                                                  >
                                                    <Typography
                                                      fontWeight={
                                                        800
                                                      }
                                                    >
                                                      Categoría:{' '}
                                                      {
                                                        categoryGroup.categoryName
                                                      }
                                                    </Typography>

                                                    <Typography
                                                      fontWeight={
                                                        800
                                                      }
                                                      color="primary.main"
                                                    >
                                                      Subtotal:{' '}
                                                      {formatCurrency(
                                                        categoryGroup.subtotal,
                                                      )}
                                                    </Typography>
                                                  </Stack>

                                                  <TableContainer>
                                                    <Table
                                                      size="small"
                                                    >
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
                                                            unitario
                                                          </TableCell>

                                                          <TableCell align="right">
                                                            Subtotal
                                                          </TableCell>
                                                        </TableRow>
                                                      </TableHead>

                                                      <TableBody>
                                                        {categoryGroup.details.map(
                                                          (
                                                            detail,
                                                          ) => (
                                                            <TableRow
                                                              key={
                                                                detail.id ||
                                                                detail.productId
                                                              }
                                                            >
                                                              <TableCell>
                                                                <Typography
                                                                  fontWeight={
                                                                    700
                                                                  }
                                                                >
                                                                  {
                                                                    detail.productName
                                                                  }
                                                                </Typography>
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
                                                </Box>
                                              ),
                                            )}
                                          </Stack>
                                        </Box>
                                      </Paper>
                                    );
                                  },
                                )}

                                {groups.length ===
                                  0 && (
                                  <Alert severity="warning">
                                    La compra no tiene
                                    proveedores registrados.
                                  </Alert>
                                )}
                              </Stack>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  );
                },
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PurchaseFormDialog
        open={formOpen}
        purchase={purchaseForForm}
        providers={providers}
        categories={categories}
        products={products}
        canCreateProduct={isAdmin}
        initialDraft={initialDraft}
        createdProductId={createdProductId}
        loading={formLoading}
        error={formError}
        onClose={() => {
          if (formLoading) {
            return;
          }

          setFormOpen(false);
          setSelectedPurchase(null);
          setInitialDraft(null);
          setCreatedProductId(null);
          setResumePurchaseId(null);
          setFormError(null);
        }}
        onCreateNewProduct={handleCreateNewProduct}
        onSubmit={handleSubmitPurchase}
      />

      <Dialog
        open={Boolean(confirmAction)}
        onClose={
          actionLoading
            ? undefined
            : () => setConfirmAction(null)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {confirmAction?.kind ===
          'RECEIVE_PROVIDER'
            ? 'Recibir mercadería'
            : confirmAction?.kind ===
                'CANCEL_PROVIDER'
              ? 'Anular proveedor'
              : 'Anular compra completa'}
        </DialogTitle>

        <DialogContent>
          <DialogContentText
            component="div"
            sx={{ color: 'text.primary' }}
          >
            {confirmAction?.kind ===
              'RECEIVE_PROVIDER' && (
              <>
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
                >
                  Esta acción aumentará el stock y
                  actualizará el precio de compra y
                  todos los precios de venta de los
                  productos.
                </Alert>

                <Typography>
                  ¿Confirmas que recibiste la
                  mercadería del proveedor{' '}
                  <strong>
                    {
                      confirmAction.providerGroup
                        .providerName
                    }
                  </strong>
                  ?
                </Typography>

                <Typography
                  sx={{ mt: 1 }}
                  fontWeight={800}
                >
                  Total:{' '}
                  {formatCurrency(
                    confirmAction.providerGroup
                      .total,
                  )}
                </Typography>
              </>
            )}

            {confirmAction?.kind ===
              'CANCEL_PROVIDER' && (
              <>
                {confirmAction.providerGroup
                  .status === 'RECEIVED' ? (
                  <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                  >
                    El proveedor ya fue recibido.
                    Al anularlo se descontará del
                    stock la mercadería registrada.
                  </Alert>
                ) : (
                  <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                  >
                    El proveedor será retirado del
                    total activo de la compra.
                  </Alert>
                )}

                <Typography>
                  ¿Confirmas la anulación del
                  proveedor{' '}
                  <strong>
                    {
                      confirmAction.providerGroup
                        .providerName
                    }
                  </strong>
                  ?
                </Typography>
              </>
            )}

            {confirmAction?.kind ===
              'CANCEL_PURCHASE' && (
              <>
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                >
                  La compra completa será anulada.
                  Los proveedores recibidos
                  descontarán nuevamente sus
                  cantidades del stock.
                </Alert>

                <Typography>
                  ¿Confirmas la anulación de la
                  compra{' '}
                  <strong>
                    #
                    {confirmAction.purchase.id.slice(
                      0,
                      8,
                    )}
                  </strong>
                  ?
                </Typography>
              </>
            )}
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() =>
              setConfirmAction(null)
            }
            disabled={actionLoading}
          >
            Volver
          </Button>

          <Button
            variant="contained"
            color={
              confirmAction?.kind ===
              'RECEIVE_PROVIDER'
                ? 'success'
                : 'error'
            }
            onClick={handleConfirmAction}
            disabled={actionLoading}
          >
            {actionLoading
              ? 'Procesando...'
              : confirmAction?.kind ===
                  'RECEIVE_PROVIDER'
                ? 'Confirmar recepción'
                : 'Confirmar anulación'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
