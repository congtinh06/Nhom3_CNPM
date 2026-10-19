import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsApi } from '../api/newsApi';
import { normalizeAdminError } from '../api/adminClient';
import { CreateNewsArticleInput, UpdateNewsArticleInput } from '../types/news';
import { NEWS_CATEGORIES, NewsCategory } from '../../types/domain';
import { FormField } from '../components/FormField';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { AdminAlert } from '../components/AdminAlert';

interface FormValues {
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  coverImageUrl: string;
  coverImageAlt: string;
  imageCredit: string;
  source: string;
  sourceUrl: string;
  externalUrl: string;
  tags: string;
  relatedPoiSlugs: string;
  readingMinutes: string;
  audioUrl: string;
  sortOrder: string;
  isActive: boolean;
  publishedAt: string;
}

const DEFAULT_VALUES: FormValues = {
  title: '',
  slug: '',
  category: 'diem-den',
  summary: '',
  content: '',
  coverImageUrl: '',
  coverImageAlt: '',
  imageCredit: '',
  source: '',
  sourceUrl: '',
  externalUrl: '',
  tags: '',
  relatedPoiSlugs: '',
  readingMinutes: '3',
  audioUrl: '',
  sortOrder: '0',
  isActive: true,
  publishedAt: '',
};

const CATEGORY_OPTIONS = (Object.keys(NEWS_CATEGORIES) as NewsCategory[]).map((key) => ({
  value: key,
  label: NEWS_CATEGORIES[key].label,
}));

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function toCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export const NewsFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const articleId = id ? parseInt(id, 10) : null;

  const [initialValues, setInitialValues] = useState<FormValues>(DEFAULT_VALUES);
  const [formValues, setFormValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  const fetchArticle = useCallback(async () => {
    if (!articleId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const article = await newsApi.getNewsById(articleId);
      const loaded: FormValues = {
        title: article.title || '',
        slug: article.slug || '',
        category: article.category || 'diem-den',
        summary: article.summary || article.excerpt || '',
        content: article.content || '',
        coverImageUrl: article.coverImageUrl || article.thumbnail || '',
        coverImageAlt: article.coverImageAlt || '',
        imageCredit: article.imageCredit || '',
        source: article.source || '',
        sourceUrl: article.sourceUrl || '',
        externalUrl: article.externalUrl || '',
        tags: (article.tags || []).join(', '),
        relatedPoiSlugs: (article.relatedPoiSlugs || []).join(', '),
        readingMinutes: String(article.readingMinutes ?? article.readingTime ?? 3),
        audioUrl: article.audioUrl || '',
        sortOrder: String(article.sortOrder ?? 0),
        isActive: article.isActive ?? true,
        publishedAt: toDateTimeLocal(article.publishedAt),
      };
      setInitialValues(loaded);
      setFormValues(loaded);
    } catch (err) {
      const norm = normalizeAdminError(err);
      setSubmitError(norm.message);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    if (isEditMode) {
      fetchArticle();
    }
  }, [isEditMode, fetchArticle]);

  const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

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

    if (!formValues.title.trim()) {
      newErrors.title = 'Tiêu đề bài viết không được để trống';
    } else if (formValues.title.length > 300) {
      newErrors.title = 'Tiêu đề bài viết tối đa 300 ký tự';
    }

    if (formValues.slug.trim()) {
      if (formValues.slug.length > 180) {
        newErrors.slug = 'Slug tối đa 180 ký tự';
      } else if (!SLUG_REGEX.test(formValues.slug.trim())) {
        newErrors.slug = 'Slug chỉ được chứa chữ thường không dấu, số và dấu gạch ngang';
      }
    }

    if (!formValues.category) {
      newErrors.category = 'Chuyên mục không được để trống';
    }

    if (formValues.summary.length > 1000) {
      newErrors.summary = 'Tóm tắt tối đa 1000 ký tự';
    }

    const reading = parseInt(formValues.readingMinutes, 10);
    if (formValues.readingMinutes.trim() && (isNaN(reading) || reading < 1 || reading > 120)) {
      newErrors.readingMinutes = 'Thời gian đọc phải từ 1 đến 120 phút';
    }

    const sortNum = parseInt(formValues.sortOrder, 10);
    if (formValues.sortOrder.trim() && (isNaN(sortNum) || sortNum < 0)) {
      newErrors.sortOrder = 'Thứ tự hiển thị phải là số không âm';
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

  const buildPayload = (): CreateNewsArticleInput => ({
    title: formValues.title.trim(),
    slug: formValues.slug.trim() || undefined,
    category: formValues.category,
    summary: formValues.summary.trim() || undefined,
    content: formValues.content.trim() || undefined,
    coverImageUrl: formValues.coverImageUrl.trim() || undefined,
    coverImageAlt: formValues.coverImageAlt.trim() || undefined,
    imageCredit: formValues.imageCredit.trim() || undefined,
    source: formValues.source.trim() || undefined,
    sourceUrl: formValues.sourceUrl.trim() || undefined,
    externalUrl: formValues.externalUrl.trim() || undefined,
    tags: toCsv(formValues.tags),
    relatedPoiSlugs: toCsv(formValues.relatedPoiSlugs),
    readingMinutes: formValues.readingMinutes.trim()
      ? parseInt(formValues.readingMinutes, 10)
      : undefined,
    audioUrl: formValues.audioUrl.trim() || undefined,
    isActive: formValues.isActive,
    sortOrder: formValues.sortOrder.trim() ? parseInt(formValues.sortOrder, 10) : 0,
    publishedAt: formValues.publishedAt.trim() ? `${formValues.publishedAt}:00` : null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildPayload();
      if (articleId) {
        const updatePayload: UpdateNewsArticleInput = payload;
        await newsApi.updateNews(articleId, updatePayload);
      } else {
        await newsApi.createNews(payload);
      }
      navigate('/quan-tri/tin-tuc', { replace: true });
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
            onClick={() => handleNavigateBack('/quan-tri/tin-tuc')}
          >
            <ChevronLeft /> Quay lại danh sách bài viết
          </button>
          <h1 className="adm-page-title">
            {isEditMode ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
          </h1>
          <p className="adm-page-desc">
            {isEditMode
              ? `Cập nhật nội dung, hình ảnh và trạng thái cho bài viết #${articleId}.`
              : 'Điền thông tin bài viết để đăng lên trang Tin tức của website.'}
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
            <FormSection title="Nội dung bài viết">
              <FormField
                label="Tiêu đề bài viết"
                htmlFor="title"
                required
                error={errors.title}
                helperText="Tối đa 300 ký tự."
              >
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="adm-input"
                  value={formValues.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề bài viết"
                  required
                  maxLength={300}
                  aria-invalid={Boolean(errors.title)}
                />
              </FormField>

              <div className="adm-form-row">
                <div className="adm-form-col">
                  <FormField
                    label="Chuyên mục"
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
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="adm-form-col">
                  <FormField
                    label="Đường dẫn định danh (Slug)"
                    htmlFor="slug"
                    error={errors.slug}
                    helperText="Để trống để tự động sinh từ tiêu đề."
                  >
                    <input
                      id="slug"
                      name="slug"
                      type="text"
                      className="adm-input"
                      value={formValues.slug}
                      onChange={handleInputChange}
                      placeholder="ten-bai-viet"
                      maxLength={180}
                      aria-invalid={Boolean(errors.slug)}
                    />
                  </FormField>
                </div>
              </div>

              <FormField
                label="Tóm tắt"
                htmlFor="summary"
                error={errors.summary}
                helperText="Đoạn mở đầu hiển thị trên danh sách và thẻ chia sẻ (tối đa 1000 ký tự)."
              >
                <textarea
                  id="summary"
                  name="summary"
                  className="adm-textarea"
                  rows={3}
                  value={formValues.summary}
                  onChange={handleInputChange}
                  placeholder="Tóm tắt ngắn gọn nội dung bài viết"
                  maxLength={1000}
                  aria-invalid={Boolean(errors.summary)}
                />
              </FormField>

              <FormField
                label="Nội dung chi tiết"
                htmlFor="content"
                helperText="Hỗ trợ định dạng Markdown (### tiêu đề, **đậm**, > trích dẫn, - danh sách)."
              >
                <textarea
                  id="content"
                  name="content"
                  className="adm-textarea"
                  rows={14}
                  value={formValues.content}
                  onChange={handleInputChange}
                  placeholder="Nội dung đầy đủ của bài viết"
                />
              </FormField>
            </FormSection>

            <div className="adm-form-side">
              <FormSection title="Hình ảnh đại diện">
                <div className="adm-image-preview-container">
                  {formValues.coverImageUrl ? (
                    <img
                      src={formValues.coverImageUrl}
                      alt="Ảnh xem trước"
                      className="adm-image-preview"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="adm-image-preview-empty">
                      <span>Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <FormField
                  label="URL ảnh đại diện"
                  htmlFor="coverImageUrl"
                  helperText="Ví dụ: /pois/dinh-doc-lap.jpg"
                >
                  <input
                    id="coverImageUrl"
                    name="coverImageUrl"
                    type="text"
                    className="adm-input"
                    value={formValues.coverImageUrl}
                    onChange={handleInputChange}
                    placeholder="/images/news/ten-anh.jpg"
                  />
                </FormField>

                <FormField label="Mô tả ảnh (alt)" htmlFor="coverImageAlt">
                  <input
                    id="coverImageAlt"
                    name="coverImageAlt"
                    type="text"
                    className="adm-input"
                    value={formValues.coverImageAlt}
                    onChange={handleInputChange}
                    placeholder="Mô tả nội dung hình ảnh"
                    maxLength={300}
                  />
                </FormField>

                <FormField label="Nguồn ảnh" htmlFor="imageCredit">
                  <input
                    id="imageCredit"
                    name="imageCredit"
                    type="text"
                    className="adm-input"
                    value={formValues.imageCredit}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Echora Studio"
                    maxLength={200}
                  />
                </FormField>
              </FormSection>

              <FormSection title="Nguồn & liên kết">
                <FormField label="Tên nguồn" htmlFor="source">
                  <input
                    id="source"
                    name="source"
                    type="text"
                    className="adm-input"
                    value={formValues.source}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: VnExpress"
                    maxLength={200}
                  />
                </FormField>

                <FormField label="URL nguồn" htmlFor="sourceUrl">
                  <input
                    id="sourceUrl"
                    name="sourceUrl"
                    type="url"
                    className="adm-input"
                    value={formValues.sourceUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </FormField>

                <FormField
                  label="URL bài viết gốc"
                  htmlFor="externalUrl"
                  helperText="Điền nếu bài viết có bản gốc bên ngoài; để trống với bài viết nội bộ."
                >
                  <input
                    id="externalUrl"
                    name="externalUrl"
                    type="url"
                    className="adm-input"
                    value={formValues.externalUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </FormField>
              </FormSection>

              <FormSection title="Phân loại & hiển thị">
                <FormField
                  label="Từ khóa"
                  htmlFor="tags"
                  helperText="Phân tách bằng dấu phẩy. Ví dụ: di sản, quận 1"
                >
                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    className="adm-input"
                    value={formValues.tags}
                    onChange={handleInputChange}
                    placeholder="di sản, quận 1"
                  />
                </FormField>

                <FormField
                  label="Điểm tham quan liên quan"
                  htmlFor="relatedPoiSlugs"
                  helperText="Slug các điểm tham quan, phân tách bằng dấu phẩy. Ví dụ: dinh-doc-lap"
                >
                  <input
                    id="relatedPoiSlugs"
                    name="relatedPoiSlugs"
                    type="text"
                    className="adm-input"
                    value={formValues.relatedPoiSlugs}
                    onChange={handleInputChange}
                    placeholder="dinh-doc-lap, nha-tho-duc-ba"
                  />
                </FormField>

                <FormField
                  label="Thời gian đọc (phút)"
                  htmlFor="readingMinutes"
                  error={errors.readingMinutes}
                >
                  <input
                    id="readingMinutes"
                    name="readingMinutes"
                    type="number"
                    className="adm-input"
                    value={formValues.readingMinutes}
                    onChange={handleInputChange}
                    min={1}
                    max={120}
                    aria-invalid={Boolean(errors.readingMinutes)}
                  />
                </FormField>

                <FormField label="Ngày đăng" htmlFor="publishedAt" helperText="Để trống để lấy thời điểm hiện tại.">
                  <input
                    id="publishedAt"
                    name="publishedAt"
                    type="datetime-local"
                    className="adm-input"
                    value={formValues.publishedAt}
                    onChange={handleInputChange}
                  />
                </FormField>

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
                    <span>Xuất bản bài viết trên website</span>
                  </label>
                </div>
              </FormSection>

              <div className="adm-form-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => handleNavigateBack('/quan-tri/tin-tuc')}
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
                    : 'Tạo bài viết'}
                </button>
              </div>
            </div>
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
    </div>
  );
};

export default NewsFormPage;
