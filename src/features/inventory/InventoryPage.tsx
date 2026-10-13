import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adjustInventory,
  generateCentralInventoryPdf,
  getCentralInventory,
} from '../../api/inventory.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { downloadProtectedDocument } from '../../api/documents.api';
import { Loading } from '../../components/common/Loading';
import { useAuth } from '../auth/AuthContext';
import { requestEconomicReason, requestInventoryQuantityChange } from '../../utils/economicOperation';
import { useState } from 'react';
import { InventorySubcategory } from './InventorySubcategory';
import { filterInventoryProviders } from './inventoryGrouping';

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

  return typeof message === 'string'
    ? message
    : requestError.message ||
        'No se pudo consultar el inventario.';
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 3,
  }).format(value);
}

export function InventoryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'central'],
    queryFn: getCentralInventory,
  });
  const pdfMutation = useMutation({
    mutationFn: async () => {
      const result = await generateCentralInventoryPdf();
      await downloadProtectedDocument(
        result.pdfUrl,
        'inventario-central.pdf',
      );
    },
  });
  const adjustmentMutation = useMutation({
    mutationFn: adjustInventory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['warehouses'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });

  const handleAdjustment = (warehouseId: string, productId: string, name: string) => {
    const quantityChange = requestInventoryQuantityChange();
    if (quantityChange === null) return;
    const reason = requestEconomicReason(`ajustar el inventario de ${name}`);
    if (!reason) return;
    adjustmentMutation.mutate({ warehouseId, productId, quantityChange, reason });
  };

  if (inventoryQuery.isLoading) {
    return (
      <Loading message="Consultando el Almacén Central..." />
    );
  }

  if (
    inventoryQuery.isError ||
    !inventoryQuery.data
  ) {
    return (
      <ErrorMessage
        message={getErrorMessage(
          inventoryQuery.error,
        )}
      />
    );
  }

  const inventory = inventoryQuery.data;
  const providers = filterInventoryProviders(inventory.providers, search);
  const summaries = [
    {
      label: 'Productos',
      value: inventory.totalProducts,
      color: '#07553d',
    },
    {
      label: 'Stock actual',
      value: inventory.totalStock,
      color: '#1565c0',
    },
    {
      label: 'Reservado',
      value: inventory.totalReservedStock,
      color: '#ed6c02',
    },
    {
      label: 'Disponible',
      value: inventory.totalAvailableStock,
      color: '#2e7d32',
    },
  ];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          alignItems: {
            xs: 'stretch',
            md: 'center',
          },
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center' }}
        >
          <WarehouseIcon
            color="primary"
            sx={{ fontSize: 36 }}
          />
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800 }}
            >
              Inventario
            </Typography>
            <Typography color="text.secondary">
              Existencias exclusivas del{' '}
              {inventory.warehouse.name}
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => pdfMutation.mutate()}
          disabled={pdfMutation.isPending}
        >
          {pdfMutation.isPending
            ? 'Generando PDF...'
            : 'Generar PDF'}
        </Button>
      </Stack>

      {pdfMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(pdfMutation.error)}
        </Alert>
      )}
      {adjustmentMutation.isError && (
        <Alert severity="error">
          {getErrorMessage(adjustmentMutation.error)}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {summaries.map((summary) => (
          <Card key={summary.label}>
            <CardContent>
              <Typography
                color="text.secondary"
                variant="body2"
              >
                {summary.label}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  color: summary.color,
                  fontWeight: 800,
                  mt: 0.5,
                }}
              >
                {formatQuantity(summary.value)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <TextField label="Buscar por código, producto o subcategoría" value={search}
        onChange={event => setSearch(event.target.value)} fullWidth />
      {providers.length === 0 ? (
        <Paper
          sx={{
            color: 'text.secondary',
            p: 6,
            textAlign: 'center',
          }}
        >
          <Inventory2Icon
            sx={{ fontSize: 52, mb: 1 }}
          />
          <Typography variant="h6">
            {search ? 'No hay productos que coincidan con la búsqueda' : 'No hay productos con stock'}
          </Typography>
          <Typography>
            Solo se muestran productos con existencias
            mayores que cero en el Almacén Central.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {providers.map(
            (provider) => (
              <Accordion
                key={provider.providerId}
                defaultExpanded
                disableGutters
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: '#07553d',
                    color: 'common.white',
                    '& .MuiAccordionSummary-expandIconWrapper':
                      {
                        color: 'common.white',
                      },
                  }}
                >
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    spacing={1.5}
                    sx={{
                      alignItems: {
                        xs: 'flex-start',
                        sm: 'center',
                      },
                      width: '100%',
                    }}
                  >
                    <LocalShippingIcon />
                    <Typography
                      sx={{ fontWeight: 800 }}
                    >
                      {provider.providerName}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${provider.totalProducts} productos`}
                      sx={{
                        bgcolor:
                          'rgba(255,255,255,0.18)',
                        color: 'common.white',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        ml: {
                          sm: 'auto !important',
                        },
                      }}
                    >
                      Disponible:{' '}
                      <strong>
                        {formatQuantity(
                          provider.totalAvailableStock,
                        )}
                      </strong>
                    </Typography>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails
                  sx={{ p: { xs: 1, md: 2 } }}
                >
                  <Stack spacing={2}>
                    {provider.categories.map(
                      (category) => (
                        <Paper
                          key={category.categoryId}
                          variant="outlined"
                        >
                          <Box
                            sx={{
                              alignItems: 'center',
                              bgcolor:
                                'background.default',
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              px: 2,
                              py: 1.5,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 750,
                              }}
                            >
                              {category.categoryName}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              variant="body2"
                            >
                              {category.products.length}{' '}
                              productos
                            </Typography>
                          </Box>
                          <Divider />

                          {category.subCategories!.map(group => (
                            <InventorySubcategory key={group.subCategoryId ?? 'none'} group={group}
                              idPrefix={provider.providerId + '-' + category.categoryId}
                              isAdmin={isAdmin} loading={adjustmentMutation.isPending}
                              onAdjust={(productId, name) => handleAdjustment(inventory.warehouse.id, productId, name)} />
                          ))}
                          <Box sx={{ px: 2, py: 1.5 }}>
                            Subtotal {category.categoryName}: Stock actual {formatQuantity(category.totalStock)} · Reservado {formatQuantity(category.totalReservedStock)} · Disponible {formatQuantity(category.totalAvailableStock)}
                          </Box>
                        </Paper>
                      ),
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ),
          )}
        </Stack>
      )}
    </Stack>
  );
}
