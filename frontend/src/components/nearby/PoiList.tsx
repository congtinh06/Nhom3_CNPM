import React, { ReactNode } from 'react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { PoiCard } from './PoiCard';
import { formatDist } from '../../hooks/useAutoNarration';

interface SortedPoiItem {
  poi: GeoPoi;
  originalIndex: number;
  dist: number | null;
}

interface PoiListProps {
  sortedPois: SortedPoiItem[];
  selectedPoiId: string | null;
  currentPlayingId: string | null;
  isPlaying: boolean;
  currentLang: SupportedLanguage;
  radius: number;
  statusMessage: ReactNode;
  listTitle: string;
  sortNoteText: string;
  onSelectPoi: (poiId: string) => void;
  onTogglePlay: (poiId: string) => void;
  getPoiName: (poi: GeoPoi) => string;
  getPoiCategory: (poi: GeoPoi) => string;
  inZoneBadgeText: string;
  nearBadgeText: string;
  distFormatText: (distStr: string) => string;
  langVoiceAriaText: string;
  listenBtnText: string;
  pauseBtnText: string;
  resumeBtnText: string;
}

export const PoiList: React.FC<PoiListProps> = ({
  sortedPois,
  selectedPoiId,
  currentPlayingId,
  isPlaying,
  currentLang,
  radius,
  statusMessage,
  listTitle,
  sortNoteText,
  onSelectPoi,
  onTogglePlay,
  getPoiName,
  getPoiCategory,
  inZoneBadgeText,
  nearBadgeText,
  distFormatText,
  langVoiceAriaText,
  listenBtnText,
  pauseBtnText,
  resumeBtnText,
}) => {
  return (
    <section className="poi-list-column" aria-label="Danh sách các điểm thuyết minh">
      {/* Top list header */}
      <div className="listhead poi-listhead">
        <h2>{listTitle}</h2>
        <span id="sortnote" className="sort-note">
          {sortNoteText}
        </span>
      </div>

      {/* Single status banner above list (NO repeated turn on gps line on each card!) */}
      {statusMessage && (
        <div className="status poi-global-status" id="status" role="status">
          {statusMessage}
        </div>
      )}

      {/* Scrollable list */}
      <ol className="list poi-cards-scroll" id="list">
        {sortedPois.map(({ poi, originalIndex, dist }) => {
          const isSelected = selectedPoiId === poi.id;
          const isCurrent = currentPlayingId === poi.id;
          const inTriggerZone = dist !== null && dist <= poi.triggerRadius;
          const inRadius = dist !== null && dist <= radius;
          const formattedDist = dist !== null ? formatDist(dist) : null;

          return (
            <PoiCard
              key={poi.id}
              poi={poi}
              originalIndex={originalIndex}
              isSelected={isSelected}
              isPlaying={isPlaying}
              isCurrent={isCurrent}
              currentLang={currentLang}
              dist={dist}
              formattedDist={formattedDist}
              inTriggerZone={inTriggerZone}
              inRadius={inRadius}
              onSelect={() => onSelectPoi(poi.id)}
              onTogglePlay={() => onTogglePlay(poi.id)}
              getPoiName={getPoiName}
              getPoiCategory={getPoiCategory}
              inZoneBadgeText={inZoneBadgeText}
              nearBadgeText={nearBadgeText}
              distFormatText={distFormatText}
              langVoiceAriaText={langVoiceAriaText}
              listenBtnText={listenBtnText}
              pauseBtnText={pauseBtnText}
              resumeBtnText={resumeBtnText}
            />
          );
        })}
      </ol>
    </section>
  );
};
