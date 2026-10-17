import React from 'react';
import { costumeContent } from '../../content/staticSections';

export const CostumeSection: React.FC = () => {
  return (
    <section className="s cos" id="van-hoa">
      <div id="trang-phuc" style={{ display: 'none' }} />
      <h2>{costumeContent.title}</h2>
      <p>{costumeContent.paragraph}</p>
    </section>
  );
};
