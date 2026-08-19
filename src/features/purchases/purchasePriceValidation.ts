export interface SalePrices {
  priceNormal: number | null | undefined;
  priceCamino: number | null | undefined;
  priceEspecial: number | null | undefined;
  priceMayorista: number | null | undefined;
}

const isPositiveFiniteNumber = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const isNonNegativeFiniteNumber = (
  value: number | null | undefined,
) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function getSalePriceValidationError({
  priceNormal,
  priceCamino,
  priceEspecial,
  priceMayorista,
}: SalePrices): string | null {
  if (
    !isPositiveFiniteNumber(priceNormal) ||
    !isPositiveFiniteNumber(priceCamino) ||
    !isPositiveFiniteNumber(priceMayorista)
  ) {
    return 'Los precios Normal, Camino y Mayorista deben ser mayores a cero';
  }

  if (!isNonNegativeFiniteNumber(priceEspecial)) {
    return 'El Precio Especial debe ser cero o mayor';
  }

  return null;
}
