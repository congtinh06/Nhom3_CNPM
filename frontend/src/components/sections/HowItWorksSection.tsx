import React from 'react';
import { useHomeI18n } from '../../content/homeI18n';

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

const SoundIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18.5 7a7 7 0 0 1 0 10" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16" />
    <path d="M12 4c2.4 2.5 2.4 13.5 0 16M12 4c-2.4 2.5-2.4 13.5 0 16" />
  </svg>
);

export const HowItWorksSection: React.FC = () => {
  const { t } = useHomeI18n();
  const steps = [
    { icon: <PinIcon />, title: t.how1Title, desc: t.how1Desc },
    { icon: <SoundIcon />, title: t.how2Title, desc: t.how2Desc },
    { icon: <GlobeIcon />, title: t.how3Title, desc: t.how3Desc },
  ];

  return (
    <section className="s how" id="cach-hoat-dong">
      <h2>{t.howTitle}</h2>
      <p className="home-sub">{t.howSubtitle}</p>
      <ol className="how-grid">
        {steps.map((step, i) => (
          <li className="how-card" key={i}>
            <span className="how-num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="how-icon">{step.icon}</span>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};
