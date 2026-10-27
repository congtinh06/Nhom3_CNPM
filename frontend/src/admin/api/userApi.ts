/**
 * ============================================================================
 * API GỌI DỊCH VỤ AUTH DÀNH CHO ADMIN (Admin User API)
 * ============================================================================
 * 
 * Mục đích:
 * - Gửi các yêu cầu quản trị người dùng từ client tới backend auth-service.
 * - Hỗ trợ các hành động:
 *   + `getAdminUsers`: Lấy danh sách người dùng phân trang, tìm kiếm và lọc theo gói (`plan`).
 *   + `getAdminUserDetail`: Lấy chi tiết thông tin và trạng thái gói Premium của người dùng.
 *   + `updateUserRole`: Cập nhật vai trò (Du khách / Quản trị viên).
 *   + `updateUserStatus`: Khóa / Kích hoạt tài khoản.
 *   + `updateUserPlan`: Nâng cấp hoặc thay đổi gói dịch vụ (FREE / PREMIUM) kèm số ngày hiệu lực.
 * ============================================================================
 */

import { adminClient } from './adminClient';
import {
  AdminUser,
  AdminUserPageResponse,
  AdminUserQueryParams,
  UserPlanValue,
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

  updateUserPlan: async (
    id: number,
    plan: UserPlanValue,
    durationDays?: number
  ): Promise<AdminUser> => {
    const response = await adminClient.patch<AdminUser>(`/api/auth/admin/users/${id}/plan`, {
      plan,
      durationDays,
    });
    return response.data;
  },
};
