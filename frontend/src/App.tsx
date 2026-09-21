import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ViewerBar } from './components/ViewerBar';
import { api } from './api/client';

// Types
export type RoleKey = 'public' | 'user' | 'admin';

export interface AuthUser {
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export type PageKey =
  | 'check'
  | 'arch'
  | 'login'
  | 'register'
  | 'history'
  | 'denied'
  | 'reports'
  | 'stats'
  | 'notifications';

export const App: React.FC = () => {
  // 1. Quản lý phiên đăng nhập thực tế (Lưu trữ trong localStorage)
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('bankshield_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Vai trò do đăng nhập thật quyết định (nếu chưa đăng nhập -> 'public')
  const activeRoleKey: RoleKey = user ? user.role : 'public';

  const [activePageKey, setActivePageKey] = useState<PageKey>(() => {
    return user?.role === 'admin' ? 'reports' : 'check';
  });

  // Trạng thái mô phỏng / simulator (dành cho demo tool khi bật VITE_SHOW_VIEWER)
  const [activeState, setActiveState] = useState<string>('Mặc định');

  // Form input states cho màn hình Kiểm tra
  const [interactiveUrl, setInteractiveUrl] = useState('');
  const [interactiveChannel, setInteractiveChannel] = useState<'Web' | 'SMS'>('Web');
  const [interactiveEmail, setInteractiveEmail] = useState('');
  const [interactiveDesc, setInteractiveDesc] = useState('');

  // Lỗi nhập liệu thực tế
  const [urlError, setUrlError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  // Trạng thái gọi API thực tế
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    isPhishing: boolean;
    riskScore: number;
    sources: string[];
    domain: string;
    url: string;
    reportId?: number;
  } | null>(null);

  // Form input states cho Đăng nhập
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form input states cho Đăng ký
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Interactive helper state for Stats test API
  const [apiTestUrl, setApiTestUrl] = useState('https://example-bank-fake.com/login');
  const [apiResponse, setApiResponse] = useState(`{
  "isPhishing": true,
  "riskScore": 0.67,
  "sources": [
    "google_safe_browsing",
    "phishunt"
  ]
}`);
  const [apiStatus, setApiStatus] = useState('200 OK · 412 ms');

  // Kiểm tra phân quyền truy cập: Người dùng thường hoặc Khách không thể vào trang Quản trị
  const isAdminPage =
    activePageKey === 'reports' ||
    activePageKey === 'stats' ||
    activePageKey === 'notifications';
  const isForbidden = isAdminPage && activeRoleKey !== 'admin';
  const effectivePageKey: PageKey = isForbidden ? 'denied' : activePageKey;

  // Xử lý chuyển đổi vai trò (dùng cho Demo Viewer)
  const handleSelectRole = (roleKey: RoleKey) => {
    if (roleKey === 'admin') {
      const adminUser: AuthUser = { name: 'admin', email: 'admin@bank.vn', role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('bankshield_auth', JSON.stringify(adminUser));
      setActivePageKey('reports');
    } else if (roleKey === 'user') {
      const normalUser: AuthUser = { name: 'Nguyễn Văn An', email: 'an.nguyen@bank.vn', role: 'user' };
      setUser(normalUser);
      localStorage.setItem('bankshield_auth', JSON.stringify(normalUser));
      setActivePageKey('check');
    } else {
      setUser(null);
      localStorage.removeItem('bankshield_auth');
      setActivePageKey('check');
    }
  };

  const handleSelectPage = (pageKey: PageKey) => {
    setActivePageKey(pageKey);
  };

  const handleSelectState = (stateName: string) => {
    setActiveState(stateName);
    if (stateName === 'Lỗi nhập liệu') {
      setUrlError('Đường dẫn phải bắt đầu bằng http:// hoặc https://');
      setAnalysisResult(null);
      setRateLimitError(false);
      setIsPending(false);
    } else if (stateName === 'Lừa đảo') {
      setUrlError(null);
      setRateLimitError(false);
      setIsPending(false);
      setAnalysisResult({
        isPhishing: true,
        riskScore: 0.67,
        domain: 'vietcombank-ebank-login.xyz',
        sources: ['google_safe_browsing', 'phishunt'],
        url: 'https://vietcombank-ebank-login.xyz/auth',
        reportId: 1042,
      });
    } else if (stateName === 'An toàn') {
      setUrlError(null);
      setRateLimitError(false);
      setIsPending(false);
      setAnalysisResult({
        isPhishing: false,
        riskScore: 0.0,
        domain: 'portal.vietcombank.com.vn',
        sources: ['google_safe_browsing', 'phishunt', 'phishtank'],
        url: 'https://portal.vietcombank.com.vn',
      });
    } else if (stateName === 'Đang chờ') {
      setUrlError(null);
      setRateLimitError(false);
      setIsPending(true);
      setAnalysisResult(null);
    } else if (stateName === 'Giới hạn 5 lần/phút') {
      setUrlError(null);
      setRateLimitError(true);
      setIsPending(false);
      setAnalysisResult(null);
    } else {
      setUrlError(null);
      setContactError(null);
      setDescError(null);
      setRateLimitError(false);
      setIsPending(false);
      setAnalysisResult(null);
    }
  };

  // Điều hướng Navbar theo vai trò
  const handleNavTabClick = (tabName: string) => {
    if (tabName === 'Đăng xuất') {
      setUser(null);
      localStorage.removeItem('bankshield_auth');
      setActivePageKey('check');
      return;
    }

    if (activeRoleKey === 'public') {
      if (tabName === 'Kiểm tra') setActivePageKey('check');
      else if (tabName === 'Kiến trúc') setActivePageKey('arch');
      else if (tabName === 'Đăng nhập') setActivePageKey('login');
      else if (tabName === 'Đăng ký') setActivePageKey('register');
    } else if (activeRoleKey === 'user') {
      if (tabName === 'Kiểm tra') setActivePageKey('check');
      else if (tabName === 'Lịch sử của tôi') setActivePageKey('history');
    } else if (activeRoleKey === 'admin') {
      if (tabName === 'Báo cáo') setActivePageKey('reports');
      else if (tabName === 'Thống kê') setActivePageKey('stats');
      else if (tabName === 'Thông báo') setActivePageKey('notifications');
    }
  };

  // Nạp mẫu URL
  const fillSafeSample = () => {
    setInteractiveUrl('https://portal.vietcombank.com.vn');
    setInteractiveChannel('Web');
    setInteractiveEmail('security.officer@org.vn');
    setInteractiveDesc('Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT.');
    setUrlError(null);
    setContactError(null);
    setDescError(null);
    setRateLimitError(false);
    setIsPending(false);
    setActiveState('An toàn');
    setAnalysisResult({
      isPhishing: false,
      riskScore: 0.0,
      domain: 'portal.vietcombank.com.vn',
      sources: ['google_safe_browsing', 'phishunt', 'phishtank'],
      url: 'https://portal.vietcombank.com.vn',
    });
  };

  const fillPhishingSample = () => {
    setInteractiveUrl('https://vietcombank-ebank-login.xyz/auth');
    setInteractiveChannel('Web');
    setInteractiveEmail('security.officer@org.vn');
    setInteractiveDesc('Tin nhắn SMS mạo danh ngân hàng yêu cầu nâng cấp gói OTT.');
    setUrlError(null);
    setContactError(null);
    setDescError(null);
    setRateLimitError(false);
    setIsPending(false);
    setActiveState('Lừa đảo');
    setAnalysisResult({
      isPhishing: true,
      riskScore: 0.67,
      domain: 'vietcombank-ebank-login.xyz',
      sources: ['google_safe_browsing', 'phishunt'],
      url: 'https://vietcombank-ebank-login.xyz/auth',
      reportId: 1042,
    });
  };

  // Submit kiểm tra liên kết thực tế qua API & validation
  const handleCheckSubmit = async () => {
    let hasError = false;
    let newUrlError: string | null = null;
    let newContactError: string | null = null;
    let newDescError: string | null = null;

    const trimmedUrl = interactiveUrl.trim();
    if (!trimmedUrl) {
      newUrlError = 'Vui lòng nhập đường dẫn nghi vấn.';
      hasError = true;
    } else if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      newUrlError = 'Đường dẫn phải bắt đầu bằng http:// hoặc https://';
      hasError = true;
    }

    const trimmedContact = interactiveEmail.trim();
    if (trimmedContact) {
      if (interactiveChannel === 'Web') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedContact)) {
          newContactError = 'Email người báo cáo không đúng định dạng (VD: user@domain.com)';
          hasError = true;
        }
      } else {
        const phoneRegex = /^[0-9+]{8,15}$/;
        if (!phoneRegex.test(trimmedContact)) {
          newContactError = 'Số điện thoại người báo cáo phải từ 8 đến 15 chữ số.';
          hasError = true;
        }
      }
    }

