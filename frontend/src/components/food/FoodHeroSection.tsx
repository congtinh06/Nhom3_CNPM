import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { defaultProducts } from '../../content/defaultProducts';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import {
  CategoryFilterKey,
  ProductFilterState,
  AdvancedSearchValues,
} from '../../types/productFilter';

interface FoodHeroSectionProps {
  onSearch: (keyword: string, category?: CategoryFilterKey) => void;
  filters: ProductFilterState;
  onApplyAdvanced?: (values: AdvancedSearchValues) => void;
}

const SUGGESTED_CHIPS = ['Cơm tấm', 'Bánh mì', 'Cà phê sữa đá', 'Bạc xỉu', 'Trà đào'];

/**
 * Chuẩn hóa chuỗi tiếng Việt: chuyển chữ thường, bỏ dấu thanh (NFD),
 * chuyển đ/Đ thành d/D để tìm kiếm không phụ thuộc dấu.
 */
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

/**
 * Hiển thị tên món ăn với phần khớp từ khóa được in đậm (accent highlight).
 */
function renderHighlightedName(name: string, query: string): React.ReactNode {
  if (!query.trim()) return name;

  const normName = removeVietnameseTones(name);
  const normQuery = removeVietnameseTones(query);
  const matchIdx = normName.indexOf(normQuery);

  if (matchIdx === -1) {
    return name;
  }

  const prefix = name.slice(0, matchIdx);
  const matched = name.slice(matchIdx, matchIdx + normQuery.length);
  const suffix = name.slice(matchIdx + normQuery.length);

  return (
    <>
      {prefix}
      <strong>{matched}</strong>
      {suffix}
    </>
  );
}

/**
 * Xếp hạng độ liên quan cho gợi ý tìm kiếm theo thứ tự ưu tiên:
 * (a) Tên bắt đầu bằng từ khóa (rank 1)
 * (b) Bất kỳ từ nào trong tên bắt đầu bằng từ khóa (rank 2)
 * (c) Tên chứa từ khóa ở vị trí bất kỳ (rank 3)
 * (d) Khớp trong danh mục, mô tả ngắn hoặc chi tiết (rank 4)
 */
function getProductMatchRank(product: Product, normQuery: string): number | null {
  if (!normQuery) return null;
  const normName = removeVietnameseTones(product.name);

  // (a) Tên bắt đầu bằng từ khóa
  if (normName.startsWith(normQuery)) {
    return 1;
  }

  // (b) Bất kỳ từ nào trong tên bắt đầu bằng từ khóa
  const words = normName.split(/\s+/);
  if (words.some((w) => w.startsWith(normQuery))) {
    return 2;
  }

  // (c) Tên chứa từ khóa
  if (normName.includes(normQuery)) {
    return 3;
  }

  // (d) Danh mục, mô tả ngắn, mô tả chi tiết
  const subCategoryLabels: Record<string, string> = {
    'mon-an': 'mon an sai gon',
    'dac-san': 'dac san sai gon',
    'mon-an-vat': 'mon an vat',
    'ca-phe': 'ca phe',
    'tra': 'tra',
    'nuoc-giai-khat': 'nuoc giai khat',
    'sinh-to': 'sinh to',
  };
  const categoryText = product.subCategory ? (subCategoryLabels[product.subCategory] || '') : '';
  const typeText = product.category === 'DRINK' ? 'do uong thuc uong' : 'mon an am thuc';
  const normShort = removeVietnameseTones(product.shortDescription || '');
  const normDesc = removeVietnameseTones(product.description || '');

  if (
    categoryText.includes(normQuery) ||
    typeText.includes(normQuery) ||
    normShort.includes(normQuery) ||
    normDesc.includes(normQuery)
  ) {
    return 4;
  }

  return null;
}

