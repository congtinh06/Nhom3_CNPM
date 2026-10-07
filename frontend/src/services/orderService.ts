import { apiClient } from '../api/client';
import {
  Order,
  OrderItem,
  BackendOrder,
  BackendOrderItem,
  CreateOrderPayload,
  BackendOrderStatus,
} from '../types';

const STORAGE_KEY = 'orders';
const BACKEND_ORDERS_KEY = 'sv:backend_orders';

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
// Backend Order API & Local Fallback
// ==========================================

const loadLocalBackendOrders = (): BackendOrder[] => {
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

const saveLocalBackendOrders = (orders: BackendOrder[]): void => {
  try {
    localStorage.setItem(BACKEND_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore quota errors
  }
};

const generateOrderCode = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SV-${yyyy}${mm}${dd}-${rand}`;
};

export const createBackendOrder = async (
  payload: CreateOrderPayload,
  idempotencyKey: string,
  itemMetaLookup?: Record<number, { name: string; price: number }>
): Promise<BackendOrder> => {
  try {
    const res = await apiClient.post<BackendOrder>('/api/orders', payload, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    // Lưu một bản sao cục bộ để xem đơn liền ngay cả khi chuyển trang
    const current = loadLocalBackendOrders();
    saveLocalBackendOrders([res.data, ...current.filter((o) => o.orderCode !== res.data.orderCode)]);
    return res.data;
  } catch {
    // Fallback giả lập nội bộ (nếu service chưa online hoặc gateway chặn đường dẫn)
    const nowIso = new Date().toISOString();
    const orderCode = generateOrderCode();
    const items: BackendOrderItem[] = payload.items.map((it) => {
      const meta = itemMetaLookup?.[it.productId];
      const name = meta?.name || `Món #${it.productId}`;
      const unitPrice = meta?.price || 0;
      return {
        productId: it.productId,
        productName: name,
        unitPrice,
        quantity: it.quantity,
      };
    });

    const totalAmount = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const initialStatus: BackendOrderStatus =
      payload.paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING_PAYMENT';

    const localOrder: BackendOrder = {
      id: Date.now(),
      orderCode,
      totalAmount,
      status: initialStatus,
      receiverName: payload.receiverName.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      note: payload.note?.trim(),
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'PENDING',
      items,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const current = loadLocalBackendOrders();
    saveLocalBackendOrders([localOrder, ...current]);
    return localOrder;
  }
};

export const getMyOrders = async (): Promise<BackendOrder[]> => {
  try {
    const res = await apiClient.get<BackendOrder[]>('/api/orders/my');
    if (Array.isArray(res.data) && res.data.length > 0) {
      saveLocalBackendOrders(res.data);
      return res.data;
    }
    // Nếu API trả về mảng rỗng thì kết hợp với local fallback
    const local = loadLocalBackendOrders();
    return local;
  } catch {
    return loadLocalBackendOrders();
  }
};

export const getOrderByCode = async (orderCode: string): Promise<BackendOrder | null> => {
  try {
    const res = await apiClient.get<BackendOrder>(`/api/orders/${encodeURIComponent(orderCode)}`);
    return res.data;
  } catch {
    const local = loadLocalBackendOrders();
    return local.find((o) => o.orderCode === orderCode) || null;
  }
};

export const cancelBackendOrder = async (orderCode: string): Promise<BackendOrder | null> => {
  try {
    const res = await apiClient.post<BackendOrder>(`/api/orders/${encodeURIComponent(orderCode)}/cancel`);
    const local = loadLocalBackendOrders();
    const updated = local.map((o) => (o.orderCode === orderCode ? res.data : o));
    saveLocalBackendOrders(updated);
    return res.data;
  } catch {
    const local = loadLocalBackendOrders();
    let updatedOrder: BackendOrder | null = null;
    const updated = local.map((o) => {
      if (o.orderCode === orderCode && (o.status === 'PENDING_PAYMENT' || o.status === 'PROCESSING')) {
        updatedOrder = {
          ...o,
          status: 'CANCELLED',
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });
    if (updatedOrder) {
      saveLocalBackendOrders(updated);
    }
    return updatedOrder;
  }
};

export const confirmMockPayment = async (
  orderCode: string,
  outcome: 'SUCCESS' | 'FAILED'
): Promise<BackendOrder> => {
  try {
    const res = await apiClient.post<BackendOrder>(
      `/api/orders/${encodeURIComponent(orderCode)}/pay/mock-confirm`,
      null,
      {
        params: { outcome },
      }
    );
    const local = loadLocalBackendOrders();
    saveLocalBackendOrders(local.map((o) => (o.orderCode === orderCode ? res.data : o)));
    return res.data;
  } catch {
    const local = loadLocalBackendOrders();
    const nowIso = new Date().toISOString();
    let target = local.find((o) => o.orderCode === orderCode);
    if (!target) {
      target = {
        id: Date.now(),
        orderCode,
        totalAmount: 0,
        status: outcome === 'SUCCESS' ? 'PAID' : 'PENDING_PAYMENT',
        receiverName: '',
        phone: '',
        address: '',
        paymentMethod: 'MOCK_GATEWAY',
        paymentStatus: outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        items: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      saveLocalBackendOrders([target, ...local]);
      return target;
    }

    const updatedOrder: BackendOrder = {
      ...target,
      status: outcome === 'SUCCESS' ? 'PAID' : target.status,
      paymentStatus: outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      updatedAt: nowIso,
    };
    saveLocalBackendOrders(local.map((o) => (o.orderCode === orderCode ? updatedOrder : o)));
    return updatedOrder;
  }
};

