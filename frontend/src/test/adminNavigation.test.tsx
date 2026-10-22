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
        plan: 'FREE',
        premiumActive: false,
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

  it('mục "Quà lưu niệm" xổ xuống với "Sản phẩm", chọn đúng mục con theo danh mục', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham?category=SOUVENIR']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /quà lưu niệm/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const productLink = screen.getByRole('link', { name: /sản phẩm/i });
    expect(productLink).toHaveAttribute('href', '/quan-tri/san-pham?category=SOUVENIR');
    expect(productLink).toHaveClass('adm-nav-sublink-active');
    expect(productLink).not.toHaveTextContent('Sắp có');
  });

  it('AdminSidebar làm nổi bật mục cha "Quà lưu niệm" ở route form (/quan-tri/san-pham/moi và /:id)', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/moi']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /quà lưu niệm/i })).toHaveClass('adm-nav-parent-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/123']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /quà lưu niệm/i })).toHaveClass('adm-nav-parent-active');
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách (theo danh mục), thêm mới và chỉnh sửa quà lưu niệm', () => {
    // 1. Danh sách quà lưu niệm (lọc theo danh mục)
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham?category=SOUVENIR']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByText('Quà lưu niệm')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument();
    unmount1();

    // 2. Thêm mới
    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/moi']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByText('Quà lưu niệm')).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    unmount2();

    // 3. Chỉnh sửa
    render(
      <MemoryRouter initialEntries={['/quan-tri/san-pham/42']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Quản trị')).toBeInTheDocument();
    expect(screen.getByText('Quà lưu niệm')).toBeInTheDocument();
    expect(screen.getByText('Chỉnh sửa')).toBeInTheDocument();
  });

  it('mục "Điểm thuyết minh" xổ xuống và tô sáng "Danh sách điểm" ở route con', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /điểm thuyết minh/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const poiLink = screen.getByRole('link', { name: /danh sách điểm/i });
    expect(poiLink).toHaveAttribute('href', '/quan-tri/diem-thuyet-minh');
    expect(poiLink).not.toHaveTextContent('Sắp có');
    expect(poiLink).toHaveClass('adm-nav-sublink-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/moi']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /danh sách điểm/i })).toHaveClass(
      'adm-nav-sublink-active'
    );
  });

  it('tô sáng đúng mục con khi ở các trang con của Điểm thuyết minh', () => {
    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/ban-dich']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const i18nLink = screen.getByRole('link', { name: /bản dịch và audio/i });
    expect(i18nLink).toHaveAttribute('href', '/quan-tri/diem-thuyet-minh/ban-dich');
    expect(i18nLink).toHaveClass('adm-nav-sublink-active');
    expect(screen.getByRole('link', { name: /danh sách điểm/i })).not.toHaveClass(
      'adm-nav-sublink-active'
    );
    expect(screen.getByRole('link', { name: /mã qr/i })).toHaveAttribute(
      'href',
      '/quan-tri/diem-thuyet-minh/ma-qr'
    );
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách, thêm mới và chỉnh sửa điểm thuyết minh', () => {
    const { unmount: unmount1 } = render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Điểm thuyết minh')).toBeInTheDocument();
    expect(screen.getByText('Danh sách điểm')).toBeInTheDocument();
    unmount1();

    const { unmount: unmount2 } = render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/moi']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Điểm thuyết minh')).toBeInTheDocument();
    expect(screen.getByText('Thêm mới')).toBeInTheDocument();
    unmount2();

    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/42']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Điểm thuyết minh')).toBeInTheDocument();
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
      plan: 'FREE',
      premiumActive: false,
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

  it('mục "Người dùng" xổ xuống và tô sáng "Tài khoản" ở route con', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /người dùng/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const usersLink = screen.getByRole('link', { name: /tài khoản/i });
    expect(usersLink).toHaveAttribute('href', '/quan-tri/nguoi-dung');
    expect(usersLink).not.toHaveTextContent('Sắp có');
    expect(usersLink).toHaveClass('adm-nav-sublink-active');
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung/42']}>
        <AdminSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /tài khoản/i })).toHaveClass('adm-nav-sublink-active');
  });

  it('AdminHeader hiển thị breadcrumbs cho danh sách và chi tiết người dùng', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    expect(screen.getByText('Tài khoản')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung/42']}>
        <AdminHeader onToggleSidebar={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    expect(screen.getByText('Chi tiết')).toBeInTheDocument();
  });
});
