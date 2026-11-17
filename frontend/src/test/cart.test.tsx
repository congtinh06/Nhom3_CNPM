import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from '../context/CartContext';

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('asks before adding more than five total items and keeps the cart unchanged when declined', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = {
      id: 101,
      slug: 'souvenir',
      name: 'Quà lưu niệm',
      category: 'SOUVENIR' as const,
      shortDescription: '',
      description: '',
      price: 10000,
      imagePath: '/img/souvenir.jpg',
      isActive: true,
      sortOrder: 1,
    };

    act(() => {
      expect(result.current.addToCart(product, 5)).toBe(true);
    });

    expect(result.current.totalCount).toBe(5);
    expect(confirm).not.toHaveBeenCalled();

    act(() => {
      expect(result.current.addToCart(product)).toBe(false);
    });

    expect(confirm).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith(
      'Bạn đang đặt quá nhiều sản phẩm (hơn 5 sản phẩm). Bạn có chắc là muốn đặt thêm không?'
    );
    expect(result.current.totalCount).toBe(5);
  });

  it('adds more than five items when the user confirms the warning', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      expect(result.current.addToCart(0, 6)).toBe(true);
    });

    expect(result.current.totalCount).toBe(6);
  });

  it('confirms a bulk reorder once using the combined item quantity', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      expect(
        result.current.reorderItems([
          { key: 101, quantity: 3, name: 'Quà A', price: 10000 },
          { key: 102, quantity: 3, name: 'Quà B', price: 10000 },
        ])
      ).toBe(false);
    });

    expect(confirm).toHaveBeenCalledOnce();
    expect(result.current.totalCount).toBe(0);
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

  it('dọn khóa giỏ hàng mồ côi (sản phẩm không còn phân giải được) và không tính vào totalCount', async () => {
    // 987654 không có meta, không phải đồ uống, không thuộc catalog tĩnh => mồ côi.
    localStorage.setItem('cart', JSON.stringify({ 987654: 4, 0: 2 }));

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.totalCount).toBe(2);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0]?.id).toBe(0);

    const stored = JSON.parse(localStorage.getItem('cart') || '{}');
    expect(stored).not.toHaveProperty('987654');
    expect(stored).toHaveProperty('0');
  });
});
