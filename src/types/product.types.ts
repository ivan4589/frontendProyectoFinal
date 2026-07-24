import type { Provider } from './provider.types';

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  products?: unknown[];
  subCategories?: SubCategory[];
  _count?: {
    products?: number;
    subCategories?: number;
  };
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
  products?: unknown[];
  _count?: {
    products?: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  providerId: string;
  provider?: Provider;
  categoryId: string;
  category?: Category;
  subCategoryId?: string | null;
  subCategory?: SubCategory | null;
  weight?: string | null;
  purchasePrice: number;
  priceNormal: number;
  priceCamino: number;
  priceEspecial: number;
  priceMayorista?: number | null;
  minQuantityWholesale?: number | null;
  stock: number;
  reservedStock?: number;
  centralStock?: number;
  centralReservedStock?: number;
  centralAvailableStock?: number;
  minStock: number;
  unit: string;
  reserveQuantity?: number | null;
  additionalInfo?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  providerId: string;
  categoryId: string;
  subCategoryId?: string;
  weight?: string;
  purchasePrice: number;
  priceNormal: number;
  priceCamino: number;
  priceEspecial: number;
  priceMayorista?: number;
  minQuantityWholesale?: number;
  stock?: number;
  reservedStock?: number;
  minStock?: number;
  unit?: string;
  reserveQuantity?: number;
  additionalInfo?: string;
  imageUrl?: string;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
}

export interface CreateSubCategoryRequest {
  name: string;
  categoryId: string;
}

export interface UpdateSubCategoryRequest {
  name?: string;
  categoryId?: string;
}
