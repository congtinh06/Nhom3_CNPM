import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Check,
} from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { formatPrice } from '../utils/formatters';
import { defaultProducts } from '../content/defaultProducts';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { Product, ProductCategory } from '../types';

interface ProductDetailPageProps {
  category: ProductCategory;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ category }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useNavbarLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const basePath = category === 'FOOD' ? '/am-thuc' : '/thuc-uong';
  const categoryTitle = category === 'FOOD' ? t.shop.foodTitle : t.shop.drinksTitle;

  const loadProductDetail = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setQuantity(1);

    try {
      const data = await api.getProductBySlug(slug);
      if (data && data.isActive) {
        setProduct(data);
      } else {
        // Kiểm tra trong fallback
        const fallback = defaultProducts.find((p) => p.slug === slug && p.isActive);
        if (fallback) {
          setProduct(fallback);
        } else {
          setError('Không tìm thấy món ăn hoặc món đã ngừng phục vụ.');
        }
      }
    } catch {
      // Fallback offline
      const fallback = defaultProducts.find((p) => p.slug === slug && p.isActive);
      if (fallback) {
        setProduct(fallback);
      } else {
        setError('Không tìm thấy món ăn hoặc không thể kết nối đến máy chủ.');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Tải danh sách món liên quan
  useEffect(() => {
    const loadRelated = async () => {
      try {
        const res = await api.getProducts({ category, size: 6 });
        if (res && res.content) {
          setRelatedProducts(res.content.filter((p) => p.slug !== slug && p.isActive).slice(0, 4));
        } else {
          setRelatedProducts(
            defaultProducts
              .filter((p) => p.category === category && p.slug !== slug && p.isActive)
              .slice(0, 4)
          );
        }
      } catch {
        setRelatedProducts(
          defaultProducts
            .filter((p) => p.category === category && p.slug !== slug && p.isActive)
            .slice(0, 4)
        );
      }
    };

    loadProductDetail();
    loadRelated();
    window.scrollTo(0, 0);
  }, [slug, category, loadProductDetail]);

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (!product || !product.isActive) return;
    addToCart(product, quantity);
    showToast(`${t.shop.addedToCart}: ${quantity} × ${product.name}`);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  if (loading) {
    return (
      <div className="product-detail-page s">
        <div className="detail-loading-box">
          <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
          <p>{t.shop.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page s">
        <div className="product-state-card error-card">
          <AlertCircle size={40} strokeWidth={1.75} className="state-icon" aria-hidden="true" />
          <h2>Món không khả dụng</h2>
          <p>{error || 'Món bạn đang tìm kiếm không tồn tại hoặc đã được ẩn.'}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              type="button"
              className="tb"
              onClick={() => navigate(basePath)}
            >
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>{t.shop.backToList}</span>
            </button>
            <button
              type="button"
              className="tb"
              onClick={() => loadProductDetail()}
            >
              <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>{t.shop.retry}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hue = (product.id * 47) % 360;

  return (
    <div className="product-detail-page">
      {/* Breadcrumb điều hướng */}
      <nav className="detail-breadcrumb-bar" aria-label="Đường dẫn phân cấp">
        <div className="detail-breadcrumb-content">
          <Link to="/" className="breadcrumb-link">
            {t.home}
          </Link>
          <ChevronRight size={14} strokeWidth={1.5} className="breadcrumb-sep" aria-hidden="true" />
          <Link to={basePath} className="breadcrumb-link">
            {categoryTitle}
          </Link>
          <ChevronRight size={14} strokeWidth={1.5} className="breadcrumb-sep" aria-hidden="true" />
          <span className="breadcrumb-current" aria-current="page">
            {product.name}
          </span>
        </div>
      </nav>

      {/* Khung chi tiết sản phẩm */}
      <section className="detail-main-section s">
        <div className="detail-grid">
          {/* Cột trái: Ảnh lớn */}
          <div className="detail-media-panel">
            <PhotoFrame
              hue={hue}
              caption={`Ảnh: ${product.name}`}
              src={product.imagePath}
              className="detail-large-photo"
            />
          </div>

          {/* Cột phải: Thông tin & Đặt món */}
          <div className="detail-info-panel">
            <div className="detail-category-badge">
              {category === 'FOOD' ? 'Ẩm thực Sài Gòn' : 'Thức uống Sài Gòn'}
            </div>

            <h1 className="detail-product-title">{product.name}</h1>

            <div className="detail-price-box">
              <span className="detail-price-amount">{formatPrice(product.price)}</span>
              <span className="detail-price-unit">/ phần</span>
            </div>

            <div className="detail-short-desc">
              <p>{product.shortDescription}</p>
            </div>

            {/* Mô tả chi tiết */}
            <div className="detail-full-desc">
              <h3 className="detail-desc-heading">Giới thiệu hương vị</h3>
              <p>{product.description}</p>
            </div>

            {/* Bộ chọn số lượng & Nút thêm giỏ */}
            <div className="detail-action-box">
              <div className="quantity-selector-wrap">
                <span className="quantity-label">{t.shop.quantity}:</span>
                <div className="quantity-selector" role="group" aria-label="Chọn số lượng">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    aria-label="Giảm 1"
                  >
                    <Minus size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <span className="qty-value" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleIncrease}
                    aria-label="Tăng 1"
                  >
                    <Plus size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="detail-cta-row">
                <button
                  type="button"
                  className={`tb detail-add-cart-btn ${addedAnimation ? 'added' : ''}`}
                  onClick={handleAddToCart}
                >
                  {addedAnimation ? (
                    <>
                      <Check size={18} strokeWidth={2} aria-hidden="true" />
                      <span>{t.shop.addedToCart}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>{t.shop.addToCart}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="tb detail-back-btn"
                  onClick={() => navigate(basePath)}
                >
                  <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{t.shop.backToList}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Món cùng danh mục */}
      {relatedProducts.length > 0 && (
        <section className="detail-related-section s">
          <div className="related-header">
            <h2>{t.shop.relatedItems}</h2>
            <Link to={basePath} className="related-view-all">
              <span>Xem tất cả</span>
              <ChevronRight size={15} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>

          <div className="related-grid">
            {relatedProducts.map((item) => {
              const relHue = (item.id * 47) % 360;
              return (
                <article
                  key={item.id}
                  className="related-card"
                  onClick={() => navigate(`${basePath}/${item.slug}`)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`${basePath}/${item.slug}`);
                    }
                  }}
                >
                  <PhotoFrame
                    hue={relHue}
                    caption={`Ảnh: ${item.name}`}
                    src={item.imagePath}
                    className="related-photo"
                  />
                  <div className="related-body">
                    <h3 className="related-title">{item.name}</h3>
                    <p className="related-price">{formatPrice(item.price)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
