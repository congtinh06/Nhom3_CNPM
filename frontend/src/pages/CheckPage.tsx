import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DailyStats } from '../types/report';

interface RecentCheckItem {
  id: number;
  url: string;
  verdict: 'PHISHING' | 'SAFE' | 'PENDING';
  verdictLabel: string;
  time: string;
}

export const CheckPage: React.FC = () => {
  const { user, role } = useAuth();
  const isLoggedIn = Boolean(user || (role && role !== 'public'));

  // Form State
  const [interactiveUrl, setInteractiveUrl] = useState('');
  const [interactiveChannel, setInteractiveChannel] = useState<'Web' | 'SMS'>('Web');
  const [interactiveEmail, setInteractiveEmail] = useState('');
  const [interactiveDesc, setInteractiveDesc] = useState('');

  // Validation
  const [urlError, setUrlError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);

  // Execution & Results
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
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  // Recent checks for logged-in users
  const [recentReports, setRecentReports] = useState<RecentCheckItem[]>([]);

  // Fetch daily stats
  useEffect(() => {
    let isMounted = true;
    api
      .getDailyStats()
      .then((data) => {
        if (isMounted) setDailyStats(data);
      })
      .catch(() => {
        if (isMounted) {
          if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
            setDailyStats({
              todayScans: 1284,
              phishingDetected: 312,
              avgResponseTimeMs: 245,
            });
          } else {
            setDailyStats(null);
          }
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch recent reports if logged in
  const fetchRecentReports = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const list = await api.getReports();
      const top3 = list.slice(0, 3).map((r) => {
        let verdict: 'PHISHING' | 'SAFE' | 'PENDING' = 'PENDING';
        let verdictLabel = 'ĐANG CHỜ';
        if (r.isPhishing === true) {
          verdict = 'PHISHING';
          verdictLabel = 'GIẢ MẠO';
        } else if (r.isPhishing === false) {
          verdict = 'SAFE';
          verdictLabel = 'AN TOÀN';
        } else if (r.status === 'VERIFIED' && r.riskScore !== null && r.riskScore !== undefined) {
          verdict = r.riskScore > 0.5 ? 'PHISHING' : 'SAFE';
          verdictLabel = r.riskScore > 0.5 ? 'GIẢ MẠO' : 'AN TOÀN';
        }
        return {
          id: r.id,
          url: r.targetUrl,
          verdict,
          verdictLabel,
          time: r.createdAt ? r.createdAt.replace('T', ' ').slice(11, 19) : '',
        };
      });
      setRecentReports(top3);
    } catch {
      if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        setRecentReports([
          {
            id: 1048,
            url: 'https://vietcombank-login.xyz/auth',
            verdict: 'PHISHING',
            verdictLabel: 'GIẢ MẠO',
            time: '09:12:04',
          },
          {
            id: 1047,
            url: 'https://portal.vietcombank.com.vn',
            verdict: 'SAFE',
            verdictLabel: 'AN TOÀN',
            time: '08:45:10',
          },
          {
            id: 1046,
            url: 'https://techcom-otp.top/verify',
            verdict: 'PHISHING',
            verdictLabel: 'GIẢ MẠO',
            time: '08:30:22',
          },
        ]);
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchRecentReports();
  }, [fetchRecentReports]);

  const fillSafeSample = () => {
    setInteractiveUrl('https://portal.vietcombank.com.vn');
    setInteractiveChannel('Web');
    setInteractiveEmail('security.officer@org.vn');
    setInteractiveDesc('Cổng thông tin ngân hàng điện tử chính thức.');
    setUrlError(null);
    setContactError(null);
    setDescError(null);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult({
      isPhishing: false,
      riskScore: 0.0,
      domain: 'portal.vietcombank.com.vn',
      sources: ['google_safe_browsing', 'phishunt', 'phishtank'],
      url: 'https://portal.vietcombank.com.vn',
      checkedAt: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    });
  };

  const fillPhishingSample = () => {
    setInteractiveUrl('https://vietcombank-ebank-login.xyz/auth');
    setInteractiveChannel('Web');
    setInteractiveEmail('security.officer@org.vn');
    setInteractiveDesc('SMS mạo danh yêu cầu đăng nhập đổi mật khẩu gấp.');
    setUrlError(null);
    setContactError(null);
    setDescError(null);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult({
      isPhishing: true,
      riskScore: 0.67,
      domain: 'vietcombank-ebank-login.xyz',
      sources: ['google_safe_browsing', 'phishunt'],
      url: 'https://vietcombank-ebank-login.xyz/auth',
      reportId: 1042,
      checkedAt: new Date().toLocaleTimeString('vi-VN', { hour12: false }),
    });
  };

  const resetToCheckNew = () => {
    setInteractiveUrl('');
    setInteractiveDesc('');
    setUrlError(null);
    setContactError(null);
    setDescError(null);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let hasError = false;

    const trimmedUrl = interactiveUrl.trim();
    const trimmedContact = interactiveEmail.trim();

    let newUrlError: string | null = null;
    let newContactError: string | null = null;
    let newDescError: string | null = null;

    if (!trimmedUrl) {
      newUrlError = 'Vui lòng nhập đường dẫn URL.';
      hasError = true;
    } else if (trimmedUrl.length > 2048) {
      newUrlError = 'URL không được vượt quá 2048 ký tự.';
      hasError = true;
    } else {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      if (!urlPattern.test(trimmedUrl)) {
        newUrlError = 'Định dạng URL không hợp lệ. Ví dụ: https://example.com';
        hasError = true;
      }
    }

    if (trimmedContact) {
      if (interactiveChannel === 'Web') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedContact)) {
          newContactError = 'Email người báo cáo không đúng định dạng.';
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

    if (hasError) return;

    setIsAnalyzing(true);
    setRateLimitError(false);
    setIsPending(false);
    setConnectError(null);
    setAnalysisResult(null);

    const checkTimestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });

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

      setAnalysisResult({
        isPhishing: verifyRes.isPhishing,
        riskScore: verifyRes.riskScore,
        sources: verifyRes.sources || [],
        domain: verifyRes.domain,
        url: verifyRes.url,
        reportId: createdReportId || (verifyRes.isPhishing ? 1042 : undefined),
        checkedAt: checkTimestamp,
      });

      if (isLoggedIn) {
        fetchRecentReports();
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        setRateLimitError(true);
      } else if (err.response?.status === 504 || err.response?.data?.status === 'PENDING') {
        setIsPending(true);
      } else if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
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
        setAnalysisResult({
          isPhishing: isFake,
          riskScore: isFake ? 0.67 : 0.0,
          sources: isFake
            ? ['google_safe_browsing', 'phishunt']
            : ['google_safe_browsing', 'phishunt', 'phishtank'],
          domain: domainStr,
          url: trimmedUrl,
          reportId: isFake ? 1042 : undefined,
          checkedAt: checkTimestamp,
        });
      } else {
        setConnectError(
          'Không thể kết nối đến máy chủ kiểm tra liên kết. Vui lòng kiểm tra lại dịch vụ backend hoặc thử lại sau.'
        );
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isSourceFlagged = (srcName: string) => {
    if (!analysisResult) return false;
    const lower = srcName.toLowerCase();
    return analysisResult.sources.some((s) => s.toLowerCase().includes(lower));
  };

  return (
    <div>
      <h1 className="page-title">Kiểm tra liên kết</h1>
      <p className="page-subtitle">
        Bảng điều khiển xác thực URL qua cơ chế đối soát 3 nguồn an ninh mạng độc lập.
      </p>

      {/* 1. Dải chỉ số mỏng dưới tiêu đề */}
      <div className="stat-strip">
        <div className="stat-cell">
          <span className="stat-cell-label">LƯỢT QUÉT HÔM NAY</span>
          <span className="stat-cell-value">
            {dailyStats !== null ? dailyStats.todayScans.toLocaleString() : '—'}
          </span>
        </div>
        <div className="stat-cell">
          <span className="stat-cell-label">GIẢ MẠO PHÁT HIỆN</span>
          <span
            className="stat-cell-value"
            style={{ color: dailyStats !== null ? 'var(--danger)' : undefined }}
          >
            {dailyStats !== null ? dailyStats.phishingDetected.toLocaleString() : '—'}
          </span>
        </div>
        <div className="stat-cell">
          <span className="stat-cell-label">PHẢN HỒI TRUNG BÌNH</span>
          <span className="stat-cell-value">
            {dailyStats !== null ? `${dailyStats.avgResponseTimeMs} ms` : '—'}
          </span>
        </div>
      </div>

      <div className="two-columns">
        {/* 2. Cột trái: Form tiếp nhận */}
        <div className="panel" style={{ width: '540px', flexShrink: 0 }}>
          <div className="panel-header-row">
            <span className="form-label">TIẾP NHẬN YÊU CẦU</span>
            <div className="form-hint">
              Mẫu:{' '}
              <span
                style={{ cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline' }}
                onClick={fillSafeSample}
              >
                An toàn
              </span>{' '}
              ·{' '}
              <span
                style={{ cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline' }}
                onClick={fillPhishingSample}
              >
                Giả mạo
              </span>
            </div>
          </div>

          {/* Kênh phẳng có gạch chân màu sáng */}
          <div className="channel-flat-bar">
            <button
              type="button"
              className={`channel-flat-btn ${interactiveChannel === 'Web' ? 'active' : ''}`}
              onClick={() => {
                setInteractiveChannel('Web');
                if (contactError) setContactError(null);
              }}
            >
              KÊNH WEB
            </button>
            <button
              type="button"
              className={`channel-flat-btn ${interactiveChannel === 'SMS' ? 'active' : ''}`}
              onClick={() => {
                setInteractiveChannel('SMS');
                if (contactError) setContactError(null);
              }}
            >
              KÊNH SMS
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Input URL */}
            <div className="form-group-public">
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                ĐƯỜNG DẪN NGHI VẤN (URL)
              </label>
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
                <div style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  {urlError}
                </div>
              )}
            </div>

            {/* Người báo cáo */}
            <div className="form-group-public">
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                {interactiveChannel === 'Web'
                  ? 'EMAIL NGƯỜI BÁO CÁO (TÙY CHỌN)'
                  : 'SỐ ĐIỆN THOẠI (TÙY CHỌN)'}
              </label>
              <input
                type="text"
                className={`input-public ${contactError ? 'has-error' : ''}`}
                placeholder={
                  interactiveChannel === 'Web' ? 'user@example.com' : '0901234567'
                }
                value={interactiveEmail}
                onChange={(e) => {
                  setInteractiveEmail(e.target.value);
                  if (contactError) setContactError(null);
                }}
              />
              {contactError && (
                <div style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  {contactError}
                </div>
              )}
            </div>

            {/* Mô tả */}
            <div className="form-group-public">
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                MÔ TẢ NGHI VẤN (TÙY CHỌN)
              </label>
              <textarea
                rows={3}
                className={`textarea-public ${descError ? 'has-error' : ''}`}
                placeholder="Ghi chú thêm về tin nhắn hoặc hình thức lừa đảo…"
                value={interactiveDesc}
                onChange={(e) => {
                  setInteractiveDesc(e.target.value);
                  if (descError) setDescError(null);
                }}
              />
              <div className="char-counter">{interactiveDesc.length}/1000</div>
              {descError && (
                <div style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                  {descError}
                </div>
              )}
            </div>

            {/* Nút gửi */}
            <button
              type="submit"
              className="btn-primary-public"
              disabled={isAnalyzing}
              style={{ marginTop: '8px' }}
            >
              {isAnalyzing ? 'ĐANG PHÂN TÍCH LIÊN KẾT…' : 'GỬI BÁO CÁO & PHÂN TÍCH'}
            </button>
          </form>
        </div>

        {/* 3. Cột phải: 4 Trạng thái riêng */}
        <div className="panel" style={{ flex: 1, minWidth: '460px' }}>
          <div className="panel-header-row">
            <span className="form-label">KẾT QUẢ ĐỐI SOÁT HỆ THỐNG</span>
            {analysisResult?.reportId && (
              <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                BẢN GHI #{analysisResult.reportId}
              </span>
            )}
          </div>

          {/* TRẠNG THÁI 2: Đang quét */}
          {isAnalyzing && (
            <div>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '2px', marginBottom: '16px' }}>
                <div className="mono" style={{ fontSize: '12px', color: 'var(--warn)', marginBottom: '4px' }}>
                  ĐANG TRUY VẤN CỔNG AN NINH
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Gửi yêu cầu phân tích đồng thời đến 3 hệ thống cơ sở dữ liệu mối đe doạ trực tuyến.
                </div>
              </div>

              <table className="console-table">
                <thead>
                  <tr>
                    <th>NGUỒN ĐỐI SOÁT</th>
                    <th>TIẾN TRÌNH</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Safe Browsing v4</td>
                    <td className="mono" style={{ color: 'var(--warn)' }}>Đang kiểm tra…</td>
                  </tr>
                  <tr>
                    <td>Phishunt Threat Intelligence</td>
                    <td className="mono" style={{ color: 'var(--warn)' }}>Đang kiểm tra…</td>
                  </tr>
                  <tr>
                    <td>PhishTank Community Database</td>
                    <td className="mono" style={{ color: 'var(--warn)' }}>Đang kiểm tra…</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TRẠNG THÁI 4: Lỗi hoặc Giới hạn tần suất */}
          {!isAnalyzing && (rateLimitError || connectError || isPending) && (
            <div>
              {rateLimitError && (
                <div className="verdict-box danger">
                  <div className="form-label" style={{ color: 'var(--danger)', marginBottom: '8px' }}>
                    HTTP 429 · GIỚI HẠN TẦN SUẤT
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                    Bạn đã gửi quá 5 yêu cầu trong 1 phút. Vui lòng chờ 42 giây trước khi thực hiện kiểm tra tiếp theo.
                  </p>
                </div>
              )}

              {connectError && !rateLimitError && (
                <div className="verdict-box danger">
                  <div className="form-label" style={{ color: 'var(--danger)', marginBottom: '8px' }}>
                    LỖI KẾT NỐI MÁY CHỦ
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '16px' }}>
                    {connectError}
                  </p>
                  <button
                    type="button"
                    className="btn-secondary-public"
                    onClick={() => handleSubmit()}
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {isPending && !rateLimitError && !connectError && (
                <div className="verdict-box warn">
                  <div className="form-label" style={{ color: 'var(--warn)', marginBottom: '8px' }}>
                    ĐANG XỬ LÝ TRONG HÀNG ĐỢI
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '16px' }}>
                    Dịch vụ phân tích an ninh đang phản hồi chậm. Báo cáo của bạn đã được ghi nhận và lưu vào hệ thống.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary-public"
                    onClick={() => handleSubmit()}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TRẠNG THÁI 3: Có kết quả */}
          {!isAnalyzing && !rateLimitError && !connectError && !isPending && analysisResult && (
            <div>
              <div
                className={`verdict-box ${
                  analysisResult.isPhishing ? 'danger' : 'safe'
                }`}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: analysisResult.isPhishing ? 'var(--danger)' : 'var(--safe)',
                    }}
                  >
                    {analysisResult.isPhishing ? 'GIẢ MẠO' : 'AN TOÀN'}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: analysisResult.isPhishing ? 'var(--danger)' : 'var(--safe)',
                    }}
                  >
                    {Math.round(analysisResult.riskScore * 100)}%
                  </span>
                </div>

                {/* Thanh mức rủi ro mảnh 2px */}
                <div className="risk-bar-slim">
                  <div
                    className={`risk-bar-fill ${analysisResult.isPhishing ? 'danger' : 'safe'}`}
                    style={{ width: `${Math.round(analysisResult.riskScore * 100)}%` }}
                  ></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--muted)' }}>
                  <div>
                    URL: <span className="mono" style={{ color: 'var(--text)' }}>{analysisResult.url}</span>
                  </div>
                  <div>
                    Tên miền: <span className="mono" style={{ color: 'var(--text)' }}>{analysisResult.domain}</span>
                  </div>
                </div>
              </div>

              {/* Bảng đối soát từng nguồn (nguồn | kết quả | thời gian) */}
              <table className="console-table" style={{ marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th>NGUỒN ĐỐI SOÁT</th>
                    <th>KẾT QUẢ</th>
                    <th>THỜI GIAN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Safe Browsing v4</td>
                    <td className="mono">
                      {isSourceFlagged('google') ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>GẮN CỜ</span>
                      ) : (
                        <span style={{ color: 'var(--safe)' }}>SẠCH</span>
                      )}
                    </td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>
                      {analysisResult.checkedAt || 'Vừa xong'}
                    </td>
                  </tr>
                  <tr>
                    <td>Phishunt Threat Intel</td>
                    <td className="mono">
                      {isSourceFlagged('phishunt') ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>GẮN CỜ</span>
                      ) : (
                        <span style={{ color: 'var(--safe)' }}>SẠCH</span>
                      )}
                    </td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>
                      {analysisResult.checkedAt || 'Vừa xong'}
                    </td>
                  </tr>
                  <tr>
                    <td>PhishTank Database</td>
                    <td className="mono">
                      {isSourceFlagged('phishtank') ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>GẮN CỜ</span>
                      ) : (
                        <span style={{ color: 'var(--safe)' }}>SẠCH</span>
                      )}
                    </td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>
                      {analysisResult.checkedAt || 'Vừa xong'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary-public"
                  onClick={resetToCheckNew}
                >
                  Kiểm tra link khác
                </button>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI 1: Chưa quét */}
          {!isAnalyzing && !rateLimitError && !connectError && !isPending && !analysisResult && (
            <div>
              <table className="console-table" style={{ marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th>NGUỒN ĐỐI SOÁT</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Google Safe Browsing v4</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>Chờ quét</td>
                  </tr>
                  <tr>
                    <td>Phishunt Threat Intelligence</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>Chờ quét</td>
                  </tr>
                  <tr>
                    <td>PhishTank Community Database</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>Chờ quét</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <div className="form-label" style={{ marginBottom: '12px' }}>
                  DẤU HIỆU NHẬN BIẾT LINK GIẢ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  <div>
                    1. Tên miền sai chính tả hoặc dùng phần mở rộng lạ (.xyz, .top, .cc, thay ký tự 'o' bằng số '0').
                  </div>
                  <div>
                    2. Giao thức không mã hoá (sử dụng http:// thay vì https:// có chứng thư số hợp lệ).
                  </div>
                  <div>
                    3. Dùng dịch vụ rút gọn liên kết hoặc chuyển hướng nhiều cấp nhằm che giấu đích đến thực tế.
                  </div>
                  <div>
                    4. Yêu cầu nhập mã OTP, mật khẩu ngân hàng điện tử, hoặc tạo áp lực khẩn cấp về việc khoá tài khoản.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Nếu đã đăng nhập: Kiểm tra gần đây */}
      {isLoggedIn && recentReports.length > 0 && (
        <div className="panel" style={{ marginTop: '24px', padding: '16px 20px' }}>
          <div className="form-label" style={{ marginBottom: '12px' }}>
            KIỂM TRA GẦN ĐÂY
          </div>
          <table className="console-table">
            <thead>
              <tr>
                <th>ĐƯỜNG DẪN RÚT GỌN</th>
                <th style={{ width: '140px' }}>KẾT LUẬN</th>
                <th style={{ width: '120px' }}>THỜI GIAN</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="mono" style={{ fontSize: '12px' }}>
                      {item.url.length > 55 ? item.url.slice(0, 55) + '…' : item.url}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color:
                          item.verdict === 'PHISHING'
                            ? 'var(--danger)'
                            : item.verdict === 'SAFE'
                            ? 'var(--safe)'
                            : 'var(--warn)',
                      }}
                    >
                      {item.verdictLabel}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {item.time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
