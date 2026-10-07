import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { normalizeApiError } from '../api/errors';
import { AnalyticsSummaryResponse } from '../types';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [adminKey, setAdminKey] = useState('');
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFetchSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setErrorMsg('Vui lòng nhập khóa quản trị.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    api
      .getAnalyticsSummary(adminKey.trim())
      .then((data) => {
        setSummary(data);
      })
      .catch((err: unknown) => {
        const norm = normalizeApiError(err);
        if (norm.status === 401) {
          setErrorMsg('Sai khóa quản trị.');
        } else {
          setErrorMsg(norm.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <section className="s sp" style={{ minHeight: '70vh', marginTop: 80 }}>
      <h2>Thống kê & Quản trị</h2>
      <p style={{ marginBottom: 16 }}>
        Bảng theo dõi lượt quét mã QR, lượt nghe thuyết minh và các điểm du lịch được tương tác nhiều nhất.
      </p>

      <form onSubmit={handleFetchSummary} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          type="password"
          placeholder="Nhập khóa quản trị (X-Admin-Key)..."
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ flex: '1 1 240px', padding: '10px 14px', border: '2px solid var(--brown)', borderRadius: 999 }}
        />
        <button type="submit" className="tb" disabled={loading}>
          {loading ? 'Đang xác thực...' : 'Xem báo cáo thống kê'}
        </button>
      </form>

      {errorMsg && (
        <div style={{ padding: 12, background: '#fcebe6', border: '1px solid #c0392b', borderRadius: 12, marginBottom: 20 }}>
          <p style={{ color: '#c0392b' }}>{errorMsg}</p>
        </div>
      )}

      {loading && <p className="cn">Đang tải số liệu thống kê...</p>}

      {summary && (
        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, background: 'var(--cream)', borderRadius: 16, border: '2px solid var(--brown)' }}>
              <span style={{ fontSize: 13, textTransform: 'uppercase', color: '#666' }}>Tổng lượt quét QR</span>
              <h3 style={{ fontSize: 36, margin: '8px 0 0', color: 'var(--brown)' }}>{summary.totalScans}</h3>
            </div>
            <div style={{ padding: 20, background: 'var(--cream)', borderRadius: 16, border: '2px solid var(--brown)' }}>
              <span style={{ fontSize: 13, textTransform: 'uppercase', color: '#666' }}>Tổng lượt nghe Audio</span>
              <h3 style={{ fontSize: 36, margin: '8px 0 0', color: 'var(--brown)' }}>{summary.totalAudioPlays}</h3>
            </div>
            <div style={{ padding: 20, background: 'var(--cream)', borderRadius: 16, border: '2px solid var(--brown)' }}>
              <span style={{ fontSize: 13, textTransform: 'uppercase', color: '#666' }}>Lượt nghe hoàn tất</span>
              <h3 style={{ fontSize: 36, margin: '8px 0 0', color: 'var(--brown)' }}>{summary.audioCompleted}</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ padding: 16, border: '1px solid #d9c9a3', borderRadius: 14, background: '#fff' }}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--brown)' }}>Lượt quét theo nguồn kích hoạt</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {Object.entries(summary.scansByTrigger || {}).map(([trigger, count]) => (
                    <tr key={trigger} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}><b>{trigger}</b></td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: 16, border: '1px solid #d9c9a3', borderRadius: 14, background: '#fff' }}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--brown)' }}>Lượt nghe theo ngôn ngữ</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <tbody>
                  {Object.entries(summary.playsByLanguage || {}).map(([language, count]) => (
                    <tr key={language} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}><b>{language.toUpperCase()}</b></td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ padding: 16, border: '1px solid #d9c9a3', borderRadius: 14, background: '#fff' }}>
            <h4 style={{ margin: '0 0 12px', color: 'var(--brown)' }}>Top điểm du lịch phổ biến</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--brown)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>Tên địa điểm</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Lượt quét</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Lượt nghe</th>
                </tr>
              </thead>
              <tbody>
                {(summary.topPois || []).map((poi) => (
                  <tr key={poi.poiId} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 4px' }}>{poi.name}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{poi.scans}</td>
                    <td style={{ padding: '8px 4px', textAlign: 'right' }}>{poi.plays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <button
          type="button"
          className="tb"
          onClick={() => navigate('/')}
        >
          ← Về trang chủ
        </button>
      </p>
    </section>
  );
};

export default AdminPage;
