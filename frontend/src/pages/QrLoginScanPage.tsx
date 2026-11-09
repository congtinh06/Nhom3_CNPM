import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ScanLine,
  XCircle,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { normalizeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useToastOptional } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { useQrScanner } from '../hooks/useQrScanner';
import { QrScanResponse } from '../types';

type ScanPhase = 'idle' | 'confirm' | 'approving' | 'success' | 'denied';

const QR_LOGIN_SCAN_PATH = '/quet-qr-dang-nhap';
const QR_HANDOFF_PATH = '/nhan-dang-nhap';

/**
 * Mã QR "đăng nhập nhanh trên điện thoại" trỏ tới /nhan-dang-nhap. Khi người
 * dùng quét bằng camera trong trang, chuyển sang trang nhận đăng nhập thay vì
 * coi token đó là mã xác nhận cho máy tính.
 */
const extractHandoffLocation = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed, window.location.origin);
    const path = url.pathname.replace(/\/+$/, '');
    if (path.endsWith(QR_HANDOFF_PATH)) {
      return `${QR_HANDOFF_PATH}${url.search}`;
    }
  } catch {
    // Không phải URL.
  }
  return null;
};

// Camera scanners return the full URL encoded in the QR code. The API expects
// only the opaque `t` token, so extract it before calling the backend.
const extractQrToken = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed, window.location.origin);
    const token = url.searchParams.get('t');
    const path = url.pathname.replace(/\/+$/, '');
    if (token && path.endsWith(QR_LOGIN_SCAN_PATH)) {
      return token.trim();
    }
  } catch {
    // Khong phai URL: coi nhu nguoi dung dan token thuan.
  }
  return trimmed;
};

export const QrLoginScanPage: React.FC = () => {
  const { t } = useNavbarLanguage();
  // Trang nay la thiet bi B (thiet bi quet):
  // - Khach quet -> thiet bi A (dang hien QR) chuyen sang che do Khach.
  // - Tai khoan that quet -> thiet bi A dang nhap bang tai khoan nay.
  const { user, status: authStatus } = useAuth();
  const { showToast } = useToastOptional();
  const navigate = useNavigate();
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

  // Xu ly token (khi dien thoai quet link ?t=... hoac nguoi dung nhap thu cong)
  const handleToken = useCallback(
    async (value: string) => {
      const handoffLocation = extractHandoffLocation(value);
      if (handoffLocation) {
        navigate(handoffLocation, { replace: true });
        return;
      }
      const trimmed = extractQrToken(value);
      if (!trimmed) {
        return;
      }
      setError(null);
      if (authStatus === 'loading') {
        setError(t.auth.qrLoginRequired);
        setPhase('idle');
        return;
      }
      if (authStatus !== 'authenticated' || !user) {
        // Mã QR "đăng nhập nhanh" kiểu Zalo chỉ áp dụng cho tài khoản đã đăng ký
        // và đã xác thực email. Thiết bị chưa đăng nhập hoặc đang ở chế độ Khách
        // phải đăng nhập trước khi quét mã.
        setError(t.auth.qrLoginRequired);
        return;
      }
      setBusy(true);
      try {
        const result = await authApi.scanQrLogin(trimmed);
        setToken(trimmed);
        setScanInfo(result);
        setPhase('confirm');
      } catch (err) {
        setError(normalizeApiError(err, true).message);
        setPhase('idle');
      } finally {
        setBusy(false);
      }
    },
    [authStatus, navigate, t.auth.qrLoginRequired, user]
  );

  // Token tu duong link (khi quet QR bang Camera dien thoai mo URL):
  // Doi trang thai dang nhap xac dinh xong roi moi xu ly de chon dung nhanh.
  const authReady = authStatus !== 'loading';
  useEffect(() => {
    if (!tokenFromUrl || autoHandled.current || !authReady) {
      return;
    }
    autoHandled.current = true;
    void handleToken(tokenFromUrl).finally(() => setAutoHandling(false));
  }, [tokenFromUrl, authReady, handleToken]);

  // Camera trong trang: chỉ bật khi thiết bị đã đăng nhập tài khoản thật.
  const cameraEnabled = cameraWanted && !autoHandling && phase === 'idle' && !busy && hasRealAccount;
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
    // Tat roi bat lai trong 1 tick de hook khoi dong lai camera (handoff loi cu).
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

  // Man hinh ket qua (Thanh cong / Tu choi)
  if (phase === 'success' || phase === 'denied') {
    const success = phase === 'success';
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card auth-scan-result">
          {success ? (
            <CheckCircle2 size={52} strokeWidth={1.6} className="auth-scan-result-icon is-success" />
          ) : (
            <XCircle size={52} strokeWidth={1.6} className="auth-scan-result-icon is-denied" />
          )}
          <h1>{success ? t.auth.qrSuccessTitle : t.auth.qrDenied}</h1>
          <p>{success ? t.auth.qrSuccessNote : t.auth.qrScanIntro}</p>
          <Link to="/" className="tb auth-scan-home">
            {t.auth.qrBackHome}
          </Link>
        </div>
      </div>
    );
  }

  // Man hinh xac nhan tren dien thoai (sau khi quet QR).
  // Khong hien email/tai khoan that de tranh lo thong tin ca nhan.
  if ((phase === 'confirm' || phase === 'approving') && scanInfo) {
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card">
          <h1>{t.auth.qrConfirm}</h1>
          <p className="auth-scan-intro">{t.auth.qrScanIntro}</p>

          {/* Chỉ hiển thị thiết bị đang yêu cầu đăng nhập.
              Không hiển thị email/tên tài khoản thật để tránh lộ thông tin. */}
          <dl className="auth-scan-meta">
            <div>
              <dt>{t.auth.qrDeviceLabel}</dt>
              <dd>{scanInfo.deviceLabel}</dd>
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
              disabled={phase === 'approving' || !emailVerified}
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

  // Man hinh quet: ca khach lan tai khoan that deu dung chung UI camera.
  return (
    <div className="auth-scan-page" data-auth-status={authStatus}>
      <div className="auth-scan-card">
        <div className="auth-scan-icon">
          <ScanLine size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <h1>{t.auth.qrScanTitle}</h1>
        <p className="auth-scan-intro">{t.auth.qrScanIntro}</p>

        {authReady && !hasRealAccount && (
          <div className="auth-scan-role">
            <AlertCircle size={15} strokeWidth={2} aria-hidden="true" />
            <span>{t.auth.qrLoginRequired}</span>
            <Link to="/dang-nhap" className="tb auth-scan-home">
              {t.auth.login}
            </Link>
          </div>
        )}

        {hasRealAccount && (
          <>
            {!emailVerified && (
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
          </>
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
