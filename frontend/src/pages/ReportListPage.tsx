import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Report } from '../types/report';
import { RefreshCw, Search, ShieldAlert, ShieldCheck, Clock, ExternalLink, Globe, Smartphone } from 'lucide-react';

export const ReportListPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.targetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reporterContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesChannel = filterChannel === 'ALL' || r.channel === filterChannel;

    let matchesVerdict = true;
    if (filterVerdict === 'PHISHING') {
      matchesVerdict = r.isPhishing === true;
    } else if (filterVerdict === 'SAFE') {
      matchesVerdict = r.isPhishing === false;
    } else if (filterVerdict === 'PENDING') {
      matchesVerdict = r.status === 'PENDING';
    }

    return matchesSearch && matchesChannel && matchesVerdict;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Nhật Ký & Danh Sách Báo Cáo</h1>
          <p className="page-subtitle">
            Dữ liệu được lưu trữ độc lập tại database <code>report_db</code> (PostgreSQL) thông qua kiến trúc 3 lớp.
          </p>
        </div>

        <button onClick={fetchReports} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Tìm theo URL hoặc liên hệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Channel */}
          <div>
            <select
              className="form-control form-select"
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              <option value="ALL">Tất cả kênh (Web & SMS)</option>
              <option value="WEB">🌐 Chỉ kênh Web</option>
              <option value="SMS">📱 Chỉ kênh SMS</option>
            </select>
          </div>

          {/* Filter Verdict */}
          <div>
            <select
              className="form-control form-select"
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
            >
              <option value="ALL">Tất cả kết luận</option>
              <option value="PHISHING">⚠️ Giả mạo / Phishing</option>
              <option value="SAFE">✅ An toàn</option>
              <option value="PENDING">⏳ Đang xử lý (Pending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>URL Mục Tiêu</th>
                <th>Kênh</th>
                <th>Người Báo Cáo</th>
                <th>Kết Luận</th>
                <th>Điểm Rủi Ro</th>
                <th>Trạng Thái</th>
                <th>Thời Gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <p>Đang tải danh sách báo cáo từ API Gateway...</p>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Chưa có báo cáo nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{report.id}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: '300px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }} title={report.targetUrl}>
                          {report.targetUrl}
                        </span>
                        <a href={report.targetUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                    <td>
                      {report.channel === 'WEB' ? (
                        <span className="badge badge-info"><Globe size={12} /> WEB</span>
                      ) : (
                        <span className="badge badge-warning"><Smartphone size={12} /> SMS</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {report.reporterContact}
                    </td>
                    <td>
                      {report.isPhishing === true ? (
                        <span className="badge badge-danger"><ShieldAlert size={12} /> Giả mạo</span>
                      ) : report.isPhishing === false ? (
                        <span className="badge badge-success"><ShieldCheck size={12} /> An toàn</span>
                      ) : (
                        <span className="badge badge-warning"><Clock size={12} /> Chưa rõ</span>
                      )}
                    </td>
                    <td>
                      {report.riskScore !== null && report.riskScore !== undefined ? (
                        <div className="risk-meter-container" style={{ width: '100px' }}>
                          <div className="risk-bar-bg">
                            <div
                              className="risk-bar-fill"
                              style={{
                                width: `${Math.max(report.riskScore * 100, 5)}%`,
                                backgroundColor: report.riskScore >= 0.5 ? 'var(--danger)' : 'var(--success)'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{(report.riskScore * 100).toFixed(0)}%</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>--</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: report.status === 'VERIFIED' ? 'var(--accent-cyan)' : 'var(--warning)'
                      }}>
                        {report.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
