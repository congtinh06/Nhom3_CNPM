import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { normalizeApiError } from '../api/errors';
import { useToast } from '../context/ToastContext';

type Phase = 'idle' | 'working' | 'success' | 'error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const tokenFromUrl = searchParams.get('token') ?? '';

  const [token, setToken] = useState(tokenFromUrl);
  const [phase, setPhase] = useState<Phase>(tokenFromUrl ? 'working' : 'idle');
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const autoRan = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const verify = async (rawToken: string) => {
    setPhase('working');
    setMessage(null);
    try {
      const response = await authApi.verifyEmail(rawToken.trim());
      setPhase('success');
      setMessage(response.message);
    } catch (err) {
      const norm = normalizeApiError(err);
      setPhase('error');
      setMessage(norm.message);
    }
  };

  useEffect(() => {
    if (tokenFromUrl && !autoRan.current) {
      autoRan.current = true;
      void verify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await verify(token);
  };

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendState('busy');
    try {
      await authApi.resendVerification(email.trim());
      setResendState('sent');
      showToast('Đã gửi lại email xác thực');
    } catch (err) {
      setResendState('idle');
      showToast(normalizeApiError(err).message);
    }
  };

  return (
    <div className="auth-standalone-page">
      <div className="auth-standalone-card">
        <h2 className="auth-modal-title">Xác thực email</h2>

        {phase === 'success' && message && (
          <>
            <p className="auth-note" role="status">
              {message}
            </p>
            <div className="auth-modal-actions">
              <button type="button" className="tb af-submit" onClick={() => navigate('/dang-nhap')}>
                Đăng nhập ngay
              </button>
            </div>
          </>
        )}

        {phase === 'working' && <p className="auth-note">Đang xác thực…</p>}

        {phase === 'error' && (
          <>
            <p className="af-err" role="alert">
              {message}
            </p>
            <p className="auth-note">
              Token không đúng hoặc đã hết hạn. Kiểm tra lại liên kết trong email, hoặc gửi yêu
              cầu email mới bên dưới.
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} noValidate className="auth-modal-form">
          <label className="af" htmlFor="verify-token">
            <span>Token xác thực</span>
            <input
              id="verify-token"
              type="text"
              name="token"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán token trong email"
            />
          </label>
          <button type="submit" className="tb af-submit" disabled={!token.trim()}>
            Xác thực ngay
          </button>
        </form>

        <p className="af-alt">Chưa nhận được email?</p>
        <form onSubmit={handleResend} noValidate className="auth-modal-form" style={{ marginTop: 12 }}>
          <label className="af" htmlFor="resend-email">
            <span>Email đã đăng ký</span>
            <input
              id="resend-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@example.com"
            />
          </label>
          <button type="submit" className="tb af-btn-secondary" disabled={resendState !== 'idle'}>
            {resendState === 'busy' ? 'Đang gửi…' : resendState === 'sent' ? 'Đã gửi lại' : 'Gửi lại email'}
          </button>
        </form>

        <p className="af-alt">
          <Link to="/dang-nhap" className="af-link">
            Về trang đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
