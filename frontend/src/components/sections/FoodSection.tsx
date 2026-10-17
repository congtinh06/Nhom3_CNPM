import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { foodContent } from '../../content/staticSections';
import { api } from '../../api/client';

interface DishPhoto {
  hue: number;
  caption: string;
  src: string;
}

const HUES = [20, 32, 10, 40, 6, 28];

export const FoodSection: React.FC = () => {
  const [top, setTop] = useState<DishPhoto[]>(foodContent.photosTop);
  const [bottom, setBottom] = useState<DishPhoto[]>(foodContent.photosBottom);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getProducts !== 'function') return;
    let cancelled = false;
    api
      .getProducts({ category: 'FOOD', size: 6, sortBy: 'sortOrder' })
      .then((page) => {
        const items = page?.content ?? [];
        if (cancelled || items.length < 3) return;
        const mapped: DishPhoto[] = items.slice(0, 6).map((item, index) => ({
          hue: HUES[index % HUES.length] ?? 0,
          caption: item.name,
          src: item.imagePath,
        }));
        setTop(mapped.slice(0, 3));
        setBottom(mapped.slice(3, 6).length > 0 ? mapped.slice(3, 6) : foodContent.photosBottom);
      })
      .catch(() => {
        // Giữ nội dung tĩnh nếu API không sẵn sàng.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="s food" id="am-thuc">
      <div className="t">
        {top.map((photo, index) => (
          <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} />
        ))}
      </div>
      <div className="m">
        <h2>{foodContent.title}</h2>
        <p>{foodContent.paragraph}</p>
        <div style={{ marginTop: 20 }}>
          <Link to="/am-thuc-thuc-uong" className="tb" style={{ textDecoration: 'none' }}>
            Khám phá Ẩm thực & Thức uống
          </Link>
        </div>
      </div>
      <div className="b">
        {bottom.map((photo, index) => (
          <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} src={photo.src} />
        ))}
      </div>
    </section>
  );
};
