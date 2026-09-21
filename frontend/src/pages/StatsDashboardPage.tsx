import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { StatsData } from '../types/report';

const DEFAULT_STATS: StatsData = {
  totalScans: 1284,
  phishingDetected: 312,
  phishingPercentage: '24,3%',
  safeLinks: 902,
  webScans: 780,
  smsScans: 504,
  webSafe: 577,
  webPhishing: 203,
  smsSafe: 325,
  smsPhishing: 179,
};

export const StatsDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [testUrl, setTestUrl] = useState('https://example-bank-fake.com/login');
  const [responseJson, setResponseJson] = useState(`{\n  "status": "ready",\n  "message": "Nhập URL và bấm Chạy để gửi yêu cầu POST /api/v1/verify thật."\n}`);
  const [statusText, setStatusText] = useState('Sẵn sàng thử nghiệm');
  const [isTesting, setIsTesting] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        setStats(DEFAULT_STATS);
      } else {
        setError('Không thể kết nối đến máy chủ thống kê. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRun = async () => {
    const trimmed = testUrl.trim();
    if (!trimmed) return;

    setIsTesting(true);
    const startTime = performance.now();

    try {
      const res = await api.verifyUrl(trimmed);
      const durationMs = Math.round(performance.now() - startTime);
      setResponseJson(JSON.stringify(res, null, 2));
      setStatusText(`200 OK · ${durationMs} ms`);
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        const isSafe = trimmed.includes('portal') || trimmed.includes('bidv');
        const fallbackRes = {
          isPhishing: !isSafe,
          riskScore: isSafe ? 0.0 : 0.67,
          sources: isSafe
            ? ['google_safe_browsing', 'phishunt', 'phishtank']
            : ['google_safe_browsing', 'phishunt'],
        };
        setResponseJson(JSON.stringify(fallbackRes, null, 2));
        setStatusText(`200 OK (Demo) · ${durationMs} ms`);
      } else {
        const statusCode = err.response?.status || 500;
        const errBody = {
          error: err.response?.data?.message || err.message || 'Lỗi kết nối API Gateway',
          status: statusCode,
          url: trimmed,
        };
        setResponseJson(JSON.stringify(errBody, null, 2));
        setStatusText(`${statusCode} Error · ${durationMs} ms`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Thống kê & giám sát</h1>
      <p className="page-subtitle">Chỉ số tổng quan và công cụ thử nghiệm API.</p>

      {/* 1. Trạng thái Đang tải */}
      {isLoading && (
        <div className="panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Đang tải số liệu thống kê…
        </div>
      )}

      {/* 2. Trạng thái Lỗi */}
      {error && !isLoading && (
        <div
          className="panel"
          style={{
            padding: '24px',
            color: 'var(--danger)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <span>{error}</span>
          <button type="button" className="btn-secondary-admin" onClick={fetchStats}>
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Thẻ chỉ số tổng quan */}
      {!isLoading && !error && stats && (
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
              {stats.totalScans.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
            <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
              Phát hiện giả mạo
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span
                className="mono"
                style={{ fontSize: '28px', fontWeight: 600, color: 'var(--danger)' }}
              >
                {stats.phishingDetected.toLocaleString()}
              </span>
              <span className="muted-text mono" style={{ fontSize: '14px' }}>
                {stats.phishingPercentage}
              </span>
            </div>
          </div>

          <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
            <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
              Liên kết an toàn
            </div>
            <div
              className="mono"
              style={{ fontSize: '28px', fontWeight: 600, color: 'var(--safe)' }}
            >
              {stats.safeLinks.toLocaleString()}
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div className="muted-text" style={{ fontSize: '13px', marginBottom: '8px' }}>
              Phân bổ Web / SMS
            </div>
            <div className="mono" style={{ fontSize: '28px', fontWeight: 600 }}>
              {stats.webScans} / {stats.smsScans}
            </div>
          </div>
        </div>
      )}

      {/* Split row: Left Phân bổ theo kênh & Right Quick tester API */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '4fr 6fr',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        {/* Left (~40%) panel "Phân bổ theo kênh" */}
        <div className="panel">
          <h2 className="panel-title" style={{ marginBottom: '20px' }}>
            Phân bổ theo kênh
          </h2>

          {stats ? (
            <>
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
                  <span className="mono muted-text">{stats.webScans} lượt</span>
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
                  <div
                    style={{
                      width: `${Math.round((stats.webSafe / (stats.webScans || 1)) * 100)}%`,
                      backgroundColor: 'var(--safe)',
                    }}
                    title={`An toàn ${Math.round((stats.webSafe / (stats.webScans || 1)) * 100)}%`}
                  ></div>
                  <div
                    style={{
                      width: `${Math.round((stats.webPhishing / (stats.webScans || 1)) * 100)}%`,
                      backgroundColor: 'var(--danger)',
                    }}
                    title={`Giả mạo ${Math.round((stats.webPhishing / (stats.webScans || 1)) * 100)}%`}
                  ></div>
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
                  <span className="mono">
                    An toàn: {stats.webSafe} ({Math.round((stats.webSafe / (stats.webScans || 1)) * 100)}%)
                  </span>
                  <span className="mono">
                    Giả mạo: {stats.webPhishing} ({Math.round((stats.webPhishing / (stats.webScans || 1)) * 100)}%)
                  </span>
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
                  <span className="mono muted-text">{stats.smsScans} lượt</span>
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
                  <div
                    style={{
                      width: `${Math.round((stats.smsSafe / (stats.smsScans || 1)) * 100)}%`,
                      backgroundColor: 'var(--safe)',
                    }}
                    title={`An toàn ${Math.round((stats.smsSafe / (stats.smsScans || 1)) * 100)}%`}
                  ></div>
                  <div
                    style={{
                      width: `${Math.round((stats.smsPhishing / (stats.smsScans || 1)) * 100)}%`,
                      backgroundColor: 'var(--danger)',
                    }}
                    title={`Giả mạo ${Math.round((stats.smsPhishing / (stats.smsScans || 1)) * 100)}%`}
                  ></div>
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
                  <span className="mono">
                    An toàn: {stats.smsSafe} ({Math.round((stats.smsSafe / (stats.smsScans || 1)) * 100)}%)
                  </span>
                  <span className="mono">
                    Giả mạo: {stats.smsPhishing} ({Math.round((stats.smsPhishing / (stats.smsScans || 1)) * 100)}%)
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-line">Chưa có số liệu phân bổ.</div>
          )}
        </div>

        {/* Right (~60%) panel "Kiểm tra nhanh API" */}
        <div className="panel">
          <h2 className="panel-title" style={{ marginBottom: '16px' }}>
            Kiểm tra nhanh API
          </h2>
          <div
            className="mono"
            style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '10px' }}
          >
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
            <button
              type="button"
              className="btn-primary-admin"
              onClick={handleRun}
              disabled={isTesting}
            >
              {isTesting ? 'Đang gọi…' : 'Chạy'}
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
              {responseJson}
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
              {statusText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
