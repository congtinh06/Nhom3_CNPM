import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStore, notifyLoggedOut } from '../../api/tokenStore';
import { AuthSession } from '../../types';
import { AdminApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const adminClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthSession>(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then((response) => {
        const newToken = response.data.accessToken;
        tokenStore.set(newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

adminClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && !config.headers.has?.('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';

    // Nếu endpoint refresh tự nó bị 401 thì không retry
    if (url.includes('/api/auth/refresh')) {
      notifyLoggedOut();
      return Promise.reject(normalizeAdminError(error));
    }

    if (status === 401 && config && !config._retried && tokenStore.get()) {
      config._retried = true;
      try {
        const newToken = await refreshAccessToken();
        const headers = config.headers as unknown as {
          set?: (key: string, value: string) => void;
        };
        if (typeof headers?.set === 'function') {
          headers.set('Authorization', `Bearer ${newToken}`);
        }
        return adminClient.request(config);
      } catch (refreshErr) {
        notifyLoggedOut();
        return Promise.reject(normalizeAdminError(refreshErr));
      }
    }

    return Promise.reject(normalizeAdminError(error));
  }
);

export function normalizeAdminError(error: unknown): AdminApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const data = error.response?.data as { message?: string; error?: string; details?: Record<string, string> } | undefined;
    const serverMessage = data?.message || data?.error;

    if (status === 403) {
      return {
        status: 403,
        message: serverMessage || 'Bạn không có quyền thực hiện thao tác này.',
        details: data?.details,
      };
    }

    if (status === 401) {
      return {
        status: 401,
        message: serverMessage || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
        details: data?.details,
      };
    }

    if (status >= 500) {
      return {
        status,
        message: 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
        details: data?.details,
      };
    }

    return {
      status,
      message: serverMessage || error.message || 'Đã xảy ra lỗi khi kết nối máy chủ.',
      details: data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message,
    };
  }

  return {
    status: 0,
    message: 'Đã xảy ra lỗi không xác định.',
  };
}
