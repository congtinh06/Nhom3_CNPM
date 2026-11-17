import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, renderHook, act, waitFor, screen } from '@testing-library/react';
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

  it('adds items, updates quantities and calculates total amount correctly', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);

    // Add item 0: Cà phê sữa đá (29000)
    await act(async () => {
      await result.current.addToCart(0);
    });

    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalAmount).toBe(29000);

    // Add item 0 again
    await act(async () => {
      await result.current.addToCart(0);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalAmount).toBe(58000);

    // Add item 1: Bạc xỉu (32000)
    await act(async () => {
      await result.current.addToCart(1);
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

  it('supports adding Product objects and removes items by id', async () => {
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

    await act(async () => {
      await result.current.addToCart(sampleFood, 2);
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

  it('does not ask for fewer than six of the same product even when the cart has many different items', async () => {
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

    await act(async () => {
      expect(await result.current.addToCart(product, 3)).toBe(true);
    });

    await act(async () => {
      expect(await result.current.addToCart({ ...product, id: 102 }, 3)).toBe(true);
    });
    expect(result.current.totalCount).toBe(6);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('allows exactly five of one product without showing the confirmation', async () => {
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

    await act(async () => {
      await result.current.addToCart(product, 3);
      expect(await result.current.addToCart(product, 2)).toBe(true);
    });

    expect(result.current.cart[101]).toBe(5);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows an in-app confirmation when adding would exceed five of the same product', async () => {
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

    await act(async () => {
      await result.current.addToCart(product, 3);
    });

    let addition!: Promise<boolean>;
    act(() => {
      addition = result.current.addToCart(product, 3);
    });
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      'Món này đã vượt quá 5 sản phẩm. Bạn có chắc là muốn đặt thêm không?'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    await act(async () => {
      expect(await addition).toBe(false);
    });
    expect(result.current.cart[101]).toBe(3);
    expect(result.current.totalCount).toBe(3);
  });

  it('adds the product after the in-app confirmation is accepted', async () => {
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

    let addition!: Promise<boolean>;
    act(() => {
      addition = result.current.addToCart(product, 6);
    });
    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Vẫn thêm' }));
    await act(async () => {
      expect(await addition).toBe(true);
    });

    expect(result.current.cart[101]).toBe(6);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('confirms a bulk reorder when one product exceeds five and leaves the cart unchanged when canceled', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    let reorder!: Promise<boolean>;
    act(() => {
      reorder = result.current.reorderItems([
        { key: 101, quantity: 6, name: 'Quà A', price: 10000 },
      ]);
    });

    await screen.findByRole('alertdialog');
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    await act(async () => {
      expect(await reorder).toBe(false);
    });
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
