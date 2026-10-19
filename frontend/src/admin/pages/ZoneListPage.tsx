import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zoneApi } from '../api/zoneApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminZoneListItem } from '../types/zone';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AdminFilterPanel } from '../components/AdminFilterPanel';
import type {
  AdminActiveFilter,
  AdminSearchSuggestion,
} from '../components/AdminFilterPanel';
import { AdminPagination } from '../components/AdminPagination';
import { AdminAlert } from '../components/AdminAlert';
import { normalizeSearchText } from '../utils/text';

const PAGE_SIZE = 10;

export const ZoneListPage: React.FC = () => {
  const [rows, setRows] = useState<AdminZoneListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(0);
  const [suggestionPool, setSuggestionPool] = useState<AdminZoneListItem[]>([]);

  const navigate = useNavigate();
  const [pendingToggle, setPendingToggle] = useState<AdminZoneListItem | null>(null);
  const [toggling, setToggling] = useState(false);

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
      const result = await zoneApi.getAdminZones({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
      });
      const content = result?.content || [];
      setRows(content);
      setSuggestionPool((prev) => {
        const byId = new Map(prev.map((zone) => [zone.id, zone]));
        content.forEach((zone) => byId.set(zone.id, zone));
        return Array.from(byId.values()).slice(0, 40);
      });
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const hasActiveFilters = Boolean(searchInput.trim() || activeFilter);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setActiveFilter('');
    setPage(0);
  };

  const normalizedQuery = normalizeSearchText(searchInput);

  const searchSuggestions: AdminSearchSuggestion[] = [
    ...suggestionPool.map<AdminSearchSuggestion>((zone) => ({
      id: `zone-${zone.id}`,
      label: zone.name,
      hint: `Mã khu vực: ${zone.code}`,
      kind: 'keyword',
      onSelect: () => {
        setSearchInput(zone.name);
        setSearch(zone.name);
        setPage(0);
      },
    })),
    {
      id: 'status-active',
      label: 'Khu vực đang hoạt động',
      hint: 'Lọc theo trạng thái hiển thị',
      kind: 'filter' as const,
      onSelect: () => {
        setSearchInput('');
        setSearch('');
        setActiveFilter('true');
        setPage(0);
      },
    },
    {
      id: 'status-inactive',
      label: 'Khu vực đã ẩn',
      hint: 'Lọc theo trạng thái hiển thị',
      kind: 'filter' as const,
      onSelect: () => {
        setSearchInput('');
        setSearch('');
        setActiveFilter('false');
        setPage(0);
      },
    },
  ].filter((suggestion) => {
    if (!normalizedQuery) return true;
    return normalizeSearchText(`${suggestion.label} ${suggestion.hint || ''}`).includes(
      normalizedQuery
    );
  });

  const activeFilters: AdminActiveFilter[] = [
    ...(searchInput.trim()
      ? [
          {
            id: 'search',
            label: 'Từ khóa',
            value: searchInput.trim(),
            onRemove: () => {
              setSearchInput('');
              setSearch('');
              setPage(0);
            },
          },
        ]
      : []),
    ...(activeFilter
      ? [
          {
            id: 'status',
            label: 'Trạng thái',
            value: activeFilter === 'true' ? 'Hoạt động' : 'Đã ẩn',
            onRemove: () => {
              setActiveFilter('');
              setPage(0);
            },
          },
        ]
      : []),
  ];

  const handleConfirmToggle = async () => {
    if (!pendingToggle || toggling) return;
    const target = pendingToggle;
    setToggling(true);
    setNotice(null);
    try {
      const updated = await zoneApi.updateZoneStatus(target.id, !target.isActive);
      setRows((prev) =>
        prev.map((z) => (z.id === updated.id ? { ...z, isActive: updated.isActive } : z))
      );
      setNotice(
        updated.isActive
          ? `Đã bật hoạt động khu vực "${updated.name}".`
          : `Đã ngừng hoạt động khu vực "${updated.name}".`
      );
      setPendingToggle(null);
    } catch (err) {
      setError(normalizeAdminError(err).message);
      setPendingToggle(null);
    } finally {
      setToggling(false);
    }
  };

  const columns: Column<AdminZoneListItem>[] = [
    {
      key: 'name',
      title: 'Khu vực',
      render: (zone) => (
        <div className="adm-product-info-cell">
          <Link to={`/quan-tri/khu-vuc/${zone.id}`} className="adm-product-name-link">
            {zone.name}
          </Link>
          <span className="adm-product-slug">{zone.code}</span>
        </div>
      ),
    },
    {
      key: 'radius',
      title: 'Bán kính',
      width: '120px',
      render: (zone) => <span className="adm-date-text">{zone.radiusMeters.toLocaleString('vi-VN')} m</span>,
    },
    {
      key: 'poiCount',
      title: 'Điểm thuyết minh',
      width: '140px',
      align: 'right',
      render: (zone) => <span className="adm-table-strong">{zone.poiCount.toLocaleString('vi-VN')}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '140px',
      render: (zone) => <StatusBadge status={zone.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '190px',
      render: (zone) => (
        <div className="adm-row-actions">
          <Link
            to={`/quan-tri/khu-vuc/${zone.id}`}
            className="adm-btn adm-btn-secondary adm-btn-sm"
            aria-label={`Chỉnh sửa ${zone.name}`}
          >
            Sửa
          </Link>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${zone.isActive ? 'adm-btn-danger-ghost' : 'adm-btn-secondary'}`}
            onClick={() => setPendingToggle(zone)}
            aria-label={
              zone.isActive ? `Ngừng hoạt động ${zone.name}` : `Bật hoạt động ${zone.name}`
            }
          >
            {zone.isActive ? 'Ngừng' : 'Bật'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Quản lý khu vực</h1>
          <p className="adm-page-desc">
            Khu vực địa lý dùng để nhóm các điểm thuyết minh, tuyến tham quan và kích hoạt
            thuyết minh theo vị trí.
          </p>
        </div>
        <div className="adm-page-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={fetchList}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <Link to="/quan-tri/khu-vuc/moi" className="adm-btn adm-btn-primary">
            + Thêm khu vực
          </Link>
        </div>
      </div>

      {notice && (
        <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />
      )}

      <AdminFilterPanel
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm theo tên hoặc mã khu vực"
        searchAriaLabel="Tìm kiếm khu vực"
        suggestions={searchSuggestions}
        activeFilters={activeFilters}
        onClearFilters={handleClearFilters}
        totalLabel={loading ? 'Đang tải dữ liệu...' : `${totalElements.toLocaleString('vi-VN')} khu vực`}
        filters={
          <select
            className="adm-select"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(0);
            }}
            aria-label="Lọc theo trạng thái khu vực"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Đã ẩn</option>
          </select>
        }
      />

      {error ? (
        <ErrorState
          title="Không thể tải danh sách khu vực"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy khu vực phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có khu vực nào"
            description="Bắt đầu tạo khu vực đầu tiên để nhóm các điểm thuyết minh theo vị trí."
            actionText="+ Thêm khu vực mới"
            onAction={() => navigate('/quan-tri/khu-vuc/moi')}
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu khu vực hiển thị."
            ariaLabel="Bảng danh sách khu vực quản trị"
            stickyLastColumn
          />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="khu vực"
            onPageChange={(next) => setPage(Math.max(0, Math.min(totalPages - 1, next)))}
            disabled={loading}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={pendingToggle !== null}
        title={pendingToggle?.isActive ? 'Xác nhận ngừng hoạt động khu vực' : 'Xác nhận bật hoạt động khu vực'}
        message={
          pendingToggle?.isActive
            ? `Khu vực "${pendingToggle?.name}" sẽ không còn hiển thị cho du khách. Bạn có chắc chắn muốn tiếp tục?`
            : `Bật lại hoạt động cho khu vực "${pendingToggle?.name}"?`
        }
        confirmText={
          toggling
            ? 'Đang xử lý...'
            : pendingToggle?.isActive
            ? 'Ngừng hoạt động'
            : 'Bật hoạt động'
        }
        cancelText="Hủy bỏ"
        variant={pendingToggle?.isActive ? 'danger' : 'primary'}
        onConfirm={handleConfirmToggle}
        onCancel={() => {
          if (!toggling) setPendingToggle(null);
        }}
      />
    </div>
  );
};

export default ZoneListPage;
