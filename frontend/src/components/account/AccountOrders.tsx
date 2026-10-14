import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../services/orderService';
import { BackendOrder } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { StatusBadge } from '../orders/StatusBadge';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';
import { formatAccountDate } from './accountFormatters';

const RECENT_LIMIT = 3;

export const AccountOrders: React.FC = () => {
  const { lang, t } = useAccountI18n();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getMyOrders()
      .then((data) => {
        if (cancelled) return;
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const recent = orders.slice(0, RECENT_LIMIT);

  return (
    <AccountSection id="orders" title={t.ordersTitle} description={t.ordersDesc}>
      {loading && <p className="ac-muted">{t.ordersLoading}</p>}
      {!loading && failed && <p className="ac-error">{t.ordersError}</p>}
      {!loading && !failed && recent.length === 0 && (
        <p className="ac-muted">{t.ordersEmpty}</p>
      )}
      {!loading && !failed && recent.length > 0 && (
        <ul className="ac-orders">
          {recent.map((order) => (
            <li key={order.orderCode} className="ac-order">
              <div className="ac-order-main">
                <span className="ac-order-code">
                  <span className="ac-order-label">{t.orderCode}</span>
                  {order.orderCode}
                </span>
                <span className="ac-order-date">
                  <span className="ac-order-label">{t.orderDate}</span>
                  {formatAccountDate(order.createdAt, lang)}
                </span>
                <span className="ac-order-total">
                  <span className="ac-order-label">{t.orderTotal}</span>
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
              <StatusBadge status={order.status} />
            </li>
          ))}
        </ul>
      )}
      <Link className="ac-btn ac-btn-ghost ac-orders-link" to="/don-hang">
        {t.viewAllOrders}
      </Link>
    </AccountSection>
  );
};

export default AccountOrders;
