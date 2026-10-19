import React from 'react';

export interface AdminToolbarProps {
  children?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshLabel?: string;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  children,
  onRefresh,
  refreshing = false,
  refreshLabel = 'Làm mới',
}) => {
  return (
    <div className="adm-toolbar">
      <div className="adm-toolbar-left">{children}</div>
      {onRefresh && (
        <div className="adm-toolbar-right">
          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={onRefresh}
            disabled={refreshing}
            title="Tải lại danh sách"
          >
            {refreshing ? 'Đang tải...' : refreshLabel}
          </button>
        </div>
      )}
    </div>
  );
};
