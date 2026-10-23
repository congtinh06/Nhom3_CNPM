import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminPoiListItem, PoiZoneOption } from '../types/poi';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PoiQrPanel } from '../components/PoiQrPanel';

// ============================================================================
// Trang "Mã QR" — route /quan-tri/diem-thuyet-minh/ma-qr
// Chức năng: xem và tải mã QR thuyết minh của từng điểm.
// Lưu ý: API danh sách điểm không trả về qrToken, nên sau khi tải danh sách,
// trang gọi thêm getAdminPoiDetail cho từng dòng để lấy qrToken (xem effect bên dưới).
// ============================================================================

const PAGE_SIZE = 12;

export const PoiQrListPage: React.FC = () => {
  // --- State dữ liệu bảng ---
  const [rows, setRows] = useState<AdminPoiListItem[]>([]);
  const [zones, setZones] = useState<PoiZoneOption[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cache qrToken theo poiId (id -> token). Chuỗi rỗng nghĩa là điểm chưa có mã.
  const [tokens, setTokens] = useState<Record<number, string>>({});

  // --- State bộ lọc + phân trang ---
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [page, setPage] = useState(0);

  // Nạp danh sách khu vực cho ô lọc khu vực.
  useEffect(() => {
    poiApi
      .getZones()
      .then((list) => setZones(list || []))
      .catch(() => setZones([]));
  }, []);

  // Debounce ô tìm kiếm 300ms.
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
    try {
      const result = await poiApi.getAdminPois({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        zoneId: zoneFilter ? Number(zoneFilter) : undefined,
      });
      setRows(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Lấy qrToken cho các dòng chưa có trong cache (gọi song song getAdminPoiDetail).
  useEffect(() => {
    let cancelled = false;
    const missing = rows.filter((poi) => tokens[poi.id] === undefined);
    if (missing.length === 0) return undefined;
    Promise.all(
      missing.map(async (poi) => {
        try {
          const detail = await poiApi.getAdminPoiDetail(poi.id);
          return [poi.id, detail.qrToken || ''] as const;
        } catch {
          return [poi.id, ''] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setTokens((prev) => {
        const next = { ...prev };
        entries.forEach(([id, token]) => {
          next[id] = token;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const hasActiveFilters = Boolean(searchInput.trim() || zoneFilter);

  // Nút "Xóa bộ lọc".
  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setZoneFilter('');
    setPage(0);
  };

  // Map zoneId -> tên khu vực để hiển thị dưới tên điểm.
  const zoneNameById = useMemo(() => {
    const map = new Map<number, string>();
    zones.forEach((zone) => map.set(zone.id, zone.name));
    return map;
  }, [zones]);

  return (
    <div className="adm-page">
      {/* Tiêu đề trang + nút quay về danh sách điểm */}
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Mã QR</h1>
          <p className="adm-page-desc">
            Xem và tải mã QR thuyết minh của từng điểm để in và đặt tại điểm đến.
          </p>
        </div>
        <div className="adm-page-actions">
          <Link to="/quan-tri/qr/audio" className="adm-btn adm-btn-secondary">
            Xem thống kê QR
          </Link>
          <Link to="/quan-tri/diem-thuyet-minh" className="adm-btn adm-btn-secondary">
            Danh sách điểm
          </Link>
        </div>
      </div>

      {/* Thanh công cụ: tìm kiếm + lọc khu vực + nút làm mới */}
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

      {/* Khu vực nội dung: lỗi / rỗng / lưới mã QR */}
      {error ? (
        <ErrorState
          title="Không thể tải danh sách mã QR"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && rows.length === 0 ? (
        // Rỗng có bộ lọc -> gợi ý xóa lọc; rỗng hoàn toàn -> gợi ý thêm điểm
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy điểm phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có điểm thuyết minh nào"
            description="Thêm điểm đến để hệ thống tạo mã QR thuyết minh."
          />
        )
      ) : (
        <>
          {/* Lưới thẻ QR: mỗi điểm 1 thẻ (tên + mã QR/tải QR) */}
          <div className="adm-split-grid">
            {loading
              ? // Khung xương khi đang tải trang đầu
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={`qr-skeleton-${index}`} className="adm-skeleton-cell" style={{ height: '260px' }} />
                ))
              : rows.map((poi) => {
                  const token = tokens[poi.id];
                  const zoneName = zoneNameById.get(poi.zoneId) || poi.zoneCode;
                  return (
                    <div key={poi.id} className="adm-qr-grid-item">
                      {/* Đầu thẻ: tên điểm (link sang trang sửa) + mã/khu vực */}
                      <div className="adm-qr-grid-head">
                        <Link
                          to={`/quan-tri/diem-thuyet-minh/${poi.id}`}
                          className="adm-product-name-link"
                        >
                          {poi.name}
                        </Link>
                        <span className="adm-cell-sub">
                          {poi.code} - {zoneName}
                        </span>
                      </div>
                      {/* token undefined = đang tải; '' = điểm chưa có mã; có giá trị = hiện QR */}
                      {token === undefined ? (
                        <p className="adm-date-text">Đang tải mã QR...</p>
                      ) : token ? (
                        <PoiQrPanel qrToken={token} poiName={poi.name} />
                      ) : (
                        <p className="adm-date-text">Chưa có mã QR cho điểm này.</p>
                      )}
                    </div>
                  );
                })}
          </div>

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

export default PoiQrListPage;
