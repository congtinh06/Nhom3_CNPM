import { apiClient } from '../api/client';
import { normalizeApiError } from '../api/errors';
import { cacheOrder, loadCachedOrders, saveCachedOrders } from './orderCache';
import {
  Order,
  OrderItem,
  BackendOrder,
  CreateOrderPayload,
  PaymentStatus,
} from '../types';

const STORAGE_KEY = 'orders';

const isOrderItem = (item: unknown): item is OrderItem => {
  if (typeof item !== 'object' || item === null) return false;
  const it = item as Record<string, unknown>;
  return (
    typeof it.key === 'number' &&
    typeof it.name === 'string' &&
    typeof it.quantity === 'number' &&
    typeof it.price === 'number'
  );
};

const isOrder = (order: unknown): order is Order => {
  if (typeof order !== 'object' || order === null) return false;
  const o = order as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.date === 'string' &&
    (o.status === 'Chờ xác nhận' || o.status === 'Đã hủy') &&
    typeof o.total === 'number' &&
    typeof o.name === 'string' &&
    typeof o.phone === 'string' &&
    typeof o.address === 'string' &&
    Array.isArray(o.items) &&
    o.items.every(isOrderItem)
  );
};

export const getOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isOrder)) {
      return parsed;
    }
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

export const saveOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Quota exceeded or storage unavailable
  }
};

export interface CreateOrderParams {
  name: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
}

export const createOrder = (params: CreateOrderParams): Order => {
  const id = 'SG' + String(Date.now()).slice(-6);
  const newOrder: Order = {
    id,
    date: new Date().toLocaleString('vi-VN'),
    status: 'Chờ xác nhận',
    total: params.total,
    name: params.name.trim(),
    phone: params.phone.trim(),
    address: params.address.trim(),
    items: params.items,
  };

  const currentOrders = getOrders();
  const updatedOrders = [newOrder, ...currentOrders];
  saveOrders(updatedOrders);
  return newOrder;
};

export const cancelOrder = (orderId: string): Order | null => {
  const currentOrders = getOrders();
  let updatedOrder: Order | null = null;
  const updatedOrders = currentOrders.map((o) => {
    if (o.id === orderId && o.status === 'Chờ xác nhận') {
      updatedOrder = { ...o, status: 'Đã hủy' };
      return updatedOrder;
    }
    return o;
  });

  if (updatedOrder) {
    saveOrders(updatedOrders);
  }
  return updatedOrder;
};

// ==========================================
// Backend Order API (đơn hàng luôn gắn với tài khoản đang đăng nhập)
// ==========================================

const toOrderError = (error: unknown, fallback: string): Error => {
  const normalized = normalizeApiError(error);
  if (normalized.status === 401) {
    return new Error('Vui lòng đăng nhập để tiếp tục.');
  }
  return new Error(normalized.message || fallback);
};

export const createBackendOrder = async (
  payload: CreateOrderPayload,
  idempotencyKey: string,
): Promise<BackendOrder> => {
  try {
    const response = await apiClient.post<BackendOrder>('/api/orders', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    cacheOrder(response.data);
    return response.data;
  } catch (error) {
    throw toOrderError(error, 'Không thể tạo đơn hàng. Vui lòng thử lại.');
  }
};

export const createPremiumOrder = async (): Promise<BackendOrder> => {
  const idempotencyKey = `premium-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const response = await apiClient.post<BackendOrder>(
      '/api/orders/premium',
      { packageCode: 'PREMIUM_LANGUAGES' },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    cacheOrder(response.data);
    return response.data;
  } catch (error) {
    throw toOrderError(error, 'Không thể tạo thanh toán Premium. Vui lòng thử lại.');
  }
};

/**
 * Mua gói ngoại ngữ Premium cho riêng một điểm thuyết minh (POI).
 * paymentMethod: 'VNPAY' | 'VIETQR' (mặc định VIETQR).
 */
export const createPoiPremiumOrder = async (
  poiId: number,
  paymentMethod: 'VNPAY' | 'VIETQR' = 'VIETQR',
): Promise<BackendOrder> => {
  const idempotencyKey = `premium-poi-${poiId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const response = await apiClient.post<BackendOrder>(
      '/api/orders/poi',
      { poiId, paymentMethod },
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
    cacheOrder(response.data);
    return response.data;
  } catch (error) {
    throw toOrderError(error, 'Không thể tạo thanh toán cho điểm thuyết minh. Vui lòng thử lại.');
  }
};

export const getMyOrders = async (): Promise<BackendOrder[]> => {
  try {
    const response = await apiClient.get<BackendOrder[]>('/api/orders/my');
    const orders = response.data ?? [];
    saveCachedOrders(orders);
    return orders;
  } catch (error) {
    throw toOrderError(error, 'Không thể tải danh sách đơn hàng.');
  }
};

export const getOrderByCode = async (orderCode: string): Promise<BackendOrder | null> => {
  try {
    const response = await apiClient.get<BackendOrder>(
      `/api/orders/${encodeURIComponent(orderCode)}`,
    );
    cacheOrder(response.data);
    return response.data;
  } catch (error) {
    if (normalizeApiError(error).status === 404) {
      return null;
    }
    throw toOrderError(error, 'Không thể tải thông tin đơn hàng.');
  }
};

export const cancelBackendOrder = async (orderCode: string): Promise<BackendOrder> => {
  try {
    const response = await apiClient.post<BackendOrder>(
      `/api/orders/${encodeURIComponent(orderCode)}/cancel`,
    );
    cacheOrder(response.data);
    return response.data;
  } catch (error) {
    throw toOrderError(error, 'Không thể hủy đơn hàng.');
  }
};

export const confirmMockPayment = async (
  orderCode: string,
  outcome: Exclude<PaymentStatus, 'PENDING'> = 'SUCCESS',
): Promise<BackendOrder> => {
  try {
    const response = await apiClient.post<BackendOrder>(
      `/api/orders/${encodeURIComponent(orderCode)}/pay/mock-confirm`,
      null,
      { params: { outcome } },
    );
    cacheOrder(response.data);
    return response.data;
  } catch (error) {
    throw toOrderError(error, 'Không thể xác nhận thanh toán.');
  }
};

export const createVnPayPayment = async (orderCode: string): Promise<string> => {
  try {
    const response = await apiClient.post<{ paymentUrl: string }>(
      `/api/orders/${encodeURIComponent(orderCode)}/payments/vnpay`,
    );
    return response.data.paymentUrl;
  } catch (error) {
    throw toOrderError(error, 'Không thể tạo liên kết thanh toán VNPAY.');
  }
};

export const getLocalOrderByCode = (orderCode: string): BackendOrder | null => {
  const found = loadCachedOrders().find((o) => o.orderCode === orderCode);
  return found ?? null;
};

export const markVietQrOrderPaid = async (orderCode: string): Promise<BackendOrder | null> => {
  try {
    return await confirmMockPayment(orderCode, 'SUCCESS');
  } catch {
    return null;
  }
};

export const renewVietQrOrderExpiry = async (
  orderCode: string,
  minutes: number = 15,
): Promise<string | null> => {
  try {
    const response = await apiClient.post<BackendOrder>(
      `/api/orders/${encodeURIComponent(orderCode)}/extend-expiry`,
      null,
      { params: { minutes } },
    );
    cacheOrder(response.data);
    return response.data.expiresAt ?? null;
  } catch {
    return null;
  }
};
