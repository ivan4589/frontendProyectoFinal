import { api } from './axios';
import type {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '../types/product.types';
import {
  downloadSpreadsheet,
  importSpreadsheet,
  previewSpreadsheet,
} from './spreadsheets.api';

function normalizeProductsResponse(data: unknown): Product[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'products' in data && Array.isArray((data as { products: unknown }).products)) {
    return (data as { products: Product[] }).products;
  }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: Product[] }).data;
  }
  return [];
}

export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  providerId?: string;
  includeInactive?: boolean;
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

export async function updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deactivateProduct(id: string, reason: string): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}/deactivate`, { reason });
  return response.data;
}

export async function reactivateProduct(id: string, reason: string): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}/reactivate`, { reason });
  return response.data;
}

export function downloadProductSpreadsheetTemplate() {
  return downloadSpreadsheet(
    '/products/spreadsheet/template',
    'plantilla-importacion-productos.xlsx',
  );
}

export function exportProductsSpreadsheet() {
  return downloadSpreadsheet('/products/spreadsheet/export', 'productos.xlsx');
}

export function previewProductsSpreadsheet(file: File) {
  return previewSpreadsheet('/products/spreadsheet/preview', file);
}

export function importProductsSpreadsheet(file: File) {
  return importSpreadsheet('/products/spreadsheet/import', file);
}
