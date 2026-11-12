import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { getOrderByCode, confirmMockPayment } from '../services/orderService';
import { authApi } from '../api/auth';
import { api } from '../api/client';
import { usePremium } from '../context/PremiumContext';
import { useNavbarLanguage } from '../content/languages';
import { formatPrice } from '../utils/formatters';
import { BackendOrder } from '../types';
import '../styles/paymentResult.css';

type PaymentOutcome = 'pending' | 'success' | 'failed' | 'cancelled';
type EntitlementState = 'idle' | 'checking' | 'ready' | 'timeout';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

function outcomeFromQuery(value: string, vnpResponseCode?: string | null): PaymentOutcome {
  const v = (value || '').toLowerCase();
  if (v === 'success' || v === 'paid' || v === 'completed') return 'success';
  if (v === 'failed' || v === 'fail' || v === 'error') return 'failed';
  if (v === 'cancelled' || v === 'cancel') return 'cancelled';
  if (vnpResponseCode === '00') return 'success';
  if (vnpResponseCode === '24') return 'cancelled';
  if (vnpResponseCode) return 'failed';
  return 'pending';
}

function outcomeFromOrder(order: BackendOrder): PaymentOutcome {
  if (order.status === 'PAID' || order.paymentStatus === 'SUCCESS') return 'success';
  if (order.status === 'CANCELLED') return 'cancelled';
  if (order.paymentStatus === 'FAILED') return 'failed';
  return 'pending';
}

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatOrderTime(dateObj: Date): string {
  const hours = padZero(dateObj.getHours());
  const minutes = padZero(dateObj.getMinutes());
  const day = padZero(dateObj.getDate());
  const month = padZero(dateObj.getMonth() + 1);
  const year = dateObj.getFullYear();
  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

function formatShortTime(dateObj: Date): string {
  const hours = padZero(dateObj.getHours());
  const minutes = padZero(dateObj.getMinutes());
  const day = padZero(dateObj.getDate());
  const month = padZero(dateObj.getMonth() + 1);
  return `${day}/${month}, ${hours}:${minutes}`;
}

function formatEstimatedDelivery(dateObj: Date): string {
  const start = new Date(dateObj.getTime() + 3 * 24 * 60 * 60 * 1000);
  const end = new Date(dateObj.getTime() + 5 * 24 * 60 * 60 * 1000);
  const startDay = padZero(start.getDate());
  const endDay = padZero(end.getDate());
  const endMonth = padZero(end.getMonth() + 1);
  const endYear = end.getFullYear();
  return `${startDay} - ${endDay}/${endMonth}/${endYear}`;
}

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useNavbarLanguage();
  const { refreshEntitlement } = usePremium();

  const vnpCode = searchParams.get('vnp_ResponseCode');
  const orderCode =
    searchParams.get('orderCode') ||
    searchParams.get('vnp_TxnRef') ||
    searchParams.get('order') ||
    '';
  const method =
    searchParams.get('method') ||
    (vnpCode ? 'VNPAY' : '');
  const queryOutcome = outcomeFromQuery(searchParams.get('status') || '', vnpCode);

  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome>(
    method === 'COD' ? 'success' : queryOutcome
  );
  const [orderPollExpired, setOrderPollExpired] = useState(false);
  const [entitlementState, setEntitlementState] = useState<EntitlementState>('idle');
  const entitlementStartedRef = useRef(false);

  const loadOrder = useCallback(async () => {
    if (!orderCode) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrderByCode(orderCode);
      setOrder(data);
      if (data) {
        setOutcome((current) => {
          const next = outcomeFromOrder(data);
          if (queryOutcome === 'success' || current === 'success' || next === 'success') {
            return 'success';
          }
          if (next !== 'pending') return next;
          return current;
        });
      }
    } catch {
      if (queryOutcome !== 'pending') {
        setOutcome(queryOutcome);
      }
    } finally {
      setLoading(false);
    }
  }, [orderCode, queryOutcome]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const isPoiOrder = order?.orderType === 'POI';
  const isPremiumOrder = order?.orderType === 'PREMIUM' || isPoiOrder;

  useEffect(() => {
    if (outcome !== 'pending' || orderPollExpired || !orderCode) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const poll = async () => {
      attempts += 1;
      try {
        const next = await getOrderByCode(orderCode);
        if (cancelled) return;
        if (next) {
          setOrder(next);
          const nextOutcome = outcomeFromOrder(next);
          if (nextOutcome !== 'pending') {
            setOutcome(nextOutcome);
            return;
          }
        }
      } catch {
        // Keep polling
      }

      if (cancelled) return;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setOrderPollExpired(true);
        return;
      }
      timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [outcome, orderCode, orderPollExpired]);

  useEffect(() => {
    if (!isPremiumOrder || outcome !== 'success' || entitlementStartedRef.current) return;

    entitlementStartedRef.current = true;
    setEntitlementState('checking');

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const pollEntitlement = async () => {
      attempts += 1;
      try {
        if (isPoiOrder && order?.poiId) {
          if (api.getMeEntitlements) {
            const ent = await api.getMeEntitlements();
            if (cancelled) return;
            const hasPoi =
              ent.unlockedPoiIds?.includes(order.poiId) ||
              ent.purchasedPois?.some((p) => p.poiId === order.poiId);
            if (hasPoi) {
              setEntitlementState('ready');
              try {
                await refreshEntitlement();
              } catch {
                // Ignore
              }
              return;
            }
          }
        } else {
          const me = await authApi.me();
          if (cancelled) return;
          if (me.plan === 'PREMIUM' && me.premiumActive) {
            setEntitlementState('ready');
            try {
              await refreshEntitlement();
            } catch {
              // Token refreshes on next call
            }
            return;
          }
        }
      } catch {
        // Transaction propagation
      }

      if (cancelled) return;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setEntitlementState('timeout');
        return;
      }
      timer = window.setTimeout(pollEntitlement, POLL_INTERVAL_MS);
    };

    void pollEntitlement();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [isPremiumOrder, isPoiOrder, order?.poiId, outcome, refreshEntitlement]);

  const handleSimulatePayment = async (nextOutcome: 'SUCCESS' | 'FAILED') => {
    if (!orderCode) return;
    setProcessingAction(true);
    try {
      const updated = await confirmMockPayment(orderCode, nextOutcome);
      setOrder(updated);
      setOutcome(nextOutcome === 'SUCCESS' ? 'success' : 'failed');
    } catch {
      setOutcome(nextOutcome === 'SUCCESS' ? 'success' : 'failed');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCopyOrderCode = useCallback(() => {
    const code = orderCode || order?.orderCode || '';
    if (!code) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        void navigator.clipboard.writeText(code);
      }
    } catch {
      // Fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [orderCode, order?.orderCode]);

  const orderDateObj = useMemo(() => {
    if (order?.createdAt) {
      const d = new Date(order.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [order?.createdAt]);

  const formattedOrderTime = useMemo(() => formatOrderTime(orderDateObj), [orderDateObj]);
  const formattedShortDate = useMemo(() => formatShortTime(orderDateObj), [orderDateObj]);
  const estimatedDelivery = useMemo(() => formatEstimatedDelivery(orderDateObj), [orderDateObj]);

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="wrap">
          <div className="result-loading-box">
            <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
            <p>Đang kiểm tra kết quả đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  // Premium / POI unlocks flow
  if (isPremiumOrder) {
    const isFailure = outcome === 'failed' || outcome === 'cancelled' || orderPollExpired;
    const isSuccess = outcome === 'success';
    const entitlementReady = entitlementState === 'ready';
    const entitlementTimedOut = entitlementState === 'timeout';

    return (
      <div className="payment-result-page">
        <div className="wrap">
          <div className="payment-steps">
            <span>Giỏ hàng</span>
            <i aria-hidden="true" />
            <span>Thanh toán</span>
            <i aria-hidden="true" />
            <b>Hoàn tất</b>
          </div>

          {isSuccess ? (
            <div className="result-card result-success">
              <div className="result-icon-wrap success" aria-hidden="true">
                <CheckCircle size={32} strokeWidth={2.2} />
              </div>
              <h1 className="result-title">
                {isPoiOrder
                  ? entitlementReady
                    ? 'Mở khóa điểm thuyết minh thành công!'
                    : 'Đã nhận thanh toán gói điểm'
                  : entitlementReady
                  ? 'Nâng cấp Premium thành công!'
                  : 'Đã nhận thanh toán Premium'}
              </h1>
              <p className="result-subtitle">
                {isPoiOrder
                  ? entitlementReady
                    ? `Tài khoản của bạn đã mở khóa thuyết minh tiếng Anh, Nhật và Hàn cho điểm: ${order?.note?.replace('Mo khoa thuyet minh ngoai ngu: ', '') || 'Điểm du lịch'}.`
                    : entitlementTimedOut
                    ? 'Giao dịch đã hoàn tất. Hệ thống đang cập nhật quyền cho điểm thuyết minh của bạn.'
                    : 'Giao dịch đã thành công. Đang xác nhận quyền mở khóa điểm thuyết minh...'
                  : entitlementReady
                  ? 'Tài khoản của bạn đã mở khóa thuyết minh tiếng Anh, Nhật và Hàn trên toàn bộ hành trình.'
                  : entitlementTimedOut
                  ? 'Giao dịch đã hoàn tất. Hệ thống đang cập nhật quyền Premium cho tài khoản của bạn.'
                  : 'Giao dịch đã thành công. Đang xác nhận quyền Premium cho tài khoản của bạn...'}
              </p>

              {!entitlementReady && (
                <div
                  className={`result-activation-status ${entitlementTimedOut ? 'is-timeout' : 'is-checking'}`}
                  role="status"
                  aria-live="polite"
                >
                  <RefreshCw
                    size={16}
                    strokeWidth={2}
                    className={entitlementTimedOut ? '' : 'spin-icon'}
                    aria-hidden="true"
                  />
                  <span>
                    {entitlementTimedOut
                      ? isPoiOrder
                        ? 'Quyền nghe thuyết minh điểm chưa được cập nhật. Vui lòng tải lại trạng thái.'
                        : 'Quyền Premium chưa được cập nhật. Vui lòng tải lại trạng thái.'
                      : 'Thường mất vài giây. Vui lòng không đóng trang.'}
                  </span>
                </div>
              )}

              <div className="result-info-box">
                <div className="info-row">
                  <span>Mã đơn hàng:</span>
                  <b className="order-code-badge">{orderCode}</b>
                </div>
                {order && (
                  <>
                    <div className="info-row">
                      <span>Tổng số tiền:</span>
                      <b className="result-total-amount">{formatPrice(order.totalAmount)}</b>
                    </div>
                    <div className="info-row">
                      <span>Phương thức:</span>
                      <span>Cổng thanh toán VNPAY</span>
                    </div>
                    <div className="info-row">
                      <span>Gói đã mua:</span>
                      <span>
                        {isPoiOrder
                          ? (order.note?.replace('Mo khoa thuyet minh ngoai ngu: ', '') || `Gói điểm thuyết minh #${order.poiId}`)
                          : 'Premium 3 ngôn ngữ (EN / JA / KO)'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="result-actions-row">
                {entitlementReady ? (
                  <button
                    type="button"
                    className="result-primary-btn"
                    onClick={() => {
                      if (isPoiOrder && order?.poiId) {
                        navigate(`/diem-du-lich?poi=${order.poiId}`);
                      } else {
                        navigate('/diem-du-lich');
                      }
                    }}
                  >
                    <span>{isPoiOrder ? 'Nghe thuyết minh điểm này ngay' : 'Khám phá nội dung Premium'}</span>
                    <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                  </button>
                ) : entitlementTimedOut ? (
                  <button
                    type="button"
                    className="result-primary-btn"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
                    <span>Tải lại trạng thái</span>
                  </button>
                ) : (
                  <button type="button" className="result-primary-btn" disabled>
                    <RefreshCw size={15} strokeWidth={2} className="spin-icon" aria-hidden="true" />
                    <span>{isPoiOrder ? 'Đang cập nhật quyền điểm...' : 'Đang cập nhật Premium...'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="result-secondary-btn"
                  onClick={() => navigate('/')}
                >
                  {t.home}
                </button>
              </div>
            </div>
          ) : isFailure ? (
            <div className="result-card result-failed">
              <div className="result-icon-wrap failed" aria-hidden="true">
                <XCircle size={32} strokeWidth={2.2} />
              </div>
              <h1 className="result-title">
                {outcome === 'cancelled'
                  ? 'Thanh toán đã hủy'
                  : orderPollExpired
                  ? 'Chưa xác nhận được thanh toán'
                  : 'Thanh toán chưa hoàn tất'}
              </h1>
              <p className="result-subtitle">
                {outcome === 'cancelled'
                  ? 'Giao dịch VNPAY đã bị hủy. Bạn chưa bị trừ phí và tài khoản vẫn giữ gói hiện tại.'
                  : isPoiOrder
                  ? 'Giao dịch VNPAY chưa hoàn tất. Bạn có thể thử thanh toán lại để mở khóa điểm thuyết minh.'
                  : 'Giao dịch VNPAY chưa hoàn tất. Bạn có thể thử thanh toán lại để mở khóa Premium.'}
              </p>

              <div className="result-info-box">
                <div className="info-row">
                  <span>Mã đơn hàng:</span>
                  <b className="order-code-badge">{orderCode}</b>
                </div>
                {order && (
                  <div className="info-row">
                    <span>Số tiền:</span>
                    <b className="result-total-amount">{formatPrice(order.totalAmount)}</b>
                  </div>
                )}
              </div>

              <div className="result-actions-row">
                <button
                  type="button"
                  className="result-primary-btn"
                  onClick={() => navigate('/nang-cap')}
                >
                  <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
                  <span>Thử thanh toán lại</span>
                </button>
                <button
                  type="button"
                  className="result-secondary-btn"
                  onClick={() => navigate('/diem-du-lich')}
                >
                  Về trang điểm đến
                </button>
              </div>
            </div>
          ) : (
            <div className="result-card result-pending">
              <div className="result-icon-wrap gateway" aria-hidden="true">
                <RefreshCw size={28} strokeWidth={1.8} className="spin-icon" />
              </div>
              <h1 className="result-title">Đang xác nhận thanh toán</h1>
              <p className="result-subtitle">
                VNPAY đã chuyển bạn về Echora. Hệ thống đang kiểm tra giao dịch với máy chủ thanh toán.
              </p>

              <div className="result-info-box">
                <div className="info-row">
                  <span>Mã đơn hàng:</span>
                  <b className="order-code-badge">{orderCode}</b>
                </div>
                {order && (
                  <div className="info-row">
                    <span>Số tiền:</span>
                    <b className="result-total-amount">{formatPrice(order.totalAmount)}</b>
                  </div>
                )}
              </div>

              <div className="result-actions-row">
                <button
                  type="button"
                  className="result-secondary-btn"
                  onClick={() => navigate('/')}
                >
                  {t.home}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mock Gateway Sandbox mode
  const isMockAwaiting = method === 'MOCK_GATEWAY' && outcome === 'pending';
  if (isMockAwaiting) {
    return (
      <div className="payment-result-page">
        <div className="wrap">
          <div className="payment-steps">
            <span>Giỏ hàng</span>
            <i aria-hidden="true" />
            <span>Thanh toán</span>
            <i aria-hidden="true" />
            <b>Hoàn tất</b>
          </div>

          <div className="mock-gateway-card">
            <div className="mock-gateway-header">
              <div className="result-icon-wrap gateway" aria-hidden="true">
                <CreditCard size={28} strokeWidth={1.75} />
              </div>
              <h2>Cổng thanh toán giả lập</h2>
              <p className="gateway-subtitle">
                Môi trường thử nghiệm thanh toán đơn hàng Echora
              </p>
            </div>

            <div className="mock-gateway-body">
              <div className="gateway-order-summary">
                <div className="summary-row">
                  <span>Mã đơn hàng:</span>
                  <b className="order-code-badge">{orderCode || 'Chưa xác định'}</b>
                </div>
                {order && (
                  <>
                    <div className="summary-row">
                      <span>Người nhận:</span>
                      <span>{order.receiverName} ({order.phone})</span>
                    </div>
                    <div className="summary-row">
                      <span>Số tiền thanh toán:</span>
                      <b className="gateway-amount">{formatPrice(order.totalAmount)}</b>
                    </div>
                  </>
                )}
              </div>

              <div className="mock-instructions">
                <p>
                  Đây là cổng thanh toán mô phỏng phục vụ kiểm thử. Bạn có thể chọn xác nhận thành công hoặc giả lập trường hợp lỗi để kiểm tra quy trình xử lý đơn hàng.
                </p>
              </div>

              <div className="mock-action-buttons">
                <button
                  type="button"
                  className="result-primary-btn mock-success-btn"
                  disabled={processingAction}
                  onClick={() => handleSimulatePayment('SUCCESS')}
                >
                  {processingAction ? (
                    <>
                      <RefreshCw size={15} strokeWidth={2} className="spin-icon" aria-hidden="true" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} strokeWidth={2} aria-hidden="true" />
                      <span>Thanh toán thành công (200 OK)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="result-secondary-btn mock-failed-btn"
                  disabled={processingAction}
                  onClick={() => handleSimulatePayment('FAILED')}
                >
                  <XCircle size={16} strokeWidth={2} aria-hidden="true" />
                  <span>Mô phỏng thanh toán thất bại</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed / Cancelled state for general orders
  if (outcome === 'failed' || outcome === 'cancelled') {
    return (
      <div className="payment-result-page">
        <div className="wrap">
          <div className="payment-steps">
            <span>Giỏ hàng</span>
            <i aria-hidden="true" />
            <span>Thanh toán</span>
            <i aria-hidden="true" />
            <b>Hoàn tất</b>
          </div>

          <div className="result-card result-failed">
            <div className="result-icon-wrap failed" aria-hidden="true">
              <XCircle size={32} strokeWidth={2.2} />
            </div>
            <h1 className="result-title">{t.shop.paymentFailed}</h1>
            <p className="result-subtitle">
              {outcome === 'cancelled'
                ? 'Giao dịch đã được hủy theo yêu cầu của bạn.'
                : 'Giao dịch thanh toán chưa thể hoàn tất. Đơn hàng của bạn vẫn được lưu ở trạng thái chờ thanh toán.'}
            </p>

            <div className="result-info-box">
              <div className="info-row">
                <span>Mã đơn hàng:</span>
                <b className="order-code-badge">{orderCode || order?.orderCode}</b>
              </div>
              {order && (
                <div className="info-row">
                  <span>Số tiền:</span>
                  <b className="result-total-amount">{formatPrice(order.totalAmount)}</b>
                </div>
              )}
            </div>

            <div className="result-actions-row">
              <button
                type="button"
                className="result-primary-btn"
                onClick={() => {
                  if (method === 'MOCK_GATEWAY') {
                    setOutcome('pending');
                  } else {
                    navigate('/don-hang');
                  }
                }}
              >
                <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
                <span>Thử thanh toán lại</span>
              </button>

              <button
                type="button"
                className="result-secondary-btn"
                onClick={() => navigate('/don-hang')}
              >
                <span>{t.shop.orderHistory}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine timeline active classes
  const statusUpper = (order?.status || '').toUpperCase();
  const isPaidOrProcessing = statusUpper === 'PAID' || statusUpper === 'CONFIRMED' || statusUpper === 'PROCESSING';
  const isShipping = statusUpper === 'SHIPPING' || statusUpper === 'DELIVERING';
  const isDelivered = statusUpper === 'DELIVERED' || statusUpper === 'COMPLETED';

  const step2Class = isDelivered || isShipping || isPaidOrProcessing ? 'd' : 'c';
  const step3Class = isDelivered || isShipping ? 'd' : isPaidOrProcessing ? 'c' : '';
  const step4Class = isDelivered ? 'd' : isShipping ? 'c' : '';
  const step5Class = isDelivered ? 'd' : '';

  const receiverName = order?.receiverName || 'bạn';
  const displayOrderCode = orderCode || order?.orderCode || 'SV-20261107-1580';
  const items = order?.items || [];
  const itemsCount = items.length > 0 ? items.length : 1;
  const subtotal = order?.subtotal ?? order?.totalAmount ?? 0;
  const totalAmount = order?.totalAmount ?? 0;

  return (
    <div className="payment-result-page">
      <main className="wrap">
        <div className="payment-steps">
          <span>Giỏ hàng</span>
          <i aria-hidden="true" />
          <span>Thanh toán</span>
          <i aria-hidden="true" />
          <b>Hoàn tất</b>
        </div>

        <h1 className="payment-result-h1">
          {order?.receiverName
            ? `Cảm ơn ${order.receiverName}, đơn hàng đã được ghi nhận`
            : `Cảm ơn ${receiverName}, đơn hàng đã được ghi nhận`}
        </h1>

        <p className="payment-result-meta">
          <span>
            Mã đơn hàng <b>{displayOrderCode}</b>
          </span>
          <span className="meta-sep" aria-hidden="true" />
          <button
            type="button"
            className="payment-copy-btn"
            id="cp"
            onClick={handleCopyOrderCode}
          >
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
          <span className="meta-sep" aria-hidden="true" />
          <span>Đặt lúc {formattedOrderTime}</span>
          <br />
          <span className="meta-note">
            Chúng tôi sẽ liên hệ xác nhận trước khi giao hàng.
          </span>
        </p>

        <div className="payment-result-two">
          <div>
            {/* Section 1: Tiến trình đơn hàng */}
            <section className="payment-sec">
              <div className="payment-eta">
                <h2>Tiến trình đơn hàng</h2>
                <span>
                  Dự kiến giao: <b>{estimatedDelivery}</b>
                </span>
              </div>
              <div className="payment-tl">
                <div className="d">
                  Đã đặt hàng
                  <small>{formattedShortDate}</small>
                </div>
                <div className={step2Class}>Chờ xác nhận</div>
                <div className={step3Class}>Đóng gói</div>
                <div className={step4Class}>Đang giao</div>
                <div className={step5Class}>Đã nhận</div>
              </div>
            </section>

            {/* Section 2: Sản phẩm */}
            <section className="payment-sec">
              <h2>Sản phẩm ({itemsCount})</h2>
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <div className="payment-it" key={item.productId ?? idx}>
                    <div className="payment-th">
                      {item.imagePath ? (
                        <img
                          src={item.imagePath}
                          alt={item.productName}
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          viewBox="0 0 320 200"
                          preserveAspectRatio="xMidYMid slice"
                          aria-hidden="true"
                        >
                          <circle cx="262" cy="52" r="16" fill="var(--pr-acc, #C2410C)" />
                          <g
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            transform="translate(0 10)"
                          >
                            <path d="M60 150V108H260V150M80 108V84H240V108M110 84V62H210V84M130 150v-24h60v24" />
                          </g>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="payment-it-nm">
                        {item.productName}
                      </div>
                      <small>
                        Số lượng: {item.quantity}
                        <span className="meta-sep" aria-hidden="true" />
                        {formatPrice(item.unitPrice)}
                      </small>
                    </div>
                    <b>{formatPrice(item.quantity * item.unitPrice)}</b>
                  </div>
                ))
              ) : (
                <div className="payment-it">
                  <div className="payment-th">
                    <svg
                      viewBox="0 0 320 200"
                      preserveAspectRatio="xMidYMid slice"
                      aria-hidden="true"
                    >
                      <circle cx="262" cy="52" r="16" fill="var(--pr-acc, #C2410C)" />
                      <g
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        transform="translate(0 10)"
                      >
                        <path d="M60 150V108H260V150M80 108V84H240V108M110 84V62H210V84M130 150v-24h60v24" />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <div className="payment-it-nm">
                      {order?.note || 'Quà lưu niệm Sài Gòn'}
                    </div>
                    <small>Số lượng: 1</small>
                  </div>
                  <b>{formatPrice(totalAmount)}</b>
                </div>
              )}
            </section>

            {/* Section 3: Giao hàng */}
            <section className="payment-sec">
              <h2>Giao hàng</h2>
              <dl className="payment-kv">
                <div>
                  <dt>Người nhận</dt>
                  <dd>{order?.receiverName || 'Công Tính'}</dd>
                </div>
                <div>
                  <dt>Số điện thoại</dt>
                  <dd>{order?.phone || '0346 358 399'}</dd>
                </div>
                <div>
                  <dt>Địa chỉ</dt>
                  <dd>
                    {order?.address ||
                      '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh'}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Right Column: Tóm tắt */}
          <aside className="payment-sum">
            <section className="payment-sec payment-sum-sec">
              <h2>Tóm tắt</h2>
              <div className="payment-row">
                <span>Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="payment-row">
                <span>Phí giao hàng</span>
                <span>Miễn phí</span>
              </div>
              <div className="payment-row payment-row-total">
                <span>Tổng cộng</span>
                <b>{formatPrice(totalAmount)}</b>
              </div>
              <p className="payment-pay-method">
                {order?.paymentMethod === 'COD'
                  ? 'Thanh toán tiền mặt khi nhận hàng'
                  : order?.paymentMethod === 'VIETQR'
                  ? 'Chuyển khoản VietQR'
                  : order?.paymentMethod === 'VNPAY'
                  ? 'Cổng thanh toán VNPAY'
                  : 'Thanh toán tiền mặt khi nhận hàng'}
              </p>
              <div className="payment-acts">
                <button
                  type="button"
                  className="payment-go-btn"
                  onClick={() => navigate('/don-hang')}
                >
                  Xem đơn hàng của tôi
                </button>
                <button
                  type="button"
                  className="payment-link-arr"
                  onClick={() => navigate('/am-thuc')}
                >
                  Tiếp tục xem quà
                </button>
                <button
                  type="button"
                  className="payment-link-arr"
                  onClick={() => navigate('/lien-he')}
                >
                  Cần hỗ trợ? Liên hệ chúng tôi
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PaymentResultPage;
