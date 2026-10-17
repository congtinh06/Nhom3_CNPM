import React from 'react';
import { PhotoFrame } from '../common/PhotoFrame';
import { costumeContent } from '../../content/staticSections';

export const CostumeSection: React.FC = () => {
  return (
    <section className="s cos" id="van-hoa">
      <div id="trang-phuc" style={{ display: 'none' }} />
      <PhotoFrame
        className="big"
        hue={costumeContent.photoBig.hue}
        caption={costumeContent.photoBig.caption}
        src={costumeContent.photoBig.src}
      />
      <div className="r">
        <h2>{costumeContent.title}</h2>
        <div className="two">
          {costumeContent.photosTwo.map((photo, index) => (
            <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} />
          ))}
        </div>
      </div>
      <p style={{ gridColumn: '1 / -1' }}>{costumeContent.paragraph}</p>
    </section>
  );
};
