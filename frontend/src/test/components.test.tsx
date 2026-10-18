import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { CartDialog } from '../components/cart/CartDialog';
import { PlacesToolbar } from '../components/places/PlacesToolbar';

describe('Component tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders CartDialog empty state', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <CartProvider>
            <CartDialog />
          </CartProvider>
        </ToastProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Giỏ hàng')).toBeInTheDocument();
    expect(screen.getByText(/Giỏ hàng.*trống/i)).toBeInTheDocument();
  });

  it('renders PlacesToolbar with search input and category chips', () => {
    const handleSearch = () => {};
    const handleSelectCategory = () => {};
    const handleLang = () => {};

    const categories = [
      { key: 'all', label: 'Tất cả' },
      { key: 'ls', label: 'Lịch sử' },
      { key: 'fav', label: 'Yêu thích' },
    ];

    render(
      <BrowserRouter>
        <PlacesToolbar
          searchQuery=""
          onSearchChange={handleSearch}
          categories={categories}
          selectedCategory="all"
          onSelectCategory={handleSelectCategory}
          lang="vi"
          onLangChange={handleLang}
        />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Tìm địa điểm')).toBeInTheDocument();
    expect(screen.getByText('Tất cả')).toBeInTheDocument();
    expect(screen.getByText('Lịch sử')).toBeInTheDocument();
    expect(screen.getByText('Yêu thích')).toBeInTheDocument();
    expect(screen.getByText('Gần tôi')).toBeInTheDocument();
    expect(screen.getByText('Quét mã QR')).toBeInTheDocument();
  });
});
