import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface NotificationRow {
  id: number;
  reportId: number;
  channel: 'EMAIL' | 'SMS';
  recipient: string;
  status: 'SENT' | 'FAILED';
  time: string;
  error: string | null;
}

const mockNotifications: NotificationRow[] = [
  {
    id: 508,
    reportId: 1048,
    channel: 'EMAIL',
    recipient: 'admin@anti-phishing-bank.example.com',
    status: 'SENT',
    time: '2026-09-21 09:12:06',
    error: null,
  },
  {
    id: 507,
    reportId: 1048,
    channel: 'EMAIL',
    recipient: 'vi***@gmail.com',
    status: 'SENT',
    time: '2026-09-21 09:12:07',
    error: null,
  },
  {
    id: 506,
    reportId: 1046,
    channel: 'SMS',
    recipient: '+8490***4567',
    status: 'SENT',
    time: '2026-09-21 08:30:25',
    error: null,
  },
  {
    id: 505,
    reportId: 1045,
    channel: 'EMAIL',
    recipient: 'admin@anti-phishing-bank.example.com',
    status: 'SENT',
    time: '2026-09-21 07:55:03',
    error: null,
  },
  {
    id: 504,
    reportId: 1043,
    channel: 'SMS',
    recipient: '+8498***1122',
    status: 'FAILED',
    time: '2026-09-21 06:40:18',
    error: 'Twilio Error 21614: Not a valid mobile number',
  },
  {
    id: 503,
    reportId: 1042,
    channel: 'EMAIL',
    recipient: 'na***@gmail.com',
    status: 'SENT',
    time: '2026-09-21 06:15:32',
    error: null,
  },
  {
    id: 502,
    reportId: 1042,
    channel: 'EMAIL',
    recipient: 'soc-alerts@bank.vn',
    status: 'FAILED',
    time: '2026-09-21 06:15:35',
    error: 'Connection timed out to smtp.mailtrap.io:587',
  },
  {
    id: 501,
    reportId: 1040,
    channel: 'EMAIL',
    recipient: 'admin@anti-phishing-bank.example.com',
    status: 'SENT',
    time: '2026-09-21 05:20:10',
    error: null,
  },
];

const FilterRow: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <select className="select-admin">
        <option>Tất cả kênh</option>
        <option>EMAIL</option>
        <option>SMS</option>
      </select>
      <select className="select-admin">
        <option>Tất cả trạng thái</option>
        <option>SENT</option>
        <option>FAILED</option>
      </select>
      <input
        type="text"
        className="input-admin"
        placeholder="Tìm theo người nhận…"
        style={{ width: '280px' }}
      />
    </div>
  );
};

export const NotificationLogPage: React.FC = () => {
  return (
    <div className="canvas-stack">
      {/* =========================================================================
          RUN 4: SCREEN "Thông báo" — FRAME 2 (Default)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="ADMIN" activeTab="Thông báo" />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Nhật ký thông báo</h1>
            <button type="button" className="btn-secondary-admin">
              Làm mới
            </button>
          </div>
          <p className="page-subtitle" style={{ marginTop: '-12px', marginBottom: '20px' }}>
            Lịch sử email và SMS cảnh báo đã gửi đi.
          </p>

          <FilterRow />

          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="flat-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ height: '36px' }}>
                  <th style={{ padding: '8px 16px', width: '70px' }}>ID</th>
                  <th style={{ padding: '8px 16px', width: '100px' }}>Báo cáo</th>
                  <th style={{ padding: '8px 16px', width: '90px' }}>Kênh</th>
                  <th style={{ padding: '8px 16px', width: '260px' }}>Người nhận</th>
                  <th style={{ padding: '8px 16px', width: '110px' }}>Trạng thái</th>
                  <th style={{ padding: '8px 16px', width: '160px' }}>Thời gian</th>
                  <th style={{ padding: '8px 16px' }}>Lỗi</th>
                </tr>
              </thead>
              <tbody>
                {mockNotifications.map((n) => (
                  <tr key={n.id} style={{ height: '44px' }}>
                    <td style={{ padding: '8px 16px' }}>
                      <span className="mono" style={{ fontSize: '13px' }}>#{n.id}</span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <a href="#report" className="accent-link mono" style={{ fontSize: '13px' }}>
                        #{n.reportId}
                      </a>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span className="mono" style={{ fontSize: '12px' }}>{n.channel}</span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ fontSize: '13px' }}>{n.recipient}</span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span className="status-badge">
                        <span className={`status-dot-8 ${n.status === 'SENT' ? 'safe' : 'danger'}`}></span>
                        <span style={{ fontSize: '13px' }}>{n.status}</span>
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span className="mono muted-text" style={{ fontSize: '12px' }}>{n.time}</span>
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      {n.error ? (
                        <span className="muted-text" style={{ fontSize: '12px' }}>
                          {n.error.length > 40 ? n.error.slice(0, 40) + '…' : n.error}
                        </span>
                      ) : (
                        <span className="muted-text">—</span>
                      )}
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
              <span>Trang 1 / 2</span>
              <span style={{ cursor: 'pointer' }}>Trước</span>
              <span style={{ cursor: 'pointer' }}>Sau</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 4: SCREEN "Thông báo" — FRAME 3 (Empty)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="ADMIN" activeTab="Thông báo" />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Nhật ký thông báo</h1>
            <button type="button" className="btn-secondary-admin">
              Làm mới
            </button>
          </div>
          <p className="page-subtitle" style={{ marginTop: '-12px', marginBottom: '20px' }}>
            Lịch sử email và SMS cảnh báo đã gửi đi.
          </p>

          <FilterRow />

          <div className="panel" style={{ padding: '24px' }}>
            <div className="empty-line">Chưa có thông báo nào.</div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
