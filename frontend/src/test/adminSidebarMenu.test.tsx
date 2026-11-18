import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminSidebar } from '../admin/components/AdminSidebar';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

function mockAuth(role: 'ADMIN' | 'USER') {
  mockUseAuth.mockReturnValue({
    status: 'authenticated',
    user: {
      id: 1,
      email: 'quantri@echora.test',
      fullName: 'Quản Trị Viên',
      role,
      emailVerified: true,
      plan: 'FREE',
      premiumActive: false,
    },
    isAuthenticated: true,
    isAdmin: role === 'ADMIN',
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  });
}

function renderSidebar(initialPath: string, isCollapsed = false) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AdminSidebar isOpen={true} onClose={vi.fn()} isCollapsed={isCollapsed} />
    </MemoryRouter>
  );
}

function navFocusables(): HTMLElement[] {
  const nav = screen.getByRole('navigation', { name: 'Menu quản trị' });
  return Array.from(
    nav.querySelectorAll<HTMLElement>(
      'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'
    )
  );
}

describe('Sidebar quản trị: xổ xuống, thu gọn và bàn phím', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuth('ADMIN');
  });

  it('mở và đóng nhóm khi bấm, chỉ một nhóm mở cùng lúc', () => {
    renderSidebar('/quan-tri/tong-quan');

    const pois = screen.getByRole('button', { name: /điểm thuyết minh/i });
    const food = screen.getByRole('button', { name: /quà lưu niệm/i });

    expect(pois).toHaveAttribute('aria-expanded', 'false');
    expect(food).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /danh sách điểm/i })).not.toBeInTheDocument();

    fireEvent.click(pois);
    expect(pois).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /danh sách điểm/i })).toBeInTheDocument();

    fireEvent.click(food);
    expect(food).toHaveAttribute('aria-expanded', 'true');
    expect(pois).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /danh sách điểm/i })).not.toBeInTheDocument();

    fireEvent.click(food);
    expect(food).toHaveAttribute('aria-expanded', 'false');
  });

  it('tự mở nhóm và tô sáng đúng mục con theo URL hiện tại', () => {
    renderSidebar('/quan-tri/diem-thuyet-minh');

    expect(screen.getByRole('button', { name: /điểm thuyết minh/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const listLink = screen.getByRole('link', { name: /danh sách điểm/i });
    expect(listLink).toHaveAttribute('aria-current', 'page');
    expect(listLink).toHaveClass('adm-nav-sublink-active');
  });

  it('ghi nhớ nhóm đang mở theo người dùng trong localStorage', () => {
    const { unmount } = renderSidebar('/quan-tri/tong-quan');

    fireEvent.click(screen.getByRole('button', { name: /quà lưu niệm/i }));
    expect(localStorage.getItem('echora_admin_open_group_1')).toBe('food');
    unmount();

    renderSidebar('/quan-tri/tong-quan');
    expect(screen.getByRole('button', { name: /quà lưu niệm/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('đã xóa các mục "Sắp có" khỏi menu', () => {
    renderSidebar('/quan-tri/tong-quan');

    expect(screen.queryByText('Thư viện ảnh')).not.toBeInTheDocument();
    expect(screen.queryByText('Nhật ký thao tác')).not.toBeInTheDocument();
    expect(screen.queryByText('Cài đặt')).not.toBeInTheDocument();
    expect(screen.queryByText('Sắp có')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /đơn hàng/i })).toHaveAttribute(
      'href',
      '/quan-tri/don-hang'
    );

    fireEvent.click(screen.getByRole('button', { name: /quà lưu niệm/i }));
    expect(screen.getByRole('link', { name: /sản phẩm/i })).toBeInTheDocument();
    expect(screen.queryByText('Danh mục')).not.toBeInTheDocument();
    expect(screen.queryByText('Sản phẩm nổi bật')).not.toBeInTheDocument();
  });

  it('ẩn toàn bộ menu với vai trò không phải quản trị viên', () => {
    mockAuth('USER');
    renderSidebar('/quan-tri/tong-quan');

    expect(screen.queryByRole('link', { name: /tổng quan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /khu vực/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /điểm thuyết minh/i })
    ).not.toBeInTheDocument();
  });

  it('điều hướng bằng bàn phím: mũi tên di chuyển focus, Enter mở nhóm, Esc đóng', () => {
    renderSidebar('/quan-tri/tong-quan');

    const nav = screen.getByRole('navigation', { name: 'Menu quản trị' });
    const pois = screen.getByRole('button', { name: /điểm thuyết minh/i });

    pois.focus();
    expect(document.activeElement).toBe(pois);

    fireEvent.keyDown(nav, { key: 'ArrowDown' });
    const focusables = navFocusables();
    const index = focusables.indexOf(pois);
    expect(document.activeElement).toBe(focusables[index + 1]);

    fireEvent.keyDown(nav, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(pois);

    fireEvent.click(pois);
    expect(pois).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(nav, { key: 'Escape' });
    expect(pois).toHaveAttribute('aria-expanded', 'false');
  });

  it('thu gọn: mục con hiện trong popover khi hover vào mục cha', () => {
    renderSidebar('/quan-tri/tong-quan', true);

    const parentButton = screen.getByTitle('Điểm thuyết minh');
    const item = parentButton.closest('li')!;
    expect(screen.queryByRole('link', { name: /danh sách điểm/i })).not.toBeInTheDocument();

    fireEvent.mouseEnter(item);
    expect(screen.getByRole('link', { name: /danh sách điểm/i })).toBeInTheDocument();

    fireEvent.mouseLeave(item);
    expect(screen.queryByRole('link', { name: /danh sách điểm/i })).not.toBeInTheDocument();
  });
});
