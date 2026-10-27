import type { QrLoginStats } from '../types/qr';

export type QrHealthLevel = 'good' | 'warning' | 'critical' | 'unknown';

export interface QrHealth {
  level: QrHealthLevel;
  label: string;
  score: number;
  reasons: string[];
  diagnosis: string;
}

export interface FunnelRates {
  scanRate: number;
  approvalRate: number;
  successRate: number;
  scanDropRate: number;
  approvalDropRate: number;
}

export interface StatusSlice {
  key: string;
  label: string;
  count: number;
  color: string;
  filter: string;
}

export const LOGIN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ quét',
  SCANNED: 'Đã quét',
  APPROVED: 'Đã xác nhận',
  GUEST_APPROVED: 'Chế độ khách',
  CONSUMED: 'Đăng nhập thành công',
  DENIED: 'Bị từ chối',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã huỷ',
};

export const LOGIN_STATUS_COLORS: Record<string, string> = {
  PENDING: '#94A3B8',
  SCANNED: '#38BDF8',
  APPROVED: '#818CF8',
  GUEST_APPROVED: '#F97316',
  CONSUMED: '#22C55E',
  DENIED: '#EF4444',
  EXPIRED: '#F59E0B',
  CANCELLED: '#A8A29E',
};

export const EXPIRED_UNSCANNED_KEY = 'EXPIRED_UNSCANNED';
export const EXPIRED_SCANNED_KEY = 'EXPIRED_SCANNED';

export function statusLabel(status: string): string {
  if (status === EXPIRED_UNSCANNED_KEY) return 'Hết hạn trước khi quét';
  if (status === EXPIRED_SCANNED_KEY) return 'Đã quét, chưa xác nhận';
  return LOGIN_STATUS_LABELS[status] ?? status;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function percent(numerator: number, denominator: number): number {
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return round1((numerator * 100) / denominator);
}

export function funnelRates(totals?: Partial<QrLoginStats['totals']> | null): FunnelRates {
  const created = totals?.created ?? 0;
  const scanned = totals?.scanned ?? 0;
  const approved = totals?.approved ?? 0;
  const consumed = totals?.consumed ?? 0;

  return {
    scanRate: percent(scanned, created),
    approvalRate: percent(approved, scanned),
    successRate: percent(consumed, created),
    scanDropRate: percent(Math.max(0, scanned - approved), scanned),
    approvalDropRate: percent(Math.max(0, approved - consumed), approved),
  };
}

export function computeQrHealth(stats: QrLoginStats | null | undefined): QrHealth {
  const created = stats?.totals?.created ?? 0;
  if (!stats || created === 0) {
    return {
      level: 'unknown',
      label: 'Chưa đủ dữ liệu',
      score: 0,
      reasons: [],
      diagnosis:
        'Chưa có phiên QR đăng nhập trong khoảng thời gian này. Hãy thử tạo mã trên trang đăng nhập để kiểm tra luồng.',
    };
  }

  if (created < 5) {
    return {
      level: 'unknown',
      label: 'Chưa đủ dữ liệu',
      score: Math.round(percent(stats.totals.consumed, created)),
      reasons: [],
      diagnosis: `Mới có ${formatNumber(
        created
      )} phiên QR. Cần thêm dữ liệu để đánh giá chính xác sức khoẻ luồng đăng nhập.`,
    };
  }

  const rates = funnelRates(stats.totals);
  const expiredRate = stats.rates?.expiredRate ?? percent(stats.totals.expired, created);
  const expiredUnscannedRate =
    stats.rates?.expiredUnscannedRate ?? percent(stats.totals.expiredUnscanned ?? 0, created);
  const expiredScannedRate =
    stats.rates?.expiredScannedRate ?? percent(stats.totals.expiredScanned ?? 0, created);

  const reasons: string[] = [];
  if (rates.successRate < 40) {
    reasons.push(`Tỷ lệ đăng nhập thành công chỉ ${formatPercent(rates.successRate)}.`);
  }
  if (expiredRate >= 20) {
    reasons.push(`${formatPercent(expiredRate)} phiên QR bị hết hạn.`);
  }
  if (expiredUnscannedRate >= 10) {
    reasons.push(`${formatPercent(expiredUnscannedRate)} phiên hết hạn trước khi được quét.`);
  }
  if (expiredScannedRate >= 10) {
    reasons.push(
      `${formatPercent(expiredScannedRate)} phiên đã quét nhưng chưa kịp xác nhận trước khi hết hạn.`
    );
  }
  if (rates.scanRate < 50) {
    reasons.push(`Chỉ ${formatPercent(rates.scanRate)} mã QR được quét.`);
  }

  let level: QrHealthLevel = 'good';
  if (rates.successRate < 40 || expiredRate >= 40) {
    level = 'critical';
  } else if (
    rates.successRate < 70 ||
    expiredRate >= 20 ||
    expiredUnscannedRate >= 10 ||
    expiredScannedRate >= 10
  ) {
    level = 'warning';
  }

  const label =
    level === 'critical' ? 'Cần xử lý ngay' : level === 'warning' ? 'Cần theo dõi' : 'Ổn định';

  return {
    level,
    label,
    score: Math.round(rates.successRate),
    reasons,
    diagnosis: buildDiagnosis(level, stats.totals, rates, expiredUnscannedRate, expiredScannedRate),
  };
}

function buildDiagnosis(
  level: QrHealthLevel,
  totals: QrLoginStats['totals'],
  rates: FunnelRates,
  expiredUnscannedRate: number,
  expiredScannedRate: number
): string {
  if (level === 'good') {
    return `Luồng QR ổn định: ${formatPercent(rates.successRate)} phiên hoàn tất đăng nhập. Tiếp tục theo dõi tỷ lệ hết hạn và thời gian xác nhận.`;
  }

  if (expiredScannedRate >= expiredUnscannedRate && (totals.expiredScanned ?? 0) > 0) {
    return `Điểm nghẽn nằm ở bước xác nhận: ${formatNumber(totals.expiredScanned ?? 0)} phiên đã quét nhưng hết hạn trước khi xác nhận. Kiểm tra thời gian sống của mã và tốc độ thao tác trên thiết bị di động.`;
  }

  if ((totals.expiredUnscanned ?? 0) > 0) {
    return `Điểm nghẽn nằm ở bước quét: ${formatNumber(totals.expiredUnscanned ?? 0)} phiên hết hạn khi chưa có thiết bị nào quét. Kiểm tra khả năng hiển thị mã, camera và hướng dẫn quét.`;
  }

  if (rates.approvalDropRate > 40) {
    return `${formatPercent(rates.approvalDropRate)} phiên đã quét nhưng không được xác nhận. Kiểm tra thao tác xác nhận trên thiết bị di động và trạng thái tài khoản.`;
  }

  return `Chỉ ${formatPercent(rates.successRate)} phiên QR hoàn tất đăng nhập trên ${formatNumber(
    totals.created
  )} phiên tạo mã. Ưu tiên kiểm tra các phiên bị từ chối và hết hạn.`;
}

export function deltaPercent(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous <= 0) return null;
  return round1(((current - previous) * 100) / previous);
}

