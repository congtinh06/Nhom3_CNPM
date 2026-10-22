export type AdminOrderType = 'PRODUCT' | 'PREMIUM';
export type AdminOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';
export type AdminPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type AdminPaymentMethod = 'COD' | 'VIETQR' | 'VNPAY';
export type AdminPaymentProvider = 'VNPAY' | 'DEMO_TRANSFER';

export interface AdminOrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface AdminPayment {
  id: number;
  provider: AdminPaymentProvider;
  txnRef: string;
  amount: number;
  status: AdminPaymentStatus;
  responseCode?: string | null;
  transactionNo?: string | null;
  bankCode?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
}

export interface AdminOrder {
  id: number;
  orderCode: string;
  userId: number;
  orderType: AdminOrderType;
  premiumPackage?: string | null;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  status: AdminOrderStatus;
  paymentMethod: AdminPaymentMethod;
  paymentStatus: AdminPaymentStatus;
  receiverName: string;
  phone: string;
  address: string;
  note?: string | null;
  items: AdminOrderItem[];
  payments?: AdminPayment[];
  createdAt?: string | null;
  updatedAt?: string | null;
  expiresAt?: string | null;
  paidAt?: string | null;
}

export interface AdminOrderQueryParams {
  page?: number;
  size?: number;
  type?: AdminOrderType | '';
  status?: AdminOrderStatus | '';
  paymentStatus?: AdminPaymentStatus | '';
  search?: string;
}

export interface AdminOrderPageResponse {
  content: AdminOrder[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const ORDER_TYPE_LABELS: Record<AdminOrderType, string> = {
  PRODUCT: 'Quà lưu niệm',
  PREMIUM: 'Gói Premium',
};

export const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

export const ORDER_STATUS_BADGE: Record<
  AdminOrderStatus,
  { label: string; variant: 'neutral' | 'warning' | 'danger' | 'muted' }
> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  PAID: { label: 'Đã thanh toán', variant: 'neutral' },
  PROCESSING: { label: 'Đang xử lý', variant: 'warning' },
  COMPLETED: { label: 'Đã giao', variant: 'neutral' },
  CANCELLED: { label: 'Đã hủy', variant: 'danger' },
};

export const PAYMENT_STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  PENDING: 'Chưa thanh toán',
  SUCCESS: 'Đã nhận tiền',
  FAILED: 'Thất bại',
};

export const PAYMENT_STATUS_BADGE: Record<
  AdminPaymentStatus,
  { label: string; variant: 'neutral' | 'warning' | 'danger' | 'muted' }
> = {
  PENDING: { label: 'Chưa thanh toán', variant: 'warning' },
  SUCCESS: { label: 'Đã nhận tiền', variant: 'neutral' },
  FAILED: { label: 'Thất bại', variant: 'danger' },
};

export const PAYMENT_METHOD_LABELS: Record<AdminPaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  VIETQR: 'Chuyển khoản VietQR',
  VNPAY: 'VNPAY',
};

export const PAYMENT_PROVIDER_LABELS: Record<AdminPaymentProvider, string> = {
  VNPAY: 'VNPAY',
  DEMO_TRANSFER: 'Chuyển khoản thủ công',
};

export const PREMIUM_PACKAGE_LABELS: Record<string, string> = {
  PREMIUM_LANGUAGES: 'Gói 3 ngôn ngữ (English, Japanese, Korean)',
};
