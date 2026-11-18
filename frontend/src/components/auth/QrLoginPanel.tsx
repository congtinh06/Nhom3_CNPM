import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { authApi } from '../../api/auth';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';
import { useNavbarLanguage } from '../../content/languages';
import { QrLoginSession, QrLoginStatus } from '../../types';
import { resolveQrBaseUrl } from '../common/PlaceQR';
import { AccountLoginQr } from './AccountLoginQr';

interface QrLoginPanelProps {
  onSuccess: () => void;
  compact?: boolean;
}

const LIVE_STATUSES: QrLoginStatus[] = ['PENDING', 'SCANNED'];
const QR_SESSION_STORAGE_KEY = 'echora_qr_login_session_v1';
const QR_SESSION_MIN_REMAINING_MS = 1500;

interface StoredQrSession {
  session: QrLoginSession;
  expiresAt: number;
}

const isLiveStatus = (status: QrLoginStatus | null | undefined): boolean =>
  status !== null && status !== undefined && LIVE_STATUSES.includes(status);

const clearStoredQrSession = () => {
  try {
    window.sessionStorage.removeItem(QR_SESSION_STORAGE_KEY);
  } catch {
    // Trinh duyet co the chan sessionStorage; khong anh huong luong QR.
  }
};

const saveStoredQrSession = (session: QrLoginSession, expiresAt: number) => {
  try {
    window.sessionStorage.setItem(
      QR_SESSION_STORAGE_KEY,
      JSON.stringify({ session, expiresAt } satisfies StoredQrSession)
    );
  } catch {
    // Bo qua khi khong the luu tam phien QR.
  }
};

