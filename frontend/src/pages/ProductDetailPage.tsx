import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
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
import '../styles/souvenir.css';

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

  // Audio Preview Player
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const basePath = '/am-thuc';

  const stopAudio = useCallback(() => {
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
    setIsAudioPlaying(false);
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (isAudioPlaying) {
      stopAudio();
      return;
    }
    setIsAudioPlaying(true);
    audioTimerRef.current = setInterval(() => {
      setAudioProgress((prev) => {
        if (prev >= 100) {
          stopAudio();
          return 0;
        }
        return prev + 2.5;
      });
    }, 1000);
  }, [isAudioPlaying, stopAudio]);

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
      }
    };
  }, []);

  const loadProductDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setImageError(false);
    stopAudio();
    setAudioProgress(0);

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
  }, [slug, stopAudio]);

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
    setRelatedProducts([]);

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
        setRelatedProducts([...samePoi, ...others].slice(0, 4));
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = defaultProducts
          .filter((p) => p.slug !== slug && p.category === cat && p.isActive)
          .slice(0, 4);
        setRelatedProducts(fallback);
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
    addToCart(product, quantity);
    showToast(`Đã thêm vào giỏ: ${quantity} × ${product.name}`);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    openCart();
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  const handleBuyNow = () => {
    if (!product || !product.isActive) return;
    addToCart(product, quantity);
    (window as unknown as { __pop?: () => void }).__pop?.();
    navigate('/thanh-toan');
  };

  if (loading) {
    return (
      <div className="souvenir-sv-root product-detail-sv">
        <div className="wrap" style={{ padding: '120px 24px', textAlign: 'center' }}>
          <div className="souvenir-loading">
            <RefreshCw size={24} className="souvenir-spin" />
            <span>Đang tải thông tin sản phẩm...</span>
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
            Quay lại Quà lưu niệm
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
            <Link to="/">Trang chủ</Link>
            <span className="sep">/</span>
            <Link to={basePath}>Quà lưu niệm</Link>
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

              {/* Audio preview player */}
              <div className="aud">
                <button
                  type="button"
                  className="pl"
                  onClick={handleToggleAudio}
                >
                  {isAudioPlaying
                    ? 'Tạm dừng'
                    : audioProgress > 0
                      ? 'Tiếp tục nghe'
                      : 'Nghe giới thiệu'}
                </button>
                <i>
                  <b style={{ width: `${audioProgress}%` }}></b>
                </i>
                <span>0:40</span>
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
                    aria-label="Giảm"
                  >
                    -
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    onClick={handleIncrease}
                    aria-label="Tăng"
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
                  {addedAnimation ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                </button>

                <button
                  type="button"
                  className="detail-btn-secondary"
                  onClick={handleBuyNow}
                  disabled={!product.isActive}
                >
                  Mua ngay
                </button>
              </div>

              {/* Guarantees */}
              <div className="detail-guarantees">
                <div className="guarantee-item">
                  <b>Gói cẩn thận</b>
                  <span>Mỗi món được bọc riêng chống va đập</span>
                </div>
                <div className="guarantee-item">
                  <b>Giao tận nơi</b>
                  <span>Về khách sạn hoặc nhận tại điểm</span>
                </div>
                <div className="guarantee-item">
                  <b>Đổi nếu có lỗi</b>
                  <span>Đổi món khác nếu phát hiện hư hỏng</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-section">
            <h2 className="related-title">{t.shop.relatedSouvenirHeading}</h2>
            <div className="grid">
              {relatedProducts.map((relItem, idx) => {
                const relPrice = applySouvenirDiscount(
                  relItem.price,
                  isDiscountEligible,
                  relItem.category
                );
                return (
                  <article
                    key={relItem.id}
                    className="good"
                    style={{ '--d': `${idx * 40}ms` } as React.CSSProperties}
                  >
                    <div className="ph">
                      {relItem.imagePath ? (
                        <img
                          src={relItem.imagePath}
                          alt={relItem.name}
                          loading="lazy"
                        />
                      ) : (
                        <SouvenirLineArt kind={detectArtKind(relItem)} />
                      )}
                      <button
                        type="button"
                        className="open"
                        onClick={() => navigate(`${basePath}/${relItem.slug}`)}
                        aria-label={`Xem ${relItem.name}`}
                      />
                    </div>
                    <h3>
                      <button
                        type="button"
                        className="ttl"
                        onClick={() => navigate(`${basePath}/${relItem.slug}`)}
                      >
                        {relItem.name}
                      </button>
                    </h3>
                    {relItem.shortDescription && <p>{relItem.shortDescription}</p>}
                    <div className="buy">
                      <b>{formatPrice(relPrice)}</b>
                      <button
                        type="button"
                        className="add"
                        onClick={() => {
                          addToCart(relItem, 1);
                          showToast(`Đã thêm vào giỏ: 1 × ${relItem.name}`);
                        }}
                      >
                        Thêm vào giỏ
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
