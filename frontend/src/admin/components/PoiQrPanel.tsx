import React, { useCallback, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { buildPlaceQrContent } from '../../lib/placeQrContent.mjs';

export interface PoiQrPanelProps {
  qrToken?: string | null;
  poiName?: string;
}

/** Minimum edge length (px) of the exported PNG, per the QR spec. */
const EXPORT_SIZE = 1024;

/**
 * Resolve the base URL used to build QR links. A deploy can override the domain
 * with VITE_QR_BASE_URL; otherwise we use the current site origin.
 */
function resolveQrBaseUrl(): string {
  const env = import.meta.env.VITE_QR_BASE_URL as string | undefined;
  if (env && env.trim()) return env.trim();
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
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

export const PoiQrPanel: React.FC<PoiQrPanelProps> = ({ qrToken, poiName }) => {
  const exportRef = useRef<HTMLDivElement | null>(null);

  const token = String(qrToken ?? '').trim();
  const content = buildPlaceQrContent(resolveQrBaseUrl(), token);

  const handleDownload = useCallback(() => {
    if (!content) return;
    const source = exportRef.current?.querySelector('canvas');
    if (!source) return;
    try {
      const pad = 32;
      const textBand = 96;
      const out = document.createElement('canvas');
      out.width = source.width;
      out.height = source.height + textBand;
      const ctx = out.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(source, 0, 0);

      if (poiName) {
        ctx.fillStyle = '#1c1410';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '600 40px "Be Vietnam Pro", sans-serif';
        ctx.fillText(poiName, out.width / 2, source.height + pad + 34);
      }

      const url = out.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${token || slugifyName(poiName || '')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Canvas export can fail in some browsers; nothing actionable here.
    }
  }, [content, token, poiName]);

  return (
    <div className="adm-card adm-form-section">
      <h2 className="adm-card-title">Mã QR của điểm</h2>

      {content ? (
        <div className="adm-qr-body">
          <div className="adm-qr-code">
            <QRCodeCanvas value={content} size={168} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" />
          </div>
          <div className="adm-qr-info">
            <p className="adm-form-hint">Quét mã để mở thuyết minh của điểm.</p>
            <div className="adm-qr-token-line">
              <span className="adm-form-hint">Mã QR:</span>
              <span className="adm-qr-token">{token}</span>
            </div>
            <div className="adm-qr-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={handleDownload}
              >
                Tải mã QR
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="adm-date-text">Chưa có mã QR cho điểm này.</p>
      )}

      <div
        ref={exportRef}
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        {content && (
          <QRCodeCanvas value={content} size={EXPORT_SIZE} level="Q" marginSize={4} bgColor="#ffffff" fgColor="#000000" />
        )}
      </div>
    </div>
  );
};
