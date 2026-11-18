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

const adminUser: AuthUser = {
  id: 1,
  email: 'quantri@echora.test',
  fullName: 'Quản Trị Viên',
  role: 'ADMIN',
  emailVerified: true,
  plan: 'FREE',
  premiumActive: false,
};

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

  it('hiển thị đúng nội dung và không còn tagline tiếng Anh', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeInTheDocument();
    expect(screen.getByText('Quản lý và kiểm duyệt nội dung thuyết minh')).toBeInTheDocument();
    expect(screen.getByText('Thuyết minh tự động cho địa điểm và quà lưu niệm')).toBeInTheDocument();
    expect(screen.getByLabelText(/email quản trị/i)).toHaveAttribute(
      'placeholder',
      'Nhập email quản trị'
    );
    const passwordInput = screen.getByLabelText(/^mật khẩu/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('placeholder', 'Nhập mật khẩu quản trị');
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    const togglePassword = screen.getByRole('button', { name: 'Hiện mật khẩu' });
    expect(togglePassword).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(togglePassword);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toBeInTheDocument();
    expect(screen.queryByText(/audio guide/i)).not.toBeInTheDocument();
  });

  it('chuẩn hóa email về chữ thường và cắt khoảng trắng trước khi gửi', async () => {
    mockLogin.mockResolvedValue(adminUser);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email quản trị/i), {
      target: { value: '  QUANTRI@ECHORA.TEST  ' },
    });
    fireEvent.change(screen.getByLabelText(/^mật khẩu/i), { target: { value: 'AdminTest@2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'quantri@echora.test',
        password: 'AdminTest@2026',
      });
    });
  });

  it('hiển thị trạng thái đang đăng nhập và khóa nút', async () => {
    let resolveLogin!: (user: AuthUser) => void;
    mockLogin.mockReturnValue(
      new Promise<AuthUser>((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email quản trị/i), {
      target: { value: 'quantri@echora.test' },
    });
    fireEvent.change(screen.getByLabelText(/^mật khẩu/i), { target: { value: 'AdminTest@2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    const loadingButton = await screen.findByRole('button', { name: 'Đang đăng nhập...' });
    expect(loadingButton).toBeDisabled();

    resolveLogin(adminUser);
    await waitFor(() => {
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });
  });

  it('hiển thị lỗi đăng nhập dạng inline, không lộ email có tồn tại hay không', async () => {
    mockLogin.mockRejectedValue(new Error('Email hoặc mật khẩu không đúng.'));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email quản trị/i), {
      target: { value: 'quantri@echora.test' },
    });
    fireEvent.change(screen.getByLabelText(/^mật khẩu/i), { target: { value: 'SaiMatKhau1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Email hoặc mật khẩu không đúng.');
    expect(errorAlert).not.toHaveTextContent(/không tồn tại/i);
  });

  it('hiển thị lỗi tài khoản bị khóa bằng tiếng Việt', async () => {
    mockLogin.mockRejectedValue(new Error('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email quản trị/i), {
      target: { value: 'quantri@echora.test' },
    });
    fireEvent.change(screen.getByLabelText(/^mật khẩu/i), { target: { value: 'AdminTest@2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
    );
  });

  it('đăng xuất ngay lập tức và báo lỗi nếu tài khoản đăng nhập không phải ADMIN', async () => {
    const regularUser: AuthUser = {
      id: 5,
      email: 'khach@echora.local',
      fullName: 'Khách Hàng',
      role: 'USER',
      emailVerified: true,
      plan: 'FREE',
      premiumActive: false,
    };
    mockLogin.mockResolvedValue(regularUser);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email quản trị/i), {
      target: { value: 'khach@echora.local' },
    });
    fireEvent.change(screen.getByLabelText(/^mật khẩu/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'khach@echora.local',
        password: 'Password123',
      });
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('Tài khoản không có quyền quản trị.');
    expect(screen.queryByTestId('admin-home')).not.toBeInTheDocument();
  });

  it('chuyển hướng vào trang quản trị khi đăng nhập thành công với vai trò ADMIN', async () => {
    mockLogin.mockResolvedValue(adminUser);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email quản trị/i), {
      target: { value: 'quantri@echora.test' },
    });
    fireEvent.change(screen.getByLabelText(/^mật khẩu/i), { target: { value: 'AdminTest@2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'quantri@echora.test',
        password: 'AdminTest@2026',
      });
      expect(mockLogout).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('admin-home')).toBeInTheDocument();
    });
  });
});
