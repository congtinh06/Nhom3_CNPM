import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Category,
  Zone,
  Route,
  PoiSummary,
  PoiDetail,
  PoiGuide,
  NearbyPoi,
  ResolvePoiResponse,
  CreateAnalyticsEventRequest,
  AuthSession,
  Product,
  ProductCategory,
  PageResponse,
} from '../types';
import { tokenStore, notifyLoggedOut } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Bắt buộc để trình duyệt gửi/nhận cookie refresh HttpOnly khi API khác origin.
  withCredentials: true,
  timeout: 15000,
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Các endpoint tự thân đã xử lý 401 (hoặc không nên thử refresh khi thất bại).
const NO_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/logout-all',
];

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<AuthSession>('/api/auth/refresh', {})
      .then((response) => {
        tokenStore.set(response.data.accessToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && !config.headers.has?.('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';
    const isSelfRefreshing = NO_REFRESH_PATHS.some((path) => url.includes(path));

    if (status !== 401 || !config || config._retried || isSelfRefreshing || !tokenStore.get()) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      const newToken = await refreshAccessToken();
      const headers = config.headers as unknown as {
        set?: (key: string, value: string) => void;
      };
      if (typeof headers?.set === 'function') {
        headers.set('Authorization', `Bearer ${newToken}`);
      }
      return apiClient.request(config);
    } catch {
      notifyLoggedOut();
      return Promise.reject(error);
    }
  }
);


export const api = {
  getCategories: async (signal?: AbortSignal): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/content/categories', { signal });
    return response.data;
  },

  getZones: async (signal?: AbortSignal): Promise<Zone[]> => {
    const response = await apiClient.get<Zone[]>('/api/content/zones', { signal });
    return response.data;
  },

  getRoutes: async (zoneId?: number, signal?: AbortSignal): Promise<Route[]> => {
    const response = await apiClient.get<Route[]>('/api/content/routes', {
      params: zoneId !== undefined ? { zoneId } : undefined,
      signal,
    });
    return response.data;
  },

  // Toàn bộ POI ACTIVE kèm mọi bản dịch trong 1 lần gọi (nguồn chung với admin).
  getPoiGuides: async (zoneId?: number, signal?: AbortSignal): Promise<PoiGuide[]> => {
    const response = await apiClient.get<PoiGuide[]>('/api/content/pois/guide', {
      params: zoneId !== undefined ? { zoneId } : undefined,
      signal,
    });
    return response.data;
  },

  getPois: async (zoneId?: number, signal?: AbortSignal): Promise<PoiSummary[]> => {
    const response = await apiClient.get<PoiSummary[]>('/api/content/pois', {
      params: zoneId !== undefined ? { zoneId } : undefined,
      signal,
    });
    return response.data;
  },

  getPoiDetail: async (id: number, lang: string = 'vi', signal?: AbortSignal): Promise<PoiDetail> => {
    const response = await apiClient.get<PoiDetail>(`/api/content/pois/${id}`, {
      params: { lang },
      signal,
    });
    return response.data;
  },

  getPoiByQr: async (qrToken: string, lang: string = 'vi', signal?: AbortSignal): Promise<PoiDetail> => {
    const response = await apiClient.get<PoiDetail>(`/api/content/pois/qr/${encodeURIComponent(qrToken)}`, {
      params: { lang },
      signal,
    });
    return response.data;
  },

  getNearbyPois: async (
    lat: number,
    lng: number,
    radius: number,
    signal?: AbortSignal
  ): Promise<NearbyPoi[]> => {
    const response = await apiClient.get<NearbyPoi[]>('/api/location/nearby', {
      params: { lat, lng, radius },
      signal,
    });
    return response.data;
  },

  resolvePoi: async (lat: number, lng: number, signal?: AbortSignal): Promise<ResolvePoiResponse> => {
    const response = await apiClient.get<ResolvePoiResponse>('/api/location/resolve', {
      params: { lat, lng },
      signal,
    });
    return response.data;
  },

  getAudioUrl: (audioPathOrFileName: string): string => {
    if (!audioPathOrFileName) return '';
    if (audioPathOrFileName.startsWith('http://') || audioPathOrFileName.startsWith('https://')) {
      return audioPathOrFileName;
    }
    const cleanPath = audioPathOrFileName.startsWith('/')
      ? audioPathOrFileName
      : `/api/tts/audio/${audioPathOrFileName}`;
    return `${BASE_URL}${cleanPath}`;
  },

  recordAnalyticsEvent: async (event: CreateAnalyticsEventRequest): Promise<void> => {
    await apiClient.post<void>('/api/analytics/events', event);
  },

  getProducts: async (
    params?: {
      category?: ProductCategory;
      categoryId?: number;
      poiSlug?: string;
      keyword?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      rating?: number;
      sortBy?: string;
      page?: number;
      size?: number;
    },
    signal?: AbortSignal
  ): Promise<PageResponse<Product>> => {
    const response = await apiClient.get<PageResponse<Product>>('/api/content/products', {
      params,
      signal,
    });
    return response.data;
  },

  getProductBySlug: async (slug: string, signal?: AbortSignal): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/content/products/${encodeURIComponent(slug)}`, {
      signal,
    });
    return response.data;
  },
};
