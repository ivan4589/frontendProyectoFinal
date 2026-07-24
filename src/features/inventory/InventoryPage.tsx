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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  generateCentralInventoryPdf,
  getCentralInventory,
} from '../../api/inventory.api';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';

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

function openPdf(pdfUrl: string) {
  const absoluteUrl =
    pdfUrl.startsWith('http://') ||
    pdfUrl.startsWith('https://')
      ? pdfUrl
      : `${
          import.meta.env.VITE_API_URL ||
          'http://localhost:3000'
        }${pdfUrl}`;

  window.open(
    absoluteUrl,
    '_blank',
    'noopener,noreferrer',
  );
}

export function InventoryPage() {
  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'central'],
    queryFn: getCentralInventory,
  });
  const pdfMutation = useMutation({
    mutationFn: generateCentralInventoryPdf,
    onSuccess: (result) => openPdf(result.pdfUrl),
  });

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

      {inventory.providers.length === 0 ? (
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
            No hay productos con stock
          </Typography>
          <Typography>
            Solo se muestran productos con existencias
            mayores que cero en el Almacén Central.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {inventory.providers.map(
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

                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>
                                    Código
                                  </TableCell>
                                  <TableCell>
                                    Producto
                                  </TableCell>
                                  <TableCell align="right">
                                    Stock actual
                                  </TableCell>
                                  <TableCell align="right">
                                    Reservado
                                  </TableCell>
                                  <TableCell align="right">
                                    Disponible
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {category.products.map(
                                  (product) => (
                                    <TableRow
                                      key={
                                        product.productId
                                      }
                                      hover
                                    >
                                      <TableCell>
                                        <Typography
                                          component="code"
                                          variant="body2"
                                        >
                                          {product.code}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        {product.name}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatQuantity(
                                          product.stock,
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatQuantity(
                                          product.reservedStock,
                                        )}
                                      </TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          color={
                                            product.availableStock >
                                            0
                                              ? 'success'
                                              : 'default'
                                          }
                                          label={formatQuantity(
                                            product.availableStock,
                                          )}
                                          size="small"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ),
                                )}
                                <TableRow
                                  sx={{
                                    bgcolor:
                                      'background.default',
                                  }}
                                >
                                  <TableCell
                                    colSpan={2}
                                    sx={{
                                      fontWeight: 800,
                                    }}
                                  >
                                    Subtotal{' '}
                                    {category.categoryName}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{
                                      fontWeight: 800,
                                    }}
                                  >
                                    {formatQuantity(
                                      category.totalStock,
                                    )}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{
                                      fontWeight: 800,
                                    }}
                                  >
                                    {formatQuantity(
                                      category.totalReservedStock,
                                    )}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{
                                      fontWeight: 800,
                                    }}
                                  >
                                    {formatQuantity(
                                      category.totalAvailableStock,
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
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
