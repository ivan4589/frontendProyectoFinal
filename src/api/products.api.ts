import { api } from './axios';
import type {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '../types/product.types';

function normalizeProductsResponse(data: unknown): Product[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === 'object' &&
    'products' in data &&
    Array.isArray((data as { products: unknown }).products)
  ) {
    return (data as { products: Product[] }).products;
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Product[] }).data;
  }

  return [];
}

export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  providerId?: string;
}): Promise<Product[]> {
  const response = await api.get<unknown>('/products', { params });
  return normalizeProductsResponse(response.data);
}

export async function getProductById(id: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const response = await api.post<Product>('/products', data);
  return response.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}