import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ScanLine,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { normalizeApiError } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { useNavbarLanguage } from '../content/languages';
import { useQrScanner } from '../hooks/useQrScanner';
import { QrScanResponse } from '../types';

type ScanPhase = 'idle' | 'confirm' | 'approving' | 'success' | 'denied';

export const QrLoginScanPage: React.FC = () => {
  const { t } = useNavbarLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('t') ?? '';

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [token, setToken] = useState('');
  const [scanInfo, setScanInfo] = useState<QrScanResponse | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoHandling, setAutoHandling] = useState(Boolean(tokenFromUrl));
  const autoHandled = useRef(false);

  const handleToken = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await authApi.scanQrLogin(trimmed);
      setToken(trimmed);
      setScanInfo(result);
      setPhase('confirm');
    } catch (err) {
      setError(normalizeApiError(err).message);
      setPhase('idle');
    } finally {
      setBusy(false);
    }
  }, []);

  const cameraEnabled = !autoHandling && phase === 'idle';
  const { videoRef, active, error: cameraError } = useQrScanner({
    onScan: (value) => {
      if (phase === 'idle') {
        void handleToken(value);
      }
    },
    enabled: cameraEnabled,
  });

  useEffect(() => {
    if (!tokenFromUrl || autoHandled.current) {
      return;
    }
    autoHandled.current = true;
    void handleToken(tokenFromUrl).finally(() => setAutoHandling(false));
  }, [tokenFromUrl, handleToken]);

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

  return (
    <div className="auth-scan-page">
      <div className="auth-scan-card">
        <div className="auth-scan-icon">
          <ScanLine size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>
        <h1>{t.auth.qrScanTitle}</h1>
        <p className="auth-scan-intro">{t.auth.qrScanIntro}</p>

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
              <span>{autoHandling || busy ? t.auth.qrWaiting : t.auth.qrOpenCamera}</span>
            </div>
          )}
        </div>

        {(error || cameraError) && (
          <p className="af-err auth-scan-error" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            {error ?? t.auth.qrCameraError}
          </p>
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
