import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assertVietQrOrderAccess,
  buildTransferContent,
  buildVietQrUrl,
  createVietQrPayment,
  getVietQrPaymentStatus,
  VietQrError,
} from '../services/vietQrService';
import { getLocalOrderByCode, getOrderByCode } from '../services/orderService';
import { BackendOrder } from '../types';
import {
  VIETQR_ACCOUNT_NAME,
  VIETQR_ACCOUNT_NO,
  VIETQR_BANK_ID,
} from '../config/vietqr';

vi.mock('../services/orderService', () => ({
  getLocalOrderByCode: vi.fn(),
  getOrderByCode: vi.fn(),
}));

const mockedGetLocal = vi.mocked(getLocalOrderByCode);
const mockedGetRemote = vi.mocked(getOrderByCode);

const makeOrder = (overrides: Partial<BackendOrder> = {}): BackendOrder => ({
  id: 1,
  orderCode: 'SV-20261009-1234',
  totalAmount: 58000,
  status: 'PENDING_PAYMENT',
  receiverName: 'Nguyen Van A',
  phone: '0901234567',
  address: 'TP. Ho Chi Minh',
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('vietQrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildTransferContent', () => {
    it('strips punctuation and uppercases the order code', () => {
      expect(buildTransferContent('sv-20261009-1234')).toBe('SV202610091234');
    });

    it('falls back to a default when there are no alphanumerics', () => {
      expect(buildTransferContent('---')).toBe('THANHTOAN');
    });
  });

  describe('buildVietQrUrl', () => {
    it('builds the qr_only URL with amount, addInfo and accountName', () => {
      const url = buildVietQrUrl(58000, 'SV202610091234');
      expect(
        url.startsWith(
          `https://img.vietqr.io/image/${VIETQR_BANK_ID}-${VIETQR_ACCOUNT_NO}-qr_only.png?`
        )
      ).toBe(true);

      const params = new URL(url).searchParams;
      expect(params.get('amount')).toBe('58000');
      expect(params.get('addInfo')).toBe('SV202610091234');
      expect(params.get('accountName')).toBe(VIETQR_ACCOUNT_NAME);
    });

    it('rounds fractional amounts', () => {
      const url = buildVietQrUrl(10999.6, 'X');
      expect(new URL(url).searchParams.get('amount')).toBe('11000');
    });
  });

  describe('assertVietQrOrderAccess', () => {
    it('allows a guest order (no owner) that is still pending', () => {
      expect(() => assertVietQrOrderAccess(makeOrder())).not.toThrow();
    });

    it('rejects a non-PENDING order', () => {
      expect(() =>
        assertVietQrOrderAccess(makeOrder({ status: 'PROCESSING' }))
      ).toThrowError(VietQrError);
    });

    it('rejects a caller that is not the order owner', () => {
      expect(() =>
        assertVietQrOrderAccess(makeOrder({ userId: 1 }), 2)
      ).toThrowError(VietQrError);
    });
  });

  describe('createVietQrPayment', () => {
    it('returns QR info for a PENDING order owned by the caller', async () => {
      mockedGetLocal.mockReturnValue(makeOrder({ userId: 7 }));

      const info = await createVietQrPayment('SV-20261009-1234', 7);

      expect(info.amount).toBe(58000);
      expect(info.transferContent).toBe('SV202610091234');
      expect(new URL(info.qrUrl).searchParams.get('amount')).toBe('58000');
      expect(new Date(info.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('rejects a non-PENDING order', async () => {
      mockedGetLocal.mockReturnValue(makeOrder({ status: 'PROCESSING' }));

      await expect(
        createVietQrPayment('SV-20261009-1234')
      ).rejects.toMatchObject({ code: 'ORDER_NOT_PENDING' });
    });

    it('rejects a non-owner', async () => {
      mockedGetLocal.mockReturnValue(makeOrder({ userId: 1 }));

      await expect(
        createVietQrPayment('SV-20261009-1234', 2)
      ).rejects.toMatchObject({ code: 'FORBIDDEN_NOT_OWNER' });
    });

    it('throws ORDER_NOT_FOUND when the order does not exist', async () => {
      mockedGetLocal.mockReturnValue(null);
      mockedGetRemote.mockResolvedValue(null);

      await expect(createVietQrPayment('SV-NOPE')).rejects.toMatchObject({
        code: 'ORDER_NOT_FOUND',
      });
    });

    it('rejects an expired PENDING order with ORDER_EXPIRED', async () => {
      const past = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      mockedGetLocal.mockReturnValue(makeOrder({ createdAt: past, updatedAt: past }));

      await expect(
        createVietQrPayment('SV-20261009-1234')
      ).rejects.toMatchObject({ code: 'ORDER_EXPIRED' });
    });
  });

  describe('getVietQrPaymentStatus', () => {
    it('returns status and resolved expiry for an owner', async () => {
      mockedGetLocal.mockReturnValue(makeOrder({ status: 'PAID' }));

      const st = await getVietQrPaymentStatus('SV-20261009-1234', 7);

      expect(st.status).toBe('PAID');
      expect(new Date(st.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
