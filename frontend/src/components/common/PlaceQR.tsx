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
  orderNumber?: number | null;
  className?: string;
  showHint?: boolean;
  showActions?: boolean;
}

const SAMPLE_TOKEN_PREFIX = 'sample_qr_';

/** Minimum edge length (px) of the exported PNG, per the QR spec. */
const EXPORT_SIZE = 1024;

const isLocalhost = (url: string): boolean => {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return /localhost|127\.0\.0\.1/.test(url);
  }
};

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

/** True only while developing against the local machine with no explicit QR domain. */
export function shouldWarnQrLocalhost(): boolean {
  if (!import.meta.env.DEV) return false;
  const env = import.meta.env.VITE_QR_BASE_URL as string | undefined;
  if (env && env.trim()) return false;
  return isLocalhost(resolveQrBaseUrl());
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
  orderNumber,
  className = '',
  showHint = true,
  showActions = false,
}) => {
  const codeRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const content = buildPoiQrUrl(poi);
  const warnLocalhost = showActions && shouldWarnQrLocalhost();

  const handleDownload = useCallback(() => {
    if (!content) return;
    const source = exportRef.current?.querySelector('canvas');
    if (!source) return;
    try {
      const pad = 32;
      const textBand = 160;
      const out = document.createElement('canvas');
      out.width = source.width;
      out.height = source.height + textBand;
      const ctx = out.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(source, 0, 0);

      ctx.fillStyle = '#1c1410';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = out.width / 2;
      if (label) {
        ctx.font = '600 40px "Be Vietnam Pro", sans-serif';
        ctx.fillText(label, centerX, source.height + pad + 34);
      }
      if (orderNumber) {
        ctx.font = '400 30px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#57534e';
        ctx.fillText(`#${orderNumber}`, centerX, source.height + pad + 90);
      }

      const url = out.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${poi?.qrToken?.trim() || slugifyName(label || poi?.slug || '')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Canvas export can fail in some browsers; nothing actionable here.
    }
  }, [content, label, orderNumber, poi?.qrToken, poi?.slug]);

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
          level="Q"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#000000"
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
      {warnLocalhost && <p className="place-qr-warning">{t(lang, 'qrLocalhostWarning')}</p>}
      {showActions && (
        <div
          ref={exportRef}
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
          <QRCodeCanvas
            value={content}
            size={EXPORT_SIZE}
            level="Q"
            marginSize={4}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
      )}
    </div>
  );
};

export default PlaceQR;
