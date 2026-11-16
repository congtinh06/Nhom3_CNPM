import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { getTourismTeaserContent } from '../../content/staticSections';
import { useNavbarLanguage } from '../../content/languages';
import { api } from '../../api/client';
import { PoiSummary } from '../../types';

interface TeaserPhoto {
  hue: number;
  caption: string;
  src: string;
  link: string;
  slug?: string;
}

const HUES = [10, 30, 16, 42];

export const TourismTeaserSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const teaser = getTourismTeaserContent(lang);
  const [apiPhotos, setApiPhotos] = useState<PoiSummary[] | null>(null);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getPois !== 'function') return;
    let cancelled = false;
    api
      .getPois()
      .then((pois: PoiSummary[]) => {
        if (cancelled || pois.length === 0) return;
        setApiPhotos(pois.slice(0, 4));
      })
      .catch(() => {
        // Giữ nội dung tĩnh nếu API không sẵn sàng.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const photos: TeaserPhoto[] = apiPhotos && apiPhotos.length > 0
    ? apiPhotos.map((poi, index) => {
        const slug = poi.slug || poi.code || String(poi.id);
        const staticMatch = teaser.photos.find((p) => p.link.includes(slug));
        return {
          hue: HUES[index % HUES.length] ?? 0,
          caption: staticMatch?.caption || poi.name,
          src: poi.thumbnailUrl || `/images/pois/${slug}.jpg`,
          link: `/diem-du-lich/${slug}`,
          slug,
        };
      })
    : teaser.photos;

  return (
    <section className="s pl" id="diem-du-lich">
      <h2>{teaser.title}</h2>
      <div className="four">
        {photos.map((photo, index) => (
          <Link
            key={index}
            to={photo.link}
            className="pl-card"
            aria-label={`${teaser.cta} ${photo.caption}`}
          >
            <PhotoFrame hue={photo.hue} caption={photo.caption} src={photo.src} />
            <span className="pl-veil" aria-hidden="true">
              <span className="pl-cta">
                {teaser.cta}
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
      <p>{teaser.paragraph}</p>
    </section>
  );
};
