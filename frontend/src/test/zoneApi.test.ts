import { describe, it, expect, vi, beforeEach } from 'vitest';
import { zoneApi } from '../admin/api/zoneApi';
import { adminClient } from '../admin/api/adminClient';
import { CreateZoneInput, UpdateZoneInput } from '../admin/types/zone';

vi.mock('../admin/api/adminClient', () => ({
  adminClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('zoneApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminZones: gọi GET /api/content/admin/zones với tham số phân trang/lọc', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await zoneApi.getAdminZones({ page: 0, size: 10, search: 'quan', isActive: true });
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/admin/zones', {
      params: { page: 0, size: 10, search: 'quan', isActive: true },
    });
  });

  it('getAdminZoneDetail: gọi GET /api/content/admin/zones/:id', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await zoneApi.getAdminZoneDetail(4);
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/admin/zones/4');
  });

  it('createZone: gửi POST tới /api/content/admin/zones với payload', async () => {
    const input: CreateZoneInput = {
      code: 'Q1_HISTORIC',
      name: 'Trung tâm Quận 1',
      centerLat: 10.7769,
      centerLng: 106.7009,
      radiusMeters: 1200,
    };
    vi.mocked(adminClient.post).mockResolvedValueOnce({ data: {} });
    await zoneApi.createZone(input);
    expect(adminClient.post).toHaveBeenCalledWith('/api/content/admin/zones', input);
  });

  it('updateZone: gửi PUT tới /api/content/admin/zones/:id với payload', async () => {
    const input: UpdateZoneInput = {
      name: 'Trung tâm Quận 1',
      centerLat: 10.7769,
      centerLng: 106.7009,
      radiusMeters: 1500,
      isActive: false,
    };
    vi.mocked(adminClient.put).mockResolvedValueOnce({ data: {} });
    await zoneApi.updateZone(4, input);
    expect(adminClient.put).toHaveBeenCalledWith('/api/content/admin/zones/4', input);
  });
});
