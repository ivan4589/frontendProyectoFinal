import { describe, expect, it } from 'vitest';
import { productMatchesSearch } from './productSearch';

const product = {
  code: 'PRD-ABC123',
  name: 'Café Molido Premium',
};

describe('productMatchesSearch', () => {
  it('encuentra un producto por una parte de su código', () => {
    expect(productMatchesSearch(product, 'abc123')).toBe(true);
  });

  it('encuentra un producto por nombre sin distinguir acentos', () => {
    expect(productMatchesSearch(product, 'cafe molido')).toBe(true);
  });

  it('descarta productos que no coinciden con código ni nombre', () => {
    expect(productMatchesSearch(product, 'galletas')).toBe(false);
  });
});
