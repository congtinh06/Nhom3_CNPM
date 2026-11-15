import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { tourismTeaserContent } from '../../content/staticSections';
import { api } from '../../api/client';
import { PoiSummary } from '../../types';

interface TeaserPhoto {
  hue: number;
  caption: string;
  src: string;
  link: string;
}

const STATIC_PHOTOS: TeaserPhoto[] = tourismTeaserContent.photos;
const HUES = [10, 30, 16, 42];

export const TourismTeaserSection: React.FC = () => {
  const [photos, setPhotos] = useState<TeaserPhoto[]>(STATIC_PHOTOS);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getPois !== 'function') return;
    let cancelled = false;
    api
      .getPois()
      .then((pois: PoiSummary[]) => {
        if (cancelled || pois.length === 0) return;
        const mapped = pois.slice(0, 4).map((poi, index) => {
          const slug = poi.slug || poi.code || String(poi.id);
          return {
            hue: HUES[index % HUES.length] ?? 0,
            caption: poi.name,
            src: poi.thumbnailUrl || `/images/pois/${slug}.jpg`,
            link: `/diem-du-lich/${slug}`,
          };
        });
        if (mapped.length > 0) setPhotos(mapped);
      })
      .catch(() => {
        // Giữ nội dung tĩnh nếu API không sẵn sàng.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="s pl" id="diem-du-lich">
      <h2>{tourismTeaserContent.title}</h2>
      <div className="four">
        {photos.map((photo, index) => (
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
