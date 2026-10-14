import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { CartDialog } from '../components/cart/CartDialog';

const CartTestHarness: React.FC<{ initialOpen?: boolean }> = ({ initialOpen = false }) => {
  const { openCart, isCartOpen } = useCart();

  React.useEffect(() => {
    if (initialOpen) {
      openCart();
    }
  }, [initialOpen, openCart]);

  return (
    <div>
      <button type="button" data-testid="cart-trigger" onClick={openCart}>
        Mở giỏ ({isCartOpen ? 'Mở' : 'Đóng'})
      </button>
      <CartDialog />
    </div>
  );
};

const renderWithProviders = (
  initialCart?: Record<number, number>,
  initialMeta?: Record<string, unknown>,
  initialOpen: boolean = true
) => {
  if (initialCart) {
    localStorage.setItem('cart', JSON.stringify(initialCart));
  }
  if (initialMeta) {
    localStorage.setItem('cart_meta', JSON.stringify(initialMeta));
  }

  return render(
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <CartTestHarness initialOpen={initialOpen} />
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('CartDrawer Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders empty state with the food menu link', () => {
    renderWithProviders(undefined, undefined, true);

    expect(screen.getByText('Giỏ hàng')).toBeInTheDocument();
    expect(screen.getByText('Giỏ hàng của bạn đang trống.')).toBeInTheDocument();

    const menuBtn = screen.getByRole('button', { name: /Tiếp tục chọn món/i });
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveClass('cd-btn-primary');
  });

  it('renders items and subtotal when cart has items', () => {
    renderWithProviders(
      { 101: 2 },
      {
        101: {
          name: 'Cơm tấm sườn nướng',
          price: 55000,
          category: 'FOOD',
          imagePath: '/img/com-tam.jpg',
        },
      },
      true
    );

    expect(screen.getByText('Cơm tấm sườn nướng')).toBeInTheDocument();
    expect(screen.getByText('55.000đ')).toBeInTheDocument();
    expect(screen.getAllByText('110.000đ').length).toBe(2);

    const subtotalLabel = screen.getByText('Tổng cộng');
    expect(subtotalLabel).toBeInTheDocument();

    const checkoutBtn = screen.getByRole('button', { name: /Tiến hành thanh toán/i });
    expect(checkoutBtn).toBeInTheDocument();

    const ordersLink = screen.getByRole('button', { name: /Đơn hàng đã đặt/i });
    expect(ordersLink).toBeInTheDocument();
  });

  it('quantity buttons and remove button call the existing handlers', () => {
    renderWithProviders(
      { 101: 2 },
      {
        101: {
          name: 'Cơm tấm sườn nướng',
          price: 55000,
          category: 'FOOD',
        },
      },
      true
    );

    // Initial quantity is 2
    expect(screen.getByLabelText('Số lượng: 2')).toBeInTheDocument();

    // Increment
    const plusBtn = screen.getByRole('button', { name: /Tăng số lượng Cơm tấm sườn nướng/i });
    fireEvent.click(plusBtn);
    expect(screen.getByLabelText('Số lượng: 3')).toBeInTheDocument();

    // Decrement
    const minusBtn = screen.getByRole('button', { name: /Giảm số lượng Cơm tấm sườn nướng/i });
    fireEvent.click(minusBtn);
    expect(screen.getByLabelText('Số lượng: 2')).toBeInTheDocument();

    // Remove
    const removeBtn = screen.getByRole('button', { name: /Xóa Cơm tấm sườn nướng khỏi giỏ hàng/i });
    fireEvent.click(removeBtn);

    // Cart is now empty
    expect(screen.getByText('Giỏ hàng của bạn đang trống.')).toBeInTheDocument();
  });

  it('closes on Escape, backdrop click, and close button', () => {
    renderWithProviders(undefined, undefined, false);

    const trigger = screen.getByTestId('cart-trigger');
    const dialog = screen.getByRole('dialog', { hidden: true });

    // Open via trigger
    fireEvent.click(trigger);
    expect(dialog).toHaveAttribute('open');

    // 1. Close on Escape
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).not.toHaveAttribute('open');

    // 2. Open and close on close button
    fireEvent.click(trigger);
    expect(dialog).toHaveAttribute('open');

    const closeBtn = screen.getByRole('button', { name: /Đóng giỏ hàng/i });
    fireEvent.click(closeBtn);
    expect(dialog).not.toHaveAttribute('open');

    // 3. Open and close on backdrop click
    fireEvent.click(trigger);
    expect(dialog).toHaveAttribute('open');

    fireEvent.click(dialog);
    expect(dialog).not.toHaveAttribute('open');
  });

  it('returns focus to the trigger on close', () => {
    renderWithProviders(undefined, undefined, false);

    const trigger = screen.getByTestId('cart-trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    // Open drawer
    fireEvent.click(trigger);

    // Close drawer via close button
    const closeBtn = screen.getByRole('button', { name: /Đóng giỏ hàng/i });
    fireEvent.click(closeBtn);

    // Focus returns to the trigger
    expect(document.activeElement).toBe(trigger);
  });

  it('dialog has role="dialog", aria-modal="true", and aria-labelledby on the title', () => {
    renderWithProviders(undefined, undefined, true);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'cd-title');

    const title = screen.getByText('Giỏ hàng');
    expect(title).toHaveAttribute('id', 'cd-title');
  });
});
