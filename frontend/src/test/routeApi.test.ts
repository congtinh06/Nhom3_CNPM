import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeApi } from '../admin/api/routeApi';
import { adminClient } from '../admin/api/adminClient';
import { CreateRouteInput, UpdateRouteInput } from '../admin/types/route';

vi.mock('../admin/api/adminClient', () => ({
  adminClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('routeApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminRoutes: gọi GET /api/content/admin/routes với tham số phân trang/lọc', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await routeApi.getAdminRoutes({ page: 1, size: 10, zoneId: 3, status: 'ACTIVE' });
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/admin/routes', {
      params: { page: 1, size: 10, zoneId: 3, status: 'ACTIVE' },
    });
  });

  it('getAdminRouteDetail: gọi GET /api/content/admin/routes/:id', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await routeApi.getAdminRouteDetail(8);
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/admin/routes/8');
  });

  it('createRoute: gửi POST tới /api/content/admin/routes với payload', async () => {
    const input: CreateRouteInput = {
      zoneId: 2,
      name: 'Tuyến di sản',
      displayOrder: 1,
    };
    vi.mocked(adminClient.post).mockResolvedValueOnce({ data: {} });
    await routeApi.createRoute(input);
    expect(adminClient.post).toHaveBeenCalledWith('/api/content/admin/routes', input);
  });

  it('updateRoute: gửi PUT tới /api/content/admin/routes/:id', async () => {
    const input: UpdateRouteInput = {
      name: 'Tuyến di sản',
      displayOrder: 2,
      status: 'INACTIVE',
    };
    vi.mocked(adminClient.put).mockResolvedValueOnce({ data: {} });
    await routeApi.updateRoute(8, input);
    expect(adminClient.put).toHaveBeenCalledWith('/api/content/admin/routes/8', input);
  });

  it('updateStops: gửi PUT tới /api/content/admin/routes/:id/stops với poiIds theo thứ tự', async () => {
    vi.mocked(adminClient.put).mockResolvedValueOnce({ data: { stops: [] } });
    await routeApi.updateStops(8, { poiIds: [5, 2, 9] });
    expect(adminClient.put).toHaveBeenCalledWith('/api/content/admin/routes/8/stops', {
      poiIds: [5, 2, 9],
    });
  });
});
