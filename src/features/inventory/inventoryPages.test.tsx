import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryPage } from './InventoryPage';
import { SalesPage } from '../sales/SalesPage';
import { inventoryTotals } from './inventoryGrouping';

// SSR no monta el contenido de una transición cerrada. Exponemos solamente
// ese contenedor en esta prueba para revisar el detalle interno existente.
vi.mock('@mui/material', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return { ...actual, Collapse: ({ children }: { children: import('react').ReactNode }) => <>{children}</> };
});

vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 1, role: 'ADMIN' } }) }));
vi.mock('../../api/inventory.api', () => ({ getCentralInventory: vi.fn(), generateCentralInventoryPdf: vi.fn(), adjustInventory: vi.fn() }));
vi.mock('../../api/documents.api', () => ({ downloadProtectedDocument: vi.fn() }));
vi.mock('../sales/SaleFormDialog', () => ({ SaleFormDialog: () => null }));
vi.mock('../sales/SaleReturnDialog', () => ({ SaleReturnDialog: () => null }));

describe('jerarquía y regresiones de documentos', () => {
  it('presenta proveedor, categoría, subcategoría y productos independientes', () => {
    const products = [
      { productId: 'a', code: 'A', name: 'Figura uno', unit: 'UNIDAD', subCategoryId: 's', subCategoryName: 'Fideo arroba', stock: 10, reservedStock: 2, availableStock: 8 },
      { productId: 'b', code: 'B', name: 'Producto sin relación', unit: 'UNIDAD', subCategoryId: null, stock: 5, reservedStock: 0, availableStock: 5 },
    ];
    const query = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    query.setQueryData(['inventory', 'central'], {
      warehouse: { id: 'central', name: 'Central', code: 'C' }, generatedAt: '2026-10-13', totalProducts: 2, ...inventoryTotals(products),
      providers: [{ providerId: 'p', providerName: 'Proveedor de prueba', totalProducts: 2, ...inventoryTotals(products), categories: [{ categoryId: 'cat', categoryName: 'Fideos', products, ...inventoryTotals(products) }] }],
    });
    const html = renderToStaticMarkup(<QueryClientProvider client={query}><InventoryPage /></QueryClientProvider>);
    for (const text of ['Proveedor de prueba', 'Fideos', 'Fideo arroba', 'Sin subcategoría', 'Figura uno', 'Producto sin relación', 'Generar PDF']) expect(html).toContain(text);
    expect(html).toContain('data-product-id="a"');
    expect(html).toContain('data-product-id="b"');
    query.clear();
  });
  it('ventas conserva botones de PDF protegido y WhatsApp sin resumir sus figuras', () => {
    const query = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    query.setQueryData(['sales'], [{ id: 'sale', saleNumber: 'TEST', clientId: 'client', clientName: 'Cliente', clientPhone: '71234567', clientWhatsAppConsent: true, userId: 1, userName: 'Administrador', status: 'CONFIRMED', paymentStatus: 'PENDING', saleType: 'CREDIT', subtotal: 50, discount: 0, total: 50, paidAmount: 0, balance: 50, date: '2026-10-13T12:00:00Z', createdAt: '2026-10-13T12:00:00Z', pdfUrl: '/api/documents/sales/sale', details: [{ id: 'a', productId: 'a', productName: 'Figura uno', quantity: 2, unitPrice: 10, subtotal: 20, returnedQuantity: 0 }, { id: 'b', productId: 'b', productName: 'Figura dos', quantity: 3, unitPrice: 10, subtotal: 30, returnedQuantity: 0 }] }]);
    for (const key of ['clients', 'products', 'categories', 'sub-categories']) query.setQueryData([key], []);
    const html = renderToStaticMarkup(<QueryClientProvider client={query}><SalesPage /></QueryClientProvider>);
    expect(html).toContain('FileDownloadIcon');
    expect(html).toContain('WhatsAppIcon');
    expect(html).toContain('Figura uno');
    expect(html).toContain('Figura dos');
    expect(html).not.toContain('Fideo arroba');
    query.clear();
  });
});
