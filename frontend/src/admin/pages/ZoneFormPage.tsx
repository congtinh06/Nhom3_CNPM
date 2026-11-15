import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { zoneApi } from '../api/zoneApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminApiError } from '../types';
import {
  AdminZoneDetail,
  CreateZoneInput,
  UpdateZoneInput,
  ZONE_RADIUS_MAX,
  ZONE_RADIUS_MIN,
} from '../types/zone';
import { FormField } from '../components/FormField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';

interface FormValues {
  code: string;
  name: string;
  description: string;
  centerLat: string;
  centerLng: string;
  radiusMeters: string;
  isActive: boolean;
}

const DEFAULT_VALUES: FormValues = {
  code: '',
  name: '',
  description: '',
  centerLat: '',
  centerLng: '',
  radiusMeters: '1000',
  isActive: true,
};

const FIELD_LABELS: Record<string, string> = {
  code: 'Mã khu vực',
  name: 'Tên khu vực',
  centerLat: 'Vĩ độ tâm',
  centerLng: 'Kinh độ tâm',
  radiusMeters: 'Bán kính',
};

const BACKEND_FIELD_MESSAGES: Record<string, string> = {
  'code is required': 'Mã khu vực không được để trống',
  'code must be at most 50 characters': 'Mã khu vực tối đa 50 ký tự',
  'name is required': 'Tên khu vực không được để trống',
  'name must be at most 200 characters': 'Tên khu vực tối đa 200 ký tự',
  'centerLat is required': 'Vĩ độ tâm không được để trống',
  'centerLat must be >= -90': 'Vĩ độ tâm phải lớn hơn hoặc bằng -90',
  'centerLat must be <= 90': 'Vĩ độ tâm phải nhỏ hơn hoặc bằng 90',
  'centerLng is required': 'Kinh độ tâm không được để trống',
  'centerLng must be >= -180': 'Kinh độ tâm phải lớn hơn hoặc bằng -180',
  'centerLng must be <= 180': 'Kinh độ tâm phải nhỏ hơn hoặc bằng 180',
  'radiusMeters is required': 'Bán kính không được để trống',
  'radiusMeters must be at least 50 meters': 'Bán kính tối thiểu 50 mét',
  'radiusMeters must be at most 50,000 meters': 'Bán kính tối đa 50.000 mét',
};

function detailToFormValues(detail: AdminZoneDetail): FormValues {
  return {
    code: detail.code || '',
    name: detail.name || '',
    description: detail.description || '',
    centerLat: detail.centerLat != null ? String(detail.centerLat) : '',
    centerLng: detail.centerLng != null ? String(detail.centerLng) : '',
    radiusMeters: String(detail.radiusMeters ?? ZONE_RADIUS_MIN),
    isActive: detail.isActive !== false,
  };
}

function resolveFieldMessage(field: string, rawMessage: string): string {
  if (BACKEND_FIELD_MESSAGES[rawMessage]) {
    return BACKEND_FIELD_MESSAGES[rawMessage];
  }
  const label = FIELD_LABELS[field] || 'Trường này';
  return `${label} không hợp lệ.`;
}

function resolveSubmitError(norm: AdminApiError): { fieldErrors?: Record<string, string>; general?: string } {
  if (norm.details && Object.keys(norm.details).length > 0) {
    const fieldErrors: Record<string, string> = {};
    Object.entries(norm.details).forEach(([field, message]) => {
      fieldErrors[field] = resolveFieldMessage(field, message);
    });
    return { fieldErrors };
  }

  const msg = norm.message || '';

  if (/already exists/i.test(msg)) {
    return { general: 'Mã khu vực đã tồn tại trên hệ thống. Vui lòng chọn mã khác.' };
  }
  if (/chồng lấn/i.test(msg)) {
    return { general: msg };
  }
  if (/Không thể ngừng hoạt động/i.test(msg)) {
    return { general: msg };
  }
  if (norm.status === 404) {
    return { general: 'Không tìm thấy khu vực cần cập nhật.' };
  }
  if (norm.status === 403) {
    return { general: 'Bạn không có quyền thực hiện thao tác này.' };
  }
  return { general: msg || 'Đã xảy ra lỗi khi lưu dữ liệu.' };
}

