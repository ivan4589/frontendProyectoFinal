import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { createClient } from '../../api/clients.api';
import { getLocations } from '../../api/locations.api';
import { ClientFormDialog } from '../clients/ClientFormDialog';

import type {
  Client,
  ClientType,
  CreateClientRequest,
} from '../../types/client.types';

import type {
  Category,
  Product,
  SubCategory,
} from '../../types/product.types';

import type { UserRole } from '../../types/auth.types';

import type {
  CreateSaleRequest,
  PaymentMethod,
  Sale,
  SaleType,
} from '../../types/sale.types';

import { formatCurrency } from '../../utils/formatCurrency';

interface SaleFormDialogProps {
  open: boolean;
  sale?: Sale | null;
  clients: Client[];
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  userRole?: UserRole;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (
    data: CreateSaleRequest,
  ) => void;
}

interface DraftSaleDetail {
  productId: string;
  quantity: number;
  unitPrice: number;
  manualPrice: boolean;
}

type SaleModality =
  | 'PENDING_PAYMENT'
  | 'CASH'
  | 'CREDIT';

const paymentMethods: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  {
    value: 'CASH',
    label: 'Efectivo',
  },
  {
    value: 'QR',
    label: 'QR',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Transferencia bancaria',
  },
];

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getToday() {
  return getDateInputValue(new Date());
}

function getMaximumCreditDate() {
  const maximumDate = new Date();
  maximumDate.setDate(
    maximumDate.getDate() + 7,
  );

  return getDateInputValue(maximumDate);
}

function getAutomaticPrice(
  product: Product,
  clientType: ClientType,
  quantity: number,
) {
  if (
    clientType === 'NORMAL' &&
    product.priceMayorista !== null &&
    product.priceMayorista !== undefined &&
    product.minQuantityWholesale !== null &&
    product.minQuantityWholesale !==
      undefined &&
    quantity >=
      product.minQuantityWholesale
  ) {
    return product.priceMayorista;
  }

  if (clientType === 'CAMINO') {
    return product.priceCamino;
  }

  if (clientType === 'ESPECIAL') {
    return product.priceEspecial;
  }

  return product.priceNormal;
}

function getAvailableStock(
  product: Product,
  previousQuantity = 0,
) {
  return (
    Number(product.stock || 0) -
    Number(product.reservedStock || 0) +
    previousQuantity
  );
}

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

  if (requestError.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el backend.';
  }

  if (requestError.response?.status === 403) {
    return 'No tienes permiso para crear clientes.';
  }

  if (requestError.response?.status === 401) {
    return 'Tu sesión expiró.';
  }

  return (
    requestError.message ||
    'No se pudo crear el cliente.'
  );
}

