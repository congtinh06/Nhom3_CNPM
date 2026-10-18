import { StatusBadgeVariant } from '../components/StatusBadge';

export interface OverallStatusConfig {
  label: string;
  variant: StatusBadgeVariant;
}

export const OVERALL_STATUS_CONFIG: Record<string, OverallStatusConfig> = {
  ACTIVE: { label: 'Đang hoạt động', variant: 'neutral' },
  NEEDS_ATTENTION: { label: 'Cần chú ý', variant: 'warning' },
  HIDDEN: { label: 'Đã ẩn', variant: 'muted' },
};

export const DEFAULT_OVERALL_STATUS: OverallStatusConfig = {
  label: 'Đang hoạt động',
  variant: 'neutral',
};

export function resolveOverallStatus(status?: string | null): OverallStatusConfig {
  const key = (status || 'ACTIVE').toUpperCase();
  return OVERALL_STATUS_CONFIG[key] || DEFAULT_OVERALL_STATUS;
}
