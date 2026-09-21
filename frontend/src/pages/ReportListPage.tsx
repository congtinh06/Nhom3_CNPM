import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface ReportRow {
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

const FilterRow: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
  );
};

interface ReportTableProps {
  rows?: ReportRow[];
  isEmpty?: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({ rows = mockReports, isEmpty = false }) => {
  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {isEmpty ? (
        <div style={{ padding: '24px' }}>
          <div className="empty-line">Chưa có báo cáo nào khớp với tiêu chí tìm kiếm.</div>
        </div>
      ) : (
        <>
          <table className="flat-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ height: '36px' }}>
                <th style={{ padding: '8px 16px', width: '70px' }}>ID</th>
                <th style={{ padding: '8px 16px' }}>URL mục tiêu</th>
                <th style={{ padding: '8px 16px', width: '80px' }}>Kênh</th>
                <th style={{ padding: '8px 16px', width: '140px' }}>Người báo cáo</th>
                <th style={{ padding: '8px 16px', width: '110px' }}>Kết luận</th>
                <th style={{ padding: '8px 16px', width: '120px' }}>Điểm rủi ro</th>
                <th style={{ padding: '8px 16px', width: '100px' }}>Trạng thái</th>
                <th style={{ padding: '8px 16px', width: '160px' }}>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ height: '44px' }}>
                  <td style={{ padding: '8px 16px' }}>
                    <span className="mono" style={{ fontSize: '13px' }}>#{r.id}</span>
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <span className="mono" style={{ fontSize: '13px' }}>
                      {r.url.length > 34 ? r.url.slice(0, 34) + '…' : r.url}
                    </span>
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <span className="mono" style={{ fontSize: '12px' }}>{r.channel}</span>
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
                              width: `${r.score}%`,
                              height: '100%',
                              backgroundColor: r.score > 50 ? 'var(--danger)' : 'var(--safe)',
                            }}
                          ></div>
                        </div>
                        <span className="mono" style={{ fontSize: '12px' }}>{r.score}%</span>
                      </div>
                    ) : (
                      <span className="mono muted-text" style={{ fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <span className="mono" style={{ fontSize: '12px' }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '8px 16px' }}>
                    <span className="mono muted-text" style={{ fontSize: '12px' }}>{r.time}</span>
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
            <span>Trang 1 / 5</span>
            <span style={{ cursor: 'pointer' }}>Trước</span>
            <span style={{ cursor: 'pointer' }}>Sau</span>
          </div>
        </>
      )}
    </div>
  );
};

export const ReportListPage: React.FC = () => {
  return (
    <div className="canvas-stack">
      {/* =========================================================================
          RUN 3: SCREEN "Báo cáo" — FRAME 3 (Default table)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="ADMIN" activeTab="Báo cáo" />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Báo cáo</h1>
            <button type="button" className="btn-secondary-admin">
              Làm mới
            </button>
          </div>

          <FilterRow />
          <ReportTable />
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 3: SCREEN "Báo cáo" — FRAME 4 (Detail drawer)
          ========================================================================= */}
      <div className="frame-1440" style={{ position: 'relative', overflow: 'hidden' }}>
        <Navbar navState="ADMIN" activeTab="Báo cáo" />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Báo cáo</h1>
            <button type="button" className="btn-secondary-admin">
              Làm mới
            </button>
          </div>
          <FilterRow />
          <ReportTable />
        </main>
        <Footer />

        {/* 50% Black Overlay & 480px Drawer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 40,
          }}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 600 }}>Báo cáo #1042</span>
              <button type="button" className="text-button" style={{ fontSize: '13px' }}>Đóng</button>
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
              <span className="mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                https://vietcombank-ebank-login.xyz/auth
              </span>
              <button type="button" className="text-button" style={{ fontSize: '12px', flexShrink: 0 }}>
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
                <div className="kv-value">na***@gmail.com</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Thời gian</div>
                <div className="kv-value mono">2026-09-21 06:15:30</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Trạng thái</div>
                <div className="kv-value mono">NOTIFIED</div>
              </div>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>Kết quả phân tích</h3>
              <div className="verdict-row" style={{ margin: '8px 0' }}>
                <span className="verdict-label danger" style={{ fontSize: '20px' }}>LỪA ĐẢO</span>
                <span className="verdict-score danger" style={{ fontSize: '20px' }}>67%</span>
              </div>
              <div className="continuous-risk-bar" style={{ margin: '8px 0 12px 0' }}>
                <div className="continuous-risk-fill danger" style={{ width: '67%' }}></div>
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
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>Mô tả</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Nhận được tin nhắn SMS mạo danh yêu cầu bấm link đổi mật khẩu gấp để tránh khóa tài khoản.
              </p>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>Thông báo đã gửi</h3>
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
              <button type="button" className="btn-secondary-admin">
                Kiểm tra lại
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select className="select-admin" defaultValue="NOTIFIED">
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
      </div>

      {/* =========================================================================
          RUN 3: SCREEN "Báo cáo" — FRAME 5 (Pending drawer)
          ========================================================================= */}
      <div className="frame-1440" style={{ position: 'relative', overflow: 'hidden' }}>
        <Navbar navState="ADMIN" activeTab="Báo cáo" />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Báo cáo</h1>
            <button type="button" className="btn-secondary-admin">
              Làm mới
            </button>
          </div>
          <FilterRow />
          <ReportTable />
        </main>
        <Footer />

        {/* 50% Black Overlay & 480px Drawer with PENDING */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 40,
          }}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: '18px', fontWeight: 600 }}>Báo cáo #1041</span>
              <button type="button" className="text-button" style={{ fontSize: '13px' }}>Đóng</button>
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
              <span className="mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                https://acb-online-portal.info
              </span>
              <button type="button" className="text-button" style={{ fontSize: '12px', flexShrink: 0 }}>
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
                <div className="kv-value">le***@gmail.com</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Thời gian</div>
                <div className="kv-value mono">2026-09-21 05:50:12</div>
              </div>
              <div className="kv-row">
                <div className="kv-key">Trạng thái</div>
                <div className="kv-value mono">PENDING</div>
              </div>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>Kết quả phân tích</h3>
              <div style={{ color: 'var(--pending)', fontSize: '14px', padding: '8px 0' }}>
                Chưa có kết quả phân tích
              </div>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>Mô tả</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Trang phản hồi chậm, chưa lấy được kết quả từ cổng an ninh.
              </p>
            </div>

            <div>
              <h3 className="panel-title" style={{ marginBottom: '8px' }}>Thông báo đã gửi</h3>
              <div className="empty-line">Chưa có thông báo nào được gửi.</div>
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
              <button type="button" className="btn-primary-admin">
                Kiểm tra lại
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select className="select-admin" defaultValue="PENDING">
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
      </div>

      {/* =========================================================================
          RUN 3: SCREEN "Báo cáo" — FRAME 6 (Empty state)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="ADMIN" activeTab="Báo cáo" />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Báo cáo</h1>
            <button type="button" className="btn-secondary-admin">
              Làm mới
            </button>
          </div>

          <FilterRow />
          <ReportTable isEmpty={true} />
        </main>
        <Footer />
      </div>
    </div>
  );
};
