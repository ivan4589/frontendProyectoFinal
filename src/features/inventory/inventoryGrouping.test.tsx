import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { InventorySubcategory } from './InventorySubcategory';
import { filterInventoryProviders, inventorySubcategories, inventoryTotals } from './inventoryGrouping';
import type { CentralInventoryCategory, CentralInventoryProvider } from '../../types/inventory.types';

const products = [
  { productId: 'a', code: 'F-01', name: 'Figura uno', unit: 'UNIDAD', presentation: 'Arroba', subCategoryId: 's', subCategoryName: 'Fideo arroba', stock: 10, reservedStock: 2, availableStock: 8 },
  { productId: 'b', code: 'F-02', name: 'Figura dos', unit: 'UNIDAD', subCategoryId: 's', subCategoryName: 'Fideo arroba', stock: 20, reservedStock: 3, availableStock: 17 },
  { productId: 'c', code: 'N-01', name: 'Producto independiente', unit: 'UNIDAD', subCategoryId: null, stock: 5, reservedStock: 1, availableStock: 4 },
];
const category: CentralInventoryCategory = { categoryId: 'cat', categoryName: 'Fideos', products, ...inventoryTotals(products) };
const provider: CentralInventoryProvider = { providerId: 'p', providerName: 'Proveedor', categories: [category], totalProducts: 3, ...inventoryTotals(products) };

describe('inventario por subcategoría sin perder figuras', () => {
  it('conserva cada producto y suma los tres stocks separadamente', () => {
    const groups = inventorySubcategories(category);
    expect(groups.map(group => group.subCategoryName)).toEqual(['Fideo arroba', 'Sin subcategoría']);
    expect(groups[0].products.map(product => product.productId)).toEqual(['a', 'b']);
    expect(inventoryTotals(groups[0].products)).toEqual({ totalStock: 30, totalReservedStock: 5, totalAvailableStock: 25 });
  });
  it('busca por código, nombre y subcategoría manteniendo totales visibles', () => {
    expect(filterInventoryProviders([provider], 'f-02')[0].totalStock).toBe(20);
    expect(filterInventoryProviders([provider], 'figura uno')[0].totalProducts).toBe(1);
    expect(filterInventoryProviders([provider], 'FIDEO ÁRROBA')[0].totalProducts).toBe(2);
    expect(filterInventoryProviders([provider], 'inexistente')).toEqual([]);
  });
  it('no muta respuestas ni mezcla cantidades de otro almacén', () => {
    const before = JSON.stringify(provider);
    filterInventoryProviders([provider], 'F-01');
    expect(JSON.stringify(provider)).toBe(before);
    const other = { ...category, products: [{ ...products[0], stock: 100, reservedStock: 0, availableStock: 100 }] };
    expect(inventorySubcategories(other)[0].totalStock).toBe(100);
    expect(inventorySubcategories(category)[0].totalStock).toBe(30);
  });
  it('renderiza filas individuales, presentación, código y acciones de administrador', () => {
    const html = renderToStaticMarkup(<InventorySubcategory group={inventorySubcategories(category)[0]} idPrefix="central" isAdmin loading={false} onAdjust={() => {}} />);
    expect(html).toContain('data-product-id="a"');
    expect(html).toContain('data-product-id="b"');
    expect(html).toContain('F-01');
    expect(html).toContain('Arroba');
    expect(html).toContain('Ajustar Figura uno');
    expect(html).toContain('aria-expanded="true"');
  });
  it('permite iniciar colapsado y no muestra ajuste a roles no administradores', () => {
    const html = renderToStaticMarkup(<InventorySubcategory group={inventorySubcategories(category)[0]} idPrefix="central" isAdmin={false} loading={false} defaultExpanded={false} onAdjust={() => {}} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Ajustar Figura');
    expect(html).not.toContain('<details open');
  });
});
