import { BackendOrder, VietQrPaymentInfo } from '../types';
import { getLocalOrderByCode, getOrderByCode } from './orderService';
import {
  VIETQR_ACCOUNT_NAME,
  VIETQR_ACCOUNT_NO,
  VIETQR_BANK_ID,
  VIETQR_BANK_NAME,
  VIETQR_EXPIRY_MINUTES,
} from '../config/vietqr';

export type VietQrErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'FORBIDDEN_NOT_OWNER'
  | 'ORDER_NOT_PENDING'
  | 'ORDER_EXPIRED';

export class VietQrError extends Error {
  readonly code: VietQrErrorCode;

  constructor(code: VietQrErrorCode, message: string) {
    super(message);
    this.name = 'VietQrError';
    this.code = code;
  }
}

/** Build the bank transfer content from an order code (alphanumeric, max 25 chars). */
export const buildTransferContent = (orderCode: string): string => {
  const normalized = orderCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return normalized.slice(0, 25) || 'THANHTOAN';
};

/** Build the VietQR QR-only image URL (no logos/text around the code). */
export const buildVietQrUrl = (amount: number, transferContent: string): string => {
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo: transferContent,
    accountName: VIETQR_ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${VIETQR_BANK_ID}-${VIETQR_ACCOUNT_NO}-qr_only.png?${params.toString()}`;
};

/** Resolve the order's VietQR expiry (persisted on the order, else createdAt + 15 min). */
export const resolveVietQrExpiry = (order: BackendOrder): string => {
  if (order.expiresAt) return order.expiresAt;
  return new Date(
    new Date(order.createdAt).getTime() + VIETQR_EXPIRY_MINUTES * 60 * 1000
  ).toISOString();
};

/** Owner-only guard that mirrors the backend ownership rule. */
const assertOwner = (order: BackendOrder, currentUserId?: number): void => {
  if (order.userId != null && order.userId !== currentUserId) {
    throw new VietQrError('FORBIDDEN_NOT_OWNER', 'Bạn không có quyền thanh toán đơn hàng này.');
  }
};

/**
 * Guard that mirrors the backend rules: only the order owner may request a QR,
 * and the order must still be awaiting payment.
 */
export const assertVietQrOrderAccess = (
  order: BackendOrder,
  currentUserId?: number
): void => {
  assertOwner(order, currentUserId);
  if (order.status !== 'PENDING_PAYMENT') {
    throw new VietQrError('ORDER_NOT_PENDING', 'Đơn hàng không ở trạng thái chờ thanh toán.');
  }
};

/**
 * Full VietQR info for the QR screen (mirrors GET /api/payments/vietqr/{orderCode}).
 * Owner-only. Does not enforce pending/expiry so the page can still render the
 * amount and bank details when the code has lapsed.
 */
export const getVietQrPaymentInfo = async (
  orderCode: string,
  currentUserId?: number
): Promise<VietQrPaymentInfo> => {
  const order = getLocalOrderByCode(orderCode) ?? (await getOrderByCode(orderCode));
  if (!order) {
    throw new VietQrError('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
  }
  assertOwner(order, currentUserId);

  const transferContent = buildTransferContent(order.orderCode);

  return {
    qrUrl: buildVietQrUrl(order.totalAmount, transferContent),
    amount: order.totalAmount,
    transferContent,
    bankName: VIETQR_BANK_NAME,
    accountNo: VIETQR_ACCOUNT_NO,
    accountName: VIETQR_ACCOUNT_NAME,
    expiresAt: resolveVietQrExpiry(order),
    status: order.status,
  };
};

/** Payable guard: pending + not expired. Throws otherwise. */
export const createVietQrPayment = async (
  orderCode: string,
  currentUserId?: number
): Promise<VietQrPaymentInfo> => {
  const info = await getVietQrPaymentInfo(orderCode, currentUserId);
  if (info.status !== 'PENDING_PAYMENT') {
    throw new VietQrError('ORDER_NOT_PENDING', 'Đơn hàng không ở trạng thái chờ thanh toán.');
  }
  if (new Date(info.expiresAt).getTime() <= Date.now()) {
    throw new VietQrError('ORDER_EXPIRED', 'Mã QR đã hết hạn. Vui lòng tạo lại.');
  }
  return info;
};

/** Lightweight status for polling (mirrors GET /api/orders/{orderCode}/payment-status). */
export const getVietQrPaymentStatus = async (
  orderCode: string,
  currentUserId?: number
): Promise<{ status: BackendOrder['status']; paymentStatus?: BackendOrder['paymentStatus']; expiresAt: string }> => {
  const cached = getLocalOrderByCode(orderCode);
  let remote: BackendOrder | null = null;

  if (!cached || cached.status === 'PENDING_PAYMENT') {
    try {
      remote = await getOrderByCode(orderCode);
    } catch {
      remote = null;
    }
  }

  const order = remote ?? cached ?? (await getOrderByCode(orderCode));
  if (!order) {
    throw new VietQrError('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.');
  }
  assertOwner(order, currentUserId);
  return {
    status: order.status,
    paymentStatus: order.paymentStatus,
    expiresAt: resolveVietQrExpiry(order),
  };
};

export const isVietQrPaid = (status: BackendOrder['status'], paymentStatus?: BackendOrder['paymentStatus']): boolean =>
  status === 'PAID' || paymentStatus === 'SUCCESS';