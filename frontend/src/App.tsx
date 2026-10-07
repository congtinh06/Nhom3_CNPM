import React, { useEffect, useState } from 'react';
import { api } from './api/client';
import { PoiSummary } from './types';
import { MapPin, Volume2, Compass, QrCode, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPois = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPois();
      setPois(data);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách POI:', err);
      setError(err?.message || 'Không thể kết nối đến máy chủ API Gateway.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPois();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="logo-badge">
          <Volume2 size={16} />
          <span>SaigonVoice Audio Guide</span>
        </div>
        <h1 className="title">Thuyết Minh Du Lịch Tự Động TP.HCM</h1>
        <p className="subtitle">
          Hướng dẫn du lịch bằng giọng nói đa ngôn ngữ (Việt, Anh, Nhật, Hàn) thông qua định vị GPS và mã QR.
        </p>
      </header>

      <div className="status-card">
        <div className="status-item">
          <div className={`indicator ${loading ? 'loading' : error ? 'error' : ''}`} />
          <span>
            {loading
              ? 'Đang kết nối API Gateway...'
              : error
              ? 'Mất kết nối máy chủ'
              : `Máy chủ hoạt động bình thường (${pois.length} điểm tham quan)`}
          </span>
        </div>
        <button className="btn" onClick={fetchPois} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      <main>
        <h2 className="section-title">
          <Compass size={20} />
          <span>Danh sách điểm du lịch (POIs)</span>
        </h2>

        {error && (
          <div className="empty-state" style={{ color: 'var(--error)' }}>
            <p>Lỗi tải dữ liệu: {error}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hãy kiểm tra chắc chắn API Gateway cổng 18080 và content-service đang hoạt động.
            </p>
          </div>
        )}

        {!error && !loading && pois.length === 0 && (
          <div className="empty-state">
            <p>Chưa có dữ liệu điểm du lịch nào trong hệ thống.</p>
          </div>
        )}

        <div className="poi-grid">
          {pois.map((poi) => (
            <div key={poi.id} className="poi-card">
              <div className="poi-header">
                <span className="poi-code">{poi.code}</span>
                <h3 className="poi-name">{poi.name}</h3>
              </div>

              <div className="poi-meta">
                {poi.address && (
                  <div className="meta-row">
                    <MapPin size={14} color="var(--accent)" />
                    <span>{poi.address}</span>
                  </div>
                )}
                <div className="meta-row">
                  <QrCode size={14} color="var(--text-muted)" />
                  <span>Token QR: <code>{poi.qrToken}</code></span>
                </div>
                <div className="meta-row" style={{ marginTop: '0.25rem' }}>
                  <span className="badge">Khu vực: {poi.zoneCode}</span>
                  {poi.categoryNameVi && (
                    <span className="badge" style={{ marginLeft: '0.25rem' }}>
                      {poi.categoryNameVi}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
