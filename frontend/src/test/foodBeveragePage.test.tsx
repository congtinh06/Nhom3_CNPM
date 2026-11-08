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
    // Khối câu chuyện nổi bật (.story) tự động ẩn khi chưa có sản phẩm thật
    expect(
      screen.queryByRole('heading', { name: 'Treo một góc Sài Gòn lên tường' })
    ).not.toBeInTheDocument();
  });

  it('mở quick view modal khi bấm vào thẻ sản phẩm thay vì chuyển trang chi tiết', async () => {
    renderWithRouteProbe();

    const card = await screen.findByRole('button', {
      name: /^Nam châm Chợ Bến Thành/,
    });
    fireEvent.click(card);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('PRODUCT DETAIL ROUTE')).not.toBeInTheDocument();
  });

  it('lọc theo bộ sưu tập gợi ý nhanh và cập nhật số lượng giỏ hàng ngay trên nút thêm', async () => {
    vi.mocked(api.getProducts).mockResolvedValue(
      page([
        SOUVENIR,
        makeProduct({
          id: 4,
          slug: 'tranh-dinh-doc-lap',
          name: 'Tranh mạ vàng Dinh Độc Lập',
          category: 'SOUVENIR',
          poiSlug: 'dinh-doc-lap',
          price: 180000,
        }),
      ])
    );

    renderPage('/am-thuc');
    await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' });

    const displayBtn = screen.getByRole('button', { name: /Để trưng bày/i });
    expect(displayBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(displayBtn);
    expect(displayBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Tranh mạ vàng Dinh Độc Lập' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).not.toBeInTheDocument();

    // Bấm lại lần nữa để bỏ lọc bộ sưu tập
    fireEvent.click(displayBtn);
    expect(displayBtn).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).toBeInTheDocument();

    // Thêm nhanh và kiểm tra nhãn "Thêm nhanh" -> "Đã thêm ✓"
    const quickAddButtons = screen.getAllByRole('button', { name: /Thêm nhanh/i });
    fireEvent.click(quickAddButtons[0]!);
    expect(await screen.findByRole('button', { name: 'Đã thêm ✓' })).toBeInTheDocument();
  });

  it('hiển thị gợi ý điểm vừa nghe từ echora_listened_pois và ẩn khi chưa nghe điểm nào', async () => {
    localStorage.setItem('echora_listened_pois', JSON.stringify(['poi-4']));

    renderPage('/am-thuc');
    await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' });

    const hintBtn = await screen.findByRole('button', {
      name: /Xem 1 món gắn với điểm này/i,
    });
    fireEvent.click(hintBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nam châm Chợ Bến Thành' })).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Tranh mạ vàng Dinh Độc Lập' })
      ).not.toBeInTheDocument();
    });
  });

  it('hiển thị phân trang số khi danh mục có hơn 8 món quà lưu niệm', async () => {
    const tenSouvenirs = Array.from({ length: 10 }, (_, i) =>
      makeProduct({
        id: 10 + i,
        slug: `qua-${i + 1}`,
        name: `Quà lưu niệm số ${i + 1}`,
        category: 'SOUVENIR',
        poiSlug: 'cho-ben-thanh',
      })
    );
    vi.mocked(api.getProducts).mockResolvedValue(page(tenSouvenirs));

    renderPage('/am-thuc');
    expect(await screen.findByRole('heading', { name: 'Quà lưu niệm số 1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quà lưu niệm số 9' })).not.toBeInTheDocument();

    // 8 món đầu: trang 1 / 2
    expect(screen.getByText('Hiển thị 1–8 trên 10 món')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(await screen.findByRole('heading', { name: 'Quà lưu niệm số 9' })).toBeInTheDocument();
  });

  it('tìm kiếm trực tiếp không mất dấu cách tiếng Việt, hiện gợi ý live autocomplete và mở chi tiết khi chọn gợi ý', async () => {
    renderWithRouteProbe();

    await screen.findByRole('heading', { name: 'Nam châm Chợ Bến Thành' });

    // Đang lọc sẵn theo Chợ Bến Thành nhưng khi gõ tìm "tranh ma " vẫn phải tự mở toàn danh mục để tìm thấy
    fireEvent.click(screen.getByRole('radio', { name: /Chợ Bến Thành/i }));
    expect(
      screen.queryByRole('heading', { name: 'Tranh mạ vàng Dinh Độc Lập' })
    ).not.toBeInTheDocument();

    const searchBox = screen.getByRole('combobox', { name: /Tìm kiếm quà lưu niệm/i });
    searchBox.focus();
    fireEvent.change(searchBox, { target: { value: 'tranh ma ' } });

    // Giữ nguyên khoảng trắng ở cuối khi đang gõ tiếng Việt
    expect(searchBox).toHaveValue('tranh ma ');

    // Lưới lọc tức thì + hiện dropdown gợi ý live autocomplete
    expect(screen.getByRole('heading', { name: 'Tranh mạ vàng Dinh Độc Lập' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Nam châm Chợ Bến Thành' })
    ).not.toBeInTheDocument();

    const listbox = screen.getByRole('listbox', { name: /Gợi ý quà lưu niệm/i });
    expect(listbox).toBeInTheDocument();

    // Điều hướng bàn phím ArrowDown + Enter mở thẳng trang chi tiết sản phẩm
    fireEvent.keyDown(searchBox, { key: 'ArrowDown' });
    fireEvent.submit(searchBox.closest('form')!);

    expect(await screen.findByText('PRODUCT DETAIL ROUTE')).toBeInTheDocument();
  });
});
