import { describe, expect, it } from 'vitest';
import type { Product } from '../../types/product.types';
import type { SaleDetail } from '../../types/sale.types';
import { getAutomaticPrice, prepareExistingDetail } from './salePricing';

const product = {
  id: 'p', priceNormal: 12, priceCamino: 11, priceEspecial: 10,
  priceMayorista: 9, minQuantityWholesale: 5,
} as Product;
const detail = { productId: 'p', quantity: 2, unitPrice: 12 } as SaleDetail;

describe('precios de preventas compartidas', () => {
  it('selecciona el precio por cliente y cantidad', () => {
    expect(getAutomaticPrice(product, 'NORMAL', 2)).toBe(12);
    expect(getAutomaticPrice(product, 'NORMAL', 5)).toBe(9);
    expect(getAutomaticPrice(product, 'CAMINO', 5)).toBe(11);
    expect(getAutomaticPrice(product, 'ESPECIAL', 5)).toBe(10);
  });
  it.each([
    { priceMayorista: 0 },
    { minQuantityWholesale: 0 },
    { priceMayorista: null, minQuantityWholesale: null },
  ])('no activa mayorista con configuración deshabilitada %j', (disabled) => {
    expect(getAutomaticPrice({ ...product, ...disabled }, 'NORMAL', 10)).toBe(12);
  });
  it('no convierte en manual un precio automático al reabrir como ADMIN', () => {
    expect(prepareExistingDetail(detail, product, 'NORMAL', true).manualPrice).toBe(false);
  });
  it('conserva el precio histórico distinto del catálogo para ADMIN', () => {
    expect(prepareExistingDetail({ ...detail, unitPrice: 8 }, product, 'NORMAL', true))
      .toEqual(expect.objectContaining({ unitPrice: 8, manualPrice: true }));
  });
  it('usa el precio automático y manualPrice=false para VENDEDOR', () => {
    expect(prepareExistingDetail({ ...detail, unitPrice: 8 }, product, 'CAMINO', false))
      .toEqual(expect.objectContaining({ unitPrice: 11, manualPrice: false }));
  });
});
