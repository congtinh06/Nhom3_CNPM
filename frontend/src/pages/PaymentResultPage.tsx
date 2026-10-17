import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { getOrderByCode, confirmMockPayment } from '../services/orderService';
import { useNavbarLanguage } from '../content/languages';
import { formatPrice } from '../utils/formatters';
import { BackendOrder } from '../types';
import { Stepper } from '../components/checkout/Stepper';
import '../styles/paymentResult.css';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useNavbarLanguage();

  const orderCode = searchParams.get('orderCode') || '';
  const method = searchParams.get('method') || '';
  const initialStatus = searchParams.get('status') || '';

  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [simulationResult, setSimulationResult] = useState<'SUCCESS' | 'FAILED' | null>(
    initialStatus === 'success' ? 'SUCCESS' : initialStatus === 'failed' ? 'FAILED' : null
  );

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
        if (data.status === 'PAID' || data.paymentStatus === 'SUCCESS') {
          setSimulationResult('SUCCESS');
        } else if (data.paymentStatus === 'FAILED') {
          setSimulationResult('FAILED');
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [orderCode]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleSimulatePayment = async (outcome: 'SUCCESS' | 'FAILED') => {
    if (!orderCode) return;
    setProcessingAction(true);
    try {
      const updated = await confirmMockPayment(orderCode, outcome);
      setOrder(updated);
      setSimulationResult(outcome);
    } catch {
      setSimulationResult(outcome);
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

  // Nếu là phương thức cổng giả lập và chưa thực hiện thanh toán
  const isMockAwaiting = method === 'MOCK_GATEWAY' && simulationResult === null;

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        {/* Checkout Stepper at top, all steps completed */}
        <div className="payment-result-stepper-wrap">
          <Stepper currentStep={3} allCompleted={simulationResult === 'SUCCESS' || method === 'COD'} />
        </div>

        {isMockAwaiting ? (
          /* Giao diện mô phỏng cổng thanh toán */
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
        ) : simulationResult === 'SUCCESS' || method === 'COD' ? (
          /* Kết quả thành công */
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
          /* Kết quả thất bại */
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
                onClick={() => setSimulationResult(null)}
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
