import React from 'react';
import { useHomeI18n } from '../../content/homeI18n';

export const FaqSection: React.FC = () => {
  const { t } = useHomeI18n();
  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
  ];

  return (
    <section className="s faq" id="faq">
      <h2>{t.faqTitle}</h2>
      <p className="home-sub">{t.faqSubtitle}</p>
      <div className="faq-list">
        {faqs.map((faq, i) => (
          <details className="faq-item" key={i}>
            <summary className="faq-q">
              <span>{faq.q}</span>
              <span className="faq-marker" aria-hidden="true" />
            </summary>
            <div className="faq-a">
              <p>{faq.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
