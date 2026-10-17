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
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';
import { AdminAlert } from '../components/AdminAlert';

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
      setRows(result?.content || []);
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
        <Link to="/quan-tri/khu-vuc/moi" className="adm-btn adm-btn-primary">
          + Thêm khu vực
        </Link>
      </div>

      {notice && (
        <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />
      )}

      <AdminToolbar onRefresh={fetchList} refreshing={loading}>
        <div className="adm-search-wrap">
          <input
            type="search"
            className="adm-input adm-search-input"
            placeholder="Tìm theo tên hoặc mã khu vực..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Tìm kiếm khu vực"
          />
        </div>

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
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã ẩn</option>
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
