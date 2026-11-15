import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { useHomeI18n } from '../../content/homeI18n';
import { api } from '../../api/client';

interface DishPhoto {
  hue: number;
  caption: string;
  src: string;
  slug: string;
}

const HUES = [20, 32, 10, 40, 6, 28];

export const FoodSection: React.FC = () => {
  const { t } = useHomeI18n();
  const [photos, setPhotos] = useState<DishPhoto[]>([]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getProducts !== 'function') return;
    let cancelled = false;
    api
      .getProducts({ size: 6, sortBy: 'sortOrder' })
      .then((page) => {
        const items = page?.content ?? [];
        if (cancelled || items.length === 0) return;
        setPhotos(
          items.slice(0, 6).map((item, index) => ({
            hue: HUES[index % HUES.length] ?? 0,
            caption: item.name,
            src: item.imagePath,
            slug: item.slug,
          }))
        );
      })
      .catch(() => {
        // Không có món thật thì ẩn cả mục, tránh ảnh giữ chỗ.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Chỉ hiển thị khi có món thật gắn với ảnh.
  if (photos.length === 0) return null;

  const top = photos.slice(0, 3);
  const bottom = photos.slice(3, 6);

  return (
    <section className="s food" id="am-thuc">
      <div className="t">
        {top.map((photo, index) => (
          <Link
            key={index}
            to={`/am-thuc/${photo.slug}`}
            className="food-link"
            aria-label={`Xem món: ${photo.caption}`}
          >
            <PhotoFrame hue={photo.hue} caption={photo.caption} src={photo.src} />
          </Link>
        ))}
      </div>
      <div className="m">
        <h2>{t.foodTitle}</h2>
        <p>{t.foodParagraph}</p>
        <div style={{ marginTop: 20 }}>
          <Link to="/am-thuc" className="tb" style={{ textDecoration: 'none' }}>
            {t.foodCta}
          </Link>
        </div>
      </div>
      <div className="b">
        {bottom.map((photo, index) => (
          <Link
            key={index}
            to={`/am-thuc/${photo.slug}`}
            className="food-link"
            aria-label={`Xem món: ${photo.caption}`}
          >
            <PhotoFrame hue={photo.hue} caption={photo.caption} src={photo.src} />
          </Link>
        ))}
      </div>
    </section>
  );
};
