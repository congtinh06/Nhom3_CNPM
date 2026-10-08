import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronRight, Star, Check } from 'lucide-react';
import {
  CategoryFilterKey,
  PriceRangeFilter,
  RatingFilter,
  ProductFilterState,
  ProductTypeFilter,
} from '../../types/productFilter';

interface FoodSidebarFilterProps {
  filters: ProductFilterState;
  onChangeFilter: <K extends keyof Omit<ProductFilterState, 'keyword' | 'page'>>(
    key: K,
    value: ProductFilterState[K]
  ) => void;
  onResetFilters: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface SubCategoryItem {
  key: CategoryFilterKey;
  label: string;
}

interface CategoryGroup {
  type: ProductTypeFilter;
  label: string;
  subCategories: SubCategoryItem[];
}

const HIERARCHICAL_CATEGORIES: CategoryGroup[] = [
  {
    type: 'FOOD',
    label: 'Món ăn',
    subCategories: [
      { key: 'mon-an', label: 'Món ăn Sài Gòn' },
      { key: 'mon-an-vat', label: 'Món ăn vặt' },
      { key: 'dac-san', label: 'Đặc sản Sài Gòn' },
    ],
  },
  {
    type: 'DRINK',
    label: 'Đồ uống',
    subCategories: [
      { key: 'ca-phe', label: 'Cà phê' },
      { key: 'tra', label: 'Trà' },
      { key: 'nuoc-giai-khat', label: 'Nước giải khát' },
      { key: 'sinh-to', label: 'Sinh tố' },
    ],
  },
];

export const PRICE_OPTIONS: { key: PriceRangeFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả khoảng giá' },
  { key: 'under-50k', label: 'Dưới 50.000đ' },
  { key: '50k-100k', label: '50.000đ – 100.000đ' },
  { key: '100k-200k', label: '100.000đ – 200.000đ' },
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
}) => {
  // Trạng thái đóng/mở nhánh cây phân cấp (mặc định mở cả 2 nhánh Món ăn & Đồ uống)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    FOOD: true,
    DRINK: true,
  });

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      groupKey: !prev[groupKey],
      [groupKey]: !prev[groupKey],
    }));
  };

  const isFiltered =
    filters.category !== 'all' ||
    filters.productType !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.rating !== 'all' ||
    Boolean(filters.keyword.trim());

  // Chọn "Tất cả"
  const handleSelectAllCategories = () => {
    onChangeFilter('productType', 'all');
    onChangeFilter('category', 'all');
  };

  // Chọn nhánh cha (Món ăn hoặc Đồ uống)
  const handleSelectParentGroup = (type: ProductTypeFilter) => {
    onChangeFilter('productType', type);
    onChangeFilter('category', 'all');
  };

  // Chọn danh mục con (Cà phê, Bánh mì, v.v.)
  const handleSelectSubCategory = (type: ProductTypeFilter, catKey: CategoryFilterKey) => {
    onChangeFilter('productType', type);
    onChangeFilter('category', catKey);
  };

  const filterContent = (
    <div className="editorial-sidebar-card">
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

      {/* 2. Mục 'DANH MỤC' (Gộp LOẠI SẢN PHẨM & DANH MỤC thành cây phân cấp Collapse/Expand) */}
      <div className="editorial-filter-section">
        <div className="section-heading-row">
          <h3 className="section-heading">DANH MỤC</h3>
        </div>

        <div className="category-tree-list" role="tree">
          {/* Lựa chọn: Tất cả */}
          <div className="tree-node-item">
            <button
              type="button"
              className={`tree-select-btn ${
                filters.productType === 'all' && filters.category === 'all' ? 'is-selected' : ''
              }`}
              onClick={handleSelectAllCategories}
            >
              <span className="custom-circle-radio">
                {filters.productType === 'all' && filters.category === 'all' && (
                  <span className="radio-inner-dot" />
                )}
              </span>
              <span className="tree-node-label font-medium">Tất cả sản phẩm</span>
            </button>
          </div>

          {/* Các nhóm Cha & Con */}
          {HIERARCHICAL_CATEGORIES.map((group) => {
            const isGroupExpanded = expandedGroups[group.type] ?? true;
            const isParentSelected =
              filters.productType === group.type && filters.category === 'all';
            const hasChildSelected =
              filters.productType === group.type && filters.category !== 'all';

            return (
              <div key={group.type} className="tree-group-wrap">
                {/* Dòng cha: Nút toggle chevron + Nút chọn nhóm */}
                <div className="tree-parent-row">
                  <button
                    type="button"
                    className="tree-chevron-btn"
                    onClick={() => toggleGroup(group.type)}
                    aria-label={`Mở rộng danh mục ${group.label}`}
                  >
                    {isGroupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  <button
                    type="button"
                    className={`tree-select-btn tree-parent-btn ${
                      isParentSelected || hasChildSelected ? 'is-active-parent' : ''
                    }`}
                    onClick={() => handleSelectParentGroup(group.type)}
                  >
                    <span className="custom-circle-radio">
                      {isParentSelected && <span className="radio-inner-dot" />}
                    </span>
                    <span className="tree-node-label">{group.label}</span>
                  </button>
                </div>

                {/* Danh sách con có lùi đầu dòng (Indented sub-items) */}
                {isGroupExpanded && (
                  <div className="tree-children-list">
                    {group.subCategories.map((sub) => {
                      const isSubSelected =
                        filters.productType === group.type && filters.category === sub.key;

                      return (
                        <button
                          key={sub.key}
                          type="button"
                          className={`tree-select-btn tree-sub-btn ${
                            isSubSelected ? 'is-selected' : ''
                          }`}
                          onClick={() => handleSelectSubCategory(group.type, sub.key)}
                        >
                          <span className="custom-circle-radio">
                            {isSubSelected && <span className="radio-inner-dot" />}
                          </span>
                          <span className="tree-node-label">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