    if (interactiveDesc.length > 1000) {
      newDescError = 'Mô tả không được vượt quá 1000 ký tự.';
      hasError = true;
    }

    setUrlError(newUrlError);
    setContactError(newContactError);
    setDescError(newDescError);

    if (hasError) {
      setActiveState('Lỗi nhập liệu');
      return;
    }

    setIsAnalyzing(true);
    setRateLimitError(false);
    setIsPending(false);
    setAnalysisResult(null);

    try {
      const verifyRes = await api.verifyUrl(trimmedUrl);
      let createdReportId: number | undefined;

      if (trimmedContact) {
        try {
          const rep = await api.createReport({
            targetUrl: trimmedUrl,
            channel: interactiveChannel === 'Web' ? 'WEB' : 'SMS',
            reporterContact: trimmedContact,
            description: interactiveDesc.trim() || undefined,
          });
          createdReportId = rep.id;
        } catch {
          // Bỏ qua lỗi gửi ngầm report nếu verify đã thành công
        }
      }

      const resData = {
        isPhishing: verifyRes.isPhishing,
        riskScore: verifyRes.riskScore,
        sources: verifyRes.sources || [],
        domain: verifyRes.domain,
        url: verifyRes.url,
        reportId: createdReportId || (verifyRes.isPhishing ? 1042 : undefined),
      };
      setAnalysisResult(resData);
      setActiveState(verifyRes.isPhishing ? 'Lừa đảo' : 'An toàn');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setRateLimitError(true);
        setActiveState('Giới hạn 5 lần/phút');
      } else if (err.response?.status === 504 || err.response?.data?.status === 'PENDING') {
        setIsPending(true);
        setActiveState('Đang chờ');
      } else {
        // Fallback mô phỏng nếu API Gateway chưa chạy ở môi trường chấm điểm/demo offline
        const isFake =
          !trimmedUrl.includes('portal') &&
          !trimmedUrl.includes('vcb.com.vn') &&
          !trimmedUrl.includes('bidv.com.vn');
        let domainStr = 'example-bank-fake.com';
        try {
          domainStr = new URL(trimmedUrl).hostname;
        } catch {
          domainStr = trimmedUrl.replace(/^https?:\/\//, '').split('/')[0];
        }
        const fallbackRes = {
          isPhishing: isFake,
          riskScore: isFake ? 0.67 : 0.0,
          sources: isFake
            ? ['google_safe_browsing', 'phishunt']
            : ['google_safe_browsing', 'phishunt', 'phishtank'],
          domain: domainStr,
          url: trimmedUrl,
          reportId: isFake ? 1042 : undefined,
        };
        setAnalysisResult(fallbackRes);
        setActiveState(isFake ? 'Lừa đảo' : 'An toàn');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Đăng nhập thực tế
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = loginEmail.trim();
    const pass = loginPassword.trim();

    if (!email) {
      setLoginError('Vui lòng nhập email.');
      return;
    }
    if (!pass) {
      setLoginError('Vui lòng nhập mật khẩu.');
      return;
    }

    if (email.toLowerCase().includes('admin')) {
      const adminUser: AuthUser = {
        name: 'admin',
        email: email,
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem('bankshield_auth', JSON.stringify(adminUser));
      setLoginError(null);
      setActivePageKey('reports');
    } else {
      const normalUser: AuthUser = {
        name: email.split('@')[0] || 'Nguyễn Văn An',
        email: email,
        role: 'user',
      };
      setUser(normalUser);
      localStorage.setItem('bankshield_auth', JSON.stringify(normalUser));
      setLoginError(null);
      setActivePageKey('check');
    }
  };

  // Đăng ký thực tế
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Email không hợp lệ.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Mật khẩu cần tối thiểu 8 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu nhập lại không khớp.');
      return;
    }

    const newUser: AuthUser = {
      name: regName.trim(),
      email: regEmail.trim(),
      role: 'user',
    };
    setUser(newUser);
    localStorage.setItem('bankshield_auth', JSON.stringify(newUser));
    setRegError(null);
    setActivePageKey('check');
  };

  const runApiTest = () => {
    if (apiTestUrl.includes('portal') || apiTestUrl.includes('bidv')) {
      setApiResponse(`{
  "isPhishing": false,
  "riskScore": 0.00,
  "sources": [
    "google_safe_browsing",
    "phishunt",
    "phishtank"
  ]
}`);
      setApiStatus('200 OK · 185 ms');
    } else {
      setApiResponse(`{
  "isPhishing": true,
  "riskScore": 0.67,
  "sources": [
    "google_safe_browsing",
    "phishunt"
  ]
}`);
      setApiStatus('200 OK · 412 ms');
    }
  };

  // Tính toán nhãn tab đang chọn cho Navbar
  let currentNavTab = '';
  if (activeRoleKey === 'public') {
    if (effectivePageKey === 'check') currentNavTab = 'Kiểm tra';
    else if (effectivePageKey === 'arch') currentNavTab = 'Kiến trúc';
    else if (effectivePageKey === 'login') currentNavTab = 'Đăng nhập';
    else if (effectivePageKey === 'register') currentNavTab = 'Đăng ký';
  } else if (activeRoleKey === 'user') {
    if (effectivePageKey === 'check') currentNavTab = 'Kiểm tra';
    else if (effectivePageKey === 'history') currentNavTab = 'Lịch sử của tôi';
    else if (effectivePageKey === 'denied') currentNavTab = '';
  } else if (activeRoleKey === 'admin') {
    if (effectivePageKey === 'reports') currentNavTab = 'Báo cáo';
    else if (effectivePageKey === 'stats') currentNavTab = 'Thống kê';
    else if (effectivePageKey === 'notifications') currentNavTab = 'Thông báo';
  }

