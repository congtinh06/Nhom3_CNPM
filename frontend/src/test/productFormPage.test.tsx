import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductFormPage } from '../admin/pages/ProductFormPage';
import { productApi } from '../admin/api/productApi';
import { Product } from '../admin/types/product';
import { AxiosError, AxiosHeaders } from 'axios';

vi.mock('../admin/api/productApi', () => ({
  productApi: {
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    uploadProductImage: vi.fn(),
  },
}));

describe('ProductFormPage', () => {
  const mockProduct: Product = {
    id: 10,
    slug: 'hu-tieu-nam-vang',
    name: 'Hủ tiếu Nam Vang',
    category: 'FOOD',
    shortDescription: 'Hủ tiếu thơm ngon',
    description: 'Nước dùng thanh ngọt',
    price: 60000,
    imagePath: '/img/products/hu-tieu-nam-vang.jpg',
    isActive: true,
    sortOrder: 3,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
  });

  const renderCreateMode = () => {
    return render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/moi']}>
        <Routes>
          <Route path="/quan-tri/san-pham/moi" element={<ProductFormPage />} />
          <Route path="/quan-tri/san-pham/:id" element={<ProductFormPage />} />
          <Route path="/quan-tri/san-pham" element={<div data-testid="product-list-page">Danh sách sản phẩm</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  const renderEditMode = (id = '10') => {
    return render(
      <MemoryRouter initialEntries={[`/quan-tri/san-pham/${id}`]}>
        <Routes>
          <Route path="/quan-tri/san-pham/:id" element={<ProductFormPage />} />
          <Route path="/quan-tri/san-pham" element={<div data-testid="product-list-page">Danh sách sản phẩm</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Chế độ tạo mới (Create Mode)', () => {
    it('kiểm tra xác thực dữ liệu bắt buộc phía client (tên và giá)', async () => {
      renderCreateMode();

      const submitBtn = screen.getByRole('button', { name: /tạo sản phẩm/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Tên sản phẩm không được để trống')).toBeInTheDocument();
        expect(screen.getByText('Giá sản phẩm không được để trống')).toBeInTheDocument();
      });

      expect(productApi.createProduct).not.toHaveBeenCalled();
    });

    it('ánh xạ lỗi xác thực chi tiết từ backend vào các trường biểu mẫu', async () => {
      renderCreateMode();

      const nameInput = screen.getByLabelText(/tên sản phẩm/i);
      const priceInput = screen.getByLabelText(/giá bán/i);
      const submitBtn = screen.getByRole('button', { name: /tạo sản phẩm/i });

      fireEvent.change(nameInput, { target: { value: 'Phở bò tái' } });
      fireEvent.change(priceInput, { target: { value: '50000' } });

      const axios400 = new AxiosError(
        'Request failed with status code 400',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 400,
          statusText: 'Bad Request',
          data: {
            error: 'Validation Failed',
            details: {
              name: 'Tên sản phẩm đã tồn tại trên hệ thống',
            },
          },
          headers: {},
          config: { headers: new AxiosHeaders() },
        }
      );

      vi.mocked(productApi.createProduct).mockRejectedValueOnce(axios400);

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Tên sản phẩm đã tồn tại trên hệ thống')).toBeInTheDocument();
      });
    });

    it('vô hiệu hóa nút gửi trong khi đang xử lý và ngăn chặn gửi đúp', async () => {
      let resolveCreate: (val: Product) => void;
      const pendingPromise = new Promise<Product>((resolve) => {
        resolveCreate = resolve;
      });
      vi.mocked(productApi.createProduct).mockReturnValueOnce(pendingPromise);

      renderCreateMode();

      const nameInput = screen.getByLabelText(/tên sản phẩm/i);
      const priceInput = screen.getByLabelText(/giá bán/i);
      const submitBtn = screen.getByRole('button', { name: /tạo sản phẩm/i });

      fireEvent.change(nameInput, { target: { value: 'Bánh xèo miền Tây' } });
      fireEvent.change(priceInput, { target: { value: '70000' } });

      fireEvent.click(submitBtn);

      // Nút bị vô hiệu hóa và đổi nhãn
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /đang tạo mới.../i })).toBeDisabled();
      });

      // Nhấn lần nữa không gọi lại
      fireEvent.click(screen.getByRole('button', { name: /đang tạo mới.../i }));
      expect(productApi.createProduct).toHaveBeenCalledTimes(1);

      // Giải phóng promise
      resolveCreate!(mockProduct);

      await waitFor(() => {
        expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
      });
    });

    it('kiểm tra định dạng slug hợp lệ / không hợp lệ theo quy tắc regex', async () => {
      renderCreateMode();

      const nameInput = screen.getByLabelText(/tên sản phẩm/i);
      const priceInput = screen.getByLabelText(/giá bán/i);
      const slugInput = screen.getByLabelText(/đường dẫn định danh/i);
      const submitBtn = screen.getByRole('button', { name: /tạo sản phẩm/i });

      fireEvent.change(nameInput, { target: { value: 'Bánh mì chả lụa' } });
      fireEvent.change(priceInput, { target: { value: '35000' } });

      // Slug sai định dạng (chứa chữ hoa)
      fireEvent.change(slugInput, { target: { value: 'Banh-Mi-Cha' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang')).toBeInTheDocument();
      });
      expect(productApi.createProduct).not.toHaveBeenCalled();

      // Slug sai định dạng (double hyphen)
      fireEvent.change(slugInput, { target: { value: 'banh--mi' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang')).toBeInTheDocument();
      });

      // Slug hợp lệ
      fireEvent.change(slugInput, { target: { value: 'banh-mi-cha-lua' } });
      vi.mocked(productApi.createProduct).mockResolvedValueOnce(mockProduct);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(productApi.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            slug: 'banh-mi-cha-lua',
          })
        );
      });
    });

    it('tạo mới có ảnh: tạo thành công và tải ảnh thành công', async () => {
      vi.mocked(productApi.createProduct).mockResolvedValueOnce(mockProduct);
      vi.mocked(productApi.uploadProductImage).mockResolvedValueOnce(mockProduct);

      renderCreateMode();

      fireEvent.change(screen.getByLabelText(/tên sản phẩm/i), { target: { value: 'Hủ tiếu Nam Vang' } });
      fireEvent.change(screen.getByLabelText(/giá bán/i), { target: { value: '60000' } });

      const file = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(screen.getByLabelText(/chọn tệp ảnh tải lên/i), { target: { files: [file] } });

      fireEvent.click(screen.getByRole('button', { name: /tạo sản phẩm/i }));

      await waitFor(() => {
        expect(productApi.createProduct).toHaveBeenCalledTimes(1);
        expect(productApi.uploadProductImage).toHaveBeenCalledWith(10, file);
        expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
      });
    });

    it('tạo mới có ảnh: tạo thành công nhưng tải ảnh thất bại -> hiện thông báo, nút thử lại, không tạo trùng sản phẩm', async () => {
      vi.mocked(productApi.createProduct).mockResolvedValueOnce(mockProduct);
      vi.mocked(productApi.uploadProductImage).mockRejectedValueOnce(new Error('Mạng bị gián đoạn khi tải ảnh'));
      vi.mocked(productApi.getProductById).mockResolvedValue(mockProduct);

      renderCreateMode();

      fireEvent.change(screen.getByLabelText(/tên sản phẩm/i), { target: { value: 'Hủ tiếu Nam Vang' } });
      fireEvent.change(screen.getByLabelText(/giá bán/i), { target: { value: '60000' } });

      const file = new File(['fake-image'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(screen.getByLabelText(/chọn tệp ảnh tải lên/i), { target: { files: [file] } });

      fireEvent.click(screen.getByRole('button', { name: /tạo sản phẩm/i }));

      // Phải thông báo tạo thành công nhưng tải ảnh thất bại
      await waitFor(() => {
        expect(productApi.createProduct).toHaveBeenCalledTimes(1);
        expect(productApi.uploadProductImage).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/sản phẩm đã được tạo thành công nhưng tải ảnh thất bại/i)).toBeInTheDocument();
      });

      // Nút thử lại ảnh xuất hiện
      const retryBtn = await screen.findByRole('button', { name: /thử tải lại ảnh/i });
      expect(retryBtn).toBeInTheDocument();

      // Nhấn thử tải lại ảnh thành công
      vi.mocked(productApi.uploadProductImage).mockResolvedValueOnce(mockProduct);
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(productApi.uploadProductImage).toHaveBeenCalledTimes(2);
        // Tuyệt đối không được gọi lại createProduct
        expect(productApi.createProduct).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Chế độ chỉnh sửa (Edit Mode) & Tải ảnh', () => {
    it('tải dữ liệu ban đầu và điền vào các ô nhập liệu', async () => {
      vi.mocked(productApi.getProductById).mockResolvedValueOnce(mockProduct);

      renderEditMode('10');

      await waitFor(() => {
        expect(productApi.getProductById).toHaveBeenCalledWith(10);
        expect(screen.getByLabelText(/tên sản phẩm/i)).toHaveValue('Hủ tiếu Nam Vang');
        expect(screen.getByLabelText(/giá bán/i)).toHaveValue(60000);
        expect(screen.getByLabelText(/đường dẫn định danh/i)).toHaveValue('hu-tieu-nam-vang');
        expect(screen.getByLabelText(/mô tả ngắn/i)).toHaveValue('Hủ tiếu thơm ngon');
        expect(screen.getByLabelText(/kích hoạt hiển thị sản phẩm trên website/i)).toBeChecked();
      });
    });

    it('tải ảnh lên: từ chối file sai định dạng hoặc vượt quá dung lượng 2MB', async () => {
      vi.mocked(productApi.getProductById).mockResolvedValueOnce(mockProduct);
      renderEditMode('10');

      await waitFor(() => {
        expect(screen.getByLabelText(/tên sản phẩm/i)).toHaveValue('Hủ tiếu Nam Vang');
      });

      const fileInput = screen.getByLabelText(/chọn tệp ảnh tải lên/i);

      // File sai định dạng
      const invalidFile = new File(['text content'], 'doc.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/định dạng ảnh không hỗ trợ/i)).toBeInTheDocument();
      });

      // File vượt quá 2MB
      const hugeFile = new File([new Uint8Array(3 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [hugeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/dung lượng tệp ảnh vượt quá giới hạn/i)).toBeInTheDocument();
      });
    });

    it('tải ảnh thành công cập nhật ảnh xem trước; nếu thất bại không làm mất thông tin khác đã sửa', async () => {
      vi.mocked(productApi.getProductById).mockResolvedValueOnce(mockProduct);
      renderEditMode('10');

      await waitFor(() => {
        expect(screen.getByLabelText(/tên sản phẩm/i)).toHaveValue('Hủ tiếu Nam Vang');
      });

      // Sửa tên sản phẩm
      const nameInput = screen.getByLabelText(/tên sản phẩm/i);
      fireEvent.change(nameInput, { target: { value: 'Hủ tiếu Nam Vang Đặc Biệt' } });

      // Chọn file ảnh hợp lệ
      const validFile = new File(['image-bytes'], 'hutieu.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/chọn tệp ảnh tải lên/i);
      fireEvent.change(fileInput, { target: { files: [validFile] } });

      const uploadBtn = await screen.findByRole('button', { name: /tải ảnh lên ngay/i });

      // Giả lập lỗi tải ảnh
      vi.mocked(productApi.uploadProductImage).mockRejectedValueOnce(new Error('Lỗi máy chủ lưu ảnh'));
      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(screen.getByText('Lỗi máy chủ lưu ảnh')).toBeInTheDocument();
        // Thông tin đã sửa vẫn giữ nguyên
        expect(nameInput).toHaveValue('Hủ tiếu Nam Vang Đặc Biệt');
      });

      // Tải lại ảnh thành công
      vi.mocked(productApi.uploadProductImage).mockResolvedValueOnce({
        ...mockProduct,
        imagePath: '/img/products/new-hutieu.jpg',
      });
      fireEvent.click(uploadBtn);

      await waitFor(() => {
        expect(screen.getByText('Đã tải và cập nhật ảnh sản phẩm thành công.')).toBeInTheDocument();
        expect(nameInput).toHaveValue('Hủ tiếu Nam Vang Đặc Biệt');
      });
    });

    it('xử lý biểu mẫu bẩn (dirty form) khi điều hướng: hiện hộp thoại xác nhận khi rời đi', async () => {
      vi.mocked(productApi.getProductById).mockResolvedValue(mockProduct);
      const { unmount } = renderEditMode('10');

      await waitFor(() => {
        expect(screen.getByLabelText(/tên sản phẩm/i)).toHaveValue('Hủ tiếu Nam Vang');
      });

      // Khi chưa sửa gì, bấm quay lại chuyển ngay về trang danh sách
      const backBtn = screen.getByRole('button', { name: /quay lại danh sách sản phẩm/i });
      fireEvent.click(backBtn);
      expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
      unmount();

      // Render lại và sửa dữ liệu
      renderEditMode('10');
      await waitFor(() => {
        expect(screen.getByLabelText(/tên sản phẩm/i)).toHaveValue('Hủ tiếu Nam Vang');
      });

      fireEvent.change(screen.getByLabelText(/tên sản phẩm/i), { target: { value: 'Hủ tiếu có chỉnh sửa' } });

      // Bấm quay lại -> hiện ConfirmDialog
      fireEvent.click(screen.getByRole('button', { name: /quay lại danh sách sản phẩm/i }));

      const leaveDialog = await screen.findByRole('heading', { name: /rời khỏi trang khi chưa lưu/i });
      expect(leaveDialog).toBeInTheDocument();

      // Chọn ở lại tiếp tục sửa
      const stayBtn = screen.getByRole('button', { name: /ở lại tiếp tục sửa/i });
      fireEvent.click(stayBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /rời khỏi trang khi chưa lưu/i })).not.toBeInTheDocument();
      });

      // Bấm quay lại và chọn rời khỏi trang
      fireEvent.click(screen.getByRole('button', { name: /quay lại danh sách sản phẩm/i }));
      const confirmLeaveBtn = await screen.findByRole('button', { name: /rời khỏi trang/i });
      fireEvent.click(confirmLeaveBtn);

      await waitFor(() => {
        expect(screen.getByTestId('product-list-page')).toBeInTheDocument();
      });
    });
  });
});
