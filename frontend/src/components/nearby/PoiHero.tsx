import React, { useState, useEffect } from 'react';
import { GeoPoi, getHeroIntroText } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { resolveImagePath } from './PoiCard';
import { t } from '../../content/nearbyI18n';
import { PlaybackStatus } from '../../hooks/useNearbyAudio';

interface PoiHeroProps {
  poi: GeoPoi;
  originalIndex: number;
  totalStops: number;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  isCurrent: boolean;
  playbackStatus?: PlaybackStatus;
  chapterMode: 'listen' | 'read';
  onChangeChapterMode: (mode: 'listen' | 'read') => void;
  onTogglePlay: (poiId: string) => void;
  isListened?: boolean;
  duration?: number;
  listenBtnText?: string;
  pauseBtnText?: string;
  resumeBtnText?: string;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  heroRef?: React.RefObject<HTMLDivElement>;
}

export const PoiHero: React.FC<PoiHeroProps> = ({
  poi,
  originalIndex,
  totalStops,
  currentLang,
  isPlaying,
  isCurrent,
  playbackStatus,
  chapterMode,
  onChangeChapterMode,
  onTogglePlay,
  isListened = false,
  duration,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
  getPoiName,
  getPoiCategory,
  heroRef,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [poi.id]);

  const hasNameInLang = Boolean(poi.name[currentLang]);
  const isNameFallback = !hasNameInLang && currentLang !== 'vi';
  const displayName = getPoiName(poi);

  const hasCatInLang = Boolean(poi.category[currentLang]);
  const isCatFallback = !hasCatInLang && currentLang !== 'vi';
  const displayCat = getPoiCategory(poi);

  // Hero intro: first two sentences of short narration text (2-line clamped)
  const introText = getHeroIntroText(poi, currentLang);

  const isCardPlaying = isCurrent && isPlaying;
  const resolvedListenText = listenBtnText || t(currentLang, 'playBtn');
  const resolvedPauseText = pauseBtnText || t(currentLang, 'pauseBtn');
  const resolvedResumeText = resumeBtnText || t(currentLang, 'resumeBtn');

  // Audio duration calculation:
  // Duration appears only when audio is actively playing or paused (never in idle or loading)
  const isPlayingOrPaused =
    isCurrent && (playbackStatus === 'playing' || playbackStatus === 'paused');
  const knownSeconds =
    isPlayingOrPaused && duration && duration > 0 ? duration : null;

  const formattedAudioDuration = knownSeconds
    ? `${Math.floor(knownSeconds / 60)}:${String(Math.floor(knownSeconds % 60)).padStart(2, '0')}`
    : null;

  const hasValidImage = Boolean((poi.image || poi.slug) && !imageError);

  return (
    <section
      ref={heroRef}
      className={`nearby-hero-section ${hasValidImage ? 'has-media' : 'no-media'}`}
      aria-label={`${originalIndex + 1}. ${displayName}`}
      id="active-stop-hero"
    >
      <div className="nearby-hero-container">
        {/* Left column: 4:3 image, rendered ONLY if image resolves */}
        {hasValidImage && (
          <div className="nearby-hero-media">
            <img
              src={resolveImagePath(poi.image, poi.slug)}
              alt={displayName}
              className="hero-media-img"
              loading="eager"
              decoding="async"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Right column: text content (spans full width if no image) */}
        <div className="nearby-hero-content">
          {/* Top meta: category, listened badge, and n / 5 position indicator */}
          <div className="hero-meta-top">
            <div className="hero-meta-badges">
              <span className="hero-category-badge" lang={isCatFallback ? 'vi' : currentLang}>
                {displayCat}
                {isCatFallback && (
                  <span className="hero-content-fallback-tag">
                    ({t(currentLang, 'vietnameseContentNote')})
                  </span>
                )}
              </span>
              {isListened && (
                <span className="chapter-listened-pill" title={t(currentLang, 'listenedTitle')}>
                  {t(currentLang, 'listenedBadge')}
                </span>
              )}
            </div>
            <span className="hero-position-indicator" aria-label={`Điểm ${originalIndex + 1} trên ${totalStops}`}>
              {originalIndex + 1} / {totalStops}
            </span>
          </div>

          {/* Stop title */}
          <h2 className="nearby-hero-title detail-title" lang={isNameFallback ? 'vi' : currentLang}>
            {displayName}
            {isNameFallback && (
              <span className="hero-content-fallback-tag">
                ({t(currentLang, 'vietnameseContentNote')})
              </span>
            )}
          </h2>

          {/* Secondary local-name line (if not Vietnamese) */}
          {currentLang !== 'vi' && (
            <p className="hero-local-name-line" lang="vi">
              <span className="local-name-label">{t(currentLang, 'localNameLabel')}: </span>
              <span className="local-name-value">{poi.name.vi}</span>
            </p>
          )}

          {/* 2-line clamped intro */}
          {introText && (
            <p className="nearby-hero-intro chapter-description-measure is-clamped" lang={currentLang}>
              {introText}
            </p>
          )}

          {/* Primary action row: Play pill button & Listen | Read switch */}
          <div className="hero-actions-row">
            <button
              type="button"
              className="detail-play-btn"
              data-id={poi.id}
              aria-label={
                isCardPlaying
                  ? `${resolvedPauseText} ${displayName}`
                  : isCurrent && !isCardPlaying
                  ? `${resolvedResumeText} ${displayName}`
                  : `${resolvedListenText} ${displayName}`
              }
              onClick={() => onTogglePlay(poi.id)}
            >
              {isCardPlaying ? (
                <span className="audio-wave-anim" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="play-icon-svg"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              <span className="chapter-play-label">
                {isCardPlaying
                  ? resolvedPauseText
                  : isCurrent && !isCardPlaying
                  ? resolvedResumeText
                  : resolvedListenText}
              </span>
            </button>

            {formattedAudioDuration && (
              <span className="hero-audio-duration">{formattedAudioDuration}</span>
            )}

            {/* Segmented Listen | Read toggle group */}
            <div
              className="chapter-mode-switcher hero-mode-switcher"
              role="group"
              aria-label={t(currentLang, 'modeSwitchAria', { name: displayName })}
            >
              <button
                type="button"
                aria-pressed={chapterMode === 'listen'}
                className={`mode-switch-btn ${chapterMode === 'listen' ? 'is-active' : ''}`}
                onClick={() => onChangeChapterMode('listen')}
              >
                {t(currentLang, 'modeListen')}
              </button>
              <button
                type="button"
                aria-pressed={chapterMode === 'read'}
                className={`mode-switch-btn ${chapterMode === 'read' ? 'is-active' : ''}`}
                onClick={() => onChangeChapterMode('read')}
              >
                {t(currentLang, 'modeRead')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
