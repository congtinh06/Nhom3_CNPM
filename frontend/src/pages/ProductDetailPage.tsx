import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Check,
  Star,
  Clock,
  Utensils,
  Heart,
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../hooks/useFavorites';
import { formatPrice } from '../utils/formatters';
import { defaultProducts } from '../content/defaultProducts';
import { Product, ProductCategory } from '../types';

interface ProductDetailPageProps {
  category?: ProductCategory;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ category: propCategory }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Drink & Food Options
  const [size, setSize] = useState<'M' | 'L'>('M');
  const [sugar, setSugar] = useState<'Ít' | 'Vừa' | 'Nhiều'>('Vừa');
  const [ice, setIce] = useState<'Ít' | 'Vừa' | 'Nhiều'>('Vừa');
  const [foodNote, setFoodNote] = useState<string>('Cay vừa');

  const basePath = '/am-thuc';

  const loadProductDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setSize('M');
    setSugar('Vừa');
    setIce('Vừa');
    setFoodNote('Cay vừa');

    try {
      const data = await api.getProductBySlug(slug);
      if (data && data.isActive) {
        setProduct(data);
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
    if (!product) return;
    const cat = propCategory || product.category;
    const related = defaultProducts
      .filter((p) => p.slug !== slug && p.category === cat && p.isActive)
      .slice(0, 4);
    setRelatedProducts(related);
  }, [product, propCategory, slug]);

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const sizeSurcharge = product?.hasDrinkOptions && size === 'L' ? 5000 : 0;
  const unitPrice = (product?.price || 0) + sizeSurcharge;
  const totalPrice = unitPrice * quantity;


  const handleAddToCart = () => {
    if (!product || !product.isActive) return;
    addToCart(product, quantity);
    const optionsText = product.hasDrinkOptions
      ? ` (${size}, ${sugar} đường, ${ice} đá)`
      : ` (${foodNote})`;
    showToast(`Đã thêm vào giỏ: ${quantity} × ${product.name}${optionsText}`);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
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
      <div className="food-beverage-page-container" style={{ padding: '120px 20px', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--fb-deep-brown)' }}>
          <RefreshCw size={32} className="spin-icon" style={{ margin: '0 auto 12px' }} />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="food-beverage-page-container" style={{ padding: '120px 20px', minHeight: '60vh' }}>
        <div className="food-empty-state-card" style={{ maxWidth: 500, margin: '0 auto' }}>
          <AlertCircle size={40} color="var(--fb-saigon-red)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontFamily: 'Anton, sans-serif', color: 'var(--fb-deep-brown)' }}>Món không khả dụng</h2>
          <p style={{ color: 'var(--fb-text-muted)', marginBottom: 20 }}>
            {error || 'Món bạn đang tìm kiếm không tồn tại hoặc đã ngừng phục vụ.'}
          </p>
          <button
            type="button"
            className="empty-reset-btn"
            onClick={() => navigate(basePath)}
          >
            <ArrowLeft size={16} />
            <span>Quay lại thực đơn</span>
          </button>
        </div>
      </div>
    );
  }

  const ratingValue = product.rating || 4.9;
  const reviewsCount = product.reviewsCount || 100;
  const isFavorited = isFavorite(product.id);

  return (
    <div className="food-beverage-page-container" style={{ paddingTop: 90 }}>
      {/* Breadcrumb điều hướng */}
      <nav className="detail-breadcrumb-bar" aria-label="Đường dẫn phân cấp" style={{ background: '#FFF', borderBottom: '1px solid var(--fb-border)', padding: '12px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fb-text-muted)' }}>
          <Link to="/" style={{ color: 'var(--fb-text-muted)', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <ChevronRight size={13} />
          <Link to={basePath} style={{ color: 'var(--fb-orange-brown)', textDecoration: 'none', fontWeight: 600 }}>
            Quà lưu niệm
          </Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--fb-deep-brown)', fontWeight: 600 }} aria-current="page">
            {product.name}
          </span>
        </div>
      </nav>

      {/* Main product detail section */}
      <section style={{ maxWidth: 1200, margin: '30px auto', padding: '0 20px' }}>
        <div style={{ background: '#FFF', borderRadius: 'var(--fb-radius-lg)', border: '1px solid var(--fb-border)', padding: 32, boxShadow: 'var(--fb-shadow-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36 }}>
            {/* Cột trái: Ảnh lớn */}
            <div>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 'var(--fb-radius-md)', overflow: 'hidden', background: '#F0E9DD' }}>
                <img
                  src={product.imagePath}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {product.badge && (
                  <span className="food-card-badge food-badge-specialty" style={{ top: 14, left: 14 }}>
                    {product.badge}
                  </span>
                )}
                <button
                  type="button"
                  className={`food-favorite-btn ${isFavorited ? 'is-active' : ''}`}
                  onClick={() => toggleFavorite(product.id)}
                  style={{ top: 14, right: 14 }}
                  aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                >
                  <Heart size={18} className={`heart-icon ${isFavorited ? 'heart-filled' : ''}`} />
                </button>
              </div>

              {/* Info pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--fb-off-white)', padding: '10px 14px', borderRadius: 'var(--fb-radius-sm)', border: '1px solid var(--fb-border-light)', fontSize: 13, color: 'var(--fb-text-muted)' }}>
                  <Clock size={16} color="var(--fb-orange-brown)" />
                  <span>Chuẩn bị: {product.prepTime || '10 - 15 phút'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--fb-off-white)', padding: '10px 14px', borderRadius: 'var(--fb-radius-sm)', border: '1px solid var(--fb-border-light)', fontSize: 13, color: 'var(--fb-text-muted)' }}>
                  <Utensils size={16} color="var(--fb-orange-brown)" />
                  <span>Khẩu phần: {product.portion || '1 phần chuẩn'}</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Thông tin & Đặt món */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={15}
                      className={`star-icon ${i < Math.floor(ratingValue) ? 'star-filled' : 'star-empty'}`}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fb-deep-brown)' }}>
                  {ratingValue.toFixed(1)}
                </span>
                <span style={{ fontSize: 12, color: '#8C7E74' }}>({reviewsCount} đánh giá)</span>
              </div>

              <h1 style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 30, color: 'var(--fb-deep-brown)', margin: '0 0 12px' }}>
                {product.name}
              </h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--fb-border-light)' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--fb-saigon-red)' }}>
                  {formatPrice(unitPrice)}
                </span>
                {product.oldPrice && (
                  <span style={{ fontSize: 15, color: '#9C8E84', textDecoration: 'line-through' }}>
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
                {sizeSurcharge > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--fb-orange-brown)', fontWeight: 600 }}>
                    (Đã cộng Size L: +5.000đ)
                  </span>
                )}
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fb-deep-brown)', fontWeight: 500, margin: '0 0 10px' }}>
                {product.shortDescription}
              </p>

              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--fb-text-muted)', margin: '0 0 20px' }}>
                {product.description}
              </p>

              {/* Options */}
              {product.hasDrinkOptions ? (
                <div className="food-modal-options-section" style={{ marginBottom: 20 }}>
                  <div className="option-group">
                    <span className="option-title">Kích cỡ ly:</span>
                    <div className="option-pills">
                      <button
                        type="button"
                        className={`option-btn ${size === 'M' ? 'selected' : ''}`}
                        onClick={() => setSize('M')}
                      >
                        Size M (Vừa)
                      </button>
                      <button
                        type="button"
                        className={`option-btn ${size === 'L' ? 'selected' : ''}`}
                        onClick={() => setSize('L')}
                      >
                        Size L (+5.000đ)
                      </button>
                    </div>
                  </div>

                  <div className="option-group">
                    <span className="option-title">Lượng đường:</span>
                    <div className="option-pills">
                      {(['Ít', 'Vừa', 'Nhiều'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`option-btn ${sugar === lvl ? 'selected' : ''}`}
                          onClick={() => setSugar(lvl)}
                        >
                          {lvl} {lvl === 'Ít' ? '(30%)' : lvl === 'Vừa' ? '(70%)' : '(100%)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="option-group">
                    <span className="option-title">Lượng đá:</span>
                    <div className="option-pills">
                      {(['Ít', 'Vừa', 'Nhiều'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          className={`option-btn ${ice === lvl ? 'selected' : ''}`}
                          onClick={() => setIce(lvl)}
                        >
                          {lvl} {lvl === 'Ít' ? '(30%)' : lvl === 'Vừa' ? '(70%)' : '(100%)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="food-modal-options-section" style={{ marginBottom: 20 }}>
                  <div className="option-group">
                    <span className="option-title">Ghi chú khẩu vị:</span>
                    <div className="option-pills">
                      {['Không cay', 'Cay vừa', 'Cay nhiều', 'Để riêng đồ chua'].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`option-btn ${foodNote === n ? 'selected' : ''}`}
                          onClick={() => setFoodNote(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--fb-border-light)', borderBottom: '1px solid var(--fb-border-light)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>Số lượng:</span>
                  <div className="quantity-buttons-wrap">
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      aria-label="Giảm"
                    >
                      <Minus size={15} strokeWidth={2} />
                    </button>
                    <span className="qty-value">{quantity}</span>
                    <button
                      type="button"
                      className="qty-btn"
                      onClick={handleIncrease}
                      aria-label="Tăng"
                    >
                      <Plus size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 13, color: 'var(--fb-text-muted)', marginRight: 8 }}>Tổng:</span>
                  <b style={{ fontSize: 20, color: 'var(--fb-saigon-red)', fontWeight: 800 }}>
                    {formatPrice(totalPrice)}
                  </b>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <button
                  type="button"
                  className={`food-modal-add-btn ${addedAnimation ? 'is-success' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!product.isActive}
                >
                  {addedAnimation ? (
                    <>
                      <Check size={18} strokeWidth={2.2} />
                      <span>Đã thêm vào giỏ</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} strokeWidth={1.8} />
                      <span>Thêm vào giỏ hàng</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="food-modal-buy-btn"
                  onClick={handleBuyNow}
                  disabled={!product.isActive}
                >
                  <CreditCard size={18} strokeWidth={1.8} />
                  <span>Mua ngay</span>
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <Link
                  to={basePath}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fb-text-muted)', textDecoration: 'none' }}
                >
                  <ArrowLeft size={15} />
                  <span>Quay lại thực đơn mua sắm</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '40px auto 60px', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, color: 'var(--fb-deep-brown)', margin: 0 }}>
              GỢI Ý MÓN CÙNG DANH MỤC
            </h2>
            <Link to={basePath} style={{ color: 'var(--fb-orange-brown)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Xem tất cả</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {relatedProducts.map((relItem) => (
              <div
                key={relItem.id}
                onClick={() => navigate(`${basePath}/${relItem.slug}`)}
                style={{ background: '#FFF', border: '1px solid var(--fb-border)', borderRadius: 'var(--fb-radius-md)', padding: 12, cursor: 'pointer', transition: 'var(--fb-transition)' }}
              >
                <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 'var(--fb-radius-sm)', overflow: 'hidden', background: '#F0E9DD', marginBottom: 10 }}>
                  <img
                    src={relItem.imagePath}
                    alt={relItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h4 style={{ fontFamily: 'Anton, sans-serif', fontSize: 16, color: 'var(--fb-deep-brown)', margin: '0 0 4px' }}>
                  {relItem.name}
                </h4>
                <b style={{ color: 'var(--fb-saigon-red)', fontSize: 14 }}>
                  {formatPrice(relItem.price)}
                </b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
