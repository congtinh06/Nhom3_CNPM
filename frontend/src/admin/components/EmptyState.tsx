import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="adm-empty-state" role="status">
      <div className="adm-empty-icon" aria-hidden="true">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="11" y2="17" />
        </svg>
      </div>
      <h4 className="adm-empty-title">{title}</h4>
      {description && <p className="adm-empty-desc">{description}</p>}
      {actionText && onAction && (
        <button
          type="button"
          className="adm-btn adm-btn-secondary adm-empty-btn"
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
