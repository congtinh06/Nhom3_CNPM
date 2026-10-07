import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavbarLanguage } from '../../content/languages';
import { formatPrice as formatPriceUtil } from '../../utils/formatters';

export const formatPrice = (n: number): string => {
  return formatPriceUtil(n);
};

export const CartDialog: React.FC = () => {
  const {
    cartItems,
    totalAmount,
    totalCount,
    decreaseQuantity,
    addToCart,
    removeFromCart,
    clearCart,
    isCartOpen,
    closeCart,
  } = useCart();

  const navigate = useNavigate();
  const { t } = useNavbarLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isCartOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isCartOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      closeCart();
    }
  };

  const handleGoToCheckout = () => {
    closeCart();
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
      className="cart-dialog"
      onClick={handleBackdropClick}
      onClose={closeCart}
      aria-label={t.shop.cartTitle}
    >
      <div className="cart-dialog-header">
        <div className="cart-dialog-title-wrap">
          <ShoppingBag size={22} strokeWidth={1.75} className="cart-header-icon" aria-hidden="true" />
          <h3>{t.shop.cartTitle}</h3>
          {totalCount > 0 && <span className="cart-count-pill">{totalCount}</span>}
        </div>
        <button
          type="button"
          className="cart-close-btn"
          onClick={closeCart}
          aria-label="Đóng giỏ hàng"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <div id="cl" className="cart-item-list">
        {cartItems.length === 0 ? (
          <div className="cart-empty-box">
            <ShoppingBag size={44} strokeWidth={1.5} className="cart-empty-icon" aria-hidden="true" />
            <p>{t.shop.cartEmpty}</p>
            <button
              type="button"
              className="tb cart-browse-btn"
              onClick={handleBrowseFood}
            >
              {t.shop.continueShopping}
            </button>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="cart-item-row">
              <div className="cart-item-info">
                <span className="cart-item-name">{item.name}</span>
                <span className="cart-item-unit-price">{formatPrice(item.price)}</span>
              </div>

              <div className="cart-item-actions">
                <div className="cart-qty-ctrls">
                  <button
                    type="button"
                    className="cart-qty-btn"
                    aria-label={`Giảm số lượng ${item.name}`}
                    onClick={() => decreaseQuantity(item.id)}
                  >
                    <Minus size={12} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <span className="cart-qty-val" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="cart-qty-btn"
                    aria-label={`Tăng số lượng ${item.name}`}
                    onClick={() => addToCart(item.id)}
                  >
                    <Plus size={12} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>

                <b className="cart-item-subtotal">
                  {formatPrice(item.price * item.quantity)}
                </b>

                <button
                  type="button"
                  className="cart-remove-item-btn"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                  title="Xóa món này"
                >
                  <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="cart-dialog-footer">
          <div className="cart-total-bar">
            <span className="cart-total-label">{t.shop.total}:</span>
            <b id="ctt" className="cart-total-value">
              {formatPrice(totalAmount)}
            </b>
          </div>

          <div className="cart-footer-buttons">
            <button
              type="button"
              className="tb cart-clear-btn"
              onClick={clearCart}
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
              <span>{t.shop.clearCart}</span>
            </button>

            <button
              id="oo"
              type="button"
              className="tb cart-checkout-btn"
              onClick={handleGoToCheckout}
            >
              <span>{t.shop.checkout}</span>
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
};

export default CartDialog;
