import { describe, it, expect, beforeEach } from 'vitest';
import { getOrders, createOrder, cancelOrder, saveOrders } from '../services/orderService';
import { Order } from '../types';

describe('orderService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates an order with SG prefix, status Chờ xác nhận and snapshots items', () => {
    const order = createOrder({
      name: 'Nguyen Van A',
      phone: '0901234567',
      address: '123 Nguyen Hue',
      items: [{ key: 0, name: 'Cà phê sữa đá', quantity: 2, price: 29000 }],
      total: 58000,
    });

    expect(order.id).toMatch(/^SG\d{6}$/);
    expect(order.status).toBe('Chờ xác nhận');
    expect(order.total).toBe(58000);
    expect(order.items).toHaveLength(1);

    const saved = getOrders();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.id).toBe(order.id);
  });

  it('cancels an active order to status Đã hủy', () => {
    const order = createOrder({
      name: 'Nguyen Van A',
      phone: '0901234567',
      address: '123 Nguyen Hue',
      items: [{ key: 0, name: 'Cà phê sữa đá', quantity: 1, price: 29000 }],
      total: 29000,
    });

    const cancelled = cancelOrder(order.id);
    expect(cancelled).not.toBeNull();
    expect(cancelled?.status).toBe('Đã hủy');

    const orders = getOrders();
    expect(orders[0]?.status).toBe('Đã hủy');

    // Trying to cancel an already cancelled order returns null
    const cancelledAgain = cancelOrder(order.id);
    expect(cancelledAgain).toBeNull();
  });

  it('safely resets corrupt localStorage data', () => {
    localStorage.setItem('orders', '{ invalid_json ');
    expect(getOrders()).toEqual([]);

    localStorage.setItem('orders', JSON.stringify({ notAnArray: true }));
    expect(getOrders()).toEqual([]);

    localStorage.setItem('orders', JSON.stringify([{ id: 123 }])); // Missing required order fields
    expect(getOrders()).toEqual([]);
  });

  it('saves and retrieves valid orders correctly', () => {
    const orders: Order[] = [
      {
        id: 'SG123456',
        date: '07/10/2026, 10:00:00',
        status: 'Chờ xác nhận',
        total: 50000,
        name: 'Trần Văn B',
        phone: '0912345678',
        address: '456 Le Loi',
        items: [{ key: 1, name: 'Bạc xỉu', quantity: 1, price: 32000 }],
      },
    ];

    saveOrders(orders);
    const fetched = getOrders();
    expect(fetched).toHaveLength(1);
    expect(fetched[0]?.id).toBe('SG123456');
  });
});
