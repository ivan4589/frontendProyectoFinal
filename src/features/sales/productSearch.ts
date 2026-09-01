import type { Product } from '../../types/product.types';

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function productMatchesSearch(
  product: Pick<Product, 'code' | 'name'>,
  inputValue: string,
): boolean {
  const query = normalizeSearchText(inputValue);

  if (!query) return true;

  return [product.code, product.name].some((value) =>
    normalizeSearchText(value).includes(query),
  );
}
