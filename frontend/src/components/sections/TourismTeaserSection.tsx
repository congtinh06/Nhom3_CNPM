import React from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { tourismTeaserContent } from '../../content/staticSections';

export const TourismTeaserSection: React.FC = () => {
  return (
    <section className="s pl">
      <h2>{tourismTeaserContent.title}</h2>
      <div className="four">
        {tourismTeaserContent.photos.map((photo, index) => (
          <Link
            key={index}
            to={photo.link}
            className="pl-card"
            aria-label={`Khám phá ${photo.caption}`}
          >
            <PhotoFrame hue={photo.hue} caption={photo.caption} src={photo.src} />
            <span className="pl-veil" aria-hidden="true">
              <span className="pl-cta">
                Khám phá
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </span>
          </Link>
        ))}
      </div>
      <p>{tourismTeaserContent.paragraph}</p>
    </section>
  );
};
