import { CreditCard } from 'lucide-react';
import { useNavbarLanguage } from '../../content/languages';

export type PaymentMethod = 'COD' | 'VIETQR' | 'VNPAY';

export interface PaymentSectionProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentSection({
  selectedMethod,
  onChange,
  disabled = false,
}: PaymentSectionProps) {
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;

  return (
    <section className="co-card">
      <div className="co-card-head">
        <span className="co-card-index" aria-hidden="true">
          4
        </span>
        <h2 className="co-card-title">{c.paymentSection}</h2>
      </div>

      <div
        className="co-pay-options"
        role="radiogroup"
        aria-label={c.paymentSection}
      >
        <label
          htmlFor="payment-cod"
          className={`co-pay-option ${selectedMethod === 'COD' ? 'is-selected' : ''} ${
            disabled ? 'is-disabled' : ''
          }`}
        >
          <input
            id="payment-cod"
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={selectedMethod === 'COD'}
            onChange={() => onChange('COD')}
            disabled={disabled}
            className="co-pay-input"
          />
          <span className="co-radio" aria-hidden="true">
            <span className="co-radio-dot" />
          </span>
          <span className="co-pay-text">
            <span className="co-pay-title">
              <CreditCard size={16} strokeWidth={2} aria-hidden="true" />
              {c.codTitle}
            </span>
            <span className="co-pay-desc">{c.codDesc}</span>
          </span>
        </label>

        <label
          htmlFor="payment-vietqr"
          className={`co-pay-option ${
            selectedMethod === 'VIETQR' ? 'is-selected' : ''
          } ${disabled ? 'is-disabled' : ''}`}
        >
          <input
            id="payment-vietqr"
            type="radio"
            name="paymentMethod"
            value="VIETQR"
            checked={selectedMethod === 'VIETQR'}
            onChange={() => onChange('VIETQR')}
            disabled={disabled}
            className="co-pay-input"
          />
          <span className="co-radio" aria-hidden="true">
            <span className="co-radio-dot" />
          </span>
          <span className="co-pay-text">
            <span className="co-pay-title">
              <CreditCard size={16} strokeWidth={2} aria-hidden="true" />
              {c.vietQrTitle}
            </span>
            <span className="co-pay-desc">{c.vietQrDesc}</span>
          </span>
        </label>

        <label
          htmlFor="payment-vnpay"
          className={`co-pay-option ${
            selectedMethod === 'VNPAY' ? 'is-selected' : ''
          } ${disabled ? 'is-disabled' : ''}`}
        >
          <input
            id="payment-vnpay"
            type="radio"
            name="paymentMethod"
            value="VNPAY"
            checked={selectedMethod === 'VNPAY'}
            onChange={() => onChange('VNPAY')}
            disabled={disabled}
            className="co-pay-input"
          />
          <span className="co-radio" aria-hidden="true">
            <span className="co-radio-dot" />
          </span>
          <span className="co-pay-text">
            <span className="co-pay-title">
              <CreditCard size={16} strokeWidth={2} aria-hidden="true" />
              {c.vnpayTitle}
            </span>
            <span className="co-pay-desc">{c.vnpayDesc}</span>
          </span>
        </label>
      </div>

      <p className="co-pay-notice">{c.vietQrDemoNotice}</p>
    </section>
  );
}

export default PaymentSection;
