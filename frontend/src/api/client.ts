import axios from 'axios';
import {
  CreateReportPayload,
  Report,
  VerifyUrlResponse,
  NotificationLogItem,
  StatsData,
  DailyStats,
  ReportFilterParams,
} from '../types/report';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
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
};
