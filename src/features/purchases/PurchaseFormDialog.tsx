import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useMemo, useState } from 'react';
import type { Provider } from '../../types/provider.types';
import type {
  Category,
  Product,
} from '../../types/product.types';
import type {
  CreatePurchaseRequest,
  Purchase,
} from '../../types/purchase.types';
import { formatCurrency } from '../../utils/formatCurrency';

interface PurchaseFormDialogProps {
  open: boolean;
  purchase?: Purchase | null;
  providers: Provider[];
  categories: Category[];
  products: Product[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (
    data: CreatePurchaseRequest,
  ) => void;
}

interface DraftDetail {
  productId: string;
  providerId: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
}

const decimalInputProps = {
  min: 0,
  step: 'any',
  inputMode: 'decimal' as const,
};

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

export function PurchaseFormDialog({
  open,
  purchase,
  providers,
  categories,
  products,
  loading = false,
  error,
  onClose,
  onSubmit,
}: PurchaseFormDialogProps) {
  const [observations, setObservations] =
    useState('');
  const [details, setDetails] = useState<
    DraftDetail[]
  >([]);

  const [providerId, setProviderId] =
    useState('');
  const [categoryId, setCategoryId] =
    useState('');
  const [productId, setProductId] =
    useState('');
  const [quantity, setQuantity] =
    useState<number | ''>(1);
  const [unitPrice, setUnitPrice] =
    useState<number | ''>('');

  const [localError, setLocalError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setObservations(
      purchase?.observations || '',
    );

    const initialDetails =
      purchase?.providerGroups.flatMap(
        (group) =>
          group.details.map((detail) => ({
            productId: detail.productId,
            providerId: group.providerId,
            categoryId: detail.categoryId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
          })),
      ) || [];

    setDetails(initialDetails);
    setProviderId('');
    setCategoryId('');
    setProductId('');
    setQuantity(1);
    setUnitPrice('');
    setLocalError(null);
  }, [open, purchase]);

