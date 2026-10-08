import React, { useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { CategoryFilterKey } from '../../types/productFilter';

interface FoodHeroSectionProps {
  onSearch: (keyword: string, category?: CategoryFilterKey) => void;
  initialKeyword?: string;
  initialCategory?: CategoryFilterKey;
}

const CATEGORY_DROPDOWN_OPTIONS: { key: CategoryFilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả danh mục' },
  { key: 'mon-an', label: 'Món ăn Sài Gòn' },
  { key: 'mon-an-vat', label: 'Món ăn vặt' },
  { key: 'dac-san', label: 'Đặc sản làm quà' },
  { key: 'ca-phe', label: 'Cà phê' },
  { key: 'tra', label: 'Trà' },
  { key: 'nuoc-giai-khat', label: 'Nước giải khát' },
  { key: 'sinh-to', label: 'Sinh tố' },
];

const SUGGESTED_CHIPS = ['Cơm tấm', 'Bánh mì', 'Cà phê sữa đá', 'Bạc xỉu', 'Trà đào'];

export const FoodHeroSection: React.FC<FoodHeroSectionProps> = ({
  onSearch,
  initialKeyword = '',
  initialCategory = 'all',
}) => {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedCat, setSelectedCat] = useState<CategoryFilterKey>(initialCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword.trim(), selectedCat === 'all' ? undefined : selectedCat);
  };

  const handleClear = () => {
    setKeyword('');
    onSearch('', selectedCat === 'all' ? undefined : selectedCat);
  };

  const handleQuickChip = (term: string) => {
    setKeyword(term);
    onSearch(term);
  };

  return (
    <section className="editorial-hero-section" aria-label="Ẩm thực và thức uống Sài Gòn">
      {/* Background Image với lớp phủ tối 60% */}
      <div className="editorial-hero-bg-overlay" />

      <div className="editorial-hero-container">
        <div className="editorial-hero-content">
          {/* 1. Small Eyebrow Text: Left-aligned, uppercase, tracking-wide */}
          <div className="editorial-hero-eyebrow">
            <span>SÀI GÒN, VIỆT NAM</span>
          </div>

          {/* 2. Main Title: Playfair Display, editorial & elegant, left-aligned */}
          <h1 className="editorial-hero-title">
            Ẩm Thực &amp; Thức Uống Sài Gòn
          </h1>

          {/* 3. Subtitle: one line, body font, 80% opacity */}
          <p className="editorial-hero-subtitle">
            Hương vị nguyên bản đúc kết từ ký ức hè phố đến không gian ẩm thực tinh tế.
          </p>

          {/* 4. Advanced Search Bar: White bg, rounded-lg, inline category dropdown + input + orange button */}
          <form className="editorial-search-bar" onSubmit={handleSubmit} role="search">
            <div className="search-category-dropdown-wrap">
              <select
                className="search-category-select"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value as CategoryFilterKey)}
                aria-label="Chọn danh mục tìm kiếm"
              >
                {CATEGORY_DROPDOWN_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="dropdown-chevron-icon" aria-hidden="true" />
            </div>

            <div className="search-divider" />

            <div className="search-input-wrap">
              <Search size={18} className="search-input-icon" aria-hidden="true" />
              <input
                type="text"
                className="search-native-input"
                placeholder="Tìm kiếm món ngon, thức uống, đặc sản..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Tìm kiếm món ăn hoặc thức uống"
              />
              {keyword && (
                <button
                  type="button"
                  className="search-input-clear-btn"
                  onClick={handleClear}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button type="submit" className="search-submit-accent-btn">
              <Search size={16} strokeWidth={2.2} />
              <span>Tìm kiếm</span>
            </button>
          </form>

          {/* 5. Gợi ý 5 món ăn đặc trưng dạng outlined pill */}
          <div className="editorial-hero-chips-row">
            <span className="chips-label">Gợi ý món quen:</span>
            <div className="chips-list">
              {SUGGESTED_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="editorial-chip-pill"
                  onClick={() => handleQuickChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