export const ZoneFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const zoneId = id ? parseInt(id, 10) : null;

  const [initialValues, setInitialValues] = useState<FormValues>(DEFAULT_VALUES);
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<AdminZoneDetail | null>(null);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!isEditMode || !zoneId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const loadedDetail = await zoneApi.getAdminZoneDetail(zoneId);
      const loaded = detailToFormValues(loadedDetail);
      setDetail(loadedDetail);
      setInitialValues(loaded);
      setFormValues(loaded);
    } catch (err) {
      setSubmitError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [isEditMode, zoneId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const reloadFromServer = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleActiveChange = (checked: boolean) => {
    setFormValues((prev) => ({ ...prev, isActive: checked }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode) {
      if (!formValues.code.trim()) {
        newErrors.code = 'Mã khu vực không được để trống';
      } else if (formValues.code.trim().length > 50) {
        newErrors.code = 'Mã khu vực tối đa 50 ký tự';
      }
    }

    if (!formValues.name.trim()) {
      newErrors.name = 'Tên khu vực không được để trống';
    } else if (formValues.name.trim().length > 200) {
      newErrors.name = 'Tên khu vực tối đa 200 ký tự';
    }

    const lat = parseFloat(formValues.centerLat);
    if (!formValues.centerLat.trim()) {
      newErrors.centerLat = 'Vĩ độ tâm không được để trống';
    } else if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.centerLat = 'Vĩ độ tâm phải là số trong khoảng -90 đến 90';
    }

    const lng = parseFloat(formValues.centerLng);
    if (!formValues.centerLng.trim()) {
      newErrors.centerLng = 'Kinh độ tâm không được để trống';
    } else if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.centerLng = 'Kinh độ tâm phải là số trong khoảng -180 đến 180';
    }

    if (!formValues.radiusMeters.trim()) {
      newErrors.radiusMeters = 'Bán kính không được để trống';
    } else {
      const radius = parseInt(formValues.radiusMeters, 10);
      if (isNaN(radius) || radius < ZONE_RADIUS_MIN || radius > ZONE_RADIUS_MAX) {
        newErrors.radiusMeters = `Bán kính phải là số trong khoảng ${ZONE_RADIUS_MIN} đến ${ZONE_RADIUS_MAX.toLocaleString('vi-VN')} mét`;
      }
    }

    if (isEditMode && !formValues.isActive && detail && detail.poiCount > 0) {
      newErrors.isActive = `Không thể ngừng hoạt động khu vực khi vẫn còn ${detail.poiCount} điểm thuyết minh. Vui lòng chuyển hoặc xóa các điểm trước.`;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstFieldId = Object.keys(newErrors)[0];
      if (firstFieldId) {
        document.getElementById(firstFieldId)?.focus();
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode && zoneId) {
        const payload: UpdateZoneInput = {
          name: formValues.name.trim(),
          description: formValues.description.trim() || undefined,
          centerLat: parseFloat(formValues.centerLat),
          centerLng: parseFloat(formValues.centerLng),
          radiusMeters: parseInt(formValues.radiusMeters, 10),
          isActive: formValues.isActive,
          version: detail?.version ?? 0,
        };
        await zoneApi.updateZone(zoneId, payload);
      } else {
        const payload: CreateZoneInput = {
          code: formValues.code.trim().toUpperCase(),
          name: formValues.name.trim(),
          description: formValues.description.trim() || undefined,
          centerLat: parseFloat(formValues.centerLat),
          centerLng: parseFloat(formValues.centerLng),
          radiusMeters: parseInt(formValues.radiusMeters, 10),
        };
        await zoneApi.createZone(payload);
      }
      navigate('/quan-tri/khu-vuc', { replace: true });
    } catch (err) {
      const norm = normalizeAdminError(err);
      if (norm.status === 409) {
        setShowConflictDialog(true);
      } else {
        const resolved = resolveSubmitError(norm);
        if (resolved.fieldErrors) {
          setErrors(resolved.fieldErrors);
          const firstFieldId = Object.keys(resolved.fieldErrors)[0];
          if (firstFieldId) {
            document.getElementById(firstFieldId)?.focus();
          }
        } else {
          setSubmitError(resolved.general || null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateBack = (targetPath: string) => {
    if (isDirty) {
      pendingNavigationRef.current = targetPath;
      setShowLeaveDialog(true);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div className="adm-page-head-main">
          <button
            type="button"
            className="adm-back-link"
            onClick={() => handleNavigateBack('/quan-tri/khu-vuc')}
          >
            <ChevronLeft size={16} strokeWidth={2} /> Quay lại danh sách khu vực
          </button>
          <h1 className="adm-page-title">
            {isEditMode ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}
          </h1>
          <p className="adm-page-desc">
            {isEditMode
              ? `Cập nhật tâm, bán kính và trạng thái hiển thị cho khu vực #${zoneId}.`
              : 'Khai báo tâm và bán kính để hệ thống xác định phạm vi kích hoạt thuyết minh.'}
          </p>
        </div>
      </div>

      {submitError && (
        <AdminAlert variant="danger" message={submitError} onClose={() => setSubmitError(null)} />
      )}

      {isEditMode && detail && (
        <div className="adm-form-hint adm-poi-count-hint">
          Khu vực này hiện có <strong>{detail.poiCount.toLocaleString('vi-VN')}</strong> điểm thuyết minh
          và <strong>{detail.routeCount.toLocaleString('vi-VN')}</strong> tuyến.
        </div>
      )}

      {loading ? (
        <div className="adm-form-skeleton">
          <div className="adm-skeleton-cell" style={{ height: '40px', marginBottom: '16px' }} />
          <div className="adm-skeleton-cell" style={{ height: '120px', marginBottom: '16px' }} />
          <div className="adm-skeleton-cell" style={{ height: '40px' }} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="adm-form-container" noValidate>
          <div className="adm-form-grid">
            <FormSection title="Thông tin khu vực">

              <div className="adm-form-row">
                <div className="adm-form-col">
                  <FormField
                    label="Mã khu vực (code)"
                    htmlFor="code"
                    required={!isEditMode}
                    error={errors.code}
                    helperText={
                      isEditMode
                        ? 'Không thể thay đổi mã sau khi tạo.'
                        : 'Tối đa 50 ký tự, không trùng với khu vực khác.'
                    }
                  >
                    <input
                      id="code"
                      name="code"
                      type="text"
                      className="adm-input"
                      value={formValues.code}
                      onChange={handleInputChange}
                      placeholder="D1_HISTORIC"
                      maxLength={50}
                      readOnly={isEditMode}
                      disabled={isEditMode}
                      aria-invalid={Boolean(errors.code)}
                    />
                  </FormField>
                </div>
                <div className="adm-form-col">
                  <FormField label="Tên khu vực" htmlFor="name" required error={errors.name}>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="adm-input"
                      value={formValues.name}
                      onChange={handleInputChange}
                      placeholder="Trung tâm Lịch sử Quận 1"
                      maxLength={200}
                      aria-invalid={Boolean(errors.name)}
                    />
                  </FormField>
                </div>
              </div>

              <FormField label="Mô tả" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  className="adm-textarea"
                  rows={3}
                  value={formValues.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả ngắn về khu vực"
                />
              </FormField>

              <div className="adm-form-row">
                <div className="adm-form-col">
                  <FormField
                    label="Vĩ độ tâm (latitude)"
                    htmlFor="centerLat"
                    required
                    error={errors.centerLat}
                    helperText="Số trong khoảng -90 đến 90."
                  >
                    <input
                      id="centerLat"
                      name="centerLat"
                      type="number"
                      step="any"
                      className="adm-input"
                      value={formValues.centerLat}
                      onChange={handleInputChange}
                      placeholder="10.7769000"
                      aria-invalid={Boolean(errors.centerLat)}
                    />
                  </FormField>
                </div>
                <div className="adm-form-col">
                  <FormField
                    label="Kinh độ tâm (longitude)"
                    htmlFor="centerLng"
                    required
                    error={errors.centerLng}
                    helperText="Số trong khoảng -180 đến 180."
                  >
                    <input
                      id="centerLng"
                      name="centerLng"
                      type="number"
                      step="any"
                      className="adm-input"
                      value={formValues.centerLng}
                      onChange={handleInputChange}
                      placeholder="106.7009000"
                      aria-invalid={Boolean(errors.centerLng)}
                    />
                  </FormField>
                </div>
              </div>

              <FormField
                label="Bán kính (mét)"
                htmlFor="radiusMeters"
                required
                error={errors.radiusMeters}
                helperText={`Từ ${ZONE_RADIUS_MIN} đến ${ZONE_RADIUS_MAX.toLocaleString('vi-VN')} mét.`}
              >
                <input
                  id="radiusMeters"
                  name="radiusMeters"
                  type="number"
                  min={ZONE_RADIUS_MIN}
                  max={ZONE_RADIUS_MAX}
                  className="adm-input"
                  value={formValues.radiusMeters}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(errors.radiusMeters)}
                />
              </FormField>
            </FormSection>

            {isEditMode && (
              <div className="adm-form-side">
                <FormSection title="Trạng thái hiển thị">
                  <div className="adm-checkbox-wrap">
                    <label htmlFor="isActive" className="adm-checkbox-label">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        className="adm-checkbox"
                        checked={formValues.isActive}
                        onChange={(e) => handleActiveChange(e.target.checked)}
                        aria-invalid={Boolean(errors.isActive)}
                      />
                      <span>Hoạt động (hiển thị cho du khách)</span>
                    </label>
                    {errors.isActive && (
                      <span className="adm-field-error" role="alert">
                        {errors.isActive}
                      </span>
                    )}
                    <p className="adm-field-helper" style={{ margin: '4px 0 0 24px' }}>
                      Khi ngừng hoạt động, khu vực sẽ bị ẩn khỏi website du khách.
                    </p>
                  </div>
                </FormSection>

                <div className="adm-form-actions">
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary"
                    onClick={() => handleNavigateBack('/quan-tri/khu-vuc')}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            )}

            {!isEditMode && (
              <div className="adm-form-actions adm-form-actions-full">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => handleNavigateBack('/quan-tri/khu-vuc')}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo mới...' : 'Tạo khu vực'}
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      <ConfirmDialog
        isOpen={showLeaveDialog}
        title="Rời khỏi trang khi chưa lưu?"
        message="Bạn có các chỉnh sửa chưa được lưu trên biểu mẫu này. Nếu tiếp tục rời đi, mọi thay đổi chưa lưu sẽ bị mất."
        confirmText="Rời khỏi trang"
        cancelText="Ở lại tiếp tục sửa"
        variant="danger"
        onConfirm={() => {
          setShowLeaveDialog(false);
          if (pendingNavigationRef.current) {
            navigate(pendingNavigationRef.current);
          }
        }}
        onCancel={() => {
          setShowLeaveDialog(false);
          pendingNavigationRef.current = null;
        }}
      />

      <ConfirmDialog
        isOpen={showConflictDialog}
        title="Dữ liệu đã thay đổi"
        message="Nội dung đã được người khác cập nhật. Vui lòng tải lại trang. Các chỉnh sửa chưa lưu của bạn sẽ bị thay thế khi tải lại."
        confirmText="Tải lại"
        cancelText="Tiếp tục chỉnh sửa"
        onConfirm={() => {
          setShowConflictDialog(false);
          reloadFromServer();
        }}
        onCancel={() => setShowConflictDialog(false)}
      />
    </div>
  );
};

export default ZoneFormPage;
