import { useState } from 'react';
import { Trash2, Plus, Minus, Phone, Utensils } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { HOTLINE_NUMBER } from '../../config/constants';

export interface OrderSummaryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  totalCount: number;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onPlaceOrder: () => void;
  submitting: boolean;
}

export function OrderSummary({
  items,
  subtotal,
  shippingFee,
  total,
  totalCount,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  submitting,
}: OrderSummaryProps) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const isFreeShipping = shippingFee === 0;

  return (
    <aside className="checkout-card checkout-summary-card">
      {/* Header */}
      <h2 className="checkout-card-title">Tóm tắt đơn hàng</h2>

      {/* Item List */}
      <div className="summary-items-list">
        {items.map((item) => (
          <div key={item.id} className="summary-item-row">
            {/* Thumbnail + Name + Price */}
            <div className="summary-item-left">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="summary-item-thumb"
                  loading="lazy"
                />
              ) : (
                <div className="summary-item-thumb-placeholder" aria-hidden="true">
                  <Utensils size={18} />
                </div>
              )}

              <div className="summary-item-info">
                <span className="summary-item-name">{item.name}</span>
                <span className="summary-item-price">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>

            {/* Controls (− / + / Trash): phẳng, không viền nút browser */}
            <div className="summary-item-controls">
              <button
                type="button"
                onClick={() => {
                  if (item.quantity > 1) {
                    onUpdateQuantity(item.id, item.quantity - 1);
                  } else {
                    onRemoveItem(item.id);
                  }
                }}
                className="summary-qty-btn"
                aria-label={`Giảm số lượng ${item.name}`}
              >
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span className="summary-qty-val">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="summary-qty-btn"
                aria-label={`Tăng số lượng ${item.name}`}
              >
                <Plus size={12} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="summary-trash-btn"
                title={`Xóa ${item.name}`}
                aria-label={`Xóa ${item.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Breakdown */}
      <div className="summary-cost-list">
        <div className="summary-cost-line">
          <span>Số lượng món:</span>
          <span>{totalCount} phần</span>
        </div>

        <div className="summary-cost-line">
          <span>Tạm tính:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="summary-cost-line">
          <span>Phí giao hàng:</span>
          {isFreeShipping ? (
            <span className="summary-free-ship">Miễn phí</span>
          ) : (
            <span>{formatPrice(shippingFee)}</span>
          )}
        </div>
      </div>

      {/* Total Row */}
      <div className="summary-total-line">
        <span className="summary-total-label">Tổng cộng:</span>
        <span className="summary-total-val">{formatPrice(total)}</span>
      </div>

      {/* Terms Agreement Checkbox */}
      <label className="summary-terms-label">
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.target.checked)}
        />
        <span>
          Tôi đồng ý với{' '}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ color: '#C2410C', textDecoration: 'none', fontWeight: 600 }}
          >
            Điều khoản dịch vụ
          </a>{' '}
          của Echora.
        </span>
      </label>

      {/* Hotline text */}
      <p
        style={{
          fontSize: '12px',
          color: '#78716C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          margin: '14px 0 0',
        }}
      >
        <Phone size={13} style={{ color: '#A8A29E' }} aria-hidden="true" />
        <span>Cần hỗ trợ? Gọi {HOTLINE_NUMBER} (7:00 - 22:00)</span>
      </p>

      {/* Place Order CTA Button */}
      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={submitting || items.length === 0 || !agreedTerms}
        className="checkout-order-submit-btn"
      >
        {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
      </button>
    </aside>
  );
}

export default OrderSummary;
