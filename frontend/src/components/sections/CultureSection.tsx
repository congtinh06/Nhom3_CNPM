import React from 'react';
import { PhotoFrame } from '../common/PhotoFrame';
import { cultureContent } from '../../content/staticSections';

export const CultureSection: React.FC = () => {
  return (
    <section className="s cul" id="van-hoa">
      <div className="tri">
        {cultureContent.photos.map((photo, index) => (
          <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} />
        ))}
      </div>
      <div className="row">
        <h2>{cultureContent.title}</h2>
        <p>{cultureContent.paragraph}</p>
      </div>
    </section>
  );
};
