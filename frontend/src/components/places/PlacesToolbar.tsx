import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { SupportedLanguage } from '../../types';

interface PlacesToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: { key: string; label: string }[];
  selectedCategory: string;
  onSelectCategory: (key: string) => void;
  lang: SupportedLanguage;
  onLangChange: (lang: SupportedLanguage) => void;
}

export const PlacesToolbar: React.FC<PlacesToolbarProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  lang,
  onLangChange,
}) => {
  const navigate = useNavigate();

  return (
    <div className="ct">
      <div className="ct-main">
        <div className="places-search-box">
          <input
            id="qi"
            type="search"
            placeholder="Tìm địa điểm"
            aria-label="Tìm địa điểm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="places-tabs" role="group" aria-label="Lọc theo nhóm">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`places-tab ${selectedCategory === cat.key ? 'active' : ''}`}
              data-g={cat.key}
              aria-pressed={selectedCategory === cat.key}
              onClick={() => onSelectCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ct-actions">
        <div className="lang-switcher">
          {(['vi', 'en', 'ja', 'ko'] as const).map((l) => (
            <button
              key={l}
              type="button"
              className={`lang-btn ${lang === l ? 'active' : ''}`}
              aria-pressed={lang === l}
              onClick={() => onLangChange(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="tb action-btn"
          onClick={() => navigate('/gan-toi')}
        >
          <MapPin size={15} strokeWidth={1.75} aria-hidden="true" />
          Gần tôi
        </button>

        <button
          type="button"
          className="tb action-btn"
          onClick={() => navigate('/quet-ma')}
        >
          Quét mã QR
        </button>
      </div>
    </div>
  );
};
