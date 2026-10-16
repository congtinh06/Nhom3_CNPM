import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import { UserDetailPage } from '../admin/pages/UserDetailPage';
import { userApi } from '../admin/api/userApi';
import { AdminUser } from '../admin/types/user';
import { useAuth } from '../context/AuthContext';

vi.mock('../admin/api/userApi', () => ({
  userApi: {
    getAdminUsers: vi.fn(),
    getAdminUserDetail: vi.fn(),
    updateUserRole: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const baseUser: AdminUser = {
  id: 5,
  fullName: 'Nguyễn Văn An',
  email: 'an@saigonvoice.local',
  role: 'USER',
  status: 'ACTIVE',
  provider: 'LOCAL',
  emailVerified: true,
  lastLoginAt: '2026-01-01T10:00:00',
  createdAt: '2025-12-01T10:00:00',
};

function setAuth(currentUserId: number) {
  mockUseAuth.mockReturnValue({
    status: 'authenticated',
    user: {
      id: currentUserId,
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
}

function forbiddenError(message: string): AxiosError {
  return new AxiosError('Request failed with status code 403', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 403,
    statusText: 'Forbidden',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe('UserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth(1);
    vi.mocked(userApi.getAdminUserDetail).mockResolvedValue(baseUser);
  });

  const renderComponent = (id = 5) =>
    render(
      <MemoryRouter initialEntries={[`/quan-tri/nguoi-dung/${id}`]}>
        <Routes>
          <Route path="/quan-tri/nguoi-dung" element={<div>Trang danh sách</div>} />
          <Route path="/quan-tri/nguoi-dung/:id" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('tải và hiển thị thông tin người dùng an toàn (không có trường bí mật)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
    });
    expect(screen.getAllByText('an@saigonvoice.local').length).toBeGreaterThan(0);
    expect(screen.getByText('Mật khẩu')).toBeInTheDocument();
    expect(userApi.getAdminUserDetail).toHaveBeenCalledWith(5);
  });

  it('hiển thị ErrorState khi không tải được chi tiết', async () => {
    const notFound = new AxiosError('Request failed with status code 404', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      data: { message: 'Không tìm thấy người dùng.' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(userApi.getAdminUserDetail).mockRejectedValueOnce(notFound);

    renderComponent(99);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/không thể tải thông tin người dùng/i);
  });

  it('đổi vai trò: xác nhận trong hộp thoại gọi API đúng một lần và cập nhật từ phản hồi', async () => {
    vi.mocked(userApi.updateUserRole).mockResolvedValue({ ...baseUser, role: 'ADMIN' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/chọn vai trò/i), { target: { value: 'ADMIN' } });
    fireEvent.click(screen.getByRole('button', { name: /cập nhật vai trò/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/cấp toàn quyền quản trị/i);
    fireEvent.click(within(dialog).getByRole('button', { name: /xác nhận/i }));

    await waitFor(() => {
      expect(userApi.updateUserRole).toHaveBeenCalledTimes(1);
      expect(userApi.updateUserRole).toHaveBeenCalledWith(5, 'ADMIN');
    });

    expect(await screen.findByText(/đã cập nhật vai trò/i)).toBeInTheDocument();
    expect(userApi.getAdminUserDetail).toHaveBeenCalledTimes(1);
  });

  it('hủy hộp thoại thì không gọi API', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/chọn vai trò/i), { target: { value: 'ADMIN' } });
    fireEvent.click(screen.getByRole('button', { name: /cập nhật vai trò/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /hủy bỏ/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(userApi.updateUserRole).not.toHaveBeenCalled();
  });

  it('khóa tài khoản thất bại: giữ nguyên trạng thái cũ và hiển thị lỗi', async () => {
    vi.mocked(userApi.updateUserStatus).mockRejectedValue(
      forbiddenError('Không thể hạ cấp hoặc khóa quản trị viên đang hoạt động cuối cùng của hệ thống.')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/chọn trạng thái tài khoản/i), {
      target: { value: 'BLOCKED' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cập nhật trạng thái/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /xác nhận/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/quản trị viên đang hoạt động cuối cùng/i);
    expect(userApi.updateUserStatus).toHaveBeenCalledWith(5, 'BLOCKED');
  });

  it('tài khoản của chính mình: vô hiệu hóa nút thay đổi và hiển thị giải thích', async () => {
    setAuth(5);
    renderComponent(5);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nguyễn Văn An' })).toBeInTheDocument();
    });

    expect(screen.getByText(/không thể tự thay đổi vai trò hoặc trạng thái của mình/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/chọn vai trò/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cập nhật vai trò/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cập nhật trạng thái/i })).toBeDisabled();
  });
});
