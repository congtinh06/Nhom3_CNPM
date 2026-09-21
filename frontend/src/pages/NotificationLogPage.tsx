import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { NotificationLogItem } from '../types/report';

export interface NotificationRow {
  id: number;
  reportId: number;
  channel: 'EMAIL' | 'SMS' | string;
  recipient: string;
  status: 'SENT' | 'FAILED' | string;
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

const mapApiNotificationToRow = (item: NotificationLogItem): NotificationRow => {
  return {
    id: item.id,
    reportId: item.reportId,
    channel: item.channel,
    recipient: item.recipient,
    status: item.status,
    time: item.sentAt ? item.sentAt.replace('T', ' ').slice(0, 19) : '',
    error: item.errorMessage ?? null,
  };
};

export const NotificationLogPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [channelFilter, setChannelFilter] = useState('Tất cả kênh');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getNotifications();
      setNotifications(data.map(mapApiNotificationToRow));
    } catch {
      if (import.meta.env.VITE_DEMO_FALLBACK === 'true') {
        setNotifications(mockNotifications);
      } else {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ hoặc thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((n) => {
    if (channelFilter !== 'Tất cả kênh' && n.channel !== channelFilter) {
      return false;
    }
    if (statusFilter !== 'Tất cả trạng thái' && n.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!n.recipient.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

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
          Nhật ký thông báo
        </h1>
        <button
          type="button"
          className="btn-secondary-admin"
          onClick={() => {
            fetchNotifications();
            setChannelFilter('Tất cả kênh');
            setStatusFilter('Tất cả trạng thái');
            setSearchQuery('');
          }}
        >
          Làm mới
        </button>
      </div>
      <p
        className="page-subtitle"
        style={{ marginTop: '-12px', marginBottom: '20px' }}
      >
        Lịch sử email và SMS cảnh báo đã gửi đi.
      </p>

      {/* Filter Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <select
          className="select-admin"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
        >
          <option>Tất cả kênh</option>
          <option>EMAIL</option>
          <option>SMS</option>
        </select>
        <select
          className="select-admin"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>Tất cả trạng thái</option>
          <option>SENT</option>
          <option>FAILED</option>
        </select>
        <input
          type="text"
          className="input-admin"
          placeholder="Tìm theo người nhận…"
          style={{ width: '280px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 1. Trạng thái Đang tải */}
      {isLoading && (
        <div className="panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Đang tải nhật ký thông báo…
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
          <button type="button" className="btn-secondary-admin" onClick={fetchNotifications}>
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Bảng hoặc Trạng thái Trống */}
      {!isLoading && !error && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <div className="empty-line">Chưa có thông báo nào.</div>
            </div>
          ) : (
            <>
              <table className="flat-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ height: '36px' }}>
                    <th style={{ padding: '8px 16px', width: '70px' }}>ID</th>
                    <th style={{ padding: '8px 16px', width: '100px' }}>
                      Báo cáo
                    </th>
                    <th style={{ padding: '8px 16px', width: '90px' }}>
                      Kênh
                    </th>
                    <th style={{ padding: '8px 16px', width: '260px' }}>
                      Người nhận
                    </th>
                    <th style={{ padding: '8px 16px', width: '110px' }}>
                      Trạng thái
                    </th>
                    <th style={{ padding: '8px 16px', width: '160px' }}>
                      Thời gian
                    </th>
                    <th style={{ padding: '8px 16px' }}>Lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((n) => (
                    <tr key={n.id} style={{ height: '44px' }}>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="mono" style={{ fontSize: '13px' }}>
                          #{n.id}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span
                          className="accent-link mono"
                          style={{ fontSize: '13px' }}
                        >
                          #{n.reportId}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="mono" style={{ fontSize: '12px' }}>
                          {n.channel}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{ fontSize: '13px' }}>{n.recipient}</span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span className="status-badge">
                          <span
                            className={`status-dot-8 ${
                              n.status === 'SENT' ? 'safe' : 'danger'
                            }`}
                          ></span>
                          <span style={{ fontSize: '13px' }}>{n.status}</span>
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span
                          className="mono muted-text"
                          style={{ fontSize: '12px' }}
                        >
                          {n.time}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        {n.error ? (
                          <span
                            className="muted-text"
                            style={{ fontSize: '12px' }}
                          >
                            {n.error.length > 40
                              ? n.error.slice(0, 40) + '…'
                              : n.error}
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
                <span>Trang 1 / 1</span>
                <span style={{ cursor: 'pointer' }}>Trước</span>
                <span style={{ cursor: 'pointer' }}>Sau</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
