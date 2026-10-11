import { useState, useEffect, useRef } from 'react';
import '../styles/checkout.css';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createBackendOrder } from '../services/orderService';
import { Stepper } from '../components/checkout/Stepper';
import {
  ContactSection,
  ContactFormData,
  ContactErrors,
} from '../components/checkout/ContactSection';
import {
  DeliveryTimeSection,
  DeliveryTimeType,
} from '../components/checkout/DeliveryTimeSection';
import {
  PaymentSection,
  PaymentMethod,
} from '../components/checkout/PaymentSection';
import { OrderSummary } from '../components/checkout/OrderSummary';
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  HOTLINE_NUMBER,
} from '../config/constants';

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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    cartItems,
    totalAmount,
    totalCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  // Khách vãng lai: receiverName và email để trống ban đầu
  const [formData, setFormData] = useState<ContactFormData>({
    receiverName: '',
    phone: '',
    email: '',
    provinceCode: '79',
    provinceName: 'Thành phố Hồ Chí Minh',
    districtCode: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    streetAddress: '',
    note: '',
    voucherCode: '',
  });

  const [errors, setErrors] = useState<ContactErrors>({});
  const [deliveryTime, setDeliveryTime] = useState<DeliveryTimeType>('NOW');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hasPrefilledRef = useRef(false);

  // Chỉ tự điền Họ tên và Email khi đã đăng nhập tài khoản thật
  useEffect(() => {
    if (isAuthenticated && user && !hasPrefilledRef.current) {
      setFormData((prev) => ({
        ...prev,
        receiverName: user.fullName || prev.receiverName,
        email: user.email || prev.email,
      }));
      hasPrefilledRef.current = true;
    }
  }, [isAuthenticated, user]);

  const handleFieldChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ContactErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Fees calculation
  const subtotal = totalAmount;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const validateForm = (): boolean => {
    const newErrors: ContactErrors = {};
    let firstInvalidId: string | null = null;

    if (!formData.receiverName.trim() || formData.receiverName.trim().length < 2) {
      newErrors.receiverName = 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).';
      firstInvalidId = 'receiverName';
    }

    const cleanPhone = formData.phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số, đầu 03/05/07/08/09).';
      if (!firstInvalidId) firstInvalidId = 'phone';
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Địa chỉ email không đúng định dạng.';
        if (!firstInvalidId) firstInvalidId = 'email';
      }
    }

    if (!formData.provinceCode) {
      newErrors.province = 'Vui lòng chọn Tỉnh / Thành phố.';
      if (!firstInvalidId) firstInvalidId = 'province';
    }

    if (!formData.districtCode) {
      newErrors.district = 'Vui lòng chọn Quận / Huyện.';
      if (!firstInvalidId) firstInvalidId = 'district';
    }

    if (!formData.wardCode) {
      newErrors.ward = 'Vui lòng chọn Phường / Xã.';
      if (!firstInvalidId) firstInvalidId = 'ward';
    }

    if (!formData.streetAddress.trim() || formData.streetAddress.trim().length < 3) {
      newErrors.streetAddress = 'Vui lòng nhập số nhà, tên đường chi tiết.';
      if (!firstInvalidId) firstInvalidId = 'streetAddress';
    }

    setErrors(newErrors);

    if (firstInvalidId) {
      const el = document.getElementById(firstInvalidId);
      if (el) el.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (submitting) return;
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
      const fullAddress = [
        formData.streetAddress.trim(),
        formData.wardName,
        formData.districtName,
        formData.provinceName,
      ]
        .filter(Boolean)
        .join(', ');

      const itemsPayload = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const metaLookup: Record<number, { name: string; price: number }> = {};
      cartItems.forEach((item) => {
        metaLookup[item.id] = { name: item.name, price: item.price };
      });

      const order = await createBackendOrder(
        {
          receiverName: formData.receiverName.trim(),
          phone: formData.phone.replace(/[\s.-]/g, ''),
          address: fullAddress,
          note: formData.note.trim() || undefined,
          paymentMethod,
          items: itemsPayload,
        },
        idempotencyKey,
        metaLookup
      );

      clearCart();

      if (paymentMethod === 'VIETQR') {
        navigate(`/thanh-toan/qr/${encodeURIComponent(order.orderCode)}`, {
          replace: true,
        });
      } else {
        navigate(
          `/thanh-toan/ket-qua?orderCode=${encodeURIComponent(order.orderCode)}&method=COD&status=success`,
          { replace: true }
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại.';
      setServerError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const summaryItems = cartItems.map((it) => ({
    id: it.id,
    name: it.name,
    quantity: it.quantity,
    price: it.price,
    imageUrl: it.imagePath,
  }));

  return (
    <div className="checkout-page-container">
      <main className="checkout-main-wrap">
        {/* Top Header Row: Title on Left, Stepper on Right */}
        <div className="checkout-header-row">
          <h1 className="checkout-heading">
            Thanh toán đơn hàng
          </h1>
          <Stepper currentStep={2} />
        </div>

        {cartItems.length === 0 ? (
          <div className="checkout-empty-card">
            <div className="checkout-empty-icon-wrap" aria-hidden="true">
              <ShoppingBag size={28} />
            </div>
            <h2 className="checkout-empty-title">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="checkout-empty-desc">
              Vui lòng chọn món từ thực đơn trước khi tiến hành thanh toán.
            </p>
            <Link
              to="/am-thuc"
              className="checkout-empty-btn"
            >
              Khám phá thực đơn
            </Link>
          </div>
        ) : (
          <div className="checkout-grid">
            {/* Left Column: Contact + Delivery Time + Payment */}
            <div className="checkout-left-col">
              {serverError && (
                <div
                  className="checkout-alert-error"
                  role="alert"
                >
                  {serverError}
                </div>
              )}

              {/* Card 1: Thông tin nhận hàng (with cascading API) */}
              <ContactSection
                formData={formData}
                errors={errors}
                onChange={handleFieldChange}
                disabled={submitting}
              />

              {/* Card 2: Thời gian giao hàng (Giao ngay / Hẹn giờ) */}
              <DeliveryTimeSection
                selectedType={deliveryTime}
                onChange={setDeliveryTime}
                disabled={submitting}
              />

              {/* Card 3: Phương thức thanh toán (COD / VietQR) */}
              <PaymentSection
                selectedMethod={paymentMethod}
                onChange={setPaymentMethod}
                disabled={submitting}
              />
            </div>

            {/* Right Column: Tóm tắt đơn hàng */}
            <div className="checkout-right-col">
              <OrderSummary
                items={summaryItems}
                subtotal={subtotal}
                shippingFee={shippingFee}
                total={total}
                totalCount={totalCount}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onPlaceOrder={handlePlaceOrder}
                submitting={submitting}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Hotline button at bottom right (cách mép dưới 20px, nút #up nằm trên cách 12px) */}
      <aside aria-label="Hỗ trợ khách hàng" className="checkout-hotline-floating">
        <a
          href={`tel:${HOTLINE_NUMBER.replace(/\s+/g, '')}`}
          className="checkout-hotline-link"
        >
          <span className="hotline-pulse-dot" />
          <Phone size={13} style={{ color: '#C2410C' }} aria-hidden="true" />
          <span>Hotline {HOTLINE_NUMBER}</span>
        </a>
      </aside>
    </div>
  );
}

export default CheckoutPage;
