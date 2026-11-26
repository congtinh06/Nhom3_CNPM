import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { buildPlaceQrContent } from '../../lib/placeQrContent.mjs';
import { resolveQrBaseUrl } from '../../lib/qrOrigin';
import { t } from '../../content/nearbyI18n';
import { SupportedLanguage } from '../../types';

export { resolveQrBaseUrl } from '../../lib/qrOrigin';

type BuildPlaceQrContentFn = (
  baseUrl: string,
  qrToken: string,
  slug?: string | null
) => string;

const buildPlaceQrContentTyped = buildPlaceQrContent as unknown as BuildPlaceQrContentFn;

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
  /** When set, the QR expires after this many seconds and must be refreshed. */
  expiresInSeconds?: number;
  /** Hide the countdown when the parent already displays one. */
  showCountdown?: boolean;
  onExpire?: () => void;
}

const SAMPLE_TOKEN_PREFIX = 'sample_qr_';

/** A POI QR shown in the app is only valid for one minute. */
export const POI_QR_LIFETIME_SECONDS = 60;

/** Brief expired state before a fresh QR is generated automatically. */
const QR_REFRESH_DELAY_MS = 3000;

/** Minimum edge length (px) of the exported PNG, per the QR spec. */
const EXPORT_SIZE = 1024;

export function isQrAvailable(poi?: PlaceQRPoi | null): boolean {
  const token = poi?.qrToken?.trim();
  if (!token) return false;
  return !token.startsWith(SAMPLE_TOKEN_PREFIX);
}

/** Full URL encoded in a POI's QR code (empty string when unavailable). */
export function buildPoiQrUrl(poi?: PlaceQRPoi | null): string {
  if (!isQrAvailable(poi)) return '';
  const slug = poi?.slug?.trim();
  return buildPlaceQrContentTyped(resolveQrBaseUrl(), poi?.qrToken ?? '', slug);
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
  expiresInSeconds = 0,
  showCountdown = true,
  onExpire,
}) => {
  const codeRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresInSeconds);
  const [generation, setGeneration] = useState(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const content = buildPoiQrUrl(poi);
  const lifetime = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ? expiresInSeconds : 0;

  // Deadline-based countdown: a busy main thread cannot extend the QR lifetime.
  useEffect(() => {
    if (!lifetime || !content) {
      setExpired(false);
      return undefined;
    }

    const deadline = Date.now() + lifetime * 1000;
    let fired = false;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && !fired) {
        fired = true;
        setExpired(true);
        setCopied(false);
        onExpireRef.current?.();
      }
    };

    setSecondsLeft(lifetime);
    setExpired(false);
    tick();
    const timer = window.setInterval(tick, 250);
    return () => {
      fired = true;
      window.clearInterval(timer);
    };
  }, [lifetime, content, generation]);

  const handleRefresh = useCallback(() => {
    setGeneration((value) => value + 1);
  }, []);

  // Show that the code died, then quietly issue a fresh one with a new minute.
  useEffect(() => {
    if (!expired || !lifetime) return undefined;
    const timer = window.setTimeout(handleRefresh, QR_REFRESH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [expired, lifetime, handleRefresh]);

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
    <div
      className={`place-qr ${className}`.trim()}
      data-qr-token={poi?.qrToken}
      data-qr-expired={expired ? 'true' : undefined}
    >
      <div className="place-qr-code" ref={codeRef}>
        <QRCodeCanvas
          value={content}
          size={size}
          level="Q"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#000000"
        />
        {expired && (
          // Hết 60s: làm mờ mã cũ và phủ lớp cảnh báo, kèm nút tạo mã mới.
          <div className="place-qr-expired" role="status" aria-live="polite">
            <p className="place-qr-expired-text">{t(lang, 'qrExpired')}</p>
            <p className="place-qr-expired-hint">{t(lang, 'qrRefreshingSoon')}</p>
            <button type="button" className="place-qr-action" onClick={handleRefresh}>
              {t(lang, 'qrRefresh')}
            </button>
          </div>
        )}
      </div>
      {!expired && showHint && <p className="place-qr-hint">{t(lang, 'qrScanHint')}</p>}
      {!expired && lifetime > 0 && showCountdown && (
        <p className="place-qr-expiry" role="timer">
          {t(lang, 'qrExpiresIn', { seconds: secondsLeft })}
        </p>
      )}
      {!expired && showActions && (
        <div className="place-qr-actions">
          <button type="button" className="place-qr-action" onClick={handleDownload}>
            {t(lang, 'qrDownload')}
          </button>
          <button type="button" className="place-qr-action" onClick={handleCopy}>
            {copied ? t(lang, 'qrLinkCopied') : t(lang, 'qrCopyLink')}
          </button>
        </div>
      )}
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
