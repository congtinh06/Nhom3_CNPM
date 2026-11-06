import React, { useState, useEffect } from 'react';
import { GeoPoi, getHeroIntroText } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { resolveImagePath } from './PoiCard';
import { t } from '../../content/nearbyI18n';
import { PlaybackStatus } from '../../hooks/useNearbyAudio';
import { buildGoogleMapsDirectionsUrl } from '../../utils/directions';

interface PoiHeroProps {
  poi: GeoPoi;
  originalIndex: number;
  stopNumber?: number;
  totalStops: number;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  isCurrent: boolean;
  playbackStatus?: PlaybackStatus;
  onTogglePlay: (poiId: string) => void;
  duration?: number;
  listenBtnText?: string;
  pauseBtnText?: string;
  resumeBtnText?: string;
  getPoiName: (poi: GeoPoi) => string;
  userPos?: { lat: number; lng: number } | null;
  heroRef?: React.RefObject<HTMLDivElement>;
  onChangeLanguage?: (language: SupportedLanguage) => void;
  onUnlockLanguage?: (poi: GeoPoi, language: SupportedLanguage) => void;
  canAccessPoiLanguage?: (
    poiId: number | string | null | undefined,
    language: SupportedLanguage
  ) => boolean;
  /** Opens the "listen on your phone" QR dialog. */
  onOpenQr?: () => void;
  qrAvailable?: boolean;
}

export const PoiHero: React.FC<PoiHeroProps> = ({
  poi,
  originalIndex,
  stopNumber,
  totalStops,
  currentLang,
  isPlaying,
  isCurrent,
  playbackStatus,
  onTogglePlay,
  duration,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
  getPoiName,
  userPos,
  heroRef,
  onOpenQr,
  qrAvailable = false,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [poi.id]);

  const hasNameInLang = Boolean(poi.name[currentLang]);
  const isNameFallback = !hasNameInLang && currentLang !== 'vi';
  const displayName = getPoiName(poi);
  const displayStopNumber = stopNumber ?? originalIndex + 1;

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
      aria-label={`${displayStopNumber}. ${displayName}`}
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
          {/* The stop name is already announced by the accordion row above, so
              the detail heading is kept for assistive tech only. */}
          <h2 className="nearby-hero-title detail-title sr-only" lang={isNameFallback ? 'vi' : currentLang}>
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

          {/* Lead paragraph (first two sentences of the narration) */}
          {introText && (
            <p className="nearby-hero-intro chapter-description-measure is-clamped" lang={currentLang}>
              {introText}
            </p>
          )}

          {/* Action row: one primary action + secondary/small text actions */}
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
                  width="14"
                  height="14"
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

            <a
              className="hero-directions-btn"
              href={buildGoogleMapsDirectionsUrl(poi, userPos)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(currentLang, 'directionsAria', { name: displayName })}
            >
              <span>{t(currentLang, 'directionsBtn')}</span>
            </a>

            {onOpenQr && qrAvailable && (
              <button
                type="button"
                className="hero-qr-btn"
                onClick={onOpenQr}
                aria-haspopup="dialog"
              >
                {t(currentLang, 'qrListenOnPhone')}
              </button>
            )}

            {formattedAudioDuration && (
              <span className="hero-audio-duration sr-only">{formattedAudioDuration}</span>
            )}

            <span
              className="hero-position-indicator sr-only"
              aria-label={`${displayStopNumber} / ${totalStops}`}
            >
              {displayStopNumber} / {totalStops}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
