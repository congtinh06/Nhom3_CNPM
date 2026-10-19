import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminLoginPage } from '../admin/pages/AdminLoginPage';
import { useAuth } from '../context/AuthContext';
import { AuthUser } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('AdminLoginPage', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      status: 'guest',
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      login: mockLogin,
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      reloadUser: vi.fn(),
    });
  });

  function renderLoginPage(initialPath = '/quan-tri/dang-nhap') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/quan-tri/dang-nhap" element={<AdminLoginPage />} />
          <Route path="/quan-tri" element={<div data-testid="admin-home">Trang chủ Admin</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('đăng xuất ngay lập tức và báo lỗi nếu tài khoản đăng nhập không phải ADMIN', async () => {
    const regularUser: AuthUser = {
      id: 5,
      email: 'khach@saigonvoice.local',
      fullName: 'Khách Hàng',
      role: 'USER',
      emailVerified: true,
    };
    mockLogin.mockResolvedValue(regularUser);

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email quản trị/i);
    const passwordInput = screen.getByLabelText(/^mật khẩu/i);
    const submitBtn = screen.getByRole('button', { name: /đăng nhập vào hệ thống/i });

    fireEvent.change(emailInput, { target: { value: 'khach@saigonvoice.local' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'khach@saigonvoice.local',
        password: 'Password123',
      });
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Tài khoản không có quyền quản trị.');
    expect(screen.queryByTestId('admin-home')).not.toBeInTheDocument();
  });

  it('hiện/ẩn mật khẩu bằng nút con mắt', () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/^mật khẩu/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('chuyển hướng vào trang quản trị khi đăng nhập thành công với vai trò ADMIN', async () => {
    const adminUser: AuthUser = {
      id: 1,
      email: 'admin@saigonvoice.local',
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      emailVerified: true,
    };
    mockLogin.mockResolvedValue(adminUser);

    renderLoginPage();

    const emailInput = screen.getByLabelText(/email quản trị/i);
    const passwordInput = screen.getByLabelText(/^mật khẩu/i);
    const submitBtn = screen.getByRole('button', { name: /đăng nhập vào hệ thống/i });

    fireEvent.change(emailInput, { target: { value: 'admin@saigonvoice.local' } });
    fireEvent.change(passwordInput, { target: { value: 'AdminPass!123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@saigonvoice.local',
        password: 'AdminPass!123',
      });
      expect(mockLogout).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });
  });
});
