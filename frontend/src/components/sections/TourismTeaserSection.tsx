import React from 'react';
import { PhotoFrame } from '../common/PhotoFrame';
import { tourismTeaserContent } from '../../content/staticSections';

export const TourismTeaserSection: React.FC = () => {
  return (
    <section className="s pl">
      <h2>{tourismTeaserContent.title}</h2>
      <div className="four">
        {tourismTeaserContent.photos.map((photo, index) => (
          <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} />
        ))}
      </div>
      <p>{tourismTeaserContent.paragraph}</p>
    </section>
  );
};
