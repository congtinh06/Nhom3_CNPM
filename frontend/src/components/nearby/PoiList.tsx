import React, { ReactNode, useCallback, useState } from 'react';
import { Check } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { resolveImagePath } from './PoiCard';
import { t } from '../../content/nearbyI18n';

export interface SortedPoiItem {
  poi: GeoPoi;
  originalIndex: number;
  dist: number | null;
}

export interface PoiListProps {
  sortedPois: SortedPoiItem[];
  selectedPoiId: string | null;
  activePoiId: string | null;
  hoveredPoiId?: string | null;
  currentPlayingId?: string | null;
  isPlaying?: boolean;
  currentLang: SupportedLanguage;
  radius?: number;
  overrideRadius?: number | null;
  listenedPoiIds?: string[];
  statusMessage?: ReactNode;
  listTitle: string;
  sortNoteText: string;
  activeSentenceIndex?: number | null;
  duration?: number;
  onSelectPoi: (poiId: string) => void;
  onHoverPoi?: (poiId: string | null) => void;
  onTogglePlay?: (poiId: string) => void;
  onChangeLanguage?: (lang: SupportedLanguage) => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  inZoneBadgeText?: string;
  nearBadgeText?: string;
  distFormatText?: (distStr: string) => string;
  langVoiceAriaText?: string;
  listenBtnText?: string;
  pauseBtnText?: string;
  resumeBtnText?: string;
}

interface StopRowProps {
  item: SortedPoiItem;
  isActive: boolean;
  isListened: boolean;
  currentLang: SupportedLanguage;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  onSelect: (id: string) => void;
  onHover?: (id: string, hovered: boolean) => void;
}

const StopRow: React.FC<StopRowProps> = ({
  item,
  isActive,
  isListened,
  currentLang,
  getPoiName,
  getPoiCategory,
  onSelect,
  onHover,
}) => {
  const [thumbError, setThumbError] = useState(false);
  const { poi, originalIndex } = item;
  const poiName = getPoiName(poi);
  const poiCategory = getPoiCategory(poi);
  const hasImage = Boolean((poi.image || poi.slug) && !thumbError);

  return (
    <li className="nearby-stop-item">
      <button
        type="button"
        className={`nearby-stop-row ${isActive ? 'is-active' : ''}`}
        aria-current={isActive ? 'true' : undefined}
        onClick={() => onSelect(poi.id)}
        onMouseEnter={() => onHover?.(poi.id, true)}
        onMouseLeave={() => onHover?.(poi.id, false)}
      >
        <span className="stop-badge-col">
          <span className="stop-number-badge">{originalIndex + 1}</span>
        </span>
        {hasImage && (
          <img
            src={resolveImagePath(poi.image, poi.slug)}
            alt=""
            className="stop-row-thumb"
            loading="lazy"
            decoding="async"
            onError={() => setThumbError(true)}
          />
        )}
        <div className="stop-row-info">
          <span className="stop-row-name">{poiName}</span>
          <span className="stop-row-category">{poiCategory}</span>
        </div>
        {isListened && (
          <span className="stop-row-listened" title={t(currentLang, 'listenedTitle')}>
            <Check size={16} aria-hidden="true" />
          </span>
        )}
      </button>
    </li>
  );
};

const PoiListComponent: React.FC<PoiListProps> = ({
  sortedPois,
  selectedPoiId,
  activePoiId,
  listenedPoiIds = [],
  statusMessage,
  listTitle,
  sortNoteText,
  onSelectPoi,
  onHoverPoi,
  getPoiName,
  getPoiCategory,
  currentLang,
}) => {
  if (import.meta.env.DEV && typeof window !== 'undefined' && (window as any).__nearbyPerf) {
    (window as any).__nearbyPerf.rendersPoiList++;
  }

  const effectiveActiveId = activePoiId || selectedPoiId || sortedPois[0]?.poi.id;

  const handleSelect = useCallback(
    (id: string) => {
      onSelectPoi(id);
    },
    [onSelectPoi]
  );

  const handleHover = useCallback(
    (id: string, hovered: boolean) => {
      if (onHoverPoi) {
        onHoverPoi(hovered ? id : null);
      }
    },
    [onHoverPoi]
  );

  return (
    <div className="nearby-stops-column-inner">
      {/* Editorial section header */}
      <div className="chapters-column-header">
        <h2 className="chapters-list-title">{listTitle}</h2>
        <span className="chapters-sort-note" id="sortnote">
          {sortNoteText}
        </span>
      </div>

      {/* Global status notice if any (e.g. no location) */}
      {statusMessage && (
        <div className="chapters-status-notice" id="status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}

      {/* Stop list container: Shows all 5 stops without inner scrollbar */}
      <div className="nearby-stop-list-container">
        <ol className="nearby-stop-list" role="list">
          {sortedPois.map((item) => {
            const isItemActive = effectiveActiveId === item.poi.id;
            const isItemListened = listenedPoiIds.includes(item.poi.id);

            return (
              <StopRow
                key={item.poi.id}
                item={item}
                isActive={isItemActive}
                isListened={isItemListened}
                currentLang={currentLang}
                getPoiName={getPoiName}
                getPoiCategory={getPoiCategory}
                onSelect={handleSelect}
                onHover={handleHover}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export const PoiList = React.memo(PoiListComponent);
