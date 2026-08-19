import { describe, expect, it } from 'vitest';

import { getSalePriceValidationError } from './purchasePriceValidation';

const validPrices = {
  priceNormal: 76,
  priceCamino: 76,
  priceEspecial: 10,
  priceMayorista: 75,
  minQuantityWholesale: 20,
};

describe('getSalePriceValidationError', () => {
  it('permite que los campos opcionales sean cero', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        priceCamino: 0,
        priceEspecial: 0,
        priceMayorista: 0,
        minQuantityWholesale: 0,
      }),
    ).toBeNull();
  });

  it('permite que los campos opcionales estén vacíos', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        priceCamino: null,
        priceEspecial: null,
        priceMayorista: null,
        minQuantityWholesale: null,
      }),
    ).toBeNull();
  });

  it('mantiene el Precio Normal como obligatorio y positivo', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        priceNormal: 0,
      }),
    ).toBe('El Precio Normal debe ser mayor a cero');
  });

  it.each([
    ['Camino', { priceCamino: -1 }],
    ['Especial', { priceEspecial: -1 }],
    ['Mayorista', { priceMayorista: -1 }],
  ])('rechaza un Precio %s negativo', (_name, price) => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        ...price,
      }),
    ).toBe(
      'Los precios Camino, Especial y Mayorista deben ser cero o mayores, o quedar vacíos',
    );
  });

  it('rechaza una cantidad mínima mayorista negativa o decimal', () => {
    expect(
      getSalePriceValidationError({
        ...validPrices,
        minQuantityWholesale: -1,
      }),
    ).toBe(
      'La cantidad mínima mayorista debe ser un entero igual o mayor a cero, o quedar vacía',
    );

    expect(
      getSalePriceValidationError({
        ...validPrices,
        minQuantityWholesale: 1.5,
      }),
    ).toBe(
      'La cantidad mínima mayorista debe ser un entero igual o mayor a cero, o quedar vacía',
    );
  });
});
