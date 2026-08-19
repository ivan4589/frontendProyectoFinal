export interface SalePrices {
  priceNormal: number | null | undefined;
  priceCamino: number | null | undefined;
  priceEspecial: number | null | undefined;
  priceMayorista: number | null | undefined;
  minQuantityWholesale: number | null | undefined;
}

const isPositiveFiniteNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const isOptionalNonNegativeFiniteNumber = (
  value: number | null | undefined,
) =>
  value === null ||
  value === undefined ||
  (typeof value === 'number' && Number.isFinite(value) && value >= 0);

const isOptionalNonNegativeInteger = (
  value: number | null | undefined,
) =>
  value === null ||
  value === undefined ||
  (Number.isInteger(value) && value >= 0);

export function getSalePriceValidationError({
  priceNormal,
  priceCamino,
  priceEspecial,
  priceMayorista,
  minQuantityWholesale,
}: SalePrices): string | null {
  if (!isPositiveFiniteNumber(priceNormal)) {
    return 'El Precio Normal debe ser mayor a cero';
  }

  if (
    !isOptionalNonNegativeFiniteNumber(priceCamino) ||
    !isOptionalNonNegativeFiniteNumber(priceEspecial) ||
    !isOptionalNonNegativeFiniteNumber(priceMayorista)
  ) {
    return 'Los precios Camino, Especial y Mayorista deben ser cero o mayores, o quedar vacíos';
  }

  if (!isOptionalNonNegativeInteger(minQuantityWholesale)) {
    return 'La cantidad mínima mayorista debe ser un entero igual o mayor a cero, o quedar vacía';
  }

  return null;
}
