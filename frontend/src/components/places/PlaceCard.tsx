import React from 'react';
import { PoiSummary } from '../../types';

interface PlaceCardProps {
  poi: PoiSummary;
  hue: number;
  index: number;
  categoryLabel: string;
  descriptionText: string;
  isFavorite: boolean;
  isPlaying: boolean;
  onOpenDetail: () => void;
  onToggleAudio: () => void;
  onToggleFavorite: () => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  poi,
  hue,
  index,
  categoryLabel,
  descriptionText,
  isFavorite,
  isPlaying,
  onOpenDetail,
  onToggleAudio,
  onToggleFavorite,
}) => {
  const paddedIndex = String(index + 1).padStart(2, '0');
  const tagText = `${paddedIndex} · ${categoryLabel.toUpperCase()}`;

  return (
    <article
      className="cd"
      style={{ '--h': hue } as React.CSSProperties}
    >
      <div className="cd-top">
        <span className="cd-caption">Ảnh: {poi.name}</span>
      </div>

      <div className="cd-body">
        <div className="cd-tag">{tagText}</div>
        <h3 className="cd-title">{poi.name}</h3>
        <p className="cd-desc">{descriptionText}</p>

        <div className="cd-footer">
          <button
            type="button"
            className="cd-btn-detail"
            onClick={onOpenDetail}
          >
            CHI TIẾT
          </button>

          <div className="cd-btn-group">
            <button
              type="button"
              className={`cd-circle-btn ${isPlaying ? 'active' : ''}`}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? `Dừng thuyết minh ${poi.name}` : `Nghe thuyết minh ${poi.name}`}
              onClick={onToggleAudio}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className={`cd-circle-btn cd-fav-btn ${isFavorite ? 'active' : ''}`}
              aria-pressed={isFavorite}
              aria-label={`Yêu thích ${poi.name}`}
              onClick={onToggleFavorite}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorite ? '#c0392b' : 'none'}
                stroke={isFavorite ? '#c0392b' : 'currentColor'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
