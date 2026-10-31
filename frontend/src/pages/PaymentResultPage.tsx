import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Stepper } from '../components/checkout/Stepper';
import '../styles/paymentResult.css';

type PaymentOutcome = 'pending' | 'success' | 'failed' | 'cancelled';
type EntitlementState = 'idle' | 'checking' | 'ready' | 'timeout';

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

function outcomeFromQuery(value: string): PaymentOutcome {
  if (value === 'success') return 'success';
  if (value === 'failed') return 'failed';
  if (value === 'cancelled') return 'cancelled';
  return 'pending';
}

function outcomeFromOrder(order: BackendOrder): PaymentOutcome {
  if (order.status === 'PAID' || order.paymentStatus === 'SUCCESS') return 'success';
  if (order.status === 'CANCELLED') return 'cancelled';
  if (order.paymentStatus === 'FAILED') return 'failed';
  return 'pending';
}

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useNavbarLanguage();
  const { refreshEntitlement } = usePremium();

  const orderCode = searchParams.get('orderCode') || '';
  const method = searchParams.get('method') || '';
  const queryOutcome = outcomeFromQuery(searchParams.get('status') || '');

  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome>(
    queryOutcome === 'success' ? 'pending' : queryOutcome
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
          if (next === 'pending' && current !== 'pending') return current;
          return next;
        });
      }
    } catch {
      // The status query remains the fallback when the order cannot be loaded.
    } finally {
      setLoading(false);
    }
  }, [orderCode]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const isPoiOrder = order?.orderType === 'POI';
  const isPremiumOrder = order?.orderType === 'PREMIUM' || isPoiOrder;

  useEffect(() => {
    if (!isPremiumOrder || outcome !== 'pending' || orderPollExpired) return;

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
        // Keep polling until the 30-second window ends.
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
  }, [isPremiumOrder, outcome, orderCode, orderPollExpired]);

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
              // The account is already Premium; the token will refresh on the next request.
            }
            return;
          }
        }
      } catch {
        // The transaction may still be propagating through the entitlement API.
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

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="result-loading-box">
            <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
            <p>Đang kiểm tra kết quả đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isPremiumOrder) {
    const isFailure = outcome === 'failed' || outcome === 'cancelled' || orderPollExpired;
    const isSuccess = outcome === 'success';
    
    const entitlementReady = entitlementState === 'ready';
    const entitlementTimedOut = entitlementState === 'timeout';

    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
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

  const isMockAwaiting = method === 'MOCK_GATEWAY' && outcome === 'pending';

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="payment-result-stepper-wrap">
          <Stepper currentStep={3} allCompleted={outcome === 'success' || method === 'COD'} />
        </div>

        {isMockAwaiting ? (
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
        ) : outcome === 'success' || method === 'COD' ? (
          <div className="result-card result-success">
            <div className="result-icon-wrap success" aria-hidden="true">
              <CheckCircle size={32} strokeWidth={2.2} />
            </div>
            <h1 className="result-title">
              {method === 'COD' ? 'Đặt hàng thành công!' : t.shop.paymentSuccess}
            </h1>
            <p className="result-subtitle">
              {method === 'COD'
                ? 'Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ và giao hàng sớm nhất.'
                : 'Khoản thanh toán của bạn đã được đối soát thành công.'}
            </p>

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
                    <span>
                      {order.paymentMethod === 'COD'
                        ? 'Thanh toán tiền mặt khi nhận hàng'
                        : order.paymentMethod === 'VIETQR'
                        ? 'Chuyển khoản VietQR'
                        : order.paymentMethod === 'VNPAY'
                        ? 'Cổng thanh toán VNPAY'
                        : 'Cổng thanh toán điện tử'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span>Địa chỉ giao hàng:</span>
                    <span>{order.address}</span>
                  </div>
                </>
              )}
            </div>

            <div className="result-actions-row">
              <button
                type="button"
                className="result-primary-btn"
                onClick={() => navigate('/don-hang')}
              >
                <span>{t.shop.orderHistory}</span>
                <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="result-secondary-btn"
                onClick={() => navigate('/')}
              >
                {t.home}
              </button>
            </div>
          </div>
        ) : (
          <div className="result-card result-failed">
            <div className="result-icon-wrap failed" aria-hidden="true">
              <XCircle size={32} strokeWidth={2.2} />
            </div>
            <h1 className="result-title">{t.shop.paymentFailed}</h1>
            <p className="result-subtitle">
              Giao dịch thanh toán chưa thể hoàn tất. Đơn hàng của bạn vẫn được lưu ở trạng thái chờ thanh toán.
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
        )}
      </div>
    </div>
  );
};

export default PaymentResultPage;
