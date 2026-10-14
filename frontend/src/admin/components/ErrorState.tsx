import React from 'react';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  title = 'Không thể tải dữ liệu',
}) => {
  return (
    <div className="adm-error-state" role="alert">
      <div className="adm-error-icon" aria-hidden="true">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="adm-error-content">
        <h4 className="adm-error-title">{title}</h4>
        <p className="adm-error-desc">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="adm-btn adm-btn-secondary adm-error-btn"
          onClick={onRetry}
        >
          Thử lại
        </button>
      )}
    </div>
  );
};
