import { api } from './axios';
import type {
  CreateSubCategoryRequest,
  SubCategory,
  UpdateSubCategoryRequest,
} from '../types/product.types';

function normalizeSubCategoriesResponse(data: unknown): SubCategory[] {
  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === 'object' &&
    'subCategories' in data &&
    Array.isArray((data as { subCategories: unknown }).subCategories)
  ) {
    return (data as { subCategories: SubCategory[] }).subCategories;
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: SubCategory[] }).data;
  }

  return [];
}

export async function getSubCategories(params?: {
  categoryId?: string;
}): Promise<SubCategory[]> {
  const response = await api.get<unknown>('/sub-categories', { params });
  return normalizeSubCategoriesResponse(response.data);
}

export async function createSubCategory(
  data: CreateSubCategoryRequest,
): Promise<SubCategory> {
  const response = await api.post<SubCategory>('/sub-categories', data);
  return response.data;
}

export async function updateSubCategory(
  id: string,
  data: UpdateSubCategoryRequest,
): Promise<SubCategory> {
  const response = await api.patch<SubCategory>(`/sub-categories/${id}`, data);
  return response.data;
}

export async function deleteSubCategory(id: string): Promise<void> {
  await api.delete(`/sub-categories/${id}`);
}