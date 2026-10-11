import React, { useState, useEffect, useRef } from 'react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { splitTranscriptIntoSentences } from '../../hooks/useNearbyAudio';
import { t } from '../../content/nearbyI18n';

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
  if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__nearbyPerf) {
    (window as any).__nearbyPerf.rendersPoiCard++;
  }

  const [imageError, setImageError] = useState(false);
  const [chapterMode, setChapterMode] = useState<'listen' | 'read'>('listen');
  const activeSentenceRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [poi.id]);

  useEffect(() => {
    if (forceReadMode) {
      setChapterMode('read');
    }
  }, [forceReadMode]);

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
      : (poi as any).audioDurationSeconds && (poi as any).audioDurationSeconds > 0
      ? (poi as any).audioDurationSeconds
      : null;

  const formattedAudioDuration = knownSeconds
    ? `${Math.floor(knownSeconds / 60)}:${String(Math.floor(knownSeconds % 60)).padStart(2, '0')}`
    : null;

  // Facts row detection: address and distance only when present
  const rawAddress = (poi as any).address;
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
          Boolean(target?.closest('.chapter-mode-switcher')) ||
          Boolean(target?.closest('.chapter-mode-switch')) ||
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
            {(poi as any).imageCredit && (
              <span className="chapter-media-credit">{(poi as any).imageCredit}</span>
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
            <span className="chapter-listened-pill" title={t(currentLang, 'listenedTitle')}>
              {t(currentLang, 'listenedBadge')}
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
                ? `${resolvedPauseText.replace('❚❚ ', '')} ${displayName}`
                : isCurrent && !isCardPlaying
                ? `${resolvedResumeText.replace('▶ ', '')} ${displayName}`
                : `${resolvedListenText.replace('▶ ', '')} ${displayName}`
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
                ? resolvedPauseText.replace('❚❚ ', '')
                : isCurrent && !isCardPlaying
                ? resolvedResumeText.replace('▶ ', '')
                : resolvedListenText.replace('▶ ', '')}
            </span>
          </button>
          {formattedAudioDuration && (
            <div className="chapter-play-meta">
              <span className="chapter-play-duration">{formattedAudioDuration}</span>
            </div>
          )}
        </div>

        {/* 6. "Nghe | Đọc" mode switch */}
        <div className="chapter-mode-toggle-wrap">
          <div
            className="chapter-mode-switcher"
            role="tablist"
            aria-label={t(currentLang, 'modeSwitchAria', { name: displayName })}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="tab"
              aria-selected={chapterMode === 'listen'}
              className={`mode-switch-btn ${chapterMode === 'listen' ? 'is-active' : ''}`}
              onClick={() => setChapterMode('listen')}
            >
              {t(currentLang, 'modeListen')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={chapterMode === 'read'}
              className={`mode-switch-btn ${chapterMode === 'read' ? 'is-active' : ''}`}
              onClick={() => setChapterMode('read')}
            >
              {t(currentLang, 'modeRead')}
            </button>
          </div>
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
    </article>
  );
});
