import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from '../context/CartContext';

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(CartProvider, null, children)
  );

  it('adds items, updates quantities and calculates total amount correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);

    // Add item 0: Cà phê sữa đá (29000)
    act(() => {
      result.current.addToCart(0);
    });

    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalAmount).toBe(29000);

    // Add item 0 again
    act(() => {
      result.current.addToCart(0);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalAmount).toBe(58000);

    // Add item 1: Bạc xỉu (32000)
    act(() => {
      result.current.addToCart(1);
    });

    expect(result.current.totalCount).toBe(3);
    expect(result.current.totalAmount).toBe(90000);

    // Decrease item 0
    act(() => {
      result.current.decreaseQuantity(0);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalAmount).toBe(61000);

    // Clear cart
    act(() => {
      result.current.clearCart();
    });

    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('supports adding Product objects and removes items by id', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    const sampleFood = {
      id: 101,
      slug: 'com-tam-dem',
      name: 'Cơm tấm sườn nướng',
      category: 'FOOD' as const,
      shortDescription: 'Cơm tấm sườn thơm ngon',
      description: 'Mô tả chi tiết',
      price: 55000,
      imagePath: '/img/food.jpg',
      isActive: true,
      sortOrder: 1,
    };

    act(() => {
      result.current.addToCart(sampleFood, 2);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalAmount).toBe(110000);
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0]?.name).toBe('Cơm tấm sườn nướng');
    expect(result.current.cartItems[0]?.price).toBe(55000);

    // Update quantity
    act(() => {
      result.current.updateQuantity(101, 5);
    });
    expect(result.current.totalCount).toBe(5);
    expect(result.current.totalAmount).toBe(275000);

    // Remove item
    act(() => {
      result.current.removeFromCart(101);
    });
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.cartItems).toHaveLength(0);
  });

  it('restores products and quantities from localStorage', () => {
    localStorage.setItem('cart', JSON.stringify({ 200: 3 }));
    localStorage.setItem(
      'cart_meta',
      JSON.stringify({
        200: {
          name: 'Bánh mì đặc biệt',
          price: 35000,
          category: 'FOOD',
        },
      })
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.totalCount).toBe(3);
    expect(result.current.totalAmount).toBe(105000);
    expect(result.current.cartItems[0]?.name).toBe('Bánh mì đặc biệt');
  });
});

