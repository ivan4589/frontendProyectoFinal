import type { CentralInventoryCategory, CentralInventoryProduct, CentralInventoryProvider, CentralInventorySubCategory } from '../../types/inventory.types';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const round = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;
export function inventoryTotals(products: readonly CentralInventoryProduct[]) {
  return {
    totalStock: round(products.reduce((sum, product) => sum + product.stock, 0)),
    totalReservedStock: round(products.reduce((sum, product) => sum + product.reservedStock, 0)),
    totalAvailableStock: round(products.reduce((sum, product) => sum + product.availableStock, 0)),
  };
}
export function inventorySubcategories(category: CentralInventoryCategory): CentralInventorySubCategory[] {
  if (category.subCategories) return category.subCategories;
  // Compatibilidad con respuestas anteriores: ninguna fila de producto se pierde.
  const groups = new Map<string | null, CentralInventorySubCategory>();
  for (const product of category.products) {
    const id = product.subCategoryId ?? null;
    const group = groups.get(id) ?? {
      subCategoryId: id, subCategoryName: id ? (product.subCategoryName || 'Subcategoría') : 'Sin subcategoría',
      products: [], totalStock: 0, totalReservedStock: 0, totalAvailableStock: 0,
    };
    group.products.push(product);
    groups.set(id, group);
  }
  return [...groups.values()].map(group => ({ ...group, ...inventoryTotals(group.products) }));
}
export function filterInventoryProviders(providers: readonly CentralInventoryProvider[], query: string): CentralInventoryProvider[] {
  const search = normalize(query);
  return providers.map(provider => {
    const categories = provider.categories.map(category => {
      const subCategories = inventorySubcategories(category).map(group => {
        const products = group.products.filter(product => !search || [
          provider.providerName, category.categoryName, group.subCategoryName,
          product.code, product.name, product.presentation || '', product.unit,
        ].some(value => normalize(value).includes(search)));
        return { ...group, products, ...inventoryTotals(products) };
      }).filter(group => group.products.length > 0);
      const products = subCategories.flatMap(group => group.products);
      return { ...category, products, subCategories, ...inventoryTotals(products) };
    }).filter(category => category.products.length > 0);
    const products = categories.flatMap(category => category.products);
    return { ...provider, categories, totalProducts: products.length, ...inventoryTotals(products) };
  }).filter(provider => provider.categories.length > 0);
}
