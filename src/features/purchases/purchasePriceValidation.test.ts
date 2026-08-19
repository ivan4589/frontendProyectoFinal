import { describe, expect, it } from 'vitest';

import { getSalePriceValidationError } from './purchasePriceValidation';

const validPrices = {
  priceNormal: 76,
  priceCamino: 76,
  priceEspecial: 10,
  priceMayorista: 75,
};

describe('getSalePriceValidationError', () => {
  it('permite que el Precio Especial sea cero', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        priceEspecial: 0,
      }),
    ).toBeNull();
  });

  it('permite un Precio Especial mayor a cero', () => {
    expect(getSalePriceValidationError(validPrices)).toBeNull();
  });

  it('rechaza un Precio Especial negativo', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        priceEspecial: -1,
      }),
    ).toBe('El Precio Especial debe ser cero o mayor');
  });

  it.each([
    ['Normal', { priceNormal: 0 }],
    ['Camino', { priceCamino: 0 }],
    ['Mayorista', { priceMayorista: 0 }],
    ['Mayorista vacío', { priceMayorista: null }],
  ])('mantiene el Precio %s como obligatorio y positivo', (_name, price) => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        ...price,
      }),
    ).toBe(
      'Los precios Normal, Camino y Mayorista deben ser mayores a cero',
    );
  });

  it('rechaza valores no finitos', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        priceEspecial: Number.NaN,
      }),
    ).toBe('El Precio Especial debe ser cero o mayor');
  });
});
