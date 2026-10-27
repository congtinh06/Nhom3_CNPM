import { apiClient } from './client';
import { refreshSession } from './refresh';
import { AuthScope } from './tokenStore';
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

function scopeConfig(scope: AuthScope) {
  return scope === 'admin' ? { headers: { 'X-Auth-Scope': 'admin' } } : undefined;
}

async function post<T>(url: string, body?: unknown, scope: AuthScope = 'user'): Promise<T> {
  const response = await apiClient.post<T>(url, body ?? {}, scopeConfig(scope));
  return response.data;
}

const QR_EXCHANGE_HEADER = 'X-QR-Exchange-Token';

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/register', payload),

  login: (payload: LoginPayload, scope: AuthScope = 'user'): Promise<AuthSession> =>
    post<AuthSession>('/api/auth/login', payload, scope),

  loginWithGoogle: (credential: string, scope: AuthScope = 'user'): Promise<AuthSession> =>
    post<AuthSession>('/api/auth/google', { credential }, scope),

  refresh: (scope: AuthScope = 'user'): Promise<AuthSession> => refreshSession(scope),

  logout: async (scope: AuthScope = 'user'): Promise<void> => {
    await apiClient.post<void>('/api/auth/logout', undefined, scopeConfig(scope));
  },

  logoutAll: async (scope: AuthScope = 'user'): Promise<void> => {
    await apiClient.post<void>('/api/auth/logout-all', undefined, scopeConfig(scope));
  },

  verifyEmail: (token: string): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/verify-email', { token }),

  resendVerification: (email: string): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/resend-verification', { email }),

  forgotPassword: (email: string): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/forgot-password', { email }),

  resetPassword: (payload: ResetPasswordPayload): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/reset-password', payload),

  changePassword: (payload: ChangePasswordPayload, scope: AuthScope = 'user'): Promise<AuthMessage> =>
    post<AuthMessage>('/api/auth/change-password', payload, scope),

  me: async (scope: AuthScope = 'user'): Promise<AuthUser> => {
    const response = await apiClient.get<AuthUser>('/api/auth/me', scopeConfig(scope));
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

  guestScanQrLogin: (qrToken: string): Promise<QrScanResponse> =>
    post<QrScanResponse>('/api/auth/qr/sessions/guest-scan', { qrToken }),

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
