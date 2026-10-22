import { BackendOrder } from '../types';

const BACKEND_ORDERS_KEY = 'sv:backend_orders';
const MAX_CACHED_ORDERS = 20;

export const loadCachedOrders = (): BackendOrder[] => {
  try {
    const raw = localStorage.getItem(BACKEND_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as BackendOrder[];
    }
    return [];
  } catch {
    return [];
  }
};

export const saveCachedOrders = (orders: BackendOrder[]): void => {
  try {
    localStorage.setItem(BACKEND_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore quota errors
  }
};

export const cacheOrder = (order: BackendOrder): void => {
  const others = loadCachedOrders().filter((o) => o.orderCode !== order.orderCode);
  saveCachedOrders([order, ...others].slice(0, MAX_CACHED_ORDERS));
};

export const clearLocalOrderCache = (): void => {
  try {
    localStorage.removeItem(BACKEND_ORDERS_KEY);
  } catch {
    // Ignore storage errors
  }
};
