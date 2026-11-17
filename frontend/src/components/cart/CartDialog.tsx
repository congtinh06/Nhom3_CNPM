import React, { useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useAuthOptional } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavbarLanguage } from '../../content/languages';
import { getSpotName } from '../../content/souvenirSpots';
import { CartItem } from '../../types';
import { formatPrice as formatPriceUtil } from '../../utils/formatters';
import { usePremium } from '../../context/PremiumContext';
import { applySouvenirDiscount, isSouvenirDiscountEligible } from '../../utils/pricing';
import { resolveOrderItemImage } from '../../content/productAdapter';
import '../../styles/cart-drawer.css';

export const formatPrice = (n: number): string => {
  return formatPriceUtil(n);
};

const OTHER_GROUP_LABEL: Record<string, string> = {
  vi: 'Khác',
  en: 'Other',
  ja: 'その他',
  ko: '기타',
};

export const CartDialog: React.FC = () => {
  const {
    cartItems,
    subtotalAmount,
    discountAmount,
    totalAmount,
    totalCount,
    decreaseQuantity,
    addToCart,
    removeFromCart,
    isCartOpen,
    closeCart,
  } = useCart();
  const { isPremium, hasAnyPurchase } = usePremium();
  const isDiscountEligible = isPremium || hasAnyPurchase;
  const auth = useAuthOptional();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useNavbarLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const otherLabel = OTHER_GROUP_LABEL[lang] || OTHER_GROUP_LABEL.vi;

  // Gom nhóm sản phẩm trong giỏ theo điểm du lịch (sản phẩm cũ không có điểm nằm ở nhóm riêng).
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, CartItem[]>();
    cartItems.forEach((item) => {
      const key = item.poiSlug || '__other__';
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(item);
    });
    return order.map((key) => ({
      key,
      label: key === '__other__' ? null : getSpotName(key, lang),
      items: map.get(key)!,
    }));
  }, [cartItems, lang]);

  const showGroupHeadings = groups.length > 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isCartOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

      if (!dialog.open) {
        dialog.showModal();
      }

      // Lock page scroll while drawer is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Move focus into drawer
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusable[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeCart();
          return;
        }

        if (e.key === 'Tab') {
          const focusableElements = dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];
          if (!first || !last) return;

          if (e.shiftKey) {
            if (document.activeElement === first || !dialog.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !dialog.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      dialog.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        dialog.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      if (dialog.open) {
        dialog.close();
      }
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
  }, [isCartOpen, closeCart]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      closeCart();
    }
  };

  const handleGoToCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/dang-nhap', {
        state: { backgroundLocation: location, from: '/thanh-toan' },
      });
      return;
    }
    navigate('/thanh-toan');
  };

  const handleBrowseFood = () => {
    closeCart();
    navigate('/am-thuc');
  };

  return (
    <dialog
      id="ca"
      ref={dialogRef}
      className="cd-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      onClick={handleBackdropClick}
      onCancel={(e) => {
        e.preventDefault();
        closeCart();
      }}
    >
      {/* Drawer Header */}
      <div className="cd-header">
        <div className="cd-header-title-wrap">
          <h2 id="cd-title" className="cd-title">
            {t.shop.cartTitle}
          </h2>
          {totalCount > 0 && <span className="cd-count-badge">({totalCount})</span>}
        </div>
        <button
          type="button"
          className="cd-close-btn"
          onClick={closeCart}
          aria-label="Đóng giỏ hàng"
        >
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {/* Drawer Body: Empty State or Items List */}
      <div id="cl" className="cd-body">
        {cartItems.length === 0 ? (
          <div className="cd-empty-state">
            <p className="cd-empty-title">{t.shop.cartEmpty}</p>
            <p className="cd-empty-subtitle">
              Khám phá quà lưu niệm đặc sản Sài Gòn và chọn món bạn yêu thích.
            </p>
            <button
              type="button"
              className="cd-btn-primary cd-browse-btn"
              onClick={handleBrowseFood}
            >
              {t.shop.continueShopping}
            </button>
          </div>
        ) : (
          <div className="cd-items-list">
            {groups.map((group) => (
              <div key={group.key} className="cd-group">
                {showGroupHeadings && (
                  <div className="cd-group-title">{group.label ?? otherLabel}</div>
                )}
                {group.items.map((item) => {
                  const hasDiscount = isSouvenirDiscountEligible(isDiscountEligible, item.category);
                  const itemUnitPrice = applySouvenirDiscount(
                    item.price,
                    isDiscountEligible,
                    item.category
                  );
                  return (
              <div key={item.id} className="cd-item-row">
                {/* Thumbnail 72x72 */}
                <div className="cd-thumb-wrap">
                  {(() => {
                    const resolvedThumb = resolveOrderItemImage(item);
                    return resolvedThumb ? (
                      <img
                        src={resolvedThumb}
                        alt={item.name}
                        className="cd-item-thumb"
                        width="72"
                        height="72"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null;
                  })()}
                  <div
                    className="cd-thumb-placeholder"
                    aria-hidden="true"
                    style={{ display: resolveOrderItemImage(item) ? 'none' : 'flex' }}
                  >
                    <span>SG</span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="cd-item-main">
                  <div className="cd-item-header">
                    <span className="cd-item-name">{item.name}</span>
                    <span className="cd-item-total">
                      {formatPrice(itemUnitPrice * item.quantity)}
                    </span>
                  </div>

                  <div className="cd-item-price-line">
                    <span className="cd-item-unit-price">
                      {formatPrice(itemUnitPrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="cd-item-old-price">{formatPrice(item.price)}</span>
                        <span className="cd-item-discount-badge">Premium -10%</span>
                      </>
                    )}
                  </div>

                  <div className="cd-item-footer">
                    {/* Stepper */}
                    <div className="cd-qty-stepper">
                      <button
                        type="button"
                        className="cd-qty-btn"
                        aria-label={`Giảm số lượng ${item.name}`}
                        onClick={() => decreaseQuantity(item.id)}
                      >
                        <Minus size={12} strokeWidth={2} aria-hidden="true" />
                      </button>
                      <span className="cd-qty-value" aria-label={`Số lượng: ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="cd-qty-btn"
                        aria-label={`Tăng số lượng ${item.name}`}
                        onClick={() => addToCart(item.id)}
                      >
                        <Plus size={12} strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>

                    {/* Small remove text button */}
                    <button
                      type="button"
                      className="cd-remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Footer: only when items exist */}
      {cartItems.length > 0 && (
        <div className="cd-footer" aria-live="polite">
          {discountAmount > 0 && (
            <>
              <div className="cd-subtotal-row cd-discount-row">
                <span>Premium -10%</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
              <div className="cd-subtotal-row cd-subtotal-before">
                <span>Tạm tính</span>
                <span>{formatPrice(subtotalAmount)}</span>
              </div>
            </>
          )}
          <div className="cd-subtotal-row">
            <span className="cd-subtotal-label">{t.shop.total}</span>
            <span id="ctt" className="cd-subtotal-amount">
              {formatPrice(totalAmount)}
            </span>
          </div>

          <div className="cd-shipping-note">
            <span>Phí giao hàng</span>
            <strong>Miễn phí</strong>
          </div>

          <button
            id="oo"
            type="button"
            className="cd-btn-primary cd-checkout-btn"
            onClick={handleGoToCheckout}
          >
            {t.shop.checkout}
          </button>

          <button
            type="button"
            className="cd-orders-link"
            onClick={() => {
              closeCart();
              navigate('/don-hang');
            }}
          >
            Đơn hàng đã đặt
          </button>
        </div>
      )}
    </dialog>
  );
};

export default CartDialog;
