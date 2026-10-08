import React, { useState } from 'react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { LANG_DISPLAY_NAMES } from '../../hooks/useNearbyAudio';

interface PoiCardProps {
  poi: GeoPoi;
  originalIndex: number;
  isSelected: boolean;
  isPlaying: boolean;
  isCurrent: boolean;
  currentLang: SupportedLanguage;
  dist: number | null;
  formattedDist: string | null;
  inTriggerZone: boolean;
  inRadius: boolean;
  onSelect: () => void;
  onTogglePlay: () => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  inZoneBadgeText: string;
  nearBadgeText: string;
  distFormatText: (distStr: string) => string;
  langVoiceAriaText: string;
  listenBtnText: string;
  pauseBtnText: string;
  resumeBtnText: string;
}

export const PoiCard: React.FC<PoiCardProps> = ({
  poi,
  originalIndex,
  isSelected,
  isPlaying,
  isCurrent,
  currentLang,
  dist,
  formattedDist,
  inTriggerZone,
  inRadius,
  onSelect,
  onTogglePlay,
  getPoiName,
  getPoiCategory,
  inZoneBadgeText,
  nearBadgeText,
  distFormatText,
  langVoiceAriaText,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
}) => {
  const [imageError, setImageError] = useState(false);

  const isCardPlaying = isCurrent && isPlaying;
  const poiName = getPoiName(poi);
  const poiCategory = getPoiCategory(poi);

  const supportedLanguagesList: SupportedLanguage[] = ['vi', 'en', 'ko', 'ja', 'zh'];

  return (
    <li
      className={`card poi-card-item ${isSelected ? 'sel is-selected' : ''} ${
        isCardPlaying ? 'playing is-playing' : ''
      }`}
      data-id={poi.id}
      onClick={onSelect}
      tabIndex={0}
      role="article"
      aria-label={`${originalIndex + 1}. ${poiName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Index Badge */}
      <div className="idx poi-idx" aria-hidden="true">
        {originalIndex + 1}
      </div>

      {/* Thumbnail */}
      <div className="thumb poi-thumb">
        {imageError ? (
          <div className="poi-img-placeholder" aria-label={poiName}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8B2E16"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21h18" />
              <path d="M5 21V7l7-4 7 4v14" />
              <path d="M9 10h6" />
              <path d="M9 14h6" />
              <path d="M9 18h6" />
            </svg>
            <span className="placeholder-text">{poiName}</span>
          </div>
        ) : (
          <img
            alt={poiName}
            loading="lazy"
            src={poi.image}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Body Info */}
      <div className="body poi-body">
        <div className="tags poi-tags">
          <span className="tag category-tag">{poiCategory}</span>
          {inTriggerZone && <span className="tag in trigger-tag">{inZoneBadgeText}</span>}
          {!inTriggerZone && inRadius && <span className="tag near radius-tag">{nearBadgeText}</span>}
        </div>

        <h3 className="poi-title">{poiName}</h3>

        <div className="meta poi-meta">
          {/* Distance ONLY shown when GPS is available (dist !== null) */}
          {dist !== null && formattedDist && (
            <span className="dist poi-dist" aria-label={`Khoảng cách ${formattedDist}`}>
              {distFormatText(formattedDist)}
            </span>
          )}

          {/* Language Chips */}
          <span className="lg lang-chips" aria-label={langVoiceAriaText}>
            {supportedLanguagesList.map((langCode) => {
              const hasAudio =
                poi.audio[langCode] !== undefined &&
                poi.audio[langCode] !== 0 &&
                poi.audio[langCode] !== '';
              const langName =
                LANG_DISPLAY_NAMES[currentLang]?.[langCode] || langCode.toUpperCase();

              return (
                <i
                  key={langCode}
                  className={`lang-chip ${hasAudio ? 'active' : 'off'}`}
                  title={
                    hasAudio
                      ? `Có giọng đọc ${langName}`
                      : `Chưa có giọng đọc ${langName}`
                  }
                  aria-label={`${langCode.toUpperCase()}: ${
                    hasAudio ? 'Có âm thanh' : 'Chưa có âm thanh'
                  }`}
                >
                  {langCode.toUpperCase()}
                </i>
              );
            })}
          </span>
        </div>
      </div>

      {/* Listen Action Button */}
      <button
        className="listen poi-listen-btn"
        type="button"
        data-id={poi.id}
        aria-label={
          isCardPlaying
            ? `Tạm dừng ${poiName}`
            : isCurrent && !isCardPlaying
            ? `Tiếp tục ${poiName}`
            : `Nghe thuyết minh ${poiName}`
        }
        onClick={(e) => {
          e.stopPropagation();
          onTogglePlay();
        }}
      >
        {isCardPlaying ? (
          <>
            <span className="wave" aria-hidden="true">
              <b />
              <b />
              <b />
            </span>
            <span>{pauseBtnText.replace('❚❚ ', '')}</span>
          </>
        ) : isCurrent && !isCardPlaying ? (
          <span>{resumeBtnText}</span>
        ) : (
          <span>{listenBtnText}</span>
        )}
      </button>
    </li>
  );
};
