import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  ScanLine,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { normalizeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToastOptional } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { enterGuestMode } from '../lib/guestMode';
import { useQrScanner } from '../hooks/useQrScanner';
import { QrScanResponse } from '../types';

type ScanPhase = 'idle' | 'confirm' | 'approving' | 'success' | 'denied' | 'guest-success';

export const QrLoginScanPage: React.FC = () => {
  const { t } = useNavbarLanguage();
  // Cả là khách (guest) lẫn là đã có tài khoản đều quét được:
  // - Khách quét -> máy tính kia chuyển sang chế độ Khách (dùng thử miễn phí).
  // - Tài khoản thật (đã xác thực email) quét -> chuyển phiên đăng nhập thật.
  const { user, status: authStatus } = useAuth();
  const { showToast } = useToastOptional();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? '';

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [token, setToken] = useState('');
  const [scanInfo, setScanInfo] = useState<QrScanResponse | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoHandling, setAutoHandling] = useState(Boolean(tokenFromUrl));
  const [cameraWanted, setCameraWanted] = useState(true);
  const autoHandled = useRef(false);
  const hasRealAccount = authStatus === 'authenticated' && Boolean(user);
  const emailVerified = Boolean(user?.emailVerified);
  const handleToken = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      setError(null);
      setBusy(true);
      try {
        if (authStatus === 'guest') {
          // Khách chưa có tài khoản: đánh dấu phiên để máy tính kia vào chế độ Khách.
          await authApi.guestScanQrLogin(trimmed);
          enterGuestMode();
          setToken(trimmed);
          setScanInfo(null);
          setPhase('guest-success');
        } else if (authStatus === 'loading') {
          // Endpoint yêu cầu biết trạng thái đăng nhập: đợi phiên khởi động xong.
          setError(t.auth.qrLoginRequired);
          setPhase('idle');
        } else {
          const result = await authApi.scanQrLogin(trimmed);
          setToken(trimmed);
          setScanInfo(result);
          setPhase('confirm');
        }
      } catch (err) {
        setError(normalizeApiError(err).message);
        setPhase('idle');
      } finally {
        setBusy(false);
      }
    },
    [authStatus, t.auth.qrLoginRequired]
  );

  // Token từ đường link (camera hệ điều hành mở URL): đợi trạng thái đăng nhập
  // xác định xong rồi mới xử lý để tránh chọn sai nhánh khách/tài khoản.
  const authReady = authStatus !== 'loading';
  useEffect(() => {
    if (!tokenFromUrl || autoHandled.current || !authReady) {
      return;
    }
    autoHandled.current = true;
    void handleToken(tokenFromUrl).finally(() => setAutoHandling(false));
  }, [tokenFromUrl, authReady, handleToken]);

  // Camera trong trang: bật khi đang idle (cả khách lẫn tài khoản thật).
  const cameraEnabled = cameraWanted && !autoHandling && phase === 'idle' && !busy;
  const { videoRef, active, error: cameraError } = useQrScanner({
    onScan: (value) => {
      if (phase === 'idle' && !busy) {
        void handleToken(value);
      }
    },
    enabled: cameraEnabled,
  });

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleToken(manualToken);
  };

  const handleApprove = async () => {
    setError(null);
    setPhase('approving');
    try {
      await authApi.approveQrLogin(token);
      setPhase('success');
    } catch (err) {
      setError(normalizeApiError(err).message);
      setPhase('confirm');
    }
  };

  const handleDeny = async () => {
    setError(null);
    setPhase('approving');
    try {
      await authApi.denyQrLogin(token);
      setPhase('denied');
    } catch (err) {
      setError(normalizeApiError(err).message);
      setPhase('confirm');
    }
  };

  const restartCamera = () => {
    // Tắt rồi bật lại trong 1 tick để hook khởi động lại camera (handoff lỗi cũ).
    setCameraWanted(false);
    window.setTimeout(() => setCameraWanted(true), 50);
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    try {
      await authApi.resendVerification(user.email);
      showToast(t.auth.resent);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  if (phase === 'success' || phase === 'denied' || phase === 'guest-success') {
    const success = phase === 'success';
    const guest = phase === 'guest-success';
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card auth-scan-result">
          {guest ? (
            <Eye size={52} strokeWidth={1.6} className="auth-scan-result-icon is-success" />
          ) : success ? (
            <CheckCircle2 size={52} strokeWidth={1.6} className="auth-scan-result-icon is-success" />
          ) : (
            <XCircle size={52} strokeWidth={1.6} className="auth-scan-result-icon is-denied" />
          )}
          <h1>
            {guest
              ? t.auth.qrGuestSuccessTitle
              : success
                ? t.auth.qrSuccessTitle
                : t.auth.qrDenied}
          </h1>
          <p>
            {guest
              ? t.auth.qrGuestSuccessNote
              : success
                ? t.auth.qrSuccessNote
                : t.auth.qrScanIntro}
          </p>
          <Link to="/" className="tb auth-scan-home">
            {t.auth.qrBackHome}
          </Link>
        </div>
      </div>
    );
  }

  if ((phase === 'confirm' || phase === 'approving') && scanInfo) {
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card">
          <div className="auth-scan-icon">
            <Smartphone size={30} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <h1>{t.auth.qrConfirm}</h1>
          <p className="auth-scan-intro">{t.auth.qrScanIntro}</p>

          <dl className="auth-scan-meta">
            <div>
              <dt>{t.auth.qrDeviceLabel}</dt>
              <dd>{scanInfo.deviceLabel}</dd>
            </div>
            <div>
              <dt>{t.auth.emailLabel}</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>{t.auth.qrEmailVerifiedLabel}</dt>
              <dd className={emailVerified ? 'is-ok' : 'is-warn'}>
                {emailVerified ? t.auth.qrEmailVerifiedOk : t.auth.qrEmailNotVerified}
              </dd>
            </div>
          </dl>

          {error && (
            <p className="af-err" role="alert">
              <AlertCircle size={15} aria-hidden="true" /> {error}
            </p>
          )}

          <div className="auth-scan-actions">
            <button
              type="button"
              className="tb auth-scan-confirm"
              onClick={() => void handleApprove()}
              disabled={phase === 'approving'}
            >
              {phase === 'approving' ? (
                <Loader2 size={17} className="auth-qr-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={17} aria-hidden="true" />
              )}
              <span>{phase === 'approving' ? t.auth.qrApproved : t.auth.qrConfirm}</span>
            </button>
            <button
              type="button"
              className="auth-scan-deny"
              onClick={() => void handleDeny()}
              disabled={phase === 'approving'}
            >
              <XCircle size={17} aria-hidden="true" />
              <span>{t.auth.qrCancel}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình quét: cả khách lẫn tài khoản thật đều dùng chung UI camera.
  return (
    <div className="auth-scan-page">
      <div className="auth-scan-card">
        <div className="auth-scan-icon">
          <ScanLine size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <h1>{t.auth.qrScanTitle}</h1>
        <p className="auth-scan-intro">{t.auth.qrScanIntro}</p>

        <div className={`auth-scan-role${hasRealAccount ? ' is-account' : ''}`}>
          {hasRealAccount ? (
            <>
              <CheckCircle2 size={15} strokeWidth={2} aria-hidden="true" />
              <span>
                {t.auth.qrRealAccountHint} <strong>{user?.email}</strong>
              </span>
            </>
          ) : (
            <>
              <Eye size={15} strokeWidth={2} aria-hidden="true" />
              <span>{t.auth.qrGuestIntro}</span>
            </>
          )}
        </div>

        {hasRealAccount && !emailVerified && (
          <div className="auth-scan-warn" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{t.auth.qrEmailNotVerified}</span>
            <button type="button" onClick={() => void handleResendVerification()}>
              {t.auth.qrResendVerify}
            </button>
          </div>
        )}

        <div className={`auth-scan-video${active ? ' is-active' : ''}`}>
          <video ref={videoRef} muted playsInline aria-label={t.auth.qrScanTitle} />
          <div className="auth-scan-frame" aria-hidden="true" />
          {!active && (
            <div className="auth-scan-video-placeholder">
              {autoHandling || busy ? (
                <Loader2 size={30} className="auth-qr-spin" aria-hidden="true" />
              ) : (
                <ScanLine size={34} strokeWidth={1.5} aria-hidden="true" />
              )}
              <span>
                {autoHandling || busy ? t.auth.qrWaiting : t.auth.qrOpenCamera}
              </span>
            </div>
          )}
        </div>

        {(error || cameraError) && (
          <p className="af-err auth-scan-error" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            {error ?? t.auth.qrCameraError}
          </p>
        )}

        {!active && !autoHandling && !busy && (
          <button type="button" className="tb auth-scan-retry" onClick={restartCamera}>
            <ScanLine size={15} aria-hidden="true" />
            {t.auth.qrScanAgain}
          </button>
        )}

        <form className="auth-scan-manual" onSubmit={handleManualSubmit}>
          <label className="af" htmlFor="qr-manual-token">
            <span>{t.auth.qrManualLabel}</span>
            <input
              id="qr-manual-token"
              type="text"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder={t.auth.qrManualPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="submit" className="tb af-submit" disabled={busy || !manualToken.trim()}>
            {t.auth.qrManualSubmit}
          </button>
        </form>

        {!hasRealAccount && (
          <p className="auth-scan-login-hint">
            {t.auth.qrLoginRequired}{' '}
            <Link to="/dang-nhap">{t.auth.login}</Link>
          </p>
        )}

        <p className="auth-scan-back">
          <Link to="/">
            <ArrowLeft size={15} aria-hidden="true" />
            {t.auth.qrBackHome}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default QrLoginScanPage;
