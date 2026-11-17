import React, { useEffect, useMemo, useState } from 'react';
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
import { normalizeAdminError } from '../api/adminClient';
import {
  buildPeriod,
  fetchAudioStatsWithPrevious,
  fetchLoginSessions,
  fetchLoginStatsWithPrevious,
} from '../api/qrApi';
import { DataTable, Column } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  deltaPercent,
  formatDateTime,
  formatDelta,
  formatDuration,
  formatNumber,
  formatPercent,
  maskIp,
  percent,
  round1,
  splitExpiredSlices,
  statusLabel,
  StatusSlice,
} from '../qr/qrMetrics';
import {
  QrAudioStats,
  QrLoginSessionItem,
  QrLoginSessionPage,
  QrLoginStats,
  QrRecentScanItem,
} from '../types/qr';
import '../../styles/adminQr.css';

type QrTab = 'account' | 'audio';
type RangeKey = 'today' | '7d' | '30d';

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
];

const SERIES_COLORS = {
  created: '#0F766E',
  scanned: '#2563EB',
  approved: '#7C3AED',
  consumed: '#16A34A',
  expired: '#F59E0B',
  plays: '#EA580C',
  completed: '#CA8A04',
};

const LANGUAGE_LABELS: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

const LANGUAGE_COLORS: Record<string, string> = {
  vi: '#0F766E',
  en: '#2563EB',
  ja: '#7C3AED',
  ko: '#EA580C',
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Điện thoại',
  desktop: 'Máy tính',
  tablet: 'Máy tính bảng',
  unknown: 'Không xác định',
};

const EMPTY_SESSION_PAGE: QrLoginSessionPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 5,
};

function formatShortSessionTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${hours}:${minutes} - ${day}/${month}`;
}

function formatBucket(value: string): string {
  if (value.length >= 13) {
    return `${value.slice(11, 13)}:00`;
  }
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value;
}

function signedPoint(value: number | null): string | null {
  if (value == null) return null;
  return `${value >= 0 ? '+' : ''}${round1(value).toFixed(1)} đpt`;
}

const QrAnalyticsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tab: QrTab = location.pathname.endsWith('/audio') ? 'audio' : 'account';

  const [range, setRange] = useState<RangeKey>('7d');
  const [loginStats, setLoginStats] = useState<QrLoginStats | null>(null);
  const [previousLoginStats, setPreviousLoginStats] = useState<QrLoginStats | null>(null);
  const [audioStats, setAudioStats] = useState<QrAudioStats | null>(null);
  const [previousAudioStats, setPreviousAudioStats] = useState<QrAudioStats | null>(null);
  const [sessionPage, setSessionPage] = useState<QrLoginSessionPage>(EMPTY_SESSION_PAGE);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionPageIndex, setSessionPageIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<QrLoginSessionItem | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const period = useMemo(() => buildPeriod(range), [range]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);

    const request =
      tab === 'account'
        ? fetchLoginStatsWithPrevious(period).then(({ current, previous }) => {
            if (cancelled) return;
            setLoginStats(current);
            setPreviousLoginStats(previous);
          })
        : fetchAudioStatsWithPrevious(period).then(({ current, previous }) => {
            if (cancelled) return;
            setAudioStats(current);
            setPreviousAudioStats(previous);
          });

    request
      .then(() => {
        if (!cancelled) {
          setLastUpdated(new Date());
          setStatsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatsError(normalizeAdminError(err).message);
        setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, refreshKey, tab]);

  useEffect(() => {
    if (tab !== 'account') return;
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError(null);

    fetchLoginSessions(period.current, {
      page: sessionPageIndex,
      size: 5,
      status: sessionStatus ?? undefined,
    })
      .then((page) => {
        if (!cancelled) {
          setSessionPage(page ?? EMPTY_SESSION_PAGE);
          setSessionsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSessionsError(normalizeAdminError(err).message);
        setSessionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, refreshKey, sessionPageIndex, sessionStatus, tab]);

  useEffect(() => {
    if (!selectedSession) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedSession(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedSession]);

  useEffect(() => {
    setSessionPageIndex(0);
    setSessionStatus(null);
  }, [tab]);

  const changeRange = (nextRange: RangeKey) => {
    setRange(nextRange);
    setSessionPageIndex(0);
    setSessionStatus(null);
  };

  const filterByStatus = (status: string) => {
    setSessionStatus((current) => (current === status ? null : status));
    setSessionPageIndex(0);
  };

  const loginSeries = useMemo(
    () => (loginStats?.series ?? []).map((point) => ({ ...point, label: formatBucket(point.bucket) })),
    [loginStats]
  );

  const statusSlices = useMemo<StatusSlice[]>(
    () => splitExpiredSlices(loginStats?.statusBreakdown, loginStats?.totals),
    [loginStats]
  );

  const funnelSteps = useMemo(() => {
    const totals = loginStats?.totals;
    if (!totals) return [];
    return [
      { label: 'Tạo mã QR', value: totals.created, color: SERIES_COLORS.created },
      { label: 'Đã quét', value: totals.scanned, color: SERIES_COLORS.scanned },
      { label: 'Đã xác nhận', value: totals.approved, color: SERIES_COLORS.approved },
      { label: 'Đăng nhập thành công', value: totals.consumed, color: SERIES_COLORS.consumed },
    ];
  }, [loginStats]);

  const audioSeries = useMemo(
    () => (audioStats?.series ?? []).map((point) => ({ ...point, label: formatBucket(point.bucket) })),
    [audioStats]
  );

  const audioTopPois = useMemo(
    () =>
      (audioStats?.topPois ?? []).map((poi, index) => ({
        ...poi,
        chartName: poi.name || `POI #${poi.poiId}`,
        rank: index + 1,
      })),
    [audioStats]
  );

  const languageData = useMemo(
    () =>
      (audioStats?.languages ?? [])
        .filter((item) => item.count > 0)
        .map((item) => ({
          ...item,
          name: LANGUAGE_LABELS[item.key] ?? item.key.toUpperCase(),
          color: LANGUAGE_COLORS[item.key] ?? '#94A3B8',
        })),
    [audioStats]
  );

  const deviceData = useMemo(
    () =>
      (audioStats?.devices ?? [])
        .filter((item) => item.count > 0)
        .map((item) => ({
          ...item,
          name: DEVICE_LABELS[item.key] ?? item.key,
        })),
    [audioStats]
  );

  const loginDeviceData = useMemo(
    () =>
      (loginStats?.devices ?? [])
        .filter((item) => item.count > 0)
        .map((item) => ({
          ...item,
          name: DEVICE_LABELS[item.name] ?? item.name,
        })),
    [loginStats]
  );

  const loginTotals = loginStats?.totals;
  const previousLoginTotals = previousLoginStats?.totals;
  const previousSuccessRate = previousLoginStats
    ? percent(previousLoginStats.totals.consumed, previousLoginStats.totals.created)
    : null;

  const audioTotals = audioStats?.totals;
  const previousAudioTotals = previousAudioStats?.totals;
  const previousScanToPlay = previousAudioStats
    ? percent(previousAudioStats.totals.audioPlays, previousAudioStats.totals.scans)
    : null;

  const sessionColumns: Column<QrLoginSessionItem>[] = [
    {
      key: 'createdAt',
      title: 'Thời gian',
      width: '110px',
      render: (session) => (
        <span className="qr-session-time">
          {formatShortSessionTime(session.createdAt)}
        </span>
      ),
    },
    {
      key: 'user',
      title: 'Người dùng',
      render: (session) => {
        const userName = session.user
          ? session.user.fullName || session.user.email
          : session.status?.toLowerCase().startsWith('guest')
          ? 'Khách (chưa có tài khoản)'
          : 'Chưa xác định';
        const maskedIpStr = session.createdIp ? maskIp(session.createdIp) : '';
        const metaParts = [session.deviceLabel, maskedIpStr].filter(Boolean);

        return (
          <div
            className="qr-session-user-cell"
            onClick={() => setSelectedSession(session)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedSession(session);
              }
            }}
            title="Nhấn để xem chi tiết phiên"
          >
            <div className="adm-table-strong qr-session-user-name">
              {userName}
            </div>
            {metaParts.length > 0 && (
              <div className="qr-session-user-sub">
                {metaParts.join(' - ')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'right',
      width: '120px',
      render: (session) => (
        <span className={`qr-status-chip qr-status-${session.status.toLowerCase()}`}>
          {statusLabel(session.status)}
        </span>
      ),
    },
  ];

  const audioPoiColumns: Column<(typeof audioTopPois)[number]>[] = [
    {
      key: 'rank',
      title: '#',
      width: '44px',
      render: (poi) => <span className="qr-rank-index">{poi.rank}</span>,
    },
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

  const recentScanColumns: Column<QrRecentScanItem>[] = [
    {
      key: 'occurredAt',
      title: 'Thời gian',
      render: (scan) => formatDateTime(scan.occurredAt),
    },
    {
      key: 'poi',
      title: 'Điểm thuyết minh',
      render: (scan) => (
        <span className="adm-table-strong">
          {scan.poiName || (scan.poiId ? `POI #${scan.poiId}` : 'Không xác định')}
        </span>
      ),
    },
    {
      key: 'language',
      title: 'Ngôn ngữ',
      render: (scan) => LANGUAGE_LABELS[scan.languageCode] ?? scan.languageCode.toUpperCase(),
    },
    {
      key: 'trigger',
      title: 'Nguồn',
      render: (scan) => scan.triggerType ?? '-',
    },
    {
      key: 'device',
      title: 'Thiết bị',
      render: (scan) => (scan.deviceType ? DEVICE_LABELS[scan.deviceType] ?? scan.deviceType : '-'),
    },
  ];

  const isAccount = tab === 'account';
  const noLoginData = !statsLoading && (!loginStats || loginStats.totals.created === 0);
  const noAudioData =
    !statsLoading &&
    (!audioStats ||
      (audioStats.totals.scans === 0 && audioStats.totals.audioPlays === 0));
  const showDevHint = import.meta.env.DEV;

  const accountView = (
    <div className="qr-admin-grid">
      <div className="adm-metrics-row qr-kpi-row">
        <MetricCard
          label="Tổng phiên QR"
          value={loginTotals?.created}
          loading={statsLoading}
          delta={deltaPercent(loginTotals?.created ?? 0, previousLoginTotals?.created ?? null)}
        />
        <MetricCard
          label="Đã quét"
          value={loginTotals?.scanned}
          loading={statsLoading}
          delta={deltaPercent(loginTotals?.scanned ?? 0, previousLoginTotals?.scanned ?? null)}
          hint={`${formatPercent(loginStats?.rates.scanRate ?? 0)} trên tổng mã tạo`}
        />
        <MetricCard
          label="Đã xác nhận"
          value={loginTotals?.approved}
          loading={statsLoading}
          delta={deltaPercent(loginTotals?.approved ?? 0, previousLoginTotals?.approved ?? null)}
          hint={`${formatPercent(loginStats?.rates.approvalRate ?? 0)} trên phiên đã quét`}
        />
        <MetricCard
          label="Đăng nhập thành công"
          value={loginTotals?.consumed}
          loading={statsLoading}
          delta={deltaPercent(loginTotals?.consumed ?? 0, previousLoginTotals?.consumed ?? null)}
          hint={`${formatPercent(loginStats?.rates.successRate ?? 0)} tỷ lệ thành công`}
          tone="good"
        />
        <MetricCard
          label="Tỷ lệ thành công"
          value={formatPercent(loginStats?.rates.successRate ?? 0)}
          loading={statsLoading}
          pointDelta={
            previousSuccessRate == null
              ? null
              : round1((loginStats?.rates.successRate ?? 0) - previousSuccessRate)
          }
        />
        <MetricCard
          label="Hết hạn"
          value={loginTotals?.expired}
          loading={statsLoading}
          delta={deltaPercent(loginTotals?.expired ?? 0, previousLoginTotals?.expired ?? null)}
          hint={`${formatNumber(loginTotals?.expiredUnscanned ?? 0)} chưa quét / ${formatNumber(
            loginTotals?.expiredScanned ?? 0
          )} đã quét`}
          tone="warning"
        />
      </div>

      <div className="adm-split-grid qr-chart-grid">
        <div className="adm-card qr-chart-card qr-chart-wide">
          <div className="adm-card-head-row">
            <div>
              <h2 className="adm-card-title">Phiên QR theo thời gian</h2>
              <p className="adm-card-subtitle">Tạo mã, quét, xác nhận và đăng nhập thành công</p>
            </div>
            <div className="qr-chart-legend-inline" aria-hidden="true">
              <span><i style={{ background: SERIES_COLORS.created }} />Tạo mã</span>
              <span><i style={{ background: SERIES_COLORS.scanned }} />Đã quét</span>
              <span><i style={{ background: SERIES_COLORS.consumed }} />Thành công</span>
            </div>
          </div>
          {statsLoading && !loginStats ? (
            <div className="qr-skeleton-block" aria-hidden="true" />
          ) : (
            <>
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
              {range !== 'today' && (
                <p className="qr-chart-note">
                  Bucket hôm nay có thể chưa đủ ngày; số liệu sẽ tiếp tục cập nhật đến hết ngày.
                </p>
              )}
            </>
          )}
        </div>

        <div className="adm-card qr-chart-card">
          <div className="adm-card-head-row">
            <div>
              <h2 className="adm-card-title">Trạng thái phiên</h2>
              <p className="adm-card-subtitle">Chọn một lát để lọc bảng phiên</p>
            </div>
            {sessionStatus && (
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setSessionStatus(null)}
              >
                Bỏ lọc
              </button>
            )}
          </div>
          {statusSlices.length === 0 ? (
            <p className="qr-muted">Chưa có phiên QR trong khoảng thời gian này.</p>
          ) : (
            <>
              <div className="qr-chart-wrap qr-chart-donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusSlices}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      isAnimationActive={false}
                      onClick={(data) => {
                        const payload = (data as unknown as { payload?: StatusSlice }).payload;
                        if (payload?.filter) filterByStatus(payload.filter);
                      }}
                    >
                      {statusSlices.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          opacity={sessionStatus && entry.filter !== sessionStatus ? 0.35 : 1}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="qr-donut-center">
                  <strong>{formatNumber(loginTotals?.created ?? 0)}</strong>
                  <span>phiên</span>
                </div>
              </div>
              <div className="qr-legend">
                {statusSlices.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    className={`qr-legend-item qr-legend-button ${
                      sessionStatus === entry.filter ? 'is-active' : ''
                    }`}
                    onClick={() => filterByStatus(entry.filter)}
                    aria-pressed={sessionStatus === entry.filter}
                  >
                    <i style={{ backgroundColor: entry.color }} />
                    {entry.label}
                    <b>{formatNumber(entry.count)}</b>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="adm-card qr-funnel-card">
        <div className="adm-card-head-row">
          <div>
            <h2 className="adm-card-title">Phễu chuyển đổi</h2>
            <p className="adm-card-subtitle">Tỷ lệ rơi rụng giữa các bước</p>
          </div>
        </div>
        <div className="qr-funnel">
          {funnelSteps.map((step, index) => (
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
              {index > 0 && (
                <small className="qr-funnel-rate">
                  {formatPercent(
                    (step.value / Math.max(1, funnelSteps[index - 1]?.value ?? 1)) * 100
                  )}
                </small>
              )}
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
            <strong>{formatDuration(loginStats?.durations.averageScanSeconds ?? 0)}</strong>
          </div>
          <div>
            <span>TB thời gian đăng nhập</span>
            <strong>{formatDuration(loginStats?.durations.averageLoginSeconds ?? 0)}</strong>
          </div>
        </div>
      </div>

      <div className="qr-bottom-split-grid">
        <div className="qr-left-col">
          <div className="adm-card">
            <div className="adm-card-head-row">
              <div>
                <h2 className="adm-card-title">Top người dùng QR</h2>
                <p className="adm-card-subtitle">Số lần đăng nhập thành công</p>
              </div>
            </div>
            <div className="qr-rank-list">
              {(loginStats?.topUsers ?? []).length === 0 ? (
                <p className="qr-muted">Chưa có người dùng nào đăng nhập bằng QR.</p>
              ) : (
                loginStats?.topUsers.slice(0, 5).map((user, index) => (
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

          <div className="adm-card">
            <h2 className="adm-card-title">Thiết bị tạo mã</h2>
            <div className="qr-chart-wrap qr-chart-bars">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={loginDeviceData.slice(0, 6)}
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
                  <Bar dataKey="count" name="Số phiên" fill={SERIES_COLORS.created} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="adm-card qr-session-card">
          <div className="adm-card-head-row">
            <div>
              <h2 className="adm-card-title">Phiên gần đây</h2>
              <p className="adm-card-subtitle">
                {sessionStatus
                  ? `Đang lọc: ${statusLabel(sessionStatus)}`
                  : 'Sắp xếp theo thời gian tạo mới nhất'}
              </p>
            </div>
            {sessionStatus && (
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => {
                  setSessionStatus(null);
                  setSessionPageIndex(0);
                }}
              >
                Xoá lọc
              </button>
            )}
          </div>
          {sessionsError ? (
            <div className="qr-inline-error" role="alert">
              <span>{sessionsError}</span>
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <DataTable
                columns={sessionColumns}
                data={sessionPage.content}
                keyExtractor={(session) => session.id}
                loading={sessionsLoading}
                emptyText={
                  sessionStatus
                    ? `Không có phiên nào ở trạng thái "${statusLabel(sessionStatus)}".`
                    : 'Chưa có phiên QR nào.'
                }
                ariaLabel="Bảng phiên đăng nhập QR gần đây"
              />
              {sessionPage.totalElements > 0 && (
                <div className="qr-session-pagination">
                  <span className="qr-session-page-info">
                    Hiển thị {sessionPageIndex * 5 + 1}-{Math.min((sessionPageIndex + 1) * 5, sessionPage.totalElements)} / {sessionPage.totalElements}
                  </span>
                  <div className="qr-session-page-actions">
                    <button
                      type="button"
                      className="qr-session-page-btn"
                      onClick={() => setSessionPageIndex((prev) => Math.max(0, prev - 1))}
                      disabled={sessionPageIndex <= 0 || sessionsLoading}
                      title="Trang trước"
                      aria-label="Trang trước"
                    >
                      &lt;
                    </button>
                    <span className="qr-session-page-num">
                      {(sessionPage.number ?? sessionPageIndex) + 1}/{sessionPage.totalPages || 1}
                    </span>
                    <button
                      type="button"
                      className="qr-session-page-btn"
                      onClick={() => setSessionPageIndex((prev) => prev + 1)}
                      disabled={sessionPageIndex >= (sessionPage.totalPages ?? 1) - 1 || sessionsLoading}
                      title="Trang sau"
                      aria-label="Trang sau"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="qr-data-note">
        Dữ liệu phiên QR đăng nhập được lưu 30 ngày. IP hiển thị đã được che bớt (ví dụ
        172.18.xxx.xxx) để bảo vệ quyền riêng tư.
      </p>
    </div>
  );

  const audioView = (
    <div className="qr-admin-grid">
      <div className="adm-metrics-row qr-kpi-row">
        <MetricCard
          label="Tổng lượt quét"
          value={audioTotals?.scans}
          loading={statsLoading}
          delta={deltaPercent(audioTotals?.scans ?? 0, previousAudioTotals?.scans ?? null)}
        />
        <MetricCard
          label="Lượt nghe audio"
          value={audioTotals?.audioPlays}
          loading={statsLoading}
          delta={deltaPercent(audioTotals?.audioPlays ?? 0, previousAudioTotals?.audioPlays ?? null)}
        />
        <MetricCard
          label="Nghe hoàn tất"
          value={audioTotals?.audioCompleted}
          loading={statsLoading}
          delta={deltaPercent(
            audioTotals?.audioCompleted ?? 0,
            previousAudioTotals?.audioCompleted ?? null
          )}
          hint={`${formatPercent(audioStats?.rates.completionRate ?? 0)} tỷ lệ hoàn tất`}
          tone="good"
        />
        <MetricCard
          label="Quét sang nghe"
          value={formatPercent(audioStats?.rates.scanToPlayRate ?? 0)}
          loading={statsLoading}
          pointDelta={
            previousScanToPlay == null
              ? null
              : round1((audioStats?.rates.scanToPlayRate ?? 0) - previousScanToPlay)
          }
          hint={`${formatNumber(audioTotals?.uniqueSessions ?? 0)} phiên duy nhất`}
        />
      </div>

      <div className="adm-split-grid qr-chart-grid">
        <div className="adm-card qr-chart-card qr-chart-wide">
          <div className="adm-card-head-row">
            <div>
              <h2 className="adm-card-title">Lượt quét và lượt nghe theo thời gian</h2>
              <p className="adm-card-subtitle">Dữ liệu ghi nhận theo múi giờ Việt Nam</p>
            </div>
            <div className="qr-chart-legend-inline" aria-hidden="true">
              <span><i style={{ background: SERIES_COLORS.created }} />Lượt quét</span>
              <span><i style={{ background: SERIES_COLORS.plays }} />Lượt nghe</span>
              <span><i style={{ background: SERIES_COLORS.completed }} />Hoàn tất</span>
            </div>
          </div>
          {statsLoading && !audioStats ? (
            <div className="qr-skeleton-block" aria-hidden="true" />
          ) : (
            <div className="qr-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={audioSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qrScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SERIES_COLORS.created} stopOpacity={0.24} />
                      <stop offset="95%" stopColor={SERIES_COLORS.created} stopOpacity={0} />
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
                    stroke={SERIES_COLORS.created}
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
                    strokeDasharray="5 4"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="adm-card qr-chart-card">
          <h2 className="adm-card-title">Ngôn ngữ được nghe</h2>
          <div className="qr-chart-wrap qr-chart-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={54}
                  outerRadius={82}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {languageData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="qr-donut-center">
              <strong>{formatNumber(audioTotals?.audioPlays ?? 0)}</strong>
              <span>lượt nghe</span>
            </div>
          </div>
          <div className="qr-legend qr-legend-wrap">
            {(audioStats?.languages ?? []).map((entry) => (
              <span key={entry.key} className="qr-legend-item">
                <i style={{ backgroundColor: LANGUAGE_COLORS[entry.key] ?? '#94A3B8' }} />
                {LANGUAGE_LABELS[entry.key] ?? entry.key.toUpperCase()}
                <b>{formatNumber(entry.count)}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-split-grid qr-chart-grid">
        <div className="adm-card">
          <h2 className="adm-card-title">Thiết bị quét</h2>
          {deviceData.length === 0 ? (
            <p className="qr-muted">Chưa ghi nhận loại thiết bị cho lượt quét nào.</p>
          ) : (
            <div className="qr-trigger-list">
              {deviceData.map((entry) => (
                <div key={entry.key} className="qr-trigger-row">
                  <span>{entry.name}</span>
                  <div className="qr-trigger-track qr-trigger-track-teal">
                    <div
                      style={{
                        width: `${Math.max(
                          2,
                          (entry.count / Math.max(1, audioTotals?.scans ?? 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <strong>{formatNumber(entry.count)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

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
                        (entry.count / Math.max(1, audioTotals?.scans ?? 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <strong>{formatNumber(entry.count)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-card">
        <div className="adm-card-head-row">
          <div>
            <h2 className="adm-card-title">Hiệu quả theo điểm thuyết minh</h2>
            <p className="adm-card-subtitle">Xếp hạng theo số lượt quét QR</p>
          </div>
        </div>
        <DataTable
          columns={audioPoiColumns}
          data={audioTopPois}
          keyExtractor={(poi) => poi.poiId}
          loading={statsLoading}
          emptyText="Chưa có dữ liệu điểm thuyết minh."
          ariaLabel="Bảng hiệu quả QR audio theo điểm thuyết minh"
        />
      </div>

      <div className="adm-card">
        <div className="adm-card-head-row">
          <div>
            <h2 className="adm-card-title">Lượt quét gần đây</h2>
            <p className="adm-card-subtitle">10 lượt quét mới nhất trong khoảng thời gian đã chọn</p>
          </div>
        </div>
        <DataTable
          columns={recentScanColumns}
          data={audioStats?.recentScans ?? []}
          keyExtractor={(scan) =>
            `${scan.occurredAt}-${scan.poiId ?? 'na'}-${scan.sessionId ?? 'na'}`
          }
          loading={statsLoading}
          emptyText="Chưa có lượt quét QR audio gần đây."
          ariaLabel="Bảng lượt quét QR audio gần đây"
        />
      </div>

      <p className="qr-data-note">
        Dữ liệu QR audio chỉ bắt đầu được ghi nhận từ phiên bản này; các lượt quét trước đây không
        thể phục hồi.
      </p>
    </div>
  );

  const modalSession = selectedSession;

  return (
    <div className="adm-page qr-admin-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">
            {isAccount ? 'QR tài khoản' : 'QR nghe audio'}
          </h1>
          <p className="adm-page-desc">
            {isAccount
              ? 'Theo dõi phiên đăng nhập bằng mã QR trên máy tính, tỷ lệ quét và xác thực.'
              : 'Theo dõi lượt quét QR nghe thuyết minh tại các điểm đến du lịch.'}
            {lastUpdated && (
              <span className="adm-live-updated">
                {' '}Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN', { hour12: false })}
              </span>
            )}
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
            disabled={statsLoading}
          >
            {statsLoading ? 'Đang cập nhật...' : 'Cập nhật số liệu'}
          </button>
        </div>
      </div>

      <div className="qr-admin-toolbar">
        <span className="qr-admin-toolbar-label">
          {isAccount ? 'Thống kê phiên đăng nhập QR' : 'Thống kê lượt quét QR thuyết minh'}
        </span>

        <div className="qr-range-tabs" role="group" aria-label="Khoảng thời gian">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`qr-range-tab ${range === option.key ? 'is-active' : ''}`}
              onClick={() => changeRange(option.key)}
              aria-pressed={range === option.key}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {statsError ? (
        <ErrorState
          title="Không thể tải thống kê QR"
          message={statsError}
          onRetry={() => setRefreshKey((value) => value + 1)}
        />
      ) : statsLoading && ((isAccount && !loginStats) || (!isAccount && !audioStats)) ? (
        <div className="qr-admin-grid" aria-busy="true">
          <div className="adm-metrics-row qr-kpi-row">
            {Array.from({ length: isAccount ? 6 : 4 }).map((_, index) => (
              <div key={index} className="adm-metric-card">
                <div className="qr-skeleton-line qr-skeleton-line-sm" />
                <div className="qr-skeleton-line qr-skeleton-line-lg" />
              </div>
            ))}
          </div>
          <div className="adm-split-grid qr-chart-grid">
            <div className="adm-card qr-chart-wide">
              <div className="qr-skeleton-block" />
            </div>
            <div className="adm-card">
              <div className="qr-skeleton-block qr-skeleton-block-short" />
            </div>
          </div>
        </div>
      ) : noLoginData && isAccount ? (
        <>
          <EmptyState
            title="Chưa có dữ liệu QR tài khoản"
            description="Dữ liệu sẽ xuất hiện sau khi có người tạo và quét mã QR đăng nhập. Phiên QR được lưu tối đa 30 ngày."
            actionText="Mở trang đăng nhập"
            onAction={() => navigate('/dang-nhap')}
          />
          {showDevHint && (
            <p className="qr-data-note">
              Gợi ý dành cho môi trường phát triển: dùng script seed dữ liệu demo để xem trước biểu đồ.
            </p>
          )}
        </>
      ) : noAudioData && !isAccount ? (
        <>
          <EmptyState
            title="Chưa có lượt quét QR audio"
            description="Hệ thống bắt đầu ghi nhận sự kiện quét QR từ phiên bản này. Dữ liệu lịch sử trước đây không thể phục hồi."
          />
          {showDevHint && (
            <p className="qr-data-note">
              Gợi ý dành cho môi trường phát triển: dùng script seed dữ liệu demo để xem trước biểu đồ.
            </p>
          )}
        </>
      ) : isAccount ? (
        accountView
      ) : (
        audioView
      )}

      {modalSession && (
        <div className="adm-dialog-overlay" onClick={() => setSelectedSession(null)}>
          <div
            className="adm-dialog qr-session-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-session-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="qr-session-dialog-head">
              <div>
                <h3 id="qr-session-title" className="adm-dialog-title">
                  Chi tiết phiên QR
                </h3>
                <p className="adm-dialog-message qr-session-id">#{modalSession.id.slice(0, 8)}</p>
              </div>
              <span className={`qr-status-chip qr-status-${modalSession.status.toLowerCase()}`}>
                {statusLabel(modalSession.status)}
              </span>
            </div>

            <dl className="qr-session-meta">
              <div>
                <dt>Người dùng</dt>
                <dd>
                  {modalSession.user
                    ? modalSession.user.fullName || modalSession.user.email
                    : modalSession.status?.toLowerCase().startsWith('guest')
                    ? 'Khách (chưa có tài khoản)'
                    : 'Chưa xác định'}
                </dd>
              </div>
              <div>
                <dt>Thiết bị</dt>
                <dd>{modalSession.deviceLabel || '-'}</dd>
              </div>
              <div>
                <dt>IP tạo phiên</dt>
                <dd>{maskIp(modalSession.createdIp)}</dd>
              </div>
              <div>
                <dt>IP xác nhận</dt>
                <dd>{maskIp(modalSession.approvedIp)}</dd>
              </div>
              <div>
                <dt>Thời gian quét</dt>
                <dd>{formatDuration(modalSession.scanSeconds)}</dd>
              </div>
              <div>
                <dt>Tổng thời gian</dt>
                <dd>{formatDuration(modalSession.totalSeconds)}</dd>
              </div>
            </dl>

            <ol className="qr-timeline">
              <TimelineItem
                label="Tạo mã QR"
                value={modalSession.createdAt}
                active
              />
              <TimelineItem
                label="Thiết bị di động quét mã"
                value={modalSession.scannedAt}
                active={Boolean(modalSession.scannedAt)}
              />
              <TimelineItem
                label="Xác nhận đăng nhập"
                value={modalSession.approvedAt}
                active={Boolean(modalSession.approvedAt)}
              />
              <TimelineItem
                label="Đăng nhập hoàn tất"
                value={modalSession.consumedAt}
                active={Boolean(modalSession.consumedAt)}
              />
              {modalSession.status === 'EXPIRED' && (
                <TimelineItem label="Mã hết hạn" value={modalSession.expiresAt} active tone="warning" />
              )}
            </ol>

            <div className="adm-dialog-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => setSelectedSession(null)}
              >
                Đóng
              </button>
            </div>
          </div>
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
  delta?: number | null;
  pointDelta?: number | null;
  tone?: 'good' | 'warning';
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  loading,
  hint,
  delta,
  pointDelta,
  tone,
}) => {
  const pointText = signedPoint(pointDelta ?? null);
  return (
    <div className={`adm-metric-card ${tone ? `qr-metric-${tone}` : ''}`}>
      <span className="adm-metric-label">{label}</span>
      <div className="adm-metric-value">
        {loading ? '...' : typeof value === 'number' ? formatNumber(value) : value ?? '0'}
      </div>
      <div className="qr-metric-foot">
        {delta != null && (
          <span
            className={`adm-delta ${delta >= 0 ? 'adm-delta-up' : 'adm-delta-down'}`}
            title="So với kỳ trước"
          >
            {formatDelta(delta)}
          </span>
        )}
        {pointText && (
          <span
            className={`adm-delta ${
              (pointDelta ?? 0) >= 0 ? 'adm-delta-up' : 'adm-delta-down'
            }`}
            title="So với kỳ trước"
          >
            {pointText}
          </span>
        )}
        {hint && <span className="adm-metric-hint">{hint}</span>}
      </div>
    </div>
  );
};

interface TimelineItemProps {
  label: string;
  value: string | null;
  active: boolean;
  tone?: 'warning';
}

const TimelineItem: React.FC<TimelineItemProps> = ({ label, value, active, tone }) => (
  <li className={`qr-timeline-item ${active ? 'is-active' : ''} ${tone ? `is-${tone}` : ''}`}>
    <span className="qr-timeline-dot" aria-hidden="true" />
    <div>
      <strong>{label}</strong>
      <small>{active ? formatDateTime(value) : 'Chưa ghi nhận'}</small>
    </div>
  </li>
);

export default QrAnalyticsPage;
