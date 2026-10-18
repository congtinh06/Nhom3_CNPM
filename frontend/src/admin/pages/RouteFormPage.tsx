import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { routeApi } from '../api/routeApi';
import { zoneApi } from '../api/zoneApi';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminApiError } from '../types';
import {
  AdminRouteDetail,
  AdminRouteStop,
  CreateRouteInput,
  RouteStatusValue,
  UpdateRouteInput,
} from '../types/route';
import { AdminPoiListItem } from '../types/poi';
import { AdminZoneListItem } from '../types/zone';
import { FormField } from '../components/FormField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';

interface FormValues {
  zoneId: string;
  name: string;
  description: string;
  displayOrder: string;
  status: RouteStatusValue;
}

const DEFAULT_VALUES: FormValues = {
  zoneId: '',
  name: '',
  description: '',
  displayOrder: '0',
  status: 'ACTIVE',
};

const FIELD_LABELS: Record<string, string> = {
  zoneId: 'Khu vực',
  name: 'Tên tuyến',
  displayOrder: 'Thứ tự hiển thị',
  status: 'Trạng thái',
};

const BACKEND_FIELD_MESSAGES: Record<string, string> = {
  'zoneId is required': 'Vui lòng chọn khu vực cho tuyến',
  'name is required': 'Tên tuyến không được để trống',
  'name must be at most 200 characters': 'Tên tuyến tối đa 200 ký tự',
  'displayOrder must be >= 0': 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0',
  'displayOrder must be positive or zero': 'Thứ tự hiển thị phải lớn hơn hoặc bằng 0',
};

function detailToFormValues(detail: AdminRouteDetail): FormValues {
  return {
    zoneId: detail.zoneId != null ? String(detail.zoneId) : '',
    name: detail.name || '',
    description: detail.description || '',
    displayOrder: String(detail.displayOrder ?? 0),
    status: (detail.status as RouteStatusValue) || 'ACTIVE',
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
    return { general: 'Tên tuyến đã tồn tại trong khu vực này. Vui lòng chọn tên khác.' };
  }
  if (/Không thể ngừng hoạt động/i.test(msg)) {
    return { general: msg };
  }
  if (norm.status === 404) {
    return { general: 'Không tìm thấy tuyến cần cập nhật.' };
  }
  if (norm.status === 403) {
    return { general: 'Bạn không có quyền thực hiện thao tác này.' };
  }
  return { general: msg || 'Đã xảy ra lỗi khi lưu dữ liệu.' };
}

