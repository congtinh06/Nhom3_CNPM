import { adminClient } from './adminClient';
import {
  AdminUser,
  AdminUserPageResponse,
  AdminUserQueryParams,
  UserRoleValue,
  UserStatusValue,
} from '../types/user';

export const userApi = {
  getAdminUsers: async (params: AdminUserQueryParams): Promise<AdminUserPageResponse> => {
    const response = await adminClient.get<AdminUserPageResponse>('/api/auth/admin/users', {
      params,
    });
    return response.data;
  },

  getAdminUserDetail: async (id: number): Promise<AdminUser> => {
    const response = await adminClient.get<AdminUser>(`/api/auth/admin/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: number, role: UserRoleValue): Promise<AdminUser> => {
    const response = await adminClient.patch<AdminUser>(`/api/auth/admin/users/${id}/role`, {
      role,
    });
    return response.data;
  },

  updateUserStatus: async (id: number, status: UserStatusValue): Promise<AdminUser> => {
    const response = await adminClient.patch<AdminUser>(`/api/auth/admin/users/${id}/status`, {
      status,
    });
    return response.data;
  },
};
