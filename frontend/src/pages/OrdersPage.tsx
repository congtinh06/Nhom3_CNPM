import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { getMyOrders, cancelBackendOrder, getOrders } from '../services/orderService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { formatPrice } from '../utils/formatters';
import { BackendOrder, BackendOrderStatus } from '../types';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { reorderItems, openCart } = useCart();
  const { showToast } = useToast();
  const { t } = useNavbarLanguage();

  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState<string | null>(null);

  const loadOrderHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyOrders();
      if (Array.isArray(data) && data.length > 0) {
        setOrders(data);
        setSelectedCode((prev) => prev || data[0]?.orderCode || null);
      } else {
        // Fallback: Nếu chưa có đơn backend thì đọc từ legacy local orders nếu có
        const legacy = getOrders();
        if (legacy.length > 0) {
          const converted: BackendOrder[] = legacy.map((leg, idx) => ({
            id: idx + 1,
            orderCode: leg.id,
            totalAmount: leg.total,
            status: leg.status === 'Đã hủy' ? 'CANCELLED' : 'PROCESSING',
            receiverName: leg.name,
            phone: leg.phone,
            address: leg.address,
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            items: leg.items.map((it) => ({
              productId: it.key,
              productName: it.name,
              unitPrice: it.price,
              quantity: it.quantity,
            })),
            createdAt: leg.date,
            updatedAt: leg.date,
          }));
          setOrders(converted);
          setSelectedCode((prev) => prev || converted[0]?.orderCode || null);
        } else {
          setOrders([]);
          setSelectedCode(null);
        }
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadOrderHistory();
  }, [loadOrderHistory]);

  const handleCancelOrder = async (orderCode: string) => {
    setCancellingCode(orderCode);
    setConfirmCancelModal(null);
    try {
      const updated = await cancelBackendOrder(orderCode);
      if (updated) {
        setOrders((prev) =>
          prev.map((o) => (o.orderCode === orderCode ? { ...o, status: 'CANCELLED' } : o))
        );
        showToast(t.shop.cancelSuccess);
      }
    } catch {
      showToast('Không thể hủy đơn hàng vào lúc này.');
    } finally {
      setCancellingCode(null);
    }
  };

  const handleReorder = (order: BackendOrder) => {
    const itemsToReorder = order.items.map((it) => ({
      key: it.productId,
      quantity: it.quantity,
      name: it.productName,
      price: it.unitPrice,
    }));
    reorderItems(itemsToReorder);
    showToast('Đã thêm lại các món vào giỏ hàng');
    openCart();
  };

  const getStatusBadge = (status: BackendOrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return {
          label: t.shop.statusPending,
          className: 'badge-pending',
          icon: <Clock size={13} strokeWidth={2} aria-hidden="true" />,
        };
      case 'PAID':
        return {
          label: t.shop.statusPaid,
          className: 'badge-paid',
          icon: <CheckCircle size={13} strokeWidth={2} aria-hidden="true" />,
        };
      case 'PROCESSING':
        return {
          label: t.shop.statusProcessing,
          className: 'badge-processing',
          icon: <Truck size={13} strokeWidth={2} aria-hidden="true" />,
        };
      case 'COMPLETED':
        return {
          label: t.shop.statusCompleted,
          className: 'badge-completed',
          icon: <CheckCircle size={13} strokeWidth={2} aria-hidden="true" />,
        };
      case 'CANCELLED':
        return {
          label: t.shop.statusCancelled,
          className: 'badge-cancelled',
          icon: <XCircle size={13} strokeWidth={2} aria-hidden="true" />,
        };
      default:
        return {
          label: status,
          className: 'badge-default',
          icon: null,
        };
    }
  };

  const selectedOrder = orders.find((o) => o.orderCode === selectedCode) || orders[0] || null;

  return (
    <div className="orders-page-container">
      {/* Banner */}
      <section className="orders-banner">
        <div className="orders-banner-content">
          <Link to="/" className="orders-back-link">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{t.home}</span>
          </Link>
          <h1 className="orders-page-title">{t.shop.orderHistory}</h1>
        </div>
      </section>

      {/* Main content */}
      <section className="orders-main-section s">
        {loading ? (
          <div className="orders-loading-box">
            <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="product-state-card empty-card">
            <ShoppingBag size={44} strokeWidth={1.5} className="state-icon" aria-hidden="true" />
            <h2>Bạn chưa có đơn hàng nào</h2>
            <p>Hãy khám phá các món ẩm thực và thức uống đặc sắc của Sài Gòn để đặt đơn hàng đầu tiên.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                type="button"
                className="tb"
                onClick={() => navigate('/am-thuc')}
              >
                Ẩm thực Sài Gòn
              </button>
              <button
                type="button"
                className="tb"
                onClick={() => navigate('/thuc-uong')}
              >
                Thức uống
              </button>
            </div>
          </div>
        ) : (
          <div className="orders-layout-grid">
            {/* Cột trái: Danh sách đơn hàng */}
            <div className="orders-list-panel">
              <h2 className="orders-panel-heading">Danh sách đơn ({orders.length})</h2>
              <div className="orders-list">
                {orders.map((o) => {
                  const badge = getStatusBadge(o.status);
                  const isSelected = selectedOrder?.orderCode === o.orderCode;

                  return (
                    <article
                      key={o.orderCode}
                      className={`order-summary-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedCode(o.orderCode)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedCode(o.orderCode);
                        }
                      }}
                      aria-pressed={isSelected}
                    >
                      <div className="order-summary-top">
                        <span className="order-summary-code">{o.orderCode}</span>
                        <span className={`order-status-badge ${badge.className}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="order-summary-meta">
                        <span className="order-summary-date">
                          {new Date(o.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <b className="order-summary-amount">{formatPrice(o.totalAmount)}</b>
                      </div>

                      <p className="order-summary-items-preview">
                        {o.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Chi tiết đơn hàng đã chọn */}
            <div className="order-detail-panel">
              {selectedOrder ? (
                <div className="order-detail-card">
                  <div className="order-detail-header">
                    <div className="order-detail-title-wrap">
                      <span className="order-detail-kicker">Chi tiết đơn hàng</span>
                      <h2 className="order-detail-code">{selectedOrder.orderCode}</h2>
                    </div>
                    {(() => {
                      const badge = getStatusBadge(selectedOrder.status);
                      return (
                        <span className={`order-status-badge large ${badge.className}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <div className="order-meta-info-grid">
                    <div className="meta-box">
                      <span className="meta-label">{t.shop.orderDate}:</span>
                      <span className="meta-value">
                        {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="meta-box">
                      <span className="meta-label">Phương thức:</span>
                      <span className="meta-value">
                        {selectedOrder.paymentMethod === 'MOCK_GATEWAY'
                          ? 'Cổng thanh toán điện tử'
                          : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
                      </span>
                    </div>

                    <div className="meta-box full-width">
                      <span className="meta-label">{t.shop.deliveryInfo}:</span>
                      <span className="meta-value">
                        <b>{selectedOrder.receiverName}</b> · {selectedOrder.phone}
                        <br />
                        {selectedOrder.address}
                        {selectedOrder.note && (
                          <span className="order-note-text">
                            <br />
                            Ghi chú: {selectedOrder.note}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Danh sách món */}
                  <div className="order-items-section">
                    <h3 className="order-items-heading">Món đã đặt</h3>
                    <div className="order-items-table">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="order-item-table-row">
                          <div className="item-name-info">
                            <span className="item-name">{item.productName}</span>
                            <span className="item-unit-price">
                              {formatPrice(item.unitPrice)}
                            </span>
                          </div>
                          <span className="item-qty">× {item.quantity}</span>
                          <b className="item-subtotal">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </b>
                        </div>
                      ))}
                    </div>

                    <div className="order-detail-total-bar">
                      <span className="total-label">{t.shop.total}:</span>
                      <b className="total-amount">{formatPrice(selectedOrder.totalAmount)}</b>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="order-actions-bar">
                    <button
                      type="button"
                      className="tb order-reorder-btn"
                      onClick={() => handleReorder(selectedOrder)}
                    >
                      <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                      <span>{t.shop.reorder}</span>
                    </button>

                    {/* Nút thanh toán lại khi đơn MOCK_GATEWAY chưa thanh toán */}
                    {selectedOrder.status === 'PENDING_PAYMENT' &&
                      selectedOrder.paymentMethod === 'MOCK_GATEWAY' && (
                        <button
                          type="button"
                          className="tb order-pay-now-btn"
                          onClick={() =>
                            navigate(
                              `/thanh-toan/ket-qua?orderCode=${encodeURIComponent(selectedOrder.orderCode)}&method=MOCK_GATEWAY`
                            )
                          }
                        >
                          <CreditCard size={15} strokeWidth={2} aria-hidden="true" />
                          <span>Thanh toán ngay</span>
                        </button>
                      )}

                    {/* Nút hủy đơn: Cho phép hủy khi PENDING_PAYMENT hoặc PROCESSING */}
                    {(selectedOrder.status === 'PENDING_PAYMENT' ||
                      selectedOrder.status === 'PROCESSING') && (
                      <button
                        type="button"
                        className="tb order-cancel-btn"
                        disabled={cancellingCode === selectedOrder.orderCode}
                        onClick={() => setConfirmCancelModal(selectedOrder.orderCode)}
                      >
                        <Ban size={15} strokeWidth={2} aria-hidden="true" />
                        <span>{t.shop.cancelOrder}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {/* Modal xác nhận hủy đơn */}
      {confirmCancelModal && (
        <div className="cancel-confirm-backdrop" onClick={() => setConfirmCancelModal(null)}>
          <div
            className="cancel-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <h3 id="cancel-title">Xác nhận hủy đơn</h3>
            <p>
              Bạn có chắc chắn muốn hủy đơn hàng <b>{confirmCancelModal}</b> không? Thao tác này không thể hoàn tác.
            </p>
            <div className="cancel-dialog-buttons">
              <button
                type="button"
                className="tb cancel-btn-confirm"
                onClick={() => handleCancelOrder(confirmCancelModal)}
              >
                Đồng ý hủy
              </button>
              <button
                type="button"
                className="tb cancel-btn-dismiss"
                onClick={() => setConfirmCancelModal(null)}
              >
                Giữ đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
