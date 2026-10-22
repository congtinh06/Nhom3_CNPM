import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OrderListPage } from '../admin/pages/OrderListPage';
import { OrderDetailPage } from '../admin/pages/OrderDetailPage';
import { orderAdminApi } from '../admin/api/orderApi';
import { AdminOrder } from '../admin/types/order';

vi.mock('../admin/api/orderApi', () => ({
  orderAdminApi: {
    getOrders: vi.fn(),
    getOrder: vi.fn(),
    updateStatus: vi.fn(),
    confirmPayment: vi.fn(),
    rejectPayment: vi.fn(),
  },
}));

const mockedApi = vi.mocked(orderAdminApi);

const productOrder: AdminOrder = {
  id: 1,
  orderCode: 'SV-2026-0001',
  userId: 12,
  orderType: 'PRODUCT',
  subtotal: 250000,
  shippingFee: 30000,
  totalAmount: 280000,
  status: 'PENDING_PAYMENT',
  paymentMethod: 'VIETQR',
  paymentStatus: 'PENDING',
  receiverName: 'Nguyễn Văn A',
  phone: '0901234567',
  address: 'Quận 1, TP.HCM',
  note: null,
  items: [
    { productId: 5, productName: 'Cà phê phin', unitPrice: 125000, quantity: 2 },
  ],
  payments: [],
  createdAt: '2026-10-20T10:00:00',
  updatedAt: '2026-10-20T10:00:00',
  paidAt: null,
};

const paidPremiumOrder: AdminOrder = {
  id: 2,
  orderCode: 'SV-2026-0002',
  userId: 7,
  orderType: 'PREMIUM',
  premiumPackage: 'PREMIUM_LANGUAGES',
  subtotal: 199000,
  shippingFee: 0,
  totalAmount: 199000,
  status: 'PAID',
  paymentMethod: 'VIETQR',
  paymentStatus: 'SUCCESS',
  receiverName: 'Trần Thị B',
  phone: '0912345678',
  address: '',
  note: null,
  items: [],
  payments: [
    {
      id: 9,
      provider: 'DEMO_TRANSFER',
      txnRef: 'SV-2026-0002-ADMIN-1',
      amount: 199000,
      status: 'SUCCESS',
      createdAt: '2026-10-20T11:00:00',
      paidAt: '2026-10-20T11:00:00',
    },
  ],
  createdAt: '2026-10-20T10:30:00',
  updatedAt: '2026-10-20T11:00:00',
  paidAt: '2026-10-20T11:00:00',
};

function renderList() {
  return render(
    <MemoryRouter initialEntries={['/quan-tri/don-hang']}>
      <Routes>
        <Route path="/quan-tri/don-hang" element={<OrderListPage />} />
        <Route path="/quan-tri/don-hang/:orderCode" element={<OrderDetailPage />} />
        <Route path="/quan-tri/nguoi-dung/:id" element={<div>Trang người dùng</div>} />
        <Route path="/quan-tri/san-pham/:id" element={<div>Trang sản phẩm</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderDetail(orderCode: string) {
  return render(
    <MemoryRouter initialEntries={[`/quan-tri/don-hang/${orderCode}`]}>
      <Routes>
        <Route path="/quan-tri/don-hang" element={<div>Danh sách đơn hàng</div>} />
        <Route path="/quan-tri/don-hang/:orderCode" element={<OrderDetailPage />} />
        <Route path="/quan-tri/nguoi-dung/:id" element={<div>Trang người dùng</div>} />
        <Route path="/quan-tri/san-pham/:id" element={<div>Trang sản phẩm</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.getOrders.mockResolvedValue({
    content: [productOrder],
    totalElements: 1,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: false,
  });
});

describe('OrderListPage', () => {
  it('hiển thị đơn hàng kèm trạng thái thanh toán và liên kết xử lý', async () => {
    renderList();

    expect(await screen.findByRole('link', { name: 'SV-2026-0001' })).toHaveAttribute(
      'href',
      '/quan-tri/don-hang/SV-2026-0001'
    );
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    const table = within(screen.getByRole('table', { name: 'Bảng danh sách đơn hàng quản trị' }));
    expect(table.getByText('Chưa thanh toán')).toBeInTheDocument();
    expect(table.getByText('Chờ thanh toán')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem đơn hàng SV-2026-0001/i })).toHaveAttribute(
      'href',
      '/quan-tri/don-hang/SV-2026-0001'
    );
  });

  it('gửi bộ lọc và từ khóa tìm kiếm tới API', async () => {
    renderList();
    await screen.findByRole('link', { name: 'SV-2026-0001' });

    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái thanh toán'), {
      target: { value: 'SUCCESS' },
    });
    fireEvent.change(screen.getByLabelText('Lọc theo loại đơn hàng'), {
      target: { value: 'PREMIUM' },
    });

    await waitFor(() =>
      expect(mockedApi.getOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 0, paymentStatus: 'SUCCESS', type: 'PREMIUM' })
      )
    );

    fireEvent.change(screen.getByLabelText('Tìm kiếm đơn hàng'), {
      target: { value: '0901' },
    });

    await waitFor(
      () =>
        expect(mockedApi.getOrders).toHaveBeenLastCalledWith(
          expect.objectContaining({ search: '0901' })
        ),
      { timeout: 1500 }
    );
  });
});

describe('OrderDetailPage', () => {
  it('xác nhận đã nhận tiền cho đơn chờ thanh toán', async () => {
    mockedApi.getOrder.mockResolvedValue(productOrder);
    mockedApi.confirmPayment.mockResolvedValue({
      ...productOrder,
      status: 'PAID',
      paymentStatus: 'SUCCESS',
      paidAt: '2026-10-20T12:00:00',
    });

    renderDetail('SV-2026-0001');

    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận đã nhận tiền' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Xác nhận đã nhận 280.000 đ/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => expect(mockedApi.confirmPayment).toHaveBeenCalledWith('SV-2026-0001'));
    expect(await screen.findByText('Đã cập nhật đơn hàng thành công.')).toBeInTheDocument();
    expect(screen.getAllByText('Đã nhận tiền').length).toBeGreaterThan(0);
  });

  it('gắn nhãn hoàn tất cho đơn Premium đã thanh toán và gọi API trạng thái', async () => {
    mockedApi.getOrder.mockResolvedValue(paidPremiumOrder);
    mockedApi.updateStatus.mockResolvedValue({
      ...paidPremiumOrder,
      status: 'COMPLETED',
    });

    renderDetail('SV-2026-0002');

    expect(await screen.findByText('Gói 3 ngôn ngữ (English, Japanese, Korean)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất đơn Premium' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() =>
      expect(mockedApi.updateStatus).toHaveBeenCalledWith('SV-2026-0002', 'COMPLETED')
    );
  });

  it('hiển thị lỗi và cho phép thử lại khi tải chi tiết thất bại', async () => {
    mockedApi.getOrder.mockRejectedValue(new Error('network down'));

    renderDetail('SV-2026-0001');

    expect(await screen.findByText('Không thể tải đơn hàng')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(mockedApi.getOrder).toHaveBeenCalledTimes(2));
  });
});
