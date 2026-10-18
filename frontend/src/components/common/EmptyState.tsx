import React from 'react';
import { RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  keyword?: string;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ keyword, onClearFilters }) => {
  return (
    <div className="editorial-empty-state-wrapper" role="status">
      {/* Minimalist Line-Art SVG of a traditional Vietnamese food bowl */}
      <div className="empty-state-illustration-box">
        <svg
          className="empty-bowl-svg"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Làn khói tỏa lên nhẹ nhàng */}
          <path
            d="M50 25C48 20 53 14 50 8"
            stroke="#C2410C"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M60 27C58 21 63 15 60 7"
            stroke="#C2410C"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M70 25C68 20 73 14 70 8"
            stroke="#C2410C"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Đôi đũa đặt chéo thanh lịch */}
          <line
            x1="32"
            y1="34"
            x2="94"
            y2="34"
            stroke="#78350F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="30"
            y1="38"
            x2="90"
            y2="38"
            stroke="#78350F"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Thân chiếc tô sứ tròn */}
          <path
            d="M24 42C24 42 27 82 60 82C93 82 96 42 96 42"
            stroke="#1C1917"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Họa tiết viền miệng tô */}
          <ellipse
            cx="60"
            cy="42"
            rx="36"
            ry="7"
            stroke="#1C1917"
            strokeWidth="3"
          />

          {/* Chân đế của tô */}
          <path
            d="M48 82L45 92H75L72 82"
            stroke="#1C1917"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Họa tiết chấm hạt mè trang trí */}
          <circle cx="54" cy="56" r="1.5" fill="#C2410C" />
          <circle cx="66" cy="58" r="1.5" fill="#C2410C" />
          <circle cx="60" cy="65" r="1.5" fill="#C2410C" />
        </svg>
      </div>

      {/* Tiêu đề: Playfair Display, text-2xl */}
      <h3 className="empty-state-title">
        {keyword && keyword.trim()
          ? `Chưa tìm thấy quà nào cho "${keyword.trim()}"`
          : 'Chưa tìm thấy quà nào'}
      </h3>

      {/* Phụ đề: text-secondary */}
      <p className="empty-state-subtitle">
        Thử lại với từ khóa khác hoặc xóa bộ lọc để khám phá các món quà khác.
      </p>

      {/* Nút hành động: Solid accent bg, white text, rounded-md, px-6 py-3 */}
      <button
        type="button"
        className="empty-state-action-btn"
        onClick={onClearFilters}
        aria-label="Xóa bộ lọc tìm kiếm"
      >
        <RotateCcw size={16} strokeWidth={2} />
        <span>Xóa bộ lọc</span>
      </button>
    </div>
  );
};
