import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRouteGuard } from '../admin/routes/AdminRouteGuard';
import { useAuth, AuthStatus } from '../context/AuthContext';
import { AuthUser } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function renderGuard(initialPath = '/quan-tri/tong-quan') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/quan-tri/*"
          element={
            <AdminRouteGuard>
              <div data-testid="admin-content">Nội dung quản trị được bảo vệ</div>
            </AdminRouteGuard>
          }
        />
        <Route
          path="/quan-tri/dang-nhap"
          element={<div data-testid="admin-login-page">Trang đăng nhập Admin</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị skeleton/spinner khi trạng thái đang tải (loading)', () => {
    mockUseAuth.mockReturnValue({
      status: 'loading' as AuthStatus,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    });

    renderGuard();

    expect(screen.getByRole('status', { name: 'Đang kiểm tra quyền truy cập' })).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('chuyển hướng khách vãng lai (guest) sang /quan-tri/dang-nhap', () => {
    mockUseAuth.mockReturnValue({
      status: 'guest' as AuthStatus,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    });

    renderGuard();

    expect(screen.getByTestId('admin-login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('hiển thị màn hình 403 Forbidden khi người dùng không có vai trò ADMIN', () => {
    const regularUser: AuthUser = {
      id: 2,
      email: 'user@echora.local',
      fullName: 'Khách Du Lịch',
      role: 'USER',
      emailVerified: true,
      plan: 'FREE',
      premiumActive: false,
    };

    mockUseAuth.mockReturnValue({
      status: 'authenticated' as AuthStatus,
      user: regularUser,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    });

    renderGuard();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Quyền truy cập bị từ chối')).toBeInTheDocument();
    expect(screen.getByText(/không có quyền quản trị/i)).toBeInTheDocument();
    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });

  it('cho phép hiển thị nội dung khi người dùng đã đăng nhập với vai trò ADMIN', () => {
    const adminUser: AuthUser = {
      id: 1,
      email: 'admin@echora.local',
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      emailVerified: true,
      plan: 'FREE',
      premiumActive: false,
    };

    mockUseAuth.mockReturnValue({
      status: 'authenticated' as AuthStatus,
      user: adminUser,
      isAuthenticated: true,
      isAdmin: true,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    });

    renderGuard();

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
