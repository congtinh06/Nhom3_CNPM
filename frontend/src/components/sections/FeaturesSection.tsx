import React from 'react';
import { Link } from 'react-router-dom';
import { useHomeI18n } from '../../content/homeI18n';

const GpsIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

const QrIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3M21 14v0M14 21h7v-3M17 21h1" />
  </svg>
);

const LangIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 5h9M7 3v2c0 4-1.7 7-4 9" />
    <path d="M5 11c1.6 2.4 4 4 7 5" />
    <path d="M13 20l4.5-10 4.5 10M14.8 16h5.4" />
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);

export const FeaturesSection: React.FC = () => {
  const { t } = useHomeI18n();
  const features = [
    { icon: <GpsIcon />, title: t.feat1Title, desc: t.feat1Desc, to: '/diem-du-lich' },
    { icon: <QrIcon />, title: t.feat2Title, desc: t.feat2Desc, to: '/quet-ma' },
    { icon: <LangIcon />, title: t.feat3Title, desc: t.feat3Desc, to: '/huong-dan' },
    { icon: <MapIcon />, title: t.feat4Title, desc: t.feat4Desc, to: '/diem-du-lich' },
  ];

  return (
    <section className="s features" id="tinh-nang">
      <h2>{t.featTitle}</h2>
      <p className="home-sub">{t.featSubtitle}</p>
      <div className="feat-grid">
        {features.map((feature, i) => (
          <Link className="feat-card" to={feature.to} key={i}>
            <span className="feat-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
