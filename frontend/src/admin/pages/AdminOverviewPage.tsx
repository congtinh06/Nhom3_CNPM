import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminClient, normalizeAdminError } from '../api/adminClient';
import { AnalyticsSummaryResponse, AnalyticsTrendsResponse } from '../../types';
import { DataTable, Column } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { QrAlerts } from '../components/QrAlerts';

const SUMMARY_REFRESH_INTERVAL_MS = 10_000;
const ONLINE_WINDOW_MINUTES = 5;
const RESET_CONFIRM_WORD = 'RESET';
const TRENDS_RANGE_DAYS = 14;

const CHART_COLORS = {
  visits: '#0F766E',
  scans: '#2563EB',
  plays: '#C2410C',
};

const SCAN_TRIGGER_COLORS: Record<string, string> = {
  QR: '#C2410C',
  GPS: '#2563EB',
  MANUAL: '#A8A29E',
};

const VISIT_TRIGGER_COLORS: Record<string, string> = {
  QR: '#C2410C',
  DIRECT: '#0F766E',
};

const TRIGGER_LABELS: Record<string, string> = {
  QR: 'Quét mã QR tại điểm dừng',
  GPS: 'GPS tự động',
  MANUAL: 'Nhập token thủ công',
  DIRECT: 'Truy cập trực tiếp / chia sẻ link',
};

interface TopPoiItem {
  poiId: number;
  name: string;
  scans: number;
  plays: number;
}

interface KeyValueItem {
  key: string;
  count: number;
}

interface CountCard {
  key: string;
  label: string;
  to: string;
  endpoint: string;
  activeParams?: Record<string, string | boolean>;
}

interface CountState {
  loading: boolean;
  value: number | null;
  active: number | null;
  error: boolean;
}

const COUNT_CARDS: CountCard[] = [
  {
    key: 'products',
    label: 'Sản phẩm',
    to: '/quan-tri/san-pham',
    endpoint: '/api/admin/products',
    activeParams: { isActive: true },
  },
  {
    key: 'pois',
    label: 'Điểm thuyết minh',
    to: '/quan-tri/diem-thuyet-minh',
    endpoint: '/api/content/admin/pois',
    activeParams: { status: 'ACTIVE' },
  },
  { key: 'zones', label: 'Khu vực', to: '/quan-tri/khu-vuc', endpoint: '/api/content/admin/zones' },
  {
    key: 'routes',
    label: 'Tuyến tham quan',
    to: '/quan-tri/lo-trinh',
    endpoint: '/api/content/admin/routes',
  },
  { key: 'users', label: 'Người dùng', to: '/quan-tri/nguoi-dung', endpoint: '/api/auth/admin/users' },
];

const INITIAL_COUNTS: Record<string, CountState> = COUNT_CARDS.reduce(
  (acc, card) => {
    acc[card.key] = { loading: true, value: null, active: null, error: false };
    return acc;
  },
  {} as Record<string, CountState>
);

interface Delta {
  percent: number;
  count: number;
}

function computeDelta(today: number, yesterday: number): Delta | null {
  if (yesterday > 0) {
    return {
      percent: ((today - yesterday) / yesterday) * 100,
      count: today - yesterday,
    };
  }
  return null;
}

