import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderAdminApi } from '../api/orderApi';
import { normalizeAdminError } from '../api/adminClient';
import {
  AdminOrder,
  AdminOrderStatus,
  ORDER_STATUS_BADGE,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_STATUS_BADGE,
  PREMIUM_PACKAGE_LABELS,
} from '../types/order';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';

type PendingAction =
  | { kind: 'confirm-payment' }
  | { kind: 'reject-payment' }
  | { kind: 'status'; value: AdminOrderStatus };

function formatCurrency(value: number): string {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '-';
  }
}

export const OrderDetailPage: React.FC = () => {
  const { orderCode } = useParams<{ orderCode: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orderCode) {
      setLoadError('Không tìm thấy đơn hàng.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      setOrder(await orderAdminApi.getOrder(orderCode));
    } catch (err) {
      setLoadError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [orderCode]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    if (!order || !pendingAction || submitting) return;
    setSubmitting(true);
    setNotice(null);
    setActionError(null);
    try {
      const updated =
        pendingAction.kind === 'confirm-payment'
          ? await orderAdminApi.confirmPayment(order.orderCode)
          : pendingAction.kind === 'reject-payment'
          ? await orderAdminApi.rejectPayment(order.orderCode)
          : await orderAdminApi.updateStatus(order.orderCode, pendingAction.value);

      setOrder(updated);
      setNotice('Đã cập nhật đơn hàng thành công.');
      setPendingAction(null);
    } catch (err) {
      setActionError(normalizeAdminError(err).message);
      setPendingAction(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="adm-page">
        <div className="adm-form-skeleton">
          <div className="adm-skeleton-cell" style={{ height: '40px', marginBottom: '16px' }} />
          <div className="adm-skeleton-cell" style={{ height: '220px' }} />
        </div>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="adm-page">
        <ErrorState
          title="Không thể tải đơn hàng"
          message={loadError || 'Không tìm thấy đơn hàng.'}
          onRetry={load}
        />
      </div>
    );
  }

  const orderBadge = ORDER_STATUS_BADGE[order.status];
  const paymentBadge = PAYMENT_STATUS_BADGE[order.paymentStatus];
  const isPremium = order.orderType === 'PREMIUM';

  const canConfirmPayment =
    order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED';
  const canRejectPayment = canConfirmPayment;
  const canProcess = !isPremium && order.status === 'PAID';
  const canComplete =
    (order.status === 'PROCESSING' || order.status === 'PAID') &&
    (order.paymentMethod === 'COD' || order.paymentStatus === 'SUCCESS');
  const canCancel =
    order.status !== 'COMPLETED' &&
    order.status !== 'CANCELLED' &&
    order.paymentStatus !== 'SUCCESS';

  const dialogTitle = (() => {
    if (!pendingAction) return '';
    if (pendingAction.kind === 'confirm-payment') return 'Xác nhận đã nhận tiền';
    if (pendingAction.kind === 'reject-payment') return 'Đánh dấu thanh toán thất bại';
    switch (pendingAction.value) {
      case 'PROCESSING':
        return 'Bắt đầu xử lý đơn hàng';
      case 'COMPLETED':
        return isPremium ? 'Hoàn tất đơn Premium' : 'Xác nhận đã giao hàng';
      default:
        return 'Hủy đơn hàng';
    }
  })();

  const dialogMessage = (() => {
    if (!pendingAction) return '';
    if (pendingAction.kind === 'confirm-payment') {
      return `Xác nhận đã nhận ${formatCurrency(order.totalAmount)} cho đơn ${order.orderCode}?${
        isPremium ? ' Gói Premium sẽ được kích hoạt ngay cho tài khoản này.' : ''
      }`;
    }
    if (pendingAction.kind === 'reject-payment') {
      return 'Đơn hàng sẽ được đánh dấu thanh toán thất bại và chuyển sang trạng thái đã hủy.';
    }
    switch (pendingAction.value) {
      case 'PROCESSING':
        return 'Đánh dấu đơn hàng đang được đóng gói và chuẩn bị giao cho khách.';
      case 'COMPLETED':
        return isPremium
          ? 'Xác nhận gói Premium đã được kích hoạt và hoàn tất cho khách hàng.'
          : 'Xác nhận khách đã nhận hàng. Đơn hàng sẽ được đóng và không thể thay đổi nữa.';
      default:
        return 'Đơn hàng sẽ bị hủy và không thể khôi phục.';
    }
  })();

  const dialogVariant: 'danger' | 'primary' =
    pendingAction?.kind === 'reject-payment' ||
    (pendingAction?.kind === 'status' && pendingAction.value === 'CANCELLED')
      ? 'danger'
      : 'primary';

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <button
            type="button"
            className="adm-back-link"
            onClick={() => navigate('/quan-tri/don-hang')}
          >
            <ChevronLeft /> Quay lại danh sách đơn hàng
          </button>
          <h1 className="adm-page-title adm-order-code">{order.orderCode}</h1>
          <p className="adm-page-desc">
            {ORDER_TYPE_LABELS[order.orderType]} · Tạo lúc {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="adm-order-head-badges">
          <StatusBadge variant={paymentBadge.variant}>{paymentBadge.label}</StatusBadge>
          <StatusBadge variant={orderBadge.variant}>{orderBadge.label}</StatusBadge>
        </div>
      </div>

      {notice && <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />}

      {actionError && (
        <AdminAlert variant="danger" message={actionError} onClose={() => setActionError(null)} />
      )}

      <div className="adm-form-grid">
        <div className="adm-order-main">
          <FormSection title="Thông tin đơn hàng">
            <dl className="adm-detail-list">
              <div className="adm-detail-row">
                <dt>Mã đơn</dt>
                <dd>{order.orderCode}</dd>
              </div>
              <div className="adm-detail-row">
                <dt>Loại đơn</dt>
                <dd>{ORDER_TYPE_LABELS[order.orderType]}</dd>
              </div>
              {isPremium && (
                <div className="adm-detail-row">
                  <dt>Gói</dt>
                  <dd>
                    {PREMIUM_PACKAGE_LABELS[order.premiumPackage || ''] ||
                      order.premiumPackage ||
                      'Gói Premium'}
                  </dd>
                </div>
              )}
              <div className="adm-detail-row">
                <dt>Phương thức thanh toán</dt>
                <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd>
              </div>
              <div className="adm-detail-row">
                <dt>Tạm tính</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="adm-detail-row">
                <dt>Phí giao hàng</dt>
                <dd>{formatCurrency(order.shippingFee)}</dd>
              </div>
              <div className="adm-detail-row adm-detail-row-strong">
                <dt>Tổng cộng</dt>
                <dd>{formatCurrency(order.totalAmount)}</dd>
              </div>
              <div className="adm-detail-row">
                <dt>Thanh toán lúc</dt>
                <dd>{formatDateTime(order.paidAt)}</dd>
              </div>
              {order.note && (
                <div className="adm-detail-row">
                  <dt>Ghi chú</dt>
                  <dd>{order.note}</dd>
                </div>
              )}
            </dl>
          </FormSection>

          {isPremium ? (
            <FormSection title="Gói dịch vụ">
              <p className="adm-field-helper">
                Đơn kỹ thuật số, không giao hàng. Quyền Premium được kích hoạt tự động cho tài
                khoản #{order.userId} ngay khi xác nhận thanh toán.
              </p>
            </FormSection>
          ) : (
            <FormSection title="Sản phẩm">
              <div className="adm-order-items">
                {order.items.map((item) => (
                  <div className="adm-order-item" key={`${item.productId}-${item.productName}`}>
                    <div className="adm-order-item-name">
                      <Link to={`/quan-tri/san-pham/${item.productId}`}>{item.productName}</Link>
                      <span className="adm-product-slug">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </span>
                    </div>
                    <span className="adm-order-amount">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="adm-order-item adm-order-item-total">
                  <span>Tổng cộng</span>
                  <span className="adm-order-amount">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </FormSection>
          )}

          <FormSection title="Lịch sử thanh toán">
            {order.payments && order.payments.length > 0 ? (
              <div className="adm-order-payments">
                {order.payments.map((payment) => {
                  const badge = PAYMENT_STATUS_BADGE[payment.status];
                  return (
                    <div className="adm-order-payment" key={payment.id}>
                      <div className="adm-order-payment-main">
                        <strong>{PAYMENT_PROVIDER_LABELS[payment.provider]}</strong>
                        <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
                        <span className="adm-order-amount">{formatCurrency(payment.amount)}</span>
                      </div>
                      <dl className="adm-detail-list">
                        <div className="adm-detail-row">
                          <dt>Mã giao dịch</dt>
                          <dd>{payment.txnRef}</dd>
                        </div>
                        {payment.transactionNo && (
                          <div className="adm-detail-row">
                            <dt>Mã ngân hàng</dt>
                            <dd>
                              {payment.bankCode || '-'} · {payment.transactionNo}
                            </dd>
                          </div>
                        )}
                        <div className="adm-detail-row">
                          <dt>Thời gian</dt>
                          <dd>{formatDateTime(payment.paidAt || payment.createdAt)}</dd>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="adm-field-helper">
                Chưa có giao dịch thanh toán. Nếu khách đã chuyển khoản, hãy đối chiếu sao kê rồi
                xác nhận ở cột bên phải.
              </p>
            )}
          </FormSection>
        </div>

        <div className="adm-form-side">
          <FormSection title="Xử lý đơn hàng">
            <div className="adm-order-actions">
              {canConfirmPayment && (
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={() => setPendingAction({ kind: 'confirm-payment' })}
                  disabled={submitting}
                >
                  Xác nhận đã nhận tiền
                </button>
              )}
              {canProcess && (
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setPendingAction({ kind: 'status', value: 'PROCESSING' })}
                  disabled={submitting}
                >
                  Bắt đầu xử lý
                </button>
              )}
              {canComplete && (
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setPendingAction({ kind: 'status', value: 'COMPLETED' })}
                  disabled={submitting}
                >
                  {isPremium ? 'Hoàn tất đơn Premium' : 'Xác nhận đã giao'}
                </button>
              )}
              {canRejectPayment && (
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost"
                  onClick={() => setPendingAction({ kind: 'reject-payment' })}
                  disabled={submitting}
                >
                  Thanh toán thất bại
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost"
                  onClick={() => setPendingAction({ kind: 'status', value: 'CANCELLED' })}
                  disabled={submitting}
                >
                  Hủy đơn
                </button>
              )}
              {!canConfirmPayment && !canProcess && !canComplete && !canCancel && (
                <p className="adm-field-helper">Đơn hàng đã ở trạng thái kết thúc.</p>
              )}
            </div>

            {order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && (
              <p className="adm-field-helper">
                Đối chiếu sao kê ngân hàng/VietQR trước khi bấm xác nhận. Thao tác này không thể
                hoàn tác.
              </p>
            )}
            {order.paymentMethod === 'COD' && order.status !== 'COMPLETED' && (
              <p className="adm-field-helper">
                Đơn COD: khi xác nhận đã giao, hệ thống tự ghi nhận đã thu tiền.
              </p>
            )}
            {isPremium && order.paymentStatus === 'SUCCESS' && order.status !== 'COMPLETED' && (
              <p className="adm-field-helper">
                Premium đã được kích hoạt. Bấm hoàn tất để đóng đơn sau khi đã hỗ trợ khách.
              </p>
            )}
          </FormSection>

          <FormSection title={isPremium ? 'Tài khoản' : 'Người nhận'}>
            <dl className="adm-detail-list">
              <div className="adm-detail-row">
                <dt>Tài khoản</dt>
                <dd>
                  <Link to={`/quan-tri/nguoi-dung/${order.userId}`}>#{order.userId}</Link>
                </dd>
              </div>
              <div className="adm-detail-row">
                <dt>Họ tên</dt>
                <dd>{order.receiverName}</dd>
              </div>
              <div className="adm-detail-row">
                <dt>Điện thoại</dt>
                <dd>{order.phone}</dd>
              </div>
              <div className="adm-detail-row">
                <dt>Địa chỉ</dt>
                <dd>{order.address}</dd>
              </div>
            </dl>
          </FormSection>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={dialogTitle}
        message={dialogMessage}
        confirmText={submitting ? 'Đang xử lý...' : 'Xác nhận'}
        cancelText="Hủy bỏ"
        variant={dialogVariant}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!submitting) setPendingAction(null);
        }}
      />
    </div>
  );
};

export default OrderDetailPage;
