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
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  canCreateProduct?: boolean;
  initialDraft?: PurchaseFormDraft | null;
  createdProductId?: string | null;
  onClose: () => void;
  onCreateNewProduct?: (draft: PurchaseFormDraft) => void;
  onSubmit: (
    data: CreatePurchaseRequest,
  ) => void;
}

export interface DraftDetail {
  productId: string;
  providerId: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  priceNormal: number;
  priceCamino: number;
  priceEspecial: number;
  priceMayorista: number | null;
  minQuantityWholesale: number | null;
}

export interface PurchaseFormDraft {
  observations: string;
  details: DraftDetail[];
  providerId: string;
  categoryId: string;
  productId: string;
  quantity: number | '';
  unitPrice: number | '';
  marginPercentage: number;
  priceNormal: number | '';
  priceCamino: number | '';
  priceEspecial: number | '';
  priceMayorista: number | '';
  minQuantityWholesale: number | '';
}

export interface CreateProductFromPurchaseState {
  fromPurchase: true;
  purchaseDraft: PurchaseFormDraft;
  purchaseId: string | null;
}

export interface ReturnToPurchaseState {
  returnToPurchase: true;
  purchaseDraft: PurchaseFormDraft;
  purchaseId: string | null;
  createdProductId: string | null;
}

type SalePriceField =
  | 'priceNormal'
  | 'priceCamino'
  | 'priceEspecial'
  | 'priceMayorista'
  | 'minQuantityWholesale';

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

function calculatePrice(
  purchasePrice: number,
  percentage: number,
) {
  return roundMoney(
    purchasePrice * (1 + percentage / 100),
  );
}

function calculateMargin(
  purchasePrice: number,
  salePrice: number,
) {
  if (purchasePrice <= 0 || salePrice <= 0) {
    return 10;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((salePrice - purchasePrice) /
          purchasePrice) *
          100,
      ),
    ),
  );
}

