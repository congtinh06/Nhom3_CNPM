import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FoodBeveragePage } from '../pages/FoodBeveragePage';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { api } from '../api/client';
import { Product, PageResponse } from '../types';

function makeProduct(overrides: Partial<Product> & Pick<Product, 'id' | 'slug' | 'name' | 'category'>): Product {
  return {
    shortDescription: `Mô tả: ${overrides.name}`,
    description: `Chi tiết: ${overrides.name}`,
    price: 50000,
    imagePath: '/img/placeholder.jpg',
    isActive: true,
    sortOrder: overrides.id,
    ...overrides,
  };
}

const FOOD = makeProduct({
  id: 1,
  slug: 'com-tam',
  name: 'Cơm tấm sườn nướng',
  category: 'FOOD',
  poiSlug: 'cho-ben-thanh',
});
const DRINK = makeProduct({
  id: 2,
  slug: 'ca-phe-sua-da',
  name: 'Cà phê sữa đá',
  category: 'DRINK',
  poiSlug: 'dinh-doc-lap',
});
const SOUVENIR = makeProduct({
  id: 3,
  slug: 'nam-cham-ben-thanh',
  name: 'Nam châm Chợ Bến Thành',
  category: 'SOUVENIR',
  poiSlug: 'cho-ben-thanh',
});
const SOUVENIR_2 = makeProduct({
  id: 4,
  slug: 'tranh-dinh-doc-lap',
  name: 'Tranh mạ vàng Dinh Độc Lập',
  category: 'SOUVENIR',
  poiSlug: 'dinh-doc-lap',
});

function page(list: Product[]): PageResponse<Product> {
  return {
    content: list,
    totalPages: 1,
    totalElements: list.length,
    number: 0,
    size: list.length,
    first: true,
    last: true,
    empty: list.length === 0,
  };
}

function renderPage(initialRoute = '/am-thuc') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <CartProvider>
          <FoodBeveragePage />
        </CartProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

function renderWithRouteProbe() {
  return render(
    <MemoryRouter initialEntries={['/am-thuc']}>
      <ToastProvider>
        <CartProvider>
          <Routes>
            <Route path="/am-thuc" element={<FoodBeveragePage />} />
            <Route path="/am-thuc/:slug" element={<div>PRODUCT DETAIL ROUTE</div>} />
          </Routes>
        </CartProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('FoodBeveragePage - trang Quà lưu niệm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(api, 'getProducts').mockResolvedValue(page([FOOD, DRINK, SOUVENIR, SOUVENIR_2]));
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('chỉ hiển thị quà lưu niệm, bỏ hết món ăn và đồ uống', async () => {
    renderPage('/am-thuc');

    expect(await screen.findByRole('heading', { name: 'Quà lưu niệm Sài Gòn' })).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tranh mạ vàng Dinh Độc Lập' })).toBeInTheDocument();

    // Món ăn / đồ uống không còn xuất hiện
    expect(screen.queryByRole('heading', { name: 'Cơm tấm sườn nướng' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cà phê sữa đá' })).not.toBeInTheDocument();
  });

  it('không còn tab "Món ngon quanh điểm"', async () => {
    renderPage('/am-thuc');

    await screen.findByRole('heading', { name: 'Quà lưu niệm Sài Gòn' });
    expect(screen.queryByRole('tab', { name: 'Món ngon quanh điểm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('lọc theo điểm du lịch trong sidebar', async () => {
    renderPage('/am-thuc');

    expect(await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).toBeInTheDocument();

    // Chọn điểm "Dinh Độc Lập" (chỉ có Tranh mạ vàng gắn điểm này)
    fireEvent.click(await screen.findByRole('radio', { name: /Dinh Độc Lập/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tranh mạ vàng Dinh Độc Lập' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).not.toBeInTheDocument();
    });
  });

  it('hiển thị trạng thái rỗng khi API không trả về sản phẩm', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(page([]));

    renderPage('/am-thuc');

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).not.toBeInTheDocument();
    });
    expect(await screen.findByRole('heading', { name: 'Quà lưu niệm Sài Gòn' })).toBeInTheDocument();
  });

  it('mở trang chi tiết khi bấm vào thẻ sản phẩm thay vì mở modal', async () => {
    renderWithRouteProbe();

    const card = await screen.findByRole('button', {
      name: /^Nam châm Chợ Bến Thành/,
    });
    fireEvent.click(card);

    expect(await screen.findByText('PRODUCT DETAIL ROUTE')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