function formatDayLabel(value: string): string {
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value;
}

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export const AdminOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, CountState>>(INITIAL_COUNTS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetInfo, setResetInfo] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  /**
   * Lấy tóm tắt analytics. `showSpinner` chỉ bật cho lần tải đầu / nút bấm tay
   * để các lần poll tự động mỗi 10 giây không làm nhấp nháy số liệu.
   */
  const fetchSummary = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await adminClient.get<AnalyticsSummaryResponse>('/api/analytics/summary');
      setSummary(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      const norm = normalizeAdminError(err);
      setError(norm.message);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  const fetchTrends = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    }
    try {
      const response = await adminClient.get<AnalyticsTrendsResponse>(
        '/api/analytics/admin/trends',
        { params: { days: TRENDS_RANGE_DAYS } }
      );
      setTrends(response.data);
    } catch {
      // Biểu đồ xu hướng chưa tải được thì dashboard vẫn hiển thị phần còn lại.
      setTrends(null);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    setCounts(INITIAL_COUNTS);
    await Promise.all(
      COUNT_CARDS.map(async (card) => {
        try {
          const response = await adminClient.get<{ totalElements?: number }>(card.endpoint, {
            params: { page: 0, size: 1 },
          });
          const total = response.data?.totalElements;
          let active: number | null = null;
          if (card.activeParams) {
            try {
              const activeRes = await adminClient.get<{ totalElements?: number }>(card.endpoint, {
                params: { page: 0, size: 1, ...card.activeParams },
              });
              const activeTotal = activeRes.data?.totalElements;
              active = typeof activeTotal === 'number' ? activeTotal : null;
            } catch {
              active = null;
            }
          }
          setCounts((prev) => ({
            ...prev,
            [card.key]: {
              loading: false,
              value: typeof total === 'number' ? total : 0,
              active,
              error: false,
            },
          }));
        } catch {
          setCounts((prev) => ({
            ...prev,
            [card.key]: { loading: false, value: null, active: null, error: true },
          }));
        }
      })
    );
  }, []);

  useEffect(() => {
    fetchSummary(true);
    fetchTrends(true);
    fetchCounts();

    // Realtime: tự làm mới số liệu mỗi 10 giây (không spinner để tránh nhấp nháy).
    intervalRef.current = window.setInterval(() => {
      void fetchSummary(false);
    }, SUMMARY_REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchSummary, fetchTrends, fetchCounts]);

  const handleRefresh = useCallback(() => {
    fetchSummary(true);
    fetchTrends(true);
    fetchCounts();
  }, [fetchSummary, fetchTrends, fetchCounts]);

  const openResetDialog = useCallback(() => {
    setResetDialogOpen(true);
    setResetConfirmInput('');
    setResetError(null);
    setResetInfo(null);
  }, []);

  const closeResetDialog = useCallback(() => {
    if (resetting) return;
    setResetDialogOpen(false);
    setResetConfirmInput('');
    setResetError(null);
  }, [resetting]);

  const handleResetAnalytics = useCallback(async () => {
    if (resetConfirmInput.trim().toUpperCase() !== RESET_CONFIRM_WORD || resetting) return;
    setResetting(true);
    setResetError(null);
    try {
      const response = await adminClient.delete<{ deleted?: number; message?: string }>(
        '/api/analytics/admin/events'
      );
      const deleted = response.data?.deleted ?? 0;
      setResetDialogOpen(false);
      setResetConfirmInput('');
      setResetInfo(
        response.data?.message ||
          `Đã đặt lại toàn bộ số liệu analytics (${deleted} sự kiện đã xoá)`
      );
      await fetchSummary(true);
      await fetchTrends(true);
    } catch (err) {
      const norm = normalizeAdminError(err);
      setResetError(norm.message);
    } finally {
      setResetting(false);
    }
  }, [resetConfirmInput, resetting, fetchSummary, fetchTrends]);

  const topPoiColumns: Column<TopPoiItem>[] = [
    {
      key: 'name',
      title: 'Điểm du lịch',
      render: (item) => <span className="adm-table-strong">{item.name}</span>,
    },
    {
      key: 'scans',
      title: 'Lượt quét QR',
      align: 'right',
      render: (item) => item.scans.toLocaleString('vi-VN'),
    },
    {
      key: 'plays',
      title: 'Lượt nghe Audio',
      align: 'right',
      render: (item) => item.plays.toLocaleString('vi-VN'),
    },
  ];

  const visitTriggerData: KeyValueItem[] = summary?.visitsByTrigger
    ? Object.entries(summary.visitsByTrigger).map(([key, count]) => ({ key, count }))
    : [];

  const scanTriggerData: KeyValueItem[] = summary?.scansByTrigger
    ? Object.entries(summary.scansByTrigger).map(([key, count]) => ({ key, count }))
    : [];

  const languageData: KeyValueItem[] = summary?.playsByLanguage
    ? Object.entries(summary.playsByLanguage).map(([key, count]) => ({ key, count }))
    : [];

  const resetConfirmValid = resetConfirmInput.trim().toUpperCase() === RESET_CONFIRM_WORD;

  const trendSeries = (trends?.series ?? []).map((point) => ({
    ...point,
    label: formatDayLabel(point.date),
  }));
  const hasTrendData = trendSeries.some((p) => p.visits > 0 || p.scans > 0 || p.plays > 0);

  const renderDeltaBadge = (delta: Delta | null) => {
    if (!delta) return null;
    const up = delta.percent >= 0;
    return (
      <span
        className={`adm-delta ${up ? 'adm-delta-up' : 'adm-delta-down'}`}
        title="So với hôm qua"
      >
        {up ? '▲' : '▼'} {formatPercent(Math.abs(delta.percent))}
      </span>
    );
  };

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">
            Tổng quan hệ thống
            <span className="adm-live-badge" aria-label="Chế độ cập nhật trực tiếp">
              <span className="adm-live-dot" aria-hidden="true" />
              TRỰC TIẾP
            </span>
          </h1>
          <p className="adm-page-desc">
            Theo dõi lượt truy cập website, lượt quét mã QR, số lượt nghe thuyết minh realtime
            mỗi {SUMMARY_REFRESH_INTERVAL_MS / 1000} giây, số liệu ngày bucket theo múi giờ
            Việt Nam, so sánh hôm nay với hôm qua
            {lastUpdated && (
              <span className="adm-live-updated">
                {', '}cập nhật lúc{' '}
                {lastUpdated.toLocaleTimeString('vi-VN', { hour12: false })}
              </span>
            )}
          </p>
        </div>
        <div className="adm-page-head-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật' : 'Cập nhật số liệu'}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-danger"
            onClick={openResetDialog}
          >
            Đặt lại số liệu
          </button>
        </div>
      </div>

      {resetInfo && (
        <div className="adm-reset-success" role="status">
          {resetInfo}
        </div>
      )}

      <div className="adm-overview-grid">
        <QrAlerts />

        {/* Hàng thẻ số lượng nội dung quản trị */}
        <div className="adm-metrics-row">
          {COUNT_CARDS.map((card) => {
            const state = counts[card.key];
            return (
              <Link key={card.key} to={card.to} className="adm-metric-card adm-metric-link">
                <span className="adm-metric-label">{card.label}</span>
                <div className="adm-metric-value">
                  {state?.loading
                    ? <span className="adm-metric-loading">Đang tải</span>
                    : state?.error
                    ? '-'
                    : state?.active != null
                    ? `${state.active.toLocaleString('vi-VN')} / ${(state.value ?? 0).toLocaleString('vi-VN')}`
                    : (state?.value ?? 0).toLocaleString('vi-VN')}
                </div>
                <span className="adm-metric-hint">
                  {card.activeParams ? 'Hoạt động / Tổng' : 'Quản lý'}
                </span>
              </Link>
            );
          })}
        </div>

        {error ? (
          <ErrorState
            title="Không thể tải báo cáo thống kê"
            message={error}
            onRetry={() => void fetchSummary(true)}
          />
        ) : (
          <>
            {/* Hàng thẻ thống kê chỉ số chính + so sánh hôm nay / hôm qua */}
            <div className="adm-metrics-row">
              <div className="adm-metric-card">
                <span className="adm-metric-label">Lượt truy cập website</span>
                <div className="adm-metric-value">
                  {loading
                    ? <span className="adm-metric-loading">Đang tải</span>
                    : (summary?.totalVisits ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="adm-metric-foot">
                  {renderDeltaBadge(computeDelta(trends?.today.visits ?? 0, trends?.yesterday.visits ?? 0))}
                  <span className="adm-metric-hint">Phiên truy cập từ QR & trực tiếp</span>
                </div>
              </div>

              <div className="adm-metric-card adm-metric-online">
                <span className="adm-metric-label">
                  Đang online ({ONLINE_WINDOW_MINUTES} phút gần nhất)
                </span>
                <div className="adm-metric-value">
                  <span className="adm-online-dot" aria-hidden="true" />
                  {loading
                    ? <span className="adm-metric-loading">Đang tải</span>
                    : (summary?.onlineVisitors ?? 0).toLocaleString('vi-VN')}
                </div>
                <span className="adm-metric-hint">Phiên hoạt động gần đây</span>
              </div>

              <div className="adm-metric-card">
                <span className="adm-metric-label">Tổng lượt quét QR</span>
                <div className="adm-metric-value">
                  {loading
                    ? <span className="adm-metric-loading">Đang tải</span>
                    : (summary?.totalScans ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="adm-metric-foot">
                  {renderDeltaBadge(computeDelta(trends?.today.scans ?? 0, trends?.yesterday.scans ?? 0))}
                  <span className="adm-metric-hint">Hôm nay: {(trends?.today.scans ?? 0).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="adm-metric-card">
                <span className="adm-metric-label">Tổng lượt nghe Audio</span>
                <div className="adm-metric-value">
                  {loading
                    ? <span className="adm-metric-loading">Đang tải</span>
                    : (summary?.totalAudioPlays ?? 0).toLocaleString('vi-VN')}
                </div>
                <div className="adm-metric-foot">
                  {renderDeltaBadge(computeDelta(trends?.today.plays ?? 0, trends?.yesterday.plays ?? 0))}
                  <span className="adm-metric-hint">Hôm nay: {(trends?.today.plays ?? 0).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="adm-metric-card">
                <span className="adm-metric-label">Lượt nghe hoàn tất</span>
                <div className="adm-metric-value">
                  {loading
                    ? <span className="adm-metric-loading">Đang tải</span>
                    : (summary?.audioCompleted ?? 0).toLocaleString('vi-VN')}
                </div>
                <span className="adm-metric-hint">Nghe tới hết bài thuyết minh</span>
              </div>
            </div>

            {/* Biểu đồ xu hướng {TRENDS_RANGE_DAYS} ngày */}
            <div className="adm-card">
              <div className="adm-card-head">
                <h2 className="adm-card-title">Xu hướng {TRENDS_RANGE_DAYS} ngày</h2>
                <span className="adm-card-note">Lượt truy cập, quét QR, nghe audio theo ngày</span>
              </div>
              {loading && !trends ? (
                <div className="adm-chart-empty">Đang tải dữ liệu biểu đồ</div>
              ) : hasTrendData ? (
                <div className="adm-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ovVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.visits} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={CHART_COLORS.visits} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ovScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.scans} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={CHART_COLORS.scans} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ovPlays" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.plays} stopOpacity={0.22} />
                          <stop offset="95%" stopColor={CHART_COLORS.plays} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number, name: string) => [formatNumber(v), name]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="visits"
                        name="Lượt truy cập"
                        stroke={CHART_COLORS.visits}
                        fill="url(#ovVisits)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        name="Lượt quét QR"
                        stroke={CHART_COLORS.scans}
                        fill="url(#ovScans)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="plays"
                        name="Lượt nghe audio"
                        stroke={CHART_COLORS.plays}
                        fill="url(#ovPlays)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="adm-chart-empty">Chưa có dữ liệu theo ngày để vẽ xu hướng</div>
              )}
            </div>

            {/* Biểu đồ tỷ trọng nguồn theo dạng donut */}
            <div className="adm-split-grid">
              <div className="adm-card">
                <h2 className="adm-card-title">Lượt truy cập theo nguồn</h2>
                {loading && !summary ? (
                  <div className="adm-chart-empty">Đang tải</div>
                ) : visitTriggerData.some((i) => i.count > 0) ? (
                  <div className="adm-donut-flex">
                    <div className="adm-chart-wrap adm-chart-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={visitTriggerData.map((i) => ({ name: TRIGGER_LABELS[i.key] ?? i.key, value: i.count }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={82}
                            paddingAngle={2}
                            isAnimationActive={false}
                          >
                            {visitTriggerData.map((item) => (
                              <Cell key={item.key} fill={VISIT_TRIGGER_COLORS[item.key] ?? '#94A3B8'} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="adm-legend">
                      {visitTriggerData.map((item) => (
                        <span key={item.key} className="adm-legend-item">
                          <i style={{ backgroundColor: VISIT_TRIGGER_COLORS[item.key] ?? '#94A3B8' }} />
                          {TRIGGER_LABELS[item.key] ?? item.key}
                          <b>{formatNumber(item.count)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="adm-chart-empty">Chưa ghi nhận lượt truy cập nào</div>
                )}
              </div>

              <div className="adm-card">
                <h2 className="adm-card-title">Lượt quét theo nguồn kích hoạt</h2>
                {loading && !summary ? (
                  <div className="adm-chart-empty">Đang tải</div>
                ) : scanTriggerData.some((i) => i.count > 0) ? (
                  <div className="adm-donut-flex">
                    <div className="adm-chart-wrap adm-chart-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={scanTriggerData.map((i) => ({ name: TRIGGER_LABELS[i.key] ?? i.key, value: i.count }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={82}
                            paddingAngle={2}
                            isAnimationActive={false}
                          >
                            {scanTriggerData.map((item) => (
                              <Cell key={item.key} fill={SCAN_TRIGGER_COLORS[item.key] ?? '#94A3B8'} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="adm-legend">
                      {scanTriggerData.map((item) => (
                        <span key={item.key} className="adm-legend-item">
                          <i style={{ backgroundColor: SCAN_TRIGGER_COLORS[item.key] ?? '#94A3B8' }} />
                          {TRIGGER_LABELS[item.key] ?? item.key}
                          <b>{formatNumber(item.count)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="adm-chart-empty">Chưa ghi nhận lượt quét theo nguồn nào</div>
                )}
              </div>
            </div>

            {/* Bảng phân bổ theo ngôn ngữ + top du lịch dạng bảng gọn */}
            <div className="adm-split-grid">
              <div className="adm-card">
                <h2 className="adm-card-title">Top điểm du lịch tương tác cao nhất</h2>
                {(summary?.topPois?.length ?? 0) > 0 ? (
                  <div className="adm-chart-wrap adm-chart-horizontal">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(summary?.topPois ?? []).map((poi) => ({
                          name: poi.name ?? `POI #${poi.poiId}`,
                          scans: poi.scans,
                          plays: poi.plays,
                        }))}
                        layout="vertical"
                        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E7E5E4" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="scans" name="Lượt quét QR" fill={CHART_COLORS.scans} isAnimationActive={false} barSize={10} />
                        <Bar dataKey="plays" name="Lượt nghe audio" fill={CHART_COLORS.plays} isAnimationActive={false} barSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="adm-chart-empty">Chưa có dữ liệu điểm du lịch phổ biến</div>
                )}
              </div>

              <div className="adm-card">
                <h2 className="adm-card-title">Lượt nghe theo ngôn ngữ</h2>
                {languageData.some((i) => i.count > 0) ? (
                  <div className="adm-chart-wrap adm-chart-horizontal">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={languageData.map((item) => ({ name: item.key.toUpperCase(), count: item.count }))}
                        margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(v: number) => formatNumber(v)} />
                        <Bar dataKey="count" name="Lượt nghe" fill={CHART_COLORS.plays} isAnimationActive={false} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="adm-chart-empty">Chưa có lượt nghe theo ngôn ngữ</div>
                )}
              </div>
            </div>

            {/* Bảng chi tiết top du lịch giữ lại để đối chiếu số chính xác */}
            <div className="adm-card">
              <h2 className="adm-card-title">Chi tiết lượt tương tác theo điểm du lịch</h2>
              <DataTable
                columns={topPoiColumns}
                data={summary?.topPois || []}
                keyExtractor={(poi) => poi.poiId}
                loading={loading}
                emptyText="Chưa có dữ liệu điểm du lịch phổ biến"
                ariaLabel="Bảng thống kê điểm du lịch phổ biến nhất"
              />
            </div>
          </>
        )}
      </div>

      {resetDialogOpen && (
        <div className="adm-dialog-overlay" onClick={closeResetDialog}>
          <div
            className="adm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adm-reset-title"
            aria-describedby="adm-reset-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="adm-reset-title" className="adm-dialog-title">
              Đặt lại toàn bộ số liệu analytics?
            </h3>
            <p id="adm-reset-desc" className="adm-dialog-message">
              Toàn bộ lượt truy cập, lượt quét QR và lượt nghe audio sẽ bị xoá vĩnh viễn và các
              thẻ số liệu trở về 0. Hành động này <strong>không thể hoàn tác</strong> và không
              ảnh hưởng tới dữ liệu tài khoản, đơn hàng hay nội dung
            </p>
            <div className="adm-reset-confirm-field">
              <label htmlFor="adm-reset-confirm-input">
                Gõ <strong>{RESET_CONFIRM_WORD}</strong> để xác nhận:
              </label>
              <input
                id="adm-reset-confirm-input"
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder={RESET_CONFIRM_WORD}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            {resetError && <p className="adm-reset-error" role="alert">{resetError}</p>}
            <div className="adm-dialog-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={closeResetDialog}
                disabled={resetting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger"
                onClick={() => void handleResetAnalytics()}
                disabled={!resetConfirmValid || resetting}
              >
                {resetting ? 'Đang xoá' : 'Xoá toàn bộ & về 0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
