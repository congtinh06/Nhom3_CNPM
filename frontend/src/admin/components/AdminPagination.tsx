import React from 'react';

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  unitLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  page,
  totalPages,
  totalElements,
  unitLabel,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="adm-pagination">
      <div className="adm-pagination-info">
        Hiển thị trang {page + 1} trên {totalPages} (Tổng cộng{' '}
        {totalElements.toLocaleString('vi-VN')} {unitLabel})
      </div>
      <div className="adm-pagination-actions">
        <button
          type="button"
          className="adm-btn adm-btn-secondary adm-btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0 || disabled}
        >
          &larr; Trang trước
        </button>

        <span className="adm-pagination-current">
          {page + 1} / {totalPages}
        </span>

        <button
          type="button"
          className="adm-btn adm-btn-secondary adm-btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || disabled}
        >
          Trang sau &rarr;
        </button>
      </div>
    </div>
  );
};
