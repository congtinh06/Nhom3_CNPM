import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuthOptional } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePremium } from '../context/PremiumContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../hooks/useFavorites';
import { formatPrice } from '../utils/formatters';
import { applySouvenirDiscount } from '../utils/pricing';
import { defaultProducts } from '../content/defaultProducts';
import { enrichProduct, enrichProducts } from '../content/productAdapter';
import { useNavbarLanguage } from '../content/languages';
import { getSpotName } from '../content/souvenirSpots';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/food/ProductCard';
import '../styles/souvenir.css';
import '../styles/foodBeverage.css';

type ArtKind = 'frame' | 'model' | 'magnet' | 'card' | 'hat' | 'cup' | 'tea' | 'book';

function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

function detectArtKind(product: Product): ArtKind {
  const hay = normalizeVietnamese(`${product.name} ${product.slug}`);
  if (hay.includes('mo hinh') || hay.includes('model')) return 'model';
  if (hay.includes('nam cham') || hay.includes('magnet')) return 'magnet';
  if (hay.includes('buu thiep') || hay.includes('postcard') || hay.includes('card')) return 'card';
  if (hay.includes('non la') || hay.includes('hat')) return 'hat';
  if (hay.includes('ca phe') || hay.includes('coffee') || hay.includes('phin')) return 'cup';
  if (hay.includes('tra ') || hay.startsWith('tra') || hay.includes('tea')) return 'tea';
  if (hay.includes('sach') || hay.includes('book')) return 'book';
  return 'frame';
}

const SouvenirLineArt: React.FC<{ kind: ArtKind }> = ({ kind }) => (
  <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <circle cx="262" cy="52" r="16" fill="var(--acc)" />
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      transform="translate(0 10)"
    >
      <path d="M20 160H300" opacity="0.45" />
      {kind === 'frame' && (
        <>
          <rect x="105" y="30" width="110" height="120" />
          <rect x="118" y="44" width="84" height="92" />
          <path d="M135 120l18-26 14 18 10-12 16 20" />
        </>
      )}
      {kind === 'model' && (
        <path d="M60 150V108H260V150M80 108V84H240V108M110 84V62H210V84M130 150v-24h60v24" />
      )}
      {kind === 'magnet' && (
        <>
          <circle cx="160" cy="92" r="44" />
          <path d="M132 100c0-22 56-22 56 0M144 100V72M176 100V72" />
        </>
      )}
      {kind === 'card' && (
        <>
          <rect x="80" y="52" width="160" height="96" rx="4" />
          <path d="M80 56l80 52 80-52M202 70h22v18h-22z" />
        </>
      )}
      {kind === 'hat' && (
        <path d="M60 124c40-6 70-20 100-80 30 60 60 74 100 80-40 16-160 16-200 0zM160 44v-12" />
      )}
      {kind === 'cup' && (
        <path d="M100 78h100v36c0 22-18 36-50 36s-50-14-50-36zM200 88h16a14 14 0 010 28h-16M130 60c-6-10 6-14 0-24M160 60c-6-10 6-14 0-24" />
      )}
      {kind === 'tea' && (
        <path d="M96 100h108v14c0 20-24 36-54 36s-54-16-54-36zM204 108h18a12 12 0 010 24h-14M96 100c0-12 20-22 54-22s54 10 54 22M150 78V66" />
      )}
      {kind === 'book' && <path d="M90 142h140V68H90zM90 105h140M112 142V68M128 86h80" />}
    </g>
  </svg>
);

