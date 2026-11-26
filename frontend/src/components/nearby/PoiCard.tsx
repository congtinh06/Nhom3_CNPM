import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { splitTranscriptIntoSentences } from '../../hooks/useNearbyAudio';
import { t } from '../../content/nearbyI18n';
import { POI_QR_LIFETIME_SECONDS, PlaceQR, isQrAvailable } from '../common/PlaceQR';

export const resolveImagePath = (imgPath?: string, slug?: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  if (slug) {
    return `${cleanBase}pois/${slug}.jpg`;
  }
  if (!imgPath) return '';
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  const cleanPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
  return `${cleanBase}${cleanPath}`;
};

export interface PoiCardProps {
  poi: GeoPoi;
  originalIndex: number;
  isSelected: boolean;
  isActive: boolean;
  isHovered: boolean;
  isPlaying: boolean;
  isCurrent: boolean;
  currentLang: SupportedLanguage;
  roundedDist?: number | null;
  formattedDist?: string | null;
  formattedDistText?: string | null;
  inTriggerZone: boolean;
  inRadius: boolean;
  activeSentenceIndex: number | null;
  forceReadMode?: boolean;
  isListened?: boolean;
  duration?: number;
  onSelect: (id: string) => void;
  onHover: (id: string, hovered: boolean) => void;
  onTogglePlay: (id: string) => void;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  poiName: string;
  poiCategory: string;
  inZoneBadgeText?: string;
  nearBadgeText?: string;
  langVoiceAriaText?: string;
  listenBtnText?: string;
  pauseBtnText?: string;
  resumeBtnText?: string;
}

