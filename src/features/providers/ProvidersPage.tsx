import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
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
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProvider,
  deleteProvider,
  getProviders,
  updateProvider,
} from '../../api/providers.api';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useAuth } from '../auth/AuthContext';
import type {
  CreateProviderRequest,
  Provider,
} from '../../types/provider.types';
import { ProviderFormDialog } from './ProviderFormDialog';
import { formatDate } from '../../utils/formatDate';

function getErrorMessage(error: unknown) {
  const anyError = error as any;

  const message = anyError?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (anyError?.response?.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (anyError?.response?.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (anyError?.message) {
    return anyError.message;
  }

  return 'Ocurrió un error inesperado.';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function getProviderProductsCount(provider: Provider) {
  if (typeof provider._count?.products === 'number') {
    return provider._count.products;
  }

  if (Array.isArray(provider.products)) {
    return provider.products.length;
  }

  return 0;
}

function getProviderPurchasesCount(provider: Provider) {
  if (typeof provider._count?.purchases === 'number') {
    return provider._count.purchases;
  }

  if (Array.isArray(provider.purchases)) {
    return provider.purchases.length;
  }

  return 0;
}

export function ProvidersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: providers = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['providers'],
    queryFn: getProviders,
  });

  const filteredProviders = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) {
      return providers;
    }

    return providers.filter((provider) => {
      return [
        provider.companyName,
        provider.contactName,
        provider.email,
        provider.phone,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text));
    });
  }, [providers, search]);

  const totalProducts = useMemo(() => {
    return providers.reduce(
      (sum, provider) => sum + getProviderProductsCount(provider),
      0,
    );
  }, [providers]);

  const totalPurchases = useMemo(() => {
    return providers.reduce(
      (sum, provider) => sum + getProviderPurchasesCount(provider),
      0,
    );
  }, [providers]);

  const providersWithEmail = useMemo(() => {
    return providers.filter((provider) => provider.email).length;
  }, [providers]);

  const createMutation = useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setDialogOpen(false);
      setSelectedProvider(null);
      setFormError(null);
    },
    onError: (mutationError) => {
      setFormError(getErrorMessage(mutationError));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateProviderRequest;
    }) => updateProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setDialogOpen(false);
      setSelectedProvider(null);
      setFormError(null);
    },
    onError: (mutationError) => {
      setFormError(getErrorMessage(mutationError));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
    onError: (mutationError) => {
      alert(getErrorMessage(mutationError));
    },
  });

  const handleCreate = () => {
    setSelectedProvider(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleDelete = (provider: Provider) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el proveedor "${provider.companyName}"?`,
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(provider.id);
  };

  const handleSubmit = (data: CreateProviderRequest) => {
    if (selectedProvider) {
      updateMutation.mutate({
        id: selectedProvider.id,
        data,
      });

      return;
    }

    createMutation.mutate(data);
  };

  const formLoading = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <Loading message="Cargando proveedores..." />;
  }

  if (isError) {
    return <ErrorMessage message={getErrorMessage(error)} />;
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Gestión de Proveedores
        </Typography>

        <Typography color="text.secondary">
          Control de suministros, logística y contactos comerciales.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                TOTAL PROVEEDORES
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {providers.length}
              </Typography>
              <Typography variant="caption" color="success.main">
                Registrados en el sistema
              </Typography>
            </Box>

            <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}>
              <BusinessIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                PRODUCTOS ASOCIADOS
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {totalProducts}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Productos vinculados
              </Typography>
            </Box>

            <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}>
              <WarehouseIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                COMPRAS
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {totalPurchases}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Operaciones registradas
              </Typography>
            </Box>

            <Avatar sx={{ bgcolor: '#fff3e0', color: '#ef6c00' }}>
              <ShoppingCartIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                CON CORREO
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {providersWithEmail}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Contacto digital disponible
              </Typography>
            </Box>

            <Avatar sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2' }}>
              <EmailIcon />
            </Avatar>
          </Stack>
        </Card>
      </Box>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tu rol permite consultar proveedores. La creación, edición y eliminación
          están reservadas para administradores.
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
              Listado de Proveedores
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredProviders.length} de {providers.length} proveedores
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar proveedor..."
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

            {isAdmin && (
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
                Nuevo proveedor
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
                <TableCell>Nombre</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Comunicación</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell>Compras</TableCell>
                <TableCell>Fecha registro</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredProviders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="info">
                      No se encontraron proveedores con el criterio de búsqueda.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredProviders.map((provider) => (
                <TableRow
                  key={provider.id}
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
                          width: 36,
                          height: 36,
                          bgcolor: '#e8f5e9',
                          color: '#005b3f',
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {getInitials(provider.companyName)}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={800}>
                          {provider.companyName}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          ID: {provider.id.slice(0, 8)}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography fontWeight={600}>
                      {provider.contactName || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {provider.email || '-'}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <LocalPhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {provider.phone || '-'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={getProviderProductsCount(provider)}
                      sx={{
                        bgcolor: '#e3f2fd',
                        color: '#1565c0',
                        fontWeight: 700,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={getProviderPurchasesCount(provider)}
                      sx={{
                        bgcolor: '#fff3e0',
                        color: '#ef6c00',
                        fontWeight: 700,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(provider.createdAt)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title={isAdmin ? 'Editar' : 'Solo administrador'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!isAdmin}
                          onClick={() => handleEdit(provider)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title={isAdmin ? 'Eliminar' : 'Solo administrador'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={!isAdmin || deleteMutation.isPending}
                          onClick={() => handleDelete(provider)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ProviderFormDialog
        open={dialogOpen}
        provider={selectedProvider}
        loading={formLoading}
        error={formError}
        onClose={() => {
          setDialogOpen(false);
          setSelectedProvider(null);
          setFormError(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}