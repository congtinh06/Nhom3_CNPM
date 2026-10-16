import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSidebar } from '../admin/components/AdminSidebar';
import { AdminHeader } from '../admin/components/AdminHeader';
import { AdminRouteGuard } from '../admin/routes/AdminRouteGuard';
import { useAuth } from '../context/AuthContext';
import { AuthUser } from '../types';
import { normalizeAdminError } from '../admin/api/adminClient';
import { AxiosError, AxiosHeaders } from 'axios';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

describe('Admin Navigation & Sidebar & Breadcrumbs (S2)', () => {
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

  it('mục "Sản phẩm" trong AdminSidebar là link hoạt động, không có huy hiệu "Sắp có"', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/tong-quan']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const productLink = screen.getByRole('link', { name: /sản phẩm/i });
    expect(productLink).toBeInTheDocument();
    expect(productLink).toHaveAttribute('href', '/quan-tri/san-pham');
    expect(productLink).not.toHaveClass('adm-nav-link-disabled');
    expect(productLink).not.toHaveTextContent('Sắp có');
  });

  it('AdminSidebar làm nổi bật liên kết khi đang ở route con lồng nhau (/quan-tri/san-pham/moi và /quan-tri/san-pham/:id)', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/moi']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const productLinkCreate = screen.getByRole('link', { name: /sản phẩm/i });
    expect(productLinkCreate).toHaveClass('adm-nav-link-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/123']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const productLinkEdit = screen.getByRole('link', { name: /sản phẩm/i });
    expect(productLinkEdit).toHaveClass('adm-nav-link-active');
  });

  it('AdminHeader hiển thị đúng đường dẫn phân cấp (breadcrumbs) cho danh sách, thêm mới và chỉnh sửa', () => {
    // 1. Danh sách sản phẩm
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument();
    unmount1();

    // 2. Thêm mới sản phẩm
    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/moi']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sản phẩm' })).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    unmount2();

    // 3. Chỉnh sửa sản phẩm
    render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/42']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sản phẩm' })).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
  });

  it('mục "Điểm thuyết minh" trong AdminSidebar là link hoạt động và nổi bật ở route con', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const poiLink = screen.getByRole('link', { name: /điểm thuyết minh/i });
    expect(poiLink).toHaveAttribute('href', '/quan-tri/diem-thuyet-minh');
    expect(poiLink).not.toHaveTextContent('Sắp có');
    expect(poiLink).toHaveClass('adm-nav-link-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/moi']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /điểm thuyết minh/i })).toHaveClass(
      'adm-nav-link-active'
    );
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách, thêm mới và chỉnh sửa điểm thuyết minh', () => {
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Điểm thuyết minh')).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/moi']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Điểm thuyết minh' })).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    unmount2();

    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/42']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Điểm thuyết minh' })).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
  });

  it('chuẩn hóa lỗi 403 Forbidden hiển thị thông báo tiếng Việt chính xác', () => {
    const error403 = new AxiosError(
      'Request failed with status code 403',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 403,
        statusText: 'Forbidden',
        data: {},
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );

    const normalized = normalizeAdminError(error403);
    expect(normalized.status).toBe(403);
    expect(normalized.message).toBe('Bạn không có quyền thực hiện thao tác này.');
  });

  it('AdminRouteGuard chặn người dùng không có vai trò ADMIN và hiển thị màn hình từ chối 403', () => {
    const regularUser: AuthUser = {
      id: 99,
      email: 'user@saigonvoice.local',
      fullName: 'Người Dùng Bình Thường',
      role: 'USER',
      emailVerified: true,
    };

    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: regularUser,
      isAuthenticated: true,
      isAdmin: false,
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham']}>
        <AdminRouteGuard>
          <div>Nội dung quản trị sản phẩm bí mật</div>
        </AdminRouteGuard>
      </MemoryRouter>
    );

    expect(screen.queryByText('Nội dung quản trị sản phẩm bí mật')).not.toBeInTheDocument();
    expect(screen.getByText('Quyền truy cập bị từ chối')).toBeInTheDocument();
    expect(
      screen.getByText(/Tài khoản của bạn không có quyền quản trị/i)
    ).toBeInTheDocument();
  });

  it('mục "Người dùng" trong AdminSidebar là link hoạt động, không có huy hiệu "Sắp có"', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const usersLink = screen.getByRole('link', { name: /người dùng/i });
    expect(usersLink).toHaveAttribute('href', '/quan-tri/nguoi-dung');
    expect(usersLink).not.toHaveTextContent('Sắp có');
    expect(usersLink).toHaveClass('adm-nav-link-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung/42']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /người dùng/i })).toHaveClass('adm-nav-link-active');
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách và chi tiết người dùng', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung/42']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Người dùng' })).toBeInTheDocument();
    expect(screen.getByText('Chi tiết')).toBeInTheDocument();
  });
});
