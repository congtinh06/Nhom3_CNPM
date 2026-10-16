import React, { useRef, useEffect, useMemo } from 'react';
import { GeoPoi, getNarration } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { SortedPoiItem } from './PoiList';
import { t } from '../../content/nearbyI18n';
import { PlaceQR, isQrAvailable, buildPoiQrUrl } from '../common/PlaceQR';

interface PoiReadingSectionProps {
  activeItem: SortedPoiItem;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  isCurrent: boolean;
  activeSentenceIndex?: number | null;
  activeCharOffset?: number | null;
  activeCharLength?: number;
  syncMode?: 'boundary' | 'estimate';
  audioSourceType?: string;
  prevItem: SortedPoiItem | null;
  nextItem: SortedPoiItem | null;
  onSelectPoi: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  formattedDist?: string | null;
}

export const PoiReadingSection: React.FC<PoiReadingSectionProps> = ({
  activeItem,
  currentLang,
  isPlaying,
  isCurrent,
  activeCharOffset = null,
  activeCharLength = 0,
  syncMode = 'boundary',
  audioSourceType = 'speech',
  prevItem,
  nextItem,
  onSelectPoi,
  getPoiName,
  formattedDist,
}) => {
  const { poi } = activeItem;
  const currentWordRef = useRef<HTMLSpanElement | null>(null);
  const lastUserScrollTimeRef = useRef<number>(0);

  const displayName = getPoiName(poi);
  // Reading section is "read more" content, based strictly on the full layer:
  // If narration.full exists (vi, en): render paragraphs.
  // If narration.full does not exist (ja, ko): do not render the reading body at all.
  const fullParagraphs = getNarration(poi, currentLang, 'full');
  const showReadingBody = Boolean(fullParagraphs && fullParagraphs.length > 0);
  const displayParagraphs: string[] = showReadingBody ? (fullParagraphs as string[]) : [];

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

  // Precompute paragraph boundaries in the full joined string (which joins paragraphs with a single space)
  const paragraphRanges = useMemo(() => {
    let offset = 0;
    return displayParagraphs.map((para) => {
      const start = offset;
      const end = start + para.length;
      offset = end + 1; // 1 space joining paragraphs in speak()
      return { start, end, text: para };
    });
  }, [displayParagraphs]);

  const isReadingActive =
    isCurrent &&
    isPlaying &&
    audioSourceType === 'speech' &&
    activeCharOffset !== null;

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

  return (
    <section className="nearby-reading-section" aria-label={`Nội dung thuyết minh: ${displayName}`}>
      <div className="nearby-reading-container" data-sync={syncMode}>
        {/* Reading body: rendered only when the full narration layer exists for the current language */}
        {showReadingBody && (
          <>
            <h3 className="reading-stop-title">{displayName}</h3>

            {/* Reading body: Comfortable 720px max-width, 17px font, 1.7 line height, no inner scroll */}
            <div className="reading-body-flow" lang={currentLang} data-sync={syncMode}>
              {paragraphRanges.map((pRange, pIdx) => {
                const paraText = pRange.text;

                // When idle or not reading, render plain text with no segment spans (uniform --fb-text-primary)
                if (!isReadingActive || activeCharOffset === null) {
                  return (
                    <p key={pIdx} className="reading-paragraph">
                      {paraText}
                    </p>
                  );
                }

                const { start, end } = pRange;

                // Case 1: Entire paragraph already read
                if (activeCharOffset >= end) {
                  return (
                    <p key={pIdx} className="reading-paragraph">
                      <span className="reading-segment-read">{paraText}</span>
                    </p>
                  );
                }

                const wordLen = Math.max(1, activeCharLength || 1);
                // Case 2: Entire paragraph not yet read
                if (activeCharOffset + wordLen <= start) {
                  return (
                    <p key={pIdx} className="reading-paragraph">
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
                  <p key={pIdx} className="reading-paragraph">
                    {segRead.length > 0 && (
                      <span className="reading-segment-read">{segRead}</span>
                    )}
                    {segCurrent.length > 0 && (
                      <span ref={currentWordRef} className="reading-segment-current">
                        {segCurrent}
                      </span>
                    )}
                    {segUnread.length > 0 && (
                      <span className="reading-segment-unread">{segUnread}</span>
                    )}
                  </p>
                );
              })}
            </div>
          </>
        )}

        {/* Optional facts (address, distance) */}
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

        {/* QR card: listen on a phone. Hidden on mobile (share button shown instead). */}
        {qrAvailable && (
          <div className="place-qr-detail-wrap">
            <div
              className="place-qr-detail-card"
              role="region"
              aria-label={t(currentLang, 'qrCardAria')}
            >
              <PlaceQR
                poi={poi}
                size={128}
                lang={currentLang}
                label={displayName}
                showActions
              />
            </div>
            <button
              type="button"
              className="place-qr-share-btn"
              onClick={handleShare}
              aria-label={t(currentLang, 'qrShare')}
            >
              {t(currentLang, 'qrShare')}
            </button>
          </div>
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
    </section>
  );
};
