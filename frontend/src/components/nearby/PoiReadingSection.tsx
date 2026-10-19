import React, { useRef, useEffect, useMemo } from 'react';
import { GeoPoi, getNarration } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { SortedPoiItem } from './PoiList';
import { t } from '../../content/nearbyI18n';
import { PlaceQR, isQrAvailable, buildPoiQrUrl } from '../common/PlaceQR';
import { resolveImagePath } from './PoiCard';
import { buildPoiSections } from '../../lib/poiSections';
import { PlaybackStatus } from '../../hooks/useNearbyAudio';

interface PoiReadingSectionProps {
  activeItem: SortedPoiItem;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  isCurrent: boolean;
  playbackStatus?: PlaybackStatus;
  duration?: number;
  activeSentenceIndex?: number | null;
  activeCharOffset?: number | null;
  activeCharLength?: number;
  syncMode?: 'boundary' | 'estimate';
  audioSourceType?: string;
  prevItem: SortedPoiItem | null;
  nextItem: SortedPoiItem | null;
  onSelectPoi: (poiId: string) => void;
  onTogglePlay?: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  formattedDist?: string | null;
  listenBtnText?: string;
  pauseBtnText?: string;
  resumeBtnText?: string;
}

export const PoiReadingSection: React.FC<PoiReadingSectionProps> = ({
  activeItem,
  currentLang,
  isPlaying,
  isCurrent,
  playbackStatus,
  duration,
  activeCharOffset = null,
  activeCharLength = 0,
  syncMode = 'boundary',
  audioSourceType = 'speech',
  prevItem,
  nextItem,
  onSelectPoi,
  onTogglePlay,
  getPoiName,
  formattedDist,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
}) => {
  const { poi } = activeItem;
  const currentWordRef = useRef<HTMLSpanElement | null>(null);
  const lastUserScrollTimeRef = useRef<number>(0);

  const displayName = getPoiName(poi);
  const isNameFallback = !poi.name[currentLang] && currentLang !== 'vi';

  // Reading section is "read more" content, based strictly on the full layer:
  // If narration.full exists (vi, en): render paragraphs.
  // If narration.full does not exist (ja, ko): do not render the reading body at all.
  const fullParagraphs = getNarration(poi, currentLang, 'full');
  const showReadingBody = Boolean(fullParagraphs && fullParagraphs.length > 0);

  // Narration sections keep the text grouping + section boundaries used by the
  // word-level highlight and the middle-band auto-scroll. Per-section images
  // are intentionally not rendered in this layout (handled on another branch).
  const sections = useMemo(
    () => buildPoiSections(poi, currentLang, showReadingBody ? (fullParagraphs as string[]) : []),
    [poi, currentLang, fullParagraphs, showReadingBody]
  );

  // Track user manual scrolling with 3-second lockout window
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onUserScroll = () => {
      lastUserScrollTimeRef.current = Date.now();
    };

    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });
    window.addEventListener('keydown', onUserScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
      window.removeEventListener('keydown', onUserScroll);
    };
  }, []);

  // Precompute section boundaries in the full joined string (which joins sections with a single space)
  const paragraphRanges = useMemo(() => {
    let offset = 0;
    return sections.map((section) => {
      const start = offset;
      const end = start + section.text.length;
      offset = end + 1; // 1 space joining paragraphs in speak()
      return { start, end, text: section.text };
    });
  }, [sections]);

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  const isReadingActive =
    isCurrent &&
    isPlaying &&
    audioSourceType === 'speech' &&
    activeCharOffset !== null;

  // Which section currently contains the spoken word (for the active highlight).
  const activeSectionIndex = useMemo(() => {
    if (!isReadingActive || activeCharOffset === null) return -1;
    return paragraphRanges.findIndex(
      (range) => activeCharOffset >= range.start && activeCharOffset <= range.end
    );
  }, [isReadingActive, activeCharOffset, paragraphRanges]);

  // Middle-band scroll: only when the current word leaves the middle band
  useEffect(() => {
    if (!isReadingActive || !currentWordRef.current) return;

    // Check 3-second user manual scroll lockout
    if (Date.now() - lastUserScrollTimeRef.current < 3000) return;

    if (typeof window === 'undefined') return;

    const el = currentWordRef.current;
    if (typeof el.getBoundingClientRect !== 'function') return;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 800;

    // Middle band: between 25% and 75% of viewport, accounting for sticky header (~70px) and bottom bar (~90px)
    const bandTop = Math.max(90, vh * 0.25);
    const bandBottom = Math.min(vh - 110, vh * 0.75);

    // Only scroll if the word has left the middle band
    if (rect.top < bandTop || rect.bottom > bandBottom) {
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      el.scrollIntoView({
        block: 'center',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [isReadingActive, activeCharOffset]);

  // Left column: the POI cover image (4:3, sticky on desktop).
  const hasMedia = Boolean(poi.image || poi.slug);

  // Category label for the content header (falls back to Vietnamese like the hero).
  const categoryLabel = poi.category[currentLang] || poi.category.vi;
  const isCatFallback = !poi.category[currentLang] && currentLang !== 'vi';

  // Listen bar mirrors the hero's single-source-of-truth play/pause state.
  const isCardPlaying = isCurrent && isPlaying;
  const isCardPaused = isCurrent && !isPlaying && playbackStatus === 'paused';
  const resolvedListenText = listenBtnText || t(currentLang, 'playBtn');
  const resolvedPauseText = pauseBtnText || t(currentLang, 'pauseBtn');
  const resolvedResumeText = resumeBtnText || t(currentLang, 'resumeBtn');
  const listenLabel = isCardPlaying
    ? resolvedPauseText
    : isCardPaused
    ? resolvedResumeText
    : resolvedListenText;

  const knownSeconds =
    (isCardPlaying || isCardPaused) && duration && duration > 0 ? duration : null;
  const durationLabel = knownSeconds
    ? `${Math.floor(knownSeconds / 60)}:${String(Math.floor(knownSeconds % 60)).padStart(2, '0')}`
    : null;

  // Facts row: Address and distance
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
      : '住所';

  const distanceLabel =
    currentLang === 'vi'
      ? 'Khoảng cách'
      : currentLang === 'en'
      ? 'Distance'
      : currentLang === 'ko'
      ? '거리'
      : '距離';

  const prevLabel = prevItem
    ? t(currentLang, 'prevStop', { name: getPoiName(prevItem.poi) })
    : t(currentLang, 'prevBtn');
  const nextLabel = nextItem
    ? t(currentLang, 'nextStop', { name: getPoiName(nextItem.poi) })
    : t(currentLang, 'nextBtn');

  const qrAvailable = isQrAvailable(poi);

  const handleShare = () => {
    const url = buildPoiQrUrl(poi);
    if (!url) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({ title: displayName, text: displayName, url }).catch(() => {});
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  const renderParagraphText = (pRange: { start: number; end: number; text: string }) => {
    const paraText = pRange.text;

    // When idle or not reading, render plain text with no segment spans (uniform --fb-text-primary)
    if (!isReadingActive || activeCharOffset === null) {
      return <p className="reading-paragraph">{paraText}</p>;
    }

    const { start, end } = pRange;

    // Case 1: Entire paragraph already read
    if (activeCharOffset >= end) {
      return (
        <p className="reading-paragraph">
          <span className="reading-segment-read">{paraText}</span>
        </p>
      );
    }

    const wordLen = Math.max(1, activeCharLength || 1);
    // Case 2: Entire paragraph not yet read
    if (activeCharOffset + wordLen <= start) {
      return (
        <p className="reading-paragraph">
          <span className="reading-segment-unread">{paraText}</span>
        </p>
      );
    }

    // Case 3: Active paragraph containing current word
    // Slicing mathematically guarantees: segRead + segCurrent + segUnread === paraText
    const localWordStart = Math.max(0, activeCharOffset - start);
    const localWordEnd = Math.min(
      paraText.length,
      Math.max(localWordStart + 1, activeCharOffset + wordLen - start)
    );

    const segRead = paraText.slice(0, localWordStart);
    const segCurrent = paraText.slice(localWordStart, localWordEnd);
    const segUnread = paraText.slice(localWordEnd);

    return (
      <p className="reading-paragraph">
        {segRead.length > 0 && <span className="reading-segment-read">{segRead}</span>}
        {segCurrent.length > 0 && (
          <span ref={currentWordRef} className="reading-segment-current">
            {segCurrent}
          </span>
        )}
        {segUnread.length > 0 && <span className="reading-segment-unread">{segUnread}</span>}
      </p>
    );
  };

  return (
    <section className="nearby-reading-section" aria-label={`Nội dung thuyết minh: ${displayName}`}>
      <div className="nearby-reading-container" data-sync={syncMode}>
        <div className="poi-reading-layout">
          {/* Left column: POI image (4:3, sticky) with the QR card beneath it */}
          {(hasMedia || qrAvailable) && (
            <div className="poi-reading-aside">
              {hasMedia && (
                <div className="poi-reading-media">
                  <img
                    className="poi-reading-media-img"
                    src={resolveImagePath(poi.image, poi.slug)}
                    alt={displayName}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              {qrAvailable && (
                <div
                  className="place-qr-detail-card"
                  role="region"
                  aria-label={t(currentLang, 'qrCardAria')}
                >
                  <PlaceQR
                    poi={poi}
                    size={144}
                    lang={currentLang}
                    label={displayName}
                    orderNumber={poi.stopOrder}
                    showHint={false}
                    showActions
                  />
                  <div className="place-qr-detail-meta">
                    <div className="place-qr-detail-title">
                      <span className="place-qr-detail-order">{poi.stopOrder}</span>
                      <h4 className="place-qr-detail-name">{displayName}</h4>
                    </div>
                    <p className="place-qr-detail-hint">{t(currentLang, 'qrScanHint')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right column: name, category, listen bar, narration paragraphs, facts, QR, nav */}
          <div className="poi-reading-content">
            <header className="poi-reading-head">
              {categoryLabel && (
                <p
                  className="poi-reading-category"
                  lang={isCatFallback ? 'vi' : currentLang}
                >
                  {categoryLabel}
                </p>
              )}
              <h3 className="reading-stop-title" lang={isNameFallback ? 'vi' : currentLang}>
                {displayName}
              </h3>
            </header>

            {onTogglePlay && (
              <div className="poi-reading-listen-bar">
                <button
                  type="button"
                  className={`poi-reading-play-btn${isCardPlaying ? ' is-playing' : ''}`}
                  data-id={poi.id}
                  aria-pressed={isCardPlaying}
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
                  <span>{listenLabel}</span>
                </button>
                {durationLabel && <span className="poi-reading-duration">{durationLabel}</span>}
              </div>
            )}

            {!showReadingBody && (
              <p className="reading-body-fallback" lang={currentLang}>
                {t(currentLang, 'noTranscript')}
              </p>
            )}

            {/* Reading body: rendered only when the full narration layer exists for the current language */}
            {showReadingBody && (
              <div className="reading-body-flow" lang={currentLang} data-sync={syncMode}>
                {sections.map((_section, pIdx) => {
                  const pRange = paragraphRanges[pIdx];
                  if (!pRange) return null;
                  const isActiveSection = pIdx === activeSectionIndex;

                  return (
                    <div
                      key={pIdx}
                      ref={(el) => {
                        sectionRefs.current[pIdx] = el;
                      }}
                      className={`narration-section${isActiveSection ? ' is-active' : ''}`}
                    >
                      {renderParagraphText(pRange)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Optional facts (distance, address) */}
            {hasFacts && (
              <dl className="chapter-facts-row reading-facts-row">
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

            {/* Mobile: QR card lives under the image; the share button replaces it here */}
            {qrAvailable && (
              <button
                type="button"
                className="place-qr-share-btn"
                onClick={handleShare}
                aria-label={t(currentLang, 'qrShare')}
              >
                {t(currentLang, 'qrShare')}
              </button>
            )}

            {/* Bottom Navigation: Previous / Next buttons (min 44px hit area, disabled at ends, no chevron icons) */}
            <nav className="reading-nav-row" aria-label="Điều hướng các điểm dừng">
              <button
                type="button"
                className="panel-nav-btn btn-prev"
                disabled={!prevItem}
                onClick={() => prevItem && onSelectPoi(prevItem.poi.id)}
                aria-label={prevLabel}
              >
                <span className="nav-btn-text">{prevLabel}</span>
              </button>

              <button
                type="button"
                className="panel-nav-btn btn-next"
                disabled={!nextItem}
                onClick={() => nextItem && onSelectPoi(nextItem.poi.id)}
                aria-label={nextLabel}
              >
                <span className="nav-btn-text">{nextLabel}</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
};
