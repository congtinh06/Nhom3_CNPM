import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { authApi } from '../../api/auth';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useNavbarLanguage } from '../../content/languages';
import { QrLoginSession, QrLoginStatus } from '../../types';

interface QrLoginPanelProps {
  onSuccess: () => void;
  /** Được gọi khi thiết bị di động quét mã ở chế độ Khách (không đăng nhập thật). */
  onGuestSuccess?: () => void;
  compact?: boolean;
}

const LIVE_STATUSES: QrLoginStatus[] = ['PENDING', 'SCANNED'];

export const QrLoginPanel: React.FC<QrLoginPanelProps> = ({ onSuccess, onGuestSuccess, compact = false }) => {
  const { t } = useNavbarLanguage();
  const { completeQrLogin } = useAuth();

  const [session, setSession] = useState<QrLoginSession | null>(null);
  const [status, setStatus] = useState<QrLoginStatus | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionRef = useRef<QrLoginSession | null>(null);
  const statusRef = useRef<QrLoginStatus | null>(null);
  const deadlineRef = useRef(0);
  const exchangeStarted = useRef(false);
  const guestHandled = useRef(false);

  const createSession = useCallback(async () => {
    if (typeof authApi.createQrSession !== 'function') {
      setError(t.auth.qrError);
      return;
    }
    setLoading(true);
    setError(null);
    setSession(null);
    setStatus(null);
    sessionRef.current = null;
    statusRef.current = null;
    deadlineRef.current = 0;
    exchangeStarted.current = false;
    guestHandled.current = false;
    try {
      const created = await authApi.createQrSession();
      sessionRef.current = created;
      statusRef.current = created.status;
      setSession(created);
      setStatus(created.status);
      deadlineRef.current = Date.now() + Math.max(0, created.expiresInSeconds) * 1000;
      setSecondsLeft(Math.max(0, created.expiresInSeconds));
    } catch (err) {
      setError(normalizeApiError(err).message || t.auth.qrError);
    } finally {
      setLoading(false);
    }
  }, [t.auth.qrError]);

  useEffect(() => {
    void createSession();
    return () => {
      const current = sessionRef.current;
      const currentStatus = statusRef.current;
      if (
        current &&
        currentStatus &&
        LIVE_STATUSES.includes(currentStatus) &&
        !exchangeStarted.current &&
        typeof authApi.cancelQrSession === 'function'
      ) {
        void authApi.cancelQrSession(current.sessionId, current.exchangeToken).catch(() => {});
      }
    };
  }, [createSession]);

  useEffect(() => {
    if (!session || !status || !LIVE_STATUSES.includes(status)) {
      return;
    }

    let cancelled = false;
    const intervalMs = Math.max(1000, session.pollIntervalMs || 1500);
    const timer = window.setInterval(async () => {
      try {
        const result = await authApi.qrSessionStatus(session.sessionId, session.exchangeToken);
        if (cancelled) return;

        statusRef.current = result.status;
        setStatus(result.status);
        if (!LIVE_STATUSES.includes(result.status) && result.status !== 'GUEST_APPROVED') {
          setSecondsLeft(0);
        }

        if (result.status === 'GUEST_APPROVED' && !guestHandled.current) {
          // Thiet bi di dong chua co tai khoan: may tinh chuyen sang che do Khach,
          // KHONG doi lay token, KHONG danh dau la "dang nhap thanh cong".
          guestHandled.current = true;
          window.clearInterval(timer);
          window.setTimeout(() => {
            if (onGuestSuccess) {
              onGuestSuccess();
            }
          }, 400);
          return;
        }

        if (result.status === 'APPROVED' && !exchangeStarted.current) {
          exchangeStarted.current = true;
          window.clearInterval(timer);
          try {
            if (typeof completeQrLogin !== 'function') {
              throw new Error(t.auth.qrError);
            }
            await completeQrLogin(session.sessionId, session.exchangeToken);
            if (!cancelled) {
              onSuccess();
            }
          } catch (err) {
            if (!cancelled) {
              setError(normalizeApiError(err).message);
            }
          }
        }
      } catch {
        // Loi mang tam thoi: tiep tuc poll cho den khi het han.
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session, status, completeQrLogin, onSuccess, onGuestSuccess, t.auth.qrError]);

  useEffect(() => {
    if (!session || !status || !LIVE_STATUSES.includes(status)) {
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [session, status]);

  const qrUrl = session
    ? `${window.location.origin}/quet-qr-dang-nhap?t=${encodeURIComponent(session.qrToken)}`
    : '';

  const showCode = Boolean(session) && status !== null && LIVE_STATUSES.includes(status);
  const isScanned = status === 'SCANNED';
  const isApproved = status === 'APPROVED';
  const isExpired = status === 'EXPIRED';
  const isDenied = status === 'DENIED';
  const isCancelled = status === 'CANCELLED';
  const isGuestApproved = status === 'GUEST_APPROVED';

  return (
    <aside
      className={`auth-qr-panel${compact ? ' auth-qr-panel--compact' : ''}`}
      aria-label={compact ? t.auth.qrTitle : undefined}
      aria-labelledby={compact ? undefined : 'auth-qr-title'}
    >
      {!compact && (
        <div className="auth-qr-heading">
          <span className="auth-qr-badge" aria-hidden="true">
            QR
          </span>
          <div>
            <h2 id="auth-qr-title" className="auth-modal-title auth-qr-title">
              {t.auth.qrTitle}
            </h2>
            <p className="auth-modal-intro auth-qr-subtitle">{t.auth.qrSubtitle}</p>
          </div>
        </div>
      )}

      <div className="auth-qr-stage">
        {showCode && (
          <>
            <div className={`auth-qr-code${isScanned ? ' is-scanned' : ''}`}>
              <QRCodeSVG
                value={qrUrl}
                size={186}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#3b2416"
                title={t.auth.qrTitle}
              />
              {isScanned && (
                <div className="auth-qr-overlay">
                  <CheckCircle2 size={34} strokeWidth={1.8} aria-hidden="true" />
                  <span>{t.auth.qrScanned}</span>
                </div>
              )}
            </div>
            <p className="auth-qr-status">
              {isScanned ? t.auth.qrScanned : t.auth.qrWaiting}
            </p>
            <p className="auth-qr-countdown" aria-live="polite">
              {secondsLeft}s
            </p>
          </>
        )}

        {isApproved && !error && (
          <div className="auth-qr-state" role="status">
            <Loader2 size={30} className="auth-qr-spin" aria-hidden="true" />
            <p>{t.auth.qrApproved}</p>
          </div>
        )}

        {isGuestApproved && !error && (
          <div className="auth-qr-state" role="status">
            <Eye size={30} strokeWidth={1.7} aria-hidden="true" />
            <p>{t.auth.qrGuestPanelWaiting}</p>
          </div>
        )}

        {(isExpired ||
          isDenied ||
          isCancelled ||
          (Boolean(error) && (isApproved || (!loading && !session)))) && (
          <div className="auth-qr-state" role="alert">
            <AlertCircle size={30} strokeWidth={1.8} aria-hidden="true" />
            <p>
              {error
                ? error
                : isExpired
                  ? t.auth.qrExpired
                  : isDenied
                    ? t.auth.qrDenied
                    : t.auth.qrExpired}
            </p>
            <button type="button" className="auth-qr-refresh" onClick={() => void createSession()}>
              <RefreshCw size={15} aria-hidden="true" />
              <span>{t.auth.qrRefresh}</span>
            </button>
          </div>
        )}

        {loading && !session && (
          <div className="auth-qr-state" role="status">
            <Loader2 size={30} className="auth-qr-spin" aria-hidden="true" />
            <p>{t.auth.qrWaiting}</p>
          </div>
        )}
      </div>

      <p className="auth-qr-note">
        <ShieldCheck size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>{t.auth.qrSecureNote}</span>
      </p>
    </aside>
  );
};

export default QrLoginPanel;
