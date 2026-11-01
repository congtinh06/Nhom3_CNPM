import { adminClient } from './adminClient';
import {
  AdminPoiDetail,
  AdminPoiPageResponse,
  AdminPoiQueryParams,
  CreatePoiInput,
  UpdatePoiInput,
  PoiDetail,
  PoiPublishStatus,
  PoiZoneOption,
  PoiCategoryOption,
  PoiRouteOption,
} from '../types/poi';

export const poiApi = {
  getAdminPois: async (params: AdminPoiQueryParams): Promise<AdminPoiPageResponse> => {
    const response = await adminClient.get<AdminPoiPageResponse>('/api/content/admin/pois', {
      params,
    });
    return response.data;
  },

  getAdminPoiDetail: async (id: number): Promise<AdminPoiDetail> => {
    const response = await adminClient.get<AdminPoiDetail>(`/api/content/admin/pois/${id}`);
    return response.data;
  },

  getZones: async (): Promise<PoiZoneOption[]> => {
    const response = await adminClient.get<PoiZoneOption[]>('/api/content/zones');
    return response.data;
  },

  getCategories: async (): Promise<PoiCategoryOption[]> => {
    const response = await adminClient.get<PoiCategoryOption[]>('/api/content/categories');
    return response.data;
  },

  getRoutes: async (zoneId?: number): Promise<PoiRouteOption[]> => {
    const response = await adminClient.get<PoiRouteOption[]>('/api/content/routes', {
      params: zoneId !== undefined ? { zoneId } : undefined,
    });
    return response.data;
  },

  createPoi: async (data: CreatePoiInput): Promise<PoiDetail> => {
    const response = await adminClient.post<PoiDetail>('/api/content/admin/pois', data);
    return response.data;
  },

  updatePoi: async (id: number, data: UpdatePoiInput): Promise<AdminPoiDetail> => {
    const response = await adminClient.put<AdminPoiDetail>(`/api/content/admin/pois/${id}`, data);
    return response.data;
  },

  republish: async (id: number): Promise<PoiPublishStatus> => {
    const response = await adminClient.post<PoiPublishStatus>(
      `/api/content/admin/pois/${id}/republish`
    );
    return response.data;
  },

  /**
   * Đổi trạng thái hiển thị của POI. INACTIVE = ẩn khỏi bản đồ/API công khai.
   * Tách khỏi updatePoi nên không cần gửi kèm version.
   */
  updatePoiStatus: async (
    id: number,
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  ): Promise<AdminPoiDetail> => {
    const response = await adminClient.patch<AdminPoiDetail>(
      `/api/content/admin/pois/${id}/status`,
      { status }
    );
    return response.data;
  },
};
