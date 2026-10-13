import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountPage } from '../pages/AccountPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { authApi } from '../api/auth';
import { getMyOrders } from '../services/orderService';
import { tokenStore } from '../api/tokenStore';
import { AuthUser, BackendOrder } from '../types';

vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    me: vi.fn(),
    changePassword: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

vi.mock('../services/orderService', () => ({
  getMyOrders: vi.fn(),
}));

const MOCK_USER: AuthUser = {
  id: 1,
  email: 'nguyenvana@gmail.com',
  fullName: 'Nguyễn Văn A',
  role: 'USER',
  emailVerified: true,
  createdAt: '2026-01-15T08:00:00Z',
};

const MOCK_ORDER: BackendOrder = {
  id: 1,
  orderCode: 'SV-20260115-1000',
  totalAmount: 55000,
  status: 'PROCESSING',
  receiverName: 'Nguyễn Văn A',
  phone: '0900000000',
  address: 'Quận 1',
  items: [],
  createdAt: '2026-01-15T08:30:00Z',
  updatedAt: '2026-01-15T08:30:00Z',
};

function renderAccount() {
  return render(
    <MemoryRouter initialEntries={['/tai-khoan']}>
      <ToastProvider>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    localStorage.clear();
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'tok',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: MOCK_USER,
    });
    vi.mocked(getMyOrders).mockResolvedValue([]);
  });

  it('hiển thị tiêu đề trang và thông tin hồ sơ người dùng', async () => {
    renderAccount();

    expect(await screen.findByText('Tài khoản của tôi')).toBeInTheDocument();
    expect(screen.getAllByText('Nguyễn Văn A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('nguyenvana@gmail.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Đã xác thực')).toBeInTheDocument();
  });

  it('gửi lại email xác thực khi tài khoản chưa xác thực', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'tok',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: { ...MOCK_USER, emailVerified: false },
    });
    vi.mocked(authApi.resendVerification).mockResolvedValue({ message: 'ok' });

    renderAccount();

    const resendBtn = await screen.findByRole('button', { name: 'Gửi lại email xác thực' });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(authApi.resendVerification).toHaveBeenCalledWith('nguyenvana@gmail.com');
    });
  });

  it('hiển thị danh sách đơn hàng gần đây', async () => {
    vi.mocked(getMyOrders).mockResolvedValue([MOCK_ORDER]);

    renderAccount();

    expect(await screen.findByText('SV-20260115-1000')).toBeInTheDocument();
    expect(screen.getByText('55.000đ')).toBeInTheDocument();
    expect(screen.getByText('Đang xử lý')).toBeInTheDocument();
  });

  it('báo trống khi người dùng chưa có đơn hàng', async () => {
    renderAccount();

    expect(await screen.findByText('Bạn chưa có đơn hàng nào.')).toBeInTheDocument();
  });

  it('báo lỗi khi mật khẩu xác nhận không khớp', async () => {
    renderAccount();

    await screen.findByText('Tài khoản của tôi');
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'Matkhau@123' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'Matkhau@456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));

    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('gọi API đổi mật khẩu khi dữ liệu hợp lệ', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue({ message: 'ok' });

    renderAccount();

    await screen.findByText('Tài khoản của tôi');
    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), {
      target: { value: 'Matkhau@123' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), {
      target: { value: 'Matkhaumoi@123' },
    });
    fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), {
      target: { value: 'Matkhaumoi@123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({
        oldPassword: 'Matkhau@123',
        newPassword: 'Matkhaumoi@123',
        confirmPassword: 'Matkhaumoi@123',
      });
    });
  });

  it('đổi ngôn ngữ hiển thị sang tiếng Anh', async () => {
    renderAccount();

    await screen.findByText('Tài khoản của tôi');
    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    expect(await screen.findByText('My account')).toBeInTheDocument();
  });

  it('đăng xuất khi bấm nút Đăng xuất', async () => {
    vi.mocked(authApi.logout).mockResolvedValue();

    renderAccount();

    const signOutBtn = await screen.findByRole('button', { name: 'Đăng xuất' });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalledTimes(1);
    });
  });
});
