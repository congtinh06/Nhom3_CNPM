import { describe, it, expect } from 'vitest';
import { formatPrice } from '../components/cart/CartDialog';

describe('formatPrice', () => {
  it('formats numbers to Vietnamese Dong currency format with đ suffix', () => {
    expect(formatPrice(29000)).toMatch(/29[.,]000đ/);
    expect(formatPrice(8000)).toMatch(/8[.,]000đ/);
    expect(formatPrice(0)).toBe('0đ');
    expect(formatPrice(1000000)).toMatch(/1[.,]000[.,]000đ/);
  });
});
