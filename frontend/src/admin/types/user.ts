export type UserRoleValue = 'USER' | 'ADMIN';
export type UserStatusValue = 'PENDING' | 'ACTIVE' | 'BLOCKED';
export type UserProvider = 'LOCAL' | 'GOOGLE' | 'LOCAL_GOOGLE';

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRoleValue;
  status: UserStatusValue;
  provider: UserProvider;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface AdminUserQueryParams {
  page?: number;
  size?: number;
  search?: string;
  role?: UserRoleValue | '';
  status?: UserStatusValue | '';
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
