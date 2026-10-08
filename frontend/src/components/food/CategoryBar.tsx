import React from 'react';

export type CategoryFilterKey =
  | 'all'
  | 'mon-an'
  | 'mon-an-vat'
  | 'dac-san'
  | 'ca-phe'
  | 'tra'
  | 'nuoc-giai-khat'
  | 'sinh-to';

export interface CategoryTab {
  key: CategoryFilterKey;
  label: string;
}

export const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'mon-an', label: 'Món ăn' },
  { key: 'mon-an-vat', label: 'Món ăn vặt' },
  { key: 'dac-san', label: 'Đặc sản Sài Gòn' },
  { key: 'ca-phe', label: 'Cà phê' },
  { key: 'tra', label: 'Trà' },
  { key: 'nuoc-giai-khat', label: 'Nước giải khát' },
  { key: 'sinh-to', label: 'Sinh tố' },
];

interface CategoryBarProps {
  activeKey: CategoryFilterKey;
  onSelectCategory: (key: CategoryFilterKey) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  activeKey,
  onSelectCategory,
}) => {
  return (
    <section className="food-category-bar-section" aria-label="Danh mục món ăn và thức uống">
      <div className="food-category-bar-inner">
        <div className="food-category-tabs-scroll" role="tablist">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`food-category-tab-btn ${isSelected ? 'is-active' : ''}`}
                onClick={() => onSelectCategory(tab.key)}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
