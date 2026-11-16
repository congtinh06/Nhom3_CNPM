import React from 'react';
import { PhotoFrame } from '../common/PhotoFrame';
import { getIntroContent } from '../../content/staticSections';
import { useNavbarLanguage } from '../../content/languages';

export const IntroSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const intro = getIntroContent(lang);

  return (
    <section className="s intro" id="gioi-thieu">
      <h2>{intro.title}</h2>
      <div className="l">
        <div className="tri">
          {intro.photosLeft.map((photo, index) => (
            <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} link={photo.link} />
          ))}
        </div>
        <p>{intro.paragraph}</p>
        <div className="bar" />
      </div>
      <PhotoFrame
        className="big"
        hue={intro.photoRight.hue}
        caption={intro.photoRight.caption}
        src={intro.photoRight.src}
        link={intro.photoRight.link}
      />
    </section>
  );
};
