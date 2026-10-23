import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminClient, normalizeAdminError } from '../api/adminClient';
import { DataTable, Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  QrAudioStats,
  QrLoginSessionItem,
  QrLoginSessionPage,
  QrLoginStats,
} from '../types/qr';
import '../../styles/adminQr.css';

type QrTab = 'account' | 'audio';
type RangeKey = 'today' | '7d' | '30d';

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days: number }> = [
  { key: 'today', label: 'Hôm nay', days: 1 },
  { key: '7d', label: '7 ngày', days: 7 },
  { key: '30d', label: '30 ngày', days: 30 },
];

const LOGIN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ quét',
  SCANNED: 'Đã quét',
  APPROVED: 'Đã xác nhận',
  CONSUMED: 'Đăng nhập thành công',
  DENIED: 'Bị từ chối',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã huỷ',
};

const LOGIN_STATUS_COLORS: Record<string, string> = {
  PENDING: '#94A3B8',
  SCANNED: '#38BDF8',
  APPROVED: '#818CF8',
  CONSUMED: '#22C55E',
  DENIED: '#EF4444',
  EXPIRED: '#F59E0B',
  CANCELLED: '#A8A29E',
};

const SERIES_COLORS = {
  created: '#0F766E',
  scanned: '#2563EB',
  approved: '#7C3AED',
  consumed: '#16A34A',
  plays: '#EA580C',
  completed: '#CA8A04',
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatBucket(value: string): string {
  if (value.length >= 13) {
    return `${value.slice(11, 13)}:00`;
  }
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value;
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatSeconds(value: number): string {
  if (!value) return '-';
  const rounded = Math.round(value);
  if (rounded < 60) return `${rounded} giây`;
  return `${Math.floor(rounded / 60)} phút ${rounded % 60} giây`;
}

function statusLabel(status: string): string {
  return LOGIN_STATUS_LABELS[status] ?? status;
}

const QrAnalyticsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: QrTab = location.pathname.endsWith('/audio') ? 'audio' : 'account';

  const [range, setRange] = useState<RangeKey>('7d');
  const [loginStats, setLoginStats] = useState<QrLoginStats | null>(null);
  const [sessions, setSessions] = useState<QrLoginSessionItem[]>([]);
  const [audioStats, setAudioStats] = useState<QrAudioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { from, to, bucket } = useMemo(() => {
    const today = new Date();
    const days = range === 'today' ? 1 : range === '30d' ? 30 : 7;
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    return {
      from: toDateInput(start),
      to: toDateInput(today),
      bucket: range === 'today' ? 'hour' : 'day',
    };
  }, [range]);

  const fetchData = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'account') {
        const [statsResponse, sessionsResponse] = await Promise.all([
          adminClient.get<QrLoginStats>('/api/auth/admin/qr/stats', {
            params: { from, to, bucket },
          }),
          adminClient.get<QrLoginSessionPage>('/api/auth/admin/qr/sessions', {
            params: { from, to, page: 0, size: 8 },
          }),
        ]);
        if (signal.cancelled) return;
        setLoginStats(statsResponse.data);
        setSessions(sessionsResponse.data?.content ?? []);
      } else {
        const response = await adminClient.get<QrAudioStats>('/api/analytics/admin/qr/stats', {
          params: { from, to, bucket },
        });
        if (signal.cancelled) return;
        setAudioStats(response.data);
      }
    } catch (err) {
      if (signal.cancelled) return;
      setError(normalizeAdminError(err).message);
    } finally {
      if (!signal.cancelled) {
        setLoading(false);
      }
    }
  }, [bucket, from, tab, to]);

  useEffect(() => {
    const signal = { cancelled: false };
    if (tab === 'account') {
      setAudioStats(null);
    } else {
      setLoginStats(null);
      setSessions([]);
    }
    fetchData(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchData, refreshKey, tab]);

  const goTab = (nextTab: QrTab) => {
    navigate(nextTab === 'audio' ? '/quan-tri/qr/audio' : '/quan-tri/qr/tai-khoan');
  };

  const loginSeries = useMemo(
    () => (loginStats?.series ?? []).map((point) => ({ ...point, label: formatBucket(point.bucket) })),
    [loginStats]
  );

  const statusData = useMemo(
    () =>
      (loginStats?.statusBreakdown ?? [])
        .filter((item) => item.count > 0)
        .map((item) => ({
          name: statusLabel(item.status),
          count: item.count,
          color: LOGIN_STATUS_COLORS[item.status] ?? '#94A3B8',
        })),
    [loginStats]
  );

  const funnelSteps = useMemo(() => {
    const totals = loginStats?.totals;
    if (!totals) return [];
    return [
      { label: 'Tạo mã QR', value: totals.created, color: '#0F766E' },
      { label: 'Đã quét', value: totals.scanned, color: '#2563EB' },
      { label: 'Đã xác nhận', value: totals.approved, color: '#7C3AED' },
      { label: 'Đăng nhập thành công', value: totals.consumed, color: '#16A34A' },
    ];
  }, [loginStats]);

  const audioSeries = useMemo(
    () => (audioStats?.series ?? []).map((point) => ({ ...point, label: formatBucket(point.bucket) })),
    [audioStats]
  );

  const audioTopPois = useMemo(
    () =>
      (audioStats?.topPois ?? []).slice(0, 8).map((poi) => ({
        ...poi,
        chartName: poi.name || `POI #${poi.poiId}`,
      })),
    [audioStats]
  );

  const sessionColumns: Column<QrLoginSessionItem>[] = [
    {
      key: 'createdAt',
      title: 'Thời gian',
      render: (session) => formatDateTime(session.createdAt),
    },
    {
      key: 'user',
      title: 'Người dùng',
      render: (session) =>
        session.user ? (
          <span className="adm-table-strong">{session.user.fullName || session.user.email}</span>
        ) : (
          <span className="adm-cell-sub">Chưa xác định</span>
        ),
    },
    {
      key: 'device',
      title: 'Thiết bị',
      render: (session) => session.deviceLabel,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (session) => (
        <span className={`qr-status-chip qr-status-${session.status.toLowerCase()}`}>
          {statusLabel(session.status)}
        </span>
      ),
    },
    {
      key: 'scanSeconds',
      title: 'Thời gian quét',
      align: 'right',
      render: (session) =>
        session.scanSeconds == null ? '-' : formatSeconds(session.scanSeconds),
    },
    {
      key: 'ip',
      title: 'IP tạo phiên',
      render: (session) => session.createdIp || '-',
    },
  ];

  const audioPoiColumns: Column<(typeof audioTopPois)[number]>[] = [
    {
      key: 'name',
      title: 'Điểm thuyết minh',
      render: (poi) => <span className="adm-table-strong">{poi.name || `POI #${poi.poiId}`}</span>,
    },
    {
      key: 'scans',
      title: 'Lượt quét',
      align: 'right',
      render: (poi) => formatNumber(poi.scans),
    },
    {
      key: 'plays',
      title: 'Lượt nghe',
      align: 'right',
      render: (poi) => formatNumber(poi.plays),
    },
    {
      key: 'rate',
      title: 'Quét sang nghe',
      align: 'right',
      render: (poi) => formatPercent(poi.scanToPlayRate),
    },
    {
      key: 'completion',
      title: 'Hoàn tất',
      align: 'right',
      render: (poi) => formatPercent(poi.completionRate),
    },
  ];

  const isAccount = tab === 'account';
  const noLoginData = !loading && (!loginStats || loginStats.totals.created === 0);
  const noAudioData = !loading && (!audioStats || audioStats.totals.scans === 0);

  return (
    <div className="adm-page qr-admin-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">QR &amp; Thống kê</h1>
          <p className="adm-page-desc">
            Theo dõi hiệu quả QR đăng nhập và lượt quét QR nghe thuyết minh tại các điểm đến.
          </p>
        </div>
        <div className="adm-page-actions">
          <Link to="/quan-tri/diem-thuyet-minh/ma-qr" className="adm-btn adm-btn-secondary">
            Quản lý mã QR
          </Link>
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật số liệu'}
          </button>
        </div>
      </div>

      <div className="qr-admin-toolbar">
        <div className="qr-admin-tabs" role="tablist" aria-label="Loại QR">
          <button
            type="button"
            role="tab"
            aria-selected={isAccount}
            className={`qr-admin-tab ${isAccount ? 'is-active' : ''}`}
            onClick={() => goTab('account')}
          >
            QR tài khoản
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isAccount}
            className={`qr-admin-tab ${!isAccount ? 'is-active' : ''}`}
            onClick={() => goTab('audio')}
          >
            QR nghe audio
          </button>
        </div>

        <div className="qr-range-tabs" role="group" aria-label="Khoảng thời gian">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`qr-range-tab ${range === option.key ? 'is-active' : ''}`}
              onClick={() => setRange(option.key)}
              aria-pressed={range === option.key}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Không thể tải thống kê QR"
          message={error}
          onRetry={() => setRefreshKey((value) => value + 1)}
        />
      ) : noLoginData && isAccount ? (
        <>
          <EmptyState
            title="Chưa có dữ liệu QR tài khoản"
            description="Dữ liệu sẽ xuất hiện sau khi có người tạo và quét mã QR đăng nhập. Phiên QR được lưu tối đa 30 ngày."
          />
          <p className="qr-data-note">
            Gợi ý: dùng script seed dữ liệu demo trong môi trường phát triển để xem trước biểu đồ.
          </p>
        </>
      ) : noAudioData && !isAccount ? (
        <>
          <EmptyState
            title="Chưa có lượt quét QR audio"
            description="Hệ thống bắt đầu ghi nhận sự kiện quét QR từ phiên bản này. Dữ liệu lịch sử trước đây không thể phục hồi."
          />
          <p className="qr-data-note">
            Gợi ý: dùng script seed dữ liệu demo trong môi trường phát triển để xem trước biểu đồ.
          </p>
        </>
      ) : isAccount ? (
        <div className="qr-admin-grid">
          <div className="adm-metrics-row">
            <MetricCard label="Tổng phiên QR" value={loginStats?.totals.created} loading={loading} />
            <MetricCard
              label="Đăng nhập thành công"
              value={loginStats?.totals.consumed}
              loading={loading}
              hint={`${formatPercent(loginStats?.rates.successRate ?? 0)} tỷ lệ thành công`}
            />
            <MetricCard
              label="Đang chờ / hoạt động"
              value={loginStats?.totals.active}
              loading={loading}
              hint="Phiên chưa kết thúc"
            />
            <MetricCard
              label="Người dùng QR"
              value={loginStats?.totals.distinctUsers}
              loading={loading}
              hint="Tài khoản khác nhau"
            />
            <MetricCard
              label="Tỷ lệ quét"
              value={formatPercent(loginStats?.rates.scanRate ?? 0)}
              loading={loading}
            />
            <MetricCard
              label="Tỷ lệ hết hạn"
              value={formatPercent(loginStats?.rates.expiredRate ?? 0)}
              loading={loading}
            />
          </div>

          <div className="adm-split-grid qr-chart-grid">
            <div className="adm-card qr-chart-card qr-chart-wide">
              <div className="adm-card-head-row">
                <div>
                  <h2 className="adm-card-title">Phiên QR theo thời gian</h2>
                  <p className="adm-card-subtitle">Tạo mã, quét, xác nhận và đăng nhập thành công</p>
                </div>
              </div>
              <div className="qr-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={loginSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="qrCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SERIES_COLORS.created} stopOpacity={0.24} />
                        <stop offset="95%" stopColor={SERIES_COLORS.created} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="qrConsumed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SERIES_COLORS.consumed} stopOpacity={0.24} />
                        <stop offset="95%" stopColor={SERIES_COLORS.consumed} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="created"
                      name="Tạo mã"
                      stroke={SERIES_COLORS.created}
                      fill="url(#qrCreated)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="scanned"
                      name="Đã quét"
                      stroke={SERIES_COLORS.scanned}
                      fill="transparent"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="consumed"
                      name="Thành công"
                      stroke={SERIES_COLORS.consumed}
                      fill="url(#qrConsumed)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="adm-card qr-chart-card">
              <h2 className="adm-card-title">Trạng thái phiên</h2>
              <div className="qr-chart-wrap qr-chart-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="qr-donut-center">
                  <strong>{formatNumber(loginStats?.totals.created ?? 0)}</strong>
                  <span>phiên</span>
                </div>
              </div>
              <div className="qr-legend">
                {statusData.map((entry) => (
                  <span key={entry.name} className="qr-legend-item">
                    <i style={{ backgroundColor: entry.color }} />
                    {entry.name}
                    <b>{formatNumber(entry.count)}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="adm-split-grid qr-chart-grid">
            <div className="adm-card">
              <h2 className="adm-card-title">Phễu chuyển đổi</h2>
              <div className="qr-funnel">
                {funnelSteps.map((step) => (
                  <div key={step.label} className="qr-funnel-row">
                    <span>{step.label}</span>
                    <div className="qr-funnel-track">
                      <div
                        className="qr-funnel-fill"
                        style={{
                          width: `${Math.max(4, (step.value / Math.max(1, funnelSteps[0]?.value ?? 1)) * 100)}%`,
                          backgroundColor: step.color,
                        }}
                      />
                    </div>
                    <strong>{formatNumber(step.value)}</strong>
                  </div>
                ))}
              </div>
              <div className="qr-mini-stats">
                <div>
                  <span>Quét sang xác nhận</span>
                  <strong>{formatPercent(loginStats?.rates.approvalRate ?? 0)}</strong>
                </div>
                <div>
                  <span>TB thời gian quét</span>
                  <strong>{formatSeconds(loginStats?.durations.averageScanSeconds ?? 0)}</strong>
                </div>
                <div>
                  <span>TB thời gian đăng nhập</span>
                  <strong>{formatSeconds(loginStats?.durations.averageLoginSeconds ?? 0)}</strong>
                </div>
              </div>
            </div>

            <div className="adm-card">
              <h2 className="adm-card-title">Thiết bị tạo mã</h2>
              <div className="qr-chart-wrap qr-chart-bars">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={loginStats?.devices.slice(0, 6) ?? []}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E7E5E4" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Số phiên" fill="#0F766E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="adm-split-grid qr-chart-grid">
            <div className="adm-card">
              <h2 className="adm-card-title">Top người dùng QR</h2>
              <div className="qr-rank-list">
                {(loginStats?.topUsers ?? []).length === 0 ? (
                  <p className="qr-muted">Chưa có người dùng nào đăng nhập bằng QR.</p>
                ) : (
                  loginStats?.topUsers.map((user, index) => (
                    <div key={user.userId} className="qr-rank-row">
                      <span className="qr-rank-index">{index + 1}</span>
                      <div>
                        <strong>{user.fullName || user.email}</strong>
                        <small>{user.email}</small>
                      </div>
                      <b>{formatNumber(user.count)}</b>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="adm-card qr-session-card">
              <div className="adm-card-head-row">
                <div>
                  <h2 className="adm-card-title">Phiên gần đây</h2>
                  <p className="adm-card-subtitle">8 phiên mới nhất trong khoảng thời gian đã chọn</p>
                </div>
              </div>
              <DataTable
                columns={sessionColumns}
                data={sessions}
                keyExtractor={(session) => session.id}
                loading={loading}
                emptyText="Chưa có phiên QR nào."
                ariaLabel="Bảng phiên đăng nhập QR gần đây"
              />
            </div>
          </div>

          <p className="qr-data-note">
            Dữ liệu phiên QR đăng nhập được lưu 30 ngày. IP hiển thị đã được che bớt để bảo vệ quyền riêng tư.
          </p>
        </div>
      ) : (
        <div className="qr-admin-grid">
          <div className="adm-metrics-row">
            <MetricCard label="Lượt quét QR" value={audioStats?.totals.scans} loading={loading} />
            <MetricCard label="Lượt nghe audio" value={audioStats?.totals.audioPlays} loading={loading} />
            <MetricCard
              label="Lượt nghe hoàn tất"
              value={audioStats?.totals.audioCompleted}
              loading={loading}
              hint={`${formatPercent(audioStats?.rates.completionRate ?? 0)} tỷ lệ hoàn tất`}
            />
            <MetricCard
              label="Quét sang nghe"
              value={formatPercent(audioStats?.rates.scanToPlayRate ?? 0)}
              loading={loading}
            />
            <MetricCard
              label="Phiên duy nhất"
              value={audioStats?.totals.uniqueSessions}
              loading={loading}
              hint="Theo session trình duyệt"
            />
          </div>

          <div className="adm-split-grid qr-chart-grid">
            <div className="adm-card qr-chart-card qr-chart-wide">
              <h2 className="adm-card-title">Lượt quét và lượt nghe theo thời gian</h2>
              <div className="qr-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={audioSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="qrScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SERIES_COLORS.scanned} stopOpacity={0.24} />
                        <stop offset="95%" stopColor={SERIES_COLORS.scanned} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="qrPlays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SERIES_COLORS.plays} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={SERIES_COLORS.plays} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      name="Lượt quét"
                      stroke={SERIES_COLORS.scanned}
                      fill="url(#qrScans)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="plays"
                      name="Lượt nghe"
                      stroke={SERIES_COLORS.plays}
                      fill="url(#qrPlays)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="Hoàn tất"
                      stroke={SERIES_COLORS.completed}
                      fill="transparent"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="adm-card qr-chart-card">
              <h2 className="adm-card-title">Ngôn ngữ được nghe</h2>
              <div className="qr-chart-wrap qr-chart-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(audioStats?.languages ?? []).filter((item) => item.count > 0)}
                      dataKey="count"
                      nameKey="key"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {(audioStats?.languages ?? [])
                        .filter((item) => item.count > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              entry.key === 'vi'
                                ? '#0F766E'
                                : entry.key === 'en'
                                ? '#2563EB'
                                : entry.key === 'ja'
                                ? '#7C3AED'
                                : '#EA580C'
                            }
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="qr-donut-center">
                  <strong>{formatNumber(audioStats?.totals.audioPlays ?? 0)}</strong>
                  <span>lượt nghe</span>
                </div>
              </div>
              <div className="qr-legend qr-legend-wrap">
                {(audioStats?.languages ?? []).map((entry) => (
                  <span key={entry.key} className="qr-legend-item">
                    <i
                      style={{
                        backgroundColor:
                          entry.key === 'vi'
                            ? '#0F766E'
                            : entry.key === 'en'
                            ? '#2563EB'
                            : entry.key === 'ja'
                            ? '#7C3AED'
                            : '#EA580C',
                      }}
                    />
                    {entry.key.toUpperCase()}
                    <b>{formatNumber(entry.count)}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="adm-split-grid qr-chart-grid">
            <div className="adm-card">
              <h2 className="adm-card-title">Nguồn kích hoạt</h2>
              <div className="qr-trigger-list">
                {(audioStats?.triggers ?? []).map((entry) => (
                  <div key={entry.key} className="qr-trigger-row">
                    <span>{entry.key}</span>
                    <div className="qr-trigger-track">
                      <div
                        style={{
                          width: `${Math.max(
                            2,
                            (entry.count / Math.max(1, audioStats?.totals.scans ?? 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <strong>{formatNumber(entry.count)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="adm-card">
              <h2 className="adm-card-title">Top điểm có lượt quét QR</h2>
              <div className="qr-chart-wrap qr-chart-bars">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={audioTopPois}
                    margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                    <XAxis
                      dataKey="chartName"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) => (value.length > 14 ? `${value.slice(0, 14)}…` : value)}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="scans" name="Lượt quét" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="plays" name="Lượt nghe" fill="#EA580C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="adm-card">
            <h2 className="adm-card-title">Hiệu quả theo điểm thuyết minh</h2>
            <DataTable
              columns={audioPoiColumns}
              data={audioTopPois}
              keyExtractor={(poi) => poi.poiId}
              loading={loading}
              emptyText="Chưa có dữ liệu điểm thuyết minh."
              ariaLabel="Bảng hiệu quả QR audio theo điểm thuyết minh"
            />
          </div>

          <p className="qr-data-note">
            Dữ liệu QR audio chỉ bắt đầu được ghi nhận từ phiên bản này; các lượt quét trước đây không thể phục hồi.
          </p>
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value?: number | string;
  loading: boolean;
  hint?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, loading, hint }) => (
  <div className="adm-metric-card">
    <span className="adm-metric-label">{label}</span>
    <div className="adm-metric-value">
      {loading ? '...' : typeof value === 'number' ? formatNumber(value) : value ?? '0'}
    </div>
    {hint && <span className="adm-metric-hint">{hint}</span>}
  </div>
);

export default QrAnalyticsPage;

