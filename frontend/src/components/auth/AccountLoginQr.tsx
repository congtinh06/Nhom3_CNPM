import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { authApi } from '../../api/auth';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useNavbarLanguage } from '../../content/languages';
import { QrLoginSession, QrLoginStatus } from '../../types';
import { resolveQrBaseUrl } from '../common/PlaceQR';

export const QR_HANDOFF_PATH = '/nhan-dang-nhap';

/**
 * URL nhúng trong mã QR "đăng nhập nhanh trên điện thoại".
 *
 * Mã chỉ chứa token dùng một lần của phiên QR đã được thiết bị này xác nhận.
 * Thiết bị quét mã đổi token lấy phiên đăng nhập của chính tài khoản đang mở.
 */
export function buildHandoffUrl(session: QrLoginSession, baseUrl?: string): string {
  const base = (baseUrl ?? resolveQrBaseUrl()).replace(/\/+$/, '');
  return (
    `${base}${QR_HANDOFF_PATH}` +
    `?t=${encodeURIComponent(session.qrToken)}` +
    `&s=${encodeURIComponent(session.sessionId)}` +
    `&e=${encodeURIComponent(session.exchangeToken)}`
  );
}

const POLL_INTERVAL_MS = 2000;

interface AccountLoginQrProps {
  compact?: boolean;
}

/**
 * Mã QR dành cho thiết bị đã đăng nhập: quét bằng điện thoại để đăng nhập
 * cùng tài khoản trên thiết bị đó.
 */
export const AccountLoginQr: React.FC<AccountLoginQrProps> = ({ compact = false }) => {
  const { t } = useNavbarLanguage();
  const { status: authStatus } = useAuth();

  const [session, setSession] = useState<QrLoginSession | null>(null);
  const [status, setStatus] = useState<QrLoginStatus | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const runRef = useRef(0);
  const deadlineRef = useRef(0);

  const create = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    const run = ++runRef.current;
    setLoading(true);
    setError(null);
    setSession(null);
    setStatus(null);
    setSecondsLeft(0);
    deadlineRef.current = 0;
    try {
      const created = await authApi.createQrSession();
      // Phiên do thiết bị này tạo và tự xác nhận cho chính tài khoản đang đăng nhập.
      await authApi.scanQrLogin(created.qrToken);
      await authApi.approveQrLogin(created.qrToken);
      if (!mountedRef.current || run !== runRef.current) return;
      const expiresAt = Date.now() + Math.max(0, created.expiresInSeconds) * 1000;
      deadlineRef.current = expiresAt;
      setSession(created);
      setStatus('APPROVED');
      setSecondsLeft(Math.max(0, created.expiresInSeconds));
    } catch (err) {
      if (!mountedRef.current || run !== runRef.current) return;
      setError(normalizeApiError(err).message || t.auth.qrError);
    } finally {
      if (mountedRef.current && run === runRef.current) {
        setLoading(false);
      }
    }
  }, [authStatus, t.auth.qrError]);

  useEffect(() => {
    mountedRef.current = true;
    if (authStatus === 'authenticated' && !startedRef.current) {
      startedRef.current = true;
      void create();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [authStatus, create]);

  // Theo dõi khi điện thoại đổi mã thành công (CONSUMED) hoặc mã hết hạn.
  useEffect(() => {
    if (!session || !status) return;
    if (status === 'CONSUMED' || status === 'EXPIRED') return;

    const timer = window.setInterval(async () => {
      try {
        const result = await authApi.qrSessionStatus(session.sessionId, session.exchangeToken);
        if (!mountedRef.current) return;
        setStatus(result.status);
        if (result.status === 'CONSUMED' || result.status === 'EXPIRED') {
          window.clearInterval(timer);
          setSecondsLeft(0);
        }
      } catch {
        // Lỗi mạng tạm thời: tiếp tục theo dõi.
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [session, status]);

  // Đếm ngược thời gian hiệu lực của mã.
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setStatus((current) => (current === 'CONSUMED' ? current : 'EXPIRED'));
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const qrUrl = session ? buildHandoffUrl(session) : '';
  const isConsumed = status === 'CONSUMED';
  const isExpired = status === 'EXPIRED';
  const showCode = Boolean(session) && !isConsumed && !isExpired && !error;

  return (
    <aside
      className={`auth-qr-panel auth-qr-handoff${compact ? ' auth-qr-panel--compact' : ''}`}
      aria-label={t.auth.qrHandoffTitle}
    >
      {!compact && (
        <div className="auth-qr-heading">
          <span className="auth-qr-badge" aria-hidden="true">
            QR
          </span>
          <div>
            <h2 className="auth-modal-title auth-qr-title">{t.auth.qrHandoffTitle}</h2>
          </div>
        </div>
      )}

      <div className="auth-qr-stage">
        {showCode && (
          <>
            <div className="auth-qr-code">
              <QRCodeSVG
                value={qrUrl}
                size={186}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#3b2416"
                title={t.auth.qrHandoffTitle}
              />
            </div>
            <p className="auth-qr-status">
              <Smartphone size={15} strokeWidth={1.9} aria-hidden="true" />
              <span>{t.auth.qrHandoffNote}</span>
            </p>
            <p className="auth-qr-countdown" aria-live="polite">
              {secondsLeft}s
            </p>
          </>
        )}

        {isConsumed && (
          <div className="auth-qr-state" role="status">
            <CheckCircle2 size={30} strokeWidth={1.8} aria-hidden="true" />
            <p>{t.auth.qrHandoffDone}</p>
            <button type="button" className="auth-qr-refresh" onClick={() => void create()}>
              <RefreshCw size={15} aria-hidden="true" />
              <span>{t.auth.qrRefresh}</span>
            </button>
          </div>
        )}

        {(isExpired || Boolean(error)) && !isConsumed && (
          <div className="auth-qr-state" role="alert">
            <AlertCircle size={30} strokeWidth={1.8} aria-hidden="true" />
            <p>{error ?? t.auth.qrExpired}</p>
            <button type="button" className="auth-qr-refresh" onClick={() => void create()}>
              <RefreshCw size={15} aria-hidden="true" />
              <span>{t.auth.qrRefresh}</span>
            </button>
          </div>
        )}

        {loading && !session && (
          <div className="auth-qr-state" role="status">
            <Smartphone size={30} strokeWidth={1.7} aria-hidden="true" />
            <p>{t.auth.qrWaiting}</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AccountLoginQr;
