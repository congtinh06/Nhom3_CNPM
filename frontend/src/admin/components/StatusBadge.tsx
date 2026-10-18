import React from 'react';

export type StatusBadgeVariant = 'neutral' | 'warning' | 'danger' | 'muted';

export interface StatusBadgeProps {
  status?: string;
  variant?: StatusBadgeVariant;
  children?: React.ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
}

interface BadgeConfig {
  label: string;
  variant: StatusBadgeVariant;
}

function resolveStatus(status: string): BadgeConfig {
  const norm = (status || '').toUpperCase().trim();
  switch (norm) {
    case 'COMPLETED':
    case 'HOÀN TẤT':
      return { label: 'Hoàn tất', variant: 'neutral' };

    case 'ACTIVE':
    case 'HOẠT ĐỘNG':
      return { label: 'Hoạt động', variant: 'neutral' };

    case 'PAID':
    case 'ĐÃ THANH TOÁN':
      return { label: 'Đã thanh toán', variant: 'neutral' };

    case 'READY':
      return { label: 'Sẵn sàng', variant: 'neutral' };

    case 'PUBLISHED':
      return { label: 'Đã phát', variant: 'neutral' };

    case 'PROCESSING':
    case 'ĐANG XỬ LÝ':
      return { label: 'Đang xử lý', variant: 'warning' };

    case 'PENDING':
    case 'CHỜ XỬ LÝ':
    case 'PENDING_PAYMENT':
      return { label: 'Chờ xử lý', variant: 'warning' };

    case 'FAILED_TTS':
      return { label: 'Lỗi tổng hợp', variant: 'danger' };

    case 'FAILED':
    case 'THẤT BẠI':
      return { label: 'Thất bại', variant: 'danger' };

    case 'CANCELLED':
    case 'ĐÃ HỦY':
      return { label: 'Đã hủy', variant: 'danger' };

    case 'BLOCKED':
    case 'ĐÃ KHÓA':
      return { label: 'Đã khóa', variant: 'danger' };

    case 'INACTIVE':
    case 'TẠM NGƯNG':
      return { label: 'Tạm ngưng', variant: 'muted' };

    case 'TẠM KHÓA':
      return { label: 'Tạm khóa', variant: 'muted' };

    default:
      return { label: status || 'Không rõ', variant: 'neutral' };
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  children,
  className = '',
  title,
  'aria-label': ariaLabel,
}) => {
  const resolved = status != null ? resolveStatus(status) : undefined;
  const finalVariant = variant ?? resolved?.variant ?? 'neutral';
  const content = children ?? resolved?.label ?? '';

  return (
    <span
      className={`adm-badge adm-badge-${finalVariant} ${className}`.trim()}
      title={title}
      aria-label={ariaLabel}
    >
      {content}
    </span>
  );
};
