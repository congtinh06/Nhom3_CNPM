import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { NewsItem } from '../../types/domain';

export interface NewsHeroSectionProps {
  keyword: string;
  onSearch: (keyword: string) => void;
  articles?: NewsItem[];
}

const NEWS_SUGGESTED_CHIPS = [
  'Dinh Độc Lập',
  'Nhà thờ Đức Bà',
  'Bưu điện',
  'Chợ Bến Thành',
  'Cà phê vợt',
  'Áo dài',
  'Đờn ca tài tử',
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

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

export const NewsHeroSection: React.FC<NewsHeroSectionProps> = ({
  keyword: initialKeyword,
  onSearch,
  articles = [],
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(initialKeyword);
  const [suggestions, setSuggestions] = useState<NewsItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchTerm(initialKeyword);
  }, [initialKeyword]);

  // Click outside to close dropdown
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

  const fetchSuggestions = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) {
        setSuggestions([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const normQuery = removeVietnameseTones(q);

      const matches = articles.filter((item) => {
        const normTitle = removeVietnameseTones(item.title);
        const normSummary = removeVietnameseTones(item.summary || '');
        const normCategory = removeVietnameseTones(item.category);
        return (
          normTitle.includes(normQuery) ||
          normSummary.includes(normQuery) ||
          normCategory.includes(normQuery)
        );
      });

      setSuggestions(matches.slice(0, 5));
      setIsOpen(true);
      setIsLoading(false);
      setHighlightedIndex(-1);
    },
    [articles]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim()) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 150);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      onSearch('');
    }
  };

  const handleSelectSuggestion = (item: NewsItem) => {
    setIsOpen(false);
    navigate(`/tin-tuc/${item.slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else {
      setIsOpen(false);
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  };

  const handleQuickChip = (term: string) => {
    setSearchTerm(term);
    setSuggestions([]);
    setIsOpen(false);
    onSearch(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
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
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <section className="editorial-hero-section news-hero-section" aria-label="Tin tức & Di sản Sài Gòn">
      {/* Background Image với lớp phủ tối đồng bộ như phần Ẩm thực */}
      <div className="editorial-hero-bg-overlay news-hero-bg-overlay" />

      <div className="editorial-hero-container">
        <div className="editorial-hero-content">
          {/* 1. Eyebrow */}
          <div className="editorial-hero-eyebrow">
            <span>SÀI GÒN, VIỆT NAM</span>
          </div>

          {/* 2. Main Title: Playfair Display Bold */}
          <h1 className="editorial-hero-title">
            Tin Tức &amp; Di Sản Sài Gòn
          </h1>

          {/* 3. Subtitle */}
          <p className="editorial-hero-subtitle">
            Cập nhật câu chuyện di sản, đời sống văn hóa và cẩm nang khám phá Thành phố Hồ Chí Minh.
          </p>

          {/* 4. Search Bar Container */}
          <div className="editorial-search-container" ref={containerRef}>
            <form className="editorial-search-bar" onSubmit={handleSubmit} role="search">
              <div className="search-input-wrap">
                <Search size={18} className="search-input-icon" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  className="search-native-input"
                  placeholder="Tìm kiếm bài viết, câu chuyện di sản, văn hóa..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchTerm.trim().length >= 1 && suggestions.length > 0) {
                      setIsOpen(true);
                    }
                  }}
                  aria-label="Tìm kiếm bài viết hoặc tin tức"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isOpen}
                  aria-controls="news-autocomplete-listbox"
                />
                {searchTerm && (
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

            {/* Dropdown gợi ý bài viết */}
            {isOpen && (
              <div
                className="food-autocomplete-dropdown news-autocomplete-dropdown"
                id="news-autocomplete-listbox"
                role="listbox"
                aria-label="Gợi ý bài viết"
              >
                {isLoading ? (
                  <div className="autocomplete-state-msg">
                    <Loader2 size={16} className="autocomplete-loading-spin" />
                    <span>Đang tìm kiếm bài viết...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="autocomplete-state-msg">
                    <span>Không tìm thấy bài viết phù hợp</span>
                  </div>
                ) : (
                  suggestions.map((item, index) => {
                    const isHighlighted = highlightedIndex === index;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`food-suggestion-row news-suggestion-row ${
                          isHighlighted ? 'is-highlighted' : ''
                        }`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        {item.coverImageUrl && (
                          <img
                            src={item.coverImageUrl}
                            alt=""
                            className="suggestion-thumb"
                            loading="lazy"
                          />
                        )}
                        <div className="suggestion-info">
                          <span className="suggestion-name">
                            {renderHighlightedName(item.title, searchTerm)}
                          </span>
                          <span className="suggestion-category">
                            {item.category === 'diem-den'
                              ? 'Điểm đến'
                              : item.category === 'van-hoa'
                              ? 'Văn hóa Sài Gòn'
                              : 'Mẹo tham quan'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 5. Gợi ý tìm kiếm chips */}
          <div className="editorial-hero-chips-row">
            <span className="chips-label">Gợi ý tìm kiếm:</span>
            <div className="chips-list">
              {NEWS_SUGGESTED_CHIPS.map((chip) => (
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

export default NewsHeroSection;
