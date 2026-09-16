import React, { useState } from 'react';
import { api } from '../api/client';
import { Report, ReportChannel } from '../types/report';
import { ShieldCheck, AlertTriangle, Clock, Send, CheckCircle } from 'lucide-react';

export const ReportFormPage: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [channel, setChannel] = useState<ReportChannel>('WEB');
  const [reporterContact, setReporterContact] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate URL
    if (!targetUrl.trim()) {
      errors.targetUrl = 'Vui lòng nhập đường link cần kiểm tra.';
    } else {
      try {
        const parsed = new URL(targetUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.targetUrl = 'Đường link phải bắt đầu bằng http:// hoặc https://';
        }
      } catch {
        errors.targetUrl = 'Định dạng URL không hợp lệ (ví dụ: https://bank-login.com).';
      }
    }

    // Validate Reporter Contact
    if (!reporterContact.trim()) {
      errors.reporterContact = 'Vui lòng nhập thông tin người báo cáo.';
    } else {
      if (channel === 'WEB') {
        const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(reporterContact.trim())) {
          errors.reporterContact = 'Kênh WEB yêu cầu địa chỉ Email hợp lệ (ví dụ: user@gmail.com).';
        }
      } else if (channel === 'SMS') {
        const phoneRegex = /^(\+?[0-9]{8,15})$/;
        if (!phoneRegex.test(reporterContact.trim())) {
          errors.reporterContact = 'Kênh SMS yêu cầu số điện thoại hợp lệ (ví dụ: 0912345678 hoặc +84912345678).';
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    if (!validateClientSide()) {
      return;
    }

    setLoading(true);
    try {
      const data = await api.createReport({
        targetUrl: targetUrl.trim(),
        channel,
        reporterContact: reporterContact.trim(),
        description: description.trim() || undefined,
      });
      setResult(data);
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 429) {
          setErrorMsg('Bạn đã gửi quá nhiều yêu cầu liên tiếp (Rate limit: 5 req/phút). Vui lòng đợi 1 phút và thử lại.');
        } else if (err.response.data && err.response.data.errors) {
          setValidationErrors(err.response.data.errors);
          setErrorMsg('Dữ liệu không đáp ứng ràng buộc hệ thống. Vui lòng kiểm tra lại các trường.');
        } else {
          setErrorMsg(err.response.data?.message || 'Đã xảy ra lỗi khi gửi báo cáo.');
        }
      } else {
        setErrorMsg('Không thể kết nối tới API Gateway (:8080). Hãy đảm bảo các service đang chạy.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoSafe = () => {
    setTargetUrl('https://portal.vietcombank.com.vn');
    setChannel('WEB');
    setReporterContact('chuyengia.anninh@gmail.com');
    setDescription('Trang chủ chính thức cổng thông tin Vietcombank');
    setValidationErrors({});
    setErrorMsg(null);
  };

  const fillDemoPhishing = () => {
    setTargetUrl('https://example-bank-fake.com/login');
    setChannel('WEB');
    setReporterContact('nan.nhan.lua.dao@gmail.com');
    setDescription('Nhận được tin nhắn yêu cầu bấm link đổi mật khẩu gấp');
    setValidationErrors({});
    setErrorMsg(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Kiểm Tra & Báo Cáo Liên Kết Lừa Đảo</h1>
        <p className="page-subtitle">
          Hệ thống phát hiện mạo danh thương hiệu ngân hàng qua Google Safe Browsing, Phishunt, PhishTank và thông báo thời gian thực qua RabbitMQ.
        </p>

        {/* Demo Fast Fill Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={fillDemoSafe} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <ShieldCheck size={16} color="#10b981" /> Nạp mẫu URL An toàn
          </button>
          <button type="button" onClick={fillDemoPhishing} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            <AlertTriangle size={16} color="#ef4444" /> Nạp mẫu URL Giả mạo
          </button>
        </div>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          {/* Target URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="targetUrl">
              <span>Đường dẫn Website / Tin nhắn nghi vấn (Target URL) <span style={{ color: 'var(--danger)' }}>*</span></span>
            </label>
            <input
              id="targetUrl"
              type="text"
              className="form-control"
              placeholder="https://example-fake-bank.com/login"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
            {validationErrors.targetUrl && (
              <p className="input-error-msg">
                <AlertTriangle size={14} /> {validationErrors.targetUrl}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Channel */}
            <div className="form-group">
              <label className="form-label" htmlFor="channel">
                <span>Kênh tiếp nhận mã độc</span>
              </label>
              <select
                id="channel"
                className="form-control form-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value as ReportChannel)}
              >
                <option value="WEB">Kênh Web (Website / Trình duyệt)</option>
                <option value="SMS">Kênh SMS (Tin nhắn điện thoại)</option>
              </select>
            </div>

            {/* Reporter Contact */}
            <div className="form-group">
              <label className="form-label" htmlFor="reporterContact">
                <span>
                  {channel === 'WEB' ? 'Email người gửi báo cáo' : 'Số điện thoại người gửi báo cáo'}{' '}
                  <span style={{ color: 'var(--danger)' }}>*</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {channel === 'WEB' ? 'Định dạng: user@domain.com' : 'Định dạng: 09x hoặc +84x'}
                </span>
              </label>
              <input
                id="reporterContact"
                type="text"
                className="form-control"
                placeholder={channel === 'WEB' ? 'victim@example.com' : '0912345678'}
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
              />
              {validationErrors.reporterContact && (
                <p className="input-error-msg">
                  <AlertTriangle size={14} /> {validationErrors.reporterContact}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">
              <span>Mô tả ngữ cảnh / Dấu hiệu nghi ngờ (Tùy chọn)</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tối đa 1000 ký tự</span>
            </label>
            <textarea
              id="description"
              className="form-control"
              rows={3}
              placeholder="Ví dụ: Tin nhắn SMS từ đầu số lạ mạo danh ngân hàng yêu cầu truy cập để nhận thưởng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Global Error Banner */}
          {errorMsg && (
            <div style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? (
              <>
                <Clock className="animate-spin" size={18} />
                <span>Đang điều phối phân tích qua Microservices...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Gửi Báo Cáo & Kích Hoạt Phân Tích</span>
              </>
            )}
          </button>
        </form>

        {/* Real-time Result Panel */}
        {result && (
          <div className="result-box" style={{
            background: result.isPhishing
              ? 'rgba(239, 68, 68, 0.12)'
              : result.status === 'PENDING'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${
              result.isPhishing
                ? 'var(--danger-border)'
                : result.status === 'PENDING'
                  ? 'var(--warning-border)'
                  : 'var(--success-border)'
            }`
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {result.isPhishing ? (
                  <AlertTriangle size={28} color="#ef4444" />
                ) : result.status === 'PENDING' ? (
                  <Clock size={28} color="#f59e0b" />
                ) : (
                  <CheckCircle size={28} color="#10b981" />
                )}
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {result.isPhishing
                      ? 'CẢNH BÁO: Phát Hiện Website/SMS Lừa Đảo!'
                      : result.status === 'PENDING'
                        ? 'Đang Tiếp Nhận & Chờ Xử Lý'
                        : 'Kết Quả: Liên Kết Có Vẻ An Toàn'}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Mã báo cáo: #{result.id} • Kênh: {result.channel} • Lúc: {new Date(result.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div>
                {result.isPhishing ? (
                  <span className="badge badge-danger">LỪA ĐẢO / PHISHING</span>
                ) : result.status === 'PENDING' ? (
                  <span className="badge badge-warning">PENDING (ĐANG XỬ LÝ)</span>
                ) : (
                  <span className="badge badge-success">AN TOÀN</span>
                )}
              </div>
            </div>

            {/* Risk Score Progress Bar */}
            {result.riskScore !== null && result.riskScore !== undefined && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Điểm rủi ro (Risk Score)</span>
                  <span style={{ fontWeight: 700 }}>{(result.riskScore * 100).toFixed(0)}%</span>
                </div>
                <div className="risk-bar-bg">
                  <div
                    className="risk-bar-fill"
                    style={{
                      width: `${Math.max(result.riskScore * 100, 5)}%`,
                      backgroundColor: result.riskScore >= 0.5 ? 'var(--danger)' : 'var(--success)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Details and Async info */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <p><strong>URL mục tiêu:</strong> <code style={{ color: 'var(--accent-blue)' }}>{result.targetUrl}</code></p>
              {result.isPhishing && (
                <p style={{ marginTop: '0.5rem', color: 'var(--danger)' }}>
                  Hệ thống đã phát sự kiện <code>ReportCreatedEvent</code> lên hàng đợi RabbitMQ. Dịch vụ thông báo đang tự động gửi email cảnh báo tới quản trị viên.
                </p>
              )}
              {result.status === 'PENDING' && (
                <p style={{ marginTop: '0.5rem', color: 'var(--warning)' }}>
                  Hệ thống kiểm tra bên ngoài phản hồi chậm hoặc đang bảo trì. Báo cáo đã được lưu an toàn vào cơ sở dữ liệu để tiếp tục xử lý.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
