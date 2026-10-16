import React from 'react';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

interface BadgeConfig {
  label: string;
  cssClass: string;
}

function resolveStatus(status: string): BadgeConfig {
  const norm = (status || '').toUpperCase().trim();
  switch (norm) {
    case 'COMPLETED':
    case 'HOÀN TẤT':
    case 'ACTIVE':
    case 'HOẠT ĐỘNG':
    case 'PAID':
    case 'ĐÃ THANH TOÁN':
      return {
        label: norm === 'ACTIVE' ? 'Hoạt động' : norm === 'PAID' ? 'Đã thanh toán' : 'Hoàn tất',
        cssClass: 'adm-badge-success',
      };

    case 'READY':
      return {
        label: 'Sẵn sàng',
        cssClass: 'adm-badge-success',
      };

    case 'PUBLISHED':
      return {
        label: 'Đã phát',
        cssClass: 'adm-badge-success',
      };

    case 'FAILED_TTS':
      return {
        label: 'Lỗi tổng hợp',
        cssClass: 'adm-badge-danger',
      };

    case 'PROCESSING':
    case 'ĐANG XỬ LÝ':
      return {
        label: 'Đang xử lý',
        cssClass: 'adm-badge-processing',
      };

    case 'PENDING':
    case 'CHỜ XỬ LÝ':
    case 'PENDING_PAYMENT':
      return {
        label: 'Chờ xử lý',
        cssClass: 'adm-badge-pending',
      };

    case 'FAILED':
    case 'THẤT BẠI':
    case 'CANCELLED':
    case 'ĐÃ HỦY':
    case 'INACTIVE':
    case 'TẠM KHÓA':
    case 'BLOCKED':
    case 'ĐÃ KHÓA':
      return {
        label:
          norm === 'INACTIVE'
            ? 'Tạm ngưng'
            : norm === 'CANCELLED'
            ? 'Đã hủy'
            : norm === 'BLOCKED' || norm === 'ĐÃ KHÓA'
            ? 'Đã khóa'
            : 'Thất bại',
        cssClass: 'adm-badge-danger',
      };

    default:
      return {
        label: status || 'Không rõ',
        cssClass: 'adm-badge-neutral',
      };
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = resolveStatus(status);

  return (
    <span className={`adm-badge ${config.cssClass} ${className}`}>
      <span className="adm-badge-dot" aria-hidden="true" />
      {config.label}
    </span>
  );
};
