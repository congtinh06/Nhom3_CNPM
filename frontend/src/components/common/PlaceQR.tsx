import React, { useCallback, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { buildPlaceQrContent } from '../../lib/placeQrContent.mjs';
import { t } from '../../content/nearbyI18n';
import { SupportedLanguage } from '../../types';

export interface PlaceQRPoi {
  qrToken?: string | null;
  slug?: string | null;
}

export interface PlaceQRProps {
  poi: PlaceQRPoi;
  size?: number;
  lang: SupportedLanguage;
  label?: string;
  className?: string;
  showHint?: boolean;
  showActions?: boolean;
}

const SAMPLE_TOKEN_PREFIX = 'sample_qr_';

/**
 * Resolve the base URL used to build QR links. A build/deploy can override the
 * domain with VITE_QR_BASE_URL; otherwise we use the current site origin.
 */
export function resolveQrBaseUrl(): string {
  const env = import.meta.env.VITE_QR_BASE_URL as string | undefined;
  if (env && env.trim()) return env.trim();
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function isQrAvailable(poi?: PlaceQRPoi | null): boolean {
  const token = poi?.qrToken?.trim();
  if (!token) return false;
  return !token.startsWith(SAMPLE_TOKEN_PREFIX);
}

/** Full URL encoded in a POI's QR code (empty string when unavailable). */
export function buildPoiQrUrl(poi?: PlaceQRPoi | null): string {
  if (!isQrAvailable(poi)) return '';
  return buildPlaceQrContent(resolveQrBaseUrl(), poi?.qrToken);
}

function slugifyName(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'poi'
  );
}

export const PlaceQR: React.FC<PlaceQRProps> = ({
  poi,
  size = 128,
  lang,
  label,
  className = '',
  showHint = true,
  showActions = false,
}) => {
  const codeRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const content = buildPoiQrUrl(poi);

  const handleDownload = useCallback(() => {
    if (!content) return;
    const canvas = codeRef.current?.querySelector('canvas');
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slugifyName(label || poi?.slug || '')}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Canvas export can fail in some browsers; nothing actionable here.
    }
  }, [content, label, poi?.slug]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    };
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (clipboard?.writeText) {
      clipboard
        .writeText(content)
        .then(done)
        .catch(() => {});
    }
  }, [content]);

  if (!content) return null;

  return (
    <div className={`place-qr ${className}`.trim()} data-qr-token={poi?.qrToken}>
      <div className="place-qr-code" ref={codeRef}>
        <QRCodeCanvas
          value={content}
          size={size}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#2b1d16"
        />
      </div>
      {showHint && <p className="place-qr-hint">{t(lang, 'qrScanHint')}</p>}
      {showActions && (
        <div className="place-qr-actions">
          <button type="button" className="place-qr-action" onClick={handleDownload}>
            {t(lang, 'qrDownload')}
          </button>
          <button type="button" className="place-qr-action" onClick={handleCopy}>
            {copied ? t(lang, 'qrLinkCopied') : t(lang, 'qrCopyLink')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaceQR;
