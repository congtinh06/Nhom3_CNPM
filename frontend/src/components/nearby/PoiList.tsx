import React, { ReactNode, useCallback } from 'react';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { t } from '../../content/nearbyI18n';

export interface SortedPoiItem {
  poi: GeoPoi;
  originalIndex: number;
  stopNumber?: number;
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
  listenedPoiIds?: string[];
  lockedPoiIds?: string[];
  statusMessage?: ReactNode;
  listTitle: string;
  sortNoteText: string;
  /** Details rendered inline, directly beneath the open (active) row. */
  details?: ReactNode;
  activeSentenceIndex?: number | null;
  duration?: number;
  onSelectPoi: (poiId: string) => void;
  onHoverPoi?: (poiId: string | null) => void;
  onTogglePlay?: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  inZoneBadgeText?: string;
  nearBadgeText?: string;
  distFormatText?: (distStr: string) => string;
  listenBtnText?: string;
  pauseBtnText?: string;
  resumeBtnText?: string;
}

interface StopRowProps {
  item: SortedPoiItem;
  isActive: boolean;
  isListened: boolean;
  isLocked: boolean;
  currentLang: SupportedLanguage;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  onSelect: (id: string) => void;
  onHover?: (id: string, hovered: boolean) => void;
  details?: ReactNode;
}

const StopRow: React.FC<StopRowProps> = ({
  item,
  isActive,
  isListened,
  isLocked,
  currentLang,
  getPoiName,
  getPoiCategory,
  onSelect,
  onHover,
  details,
}) => {
  const { poi, originalIndex, stopNumber } = item;
  const poiName = getPoiName(poi);
  const poiCategory = getPoiCategory(poi);

  return (
    <li className={`nearby-stop-item ${isActive ? 'is-open' : ''}`}>
      <button
        type="button"
        className={`nearby-stop-row ${isActive ? 'is-active' : ''}`}
        aria-current={isActive ? 'true' : undefined}
        aria-expanded={isActive}
        onClick={() => onSelect(poi.id)}
        onMouseEnter={() => onHover?.(poi.id, true)}
        onMouseLeave={() => onHover?.(poi.id, false)}
      >
        <span className="stop-badge-col">
          <span className="stop-number-badge">{stopNumber ?? originalIndex + 1}</span>
        </span>
        <div className="stop-row-info">
          <span className="stop-row-name">{poiName}</span>
          <span className="stop-row-category">{poiCategory}</span>
        </div>
        <span className="stop-row-status">
          {isLocked && (
            <span
              className="stop-row-locked"
              title={t(currentLang, 'premiumLockedTitle')}
              aria-label={t(currentLang, 'premiumLockedTitle')}
            >
              <Lock size={13} strokeWidth={2} aria-hidden="true" />
              <span>Premium</span>
            </span>
          )}
          {isListened && (
            <span className="stop-row-listened" title={t(currentLang, 'listenedTitle')}>
              <Check size={16} aria-hidden="true" />
            </span>
          )}
          <span className={`stop-row-chevron${isActive ? ' is-open' : ''}`} aria-hidden="true">
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </span>
      </button>
      <div className={`nearby-stop-accordion ${isActive ? 'is-open' : ''}`}>
        <div className="nearby-stop-accordion-inner">
          {details ? <div className="nearby-stop-detail">{details}</div> : null}
        </div>
      </div>
    </li>
  );
};

const PoiListComponent: React.FC<PoiListProps> = ({
  sortedPois,
  selectedPoiId,
  activePoiId,
  listenedPoiIds = [],
  lockedPoiIds = [],
  statusMessage: _statusMessage,
  listTitle,
  sortNoteText,
  details,
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
      {/* Assistive heading for screen readers & test contracts, removed visually */}
      <div className="chapters-column-header sr-only">
        <h2 className="chapters-list-title">{listTitle}</h2>
        <span className="chapters-sort-note" id="sortnote">
          {sortNoteText}
        </span>
      </div>

      {/* Stop list container: grows with the page so every stop stays visible */}
      <div className="nearby-stop-list-container">
        <ol className="nearby-stop-list" role="list">
          {sortedPois.map((item) => {
            const isItemActive = effectiveActiveId === item.poi.id;
            const isItemListened = listenedPoiIds.includes(item.poi.id);
            const isItemLocked = lockedPoiIds.includes(item.poi.id);

            return (
              <StopRow
                key={item.poi.id}
                item={item}
                isActive={isItemActive}
                isListened={isItemListened}
                isLocked={isItemLocked}
                currentLang={currentLang}
                getPoiName={getPoiName}
                getPoiCategory={getPoiCategory}
                onSelect={handleSelect}
                onHover={handleHover}
                details={isItemActive ? details : null}
              />
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export const PoiList = React.memo(PoiListComponent);
