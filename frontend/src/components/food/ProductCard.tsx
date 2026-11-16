import React, { useState } from 'react';
import { Plus, Heart, Check, Star } from 'lucide-react';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { usePremium } from '../../context/PremiumContext';
import { applySouvenirDiscount, isSouvenirDiscountEligible } from '../../utils/pricing';
import { useNavbarLanguage } from '../../content/languages';

interface ProductCardProps {
  product: Product;
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onSelect: (product: Product) => void;
  showRating?: boolean;
  neutralPlaceholder?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  onSelect,
  showRating = true,
  neutralPlaceholder = false,
}) => {
  const { isPremium, hasAnyPurchase } = usePremium();
  const { lang } = useNavbarLanguage();
  const isEligible = isPremium || hasAnyPurchase;
  const [imageError, setImageError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const hasDiscount = isSouvenirDiscountEligible(isEligible, product.category);
  const effectivePrice = applySouvenirDiscount(product.price, isEligible, product.category);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(product.id);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isActive) return;
    onAddToCart(product, e);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const isOutOfStock = !product.isActive;
  const ratingValue = product.rating || 4.8;

  return (
    <article
      className={`editorial-product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
      onClick={() => onSelect(product)}
      tabIndex={0}
      role="button"
      aria-label={`${product.name} - ${formatPrice(effectivePrice)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product);
        }
      }}
    >
      {/* 1. Phần hình ảnh: 4:3 ratio, rounded-md, hover scale-105 */}
      <div className="editorial-card-media-wrap">
        {!imageError ? (
          <img
            src={product.imagePath}
            alt={product.name}
            width={400}
            height={500}
            loading="lazy"
            decoding="async"
            className="editorial-card-img"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`editorial-card-placeholder ${neutralPlaceholder ? 'is-neutral' : ''}`}>
            {!neutralPlaceholder && <span className="placeholder-brand">ECHORA</span>}
            <span className="placeholder-name">{product.name}</span>
          </div>
        )}

        {/* Badge: top-left, small, uppercase, tracking-wide, bg-accent, text-white, rounded-sm (not pill) */}
        {product.badge && (
          <span className="editorial-badge-rect">
            {product.badge.toUpperCase()}
          </span>
        )}

        {isOutOfStock && (
          <span className="editorial-badge-rect badge-stock-out">
            {lang === 'en' ? 'SOLD OUT' : lang === 'ja' ? '在庫切れ' : lang === 'ko' ? '일시 품절' : 'TẠM HẾT'}
          </span>
        )}

        {/* Heart icon: top-right, white circle bg with subtle shadow */}
        <button
          type="button"
          className={`editorial-heart-btn ${isFavorited ? 'is-active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? `Bỏ yêu thích ${product.name}` : `Yêu thích ${product.name}`}
          title={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <Heart
            size={16}
            strokeWidth={2}
            className={`heart-icon ${isFavorited ? 'heart-filled' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 2. Nội dung thông tin món: padding 16px (p-4) */}
      <div className="editorial-card-content">
        {showRating && (
          <div className="editorial-rating-badge" aria-label={`Đánh giá ${ratingValue} sao`}>
            <Star size={12} className="star-gold-fill" />
            <span className="rating-num">{ratingValue.toFixed(1)}</span>
          </div>
        )}

        {/* Tên món: font-display (Playfair Display), text-lg, font-semibold, line-clamp-1 */}
        <h3 className="editorial-product-name" title={product.name}>
          {product.name}
        </h3>

        {/* Mô tả: text-sm, text-secondary, line-clamp-2, mt-1 */}
        <p className="editorial-product-desc" title={product.shortDescription}>
          {product.shortDescription}
        </p>

        {/* Chân card: price bên trái (Space Grotesk tabular-nums), Thêm vào giỏ bên phải outlined pill có icon plus */}
        <div className="editorial-card-bottom-row">
          <div className="editorial-price-box">
            <span className="editorial-price-amount">{formatPrice(effectivePrice)}</span>
            {hasDiscount ? (
              <>
                <span className="editorial-old-price">{formatPrice(product.price)}</span>
                <span className="editorial-premium-discount">Premium -10%</span>
              </>
            ) : (
              product.oldPrice &&
              product.oldPrice > product.price && (
                <span className="editorial-old-price">{formatPrice(product.oldPrice)}</span>
              )
            )}
          </div>

          <button
            type="button"
            className={`editorial-add-btn ${justAdded ? 'is-added' : ''}`}
            onClick={handleAddToCartClick}
            disabled={isOutOfStock}
            aria-label={
              lang === 'en'
                ? `Add ${product.name} to cart`
                : lang === 'ja'
                  ? `${product.name}をカートに追加`
                  : lang === 'ko'
                    ? `${product.name} 장바구니 담기`
                    : `Thêm ${product.name} vào giỏ hàng`
            }
          >
            {justAdded ? (
              <>
                <Check size={14} strokeWidth={2.5} />
                <span>{lang === 'en' ? 'Added' : lang === 'ja' ? '追加済' : lang === 'ko' ? '추가됨' : 'Đã thêm'}</span>
              </>
            ) : (
              <>
                <Plus size={14} strokeWidth={2.2} />
                <span>{lang === 'en' ? 'Add' : lang === 'ja' ? '追加' : lang === 'ko' ? '담기' : 'Thêm'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
