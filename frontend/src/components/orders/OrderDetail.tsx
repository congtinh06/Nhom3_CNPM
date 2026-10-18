import {
  RotateCcw,
  CreditCard,
  Ban,
  UtensilsCrossed,
  Check,
  Clock,
  Package,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { BackendOrder } from '../../types';
import { StatusBadge } from './StatusBadge';
import {
  formatPrice,
  formatDateTime,
  formatPhone,
  composeAddress,
  isValidOrderNote,
} from '../../utils/formatters';

export interface OrderDetailProps {
  order: BackendOrder;
  onReorder: (order: BackendOrder) => void;
  onCancelClick: (orderCode: string) => void;
  onPayNow?: (orderCode: string) => void;
  cancellingCode?: string | null;
}

export const OrderDetail= ({
  order,
  onReorder,
  onCancelClick,
  onPayNow,
  cancellingCode,
}: OrderDetailProps) => {
  // Timeline calculation (D.11)
  const getTimelineStepIndex = (status: string): number => {
    const s = (status || '').toUpperCase();
    if (s === 'CANCELLED' || s === 'ĐÃ HỦY') return -1;
    if (s === 'COMPLETED' || s === 'PAID' || s === 'ĐÃ GIAO') return 4; // all done
    if (s === 'SHIPPING' || s === 'DELIVERING' || s === 'ĐANG GIAO') return 2; // step 3 active
    if (s === 'PROCESSING' || s === 'ĐANG XỬ LÝ') return 1; // step 2 active
    return 0; // step 1 active (PENDING / PENDING_PAYMENT)
  };

  const currentStepIdx = getTimelineStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  const timelineSteps = [
    { label: 'Đã nhận', icon: Clock },
    { label: 'Chuẩn bị', icon: Package },
    { label: 'Đang giao', icon: Truck },
    { label: 'Hoàn tất', icon: CheckCircle2 },
  ];

  // Delivery slot label
  const getDeliverySlotLabel = (): string => {
    if (order.deliveryTimeType === 'NOW') {
      return 'Giao ngay trong 30 phút';
    }
    if (order.scheduledTime) {
      return `Giao vào khung ${order.scheduledTime}`;
    }
    return 'Giao hàng tiêu chuẩn';
  };

  // Subtotal & Shipping fee (C.5)
  const subtotalAmount =
    order.subtotal != null
      ? order.subtotal
      : order.items && order.items.length > 0
      ? order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      : order.totalAmount;

  // TODO: Backend must persist shipping_fee on order creation
  const shippingFeeText = (): string => {
    if (order.shippingFee === undefined || order.shippingFee === null) {
      return 'Chưa xác định';
    }
    if (order.shippingFee === 0) {
      return 'Miễn phí';
    }
    return formatPrice(order.shippingFee);
  };

  const isPaid =
    order.paymentStatus === 'SUCCESS' ||
    order.status === 'PAID' ||
    order.status === 'COMPLETED';

  const canCancel =
    order.status === 'PENDING_PAYMENT' ||
    order.status === 'PROCESSING';

  // TODO: Remove test data from seed before production
  const hasValidNote = isValidOrderNote(order.note);

  return (
    <div className="order-detail-card">
      {/* Header */}
      <div className="order-detail-header">
        <div>
          <span className="order-detail-kicker">
            Chi tiết đơn hàng
          </span>
          <h2 className="order-detail-code">
            {order.orderCode}
          </h2>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* D.11 Compact Horizontal Timeline */}
      <div className="order-timeline-box">
        {isCancelled ? (
          <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
            Đơn hàng đã được hủy. Quý khách có thể chọn đặt lại món bất cứ lúc nào.
          </div>
        ) : (
          <div className="order-timeline-steps">
            {/* Connecting line */}
            <div className="order-timeline-line" />
            <div
              className="order-timeline-progress"
              style={{
                width:
                  currentStepIdx === 0
                    ? '0%'
                    : currentStepIdx === 1
                    ? '33%'
                    : currentStepIdx === 2
                    ? '66%'
                    : '100%',
              }}
            />

            {timelineSteps.map((step, idx) => {
              const isPast = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={idx} className="order-timeline-step">
                  <div
                    className={`order-timeline-circle ${
                      isPast ? 'past' : isCurrent ? 'current' : ''
                    }`}
                  >
                    {isPast ? <Check size={14} strokeWidth={2.5} /> : idx + 1}
                  </div>
                  <span
                    className={`order-timeline-label ${
                      isCurrent ? 'active' : ''
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline details: delivery slot & payment status */}
        <div className="order-timeline-footer">
          <div>
            <span style={{ fontWeight: 600, color: '#1C1917' }}>Thời gian giao: </span>
            <span>{getDeliverySlotLabel()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 600, color: '#1C1917' }}>Thanh toán: </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                background: isPaid ? '#F0FDF4' : '#FEFCE8',
                color: isPaid ? '#15803D' : '#A16207',
                border: isPaid ? '1px solid #BBF7D0' : '1px solid #FEF08A',
              }}
            >
              {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Info Grid (D.6, D.7) */}
      <div className="order-detail-meta-grid">
        <div className="order-detail-meta-row">
          <span className="order-detail-meta-label">
            NGÀY ĐẶT
          </span>
          <span className="order-detail-meta-value">
            {formatDateTime(order.createdAt)}
          </span>
        </div>

        <div className="order-detail-meta-row">
          <span className="order-detail-meta-label">
            PHƯƠNG THỨC
          </span>
          <span className="order-detail-meta-value">
            {order.paymentMethod === 'MOCK_GATEWAY'
              ? 'Cổng thanh toán điện tử'
              : 'Thanh toán khi nhận hàng (COD)'}
          </span>
        </div>

        <div className="order-detail-meta-row">
          <span className="order-detail-meta-label">
            THÔNG TIN NHẬN HÀNG
          </span>
          <div className="order-detail-meta-value">
            <span style={{ fontWeight: 600 }}>{order.receiverName}</span>,{' '}
            <span>{formatPhone(order.phone)}</span>
            <p style={{ margin: '4px 0 0', color: '#78716C', lineHeight: 1.5 }}>
              {composeAddress(order)}
            </p>
            {hasValidNote && (
              <p style={{ margin: '4px 0 0', color: '#78716C', fontStyle: 'italic' }}>
                Ghi chú: {order.note}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* D.8 Items Table */}
      <div style={{ marginBottom: 20 }}>
        <h3 className="order-items-heading">
          Món đã đặt
        </h3>
        <div className="order-items-table">
          {order.items.map((item, idx) => (
            <div key={idx} className="order-item-table-row">
              {/* Item Thumbnail */}
              <div className="order-item-thumb">
                {item.imagePath ? (
                  <img
                    src={item.imagePath}
                    alt={item.productName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <UtensilsCrossed size={18} strokeWidth={1.5} />
                )}
              </div>

              {/* Item Name & Unit Price */}
              <div className="order-item-info">
                <span className="order-item-name">
                  {item.productName}
                </span>
                {item.selectedOptions && (
                  <span
                    className="order-item-options"
                    style={{ fontSize: 12, color: '#78716C', display: 'block', marginTop: 2 }}
                  >
                    {item.selectedOptions}
                  </span>
                )}
                <span className="order-item-unit-price">
                  {formatPrice(item.unitPrice)}
                </span>
              </div>

              {/* Quantity */}
              <span className="order-item-qty">
                × {item.quantity}
              </span>

              {/* Subtotal */}
              <span className="order-item-subtotal">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Subtotal & Shipping fee rows (C.5) */}
        <div className="order-detail-calc-rows">
          <div className="order-detail-calc-row">
            <span>Tạm tính</span>
            <span className="order-detail-calc-val">
              {formatPrice(subtotalAmount)}
            </span>
          </div>

          <div className="order-detail-calc-row">
            <span>Phí giao hàng</span>
            <span
              className="order-detail-calc-val"
              style={{
                color: shippingFeeText() === 'Miễn phí' ? '#C2410C' : '#1C1917',
              }}
            >
              {shippingFeeText()}
            </span>
          </div>

          {order.discountAmount ? (
            <div className="order-detail-calc-row">
              <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
              <span className="order-detail-calc-val" style={{ color: '#C2410C', fontWeight: 600 }}>
                -{formatPrice(order.discountAmount)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Total Bar */}
        <div className="order-detail-total-bar">
          <span className="order-detail-total-label">Tổng cộng</span>
          <span className="order-detail-total-amount">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Action Buttons (D.9) */}
      <div className="order-actions-bar">
        <button
          type="button"
          onClick={() => onReorder(order)}
          className="order-reorder-btn"
        >
          <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
          <span>Mua lại</span>
        </button>

        {order.status === 'PENDING_PAYMENT' &&
          order.paymentMethod === 'MOCK_GATEWAY' &&
          onPayNow && (
            <button
              type="button"
              onClick={() => onPayNow(order.orderCode)}
              className="order-pay-now-btn"
            >
              <CreditCard size={14} strokeWidth={2} aria-hidden="true" />
              <span>Thanh toán ngay</span>
            </button>
          )}

        {canCancel && (
          <button
            type="button"
            disabled={cancellingCode === order.orderCode}
            onClick={() => onCancelClick(order.orderCode)}
            className="order-cancel-btn"
          >
            <Ban size={14} strokeWidth={2} aria-hidden="true" />
            <span>Hủy đơn</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
