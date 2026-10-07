import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { createBackendOrder } from '../services/orderService';
import { formatPrice } from '../utils/formatters';
import { PaymentMethod } from '../types';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, status: authStatus } = useAuth();
  const { cartItems, totalAmount, totalCount, clearCart } = useCart();
  const { showToast } = useToast();
  const { t } = useNavbarLanguage();

  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Điền sẵn thông tin người dùng nếu có
  useEffect(() => {
    if (user) {
      if (user.fullName && !receiverName) {
        setReceiverName(user.fullName);
      }
    }
  }, [user]);

  // Kiểm tra đăng nhập: nếu chưa đăng nhập, chuyển sang /dang-nhap kèm state return
  useEffect(() => {
    if (authStatus === 'guest' && !isAuthenticated) {
      showToast('Vui lòng đăng nhập để tiến hành đặt hàng');
      navigate('/dang-nhap', {
        replace: true,
        state: { from: '/thanh-toan', backgroundLocation: { pathname: '/thanh-toan' } },
      });
    }
  }, [authStatus, isAuthenticated, navigate, showToast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!receiverName.trim() || receiverName.trim().length < 2) {
      newErrors.receiverName = 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).';
    }

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại nhận hàng.';
    } else if (!/^0\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số, bắt đầu bằng 0).';
    }

    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = 'Vui lòng nhập địa chỉ nhận hàng chi tiết (tối thiểu 5 ký tự).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (cartItems.length === 0) {
      setServerError('Giỏ hàng của bạn đang trống. Vui lòng chọn món trước khi đặt.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    const idempotencyKey = generateUUID();

    try {
      const itemsPayload = cartItems.map((it) => ({
        productId: it.id,
        quantity: it.quantity,
      }));

      // Tạo lookup meta để phục vụ fallback và hiển thị tên món
      const metaLookup: Record<number, { name: string; price: number }> = {};
      cartItems.forEach((it) => {
        metaLookup[it.id] = { name: it.name, price: it.price };
      });

      const order = await createBackendOrder(
        {
          receiverName: receiverName.trim(),
          phone: phone.replace(/[\s.-]/g, ''),
          address: address.trim(),
          note: note.trim() || undefined,
          paymentMethod,
          items: itemsPayload,
        },
        idempotencyKey,
        metaLookup
      );

      // Làm trống giỏ hàng
      clearCart();

      // Điều hướng kết quả theo phương thức thanh toán
      if (paymentMethod === 'MOCK_GATEWAY') {
        navigate(`/thanh-toan/ket-qua?orderCode=${encodeURIComponent(order.orderCode)}&method=MOCK_GATEWAY`, {
          replace: true,
        });
      } else {
        navigate(`/thanh-toan/ket-qua?orderCode=${encodeURIComponent(order.orderCode)}&method=COD&status=success`, {
          replace: true,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="checkout-page s">
        <div className="checkout-loading-box">
          <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
          <p>Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-banner">
        <div className="checkout-banner-content">
          <Link to="/am-thuc" className="checkout-back-link">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{t.shop.continueShopping}</span>
          </Link>
          <h1 className="checkout-page-title">{t.shop.checkoutTitle}</h1>
        </div>
      </div>

      <div className="checkout-main-content s">
        {cartItems.length === 0 ? (
          <div className="product-state-card empty-card">
            <ShoppingBag size={42} strokeWidth={1.5} className="state-icon" aria-hidden="true" />
            <h2>{t.shop.cartEmpty}</h2>
            <p>Vui lòng chọn món từ thực đơn trước khi tiến hành thanh toán.</p>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="tb"
                onClick={() => navigate('/am-thuc')}
              >
                Khám phá ẩm thực
              </button>
            </div>
          </div>
        ) : (
          <form className="checkout-grid-layout" onSubmit={handleSubmitOrder} noValidate>
            {/* Cột trái: Thông tin nhận hàng & Phương thức thanh toán */}
            <div className="checkout-form-panel">
              <section className="checkout-section-box">
                <div className="checkout-section-header">
                  <Truck size={20} strokeWidth={1.75} className="section-header-icon" aria-hidden="true" />
                  <h2>{t.shop.deliveryInfo}</h2>
                </div>

                <div className="checkout-fields-grid">
                  <label className="checkout-field">
                    <span className="field-label">
                      {t.shop.fullName} <span className="field-required">*</span>
                    </span>
                    <input
                      type="text"
                      className={`checkout-input ${errors.receiverName ? 'input-error' : ''}`}
                      placeholder="Nguyễn Văn A"
                      value={receiverName}
                      onChange={(e) => {
                        setReceiverName(e.target.value);
                        if (errors.receiverName) {
                          setErrors((prev) => ({ ...prev, receiverName: '' }));
                        }
                      }}
                      required
                      disabled={submitting}
                    />
                    {errors.receiverName && (
                      <span className="field-error-msg" role="alert">
                        {errors.receiverName}
                      </span>
                    )}
                  </label>

                  <label className="checkout-field">
                    <span className="field-label">
                      {t.shop.phone} <span className="field-required">*</span>
                    </span>
                    <input
                      type="tel"
                      className={`checkout-input ${errors.phone ? 'input-error' : ''}`}
                      placeholder="0901234567"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) {
                          setErrors((prev) => ({ ...prev, phone: '' }));
                        }
                      }}
                      required
                      disabled={submitting}
                    />
                    {errors.phone && (
                      <span className="field-error-msg" role="alert">
                        {errors.phone}
                      </span>
                    )}
                  </label>

                  <label className="checkout-field full-width">
                    <span className="field-label">
                      {t.shop.address} <span className="field-required">*</span>
                    </span>
                    <input
                      type="text"
                      className={`checkout-input ${errors.address ? 'input-error' : ''}`}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address) {
                          setErrors((prev) => ({ ...prev, address: '' }));
                        }
                      }}
                      required
                      disabled={submitting}
                    />
                    {errors.address && (
                      <span className="field-error-msg" role="alert">
                        {errors.address}
                      </span>
                    )}
                  </label>

                  <label className="checkout-field full-width">
                    <span className="field-label">{t.shop.note}</span>
                    <textarea
                      className="checkout-textarea"
                      rows={3}
                      placeholder={t.shop.notePlaceholder}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      disabled={submitting}
                    />
                  </label>
                </div>
              </section>

              {/* Phương thức thanh toán */}
              <section className="checkout-section-box">
                <div className="checkout-section-header">
                  <CreditCard size={20} strokeWidth={1.75} className="section-header-icon" aria-hidden="true" />
                  <h2>{t.shop.paymentMethod}</h2>
                </div>

                <div className="payment-options-list" role="radiogroup" aria-label="Chọn phương thức thanh toán">
                  <label
                    className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      disabled={submitting}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-title-wrap">
                        <Truck size={18} strokeWidth={1.75} aria-hidden="true" />
                        <span className="payment-option-title">{t.shop.cod}</span>
                      </div>
                      <p className="payment-option-desc">{t.shop.codDesc}</p>
                    </div>
                  </label>

                  <label
                    className={`payment-option-card ${paymentMethod === 'MOCK_GATEWAY' ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MOCK_GATEWAY"
                      checked={paymentMethod === 'MOCK_GATEWAY'}
                      onChange={() => setPaymentMethod('MOCK_GATEWAY')}
                      disabled={submitting}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-title-wrap">
                        <CreditCard size={18} strokeWidth={1.75} aria-hidden="true" />
                        <span className="payment-option-title">{t.shop.mockGateway}</span>
                      </div>
                      <p className="payment-option-desc">{t.shop.mockGatewayDesc}</p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Cột phải: Tóm tắt đơn hàng */}
            <div className="checkout-summary-panel">
              <div className="summary-card">
                <h3 className="summary-card-title">Tóm tắt đơn hàng</h3>

                <div className="summary-item-list">
                  {cartItems.map((item) => (
                    <div key={item.id} className="summary-item-row">
                      <div className="summary-item-name-col">
                        <span className="summary-item-name">{item.name}</span>
                        <span className="summary-item-qty">× {item.quantity}</span>
                      </div>
                      <b className="summary-item-price">
                        {formatPrice(item.price * item.quantity)}
                      </b>
                    </div>
                  ))}
                </div>

                <div className="summary-divider" />

                <div className="summary-cost-rows">
                  <div className="summary-cost-row">
                    <span>Số lượng món:</span>
                    <span>{totalCount} phần</span>
                  </div>
                  <div className="summary-cost-row">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="summary-cost-row">
                    <span>Phí giao hàng:</span>
                    <span className="free-shipping">Miễn phí</span>
                  </div>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-row">
                  <span className="summary-total-label">{t.shop.total} (ước tính):</span>
                  <b className="summary-total-amount">{formatPrice(totalAmount)}</b>
                </div>
                <p className="summary-note">
                  Số tiền chính thức sẽ do máy chủ hệ thống tính toán và xác nhận.
                </p>

                {serverError && (
                  <div className="checkout-server-error" role="alert">
                    <AlertCircle size={16} strokeWidth={2} aria-hidden="true" />
                    <span>{serverError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="tb checkout-submit-btn"
                  disabled={submitting || cartItems.length === 0}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} strokeWidth={2} className="spin-icon" aria-hidden="true" />
                      <span>{t.shop.submitting}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>{t.shop.placeOrder}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
