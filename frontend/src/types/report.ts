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
