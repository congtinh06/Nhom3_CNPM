export type ReportChannel = 'WEB' | 'SMS';

export type ReportStatus = 'PENDING' | 'VERIFIED' | 'NOTIFIED' | 'FAILED';

export interface Report {
  id: number;
  targetUrl: string;
  channel: ReportChannel;
  reporterContact: string;
  description?: string;
  isPhishing?: boolean | null;
  riskScore?: number | null;
  status: ReportStatus;
  createdAt: string;
}

export interface CreateReportPayload {
  targetUrl: string;
  channel: ReportChannel;
  reporterContact: string;
  description?: string;
}

export interface VerifyUrlResponse {
  url: string;
  domain: string;
  isPhishing: boolean;
  riskScore: number;
  sources: string[];
  checkedAt: string;
}

export interface NotificationLogItem {
  id: number;
  reportId: number;
  channel: 'EMAIL' | 'SMS' | string;
  recipient: string;
  status: 'SENT' | 'FAILED' | string;
  sentAt: string;
  errorMessage?: string | null;
}

export interface StatsData {
  totalScans: number;
  phishingDetected: number;
  phishingPercentage: string;
  safeLinks: number;
  webScans: number;
  smsScans: number;
  webSafe: number;
  webPhishing: number;
  smsSafe: number;
  smsPhishing: number;
}

export interface DailyStats {
  todayScans: number;
  phishingDetected: number;
  avgResponseTimeMs: number;
}

export interface ReportFilterParams {
  channel?: string;
  verdict?: string;
  url?: string;
}

export * from './poi';


