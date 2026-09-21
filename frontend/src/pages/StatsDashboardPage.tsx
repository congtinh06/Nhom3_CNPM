import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const StatsDashboardPage: React.FC = () => {
  const [testUrl, setTestUrl] = useState('https://example-bank-fake.com/login');
  const [responseJson, setResponseJson] = useState(`{
  "isPhishing": true,
  "riskScore": 0.67,
  "sources": [
    "google_safe_browsing",
    "phishunt"
  ]
}`);
  const [statusText, setStatusText] = useState('200 OK · 412 ms');

  const handleRun = () => {
    if (testUrl.includes('portal') || testUrl.includes('bidv')) {
      setResponseJson(`{
  "isPhishing": false,
  "riskScore": 0.00,
  "sources": [
    "google_safe_browsing",
    "phishunt",
    "phishtank"
  ]
}`);
      setStatusText('200 OK · 218 ms');
    } else {
      setResponseJson(`{
  "isPhishing": true,
  "riskScore": 0.67,
  "sources": [
    "google_safe_browsing",
    "phishunt"
  ]
}`);
      setStatusText('200 OK · 412 ms');
    }
  };

  return (
    <div className="canvas-stack">
      {/* =========================================================================
          RUN 4: SCREEN "Thống kê" — 1 FRAME
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="ADMIN" activeTab="Thống kê" />
        <main className="page-content">
          <h1 className="page-title">Thống kê & giám sát</h1>
          <p className="page-subtitle">Chỉ số tổng quan và công cụ thử nghiệm API.</p>

          {/* ONE horizontal strip of 4 cells separated by 1px vertical dividers */}
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
                <span className="mono" style={{ fontSize: '28px', fontWeight: 600, color: 'var(--danger)' }}>
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
              <div className="mono" style={{ fontSize: '28px', fontWeight: 600, color: 'var(--safe)' }}>
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

          {/* Below, a split row. Left (~40%) panel, Right (~60%) panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '4fr 6fr', gap: '24px', alignItems: 'flex-start' }}>
            {/* Left (~40%) panel "Phân bổ theo kênh" */}
            <div className="panel">
              <h2 className="panel-title" style={{ marginBottom: '20px' }}>
                Phân bổ theo kênh
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span>Web</span>
                  <span className="mono muted-text">780 lượt</span>
                </div>
                <div style={{ width: '100%', height: '14px', backgroundColor: '#1a222d', display: 'flex', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '74%', backgroundColor: 'var(--safe)' }} title="An toàn 74%"></div>
                  <div style={{ width: '26%', backgroundColor: 'var(--danger)' }} title="Giả mạo 26%"></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span className="mono">An toàn: 577 (74%)</span>
                  <span className="mono">Giả mạo: 203 (26%)</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span>SMS</span>
                  <span className="mono muted-text">504 lượt</span>
                </div>
                <div style={{ width: '100%', height: '14px', backgroundColor: '#1a222d', display: 'flex', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '64%', backgroundColor: 'var(--safe)' }} title="An toàn 64%"></div>
                  <div style={{ width: '36%', backgroundColor: 'var(--danger)' }} title="Giả mạo 36%"></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span className="mono">An toàn: 325 (64%)</span>
                  <span className="mono">Giả mạo: 179 (36%)</span>
                </div>
              </div>
            </div>

            {/* Right (~60%) panel "Kiểm tra nhanh API" */}
            <div className="panel">
              <h2 className="panel-title" style={{ marginBottom: '16px' }}>
                Kiểm tra nhanh API
              </h2>
              <div className="mono" style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '10px' }}>
                POST /api/v1/verify
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  className="input-admin mono"
                  style={{ flex: 1 }}
                  placeholder="https://example-bank-fake.com/login"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                />
                <button type="button" className="btn-primary-admin" onClick={handleRun}>
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
                <pre className="mono" style={{ fontSize: '12px', margin: 0, color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {responseJson}
                </pre>
                <div className="muted-text mono" style={{ fontSize: '12px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  {statusText}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
