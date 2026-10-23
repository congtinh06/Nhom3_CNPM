import { apiClient } from './client';
import {
  AuthMessage,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  QrLoginSession,
  QrLoginStatusResponse,
  QrScanResponse,
  RegisterPayload,
  ResetPasswordPayload,
} from '../types';

async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, body ?? {});
  return response.data;
}

const QR_EXCHANGE_HEADER = 'X-QR-Exchange-Token';

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/register', payload),

  login: (payload: LoginPayload): Promise<AuthSession> =>
    post<AuthSession>('/api/auth/login', payload),

  loginWithGoogle: (credential: string): Promise<AuthSession> =>
    post<AuthSession>('/api/auth/google', { credential }),

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

  createQrSession: (): Promise<QrLoginSession> =>
    post<QrLoginSession>('/api/auth/qr/sessions', {}),

  qrSessionStatus: async (
    sessionId: string,
    exchangeToken: string
  ): Promise<QrLoginStatusResponse> => {
    const response = await apiClient.get<QrLoginStatusResponse>(
      `/api/auth/qr/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { [QR_EXCHANGE_HEADER]: exchangeToken } }
    );
    return response.data;
  },

  scanQrLogin: (qrToken: string): Promise<QrScanResponse> =>
    post<QrScanResponse>('/api/auth/qr/sessions/scan', { qrToken }),

  approveQrLogin: (qrToken: string): Promise<QrScanResponse> =>
    post<QrScanResponse>('/api/auth/qr/sessions/approve', { qrToken }),

  denyQrLogin: (qrToken: string): Promise<QrScanResponse> =>
    post<QrScanResponse>('/api/auth/qr/sessions/deny', { qrToken }),

  exchangeQrSession: async (
    sessionId: string,
    exchangeToken: string
  ): Promise<AuthSession> => {
    const response = await apiClient.post<AuthSession>(
      `/api/auth/qr/sessions/${encodeURIComponent(sessionId)}/exchange`,
      {},
      { headers: { [QR_EXCHANGE_HEADER]: exchangeToken } }
    );
    return response.data;
  },

  cancelQrSession: async (sessionId: string, exchangeToken: string): Promise<void> => {
    await apiClient.post<void>(
      `/api/auth/qr/sessions/${encodeURIComponent(sessionId)}/cancel`,
      {},
      { headers: { [QR_EXCHANGE_HEADER]: exchangeToken } }
    );
  },
};
