import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, LogOut, Smartphone } from 'lucide-react';
import { normalizeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useNavbarLanguage } from '../content/languages';

type HandoffPhase = 'checking' | 'confirm' | 'claiming' | 'success' | 'error' | 'already';

const HANDOFF_PATH = '/nhan-dang-nhap';

/**
 * Trang trên thiết bị nhận đăng nhập (thường là điện thoại).
 *
 * Thiết bị đã đăng nhập hiển thị mã QR tài khoản; điện thoại quét mã mở trang
 * này và đổi token dùng một lần lấy phiên đăng nhập của cùng tài khoản.
 * Mã nằm trong URL nên được xoá khỏi thanh địa chỉ ngay sau khi đọc.
 */
export const QrHandoffReceivePage: React.FC = () => {
  const { t } = useNavbarLanguage();
  const { status: authStatus, completeQrLogin, logout } = useAuth();
  const [searchParams] = useSearchParams();

  const [sessionId] = useState(() => searchParams.get('s') ?? '');
  const [exchangeToken] = useState(() => searchParams.get('e') ?? '');
  const [phase, setPhase] = useState<HandoffPhase>('checking');
  const [error, setError] = useState<string | null>(null);

  const strippedRef = useRef(false);
  const finishedRef = useRef(false);

  // Không giữ token trong thanh địa chỉ / lịch sử trình duyệt.
  useEffect(() => {
    if (strippedRef.current) return;
    strippedRef.current = true;
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(window.history.state, '', HANDOFF_PATH);
    }
  }, []);

  useEffect(() => {
    if (finishedRef.current || authStatus === 'loading') return;
    if (authStatus === 'authenticated') {
      setPhase('already');
      return;
    }
    if (!sessionId || !exchangeToken) {
      setError(t.auth.qrExpired);
      setPhase('error');
      return;
    }
    setPhase('confirm');
  }, [authStatus, sessionId, exchangeToken, t.auth.qrExpired]);

  const handleClaim = useCallback(async () => {
    setError(null);
    setPhase('claiming');
    try {
      if (typeof completeQrLogin !== 'function') {
        throw new Error(t.auth.qrError);
      }
      await completeQrLogin(sessionId, exchangeToken);
      finishedRef.current = true;
      setPhase('success');
    } catch (err) {
      setError(normalizeApiError(err, true).message || t.auth.qrError);
      setPhase('error');
    }
  }, [completeQrLogin, sessionId, exchangeToken, t.auth.qrError]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // Vẫn tiếp tục sau khi đăng xuất phía client.
    }
    setPhase('confirm');
  }, [logout]);

  if (phase === 'success') {
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card auth-scan-result">
          <CheckCircle2 size={52} strokeWidth={1.6} className="auth-scan-result-icon is-success" />
          <h1>{t.auth.qrHandoffDone}</h1>
          <p>{t.auth.qrHandoffReceiveNote}</p>
          <Link to="/" className="tb auth-scan-home">
            {t.auth.qrBackHome}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card auth-scan-result">
          <AlertCircle size={52} strokeWidth={1.6} className="auth-scan-result-icon is-denied" />
          <h1>{t.auth.qrHandoffReceiveTitle}</h1>
          <p>{error ?? t.auth.qrExpired}</p>
          <Link to="/" className="tb auth-scan-home">
            {t.auth.qrBackHome}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'already') {
    return (
      <div className="auth-scan-page">
        <div className="auth-scan-card">
          <div className="auth-scan-icon">
            <Smartphone size={30} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <h1>{t.auth.qrHandoffReceiveTitle}</h1>
          <p className="auth-scan-intro">{t.auth.qrHandoffReceiveAlready}</p>
          <div className="auth-scan-actions">
            <button type="button" className="tb auth-scan-deny" onClick={() => void handleLogout()}>
              <LogOut size={17} aria-hidden="true" />
              <span>{t.auth.logout}</span>
            </button>
            <Link to="/" className="tb auth-scan-confirm">
              {t.auth.qrBackHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-scan-page">
      <div className="auth-scan-card">
        <div className="auth-scan-icon">
          <Smartphone size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <h1>{t.auth.qrHandoffReceiveTitle}</h1>
        <p className="auth-scan-intro">{t.auth.qrHandoffReceiveNote}</p>

        {error && (
          <p className="af-err" role="alert">
            <AlertCircle size={15} aria-hidden="true" /> {error}
          </p>
        )}

        <div className="auth-scan-actions">
          <button
            type="button"
            className="tb auth-scan-confirm"
            onClick={() => void handleClaim()}
            disabled={phase !== 'confirm'}
          >
            {phase === 'claiming' ? (
              <Loader2 size={17} className="auth-qr-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 size={17} aria-hidden="true" />
            )}
            <span>{phase === 'claiming' ? t.auth.qrApproved : t.auth.qrConfirm}</span>
          </button>
          <Link to="/" className="tb auth-scan-deny">
            {t.auth.qrCancel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QrHandoffReceivePage;
