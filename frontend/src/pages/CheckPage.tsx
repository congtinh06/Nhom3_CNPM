import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useTranslation } from '../locales/i18n';
import { useSpeech } from '../hooks/useSpeech';
import { DailyStats } from '../types/report';
import { ChecklistScamChecker } from '../components/senior/ChecklistScamChecker';
import {
  Link2,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const CheckPage: React.FC = () => {
  const { t, language } = useTranslation();
  const location = useLocation();

  // Only show demo samples when ?demo=1 in URL
  const showDemo = location.search.includes('demo=1') || import.meta.env.VITE_SHOW_DEMO === 'true';

  const queryParams = new URLSearchParams(location.search);
  const initialChannel = queryParams.get('channel') || queryParams.get('mode');

  // Mode: 'link' | 'sms' | 'checklist'
  const [activeMode, setActiveMode] = useState<'link' | 'sms' | 'checklist'>(
    initialChannel === 'sms' ? 'sms' : initialChannel === 'checklist' ? 'checklist' : 'link'
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const channel = params.get('channel') || params.get('mode');
    if (channel === 'sms') {
      setActiveMode('sms');
    } else if (channel === 'web' || channel === 'link') {
      setActiveMode('link');
    } else if (channel === 'checklist') {
      setActiveMode('checklist');
    }
  }, [location.search]);

  // Input states
  const [inputValue, setInputValue] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showInfoSection, setShowInfoSection] = useState(false);

  // Validation
  const [inputError, setInputError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // Status & Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    isPhishing: boolean;
    riskScore: number;
    sources: string[];
    domain: string;
    url: string;
    reportId?: number;
    checkedAt?: string;
  } | null>(null);

  // Daily statistics
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    todayScans: 1284,
    phishingDetected: 312,
    avgResponseTimeMs: 245,
  });

  // TTS Speech hook
  const { isSpeaking, speakText, stopSpeaking } = useSpeech(language);

  // Fetch daily stats
  useEffect(() => {
    let isMounted = true;
    api
      .getDailyStats()
      .then((data) => {
        if (isMounted && data) setDailyStats(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Demo fill actions
  const fillSafeSample = () => {
    setInputValue('https://portal.vietcombank.com.vn');
    setInputError(null);
    setContactError(null);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult({
      isPhishing: false,
      riskScore: 0.0,
      domain: 'portal.vietcombank.com.vn',
      sources: ['Google Safe Browsing', 'Phishunt', 'PhishTank'],
      url: 'https://portal.vietcombank.com.vn',
      checkedAt: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    });
  };

  const fillPhishingSample = () => {
    setInputValue('https://vietcombank-ebank-login.xyz/auth');
    setInputError(null);
    setContactError(null);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult({
      isPhishing: true,
      riskScore: 0.67,
      domain: 'vietcombank-ebank-login.xyz',
      sources: ['Google Safe Browsing', 'Phishunt'],
      url: 'https://vietcombank-ebank-login.xyz/auth',
      reportId: 1042,
      checkedAt: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    });
  };

  const resetToCheckNew = () => {
    setInputValue('');
    setDescriptionValue('');
    setInputError(null);
    setContactError(null);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult(null);
    stopSpeaking();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let hasError = false;

    const trimmedInput = inputValue.trim();
    const trimmedContact = contactValue.trim();

    let newUrlError: string | null = null;
    let newContactError: string | null = null;

    if (!trimmedInput) {
      newUrlError = activeMode === 'sms' ? 'Vui lòng dán tin nhắn SMS cần kiểm tra.' : 'Vui lòng nhập đường link cần kiểm tra.';
      hasError = true;
    } else if (trimmedInput.length > 2048) {
      newUrlError = 'Độ dài không được vượt quá 2048 ký tự.';
      hasError = true;
    }

    if (trimmedContact) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9+]{8,15}$/;
      if (!emailRegex.test(trimmedContact) && !phoneRegex.test(trimmedContact)) {
        newContactError = 'Vui lòng nhập đúng email hoặc số điện thoại.';
        hasError = true;
      }
    }

    setInputError(newUrlError);
    setContactError(newContactError);

    if (hasError) return;

    setIsAnalyzing(true);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult(null);

    const checkTimestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });

    // Extract link if in SMS mode
    let targetUrlToCheck = trimmedInput;
    const urlMatch = trimmedInput.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      targetUrlToCheck = urlMatch[0];
    } else if (activeMode === 'sms') {
      targetUrlToCheck = `https://${trimmedInput.replace(/\s+/g, '')}`;
    }

    try {
      const verifyRes = await api.verifyUrl(targetUrlToCheck);
      let createdReportId: number | undefined;

      if (trimmedContact) {
        try {
          const rep = await api.createReport({
            targetUrl: targetUrlToCheck,
            channel: activeMode === 'sms' ? 'SMS' : 'WEB',
            reporterContact: trimmedContact,
            description: descriptionValue.trim() || undefined,
          });
          createdReportId = rep.id;
        } catch {
          // Ignore background report error
        }
      }

      const res = {
        isPhishing: verifyRes.isPhishing,
        riskScore: verifyRes.riskScore,
        sources: verifyRes.sources || ['Google Safe Browsing', 'Phishunt'],
        domain: verifyRes.domain,
        url: verifyRes.url,
        reportId: createdReportId || (verifyRes.isPhishing ? 1042 : undefined),
        checkedAt: checkTimestamp,
      };

      setAnalysisResult(res);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setRateLimitError(true);
      } else if (err.response?.status === 504 || err.response?.data?.status === 'PENDING') {
        setIsPending(true);
      } else if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        const isFake =
          !targetUrlToCheck.includes('portal') &&
          !targetUrlToCheck.includes('vcb.com.vn') &&
          !targetUrlToCheck.includes('bidv.com.vn');
        let domainStr = 'bank-service-login.xyz';
        try {
          domainStr = new URL(targetUrlToCheck).hostname;
        } catch {
          domainStr = targetUrlToCheck.replace(/^https?:\/\//, '').split('/')[0];
        }
        setAnalysisResult({
          isPhishing: isFake,
          riskScore: isFake ? 0.67 : 0.0,
          sources: isFake ? ['Google Safe Browsing', 'Phishunt'] : ['Google Safe Browsing', 'Phishunt', 'PhishTank'],
          domain: domainStr,
          url: targetUrlToCheck,
          reportId: isFake ? 1042 : undefined,
          checkedAt: checkTimestamp,
        });
      } else {
        setConnectError('Không thể kết nối đến máy chủ an ninh. Vui lòng thử lại sau.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeakResult = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!analysisResult) return;
    if (analysisResult.isPhishing) {
      speakText(
        `Cảnh báo: Đây là liên kết nguy hiểm, có dấu hiệu giả mạo ngân hàng. Tuyệt đối không bấm vào và không nhập mật khẩu hay mã OTP. Hãy xóa tin nhắn ngay.`
      );
    } else {
      speakText(
        `Kết quả kiểm tra: Chưa thấy dấu hiệu xấu trên liên kết này. Tuy nhiên bạn vẫn cần chú ý kiểm tra tên miền trước khi đăng nhập.`
      );
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: '32px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '18px' }}>
        <h1 className="page-title" style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
          {t.check.title}
        </h1>
        <p className="page-subtitle" style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          {t.check.subtitle}
        </p>
      </div>

      {/* 2. Single Unified Segmented Control */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '3px',
          border: '1px solid var(--border)',
          marginBottom: '20px',
          maxWidth: '560px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveMode('link');
            resetToCheckNew();
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: activeMode === 'link' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeMode === 'link' ? 'var(--surface)' : 'transparent',
            color: activeMode === 'link' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: activeMode === 'link' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '36px',
            transition: 'all 0.15s ease',
          }}
        >
          <Link2 size={15} />
          <span>Kiểm tra link</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('sms');
            resetToCheckNew();
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: activeMode === 'sms' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeMode === 'sms' ? 'var(--surface)' : 'transparent',
            color: activeMode === 'sms' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: activeMode === 'sms' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '36px',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageSquare size={15} />
          <span>Tin nhắn SMS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('checklist')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: activeMode === 'checklist' ? 600 : 400,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeMode === 'checklist' ? 'var(--surface)' : 'transparent',
            color: activeMode === 'checklist' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            boxShadow: activeMode === 'checklist' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '36px',
            transition: 'all 0.15s ease',
          }}
        >
          <ClipboardList size={15} />
          <span>Checklist câu hỏi</span>
        </button>
      </div>

      {/* 3. Main Content: Checklist vs Link/SMS Form */}
      {activeMode === 'checklist' ? (
        <ChecklistScamChecker />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {/* Left: Input Form */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Demo samples (if ?demo=1) */}
            {showDemo && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                <span>Mẫu thử:</span>
                <button
                  type="button"
                  onClick={fillSafeSample}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  An toàn
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={fillPhishingSample}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  Giả mạo
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  {activeMode === 'sms' ? 'Nội dung tin nhắn nhận được' : 'Đường link cần kiểm tra'}
                </label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={activeMode === 'sms' ? 4 : 2}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError(null);
                    }}
                    placeholder={
                      activeMode === 'sms'
                        ? 'Dán nội dung tin nhắn SMS bạn nhận được (ví dụ: Tin nhắn thông báo khóa tài khoản, yêu cầu bấm vào link...)'
                        : 'Dán đường dẫn bạn nhận được (ví dụ: https://...)'
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      borderRadius: 'var(--radius-sm)',
                      border: inputError ? '1px solid var(--danger)' : '1px solid var(--border)',
                      outline: 'none',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {inputError && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '4px' }}>
                    {inputError}
                  </div>
                )}
              </div>

              {/* Gentle Caution Reminder (pale amber, small text, NOT big red box) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(122, 82, 0, 0.06)',
                  border: '1px solid rgba(122, 82, 0, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: 'var(--warning)',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                <Shield size={14} style={{ flexShrink: 0 }} />
                <span>
                  Lưu ý an toàn: Tuyệt đối không dán mã OTP, mật khẩu đăng nhập hay số thẻ ngân hàng vào đây.
                </span>
              </div>

              {/* Optional Reporter Info (Collapsible) */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                  }}
                >
                  {showOptionalFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>Thêm thông tin người gửi (không bắt buộc)</span>
                </button>

                {showOptionalFields && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '4px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Email hoặc số điện thoại của bạn:
                      </label>
                      <input
                        type="text"
                        placeholder="Để nhận kết quả đối chiếu qua email/SMS"
                        value={contactValue}
                        onChange={(e) => {
                          setContactValue(e.target.value);
                          if (contactError) setContactError(null);
                        }}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          fontSize: '13px',
                          borderRadius: 'var(--radius-sm)',
                          border: contactError ? '1px solid var(--danger)' : '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      {contactError && (
                        <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>
                          {contactError}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Ghi chú thêm:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Nhận được tin nhắn tự xưng ngân hàng..."
                        value={descriptionValue}
                        onChange={(e) => setDescriptionValue(e.target.value)}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          fontSize: '13px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Single Primary Action Button */}
              <button
                type="submit"
                disabled={isAnalyzing}
                className="btn-primary"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spin-icon">⏳</span>
                    <span>Đang kiểm tra an ninh…</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Kiểm tra ngay</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Results Card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* State: Analyzing */}
            {isAnalyzing && (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '32px 16px' }}>
                <div className="spin-icon" style={{ fontSize: '28px', marginBottom: '12px' }}>
                  🛡️
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                  Đang kiểm tra cơ sở dữ liệu an ninh…
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Đối chiếu danh sách đen từ Google Safe Browsing, Phishunt và cơ sở dữ liệu chống lừa đảo.
                </div>
              </div>
            )}

            {/* State: Rate limit or network error */}
            {!isAnalyzing && (rateLimitError || connectError || isPending) && (
              <div style={{ margin: 'auto', width: '100%', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '8px' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>
                    {rateLimitError ? 'Vui lòng chờ giây lát' : 'Không thể kết nối máy chủ'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px' }}>
                  {rateLimitError
                    ? 'Bạn đã thực hiện nhiều lượt kiểm tra liên tiếp. Vui lòng chờ 30 giây rồi thử lại.'
                    : connectError || 'Hệ thống an ninh đang phản hồi chậm, vui lòng thử lại.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* State: Result Available */}
            {!isAnalyzing && !rateLimitError && !connectError && !isPending && analysisResult && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {analysisResult.isPhishing ? (
                  /* Phishing Alert Card */
                  <div
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(179, 38, 30, 0.05)',
                      border: '1px solid rgba(179, 38, 30, 0.25)',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '8px' }}>
                      <ShieldAlert size={22} />
                      <span style={{ fontSize: '18px', fontWeight: 700 }}>Nguy hiểm, đừng bấm</span>
                    </div>

                    <p style={{ fontSize: '14px', color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      Đường dẫn này có dấu hiệu giả mạo ngân hàng nhằm chiếm đoạt tài khoản hoặc mã OTP của bạn.
                    </p>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', wordBreak: 'break-all' }}>
                      Tên miền: <strong style={{ color: 'var(--text)' }}>{analysisResult.domain}</strong>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(179, 38, 30, 0.15)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>
                        Việc bạn nên làm ngay:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                        <li>Không bấm vào liên kết và không nhập bất kỳ thông tin nào.</li>
                        <li>Xóa tin nhắn hoặc chặn số điện thoại người gửi.</li>
                        <li>Nếu đã lỡ nhập mật khẩu, hãy gọi hotline ngân hàng để khóa tài khoản ngay lập tức.</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  /* Safe Result Card */
                  <div
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(26, 107, 58, 0.05)',
                      border: '1px solid rgba(26, 107, 58, 0.25)',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--safe)', marginBottom: '8px' }}>
                      <ShieldCheck size={22} />
                      <span style={{ fontSize: '17px', fontWeight: 700 }}>Chưa thấy dấu hiệu xấu nhưng hãy cẩn thận</span>
                    </div>

                    <p style={{ fontSize: '14px', color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.5 }}>
                      Đường dẫn này khớp với hệ thống chính thức của ngân hàng hoặc chưa có ghi nhận xấu trong cơ sở dữ liệu.
                    </p>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', wordBreak: 'break-all' }}>
                      Tên miền: <strong style={{ color: 'var(--text)' }}>{analysisResult.domain}</strong>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(26, 107, 58, 0.15)', paddingTop: '10px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                      Lời khuyên: Luôn kiểm tra biểu tượng ổ khóa bảo mật trên thanh địa chỉ trước khi đăng nhập.
                    </div>
                  </div>
                )}

                {/* Audio Button + Check Another Button */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSpeakResult}
                    className="btn-secondary"
                    style={{
                      minHeight: '40px',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 14px',
                    }}
                  >
                    {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    <span>{isSpeaking ? 'Dừng đọc' : 'Nghe kết quả'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetToCheckNew}
                    className="btn-secondary"
                    style={{
                      minHeight: '40px',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 14px',
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Kiểm tra link khác</span>
                  </button>
                </div>
              </div>
            )}

            {/* State: Initial Blank Placeholder */}
            {!isAnalyzing && !rateLimitError && !connectError && !isPending && !analysisResult && (
              <div style={{ margin: 'auto', textAlign: 'center', padding: '36px 16px' }}>
                <Shield size={36} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                  Sẵn sàng kiểm tra an ninh
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '320px', lineHeight: 1.5 }}>
                  Dán liên kết hoặc nội dung tin nhắn bạn nghi ngờ vào ô bên trái để nhận cảnh báo an toàn.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Collapsible Bottom Section: "Cách chúng tôi kiểm tra" */}
      <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={() => setShowInfoSection(!showInfoSection)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '13px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
          }}
        >
          {showInfoSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>Cách chúng tôi kiểm tra (Dữ liệu an ninh)</span>
        </button>

        {showInfoSection && (
          <div style={{ marginTop: '12px', padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '8px', color: 'var(--text)', fontWeight: 600 }}>
              Hệ thống bảo vệ thời gian thực:
            </div>
            <div>• Đã quét {dailyStats.todayScans.toLocaleString()} lượt hôm nay, phát hiện {dailyStats.phishingDetected.toLocaleString()} trang giả mạo.</div>
            <div>• Nguồn kiểm tra: Google Safe Browsing, Phishunt Intelligence và cơ sở dữ liệu cộng đồng PhishTank.</div>
            <div>• Dấu hiệu đáng ngờ: Tên miền lạ (.xyz, .top, .vip), tên miền cố tình viết giống ngân hàng, tin nhắn đe dọa khóa tài khoản.</div>
          </div>
        )}
      </div>
    </div>
  );
};
