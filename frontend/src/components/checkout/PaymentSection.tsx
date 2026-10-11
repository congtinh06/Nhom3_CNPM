import { CreditCard } from 'lucide-react';

export type PaymentMethod = 'COD' | 'VIETQR';

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
  return (
    <section className="checkout-card">
      {/* Header */}
      <div className="checkout-card-header">
        <div className="checkout-card-icon" aria-hidden="true">
          <CreditCard size={18} strokeWidth={2} />
        </div>
        <h2 className="checkout-card-title">Phương thức thanh toán</h2>
      </div>

      {/* Options List */}
      <div className="checkout-options-stack" role="radiogroup" aria-label="Phương thức thanh toán">
        {/* Option 1: COD */}
        <label
          htmlFor="payment-cod"
          className={`checkout-option-card ${selectedMethod === 'COD' ? 'selected' : ''}`}
          style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          <input
            id="payment-cod"
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={selectedMethod === 'COD'}
            onChange={() => onChange('COD')}
            disabled={disabled}
            style={{ display: 'none' }}
          />

          {/* Radio indicator */}
          <div className="checkout-radio-circle" aria-hidden="true">
            <div className="checkout-radio-dot" />
          </div>

          <div className="option-content">
            <span className="option-title">Thanh toán khi nhận hàng (COD)</span>
            <p className="option-desc">Thanh toán tiền mặt trực tiếp khi nhận món</p>
          </div>
        </label>

        {/* Option 2: VietQR */}
        <label
          htmlFor="payment-vietqr"
          className={`checkout-option-card ${selectedMethod === 'VIETQR' ? 'selected' : ''}`}
          style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          <input
            id="payment-vietqr"
            type="radio"
            name="paymentMethod"
            value="VIETQR"
            checked={selectedMethod === 'VIETQR'}
            onChange={() => onChange('VIETQR')}
            disabled={disabled}
            style={{ display: 'none' }}
          />

          {/* Radio indicator */}
          <div className="checkout-radio-circle" aria-hidden="true">
            <div className="checkout-radio-dot" />
          </div>

          <div className="option-content">
            <span className="option-title">Chuyển khoản ngân hàng (VietQR)</span>
            <p className="option-desc">Quét mã QR qua app ngân hàng hoặc ví điện tử (mã QR hiển thị sau khi đặt hàng)</p>
          </div>
        </label>
      </div>
    </section>
  );
}

export default PaymentSection;
