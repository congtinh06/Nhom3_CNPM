import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from '../context/CartContext';
import { Product } from '../types';

const premiumState = vi.hoisted(() => ({ isPremium: true }));

vi.mock('../context/PremiumContext', () => ({
  usePremium: () => ({ isPremium: premiumState.isPremium }),
}));

const souvenir: Product = {
  id: 201,
  slug: 'tuong-luu-niem',
  name: 'Tượng lưu niệm',
  category: 'SOUVENIR',
  shortDescription: 'Quà lưu niệm',
  description: 'Quà lưu niệm',
  price: 50000,
  imagePath: '/img/souvenir.jpg',
  isActive: true,
  sortOrder: 1,
};

const food: Product = {
  ...souvenir,
  id: 202,
  slug: 'banh-mi',
  name: 'Bánh mì',
  category: 'FOOD',
  price: 30000,
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(CartProvider, null, children);

describe('CartContext Premium souvenir discount', () => {
  beforeEach(() => {
    localStorage.clear();
    premiumState.isPremium = true;
  });

  it('discounts only souvenir lines and keeps the original subtotal', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(souvenir, 2);
      result.current.addToCart(food, 1);
    });

    expect(result.current.subtotalAmount).toBe(130000);
    expect(result.current.discountAmount).toBe(10000);
    expect(result.current.totalAmount).toBe(120000);
  });

  it('does not discount anything for non-Premium members', () => {
    premiumState.isPremium = false;
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(souvenir, 2);
    });

    expect(result.current.subtotalAmount).toBe(100000);
    expect(result.current.discountAmount).toBe(0);
    expect(result.current.totalAmount).toBe(100000);
  });
});
