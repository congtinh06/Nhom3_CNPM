import React from 'react';
import { useHomeI18n } from '../../content/homeI18n';

export const AboutSection: React.FC = () => {
  const { t } = useHomeI18n();

  return (
    <section className="s about" id="ve-du-an">
      <h2>{t.aboutTitle}</h2>
      <p>{t.aboutText}</p>
    </section>
  );
};
