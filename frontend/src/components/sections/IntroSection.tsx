import React from 'react';
import { introContent } from '../../content/staticSections';

export const IntroSection: React.FC = () => {
  return (
    <section className="s intro" id="gioi-thieu">
      <h2>{introContent.title}</h2>
      <p>{introContent.paragraph}</p>
    </section>
  );
};