export function formatDelta(value: number | null): string {
  if (value == null) return '';
  const arrow = value >= 0 ? '▲' : '▼';
  return `${arrow} ${formatPercent(Math.abs(value))}`;
}

export function splitExpiredSlices(
  breakdown: Array<{ status: string; count: number }> | undefined,
  totals?: Partial<QrLoginStats['totals']> | null
): StatusSlice[] {
  const slices: StatusSlice[] = [];
  (breakdown ?? []).forEach((item) => {
    if (item.count <= 0) return;
    if (item.status === 'EXPIRED') {
      const unscanned = totals?.expiredUnscanned ?? 0;
      const scanned = totals?.expiredScanned ?? 0;
      const recorded = unscanned + scanned;
      if (recorded === 0) {
        slices.push({
          key: 'EXPIRED',
          label: statusLabel('EXPIRED'),
          count: item.count,
          color: LOGIN_STATUS_COLORS.EXPIRED ?? '#F59E0B',
          filter: 'EXPIRED',
        });
        return;
      }
      if (unscanned > 0) {
        slices.push({
          key: EXPIRED_UNSCANNED_KEY,
          label: statusLabel(EXPIRED_UNSCANNED_KEY),
          count: unscanned,
          color: '#F59E0B',
          filter: 'EXPIRED',
        });
      }
      if (scanned > 0) {
        slices.push({
          key: EXPIRED_SCANNED_KEY,
          label: statusLabel(EXPIRED_SCANNED_KEY),
          count: scanned,
          color: '#D97706',
          filter: 'EXPIRED',
        });
      }
      return;
    }
    slices.push({
      key: item.status,
      label: statusLabel(item.status),
      count: item.count,
      color: LOGIN_STATUS_COLORS[item.status] ?? '#94A3B8',
      filter: item.status,
    });
  });
  return slices;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

export function formatPercent(value: number): string {
  return `${round1(value).toFixed(1)}%`;
}

export function maskIp(value: string | null | undefined): string {
  if (!value) return '-';
  const trimmed = value.trim();
  if (trimmed.includes('xxx') || trimmed.includes('*')) return trimmed;
  if (trimmed.includes(':')) {
    const groups = trimmed.split(':');
    return groups.length >= 2 ? `${groups[0]}:${groups[1]}:xxxx:xxxx:xxxx:xxxx` : 'xxxx:xxxx';
  }
  const parts = trimmed.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return 'xxx.xxx.xxx.xxx';
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(value: number | null | undefined): string {
  if (value == null || value <= 0) return '-';
  const rounded = Math.round(value);
  if (rounded < 60) return `${rounded} giây`;
  return `${Math.floor(rounded / 60)} phút ${rounded % 60} giây`;
}
