import axios from 'axios';
import {
  PoiSummary,
  PoiDetail,
  NearbyPoi,
  ResolvePoiResponse,
  CreateAnalyticsEventRequest,
  AnalyticsSummaryResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  /**
   * Lấy danh sách điểm du lịch POI (tùy chọn lọc theo zoneId)
   * GET /api/content/pois
   */
  getPois: async (zoneId?: number): Promise<PoiSummary[]> => {
    const response = await apiClient.get<PoiSummary[]>('/api/content/pois', {
      params: zoneId !== undefined ? { zoneId } : undefined,
    });
    return response.data;
  },

  /**
   * Lấy chi tiết điểm du lịch theo ID kèm nội dung ngôn ngữ yêu cầu
   * GET /api/content/pois/{id}?lang=vi|en|ja|ko
   */
  getPoiDetail: async (id: number, lang: string = 'vi'): Promise<PoiDetail> => {
    const response = await apiClient.get<PoiDetail>(`/api/content/pois/${id}`, {
      params: { lang },
    });
    return response.data;
  },

  /**
   * Tra cứu thông tin thuyết minh POI qua mã quét QR
   * GET /api/content/pois/qr/{qrToken}?lang=vi|en|ja|ko
   */
  getPoiByQr: async (qrToken: string, lang: string = 'vi'): Promise<PoiDetail> => {
    const response = await apiClient.get<PoiDetail>(`/api/content/pois/qr/${encodeURIComponent(qrToken)}`, {
      params: { lang },
    });
    return response.data;
  },

  /**
   * Tìm kiếm các điểm du lịch lân cận theo bán kính GPS (mét)
   * GET /api/location/nearby?lat=...&lng=...&radius=...
   */
  getNearbyPois: async (lat: number, lng: number, radius: number): Promise<NearbyPoi[]> => {
    const response = await apiClient.get<NearbyPoi[]>('/api/location/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  /**
   * Xác định điểm du lịch khớp vùng kích hoạt tại tọa độ hiện tại
   * GET /api/location/resolve?lat=...&lng=...
   */
  resolvePoi: async (lat: number, lng: number): Promise<ResolvePoiResponse> => {
    const response = await apiClient.get<ResolvePoiResponse>('/api/location/resolve', {
      params: { lat, lng },
    });
    return response.data;
  },

  /**
   * Tạo URL hoàn chỉnh để phát tệp âm thanh thuyết minh
   * /api/tts/audio/{fileName}
   */
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

  /**
   * Gửi sự kiện thống kê tương tác du khách (quét QR / phát audio)
   * POST /api/analytics/events
   */
  recordAnalyticsEvent: async (event: CreateAnalyticsEventRequest): Promise<void> => {
    await apiClient.post<void>('/api/analytics/events', event);
  },

  /**
   * Lấy báo cáo thống kê tổng quan (yêu cầu header X-Admin-Key)
   * GET /api/analytics/summary
   */
  getAnalyticsSummary: async (adminKey?: string): Promise<AnalyticsSummaryResponse> => {
    const key = adminKey || import.meta.env.VITE_ADMIN_API_KEY || '';
    const response = await apiClient.get<AnalyticsSummaryResponse>('/api/analytics/summary', {
      headers: key ? { 'X-Admin-Key': key } : undefined,
    });
    return response.data;
  },
};