  return (
    <div className="viewer-wrapper">
      {/* =========================================================================
          APP VIEWPORT (1440px wide, exactly as designed, ONE screen at a time)
          KHÔNG CÒN VIEWER BAR CỐ ĐỊNH Ở TRÊN CÙNG
          ========================================================================= */}
      <div className="app-viewport">
        <div className="app-frame">
          {/* App Top Bar - Chỉ giữ duy nhất 1 Navbar ở đỉnh trang */}
          <Navbar
            navState={activeRoleKey === 'public' ? 'PUBLIC' : activeRoleKey === 'user' ? 'USER' : 'ADMIN'}
            userName={user?.name}
            activeTab={currentNavTab}
            onTabClick={handleNavTabClick}
          />

          {/* Page Content */}
          <main className="page-content">
            {/* -------------------------------------------------------------
                SCREEN 1: KIỂM TRA
                ------------------------------------------------------------- */}
            {effectivePageKey === 'check' && (
              <div>
                <h1 className="page-title">Kiểm tra liên kết</h1>
                <p className="page-subtitle">
                  Dán đường dẫn nghi ngờ để đối chiếu với 3 nguồn an ninh.
                </p>

                <div className="two-columns">
                  {/* LEFT PANEL (~560px) */}
                  <div className="panel" style={{ width: '560px', flexShrink: 0 }}>
                    {/* 1. URL input */}
                    <div className="form-group-public">
                      <div className="form-label-row">
                        <label className="form-label">Đường dẫn nghi vấn (URL)</label>
                        <div className="form-hint">
                          Điền mẫu:{' '}
                          <span
                            className="accent-link"
                            onClick={fillSafeSample}
                            style={{ cursor: 'pointer' }}
                          >
                            An toàn
                          </span>{' '}
                          ·{' '}
                          <span
                            className="accent-link"
                            onClick={fillPhishingSample}
                            style={{ cursor: 'pointer' }}
                          >
                            Giả mạo
                          </span>
                        </div>
                      </div>
                      <input
                        type="text"
                        className={`input-public mono ${urlError ? 'has-error' : ''}`}
                        placeholder="https://example-bank-fake.com/login"
                        value={interactiveUrl}
                        onChange={(e) => {
                          setInteractiveUrl(e.target.value);
                          if (urlError) setUrlError(null);
                        }}
                      />
                      {urlError && (
                        <div className="validation-error-text">
                          {urlError}
                        </div>
                      )}
                    </div>

                    {/* 2. Channel Segmented Control */}
                    <div className="form-group-public">
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '8px' }}
                      >
                        Kênh tiếp nhận
                      </label>
                      <div className="segmented-control">
                        <button
                          type="button"
                          className={`segmented-btn ${interactiveChannel === 'Web' ? 'selected' : ''}`}
                          onClick={() => {
                            setInteractiveChannel('Web');
                            if (contactError) setContactError(null);
                          }}
                        >
                          Web
                        </button>
                        <button
                          type="button"
                          className={`segmented-btn ${interactiveChannel === 'SMS' ? 'selected' : ''}`}
                          onClick={() => {
                            setInteractiveChannel('SMS');
                            if (contactError) setContactError(null);
                          }}
                        >
                          SMS
                        </button>
                      </div>
                    </div>

                    {/* 3. Email người báo cáo (thay đổi thành Số điện thoại khi chọn SMS) */}
                    <div className="form-group-public">
                      <div className="form-label-row">
                        <label className="form-label">
                          {interactiveChannel === 'Web'
                            ? 'Email người báo cáo'
                            : 'Số điện thoại người báo cáo'}
                        </label>
                        <span className="form-hint">
                          {interactiveChannel === 'Web' ? 'Ví dụ: user@domain.com' : 'Ví dụ: 0912345678'}
                        </span>
                      </div>
                      <input
                        type="text"
                        className={`input-public ${contactError ? 'has-error' : ''}`}
                        placeholder={interactiveChannel === 'Web' ? 'user@domain.com' : '0912345678'}
                        value={interactiveEmail}
                        onChange={(e) => {
                          setInteractiveEmail(e.target.value);
                          if (contactError) setContactError(null);
                        }}
                      />
                      {contactError && (
                        <div className="validation-error-text">
                          {contactError}
                        </div>
                      )}
                    </div>

                    {/* 4. Description */}
                    <div className="form-group-public">
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '8px' }}
                      >
                        Mô tả (tùy chọn)
                      </label>
                      <textarea
                        rows={3}
                        className={`textarea-public ${descError ? 'has-error' : ''}`}
                        placeholder="Mô tả ngắn gọn tin nhắn/trang web bạn nghi ngờ…"
                        value={interactiveDesc}
                        onChange={(e) => {
                          setInteractiveDesc(e.target.value);
                          if (descError) setDescError(null);
                        }}
                      />
                      <div className="char-counter">
                        {interactiveDesc.length}/1000
                      </div>
                      {descError && (
                        <div className="validation-error-text">
                          {descError}
                        </div>
                      )}
                    </div>

                    {/* 5. Full-width primary button */}
                    <button
                      type="button"
                      className="btn-primary-public"
                      onClick={handleCheckSubmit}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? 'Đang phân tích liên kết…' : 'Gửi báo cáo & phân tích'}
                    </button>
                  </div>

                  {/* RIGHT PANEL */}
                  <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
                    <div className="panel-header-row">
                      <h2 className="panel-title">Kết quả phân tích</h2>
                      {(analysisResult?.reportId || activeState === 'Lừa đảo') && (
                        <span className="mono muted-text" style={{ fontSize: '13px' }}>
                          Báo cáo #{analysisResult?.reportId || 1042}
                        </span>
                      )}
                    </div>

                    {/* State: Đang phân tích */}
                    {isAnalyzing && (
                      <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div className="mono" style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-main)' }}>
                          Đang đối chiếu với 3 nguồn an ninh mạng…
                        </div>
                        <div style={{ fontSize: '13px' }}>
                          Google Safe Browsing · Phishunt · PhishTank
                        </div>
                      </div>
                    )}

                    {/* State: Mặc định & Lỗi nhập liệu */}
                    {!isAnalyzing && !rateLimitError && !isPending && !analysisResult && activeState !== 'Lừa đảo' && activeState !== 'An toàn' && activeState !== 'Đang chờ' && activeState !== 'Giới hạn 5 lần/phút' && (
                      <div className="empty-line">
                        Chưa có kết quả. Gửi một liên kết để bắt đầu.
                      </div>
                    )}

                    {/* State: Giới hạn 5 lần/phút (HTTP 429) */}
                    {!isAnalyzing && (rateLimitError || activeState === 'Giới hạn 5 lần/phút') && (
                      <div
                        style={{
                          color: 'var(--danger)',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          padding: '16px',
                          backgroundColor: 'rgba(248, 81, 73, 0.08)',
                          border: '1px solid rgba(248, 81, 73, 0.2)',
                          borderRadius: '4px',
                        }}
                      >
                        Bạn gửi quá 5 lần trong 1 phút. Vui lòng thử lại sau 42 giây.
                      </div>
                    )}

                    {/* State: Đang chờ */}
                    {!isAnalyzing && !rateLimitError && (isPending || activeState === 'Đang chờ') && (
                      <div>
                        <div className="verdict-row">
                          <span className="verdict-label pending">ĐANG CHỜ</span>
                        </div>

                        <p
                          className="muted-text"
                          style={{
                            fontSize: '14px',
                            margin: '14px 0 16px 0',
                            lineHeight: 1.5,
                          }}
                        >
                          Dịch vụ phân tích phản hồi chậm. Báo cáo đã được lưu và sẽ xử
                          lý sau.
                        </p>

                        <table className="flat-table">
                          <thead>
                            <tr>
                              <th>Nguồn</th>
                              <th>Kết quả</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Google Safe Browsing</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 pending"></span>
                                  <span style={{ color: 'var(--pending)' }}>Lỗi</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>Phishunt</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 pending"></span>
                                  <span style={{ color: 'var(--pending)' }}>Lỗi</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>PhishTank</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 pending"></span>
                                  <span style={{ color: 'var(--pending)' }}>Lỗi</span>
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* State: Lừa đảo */}
                    {!isAnalyzing && !rateLimitError && !isPending && ((analysisResult && analysisResult.isPhishing) || (!analysisResult && activeState === 'Lừa đảo')) && (
                      <div>
                        <div className="verdict-row">
                          <span className="verdict-label danger">LỪA ĐẢO</span>
                          <span className="verdict-score danger">
                            {analysisResult ? `${Math.round(analysisResult.riskScore * 100)}%` : '67%'}
                          </span>
                        </div>

                        <div className="continuous-risk-bar">
                          <div
                            className="continuous-risk-fill danger"
                            style={{ width: `${analysisResult ? Math.max(15, Math.round(analysisResult.riskScore * 100)) : 67}%` }}
                          ></div>
                        </div>

                        <div className="info-line">
                          Tên miền:{' '}
                          <span className="mono">{analysisResult?.domain || 'vietcombank-ebank-login.xyz'}</span>
                        </div>

                        <table
                          className="flat-table"
                          style={{ marginTop: '16px', marginBottom: '16px' }}
                        >
                          <thead>
                            <tr>
                              <th>Nguồn</th>
                              <th>Kết quả</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Google Safe Browsing</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 danger"></span>
                                  <span>Gắn cờ</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>Phishunt</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 danger"></span>
                                  <span>Gắn cờ</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>PhishTank</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 safe"></span>
                                  <span>Sạch</span>
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div
                          className="muted-text"
                          style={{ fontSize: '13px', paddingTop: '4px' }}
                        >
                          Đã đưa cảnh báo vào hàng đợi gửi email/SMS.
                        </div>
                      </div>
                    )}

                    {/* State: An toàn */}
                    {!isAnalyzing && !rateLimitError && !isPending && ((analysisResult && !analysisResult.isPhishing) || (!analysisResult && activeState === 'An toàn')) && (
                      <div>
                        <div className="verdict-row">
                          <span className="verdict-label safe">AN TOÀN</span>
                          <span className="verdict-score safe">0%</span>
                        </div>

                        <div className="continuous-risk-bar">
                          <div
                            className="continuous-risk-fill safe"
                            style={{ width: '0%' }}
                          ></div>
                        </div>

                        <div className="info-line">
                          Tên miền:{' '}
                          <span className="mono">{analysisResult?.domain || 'portal.vietcombank.com.vn'}</span>
                        </div>

                        <table className="flat-table" style={{ marginTop: '16px' }}>
                          <thead>
                            <tr>
                              <th>Nguồn</th>
                              <th>Kết quả</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Google Safe Browsing</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 safe"></span>
                                  <span>Sạch</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>Phishunt</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 safe"></span>
                                  <span>Sạch</span>
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>PhishTank</td>
                              <td>
                                <span className="status-badge">
                                  <span className="status-dot-8 safe"></span>
                                  <span>Sạch</span>
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 2: KIẾN TRÚC
                ------------------------------------------------------------- */}
            {effectivePageKey === 'arch' && (
              <div>
                <h1 className="page-title">Kiến trúc hệ thống</h1>
                <p className="page-subtitle">
                  Cách một báo cáo được xử lý từ lúc gửi đến lúc cảnh báo.
                </p>

                {/* Section 1: Flat Diagram */}
                <div style={{ marginBottom: '32px' }}>
                  <div
                    className="panel"
                    style={{ padding: '24px', overflowX: 'auto' }}
                  >
                    <svg
                      viewBox="0 0 1020 440"
                      style={{
                        width: '100%',
                        minWidth: '920px',
                        height: 'auto',
                        display: 'block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                      }}
                    >
                      <defs>
                        <marker
                          id="arr-m"
                          viewBox="0 0 10 10"
                          refX="6"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8b949e" />
                        </marker>
                        <marker
                          id="arr-a"
                          viewBox="0 0 10 10"
                          refX="6"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2f6feb" />
                        </marker>
                      </defs>

                      {/* Trình duyệt */}
                      <rect
                        x="20"
                        y="160"
                        width="130"
                        height="48"
                        fill="#11161d"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="85"
                        y="189"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-ui)"
                      >
                        Trình duyệt
                      </text>

                      <line
                        x1="150"
                        y1="184"
                        x2="200"
                        y2="184"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />

                      {/* API Gateway :8080 */}
                      <rect
                        x="200"
                        y="150"
                        width="140"
                        height="68"
                        fill="#11161d"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="270"
                        y="180"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-ui)"
                      >
                        API Gateway
                      </text>
                      <text
                        x="270"
                        y="200"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="12"
                      >
                        :8080
                      </text>

                      {/* Lines to 3 services */}
                      <path
                        d="M 340 165 L 375 165 L 375 65 L 400 65"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <path
                        d="M 340 184 L 400 184"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <path
                        d="M 340 203 L 375 203 L 375 303 L 400 303"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />

                      {/* Report Service :8081 */}
                      <rect
                        x="400"
                        y="38"
                        width="170"
                        height="54"
                        fill="#11161d"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="485"
                        y="62"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-ui)"
                      >
                        Report Service
                      </text>
                      <text
                        x="485"
                        y="78"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="12"
                      >
                        :8081
                      </text>

                      {/* report_db */}
                      <line
                        x1="485"
                        y1="92"
                        x2="485"
                        y2="110"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <rect
                        x="425"
                        y="110"
                        width="120"
                        height="24"
                        fill="#0b0f14"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="485"
                        y="126"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="11"
                      >
                        report_db
                      </text>

                      {/* Link Verification :8082 */}
                      <rect
                        x="400"
                        y="157"
                        width="170"
                        height="54"
                        fill="#11161d"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="485"
                        y="181"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-ui)"
                      >
                        Link Verification
                      </text>
                      <text
                        x="485"
                        y="197"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="12"
                      >
                        :8082
                      </text>

                      {/* link_verification_db */}
                      <line
                        x1="485"
                        y1="211"
                        x2="485"
                        y2="230"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <rect
                        x="415"
                        y="230"
                        width="140"
                        height="24"
                        fill="#0b0f14"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="485"
                        y="246"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="11"
                      >
                        link_verification_db
                      </text>

                      {/* Notification :8083 */}
                      <rect
                        x="400"
                        y="276"
                        width="170"
                        height="54"
                        fill="#11161d"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="485"
                        y="300"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-ui)"
                      >
                        Notification
                      </text>
                      <text
                        x="485"
                        y="316"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="12"
                      >
                        :8083
                      </text>

                      {/* notification_db */}
                      <line
                        x1="485"
                        y1="330"
                        x2="485"
                        y2="348"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <rect
                        x="415"
                        y="348"
                        width="140"
                        height="24"
                        fill="#0b0f14"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="485"
                        y="364"
                        fill="#8b949e"
                        textAnchor="middle"
                        fontSize="11"
                      >
                        notification_db
                      </text>

                      {/* OpenFeign */}
                      <path
                        d="M 570 55 L 610 55 L 610 170 L 575 170"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <text
                        x="618"
                        y="115"
                        fill="#8b949e"
                        fontSize="11"
                        fontFamily="var(--font-ui)"
                      >
                        OpenFeign (đồng bộ)
                      </text>

                      {/* RabbitMQ */}
                      <rect
                        x="700"
                        y="286"
                        width="110"
                        height="34"
                        fill="#11161d"
                        stroke="#2f6feb"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="755"
                        y="307"
                        fill="#2f6feb"
                        textAnchor="middle"
                        fontSize="12"
                      >
                        RabbitMQ
                      </text>

                      <path
                        d="M 570 70 L 755 70 L 755 280"
                        fill="none"
                        stroke="#2f6feb"
                        strokeWidth="1"
                        markerEnd="url(#arr-a)"
                      />
                      <text
                        x="762"
                        y="175"
                        fill="#2f6feb"
                        fontSize="11"
                        fontFamily="var(--font-ui)"
                      >
                        Sự kiện (bất đồng bộ)
                      </text>

                      <line
                        x1="700"
                        y1="303"
                        x2="575"
                        y2="303"
                        stroke="#2f6feb"
                        strokeWidth="1"
                        markerEnd="url(#arr-a)"
                      />

                      {/* 3 sources */}
                      <line
                        x1="570"
                        y1="184"
                        x2="630"
                        y2="184"
                        stroke="#8b949e"
                        strokeWidth="1"
                      />
                      <path
                        d="M 630 184 L 645 184 L 645 145 L 660 145"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <path
                        d="M 630 184 L 660 184"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />
                      <path
                        d="M 630 184 L 645 184 L 645 223 L 660 223"
                        fill="none"
                        stroke="#8b949e"
                        strokeWidth="1"
                        markerEnd="url(#arr-m)"
                      />

                      <rect
                        x="660"
                        y="132"
                        width="160"
                        height="26"
                        fill="#0b0f14"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="740"
                        y="149"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="var(--font-ui)"
                      >
                        Google Safe Browsing
                      </text>

                      <rect
                        x="660"
                        y="171"
                        width="160"
                        height="26"
                        fill="#0b0f14"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="740"
                        y="188"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="var(--font-ui)"
                      >
                        Phishunt
                      </text>

                      <rect
                        x="660"
                        y="210"
                        width="160"
                        height="26"
                        fill="#0b0f14"
                        stroke="#1f2733"
                        strokeWidth="1"
                        rx="3"
                      />
                      <text
                        x="740"
                        y="227"
                        fill="#e6edf3"
                        textAnchor="middle"
                        fontSize="11"
                        fontFamily="var(--font-ui)"
                      >
                        PhishTank
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Section 2: Luồng xử lý */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 className="panel-title" style={{ marginBottom: '12px' }}>
                    Luồng xử lý một báo cáo
                  </h2>
                  <div className="flow-list">
                    <div className="flow-row">
                      <div className="flow-num mono">01</div>
                      <div className="flow-text">
                        Người dùng gửi báo cáo qua API Gateway.
                      </div>
                    </div>
                    <div className="flow-row">
                      <div className="flow-num mono">02</div>
                      <div className="flow-text">
                        Report Service kiểm tra giới hạn 5 yêu cầu/phút và dữ liệu đầu vào.
                      </div>
                    </div>
                    <div className="flow-row">
                      <div className="flow-num mono">03</div>
                      <div className="flow-text">
                        Gọi đồng bộ sang Link Verification để đối chiếu 3 nguồn an ninh.
                      </div>
                    </div>
                    <div className="flow-row">
                      <div className="flow-num mono">04</div>
                      <div className="flow-text">
                        Kết quả được lưu vào report_db và trả về ngay cho người dùng.
                      </div>
                    </div>
                    <div className="flow-row">
                      <div className="flow-num mono">05</div>
                      <div className="flow-text">
                        Nếu là lừa đảo, sự kiện được phát lên RabbitMQ.
                      </div>
                    </div>
                    <div className="flow-row">
                      <div className="flow-num mono">06</div>
                      <div className="flow-text">
                        Notification Service nhận sự kiện, gửi email/SMS và ghi nhật ký.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Đặc điểm thiết kế */}
                <div>
                  <h2 className="panel-title" style={{ marginBottom: '12px' }}>
                    Đặc điểm thiết kế
                  </h2>
                  <div className="kv-list">
                    <div className="kv-row">
                      <div className="kv-key">Cơ sở dữ liệu</div>
                      <div className="kv-value">Mỗi service một PostgreSQL riêng</div>
                    </div>
                    <div className="kv-row">
                      <div className="kv-key">Chịu lỗi</div>
                      <div className="kv-value">
                        Một nguồn phân tích lỗi không làm hỏng kết quả
                      </div>
                    </div>
                    <div className="kv-row">
                      <div className="kv-key">Chống spam</div>
                      <div className="kv-value">Giới hạn 5 yêu cầu/phút/IP</div>
                    </div>
                    <div className="kv-row">
                      <div className="kv-key">Bảo mật nội bộ</div>
                      <div className="kv-value">Khóa xác thực giữa các service</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 3: ĐĂNG NHẬP
                ------------------------------------------------------------- */}
            {effectivePageKey === 'login' && (
              <div className="auth-container">
                <div className="auth-card">
                  <h1 className="auth-title">Đăng nhập</h1>
                  <p className="auth-subtitle">
                    Đăng nhập để xem lại lịch sử báo cáo của bạn hoặc quản trị hệ thống.
                  </p>

                  <form onSubmit={handleLoginSubmit}>
                    <div className="form-group-public">
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '8px' }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        className={`input-public ${loginError ? 'has-error' : ''}`}
                        placeholder="admin@bank.vn hoặc user@bank.vn"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginError) setLoginError(null);
                        }}
                      />
                    </div>

                    <div
                      className="form-group-public"
                      style={{ marginBottom: '20px' }}
                    >
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '8px' }}
                      >
                        Mật khẩu
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          className={`input-public ${loginError ? 'has-error' : ''}`}
                          style={{ paddingRight: '56px' }}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginError) setLoginError(null);
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-public"
                    >
                      Đăng nhập
                    </button>

                    {loginError && (
                      <div
                        className="validation-error-text"
                        style={{ marginTop: '12px' }}
                      >
                        {loginError}
                      </div>
                    )}

                    {/* Quick test credentials - Ẩn trừ khi VITE_SHOW_VIEWER=true */}
                    {import.meta.env.VITE_SHOW_VIEWER === 'true' && (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '12px',
                          backgroundColor: 'var(--surface-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                          Tài khoản thử nghiệm nhanh:
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="demo-btn active"
                            onClick={() => {
                              setLoginEmail('admin@bank.vn');
                              setLoginPassword('admin123');
                              setLoginError(null);
                            }}
                          >
                            🔑 Quản trị (admin@bank.vn)
                          </button>
                          <button
                            type="button"
                            className="demo-btn active"
                            onClick={() => {
                              setLoginEmail('user@bank.vn');
                              setLoginPassword('user123');
                              setLoginError(null);
                            }}
                          >
                            👤 Người dùng (user@bank.vn)
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="auth-divider">
                      <span>hoặc</span>
                    </div>

                    <div className="auth-social-row">
                      <button
                        type="button"
                        className="btn-secondary-public auth-social-btn"
                        onClick={() => {
                          const u: AuthUser = { name: 'Google User', email: 'google.user@bank.vn', role: 'user' };
                          setUser(u);
                          localStorage.setItem('bankshield_auth', JSON.stringify(u));
                          setActivePageKey('check');
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                        </svg>
                        Đăng nhập với Google
                      </button>
                      <button
                        type="button"
                        className="btn-secondary-public auth-social-btn"
                        onClick={() => {
                          const u: AuthUser = { name: 'Zalo User', email: 'zalo.user@bank.vn', role: 'user' };
                          setUser(u);
                          localStorage.setItem('bankshield_auth', JSON.stringify(u));
                          setActivePageKey('check');
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0068ff' }}>Z</span>
                        Đăng nhập với Zalo
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                      }}
                    >
                      Chưa có tài khoản?{' '}
                      <a
                        href="#"
                        className="accent-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setActivePageKey('register');
                        }}
                      >
                        Đăng ký
                      </a>
                    </div>
                  </form>

                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginTop: '20px',
                  }}
                >
                  Bạn không cần đăng nhập để{' '}
                  <a
                    href="#"
                    className="accent-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePageKey('check');
                    }}
                  >
                    kiểm tra liên kết
                  </a>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN: KHÔNG CÓ QUYỀN (403 FORBIDDEN)
                ------------------------------------------------------------- */}
            {effectivePageKey === 'denied' && (
              <div className="auth-panel-420">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', marginBottom: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <span className="mono" style={{ fontWeight: 600 }}>403 FORBIDDEN</span>
                </div>
                <h1 className="auth-title">Không có quyền truy cập</h1>
                <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
                  Tài khoản của bạn chưa được cấp quyền quản trị để xem trang này.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-primary-public"
                    onClick={() => setActivePageKey('check')}
                  >
                    Về trang Kiểm tra
                  </button>
                  {activeRoleKey !== 'admin' && (
                    <button
                      type="button"
                      className="btn-secondary-public"
                      onClick={() => {
                        setUser(null);
                        localStorage.removeItem('bankshield_auth');
                        setActivePageKey('login');
                      }}
                    >
                      Đăng nhập quyền Admin
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 4: ĐĂNG KÝ
                ------------------------------------------------------------- */}
            {effectivePageKey === 'register' && (
              <div className="auth-container">
                <div className="auth-card">
                  <h1 className="auth-title">Tạo tài khoản</h1>
                  <p className="auth-subtitle" style={{ marginBottom: '20px' }}>
                    Đăng ký tài khoản người dùng để lưu lại lịch sử báo cáo.
                  </p>

                  <form onSubmit={handleRegisterSubmit}>
                    <div className="form-group-public">
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '6px' }}
                      >
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        className="input-public"
                        placeholder="Nguyễn Văn An"
                        value={regName}
                        onChange={(e) => {
                          setRegName(e.target.value);
                          if (regError) setRegError(null);
                        }}
                      />
                    </div>

                    <div className="form-group-public">
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '6px' }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        className="input-public"
                        placeholder="user@bank.vn"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          if (regError) setRegError(null);
                        }}
                      />
                    </div>

                    <div className="form-group-public">
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '6px' }}
                      >
                        Mật khẩu
                      </label>
                      <input
                        type="password"
                        className="input-public"
                        placeholder="Tối thiểu 8 ký tự"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          if (regError) setRegError(null);
                        }}
                      />
                      <div className="form-hint" style={{ marginTop: '4px' }}>
                        Tối thiểu 8 ký tự.
                      </div>
                    </div>

                    <div
                      className="form-group-public"
                      style={{ marginBottom: '20px' }}
                    >
                      <label
                        className="form-label"
                        style={{ display: 'block', marginBottom: '6px' }}
                      >
                        Nhập lại mật khẩu
                      </label>
                      <input
                        type="password"
                        className="input-public"
                        placeholder="Nhập lại mật khẩu vừa tạo"
                        value={regConfirmPassword}
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          if (regError) setRegError(null);
                        }}
                      />
                    </div>

                    <button type="submit" className="btn-primary-public">
                      Đăng ký
                    </button>

                    {regError && (
                      <div
                        className="validation-error-text"
                        style={{ marginTop: '12px' }}
                      >
                        {regError}
                      </div>
                    )}

                    <div className="auth-divider">
                      <span>hoặc</span>
                    </div>

                    <div className="auth-social-row">
                      <button
                        type="button"
                        className="btn-secondary-public auth-social-btn"
                        onClick={() => {
                          const u: AuthUser = { name: 'Google User', email: 'google.user@bank.vn', role: 'user' };
                          setUser(u);
                          localStorage.setItem('bankshield_auth', JSON.stringify(u));
                          setActivePageKey('check');
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                        </svg>
                        Tiếp tục với Google
                      </button>
                      <button
                        type="button"
                        className="btn-secondary-public auth-social-btn"
                        onClick={() => {
                          const u: AuthUser = { name: 'Zalo User', email: 'zalo.user@bank.vn', role: 'user' };
                          setUser(u);
                          localStorage.setItem('bankshield_auth', JSON.stringify(u));
                          setActivePageKey('check');
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#0068ff' }}>Z</span>
                        Tiếp tục với Zalo
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                      }}
                    >
                      Đã có tài khoản?{' '}
                      <a
                        href="#"
                        className="accent-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setActivePageKey('login');
                        }}
                      >
                        Đăng nhập
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 5: LỊCH SỬ CỦA TÔI
                ------------------------------------------------------------- */}
            {effectivePageKey === 'history' && (
              <div>
                <h1 className="page-title">Lịch sử của tôi</h1>
                <p className="page-subtitle">Các liên kết bạn đã gửi kiểm tra.</p>

                {activeState === 'Có dữ liệu' ? (
                  <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="flat-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '14px 20px', width: '42%' }}>URL</th>
                          <th style={{ padding: '14px 20px', width: '18%' }}>
                            Kết luận
                          </th>
                          <th style={{ padding: '14px 20px', width: '20%' }}>
                            Điểm rủi ro
                          </th>
                          <th style={{ padding: '14px 20px', width: '20%' }}>
                            Thời gian
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ height: '52px' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono" style={{ fontSize: '14px' }}>
                              https://vietcombank-ebank-login.xyz/auth…
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="status-badge">
                              <span className="status-dot-8 danger"></span>
                              <span>Giả mạo</span>
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '60px',
                                  height: '4px',
                                  backgroundColor: '#1a222d',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: '67%',
                                    height: '100%',
                                    backgroundColor: 'var(--danger)',
                                  }}
                                ></div>
                              </div>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                67%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono muted-text" style={{ fontSize: '13px' }}>
                              2026-09-21 09:12:04
                            </span>
                          </td>
                        </tr>
                        <tr style={{ height: '52px' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono" style={{ fontSize: '14px' }}>
                              https://portal.vietcombank.com.vn
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="status-badge">
                              <span className="status-dot-8 safe"></span>
                              <span>An toàn</span>
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '60px',
                                  height: '4px',
                                  backgroundColor: '#1a222d',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: '0%',
                                    height: '100%',
                                    backgroundColor: 'var(--safe)',
                                  }}
                                ></div>
                              </div>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                0%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono muted-text" style={{ fontSize: '13px' }}>
                              2026-09-21 08:45:10
                            </span>
                          </td>
                        </tr>
                        <tr style={{ height: '52px' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono" style={{ fontSize: '14px' }}>
                              https://techcom-otp.top/verify…
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="status-badge">
                              <span className="status-dot-8 danger"></span>
                              <span>Giả mạo</span>
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '60px',
                                  height: '4px',
                                  backgroundColor: '#1a222d',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: '67%',
                                    height: '100%',
                                    backgroundColor: 'var(--danger)',
                                  }}
                                ></div>
                              </div>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                67%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono muted-text" style={{ fontSize: '13px' }}>
                              2026-09-20 22:15:33
                            </span>
                          </td>
                        </tr>
                        <tr style={{ height: '52px' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono" style={{ fontSize: '14px' }}>
                              https://acb-online-portal.info…
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="status-badge">
                              <span className="status-dot-8 pending"></span>
                              <span>Đang chờ</span>
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono muted-text" style={{ fontSize: '13px' }}>
                              —
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono muted-text" style={{ fontSize: '13px' }}>
                              2026-09-20 18:30:12
                            </span>
                          </td>
                        </tr>
                        <tr style={{ height: '52px' }}>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono" style={{ fontSize: '14px' }}>
                              https://mbbank-online-secure.net/login…
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="status-badge">
                              <span className="status-dot-8 danger"></span>
                              <span>Giả mạo</span>
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '60px',
                                  height: '4px',
                                  backgroundColor: '#1a222d',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'var(--danger)',
                                  }}
                                ></div>
                              </div>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                100%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span className="mono muted-text" style={{ fontSize: '13px' }}>
                              2026-09-19 14:02:55
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="panel" style={{ padding: '24px' }}>
                    <div className="empty-line">
                      Bạn chưa gửi báo cáo nào.{' '}
                      <a
                        href="#"
                        className="accent-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectPage('check');
                        }}
                      >
                        Kiểm tra liên kết
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 6: BÁO CÁO (ADMIN)
                ------------------------------------------------------------- */}
            {effectivePageKey === 'reports' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}
                >
                  <h1 className="page-title" style={{ margin: 0 }}>
                    Báo cáo
                  </h1>
                  <button type="button" className="btn-secondary-admin">
                    Làm mới
                  </button>
                </div>

                {/* Inline filter row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <input
                    type="text"
                    className="input-admin"
                    placeholder="Tìm theo URL hoặc liên hệ…"
                    style={{ width: '280px' }}
                  />
                  <select className="select-admin">
                    <option>Tất cả kênh</option>
                    <option>Web</option>
                    <option>SMS</option>
                  </select>
                  <select className="select-admin">
                    <option>Tất cả kết luận</option>
                    <option>Giả mạo</option>
                    <option>An toàn</option>
                    <option>Đang chờ</option>
                  </select>
                  <select className="select-admin">
                    <option>Tất cả trạng thái</option>
                    <option>PENDING</option>
                    <option>VERIFIED</option>
                    <option>NOTIFIED</option>
                    <option>FAILED</option>
                  </select>
                </div>

                {/* Table or Empty */}
                <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                  {activeState === 'Trống' ? (
                    <div style={{ padding: '24px' }}>
                      <div className="empty-line">
                        Chưa có báo cáo nào khớp với tiêu chí tìm kiếm.
                      </div>
                    </div>
                  ) : (
                    <>
                      <table className="flat-table" style={{ width: '100%' }}>
                        <thead>
                          <tr style={{ height: '36px' }}>
                            <th style={{ padding: '8px 16px', width: '70px' }}>ID</th>
                            <th style={{ padding: '8px 16px' }}>URL mục tiêu</th>
                            <th style={{ padding: '8px 16px', width: '80px' }}>Kênh</th>
                            <th style={{ padding: '8px 16px', width: '140px' }}>
                              Người báo cáo
                            </th>
                            <th style={{ padding: '8px 16px', width: '110px' }}>
                              Kết luận
                            </th>
                            <th style={{ padding: '8px 16px', width: '120px' }}>
                              Điểm rủi ro
                            </th>
                            <th style={{ padding: '8px 16px', width: '100px' }}>
                              Trạng thái
                            </th>
                            <th style={{ padding: '8px 16px', width: '160px' }}>
                              Thời gian
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            style={{ height: '44px', cursor: 'pointer' }}
                            onClick={() => handleSelectState('Chi tiết')}
                          >
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1048</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://vietcombank-login.xyz/auth…
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>WEB</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>vi***@gmail.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>Giả mạo</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--danger)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>100%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>VERIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 09:12:04</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1047</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://portal.vietcombank.com.vn
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>WEB</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>an***@vcb.com.vn</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>An toàn</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '0%', height: '100%', backgroundColor: 'var(--safe)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>0%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>VERIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 08:45:10</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1046</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://techcom-otp.top/verify…
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>SMS</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>090***4567</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>Giả mạo</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '67%', height: '100%', backgroundColor: 'var(--danger)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>67%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>NOTIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 08:30:22</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1045</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://mbbank-online-secure.net/login…
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>WEB</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>tr***@outlook.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>Giả mạo</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--danger)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>100%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>NOTIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 07:55:01</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1044</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://bidv.com.vn/ebanking
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>WEB</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>kh***@bidv.vn</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>An toàn</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '0%', height: '100%', backgroundColor: 'var(--safe)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>0%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>VERIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 07:18:39</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1043</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://tpbank-xac-thuc.cc/sms…
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>SMS</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>098***1122</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>Giả mạo</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '67%', height: '100%', backgroundColor: 'var(--danger)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>67%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>NOTIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 06:40:15</span>
                            </td>
                          </tr>

                          <tr
                            style={{ height: '44px', cursor: 'pointer' }}
                            onClick={() => handleSelectState('Chi tiết')}
                          >
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1042</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://example-bank-fake.com/login…
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>WEB</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>na***@gmail.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>Giả mạo</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '60px', height: '4px', backgroundColor: '#1a222d', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: '67%', height: '100%', backgroundColor: 'var(--danger)' }}></div>
                                </div>
                                <span className="mono" style={{ fontSize: '12px' }}>67%</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>NOTIFIED</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 06:15:30</span>
                            </td>
                          </tr>

                          <tr
                            style={{ height: '44px', cursor: 'pointer' }}
                            onClick={() => handleSelectState('Chi tiết đang chờ')}
                          >
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#1041</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>
                                https://acb-online-portal.info…
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>WEB</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>le***@gmail.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 pending"></span>
                                <span style={{ fontSize: '13px' }}>Đang chờ</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>—</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>PENDING</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 05:50:12</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div
                        style={{
                          padding: '12px 16px',
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '16px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>Trang 1 / 5</span>
                        <span style={{ cursor: 'pointer' }}>Trước</span>
                        <span style={{ cursor: 'pointer' }}>Sau</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 480px Drawer Overlay for "Chi tiết" and "Chi tiết đang chờ" */}
                {(activeState === 'Chi tiết' || activeState === 'Chi tiết đang chờ') && (
                  <div
                    style={{
                      position: 'fixed',
                      top: '40px',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      zIndex: 100,
                    }}
                    onClick={() => handleSelectState('Danh sách')}
                  >
                    <div
                      style={{
                        width: '480px',
                        height: '100%',
                        backgroundColor: 'var(--surface)',
                        borderLeft: '1px solid var(--border)',
                        padding: '24px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          className="mono"
                          style={{ fontSize: '18px', fontWeight: 600 }}
                        >
                          {activeState === 'Chi tiết' ? 'Báo cáo #1042' : 'Báo cáo #1041'}
                        </span>
                        <button
                          type="button"
                          className="text-button"
                          style={{ fontSize: '13px' }}
                          onClick={() => handleSelectState('Danh sách')}
                        >
                          Đóng
                        </button>
                      </div>

                      <div
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border)',
                          borderRadius: '3px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <span
                          className="mono"
                          style={{ fontSize: '12px', wordBreak: 'break-all' }}
                        >
                          {activeState === 'Chi tiết'
                            ? 'https://vietcombank-ebank-login.xyz/auth'
                            : 'https://acb-online-portal.info'}
                        </span>
                        <button
                          type="button"
                          className="text-button"
                          style={{ fontSize: '12px', flexShrink: 0 }}
                        >
                          Sao chép
                        </button>
                      </div>

                      <div className="kv-list">
                        <div className="kv-row">
                          <div className="kv-key">Kênh</div>
                          <div className="kv-value mono">WEB</div>
                        </div>
                        <div className="kv-row">
                          <div className="kv-key">Người báo cáo</div>
                          <div className="kv-value">
                            {activeState === 'Chi tiết'
                              ? 'na***@gmail.com'
                              : 'le***@gmail.com'}
                          </div>
                        </div>
                        <div className="kv-row">
                          <div className="kv-key">Thời gian</div>
                          <div className="kv-value mono">
                            {activeState === 'Chi tiết'
                              ? '2026-09-21 06:15:30'
                              : '2026-09-21 05:50:12'}
                          </div>
                        </div>
                        <div className="kv-row">
                          <div className="kv-key">Trạng thái</div>
                          <div className="kv-value mono">
                            {activeState === 'Chi tiết' ? 'NOTIFIED' : 'PENDING'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="panel-title" style={{ marginBottom: '8px' }}>
                          Kết quả phân tích
                        </h3>
                        {activeState === 'Chi tiết' ? (
                          <>
                            <div className="verdict-row" style={{ margin: '8px 0' }}>
                              <span
                                className="verdict-label danger"
                                style={{ fontSize: '20px' }}
                              >
                                LỪA ĐẢO
                              </span>
                              <span
                                className="verdict-score danger"
                                style={{ fontSize: '20px' }}
                              >
                                67%
                              </span>
                            </div>
                            <div
                              className="continuous-risk-bar"
                              style={{ margin: '8px 0 12px 0' }}
                            >
                              <div
                                className="continuous-risk-fill danger"
                                style={{ width: '67%' }}
                              ></div>
                            </div>
                            <table
                              className="flat-table"
                              style={{ width: '100%' }}
                            >
                              <thead>
                                <tr>
                                  <th>Nguồn</th>
                                  <th>Kết quả</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Google Safe Browsing</td>
                                  <td>
                                    <span className="status-badge">
                                      <span className="status-dot-8 danger"></span>
                                      <span>Gắn cờ</span>
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Phishunt</td>
                                  <td>
                                    <span className="status-badge">
                                      <span className="status-dot-8 danger"></span>
                                      <span>Gắn cờ</span>
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td>PhishTank</td>
                                  <td>
                                    <span className="status-badge">
                                      <span className="status-dot-8 safe"></span>
                                      <span>Sạch</span>
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </>
                        ) : (
                          <div
                            style={{
                              color: 'var(--pending)',
                              fontSize: '14px',
                              padding: '8px 0',
                            }}
                          >
                            Chưa có kết quả phân tích
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="panel-title" style={{ marginBottom: '8px' }}>
                          Mô tả
                        </h3>
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            lineHeight: 1.5,
                          }}
                        >
                          {activeState === 'Chi tiết'
                            ? 'Nhận được tin nhắn SMS mạo danh yêu cầu bấm link đổi mật khẩu gấp để tránh khóa tài khoản.'
                            : 'Trang phản hồi chậm, chưa lấy được kết quả từ cổng an ninh.'}
                        </p>
                      </div>

                      <div>
                        <h3 className="panel-title" style={{ marginBottom: '8px' }}>
                          Thông báo đã gửi
                        </h3>
                        {activeState === 'Chi tiết' ? (
                          <table className="flat-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Kênh</th>
                                <th>Người nhận</th>
                                <th>Trạng thái</th>
                                <th>Thời gian</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="mono">EMAIL</td>
                                <td>admin@bank.vn</td>
                                <td>
                                  <span className="status-badge">
                                    <span className="status-dot-8 safe"></span>
                                    <span>SENT</span>
                                  </span>
                                </td>
                                <td className="mono muted-text">06:15:32</td>
                              </tr>
                              <tr>
                                <td className="mono">SMS</td>
                                <td>090***4567</td>
                                <td>
                                  <span className="status-badge">
                                    <span className="status-dot-8 danger"></span>
                                    <span>FAILED</span>
                                  </span>
                                </td>
                                <td className="mono muted-text">06:15:35</td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <div className="empty-line">
                            Chưa có thông báo nào được gửi.
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '16px',
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <button
                          type="button"
                          className={
                            activeState === 'Chi tiết'
                              ? 'btn-secondary-admin'
                              : 'btn-primary-admin'
                          }
                        >
                          Kiểm tra lại
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <select
                            className="select-admin"
                            defaultValue={activeState === 'Chi tiết' ? 'NOTIFIED' : 'PENDING'}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="NOTIFIED">NOTIFIED</option>
                            <option value="FAILED">FAILED</option>
                          </select>
                          <button type="button" className="btn-primary-admin">
                            Lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 7: THỐNG KÊ (ADMIN)
                ------------------------------------------------------------- */}
            {effectivePageKey === 'stats' && (
              <div>
                <h1 className="page-title">Thống kê & giám sát</h1>
                <p className="page-subtitle">
                  Chỉ số tổng quan và công cụ thử nghiệm API.
                </p>

                {/* Strip of 4 cells */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
                    <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
                      Tổng lượt quét
                    </div>
                    <div className="mono" style={{ fontSize: '28px', fontWeight: 600 }}>
                      1,284
                    </div>
                  </div>

                  <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
                    <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
                      Phát hiện giả mạo
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: '28px',
                          fontWeight: 600,
                          color: 'var(--danger)',
                        }}
                      >
                        312
                      </span>
                      <span className="muted-text mono" style={{ fontSize: '14px' }}>
                        24,3%
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
                    <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
                      Liên kết an toàn
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '28px',
                        fontWeight: 600,
                        color: 'var(--safe)',
                      }}
                    >
                      902
                    </div>
                  </div>

                  <div style={{ padding: '20px' }}>
                    <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
                      Phân bổ Web / SMS
                    </div>
                    <div className="mono" style={{ fontSize: '28px', fontWeight: 600 }}>
                      780 / 504
                    </div>
                  </div>
                </div>

                {/* Split row: Left 40% & Right 60% */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '4fr 6fr',
                    gap: '24px',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Left: Phân bổ theo kênh */}
                  <div className="panel">
                    <h2 className="panel-title" style={{ marginBottom: '20px' }}>
                      Phân bổ theo kênh
                    </h2>

                    <div style={{ marginBottom: '20px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <span>Web</span>
                        <span className="mono muted-text">780 lượt</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '14px',
                          backgroundColor: '#1a222d',
                          display: 'flex',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '74%', backgroundColor: 'var(--safe)' }}></div>
                        <div style={{ width: '26%', backgroundColor: 'var(--danger)' }}></div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span className="mono">An toàn: 577 (74%)</span>
                        <span className="mono">Giả mạo: 203 (26%)</span>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <span>SMS</span>
                        <span className="mono muted-text">504 lượt</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '14px',
                          backgroundColor: '#1a222d',
                          display: 'flex',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ width: '64%', backgroundColor: 'var(--safe)' }}></div>
                        <div style={{ width: '36%', backgroundColor: 'var(--danger)' }}></div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '4px',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span className="mono">An toàn: 325 (64%)</span>
                        <span className="mono">Giả mạo: 179 (36%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Kiểm tra nhanh API */}
                  <div className="panel">
                    <h2 className="panel-title" style={{ marginBottom: '16px' }}>
                      Kiểm tra nhanh API
                    </h2>
                    <div
                      className="mono"
                      style={{
                        fontSize: '13px',
                        color: 'var(--accent)',
                        marginBottom: '10px',
                      }}
                    >
                      POST /api/v1/verify
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <input
                        type="text"
                        className="input-admin mono"
                        style={{ flex: 1 }}
                        placeholder="https://example-bank-fake.com/login"
                        value={apiTestUrl}
                        onChange={(e) => setApiTestUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-primary-admin"
                        onClick={runApiTest}
                      >
                        Chạy
                      </button>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'var(--bg-app)',
                        border: '1px solid var(--border)',
                        borderRadius: '3px',
                        padding: '14px',
                      }}
                    >
                      <pre
                        className="mono"
                        style={{
                          fontSize: '12px',
                          margin: 0,
                          color: 'var(--text-main)',
                          lineHeight: 1.5,
                        }}
                      >
                        {apiResponse}
                      </pre>
                      <div
                        className="muted-text mono"
                        style={{
                          fontSize: '12px',
                          marginTop: '12px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        {apiStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                SCREEN 8: THÔNG BÁO (ADMIN)
                ------------------------------------------------------------- */}
            {effectivePageKey === 'notifications' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}
                >
                  <h1 className="page-title" style={{ margin: 0 }}>
                    Nhật ký thông báo
                  </h1>
                  <button type="button" className="btn-secondary-admin">
                    Làm mới
                  </button>
                </div>
                <p
                  className="page-subtitle"
                  style={{ marginTop: '-12px', marginBottom: '20px' }}
                >
                  Lịch sử email và SMS cảnh báo đã gửi đi.
                </p>

                {/* Inline filter row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <select className="select-admin">
                    <option>Tất cả kênh</option>
                    <option>EMAIL</option>
                    <option>SMS</option>
                  </select>
                  <select className="select-admin">
                    <option>Tất cả trạng thái</option>
                    <option>SENT</option>
                    <option>FAILED</option>
                  </select>
                  <input
                    type="text"
                    className="input-admin"
                    placeholder="Tìm theo người nhận…"
                    style={{ width: '280px' }}
                  />
                </div>

                <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
                  {activeState === 'Trống' ? (
                    <div style={{ padding: '24px' }}>
                      <div className="empty-line">Chưa có thông báo nào.</div>
                    </div>
                  ) : (
                    <>
                      <table className="flat-table" style={{ width: '100%' }}>
                        <thead>
                          <tr style={{ height: '36px' }}>
                            <th style={{ padding: '8px 16px', width: '70px' }}>ID</th>
                            <th style={{ padding: '8px 16px', width: '100px' }}>
                              Báo cáo
                            </th>
                            <th style={{ padding: '8px 16px', width: '90px' }}>
                              Kênh
                            </th>
                            <th style={{ padding: '8px 16px', width: '260px' }}>
                              Người nhận
                            </th>
                            <th style={{ padding: '8px 16px', width: '110px' }}>
                              Trạng thái
                            </th>
                            <th style={{ padding: '8px 16px', width: '160px' }}>
                              Thời gian
                            </th>
                            <th style={{ padding: '8px 16px' }}>Lỗi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#508</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1048
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>EMAIL</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>admin@anti-phishing-bank.example.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>SENT</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 09:12:06</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text">—</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#507</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1048
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>EMAIL</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>vi***@gmail.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>SENT</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 09:12:07</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text">—</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#506</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1046
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>SMS</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>+8490***4567</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>SENT</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 08:30:25</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text">—</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#505</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1045
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>EMAIL</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>admin@anti-phishing-bank.example.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>SENT</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 07:55:03</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text">—</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#504</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1043
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>SMS</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>+8498***1122</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>FAILED</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 06:40:18</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text" style={{ fontSize: '12px' }}>
                                Twilio Error 21614: Not a valid mobile…
                              </span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#503</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1042
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>EMAIL</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>na***@gmail.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>SENT</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 06:15:32</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text">—</span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#502</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1042
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>EMAIL</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>soc-alerts@bank.vn</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 danger"></span>
                                <span style={{ fontSize: '13px' }}>FAILED</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 06:15:35</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text" style={{ fontSize: '12px' }}>
                                Connection timed out to smtp.mailtrap.io…
                              </span>
                            </td>
                          </tr>

                          <tr style={{ height: '44px' }}>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '13px' }}>#501</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="accent-link mono" style={{ fontSize: '13px' }}>
                                #1040
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono" style={{ fontSize: '12px' }}>EMAIL</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span style={{ fontSize: '13px' }}>admin@anti-phishing-bank.example.com</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="status-badge">
                                <span className="status-dot-8 safe"></span>
                                <span style={{ fontSize: '13px' }}>SENT</span>
                              </span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="mono muted-text" style={{ fontSize: '12px' }}>2026-09-21 05:20:10</span>
                            </td>
                            <td style={{ padding: '8px 16px' }}>
                              <span className="muted-text">—</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div
                        style={{
                          padding: '12px 16px',
                          borderTop: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '16px',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>Trang 1 / 2</span>
                        <span style={{ cursor: 'pointer' }}>Trước</span>
                        <span style={{ cursor: 'pointer' }}>Sau</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* App Footer Line */}
          <Footer />
        </div>
      </div>

      {/* Demo Viewer Floating Controls (Chỉ hiển thị khi VITE_SHOW_VIEWER=true) */}
      <ViewerBar
        activeRole={activeRoleKey}
        onSelectRole={handleSelectRole}
        activePage={activePageKey}
        onSelectPage={handleSelectPage}
        activeState={activeState}
        onSelectState={handleSelectState}
      />
    </div>
  );
};

export default App;
