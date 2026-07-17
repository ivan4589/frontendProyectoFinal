import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useState } from 'react';
import type { Category, SubCategory } from '../../types/product.types';

interface CategoriesDialogProps {
  open: boolean;
  categories: Category[];
  subCategories: SubCategory[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onCreateCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (category: Category) => void;
  onCreateSubCategory: (name: string, categoryId: string) => void;
  onUpdateSubCategory: (id: string, name: string, categoryId: string) => void;
  onDeleteSubCategory: (subCategory: SubCategory) => void;
}

export function CategoriesDialog({
  open,
  categories,
  subCategories,
  loading = false,
  error,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateSubCategory,
  onUpdateSubCategory,
  onDeleteSubCategory,
}: CategoriesDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [subCategoryName, setSubCategoryName] = useState('');
  const [subCategoryCategoryId, setSubCategoryCategoryId] = useState('');
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);

  const saveCategory = () => {
    const name = categoryName.trim();
    if (!name) return;

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, name);
    } else {
      onCreateCategory(name);
    }

    setCategoryName('');
    setEditingCategory(null);
  };

  const saveSubCategory = () => {
    const name = subCategoryName.trim();
    if (!name || !subCategoryCategoryId) return;

    if (editingSubCategory) {
      onUpdateSubCategory(editingSubCategory.id, name, subCategoryCategoryId);
    } else {
      onCreateSubCategory(name, subCategoryCategoryId);
    }

    setSubCategoryName('');
    setSubCategoryCategoryId('');
    setEditingSubCategory(null);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Categorías y Subcategorías</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Categorías
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                disabled={loading}
              />

              <Button variant="contained" onClick={saveCategory} disabled={loading || !categoryName.trim()}>
                {editingCategory ? 'Actualizar' : 'Agregar'}
              </Button>
            </Stack>

            {editingCategory && (
              <Button
                size="small"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryName('');
                }}
                disabled={loading}
                sx={{ mb: 1 }}
              >
                Cancelar edición
              </Button>
            )}

            <Stack spacing={1}>
              {categories.map((category) => (
                <Box
                  key={category.id}
                  sx={{
                    border: '1px solid #edf0f2',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CategoryIcon color="success" />
                    <Box>
                      <Typography fontWeight={800}>{category.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {category.id.slice(0, 8)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <IconButton
                      size="small"
                      disabled={loading}
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryName(category.name);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      disabled={loading}
                      onClick={() => onDeleteCategory(category)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}

              {categories.length === 0 && (
                <Alert severity="info">No hay categorías registradas.</Alert>
              )}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Subcategorías
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label={editingSubCategory ? 'Editar subcategoría' : 'Nueva subcategoría'}
                value={subCategoryName}
                onChange={(event) => setSubCategoryName(event.target.value)}
                disabled={loading}
              />

              <TextField
                select
                fullWidth
                size="small"
                label="Categoría padre"
                value={subCategoryCategoryId}
                onChange={(event) => setSubCategoryCategoryId(event.target.value)}
                disabled={loading}
              >
                <MenuItem value="">Seleccionar categoría</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={saveSubCategory}
                  disabled={loading || !subCategoryName.trim() || !subCategoryCategoryId}
                >
                  {editingSubCategory ? 'Actualizar' : 'Agregar'}
                </Button>

                {editingSubCategory && (
                  <Button
                    onClick={() => {
                      setEditingSubCategory(null);
                      setSubCategoryName('');
                      setSubCategoryCategoryId('');
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                )}
              </Stack>
            </Stack>

            <Stack spacing={1}>
              {subCategories.map((subCategory) => (
                <Box
                  key={subCategory.id}
                  sx={{
                    border: '1px solid #edf0f2',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountTreeIcon color="primary" />
                    <Box>
                      <Typography fontWeight={800}>{subCategory.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {categories.find((category) => category.id === subCategory.categoryId)?.name || 'Sin categoría'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <IconButton
                      size="small"
                      disabled={loading}
                      onClick={() => {
                        setEditingSubCategory(subCategory);
                        setSubCategoryName(subCategory.name);
                        setSubCategoryCategoryId(subCategory.categoryId);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      disabled={loading}
                      onClick={() => onDeleteSubCategory(subCategory)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}

              {subCategories.length === 0 && (
                <Alert severity="info">No hay subcategorías registradas.</Alert>
              )}
            </Stack>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}