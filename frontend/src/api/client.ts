import axios from 'axios';
import { CreateReportPayload, Report, VerifyUrlResponse } from '../types/report';

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
  getReports: async (): Promise<Report[]> => {
    const response = await apiClient.get<Report[]>('/api/v1/reports');
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
};
