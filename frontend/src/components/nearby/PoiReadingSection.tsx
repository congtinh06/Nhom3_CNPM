import React, { useRef, useEffect, useMemo } from 'react';
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
  effectiveTime?: number;
  totalDuration?: number;
  hasUserSeeked?: boolean;
  onSeek?: (poiId: string, timeSec: number) => void;
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

interface SentenceToken {
  text: string;
  trailingSpace: string;
  localStart: number;
  localEnd: number;
}

interface IndexedSentence extends SentenceToken {
  globalIdx: number;
  pIdx: number;
  globalStart: number;
  globalEnd: number;
}

const formatChapterClock = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

function splitIntoSentenceTokens(text: string): SentenceToken[] {
  if (!text) return [];
  const tokens: SentenceToken[] = [];
  const regex = /(?:[^.!?。！？]|\.(?=\S))+(?:[.!?。！？]+['"”’)\]]*)?(\s*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = match[0];
    if (!fullMatch) break;
    const prefix = match.index > cursor ? text.slice(cursor, match.index) : '';
    const trailingSpace = match[1] ?? '';
    const body = fullMatch.slice(0, fullMatch.length - trailingSpace.length);
    const coreText = prefix + body;
    const localStart = cursor;
    const localEnd = localStart + coreText.length;
    tokens.push({
      text: coreText,
      trailingSpace,
      localStart,
      localEnd,
    });
    cursor = match.index + fullMatch.length;
  }

  if (cursor < text.length) {
    tokens.push({
      text: text.slice(cursor),
      trailingSpace: '',
      localStart: cursor,
      localEnd: text.length,
    });
  }

  return tokens;
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
  effectiveTime,
  totalDuration,
  hasUserSeeked = false,
  onSeek,
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

  const isPanelMode = totalDuration !== undefined;
  const resolvedTime = effectiveTime ?? 0;
  const resolvedTotalDuration = totalDuration ?? 0;

  const displayName = getPoiName(poi);
  const isNameFallback = !poi.name[currentLang] && currentLang !== 'vi';

  // Reading section is "read more" content, based strictly on the full layer:
  // If narration.full exists (vi, en, ja, ko): render paragraphs.
  // If narration.full does not exist: do not render the reading body at all.
  const fullParagraphs = getNarration(poi, currentLang, 'full');
  const showReadingBody = Boolean(fullParagraphs && fullParagraphs.length > 0);

  // Narration sections keep the text grouping + section boundaries used by the
  // word-level highlight and the middle-band auto-scroll.
  const sections = useMemo(
    () => buildPoiSections(poi, currentLang, showReadingBody ? (fullParagraphs as string[]) : []),
    [poi, currentLang, fullParagraphs, showReadingBody]
  );

  // Tiêu đề chap hiển thị ở đoạn đầu tiên của từng phân đoạn bài thuyết minh (chỉ dùng cho chế độ độc lập).
  const chapterTitleBySection = useMemo(() => {
    if (isPanelMode) return null;
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
  }, [isPanelMode, poi, currentLang, sections]);

  // 1d. Chapters list (only if data exists in poi.narration.chapters[currentLang])
  const chapterItems = useMemo(() => {
    const rawBlocks = poi.narration?.chapters?.[currentLang];
    if (!rawBlocks || rawBlocks.length === 0) return [];

    const validBlocks = rawBlocks.filter((b) => Boolean(b.title && b.title.trim()));
    if (validBlocks.length === 0) return [];

    const totalBlockChars = rawBlocks.reduce(
      (sum, b) => sum + (b.paras || []).reduce((pSum, p) => pSum + p.length + 1, 0),
      0
    );

    let charCursor = 0;
    const items: Array<{ title: string; startSec: number }> = [];

    rawBlocks.forEach((block, idx) => {
      const explicitStart = (block as { startSec?: number }).startSec;
      const startSec =
        typeof explicitStart === 'number' && Number.isFinite(explicitStart) && explicitStart >= 0
          ? Math.floor(explicitStart)
          : totalBlockChars > 0 && resolvedTotalDuration > 0
          ? Math.floor((charCursor / totalBlockChars) * resolvedTotalDuration)
          : resolvedTotalDuration > 0
          ? Math.floor((resolvedTotalDuration * idx) / rawBlocks.length)
          : 0;

      if (block.title && block.title.trim()) {
        items.push({ title: block.title.trim(), startSec });
      }
      charCursor += (block.paras || []).reduce((pSum, p) => pSum + p.length + 1, 0);
    });

    return items;
  }, [poi, currentLang, resolvedTotalDuration]);

  // 1e. "Điều nên biết" table (only if data exists in poi.tips[currentLang])
  const tipItems = useMemo(() => {
    const rawTips = (
      poi as unknown as {
        tips?: Partial<
          Record<SupportedLanguage, Array<{ label: string; value: string } | [string, string]>>
        >;
      }
    ).tips?.[currentLang];
    if (!Array.isArray(rawTips) || rawTips.length === 0) return [];

    return rawTips
      .map((entry) => {
        if (Array.isArray(entry)) {
          return { label: String(entry[0] ?? '').trim(), value: String(entry[1] ?? '').trim() };
        }
        if (entry && typeof entry === 'object') {
          return { label: String(entry.label ?? '').trim(), value: String(entry.value ?? '').trim() };
        }
        return { label: '', value: '' };
      })
      .filter((item) => item.label.length > 0 && item.value.length > 0);
  }, [poi, currentLang]);

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

  const sentenceStructure = useMemo(() => {
    let globalIdx = 0;
    const byParagraph: IndexedSentence[][] = [];
    const flat: IndexedSentence[] = [];

    paragraphRanges.forEach((pRange, pIdx) => {
      const tokens = splitIntoSentenceTokens(pRange.text);
      const indexed: IndexedSentence[] = tokens.map((tok) => {
        const item: IndexedSentence = {
          ...tok,
          globalIdx: globalIdx++,
          pIdx,
          globalStart: pRange.start + tok.localStart,
          globalEnd: pRange.start + tok.localEnd,
        };
        flat.push(item);
        return item;
      });
      byParagraph.push(indexed);
    });

    const totalEndChar =
      paragraphRanges.length > 0 ? paragraphRanges[paragraphRanges.length - 1]!.end : 0;

    return { byParagraph, flat, totalEndChar };
  }, [paragraphRanges]);

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  const isReadingActive =
    isCurrent &&
    isPlaying &&
    audioSourceType === 'speech' &&
    activeCharOffset !== null;

  const isLiveTranscript = isPanelMode && ((isCurrent && isPlaying) || resolvedTime > 0);

  const activeGlobalSentenceIndex = useMemo(() => {
    if (!isLiveTranscript || sentenceStructure.flat.length === 0) return -1;

    if (!hasUserSeeked && isReadingActive && activeCharOffset !== null) {
      const match = sentenceStructure.flat.find(
        (s) =>
          activeCharOffset >= s.globalStart &&
          activeCharOffset <= s.globalEnd + s.trailingSpace.length
      );
      if (match) return match.globalIdx;
    }

    if (resolvedTotalDuration > 0 && sentenceStructure.totalEndChar > 0) {
      const ratio = Math.min(0.9999, Math.max(0, resolvedTime / resolvedTotalDuration));
      const targetChar = ratio * sentenceStructure.totalEndChar;
      const match = sentenceStructure.flat.find(
        (s) => targetChar >= s.globalStart && targetChar <= s.globalEnd + s.trailingSpace.length
      );
      if (match) return match.globalIdx;
      return Math.min(
        sentenceStructure.flat.length - 1,
        Math.floor(ratio * sentenceStructure.flat.length)
      );
    }

    return 0;
  }, [
    isLiveTranscript,
    sentenceStructure,
    hasUserSeeked,
    isReadingActive,
    activeCharOffset,
    resolvedTime,
    resolvedTotalDuration,
  ]);

  // Which section currently contains the spoken word (for the active highlight).
  const activeSectionIndex = useMemo(() => {
    if (isPanelMode && activeGlobalSentenceIndex >= 0) {
      return sentenceStructure.flat[activeGlobalSentenceIndex]?.pIdx ?? -1;
    }
    if (!isReadingActive || activeCharOffset === null) return -1;
    return paragraphRanges.findIndex(
      (range) => activeCharOffset >= range.start && activeCharOffset <= range.end
    );
  }, [isPanelMode, activeGlobalSentenceIndex, sentenceStructure, isReadingActive, activeCharOffset, paragraphRanges]);

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

  // Facts row: Address and distance (standalone fallback only; omitted in open-stop panel)
  const rawAddress = (poi as unknown as { address?: Record<string, string> | string }).address;
  const addressVal =
    typeof rawAddress === 'object' && rawAddress !== null
      ? rawAddress[currentLang] || rawAddress.vi
      : typeof rawAddress === 'string'
      ? rawAddress
      : null;
  const hasDistance = Boolean(formattedDist);
  const hasFacts = !isPanelMode && Boolean(addressVal || hasDistance);

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
  const prevDisplayText = prevItem ? getPoiName(prevItem.poi) : t(currentLang, 'prevBtn');
  const nextLabel = nextItem
    ? t(currentLang, 'nextStop', { name: getPoiName(nextItem.poi) })
    : t(currentLang, 'nextBtn');

  const renderPanelSentenceContent = (sentence: IndexedSentence, isCurSentence: boolean) => {
    const wordLen = Math.max(1, activeCharLength || 1);
    const containsSpeechWord =
      isReadingActive &&
      activeCharOffset !== null &&
      activeCharOffset >= sentence.globalStart &&
      activeCharOffset < sentence.globalEnd;

    if (containsSpeechWord && activeCharOffset !== null) {
      const localStart = Math.max(0, activeCharOffset - sentence.globalStart);
      const localEnd = Math.min(
        sentence.text.length,
        Math.max(localStart + 1, localStart + wordLen)
      );
      const before = sentence.text.slice(0, localStart);
      const current = sentence.text.slice(localStart, localEnd);
      const after = sentence.text.slice(localEnd);
      return (
        <>
          {before}
          <span ref={currentWordRef} className="reading-segment-current">
            {current}
          </span>
          {after}
        </>
      );
    }

    // Fallback when activeCharOffset lands on trailing/inter-paragraph whitespace
    if (
      isCurSentence &&
      isReadingActive &&
      activeCharOffset !== null &&
      !sentenceStructure.flat.some(
        (s) => activeCharOffset >= s.globalStart && activeCharOffset < s.globalEnd
      ) &&
      sentence.text.length > 0
    ) {
      const spaceIdx = sentence.text.indexOf(' ');
      const endIdx = spaceIdx > 0 ? spaceIdx : Math.min(sentence.text.length, wordLen);
      return (
        <>
          <span ref={currentWordRef} className="reading-segment-current">
            {sentence.text.slice(0, endIdx)}
          </span>
          {sentence.text.slice(endIdx)}
        </>
      );
    }

    return sentence.text;
  };

  const renderParagraphText = (
    pRange: { start: number; end: number; text: string },
    pIdx: number
  ) => {
    const paraText = pRange.text;

    if (isPanelMode) {
      const paraSentences = sentenceStructure.byParagraph[pIdx] || [];
      return (
        <p className="reading-paragraph">
          {paraSentences.map((sentence) => {
            const isCur = isLiveTranscript && sentence.globalIdx === activeGlobalSentenceIndex;
            return (
              <React.Fragment key={sentence.globalIdx}>
                <span className={`sn${isCur ? ' cur' : ''}`}>
                  {renderPanelSentenceContent(sentence, isCur)}
                </span>
                {sentence.trailingSpace}
              </React.Fragment>
            );
          })}
        </p>
      );
    }

    // Standalone mode: when idle or not reading, render plain text with no segment spans
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
              <strong>{CONTENT_LOCK_COPY[currentLang].title}</strong>
              <p lang={currentLang}>{CONTENT_LOCK_COPY[currentLang].description}</p>
              {onUnlockContent && (
                <button type="button" onClick={onUnlockContent}>
                  {CONTENT_LOCK_COPY[currentLang].cta}
                </button>
              )}
            </div>
          )}

          {/* c. Transcript: sentence-level dimming + soft accent marker while playing or after seeking */}
          {showReadingBody && !isContentLocked && (
            <div
              className={`reading-body-flow${isPanelMode ? ' tr' : ''}${
                isLiveTranscript ? ' live' : ''
              }`}
              lang={currentLang}
              data-sync={syncMode}
            >
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
                    {renderParagraphText(pRange, pIdx)}
                  </div>
                );
              })}
            </div>
          )}

          {/* d. Chapters list (rendered ONLY when chapter data exists) */}
          {!isContentLocked && chapterItems.length > 0 && (
            <div className="chs">
              {chapterItems.map((ch, idx) => (
                <button
                  key={`${ch.startSec}-${idx}`}
                  type="button"
                  className="chb"
                  onClick={() => onSeek?.(poi.id, ch.startSec)}
                >
                  <span>{formatChapterClock(ch.startSec)}</span>
                  {ch.title}
                </button>
              ))}
            </div>
          )}

          {/* e. "Điều nên biết" table (rendered ONLY when tips data exists) */}
          {!isContentLocked && tipItems.length > 0 && (
            <dl className="tp" aria-label={t(currentLang, 'tipsHeading')}>
              {tipItems.map((tip, idx) => (
                <div key={idx}>
                  <dt>{tip.label}</dt>
                  <dd>{tip.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Optional facts (standalone mode only) */}
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

          {/* g. Prev/Next row under a 1px divider */}
          <nav className="nx reading-nav-row" aria-label="Điều hướng các điểm dừng">
            <button
              type="button"
              className="lnk pv panel-nav-btn btn-prev"
              disabled={!prevItem}
              onClick={() => prevItem && onSelectPoi(prevItem.poi.id)}
              aria-label={prevLabel}
            >
              <span className="nav-btn-text">{prevDisplayText}</span>
            </button>

            <button
              type="button"
              className="lnk nt panel-nav-btn btn-next"
              disabled={!nextItem}
              onClick={() => nextItem && onSelectPoi(nextItem.poi.id)}
              aria-label={nextLabel}
            >
              <span className="nav-btn-text">{nextLabel}</span>
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
};
