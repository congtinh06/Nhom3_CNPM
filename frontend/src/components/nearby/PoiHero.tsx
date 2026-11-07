import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GeoPoi, getHeroIntroText, getNarration } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { resolveImagePath } from './PoiCard';
import { NATIVE_LANG_NAMES, t } from '../../content/nearbyI18n';
import { PlaybackStatus } from '../../hooks/useNearbyAudio';
import { buildGoogleMapsDirectionsUrl } from '../../utils/directions';

const WAVEFORM_BAR_COUNT = 56;

const formatClock = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

export function estimatePoiDurationSeconds(
  poi: GeoPoi,
  lang: SupportedLanguage,
  activeDuration?: number,
  isCurrent?: boolean
): number {
  if (isCurrent && activeDuration && activeDuration > 0) {
    return Math.round(activeDuration);
  }
  const rawAudio = poi.audio?.[lang];
  if (typeof rawAudio === 'number' && rawAudio > 0) {
    return Math.round(rawAudio);
  }
  const fullParas = getNarration(poi, lang, 'full');
  const text =
    fullParas && fullParas.length > 0
      ? fullParas.join(' ')
      : getNarration(poi, lang, 'short') || poi.transcript?.[lang] || '';
  return text.trim() ? Math.max(14, Math.round(text.length / 10)) : 0;
}

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
  currentTime?: number;
  estimatedDuration?: number;
  isContentLocked?: boolean;
  onSeek?: (poiId: string, timeSec: number) => void;
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
  hasAudioError?: boolean;
  onRetryAudio?: () => void;
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
  currentTime = 0,
  estimatedDuration,
  isContentLocked = false,
  onSeek,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
  getPoiName,
  userPos,
  heroRef,
  onOpenQr,
  qrAvailable = false,
  hasAudioError = false,
  onRetryAudio,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
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

  const displayTotalSeconds = useMemo(
    () =>
      estimatedDuration && estimatedDuration > 0
        ? estimatedDuration
        : estimatePoiDurationSeconds(poi, currentLang, duration, isCurrent),
    [estimatedDuration, poi, currentLang, duration, isCurrent]
  );

  const clampedTime = useMemo(() => {
    if (displayTotalSeconds <= 0) return 0;
    return Math.max(0, Math.min(displayTotalSeconds, currentTime));
  }, [currentTime, displayTotalSeconds]);

  const progressRatio = displayTotalSeconds > 0 ? clampedTime / displayTotalSeconds : 0;
  const progressPercent = Math.round(progressRatio * 100);
  const filledBars = Math.round(progressRatio * WAVEFORM_BAR_COUNT);

  const barHeights = useMemo(
    () =>
      Array.from({ length: WAVEFORM_BAR_COUNT }, (_, k) =>
        Math.round(
          22 +
            Math.abs(
              Math.sin((k + 3) * (originalIndex + 2) * 0.61) + Math.sin(k * 0.9 + originalIndex)
            ) *
              34
        )
      ),
    [originalIndex]
  );

  const handleWaveformClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek || displayTotalSeconds <= 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) return;
      const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      onSeek(poi.id, Math.floor(fraction * displayTotalSeconds));
    },
    [onSeek, poi.id, displayTotalSeconds]
  );

  const handleWaveformKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onSeek || displayTotalSeconds <= 0) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const delta = event.key === 'ArrowRight' ? 5 : -5;
        const nextTime = Math.max(0, Math.min(displayTotalSeconds, clampedTime + delta));
        onSeek(poi.id, nextTime);
      }
    },
    [onSeek, poi.id, displayTotalSeconds, clampedTime]
  );

  const hasValidImage = Boolean((poi.image || poi.slug) && !imageError);

  return (
    <section
      ref={heroRef}
      className={`nearby-hero-section ${hasValidImage ? 'has-media' : 'no-media'}`}
      aria-label={`${displayStopNumber}. ${displayName}`}
      id="active-stop-hero"
    >
      <div className="nearby-hero-container">
        {/* a. 16:9 image, rendered ONLY if image resolves */}
        {hasValidImage && (
          <div className={`nearby-hero-media${imageLoaded ? ' is-loaded' : ' is-loading'}`}>
            <img
              src={resolveImagePath(poi.image, poi.slug)}
              alt={displayName}
              className="hero-media-img"
              width={800}
              height={450}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* b. 56-bar interactive waveform + tabular time row */}
        {!isContentLocked && displayTotalSeconds > 0 && (
          <div className="nearby-waveform-block">
            <div
              className={`wf${isCurrent && playbackStatus === 'loading' ? ' is-loading' : ''}`}
              role="slider"
              tabIndex={0}
              aria-label={t(currentLang, 'waveformAria')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              onClick={handleWaveformClick}
              onKeyDown={handleWaveformKeyDown}
            >
              {barHeights.map((heightPct, idx) => (
                <i
                  key={idx}
                  className={idx < filledBars ? 'f' : undefined}
                  style={{ height: `${heightPct}%` }}
                />
              ))}
            </div>
            <div className="tm2">
              <span>{formatClock(clampedTime)}</span>
              <span>{formatClock(displayTotalSeconds)}</span>
            </div>
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
            <p className="hero-local-name-line sr-only" lang="vi">
              <span className="local-name-label">{t(currentLang, 'localNameLabel')}: </span>
              <span className="local-name-value">{poi.name.vi}</span>
            </p>
          )}

          {/* Lead paragraph preserved for assistive tech / unit contracts */}
          {introText && (
            <p className="nearby-hero-intro chapter-description-measure is-clamped sr-only" lang={currentLang}>
              {introText}
            </p>
          )}

          {/* f. Action row: 52px circular accent play button + two-line label left, line-icon actions right */}
          <div className="acts hero-actions-row">
            <button
              type="button"
              className="pbtn detail-play-btn"
              data-id={poi.id}
              aria-pressed={isCardPlaying}
              aria-label={
                isCardPlaying
                  ? `${resolvedPauseText} ${displayName}`
                  : isCurrent && !isCardPlaying
                  ? `${resolvedResumeText} ${displayName}`
                  : `${resolvedListenText} ${displayName}`
              }
              onClick={() => onTogglePlay(poi.id)}
            >
              <span className="pc" aria-hidden="true">
                {isCardPlaying ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="play-icon-svg">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </span>
              <span className="pt2">
                <b className="chapter-play-label">
                  {isCardPlaying ? resolvedPauseText : t(currentLang, 'listenThisStop')}
                </b>
                {displayTotalSeconds > 0 && (
                  <small>
                    <span>{formatClock(displayTotalSeconds)}</span>
                    <span className="meta-dot-sep" aria-hidden="true" />
                    <span>{NATIVE_LANG_NAMES[currentLang]}</span>
                  </small>
                )}
              </span>
            </button>

            <span className="sec">
              <a
                className="ab hero-directions-btn"
                href={buildGoogleMapsDirectionsUrl(poi, userPos)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(currentLang, 'directionsAria', { name: displayName })}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 11l16-7-7 16-2-7z" />
                </svg>
                <span>{t(currentLang, 'directionsBtn')}</span>
              </a>

              {onOpenQr && qrAvailable && (
                <button
                  type="button"
                  className="ab hero-qr-btn"
                  onClick={onOpenQr}
                  aria-haspopup="dialog"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="7" y="2.5" width="10" height="19" rx="2" />
                    <path d="M11 18h2" />
                  </svg>
                  <span>{t(currentLang, 'onPhoneBtn')}</span>
                </button>
              )}
            </span>

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

          {hasAudioError && (
            <div className="hero-audio-error-row" role="alert">
              <span>{t(currentLang, 'audioLoadError')}</span>
              {onRetryAudio && (
                <button
                  type="button"
                  className="hero-audio-retry-btn"
                  onClick={onRetryAudio}
                >
                  {t(currentLang, 'retryBtn')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
