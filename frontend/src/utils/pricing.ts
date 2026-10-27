import { ProductCategory } from '../types';

export const SOUVENIR_DISCOUNT_PERCENT = 10;

export function isSouvenirDiscountEligible(
  isPremium: boolean,
  category?: ProductCategory | null
): boolean {
  return isPremium && category === 'SOUVENIR';
}

export function applySouvenirDiscount(
  price: number,
  isPremium: boolean,
  category?: ProductCategory | null
): number {
  if (!Number.isFinite(price) || !isSouvenirDiscountEligible(isPremium, category)) {
    return price;
  }
  return Math.round((price * (100 - SOUVENIR_DISCOUNT_PERCENT)) / 100);
}
