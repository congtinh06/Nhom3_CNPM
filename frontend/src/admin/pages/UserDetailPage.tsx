/**
 * ============================================================================
 * QUẢN TRỊ VIÊN: CHI TIẾT NGƯỜI DÙNG & QUẢN LÝ GÓI PREMIUM (User Detail & Plan)
 * ============================================================================
 * 
 * Mục đích module:
 * - Xem thông tin chi tiết một người dùng cụ thể.
 * - Cho phép Quản trị viên kiểm tra xem tài khoản này đã được nâng cấp lên Premium chưa.
 * - Trực tiếp nâng cấp lên Premium (chọn số ngày 30, 90, 365 hoặc vĩnh viễn) hoặc hạ về Free.
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Thông tin tài khoản]: Bổ sung hiển thị Plan (Premium/Free), hạn dùng Premium và mã đơn hàng đã thanh toán.
 * 2. [Quản trị gói Premium]: Bổ sung card "Gói dịch vụ & Quyền lợi Premium" với dropdown chọn gói và thời hạn.
 * 3. [Xác nhận an toàn]: Tích hợp ConfirmDialog trước khi thực hiện cập nhật gói để tránh thao tác nhầm.
 * 4. [Gọi API updateUserPlan]: Gửi request PATCH /{id}/plan đến auth-service để lưu thay đổi và ghi audit log.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { normalizeAdminError } from '../api/adminClient';
import { useAuth } from '../../context/AuthContext';
import {
  AdminUser,
  UserPlanValue,
  UserRoleValue,
  UserStatusValue,
  USER_PROVIDER_LABELS,
} from '../types/user';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';

type PendingAction =
  | { kind: 'role'; value: UserRoleValue }
  | { kind: 'status'; value: UserStatusValue }
  | { kind: 'plan'; value: UserPlanValue; durationDays?: number };

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '-';
  }
}

function resolveActionError(err: unknown, status: number): string {
  const norm = normalizeAdminError(err);
  const message = norm.message || '';
  if (status === 404 || /không tìm thấy người dùng/i.test(message)) {
    return 'Không tìm thấy người dùng cần cập nhật.';
  }
  return message || 'Đã xảy ra lỗi khi cập nhật.';
}

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const userId = id ? parseInt(id, 10) : null;

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [roleDraft, setRoleDraft] = useState<UserRoleValue>('USER');
  const [statusDraft, setStatusDraft] = useState<UserStatusValue>('ACTIVE');
  const [planDraft, setPlanDraft] = useState<UserPlanValue>('FREE');
  const [durationDaysDraft, setDurationDaysDraft] = useState<number>(365);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || Number.isNaN(userId)) {
      setLoadError('Không tìm thấy người dùng.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await userApi.getAdminUserDetail(userId);
      setUser(detail);
      setRoleDraft(detail.role);
      setStatusDraft(detail.status);
      setPlanDraft(detail.plan || 'FREE');
    } catch (err) {
      setLoadError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const isSelf = Boolean(currentUser && user && currentUser.id === user.id);

  const handleConfirm = async () => {
    if (!user || !pendingAction || submitting) return;
    setSubmitting(true);
    setNotice(null);
    setActionError(null);
    try {
      let updated: AdminUser;
      if (pendingAction.kind === 'role') {
        updated = await userApi.updateUserRole(user.id, pendingAction.value);
      } else if (pendingAction.kind === 'status') {
        updated = await userApi.updateUserStatus(user.id, pendingAction.value);
      } else {
        updated = await userApi.updateUserPlan(user.id, pendingAction.value, pendingAction.durationDays);
      }
      setUser(updated);
      setRoleDraft(updated.role);
      setStatusDraft(updated.status);
      setPlanDraft(updated.plan || 'FREE');
      setNotice(
        pendingAction.kind === 'role'
          ? `Đã cập nhật vai trò của "${updated.fullName}".`
          : pendingAction.kind === 'status'
          ? `Đã cập nhật trạng thái của "${updated.fullName}".`
          : `Đã cập nhật gói dịch vụ của "${updated.fullName}".`
      );
      setPendingAction(null);
    } catch (err) {
      setActionError(resolveActionError(err, normalizeAdminError(err).status));
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
          <div className="adm-skeleton-cell" style={{ height: '160px' }} />
        </div>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="adm-page">
        <ErrorState
          title="Không thể tải thông tin người dùng"
          message={loadError || 'Không tìm thấy người dùng.'}
          onRetry={load}
        />
      </div>
    );
  }

  const roleDirty = roleDraft !== user.role;
  const statusDirty = statusDraft !== user.status;
  const currentPlan = user.plan || 'FREE';
  const planDirty = planDraft !== currentPlan;

  const dialogVariant: 'danger' | 'primary' =
    pendingAction?.kind === 'status' && pendingAction.value === 'BLOCKED'
      ? 'danger'
      : pendingAction?.kind === 'role' && pendingAction.value === 'USER'
      ? 'danger'
      : pendingAction?.kind === 'plan' && pendingAction.value === 'FREE'
      ? 'danger'
      : 'primary';

  const dialogTitle =
    pendingAction?.kind === 'role'
      ? pendingAction.value === 'ADMIN'
        ? 'Xác nhận cấp quyền quản trị'
        : 'Xác nhận hạ cấp quyền quản trị'
      : pendingAction?.kind === 'status'
      ? pendingAction?.value === 'BLOCKED'
        ? 'Xác nhận khóa tài khoản'
        : 'Xác nhận đổi trạng thái tài khoản'
      : pendingAction?.value === 'PREMIUM'
      ? 'Xác nhận nâng cấp gói Premium'
      : 'Xác nhận hạ cấp gói tài khoản';

  const dialogMessage = (() => {
    if (!pendingAction) return '';
    const name = user.fullName;
    if (pendingAction.kind === 'role') {
      return pendingAction.value === 'ADMIN'
        ? `Tài khoản "${name}" sẽ được cấp toàn quyền quản trị hệ thống. Bạn có chắc chắn muốn tiếp tục?`
        : `Tài khoản "${name}" sẽ mất quyền quản trị và mọi phiên đăng nhập sẽ bị thu hồi. Bạn có chắc chắn muốn tiếp tục?`;
    }
    if (pendingAction.kind === 'plan') {
      return pendingAction.value === 'PREMIUM'
        ? `Nâng cấp tài khoản "${name}" lên gói Premium (${pendingAction.durationDays ?? 365} ngày)? Người dùng sẽ được mở khóa ngay toàn bộ tính năng và bài thuyết minh đa ngôn ngữ.`
        : `Chuyển tài khoản "${name}" về gói Miễn phí (Free)?`;
    }
    switch (pendingAction.value) {
      case 'BLOCKED':
        return `Tài khoản "${name}" sẽ bị khóa và mọi phiên đăng nhập sẽ bị thu hồi. Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa. Bạn có chắc chắn?`;
      case 'PENDING':
        return `Tài khoản "${name}" sẽ chuyển sang trạng thái chờ xác thực và không thể đăng nhập cho đến khi xác thực email. Bạn có chắc chắn?`;
      default:
        return `Kích hoạt lại tài khoản "${name}"? Người dùng sẽ có thể đăng nhập trở lại.`;
    }
  })();

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div className="adm-page-head-main">
          <button
            type="button"
            className="adm-back-link"
            onClick={() => navigate('/quan-tri/nguoi-dung')}
          >
            <ChevronLeft size={16} strokeWidth={2} /> Quay lại danh sách người dùng
          </button>
          <h1 className="adm-page-title">{user.fullName}</h1>
          <p className="adm-page-desc">{user.email}</p>
        </div>
      </div>

      {notice && (
        <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />
      )}

      {actionError && (
        <AdminAlert variant="danger" message={actionError} onClose={() => setActionError(null)} />
      )}

      {isSelf && (
        <div className="adm-form-hint">
          Đây là tài khoản của chính bạn. Bạn không thể tự thay đổi vai trò hoặc trạng thái của mình.
        </div>
      )}

      <div className="adm-form-grid adm-user-detail-grid">
        <FormSection title="Thông tin tài khoản">

          <dl className="adm-detail-list">
            <div className="adm-detail-row">
              <dt>Mã người dùng</dt>
              <dd>#{user.id}</dd>
            </div>
            <div className="adm-detail-row">
              <dt>Họ tên</dt>
              <dd>{user.fullName}</dd>
            </div>
            <div className="adm-detail-row">
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="adm-detail-row">
              <dt>Nhà cung cấp đăng nhập</dt>
              <dd>{USER_PROVIDER_LABELS[user.provider]}</dd>
            </div>
            <div className="adm-detail-row">
              <dt>Xác thực email</dt>
              <dd>{user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</dd>
            </div>
            <div className="adm-detail-row">
              <dt>Đăng nhập cuối</dt>
              <dd>{formatDateTime(user.lastLoginAt)}</dd>
            </div>
            <div className="adm-detail-row">
              <dt>Ngày tạo</dt>
              <dd>{formatDateTime(user.createdAt)}</dd>
            </div>
            {user.plan === 'PREMIUM' && (
              <>
                <div className="adm-detail-row">
                  <dt>Thời hạn Premium</dt>
                  <dd>
                    {user.premiumExpiresAt
                      ? formatDateTime(user.premiumExpiresAt)
                      : 'Vĩnh viễn (Không thời hạn)'}
                  </dd>
                </div>
                {user.premiumSourceOrderCode && (
                  <div className="adm-detail-row">
                    <dt>Mã đơn kích hoạt</dt>
                    <dd>
                      <Link
                        to={`/quan-tri/don-hang?search=${encodeURIComponent(user.premiumSourceOrderCode)}`}
                        style={{ color: '#0F766E', textDecoration: 'underline', fontWeight: 600 }}
                      >
                        {user.premiumSourceOrderCode}
                      </Link>
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </FormSection>

        <div className="adm-form-side">
          <FormSection title="Quản lý tài khoản" className="adm-user-mgmt-card">
            <div className="adm-mgmt-group">
              <label className="adm-mgmt-label" htmlFor="user-plan-select">Gói dịch vụ</label>
              <div className="adm-mgmt-row">
                <select
                  id="user-plan-select"
                  className="adm-select"
                  value={planDraft}
                  onChange={(e) => setPlanDraft(e.target.value as UserPlanValue)}
                  disabled={submitting}
                  aria-label="Chọn gói dịch vụ"
                >
                  <option value="FREE">Miễn phí (Free)</option>
                  <option value="PREMIUM">Nâng cao (Premium)</option>
                </select>
                {planDraft === 'PREMIUM' && (
                  <select
                    className="adm-select"
                    value={durationDaysDraft}
                    onChange={(e) => setDurationDaysDraft(Number(e.target.value))}
                    disabled={submitting}
                    aria-label="Thời hạn gói Premium"
                    style={{ width: '130px', flex: '0 0 130px' }}
                  >
                    <option value={30}>30 ngày</option>
                    <option value={90}>90 ngày</option>
                    <option value={365}>1 năm (365 ngày)</option>
                    <option value={3650}>10 năm</option>
                  </select>
                )}
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={() =>
                    setPendingAction({
                      kind: 'plan',
                      value: planDraft,
                      durationDays: durationDaysDraft,
                    })
                  }
                  disabled={submitting || (!planDirty && planDraft === 'FREE')}
                >
                  Cập nhật gói
                </button>
              </div>
              <p className="adm-field-helper" style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.45 }}>
                Tài khoản Premium được mở khóa toàn bộ tính năng: nghe audio thuyết minh đa ngôn
                ngữ (Anh, Nhật, Hàn), mở khóa chi tiết các phân đoạn và giảm giá quà lưu niệm.
              </p>
            </div>

            <div className="adm-mgmt-divider" />

            <div className="adm-mgmt-group">
              <label className="adm-mgmt-label" htmlFor="user-role-select">Vai trò</label>
              <div className="adm-mgmt-row">
                <select
                  id="user-role-select"
                  className="adm-select"
                  value={roleDraft}
                  onChange={(e) => setRoleDraft(e.target.value as UserRoleValue)}
                  disabled={isSelf || submitting}
                  aria-label="Chọn vai trò"
                >
                  <option value="USER">Du khách</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={() => setPendingAction({ kind: 'role', value: roleDraft })}
                  disabled={isSelf || submitting || !roleDirty}
                >
                  Cập nhật vai trò
                </button>
              </div>
            </div>

            <div className="adm-mgmt-divider" />

            <div className="adm-mgmt-group">
              <label className="adm-mgmt-label" htmlFor="user-status-select">Trạng thái tài khoản</label>
              <div className="adm-mgmt-row">
                <select
                  id="user-status-select"
                  className="adm-select"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as UserStatusValue)}
                  disabled={isSelf || submitting}
                  aria-label="Chọn trạng thái tài khoản"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="PENDING">Chờ xác thực</option>
                  <option value="BLOCKED">Đã khóa</option>
                </select>
                <button
                  type="button"
                  className="adm-btn adm-btn-primary"
                  onClick={() => setPendingAction({ kind: 'status', value: statusDraft })}
                  disabled={isSelf || submitting || !statusDirty}
                >
                  Cập nhật trạng thái
                </button>
              </div>
              <p className="adm-field-helper" style={{ margin: '6px 0 0', fontSize: '12px', lineHeight: 1.45 }}>
                Khóa hoặc hạ cấp tài khoản sẽ thu hồi toàn bộ phiên đăng nhập. Access token đã cấp
                vẫn có hiệu lực tối đa 15 phút.
              </p>
            </div>
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

export default UserDetailPage;
