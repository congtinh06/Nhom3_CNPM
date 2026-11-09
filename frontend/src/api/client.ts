import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { refreshSession } from './refresh';
import {
  Category,
  Zone,
  Route,
  PoiSummary,
  PoiDetail,
  PoiGuide,
  NearbyPoisResponse,
  ResolvePoiResponse,
  CreateAnalyticsEventRequest,
  MeEntitlement,
  Product,
  ProductCategory,
  PageResponse,
} from '../types';
import { AuthScope, tokenStore, notifyLoggedOut } from './tokenStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const IS_DEV = import.meta.env.DEV;

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

function scopeFromConfig(config?: InternalAxiosRequestConfig): AuthScope {
  if (!config) return 'user';
  const header =
    config.headers.get?.('X-Auth-Scope') ?? config.headers['X-Auth-Scope'];
  return String(header ?? '').toLowerCase() === 'admin' ? 'admin' : 'user';
}

apiClient.interceptors.request.use((config) => {
  const scope = scopeFromConfig(config);
  const token = tokenStore.get(scope);
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
    // Detect ngrok tunnel and add skip browser warning header for dev
    if (IS_DEV && config?.headers) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    const isSelfRefreshing = NO_REFRESH_PATHS.some((path) => url.includes(path));
    const scope = scopeFromConfig(config);

    if (
      status !== 401 ||
      !config ||
      config._retried ||
      isSelfRefreshing ||
      !tokenStore.get(scope)
    ) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      const session = await refreshSession(scope);
      const headers = config.headers as unknown as {
        set?: (key: string, value: string) => void;
      };
      if (typeof headers?.set === 'function') {
        headers.set('Authorization', `Bearer ${session.accessToken}`);
      }
      return apiClient.request(config);
    } catch {
      notifyLoggedOut(scope);
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

  getPoiBySlug: async (slug: string, lang: string = 'vi', signal?: AbortSignal): Promise<PoiDetail> => {
    const response = await apiClient.get<PoiDetail>(`/api/content/pois/slug/${encodeURIComponent(slug)}`, {
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
  ): Promise<NearbyPoisResponse> => {
    const response = await apiClient.get<NearbyPoisResponse>('/api/location/nearby', {
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

  getAudioBlob: async (
    audioPathOrFileName: string,
    signal?: AbortSignal
  ): Promise<Blob> => {
    if (!audioPathOrFileName) {
      throw new Error('Missing audio path');
    }
    if (audioPathOrFileName.startsWith('http://') || audioPathOrFileName.startsWith('https://')) {
      const response = await axios.get<Blob>(audioPathOrFileName, {
        responseType: 'blob',
        signal,
      });
      return response.data;
    }
    const cleanPath = audioPathOrFileName.startsWith('/')
      ? audioPathOrFileName
      : `/api/tts/audio/${audioPathOrFileName}`;
    const response = await apiClient.get<Blob>(cleanPath, {
      responseType: 'blob',
      signal,
    });
    return response.data;
  },

  recordAnalyticsEvent: async (event: CreateAnalyticsEventRequest): Promise<void> => {
    await apiClient.post<void>('/api/analytics/events', event);
  },

  /**
   * Heartbeat hiện diện: gửi định kỳ khi tab đang mở để dashboard admin đếm
   * đúng số người đang online trong 5 phút gần nhất.
   */
  recordPresence: async (presence: {
    sessionId: string;
    languageCode?: string;
    deviceType?: string;
  }): Promise<void> => {
    await apiClient.post<void>('/api/analytics/presence', presence);
  },

  getMeEntitlements: async (signal?: AbortSignal): Promise<MeEntitlement> => {
    const response = await apiClient.get<MeEntitlement>('/api/auth/me/entitlements', { signal });
    return response.data;
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
