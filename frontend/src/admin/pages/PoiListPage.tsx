import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import {
  AdminPoiListItem,
  PoiRouteOption,
  PoiZoneOption,
} from '../types/poi';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { PoiLanguageSummary } from '../components/PoiLanguageSummary';
import {
  hasLanguageError,
  hasLanguagePending,
  isNeedsAttention,
  POI_LANGUAGE_FILTER_OPTIONS,
  POI_STATUS_FILTER_OPTIONS,
  POI_STATUS_LABEL,
  PoiLanguageFilterValue,
  PoiStatusFilterValue,
  resolveOverallStatus,
} from '../utils/poiStatus';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';

const PAGE_SIZE = 10;

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
  const [statusFilter, setStatusFilter] = useState<PoiStatusFilterValue>('');
  const [languageFilter, setLanguageFilter] = useState<PoiLanguageFilterValue>('');
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
      });
      setRows(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter, routeFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const hasActiveFilters = Boolean(
    searchInput.trim() || zoneFilter || routeFilter || statusFilter || languageFilter
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setZoneFilter('');
    setRouteFilter('');
    setStatusFilter('');
    setLanguageFilter('');
    setPage(0);
  };

  // Backend chưa có tham số lọc theo trạng thái tổng thể và ngôn ngữ,
  // nên hai bộ lọc này lọc trên trang hiện tại đang hiển thị.
  const visibleRows = useMemo(
    () =>
      rows.filter((poi) => {
        const statusKey = (poi.overallStatus || 'ACTIVE').toUpperCase();
        const matchesStatus = !statusFilter || statusKey === statusFilter;
        const matchesLanguage =
          !languageFilter ||
          (languageFilter === 'ERROR'
            ? hasLanguageError(poi.languageSummary, poi.languages)
            : hasLanguagePending(poi.languageSummary, poi.languages));
        return matchesStatus && matchesLanguage;
      }),
    [rows, statusFilter, languageFilter]
  );

  const needsAttentionCount = useMemo(
    () => rows.filter((poi) => isNeedsAttention(poi.overallStatus)).length,
    [rows]
  );

  const zoneNameById = useMemo(() => {
    const map = new Map<number, string>();
    zones.forEach((zone) => map.set(zone.id, zone.name));
    return map;
  }, [zones]);

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
        </div>
      ),
    },
    {
      key: 'zone',
      title: 'Khu vực',
      width: '150px',
      render: (poi) => {
        const zoneName = zoneNameById.get(poi.zoneId) || poi.zoneCode;
        return (
          <div className="adm-cell-stack">
            <span className="adm-cell-primary">{zoneName}</span>
            {poi.zoneCode && <span className="adm-cell-sub">{poi.zoneCode}</span>}
          </div>
        );
      },
    },
    {
      key: 'route',
      title: 'Tuyến',
      width: '190px',
      render: (poi) =>
        poi.routeName ? (
          <div className="adm-cell-stack">
            <span className="adm-cell-primary adm-clamp-2" title={poi.routeName}>
              {poi.routeName}
            </span>
            {poi.stopOrder != null && (
              <span className="adm-cell-sub">Thứ tự {poi.stopOrder}</span>
            )}
          </div>
        ) : (
          <span className="adm-text-warning">Chưa gán tuyến</span>
        ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '140px',
      render: (poi) => {
        const config = resolveOverallStatus(poi.overallStatus);
        const reasons = poi.attentionReasons || [];
        const title = reasons.length > 0 ? reasons.join('\n') : undefined;
        if (config.variant === 'warning') {
          return (
            <StatusBadge variant="warning" title={title}>
              {config.label}
            </StatusBadge>
          );
        }
        return (
          <span
            className={
              config.variant === 'muted' ? 'adm-status-text-muted' : 'adm-status-text'
            }
            title={title}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'audio',
      title: 'Ngôn ngữ',
      width: '170px',
      render: (poi) => (
        <PoiLanguageSummary
          languages={poi.languages}
          summary={poi.languageSummary}
          poiName={poi.name}
        />
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
            Danh sách điểm đến và trạng thái thuyết minh đa ngôn ngữ.
          </p>
        </div>
        <div className="adm-page-actions">
          <Link to="/quan-tri/diem-thuyet-minh/moi" className="adm-btn adm-btn-primary">
            + Thêm điểm thuyết minh
          </Link>
        </div>
      </div>

      <AdminToolbar
        onRefresh={fetchList}
        refreshing={loading}
        refreshLabel="Làm mới"
      >
        <div className="adm-search-wrap">
          <input
            type="search"
            className="adm-input adm-search-input"
            placeholder="Tìm theo tên điểm"
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
          <option value="">{zoneFilter ? 'Tất cả tuyến' : 'Chọn khu vực trước'}</option>
          {routes.map((route) => (
            <option key={route.id} value={String(route.id)}>
              {route.name}
            </option>
          ))}
        </select>

        <select
          className="adm-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PoiStatusFilterValue);
            setPage(0);
          }}
          aria-label="Lọc theo trạng thái"
        >
          {POI_STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="adm-select"
          value={languageFilter}
          onChange={(e) => {
            setLanguageFilter(e.target.value as PoiLanguageFilterValue);
            setPage(0);
          }}
          aria-label="Lọc theo ngôn ngữ"
        >
          {POI_LANGUAGE_FILTER_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
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
      </AdminToolbar>

      {needsAttentionCount > 0 && (
        <p className="adm-list-summary">
          <button
            type="button"
            className="adm-list-summary-btn"
            onClick={() => {
              setStatusFilter('NEEDS_ATTENTION');
              setPage(0);
            }}
          >
            {POI_STATUS_LABEL.NEEDS_ATTENTION}: {needsAttentionCount} điểm
          </button>
        </p>
      )}

      {error ? (
        <ErrorState
          title="Không thể tải danh sách điểm thuyết minh"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && visibleRows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy điểm thuyết minh phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc."
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
            data={visibleRows}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu điểm thuyết minh hiển thị."
            ariaLabel="Bảng danh sách điểm thuyết minh quản trị"
            stickyLastColumn
            caption="Danh sách điểm thuyết minh"
          />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="điểm"
            onPageChange={(next) => setPage(Math.max(0, Math.min(totalPages - 1, next)))}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
};
