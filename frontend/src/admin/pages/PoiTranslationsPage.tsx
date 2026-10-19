import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import {
  AdminPoiLanguage,
  AdminPoiListItem,
  POI_LANGUAGES,
  PoiZoneOption,
} from '../types/poi';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  POI_LANGUAGE_FILTER_OPTIONS,
  PoiLanguageFilterValue,
  resolveLanguageStatus,
} from '../utils/poiStatus';
import { formatDateTime } from '../utils/format';

// ============================================================================
// Trang "Bản dịch và audio" — route /quan-tri/diem-thuyet-minh/ban-dich
// Chức năng: xem trạng thái bản dịch + audio của từng điểm theo 4 ngôn ngữ
// (vi/en/ja/ko), lọc theo tên/khu vực/trạng thái ngôn ngữ, phân trang phía server.
// ============================================================================

const PAGE_SIZE = 10;

// Lấy trạng thái audio của 1 ngôn ngữ trong 1 dòng điểm (dữ liệu từ getAdminPois).
function findLanguage(
  poi: AdminPoiListItem,
  languageCode: string
): AdminPoiLanguage | undefined {
  return poi.languages?.find((lang) => lang.languageCode === languageCode);
}

// Lần thử audio gần nhất (mới nhất) trong tất cả ngôn ngữ của điểm.
function latestAttempt(poi: AdminPoiListItem): string | null {
  const attempts = (poi.languages ?? [])
    .map((lang) => lang.lastAttemptAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  return attempts.length > 0 ? attempts[attempts.length - 1]! : null;
}

export const PoiTranslationsPage: React.FC = () => {
  // --- State dữ liệu bảng ---
  const [rows, setRows] = useState<AdminPoiListItem[]>([]);
  const [zones, setZones] = useState<PoiZoneOption[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- State bộ lọc + phân trang ---
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState<PoiLanguageFilterValue>('');
  const [page, setPage] = useState(0);

  // Nạp danh sách khu vực cho ô lọc khu vực (1 lần khi mở trang).
  useEffect(() => {
    poiApi
      .getZones()
      .then((list) => setZones(list || []))
      .catch(() => setZones([]));
  }, []);

  // Debounce ô tìm kiếm 300ms rồi mới gọi API (tránh gọi mỗi ký tự).
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Gọi API danh sách điểm (server-side phân trang) theo bộ lọc hiện tại.
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: Parameters<typeof poiApi.getAdminPois>[0] = {
      page,
      size: PAGE_SIZE,
      search: search || undefined,
      zoneId: zoneFilter ? Number(zoneFilter) : undefined,
    };
    if (languageFilter) params.languageStatus = languageFilter;
    try {
      const result = await poiApi.getAdminPois(params);
      setRows(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter, languageFilter]);

  // Tự động tải lại mỗi khi bộ lọc/trang thay đổi.
  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const hasActiveFilters = Boolean(searchInput.trim() || zoneFilter || languageFilter);

  // Nút "Xóa bộ lọc": đưa toàn bộ bộ lọc về mặc định.
  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setZoneFilter('');
    setLanguageFilter('');
    setPage(0);
  };

  // Map zoneId -> tên khu vực để hiển thị cột "Khu vực".
  const zoneNameById = useMemo(() => {
    const map = new Map<number, string>();
    zones.forEach((zone) => map.set(zone.id, zone.name));
    return map;
  }, [zones]);

  // Ô của 1 ngôn ngữ: badge trạng thái audio + thời lượng (nếu đã READY).
  const renderLanguageCell = (poi: AdminPoiListItem, languageCode: string) => {
    const language = findLanguage(poi, languageCode);
    if (!language) {
      return <span className="adm-date-text">Chưa có</span>;
    }
    const config = resolveLanguageStatus(language.audioStatus);
    const duration =
      (language.audioStatus || '').toUpperCase() === 'READY' && language.audioDurationSeconds
        ? `${language.audioDurationSeconds} giây`
        : null;
    return (
      <div className="adm-cell-stack">
        <StatusBadge variant={config.variant} title={language.errorReason || undefined}>
          {config.label}
        </StatusBadge>
        {duration && <span className="adm-cell-sub">{duration}</span>}
      </div>
    );
  };

  // --- Định nghĩa các cột của bảng ---
  const columns: Column<AdminPoiListItem>[] = [
    // Cột 1: tên điểm (bấm để mở trang chỉnh sửa điểm).
    {
      key: 'name',
      title: 'Tên điểm',
      width: '240px',
      render: (poi) => (
        <div className="adm-product-info-cell">
          <Link to={`/quan-tri/diem-thuyet-minh/${poi.id}`} className="adm-product-name-link">
            {poi.name}
          </Link>
        </div>
      ),
    },
    // Cột 2: khu vực của điểm.
    {
      key: 'zone',
      title: 'Khu vực',
      width: '130px',
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
    // 4 cột ngôn ngữ sinh tự động từ POI_LANGUAGES (vi/en/ja/ko).
    ...POI_LANGUAGES.map(
      (language): Column<AdminPoiListItem> => ({
        key: `lang-${language.code}`,
        title: language.label,
        width: '130px',
        render: (poi) => renderLanguageCell(poi, language.code),
      })
    ),
    // Cột cuối: thời điểm thử audio gần nhất trong mọi ngôn ngữ.
    {
      key: 'updated',
      title: 'Thử gần nhất',
      width: '150px',
      render: (poi) => (
        <span className="adm-date-text">{formatDateTime(latestAttempt(poi))}</span>
      ),
    },
  ];

  return (
    <div className="adm-page">
      {/* Tiêu đề trang + nút quay về danh sách điểm */}
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Bản dịch và audio</h1>
          <p className="adm-page-desc">
            Theo dõi bản dịch và trạng thái audio thuyết minh của từng điểm theo ngôn ngữ.
          </p>
        </div>
        <div className="adm-page-actions">
          <Link to="/quan-tri/diem-thuyet-minh" className="adm-btn adm-btn-secondary">
            Danh sách điểm
          </Link>
        </div>
      </div>

      {/* Thanh công cụ: tìm kiếm + lọc khu vực + lọc trạng thái ngôn ngữ + nút làm mới */}
      <AdminToolbar onRefresh={fetchList} refreshing={loading} refreshLabel="Làm mới">
        {/* Ô tìm kiếm theo tên điểm */}
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

        {/* Lọc theo khu vực */}
        <select
          className="adm-select"
          value={zoneFilter}
          onChange={(e) => {
            setZoneFilter(e.target.value);
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

        {/* Lọc theo trạng thái ngôn ngữ (có lỗi / có chờ xử lý) */}
        <select
          className="adm-select"
          value={languageFilter}
          onChange={(e) => {
            setLanguageFilter(e.target.value as PoiLanguageFilterValue);
            setPage(0);
          }}
          aria-label="Lọc theo trạng thái ngôn ngữ"
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

      {/* Khu vực nội dung: lỗi / rỗng / bảng dữ liệu */}
      {error ? (
        <ErrorState
          title="Không thể tải danh sách bản dịch"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy bản dịch phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có điểm thuyết minh nào"
            description="Thêm điểm đến để hệ thống tạo bản dịch và audio thuyết minh."
          />
        )
      ) : (
        <>
          {/* Bảng bản dịch & audio theo ngôn ngữ */}
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(poi) => poi.id}
            loading={loading}
            emptyText="Chưa có dữ liệu bản dịch hiển thị."
            ariaLabel="Bảng bản dịch và audio điểm thuyết minh"
            caption="Bản dịch và audio theo ngôn ngữ"
          />

          {/* Phân trang phía server */}
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

export default PoiTranslationsPage;