export const RouteFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const routeId = id ? parseInt(id, 10) : null;

  const [initialValues, setInitialValues] = useState<FormValues>(DEFAULT_VALUES);
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<AdminRouteDetail | null>(null);
  const [zones, setZones] = useState<AdminZoneListItem[]>([]);

  const [stops, setStops] = useState<AdminRouteStop[]>([]);
  const [serverStops, setServerStops] = useState<AdminRouteStop[]>([]);
  const [zonePois, setZonePois] = useState<AdminPoiListItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerValue, setPickerValue] = useState('');
  const [stopsSaving, setStopsSaving] = useState(false);
  const [stopsError, setStopsError] = useState<string | null>(null);
  const [stopsNotice, setStopsNotice] = useState<string | null>(null);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  useEffect(() => {
    zoneApi
      .getAdminZones({ page: 0, size: 200 })
      .then((res) => setZones(res?.content || []))
      .catch(() => setZones([]));
  }, []);

  const loadDetail = useCallback(async () => {
    if (!isEditMode || !routeId) return;
    setLoading(true);
    setSubmitError(null);
    setStopsError(null);
    try {
      const loadedDetail = await routeApi.getAdminRouteDetail(routeId);
      const loaded = detailToFormValues(loadedDetail);
      setDetail(loadedDetail);
      setInitialValues(loaded);
      setFormValues(loaded);
      const loadedStops = loadedDetail.stops || [];
      setStops(loadedStops);
      setServerStops(loadedStops);

      setPickerLoading(true);
      try {
        const pois = await poiApi.getAdminPois({ zoneId: loadedDetail.zoneId, size: 200 });
        setZonePois(pois?.content || []);
      } catch {
        setZonePois([]);
      } finally {
        setPickerLoading(false);
      }
    } catch (err) {
      setSubmitError(normalizeAdminError(err).message);
    } finally {
      setLoading(false);
    }
  }, [isEditMode, routeId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const reloadFromServer = useCallback(async () => {
    await loadDetail();
  }, [loadDetail]);

  const stopIds = (list: AdminRouteStop[]) => list.map((s) => s.id);
  const formDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues);
  const stopsDirty = JSON.stringify(stopIds(stops)) !== JSON.stringify(stopIds(serverStops));
  const isDirty = formDirty || stopsDirty;

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode && !formValues.zoneId) {
      newErrors.zoneId = 'Vui lòng chọn khu vực cho tuyến';
    }

    if (!formValues.name.trim()) {
      newErrors.name = 'Tên tuyến không được để trống';
    } else if (formValues.name.trim().length > 200) {
      newErrors.name = 'Tên tuyến tối đa 200 ký tự';
    }

    if (formValues.displayOrder.trim() === '') {
      newErrors.displayOrder = 'Thứ tự hiển thị không được để trống';
    } else {
      const order = parseInt(formValues.displayOrder, 10);
      if (isNaN(order) || order < 0) {
        newErrors.displayOrder = 'Thứ tự hiển thị phải là số lớn hơn hoặc bằng 0';
      }
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

    if (isEditMode && formValues.status === 'INACTIVE' && stops.length > 0) {
      setSubmitError(
        `Không thể ngừng hoạt động tuyến khi vẫn còn ${stops.length} điểm dừng. Vui lòng gỡ hết điểm dừng trước.`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setNotice(null);

    try {
      if (isEditMode && routeId) {
        const payload: UpdateRouteInput = {
          name: formValues.name.trim(),
          description: formValues.description.trim() || undefined,
          displayOrder: parseInt(formValues.displayOrder, 10),
          status: formValues.status,
          version: detail?.version ?? 0,
        };
        const updated = await routeApi.updateRoute(routeId, payload);
        setDetail(updated);
        setInitialValues(detailToFormValues(updated));
        setFormValues(detailToFormValues(updated));
        setNotice('Đã lưu thông tin tuyến thành công.');
      } else {
        const payload: CreateRouteInput = {
          zoneId: parseInt(formValues.zoneId, 10),
          name: formValues.name.trim(),
          description: formValues.description.trim() || undefined,
          displayOrder: parseInt(formValues.displayOrder, 10),
        };
        const created = await routeApi.createRoute(payload);
        navigate(`/quan-tri/lo-trinh/${created.id}`, { replace: true });
      }
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

  const moveStop = (index: number, direction: -1 | 1) => {
    setStops((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const item = prev[index];
      if (!item) return prev;
      const next = [...prev];
      next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setStopsNotice(null);
    setStopsError(null);
  };

  const removeStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    setStopsNotice(null);
    setStopsError(null);
  };

  const handleAddStop = () => {
    if (!pickerValue) return;
    const poiId = parseInt(pickerValue, 10);
    const poi = zonePois.find((p) => p.id === poiId);
    if (!poi) return;
    if (stops.some((s) => s.id === poiId)) return;
    setStops((prev) => [...prev, { id: poi.id, code: poi.code, name: poi.name }]);
    setPickerValue('');
    setStopsNotice(null);
    setStopsError(null);
  };

  const handleSaveStops = async () => {
    if (!routeId || stopsSaving || !stopsDirty) return;
    setStopsSaving(true);
    setStopsError(null);
    setStopsNotice(null);
    try {
      const result = await routeApi.updateStops(routeId, {
        poiIds: stopIds(stops),
        version: detail?.version ?? 0,
      });
      const savedStops = result.stops || [];
      setStops(savedStops);
      setServerStops(savedStops);
      if (detail && result.version != null) {
        setDetail({ ...detail, version: result.version });
      }
      setStopsNotice('Đã lưu thứ tự điểm dừng.');
    } catch (err) {
      const norm = normalizeAdminError(err);
      if (norm.status === 409) {
        setShowConflictDialog(true);
      } else {
        setStopsError(norm.message);
        setStops(serverStops);
      }
    } finally {
      setStopsSaving(false);
    }
  };

  const availablePois = zonePois.filter((p) => !stops.some((s) => s.id === p.id));

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
        <div>
          <button
            type="button"
            className="adm-back-link"
            onClick={() => handleNavigateBack('/quan-tri/lo-trinh')}
          >
            <ChevronLeft /> Quay lại danh sách tuyến
          </button>
          <h1 className="adm-page-title">
            {isEditMode ? 'Chỉnh sửa tuyến tham quan' : 'Thêm tuyến tham quan mới'}
          </h1>
          <p className="adm-page-desc">
            {isEditMode
              ? `Cập nhật thông tin và thứ tự điểm dừng cho tuyến #${routeId}.`
              : 'Khai báo tuyến trong một khu vực, sau đó thêm các điểm dừng theo thứ tự tham quan.'}
          </p>
        </div>
      </div>

      {notice && (
        <AdminAlert variant="success" message={notice} onClose={() => setNotice(null)} />
      )}

      {submitError && (
        <AdminAlert variant="danger" message={submitError} onClose={() => setSubmitError(null)} />
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
            <FormSection title="Thông tin tuyến">

              <div className="adm-form-row">
                <div className="adm-form-col">
                  <FormField
                    label="Khu vực"
                    htmlFor="zoneId"
                    required={!isEditMode}
                    error={errors.zoneId}
                    helperText={isEditMode ? 'Không thể thay đổi khu vực sau khi tạo.' : undefined}
                  >
                    {isEditMode ? (
                      <input
                        id="zoneId"
                        type="text"
                        className="adm-input"
                        value={detail ? `${detail.zoneName} (${detail.zoneCode})` : ''}
                        readOnly
                        disabled
                      />
                    ) : (
                      <select
                        id="zoneId"
                        name="zoneId"
                        className="adm-select"
                        value={formValues.zoneId}
                        onChange={handleInputChange}
                        aria-invalid={Boolean(errors.zoneId)}
                      >
                        <option value="">-- Chọn khu vực --</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name} ({zone.code})
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>
                </div>
                <div className="adm-form-col">
                  <FormField label="Tên tuyến" htmlFor="name" required error={errors.name}>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="adm-input"
                      value={formValues.name}
                      onChange={handleInputChange}
                      placeholder="Tuyến di sản trung tâm"
                      maxLength={200}
                      aria-invalid={Boolean(errors.name)}
                    />
                  </FormField>
                </div>
              </div>

              <div className="adm-form-row">
                <div className="adm-form-col">
                  <FormField
                    label="Thứ tự hiển thị"
                    htmlFor="displayOrder"
                    error={errors.displayOrder}
                    helperText="Số càng nhỏ càng hiển thị trước."
                  >
                    <input
                      id="displayOrder"
                      name="displayOrder"
                      type="number"
                      min={0}
                      className="adm-input"
                      value={formValues.displayOrder}
                      onChange={handleInputChange}
                      aria-invalid={Boolean(errors.displayOrder)}
                    />
                  </FormField>
                </div>
                {isEditMode && (
                  <div className="adm-form-col">
                    <FormField label="Trạng thái" htmlFor="status">
                      <select
                        id="status"
                        name="status"
                        className="adm-select"
                        value={formValues.status}
                        onChange={handleInputChange}
                      >
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Tạm ngưng</option>
                      </select>
                    </FormField>
                  </div>
                )}
              </div>

              <FormField label="Mô tả" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  className="adm-textarea"
                  rows={3}
                  value={formValues.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả ngắn về tuyến tham quan"
                />
              </FormField>

              <div className="adm-form-actions adm-form-actions-full">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => handleNavigateBack('/quan-tri/lo-trinh')}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
                  {submitting
                    ? 'Đang lưu...'
                    : isEditMode
                    ? 'Lưu thông tin tuyến'
                    : 'Tạo tuyến'}
                </button>
              </div>
            </FormSection>

            {isEditMode && (
              <div className="adm-form-side">
                <div className="adm-card adm-form-section">
                  <div className="adm-card-head-row">
                    <h2 className="adm-card-title">Thứ tự điểm dừng</h2>
                    <span className="adm-badge adm-badge-neutral">{stops.length} điểm</span>
                  </div>

                  {stopsNotice && (
                    <AdminAlert
                      variant="success"
                      message={stopsNotice}
                      className="adm-alert-inline"
                    />
                  )}
                  {stopsError && (
                    <AdminAlert
                      variant="danger"
                      message={stopsError}
                      className="adm-alert-inline"
                    />
                  )}

                  {stops.length === 0 ? (
                    <div className="adm-stops-empty">
                      Tuyến chưa có điểm dừng nào. Hãy thêm điểm từ danh sách bên dưới.
                    </div>
                  ) : (
                    <ol className="adm-stops-list" aria-label="Danh sách điểm dừng theo thứ tự">
                      {stops.map((stop, index) => (
                        <li key={stop.id} className="adm-stop-item">
                          <span className="adm-stop-order" aria-hidden="true">
                            {index + 1}
                          </span>
                          <div className="adm-stop-info">
                            <span className="adm-stop-name">{stop.name}</span>
                            <span className="adm-stop-code">{stop.code}</span>
                          </div>
                          <div className="adm-stop-actions">
                            <button
                              type="button"
                              className="adm-btn adm-btn-ghost adm-btn-sm adm-stop-btn"
                              onClick={() => moveStop(index, -1)}
                              disabled={index === 0 || stopsSaving}
                              aria-label={`Di chuyển ${stop.name} lên trên`}
                            >
                              <ChevronUp />
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn-ghost adm-btn-sm adm-stop-btn"
                              onClick={() => moveStop(index, 1)}
                              disabled={index === stops.length - 1 || stopsSaving}
                              aria-label={`Di chuyển ${stop.name} xuống dưới`}
                            >
                              <ChevronDown />
                            </button>
                            <button
                              type="button"
                              className="adm-btn adm-btn-danger-ghost adm-btn-sm adm-stop-btn"
                              onClick={() => removeStop(index)}
                              disabled={stopsSaving}
                              aria-label={`Gỡ ${stop.name} khỏi tuyến`}
                            >
                              &times;
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  <div className="adm-stop-add">
                    <label className="adm-form-label" htmlFor="stopPicker">
                      Thêm điểm dừng
                    </label>
                    <div className="adm-stop-add-row">
                      <select
                        id="stopPicker"
                        className="adm-select"
                        value={pickerValue}
                        onChange={(e) => setPickerValue(e.target.value)}
                        disabled={pickerLoading || stopsSaving || availablePois.length === 0}
                      >
                        <option value="">
                          {pickerLoading
                            ? 'Đang tải điểm...'
                            : availablePois.length === 0
                            ? 'Không còn điểm khả dụng'
                            : '-- Chọn điểm thuyết minh --'}
                        </option>
                        {availablePois.map((poi) => (
                          <option key={poi.id} value={poi.id}>
                            {poi.name} ({poi.code})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={handleAddStop}
                        disabled={!pickerValue || stopsSaving}
                      >
                        + Thêm
                      </button>
                    </div>
                    <p className="adm-form-hint">
                      Chỉ hiển thị các điểm thuyết minh thuộc khu vực của tuyến và chưa có trong danh
                      sách.
                    </p>
                  </div>

                  <div className="adm-form-actions">
                    <button
                      type="button"
                      className="adm-btn adm-btn-primary"
                      onClick={handleSaveStops}
                      disabled={!stopsDirty || stopsSaving}
                    >
                      {stopsSaving ? 'Đang lưu thứ tự...' : 'Lưu thứ tự điểm dừng'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      <ConfirmDialog
        isOpen={showLeaveDialog}
        title="Rời khỏi trang khi chưa lưu?"
        message="Bạn có các chỉnh sửa chưa được lưu (thông tin tuyến hoặc thứ tự điểm dừng). Nếu tiếp tục rời đi, mọi thay đổi chưa lưu sẽ bị mất."
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

export default RouteFormPage;
