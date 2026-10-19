import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Product, SupportedLanguage } from '../../types';
import { useCartOptional } from '../../context/CartContext';
import { useToastOptional } from '../../context/ToastContext';
import { useFavorites } from '../../hooks/useFavorites';
import { ProductCard } from '../food/ProductCard';
import '../../styles/souvenir.css';

interface SouvenirStripProps {
  poiSlug: string | null | undefined;
  lang: SupportedLanguage;
}

const STRIP_COPY: Record<SupportedLanguage, { heading: string; viewAll: string }> = {
  vi: { heading: 'Quà lưu niệm tại điểm này', viewAll: 'Xem tất cả' },
  en: { heading: 'Souvenirs at this stop', viewAll: 'View all' },
  ja: { heading: 'この名所のお土産', viewAll: 'すべて見る' },
  ko: { heading: '이 명소의 기념품', viewAll: '전체 보기' },
};

export const SouvenirStrip: React.FC<SouvenirStripProps> = ({ poiSlug, lang }) => {
  const navigate = useNavigate();
  const { addToCart } = useCartOptional();
  const { showToast } = useToastOptional();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const copy = STRIP_COPY[lang] || STRIP_COPY.vi;

  useEffect(() => {
    if (!poiSlug) {
      setProducts([]);
      return;
    }
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getProducts !== 'function') return;
    let cancelled = false;
    api
      .getProducts({ poiSlug, size: 8, sortBy: 'sortOrder' })
      .then((page) => {
        if (!cancelled) setProducts(page?.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [poiSlug]);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product.isActive) return;
    addToCart(product, 1);
    showToast(`Đã thêm vào giỏ hàng: ${product.name}`);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  // Ẩn hoàn toàn khi điểm chưa có quà lưu niệm nào.
  if (products.length === 0) return null;

  return (
    <section className="souvenir-strip" aria-label={copy.heading}>
      <div className="souvenir-strip-head">
        <h2 className="souvenir-strip-title">{copy.heading}</h2>
        <Link to="/am-thuc" className="souvenir-strip-link">
          {copy.viewAll}
        </Link>
      </div>

      <div className="food-product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorited={isFavorite(product.id)}
            onToggleFavorite={toggleFavorite}
            onAddToCart={handleAddToCart}
            onSelect={() => navigate(`/am-thuc/${product.slug}`)}
            showRating={false}
            neutralPlaceholder
          />
        ))}
      </div>
    </section>
  );
};

export default SouvenirStrip;
