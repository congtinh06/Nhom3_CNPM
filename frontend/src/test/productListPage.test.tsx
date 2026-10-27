import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductListPage } from '../admin/pages/ProductListPage';
import { productApi } from '../admin/api/productApi';
import { Product } from '../admin/types/product';

vi.mock('../admin/api/productApi', () => ({
  productApi: {
    getProducts: vi.fn(),
    updateProductStatus: vi.fn(),
    updateProductSortOrder: vi.fn(),
  },
}));

describe('ProductListPage', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      slug: 'com-tam-suon-bi-cha',
      name: 'Cơm tấm sườn bì chả',
      category: 'FOOD',
      shortDescription: 'Cơm tấm Sài Gòn đậm đà',
      description: 'Món ăn đặc sản',
      price: 55000,
      imagePath: '/img/products/com-tam-suon-bi-cha.jpg',
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 2,
      slug: 'ca-phe-sua-da',
      name: 'Cà phê sữa đá',
      category: 'DRINK',
      shortDescription: 'Cà phê pha phin truyền thống',
      description: 'Đặc trưng Sài Gòn',
      price: 25000,
      imagePath: '/img/products/ca-phe-sua-da.jpg',
      isActive: false,
      sortOrder: 2,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (initialPath = '/quan-tri/san-pham') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/quan-tri/san-pham" element={<ProductListPage />} />
          <Route path="/quan-tri/san-pham/moi" element={<div>Trang tạo mới</div>} />
          <Route path="/quan-tri/san-pham/:id" element={<div>Trang chỉnh sửa</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('hiển thị danh sách sản phẩm với tên, danh mục, giá bán và trạng thái', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValueOnce({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });

    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: /quản lý quà lưu niệm/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cơm tấm sườn bì chả')).toBeInTheDocument();
      expect(screen.getByText('com-tam-suon-bi-cha')).toBeInTheDocument();
      expect(screen.getByText('Món ăn')).toBeInTheDocument();
      expect(screen.getByText('55.000 đ')).toBeInTheDocument();

      expect(screen.getByText('Cà phê sữa đá')).toBeInTheDocument();
      expect(screen.getByText('Đồ uống')).toBeInTheDocument();
      expect(screen.getByText('25.000 đ')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(within(table).getByText('Hoạt động')).toBeInTheDocument();
    expect(within(table).getAllByText('Tạm ngưng').length).toBeGreaterThanOrEqual(1);
  });

  it('hiển thị ErrorState kèm nút Thử lại khi API gặp lỗi, và thử lại tải thành công', async () => {
    vi.mocked(productApi.getProducts)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce({
        content: [mockProducts[0]!],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: false,
      });

    renderComponent();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/không thể tải danh sách sản phẩm/i);

    const retryBtn = screen.getByRole('button', { name: /thử lại/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Cơm tấm sườn bì chả')).toBeInTheDocument();
    });
  });

  it('hiển thị EmptyState khi không có sản phẩm nào phù hợp với bộ lọc', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValueOnce({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: true,
    });

    renderComponent('/quan-tri/san-pham?search=khong-ton-tai');

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument();
    });

    const clearBtn = screen.getByRole('button', { name: /xóa toàn bộ bộ lọc/i });
    expect(clearBtn).toBeInTheDocument();
  });

  it('quy trình tạm ngưng sản phẩm: mở ConfirmDialog, hủy bỏ không gọi API, xác nhận gọi API một lần và cập nhật trạng thái', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValueOnce({
      content: [mockProducts[0]!],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cơm tấm sườn bì chả')).toBeInTheDocument();
    });

    // Click nút "Tạm ngưng"
    const suspendBtn = screen.getByRole('button', { name: /tạm ngưng cơm tấm sườn bì chả/i });
    fireEvent.click(suspendBtn);

    // Confirm dialog hiển thị
    const dialogTitle = await screen.findByRole('heading', { name: /xác nhận tạm ngưng sản phẩm/i });
    expect(dialogTitle).toBeInTheDocument();

    // Hủy bỏ
    const cancelBtn = screen.getByRole('button', { name: /hủy bỏ/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /xác nhận tạm ngưng sản phẩm/i })).not.toBeInTheDocument();
    });
    expect(productApi.updateProductStatus).not.toHaveBeenCalled();

    // Mở lại và xác nhận
    fireEvent.click(screen.getByRole('button', { name: /tạm ngưng cơm tấm sườn bì chả/i }));
    const confirmBtn = await screen.findByRole('button', { name: /tạm ngưng sản phẩm/i });

    const updatedProduct: Product = {
      ...mockProducts[0]!,
      isActive: false,
    };
    vi.mocked(productApi.updateProductStatus).mockResolvedValueOnce(updatedProduct);

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(productApi.updateProductStatus).toHaveBeenCalledTimes(1);
      expect(productApi.updateProductStatus).toHaveBeenCalledWith(1, false);
    });

    // Badge chuyển sang "Tạm ngưng"
    const table = screen.getByRole('table');
    await waitFor(() => {
      expect(screen.getByText('Đã tạm ngưng hiển thị sản phẩm "Cơm tấm sườn bì chả".')).toBeInTheDocument();
      expect(within(table).getByText('Tạm ngưng')).toBeInTheDocument();
    });
  });

  it('lỗi cập nhật trạng thái giữ nguyên trạng thái cũ và hiển thị thông báo lỗi', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValueOnce({
      content: [mockProducts[0]!],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cơm tấm sườn bì chả')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /tạm ngưng cơm tấm sườn bì chả/i }));
    const confirmBtn = await screen.findByRole('button', { name: /tạm ngưng sản phẩm/i });

    vi.mocked(productApi.updateProductStatus).mockRejectedValueOnce(new Error('Máy chủ quá tải'));

    fireEvent.click(confirmBtn);

    const table = screen.getByRole('table');
    await waitFor(() => {
      expect(screen.getByText('Máy chủ quá tải')).toBeInTheDocument();
      // Vẫn là Hoạt động
      expect(within(table).getByText('Hoạt động')).toBeInTheDocument();
    });
  });

  it('cập nhật thứ tự hiển thị: lưu thành công cập nhật trạng thái, nếu thất bại phục hồi lại giá trị cũ', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValueOnce({
      content: [mockProducts[0]!],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cơm tấm sườn bì chả')).toBeInTheDocument();
    });

    const sortInput = screen.getByLabelText(/thứ tự của cơm tấm sườn bì chả/i);
    expect(sortInput).toHaveValue(1);

    // Đổi sang 10
    fireEvent.change(sortInput, { target: { value: '10' } });

    const saveBtn = await screen.findByRole('button', { name: /lưu/i });

    // Trường hợp 1: API lỗi -> hoàn tác về 1
    vi.mocked(productApi.updateProductSortOrder).mockRejectedValueOnce(new Error('Lỗi cập nhật thứ tự'));
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(productApi.updateProductSortOrder).toHaveBeenCalledWith(1, 10);
      expect(screen.getByText(/không thể cập nhật thứ tự/i)).toBeInTheDocument();
      expect(sortInput).toHaveValue(1);
    });

    // Trường hợp 2: Đổi sang 5 và API thành công
    fireEvent.change(sortInput, { target: { value: '5' } });
    const saveBtnSuccess = await screen.findByRole('button', { name: /lưu/i });

    vi.mocked(productApi.updateProductSortOrder).mockResolvedValueOnce({
      ...mockProducts[0]!,
      sortOrder: 5,
    });

    fireEvent.click(saveBtnSuccess);

    await waitFor(() => {
      expect(productApi.updateProductSortOrder).toHaveBeenCalledWith(1, 5);
      expect(screen.getByText('Đã cập nhật thứ tự cho sản phẩm "Cơm tấm sườn bì chả".')).toBeInTheDocument();
      expect(sortInput).toHaveValue(5);
    });
  });

  it('mặc định chỉ tải quà lưu niệm; chọn tất cả danh mục sẽ bỏ lọc danh mục', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'SOUVENIR' })
      );
    });
    expect(screen.getByLabelText(/lọc theo danh mục/i)).toHaveValue('SOUVENIR');

    fireEvent.change(screen.getByLabelText(/lọc theo danh mục/i), {
      target: { value: 'ALL' },
    });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: undefined })
      );
      expect(screen.getByRole('heading', { level: 1, name: /quản lý tất cả sản phẩm/i })).toBeInTheDocument();
    });
  });

  it('bộ chọn sắp xếp danh sách thay đổi tham số sort trong request API', async () => {
    vi.mocked(productApi.getProducts).mockResolvedValue({
      content: mockProducts,
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });

    renderComponent();

    // Mặc định gọi sortOrder,asc
    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'sortOrder,asc',
        })
      );
    });

    // Thay đổi sắp xếp sang 'id,desc'
    const sortSelect = screen.getByLabelText(/sắp xếp danh sách/i);
    expect(sortSelect).toHaveValue('sortOrder,asc');

    fireEvent.change(sortSelect, { target: { value: 'id,desc' } });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'id,desc',
        })
      );
    });

    // Thay đổi sắp xếp sang 'sortOrder,desc'
    fireEvent.change(sortSelect, { target: { value: 'sortOrder,desc' } });

    await waitFor(() => {
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'sortOrder,desc',
        })
      );
    });
  });
});
