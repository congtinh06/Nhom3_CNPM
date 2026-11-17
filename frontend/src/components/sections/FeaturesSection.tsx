import React from 'react';
import { useHomeI18n } from '../../content/homeI18n';

const CrosshairIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.6v3.2M12 18.2v3.2M2.6 12h3.2M18.2 12h3.2" />
  </svg>
);

const QrIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M21 14v0M14 21h7v-3M17 21h1" />
  </svg>
);

const LangIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M3 5h9M7 3v2c0 4-1.7 7-4 9" />
    <path d="M5 11c1.6 2.4 4 4 7 5" />
    <path d="M13 20l4.5-10 4.5 10M14.8 16h5.4" />
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);

const GpsIllustration: React.FC<{ chip: string }> = ({ chip }) => (
  <div className="feat-figure feat-figure-gps" aria-hidden="true">
    <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" focusable="false">
      <circle cx="160" cy="60" r="54" fill="none" stroke="var(--ft-accent)" strokeOpacity="0.12" />
      <circle cx="160" cy="60" r="40" fill="none" stroke="var(--ft-accent)" strokeOpacity="0.2" />
      <circle cx="160" cy="60" r="26" fill="none" stroke="var(--ft-accent)" strokeOpacity="0.34" />
      <circle cx="160" cy="60" r="14" fill="var(--ft-accent)" fillOpacity="0.1" stroke="var(--ft-accent)" strokeOpacity="0.55" />
      <circle cx="160" cy="60" r="5" fill="var(--ft-accent)" />
    </svg>
    <span className="feat-figure-chip">{chip}</span>
  </div>
);

const QR_MODULES = [
  '...##....',
  '....#....',
  '...#.....',
  '##..#....',
  '..#.##.#.',
  '.....###.',
  '...#...#.',
  '....#.#..',
  '...#..#..',
];

const QR_FINDERS: Array<[number, number]> = [
  [0, 0],
  [6, 0],
  [0, 6],
];

const QrIllustration: React.FC<{ cta: string; sub: string }> = ({ cta, sub }) => (
  <div className="feat-figure feat-figure-qr" aria-hidden="true">
    <div className="feat-qr">
      <svg viewBox="0 0 9 9" width="68" height="68" shapeRendering="crispEdges" focusable="false">
        {QR_MODULES.map((row, y) =>
          row.split('').map((cell, x) =>
            cell === '#'
              ? <rect key={`m-${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
              : null,
          ),
        )}
        {QR_FINDERS.map(([fx, fy]) => (
          <g key={`f-${fx}-${fy}`} fill="none" stroke="currentColor" strokeWidth="1">
            <rect x={fx + 0.5} y={fy + 0.5} width="2" height="2" />
            <rect x={fx + 1} y={fy + 1} width="1" height="1" fill="currentColor" stroke="none" />
          </g>
        ))}
      </svg>
      <div className="feat-qr-copy">
        <strong>{cta}</strong>
        <span>{sub}</span>
      </div>
    </div>
  </div>
);

const LANGS: Array<{ code: string; name: string; primary?: boolean; lang?: string }> = [
  { code: 'VI', name: 'Tiếng Việt', primary: true },
  { code: 'EN', name: 'English' },
  { code: 'JA', name: '日本語', lang: 'ja' },
  { code: 'KO', name: '한국어', lang: 'ko' },
];

const LangIllustration: React.FC = () => (
  <div className="feat-figure feat-figure-langs" aria-hidden="true">
    <div className="feat-langs">
      {LANGS.map((item) => (
        <span key={item.code} className={`feat-lang${item.primary ? ' is-primary' : ''}`} lang={item.lang}>
          <b>{item.code}</b>
          <span>{item.name}</span>
        </span>
      ))}
    </div>
  </div>
);

const MAP_STOPS = [
  { n: 1, x: 58, y: 92 },
  { n: 2, x: 138, y: 48 },
  { n: 3, x: 214, y: 66 },
  { n: 4, x: 268, y: 26 },
];

const MapIllustration: React.FC = () => (
  <div className="feat-figure feat-figure-map" aria-hidden="true">
    <svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet" focusable="false">
      <defs>
        <pattern id="feat-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--ft-line)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="120" fill="url(#feat-map-grid)" />
      <path
        d="M58 92C88 84 112 50 138 48C166 44 190 74 214 66C238 58 248 30 268 26"
        fill="none"
        stroke="var(--ft-accent)"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      {MAP_STOPS.map((stop) => (
        <g key={stop.n}>
          <circle cx={stop.x} cy={stop.y} r="12" fill="var(--ft-title)" />
          <text
            x={stop.x}
            y={stop.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="600"
            fill="var(--ft-bg)"
          >
            {stop.n}
          </text>
        </g>
      ))}
    </svg>
  </div>
);

export const FeaturesSection: React.FC = () => {
  const { t } = useHomeI18n();

  return (
    <section className="s features" id="tinh-nang" aria-labelledby="features-title">
      <div className="features-inner">
        <h2 id="features-title">{t.featTitle}</h2>
        <p className="home-sub">{t.featSubtitle}</p>
        <div className="feat-grid">
          <div className="feat-card">
            <span className="feat-icon" aria-hidden="true">
              <CrosshairIcon />
            </span>
            <h3>{t.feat1Title}</h3>
            <p>{t.feat1Desc}</p>
            <GpsIllustration chip={t.feat1AutoChip} />
          </div>

          <div className="feat-card">
            <span className="feat-icon" aria-hidden="true">
              <QrIcon />
            </span>
            <h3>{t.feat2Title}</h3>
            <p>{t.feat2Desc}</p>
            <QrIllustration cta={t.feat2ScanCta} sub={t.feat2ScanSub} />
          </div>

          <div className="feat-card">
            <span className="feat-icon" aria-hidden="true">
              <LangIcon />
            </span>
            <h3>{t.feat3Title}</h3>
            <p>{t.feat3Desc}</p>
            <LangIllustration />
          </div>

          <div className="feat-card">
            <span className="feat-icon" aria-hidden="true">
              <MapIcon />
            </span>
            <h3>{t.feat4Title}</h3>
            <p>{t.feat4Desc}</p>
            <MapIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};
