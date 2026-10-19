import { useNavbarLanguage } from '../../content/languages';
import {
  CheckoutErrorCode,
  CheckoutErrors,
  CheckoutField,
} from './checkoutValidation';
import { ContactFormData } from './ContactSection';

export interface DeliveryOptionsSectionProps {
  formData: ContactFormData;
  errors: CheckoutErrors;
  touched: Partial<Record<CheckoutField, boolean>>;
  submitted: boolean;
  onChange: (field: keyof ContactFormData, value: string | boolean) => void;
  onBlur: (field: CheckoutField) => void;
  disabled?: boolean;
}

function useReceiverErrorText() {
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;
  return (code?: CheckoutErrorCode): string => {
    switch (code) {
      case 'OTHER_NAME_REQUIRED':
        return c.errOtherNameRequired;
      case 'OTHER_PHONE_REQUIRED':
        return c.errOtherPhoneRequired;
      case 'OTHER_PHONE_INVALID':
        return c.errOtherPhoneInvalid;
      default:
        return '';
    }
  };
}

export function DeliveryOptionsSection({
  formData,
  errors,
  touched,
  submitted,
  onChange,
  onBlur,
  disabled = false,
}: DeliveryOptionsSectionProps) {
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;
  const errorText = useReceiverErrorText();

  const isVisible = (field: CheckoutField): boolean =>
    (submitted || Boolean(touched[field])) && Boolean(errors[field]);

  const fieldError = (field: CheckoutField): string =>
    isVisible(field) ? errorText(errors[field]) : '';

  return (
    <section className="co-card">
      <div className="co-card-head">
        <span className="co-card-index" aria-hidden="true">
          3
        </span>
        <h2 className="co-card-title">{c.deliverySection}</h2>
      </div>

      <div className="co-form-grid">
        <div className="co-field">
          <label htmlFor="deliveryTime" className="co-label">
            {c.deliveryTimeLabel}
          </label>
          <select
            id="deliveryTime"
            value={formData.deliveryTime}
            onChange={(e) => onChange('deliveryTime', e.target.value)}
            disabled={disabled}
            className="co-select"
          >
            <option value="">{c.deliveryTimeAny}</option>
            <option value="morning">{c.deliveryTimeMorning}</option>
            <option value="afternoon">{c.deliveryTimeAfternoon}</option>
            <option value="evening">{c.deliveryTimeEvening}</option>
          </select>
          <p className="co-hint">{c.deliveryTimeHint}</p>
        </div>

        <div className="co-field">
          <label htmlFor="note" className="co-label">
            {c.noteLabel}
          </label>
          <textarea
            id="note"
            rows={2}
            value={formData.note}
            onChange={(e) => onChange('note', e.target.value)}
            disabled={disabled}
            placeholder={c.notePlaceholder}
            className="co-textarea"
          />
        </div>

        <div className="co-toggle-block">
          <label htmlFor="deliverToOther" className="co-toggle">
            <input
              id="deliverToOther"
              type="checkbox"
              checked={formData.deliverToOther}
              onChange={(e) => onChange('deliverToOther', e.target.checked)}
              disabled={disabled}
            />
            <span>{c.otherReceiverToggle}</span>
          </label>

          {formData.deliverToOther && (
            <div className="co-field-row co-other-receiver">
              <div className="co-field">
                <label htmlFor="otherReceiverName" className="co-label">
                  {c.otherReceiverNameLabel} <span className="co-req">*</span>
                </label>
                <input
                  id="otherReceiverName"
                  type="text"
                  value={formData.otherReceiverName}
                  onChange={(e) => onChange('otherReceiverName', e.target.value)}
                  onBlur={() => onBlur('otherReceiverName')}
                  disabled={disabled}
                  className={`co-input ${
                    isVisible('otherReceiverName') ? 'has-error' : ''
                  }`}
                  aria-invalid={isVisible('otherReceiverName')}
                  aria-describedby="otherReceiverName-error"
                />
                <p id="otherReceiverName-error" className="co-error" role="alert">
                  {fieldError('otherReceiverName')}
                </p>
              </div>

              <div className="co-field">
                <label htmlFor="otherReceiverPhone" className="co-label">
                  {c.otherReceiverPhoneLabel} <span className="co-req">*</span>
                </label>
                <input
                  id="otherReceiverPhone"
                  type="tel"
                  value={formData.otherReceiverPhone}
                  onChange={(e) => onChange('otherReceiverPhone', e.target.value)}
                  onBlur={() => onBlur('otherReceiverPhone')}
                  disabled={disabled}
                  className={`co-input ${
                    isVisible('otherReceiverPhone') ? 'has-error' : ''
                  }`}
                  aria-invalid={isVisible('otherReceiverPhone')}
                  aria-describedby="otherReceiverPhone-error"
                />
                <p id="otherReceiverPhone-error" className="co-error" role="alert">
                  {fieldError('otherReceiverPhone')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default DeliveryOptionsSection;
