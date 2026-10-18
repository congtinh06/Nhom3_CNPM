import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routeApi } from '../api/routeApi';
import { zoneApi } from '../api/zoneApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminRouteListItem } from '../types/route';
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

export const RouteListPage: React.FC = () => {
  const [rows, setRows] = useState<AdminRouteListItem[]>([]);
  const [zones, setZones] = useState<AdminZoneListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const navigate = useNavigate();
  const [pendingToggle, setPendingToggle] = useState<AdminRouteListItem | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    zoneApi
      .getAdminZones({ page: 0, size: 200 })
      .then((res) => setZones(res?.content || []))
      .catch(() => setZones([]));
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await routeApi.getAdminRoutes({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        zoneId: zoneFilter ? parseInt(zoneFilter, 10) : undefined,
        status: statusFilter || undefined,
      });
      setRows(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, zoneFilter, statusFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const hasActiveFilters = Boolean(searchInput.trim() || zoneFilter || statusFilter);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setZoneFilter('');
    setStatusFilter('');
    setPage(0);
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggle || toggling) return;
    const target = pendingToggle;
    setToggling(true);
    setNotice(null);
    try {
      const updated = await routeApi.updateRouteStatus(
        target.id,
        target.status !== 'ACTIVE'
      );
      setRows((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
      );
      setNotice(
        updated.status === 'ACTIVE'
          ? `Đã bật hoạt động tuyến "${updated.name}".`
          : `Đã ngừng hoạt động tuyến "${updated.name}".`
      );
      setPendingToggle(null);
    } catch (err) {
      setError(normalizeAdminError(err).message);
      setPendingToggle(null);
    } finally {
      setToggling(false);
    }
  };

  const columns: Column<AdminRouteListItem>[] = [
    {
      key: 'name',
      title: 'Tuyến',
      render: (route) => (
        <div className="adm-product-info-cell">
          <Link to={`/quan-tri/lo-trinh/${route.id}`} className="adm-product-name-link">
            {route.name}
          </Link>
        </div>
      ),
    },
    {
      key: 'zone',
      title: 'Khu vực',
      width: '220px',
      render: (route) => (
        <div className="adm-route-zone-cell">
          <StatusBadge variant="neutral">{route.zoneName}</StatusBadge>
          <span className="adm-product-slug">{route.zoneCode}</span>
        </div>
      ),
    },
    {
      key: 'displayOrder',
      title: 'Thứ tự',
      align: 'center',
      width: '90px',
      render: (route) => <span className="adm-table-strong">{route.displayOrder}</span>,
    },
    {
      key: 'stopCount',
      title: 'Điểm dừng',
      align: 'right',
      width: '120px',
      render: (route) => (
        <span className="adm-table-strong">{route.stopCount.toLocaleString('vi-VN')}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '140px',
      render: (route) => <StatusBadge status={route.status} />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '190px',
      render: (route) => {
        const isActive = route.status === 'ACTIVE';
        return (
          <div className="adm-row-actions">
            <Link
              to={`/quan-tri/lo-trinh/${route.id}`}
              className="adm-btn adm-btn-secondary adm-btn-sm"
              aria-label={`Chỉnh sửa ${route.name}`}
            >
              Sửa
            </Link>
            <button
              type="button"
              className={`adm-btn adm-btn-sm ${isActive ? 'adm-btn-danger-ghost' : 'adm-btn-secondary'}`}
              onClick={() => setPendingToggle(route)}
              aria-label={isActive ? `Ngừng hoạt động ${route.name}` : `Bật hoạt động ${route.name}`}
            >
              {isActive ? 'Ngừng' : 'Bật'}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Quản lý tuyến tham quan</h1>
          <p className="adm-page-desc">
            Tuyến gom nhiều điểm thuyết minh theo thứ tự tham quan trong một khu vực.
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
          <Link to="/quan-tri/lo-trinh/moi" className="adm-btn adm-btn-primary">
            + Thêm tuyến
          </Link>
        </div>
      </div>

      {notice && (
        <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />
      )}

      <AdminToolbar>
        <div className="adm-search-wrap">
          <input
            type="search"
            className="adm-input adm-search-input"
            placeholder="Tìm theo tên tuyến"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Tìm kiếm tuyến"
          />
        </div>

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
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>

        <select
          className="adm-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          aria-label="Lọc theo trạng thái tuyến"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Tạm ngưng</option>
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
        <ErrorState title="Không thể tải danh sách tuyến" message={error} onRetry={fetchList} />
      ) : !loading && rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy tuyến phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc khu vực, trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có tuyến tham quan nào"
            description="Tạo tuyến đầu tiên để gom các điểm thuyết minh theo lộ trình tham quan."
            actionText="+ Thêm tuyến mới"
            onAction={() => navigate('/quan-tri/lo-trinh/moi')}
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu tuyến hiển thị."
            ariaLabel="Bảng danh sách tuyến tham quan quản trị"
            stickyLastColumn
          />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="tuyến"
            onPageChange={(next) => setPage(Math.max(0, Math.min(totalPages - 1, next)))}
            disabled={loading}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={pendingToggle !== null}
        title={
          pendingToggle?.status === 'ACTIVE'
            ? 'Xác nhận ngừng hoạt động tuyến'
            : 'Xác nhận bật hoạt động tuyến'
        }
        message={
          pendingToggle?.status === 'ACTIVE'
            ? `Tuyến "${pendingToggle?.name}" sẽ bị ẩn khỏi website du khách. Bạn có chắc chắn muốn tiếp tục?`
            : `Bật lại hoạt động cho tuyến "${pendingToggle?.name}"?`
        }
        confirmText={
          toggling
            ? 'Đang xử lý...'
            : pendingToggle?.status === 'ACTIVE'
            ? 'Ngừng hoạt động'
            : 'Bật hoạt động'
        }
        cancelText="Hủy bỏ"
        variant={pendingToggle?.status === 'ACTIVE' ? 'danger' : 'primary'}
        onConfirm={handleConfirmToggle}
        onCancel={() => {
          if (!toggling) setPendingToggle(null);
        }}
      />
    </div>
  );
};

export default RouteListPage;
