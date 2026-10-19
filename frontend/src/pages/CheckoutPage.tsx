import { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/checkout.css';
import '../styles/checkoutPage.css';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createBackendOrder } from '../services/orderService';
import { Stepper } from '../components/checkout/Stepper';
import { ContactSection, ContactFormData } from '../components/checkout/ContactSection';
import { DeliveryOptionsSection } from '../components/checkout/DeliveryOptionsSection';
import { PaymentSection, PaymentMethod } from '../components/checkout/PaymentSection';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { PlaceOrderArea } from '../components/checkout/PlaceOrderArea';
import {
  CheckoutField,
  cleanPhone,
  firstInvalidField,
  getPlaceOrderReason,
  validateAll,
} from '../components/checkout/checkoutValidation';
import { useNavbarLanguage } from '../content/languages';
import { useIsDesktop } from '../hooks/useIsDesktop';
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
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;
  const isDesktop = useIsDesktop();
  const {
    cartItems,
    totalAmount,
    totalCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

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
    altAddress: '',
    note: '',
    deliveryTime: '',
    deliverToOther: false,
    otherReceiverName: '',
    otherReceiverPhone: '',
  });

  const [touched, setTouched] = useState<Partial<Record<CheckoutField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const hasPrefilledRef = useRef(false);

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

  const errors = useMemo(() => validateAll(formData), [formData]);

  const reason = useMemo(
    () =>
      getPlaceOrderReason({
        submitting,
        cartCount: cartItems.length,
        values: formData,
        agreedTerms,
      }),
    [submitting, cartItems.length, formData, agreedTerms]
  );

  const handleFieldChange = (
    field: keyof ContactFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFieldBlur = (field: CheckoutField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const subtotal = totalAmount;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    if (submitting) return;
    setServerError(null);
    setSubmitted(true);

    if (cartItems.length === 0) return;

    const invalid = firstInvalidField(formData);
    if (invalid) {
      const el = document.getElementById(invalid);
      if (el) {
        el.focus();
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      return;
    }

    if (!agreedTerms) return;

    setSubmitting(true);
    const idempotencyKey = generateUUID();

    try {
      const fullAddress = [
        formData.streetAddress.trim(),
        formData.altAddress.trim(),
        formData.wardName,
        formData.districtName,
        formData.provinceName,
      ]
        .filter(Boolean)
        .join(', ');

      const deliveryTimeLabel =
        formData.deliveryTime === 'morning'
          ? c.deliveryTimeMorning
          : formData.deliveryTime === 'afternoon'
          ? c.deliveryTimeAfternoon
          : formData.deliveryTime === 'evening'
          ? c.deliveryTimeEvening
          : '';

      const noteParts = [
        formData.deliverToOther
          ? `Người nhận: ${formData.otherReceiverName.trim()} - ${cleanPhone(
              formData.otherReceiverPhone
            )}`
          : '',
        deliveryTimeLabel ? `${c.deliveryTimeLabel}: ${deliveryTimeLabel}` : '',
        formData.note.trim(),
      ].filter(Boolean);

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
          receiverName: formData.deliverToOther
            ? formData.otherReceiverName.trim()
            : formData.receiverName.trim(),
          phone: formData.deliverToOther
            ? cleanPhone(formData.otherReceiverPhone)
            : cleanPhone(formData.phone),
          address: fullAddress,
          note: noteParts.length > 0 ? noteParts.join(' | ') : undefined,
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
    poiSlug: it.poiSlug,
  }));

  const placeOrderArea = (
    <PlaceOrderArea
      agreedTerms={agreedTerms}
      onAgreedTermsChange={setAgreedTerms}
      reason={reason}
      termsError={reason === 'terms'}
      onPlaceOrder={handlePlaceOrder}
      submitting={submitting}
    />
  );

  return (
    <div className="checkout-page-container">
      <main className="co-wrap">
        <div className="co-header-row">
          <h1 className="co-title">{t.shop.checkoutTitle}</h1>
          <Stepper currentStep={2} />
        </div>

        {cartItems.length === 0 ? (
          <div className="checkout-empty-card">
            <div className="checkout-empty-icon-wrap" aria-hidden="true">
              <ShoppingBag size={28} />
            </div>
            <h2 className="checkout-empty-title">Giỏ hàng của bạn đang trống</h2>
            <p className="checkout-empty-desc">
              Vui lòng chọn quà lưu niệm trước khi tiến hành thanh toán.
            </p>
            <Link to="/am-thuc" className="checkout-empty-btn">
              Khám phá quà lưu niệm
            </Link>
          </div>
        ) : (
          <>
            <div className="co-grid">
              <div className="co-left">
                {serverError && (
                  <div className="checkout-alert-error" role="alert">
                    {serverError}
                  </div>
                )}

                <ContactSection
                  formData={formData}
                  errors={errors}
                  touched={touched}
                  submitted={submitted}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  disabled={submitting}
                />

                <DeliveryOptionsSection
                  formData={formData}
                  errors={errors}
                  touched={touched}
                  submitted={submitted}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  disabled={submitting}
                />

                <PaymentSection
                  selectedMethod={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={submitting}
                />
              </div>

              <div className="co-right">
                <OrderSummary
                  items={summaryItems}
                  subtotal={subtotal}
                  shippingFee={shippingFee}
                  total={total}
                  totalCount={totalCount}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeFromCart}
                >
                  {isDesktop ? placeOrderArea : null}
                </OrderSummary>
              </div>
            </div>

            {!isDesktop && (
              <div className="co-mobile-placeorder">{placeOrderArea}</div>
            )}
          </>
        )}
      </main>

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
