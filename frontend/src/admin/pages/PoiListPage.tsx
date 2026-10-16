import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import {
  AdminPoiListItem,
  AudioStatusValue,
  POI_LANGUAGES,
  PoiRouteOption,
  PoiZoneOption,
} from '../types/poi';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

const PAGE_SIZE = 10;

const POI_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Đã ẩn',
  MAINTENANCE: 'Bảo trì',
};

export const PoiListPage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminPoiListItem[]>([]);
  const [zones, setZones] = useState<PoiZoneOption[]>([]);
  const [routes, setRoutes] = useState<PoiRouteOption[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [audioFilter, setAudioFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    poiApi
      .getZones()
      .then((list) => setZones(list || []))
      .catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!zoneFilter) {
      setRoutes([]);
      return;
    }
    let cancelled = false;
    poiApi
      .getRoutes(Number(zoneFilter))
      .then((list) => {
        if (!cancelled) setRoutes(list || []);
      })
      .catch(() => {
        if (!cancelled) setRoutes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [zoneFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await poiApi.getAdminPois({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        zoneId: zoneFilter ? Number(zoneFilter) : undefined,
        routeId: routeFilter ? Number(routeFilter) : undefined,
        audioStatus: audioFilter ? (audioFilter as AudioStatusValue) : undefined,
      });
      setRows(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter, routeFilter, audioFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const hasActiveFilters = Boolean(searchInput.trim() || zoneFilter || routeFilter || audioFilter);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setZoneFilter('');
    setRouteFilter('');
    setAudioFilter('');
    setPage(0);
  };

  const columns: Column<AdminPoiListItem>[] = [
    {
      key: 'name',
      title: 'Tên điểm',
      render: (poi) => (
        <div className="adm-product-info-cell">
          <Link
            to={`/quan-tri/diem-thuyet-minh/${poi.id}`}
            className="adm-product-name-link"
          >
            {poi.name}
          </Link>
          <span className="adm-product-slug">
            {poi.code} · v{poi.version}
          </span>
        </div>
      ),
    },
    {
      key: 'zone',
      title: 'Khu vực',
      width: '110px',
      render: (poi) => <span className="adm-category-tag">{poi.zoneCode}</span>,
    },
    {
      key: 'route',
      title: 'Tuyến / Thứ tự',
      width: '160px',
      render: (poi) =>
        poi.routeName ? (
          <span>
            {poi.routeName}
            {poi.stopOrder != null ? ` · #${poi.stopOrder}` : ''}
          </span>
        ) : (
          <span className="adm-date-text">—</span>
        ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '130px',
      render: (poi) => (
        <span className="adm-date-text">
          {POI_STATUS_LABELS[poi.status] || poi.status}
        </span>
      ),
    },
    {
      key: 'audio',
      title: 'Thuyết minh đa ngôn ngữ',
      width: '220px',
      render: (poi) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {POI_LANGUAGES.map((lang) => {
            const status = poi.audioStatusByLanguage?.[lang.code];
            return (
              <span
                key={lang.code}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title={status ? `${lang.label}: ${status}` : `${lang.label}: chưa có bản dịch`}
              >
                <span className="adm-lang-chip">{lang.code.toUpperCase()}</span>
                {status ? (
                  <StatusBadge status={status} />
                ) : (
                  <span className="adm-date-text">—</span>
                )}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      key: 'publishStatus',
      title: 'Phát hành',
      width: '130px',
      render: (poi) => (
        <StatusBadge status={poi.publishStatus} />
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '100px',
      render: (poi) => (
        <div className="adm-row-actions">
          <Link
            to={`/quan-tri/diem-thuyet-minh/${poi.id}`}
            className="adm-btn adm-btn-secondary adm-btn-sm"
            aria-label={`Chỉnh sửa ${poi.name}`}
          >
            Sửa
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Quản lý điểm thuyết minh</h1>
          <p className="adm-page-desc">
            Danh sách điểm đến, tọa độ kích hoạt và trạng thái thuyết minh đa ngôn ngữ trên
            website SaigonVoice.
          </p>
        </div>
        <Link to="/quan-tri/diem-thuyet-minh/moi" className="adm-btn adm-btn-primary">
          + Thêm điểm thuyết minh
        </Link>
      </div>

      <div className="adm-toolbar">
        <div className="adm-toolbar-left">
          <div className="adm-search-wrap">
            <input
              type="search"
              className="adm-input adm-search-input"
              placeholder="Tìm theo tên hoặc mã điểm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Tìm kiếm điểm thuyết minh"
            />
          </div>

          <select
            className="adm-select"
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value);
              setRouteFilter('');
              setPage(0);
            }}
            aria-label="Lọc theo khu vực"
          >
            <option value="">Tất cả khu vực</option>
            {zones.map((zone) => (
              <option key={zone.id} value={String(zone.id)}>
                {zone.name}
              </option>
            ))}
          </select>

          <select
            className="adm-select"
            value={routeFilter}
            onChange={(e) => {
              setRouteFilter(e.target.value);
              setPage(0);
            }}
            disabled={!zoneFilter}
            aria-label="Lọc theo tuyến"
          >
            <option value="">Tất cả tuyến</option>
            {routes.map((route) => (
              <option key={route.id} value={String(route.id)}>
                {route.name}
              </option>
            ))}
          </select>

          <select
            className="adm-select"
            value={audioFilter}
            onChange={(e) => {
              setAudioFilter(e.target.value);
              setPage(0);
            }}
            aria-label="Lọc theo trạng thái thuyết minh"
          >
            <option value="">Tất cả trạng thái âm thanh</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="READY">Sẵn sàng</option>
            <option value="FAILED_TTS">Lỗi tổng hợp</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="adm-btn adm-btn-ghost adm-btn-sm"
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="adm-toolbar-right">
          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={fetchList}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState
          title="Không thể tải danh sách điểm thuyết minh"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy điểm thuyết minh phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc khu vực, tuyến và trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có điểm thuyết minh nào"
            description="Bắt đầu thêm điểm đến đầu tiên để du khách có thể quét mã và nghe thuyết minh."
            actionText="+ Thêm điểm thuyết minh mới"
            onAction={() => navigate('/quan-tri/diem-thuyet-minh/moi')}
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu điểm thuyết minh hiển thị."
            ariaLabel="Bảng danh sách điểm thuyết minh quản trị"
          />

          {totalPages > 1 && (
            <div className="adm-pagination">
              <div className="adm-pagination-info">
                Hiển thị trang {page + 1} trên {totalPages} (Tổng cộng{' '}
                {totalElements.toLocaleString('vi-VN')} điểm)
              </div>
              <div className="adm-pagination-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0 || loading}
                >
                  &larr; Trang trước
                </button>
                <span className="adm-pagination-current">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Trang sau &rarr;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
