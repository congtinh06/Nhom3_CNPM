import React, { useId, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { normalizeSearchText } from '../utils/text';

export type AdminSearchSuggestionKind = 'keyword' | 'filter';

export interface AdminSearchSuggestion {
  id: string;
  label: string;
  hint?: string;
  kind?: AdminSearchSuggestionKind;
  onSelect: () => void;
}

export interface AdminActiveFilter {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface AdminFilterPanelProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  suggestions?: AdminSearchSuggestion[];
  filters?: React.ReactNode;
  activeFilters?: AdminActiveFilter[];
  onClearFilters?: () => void;
  totalLabel?: string;
}

export const AdminFilterPanel: React.FC<AdminFilterPanelProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  suggestions = [],
  filters,
  activeFilters = [],
  onClearFilters,
  totalLabel,
}) => {
  const baseId = useId();
  const listId = `${baseId}-suggestions`;
  const blurTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredSuggestions = useMemo(() => {
    const query = normalizeSearchText(searchValue);
    if (!query) return suggestions.slice(0, 6);
    return suggestions
      .filter(
        (item) =>
          normalizeSearchText(item.label).includes(query) ||
          normalizeSearchText(item.hint || '').includes(query)
      )
      .slice(0, 8);
  }, [searchValue, suggestions]);

  const hasFilters = activeFilters.length > 0;

  const cancelClose = () => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    blurTimerRef.current = window.setTimeout(() => setIsOpen(false), 120);
  };

  const handleSelect = (suggestion: AdminSearchSuggestion) => {
    suggestion.onSelect();
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (filteredSuggestions.length === 0) return;
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => {
        const next = e.key === 'ArrowDown' ? prev + 1 : prev - 1;
        if (next < 0) return filteredSuggestions.length - 1;
        if (next >= filteredSuggestions.length) return 0;
        return next;
      });
      return;
    }
    if (e.key === 'Enter' && isOpen && activeIndex >= 0) {
      const suggestion = filteredSuggestions[activeIndex];
      if (suggestion) {
        e.preventDefault();
        handleSelect(suggestion);
      }
    }
  };

  const showSuggestions = isOpen && filteredSuggestions.length > 0;

  return (
    <section className="adm-filter-panel" aria-label="Tìm kiếm và bộ lọc">
      <div className="adm-filter-row">
        <div className="adm-filter-search">
          <Search className="adm-filter-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="adm-input adm-filter-search-input"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              cancelClose();
              setIsOpen(true);
            }}
            onBlur={scheduleClose}
            onKeyDown={handleKeyDown}
            aria-label={searchAriaLabel}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? listId : undefined}
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `${listId}-option-${activeIndex}`
                : undefined
            }
            autoComplete="off"
          />
          {searchValue && (
            <button
              type="button"
              className="adm-filter-search-clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSearchChange('');
                setIsOpen(true);
              }}
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X aria-hidden="true" />
            </button>
          )}

          {showSuggestions && (
            <div
              className="adm-filter-suggest"
              id={listId}
              role="listbox"
              aria-label="Gợi ý tìm kiếm và bộ lọc"
            >
              <div className="adm-filter-suggest-head">
                <SlidersHorizontal aria-hidden="true" />
                <span>Gợi ý tìm kiếm &amp; bộ lọc</span>
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`adm-filter-suggest-item${
                    index === activeIndex ? ' is-active' : ''
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(suggestion)}
                >
                  <span className="adm-filter-suggest-copy">
                    <span className="adm-filter-suggest-label">{suggestion.label}</span>
                    {suggestion.hint && (
                      <span className="adm-filter-suggest-hint">{suggestion.hint}</span>
                    )}
                  </span>
                  <span
                    className={`adm-filter-suggest-kind${
                      suggestion.kind === 'filter' ? ' is-filter' : ''
                    }`}
                  >
                    {suggestion.kind === 'filter' ? 'Bộ lọc' : 'Từ khóa'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {filters && <div className="adm-filter-selects">{filters}</div>}

        {hasFilters && onClearFilters && (
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm adm-filter-clear"
            onClick={onClearFilters}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {(hasFilters || totalLabel) && (
        <div className="adm-filter-meta">
          {totalLabel && <span className="adm-filter-total">{totalLabel}</span>}
          {hasFilters && (
            <div className="adm-filter-chips" role="group" aria-label="Bộ lọc đang áp dụng">
              {activeFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className="adm-filter-chip"
                  onClick={filter.onRemove}
                  aria-label={`Xóa bộ lọc ${filter.label}: ${filter.value}`}
                >
                  <span className="adm-filter-chip-label">{filter.label}:</span>
                  <span className="adm-filter-chip-value">{filter.value}</span>
                  <X aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AdminFilterPanel;