interface ProductDetailPageProps {
  category?: ProductCategory;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ category: propCategory }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const { addToCart, openCart } = useCart();
  const { isPremium, hasAnyPurchase } = usePremium();
  const isDiscountEligible = isPremium || hasAnyPurchase;
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { lang, t } = useNavbarLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const basePath = '/am-thuc';

  // Carousel drag-to-scroll & arrow navigation for related products
  const relatedCarouselRef = useRef<HTMLDivElement>(null);
  const [relatedNav, setRelatedNav] = useState({ canPrev: false, canNext: true });
  const [isRelatedDragging, setIsRelatedDragging] = useState(false);
  const [relatedStartX, setRelatedStartX] = useState(0);
  const [relatedScrollLeft, setRelatedScrollLeft] = useState(0);

  const handleRelatedMouseDown = (e: React.MouseEvent) => {
    if (!relatedCarouselRef.current) return;
    setIsRelatedDragging(true);
    setRelatedStartX(e.pageX - relatedCarouselRef.current.offsetLeft);
    setRelatedScrollLeft(relatedCarouselRef.current.scrollLeft);
  };

  const handleRelatedMouseMove = (e: React.MouseEvent) => {
    if (!isRelatedDragging || !relatedCarouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - relatedCarouselRef.current.offsetLeft;
    const walk = (x - relatedStartX) * 1.5;
    relatedCarouselRef.current.scrollLeft = relatedScrollLeft - walk;
  };

  const handleRelatedMouseUpOrLeave = () => {
    setIsRelatedDragging(false);
  };

  const syncRelatedNav = useCallback(() => {
    const el = relatedCarouselRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const canPrev = el.scrollLeft > 4;
    const canNext = maxScroll > 4 && el.scrollLeft < maxScroll - 4;
    setRelatedNav((prev) =>
      prev.canPrev === canPrev && prev.canNext === canNext ? prev : { canPrev, canNext }
    );
  }, []);

  const handleScrollRelated = (direction: 'left' | 'right') => {
    if (!relatedCarouselRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    relatedCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const loadProductDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setImageError(false);

    try {
      const data = await api.getProductBySlug(slug);
      if (data && data.isActive) {
        setProduct(enrichProduct(data));
      } else {
        const fallback = defaultProducts.find((p) => p.slug === slug && p.isActive);
        if (fallback) {
          setProduct(fallback);
        } else {
          setError('Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán.');
        }
      }
    } catch {
      const fallback = defaultProducts.find((p) => p.slug === slug && p.isActive);
      if (fallback) {
        setProduct(fallback);
      } else {
        setError('Không tìm thấy sản phẩm hoặc không thể kết nối đến máy chủ.');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProductDetail();
    window.scrollTo(0, 0);
  }, [slug, loadProductDetail]);

  // Load related products
  useEffect(() => {
    if (!product) {
      setRelatedProducts([]);
      return;
    }

    let cancelled = false;
    const cat = propCategory || product.category;

    const getFallbackList = () => {
      const directCategoryFallbacks = defaultProducts.filter(
        (p) => p.slug !== slug && p.category === cat && p.isActive
      );
      const otherFallbacks = defaultProducts.filter(
        (p) =>
          p.slug !== slug &&
          p.isActive &&
          !directCategoryFallbacks.some((d) => d.id === p.id)
      );
      return [...directCategoryFallbacks, ...otherFallbacks].slice(0, 8);
    };

    api
      .getProducts({ category: cat, size: 200, sortBy: 'sortOrder' })
      .then((page) => {
        if (cancelled) return;
        const candidates = enrichProducts(page?.content ?? []).filter(
          (p) => p.slug !== slug && p.isActive
        );
        const samePoi =
          product.poiId != null
            ? candidates.filter((p) => p.poiId === product.poiId)
            : [];
        const samePoiIds = new Set(samePoi.map((p) => p.id));
        const others = candidates.filter((p) => !samePoiIds.has(p.id));
        const combined = [...samePoi, ...others];

        if (combined.length >= 4) {
          setRelatedProducts(combined.slice(0, 8));
        } else {
          const fallbacks = getFallbackList();
          const combinedIds = new Set(combined.map((c) => c.id));
          const complemented = [
            ...combined,
            ...fallbacks.filter((f) => !combinedIds.has(f.id)),
          ];
          setRelatedProducts(complemented.slice(0, 8));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRelatedProducts(getFallbackList());
      });

    return () => {
      cancelled = true;
    };
  }, [product, propCategory, slug]);

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const unitPrice = product?.price || 0;
  const discountedUnitPrice = applySouvenirDiscount(
    unitPrice,
    isDiscountEligible,
    product?.category
  );

  const handleAddToCart = () => {
    if (!product || !product.isActive) return;
    if (!addToCart(product, quantity)) return;
    showToast(`Đã thêm vào giỏ: ${quantity} × ${product.name}`);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    openCart();
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  const handleBuyNow = () => {
    if (!product || !product.isActive) return;
    if (!addToCart(product, quantity)) return;
    (window as unknown as { __pop?: () => void }).__pop?.();
    if (!isAuthenticated) {
      navigate('/dang-nhap', {
        state: { backgroundLocation: location, from: '/thanh-toan' },
      });
      return;
    }
    navigate('/thanh-toan');
  };

  if (loading) {
    return (
      <div className="souvenir-sv-root product-detail-sv">
        <div className="wrap" style={{ padding: '120px 24px', textAlign: 'center' }}>
          <div className="souvenir-loading">
            <RefreshCw size={24} className="souvenir-spin" />
            <span>
              {lang === 'en'
                ? 'Loading product details...'
                : lang === 'ja'
                  ? '商品情報を読み込み中...'
                  : lang === 'ko'
                    ? '상품 정보를 불러오는 중...'
                    : 'Đang tải thông tin sản phẩm...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="souvenir-sv-root product-detail-sv">
        <div className="wrap" style={{ padding: '120px 24px', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--mut)', margin: '0 auto 16px' }} />
          <h2>{t.shop.productUnavailable}</h2>
          <p style={{ color: 'var(--mut)', margin: '12px auto 24px', maxWidth: 460 }}>
            {error || t.shop.productUnavailableDesc}
          </p>
          <button
            type="button"
            className="go"
            onClick={() => navigate(basePath)}
          >
            {lang === 'en'
              ? 'Back to Souvenirs'
              : lang === 'ja'
                ? 'お土産一覧へ戻る'
                : lang === 'ko'
                  ? '기념품으로 돌아가기'
                  : 'Quay lại Quà lưu niệm'}
          </button>
        </div>
      </div>
    );
  }

  const isFavorited = isFavorite(product.id);
  const isSouvenir = product.category === 'SOUVENIR';
  const hasPremiumDiscount = isDiscountEligible && isSouvenir;
  const spotName = product.poiSlug ? getSpotName(product.poiSlug, lang) : '';
  const artKind = detectArtKind(product);

  return (
    <div className="souvenir-sv-root product-detail-sv">
      {/* Breadcrumb Navigation */}
      <div className="detail-breadcrumb">
        <div className="wrap">
          <nav aria-label="Đường dẫn phân cấp">
            <Link to="/">{t.home}</Link>
            <span className="sep">/</span>
            <Link to={basePath}>{t.food}</Link>
            <span className="sep">/</span>
            <span className="cur" aria-current="page">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Detail Section */}
      <div className="wrap">
        <div className="detail-main">
          <div className="detail-grid">
            {/* Left Column: Photo 4/5 */}
            <div className="detail-photo">
              {product.imagePath && !imageError ? (
                <img
                  src={product.imagePath}
                  alt={product.name}
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              ) : (
                <SouvenirLineArt kind={artKind} />
              )}
              {product.badge && (
                <span className="detail-badge">{product.badge}</span>
              )}
              <button
                type="button"
                className="heart"
                aria-pressed={isFavorited}
                aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                onClick={() => toggleFavorite(product.id)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
                </svg>
              </button>
            </div>

            {/* Right Column: Info & Actions */}
            <div className="detail-info">
              {spotName && product.poiSlug && (
                <Link
                  to={`/diem-du-lich?stop=${product.poiSlug}`}
                  className="detail-spot-tag"
                >
                  {spotName}
                </Link>
              )}

              <h1 className="detail-title">{product.name}</h1>

              <div className="detail-price-row">
                <span className="detail-price-main">
                  {formatPrice(discountedUnitPrice)}
                </span>
                {hasPremiumDiscount ? (
                  <>
                    <span className="detail-price-old">{formatPrice(unitPrice)}</span>
                    <span className="detail-discount-tag">Premium -10%</span>
                  </>
                ) : (
                  product.oldPrice && (
                    <span className="detail-price-old">{formatPrice(product.oldPrice)}</span>
                  )
                )}
              </div>

              {product.shortDescription && (
                <p className="detail-short">{product.shortDescription}</p>
              )}

              {product.description && (
                <p className="detail-desc">{product.description}</p>
              )}

              {/* Quantity Stepper & Actions */}
              <div className="detail-actions">
                <span className="stp">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={handleDecrease}
                    aria-label={lang === 'en' ? 'Decrease' : lang === 'ja' ? '減らす' : lang === 'ko' ? '감소' : 'Giảm'}
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    aria-label={lang === 'en' ? 'Increase' : lang === 'ja' ? '増やす' : lang === 'ko' ? '증가' : 'Tăng'}
                  >
                    +
                  </button>
                </span>

                <button
                  type="button"
                  className="detail-btn-primary"
                  onClick={handleAddToCart}
                  disabled={!product.isActive}
                >
                  {addedAnimation
                    ? (lang === 'en' ? 'Added to cart' : lang === 'ja' ? '追加済み' : lang === 'ko' ? '담김' : 'Đã thêm vào giỏ')
                    : (lang === 'en' ? 'Add to cart' : lang === 'ja' ? 'カートに追加' : lang === 'ko' ? '장바구니 담기' : 'Thêm vào giỏ hàng')}
                </button>

                <button
                  type="button"
                  className="detail-btn-secondary"
                  onClick={handleBuyNow}
                  disabled={!product.isActive}
                >
                  {lang === 'en' ? 'Buy now' : lang === 'ja' ? '今すぐ購入' : lang === 'ko' ? '바로 구매' : 'Mua ngay'}
                </button>
              </div>

              {/* Guarantees */}
              <div className="detail-guarantees">
                <div className="guarantee-item">
                  <b>{lang === 'en' ? 'Carefully packed' : lang === 'ja' ? '丁寧な梱包' : lang === 'ko' ? '안전한 개별 포장' : 'Gói cẩn thận'}</b>
                  <span>{lang === 'en' ? 'Each item individually wrapped with extra protection' : lang === 'ja' ? 'すべての商品を個別に緩衝材で保護' : lang === 'ko' ? '파손 방지를 위해 개별 포장' : 'Mỗi món được bọc riêng chống va đập'}</span>
                </div>
                <div className="guarantee-item">
                  <b>{lang === 'en' ? 'Direct delivery' : lang === 'ja' ? 'お届け先へ配送' : lang === 'ko' ? '원하는 곳으로 직접 배송' : 'Giao tận nơi'}</b>
                  <span>{lang === 'en' ? 'To your hotel or picked up at landmark counter' : lang === 'ja' ? 'ホテルまたは現地窓口で受け取り' : lang === 'ko' ? '호텔 배송 또는 현장 수령' : 'Về khách sạn hoặc nhận tại điểm'}</span>
                </div>
                <div className="guarantee-item">
                  <b>{lang === 'en' ? 'Hassle-free return' : lang === 'ja' ? '初期不良対応' : lang === 'ko' ? '안심 교환 보장' : 'Đổi nếu có lỗi'}</b>
                  <span>{lang === 'en' ? 'Replaced right away if any defect is found' : lang === 'ja' ? '破損や不具合がある場合は速やかに交換' : lang === 'ko' ? '파손이나 하자 발견 시 즉시 교환' : 'Đổi món khác nếu phát hiện hư hỏng'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Carousel (Image 2 style) */}
        {relatedProducts.length > 0 && (
          <section className="related-section" aria-labelledby="relatedTitle">
            <div className="related-head">
              <div className="related-head-left">
                <h2 id="relatedTitle" className="related-title">
                  {t.shop.relatedSouvenirHeading}
                </h2>
                <p>
                  {lang === 'en'
                    ? 'Souvenirs & local specialties tied to each destination.'
                    : lang === 'ja'
                      ? '各観光スポットにまつわるお土産＆名産品。'
                      : lang === 'ko'
                        ? '각 명소와 연결된 기념품 및 특산품.'
                        : 'Quà lưu niệm & đặc sản gắn với từng điểm dừng.'}
                </p>
              </div>
              <div className="related-head-actions">
                <div className="related-carousel-arrows" aria-label="Điều hướng sản phẩm gợi ý">
                  <button
                    type="button"
                    className="related-arrow-btn prev"
                    onClick={() => handleScrollRelated('left')}
                    aria-label="Xem sản phẩm trước"
                    disabled={!relatedNav.canPrev}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="related-arrow-btn next"
                    onClick={() => handleScrollRelated('right')}
                    aria-label="Xem sản phẩm tiếp theo"
                    disabled={!relatedNav.canNext}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
                <Link className="related-more-link" to={basePath}>
                  {lang === 'en'
                    ? 'View all souvenirs'
                    : lang === 'ja'
                      ? 'すべてのお土産を見る'
                      : lang === 'ko'
                        ? '모든 기념품 보기'
                        : 'Xem tất cả quà lưu niệm'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>

            <div
              className={`goods-carousel related-carousel ${isRelatedDragging ? 'is-dragging' : ''}`}
              ref={relatedCarouselRef}
              onScroll={syncRelatedNav}
              onMouseDown={handleRelatedMouseDown}
              onMouseMove={handleRelatedMouseMove}
              onMouseUp={handleRelatedMouseUpOrLeave}
              onMouseLeave={handleRelatedMouseUpOrLeave}
            >
              {relatedProducts.map((relItem) => (
                <ProductCard
                  key={relItem.id}
                  product={relItem}
                  isFavorited={isFavorite(relItem.id)}
                  onToggleFavorite={toggleFavorite}
                  onAddToCart={(p, e) => {
                    e.stopPropagation();
                    if (!addToCart(p, 1)) return;
                    showToast(
                      lang === 'en'
                        ? `Added to cart: 1 × ${p.name}`
                        : lang === 'ja'
                          ? `カートに追加しました: 1 × ${p.name}`
                          : lang === 'ko'
                            ? `장바구니에 담겼습니다: 1 × ${p.name}`
                            : `Đã thêm vào giỏ: 1 × ${p.name}`
                    );
                  }}
                  onSelect={(p) => navigate(`${basePath}/${p.slug}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
