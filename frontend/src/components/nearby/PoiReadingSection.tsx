import React, { useRef, useEffect, useMemo } from 'react';
import { Lock } from 'lucide-react';
import { GeoPoi, getNarration } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { SortedPoiItem } from './PoiList';
import { t } from '../../content/nearbyI18n';
import { buildPoiSections } from '../../lib/poiSections';
import { PlaybackStatus } from '../../hooks/useNearbyAudio';

interface PoiReadingSectionProps {
  activeItem: SortedPoiItem;
  currentLang: SupportedLanguage;
  /** POI này chưa mở gói ngoại ngữ: thay nội dung bài thuyết minh bằng khối CTA. */
  isContentLocked?: boolean;
  onUnlockContent?: () => void;
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

const CONTENT_LOCK_COPY: Record<
  SupportedLanguage,
  { title: string; description: string; cta: string }
> = {
  vi: {
    title: 'Nội dung ngoại ngữ đang khóa',
    description:
      'Mở khóa gói ngoại ngữ của điểm thuyết minh này (hoặc gói Premium) để đọc bài thuyết minh.',
    cta: 'Mở khóa điểm này',
  },
  en: {
    title: 'Foreign-language content is locked',
    description:
      "Unlock this stop's narration package (or get Premium) to read the guided story.",
    cta: 'Unlock this stop',
  },
  ja: {
    title: '外国語コンテンツはロック中です',
    description:
      'この場所のナレーションパッケージ（または Premium）を解除すると読めます。',
    cta: 'この場所を解除',
  },
  ko: {
    title: '외국어 콘텐츠가 잠겨 있습니다',
    description: '이 명소의 해설 패키지(또는 Premium)를 해제하면 읽을 수 있습니다.',
    cta: '이 명소 해제',
  },
};

export const PoiReadingSection: React.FC<PoiReadingSectionProps> = ({
  activeItem,
  currentLang,
  isContentLocked = false,
  onUnlockContent,
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
  const isNameFallback = !poi.name[currentLang] && currentLang !== 'vi';

  // Reading section is "read more" content, based strictly on the full layer:
  // If narration.full exists (vi, en): render paragraphs.
  // If narration.full does not exist (ja, ko): do not render the reading body at all.
  const fullParagraphs = getNarration(poi, currentLang, 'full');
  const showReadingBody = Boolean(fullParagraphs && fullParagraphs.length > 0);

  // Narration sections keep the text grouping + section boundaries used by the
  // word-level highlight and the middle-band auto-scroll.
  const sections = useMemo(
    () => buildPoiSections(poi, currentLang, showReadingBody ? (fullParagraphs as string[]) : []),
    [poi, currentLang, fullParagraphs, showReadingBody]
  );

  // Tiêu đề chap hiển thị ở đoạn đầu tiên của từng phân đoạn bài thuyết minh.
  const chapterTitleBySection = useMemo(() => {
    const chapterBlocks = poi.narration?.chapters?.[currentLang];
    if (!chapterBlocks || chapterBlocks.length === 0) return null;
    const map = new Map<number, string>();
    let sectionIndex = 0;
    for (const block of chapterBlocks) {
      for (let i = 0; i < block.paras.length; i++) {
        if (sectionIndex >= sections.length) break;
        if (block.title && !map.has(sectionIndex)) map.set(sectionIndex, block.title);
        sectionIndex++;
      }
      if (sectionIndex >= sections.length) break;
    }
    return map.size > 0 ? map : null;
  }, [poi, currentLang, sections]);

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
          {/* The stop name already lives on the accordion row above, so the
              heading is kept for assistive tech only. */}
          <header className="poi-reading-head sr-only">
            <h3 className="reading-stop-title" lang={isNameFallback ? 'vi' : currentLang}>
              {displayName}
            </h3>
          </header>

          {!showReadingBody && !isContentLocked && (
            <p className="reading-body-fallback" lang={currentLang}>
              {t(currentLang, 'noTranscript')}
            </p>
          )}

          {isContentLocked && (
            <div className="poi-content-lock" role="region" aria-live="polite">
              <span className="poi-content-lock-icon" aria-hidden="true">
                <Lock size={22} strokeWidth={1.8} />
              </span>
              <strong>{CONTENT_LOCK_COPY[currentLang].title}</strong>
              <p lang={currentLang}>{CONTENT_LOCK_COPY[currentLang].description}</p>
              {onUnlockContent && (
                <button type="button" onClick={onUnlockContent}>
                  {CONTENT_LOCK_COPY[currentLang].cta}
                </button>
              )}
            </div>
          )}

          {/* Reading body: rendered only when the full narration layer exists for the current language */}
          {showReadingBody && !isContentLocked && (
            <div className="reading-body-flow" lang={currentLang} data-sync={syncMode}>
              {sections.map((_section, pIdx) => {
                const pRange = paragraphRanges[pIdx];
                if (!pRange) return null;
                const isActiveSection = pIdx === activeSectionIndex;
                const chapterTitle = chapterTitleBySection?.get(pIdx);

                return (
                  <div
                    key={pIdx}
                    ref={(el) => {
                      sectionRefs.current[pIdx] = el;
                    }}
                    className={`narration-section${isActiveSection ? ' is-active' : ''}`}
                  >
                    {chapterTitle && (
                      <h4 className="reading-chapter-title" lang={currentLang}>
                        {chapterTitle}
                      </h4>
                    )}
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

          {/* Bottom Navigation: ONE line Next link, drop Previous button and its box */}
          <nav className="reading-nav-row" aria-label="Điều hướng các điểm dừng">
            <button
              type="button"
              className="panel-nav-btn btn-prev sr-only"
              disabled={!prevItem}
              onClick={() => prevItem && onSelectPoi(prevItem.poi.id)}
              aria-label={prevLabel}
            >
              <span className="nav-btn-text">{prevLabel}</span>
            </button>

            {nextItem && (
              <button
                type="button"
                className="panel-nav-btn btn-next"
                onClick={() => onSelectPoi(nextItem.poi.id)}
                aria-label={nextLabel}
              >
                <span className="nav-btn-text">{nextLabel}</span>
              </button>
            )}
            {!nextItem && (
              <button
                type="button"
                className="panel-nav-btn btn-next sr-only"
                disabled
                aria-hidden="true"
              >
                <span className="nav-btn-text">{nextLabel}</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </section>
  );
};
