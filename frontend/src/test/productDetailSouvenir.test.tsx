import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { api } from '../api/client';
import { Product } from '../types';

function makeSouvenir(overrides: Partial<Product> = {}): Product {
  return {
    id: 3,
    slug: 'nam-cham-ben-thanh',
    name: 'Nam châm Chợ Bến Thành',
    category: 'SOUVENIR',
    shortDescription: 'Nam châm lưu niệm in hình Chợ Bến Thành',
    description: 'Nam châm được làm thủ công, phù hợp làm quà tặng.',
    price: 45000,
    prepTime: '10 - 15 phút',
    portion: '1 phần đầy đủ',
    hasDrinkOptions: false,
    imagePath: '/img/placeholder.jpg',
    poiId: 30001,
    poiSlug: 'cho-ben-thanh',
    isActive: true,
    sortOrder: 1,
    ...overrides,
  };
}

function makeRelatedSouvenir(overrides: Partial<Product> = {}): Product {
  return makeSouvenir({
    id: 4,
    slug: 'tranh-ben-thanh',
    name: 'Tranh Chợ Bến Thành',
    price: 120000,
    sortOrder: 2,
    ...overrides,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/am-thuc/nam-cham-ben-thanh']}>
      <ToastProvider>
        <CartProvider>
          <Routes>
            <Route path="/am-thuc/:slug" element={<ProductDetailPage />} />
          </Routes>
        </CartProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('ProductDetailPage - trang chi tiết quà lưu niệm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(api, 'getProductBySlug').mockResolvedValue(makeSouvenir());
    vi.spyOn(api, 'getProducts').mockResolvedValue({
      content: [makeSouvenir(), makeRelatedSouvenir()],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 200,
      first: true,
      last: true,
      empty: false,
    });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hiển thị đầy đủ trang chi tiết sản phẩm', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' })
    ).toBeInTheDocument();
    expect(screen.getByText('Nam châm lưu niệm in hình Chợ Bến Thành')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm vào giỏ hàng/i })).toBeInTheDocument();
  });

  it('ẩn các trường chỉ dành cho món ăn / đồ uống', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' });

    expect(screen.queryByText(/Chuẩn bị:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Khẩu phần:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Ghi chú khẩu vị:')).not.toBeInTheDocument();
    expect(screen.queryByText('Kích cỡ ly:')).not.toBeInTheDocument();
  });

  it('hiển thị sản phẩm liên quan lấy từ API', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' });

    expect(
      await screen.findByRole('heading', { name: /Gợi ý sản phẩm cùng danh mục/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Tranh Chợ Bến Thành')).toBeInTheDocument();
    expect(screen.queryByText('Nam châm Chợ Bến Thành', { selector: 'h4' })).not.toBeInTheDocument();
  });
});
