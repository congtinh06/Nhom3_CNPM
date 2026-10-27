/**
 * ============================================================================
 * QUẢN TRỊ VIÊN: QUẢN LÝ DANH SÁCH NGƯỜI DÙNG (Admin User Management)
 * ============================================================================
 * 
 * Mục đích module:
 * - Quản lý, tra cứu và hiển thị toàn bộ người dùng trong hệ thống Echora.
 * - Cho phép kiểm tra nhanh tài khoản nào đã được nâng cấp lên gói Premium.
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [planFilter]: Bổ sung bộ lọc gói tài khoản (Tất cả / Premium / Free) trên thanh công cụ.
 * 2. [Cột Gói tài khoản]: Bổ sung cột hiển thị huy hiệu Premium/Free kèm ngày hết hạn gói.
 * 3. [userApi.listUsers]: Truyền tham số `plan` xuống backend `auth-service` để lọc chính xác.
 * 4. [Điều hướng]: Hỗ trợ click vào người dùng để mở trang chi tiết và nâng cấp trực tiếp gói.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminUser, USER_ROLE_LABELS, UserPlanValue, UserRoleValue, UserStatusValue } from '../types/user';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';

const PAGE_SIZE = 10;

function formatDate(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return '-';
  }
}

export const UserListPage: React.FC = () => {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | UserRoleValue>('');
  const [statusFilter, setStatusFilter] = useState<'' | UserStatusValue>('');
  const [planFilter, setPlanFilter] = useState<'' | UserPlanValue>('');
  const [page, setPage] = useState(0);

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
      const result = await userApi.getAdminUsers({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
      });
      setRows(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, planFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const hasActiveFilters = Boolean(searchInput.trim() || roleFilter || statusFilter || planFilter);

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPlanFilter('');
    setPage(0);
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      title: 'Người dùng',
      render: (user) => (
        <div className="adm-product-info-cell">
          <Link to={`/quan-tri/nguoi-dung/${user.id}`} className="adm-product-name-link">
            {user.fullName}
          </Link>
          <span className="adm-product-slug">{user.email}</span>
        </div>
      ),
    },
    {
      key: 'plan',
      title: 'Gói tài khoản',
      width: '145px',
      render: (user) => {
        const isPremium = user.plan === 'PREMIUM' && user.premiumActive !== false;
        return (
          <div className="adm-plan-cell">
            <StatusBadge variant={isPremium ? 'neutral' : 'muted'}>
              {isPremium ? 'Premium' : 'Free'}
            </StatusBadge>
            {user.premiumExpiresAt && (
              <span
                className="adm-date-text"
                style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '2px' }}
              >
                Hạn: {formatDate(user.premiumExpiresAt)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'role',
      title: 'Vai trò',
      width: '130px',
      render: (user) => (
        <StatusBadge variant={user.role === 'ADMIN' ? 'neutral' : 'muted'}>
          {USER_ROLE_LABELS[user.role]}
        </StatusBadge>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '130px',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'emailVerified',
      title: 'Xác thực email',
      width: '130px',
      render: (user) => (
        <span className="adm-date-text">{user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
      ),
    },
    {
      key: 'lastLoginAt',
      title: 'Đăng nhập cuối',
      width: '140px',
      render: (user) => <span className="adm-date-text">{formatDate(user.lastLoginAt)}</span>,
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      width: '130px',
      render: (user) => <span className="adm-date-text">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '120px',
      render: (user) => (
        <div className="adm-row-actions">
          <Link
            to={`/quan-tri/nguoi-dung/${user.id}`}
            className="adm-btn adm-btn-secondary adm-btn-sm"
            aria-label={`Xem chi tiết ${user.fullName}`}
          >
            Chi tiết
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Quản lý người dùng</h1>
          <p className="adm-page-desc">
            Danh sách tài khoản du khách và quản trị viên. Xem chi tiết để đổi vai trò hoặc khóa
            tài khoản khi cần thiết.
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
        </div>
      </div>

      <AdminToolbar>
        <div className="adm-search-wrap">
          <input
            type="search"
            className="adm-input adm-search-input"
            placeholder="Tìm theo tên hoặc email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Tìm kiếm người dùng"
          />
        </div>

        <select
          className="adm-select"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as '' | UserRoleValue);
            setPage(0);
          }}
          aria-label="Lọc theo vai trò"
        >
          <option value="">Tất cả vai trò</option>
          <option value="USER">Du khách</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>

        <select
          className="adm-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as '' | UserStatusValue);
            setPage(0);
          }}
          aria-label="Lọc theo trạng thái người dùng"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="PENDING">Chờ xác thực</option>
          <option value="BLOCKED">Đã khóa</option>
        </select>

        <select
          className="adm-select"
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value as '' | UserPlanValue);
            setPage(0);
          }}
          aria-label="Lọc theo gói tài khoản"
        >
          <option value="">Tất cả gói</option>
          <option value="PREMIUM">Gói Premium</option>
          <option value="FREE">Gói Miễn phí (Free)</option>
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
          title="Không thể tải danh sách người dùng"
          message={error}
          onRetry={fetchList}
        />
      ) : !loading && rows.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy người dùng phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò và trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có người dùng nào"
            description="Hệ thống chưa ghi nhận tài khoản người dùng nào."
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu người dùng hiển thị."
            ariaLabel="Bảng danh sách người dùng quản trị"
            stickyLastColumn
          />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="người dùng"
            onPageChange={(next) => setPage(Math.max(0, Math.min(totalPages - 1, next)))}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
};

export default UserListPage;
