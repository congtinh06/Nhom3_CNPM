import React from 'react';
import { Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import '../../styles/statusBadge.css';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'normal' | 'large';
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  containerClass: string;
}

export function getStatusConfig(status: string): StatusConfig {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'PENDING_PAYMENT':
    case 'PENDING':
    case 'CHỜ THANH TOÁN':
    case 'CHO THANH TOAN':
      return {
        label: 'Chờ thanh toán',
        icon: <Clock size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-pending',
      };

    case 'CHỜ XÁC NHẬN':
    case 'CHO XAC NHAN':
      return {
        label: 'Chờ xác nhận',
        icon: <Clock size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-pending',
      };

    case 'PAID':
    case 'ĐÃ THANH TOÁN':
    case 'DA THANH TOAN':
      return {
        label: 'Đã thanh toán',
        icon: <CheckCircle size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-paid',
      };

    case 'PROCESSING':
    case 'ĐANG XỬ LÝ':
    case 'DANG XU LY':
      return {
        label: 'Đang xử lý',
        icon: <Truck size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-processing',
      };

    case 'SHIPPING':
    case 'DELIVERING':
    case 'ĐANG GIAO':
    case 'DANG GIAO':
      return {
        label: 'Đang giao',
        icon: <Truck size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-shipping',
      };

    case 'COMPLETED':
    case 'DELIVERED':
    case 'HOÀN THÀNH':
    case 'HOAN THANH':
    case 'ĐÃ GIAO':
    case 'DA GIAO':
      return {
        label: 'Hoàn thành',
        icon: <CheckCircle size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-completed',
      };

    case 'CANCELLED':
    case 'FAILED':
    case 'ĐÃ HỦY':
    case 'DA HUY':
      return {
        label: 'Đã hủy',
        icon: <XCircle size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-cancelled',
      };

    default:
      return {
        label: status || 'Không rõ',
        icon: <Clock size={13} strokeWidth={2} aria-hidden="true" />,
        containerClass: 'badge-pending',
      };
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'normal',
}) => {
  const config = getStatusConfig(status);

  return (
    <span
      className={`status-badge ${config.containerClass} ${
        size === 'large' ? 'large' : ''
      } ${className}`.trim()}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
