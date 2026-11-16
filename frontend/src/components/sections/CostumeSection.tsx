import React from 'react';
import { PhotoFrame } from '../common/PhotoFrame';
import { getCostumeContent } from '../../content/staticSections';
import { useNavbarLanguage } from '../../content/languages';

export const CostumeSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const costume = getCostumeContent(lang);

  return (
    <section className="s cos" id="van-hoa">
      <div id="trang-phuc" style={{ display: 'none' }} />
      <PhotoFrame
        className="big"
        hue={costume.photoBig.hue}
        caption={costume.photoBig.caption}
        src={costume.photoBig.src}
        link={costume.photoBig.link}
      />
      <div className="r">
        <h2>{costume.title}</h2>
        <div className="two">
          {costume.photosTwo.map((photo, index) => (
            <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} link={photo.link} />
          ))}
        </div>
      </div>
      <p style={{ gridColumn: '1 / -1' }}>{costume.paragraph}</p>
    </section>
  );
};
