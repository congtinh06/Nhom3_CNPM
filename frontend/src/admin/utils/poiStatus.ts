import { StatusBadgeVariant } from '../components/StatusBadge';

/**
 * Tên trạng thái điểm thuyết minh — nguồn duy nhất dùng cho bảng danh sách,
 * trang sửa, bộ lọc, tooltip và aria-label để không lệch chữ.
 */
export const POI_STATUS_LABEL = {
  ACTIVE: 'Hoạt động',
  NEEDS_ATTENTION: 'Cần xử lý',
  HIDDEN: 'Đã ẩn',
} as const;

export type PoiOverallStatusKey = keyof typeof POI_STATUS_LABEL;

export const POI_STATUS_ALL_LABEL = 'Tất cả trạng thái';

export interface OverallStatusConfig {
  label: string;
  variant: StatusBadgeVariant;
}

export const OVERALL_STATUS_CONFIG: Record<PoiOverallStatusKey, OverallStatusConfig> = {
  ACTIVE: { label: POI_STATUS_LABEL.ACTIVE, variant: 'neutral' },
  NEEDS_ATTENTION: { label: POI_STATUS_LABEL.NEEDS_ATTENTION, variant: 'warning' },
  HIDDEN: { label: POI_STATUS_LABEL.HIDDEN, variant: 'muted' },
};

export const DEFAULT_OVERALL_STATUS: OverallStatusConfig = OVERALL_STATUS_CONFIG.ACTIVE;

export function resolveOverallStatus(status?: string | null): OverallStatusConfig {
  const key = (status || 'ACTIVE').toUpperCase() as PoiOverallStatusKey;
  return OVERALL_STATUS_CONFIG[key] || DEFAULT_OVERALL_STATUS;
}

export function isNeedsAttention(status?: string | null): boolean {
  return (status || '').toUpperCase() === 'NEEDS_ATTENTION';
}
