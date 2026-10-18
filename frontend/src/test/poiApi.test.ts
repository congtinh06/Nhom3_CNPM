import { describe, it, expect, vi, beforeEach } from 'vitest';
import { poiApi } from '../admin/api/poiApi';
import { adminClient } from '../admin/api/adminClient';
import { CreatePoiInput, UpdatePoiInput } from '../admin/types/poi';

vi.mock('../admin/api/adminClient', () => ({
  adminClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('poiApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAdminPois: gọi GET /api/content/admin/pois với tham số phân trang/lọc', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await poiApi.getAdminPois({
      page: 0,
      size: 20,
      search: 'ben',
      zoneId: 1,
      overallStatus: 'NEEDS_ATTENTION',
      languageStatus: 'ERROR',
    });
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/admin/pois', {
      params: {
        page: 0,
        size: 20,
        search: 'ben',
        zoneId: 1,
        overallStatus: 'NEEDS_ATTENTION',
        languageStatus: 'ERROR',
      },
    });
  });

  it('getAdminPoiDetail: gọi GET /api/content/admin/pois/:id (không có lang)', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: {} });
    await poiApi.getAdminPoiDetail(7);
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/admin/pois/7');
  });

  it('getZones/getCategories: gọi đúng URL danh mục và khu vực', async () => {
    vi.mocked(adminClient.get).mockResolvedValue({ data: [] });
    await poiApi.getZones();
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/zones');
    await poiApi.getCategories();
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/categories');
  });

  it('getRoutes: gọi GET /api/content/routes với zoneId', async () => {
    vi.mocked(adminClient.get).mockResolvedValueOnce({ data: [] });
    await poiApi.getRoutes(5);
    expect(adminClient.get).toHaveBeenCalledWith('/api/content/routes', { params: { zoneId: 5 } });
  });

  it('createPoi: gửi POST tới /api/content/admin/pois với payload', async () => {
    const input: CreatePoiInput = {
      zoneId: 1,
      categoryId: 2,
      code: 'BEN_THANH',
      qrToken: 'qr-ben-thanh',
      name: 'Chợ Bến Thành',
      latitude: 10.7725,
      longitude: 106.698,
      title: 'Chợ Bến Thành',
      summary: 'Khu chợ biểu tượng',
      description: 'Chi tiết',
    };
    vi.mocked(adminClient.post).mockResolvedValueOnce({ data: {} });
    await poiApi.createPoi(input);
    expect(adminClient.post).toHaveBeenCalledWith('/api/content/admin/pois', input);
  });

  it('updatePoi: gửi PUT tới /api/content/admin/pois/:id kèm version', async () => {
    const input: UpdatePoiInput = {
      version: 3,
      categoryId: 2,
      name: 'Chợ Bến Thành',
      latitude: 10.7725,
      longitude: 106.698,
      routeId: 7,
      stopOrder: 2,
      title: 'Chợ Bến Thành',
      summary: 'Khu chợ biểu tượng',
      description: 'Chi tiết',
    };
    vi.mocked(adminClient.put).mockResolvedValueOnce({ data: {} });
    await poiApi.updatePoi(9, input);
    expect(adminClient.put).toHaveBeenCalledWith('/api/content/admin/pois/9', input);
    expect(vi.mocked(adminClient.put).mock.calls[0]?.[1]).toMatchObject({ version: 3 });
  });

  it('republish: gửi POST tới /api/content/admin/pois/:id/republish', async () => {
    vi.mocked(adminClient.post).mockResolvedValueOnce({ data: {} });
    await poiApi.republish(9);
    expect(adminClient.post).toHaveBeenCalledWith('/api/content/admin/pois/9/republish');
  });
});
