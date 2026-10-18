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

/* --------------------------------------------------------------------------
   Bộ lọc trạng thái & ngôn ngữ trên trang danh sách
   -------------------------------------------------------------------------- */

export type PoiStatusFilterValue = '' | PoiOverallStatusKey;

export const POI_STATUS_FILTER_OPTIONS: { value: PoiStatusFilterValue; label: string }[] = [
  { value: '', label: POI_STATUS_ALL_LABEL },
  { value: 'ACTIVE', label: POI_STATUS_LABEL.ACTIVE },
  { value: 'NEEDS_ATTENTION', label: POI_STATUS_LABEL.NEEDS_ATTENTION },
  { value: 'HIDDEN', label: POI_STATUS_LABEL.HIDDEN },
];

export type PoiLanguageFilterValue = '' | 'ERROR' | 'PENDING';

export const POI_LANGUAGE_ALL_LABEL = 'Tất cả ngôn ngữ';

export const POI_LANGUAGE_FILTER_OPTIONS: {
  value: PoiLanguageFilterValue;
  label: string;
}[] = [
  { value: '', label: POI_LANGUAGE_ALL_LABEL },
  { value: 'ERROR', label: 'Có lỗi' },
  { value: 'PENDING', label: 'Có chờ xử lý' },
];

interface LanguageSummaryLike {
  total?: number;
  ready?: number;
  pending?: number;
  failed?: number;
}

interface LanguageLike {
  audioStatus?: string | null;
}

function isFailedAudioStatus(status?: string | null): boolean {
  const norm = (status || '').toUpperCase();
  return norm === 'FAILED' || norm === 'FAILED_TTS' || norm === 'FAILED_TRANSLATION';
}

function isPendingAudioStatus(status?: string | null): boolean {
  const norm = (status || '').toUpperCase();
  return norm === 'PENDING' || norm === 'PROCESSING';
}

export function hasLanguageError(
  summary?: LanguageSummaryLike,
  languages?: LanguageLike[]
): boolean {
  if (summary && typeof summary.failed === 'number' && summary.failed > 0) return true;
  return (languages ?? []).some((lang) => isFailedAudioStatus(lang.audioStatus));
}

export function hasLanguagePending(
  summary?: LanguageSummaryLike,
  languages?: LanguageLike[]
): boolean {
  if (summary && typeof summary.pending === 'number' && summary.pending > 0) return true;
  return (languages ?? []).some((lang) => isPendingAudioStatus(lang.audioStatus));
}
