import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { normalizeAdminError } from '../api/adminClient';
import { ProductCategory, CreateProductInput, UpdateProductInput } from '../types/product';
import { FormField } from '../components/FormField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';
import { api } from '../../api/client';
import { SOUVENIR_SPOTS } from '../../content/souvenirSpots';

interface FormValues {
  name: string;
  slug: string;
  category: ProductCategory;
  price: string; // Keep as string for friendly typing
  shortDescription: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  imagePath: string;
  poiId: string;
}

const DEFAULT_VALUES: FormValues = {
  name: '',
  slug: '',
  category: 'SOUVENIR',
  price: '',
  shortDescription: '',
  description: '',
  sortOrder: '0',
  isActive: true,
  imagePath: '',
  poiId: '',
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const productId = id ? parseInt(id, 10) : null;

  const [initialValues, setInitialValues] = useState<FormValues>(DEFAULT_VALUES);
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Image Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);

  // Leave Confirmation Dialog state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load product data in edit mode
  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const product = await productApi.getProductById(productId);
      const loaded: FormValues = {
        name: product.name || '',
        slug: product.slug || '',
        category: product.category || 'SOUVENIR',
        price: String(product.price ?? ''),
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        sortOrder: String(product.sortOrder ?? 0),
        isActive: product.isActive ?? true,
        imagePath: product.imagePath || '',
        poiId: product.poiId != null ? String(product.poiId) : '',
      };
      setInitialValues(loaded);
      setFormValues(loaded);
      if (product.imagePath && !selectedFile) {
        setImagePreview(product.imagePath);
      }
    } catch (err) {
      const norm = normalizeAdminError(err);
      setSubmitError(norm.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [isEditMode, fetchProduct]);

  // Điểm du lịch gắn với quà lưu niệm: chỉ hiển thị 7 điểm trong danh mục.
  const [spotOptions, setSpotOptions] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return;
    if (typeof api.getPois !== 'function') return;
    let cancelled = false;
    const knownSlugs = new Set(SOUVENIR_SPOTS.map((spot) => spot.slug));
    api
      .getPois()
      .then((pois) => {
        if (cancelled) return;
        setSpotOptions(
          pois
            .filter((poi) => poi.slug && knownSlugs.has(poi.slug))
            .map((poi) => ({ id: poi.id, label: poi.name }))
        );
      })
      .catch(() => {
        // Không tải được danh sách điểm thì để trống, người dùng vẫn có thể nhập sau.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Check dirty state
  const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues) || Boolean(selectedFile);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field-specific error when user edits
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

    if (!formValues.name.trim()) {
      newErrors.name = 'Tên sản phẩm không được để trống';
    } else if (formValues.name.length > 255) {
      newErrors.name = 'Tên sản phẩm tối đa 255 ký tự';
    }

    const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (formValues.slug.trim()) {
      if (formValues.slug.length > 150) {
        newErrors.slug = 'Slug tối đa 150 ký tự';
      } else if (!SLUG_REGEX.test(formValues.slug.trim())) {
        newErrors.slug = 'Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang';
      }
    }

    if (!formValues.category) {
      newErrors.category = 'Danh mục sản phẩm không được để trống';
    }

    const priceNum = parseFloat(formValues.price);
    if (!formValues.price.trim()) {
      newErrors.price = 'Giá sản phẩm không được để trống';
    } else if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Giá sản phẩm không được âm và phải là số hợp lệ';
    }

    if (formValues.shortDescription && formValues.shortDescription.length > 500) {
      newErrors.shortDescription = 'Mô tả ngắn tối đa 500 ký tự';
    }

    const sortNum = parseInt(formValues.sortOrder, 10);
    if (formValues.sortOrder.trim() && (isNaN(sortNum) || sortNum < 0)) {
      newErrors.sortOrder = 'Thứ tự hiển thị phải là số không âm';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstFieldId = Object.keys(newErrors)[0];
      if (firstFieldId) {
        const el = document.getElementById(firstFieldId);
        el?.focus();
      }
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    setImageNotice(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Định dạng ảnh không hỗ trợ, vui lòng chọn file .jpg, .jpeg, .png hoặc .webp');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError('Dung lượng tệp ảnh vượt quá giới hạn cho phép (tối đa 2MB)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (typeof window !== 'undefined' && typeof window.URL?.createObjectURL === 'function') {
      const objectUrl = window.URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(file.name);
    }
  };

  // Immediate upload for Edit mode or after create-with-image failure
  const handleUploadImageNow = async () => {
    const targetId = productId || createdProductId;
    if (!targetId || !selectedFile) return;

    setUploadingImage(true);
    setImageError(null);
    setImageNotice(null);
    try {
      const updated = await productApi.uploadProductImage(targetId, selectedFile);
      setFormValues((prev) => ({
        ...prev,
        imagePath: updated.imagePath || prev.imagePath,
      }));
      setInitialValues((prev) => ({
        ...prev,
        imagePath: updated.imagePath || prev.imagePath,
      }));
      setImagePreview(updated.imagePath || imagePreview);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImageNotice('Đã tải và cập nhật ảnh sản phẩm thành công.');
    } catch (err) {
      const norm = normalizeAdminError(err);
      setImageError(norm.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const price = parseFloat(formValues.price);
    const sortOrder = parseInt(formValues.sortOrder || '0', 10);
    const effectiveProductId = productId || createdProductId;

    try {
      if (effectiveProductId) {
        const updatePayload: UpdateProductInput = {
          name: formValues.name.trim(),
          slug: formValues.slug.trim() || undefined,
          category: formValues.category,
          price,
          shortDescription: formValues.shortDescription.trim() || undefined,
          description: formValues.description.trim() || undefined,
          sortOrder,
          isActive: formValues.isActive,
          imagePath: formValues.imagePath.trim() || undefined,
          poiId: formValues.poiId ? Number(formValues.poiId) : undefined,
        };

        const updated = await productApi.updateProduct(effectiveProductId, updatePayload);

        // If user also picked a new file in edit mode, upload it
        if (selectedFile) {
          try {
            await productApi.uploadProductImage(updated.id, selectedFile);
          } catch (imgErr) {
            // Upload failure shouldn't crash successful data update
            const norm = normalizeAdminError(imgErr);
            setImageError(`Cập nhật thông tin thành công nhưng tải ảnh thất bại: ${norm.message}`);
            setSubmitting(false);
            return;
          }
        }

        navigate('/quan-tri/san-pham', { replace: true });
      } else {
        const createPayload: CreateProductInput = {
          name: formValues.name.trim(),
          slug: formValues.slug.trim() || undefined,
          category: formValues.category,
          price,
          shortDescription: formValues.shortDescription.trim() || undefined,
          description: formValues.description.trim() || undefined,
          sortOrder,
          isActive: formValues.isActive,
          imagePath: formValues.imagePath.trim() || undefined,
          poiId: formValues.poiId ? Number(formValues.poiId) : undefined,
        };

        const created = await productApi.createProduct(createPayload);

        // If user selected an image file for create, upload it now
        if (selectedFile) {
          try {
            await productApi.uploadProductImage(created.id, selectedFile);
            navigate('/quan-tri/san-pham', { replace: true });
          } catch (imgErr) {
            const norm = normalizeAdminError(imgErr);
            setCreatedProductId(created.id);
            setImageError(`Sản phẩm đã được tạo thành công nhưng tải ảnh thất bại: ${norm.message}. Bạn có thể thử tải lại ảnh ngay bên dưới.`);
            setSubmitting(false);
            navigate(`/quan-tri/san-pham/${created.id}`, { replace: true });
            return;
          }
        } else {
          navigate('/quan-tri/san-pham', { replace: true });
        }
      }
    } catch (err) {
      const norm = normalizeAdminError(err);
      if (norm.details && Object.keys(norm.details).length > 0) {
        setErrors(norm.details);
        const firstFieldId = Object.keys(norm.details)[0];
        if (firstFieldId) {
          document.getElementById(firstFieldId)?.focus();
        }
      } else {
        setSubmitError(norm.message);
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
        <div>
          <button
            type="button"
            className="adm-back-link"
            onClick={() => handleNavigateBack('/quan-tri/san-pham')}
          >
            <ChevronLeft /> Quay lại danh sách sản phẩm
          </button>
          <h1 className="adm-page-title">
            {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h1>
          <p className="adm-page-desc">
            {isEditMode
              ? `Cập nhật thông tin chi tiết, hình ảnh và hiển thị cho sản phẩm #${productId}.`
              : 'Điền thông tin quà lưu niệm để đăng bán trên website du khách.'}
          </p>
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
          <div className="adm-form-grid">
            {/* Cột trái: Thông tin chính */}
            <FormSection title="Thông tin cơ bản">
              <FormField
                label="Tên sản phẩm"
                htmlFor="name"
                required
                error={errors.name}
                helperText="Tối đa 255 ký tự. Ví dụ: Nam châm lưu niệm Chợ Bến Thành"
              >
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="adm-input"
                  value={formValues.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên quà lưu niệm"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : 'name-helper'}
                  maxLength={255}
                />
              </FormField>

              <div className="adm-form-row">
                <div className="adm-form-col">
                  <FormField
                    label="Danh mục sản phẩm"
                    htmlFor="category"
                    required
                    error={errors.category}
                  >
                    <select
                      id="category"
                      name="category"
                      className="adm-select"
                      value={formValues.category}
                      onChange={handleInputChange}
                      required
                      aria-invalid={Boolean(errors.category)}
                      aria-describedby={errors.category ? 'category-error' : undefined}
                    >
                      <option value="SOUVENIR">Quà lưu niệm (SOUVENIR)</option>
                    </select>
                  </FormField>
                </div>

                <div className="adm-form-col">
                  <FormField
                    label="Giá bán (VNĐ)"
                    htmlFor="price"
                    required
                    error={errors.price}
                    helperText="Số tiền không âm, ví dụ: 55000"
                  >
                    <input
                      id="price"
                      name="price"
                      type="number"
                      className="adm-input"
                      value={formValues.price}
                      onChange={handleInputChange}
                      placeholder="0"
                      min={0}
                      required
                      aria-invalid={Boolean(errors.price)}
                      aria-describedby={errors.price ? 'price-error' : 'price-helper'}
                    />
                  </FormField>
                </div>
              </div>

              <FormField
                label="Điểm du lịch (quà lưu niệm)"
                htmlFor="poiId"
                helperText="Gắn sản phẩm với một trong bảy điểm du lịch. Để trống nếu không phải quà lưu niệm."
              >
                <select
                  id="poiId"
                  name="poiId"
                  className="adm-select"
                  value={formValues.poiId}
                  onChange={handleInputChange}
                >
                  <option value="">Không gắn điểm</option>
                  {spotOptions.map((spot) => (
                    <option key={spot.id} value={String(spot.id)}>
                      {spot.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Đường dẫn định danh (Slug)"
                htmlFor="slug"
                error={errors.slug}
                helperText="Để trống để tự động sinh từ tên sản phẩm. Ví dụ: nam-cham-cho-ben-thanh"
              >
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  className="adm-input"
                  value={formValues.slug}
                  onChange={handleInputChange}
                  placeholder="nam-cham-cho-ben-thanh"
                  maxLength={150}
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={errors.slug ? 'slug-error' : 'slug-helper'}
                />
              </FormField>

              <FormField
                label="Mô tả ngắn"
                htmlFor="shortDescription"
                error={errors.shortDescription}
                helperText="Tóm tắt ngắn gọn hiển thị trên danh thiếp sản phẩm (tối đa 500 ký tự)."
              >
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  className="adm-textarea"
                  rows={2}
                  value={formValues.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Mô tả ngắn gọn về quà lưu niệm, chất liệu, xuất xứ"
                  maxLength={500}
                  aria-invalid={Boolean(errors.shortDescription)}
                  aria-describedby={
                    errors.shortDescription ? 'shortDescription-error' : 'shortDescription-helper'
                  }
                />
              </FormField>

              <FormField
                label="Mô tả chi tiết"
                htmlFor="description"
                error={errors.description}
                helperText="Nội dung giới thiệu chi tiết, câu chuyện sản phẩm."
              >
                <textarea
                  id="description"
                  name="description"
                  className="adm-textarea"
                  rows={5}
                  value={formValues.description}
                  onChange={handleInputChange}
                  placeholder="Giới thiệu đầy đủ chi tiết về quà lưu niệm"
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'description-error' : 'description-helper'}
                />
              </FormField>
            </FormSection>

            {/* Cột phải: Hình ảnh & Cấu hình hiển thị */}
            <div className="adm-form-side">
              {/* Hình ảnh */}
              <FormSection title="Hình ảnh sản phẩm">

                <div className="adm-image-preview-container">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Ảnh xem trước"
                      className="adm-image-preview"
                      onError={() => setImagePreview(null)}
                    />
                  ) : (
                    <div className="adm-image-preview-empty">
                      <span>Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                {imageNotice && (
                  <AdminAlert variant="success" message={imageNotice} className="adm-alert-sm" />
                )}

                {imageError && (
                  <AdminAlert variant="danger" message={imageError} className="adm-alert-sm" />
                )}

                <FormField
                  label="Chọn tệp ảnh tải lên"
                  htmlFor="fileInput"
                  helperText="Hỗ trợ JPG, PNG, WEBP (tối đa 2MB)"
                >
                  <input
                    ref={fileInputRef}
                    id="fileInput"
                    type="file"
                    className="adm-file-input"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    aria-describedby="fileInput-helper"
                  />
                </FormField>

                {(isEditMode || createdProductId) && selectedFile && (
                  <button
                    type="button"
                    className="adm-btn adm-btn-secondary adm-btn-sm adm-retry-upload-btn"
                    onClick={handleUploadImageNow}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Đang tải ảnh...' : (imageError ? 'Thử tải lại ảnh' : 'Tải ảnh lên ngay')}
                  </button>
                )}

                <FormField
                  label="Hoặc nhập URL ảnh sẵn có"
                  htmlFor="imagePath"
                  error={errors.imagePath}
                  helperText="Ví dụ: /img/products/com-tam.jpg"
                >
                  <input
                    id="imagePath"
                    name="imagePath"
                    type="text"
                    className="adm-input"
                    value={formValues.imagePath}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (e.target.value.trim()) {
                        setImagePreview(e.target.value.trim());
                      }
                    }}
                    placeholder="/img/products/ten-mon.jpg"
                  />
                </FormField>
              </FormSection>

              {/* Cấu hình hiển thị */}
              <FormSection title="Cài đặt hiển thị">
                <FormField
                  label="Thứ tự hiển thị"
                  htmlFor="sortOrder"
                  error={errors.sortOrder}
                  helperText="Số nhỏ hơn sẽ hiển thị trước (mặc định: 0)."
                >
                  <input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    className="adm-input"
                    value={formValues.sortOrder}
                    onChange={handleInputChange}
                    min={0}
                    aria-invalid={Boolean(errors.sortOrder)}
                    aria-describedby={errors.sortOrder ? 'sortOrder-error' : 'sortOrder-helper'}
                  />
                </FormField>

                <div className="adm-checkbox-wrap">
                  <label htmlFor="isActive" className="adm-checkbox-label">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      className="adm-checkbox"
                      checked={formValues.isActive}
                      onChange={handleInputChange}
                    />
                    <span>Kích hoạt hiển thị sản phẩm trên website</span>
                  </label>
                  <p className="adm-field-helper" style={{ margin: '4px 0 0 24px' }}>
                    Nếu bỏ chọn, sản phẩm sẽ tạm ẩn khỏi thực đơn và tìm kiếm.
                  </p>
                </div>
              </FormSection>

              {/* Nút hành động */}
              <div className="adm-form-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => handleNavigateBack('/quan-tri/san-pham')}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? isEditMode
                      ? 'Đang lưu...'
                      : 'Đang tạo mới...'
                    : isEditMode
                    ? 'Lưu thay đổi'
                    : 'Tạo sản phẩm'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Confirm leave dialog */}
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
