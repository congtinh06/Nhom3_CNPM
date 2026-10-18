import React from 'react';
import { Filter, X, Star, Check } from 'lucide-react';
import {
  PriceRangeFilter,
  RatingFilter,
  ProductFilterState,
} from '../../types/productFilter';
import { SupportedLanguage } from '../../types';
import { SOUVENIR_SPOTS, getSpotName } from '../../content/souvenirSpots';

interface FoodSidebarFilterProps {
  filters: ProductFilterState;
  onChangeFilter: <K extends keyof Omit<ProductFilterState, 'keyword' | 'page'>>(
    key: K,
    value: ProductFilterState[K]
  ) => void;
  onResetFilters: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  lang: SupportedLanguage;
}

export const PRICE_OPTIONS: { key: PriceRangeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả khoảng giá' },
  { key: 'under-50k', label: 'Dưới 50.000đ' },
  { key: '50k-100k', label: '50.000đ - 100.000đ' },
  { key: '100k-200k', label: '100.000đ - 200.000đ' },
  { key: 'above-200k', label: 'Trên 200.000đ' },
];

export const RATING_OPTIONS: { key: RatingFilter; label: string; stars: number }[] = [
  { key: 'all', label: 'Tất cả đánh giá', stars: 0 },
  { key: '5', label: '5 sao tuyệt đối', stars: 5 },
  { key: '4', label: 'Từ 4 sao trở lên', stars: 4 },
  { key: '3', label: 'Từ 3 sao trở lên', stars: 3 },
];

export const FoodSidebarFilter: React.FC<FoodSidebarFilterProps> = ({
  filters,
  onChangeFilter,
  onResetFilters,
  isOpenMobile,
  onCloseMobile,
  lang,
}) => {
  const isFiltered =
    filters.spot !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.rating !== 'all' ||
    Boolean(filters.keyword.trim());

  const filterContent = (
    <div className="editorial-sidebar-card" data-lenis-prevent>
      {/* 1. Header: Tiêu đề + Nút 'Xóa bộ lọc' link-style bên phải có icon X */}
      <div className="editorial-sidebar-header">
        <div className="header-title-box">
          <Filter size={15} className="header-filter-icon" aria-hidden="true" />
          <h2 className="header-title">BỘ LỌC TÌM KIẾM</h2>
        </div>
        {isFiltered && (
          <button
            type="button"
            className="sidebar-clear-link"
            onClick={onResetFilters}
            aria-label="Xóa tất cả bộ lọc"
          >
            <span>Xóa bộ lọc</span>
            <X size={14} />
          </button>
        )}
      </div>

      {/* 2. Mục 'ĐIỂM DU LỊCH' (Thay thế cây danh mục cũ bằng bộ lọc 7 điểm đến) */}
      <div className="editorial-filter-section">
        <div className="section-heading-row">
          <h3 className="section-heading">ĐIỂM DU LỊCH</h3>
        </div>

        <div className="category-tree-list" role="radiogroup" aria-label="Lọc theo điểm du lịch">
          <div className="tree-node-item">
            <button
              type="button"
              role="radio"
              aria-checked={filters.spot === 'all'}
              className={`tree-select-btn ${filters.spot === 'all' ? 'is-selected' : ''}`}
              onClick={() => onChangeFilter('spot', 'all')}
            >
              <span className="custom-circle-radio">
                {filters.spot === 'all' && <span className="radio-inner-dot" />}
              </span>
              <span className="tree-node-label font-medium">Tất cả điểm đến</span>
            </button>
          </div>

          {SOUVENIR_SPOTS.map((spot) => {
            const isSelected = filters.spot === spot.slug;
            return (
              <div key={spot.slug} className="tree-node-item">
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`tree-select-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onChangeFilter('spot', spot.slug)}
                >
                  <span className="custom-circle-radio">
                    {isSelected && <span className="radio-inner-dot" />}
                  </span>
                  <span className="tree-node-label">{getSpotName(spot.slug, lang)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Mục 'KHOẢNG GIÁ' */}
      <div className="editorial-filter-section">
        <div className="section-heading-row">
          <h3 className="section-heading">KHOẢNG GIÁ</h3>
        </div>

        <div className="radio-options-list">
          {PRICE_OPTIONS.map((opt) => {
            const isChecked = filters.priceRange === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                className={`editorial-radio-row ${isChecked ? 'is-checked' : ''}`}
                onClick={() => onChangeFilter('priceRange', opt.key)}
              >
                <span className="custom-circle-radio">
                  {isChecked && <span className="radio-inner-dot" />}
                </span>
                <span className="radio-label-text">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Mục 'ĐÁNH GIÁ SAO' */}
      <div className="editorial-filter-section">
        <div className="section-heading-row">
          <h3 className="section-heading">ĐÁNH GIÁ SAO</h3>
        </div>

        <div className="radio-options-list">
          {RATING_OPTIONS.map((opt) => {
            const isChecked = filters.rating === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                className={`editorial-radio-row ${isChecked ? 'is-checked' : ''}`}
                onClick={() => onChangeFilter('rating', opt.key)}
              >
                <span className="custom-circle-radio">
                  {isChecked && <span className="radio-inner-dot" />}
                </span>
                <div className="stars-and-label">
                  {opt.stars > 0 ? (
                    <>
                      <div className="stars-cluster">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < opt.stars ? 'star-gold-fill' : 'star-dim'}
                          />
                        ))}
                      </div>
                      <span className="radio-label-text">{opt.label}</span>
                    </>
                  ) : (
                    <span className="radio-label-text">{opt.label}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (position: sticky, top: 100px, max-height: calc(100vh - 120px)) */}
      <aside className="editorial-desktop-sidebar" aria-label="Bộ lọc tìm kiếm">
        {filterContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div
          className="editorial-mobile-drawer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc trên thiết bị di động"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseMobile();
          }}
        >
          <div className="editorial-mobile-drawer">
            <div className="drawer-header-row">
              <div className="drawer-title">
                <Filter size={16} />
                <span>Bộ lọc tìm kiếm</span>
              </div>
              <button
                type="button"
                className="drawer-close-icon-btn"
                onClick={onCloseMobile}
                aria-label="Đóng bộ lọc"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-scroll-body">{filterContent}</div>

            <div className="drawer-action-footer">
              <button
                type="button"
                className="drawer-submit-btn"
                onClick={onCloseMobile}
              >
                <Check size={16} />
                <span>Xem kết quả</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
