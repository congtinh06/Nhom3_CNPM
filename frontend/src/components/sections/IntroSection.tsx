import React from 'react';
import { PhotoFrame } from '../common/PhotoFrame';
import { introContent } from '../../content/staticSections';

export const IntroSection: React.FC = () => {
  return (
    <section className="s intro" id="gioi-thieu">
      <h2>{introContent.title}</h2>
      <div className="l">
        <div className="tri">
          {introContent.photosLeft.map((photo, index) => (
            <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} />
          ))}
        </div>
        <p>{introContent.paragraph}</p>
        <div className="bar" />
      </div>
      <PhotoFrame
        className="big"
        hue={introContent.photoRight.hue}
        caption={introContent.photoRight.caption}
        src={introContent.photoRight.src}
      />
    </section>
  );
};