const readStoredQrSession = (): StoredQrSession | null => {
  try {
    const raw = window.sessionStorage.getItem(QR_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredQrSession> | null;
    const stored = parsed?.session;
    if (
      !stored ||
      typeof stored.sessionId !== 'string' ||
      typeof stored.qrToken !== 'string' ||
      typeof stored.exchangeToken !== 'string' ||
      typeof parsed?.expiresAt !== 'number' ||
      !isLiveStatus(stored.status) ||
      parsed.expiresAt <= Date.now() + QR_SESSION_MIN_REMAINING_MS
    ) {
      clearStoredQrSession();
      return null;
    }
    return { session: stored, expiresAt: parsed.expiresAt };
  } catch {
    clearStoredQrSession();
    return null;
  }
};

let pendingQrSessionRequest: Promise<QrLoginSession> | null = null;

const requestQrSession = (): Promise<QrLoginSession> => {
  if (!pendingQrSessionRequest) {
    pendingQrSessionRequest = authApi.createQrSession().finally(() => {
      pendingQrSessionRequest = null;
    });
  }
  return pendingQrSessionRequest;
};

export const QrLoginPanel: React.FC<QrLoginPanelProps> = ({ onSuccess, compact = false }) => {
  const { t } = useNavbarLanguage();
  const { completeQrLogin, status: authStatus } = useAuth();
  const alreadyAuthenticated = authStatus === 'authenticated';

  const [initialSession] = useState<StoredQrSession | null>(readStoredQrSession);
  const [session, setSession] = useState<QrLoginSession | null>(initialSession?.session ?? null);
  const [status, setStatus] = useState<QrLoginStatus | null>(initialSession?.session.status ?? null);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    initialSession ? Math.max(0, Math.ceil((initialSession.expiresAt - Date.now()) / 1000)) : 0
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionRef = useRef<QrLoginSession | null>(initialSession?.session ?? null);
  const statusRef = useRef<QrLoginStatus | null>(initialSession?.session.status ?? null);
  const deadlineRef = useRef(initialSession?.expiresAt ?? 0);
  const exchangeStarted = useRef(false);
  const createRun = useRef(0);

  const createSession = useCallback(async () => {
    if (typeof authApi.createQrSession !== 'function') {
      setError(t.auth.qrError);
      return;
    }
    const run = ++createRun.current;
    setLoading(true);
    setError(null);
    setSession(null);
    setStatus(null);
    sessionRef.current = null;
    statusRef.current = null;
    deadlineRef.current = 0;
    exchangeStarted.current = false;
    clearStoredQrSession();
    try {
      const created = await requestQrSession();
      if (run !== createRun.current) return;
      const expiresAt = Date.now() + Math.max(0, created.expiresInSeconds) * 1000;
      sessionRef.current = created;
      statusRef.current = created.status;
      deadlineRef.current = expiresAt;
      setSession(created);
      setStatus(created.status);
      setSecondsLeft(Math.max(0, created.expiresInSeconds));
      if (isLiveStatus(created.status)) {
        saveStoredQrSession(created, expiresAt);
      }
    } catch (err) {
      if (run !== createRun.current) return;
      setError(normalizeApiError(err).message || t.auth.qrError);
    } finally {
      if (run === createRun.current) {
        setLoading(false);
      }
    }
  }, [t.auth.qrError]);

  useEffect(() => {
    // Thiết bị đã có tài khoản thật thì không tạo QR đăng nhập nữa: nếu vẫn tạo,
    // một điện thoại khách quét mã sẽ kéo thiết bị này về chế độ Khách (sai).
    if (alreadyAuthenticated) {
      clearStoredQrSession();
      sessionRef.current = null;
      statusRef.current = null;
      deadlineRef.current = 0;
      setSession(null);
      setStatus(null);
      setSecondsLeft(0);
      return;
    }
    if (
      sessionRef.current &&
      isLiveStatus(statusRef.current) &&
      deadlineRef.current > Date.now() + QR_SESSION_MIN_REMAINING_MS
    ) {
      return;
    }
    if (authStatus === 'loading') {
      return;
    }
    void createSession();
  }, [alreadyAuthenticated, authStatus, createSession]);

  useEffect(() => {
    // Thiết bị đã đăng nhập thật thì không poll phiên QR đăng nhập nào nữa.
    if (alreadyAuthenticated || !session || !status || !LIVE_STATUSES.includes(status)) {
      return;
    }

    let cancelled = false;
    const intervalMs = Math.max(1000, session.pollIntervalMs || 1500);
    const timer = window.setInterval(async () => {
      try {
        const result = await authApi.qrSessionStatus(session.sessionId, session.exchangeToken);
        if (cancelled || alreadyAuthenticated) return;

        statusRef.current = result.status;
        setStatus(result.status);
        if (isLiveStatus(result.status)) {
          const expiresAt = Date.now() + Math.max(0, result.expiresInSeconds) * 1000;
          deadlineRef.current = expiresAt;
          setSecondsLeft(Math.max(0, result.expiresInSeconds));
          saveStoredQrSession({ ...session, status: result.status }, expiresAt);
        } else {
          clearStoredQrSession();
          setSecondsLeft(0);
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
  }, [
    alreadyAuthenticated,
    session,
    status,
    completeQrLogin,
    onSuccess,
    t.auth.qrError,
  ]);

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

  const baseUrl = resolveQrBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
  const qrUrl = session
    ? `${baseUrl}/quet-qr-dang-nhap?t=${encodeURIComponent(session.qrToken)}`
    : '';
  const showCode = Boolean(session) && status !== null && LIVE_STATUSES.includes(status);
  const isScanned = status === 'SCANNED';
  const isApproved = status === 'APPROVED';
  const isExpired = status === 'EXPIRED';
  const isDenied = status === 'DENIED';
  const isCancelled = status === 'CANCELLED';
  const isGuestApproved = status === 'GUEST_APPROVED';
  if (alreadyAuthenticated) {
    // Thiết bị đã đăng nhập: thay mã QR đăng nhập bằng mã QR tài khoản để
    // điện thoại quét và đăng nhập cùng tài khoản này.
    return <AccountLoginQr compact={compact} />;
  }

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
            {secondsLeft > 0 ? (
              <p className="auth-qr-countdown" aria-live="polite">
                {secondsLeft}s
              </p>
            ) : (
              <button
                type="button"
                className="auth-qr-refresh"
                onClick={() => void createSession()}
                disabled={loading}
              >
                <RefreshCw size={15} aria-hidden="true" />
                <span>{t.auth.qrRefresh}</span>
              </button>
            )}
          </>
        )}

        {isApproved && !error && (
          <div className="auth-qr-state" role="status">
            <Loader2 size={30} className="auth-qr-spin" aria-hidden="true" />
            <p>{t.auth.qrApproved}</p>
          </div>
        )}

        {isGuestApproved && !error && (
          <div className="auth-qr-state" role="alert">
            <AlertCircle size={30} strokeWidth={1.8} aria-hidden="true" />
            <p>{t.auth.qrLoginRequired}</p>
            <button type="button" className="auth-qr-refresh" onClick={() => void createSession()}>
              <RefreshCw size={15} aria-hidden="true" />
              <span>{t.auth.qrRefresh}</span>
            </button>
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

        {(loading || authStatus === 'loading') && !session && (
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