export function SaleFormDialog({
  open,
  sale,
  clients,
  products,
  categories,
  subCategories,
  userRole,
  loading = false,
  error,
  onClose,
  onSubmit,
}: SaleFormDialogProps) {
  const isAdmin =
    userRole === 'ADMIN';

  const queryClient = useQueryClient();

  const [clientId, setClientId] =
    useState('');

  const [clientDialogOpen, setClientDialogOpen] =
    useState(false);

  const [clientFormError, setClientFormError] =
    useState<string | null>(null);

  const [saleModality, setSaleModality] =
    useState<SaleModality>(
      'PENDING_PAYMENT',
    );

  const [dueDate, setDueDate] =
    useState('');

  const [discount, setDiscount] =
    useState<number | ''>(0);

  const [observations, setObservations] =
    useState('');

  const [initialPayment, setInitialPayment] =
    useState<number | ''>(0);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('CASH');

  const [
    paymentReference,
    setPaymentReference,
  ] = useState('');

  const [details, setDetails] =
    useState<DraftSaleDetail[]>([]);

  const [categoryId, setCategoryId] =
    useState('');

  const [
    subCategoryId,
    setSubCategoryId,
  ] = useState('');

  const [productId, setProductId] =
    useState('');

  const [quantity, setQuantity] =
    useState<number | ''>(1);

  const [unitPrice, setUnitPrice] =
    useState<number | ''>(0);

  const [manualDraftPrice, setManualDraftPrice] =
    useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const selectedClient = useMemo(
    () =>
      clients.find(
        (client) => client.id === clientId,
      ) || null,
    [clients, clientId],
  );

  const {
    data: locations = [],
    isError: locationsIsError,
    error: locationsError,
  } = useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    enabled: clientDialogOpen,
  });

  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: (newClient) => {
      queryClient.setQueryData<Client[]>(
        ['clients'],
        (currentClients = []) => {
          if (
            currentClients.some(
              (client) =>
                client.id === newClient.id,
            )
          ) {
            return currentClients;
          }

          return [
            ...currentClients,
            newClient,
          ];
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['clients'],
      });

      setClientId(newClient.id);

      const draftProduct = products.find(
        (product) =>
          product.id === productId,
      );

      if (
        draftProduct &&
        !manualDraftPrice
      ) {
        const parsedQuantity =
          Number(quantity);

        setUnitPrice(
          getAutomaticPrice(
            draftProduct,
            newClient.type,
            Number.isInteger(
              parsedQuantity,
            ) && parsedQuantity > 0
              ? parsedQuantity
              : 1,
          ),
        );
      }

      setClientDialogOpen(false);
      setClientFormError(null);
    },
    onError: (mutationError) => {
      setClientFormError(
        getErrorMessage(mutationError),
      );
    },
  });

  const clientType: ClientType =
    selectedClient?.type || 'NORMAL';

  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          product,
        ]),
      ),
    [products],
  );

  const selectedProduct =
    productMap.get(productId) || null;

  const previousQuantityMap = useMemo(
    () =>
      new Map(
        (sale?.details || []).map(
          (detail) => [
            detail.productId,
            detail.quantity,
          ],
        ),
      ),
    [sale],
  );

  const availableCategories = useMemo(
    () =>
      categories.filter((category) =>
        products.some(
          (product) =>
            product.categoryId ===
            category.id,
        ),
      ),
    [categories, products],
  );

  const availableSubCategories =
    useMemo(
      () =>
        subCategories.filter(
          (subCategory) =>
            subCategory.categoryId ===
              categoryId &&
            products.some(
              (product) =>
                product.subCategoryId ===
                subCategory.id,
            ),
        ),
      [
        subCategories,
        products,
        categoryId,
      ],
    );

  const availableProducts = useMemo(
    () =>
      products.filter((product) => {
        if (
          categoryId &&
          product.categoryId !== categoryId
        ) {
          return false;
        }

        if (
          subCategoryId &&
          product.subCategoryId !==
            subCategoryId
        ) {
          return false;
        }

        return true;
      }),
    [
      products,
      categoryId,
      subCategoryId,
    ],
  );

  const subtotal = useMemo(
    () =>
      roundMoney(
        details.reduce(
          (sum, detail) =>
            sum +
            detail.quantity *
              detail.unitPrice,
          0,
        ),
      ),
    [details],
  );

  const numericDiscount =
    discount === ''
      ? 0
      : Number(discount);

  const total = roundMoney(
    Math.max(
      subtotal - numericDiscount,
      0,
    ),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setClientId(sale?.clientId || '');
    setSaleModality(
      sale?.saleType === 'CREDIT'
        ? 'CREDIT'
        : sale &&
            sale.paidAmount >= sale.total
          ? 'CASH'
          : 'PENDING_PAYMENT',
    );

    setDueDate(
      sale?.dueDate
        ? getDateInputValue(
            new Date(sale.dueDate),
          )
        : '',
    );

    setDiscount(sale?.discount ?? 0);
    setObservations(
      sale?.observations || '',
    );

    setInitialPayment(
      sale?.paidAmount ?? 0,
    );

    setPaymentMethod('CASH');
    setPaymentReference('');

    setDetails(
      (sale?.details || []).map(
        (detail) => ({
          productId: detail.productId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          manualPrice: true,
        }),
      ),
    );

    setCategoryId('');
    setSubCategoryId('');
    setProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setManualDraftPrice(false);
    setLocalError(null);
    setClientDialogOpen(false);
    setClientFormError(null);
  }, [open, sale]);

  useEffect(() => {
    if (
      open &&
      !sale &&
      saleModality === 'CASH'
    ) {
      setInitialPayment(total);
    }

    if (
      open &&
      !sale &&
      saleModality ===
        'PENDING_PAYMENT'
    ) {
      setInitialPayment(0);
    }
  }, [
    open,
    sale,
    saleModality,
    total,
  ]);

  const handleClientChange = (
    newClientId: string,
  ) => {
    setClientId(newClientId);

    const newClient = clients.find(
      (client) =>
        client.id === newClientId,
    );

    if (!newClient) {
      setUnitPrice(0);
      setManualDraftPrice(false);
      return;
    }

    if (
      selectedProduct &&
      !manualDraftPrice
    ) {
      const parsedQuantity =
        Number(quantity);

      setUnitPrice(
        getAutomaticPrice(
          selectedProduct,
          newClient.type,
          Number.isInteger(
            parsedQuantity,
          ) && parsedQuantity > 0
            ? parsedQuantity
            : 1,
        ),
      );
    }

    setDetails((current) =>
      current.map((detail) => {
        if (detail.manualPrice) {
          return detail;
        }

        const product = productMap.get(
          detail.productId,
        );

        if (!product) {
          return detail;
        }

        return {
          ...detail,
          unitPrice: getAutomaticPrice(
            product,
            newClient.type,
            detail.quantity,
          ),
        };
      }),
    );
  };

  const handleProductChange = (
    product: Product | null,
  ) => {
    setProductId(product?.id || '');
    setManualDraftPrice(false);

    if (!product || !selectedClient) {
      setUnitPrice(0);
      return;
    }

    const parsedQuantity =
      Number(quantity);

    setUnitPrice(
      getAutomaticPrice(
        product,
        selectedClient.type,
        Number.isInteger(parsedQuantity) &&
          parsedQuantity > 0
          ? parsedQuantity
          : 1,
      ),
    );
  };

  const handleDraftQuantityChange = (
    value: string,
  ) => {
    const nextQuantity =
      value === '' ? '' : Number(value);

    setQuantity(nextQuantity);

    if (
      manualDraftPrice ||
      !selectedProduct ||
      !selectedClient
    ) {
      return;
    }

    const parsedQuantity =
      Number(nextQuantity);

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setUnitPrice(0);
      return;
    }

    setUnitPrice(
      getAutomaticPrice(
        selectedProduct,
        selectedClient.type,
        parsedQuantity,
      ),
    );
  };

  const handleAddProduct = () => {
    setLocalError(null);

    const parsedQuantity =
      Number(quantity);

    const parsedUnitPrice =
      Number(unitPrice);

    if (!clientId) {
      setLocalError(
        'Debes seleccionar un cliente',
      );
      return;
    }

    if (!productId) {
      setLocalError(
        'Debes seleccionar un producto',
      );
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setLocalError(
        'La cantidad debe ser un número entero mayor a cero',
      );
      return;
    }

    if (
      unitPrice === '' ||
      !Number.isFinite(parsedUnitPrice) ||
      parsedUnitPrice < 0
    ) {
      setLocalError(
        'El precio unitario debe ser mayor o igual a cero',
      );
      return;
    }

    const product =
      productMap.get(productId);

    if (!product) {
      setLocalError(
        'El producto seleccionado no existe',
      );
      return;
    }

    const previousQuantity =
      previousQuantityMap.get(product.id) ||
      0;

    const availableStock =
      getAvailableStock(
        product,
        previousQuantity,
      );

    if (
      parsedQuantity > availableStock
    ) {
      setLocalError(
        `Stock insuficiente para "${product.name}". Disponible: ${availableStock}`,
      );
      return;
    }

    const alreadyAdded = details.some(
      (detail) =>
        detail.productId === productId,
    );

    if (alreadyAdded) {
      setLocalError(
        'El producto ya fue agregado. Modifica su cantidad en el detalle.',
      );
      return;
    }

    setDetails((current) => [
      ...current,
      {
        productId,
        quantity: parsedQuantity,
        unitPrice: roundMoney(
          parsedUnitPrice,
        ),
        manualPrice: manualDraftPrice,
      },
    ]);

    setProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setManualDraftPrice(false);
  };

  const handleQuantityChange = (
    detailProductId: string,
    value: string,
  ) => {
    const parsedQuantity =
      Number(value);

    setDetails((current) =>
      current.map((detail) => {
        if (
          detail.productId !==
          detailProductId
        ) {
          return detail;
        }

        const product =
          productMap.get(
            detail.productId,
          );

        if (!product) {
          return detail;
        }

        const validQuantity =
          Number.isInteger(parsedQuantity) &&
          parsedQuantity > 0
            ? parsedQuantity
            : 1;

        return {
          ...detail,
          quantity: validQuantity,
          unitPrice: detail.manualPrice
            ? detail.unitPrice
            : getAutomaticPrice(
                product,
                clientType,
                validQuantity,
              ),
        };
      }),
    );
  };

  const handleManualPriceChange = (
    detailProductId: string,
    value: string,
  ) => {
    const parsedPrice = Number(value);

    setDetails((current) =>
      current.map((detail) =>
        detail.productId ===
        detailProductId
          ? {
              ...detail,
              unitPrice:
                value === ''
                  ? 0
                  : parsedPrice,
              manualPrice: true,
            }
          : detail,
      ),
    );
  };

  const restoreAutomaticPrice = (
    detailProductId: string,
  ) => {
    const product =
      productMap.get(detailProductId);

    if (!product) {
      return;
    }

    setDetails((current) =>
      current.map((detail) =>
        detail.productId ===
        detailProductId
          ? {
              ...detail,
              unitPrice:
                getAutomaticPrice(
                  product,
                  clientType,
                  detail.quantity,
                ),
              manualPrice: false,
            }
          : detail,
      ),
    );
  };

  const removeDetail = (
    detailProductId: string,
  ) => {
    setDetails((current) =>
      current.filter(
        (detail) =>
          detail.productId !==
          detailProductId,
      ),
    );
  };

  const submitForm = () => {
    setLocalError(null);

    if (!clientId) {
      setLocalError(
        'Debes seleccionar un cliente',
      );
      return;
    }

    if (details.length === 0) {
      setLocalError(
        'Debes agregar al menos un producto',
      );
      return;
    }

    const hasInvalidDetail =
      details.some((detail) => {
        const product =
          productMap.get(
            detail.productId,
          );

        if (!product) {
          return true;
        }

        const previousQuantity =
          previousQuantityMap.get(
            product.id,
          ) || 0;

        const availableStock =
          getAvailableStock(
            product,
            previousQuantity,
          );

        return (
          !Number.isInteger(
            detail.quantity,
          ) ||
          detail.quantity <= 0 ||
          detail.quantity >
            availableStock ||
          detail.unitPrice < 0
        );
      });

    if (hasInvalidDetail) {
      setLocalError(
        'Revisa las cantidades, precios y stock disponible de los productos.',
      );
      return;
    }

    if (
      numericDiscount > subtotal
    ) {
      setLocalError(
        'El descuento no puede superar el subtotal',
      );
      return;
    }

    if (
      saleModality === 'CREDIT' &&
      !dueDate
    ) {
      setLocalError(
        'La venta a crédito necesita una fecha de vencimiento',
      );
      return;
    }

    const numericInitialPayment = sale
      ? undefined
      : saleModality ===
          'PENDING_PAYMENT'
        ? 0
        : saleModality === 'CASH'
          ? total
          : initialPayment === ''
            ? 0
            : Number(initialPayment);

    const backendSaleType: SaleType =
      saleModality === 'CREDIT'
        ? 'CREDIT'
        : 'CASH';

    if (
      numericInitialPayment !==
        undefined &&
      numericInitialPayment < 0
    ) {
      setLocalError(
        'El pago inicial no puede ser negativo',
      );
      return;
    }

    if (
      numericInitialPayment !==
        undefined &&
      numericInitialPayment > total
    ) {
      setLocalError(
        'El pago inicial no puede superar el total',
      );
      return;
    }

    if (
      !sale &&
      numericInitialPayment !==
        undefined &&
      numericInitialPayment > 0 &&
      !paymentMethod
    ) {
      setLocalError(
        'Debes seleccionar el método de pago',
      );
      return;
    }

    onSubmit({
      clientId,

      details: details.map(
        (detail) => ({
          productId:
            detail.productId,
          quantity: detail.quantity,
          unitPrice:
            roundMoney(
              detail.unitPrice,
            ),
        }),
      ),

      discount: isAdmin
        ? numericDiscount
        : 0,

      observations:
        observations.trim() ||
        undefined,

      saleType: backendSaleType,

      dueDate:
        saleModality === 'CREDIT'
          ? dueDate
          : undefined,

      initialPayment:
        numericInitialPayment,

      paymentMethod:
        numericInitialPayment &&
        numericInitialPayment > 0
          ? paymentMethod
          : undefined,

      paymentReference:
        numericInitialPayment &&
        numericInitialPayment > 0
          ? paymentReference.trim() ||
            undefined
          : undefined,
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={
          loading ? undefined : onClose
        }
        fullWidth
        maxWidth="lg"
      >
      <DialogTitle>
        {sale
          ? 'Editar venta pendiente'
          : 'Nueva venta'}
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

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '2fr 1fr 1fr',
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            <Autocomplete
              fullWidth
              options={clients}
              value={selectedClient}
              onChange={(_event, client) =>
                handleClientChange(
                  client?.id || '',
                )
              }
              getOptionLabel={(client) =>
                client.alias
                  ? `${client.fullName} - ${client.alias}`
                  : client.fullName
              }
              isOptionEqualToValue={(
                option,
                value,
              ) => option.id === value.id}
              noOptionsText="No se encontraron clientes"
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Escribe el nombre o alias"
                />
              )}
            />

            <Tooltip title="Crear nuevo cliente">
              <span>
                <IconButton
                  color="primary"
                  aria-label="Crear nuevo cliente"
                  onClick={() => {
                    setClientFormError(null);
                    setClientDialogOpen(true);
                  }}
                  disabled={loading}
                  sx={{
                    width: 56,
                    height: 56,
                    border: 1,
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <TextField
            select
            fullWidth
            label="Modalidad"
            value={saleModality}
            onChange={(event) => {
              const newModality =
                event.target
                  .value as SaleModality;

              setSaleModality(
                newModality,
              );

              if (
                newModality !== 'CREDIT'
              ) {
                setDueDate('');
              }

              if (
                newModality ===
                'PENDING_PAYMENT'
              ) {
                setInitialPayment(0);
              }

              if (
                newModality === 'CASH'
              ) {
                setInitialPayment(total);
              }

              if (
                newModality === 'CREDIT'
              ) {
                setInitialPayment(0);
              }
            }}
            disabled={loading}
          >
            <MenuItem value="PENDING_PAYMENT">
              Por Cobrar
            </MenuItem>

            <MenuItem value="CASH">
              Contado
            </MenuItem>

            <MenuItem value="CREDIT">
              Crédito
            </MenuItem>
          </TextField>

          {saleModality === 'CREDIT' && (
            <TextField
              fullWidth
              type="date"
              label="Fecha vencimiento"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value,
                )
              }
              inputProps={{
                min: getToday(),
                max:
                  getMaximumCreditDate(),
              }}
              InputLabelProps={{
                shrink: true,
              }}
              disabled={loading}
            />
          )}
        </Box>

        {selectedClient && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
          >
            Tipo de cliente:{' '}
            <strong>
              {selectedClient.type}
            </strong>
            . El precio se seleccionará
            automáticamente según su tipo.
          </Alert>
        )}

        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ mb: 1.5 }}
        >
          Agregar productos
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr 2fr 0.8fr 1fr auto',
              },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <TextField
              select
              label="Categoría"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(
                  event.target.value,
                );

                setSubCategoryId('');
                setProductId('');
                setUnitPrice(0);
                setManualDraftPrice(false);
              }}
              disabled={loading}
            >
              <MenuItem value="">
                Todas
              </MenuItem>

              {availableCategories.map(
                (category) => (
                  <MenuItem
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </MenuItem>
                ),
              )}
            </TextField>

            <TextField
              select
              label="Subcategoría"
              value={subCategoryId}
              onChange={(event) => {
                setSubCategoryId(
                  event.target.value,
                );

                setProductId('');
                setUnitPrice(0);
                setManualDraftPrice(false);
              }}
              disabled={
                loading || !categoryId
              }
            >
              <MenuItem value="">
                Todas
              </MenuItem>

              {availableSubCategories.map(
                (subCategory) => (
                  <MenuItem
                    key={
                      subCategory.id
                    }
                    value={
                      subCategory.id
                    }
                  >
                    {subCategory.name}
                  </MenuItem>
                ),
              )}
            </TextField>

            <Autocomplete
              options={availableProducts}
              value={selectedProduct}
              onChange={(_event, product) =>
                handleProductChange(product)
              }
              getOptionLabel={(product) => {
                const available =
                  getAvailableStock(
                    product,
                    previousQuantityMap.get(
                      product.id,
                    ) || 0,
                  );

                return `${product.name} — Disponible: ${available}`;
              }}
              isOptionEqualToValue={(
                option,
                value,
              ) => option.id === value.id}
              noOptionsText="No se encontraron productos"
              disabled={
                loading || !clientId
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar producto"
                  placeholder="Escribe el nombre"
                />
              )}
            />

            <TextField
              type="number"
              label="Cantidad"
              value={quantity}
              onChange={(event) =>
                handleDraftQuantityChange(
                  event.target.value,
                )
              }
              inputProps={{
                min: 1,
                step: 1,
              }}
              disabled={loading}
            />

            <TextField
              type="number"
              label="Precio unitario"
              value={unitPrice}
              onChange={(event) => {
                setUnitPrice(
                  event.target.value === ''
                    ? ''
                    : Number(
                        event.target.value,
                      ),
                );

                setManualDraftPrice(true);
              }}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 'any',
                },
              }}
              disabled={
                loading || !productId
              }
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
              disabled={loading}
              sx={{
                textTransform: 'none',
                fontWeight: 800,
              }}
            >
              Agregar
            </Button>
          </Box>
        </Paper>

        <Stack spacing={1.5}>
          {details.map((detail) => {
            const product =
              productMap.get(
                detail.productId,
              );

            if (!product) {
              return null;
            }

            const previousQuantity =
              previousQuantityMap.get(
                product.id,
              ) || 0;

            const available =
              getAvailableStock(
                product,
                previousQuantity,
              );

            const lineSubtotal =
              roundMoney(
                detail.quantity *
                  detail.unitPrice,
              );

            return (
              <Paper
                key={detail.productId}
                variant="outlined"
                sx={{ p: 1.5 }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '2fr 1fr 1fr 1fr auto',
                    },
                    gap: 1.5,
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={800}
                    >
                      {product.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {product.weight ||
                        product.unit}{' '}
                      · Disponible:{' '}
                      {available}
                    </Typography>

                    {detail.manualPrice ? (
                      <Chip
                        size="small"
                        label="Precio modificado"
                        color="warning"
                        sx={{ mt: 0.5 }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label="Precio automático"
                        color="success"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>

                  <TextField
                    size="small"
                    type="number"
                    label="Cantidad"
                    value={
                      detail.quantity
                    }
                    onChange={(event) =>
                      handleQuantityChange(
                        detail.productId,
                        event.target
                          .value,
                      )
                    }
                    inputProps={{
                      min: 1,
                      step: 1,
                    }}
                  />

                  <TextField
                    size="small"
                    type="number"
                    label="Precio"
                    value={
                      detail.unitPrice
                    }
                    onChange={(event) =>
                      handleManualPriceChange(
                        detail.productId,
                        event.target
                          .value,
                      )
                    }
                    inputProps={{
                      min: 0,
                      step: 'any',
                    }}
                    InputProps={{
                      endAdornment:
                        detail.manualPrice ? (
                          <TooltipButton
                            onClick={() =>
                              restoreAutomaticPrice(
                                detail.productId,
                              )
                            }
                          />
                        ) : undefined,
                    }}
                  />

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Subtotal
                    </Typography>

                    <Typography
                      fontWeight={900}
                    >
                      {formatCurrency(
                        lineSubtotal,
                      )}
                    </Typography>
                  </Box>

                  <IconButton
                    color="error"
                    onClick={() =>
                      removeDetail(
                        detail.productId,
                      )
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Stack>

        {details.length === 0 && (
          <Alert
            severity="info"
            sx={{ mt: 2 }}
          >
            Todavía no agregaste productos.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 340px',
            },
            gap: 3,
            mt: 3,
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Observaciones"
            value={observations}
            onChange={(event) =>
              setObservations(
                event.target.value,
              )
            }
          />

          <Paper
            variant="outlined"
            sx={{ p: 2 }}
          >
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  Subtotal
                </Typography>

                <Typography
                  fontWeight={800}
                >
                  {formatCurrency(
                    subtotal,
                  )}
                </Typography>
              </Stack>

              {isAdmin && (
                <TextField
                  fullWidth
                  type="number"
                  label="Descuento general"
                  value={discount}
                  onChange={(event) =>
                    setDiscount(
                      event.target.value ===
                        ''
                        ? ''
                        : Number(
                            event.target
                              .value,
                          ),
                    )
                  }
                  inputProps={{
                    min: 0,
                    step: 'any',
                  }}
                />
              )}

              {!isAdmin && (
                <Alert severity="info">
                  Solo el administrador
                  puede aplicar descuentos.
                </Alert>
              )}

              <Stack
                direction="row"
                justifyContent="space-between"
              >
                <Typography
                  variant="h6"
                  fontWeight={900}
                >
                  Total
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight={900}
                  color="primary.main"
                >
                  {formatCurrency(total)}
                </Typography>
              </Stack>

              {!sale && (
                <>
                  <TextField
                    fullWidth
                    type="number"
                    label="Pago inicial"
                    value={initialPayment}
                    onChange={(event) =>
                      setInitialPayment(
                        event.target
                          .value === ''
                          ? ''
                          : Number(
                              event.target
                                .value,
                            ),
                      )
                    }
                    inputProps={{
                      min: 0,
                      max: total,
                      step: 'any',
                    }}
                    disabled={
                      saleModality !== 'CREDIT'
                    }
                    helperText={
                      saleModality ===
                      'PENDING_PAYMENT'
                        ? 'La venta quedará pendiente de cobro.'
                        : saleModality === 'CASH'
                        ? 'En ventas al contado se registra el total.'
                        : 'Puede registrar un pago parcial o dejarlo en cero.'
                    }
                  />

                  {Number(
                    initialPayment || 0,
                  ) > 0 && (
                    <>
                      <TextField
                        select
                        fullWidth
                        label="Método de pago"
                        value={
                          paymentMethod
                        }
                        onChange={(
                          event,
                        ) =>
                          setPaymentMethod(
                            event.target
                              .value as PaymentMethod,
                          )
                        }
                      >
                        {paymentMethods.map(
                          (method) => (
                            <MenuItem
                              key={
                                method.value
                              }
                              value={
                                method.value
                              }
                            >
                              {method.label}
                            </MenuItem>
                          ),
                        )}
                      </TextField>

                      <TextField
                        fullWidth
                        label="Referencia del pago"
                        value={
                          paymentReference
                        }
                        onChange={(
                          event,
                        ) =>
                          setPaymentReference(
                            event.target
                              .value,
                          )
                        }
                        placeholder="Opcional"
                      />
                    </>
                  )}
                </>
              )}
            </Stack>
          </Paper>
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
          onClick={submitForm}
          disabled={loading}
        >
          {loading
            ? 'Guardando...'
            : sale
              ? 'Actualizar venta'
              : 'Registrar venta'}
        </Button>
      </DialogActions>
      </Dialog>

      <ClientFormDialog
        open={clientDialogOpen}
        locations={locations}
        loading={createClientMutation.isPending}
        error={
          clientFormError ||
          (locationsIsError
            ? getErrorMessage(locationsError)
            : null)
        }
        onClose={() => {
          setClientDialogOpen(false);
          setClientFormError(null);
        }}
        onSubmit={(data: CreateClientRequest) => {
          setClientFormError(null);
          createClientMutation.mutate(data);
        }}
      />
    </>
  );
}

function TooltipButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      title="Restaurar precio automático"
    >
      <RestartAltIcon fontSize="small" />
    </IconButton>
  );
}
