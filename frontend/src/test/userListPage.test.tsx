import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UserListPage } from '../admin/pages/UserListPage';
import { userApi } from '../admin/api/userApi';
import { AdminUser, AdminUserPageResponse } from '../admin/types/user';

vi.mock('../admin/api/userApi', () => ({
  userApi: {
    getAdminUsers: vi.fn(),
    getAdminUserDetail: vi.fn(),
    updateUserRole: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

const pageOf = (
  content: AdminUser[],
  overrides: Partial<AdminUserPageResponse> = {}
): AdminUserPageResponse => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
  ...overrides,
});

const mockRows: AdminUser[] = [
  {
    id: 1,
    fullName: 'Nguyễn Văn An',
    email: 'an@saigonvoice.local',
    role: 'USER',
    status: 'ACTIVE',
    provider: 'LOCAL',
    emailVerified: true,
    lastLoginAt: '2026-01-01T10:00:00',
    createdAt: '2025-12-01T10:00:00',
  },
  {
    id: 2,
    fullName: 'Trần Thị Bích',
    email: 'bich@saigonvoice.local',
    role: 'ADMIN',
    status: 'BLOCKED',
    provider: 'GOOGLE',
    emailVerified: true,
    lastLoginAt: null,
    createdAt: '2025-11-01T10:00:00',
  },
];

describe('UserListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userApi.getAdminUsers).mockResolvedValue(pageOf(mockRows));
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/nguoi-dung']}>
        <Routes>
          <Route path="/quan-tri/nguoi-dung" element={<UserListPage />} />
          <Route path="/quan-tri/nguoi-dung/:id" element={<div>Trang chi tiết người dùng</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('gọi endpoint admin với tham số phân trang mặc định', async () => {
    renderComponent();

    await waitFor(() => {
      expect(userApi.getAdminUsers).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined,
        role: undefined,
        status: undefined,
      });
    });
  });

  it('hiển thị danh sách người dùng kèm vai trò và trạng thái tiếng Việt', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    expect(screen.getByText('an@saigonvoice.local')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Bích')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Du khách')).toBeInTheDocument();
    expect(within(table).getByText('Quản trị viên')).toBeInTheDocument();
    expect(within(table).getByText('Hoạt động')).toBeInTheDocument();
    expect(within(table).getByText('Đã khóa')).toBeInTheDocument();
  });

  it('hiển thị ErrorState kèm nút Thử lại và tải lại thành công', async () => {
    vi.mocked(userApi.getAdminUsers)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(pageOf(mockRows));
    renderComponent();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/không thể tải danh sách người dùng/i);

    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }));

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });
  });

  it('hiển thị EmptyState khi chưa có người dùng nào', async () => {
    vi.mocked(userApi.getAdminUsers).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có người dùng nào')).toBeInTheDocument();
    });
  });

  it('tìm kiếm gửi tham số search đã trim lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tìm kiếm người dùng/i), {
      target: { value: '  bích  ' },
    });

    await waitFor(() => {
      expect(userApi.getAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'bích', page: 0 })
      );
    });
  });

  it('lọc theo vai trò gửi tham số role lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/lọc theo vai trò/i), {
      target: { value: 'ADMIN' },
    });

    await waitFor(() => {
      expect(userApi.getAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: 'ADMIN', page: 0 })
      );
    });
  });

  it('lọc theo trạng thái gửi tham số status lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/lọc theo trạng thái người dùng/i), {
      target: { value: 'BLOCKED' },
    });

    await waitFor(() => {
      expect(userApi.getAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'BLOCKED', page: 0 })
      );
    });
  });

  it('liên kết Chi tiết điều hướng SPA tới trang chi tiết người dùng', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    fireEvent.click(within(table).getAllByRole('link', { name: /chi tiết/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText('Trang chi tiết người dùng')).toBeInTheDocument();
    });
  });
});
