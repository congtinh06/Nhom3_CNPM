import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  // Tính toán phạm vi hiển thị mẫu: "Hiển thị [start]–[end] của [total] sản phẩm"
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Cuộn trang mượt mà lên đầu khu vực danh mục (không cuộn lên tận Hero)
  const handlePageClick = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    const catalogAnchor = document.getElementById('shop-catalog-anchor');
    if (catalogAnchor) {
      catalogAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Thuật toán hiển thị các trang với dấu chấm lửng (Ellipsis) khi totalPages > 7
  const renderPageNumbers = () => {
    type PageItem = number | 'ellipsis-start' | 'ellipsis-end';
    let pages: PageItem[] = [];

    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 4) {
        pages = [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
      } else if (currentPage >= totalPages - 3) {
        pages = [
          1,
          'ellipsis-start',
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      } else {
        pages = [
          1,
          'ellipsis-start',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          'ellipsis-end',
          totalPages,
        ];
      }
    }

    return pages.map((item) => {
      if (typeof item === 'string') {
        return (
          <span
            key={item}
            className="editorial-ellipsis-span"
            aria-hidden="true"
          >
            &#8230;
          </span>
        );
      }

      const isActive = item === currentPage;
      return (
        <button
          key={item}
          type="button"
          onClick={() => handlePageClick(item)}
          className={`editorial-page-btn ${isActive ? 'is-active' : ''}`}
          aria-label={`Trang ${item}`}
          aria-current={isActive ? 'page' : undefined}
        >
          {item}
        </button>
      );
    });
  };

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <nav
      className="editorial-pagination-container"
      aria-label="Điều hướng phân trang sản phẩm"
    >
      {/* 1. Bên trái: Nhãn bối cảnh (Context Label) */}
      <div className="pagination-context-label">
        Hiển thị{' '}
        <span className="font-semibold text-primary">{startItem}</span>–
        <span className="font-semibold text-primary">{endItem}</span> của{' '}
        <span className="font-semibold text-primary">{totalItems}</span> sản phẩm
      </div>

      {/* 2. Bên phải: Cụm nút chuyển trang độc lập, không bọc khung xám */}
      <div className="pagination-controls-row">
        {/* Nút Trước (Previous) */}
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={() => handlePageClick(currentPage - 1)}
          className="editorial-nav-btn"
          aria-label="Trang trước"
          aria-disabled={isPrevDisabled}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="nav-btn-text">Trước</span>
        </button>

        {/* Danh sách nút số trang & Dấu chấm lửng */}
        <div className="pagination-numbers-group">
          {renderPageNumbers()}
        </div>

        {/* Nút Sau (Next) */}
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => handlePageClick(currentPage + 1)}
          className="editorial-nav-btn"
          aria-label="Trang sau"
          aria-disabled={isNextDisabled}
        >
          <span className="nav-btn-text">Sau</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
