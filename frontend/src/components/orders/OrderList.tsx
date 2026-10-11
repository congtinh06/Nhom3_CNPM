import { useState, useMemo } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { BackendOrder } from '../../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, formatPrice } from '../../utils/formatters';

export interface OrderListProps {
  orders: BackendOrder[];
  selectedCode: string | null;
  onSelectOrder: (orderCode: string) => void;
}

type StatusFilterType = 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

const FILTER_OPTIONS: { id: StatusFilterType; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ xác nhận' },
  { id: 'PROCESSING', label: 'Đang xử lý' },
  { id: 'SHIPPING', label: 'Đang giao' },
  { id: 'COMPLETED', label: 'Đã giao' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export const OrderList= ({
  orders,
  selectedCode,
  onSelectOrder,
}: OrderListProps) => {
  const [activeFilter, setActiveFilter] = useState<StatusFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Filter by status
      if (activeFilter !== 'ALL') {
        const s = (order.status || '').toUpperCase();
        if (activeFilter === 'PENDING') {
          if (!['PENDING_PAYMENT', 'PENDING', 'CHỜ XÁC NHẬN'].includes(s)) return false;
        } else if (activeFilter === 'PROCESSING') {
          if (!['PROCESSING', 'ĐANG XỬ LÝ'].includes(s)) return false;
        } else if (activeFilter === 'SHIPPING') {
          if (!['SHIPPING', 'DELIVERING', 'ĐANG GIAO'].includes(s)) return false;
        } else if (activeFilter === 'COMPLETED') {
          if (!['COMPLETED', 'PAID', 'ĐÃ GIAO'].includes(s)) return false;
        } else if (activeFilter === 'CANCELLED') {
          if (!['CANCELLED', 'ĐÃ HỦY'].includes(s)) return false;
        }
      }

      // 2. Filter by search query (order code)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!order.orderCode.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  return (
    <div className="orders-list-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="orders-panel-heading">
          Danh sách đơn ({orders.length})
        </h2>
      </div>

      {/* D.12 Search by order code */}
      <div className="orders-search-box">
        <Search
          size={16}
          strokeWidth={1.75}
          className="orders-search-icon"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo mã đơn (SV-...)"
          className="orders-search-input"
        />
      </div>

      {/* D.12 Status Filter Chips */}
      <div className="orders-filter-chips">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setActiveFilter(opt.id)}
              className={`orders-filter-chip ${isActive ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* List items */}
      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E7E5E4', color: '#78716C', fontSize: 13 }}>
            <ShoppingBag size={28} strokeWidth={1.5} style={{ margin: '0 auto 8px', color: '#78716C', opacity: 0.6 }} />
            <p style={{ margin: 0 }}>Không tìm thấy đơn hàng phù hợp</p>
          </div>
        ) : (
          filteredOrders.map((o) => {
            const isSelected = selectedCode === o.orderCode;
            const isCancelled = o.status === 'CANCELLED';

            return (
              <article
                key={o.orderCode}
                onClick={() => onSelectOrder(o.orderCode)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectOrder(o.orderCode);
                  }
                }}
                aria-pressed={isSelected}
                className={`order-summary-item ${isSelected ? 'active' : ''} ${isCancelled ? 'cancelled' : ''}`}
              >
                <div className="order-summary-top">
                  <span className={`order-summary-code ${isSelected ? 'active' : ''}`}>
                    {o.orderCode}
                  </span>
                  <StatusBadge status={o.status} />
                </div>

                <div className="order-summary-meta">
                  <span className="order-summary-date">
                    {formatDateTime(o.createdAt)}
                  </span>
                  <span className={`order-summary-amount ${isCancelled ? 'cancelled' : ''}`}>
                    {formatPrice(o.totalAmount)}
                  </span>
                </div>

                <p className="order-summary-items-preview">
                  {o.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderList;
