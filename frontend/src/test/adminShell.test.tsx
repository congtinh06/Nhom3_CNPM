import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSidebar } from '../admin/components/AdminSidebar';
import { AdminHeader } from '../admin/components/AdminHeader';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function mockAdminAuth() {
  mockUseAuth.mockReturnValue({
    status: 'authenticated',
    user: {
      id: 1,
      email: 'admin@echora.local',
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      emailVerified: true,
    },
    isAuthenticated: true,
    isAdmin: true,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  });
}

describe('Admin shell (GĐ2): grouped sidebar & header user menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminAuth();
  });

  it('AdminSidebar nhóm các mục theo section và có nhãn nhóm', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/tong-quan']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Nội dung')).toBeInTheDocument();
    expect(screen.getByText('Hệ thống')).toBeInTheDocument();

    const contentGroup = screen.getByText('Nội dung').closest('.adm-nav-section');
    expect(contentGroup).not.toBeNull();
    expect(contentGroup).toHaveTextContent('Điểm thuyết minh');
    expect(contentGroup).toHaveTextContent('Sản phẩm');
  });

  it('AdminSidebar hiển thị icon cho từng mục điều hướng', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/tong-quan']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const productLink = screen.getByRole('link', { name: /sản phẩm/i });
    expect(productLink.querySelector('.adm-nav-icon svg')).not.toBeNull();
  });
});

describe('Admin shell (GĐ2): header user menu dropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminAuth();
  });

  it('mở/đóng menu tài khoản và hiển thị chữ viết tắt tên người dùng', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/tong-quan']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('QV')).toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'Mở menu tài khoản quản trị' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: /về website du khách/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Đăng xuất' })).toBeInTheDocument();
  });

  it('đóng menu khi nhấn Escape hoặc click ra ngoài', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/tong-quan']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );

    const trigger = screen.getByRole('button', { name: 'Mở menu tài khoản quản trị' });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: 'Đăng xuất' })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Đăng xuất' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menuitem', { name: 'Đăng xuất' })).not.toBeInTheDocument();
  });

  it('gọi logout khi chọn "Đăng xuất" trong menu tài khoản', () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: {
        id: 1,
        email: 'admin@echora.local',
        fullName: 'Quản Trị Viên',
        role: 'ADMIN',
        emailVerified: true,
      },
      isAuthenticated: true,
      isAdmin: true,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout,
      reloadUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/quan-tri/tong-quan']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mở menu tài khoản quản trị' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