export function PurchaseFormDialog({
  open,
  purchase,
  providers,
  categories,
  products,
  loading = false,
  error,
  canCreateProduct = false,
  initialDraft,
  createdProductId,
  onClose,
  onCreateNewProduct,
  onSubmit,
}: PurchaseFormDialogProps) {
  const initializedOpenRef = useRef(false);
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
  const [marginPercentage, setMarginPercentage] =
    useState(10);
  const [priceNormal, setPriceNormal] =
    useState<number | ''>('');
  const [priceCamino, setPriceCamino] =
    useState<number | ''>('');
  const [priceEspecial, setPriceEspecial] =
    useState<number | ''>('');
  const [priceMayorista, setPriceMayorista] =
    useState<number | ''>('');
  const [minQuantityWholesale, setMinQuantityWholesale] =
    useState<number | ''>('');

  const [localError, setLocalError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      initializedOpenRef.current = false;
      return;
    }

    if (initializedOpenRef.current) {
      return;
    }

    initializedOpenRef.current = true;

    if (initialDraft) {
      setObservations(initialDraft.observations);
      setDetails(initialDraft.details);
      setProviderId(initialDraft.providerId);
      setCategoryId(initialDraft.categoryId);
      setProductId(initialDraft.productId);
      setQuantity(initialDraft.quantity);
      setUnitPrice(initialDraft.unitPrice);
      setMarginPercentage(initialDraft.marginPercentage);
      setPriceNormal(initialDraft.priceNormal);
      setPriceCamino(initialDraft.priceCamino);
      setPriceEspecial(initialDraft.priceEspecial);
      setPriceMayorista(initialDraft.priceMayorista);
      setMinQuantityWholesale(
        initialDraft.minQuantityWholesale,
      );

      if (createdProductId) {
        const createdProduct = products.find(
          (product) => product.id === createdProductId,
        );

        if (createdProduct) {
          const currentMargin = calculateMargin(
            createdProduct.purchasePrice,
            createdProduct.priceNormal,
          );

          setProviderId(createdProduct.providerId);
          setCategoryId(createdProduct.categoryId);
          setProductId(createdProduct.id);
          setQuantity(1);
          setUnitPrice(createdProduct.purchasePrice);
          setMarginPercentage(currentMargin);
          setPriceNormal(createdProduct.priceNormal);
          setPriceCamino(createdProduct.priceCamino);
          setPriceEspecial(createdProduct.priceEspecial);
          setPriceMayorista(
            createdProduct.priceMayorista ??
              calculatePrice(
                createdProduct.purchasePrice,
                currentMargin,
              ),
          );
          setMinQuantityWholesale(
            createdProduct.minQuantityWholesale ?? 1,
          );
        }
      }

      setLocalError(null);
      return;
    }

    setObservations(
      purchase?.observations || '',
    );

    const initialDetails =
      purchase?.providerGroups.flatMap(
        (group) =>
          group.details.map((detail) => {
            const product = products.find(
              (item) => item.id === detail.productId,
            );
            const fallbackPrice = calculatePrice(
              detail.unitPrice,
              10,
            );

            return {
              productId: detail.productId,
              providerId: group.providerId,
              categoryId: detail.categoryId,
              quantity: detail.quantity,
              unitPrice: detail.unitPrice,
              priceNormal:
                detail.priceNormal ??
                product?.priceNormal ??
                fallbackPrice,
              priceCamino:
                detail.priceCamino ??
                product?.priceCamino ??
                fallbackPrice,
              priceEspecial:
                detail.priceEspecial ??
                product?.priceEspecial ??
                fallbackPrice,
              priceMayorista:
                detail.priceMayorista ??
                product?.priceMayorista ??
                fallbackPrice,
              minQuantityWholesale:
                detail.minQuantityWholesale ??
                product?.minQuantityWholesale ??
                1,
            };
          }),
      ) || [];

    setDetails(initialDetails);
    setProviderId('');
    setCategoryId('');
    setProductId('');
    setQuantity(1);
    setUnitPrice('');
    setMarginPercentage(10);
    setPriceNormal('');
    setPriceCamino('');
    setPriceEspecial('');
    setPriceMayorista('');
    setMinQuantityWholesale('');
    setLocalError(null);
  }, [
    open,
    purchase,
    initialDraft,
    createdProductId,
    products,
  ]);

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

  const setCalculatedPrices = (
    purchasePrice: number,
    percentage: number,
  ) => {
    const calculated = calculatePrice(
      purchasePrice,
      percentage,
    );

    setPriceNormal(calculated);
    setPriceCamino(calculated);
    setPriceEspecial(calculated);
    setPriceMayorista(calculated);
  };

  const resetProductFields = () => {
    setProductId('');
    setQuantity(1);
    setUnitPrice('');
    setMarginPercentage(10);
    setPriceNormal('');
    setPriceCamino('');
    setPriceEspecial('');
    setPriceMayorista('');
    setMinQuantityWholesale('');
  };

  const createCurrentDraft = (): PurchaseFormDraft => ({
    observations,
    details,
    providerId,
    categoryId,
    productId,
    quantity,
    unitPrice,
    marginPercentage,
    priceNormal,
    priceCamino,
    priceEspecial,
    priceMayorista,
    minQuantityWholesale,
  });

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
    resetProductFields();
  };

  const handleCategoryChange = (
    value: string,
  ) => {
    setCategoryId(value);
    resetProductFields();
  };

  const handleProductChange = (
    product: Product | null,
  ) => {
    setProductId(product?.id || '');

    if (!product) {
      setUnitPrice('');
      setMarginPercentage(10);
      setPriceNormal('');
      setPriceCamino('');
      setPriceEspecial('');
      setPriceMayorista('');
      setMinQuantityWholesale('');
      return;
    }

    const currentMargin = calculateMargin(
      product.purchasePrice,
      product.priceNormal,
    );

    setUnitPrice(product.purchasePrice);
    setMarginPercentage(currentMargin);
    setPriceNormal(product.priceNormal);
    setPriceCamino(product.priceCamino);
    setPriceEspecial(product.priceEspecial);
    setPriceMayorista(
      product.priceMayorista ??
        calculatePrice(
          product.purchasePrice,
          currentMargin,
        ),
    );
    setMinQuantityWholesale(
      product.minQuantityWholesale ?? 1,
    );
  };

  const handleUnitPriceChange = (
    value: string,
  ) => {
    if (value === '') {
      setUnitPrice('');
      setPriceNormal('');
      setPriceCamino('');
      setPriceEspecial('');
      setPriceMayorista('');
      return;
    }

    const numericValue = Number(value);
    setUnitPrice(numericValue);

    if (numericValue > 0) {
      setCalculatedPrices(
        numericValue,
        marginPercentage,
      );
    }
  };

  const handleMarginChange = (
    percentage: number,
  ) => {
    setMarginPercentage(percentage);

    if (unitPrice !== '' && unitPrice > 0) {
      setCalculatedPrices(
        Number(unitPrice),
        percentage,
      );
    }
  };

  const handleAddProduct = () => {
    setLocalError(null);

    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(unitPrice);
    const parsedPriceNormal = Number(priceNormal);
    const parsedPriceCamino = Number(priceCamino);
    const parsedPriceEspecial = Number(priceEspecial);
    const parsedPriceMayorista = Number(priceMayorista);
    const parsedMinQuantityWholesale = Number(
      minQuantityWholesale,
    );

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

    if (
      parsedPriceNormal <= 0 ||
      parsedPriceCamino <= 0 ||
      parsedPriceEspecial <= 0 ||
      parsedPriceMayorista <= 0
    ) {
      setLocalError(
        'Todos los precios de venta deben ser mayores a cero',
      );
      return;
    }

    if (
      !Number.isInteger(
        parsedMinQuantityWholesale,
      ) ||
      parsedMinQuantityWholesale <= 0
    ) {
      setLocalError(
        'La cantidad mínima mayorista debe ser un número entero mayor a cero',
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
                priceNormal: roundMoney(
                  parsedPriceNormal,
                ),
                priceCamino: roundMoney(
                  parsedPriceCamino,
                ),
                priceEspecial: roundMoney(
                  parsedPriceEspecial,
                ),
                priceMayorista: roundMoney(
                  parsedPriceMayorista,
                ),
                minQuantityWholesale:
                  parsedMinQuantityWholesale,
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
          unitPrice: roundMoney(parsedPrice),
          priceNormal: roundMoney(
            parsedPriceNormal,
          ),
          priceCamino: roundMoney(
            parsedPriceCamino,
          ),
          priceEspecial: roundMoney(
            parsedPriceEspecial,
          ),
          priceMayorista: roundMoney(
            parsedPriceMayorista,
          ),
          minQuantityWholesale:
            parsedMinQuantityWholesale,
        },
      ]);
    }

    resetProductFields();
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

  const updateSalePrice = (
    productIdToUpdate: string,
    field: SalePriceField,
    value: string,
  ) => {
    setDetails((current) =>
      current.map((detail) =>
        detail.productId === productIdToUpdate
          ? {
              ...detail,
              [field]:
                value === '' ? null : Number(value),
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
        detail.unitPrice <= 0 ||
        detail.priceNormal <= 0 ||
        detail.priceCamino <= 0 ||
        detail.priceEspecial <= 0 ||
        !detail.priceMayorista ||
        detail.priceMayorista <= 0 ||
        !detail.minQuantityWholesale ||
        detail.minQuantityWholesale <= 0,
    );

    if (invalid) {
      setLocalError(
        'Todos los productos deben tener cantidades y precios válidos',
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
        priceNormal: detail.priceNormal,
        priceCamino: detail.priceCamino,
        priceEspecial: detail.priceEspecial,
        priceMayorista: detail.priceMayorista,
        minQuantityWholesale: detail.minQuantityWholesale,
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

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            mb: 1.5,
            justifyContent: 'space-between',
            alignItems: {
              xs: 'stretch',
              sm: 'center',
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 800 }}
          >
            Agregar producto a la compra
          </Typography>

          {canCreateProduct && onCreateNewProduct && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                onCreateNewProduct(createCurrentDraft())
              }
              disabled={loading}
              sx={{
                fontWeight: 800,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Crea un nuevo Producto
            </Button>
          )}
        </Stack>

        <Paper
          variant="outlined"
          sx={{ p: 2, mb: 3 }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1.4fr 1.3fr 2fr 1fr 1fr',
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
                handleUnitPriceChange(
                  event.target.value,
                )
              }
              inputProps={decimalInputProps}
              disabled={loading}
            />
          </Box>

          {selectedProduct && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <Typography fontWeight={800}>
                Precios de venta propuestos
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Ajusta el porcentaje general o modifica cada
                precio manualmente.
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: '220px 1fr',
                  },
                  gap: 2,
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography fontWeight={700}>
                  Aumento: {marginPercentage}%
                </Typography>
                <Slider
                  value={marginPercentage}
                  min={0}
                  max={100}
                  step={1}
                  valueLabelDisplay="auto"
                  onChange={(_event, value) =>
                    handleMarginChange(
                      Array.isArray(value)
                        ? value[0]
                        : value,
                    )
                  }
                  disabled={loading}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(5, 1fr)',
                  },
                  gap: 1.5,
                }}
              >
                <TextField
                  type="number"
                  label="Precio Normal"
                  value={priceNormal}
                  onChange={(event) =>
                    setPriceNormal(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  inputProps={decimalInputProps}
                  disabled={loading}
                />
                <TextField
                  type="number"
                  label="Precio Camino"
                  value={priceCamino}
                  onChange={(event) =>
                    setPriceCamino(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  inputProps={decimalInputProps}
                  disabled={loading}
                />
                <TextField
                  type="number"
                  label="Precio Especial"
                  value={priceEspecial}
                  onChange={(event) =>
                    setPriceEspecial(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  inputProps={decimalInputProps}
                  disabled={loading}
                />
                <TextField
                  type="number"
                  label="Precio Mayorista"
                  value={priceMayorista}
                  onChange={(event) =>
                    setPriceMayorista(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  inputProps={decimalInputProps}
                  disabled={loading}
                />
                <TextField
                  type="number"
                  label="Cantidad mín. mayorista"
                  value={minQuantityWholesale}
                  onChange={(event) =>
                    setMinQuantityWholesale(
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                    )
                  }
                  inputProps={{
                    min: 1,
                    step: 1,
                    inputMode: 'numeric',
                  }}
                  disabled={loading}
                />
              </Box>
            </Box>
          )}

          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
              disabled={loading || !selectedProduct}
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
                            <Paper
                              key={
                                detail.productId
                              }
                              variant="outlined"
                              sx={{
                                p: 1.5,
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: {
                                    xs: '1fr',
                                    md: '2fr 1fr 1fr 1fr auto',
                                  },
                                  gap: 1,
                                  alignItems: 'center',
                                }}
                              >
                                <Typography fontWeight={700}>
                                  {product?.name ||
                                    detail.productId}
                                </Typography>

                                <TextField
                                  size="small"
                                  type="number"
                                  label="Cantidad"
                                  value={detail.quantity}
                                  onChange={(event) =>
                                    updateDetail(
                                      detail.productId,
                                      'quantity',
                                      event.target.value,
                                    )
                                  }
                                  inputProps={decimalInputProps}
                                />

                                <TextField
                                  size="small"
                                  type="number"
                                  label="P. compra"
                                  value={detail.unitPrice}
                                  onChange={(event) =>
                                    updateDetail(
                                      detail.productId,
                                      'unitPrice',
                                      event.target.value,
                                    )
                                  }
                                  inputProps={decimalInputProps}
                                />

                                <Typography fontWeight={800}>
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

                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(5, 1fr)',
                                  },
                                  gap: 1,
                                  mt: 1.5,
                                }}
                              >
                                {(
                                  [
                                    ['priceNormal', 'P. Normal'],
                                    ['priceCamino', 'P. Camino'],
                                    ['priceEspecial', 'P. Especial'],
                                    ['priceMayorista', 'P. Mayorista'],
                                    [
                                      'minQuantityWholesale',
                                      'Cant. mín. mayorista',
                                    ],
                                  ] as const
                                ).map(([field, label]) => (
                                  <TextField
                                    key={field}
                                    size="small"
                                    type="number"
                                    label={label}
                                    value={detail[field] ?? ''}
                                    onChange={(event) =>
                                      updateSalePrice(
                                        detail.productId,
                                        field,
                                        event.target.value,
                                      )
                                    }
                                    inputProps={
                                      field ===
                                      'minQuantityWholesale'
                                        ? {
                                            min: 1,
                                            step: 1,
                                            inputMode: 'numeric',
                                          }
                                        : decimalInputProps
                                    }
                                  />
                                ))}
                              </Box>
                            </Paper>
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
