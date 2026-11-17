import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { getMyOrders, cancelBackendOrder, createVnPayPayment } from '../services/orderService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { formatPrice } from '../utils/formatters';
import { BackendOrder } from '../types';
import { StatusBadge } from '../components/orders/StatusBadge';
import '../styles/orders.css';

interface OrdersPageProps {
  embedded?: boolean;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { reorderItems, openCart } = useCart();
  const { showToast } = useToast();
  const { t } = useNavbarLanguage();

  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState<string | null>(null);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const detailBodyRef = useRef<HTMLDivElement | null>(null);

  const loadOrderHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyOrders();
      setOrders(data);
      setSelectedCode((prev) => prev || data[0]?.orderCode || null);
    } catch {
      setOrders([]);
      setSelectedCode(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!embedded) window.scrollTo(0, 0);
    loadOrderHistory();
  }, [embedded, loadOrderHistory]);

  // Reset detail body scroll position to top when switching orders
  useEffect(() => {
    if (detailBodyRef.current) {
      detailBodyRef.current.scrollTop = 0;
    }
  }, [selectedCode]);

  // Scroll active order summary item into view inside list container if outside visible area
  useEffect(() => {
    if (!selectedCode || !listContainerRef.current) return;
    const container = listContainerRef.current;
    const activeItem = container.querySelector<HTMLElement>('.order-summary-item.active');
    if (!activeItem) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const deltaTop = itemRect.top - containerRect.top;
    const deltaBottom = itemRect.bottom - containerRect.bottom;

    if (deltaTop < 0) {
      container.scrollTop += deltaTop;
    } else if (deltaBottom > 0) {
      container.scrollTop += deltaBottom;
    }
  }, [selectedCode]);

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
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể hủy đơn hàng vào lúc này.');
    } finally {
      setCancellingCode(null);
    }
  };

  const handleVnPayPayment = async (orderCode: string) => {
    try {
      const paymentUrl = await createVnPayPayment(orderCode);
      window.location.assign(paymentUrl);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Không thể tạo liên kết thanh toán VNPAY.',
      );
    }
  };

  const handleReorder = (order: BackendOrder) => {
    const itemsToReorder = order.items.map((it) => ({
      key: it.productId,
      quantity: it.quantity,
      name: it.productName,
      price: it.unitPrice,
    }));
    if (!reorderItems(itemsToReorder)) return;
    showToast('Đã thêm lại các món vào giỏ hàng');
    openCart();
  };

  const selectedOrder = orders.find((o) => o.orderCode === selectedCode) || orders[0] || null;
  const MainElement = embedded ? 'div' : 'main';

  return (
    <div className={`orders-page-container${embedded ? ' orders-embedded-container' : ''}`}>
      <MainElement className="orders-main-section">
        {/* Header like checkout: Back link + H1 Playfair Display */}
        <div className="orders-header-row">
          {!embedded && (
            <button type="button" className="orders-back-link" onClick={() => navigate('/')}>
              <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
              <span>Trang chủ</span>
            </button>
          )}
          <h1 className="orders-page-title">{t.shop.orderHistory}</h1>
        </div>

        {loading ? (
          <div className="orders-loading-box">
            <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty-card">
            <div className="orders-empty-icon" aria-hidden="true">
              <ShoppingBag size={28} strokeWidth={1.75} />
            </div>
            <h2>Bạn chưa có đơn hàng nào</h2>
            <p>Hãy khám phá các món quà lưu niệm đặc sắc của Sài Gòn để đặt đơn hàng đầu tiên.</p>
            <button
              type="button"
              className="orders-empty-btn"
              onClick={() => navigate('/am-thuc')}
            >
              Quà lưu niệm
            </button>
          </div>
        ) : (
          <div className="orders-layout-grid">
            {/* Cột trái: Danh sách đơn hàng (~360px) */}
            <div className="orders-list-panel">
              <h2 className="orders-panel-heading">Danh sách đơn ({orders.length})</h2>
              <div
                className="orders-list"
                ref={listContainerRef}
                role="region"
                aria-label={`Danh sách đơn (${orders.length})`}
                tabIndex={0}
                data-lenis-prevent={!embedded ? '' : undefined}
              >
                {orders.map((o) => {
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
                        <StatusBadge status={o.status} />
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
                  <header className="order-detail-header">
                    <div className="order-detail-title-wrap">
                      <span className="order-detail-kicker">Chi tiết đơn hàng</span>
                      <h2 className="order-detail-code">{selectedOrder.orderCode}</h2>
                    </div>
                    <StatusBadge status={selectedOrder.status} size="large" />
                  </header>

                  {/* Scrollable Body */}
                  <div
                    className="order-detail-body"
                    ref={detailBodyRef}
                    role="region"
                    aria-label="Chi tiết đơn hàng"
                    tabIndex={0}
                    data-lenis-prevent={!embedded ? '' : undefined}
                  >
                    {/* Khối thông tin chi tiết: Tinted grid */}
                    <div className="order-meta-info-grid">
                      <div className="order-meta-row">
                        <span className="order-meta-label">{t.shop.orderDate}:</span>
                        <span className="order-meta-value">
                          {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="order-meta-row">
                        <span className="order-meta-label">Phương thức:</span>
                        <span className="order-meta-value">
                          {selectedOrder.paymentMethod === 'VIETQR'
                            ? 'Chuyển khoản VietQR'
                            : selectedOrder.paymentMethod === 'VNPAY'
                            ? 'Cổng thanh toán VNPAY'
                            : selectedOrder.paymentMethod === 'MOCK_GATEWAY'
                            ? 'Cổng thanh toán điện tử'
                            : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
                        </span>
                      </div>

                      <div className="order-meta-row">
                        <span className="order-meta-label">Người nhận:</span>
                        <span className="order-meta-value">
                          <b>{selectedOrder.receiverName}</b>
                        </span>
                      </div>

                      <div className="order-meta-row">
                        <span className="order-meta-label">Số điện thoại:</span>
                        <span className="order-meta-value">{selectedOrder.phone}</span>
                      </div>

                      <div className="order-meta-row">
                        <span className="order-meta-label">{t.shop.deliveryInfo}:</span>
                        <span className="order-meta-value">
                          {selectedOrder.address}
                          {selectedOrder.note && (
                            <span className="order-note-text">
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
                    </div>
                  </div>

                  {/* Pinned Footer */}
                  <footer className="order-detail-footer">
                    <div className="order-detail-total-bar">
                      <span className="total-label">{t.shop.total}:</span>
                      <b className="total-amount">{formatPrice(selectedOrder.totalAmount)}</b>
                    </div>

                    {/* Nút hành động */}
                    <div className="order-actions-bar">
                      <button
                        type="button"
                        className="order-reorder-btn"
                        onClick={() => handleReorder(selectedOrder)}
                      >
                        <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                        <span>{t.shop.reorder}</span>
                      </button>

                      {/* Nút thanh toán lại khi đơn PENDING_PAYMENT */}
                      {selectedOrder.status === 'PENDING_PAYMENT' && (
                        selectedOrder.paymentMethod === 'VIETQR' ? (
                          <button
                            type="button"
                            className="order-pay-now-btn"
                            onClick={() =>
                              navigate(
                                `/thanh-toan/qr/${encodeURIComponent(selectedOrder.orderCode)}`
                              )
                            }
                          >
                            <CreditCard size={15} strokeWidth={2} aria-hidden="true" />
                            <span>Mã QR thanh toán</span>
                          </button>
                        ) : selectedOrder.paymentMethod === 'VNPAY' ? (
                          <button
                            type="button"
                            className="order-pay-now-btn"
                            onClick={() => {
                              void handleVnPayPayment(selectedOrder.orderCode);
                            }}
                          >
                            <CreditCard size={15} strokeWidth={2} aria-hidden="true" />
                            <span>Thanh toán VNPAY</span>
                          </button>
                        ) : selectedOrder.paymentMethod === 'MOCK_GATEWAY' ? (
                          <button
                            type="button"
                            className="order-pay-now-btn"
                            onClick={() =>
                              navigate(
                                `/thanh-toan/ket-qua?orderCode=${encodeURIComponent(selectedOrder.orderCode)}&method=MOCK_GATEWAY`
                              )
                            }
                          >
                            <CreditCard size={15} strokeWidth={2} aria-hidden="true" />
                            <span>Thanh toán ngay</span>
                          </button>
                        ) : null
                      )}

                      {/* Nút hủy đơn: Cho phép hủy khi PENDING_PAYMENT hoặc PROCESSING */}
                      {(selectedOrder.status === 'PENDING_PAYMENT' ||
                        selectedOrder.status === 'PROCESSING') && (
                        <button
                          type="button"
                          className="order-cancel-btn"
                          disabled={cancellingCode === selectedOrder.orderCode}
                          onClick={() => setConfirmCancelModal(selectedOrder.orderCode)}
                        >
                          <Ban size={15} strokeWidth={2} aria-hidden="true" />
                          <span>{t.shop.cancelOrder}</span>
                        </button>
                      )}
                    </div>
                  </footer>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </MainElement>

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
                className="cancel-btn-confirm"
                onClick={() => handleCancelOrder(confirmCancelModal)}
              >
                Đồng ý hủy
              </button>
              <button
                type="button"
                className="cancel-btn-dismiss"
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
