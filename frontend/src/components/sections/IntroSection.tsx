import React from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { introContent } from '../../content/staticSections';

export const IntroSection: React.FC = () => {
  const words = introContent.title.split(' ');

  return (
    <section className="s intro" id="gioi-thieu">
      <h2>
        {words.map((word, i) => (
          <span key={i} className={i === words.length - 1 ? 'hl' : undefined}>
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      </h2>
      <div className="l">
        <div className="tri">
          {introContent.photosLeft.map((photo, index) => (
            <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} />
          ))}
        </div>
        <p>{introContent.paragraph}</p>
        <a className="bar" href="#diem-du-lich">
          Khám phá các điểm đến
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
      <Link
        className="ph-link"
        to="/diem-du-lich/nha-tho-duc-ba"
        aria-label={`Xem điểm đến: ${introContent.photoRight.caption}`}
      >
        <PhotoFrame
          className="big"
          hue={introContent.photoRight.hue}
          caption={introContent.photoRight.caption}
          src={introContent.photoRight.src}
        />
      </Link>
    </section>
  );
};
