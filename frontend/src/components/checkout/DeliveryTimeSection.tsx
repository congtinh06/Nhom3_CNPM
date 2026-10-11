import { Clock } from 'lucide-react';

export type DeliveryTimeType = 'NOW' | 'SCHEDULED';

export interface DeliveryTimeSectionProps {
  selectedType: DeliveryTimeType;
  onChange: (type: DeliveryTimeType) => void;
  disabled?: boolean;
}

export function DeliveryTimeSection({
  selectedType,
  onChange,
  disabled = false,
}: DeliveryTimeSectionProps) {
  return (
    <section className="checkout-card">
      {/* Header */}
      <div className="checkout-card-header">
        <div className="checkout-card-icon" aria-hidden="true">
          <Clock size={18} strokeWidth={2} />
        </div>
        <h2 className="checkout-card-title">Thời gian giao hàng</h2>
      </div>

      {/* 2 Options Side-by-Side */}
      <div className="checkout-options-grid" role="radiogroup" aria-label="Thời gian giao hàng">
        {/* Option 1: Giao ngay */}
        <label
          htmlFor="delivery-now"
          className={`checkout-option-card ${selectedType === 'NOW' ? 'selected' : ''}`}
          style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          <input
            id="delivery-now"
            type="radio"
            name="deliveryTimeType"
            value="NOW"
            checked={selectedType === 'NOW'}
            onChange={() => onChange('NOW')}
            disabled={disabled}
            style={{ display: 'none' }}
          />

          {/* Radio indicator */}
          <div className="checkout-radio-circle" aria-hidden="true">
            <div className="checkout-radio-dot" />
          </div>

          <div className="option-content">
            <span className="option-title">Giao ngay</span>
            <p className="option-desc">Trong vòng 30 phút sau khi xác nhận</p>
          </div>
        </label>

        {/* Option 2: Hẹn giờ */}
        <label
          htmlFor="delivery-scheduled"
          className={`checkout-option-card ${selectedType === 'SCHEDULED' ? 'selected' : ''}`}
          style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
        >
          <input
            id="delivery-scheduled"
            type="radio"
            name="deliveryTimeType"
            value="SCHEDULED"
            checked={selectedType === 'SCHEDULED'}
            onChange={() => onChange('SCHEDULED')}
            disabled={disabled}
            style={{ display: 'none' }}
          />

          {/* Radio indicator */}
          <div className="checkout-radio-circle" aria-hidden="true">
            <div className="checkout-radio-dot" />
          </div>

          <div className="option-content">
            <span className="option-title">Hẹn giờ</span>
            <p className="option-desc">Chọn khung giờ bạn thuận tiện nhận món</p>
          </div>
        </label>
      </div>
    </section>
  );
}

export default DeliveryTimeSection;
