import axios from 'axios';
import {
  CreateReportPayload,
  Report,
  VerifyUrlResponse,
  NotificationLogItem,
  StatsData,
  DailyStats,
  ReportFilterParams,
  Locale,
  NearbyResponse,
  NearbyParams,
  VisitStats,
} from '../types';
import {
  mockLocales,
  mockPois,
  mockNarrations,
  mockVisitStats,
  calculateHaversineDistance,
  getMockNearby,
} from './poiMock';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:18080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

export const api = {
  // Báo cáo lừa đảo (POST /api/v1/reports)
  createReport: async (payload: CreateReportPayload): Promise<Report> => {
    const response = await apiClient.post<Report>('/api/v1/reports', payload);
    return response.data;
  },

  // Lấy danh sách toàn bộ báo cáo (GET /api/v1/reports)
  getReports: async (params?: ReportFilterParams): Promise<Report[]> => {
    const response = await apiClient.get<Report[]>('/api/v1/reports', { params });
    return response.data;
  },

  // Lấy chi tiết báo cáo (GET /api/v1/reports/{id})
  getReportById: async (id: number): Promise<Report> => {
    const response = await apiClient.get<Report>(`/api/v1/reports/${id}`);
    return response.data;
  },

  // Quét nhanh URL trực tiếp qua Gateway (POST /api/v1/verify)
  verifyUrl: async (url: string): Promise<VerifyUrlResponse> => {
    const response = await apiClient.post<VerifyUrlResponse>('/api/v1/verify', { url });
    return response.data;
  },

  // Lấy dữ liệu thống kê tổng quan (GET /api/v1/stats)
  getStats: async (): Promise<StatsData> => {
    const response = await apiClient.get<StatsData>('/api/v1/stats');
    return response.data;
  },

  // Lấy danh sách nhật ký thông báo (GET /api/v1/notifications)
  getNotifications: async (): Promise<NotificationLogItem[]> => {
    const response = await apiClient.get<NotificationLogItem[]>('/api/v1/notifications');
    return response.data;
  },

  // Lấy chỉ số thống kê hàng ngày (GET /api/v1/stats/daily hoặc từ getStats)
  getDailyStats: async (): Promise<DailyStats> => {
    try {
      const response = await apiClient.get<DailyStats>('/api/v1/stats/daily');
      return response.data;
    } catch {
      const stats = await api.getStats();
      return {
        todayScans: stats.totalScans,
        phishingDetected: stats.phishingDetected,
        avgResponseTimeMs: 245,
      };
    }
  },

  // Lấy danh sách ngôn ngữ hỗ trợ thuyết minh (GET /api/v1/narrate/locales)
  getLocales: async (): Promise<Locale[]> => {
    if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
      return mockLocales;
    }
    try {
      const response = await apiClient.get<Locale[]>('/api/v1/narrate/locales');
      return response.data;
    } catch {
      return mockLocales;
    }
  },

  // Quét điểm POI gần nhất và lấy thuyết minh đa ngôn ngữ (GET /api/poi/nearby)
  // HTTP 204 = không có điểm gần (trả null)
  getNearby: async (
    paramsOrLat: NearbyParams | number,
    lng?: number,
    lang?: string,
    radius?: number,
    bank?: string
  ): Promise<NearbyResponse | null> => {
    let lat: number;
    let long: number;
    let language: string | undefined;
    let rad: number | undefined;
    let bankName: string | undefined;

    if (typeof paramsOrLat === 'number') {
      lat = paramsOrLat;
      long = lng ?? 0;
      language = lang;
      rad = radius;
      bankName = bank;
    } else {
      lat = paramsOrLat.lat;
      long = paramsOrLat.lng;
      language = paramsOrLat.lang;
      rad = paramsOrLat.radius;
      bankName = paramsOrLat.bank;
    }

    if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
      return getMockNearby(lat, long, language, rad, bankName);
    }

    try {
      const response = await apiClient.get<NearbyResponse | ''>('/api/poi/nearby', {
        params: {
          lat,
          lng: long,
          ...(language ? { lang: language } : {}),
          ...(rad !== undefined ? { radius: rad } : {}),
          ...(bankName ? { bank: bankName } : {}),
        },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
      });

      if (response.status === 204 || !response.data) {
        return null;
      }
      return response.data as NearbyResponse;
    } catch {
      return getMockNearby(lat, long, language, rad, bankName);
    }
  },

  // Lấy thống kê lượt ghé thăm điểm POI (GET /api/v1/visits/stats)
  getVisitStats: async (): Promise<VisitStats> => {
    if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
      return mockVisitStats;
    }
    try {
      const response = await apiClient.get<VisitStats>('/api/v1/visits/stats');
      return response.data;
    } catch {
      return mockVisitStats;
    }
  },
};

export {
  mockLocales,
  mockPois,
  mockNarrations,
  mockVisitStats,
  calculateHaversineDistance,
  getMockNearby,
};
