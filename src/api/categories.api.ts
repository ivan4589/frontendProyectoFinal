import { api } from './axios';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/product.types';

function normalizeCategoriesResponse(data: unknown): Category[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === 'object' &&
    'categories' in data &&
    Array.isArray((data as { categories: unknown }).categories)
  ) {
    return (data as { categories: Category[] }).categories;
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Category[] }).data;
  }

  return [];
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<unknown>('/categories');
  return normalizeCategoriesResponse(response.data);
}

export async function createCategory(
  data: CreateCategoryRequest,
): Promise<Category> {
  const response = await api.post<Category>('/categories', data);
  return response.data;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryRequest,
): Promise<Category> {
  const response = await api.patch<Category>(`/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}