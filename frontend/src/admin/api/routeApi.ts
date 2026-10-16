import { adminClient } from './adminClient';
import {
  AdminRouteDetail,
  AdminRoutePageResponse,
  AdminRouteQueryParams,
  CreateRouteInput,
  RouteDto,
  RouteStopsResult,
  UpdateRouteInput,
  UpdateRouteStopsInput,
} from '../types/route';

export const routeApi = {
  getAdminRoutes: async (params: AdminRouteQueryParams): Promise<AdminRoutePageResponse> => {
    const response = await adminClient.get<AdminRoutePageResponse>('/api/content/admin/routes', {
      params,
    });
    return response.data;
  },

  getAdminRouteDetail: async (id: number): Promise<AdminRouteDetail> => {
    const response = await adminClient.get<AdminRouteDetail>(`/api/content/admin/routes/${id}`);
    return response.data;
  },

  createRoute: async (data: CreateRouteInput): Promise<RouteDto> => {
    const response = await adminClient.post<RouteDto>('/api/content/admin/routes', data);
    return response.data;
  },

  updateRoute: async (id: number, data: UpdateRouteInput): Promise<AdminRouteDetail> => {
    const response = await adminClient.put<AdminRouteDetail>(
      `/api/content/admin/routes/${id}`,
      data
    );
    return response.data;
  },

  updateStops: async (id: number, data: UpdateRouteStopsInput): Promise<RouteStopsResult> => {
    const response = await adminClient.put<RouteStopsResult>(
      `/api/content/admin/routes/${id}/stops`,
      data
    );
    return response.data;
  },

  updateRouteStatus: async (id: number, isActive: boolean): Promise<AdminRouteDetail> => {
    const response = await adminClient.patch<AdminRouteDetail>(
      `/api/content/admin/routes/${id}/status`,
      { isActive }
    );
    return response.data;
  },
};
