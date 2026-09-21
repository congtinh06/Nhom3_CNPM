import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { Report } from '../types/report';

export interface ReportRow {
  id: number;
  url: string;
  channel: 'WEB' | 'SMS';
  reporter: string;
  verdict: 'PHISHING' | 'SAFE' | 'PENDING';
  verdictLabel: string;
  score: number | null;
  status: 'PENDING' | 'VERIFIED' | 'NOTIFIED' | 'FAILED';
  time: string;
}

const mockReports: ReportRow[] = [
  {
    id: 1048,
    url: 'https://vietcombank-login.xyz/auth',
    channel: 'WEB',
    reporter: 'vi***@gmail.com',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 100,
    status: 'VERIFIED',
    time: '2026-09-21 09:12:04',
  },
  {
    id: 1047,
    url: 'https://portal.vietcombank.com.vn',
    channel: 'WEB',
    reporter: 'an***@vcb.com.vn',
    verdict: 'SAFE',
    verdictLabel: 'An toàn',
    score: 0,
    status: 'VERIFIED',
    time: '2026-09-21 08:45:10',
  },
  {
    id: 1046,
    url: 'https://techcom-otp.top/verify',
    channel: 'SMS',
    reporter: '090***4567',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 67,
    status: 'NOTIFIED',
    time: '2026-09-21 08:30:22',
  },
  {
    id: 1045,
    url: 'https://mbbank-online-secure.net/login',
    channel: 'WEB',
    reporter: 'tr***@outlook.com',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 100,
    status: 'NOTIFIED',
    time: '2026-09-21 07:55:01',
  },
  {
    id: 1044,
    url: 'https://bidv.com.vn/ebanking',
    channel: 'WEB',
    reporter: 'kh***@bidv.vn',
    verdict: 'SAFE',
    verdictLabel: 'An toàn',
    score: 0,
    status: 'VERIFIED',
    time: '2026-09-21 07:18:39',
  },
  {
    id: 1043,
    url: 'https://tpbank-xac-thuc.cc/sms',
    channel: 'SMS',
    reporter: '098***1122',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 67,
    status: 'NOTIFIED',
    time: '2026-09-21 06:40:15',
  },
  {
    id: 1042,
    url: 'https://example-bank-fake.com/login',
    channel: 'WEB',
    reporter: 'na***@gmail.com',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 67,
    status: 'NOTIFIED',
    time: '2026-09-21 06:15:30',
  },
  {
    id: 1041,
    url: 'https://acb-online-portal.info',
    channel: 'WEB',
    reporter: 'le***@gmail.com',
    verdict: 'PENDING',
    verdictLabel: 'Đang chờ',
    score: null,
    status: 'PENDING',
    time: '2026-09-21 05:50:12',
  },
];

const mapApiReportToRow = (r: Report): ReportRow => {
  let verdict: 'PHISHING' | 'SAFE' | 'PENDING' = 'PENDING';
  let verdictLabel = 'Đang chờ';

  if (r.isPhishing === true) {
    verdict = 'PHISHING';
    verdictLabel = 'Giả mạo';
  } else if (r.isPhishing === false) {
    verdict = 'SAFE';
    verdictLabel = 'An toàn';
  } else if (r.status === 'VERIFIED' && r.riskScore !== null && r.riskScore !== undefined) {
    verdict = r.riskScore > 0.5 ? 'PHISHING' : 'SAFE';
    verdictLabel = r.riskScore > 0.5 ? 'Giả mạo' : 'An toàn';
  }

  const scorePct =
    r.riskScore !== null && r.riskScore !== undefined ? Math.round(r.riskScore * 100) : null;

  return {
    id: r.id,
    url: r.targetUrl,
    channel: r.channel || 'WEB',
    reporter: r.reporterContact,
    verdict,
    verdictLabel,
    score: scorePct,
    status: r.status,
    time: r.createdAt ? r.createdAt.replace('T', ' ').slice(0, 19) : '',
  };
};

