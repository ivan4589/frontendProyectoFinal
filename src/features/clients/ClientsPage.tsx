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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from '../../api/clients.api';
import {
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from '../../api/locations.api';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import type {
  Client,
  ClientType,
  CreateClientRequest,
  Location,
} from '../../types/client.types';
import { formatDate } from '../../utils/formatDate';
import { ClientFormDialog } from './ClientFormDialog';
import { LocationsDialog } from './LocationsDialog';

function getErrorMessage(error: unknown) {
  const anyError = error as any;

  const message = anyError?.response?.data?.message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;

  if (anyError?.response?.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (anyError?.response?.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (anyError?.message) return anyError.message;

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

function getClientTypeLabel(type: ClientType) {
  const labels: Record<ClientType, string> = {
    NORMAL: 'Normal',
    ESPECIAL: 'Especial',
    CAMINO: 'Camino',
  };

  return labels[type] || type;
}

function getClientTypeColor(type: ClientType) {
  const colors: Record<ClientType, { bg: string; color: string }> = {
    NORMAL: {
      bg: '#e3f2fd',
      color: '#1565c0',
    },
    ESPECIAL: {
      bg: '#f3e5f5',
      color: '#7b1fa2',
    },
    CAMINO: {
      bg: '#fff3e0',
      color: '#ef6c00',
    },
  };

  return colors[type] || colors.NORMAL;
}

function getLocationName(client: Client, locations: Location[]) {
  if (client.location?.name) return client.location.name;

  return locations.find((location) => location.id === client.locationId)?.name || '-';
}

function getSalesCount(client: Client) {
  if (typeof client._count?.sales === 'number') return client._count.sales;
  if (Array.isArray(client.sales)) return client.sales.length;
  return 0;
}

export function ClientsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ClientType | 'ALL'>('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [locationsDialogOpen, setLocationsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
    data: locations = [],
    isLoading: locationsLoading,
    isError: locationsIsError,
    error: locationsError,
  } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });

  const filteredClients = useMemo(() => {
    const text = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesText =
        !text ||
        [
          client.fullName,
          client.alias,
          client.phone,
          client.additionalInfo,
          getLocationName(client, locations),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text));

      const matchesType = typeFilter === 'ALL' || client.type === typeFilter;
      const matchesLocation =
        locationFilter === 'ALL' || client.locationId === locationFilter;

      return matchesText && matchesType && matchesLocation;
    });
  }, [clients, locations, search, typeFilter, locationFilter]);

  const summary = useMemo(() => {
    return {
      total: clients.length,
      normal: clients.filter((client) => client.type === 'NORMAL').length,
      especial: clients.filter((client) => client.type === 'ESPECIAL').length,
      camino: clients.filter((client) => client.type === 'CAMINO').length,
      locations: locations.length,
    };
  }, [clients, locations]);

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setClientDialogOpen(false);
      setSelectedClient(null);
      setClientFormError(null);
    },
    onError: (mutationError) => {
      setClientFormError(getErrorMessage(mutationError));
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateClientRequest }) =>
      updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setClientDialogOpen(false);
      setSelectedClient(null);
      setClientFormError(null);
    },
    onError: (mutationError) => {
      setClientFormError(getErrorMessage(mutationError));
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (mutationError) => {
      alert(getErrorMessage(mutationError));
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setLocationError(null);
    },
    onError: (mutationError) => {
      setLocationError(getErrorMessage(mutationError));
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateLocation(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setLocationError(null);
    },
    onError: (mutationError) => {
      setLocationError(getErrorMessage(mutationError));
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setLocationError(null);
    },
    onError: (mutationError) => {
      setLocationError(getErrorMessage(mutationError));
    },
  });

  const handleCreateClient = () => {
    setSelectedClient(null);
    setClientFormError(null);
    setClientDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientFormError(null);
    setClientDialogOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el cliente "${client.fullName}"?`,
    );

    if (!confirmed) return;

    deleteClientMutation.mutate(client.id);
  };

  const handleSubmitClient = (data: CreateClientRequest) => {
    if (selectedClient) {
      updateClientMutation.mutate({
        id: selectedClient.id,
        data,
      });
      return;
    }

    createClientMutation.mutate(data);
  };

  const handleDeleteLocation = (location: Location) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar la localidad "${location.name}"? Si tiene clientes asociados, el backend puede bloquear la eliminación.`,
    );

    if (!confirmed) return;

    deleteLocationMutation.mutate(location.id);
  };

  const clientFormLoading =
    createClientMutation.isPending || updateClientMutation.isPending;

  const locationsLoadingState =
    createLocationMutation.isPending ||
    updateLocationMutation.isPending ||
    deleteLocationMutation.isPending;

  if (clientsLoading || locationsLoading) {
    return <Loading message="Cargando clientes..." />;
  }

  if (clientsIsError) {
    return <ErrorMessage message={getErrorMessage(clientsError)} />;
  }

  if (locationsIsError) {
    return <ErrorMessage message={getErrorMessage(locationsError)} />;
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Gestión de Clientes
        </Typography>

        <Typography color="text.secondary">
          Administración de clientes, tipos comerciales y localidades de venta.
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
                TOTAL CLIENTES
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {summary.total}
              </Typography>
              <Typography variant="caption" color="success.main">
                Registrados
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}>
              <PeopleIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            NORMALES
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.normal}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Precio normal
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            ESPECIALES
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.especial}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Precio especial
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            CAMINO
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.camino}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ruta / viaje
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                LOCALIDADES
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {summary.locations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Zonas registradas
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}>
              <LocationOnIcon />
            </Avatar>
          </Stack>
        </Card>
      </Box>

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
              Listado de Clientes
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredClients.length} de {clients.length} clientes
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar cliente..."
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
              label="Tipo"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as ClientType | 'ALL')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="NORMAL">Normal</MenuItem>
              <MenuItem value="ESPECIAL">Especial</MenuItem>
              <MenuItem value="CAMINO">Camino</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Localidad"
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">Todas</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              startIcon={<ManageSearchIcon />}
              onClick={() => setLocationsDialogOpen(true)}
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              Localidades
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateClient}
              sx={{
                backgroundColor: '#005b3f',
                fontWeight: 800,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#00432f',
                },
              }}
            >
              Nuevo cliente
            </Button>
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
                <TableCell>Cliente</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Localidad</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Ventas</TableCell>
                <TableCell>Registro</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="info">
                      No se encontraron clientes con los filtros seleccionados.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredClients.map((client) => {
                const typeColor = getClientTypeColor(client.type);

                return (
                  <TableRow
                    key={client.id}
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
                          {getInitials(client.fullName)}
                        </Avatar>

                        <Box>
                          <Typography fontWeight={800}>{client.fullName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {client.alias || `ID: ${client.id.slice(0, 8)}`}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={getClientTypeLabel(client.type)}
                        sx={{
                          bgcolor: typeColor.bg,
                          color: typeColor.color,
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <LocationOnIcon fontSize="small" color="success" />
                        <Typography variant="body2">
                          {getLocationName(client, locations)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {client.phone || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={getSalesCount(client)}
                        sx={{
                          bgcolor: '#e3f2fd',
                          color: '#1565c0',
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(client.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditClient(client)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deleteClientMutation.isPending}
                          onClick={() => handleDeleteClient(client)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ClientFormDialog
        open={clientDialogOpen}
        client={selectedClient}
        locations={locations}
        loading={clientFormLoading}
        error={clientFormError}
        onClose={() => {
          setClientDialogOpen(false);
          setSelectedClient(null);
          setClientFormError(null);
        }}
        onSubmit={handleSubmitClient}
      />

      <LocationsDialog
        open={locationsDialogOpen}
        locations={locations}
        loading={locationsLoadingState}
        error={locationError}
        onClose={() => {
          setLocationsDialogOpen(false);
          setLocationError(null);
        }}
        onCreate={(name) => createLocationMutation.mutate({ name })}
        onUpdate={(id, name) => updateLocationMutation.mutate({ id, name })}
        onDelete={handleDeleteLocation}
      />
    </>
  );
}