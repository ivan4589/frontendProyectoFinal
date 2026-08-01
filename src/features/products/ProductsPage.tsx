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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreIcon from "@mui/icons-material/Restore";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { getProviders } from "../../api/providers.api";
import {
  createProduct,
  deactivateProduct,
  getProducts,
  reactivateProduct,
  updateProduct,
} from "../../api/products.api";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/categories.api";
import {
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  updateSubCategory,
} from "../../api/subCategories.api";
import { Loading } from "../../components/common/Loading";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { useAuth } from "../auth/AuthContext";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import type { Provider } from "../../types/provider.types";
import type {
  Category,
  CreateProductRequest,
  Product,
  SubCategory,
  UpdateProductRequest,
} from "../../types/product.types";
import { ProductFormDialog } from "./ProductFormDialog";
import { CategoriesDialog } from "./CategoriesDialog";
import ImageIcon from "@mui/icons-material/Image";
import { getImageUrl } from "../../utils/getImageUrl";
import { requestEconomicReason } from "../../utils/economicOperation";
import type {
  CreateProductFromPurchaseState,
  ReturnToPurchaseState,
} from "../purchases/PurchaseFormDialog";

function getErrorMessage(error: unknown) {
  const anyError = error as any;
  const message = anyError?.response?.data?.message;
  const errorText = anyError?.response?.data?.error;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  if (typeof errorText === 'string') return errorText;

  if (anyError?.response?.status === 403) {
    return 'No tienes permiso para realizar esta acción.';
  }

  if (anyError?.response?.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (anyError?.response?.status === 400) {
    return 'No se pudo completar la operación. Revisa los datos enviados.';
  }

  if (anyError?.message) return anyError.message;

  return 'Ocurrió un error inesperado.';
}


function getCategoryName(product: Product, categories: Category[]) {
  if (product.category?.name) return product.category.name;
  return (
    categories.find((category) => category.id === product.categoryId)?.name ||
    "-"
  );
}

function getSubCategoryName(product: Product, subCategories: SubCategory[]) {
  if (product.subCategory?.name) return product.subCategory.name;
  if (!product.subCategoryId) return "-";
  return (
    subCategories.find((item) => item.id === product.subCategoryId)?.name || "-"
  );
}

function getProviderName(product: Product, providers: Provider[]) {
  if (product.provider?.companyName) return product.provider.companyName;
  return (
    providers.find((provider) => provider.id === product.providerId)
      ?.companyName || "-"
  );
}

function getStockStatus(product: Product) {
  const stock = Number(product.stock || 0);
  const minStock = Number(product.minStock || 0);
  const reserveQuantity = Number(product.reserveQuantity || 0);

  if (minStock > 0 && stock <= minStock) {
    return {
      label: "Stock crítico",
      bg: "#ffebee",
      color: "#d32f2f",
      avatarBg: "#ffebee",
      avatarColor: "#d32f2f",
    };
  }

  if (reserveQuantity > 0 && stock <= reserveQuantity) {
    return {
      label: "Stock en reserva",
      bg: "#fff8e1",
      color: "#f57c00",
      avatarBg: "#fff3e0",
      avatarColor: "#ef6c00",
    };
  }

  return {
    label: "Stock normal",
    bg: "#e8f5e9",
    color: "#2e7d32",
    avatarBg: "#e8f5e9",
    avatarColor: "#005b3f",
  };
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const openedFromPurchaseRef = useRef(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const purchaseNavigationState =
    location.state as CreateProductFromPurchaseState | null;
  const creatingFromPurchase =
    purchaseNavigationState?.fromPurchase === true;

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !creatingFromPurchase ||
      !isAdmin ||
      openedFromPurchaseRef.current
    ) {
      return;
    }

    openedFromPurchaseRef.current = true;
    setSelectedProduct(null);
    setProductFormError(null);
    setProductDialogOpen(true);
  }, [creatingFromPurchase, isAdmin]);

  const returnToPurchase = (
    createdProductId: string | null,
  ) => {
    if (!purchaseNavigationState?.fromPurchase) {
      return;
    }

    const returnState: ReturnToPurchaseState = {
      returnToPurchase: true,
      purchaseDraft:
        purchaseNavigationState.purchaseDraft,
      purchaseId: purchaseNavigationState.purchaseId,
      createdProductId,
    };

    navigate("/purchases", {
      replace: true,
      state: returnState,
    });
  };

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsIsError,
    error: productsError,
  } = useQuery({
    queryKey: ["products", { includeInactive: isAdmin }],
    queryFn: () => getProducts({ includeInactive: isAdmin }),
  });

  const {
    data: providers = [],
    isLoading: providersLoading,
    isError: providersIsError,
    error: providersError,
  } = useQuery({
    queryKey: ["providers", { includeInactive: isAdmin }],
    queryFn: () => getProviders({ includeInactive: isAdmin }),
    enabled: isAdmin,
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesIsError,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const {
    data: subCategories = [],
    isLoading: subCategoriesLoading,
    isError: subCategoriesIsError,
    error: subCategoriesError,
  } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: () => getSubCategories(),
  });

  const filteredProducts = useMemo(() => {
    const text = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesText =
        !text ||
        [
          product.name,
          product.description,
          product.unit,
          product.weight,
          product.additionalInfo,
          getCategoryName(product, categories),
          getSubCategoryName(product, subCategories),
          getProviderName(product, providers),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text));

      const matchesCategory =
        categoryFilter === "ALL" || product.categoryId === categoryFilter;

      const matchesProvider =
        providerFilter === "ALL" || product.providerId === providerFilter;

      return matchesText && matchesCategory && matchesProvider;
    });
  }, [
    products,
    categories,
    subCategories,
    providers,
    search,
    categoryFilter,
    providerFilter,
  ]);

  const summary = useMemo(() => {
    const activeProducts = products.filter((product) => product.isActive !== false);
    const lowStock = activeProducts.filter(
      (product) => product.minStock > 0 && product.stock <= product.minStock,
    ).length;

    const totalStock = activeProducts.reduce(
      (sum, product) => sum + product.stock,
      0,
    );

    const inventoryValue = activeProducts.reduce(
      (sum, product) => sum + product.stock * Number(product.purchasePrice || 0),
      0,
    );

    return {
      total: activeProducts.length,
      totalStock,
      lowStock,
      categories: categories.length,
      inventoryValue,
    };
  }, [products, categories]);

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (createdProduct) => {
      queryClient.setQueryData<Product[]>(
        ["products"],
        (current = []) => [
          ...current.filter(
            (product) => product.id !== createdProduct.id,
          ),
          createdProduct,
        ],
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });

      if (creatingFromPurchase) {
        returnToPurchase(createdProduct.id);
        return;
      }

      setProductDialogOpen(false);
      setSelectedProduct(null);
      setProductFormError(null);
    },
    onError: (mutationError) => {
      setProductFormError(getErrorMessage(mutationError));
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductDialogOpen(false);
      setSelectedProduct(null);
      setProductFormError(null);
    },
    onError: (mutationError) => {
      setProductFormError(getErrorMessage(mutationError));
    },
  });

  const productStatusMutation = useMutation({
    mutationFn: ({ id, active, reason }: { id: string; active: boolean; reason: string }) =>
      active ? reactivateProduct(id, reason) : deactivateProduct(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (mutationError) => alert(getErrorMessage(mutationError)),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryError(null);
    },
    onError: (mutationError) => {
      setCategoryError(getErrorMessage(mutationError));
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCategory(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCategoryError(null);
    },
    onError: (mutationError) => {
      setCategoryError(getErrorMessage(mutationError));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCategoryError(null);
    },
    onError: (mutationError) => {
      setCategoryError(getErrorMessage(mutationError));
    },
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      setCategoryError(null);
    },
    onError: (mutationError) => {
      setCategoryError(getErrorMessage(mutationError));
    },
  });

  const updateSubCategoryMutation = useMutation({
    mutationFn: ({
      id,
      name,
      categoryId,
    }: {
      id: string;
      name: string;
      categoryId: string;
    }) => updateSubCategory(id, { name, categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCategoryError(null);
    },
    onError: (mutationError) => {
      setCategoryError(getErrorMessage(mutationError));
    },
  });

  const deleteSubCategoryMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCategoryError(null);
    },
    onError: (mutationError) => {
      setCategoryError(getErrorMessage(mutationError));
    },
  });

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setProductFormError(null);
    setProductDialogOpen(true);
  };

  const handleCloseProductDialog = () => {
    if (creatingFromPurchase) {
      returnToPurchase(null);
      return;
    }

    setProductDialogOpen(false);
    setSelectedProduct(null);
    setProductFormError(null);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductFormError(null);
    setProductDialogOpen(true);
  };

  const handleToggleProduct = (product: Product) => {
    const active = product.isActive === false;
    const action = active ? 'reactivar' : 'desactivar';
    const reason = requestEconomicReason(`${action} el producto ${product.name}`);
    if (!reason) return;
    productStatusMutation.mutate({ id: product.id, active, reason });
  };

  const handleSubmitProduct = (data: CreateProductRequest) => {
    if (selectedProduct) {
      const priceFields: Array<keyof CreateProductRequest> = [
        'purchasePrice', 'priceNormal', 'priceCamino', 'priceEspecial', 'priceMayorista',
      ];
      const changedPrices = priceFields.some((field) =>
        data[field] !== undefined && Number(data[field]) !== Number(selectedProduct[field as keyof Product]),
      );
      const changeReason = changedPrices
        ? requestEconomicReason(`cambiar precios del producto ${selectedProduct.name}`)
        : undefined;
      if (changedPrices && !changeReason) return;
      updateProductMutation.mutate({
        id: selectedProduct.id,
        data: { ...data, changeReason: changeReason || undefined },
      });
      return;
    }

    createProductMutation.mutate(data);
  };

  const categoryLoading =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    deleteCategoryMutation.isPending ||
    createSubCategoryMutation.isPending ||
    updateSubCategoryMutation.isPending ||
    deleteSubCategoryMutation.isPending;

  const productLoading =
    createProductMutation.isPending || updateProductMutation.isPending || productStatusMutation.isPending;

  if (
    productsLoading ||
    (isAdmin && providersLoading) ||
    categoriesLoading ||
    subCategoriesLoading
  ) {
    return <Loading message="Cargando productos..." />;
  }

  if (productsIsError)
    return <ErrorMessage message={getErrorMessage(productsError)} />;
  if (isAdmin && providersIsError)
    return <ErrorMessage message={getErrorMessage(providersError)} />;
  if (categoriesIsError)
    return <ErrorMessage message={getErrorMessage(categoriesError)} />;
  if (subCategoriesIsError)
    return <ErrorMessage message={getErrorMessage(subCategoriesError)} />;

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Gestión de Productos
        </Typography>

        <Typography color="text.secondary">
          Control de productos, precios, stock, categorías y subcategorías.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                TOTAL PRODUCTOS
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {summary.total}
              </Typography>
              <Typography variant="caption" color="success.main">
                Registrados
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#e3f2fd", color: "#1565c0" }}>
              <InventoryIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            STOCK TOTAL
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.totalStock}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Unidades
          </Typography>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
              >
                STOCK BAJO
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {summary.lowStock}
              </Typography>
              <Typography
                variant="caption"
                color={summary.lowStock > 0 ? "error.main" : "success.main"}
              >
                Alertas
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#ffebee", color: "#d32f2f" }}>
              <WarningAmberIcon />
            </Avatar>
          </Stack>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            CATEGORÍAS
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {summary.categories}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Registradas
          </Typography>
        </Card>

        {isAdmin && <Card sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary">
            VALOR INVENTARIO
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {formatCurrency(summary.inventoryValue)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Según costo
          </Typography>
        </Card>}
      </Box>

      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Tu rol permite consultar productos. La creación, edición y eliminación
          están reservadas para administradores.
        </Alert>
      )}

      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Listado de Productos
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Mostrando {filteredProducts.length} de {products.length} productos
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Buscar producto..."
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
              label="Categoría"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="ALL">Todas</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Proveedor"
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.companyName}
                </MenuItem>
              ))}
            </TextField>

            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<ManageSearchIcon />}
                onClick={() => setCategoriesDialogOpen(true)}
                sx={{ fontWeight: 800, textTransform: "none" }}
              >
                Categorías
              </Button>
            )}

            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateProduct}
                sx={{
                  backgroundColor: "#005b3f",
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#00432f",
                  },
                }}
              >
                Nuevo producto
              </Button>
            )}
          </Stack>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 800,
                    fontSize: 12,
                    color: "text.secondary",
                    textTransform: "uppercase",
                    backgroundColor: "#f7f9fb",
                  },
                }}
              >
                <TableCell>Producto</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Precios</TableCell>
                <TableCell>Registro</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="info">
                      No se encontraron productos con los filtros seleccionados.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}

              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);

                return (
                  <TableRow
                    key={product.id}
                    hover
                    sx={{ opacity: product.isActive === false ? 0.6 : 1, "& td": { borderColor: "#edf0f2" } }}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid #edf0f2",
                            bgcolor: stockStatus.avatarBg,
                            color: stockStatus.avatarColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {product.imageUrl ? (
                            <Box
                              component="img"
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <ImageIcon fontSize="small" />
                          )}
                        </Box>

                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontWeight={800}>{product.name}</Typography>
                            <Chip size="small" label={product.isActive === false ? 'Inactivo' : 'Activo'} color={product.isActive === false ? 'default' : 'success'} variant="outlined" />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {product.weight ||
                              product.unit ||
                              `ID: ${product.id.slice(0, 8)}`}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip
                          size="small"
                          icon={<CategoryIcon />}
                          label={getCategoryName(product, categories)}
                          sx={{
                            bgcolor: "#e3f2fd",
                            color: "#1565c0",
                            fontWeight: 700,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {getSubCategoryName(product, subCategories)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <StorefrontIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {getProviderName(product, providers)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.5}>
                        <Chip
                          size="small"
                          label={`${product.stock} ${product.unit || ""}`}
                          sx={{
                            bgcolor: stockStatus.bg,
                            color: stockStatus.color,
                            fontWeight: 800,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Mínimo: {product.minStock} | Reserva:{" "}
                          {product.reserveQuantity || 0}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: stockStatus.color,
                            fontWeight: 700,
                          }}
                        >
                          {stockStatus.label}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.2}>
                        <Typography variant="body2">
                          Normal:{" "}
                          <strong>{formatCurrency(product.priceNormal)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Camino:{" "}
                          <strong>{formatCurrency(product.priceCamino)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Especial:{" "}
                          <strong>
                            {formatCurrency(product.priceEspecial)}
                          </strong>
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(product.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      {isAdmin ? (
                        <>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              disabled={product.isActive === false}
                              onClick={() => handleEditProduct(product)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={product.isActive === false ? 'Reactivar' : 'Desactivar'}>
                            <IconButton
                              size="small"
                              color={product.isActive === false ? 'success' : 'error'}
                              disabled={productStatusMutation.isPending}
                              onClick={() => handleToggleProduct(product)}
                            >
                              {product.isActive === false ? <RestoreIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Chip
                          size="small"
                          label="Solo lectura"
                          sx={{
                            bgcolor: "#eef2f4",
                            color: "text.secondary",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ProductFormDialog
        open={productDialogOpen}
        product={selectedProduct}
        providers={providers.filter((provider) => provider.isActive !== false)}
        categories={categories}
        subCategories={subCategories}
        loading={productLoading}
        error={productFormError}
        onClose={handleCloseProductDialog}
        onSubmit={handleSubmitProduct}
      />

      <CategoriesDialog
        open={categoriesDialogOpen}
        categories={categories}
        subCategories={subCategories}
        loading={categoryLoading}
        error={categoryError}
        onClose={() => {
          setCategoriesDialogOpen(false);
          setCategoryError(null);
        }}
        onCreateCategory={(name) => createCategoryMutation.mutate({ name })}
        onUpdateCategory={(id, name) =>
          updateCategoryMutation.mutate({ id, name })
        }
        onDeleteCategory={(category) => {
          const confirmed = window.confirm(
            `¿Seguro que deseas eliminar la categoría "${category.name}"? Si tiene productos asociados, el backend puede bloquear la eliminación.`,
          );
          if (confirmed) deleteCategoryMutation.mutate(category.id);
        }}
        onCreateSubCategory={(name, categoryId) =>
          createSubCategoryMutation.mutate({ name, categoryId })
        }
        onUpdateSubCategory={(id, name, categoryId) =>
          updateSubCategoryMutation.mutate({ id, name, categoryId })
        }
        onDeleteSubCategory={(subCategory) => {
          const confirmed = window.confirm(
            `¿Seguro que deseas eliminar la subcategoría "${subCategory.name}"?`,
          );
          if (confirmed) deleteSubCategoryMutation.mutate(subCategory.id);
        }}
      />
    </>
  );
}