  const providerProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.providerId === providerId,
      ),
    [products, providerId],
  );

  const availableCategories = useMemo(
    () =>
      categories.filter((category) =>
        providerProducts.some(
          (product) =>
            product.categoryId === category.id,
        ),
      ),
    [categories, providerProducts],
  );

  const availableProducts = useMemo(
    () =>
      providerProducts.filter(
        (product) =>
          product.categoryId === categoryId,
      ),
    [providerProducts, categoryId],
  );

  const providerMap = useMemo(
    () =>
      new Map(
        providers.map((provider) => [
          provider.id,
          provider.companyName,
        ]),
      ),
    [providers],
  );

  const categoryMap = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [categories],
  );

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

  const groupedDetails = useMemo(() => {
    const groups = new Map<
      string,
      {
        providerId: string;
        providerName: string;
        categories: Map<
          string,
          {
            categoryId: string;
            categoryName: string;
            details: DraftDetail[];
            subtotal: number;
          }
        >;
        total: number;
      }
    >();

    for (const detail of details) {
      let providerGroup = groups.get(
        detail.providerId,
      );

      if (!providerGroup) {
        providerGroup = {
          providerId: detail.providerId,
          providerName:
            providerMap.get(
              detail.providerId,
            ) || 'Proveedor',
          categories: new Map(),
          total: 0,
        };

        groups.set(
          detail.providerId,
          providerGroup,
        );
      }

      let categoryGroup =
        providerGroup.categories.get(
          detail.categoryId,
        );

      if (!categoryGroup) {
        categoryGroup = {
          categoryId: detail.categoryId,
          categoryName:
            categoryMap.get(
              detail.categoryId,
            ) || 'Sin categoría',
          details: [],
          subtotal: 0,
        };

        providerGroup.categories.set(
          detail.categoryId,
          categoryGroup,
        );
      }

      const subtotal = roundMoney(
        detail.quantity * detail.unitPrice,
      );

      categoryGroup.details.push(detail);
      categoryGroup.subtotal = roundMoney(
        categoryGroup.subtotal + subtotal,
      );

      providerGroup.total = roundMoney(
        providerGroup.total + subtotal,
      );
    }

    return Array.from(groups.values());
  }, [
    details,
    providerMap,
    categoryMap,
  ]);

  const generalTotal = useMemo(
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

  const handleProviderChange = (
    value: string,
  ) => {
    // Solo se limpian los selectores actuales.
    // Los productos agregados no se modifican.
    setProviderId(value);
    setCategoryId('');
    setProductId('');
    setUnitPrice('');
  };

  const handleCategoryChange = (
    value: string,
  ) => {
    setCategoryId(value);
    setProductId('');
    setUnitPrice('');
  };

  const handleProductChange = (
    product: Product | null,
  ) => {
    setProductId(product?.id || '');

    setUnitPrice(
      product?.purchasePrice ?? '',
    );
  };

  const handleAddProduct = () => {
    setLocalError(null);

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(unitPrice);

    if (
      !providerId ||
      !categoryId ||
      !productId
    ) {
      setLocalError(
        'Selecciona proveedor, categoría y producto',
      );
      return;
    }

    if (
      parsedQuantity <= 0 ||
      parsedPrice <= 0
    ) {
      setLocalError(
        'La cantidad y el precio deben ser mayores a cero',
      );
      return;
    }

    const existingIndex =
      details.findIndex(
        (detail) =>
          detail.productId === productId,
      );

    if (existingIndex >= 0) {
      setDetails((current) =>
        current.map((detail, index) =>
          index === existingIndex
            ? {
                ...detail,
                quantity: roundMoney(
                  detail.quantity +
                    parsedQuantity,
                ),
                unitPrice: roundMoney(
                  parsedPrice,
                ),
              }
            : detail,
        ),
      );
    } else {
      setDetails((current) => [
        ...current,
        {
          productId,
          providerId,
          categoryId,
          quantity: parsedQuantity,
          unitPrice:
            roundMoney(parsedPrice),
        },
      ]);
    }

    setProductId('');
    setQuantity(1);
    setUnitPrice('');
  };

  const updateDetail = (
    productIdToUpdate: string,
    field: 'quantity' | 'unitPrice',
    value: string,
  ) => {
    const numericValue = Number(value);

    setDetails((current) =>
      current.map((detail) =>
        detail.productId ===
        productIdToUpdate
          ? {
              ...detail,
              [field]:
                value === ''
                  ? 0
                  : numericValue,
            }
          : detail,
      ),
    );
  };

  const removeDetail = (
    productIdToRemove: string,
  ) => {
    setDetails((current) =>
      current.filter(
        (detail) =>
          detail.productId !==
          productIdToRemove,
      ),
    );
  };

  const submitForm = () => {
    setLocalError(null);

    if (details.length === 0) {
      setLocalError(
        'Agrega al menos un producto',
      );
      return;
    }

    const invalid = details.some(
      (detail) =>
        detail.quantity <= 0 ||
        detail.unitPrice <= 0,
    );

    if (invalid) {
      setLocalError(
        'Todos los productos deben tener cantidad y precio mayores a cero',
      );
      return;
    }

    onSubmit({
      observations:
        observations.trim() || undefined,
      details: details.map((detail) => ({
        productId: detail.productId,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
      })),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle>
        {purchase
          ? 'Editar comprobante de compra'
          : 'Nuevo comprobante de compra'}
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

        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Observación general"
          value={observations}
          onChange={(event) =>
            setObservations(
              event.target.value,
            )
          }
          disabled={loading}
          sx={{ mb: 3 }}
        />

        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ mb: 1.5 }}
        >
          Agregar producto
        </Typography>

        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 3 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1.4fr 1.3fr 2fr 1fr 1fr auto',
              },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            <TextField
              select
              label="Proveedor"
              value={providerId}
              onChange={(event) =>
                handleProviderChange(
                  event.target.value,
                )
              }
              disabled={loading}
            >
              <MenuItem value="">
                Seleccionar
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
              select
              label="Categoría"
              value={categoryId}
              onChange={(event) =>
                handleCategoryChange(
                  event.target.value,
                )
              }
              disabled={
                loading || !providerId
              }
            >
              <MenuItem value="">
                Seleccionar
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

            <Autocomplete
              options={availableProducts}
              value={selectedProduct}
              onChange={(_event, product) =>
                handleProductChange(product)
              }
              getOptionLabel={(product) =>
                `${product.name}${
                  product.weight
                    ? ` - ${product.weight}`
                    : ''
                }`
              }
              isOptionEqualToValue={(
                option,
                value,
              ) => option.id === value.id}
              noOptionsText="No se encontraron productos"
              disabled={
                loading || !categoryId
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
                setQuantity(
                  event.target.value === ''
                    ? ''
                    : Number(
                        event.target.value,
                      ),
                )
              }
              inputProps={decimalInputProps}
              disabled={loading}
            />

            <TextField
              type="number"
              label="Precio compra"
              value={unitPrice}
              onChange={(event) =>
                setUnitPrice(
                  event.target.value === ''
                    ? ''
                    : Number(
                        event.target.value,
                      ),
                )
              }
              inputProps={decimalInputProps}
              disabled={loading}
            />

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
              disabled={loading}
            >
              Agregar
            </Button>
          </Box>
        </Paper>

        <Stack spacing={2}>
          {groupedDetails.map(
            (providerGroup) => (
              <Paper
                key={
                  providerGroup.providerId
                }
                variant="outlined"
                sx={{ overflow: 'hidden' }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: '#eef7f2',
                    display: 'flex',
                    justifyContent:
                      'space-between',
                  }}
                >
                  <Typography fontWeight={900}>
                    Proveedor:{' '}
                    {
                      providerGroup.providerName
                    }
                  </Typography>

                  <Typography fontWeight={900}>
                    {formatCurrency(
                      providerGroup.total,
                    )}
                  </Typography>
                </Box>

                {Array.from(
                  providerGroup.categories.values(),
                ).map((categoryGroup) => (
                  <Box
                    key={
                      categoryGroup.categoryId
                    }
                    sx={{
                      p: 2,
                      borderTop:
                        '1px solid #edf0f2',
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        fontWeight={800}
                      >
                        Categoría:{' '}
                        {
                          categoryGroup.categoryName
                        }
                      </Typography>

                      <Typography
                        fontWeight={800}
                      >
                        Subtotal:{' '}
                        {formatCurrency(
                          categoryGroup.subtotal,
                        )}
                      </Typography>
                    </Stack>

                    <Stack spacing={1}>
                      {categoryGroup.details.map(
                        (detail) => {
                          const product =
                            productMap.get(
                              detail.productId,
                            );

                          return (
                            <Box
                              key={
                                detail.productId
                              }
                              sx={{
                                display:
                                  'grid',
                                gridTemplateColumns:
                                  {
                                    xs: '1fr',
                                    md: '2fr 1fr 1fr 1fr auto',
                                  },
                                gap: 1,
                                alignItems:
                                  'center',
                              }}
                            >
                              <Typography
                                fontWeight={700}
                              >
                                {product?.name ||
                                  detail.productId}
                              </Typography>

                              <TextField
                                size="small"
                                type="number"
                                label="Cantidad"
                                value={
                                  detail.quantity
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateDetail(
                                    detail.productId,
                                    'quantity',
                                    event.target
                                      .value,
                                  )
                                }
                                inputProps={
                                  decimalInputProps
                                }
                              />

                              <TextField
                                size="small"
                                type="number"
                                label="P. unitario"
                                value={
                                  detail.unitPrice
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateDetail(
                                    detail.productId,
                                    'unitPrice',
                                    event.target
                                      .value,
                                  )
                                }
                                inputProps={
                                  decimalInputProps
                                }
                              />

                              <Typography
                                fontWeight={800}
                              >
                                {formatCurrency(
                                  detail.quantity *
                                    detail.unitPrice,
                                )}
                              </Typography>

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
                          );
                        },
                      )}
                    </Stack>
                  </Box>
                ))}
              </Paper>
            ),
          )}
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
            mt: 3,
            textAlign: 'right',
          }}
        >
          <Typography
            variant="h5"
            fontWeight={900}
          >
            Total general:{' '}
            {formatCurrency(generalTotal)}
          </Typography>
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
          disabled={
            loading || details.length === 0
          }
        >
          {loading
            ? 'Guardando...'
            : purchase
              ? 'Actualizar compra'
              : 'Registrar compra'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}