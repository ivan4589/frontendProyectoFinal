import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Provider } from '../../types/provider.types';
import type {
  Category,
  CreateProductRequest,
  Product,
  SubCategory,
} from '../../types/product.types';

interface ProductFormDialogProps {
  open: boolean;
  product?: Product | null;
  providers: Provider[];
  categories: Category[];
  subCategories: SubCategory[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest) => void;
}

interface ProductFormValues {
  name: string;
  description: string;
  providerId: string;
  categoryId: string;
  subCategoryId: string;
  weight: string;
  purchasePrice: number;
  priceNormal: number;
  priceCamino: number;
  priceEspecial: number;
  priceMayorista: number | '';
  minQuantityWholesale: number | '';
  stock: number | '';
  minStock: number | '';
  unit: string;
  reserveQuantity: number | '';
  additionalInfo: string;
  imageUrl: string;
}

function numberOrUndefined(value: number | '') {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function ProductFormDialog({
  open,
  product,
  providers,
  categories,
  subCategories,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      description: '',
      providerId: '',
      categoryId: '',
      subCategoryId: '',
      weight: '',
      purchasePrice: 0,
      priceNormal: 0,
      priceCamino: 0,
      priceEspecial: 0,
      priceMayorista: '',
      minQuantityWholesale: '',
      stock: 0,
      minStock: 0,
      unit: 'UNIDAD',
      reserveQuantity: 0,
      additionalInfo: '',
      imageUrl: '',
    },
  });

  const selectedCategoryId = watch('categoryId');

  const availableSubCategories = useMemo(() => {
    return subCategories.filter(
      (subCategory) => subCategory.categoryId === selectedCategoryId,
    );
  }, [subCategories, selectedCategoryId]);

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name || '',
        description: product?.description || '',
        providerId: product?.providerId || '',
        categoryId: product?.categoryId || '',
        subCategoryId: product?.subCategoryId || '',
        weight: product?.weight || '',
        purchasePrice: product?.purchasePrice ?? 0,
        priceNormal: product?.priceNormal ?? 0,
        priceCamino: product?.priceCamino ?? 0,
        priceEspecial: product?.priceEspecial ?? 0,
        priceMayorista: product?.priceMayorista ?? '',
        minQuantityWholesale: product?.minQuantityWholesale ?? '',
        stock: product?.stock ?? 0,
        minStock: product?.minStock ?? 0,
        unit: product?.unit || 'UNIDAD',
        reserveQuantity: product?.reserveQuantity ?? 0,
        additionalInfo: product?.additionalInfo || '',
        imageUrl: product?.imageUrl || '',
      });

      setLocalError(null);
    }
  }, [open, product, reset]);

  const submitForm = (values: ProductFormValues) => {
    setLocalError(null);

    if (!values.providerId) {
      setLocalError('Debes seleccionar un proveedor');
      return;
    }

    if (!values.categoryId) {
      setLocalError('Debes seleccionar una categoría');
      return;
    }

    const data: CreateProductRequest = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      providerId: values.providerId,
      categoryId: values.categoryId,
      subCategoryId: values.subCategoryId || undefined,
      weight: values.weight.trim() || undefined,
      purchasePrice: Number(values.purchasePrice),
      priceNormal: Number(values.priceNormal),
      priceCamino: Number(values.priceCamino),
      priceEspecial: Number(values.priceEspecial),
      priceMayorista: numberOrUndefined(values.priceMayorista),
      minQuantityWholesale: numberOrUndefined(values.minQuantityWholesale),
      stock: numberOrUndefined(values.stock),
      minStock: numberOrUndefined(values.minStock),
      unit: values.unit.trim() || 'UNIDAD',
      reserveQuantity: numberOrUndefined(values.reserveQuantity),
      additionalInfo: values.additionalInfo.trim() || undefined,
      imageUrl: values.imageUrl.trim() || undefined,
    };

    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{product ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>

      <Box component="form" onSubmit={handleSubmit(submitForm)}>
        <DialogContent dividers>
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || localError}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre del producto"
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register('name', {
                required: 'El nombre es obligatorio',
                minLength: {
                  value: 2,
                  message: 'Debe tener al menos 2 caracteres',
                },
              })}
            />

            <TextField
              fullWidth
              label="Unidad"
              placeholder="UNIDAD, CAJA, PAQUETE..."
              {...register('unit')}
            />

            <TextField
              select
              fullWidth
              label="Proveedor"
              defaultValue=""
              error={Boolean(errors.providerId)}
              helperText={errors.providerId?.message}
              {...register('providerId', {
                required: 'El proveedor es obligatorio',
              })}
            >
              <MenuItem value="">Seleccionar proveedor</MenuItem>
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.companyName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Categoría"
              defaultValue=""
              error={Boolean(errors.categoryId)}
              helperText={errors.categoryId?.message}
              {...register('categoryId', {
                required: 'La categoría es obligatoria',
              })}
            >
              <MenuItem value="">Seleccionar categoría</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField select fullWidth label="Subcategoría" defaultValue="" {...register('subCategoryId')}>
              <MenuItem value="">Sin subcategoría</MenuItem>
              {availableSubCategories.map((subCategory) => (
                <MenuItem key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField fullWidth label="Peso / Presentación" placeholder="Ej: 400g, 1L, 12 unidades" {...register('weight')} />

            <TextField
              fullWidth
              type="number"
              label="Precio compra"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('purchasePrice', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio normal"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('priceNormal', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio camino"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('priceCamino', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio especial"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('priceEspecial', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio mayorista"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('priceMayorista', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Cantidad mínima mayorista"
              inputProps={{ min: 0 }}
              {...register('minQuantityWholesale', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Stock"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('stock', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Stock mínimo"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('minStock', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Cantidad reservada"
              inputProps={{ min: 0, step: '0.01' }}
              {...register('reserveQuantity', { valueAsNumber: true })}
            />

            <TextField fullWidth label="URL imagen" {...register('imageUrl')} />
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Descripción"
            margin="normal"
            {...register('description')}
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Información adicional"
            margin="normal"
            {...register('additionalInfo')}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear producto'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}