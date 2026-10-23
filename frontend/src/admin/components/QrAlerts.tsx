import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminClient } from '../api/adminClient';
import { QrAudioStats, QrLoginStats } from '../types/qr';

interface AlertItem {
  tone: 'success' | 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  to: string;
  action: string;
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function buildAlerts(login: QrLoginStats | null, audio: QrAudioStats | null): AlertItem[] {
  const alerts: AlertItem[] = [];
  const created = login?.totals?.created ?? 0;
  const scans = audio?.totals?.scans ?? 0;
  const plays = audio?.totals?.audioPlays ?? 0;

  if (created === 0 && scans === 0) {
    return [
      {
        tone: 'info',
        title: 'Chưa có dữ liệu QR trong 7 ngày',
        message: 'Khi người dùng bắt đầu quét mã, các chỉ số và cảnh báo vận hành sẽ xuất hiện tại đây.',
        to: '/quan-tri/qr/tai-khoan',
        action: 'Mở thống kê QR',
      },
    ];
  }

  if (created >= 10 && (login?.rates?.expiredRate ?? 0) >= 20) {
    alerts.push({
      tone: 'warning',
      title: 'Tỷ lệ mã QR đăng nhập hết hạn cao',
      message: `${(login?.rates?.expiredRate ?? 0).toFixed(1)}% phiên QR hết hạn trong 7 ngày. Kiểm tra luồng quét và xác nhận trên thiết bị di động.`,
      to: '/quan-tri/qr/tai-khoan',
      action: 'Xem phiên QR',
    });
  }

  if (created >= 10 && (login?.rates?.successRate ?? 0) < 50) {
    alerts.push({
      tone: 'danger',
      title: 'Tỷ lệ đăng nhập QR thấp',
      message: `Chỉ ${(login?.rates?.successRate ?? 0).toFixed(
        1
      )}% phiên QR hoàn tất đăng nhập. Ưu tiên kiểm tra các phiên bị từ chối hoặc hết hạn.`,
      to: '/quan-tri/qr/tai-khoan',
      action: 'Kiểm tra chi tiết',
    });
  }

  if (scans >= 20 && (audio?.rates?.scanToPlayRate ?? 0) < 40) {
    alerts.push({
      tone: 'warning',
      title: 'Nhiều lượt quét QR chưa phát audio',
      message: `Tỷ lệ quét sang nghe chỉ ${(audio?.rates?.scanToPlayRate ?? 0).toFixed(
        1
      )}%. Kiểm tra chất lượng bản dịch, audio và nút phát tại điểm đến.`,
      to: '/quan-tri/qr/audio',
      action: 'Xem QR audio',
    });
  }

  if (plays >= 20 && (audio?.rates?.completionRate ?? 0) < 40) {
    alerts.push({
      tone: 'info',
      title: 'Tỷ lệ nghe hoàn tất còn thấp',
      message: `${(audio?.rates?.completionRate ?? 0).toFixed(
        1
      )}% lượt nghe hoàn tất. Nên rà soát độ dài và chất lượng nội dung thuyết minh.`,
      to: '/quan-tri/qr/audio',
      action: 'Xem nội dung audio',
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      tone: 'success',
      title: 'Hoạt động QR trong 7 ngày ổn định',
      message: 'Chưa phát hiện bất thường về tỷ lệ đăng nhập, hết hạn hay mức độ nghe audio.',
      to: '/quan-tri/qr/tai-khoan',
      action: 'Xem thống kê',
    });
  }

  return alerts.slice(0, 3);
}

export const QrAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    const params = { from: toDateInput(start), to: toDateInput(today), bucket: 'day' };

    Promise.all([
      adminClient
        .get<QrLoginStats>('/api/auth/admin/qr/stats', { params })
        .then((response) => response.data)
        .catch(() => null),
      adminClient
        .get<QrAudioStats>('/api/analytics/admin/qr/stats', { params })
        .then((response) => response.data)
        .catch(() => null),
    ]).then(([login, audio]) => {
      if (cancelled) return;
      setAlerts(buildAlerts(login, audio));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="adm-card qr-alert-card" aria-live="polite">
        <h2 className="adm-card-title">Cảnh báo vận hành QR</h2>
        <p className="qr-muted">Đang kiểm tra số liệu 7 ngày gần nhất...</p>
      </div>
    );
  }

  return (
    <div className="adm-card qr-alert-card">
      <div className="adm-card-head-row">
        <div>
          <h2 className="adm-card-title">Cảnh báo vận hành QR</h2>
          <p className="adm-card-subtitle">Tổng hợp từ 7 ngày gần nhất</p>
        </div>
      </div>
      <div className="qr-alert-list">
        {alerts.map((alert) => (
          <div key={alert.title} className={`qr-alert-item qr-alert-${alert.tone}`}>
            <span className="qr-alert-dot" aria-hidden="true" />
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
            <Link to={alert.to} className="adm-btn adm-btn-secondary adm-btn-sm">
              {alert.action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
