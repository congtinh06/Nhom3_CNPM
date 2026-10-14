import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, CreditCard, Star, Heart, Plus, Minus, Check, Clock, Utensils } from 'lucide-react';
import { Product, ProductOptions } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
  onAddToCart: (product: Product, quantity: number, options?: ProductOptions) => void;
  onBuyNow: (product: Product, quantity: number, options?: ProductOptions) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  isFavorited,
  onToggleFavorite,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState<'M' | 'L'>('M');
  const [sugar, setSugar] = useState<'Ít' | 'Vừa' | 'Nhiều'>('Vừa');
  const [ice, setIce] = useState<'Ít' | 'Vừa' | 'Nhiều'>('Vừa');
  const [foodNote, setFoodNote] = useState<string>('Cay vừa');
  const [imageError, setImageError] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSize('M');
      setSugar('Vừa');
      setIce('Vừa');
      setFoodNote('Cay vừa');
      setImageError(false);
      setAddedSuccess(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Price adjustment for Size L (+5.000đ)
  const sizeSurcharge = product.hasDrinkOptions && size === 'L' ? 5000 : 0;
  const unitPrice = product.price + sizeSurcharge;
  const totalPrice = unitPrice * quantity;

  const currentOptions: ProductOptions = product.hasDrinkOptions
    ? { size, sugar, ice }
    : { note: foodNote };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAdd = () => {
    if (!product.isActive) return;
    onAddToCart(product, quantity, currentOptions);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 650);
  };

  const handleBuy = () => {
    if (!product.isActive) return;
    onBuyNow(product, quantity, currentOptions);
  };

  const ratingValue = product.rating || 4.9;
  const reviewsCount = product.reviewsCount || 100;

  return (
    <div
      className="food-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="food-modal-card">
        {/* Nút đóng modal */}
        <button
          type="button"
          className="food-modal-close-btn"
          onClick={onClose}
          aria-label="Đóng cửa sổ chi tiết món"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>

        <div className="food-modal-content-grid">
          {/* Cột trái: Ảnh lớn */}
          <div className="food-modal-media-col">
            <div className="food-modal-image-wrap">
              {!imageError ? (
                <img
                  src={product.imagePath}
                  alt={product.name}
                  className="food-modal-img"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="food-modal-placeholder">
                  <span className="placeholder-brand">ECHORA</span>
                  <span className="placeholder-name">{product.name}</span>
                </div>
              )}

              {product.badge && (
                <span className="food-modal-badge">{product.badge}</span>
              )}

              <button
                type="button"
                className={`food-modal-fav-btn ${isFavorited ? 'is-active' : ''}`}
                onClick={() => onToggleFavorite(product.id)}
                aria-label={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích món này'}
              >
                <Heart
                  size={20}
                  strokeWidth={1.8}
                  className={`heart-icon ${isFavorited ? 'heart-filled' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* Thông tin phụ: Chuẩn bị & Khẩu phần */}
            <div className="food-modal-meta-pills">
              <div className="meta-pill">
                <Clock size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>Chuẩn bị: {product.prepTime || '10 - 15 phút'}</span>
              </div>
              <div className="meta-pill">
                <Utensils size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>Khẩu phần: {product.portion || '1 phần chuẩn'}</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Thông tin chi tiết & Tùy chọn đặt món */}
          <div className="food-modal-info-col">
            {/* Đánh giá */}
            <div className="food-modal-rating-row">
              <div className="food-stars-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    strokeWidth={1.5}
                    className={`star-icon ${i < Math.floor(ratingValue) ? 'star-filled' : 'star-empty'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="rating-num">{ratingValue.toFixed(1)}</span>
              <span className="reviews-num">({reviewsCount} lượt đánh giá)</span>
            </div>

            {/* Tên món */}
            <h2 id="modal-product-title" className="food-modal-title">
              {product.name}
            </h2>

            {/* Giá */}
            <div className="food-modal-price-row">
              <span className="food-modal-current-price">{formatPrice(unitPrice)}</span>
              {product.oldPrice && (
                <span className="food-modal-old-price">{formatPrice(product.oldPrice)}</span>
              )}
              {sizeSurcharge > 0 && (
                <span className="food-modal-surcharge-note">(Đã cộng Size L: +5.000đ)</span>
              )}
            </div>

            {/* Mô tả ngắn & chi tiết */}
            <p className="food-modal-short-desc">{product.shortDescription}</p>
            <p className="food-modal-full-desc">{product.description}</p>

            {/* Các tùy chọn cho thức uống */}
            {product.hasDrinkOptions ? (
              <div className="food-modal-options-section">
                {/* 1. Chọn Size */}
                <div className="option-group">
                  <span className="option-title">Kích cỡ ly:</span>
                  <div className="option-pills" role="radiogroup" aria-label="Chọn kích cỡ ly">
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

                {/* 2. Lượng đường */}
                <div className="option-group">
                  <span className="option-title">Lượng đường:</span>
                  <div className="option-pills" role="radiogroup" aria-label="Chọn lượng đường">
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

                {/* 3. Lượng đá */}
                <div className="option-group">
                  <span className="option-title">Lượng đá:</span>
                  <div className="option-pills" role="radiogroup" aria-label="Chọn lượng đá">
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
              /* Tùy chọn khẩu vị cho món ăn */
              <div className="food-modal-options-section">
                <div className="option-group">
                  <span className="option-title">Ghi chú khẩu vị:</span>
                  <div className="option-pills" role="radiogroup" aria-label="Ghi chú khẩu vị">
                    {['Không cay', 'Cay vừa', 'Cay nhiều', 'Đồ chua để riêng'].map((noteOpt) => (
                      <button
                        key={noteOpt}
                        type="button"
                        className={`option-btn ${foodNote === noteOpt ? 'selected' : ''}`}
                        onClick={() => setFoodNote(noteOpt)}
                      >
                        {noteOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chọn số lượng & Tổng tiền */}
            <div className="food-modal-quantity-row">
              <div className="quantity-control-group">
                <span className="quantity-label">Số lượng:</span>
                <div className="quantity-buttons-wrap">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                    aria-label="Giảm 1 phần"
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
                    aria-label="Tăng 1 phần"
                  >
                    <Plus size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="modal-subtotal-box">
                <span className="subtotal-label">Tạm tính:</span>
                <b className="subtotal-value">{formatPrice(totalPrice)}</b>
              </div>
            </div>

            {/* Cụm nút hành động */}
            <div className="food-modal-actions-row">
              <button
                type="button"
                className={`food-modal-add-btn ${addedSuccess ? 'is-success' : ''}`}
                onClick={handleAdd}
                disabled={!product.isActive}
              >
                {addedSuccess ? (
                  <>
                    <Check size={18} strokeWidth={2.2} aria-hidden="true" />
                    <span>Đã thêm vào giỏ</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>Thêm vào giỏ hàng</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="food-modal-buy-btn"
                onClick={handleBuy}
                disabled={!product.isActive}
              >
                <CreditCard size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>Mua ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
