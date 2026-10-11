import type { ClientType } from '../../types/client.types';
import type { Product } from '../../types/product.types';
import type { SaleDetail } from '../../types/sale.types';

export function getAutomaticPrice(
  product: Product,
  clientType: ClientType,
  quantity: number,
) {
  if (
    clientType === 'NORMAL' &&
    Number(product.priceMayorista) > 0 &&
    Number(product.minQuantityWholesale) > 0 &&
    quantity >= Number(product.minQuantityWholesale)
  ) return product.priceMayorista!;
  if (clientType === 'CAMINO') return product.priceCamino;
  if (clientType === 'ESPECIAL') return product.priceEspecial;
  return product.priceNormal;
}

export function prepareExistingDetail(
  detail: SaleDetail,
  product: Product | undefined,
  clientType: ClientType,
  isAdmin: boolean,
) {
  const automaticPrice = product
    ? getAutomaticPrice(product, clientType, detail.quantity)
    : detail.unitPrice;
  // Los detalles antiguos no almacenan manualPrice. Conservamos para ADMIN
  // un precio histórico distinto al catálogo; no marcamos todos como manuales.
  const manualPrice = isAdmin && (
    !product ||
    Math.round(detail.unitPrice * 100) !== Math.round(automaticPrice * 100)
  );
  return {
    productId: detail.productId,
    quantity: detail.quantity,
    unitPrice: isAdmin ? detail.unitPrice : automaticPrice,
    manualPrice,
  };
}
