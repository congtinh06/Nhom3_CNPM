import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi } from '../admin/api/userApi';
import { adminClient } from '../admin/api/adminClient';

vi.mock('../admin/api/adminClient', () => ({
  adminClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminUsers: gọi GET /api/auth/admin/users với tham số phân trang/lọc', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await userApi.getAdminUsers({ page: 0, size: 10, search: 'an', role: 'USER', status: 'ACTIVE' });
    expect(adminClient.get).toHaveBeenCalledWith('/api/auth/admin/users', {
      params: { page: 0, size: 10, search: 'an', role: 'USER', status: 'ACTIVE' },
    });
  });

  it('getAdminUserDetail: gọi GET /api/auth/admin/users/:id', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await userApi.getAdminUserDetail(7);
    expect(adminClient.get).toHaveBeenCalledWith('/api/auth/admin/users/7');
  });

  it('updateUserRole: gửi PATCH tới /role với payload { role }', async () => {
    vi.mocked(adminClient.patch).mockResolvedValueOnce({ data: {} });
    await userApi.updateUserRole(7, 'ADMIN');
    expect(adminClient.patch).toHaveBeenCalledWith('/api/auth/admin/users/7/role', {
      role: 'ADMIN',
    });
  });

  it('updateUserStatus: gửi PATCH tới /status với payload { status }', async () => {
    vi.mocked(adminClient.patch).mockResolvedValueOnce({ data: {} });
    await userApi.updateUserStatus(7, 'BLOCKED');
    expect(adminClient.patch).toHaveBeenCalledWith('/api/auth/admin/users/7/status', {
      status: 'BLOCKED',
    });
  });

  it('không dùng PUT/POST cho các thao tác quản trị người dùng', async () => {
    vi.mocked(adminClient.get).mockResolvedValue({ data: {} });
    vi.mocked(adminClient.patch).mockResolvedValue({ data: {} });
    await userApi.getAdminUsers({ page: 0, size: 10 });
    await userApi.updateUserStatus(1, 'ACTIVE');
    expect(adminClient.put).not.toHaveBeenCalled();
    expect(adminClient.post).not.toHaveBeenCalled();
  });
});
