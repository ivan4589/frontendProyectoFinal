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
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { uploadProductImage } from '../../api/uploads.api';
import { getImageUrl } from '../../utils/getImageUrl';
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
  code: string;
  name: string;
  description: string;
  providerId: string;
  categoryId: string;
  subCategoryId: string;
  weight: string;
  purchasePrice: number | '';
  priceNormal: number | '';
  priceCamino: number | '';
  priceEspecial: number | '';
  priceMayorista: number | '';
  minQuantityWholesale: number | '';
  stock: number | '';
  minStock: number | '';
  unit: string;
  reserveQuantity: number | '';
  additionalInfo: string;
}

const decimalSlotProps = {
  htmlInput: {
    min: 0,
    step: 'any',
    inputMode: 'decimal' as const,
  },
};

const integerSlotProps = {
  htmlInput: {
    min: 0,
    step: 1,
    inputMode: 'numeric' as const,
  },
};

function numberOrZero(value: number | '') {
  if (value === '') return 0;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function numberOrUndefined(value: number | '') {
  if (value === '') return undefined;

  const parsed = Number(value);

  return Number.isNaN(parsed) ? undefined : parsed;
}

function getProductProviderId(product?: Product | null) {
  return product?.providerId || product?.provider?.id || '';
}

function getProductCategoryId(product?: Product | null) {
  return product?.categoryId || product?.category?.id || '';
}

function getProductSubCategoryId(product?: Product | null) {
  return product?.subCategoryId || product?.subCategory?.id || '';
}

function getUploadErrorMessage(error: unknown) {
  const anyError = error as any;
  const message = anyError?.response?.data?.message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  if (anyError?.message) return anyError.message;

  return 'No se pudo subir la imagen del producto.';
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      code: '',
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
    },
  });

  const selectedCategoryId = watch('categoryId');

  const availableSubCategories = useMemo(() => {
    return subCategories.filter(
      (subCategory) => subCategory.categoryId === selectedCategoryId,
    );
  }, [subCategories, selectedCategoryId]);

  useEffect(() => {
    if (!open) return;

    const providerId = getProductProviderId(product);
    const categoryId = getProductCategoryId(product);
    const subCategoryId = getProductSubCategoryId(product);

    reset({
      code: product?.code || '',
      name: product?.name || '',
      description: product?.description || '',
      providerId,
      categoryId,
      subCategoryId,
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
    });

    setCurrentImageUrl(product?.imageUrl || '');
    setImagePreview(product?.imageUrl ? getImageUrl(product.imageUrl) : '');
    setSelectedImageFile(null);
    setLocalError(null);
    setUploadingImage(false);
  }, [open, product, reset]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setValue('subCategoryId', '');
      return;
    }

    const currentSubCategoryId = getProductSubCategoryId(product);

    const existsInSelectedCategory = subCategories.some(
      (subCategory) =>
        subCategory.id === currentSubCategoryId &&
        subCategory.categoryId === selectedCategoryId,
    );

    if (!existsInSelectedCategory && open) {
      const currentValue = watch('subCategoryId');

      const currentStillValid = subCategories.some(
        (subCategory) =>
          subCategory.id === currentValue &&
          subCategory.categoryId === selectedCategoryId,
      );

      if (!currentStillValid) {
        setValue('subCategoryId', '');
      }
    }
  }, [selectedCategoryId, subCategories, product, open, setValue, watch]);

  const handleSelectImage = (file?: File) => {
    setLocalError(null);

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setLocalError('Formato no permitido. Usa JPG, JPEG, PNG o WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLocalError('La imagen no debe superar los 2MB.');
      return;
    }

    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const submitForm = async (values: ProductFormValues) => {
    try {
      setLocalError(null);

      if (!values.providerId) {
        setLocalError('Debes seleccionar un proveedor');
        return;
      }

      if (!values.categoryId) {
        setLocalError('Debes seleccionar una categoría');
        return;
      }

      let finalImageUrl = currentImageUrl || undefined;

      if (selectedImageFile) {
        setUploadingImage(true);
        const uploaded = await uploadProductImage(selectedImageFile);
        finalImageUrl = uploaded.imageUrl;
        setUploadingImage(false);
      }

      const data: CreateProductRequest = {
        code: values.code.trim().toUpperCase() || undefined,
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        providerId: values.providerId,
        categoryId: values.categoryId,
        subCategoryId: values.subCategoryId || undefined,
        weight: values.weight.trim() || undefined,
        purchasePrice: numberOrZero(values.purchasePrice),
        priceNormal: numberOrZero(values.priceNormal),
        priceCamino: numberOrZero(values.priceCamino),
        priceEspecial: numberOrZero(values.priceEspecial),
        priceMayorista: numberOrUndefined(values.priceMayorista),
        minQuantityWholesale: numberOrUndefined(values.minQuantityWholesale),
        stock: numberOrUndefined(values.stock),
        minStock: numberOrUndefined(values.minStock),
        unit: values.unit.trim() || 'UNIDAD',
        reserveQuantity: numberOrUndefined(values.reserveQuantity),
        additionalInfo: values.additionalInfo.trim() || undefined,
        imageUrl: finalImageUrl,
      };

      onSubmit(data);
    } catch (uploadError) {
      setUploadingImage(false);
      setLocalError(getUploadErrorMessage(uploadError));
    }
  };

  const isBusy = loading || uploadingImage;

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{product ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>

      <Box component="form" onSubmit={handleSubmit(submitForm)}>
        <DialogContent dividers>
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || localError}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '160px 1fr' },
              gap: 2,
              mb: 2,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 140,
                height: 140,
                borderRadius: 2,
                border: '1px dashed #b0bec5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#f7f9fb',
              }}
            >
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Producto"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <ImageIcon sx={{ fontSize: 54, color: '#90a4ae' }} />
              )}
            </Box>

            <Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                disabled={isBusy}
                sx={{ fontWeight: 800, textTransform: 'none' }}
              >
                Seleccionar imagen
                <input
                  hidden
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(event) => handleSelectImage(event.target.files?.[0])}
                />
              </Button>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Formatos permitidos: JPG, JPEG, PNG o WEBP. Tamaño máximo: 2MB.
              </Typography>

              {selectedImageFile && (
                <Typography variant="caption" color="success.main" fontWeight={700}>
                  Imagen seleccionada: {selectedImageFile.name}
                </Typography>
              )}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Código del producto"
              placeholder="Se genera automáticamente si queda vacío"
              error={Boolean(errors.code)}
              helperText={
                errors.code?.message ||
                (product
                  ? 'Identificador comercial único del producto.'
                  : 'Opcional: el sistema generará un código único.')
              }
              {...register('code', {
                maxLength: {
                  value: 40,
                  message: 'El código no puede superar 40 caracteres',
                },
                pattern: {
                  value: /^[A-Za-z0-9-]*$/,
                  message: 'Usa solamente letras, números y guiones',
                },
              })}
            />

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

            <Controller
              name="providerId"
              control={control}
              rules={{ required: 'El proveedor es obligatorio' }}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  fullWidth
                  label="Proveedor"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="">Seleccionar proveedor</MenuItem>
                  {providers.map((provider) => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {provider.companyName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="categoryId"
              control={control}
              rules={{ required: 'La categoría es obligatoria' }}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  fullWidth
                  label="Categoría"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="">Seleccionar categoría</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="subCategoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Subcategoría"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <MenuItem value="">Sin subcategoría</MenuItem>
                  {availableSubCategories.map((subCategory) => (
                    <MenuItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField
              fullWidth
              label="Peso / Presentación"
              placeholder="Ej: 400g, 1L, 12 unidades"
              {...register('weight')}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio compra"
              slotProps={decimalSlotProps}
              {...register('purchasePrice', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio normal"
              slotProps={decimalSlotProps}
              {...register('priceNormal', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio camino"
              slotProps={decimalSlotProps}
              {...register('priceCamino', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio especial"
              slotProps={decimalSlotProps}
              {...register('priceEspecial', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Precio mayorista"
              slotProps={decimalSlotProps}
              {...register('priceMayorista', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Cantidad mínima mayorista"
              slotProps={integerSlotProps}
              {...register('minQuantityWholesale', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Stock actual"
              slotProps={decimalSlotProps}
              {...register('stock', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Stock mínimo"
              slotProps={decimalSlotProps}
              {...register('minStock', { valueAsNumber: true })}
            />

            <TextField
              fullWidth
              type="number"
              label="Cantidad reserva / alerta"
              slotProps={decimalSlotProps}
              helperText="Amarillo si está debajo de reserva. Rojo si llega al stock mínimo."
              {...register('reserveQuantity', { valueAsNumber: true })}
            />
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
          <Button onClick={onClose} disabled={isBusy}>
            Cancelar
          </Button>

          <Button type="submit" variant="contained" disabled={isBusy}>
            {uploadingImage
              ? 'Subiendo imagen...'
              : loading
                ? 'Guardando...'
                : product
                  ? 'Actualizar'
                  : 'Crear producto'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
