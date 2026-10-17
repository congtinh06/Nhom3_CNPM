import React from 'react';
import { Link } from 'react-router-dom';
import nearbyPois from '../../content/nearbyPois.json';
import { useHomeI18n } from '../../content/homeI18n';

export const TourismTeaserSection: React.FC = () => {
  const { lang, t } = useHomeI18n();

  return (
    <section className="s tour" id="du-lich">
      <h2>{t.tourismTitle}</h2>
      <p className="tour-desc">{t.tourismParagraph}</p>
      <div className="tour-grid">
        {nearbyPois.map((poi) => {
          const name = poi.name[lang] ?? poi.name.vi;
          const category = poi.category[lang] ?? poi.category.vi;
          return (
            <Link
              key={poi.id}
              to={`/diem-du-lich/${poi.slug}`}
              className="tour-card"
            >
              <div className="tour-card-media">
                <img src={poi.image} alt={name} loading="lazy" />
              </div>
              <div className="tour-card-body">
                <span className="tour-card-cat">{category}</span>
                <h3 className="tour-card-title">{name}</h3>
                <span className="tour-card-cta">{t.tourismCardCta} →</span>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="tour-actions">
        <Link to="/diem-du-lich" className="tb">
          {t.tourismCta}
        </Link>
      </div>
    </section>
  );
};
