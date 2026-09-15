import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Report, VerifyUrlResponse } from '../types/report';
import { ShieldAlert, ShieldCheck, Activity, Radio, Cpu, CheckCircle2 } from 'lucide-react';

export const StatsDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [testUrl, setTestUrl] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyUrlResponse | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    api.getReports().then(setReports).catch(console.error);
  }, []);

  const totalScans = reports.length;
  const phishingCount = reports.filter((r) => r.isPhishing === true).length;
  const safeCount = reports.filter((r) => r.isPhishing === false).length;
  const phishingRate = totalScans > 0 ? ((phishingCount / totalScans) * 100).toFixed(1) : '0.0';
  const webReports = reports.filter((r) => r.channel === 'WEB').length;
  const smsReports = reports.filter((r) => r.channel === 'SMS').length;

  const handleDirectScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyUrl(testUrl.trim());
      setVerifyResult(res);
    } catch (err) {
      console.error('Lỗi khi quét trực tiếp:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Bảng Thống Kê & Giám Sát Hệ Thống</h1>
        <p className="page-subtitle">
          Theo dõi tổng quan chỉ số an ninh thông tin và chạy công cụ thử nghiệm trực tiếp API liên kết.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="stat-value">{totalScans}</div>
            <div className="stat-label">Tổng lượt quét & báo cáo</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{phishingCount}</div>
            <div className="stat-label">Phát hiện giả mạo ({phishingRate}%)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{safeCount}</div>
            <div className="stat-label">Liên kết xác định an toàn</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Radio size={24} />
          </div>
          <div>
            <div className="stat-value">{webReports} / {smsReports}</div>
            <div className="stat-label">Phân bổ Kênh Web / SMS</div>
          </div>
        </div>
      </div>

      {/* Direct API Verification Sandbox */}
      <div className="glass-card" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Cpu size={24} color="#3b82f6" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Sandbox Thử Nghiệm Trực Tiếp Link Verification API</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Gọi trực tiếp tới <code>POST /api/v1/verify</code> thông qua Spring Cloud Gateway (:8080)
            </p>
          </div>
        </div>

        <form onSubmit={handleDirectScan} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="url"
            className="form-control"
            style={{ flex: '1 1 320px' }}
            placeholder="Nhập URL để test ngay (ví dụ: https://example-bank-fake.com/login)"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={verifying}>
            {verifying ? 'Đang phân tích...' : 'Quét Trực Tiếp'}
          </button>
        </form>

        {verifyResult && (
          <div className="result-box" style={{
            marginTop: '1.25rem',
            background: verifyResult.isPhishing ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${verifyResult.isPhishing ? 'var(--danger-border)' : 'var(--success-border)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {verifyResult.isPhishing ? (
                  <ShieldAlert color="#ef4444" size={22} />
                ) : (
                  <CheckCircle2 color="#10b981" size={22} />
                )}
                <strong>Domain: {verifyResult.domain}</strong>
              </div>
              <span className={`badge ${verifyResult.isPhishing ? 'badge-danger' : 'badge-success'}`}>
                {verifyResult.isPhishing ? 'PHISHING CONFIRMED' : 'CLEAN'}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>Điểm rủi ro:</strong> {(verifyResult.riskScore * 100).toFixed(0)}% •{' '}
              <strong>Nguồn dữ liệu kiểm tra:</strong>{' '}
              {verifyResult.sources && verifyResult.sources.length > 0
                ? verifyResult.sources.join(', ')
                : 'Không có nguồn nào gắn cờ'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
