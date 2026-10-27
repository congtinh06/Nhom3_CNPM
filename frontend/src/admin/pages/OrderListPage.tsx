/**
 * ============================================================================
 * QUẢN TRỊ VIÊN: QUẢN LÝ DANH SÁCH ĐƠN HÀNG (Admin Order Management)
 * ============================================================================
 * 
 * Mục đích module:
 * - Theo dõi, lọc và tra cứu toàn bộ đơn hàng trong hệ thống (gói Premium, mua lẻ POI, mua quà lưu niệm).
 * - Kiểm tra trạng thái thanh toán (PAID, PENDING, FAILED) và trạng thái đơn hàng (COMPLETED, PROCESSING...).
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Phân loại đơn hàng]: Hỗ trợ loại đơn `POI` (Mở khóa điểm lẻ) bên cạnh `PREMIUM` (Nâng cấp tài khoản) và `SOUVENIR`.
 * 2. [Bộ lọc loại đơn]: Bổ sung tùy chọn lọc đơn hàng `Mở khóa điểm (POI)` trong dropdown lọc.
 * 3. [Liên kết người dùng & đơn hàng]: Cho phép Admin đối soát nhanh đơn hàng kích hoạt Premium của người dùng.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderAdminApi } from '../api/orderApi';
import { normalizeAdminError } from '../api/adminClient';
import {
  AdminOrder,
  AdminOrderStatus,
  AdminOrderType,
  AdminPaymentStatus,
  ORDER_STATUS_BADGE,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_BADGE,
} from '../types/order';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';

const PAGE_SIZE = 10;

function formatCurrency(value: number): string {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '-';
  }
}

export const OrderListPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | AdminOrderType>('');
  const [statusFilter, setStatusFilter] = useState<'' | AdminOrderStatus>('');
  const [paymentFilter, setPaymentFilter] = useState<'' | AdminPaymentStatus>('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderAdminApi.getOrders({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      });
      setOrders(result?.content || []);
      setTotalElements(result?.totalElements ?? 0);
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const hasActiveFilters = Boolean(
    searchInput.trim() || typeFilter || statusFilter || paymentFilter
  );

  const handleClearFilters = () => {
    setSearchInput('');
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPaymentFilter('');
    setPage(0);
  };

  const columns: Column<AdminOrder>[] = [
    {
      key: 'orderCode',
      title: 'Đơn hàng',
      width: '190px',
      render: (order) => (
        <div className="adm-product-info-cell">
          <Link
            to={`/quan-tri/don-hang/${encodeURIComponent(order.orderCode)}`}
            className="adm-product-name-link adm-order-code"
          >
            {order.orderCode}
          </Link>
          <span className="adm-product-slug">{ORDER_TYPE_LABELS[order.orderType]}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      title: 'Khách hàng',
      render: (order) =>
        order.orderType === 'PREMIUM' ? (
          <div className="adm-product-info-cell">
            <Link
              to={`/quan-tri/nguoi-dung/${order.userId}`}
              className="adm-product-name-link"
            >
              Tài khoản #{order.userId}
            </Link>
            <span className="adm-product-slug">Gói kỹ thuật số</span>
          </div>
        ) : (
          <div className="adm-product-info-cell">
            <span className="adm-order-customer">{order.receiverName}</span>
            <span className="adm-product-slug">{order.phone}</span>
          </div>
        ),
    },
    {
      key: 'totalAmount',
      title: 'Tổng tiền',
      align: 'right',
      width: '130px',
      render: (order) => (
        <span className="adm-product-price">{formatCurrency(order.totalAmount)}</span>
      ),
    },
    {
      key: 'payment',
      title: 'Thanh toán',
      width: '190px',
      render: (order) => {
        const badge = PAYMENT_STATUS_BADGE[order.paymentStatus];
        return (
          <div className="adm-order-payment-cell">
            <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
            <span className="adm-product-slug">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái đơn',
      width: '150px',
      render: (order) => {
        const badge = ORDER_STATUS_BADGE[order.status];
        return <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>;
      },
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      width: '160px',
      render: (order) => (
        <span className="adm-date-text">{formatDateTime(order.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '110px',
      render: (order) => (
        <div className="adm-row-actions">
          <Link
            to={`/quan-tri/don-hang/${encodeURIComponent(order.orderCode)}`}
            className="adm-btn adm-btn-secondary adm-btn-sm"
            aria-label={`Xem đơn hàng ${order.orderCode}`}
          >
            Xử lý
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Đơn hàng &amp; thanh toán</h1>
          <p className="adm-page-desc">
            Theo dõi đơn quà lưu niệm và gói Premium: xác nhận đã nhận tiền, xử lý giao hàng và
            đánh dấu đã giao cho khách.
          </p>
        </div>
        <div className="adm-page-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={fetchOrders}
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
            placeholder="Tìm mã đơn, tên hoặc số điện thoại"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Tìm kiếm đơn hàng"
          />
        </div>

        <select
          className="adm-select"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as '' | AdminOrderType);
            setPage(0);
          }}
          aria-label="Lọc theo loại đơn hàng"
        >
          <option value="">Tất cả loại đơn</option>
          <option value="PRODUCT">Quà lưu niệm</option>
          <option value="PREMIUM">Gói Premium</option>
          <option value="POI">Mở khóa điểm (POI)</option>
        </select>

        <select
          className="adm-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as '' | AdminOrderStatus);
            setPage(0);
          }}
          aria-label="Lọc theo trạng thái đơn hàng"
        >
          <option value="">Tất cả trạng thái đơn</option>
          <option value="PENDING_PAYMENT">Chờ thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="COMPLETED">Đã giao</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>

        <select
          className="adm-select"
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value as '' | AdminPaymentStatus);
            setPage(0);
          }}
          aria-label="Lọc theo trạng thái thanh toán"
        >
          <option value="">Tất cả thanh toán</option>
          <option value="PENDING">Chưa thanh toán</option>
          <option value="SUCCESS">Đã nhận tiền</option>
          <option value="FAILED">Thất bại</option>
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
          title="Không thể tải danh sách đơn hàng"
          message={error}
          onRetry={fetchOrders}
        />
      ) : !loading && orders.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy đơn hàng phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc loại đơn, trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Đơn quà lưu niệm và gói Premium của khách sẽ xuất hiện tại đây."
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={orders}
            keyExtractor={(item) => item.orderCode}
            loading={loading}
            emptyText="Chưa có dữ liệu đơn hàng hiển thị."
            ariaLabel="Bảng danh sách đơn hàng quản trị"
            stickyLastColumn
          />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="đơn hàng"
            onPageChange={(next) => setPage(Math.max(0, Math.min(totalPages - 1, next)))}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
};

export default OrderListPage;
