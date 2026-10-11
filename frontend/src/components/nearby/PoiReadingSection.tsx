import React, { useRef, useEffect } from 'react';
import { GeoPoi, getNarration } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { SortedPoiItem } from './PoiList';
import { splitTranscriptIntoSentences } from '../../hooks/useNearbyAudio';
import { t } from '../../content/nearbyI18n';

interface PoiReadingSectionProps {
  activeItem: SortedPoiItem;
  currentLang: SupportedLanguage;
  isPlaying: boolean;
  isCurrent: boolean;
  activeSentenceIndex: number | null;
  audioSourceType?: string;
  chapterMode: 'listen' | 'read';
  prevItem: SortedPoiItem | null;
  nextItem: SortedPoiItem | null;
  onSelectPoi: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  formattedDist?: string | null;
  heroIntroText?: string;
}

export const PoiReadingSection: React.FC<PoiReadingSectionProps> = ({
  activeItem,
  currentLang,
  isPlaying,
  isCurrent,
  activeSentenceIndex,
  audioSourceType,
  chapterMode,
  prevItem,
  nextItem,
  onSelectPoi,
  getPoiName,
  formattedDist,
  heroIntroText: _heroIntroText,
}) => {
  const { poi } = activeItem;
  const activeSentenceRef = useRef<HTMLSpanElement | null>(null);

  const displayName = getPoiName(poi);
  // Reading section is "read more" content, based strictly on the full layer:
  // If narration.full exists (vi, en): render paragraphs.
  // If narration.full does not exist (ja, ko): do not render the reading body at all.
  const fullParagraphs = getNarration(poi, currentLang, 'full');
  const showReadingBody = Boolean(fullParagraphs && fullParagraphs.length > 0);
  const displayParagraphs: string[] = showReadingBody ? (fullParagraphs as string[]) : [];

  let sentenceCounter = 0;
  const paragraphSentenceGroups = displayParagraphs.map((para) => {
    const pSentences = splitTranscriptIntoSentences(para);
    return pSentences.map((s) => ({
      sentence: s.sentence,
      globalIndex: sentenceCounter++,
    }));
  });

  // Auto-scroll active sentence within viewport when audio is playing in listen mode
  useEffect(() => {
    if (isCurrent && isPlaying && chapterMode === 'listen' && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isCurrent, isPlaying, chapterMode, activeSentenceIndex]);

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

  return (
    <section className="nearby-reading-section" aria-label={`Nội dung thuyết minh: ${displayName}`}>
      <div className="nearby-reading-container">
        {/* Section Heading & Sentence flow (rendered only when not redundant with hero intro, or during active listen playback) */}
        {showReadingBody && (
          <>
            <h3 className="reading-stop-title">{displayName}</h3>

            {/* Reading body: Comfortable 720px max-width, 17px font, 1.7 line height, no inner scroll */}
            <div className="reading-body-flow" lang={currentLang}>
              {paragraphSentenceGroups.map((pGroup, pIdx) => (
                <p key={pIdx} className="reading-paragraph">
                  {pGroup.map((item, itemIdx) => {
                    const isSentenceActive =
                      isCurrent &&
                      isPlaying &&
                      audioSourceType === 'speech' &&
                      activeSentenceIndex === item.globalIndex;
                    return (
                      <React.Fragment key={item.globalIndex}>
                        {itemIdx > 0 && ' '}
                        <span
                          ref={isSentenceActive ? activeSentenceRef : null}
                          className={`transcript-sentence-node ${
                            isSentenceActive && chapterMode === 'listen'
                              ? 'is-highlighted-sentence'
                              : ''
                          }`}
                        >
                          {item.sentence}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </p>
              ))}
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
