import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userApi } from '../api/userApi';
import { normalizeAdminError } from '../api/adminClient';
import { useAuth } from '../../context/AuthContext';
import {
  AdminUser,
  UserRoleValue,
  UserStatusValue,
  USER_PROVIDER_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from '../types/user';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';

type PendingAction =
  | { kind: 'role'; value: UserRoleValue }
  | { kind: 'status'; value: UserStatusValue };

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return '—';
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
      const updated =
        pendingAction.kind === 'role'
          ? await userApi.updateUserRole(user.id, pendingAction.value)
          : await userApi.updateUserStatus(user.id, pendingAction.value);
      setUser(updated);
      setRoleDraft(updated.role);
      setStatusDraft(updated.status);
      setNotice(
        pendingAction.kind === 'role'
          ? `Đã cập nhật vai trò của "${updated.fullName}".`
          : `Đã cập nhật trạng thái của "${updated.fullName}".`
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

  const dialogVariant: 'danger' | 'primary' =
    pendingAction?.kind === 'status' && pendingAction.value === 'BLOCKED'
      ? 'danger'
      : pendingAction?.kind === 'role' && pendingAction.value === 'USER'
      ? 'danger'
      : 'primary';

  const dialogTitle =
    pendingAction?.kind === 'role'
      ? pendingAction.value === 'ADMIN'
        ? 'Xác nhận cấp quyền quản trị'
        : 'Xác nhận hạ cấp quyền quản trị'
      : pendingAction?.value === 'BLOCKED'
      ? 'Xác nhận khóa tài khoản'
      : 'Xác nhận đổi trạng thái tài khoản';

  const dialogMessage = (() => {
    if (!pendingAction) return '';
    const name = user.fullName;
    if (pendingAction.kind === 'role') {
      return pendingAction.value === 'ADMIN'
        ? `Tài khoản "${name}" sẽ được cấp toàn quyền quản trị hệ thống. Bạn có chắc chắn muốn tiếp tục?`
        : `Tài khoản "${name}" sẽ mất quyền quản trị và mọi phiên đăng nhập sẽ bị thu hồi. Bạn có chắc chắn muốn tiếp tục?`;
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
        <div>
          <button
            type="button"
            className="adm-back-link"
            onClick={() => navigate('/quan-tri/nguoi-dung')}
          >
            &larr; Quay lại danh sách người dùng
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

      <div className="adm-form-grid">
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
            <div className="adm-detail-row">
              <dt>Trạng thái hiện tại</dt>
              <dd>
                <StatusBadge status={user.status} />
              </dd>
            </div>
          </dl>
        </FormSection>

        <div className="adm-form-side">
          <FormSection title="Vai trò">
            <p className="adm-field-helper" style={{ marginBottom: '12px' }}>
              Vai trò hiện tại: <strong>{USER_ROLE_LABELS[user.role]}</strong>
            </p>
            <div className="adm-action-row">
              <select
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
          </FormSection>

          <FormSection title="Trạng thái tài khoản">
            <p className="adm-field-helper" style={{ marginBottom: '12px' }}>
              Trạng thái hiện tại: <strong>{USER_STATUS_LABELS[user.status]}</strong>
            </p>
            <div className="adm-action-row">
              <select
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
            <p className="adm-field-helper" style={{ marginTop: '12px' }}>
              Khóa hoặc hạ cấp tài khoản sẽ thu hồi toàn bộ phiên đăng nhập. Access token đã cấp
              vẫn có hiệu lực tối đa 15 phút.
            </p>
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
