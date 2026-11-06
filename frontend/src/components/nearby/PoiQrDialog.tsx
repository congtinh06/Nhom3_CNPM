import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { GeoPoi } from '../../pages/NearbyPage';
import { SupportedLanguage } from '../../types';
import { PlaceQR, buildPoiQrUrl } from '../common/PlaceQR';
import { t } from '../../content/nearbyI18n';

interface PoiQrDialogProps {
  poi: GeoPoi;
  currentLang: SupportedLanguage;
  getPoiName: (poi: GeoPoi) => string;
  onClose: () => void;
}

/**
 * Compact "listen on your phone" dialog: one ~160px QR code plus the small
 * download / copy / share actions. Closes on Esc or a backdrop click and
 * returns focus to whatever triggered it.
 */
export const PoiQrDialog: React.FC<PoiQrDialogProps> = ({
  poi,
  currentLang,
  getPoiName,
  onClose,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const poiName = getPoiName(poi);

  useEffect(() => {
    previouslyFocusedRef.current =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

    // Move focus into the dialog without stealing scroll position.
    if (closeBtnRef.current) {
      closeBtnRef.current.focus({ preventScroll: true });
    }

    const previousOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (typeof document !== 'undefined') document.body.style.overflow = previousOverflow;
      const target = previouslyFocusedRef.current;
      if (target && typeof target.focus === 'function') {
        target.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  const handleShare = useCallback(() => {
    const url = buildPoiQrUrl(poi);
    if (!url) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({ title: poiName, text: poiName, url }).catch(() => {});
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [poi, poiName]);

  return (
    <div className="nearby-qr-overlay" onClick={onClose}>
      <div
        className="nearby-qr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nearby-qr-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="nearby-qr-close"
          onClick={onClose}
          aria-label={t(currentLang, 'qrCloseAria')}
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        <h2 id="nearby-qr-title" className="nearby-qr-title">
          {t(currentLang, 'qrModalTitle')}
        </h2>
        <p className="nearby-qr-poi-name" lang={currentLang}>
          {poiName}
        </p>

        <PlaceQR
          poi={poi}
          size={160}
          lang={currentLang}
          label={poiName}
          orderNumber={poi.stopOrder}
          showHint
          showActions
          className="nearby-qr-code"
        />

        <button type="button" className="nearby-qr-share" onClick={handleShare}>
          {t(currentLang, 'qrShare')}
        </button>
      </div>
    </div>
  );
};

export default PoiQrDialog;
