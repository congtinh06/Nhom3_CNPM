import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminClient, normalizeAdminError } from '../api/adminClient';
import { AnalyticsSummaryResponse } from '../../types';
import { DataTable, Column } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { QrAlerts } from '../components/QrAlerts';

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

export const AdminOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, CountState>>(INITIAL_COUNTS);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminClient.get<AnalyticsSummaryResponse>('/api/analytics/summary');
      setSummary(response.data);
    } catch (err) {
      const norm = normalizeAdminError(err);
      setError(norm.message);
    } finally {
      setLoading(false);
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
    fetchSummary();
    fetchCounts();
  }, [fetchSummary, fetchCounts]);

  const handleRefresh = useCallback(() => {
    fetchSummary();
    fetchCounts();
  }, [fetchSummary, fetchCounts]);

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

  const triggerColumns: Column<KeyValueItem>[] = [
    {
      key: 'key',
      title: 'Nguồn kích hoạt',
      render: (item) => item.key,
    },
    {
      key: 'count',
      title: 'Số lượt',
      align: 'right',
      render: (item) => item.count.toLocaleString('vi-VN'),
    },
  ];

  const languageColumns: Column<KeyValueItem>[] = [
    {
      key: 'key',
      title: 'Ngôn ngữ',
      render: (item) => (
        <span className="adm-lang-chip">{item.key.toUpperCase()}</span>
      ),
    },
    {
      key: 'count',
      title: 'Số lượt',
      align: 'right',
      render: (item) => item.count.toLocaleString('vi-VN'),
    },
  ];

  const triggerData: KeyValueItem[] = summary?.scansByTrigger
    ? Object.entries(summary.scansByTrigger).map(([key, count]) => ({ key, count }))
    : [];

  const languageData: KeyValueItem[] = summary?.playsByLanguage
    ? Object.entries(summary.playsByLanguage).map(([key, count]) => ({ key, count }))
    : [];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Tổng quan hệ thống</h1>
          <p className="adm-page-desc">
            Theo dõi lưu lượng quét mã QR, số lượt nghe thuyết minh và các điểm đến nhận được tương tác cao nhất.
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-secondary"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật số liệu'}
        </button>
      </div>

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
                    ? '...'
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
            onRetry={fetchSummary}
          />
        ) : (
          <>
            {/* Hàng thẻ thống kê chỉ số chính */}
            <div className="adm-metrics-row">
              <div className="adm-metric-card">
                <span className="adm-metric-label">Tổng lượt quét QR</span>
                <div className="adm-metric-value">
                  {loading ? '...' : (summary?.totalScans ?? 0).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="adm-metric-card">
                <span className="adm-metric-label">Tổng lượt nghe Audio</span>
                <div className="adm-metric-value">
                  {loading ? '...' : (summary?.totalAudioPlays ?? 0).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="adm-metric-card">
                <span className="adm-metric-label">Lượt nghe hoàn tất</span>
                <div className="adm-metric-value">
                  {loading ? '...' : (summary?.audioCompleted ?? 0).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            {/* Hàng bảng phân bổ theo nguồn và ngôn ngữ */}
            <div className="adm-split-grid">
              <div className="adm-card">
                <h2 className="adm-card-title">Lượt quét theo nguồn kích hoạt</h2>
                <DataTable
                  columns={triggerColumns}
                  data={triggerData}
                  keyExtractor={(item) => item.key}
                  loading={loading}
                  emptyText="Chưa ghi nhận lượt quét theo nguồn nào."
                  ariaLabel="Bảng phân bổ nguồn kích hoạt quét QR"
                />
              </div>

              <div className="adm-card">
                <h2 className="adm-card-title">Lượt nghe theo ngôn ngữ</h2>
                <DataTable
                  columns={languageColumns}
                  data={languageData}
                  keyExtractor={(item) => item.key}
                  loading={loading}
                  emptyText="Chưa có lượt nghe theo ngôn ngữ."
                  ariaLabel="Bảng phân bổ lượt nghe theo ngôn ngữ"
                />
              </div>
            </div>

            {/* Bảng Top điểm du lịch phổ biến */}
            <div className="adm-card">
              <h2 className="adm-card-title">Top điểm du lịch tương tác cao nhất</h2>
              <DataTable
                columns={topPoiColumns}
                data={summary?.topPois || []}
                keyExtractor={(poi) => poi.poiId}
                loading={loading}
                emptyText="Chưa có dữ liệu điểm du lịch phổ biến."
                ariaLabel="Bảng thống kê điểm du lịch phổ biến nhất"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
