import React from 'react';
import { OrdersPage } from '../../pages/OrdersPage';
import { AccountSection } from './AccountSection';
import { useAccountI18n } from './accountI18n';

export const AccountOrders: React.FC = () => {
  const { t } = useAccountI18n();

  return (
    <AccountSection id="orders" title={t.ordersTitle} description={t.ordersDesc}>
      <OrdersPage embedded />
    </AccountSection>
  );
};

export default AccountOrders;