export const PoiCard = React.memo<PoiCardProps>(function PoiCard({
  poi,
  originalIndex,
  isSelected,
  isActive,
  isHovered,
  isPlaying,
  isCurrent,
  currentLang,
  formattedDist,
  inTriggerZone,
  inRadius,
  activeSentenceIndex,
  forceReadMode = false,
  isListened = false,
  duration,
  onSelect,
  onHover,
  onTogglePlay,
  poiName,
  poiCategory,
  inZoneBadgeText,
  nearBadgeText,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
}) {
  if (import.meta.env.DEV && typeof window !== 'undefined' && (window as { __nearbyPerf?: { rendersPoiCard: number } }).__nearbyPerf) {
    (window as { __nearbyPerf?: { rendersPoiCard: number } }).__nearbyPerf!.rendersPoiCard++;
  }

  const [imageError, setImageError] = useState(false);
  const [chapterMode, setChapterMode] = useState<'listen' | 'read'>('listen');
  const [qrOpen, setQrOpen] = useState(false);
  const activeSentenceRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [poi.id]);

  useEffect(() => {
    if (forceReadMode) {
      setChapterMode('read');
    }
  }, [forceReadMode]);

  useEffect(() => {
    if (!qrOpen || typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQrOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [qrOpen]);

  const qrAvailable = isQrAvailable(poi);

  const isCardPlaying = isCurrent && isPlaying;

  // Content field fallback detection
  const hasNameInLang = Boolean(poi.name[currentLang]);
  const isNameFallback = !hasNameInLang && currentLang !== 'vi';
  const displayName = poiName || (hasNameInLang ? poi.name[currentLang] : poi.name.vi);

  const hasCatInLang = Boolean(poi.category[currentLang]);
  const isCatFallback = !hasCatInLang && currentLang !== 'vi';
  const displayCat = poiCategory || (hasCatInLang ? poi.category[currentLang] : poi.category.vi);

  // Active transcript text & fallback detection
  const hasTxInCurrentLang = Boolean(poi.transcript[currentLang]);
  const activeTranscriptText = hasTxInCurrentLang
    ? poi.transcript[currentLang]
    : poi.transcript.vi || '';

  const sentences = splitTranscriptIntoSentences(activeTranscriptText);

  // Auto-scroll active sentence with block: "nearest"
  useEffect(() => {
    if (isCurrent && isPlaying && chapterMode === 'read' && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isCurrent, isPlaying, chapterMode, activeSentenceIndex]);

  const hasValidImage = Boolean((poi.image || poi.slug) && !imageError);

  const resolvedListenText = listenBtnText || t(currentLang, 'playBtn');
  const resolvedPauseText = pauseBtnText || t(currentLang, 'pauseBtn');
  const resolvedResumeText = resumeBtnText || t(currentLang, 'resumeBtn');

  // Audio duration calculation
  const knownSeconds =
    isCurrent && duration && duration > 0
      ? duration
      : (poi as { audioDurationSeconds?: number }).audioDurationSeconds && (poi as { audioDurationSeconds?: number }).audioDurationSeconds! > 0
      ? (poi as { audioDurationSeconds?: number }).audioDurationSeconds
      : null;

  const formattedAudioDuration = knownSeconds
    ? `${Math.floor(knownSeconds / 60)}:${String(Math.floor(knownSeconds % 60)).padStart(2, '0')}`
    : null;

  // Facts row detection: address and distance only when present
  const rawAddress = (poi as { address?: string | Record<string, string> }).address;
  const addressVal =
    typeof rawAddress === 'object' && rawAddress !== null
      ? rawAddress[currentLang] || rawAddress.vi
      : typeof rawAddress === 'string'
      ? rawAddress
      : null;
  const hasDistance = Boolean(formattedDist);
  const hasFacts = Boolean(addressVal || hasDistance);

  const addressLabel =
    currentLang === 'vi'
      ? 'Địa chỉ'
      : currentLang === 'en'
      ? 'Address'
      : currentLang === 'ko'
      ? '주소'
      : currentLang === 'ja'
      ? '住所'
      : '地址';

  const distanceLabel =
    currentLang === 'vi'
      ? 'Khoảng cách'
      : currentLang === 'en'
      ? 'Distance'
      : currentLang === 'ko'
      ? '거리'
      : currentLang === 'ja'
      ? '距離'
      : '距离';

  return (
    <article
      className={`nearby-chapter-card ${isSelected ? 'is-selected sel' : ''} ${
        isActive ? 'is-active' : ''
      } ${isHovered ? 'is-hovered' : ''} ${isCardPlaying ? 'is-playing playing' : ''}`}
      data-id={poi.id}
      data-slug={poi.slug || poi.id}
      onClick={() => onSelect(poi.id)}
      onMouseEnter={() => onHover(poi.id, true)}
      onMouseLeave={() => onHover(poi.id, false)}
      tabIndex={0}
      aria-label={`${originalIndex + 1}. ${displayName}`}
      onKeyDown={(e) => {
        const target = e.target as HTMLElement | null;
        const tagName = target?.tagName.toLowerCase();
        const isInteractive =
          tagName === 'button' ||
          tagName === 'a' ||
          tagName === 'input' ||
          tagName === 'select' ||
          tagName === 'textarea' ||
          target?.isContentEditable ||
          Boolean(target?.closest('[role="button"]')) ||
          Boolean(target?.closest('.accordion')) ||
          Boolean(target?.closest('[aria-expanded]'));
        if (isInteractive) return;

        if (e.key === 'Enter') {
          e.preventDefault();
          onSelect(poi.id);
        } else if (e.code === 'Space') {
          e.preventDefault();
          onTogglePlay(poi.id);
        }
      }}
    >
      <div className="chapter-inner-content">
        {/* 1. Media block at top (only if image resolves, no placeholder, no empty space) */}
        {hasValidImage && (
          <div className="chapter-media-frame">
            <picture className="chapter-media-picture">
              <source srcSet={`/pois/${poi.slug || poi.id}.webp`} type="image/webp" />
              <source srcSet={`/pois/${poi.slug || poi.id}.jpg`} type="image/jpeg" />
              <source srcSet={`/pois/${poi.slug || poi.id}.png`} type="image/png" />
              <img
                alt=""
                loading="lazy"
                decoding="async"
                src={resolveImagePath(poi.image, poi.slug)}
                onError={() => setImageError(true)}
              />
            </picture>
            {(poi as { imageCredit?: string }).imageCredit && (
              <span className="chapter-media-credit">{(poi as { imageCredit?: string }).imageCredit}</span>
            )}
          </div>
        )}

        {/* 2. Category badge & status pills */}
        <div className="chapter-meta-top">
          <span className="chapter-category-badge" lang={isCatFallback ? 'vi' : currentLang}>
            {displayCat}
            {isCatFallback && (
              <span className="chapter-content-fallback-tag">
                ({t(currentLang, 'vietnameseContentNote')})
              </span>
            )}
          </span>
          {isListened && (
            <span className="stop-row-listened" title={t(currentLang, 'listenedTitle')}>
              <Check size={14} />
            </span>
          )}
          {inTriggerZone && (
            <span className="chapter-zone-badge in-zone">
              {inZoneBadgeText || t(currentLang, 'inZoneBadge')}
            </span>
          )}
          {!inTriggerZone && inRadius && (
            <span className="chapter-zone-badge near-zone">
              {nearBadgeText || t(currentLang, 'nearBadge')}
            </span>
          )}
        </div>

        {/* 3. Title (no numeral collision) */}
        <h2 className="detail-title chapter-title" lang={isNameFallback ? 'vi' : currentLang}>
          {displayName}
          {isNameFallback && (
            <span className="chapter-content-fallback-tag">
              ({t(currentLang, 'vietnameseContentNote')})
            </span>
          )}
        </h2>

        {/* 4. Secondary local-name line (if not Vietnamese) */}
        {currentLang !== 'vi' && (
          <p className="chapter-local-name-line" lang="vi">
            <span className="local-name-label">{t(currentLang, 'localNameLabel')}: </span>
            <span className="local-name-value">{poi.name.vi}</span>
          </p>
        )}

        {/* 5. Primary "Phát" button row */}
        <div className="chapter-play-row">
          <button
            className="detail-play-btn"
            type="button"
            data-id={poi.id}
            aria-label={
              isCardPlaying
                ? `${resolvedPauseText} ${displayName}`
                : isCurrent && !isCardPlaying
                ? `${resolvedResumeText} ${displayName}`
                : `${resolvedListenText} ${displayName}`
            }
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay(poi.id);
            }}
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
          {qrAvailable && (
            <button
              type="button"
              className="chapter-qr-btn"
              data-id={poi.id}
              title={t(currentLang, 'qrShowBtn')}
              aria-label={t(currentLang, 'qrShowBtn')}
              onClick={(e) => {
                e.stopPropagation();
                setQrOpen(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v4h-2v-4zm-4 4h2v2h-2v-2zm4 2h2v2h-2v-2z" />
              </svg>
            </button>
          )}
          {formattedAudioDuration && (
            <div className="chapter-play-meta">
              <span className="chapter-play-duration">{formattedAudioDuration}</span>
            </div>
          )}
        </div>



        {/* Untranslated notice under mode switch */}
        {!hasTxInCurrentLang && (
          <p className="chapter-untranslated-notice">
            {t(currentLang, 'noTranscript')}
          </p>
        )}

        {/* 7. The text: 2-line clamped in Nghe mode, full text in Đọc mode */}
        {chapterMode === 'listen' ? (
          <div className="chapter-description-wrap">
            <p
              className="chapter-description-measure is-clamped"
              lang={!hasTxInCurrentLang ? 'vi' : currentLang}
            >
              {activeTranscriptText}
            </p>
          </div>
        ) : (
          <div
            className="chapter-transcript-reader-box"
            role="region"
            aria-label={t(currentLang, 'readerBoxAria', { name: displayName })}
          >
            <div
              className="transcript-sentences-flow"
              lang={!hasTxInCurrentLang ? 'vi' : currentLang}
            >
              {sentences.map((item, idx) => {
                const isSentenceActive = isCurrent && isPlaying && activeSentenceIndex === idx;
                return (
                  <span
                    key={idx}
                    ref={isSentenceActive ? activeSentenceRef : null}
                    className={`transcript-sentence-node ${
                      isSentenceActive ? 'is-highlighted-sentence' : ''
                    }`}
                  >
                    {item.sentence}{' '}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. Facts row */}
        {hasFacts && (
          <dl className="chapter-facts-row">
            {addressVal && (
              <div className="chapter-fact-pair">
                <dt className="chapter-fact-label">{addressLabel}:</dt>
                <dd className="chapter-fact-value">{addressVal}</dd>
              </div>
            )}
            {hasDistance && (
              <div className="chapter-fact-pair">
                <dt className="chapter-fact-label">{distanceLabel}:</dt>
                <dd className="chapter-fact-value">{formattedDist}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {qrOpen && qrAvailable && (
        <div
          className="place-qr-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t(currentLang, 'qrModalTitle')}
          onClick={(e) => {
            e.stopPropagation();
            setQrOpen(false);
          }}
        >
          <div className="place-qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="place-qr-modal-head">
              <span className="place-qr-modal-title">{t(currentLang, 'qrModalTitle')}</span>
              <button
                type="button"
                className="place-qr-modal-close"
                aria-label="Đóng"
                onClick={() => setQrOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="place-qr-modal-name">{displayName}</p>
            <PlaceQR
              poi={poi}
              size={220}
              lang={currentLang}
              label={displayName}
              showActions
              expiresInSeconds={POI_QR_LIFETIME_SECONDS}
            />
          </div>
        </div>
      )}
    </article>
  );
});
