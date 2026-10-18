import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { poiApi } from '../api/poiApi';
import { normalizeAdminError } from '../api/adminClient';
import { AdminApiError } from '../types';
import {
  AdminPoiDetail,
  CreatePoiInput,
  UpdatePoiInput,
  PoiCategoryOption,
  PoiRouteOption,
  PoiZoneOption,
} from '../types/poi';
import { FormField } from '../components/FormField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PoiAudioStatusPanel } from '../components/PoiAudioStatusPanel';
import { PoiLanguageSummary } from '../components/PoiLanguageSummary';
import { PoiQrPanel } from '../components/PoiQrPanel';
import { PoiTranslationReadonly } from '../components/PoiTranslationReadonly';
import { StatusBadge } from '../components/StatusBadge';
import { FormSection } from '../components/FormSection';
import { AdminTabs } from '../components/AdminTabs';
import { AdminAlert } from '../components/AdminAlert';
import { resolveOverallStatus } from '../utils/poiStatus';

interface FormValues {
  zoneId: string;
  categoryId: string;
  code: string;
  qrToken: string;
  name: string;
  latitude: string;
  longitude: string;
  triggerRadiusMeters: string;
  address: string;
  thumbnailUrl: string;
  title: string;
  summary: string;
  description: string;
  historicalSignificance: string;
  routeId: string;
  stopOrder: string;
}

const DEFAULT_VALUES: FormValues = {
  zoneId: '',
  categoryId: '',
  code: '',
  qrToken: '',
  name: '',
  latitude: '',
  longitude: '',
  triggerRadiusMeters: '50',
  address: '',
  thumbnailUrl: '',
  title: '',
  summary: '',
  description: '',
  historicalSignificance: '',
  routeId: '',
  stopOrder: '',
};

const FIELD_LABELS: Record<string, string> = {
  zoneId: 'Khu vực',
  categoryId: 'Danh mục',
  code: 'Mã điểm',
  qrToken: 'Mã QR',
  name: 'Tên điểm',
  latitude: 'Vĩ độ',
  longitude: 'Kinh độ',
  triggerRadiusMeters: 'Bán kính kích hoạt',
  address: 'Địa chỉ',
  thumbnailUrl: 'Đường dẫn ảnh',
  routeId: 'Tuyến',
  stopOrder: 'Thứ tự điểm dừng',
  title: 'Tiêu đề',
  summary: 'Tóm tắt',
  description: 'Mô tả',
  historicalSignificance: 'Ý nghĩa lịch sử',
};

type TabId = 'info' | 'content' | 'publish';

const EDIT_TABS: { id: TabId; label: string }[] = [
  { id: 'info', label: 'Thông tin' },
  { id: 'content', label: 'Nội dung đa ngôn ngữ' },
  { id: 'publish', label: 'Phát hành & QR' },
];

const BACKEND_FIELD_MESSAGES: Record<string, string> = {
  'zoneId is required': 'Khu vực không được để trống',
  'categoryId is required': 'Danh mục không được để trống',
  'code is required': 'Mã điểm không được để trống',
  'qrToken is required': 'Mã QR không được để trống',
  'name is required': 'Tên điểm không được để trống',
  'name must be at most 255 characters': 'Tên điểm tối đa 255 ký tự',
  'latitude is required': 'Vĩ độ không được để trống',
  'latitude must be >= -90': 'Vĩ độ phải lớn hơn hoặc bằng -90',
  'latitude must be <= 90': 'Vĩ độ phải nhỏ hơn hoặc bằng 90',
  'longitude is required': 'Kinh độ không được để trống',
  'longitude must be >= -180': 'Kinh độ phải lớn hơn hoặc bằng -180',
  'longitude must be <= 180': 'Kinh độ phải nhỏ hơn hoặc bằng 180',
  'triggerRadiusMeters must be >= 1': 'Bán kính kích hoạt phải lớn hơn hoặc bằng 1',
  'address must be at most 500 characters': 'Địa chỉ tối đa 500 ký tự',
  'thumbnailUrl must be at most 500 characters': 'Đường dẫn ảnh tối đa 500 ký tự',
  'title is required': 'Tiêu đề không được để trống',
  'title must be at most 255 characters': 'Tiêu đề tối đa 255 ký tự',
  'summary is required': 'Tóm tắt không được để trống',
  'summary must be at most 1000 characters': 'Tóm tắt tối đa 1000 ký tự',
  'description is required': 'Mô tả không được để trống',
  'stopOrder must be > 0': 'Thứ tự điểm dừng phải lớn hơn 0',
};