export const FoodHeroSection: React.FC<FoodHeroSectionProps> = ({
  onSearch,
  filters,
}) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(filters.keyword);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cập nhật vị trí bottom của ô tìm kiếm để tính max-height dropdown động
  const updateInputBottom = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      containerRef.current.style.setProperty(
        '--search-input-bottom',
        `${Math.round(rect.bottom)}px`
      );
    }
  }, []);

  // Đồng bộ từ khóa khi URL hoặc filters bên ngoài thay đổi
  useEffect(() => {
    setKeyword(filters.keyword);
  }, [filters.keyword]);

  // Click outside listener để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Theo dõi resize để cập nhật --search-input-bottom khi dropdown đang mở
  useEffect(() => {
    if (isOpen) {
      updateInputBottom();
      window.addEventListener('resize', updateInputBottom);
      return () => {
        window.removeEventListener('resize', updateInputBottom);
      };
    }
  }, [isOpen, updateInputBottom]);

  // Cuộn mục đang highlight vào vùng nhìn thấy (block: nearest)
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      const el = document.getElementById(`food-suggestion-item-${highlightedIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  // Xử lý live autocomplete: kích hoạt từ 1 ký tự, xếp hạng 4 cấp, tối đa 6 kết quả
  const fetchSuggestions = useCallback((searchQuery: string) => {
    const q = searchQuery.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    setIsLoading(true);

    // Abort controller nếu có yêu cầu trước đó
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    try {
      const normQuery = removeVietnameseTones(q);
      const rankedItems: { product: Product; rank: number; index: number }[] = [];

      defaultProducts.forEach((item, index) => {
        if (!item.isActive) return;
        const rank = getProductMatchRank(item, normQuery);
        if (rank !== null) {
          rankedItems.push({ product: item, rank, index });
        }
      });

      // Sắp xếp ưu tiên: rank tăng dần (1 -> 2 -> 3 -> 4), thứ tự gốc giữ nguyên (stable)
      rankedItems.sort((a, b) => {
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        return a.index - b.index;
      });

      const matched = rankedItems.slice(0, 6).map((r) => r.product);

      // Kiểm tra nếu bị abort thì bỏ qua cập nhật
      if (currentAbortController.signal.aborted) return;

      setSuggestions(matched);
      setIsOpen(true);
      setIsLoading(false);
      setHighlightedIndex(-1);
    } catch {
      if (currentAbortController.signal.aborted) return;
      setSuggestions([]);
      setIsOpen(true);
      setIsLoading(false);
      setHighlightedIndex(-1);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length >= 1) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(trimmed);
      }, 150);
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelectSuggestion = (product: Product) => {
    setIsOpen(false);
    setKeyword(product.name);
    navigate(`/am-thuc-thuc-uong/${product.slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else {
      setIsOpen(false);
      onSearch(keyword.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && keyword.trim().length >= 1 && suggestions.length > 0) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        break;

      case 'Enter':
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setKeyword('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  };

  const handleQuickChip = (term: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setKeyword(term);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSearch(term);
  };

  return (
    <section className="editorial-hero-section" aria-label="Ẩm thực và thức uống Sài Gòn">
      {/* Background Image với lớp phủ tối 60% */}
      <div className="editorial-hero-bg-overlay" />

      <div className="editorial-hero-container">
        <div className="editorial-hero-content">
          {/* 1. Small Eyebrow Text */}
          <div className="editorial-hero-eyebrow">
            <span>SÀI GÒN, VIỆT NAM</span>
          </div>

          {/* 2. Main Title: Playfair Display */}
          <h1 className="editorial-hero-title">
            Ẩm Thực &amp; Thức Uống Sài Gòn
          </h1>

          {/* 3. Subtitle */}
          <p className="editorial-hero-subtitle">
            Hương vị nguyên bản đúc kết từ ký ức hè phố đến không gian ẩm thực tinh tế.
          </p>

          {/* 4. Live Autocomplete Search Container */}
          <div className="editorial-search-container" ref={containerRef}>
            <form className="editorial-search-bar" onSubmit={handleSubmit} role="search">
              <div className="search-input-wrap">
                <Search size={18} className="search-input-icon" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  className="search-native-input"
                  placeholder="Tìm kiếm món ngon, thức uống, đặc sản..."
                  value={keyword}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (keyword.trim().length >= 1 && suggestions.length > 0) {
                      setIsOpen(true);
                    }
                  }}
                  aria-label="Tìm kiếm món ăn hoặc thức uống"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isOpen}
                  aria-controls="food-autocomplete-listbox"
                  aria-activedescendant={
                    isOpen && highlightedIndex >= 0
                      ? `food-suggestion-item-${highlightedIndex}`
                      : undefined
                  }
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
            </form>

            {/* Dropdown gợi ý sản phẩm */}
            {isOpen && (
              <div
                className="food-autocomplete-dropdown"
                id="food-autocomplete-listbox"
                role="listbox"
                aria-label="Gợi ý món ăn"
              >
                {isLoading ? (
                  <div className="autocomplete-state-msg">
                    <Loader2 size={16} className="autocomplete-loading-spin" />
                    <span>Đang tìm kiếm món...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="autocomplete-state-msg">
                    <span>Không tìm thấy món phù hợp</span>
                  </div>
                ) : (
                  suggestions.map((item, index) => {
                    const isHighlighted = highlightedIndex === index;
                    return (
                      <div
                        key={item.id}
                        id={`food-suggestion-item-${index}`}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`food-suggestion-row ${
                          isHighlighted ? 'is-highlighted' : ''
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        <img
                          src={item.imagePath}
                          alt=""
                          className="suggestion-thumb"
                          loading="lazy"
                        />
                        <div className="suggestion-info">
                          <span className="suggestion-name">
                            {renderHighlightedName(item.name, keyword)}
                          </span>
                          <span className="suggestion-category">
                            {item.subCategory === 'mon-an'
                              ? 'Món ăn Sài Gòn'
                              : item.subCategory === 'dac-san'
                              ? 'Đặc sản Sài Gòn'
                              : item.subCategory === 'mon-an-vat'
                              ? 'Món ăn vặt'
                              : item.category === 'DRINK'
                              ? 'Đồ uống'
                              : 'Ẩm thực'}
                          </span>
                        </div>
                        <span className="suggestion-price">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 5. Gợi ý món quen chips */}
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
