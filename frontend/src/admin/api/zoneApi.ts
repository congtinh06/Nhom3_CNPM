import { adminClient } from './adminClient';
import {
  AdminZoneDetail,
  AdminZonePageResponse,
  AdminZoneQueryParams,
  CreateZoneInput,
  UpdateZoneInput,
  ZoneDto,
} from '../types/zone';

export const zoneApi = {
  getAdminZones: async (params: AdminZoneQueryParams): Promise<AdminZonePageResponse> => {
    const response = await adminClient.get<AdminZonePageResponse>('/api/content/admin/zones', {
      params,
    });
    return response.data;
  },

  getAdminZoneDetail: async (id: number): Promise<AdminZoneDetail> => {
    const response = await adminClient.get<AdminZoneDetail>(`/api/content/admin/zones/${id}`);
    return response.data;
  },

  createZone: async (data: CreateZoneInput): Promise<ZoneDto> => {
    const response = await adminClient.post<ZoneDto>('/api/content/admin/zones', data);
    return response.data;
  },

  updateZone: async (id: number, data: UpdateZoneInput): Promise<ZoneDto> => {
    const response = await adminClient.put<ZoneDto>(`/api/content/admin/zones/${id}`, data);
    return response.data;
  },

  updateZoneStatus: async (id: number, isActive: boolean): Promise<AdminZoneDetail> => {
    const response = await adminClient.patch<AdminZoneDetail>(
      `/api/content/admin/zones/${id}/status`,
      { isActive }
    );
    return response.data;
  },
};
