/**
 * ============================================================================
 * ĐỊNH NGHĨA KIỂU DỮ LIỆU NGƯỜI DÙNG QUẢN TRỊ (Admin User Types)
 * ============================================================================
 * 
 * Mục đích:
 * - Định nghĩa các cấu trúc dữ liệu người dùng, phân trang, bộ lọc cho trang quản trị.
 * - Quản lý trạng thái gói tài khoản: UserPlanValue ('FREE' | 'PREMIUM').
 * 
 * Các trường mới liên quan đến gói Premium:
 * - `plan`: Gói tài khoản hiện tại ('FREE' hoặc 'PREMIUM').
 * - `premiumActive`: Cờ boolean cho biết gói Premium còn hiệu lực hay không.
 * - `premiumExpiresAt`: Thời điểm hết hạn của gói Premium (ISO 8601 string hoặc null nếu vĩnh viễn).
 * - `premiumSourceOrderCode`: Mã đơn hàng thanh toán kích hoạt gói Premium.
 * ============================================================================
 */

export type UserRoleValue = 'USER' | 'ADMIN';
export type UserStatusValue = 'PENDING' | 'ACTIVE' | 'BLOCKED';
export type UserProvider = 'LOCAL' | 'GOOGLE' | 'LOCAL_GOOGLE';
export type UserPlanValue = 'FREE' | 'PREMIUM';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRoleValue;
  status: UserStatusValue;
  provider: UserProvider;
  emailVerified: boolean;
  plan?: UserPlanValue;
  premiumActive?: boolean;
  premiumExpiresAt?: string | null;
  premiumSourceOrderCode?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface AdminUserQueryParams {
  page?: number;
  size?: number;
  search?: string;
  role?: UserRoleValue | '';
  status?: UserStatusValue | '';
  plan?: UserPlanValue | '';
  sort?: string;
}

export interface AdminUserPageResponse {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const USER_ROLE_LABELS: Record<UserRoleValue, string> = {
  USER: 'Du khách',
  ADMIN: 'Quản trị viên',
};

export const USER_STATUS_LABELS: Record<UserStatusValue, string> = {
  PENDING: 'Chờ xác thực',
  ACTIVE: 'Hoạt động',
  BLOCKED: 'Đã khóa',
};

export const USER_PROVIDER_LABELS: Record<UserProvider, string> = {
  LOCAL: 'Mật khẩu',
  GOOGLE: 'Google',
  LOCAL_GOOGLE: 'Google + mật khẩu',
};

export const USER_PLAN_LABELS: Record<UserPlanValue, string> = {
  FREE: 'Miễn phí (Free)',
  PREMIUM: 'Nâng cao (Premium)',
};
