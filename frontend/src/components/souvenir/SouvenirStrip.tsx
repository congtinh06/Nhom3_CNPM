import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

const VISIBLE_BREAKPOINTS: Array<[number, number]> = [
  [640, 1],
  [1024, 2],
  [Infinity, 3],
];

function visibleCountFor(width: number): number {
  for (const [maxWidth, count] of VISIBLE_BREAKPOINTS) {
    if (width <= maxWidth) return count;
  }
  return 3;
}

const TRACK_STEP =
  'calc((100% - (var(--souvenir-visible) - 1) * var(--souvenir-gap)) / var(--souvenir-visible) + var(--souvenir-gap))';

export const SouvenirStrip: React.FC<SouvenirStripProps> = ({ poiSlug, lang }) => {
  const navigate = useNavigate();
  const { addToCart } = useCartOptional();
  const { showToast } = useToastOptional();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const copy = STRIP_COPY[lang] || STRIP_COPY.vi;

  const [visible, setVisible] = useState(() =>
    typeof window === 'undefined' ? 3 : visibleCountFor(window.innerWidth)
  );
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setVisible(visibleCountFor(window.innerWidth));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const maxIndex = Math.max(0, products.length - visible);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [maxIndex, index]);

  const handleAddToCart = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product.isActive) return;
    if (!(await addToCart(product, 1))) return;
    showToast(`Đã thêm vào giỏ hàng: ${product.name}`);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  const startDrag = (clientX: number) => {
    if (maxIndex === 0) return;
    setDragging(true);
    dragStartX.current = clientX;
    setDragOffset(0);
  };

  const moveDrag = (clientX: number) => {
    if (!dragging) return;
    setDragOffset(clientX - dragStartX.current);
  };

  const endDrag = () => {
    if (!dragging) return;
    if (dragOffset < -60) {
      setIndex((current) => Math.min(current + 1, maxIndex));
    } else if (dragOffset > 60) {
      setIndex((current) => Math.max(current - 1, 0));
    }
    setDragging(false);
    setDragOffset(0);
  };

  // Ẩn hoàn toàn khi điểm chưa có quà lưu niệm nào.
  if (products.length === 0) return null;

  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const trackStyle = {
    '--souvenir-visible': visible,
    '--souvenir-gap': '16px',
    transform: dragging
      ? `translateX(calc(-1 * ${index} * ${TRACK_STEP} + ${dragOffset}px))`
      : `translateX(calc(-1 * ${index} * ${TRACK_STEP}))`,
    transition: dragging ? 'none' : undefined,
  } as React.CSSProperties;

  return (
    <section className="souvenir-strip" aria-label={copy.heading}>
      <div className="souvenir-strip-head">
        <h2 className="souvenir-strip-title">{copy.heading}</h2>
        <Link to="/am-thuc" className="souvenir-strip-link">
          {copy.viewAll}
        </Link>
      </div>

      <div className="souvenir-carousel">
        {maxIndex > 0 && (
          <button
            type="button"
            className="souvenir-carousel-arrow is-prev"
            aria-label="Xem nhóm quà lưu niệm trước"
            onClick={() => setIndex((current) => Math.max(current - 1, 0))}
            disabled={!canPrev}
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}

        <div
          ref={viewportRef}
          className={`souvenir-carousel-viewport${dragging ? ' is-dragging' : ''}`}
          onPointerDown={(e) => startDrag(e.clientX)}
          onPointerMove={(e) => moveDrag(e.clientX)}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setIndex((current) => Math.max(current - 1, 0));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setIndex((current) => Math.min(current + 1, maxIndex));
            }
          }}
          tabIndex={0}
          aria-roledescription="carousel"
        >
          <div className="souvenir-carousel-track" style={trackStyle}>
            {products.map((product) => (
              <div className="souvenir-carousel-item" key={product.id}>
                <ProductCard
                  product={product}
                  isFavorited={isFavorite(product.id)}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={handleAddToCart}
                  onSelect={() => navigate(`/am-thuc/${product.slug}`)}
                  showRating={false}
                  neutralPlaceholder
                />
              </div>
            ))}
          </div>
        </div>

        {maxIndex > 0 && (
          <button
            type="button"
            className="souvenir-carousel-arrow is-next"
            aria-label="Xem nhóm quà lưu niệm tiếp theo"
            onClick={() => setIndex((current) => Math.min(current + 1, maxIndex))}
            disabled={!canNext}
          >
            <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
};

export default SouvenirStrip;
