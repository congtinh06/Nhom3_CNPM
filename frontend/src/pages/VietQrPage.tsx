import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/checkout.css';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Copy,
  Landmark,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getVietQrPaymentInfo,
  getVietQrPaymentStatus,
  isVietQrPaid,
  VietQrError,
} from '../services/vietQrService';
import { markVietQrOrderPaid, renewVietQrOrderExpiry } from '../services/orderService';
import {
  VIETQR_POLL_INTERVAL_MS,
} from '../config/vietqr';
import { formatPrice } from '../utils/formatters';
import { VietQrPaymentInfo } from '../types';

const pad = (value: number): string => String(value).padStart(2, '0');

const formatCountdown = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
};

export const VietQrPage = () => {
  const { orderCode = '' } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const currentUserId = user?.id;

  const [info, setInfo] = useState<VietQrPaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const redirectedRef = useRef(false);

  const goToSuccess = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    navigate(
      `/thanh-toan/ket-qua?orderCode=${encodeURIComponent(orderCode)}&method=VIETQR&status=success`,
      { replace: true }
    );
  }, [navigate, orderCode]);

  const loadPayment = useCallback(async () => {
    if (!orderCode) {
      setErrorMessage('Không tìm thấy mã đơn hàng.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getVietQrPaymentInfo(orderCode, currentUserId);
      setInfo(data);
      setRemainingMs(new Date(data.expiresAt).getTime() - Date.now());
    } catch (err) {
      setInfo(null);
      setErrorMessage(
        err instanceof VietQrError ? err.message : 'Không thể tạo mã VietQR. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, [orderCode, currentUserId]);

  useEffect(() => {
    redirectedRef.current = false;
    window.scrollTo(0, 0);
    loadPayment();
  }, [loadPayment]);

  // Countdown tick from expiresAt
  useEffect(() => {
    if (!info) return;
    const tick = () => setRemainingMs(new Date(info.expiresAt).getTime() - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [info]);

  // Redirect if the order is already paid when loaded (e.g. page reload)
  useEffect(() => {
    if (info && isVietQrPaid(info.status)) {
      goToSuccess();
    }
  }, [info, goToSuccess]);

  // Poll lightweight payment status every 3s
  useEffect(() => {
    if (!info) return;
    const id = window.setInterval(async () => {
      try {
        const st = await getVietQrPaymentStatus(orderCode, currentUserId);
        if (isVietQrPaid(st.status, st.paymentStatus)) {
          goToSuccess();
        }
      } catch {
        // Polling must never crash the page; next tick retries.
      }
    }, VIETQR_POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [info, orderCode, currentUserId, goToSuccess]);

  const isExpired = info != null && remainingMs <= 0;

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      showToast('Không thể sao chép tự động. Vui lòng sao chép thủ công.');
    }
  };

  // "Tôi đã hoàn tất thanh toán": immediate status re-check only. Never marks paid.
  const handleReviewPayment = async () => {
    if (!orderCode) return;
    setReviewing(true);
    try {
      const st = await getVietQrPaymentStatus(orderCode, currentUserId);
      if (isVietQrPaid(st.status, st.paymentStatus)) {
        goToSuccess();
        return;
      }
      if (new Date(st.expiresAt).getTime() <= Date.now()) {
        setRemainingMs(0);
        return;
      }
      showToast('Hệ thống chưa ghi nhận thanh toán. Vui lòng thử lại sau vài giây.');
    } catch {
      showToast('Không thể kiểm tra trạng thái. Vui lòng thử lại.');
    } finally {
      setReviewing(false);
    }
  };

  const handleSimulatePaid = async () => {
    if (!orderCode || !info || isExpired) return;
    setSimulating(true);
    try {
      const updated = await markVietQrOrderPaid(orderCode);
      if (updated) {
        goToSuccess();
      } else {
        showToast('Không thể xác nhận thanh toán. Vui lòng thử lại.');
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!orderCode) return;
    const expiry = await renewVietQrOrderExpiry(orderCode);
    if (!expiry) {
      showToast('Không thể gia hạn mã QR. Vui lòng thử lại.');
      return;
    }
    showToast('Đã tạo mã QR mới.');
    loadPayment();
  };

  const copyRow = (key: string, label: string, value: string) => (
    <div className="vietqr-copy-row" key={key}>
      <span className="vietqr-label">{label}</span>
      <span className="vietqr-value vietqr-code">{value}</span>
      <button
        type="button"
        className="bank-copy-btn"
        onClick={() => handleCopy(key, value)}
        title={`Sao chép ${label}`}
      >
        <Copy size={12} aria-hidden="true" />
        <span>{copiedKey === key ? 'Đã chép!' : 'Sao chép'}</span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="vietqr-page">
        <div className="vietqr-container">
          <div className="vietqr-empty-box">
            <RefreshCw size={28} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
            <p>Đang tạo mã thanh toán VietQR...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !info) {
    return (
      <div className="vietqr-page">
        <div className="vietqr-container">
          <div className="vietqr-empty-box">
            <ShieldAlert size={30} strokeWidth={1.75} aria-hidden="true" />
            <p>{errorMessage || 'Không tìm thấy thông tin thanh toán.'}</p>
            <button type="button" className="vietqr-retry" onClick={() => navigate('/don-hang')}>
              <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
              Về trang đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vietqr-page">
      <div className="vietqr-container">
        <div className="vietqr-card">
          <h1 className="vietqr-title">Quét mã QR để thanh toán</h1>

          <div className="vietqr-amount-row">
            <span className="vietqr-amount">{formatPrice(info.amount)}</span>
            <span className="vietqr-order-code">Mã đơn: {orderCode}</span>
          </div>

          <div className="vietqr-qr-box">
            {isExpired ? (
              <div className="vietqr-qr-expired">
                <Clock size={24} strokeWidth={1.75} aria-hidden="true" />
                <span>Mã đã hết hạn</span>
              </div>
            ) : (
              <img src={info.qrUrl} alt="Mã VietQR thanh toán" className="vietqr-qr-img" />
            )}
          </div>

          <div className={`vietqr-countdown ${isExpired ? 'expired' : ''}`}>
            <Clock size={14} strokeWidth={2} aria-hidden="true" />
            <span>
              {isExpired ? 'Mã đã hết hạn' : `Hết hạn sau ${formatCountdown(remainingMs)}`}
            </span>
          </div>

          <div className="vietqr-bank-info">
            {copyRow('bank', 'Ngân hàng', info.bankName)}
            {copyRow('stk', 'Số tài khoản', info.accountNo)}
            {copyRow('owner', 'Chủ tài khoản', info.accountName)}
            {copyRow('content', 'Nội dung chuyển khoản', info.transferContent)}
          </div>

          {isExpired ? (
            <div className="vietqr-actions">
              <button type="button" className="vietqr-retry" onClick={handleRegenerate}>
                <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
                Tạo lại mã QR
              </button>
              <button type="button" className="vietqr-secondary" onClick={() => navigate('/thanh-toan')}>
                Về trang thanh toán
              </button>
            </div>
          ) : (
            <div className="vietqr-actions">
              <div className="vietqr-status">
                <Landmark size={15} strokeWidth={1.75} aria-hidden="true" />
                <span>Đang chờ thanh toán...</span>
              </div>
              <button
                type="button"
                className="vietqr-primary"
                onClick={handleReviewPayment}
                disabled={reviewing}
              >
                <QrCode size={16} strokeWidth={2} aria-hidden="true" />
                Tôi đã hoàn tất thanh toán
              </button>
              <button
                type="button"
                className="vietqr-secondary"
                onClick={() => navigate('/thanh-toan')}
              >
                Đổi phương thức thanh toán
              </button>
            </div>
          )}

          {import.meta.env.DEV && !isExpired && (
            <button
              type="button"
              className="vietqr-simulate"
              onClick={handleSimulatePaid}
              disabled={simulating}
            >
              <Zap size={14} strokeWidth={2} aria-hidden="true" />
              Giả lập đã thanh toán
            </button>
          )}
        </div>

        <p className="vietqr-note">
          Lưu ý: Vui lòng chuyển đúng số tiền và nội dung để hệ thống xác nhận tự động. Mã QR chỉ
          có hiệu lực trong 15 phút kể từ khi tạo.
        </p>
      </div>
    </div>
  );
};

export default VietQrPage;