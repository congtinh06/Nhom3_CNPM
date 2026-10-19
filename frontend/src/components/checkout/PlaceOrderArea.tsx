import { Phone } from 'lucide-react';
import { useNavbarLanguage } from '../../content/languages';
import { HOTLINE_HOURS, HOTLINE_NUMBER } from '../../config/constants';
import { PlaceOrderReason } from './checkoutValidation';

export interface PlaceOrderAreaProps {
  agreedTerms: boolean;
  onAgreedTermsChange: (checked: boolean) => void;
  reason: PlaceOrderReason;
  termsError: boolean;
  onPlaceOrder: () => void;
  submitting: boolean;
}

export function PlaceOrderArea({
  agreedTerms,
  onAgreedTermsChange,
  reason,
  termsError,
  onPlaceOrder,
  submitting,
}: PlaceOrderAreaProps) {
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;

  const reasonText = ((): string => {
    switch (reason) {
      case 'submitting':
        return c.reasonSubmitting;
      case 'emptyCart':
        return c.reasonEmptyCart;
      case 'required':
        return c.reasonRequired;
      case 'invalid':
        return c.reasonInvalid;
      case 'terms':
        return c.reasonTerms;
      default:
        return '';
    }
  })();

  const supportText = c.supportLine
    .replace('{phone}', HOTLINE_NUMBER)
    .replace('{hours}', HOTLINE_HOURS);

  return (
    <div className="co-placeorder">
      <label className={`co-terms ${termsError ? 'has-error' : ''}`}>
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(e) => onAgreedTermsChange(e.target.checked)}
        />
        <span>
          {c.termsPrefix}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="co-terms-link"
          >
            {c.termsLink}
          </a>
          {c.termsSuffix}
        </span>
      </label>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={submitting}
        className="co-submit-btn"
      >
        {submitting ? c.placingOrder : c.placeOrder}
      </button>

      <p className="co-reason" aria-live="polite">
        {reasonText}
      </p>

      <p className="co-support">
        <Phone size={13} aria-hidden="true" />
        <span>{supportText}</span>
      </p>
    </div>
  );
}

export default PlaceOrderArea;
