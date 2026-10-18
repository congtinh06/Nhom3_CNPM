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

describe('Admin Navigation cho Khu vực & Lộ trình (S4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: {
        id: 1,
        email: 'admin@saigonvoice.local',
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
  });

  it('AdminSidebar có "Khu vực" là link hoạt động và "Lộ trình" là mục xổ xuống', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/khu-vuc']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const zoneLink = screen.getByRole('link', { name: /khu vực/i });
    expect(zoneLink).toHaveAttribute('href', '/quan-tri/khu-vuc');
    expect(zoneLink).not.toHaveClass('adm-nav-link-disabled');

    const routeToggle = screen.getByRole('button', { name: /lộ trình/i });
    expect(routeToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(routeToggle);
    expect(routeToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /danh sách tuyến/i })).toHaveAttribute(
      'href',
      '/quan-tri/lo-trinh'
    );
  });

  it('AdminSidebar làm nổi bật "Khu vực" và "Danh sách tuyến" ở route con lồng nhau', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/khu-vuc/moi']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /khu vực/i })).toHaveClass('adm-nav-link-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/lo-trinh/8']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /lộ trình/i })).toHaveClass('adm-nav-parent-active');
    expect(screen.getByRole('link', { name: /danh sách tuyến/i })).toHaveClass(
      'adm-nav-sublink-active'
    );
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách, thêm mới và chỉnh sửa khu vực', () => {
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/quan-tri/khu-vuc']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByText('Khu vực')).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/quan-tri/khu-vuc/moi']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Khu vực' })).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    unmount2();

    render(
      <MemoryRouter initialEntries={['/quan-tri/khu-vuc/4']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Khu vực' })).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách, thêm mới và chỉnh sửa lộ trình', () => {
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/quan-tri/lo-trinh']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Lộ trình')).toBeInTheDocument();
    expect(screen.getByText('Danh sách tuyến')).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/quan-tri/lo-trinh/moi']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Lộ trình')).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    unmount2();

    render(
      <MemoryRouter initialEntries={['/quan-tri/lo-trinh/8']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Lộ trình')).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
  });
});
