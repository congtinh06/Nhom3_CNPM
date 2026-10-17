import React from 'react';

export interface AdminAlertProps {
  variant: 'success' | 'danger';
  message: string;
  onClose?: () => void;
  className?: string;
}

export const AdminAlert: React.FC<AdminAlertProps> = ({
  variant,
  message,
  onClose,
  className = '',
}) => {
  const isDanger = variant === 'danger';
  const classes = `adm-alert adm-alert-${variant} ${className}`.trim();

  return (
    <div className={classes} role={isDanger ? 'alert' : 'status'}>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          className="adm-alert-close"
          onClick={onClose}
          aria-label={isDanger ? 'Đóng lỗi' : 'Đóng thông báo'}
        >
          &times;
        </button>
      )}
    </div>
  );
};
