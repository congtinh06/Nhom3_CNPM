import { adminClient } from './adminClient';
import {
  AdminOrder,
  AdminOrderPageResponse,
  AdminOrderQueryParams,
  AdminOrderStatus,
} from '../types/order';

export const orderAdminApi = {
  getOrders: async (params: AdminOrderQueryParams): Promise<AdminOrderPageResponse> => {
    const response = await adminClient.get<AdminOrderPageResponse>('/api/admin/orders', {
      params,
    });
    return response.data;
  },

  getOrder: async (orderCode: string): Promise<AdminOrder> => {
    const response = await adminClient.get<AdminOrder>(
      `/api/admin/orders/${encodeURIComponent(orderCode)}`
    );
    return response.data;
  },

  updateStatus: async (orderCode: string, status: AdminOrderStatus): Promise<AdminOrder> => {
    const response = await adminClient.patch<AdminOrder>(
      `/api/admin/orders/${encodeURIComponent(orderCode)}/status`,
      { status }
    );
    return response.data;
  },

  confirmPayment: async (orderCode: string): Promise<AdminOrder> => {
    const response = await adminClient.post<AdminOrder>(
      `/api/admin/orders/${encodeURIComponent(orderCode)}/confirm-payment`
    );
    return response.data;
  },

  rejectPayment: async (orderCode: string): Promise<AdminOrder> => {
    const response = await adminClient.post<AdminOrder>(
      `/api/admin/orders/${encodeURIComponent(orderCode)}/reject-payment`
    );
    return response.data;
  },
};
