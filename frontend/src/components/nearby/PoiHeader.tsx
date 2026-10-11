import React from 'react';
import { SupportedLanguage } from '../../types';
import { t, formatNumber } from '../../content/nearbyI18n';

interface PoiHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  stopsCount?: number;
  languagesCount?: number;
  approxDistance?: string | null;
  listenedCount?: number;
  breadcrumbHome?: string;
  breadcrumbCurrent?: string;
  currentLang?: SupportedLanguage;
}

export const PoiHeader: React.FC<PoiHeaderProps> = ({
  title,
  description,
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

  const statsString = [stopsPart, langsPart, distPart, progressPart].filter(Boolean).join(' · ');

  return (
    <header className="nearby-checkout-header" aria-label={t(currentLang, 'headerAriaLabel')}>
      <div className="nearby-header-inner">
        {/* Title row: H1 simple left-aligned */}
        <div className="nearby-header-title-row">
          <h1 className="nearby-page-title">{title}</h1>
        </div>

        {/* Subtitle */}
        <p className="nearby-page-subtitle">{description}</p>

        {/* Single-line secondary stats text */}
        <p className="nearby-header-stats-line" aria-label={t(currentLang, 'statsAriaLabel')}>
          {statsString}
        </p>
      </div>
    </header>
  );
};