export const ReportListPage: React.FC = () => {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('Tất cả kênh');
  const [verdictFilter, setVerdictFilter] = useState('Tất cả kết luận');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [copyNotification, setCopyNotification] = useState('');

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getReports();
      setReports(data.map(mapApiReportToRow));
    } catch {
      if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        setReports(mockReports);
      } else {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = reports.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.url.toLowerCase().includes(q) && !r.reporter.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (channelFilter !== 'Tất cả kênh' && r.channel !== channelFilter) {
      return false;
    }
    if (verdictFilter !== 'Tất cả kết luận') {
      if (verdictFilter === 'Giả mạo' && r.verdict !== 'PHISHING') return false;
      if (verdictFilter === 'An toàn' && r.verdict !== 'SAFE') return false;
      if (verdictFilter === 'Đang chờ' && r.verdict !== 'PENDING') return false;
    }
    if (statusFilter !== 'Tất cả trạng thái' && r.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopyNotification('Đã sao chép!');
    setTimeout(() => setCopyNotification(''), 2000);
  };

  return (
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
        <button
          type="button"
          className="btn-secondary-admin"
          onClick={() => {
            fetchReports();
            setSearchQuery('');
            setChannelFilter('Tất cả kênh');
            setVerdictFilter('Tất cả kết luận');
            setStatusFilter('Tất cả trạng thái');
          }}
        >
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="select-admin"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option>Tất cả kênh</option>
          <option>Web</option>
          <option>SMS</option>
        </select>
        <select
          className="select-admin"
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value)}
        >
          <option>Tất cả kết luận</option>
          <option>Giả mạo</option>
          <option>An toàn</option>
          <option>Đang chờ</option>
        </select>
        <select
          className="select-admin"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>Tất cả trạng thái</option>
          <option>PENDING</option>
          <option>VERIFIED</option>
          <option>NOTIFIED</option>
          <option>FAILED</option>
        </select>
      </div>

      {/* 1. Trạng thái Đang tải */}
      {isLoading && (
        <div className="panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Đang tải danh sách báo cáo…
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
          }}
        >
          <span>{error}</span>
          <button type="button" className="btn-secondary-admin" onClick={fetchReports}>
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Bảng hoặc Trạng thái Trống */}
      {!isLoading && !error && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredReports.length === 0 ? (
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
                  {filteredReports.map((r) => (
                    <tr
                      key={r.id}
                      style={{ height: '44px', cursor: 'pointer' }}
                      onClick={() => setSelectedReport(r)}
                    >
                      <td style={{ padding: '8px 16px' }}>
                        <span className="mono" style={{ fontSize: '13px' }}>
                          #{r.id}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="mono" style={{ fontSize: '13px' }}>
                          {r.url.length > 34 ? r.url.slice(0, 34) + '…' : r.url}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="mono" style={{ fontSize: '12px' }}>
                          {r.channel}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontSize: '13px' }}>{r.reporter}</span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="status-badge">
                          <span
                            className={`status-dot-8 ${
                              r.verdict === 'PHISHING'
                                ? 'danger'
                                : r.verdict === 'SAFE'
                                ? 'safe'
                                : 'pending'
                            }`}
                          ></span>
                          <span style={{ fontSize: '13px' }}>{r.verdictLabel}</span>
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        {r.score !== null ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
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
                                  width: `${r.score}%`,
                                  height: '100%',
                                  backgroundColor:
                                    r.score > 50
                                      ? 'var(--danger)'
                                      : 'var(--safe)',
                                }}
                              ></div>
                            </div>
                            <span className="mono" style={{ fontSize: '12px' }}>
                              {r.score}%
                            </span>
                          </div>
                        ) : (
                          <span
                            className="mono muted-text"
                            style={{ fontSize: '12px' }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="mono" style={{ fontSize: '12px' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span
                          className="mono muted-text"
                          style={{ fontSize: '12px' }}
                        >
                          {r.time}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                <span>Trang 1 / 1</span>
                <span style={{ cursor: 'pointer' }}>Trước</span>
                <span style={{ cursor: 'pointer' }}>Sau</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 480px Drawer Overlay */}
      {selectedReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
          onClick={() => setSelectedReport(null)}
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
                Báo cáo #{selectedReport.id}
              </span>
              <button
                type="button"
                className="text-button"
                style={{ fontSize: '13px' }}
                onClick={() => setSelectedReport(null)}
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
                {selectedReport.url}
              </span>
              <button
                type="button"
                className="text-button"
                style={{ fontSize: '12px', flexShrink: 0 }}
                onClick={() => handleCopy(selectedReport.url)}
              >
                {copyNotification || 'Sao chép'}
              </button>
            </div>

            <div className="kv-list">
              <div className="kv-row">
                <div className="kv-key">Kênh</div>
                <div className="kv-value mono">{selectedReport.channel}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Người báo cáo</div>
                <div className="kv-value">{selectedReport.reporter}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Thời gian</div>
                <div className="kv-value mono">{selectedReport.time}</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Trạng thái</div>
                <div className="kv-value mono">{selectedReport.status}</div>
              </div>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>
                Kết quả phân tích
              </h3>
              {selectedReport.verdict !== 'PENDING' && selectedReport.score !== null ? (
                <>
                  <div className="verdict-row" style={{ margin: '8px 0' }}>
                    <span
                      className={`verdict-label ${
                        selectedReport.verdict === 'PHISHING' ? 'danger' : 'safe'
                      }`}
                      style={{ fontSize: '20px' }}
                    >
                      {selectedReport.verdict === 'PHISHING' ? 'LỪA ĐẢO' : 'AN TOÀN'}
                    </span>
                    <span
                      className={`verdict-score ${
                        selectedReport.verdict === 'PHISHING' ? 'danger' : 'safe'
                      }`}
                      style={{ fontSize: '20px' }}
                    >
                      {selectedReport.score}%
                    </span>
                  </div>
                  <div
                    className="continuous-risk-bar"
                    style={{ margin: '8px 0 12px 0' }}
                  >
                    <div
                      className={`continuous-risk-fill ${
                        selectedReport.verdict === 'PHISHING' ? 'danger' : 'safe'
                      }`}
                      style={{ width: `${selectedReport.score}%` }}
                    ></div>
                  </div>
                  <table className="flat-table" style={{ width: '100%' }}>
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
                            <span
                              className={`status-dot-8 ${
                                selectedReport.verdict === 'PHISHING' ? 'danger' : 'safe'
                              }`}
                            ></span>
                            <span>
                              {selectedReport.verdict === 'PHISHING' ? 'Gắn cờ' : 'Sạch'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Phishunt</td>
                        <td>
                          <span className="status-badge">
                            <span
                              className={`status-dot-8 ${
                                selectedReport.verdict === 'PHISHING' ? 'danger' : 'safe'
                              }`}
                            ></span>
                            <span>
                              {selectedReport.verdict === 'PHISHING' ? 'Gắn cờ' : 'Sạch'}
                            </span>
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
                {selectedReport.verdict === 'PHISHING'
                  ? 'Nhận được tin nhắn mạo danh yêu cầu bấm link đổi mật khẩu gấp để tránh khóa tài khoản.'
                  : selectedReport.verdict === 'SAFE'
                  ? 'Cổng đăng nhập chính thức của ngân hàng, chứng thư số hợp lệ.'
                  : 'Trang phản hồi chậm, chưa lấy được kết quả từ cổng an ninh.'}
              </p>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>
                Thông báo đã gửi
              </h3>
              {selectedReport.verdict !== 'PENDING' ? (
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
                <div className="empty-line">Chưa có thông báo nào được gửi.</div>
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
                  selectedReport.verdict === 'PENDING'
                    ? 'btn-primary-admin'
                    : 'btn-secondary-admin'
                }
              >
                Kiểm tra lại
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  className="select-admin"
                  defaultValue={selectedReport.status}
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
  );
};
