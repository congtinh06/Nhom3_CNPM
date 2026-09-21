import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface HistoryItem {
  url: string;
  verdict: 'PHISHING' | 'SAFE' | 'PENDING';
  verdictLabel: string;
  score: number | null;
  time: string;
}

const historyData: HistoryItem[] = [
  {
    url: 'https://vietcombank-ebank-login.xyz/auth',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 67,
    time: '2026-09-21 09:12:04',
  },
  {
    url: 'https://portal.vietcombank.com.vn',
    verdict: 'SAFE',
    verdictLabel: 'An toàn',
    score: 0,
    time: '2026-09-21 08:45:10',
  },
  {
    url: 'https://techcom-otp.top/verify',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 67,
    time: '2026-09-20 22:15:33',
  },
  {
    url: 'https://acb-online-portal.info',
    verdict: 'PENDING',
    verdictLabel: 'Đang chờ',
    score: null,
    time: '2026-09-20 18:30:12',
  },
  {
    url: 'https://mbbank-online-secure.net/login',
    verdict: 'PHISHING',
    verdictLabel: 'Giả mạo',
    score: 100,
    time: '2026-09-19 14:02:55',
  },
];

export const HistoryPage: React.FC = () => {
  return (
    <div className="canvas-stack">
      {/* =========================================================================
          RUN 3: SCREEN "Lịch sử của tôi" — FRAME 1 (With data)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="USER" activeTab="Lịch sử của tôi" />
        <main className="page-content">
          <h1 className="page-title">Lịch sử của tôi</h1>
          <p className="page-subtitle">Các liên kết bạn đã gửi kiểm tra.</p>

          <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            <table className="flat-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '14px 20px', width: '42%' }}>URL</th>
                  <th style={{ padding: '14px 20px', width: '18%' }}>Kết luận</th>
                  <th style={{ padding: '14px 20px', width: '20%' }}>Điểm rủi ro</th>
                  <th style={{ padding: '14px 20px', width: '20%' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {historyData.map((row, idx) => (
                  <tr key={idx} style={{ height: '52px' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="mono" style={{ fontSize: '14px' }}>
                        {row.url.length > 42 ? row.url.slice(0, 42) + '…' : row.url}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="status-badge">
                        <span
                          className={`status-dot-8 ${
                            row.verdict === 'PHISHING'
                              ? 'danger'
                              : row.verdict === 'SAFE'
                              ? 'safe'
                              : 'pending'
                          }`}
                        ></span>
                        <span>{row.verdictLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {row.score !== null ? (
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
                                width: `${row.score}%`,
                                height: '100%',
                                backgroundColor: row.score > 50 ? 'var(--danger)' : 'var(--safe)',
                              }}
                            ></div>
                          </div>
                          <span className="mono" style={{ fontSize: '13px' }}>
                            {row.score}%
                          </span>
                        </div>
                      ) : (
                        <span className="mono muted-text" style={{ fontSize: '13px' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="mono muted-text" style={{ fontSize: '13px' }}>
                        {row.time}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>

      {/* =========================================================================
          RUN 3: SCREEN "Lịch sử của tôi" — FRAME 2 (Empty)
          ========================================================================= */}
      <div className="frame-1440">
        <Navbar navState="USER" activeTab="Lịch sử của tôi" />
        <main className="page-content">
          <h1 className="page-title">Lịch sử của tôi</h1>
          <p className="page-subtitle">Các liên kết bạn đã gửi kiểm tra.</p>

          <div className="panel" style={{ padding: '24px' }}>
            <div className="empty-line">
              Bạn chưa gửi báo cáo nào.{' '}
              <NavLink to="/" className="accent-link">
                Kiểm tra liên kết
              </NavLink>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};
