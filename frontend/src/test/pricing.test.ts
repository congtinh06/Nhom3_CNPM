import { describe, expect, it } from 'vitest';
import {
  applySouvenirDiscount,
  isSouvenirDiscountEligible,
  SOUVENIR_DISCOUNT_PERCENT,
} from '../utils/pricing';

describe('Premium souvenir pricing', () => {
  it('exposes the configured 10 percent discount', () => {
    expect(SOUVENIR_DISCOUNT_PERCENT).toBe(10);
  });

  it('only discounts souvenirs for Premium members', () => {
    expect(isSouvenirDiscountEligible(true, 'SOUVENIR')).toBe(true);
    expect(isSouvenirDiscountEligible(false, 'SOUVENIR')).toBe(false);
    expect(isSouvenirDiscountEligible(true, 'FOOD')).toBe(false);
    expect(isSouvenirDiscountEligible(true, 'DRINK')).toBe(false);
    expect(isSouvenirDiscountEligible(true, undefined)).toBe(false);
  });

  it('rounds the discounted unit price to the nearest dong', () => {
    expect(applySouvenirDiscount(55000, true, 'SOUVENIR')).toBe(49500);
    expect(applySouvenirDiscount(15555, true, 'SOUVENIR')).toBe(14000);
  });

  it('leaves non-eligible prices untouched', () => {
    expect(applySouvenirDiscount(55000, false, 'SOUVENIR')).toBe(55000);
    expect(applySouvenirDiscount(30000, true, 'FOOD')).toBe(30000);
    expect(applySouvenirDiscount(Number.NaN, true, 'SOUVENIR')).toBeNaN();
  });
});
