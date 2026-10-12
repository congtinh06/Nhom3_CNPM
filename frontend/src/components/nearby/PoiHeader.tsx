import React from 'react';
import { MapPin, Globe, Navigation, Headphones } from 'lucide-react';
import { SupportedLanguage } from '../../types';
import { t, formatNumber } from '../../content/nearbyI18n';

interface PoiHeaderProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  stopsCount?: number;
  languagesCount?: number;
  approxDistance?: string | null;
  listenedCount?: number;
  breadcrumbHome?: string;
  breadcrumbCurrent?: string;
  currentLang?: SupportedLanguage;
}

export const PoiHeader: React.FC<PoiHeaderProps> = ({
  stopsCount,
  languagesCount,
  approxDistance,
  listenedCount,
  currentLang = 'vi',
}) => {
  const formattedStops = typeof stopsCount === 'number' ? formatNumber(stopsCount, currentLang) : '';
  const formattedLangs = typeof languagesCount === 'number' ? formatNumber(languagesCount, currentLang) : '';
  const formattedListened = typeof listenedCount === 'number' ? formatNumber(listenedCount, currentLang) : '0';

  const stopsPart = typeof stopsCount === 'number' && stopsCount > 0 ? t(currentLang, 'statStops', { count: formattedStops }) : '';
  const langsPart = typeof languagesCount === 'number' && languagesCount > 0 ? t(currentLang, 'statLanguages', { count: formattedLangs }) : '';
  const distPart = approxDistance ? t(currentLang, 'statTotalDistance', { distance: approxDistance }) : '';
  const progressPart = typeof listenedCount === 'number' ? t(currentLang, 'statProgress', { listened: formattedListened, total: formattedStops || '5' }) : '';

  return (
    <div className="nearby-checkout-header" aria-label={t(currentLang, 'headerAriaLabel')}>
      <div className="nearby-header-inner">
        {/* Chips row for stats with icons */}
        <div className="nearby-header-stats-line nearby-stat-chips" aria-label={t(currentLang, 'statsAriaLabel')}>
          {stopsPart && (
            <span className="nearby-stat-chip">
              <MapPin size={13} aria-hidden="true" />
              <span>{stopsPart}</span>
            </span>
          )}
          {langsPart && (
            <span className="nearby-stat-chip">
              <Globe size={13} aria-hidden="true" />
              <span>{langsPart}</span>
            </span>
          )}
          {distPart && (
            <span className="nearby-stat-chip">
              <Navigation size={13} aria-hidden="true" />
              <span>{distPart}</span>
            </span>
          )}
          {progressPart && (
            <span className="nearby-stat-chip">
              <Headphones size={13} aria-hidden="true" />
              <span>{progressPart}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