function flattenCategories(categories: PoiCategoryOption[]): PoiCategoryOption[] {
  const result: PoiCategoryOption[] = [];
  categories.forEach((cat) => {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      cat.children.forEach((child) => result.push(child));
    }
  });
  return result;
}

function detailToFormValues(detail: AdminPoiDetail, categoryList: PoiCategoryOption[]): FormValues {
  const flat = flattenCategories(categoryList);
  const matched =
    flat.find((c) => c.id === detail.categoryId) ||
    flat.find((c) => c.code === detail.categoryCode);
  const vi = detail.translations?.['vi'];
  return {
    zoneId: detail.zoneId != null ? String(detail.zoneId) : '',
    categoryId:
      detail.categoryId != null
        ? String(detail.categoryId)
        : matched
        ? String(matched.id)
        : '',
    code: detail.code || '',
    qrToken: detail.qrToken || '',
    name: detail.name || '',
    latitude:
      detail.latitude !== undefined && detail.latitude !== null ? String(detail.latitude) : '',
    longitude:
      detail.longitude !== undefined && detail.longitude !== null ? String(detail.longitude) : '',
    triggerRadiusMeters: String(detail.triggerRadiusMeters ?? 50),
    address: detail.address || '',
    thumbnailUrl: detail.thumbnailUrl || '',
    title: vi?.title || '',
    summary: vi?.summary || '',
    description: vi?.description || '',
    historicalSignificance: vi?.historicalSignificance || '',
    routeId: detail.routeId ? String(detail.routeId) : '',
    stopOrder: detail.stopOrder ? String(detail.stopOrder) : '',
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

  if (norm.status === 409) {
    return { general: 'Dữ liệu bị trùng hoặc tham chiếu không hợp lệ. Vui lòng kiểm tra lại.' };
  }

  if (norm.status === 404) {
    return { general: 'Không tìm thấy khu vực, danh mục hoặc tuyến tương ứng.' };
  }

  if (norm.status === 400) {
    const msg = norm.message || '';
    if (/already exists/i.test(msg)) {
      return { general: 'Mã điểm hoặc mã QR đã tồn tại trên hệ thống.' };
    }
    if (/does not belong to zone/i.test(msg)) {
      return { general: 'Tuyến đã chọn không thuộc khu vực này.' };
    }
    if (/provided together/i.test(msg)) {
      return { general: 'Tuyến và thứ tự điểm dừng phải được nhập cùng nhau.' };
    }
    if (/already used in route/i.test(msg)) {
      return { general: 'Thứ tự điểm dừng đã được dùng trong tuyến này.' };
    }
    return { general: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.' };
  }

  return { general: norm.message || 'Đã xảy ra lỗi khi lưu dữ liệu.' };
}

export const PoiFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const poiId = id ? parseInt(id, 10) : null;

  const [initialValues, setInitialValues] = useState<FormValues>(DEFAULT_VALUES);
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState<AdminPoiDetail | null>(null);
  const [detailReloading, setDetailReloading] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);

  const [zones, setZones] = useState<PoiZoneOption[]>([]);
  const [categories, setCategories] = useState<PoiCategoryOption[]>([]);
  const [routes, setRoutes] = useState<PoiRouteOption[]>([]);
  const [zoneCodeDisplay, setZoneCodeDisplay] = useState('');

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const pendingNavigationRef = useRef<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const [zoneList, categoryList] = await Promise.all([
        poiApi.getZones(),
        poiApi.getCategories(),
      ]);
      setZones(zoneList || []);
      setCategories(categoryList || []);

      if (isEditMode && poiId) {
        const loadedDetail = await poiApi.getAdminPoiDetail(poiId);
        const loaded = detailToFormValues(loadedDetail, categoryList || []);

        setDetail(loadedDetail);
        setZoneCodeDisplay(loadedDetail.zoneCode || '');
        setInitialValues(loaded);
        setFormValues(loaded);

        try {
          const routeList = await poiApi.getRoutes(loadedDetail.zoneId);
          setRoutes(routeList || []);
        } catch {
          setRoutes([]);
        }
      } else {
        try {
          const routeList = await poiApi.getRoutes();
          setRoutes(routeList || []);
        } catch {
          setRoutes([]);
        }
      }
    } catch (err) {
      const norm = normalizeAdminError(err);
      setSubmitError(norm.message);
    } finally {
      setLoading(false);
    }
  }, [isEditMode, poiId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshDetail = useCallback(async () => {
    if (!isEditMode || !poiId) return;
    setDetailReloading(true);
    try {
      const fresh = await poiApi.getAdminPoiDetail(poiId);
      setDetail(fresh);
    } catch (err) {
      setSubmitError(normalizeAdminError(err).message);
    } finally {
      setDetailReloading(false);
    }
  }, [isEditMode, poiId]);

  const reloadFromServer = useCallback(async () => {
    if (!isEditMode || !poiId) return;
    setConflictOpen(false);
    try {
      const fresh = await poiApi.getAdminPoiDetail(poiId);
      const loaded = detailToFormValues(fresh, categories);
      setDetail(fresh);
      setZoneCodeDisplay(fresh.zoneCode || '');
      setInitialValues(loaded);
      setFormValues(loaded);
      setErrors({});
      setSubmitError(null);
    } catch (err) {
      setSubmitError(normalizeAdminError(err).message);
    }
  }, [isEditMode, poiId, categories]);

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode) {
      if (!formValues.zoneId) newErrors.zoneId = 'Khu vực không được để trống';
      if (!formValues.code.trim()) {
        newErrors.code = 'Mã điểm không được để trống';
      } else if (formValues.code.trim().length > 50) {
        newErrors.code = 'Mã điểm tối đa 50 ký tự';
      }
      if (!formValues.qrToken.trim()) {
        newErrors.qrToken = 'Mã QR không được để trống';
      } else if (formValues.qrToken.trim().length > 100) {
        newErrors.qrToken = 'Mã QR tối đa 100 ký tự';
      }
    }

    const hasRoute = Boolean(formValues.routeId);
    const hasStop = Boolean(formValues.stopOrder.trim());
    if (hasRoute !== hasStop) {
      if (!hasRoute) newErrors.routeId = 'Vui lòng chọn tuyến cho thứ tự điểm dừng';
      if (!hasStop) newErrors.stopOrder = 'Vui lòng nhập thứ tự điểm dừng cho tuyến';
    }

    if (!formValues.categoryId) {
      newErrors.categoryId = 'Danh mục không được để trống';
    }

    if (!formValues.name.trim()) {
      newErrors.name = 'Tên điểm không được để trống';
    } else if (formValues.name.trim().length > 255) {
      newErrors.name = 'Tên điểm tối đa 255 ký tự';
    }

    const lat = parseFloat(formValues.latitude);
    if (!formValues.latitude.trim()) {
      newErrors.latitude = 'Vĩ độ không được để trống';
    } else if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Vĩ độ phải là số trong khoảng -90 đến 90';
    }

    const lng = parseFloat(formValues.longitude);
    if (!formValues.longitude.trim()) {
      newErrors.longitude = 'Kinh độ không được để trống';
    } else if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = 'Kinh độ phải là số trong khoảng -180 đến 180';
    }

    if (formValues.triggerRadiusMeters.trim()) {
      const radius = parseInt(formValues.triggerRadiusMeters, 10);
      if (isNaN(radius) || radius < 1) {
        newErrors.triggerRadiusMeters = 'Bán kính kích hoạt phải là số lớn hơn hoặc bằng 1';
      }
    }

    if (formValues.address.length > 500) {
      newErrors.address = 'Địa chỉ tối đa 500 ký tự';
    }

    if (formValues.thumbnailUrl.length > 500) {
      newErrors.thumbnailUrl = 'Đường dẫn ảnh tối đa 500 ký tự';
    }

    if (!formValues.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    } else if (formValues.title.trim().length > 255) {
      newErrors.title = 'Tiêu đề tối đa 255 ký tự';
    }

    if (!formValues.summary.trim()) {
      newErrors.summary = 'Tóm tắt không được để trống';
    } else if (formValues.summary.trim().length > 1000) {
      newErrors.summary = 'Tóm tắt tối đa 1000 ký tự';
    }

    if (!formValues.description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    }

    if (formValues.stopOrder.trim()) {
      const stop = parseInt(formValues.stopOrder, 10);
      if (isNaN(stop) || stop < 1) {
        newErrors.stopOrder = 'Thứ tự điểm dừng phải là số lớn hơn 0';
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

    setSubmitting(true);
    setSubmitError(null);

    const base = {
      categoryId: Number(formValues.categoryId),
      name: formValues.name.trim(),
      latitude: parseFloat(formValues.latitude),
      longitude: parseFloat(formValues.longitude),
      triggerRadiusMeters: formValues.triggerRadiusMeters.trim()
        ? parseInt(formValues.triggerRadiusMeters, 10)
        : undefined,
      address: formValues.address.trim() || undefined,
      thumbnailUrl: formValues.thumbnailUrl.trim() || undefined,
      routeId: formValues.routeId ? Number(formValues.routeId) : undefined,
      stopOrder: formValues.stopOrder.trim()
        ? parseInt(formValues.stopOrder, 10)
        : undefined,
      title: formValues.title.trim(),
      summary: formValues.summary.trim(),
      description: formValues.description.trim(),
      historicalSignificance: formValues.historicalSignificance.trim() || undefined,
    };

    try {
      if (isEditMode && poiId) {
        const payload: UpdatePoiInput = {
          ...base,
          version: detail?.version ?? 0,
        };
        await poiApi.updatePoi(poiId, payload);
      } else {
        const payload: CreatePoiInput = {
          ...base,
          zoneId: Number(formValues.zoneId),
          code: formValues.code.trim(),
          qrToken: formValues.qrToken.trim(),
        };
        await poiApi.createPoi(payload);
      }
      navigate('/quan-tri/diem-thuyet-minh', { replace: true });
    } catch (err) {
      const norm = normalizeAdminError(err);
      if (norm.status === 409 && isEditMode) {
        setConflictOpen(true);
        return;
      }
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

  const categoryOptions = flattenCategories(categories);
  const routeOptions = routes.filter((route) => String(route.zoneId) === formValues.zoneId);

  const overallConfig = resolveOverallStatus(detail?.overallStatus);
  const attentionReasons = detail?.attentionReasons ?? [];

  const renderBasicFields = () => (
    <>
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
                className="adm-input"
                value={zoneCodeDisplay || formValues.zoneId}
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
                  <option key={zone.id} value={String(zone.id)}>
                    {zone.name}
                  </option>
                ))}
              </select>
            )}
          </FormField>
        </div>

        <div className="adm-form-col">
          <FormField label="Danh mục" htmlFor="categoryId" required error={errors.categoryId}>
            <select
              id="categoryId"
              name="categoryId"
              className="adm-select"
              value={formValues.categoryId}
              onChange={handleInputChange}
              aria-invalid={Boolean(errors.categoryId)}
            >
              <option value="">-- Chọn danh mục --</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.nameVi}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <FormField
        label="Tên điểm"
        htmlFor="name"
        required
        error={errors.name}
        helperText="Tối đa 255 ký tự. Ví dụ: Chợ Bến Thành"
      >
        <input
          id="name"
          name="name"
          type="text"
          className="adm-input"
          value={formValues.name}
          onChange={handleInputChange}
          placeholder="Nhập tên điểm đến"
          maxLength={255}
          aria-invalid={Boolean(errors.name)}
        />
      </FormField>

      {!isEditMode && (
        <div className="adm-form-row">
          <div className="adm-form-col">
            <FormField
              label="Mã điểm"
              htmlFor="code"
              required
              error={errors.code}
              helperText="Tối đa 50 ký tự, không trùng với điểm khác."
            >
              <input
                id="code"
                name="code"
                type="text"
                className="adm-input"
                value={formValues.code}
                onChange={handleInputChange}
                placeholder="BEN_THANH"
                maxLength={50}
                aria-invalid={Boolean(errors.code)}
              />
            </FormField>
          </div>
          <div className="adm-form-col">
            <FormField
              label="Mã QR"
              htmlFor="qrToken"
              required
              error={errors.qrToken}
              helperText="Tối đa 100 ký tự, dùng để sinh mã QR."
            >
              <input
                id="qrToken"
                name="qrToken"
                type="text"
                className="adm-input"
                value={formValues.qrToken}
                onChange={handleInputChange}
                placeholder="qr-ben-thanh-01"
                maxLength={100}
                aria-invalid={Boolean(errors.qrToken)}
              />
            </FormField>
          </div>
        </div>
      )}

      <div className="adm-form-row">
        <div className="adm-form-col">
          <FormField
            label="Vĩ độ"
            htmlFor="latitude"
            required
            error={errors.latitude}
            helperText="Số trong khoảng -90 đến 90."
          >
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              className="adm-input"
              value={formValues.latitude}
              onChange={handleInputChange}
              placeholder="10.7725"
              aria-invalid={Boolean(errors.latitude)}
            />
          </FormField>
        </div>
        <div className="adm-form-col">
          <FormField
            label="Kinh độ"
            htmlFor="longitude"
            required
            error={errors.longitude}
            helperText="Số trong khoảng -180 đến 180."
          >
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              className="adm-input"
              value={formValues.longitude}
              onChange={handleInputChange}
              placeholder="106.6980"
              aria-invalid={Boolean(errors.longitude)}
            />
          </FormField>
        </div>
      </div>

      <div className="adm-form-row">
        <div className="adm-form-col">
          <FormField
            label="Bán kính kích hoạt (mét)"
            htmlFor="triggerRadiusMeters"
            error={errors.triggerRadiusMeters}
            helperText="Mặc định 50 mét."
          >
            <input
              id="triggerRadiusMeters"
              name="triggerRadiusMeters"
              type="number"
              min={1}
              className="adm-input"
              value={formValues.triggerRadiusMeters}
              onChange={handleInputChange}
              aria-invalid={Boolean(errors.triggerRadiusMeters)}
            />
          </FormField>
        </div>
        <div className="adm-form-col">
          <FormField
            label="Địa chỉ"
            htmlFor="address"
            error={errors.address}
            helperText="Tối đa 500 ký tự."
          >
            <input
              id="address"
              name="address"
              type="text"
              className="adm-input"
              value={formValues.address}
              onChange={handleInputChange}
              placeholder="Lê Lợi, Quận 1, TP.HCM"
              maxLength={500}
              aria-invalid={Boolean(errors.address)}
            />
          </FormField>
        </div>
      </div>

      <FormField
        label="Ảnh đại diện"
        htmlFor="thumbnailUrl"
        error={errors.thumbnailUrl}
        helperText="Tối đa 500 ký tự. Ví dụ: /img/pois/ben-thanh.jpg"
      >
        <input
          id="thumbnailUrl"
          name="thumbnailUrl"
          type="text"
          className="adm-input"
          value={formValues.thumbnailUrl}
          onChange={handleInputChange}
          placeholder="/img/pois/ben-thanh.jpg"
          maxLength={500}
          aria-invalid={Boolean(errors.thumbnailUrl)}
        />
      </FormField>

      <div className="adm-form-row">
        <div className="adm-form-col">
          <FormField
            label="Tuyến (không bắt buộc)"
            htmlFor="routeId"
            error={errors.routeId}
            helperText="Chọn khu vực trước để hiển thị tuyến tương ứng."
          >
            <select
              id="routeId"
              name="routeId"
              className="adm-select"
              value={formValues.routeId}
              onChange={handleInputChange}
              disabled={!formValues.zoneId}
              aria-invalid={Boolean(errors.routeId)}
            >
              <option value="">-- Không gán tuyến --</option>
              {routeOptions.map((route) => (
                <option key={route.id} value={String(route.id)}>
                  {route.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="adm-form-col">
          <FormField
            label="Thứ tự điểm dừng"
            htmlFor="stopOrder"
            error={errors.stopOrder}
            helperText="Chỉ nhập khi đã chọn tuyến."
          >
            <input
              id="stopOrder"
              name="stopOrder"
              type="number"
              min={1}
              className="adm-input"
              value={formValues.stopOrder}
              onChange={handleInputChange}
              aria-invalid={Boolean(errors.stopOrder)}
            />
          </FormField>
        </div>
      </div>
    </>
  );

  const renderContentFields = () => (
    <>
      <p className="adm-form-hint">
        Đây là nội dung gốc. Hệ thống sẽ tự động dịch và tạo audio cho các ngôn ngữ khác sau khi lưu.
      </p>

      <FormField
        label="Tiêu đề"
        htmlFor="title"
        required
        error={errors.title}
        helperText="Tối đa 255 ký tự."
      >
        <input
          id="title"
          name="title"
          type="text"
          className="adm-input"
          value={formValues.title}
          onChange={handleInputChange}
          placeholder="Chợ Bến Thành"
          maxLength={255}
          aria-invalid={Boolean(errors.title)}
        />
      </FormField>

      <FormField
        label="Tóm tắt"
        htmlFor="summary"
        required
        error={errors.summary}
        helperText="Tối đa 1000 ký tự."
      >
        <textarea
          id="summary"
          name="summary"
          className="adm-textarea"
          rows={3}
          value={formValues.summary}
          onChange={handleInputChange}
          placeholder="Tóm tắt ngắn gọn về điểm đến"
          maxLength={1000}
          aria-invalid={Boolean(errors.summary)}
        />
      </FormField>

      <FormField
        label="Mô tả chi tiết"
        htmlFor="description"
        required
        error={errors.description}
      >
        <textarea
          id="description"
          name="description"
          className="adm-textarea"
          rows={6}
          value={formValues.description}
          onChange={handleInputChange}
          placeholder="Nội dung thuyết minh đầy đủ"
          aria-invalid={Boolean(errors.description)}
        />
      </FormField>

      <FormField
        label="Ý nghĩa lịch sử (không bắt buộc)"
        htmlFor="historicalSignificance"
        error={errors.historicalSignificance}
      >
        <textarea
          id="historicalSignificance"
          name="historicalSignificance"
          className="adm-textarea"
          rows={3}
          value={formValues.historicalSignificance}
          onChange={handleInputChange}
          placeholder="Giá trị văn hóa, lịch sử của điểm đến"
          aria-invalid={Boolean(errors.historicalSignificance)}
        />
      </FormField>
    </>
  );

  const renderActions = () => (
    <div className="adm-form-actions">
      <button
        type="button"
        className="adm-btn adm-btn-secondary"
        onClick={() => handleNavigateBack('/quan-tri/diem-thuyet-minh')}
        disabled={submitting}
      >
        Hủy bỏ
      </button>
      <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
        {submitting
          ? isEditMode
            ? 'Đang lưu...'
            : 'Đang tạo mới...'
          : isEditMode
          ? 'Lưu thay đổi'
          : 'Tạo điểm thuyết minh'}
      </button>
    </div>
  );

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <button
            type="button"
            className="adm-back-link"
            onClick={() => handleNavigateBack('/quan-tri/diem-thuyet-minh')}
          >
            <ChevronLeft /> Quay lại danh sách điểm thuyết minh
          </button>
          <h1 className="adm-page-title">
            {isEditMode ? 'Chỉnh sửa điểm thuyết minh' : 'Thêm điểm thuyết minh mới'}
          </h1>
          <p className="adm-page-desc">
            {isEditMode
              ? `Cập nhật tọa độ, thông tin và nội dung thuyết minh tiếng Việt cho điểm #${poiId}.`
              : 'Điền thông tin điểm đến để du khách có thể quét mã và nghe thuyết minh.'}
          </p>
          {isEditMode && detail && (
            <>
              <div className="adm-poi-status-row">
                <StatusBadge
                  variant={overallConfig.variant}
                  title={attentionReasons.length > 0 ? attentionReasons.join('\n') : undefined}
                >
                  {overallConfig.label}
                </StatusBadge>
                <PoiLanguageSummary
                  languages={detail.languages}
                  summary={detail.languageSummary}
                  poiName={detail.name}
                />
              </div>
              {attentionReasons.length > 0 && (
                <p className="adm-poi-status-reasons">{attentionReasons.join(', ')}</p>
              )}
            </>
          )}
        </div>
      </div>

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
          {isEditMode ? (
            <>
              <AdminTabs
                tabs={EDIT_TABS}
                active={activeTab}
                onChange={(tabId) => setActiveTab(tabId as TabId)}
              />
              <div className="adm-tab-panels">
                <section
                  className="adm-tab-panel"
                  role="tabpanel"
                  id="tabpanel-info"
                  aria-labelledby="tab-info"
                  hidden={activeTab !== 'info'}
                >
                  <FormSection title="Thông tin cơ bản">{renderBasicFields()}</FormSection>
                </section>

                <section
                  className="adm-tab-panel"
                  role="tabpanel"
                  id="tabpanel-content"
                  aria-labelledby="tab-content"
                  hidden={activeTab !== 'content'}
                >
                  <FormSection title="Nội dung thuyết minh tiếng Việt">
                    {renderContentFields()}
                  </FormSection>
                  <PoiTranslationReadonly translations={detail?.translations} />
                </section>

                <section
                  className="adm-tab-panel"
                  role="tabpanel"
                  id="tabpanel-publish"
                  aria-labelledby="tab-publish"
                  hidden={activeTab !== 'publish'}
                >
                  {poiId && detail && (
                    <>
                      <PoiAudioStatusPanel
                        poiId={poiId}
                        publishStatus={detail.publishStatus}
                        publishAttempts={detail.publishAttempts}
                        lastPublishAttemptAt={detail.lastPublishAttemptAt}
                        translations={detail.translations}
                        onReload={refreshDetail}
                        reloading={detailReloading}
                      />
                      <PoiQrPanel qrToken={detail.qrToken} poiName={detail.name} />
                    </>
                  )}
                </section>
              </div>
              {renderActions()}
            </>
          ) : (
            <div className="adm-form-grid">
              <FormSection title="Thông tin cơ bản">{renderBasicFields()}</FormSection>

              <div className="adm-form-side">
                <FormSection title="Nội dung thuyết minh tiếng Việt">
                  {renderContentFields()}
                </FormSection>
                {renderActions()}
              </div>
            </div>
          )}
        </form>
      )}

      <ConfirmDialog
        isOpen={conflictOpen}
        title="Nội dung đã được người khác cập nhật"
        message="Nội dung đã được người khác cập nhật. Vui lòng tải lại trang. Các chỉnh sửa chưa lưu của bạn sẽ bị thay thế khi tải lại."
        confirmText="Tải lại"
        cancelText="Tiếp tục chỉnh sửa"
        variant="primary"
        onConfirm={reloadFromServer}
        onCancel={() => setConflictOpen(false)}
      />

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
    </div>
  );
};
