export interface QrStatsRangeInfo {
  from: string;
  to: string;
  bucket: 'day' | 'hour';
}

export interface QrLoginStats {
  range: QrStatsRangeInfo;
  totals: {
    created: number;
    scanned: number;
    approved: number;
    consumed: number;
    denied: number;
    expired: number;
    cancelled: number;
    pending: number;
    active: number;
    distinctUsers: number;
  };
  rates: {
    scanRate: number;
    approvalRate: number;
    successRate: number;
    expiredRate: number;
  };
  durations: {
    averageScanSeconds: number;
    averageApproveSeconds: number;
    averageLoginSeconds: number;
  };
  series: Array<{
    bucket: string;
    created: number;
    scanned: number;
    approved: number;
    consumed: number;
  }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  devices: Array<{ name: string; count: number }>;
  topUsers: Array<{ userId: number; fullName: string | null; email: string | null; count: number }>;
}

export interface QrLoginSessionItem {
  id: string;
  status: string;
  user: { id: number; fullName: string; email: string } | null;
  deviceLabel: string;
  createdIp: string | null;
  approvedIp: string | null;
  createdAt: string;
  expiresAt: string;
  scannedAt: string | null;
  approvedAt: string | null;
  consumedAt: string | null;
  scanSeconds: number | null;
  totalSeconds: number | null;
}

export interface QrLoginSessionPage {
  content: QrLoginSessionItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface QrAudioStats {
  range: QrStatsRangeInfo;
  totals: {
    scans: number;
    audioPlays: number;
    audioCompleted: number;
    uniqueSessions: number;
  };
  rates: {
    scanToPlayRate: number;
    completionRate: number;
  };
  series: Array<{
    bucket: string;
    scans: number;
    plays: number;
    completed: number;
  }>;
  triggers: Array<{ key: string; count: number }>;
  languages: Array<{ key: string; count: number }>;
  topPois: Array<{
    poiId: number;
    name: string | null;
    scans: number;
    plays: number;
    completed: number;
    scanToPlayRate: number;
    completionRate: number;
  }>;
}
