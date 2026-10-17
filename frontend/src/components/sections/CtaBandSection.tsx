import React from 'react';
import { Link } from 'react-router-dom';
import { useHomeI18n } from '../../content/homeI18n';

export const CtaBandSection: React.FC = () => {
  const { t } = useHomeI18n();

  return (
    <section className="s cta-band" id="bat-dau">
      <div className="cta-inner">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaDesc}</p>
        <div className="cta-actions">
          <Link className="home-btn home-btn-primary" to="/diem-du-lich">
            {t.ctaPrimary}
          </Link>
          <Link className="home-btn home-btn-outline" to="/quet-ma">
            {t.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
};
