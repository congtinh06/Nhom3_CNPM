import { apiClient } from './client';
import {
  AuthMessage,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types';

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, body ?? {});
  return response.data;
}

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/register', payload),

  login: (payload: LoginPayload): Promise<AuthSession> =>
    post<AuthSession>('/api/auth/login', payload),

  refresh: (): Promise<AuthSession> => post<AuthSession>('/api/auth/refresh', {}),

  logout: async (): Promise<void> => {
    await apiClient.post<void>('/api/auth/logout');
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.post<void>('/api/auth/logout-all');
  },

  verifyEmail: (token: string): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/verify-email', { token }),

  resendVerification: (email: string): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/resend-verification', { email }),

  forgotPassword: (email: string): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/forgot-password', { email }),

  resetPassword: (payload: ResetPasswordPayload): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/reset-password', payload),

  changePassword: (payload: ChangePasswordPayload): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/change-password', payload),

  me: async (): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/api/auth/me');
    return response.data;
  },
};
