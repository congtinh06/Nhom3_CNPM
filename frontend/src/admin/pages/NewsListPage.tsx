import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { newsApi } from '../api/newsApi';
import { normalizeAdminError } from '../api/adminClient';
import { NewsArticle } from '../types/news';
import { NEWS_CATEGORIES, NewsCategory } from '../../types/domain';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { AdminToolbar } from '../components/AdminToolbar';
import { AdminPagination } from '../components/AdminPagination';
import { AdminAlert } from '../components/AdminAlert';

const CATEGORY_OPTIONS: { value: NewsCategory; label: string }[] = (
  Object.keys(NEWS_CATEGORIES) as NewsCategory[]
).map((key) => ({ value: key, label: NEWS_CATEGORIES[key].label }));

export const NewsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || '0', 10);
  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const statusParam = searchParams.get('status');
  const sortParam = searchParams.get('sort') || 'publishedAt,desc';

  const [searchInput, setSearchInput] = useState(search);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [pendingStatusArticle, setPendingStatusArticle] = useState<NewsArticle | null>(null);
  const [pendingDeleteArticle, setPendingDeleteArticle] = useState<NewsArticle | null>(null);
  const [dialogSubmitting, setDialogSubmitting] = useState(false);

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isFirstRender = useRef(true);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActiveFilter =
        statusParam === 'active' ? true : statusParam === 'inactive' ? false : undefined;

      const data = await newsApi.getNews({
        page,
        size: 10,
        search: search.trim() || undefined,
        category: categoryParam || undefined,
        isActive: isActiveFilter,
        sort: sortParam,
      });

      setArticles(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      const norm = normalizeAdminError(err);
      setError(norm.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryParam, statusParam, sortParam]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '0');
          return next;
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, search, setSearchParams]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('category', val);
      } else {
        next.delete('category');
      }
      next.set('page', '0');
      return next;
    });
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set('status', val);
      } else {
        next.delete('status');
      }
      next.set('page', '0');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const executeStatusChange = async (article: NewsArticle, newStatus: boolean) => {
    setDialogSubmitting(true);
    setActionNotice(null);
    setActionError(null);
    try {
      const updated = await newsApi.updateNewsStatus(article.id, newStatus);
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setPendingStatusArticle(null);
      setActionNotice(
        newStatus
          ? `Đã xuất bản bài viết "${updated.title}".`
          : `Đã tạm ẩn bài viết "${updated.title}".`
      );
    } catch (err) {
      const norm = normalizeAdminError(err);
      setActionError(norm.message);
      setPendingStatusArticle(null);
    } finally {
      setDialogSubmitting(false);
    }
  };

  const handleInitiateStatusChange = (article: NewsArticle) => {
    if (article.isActive) {
      setPendingStatusArticle(article);
    } else {
      executeStatusChange(article, true);
    }
  };

  const executeDelete = async (article: NewsArticle) => {
    setDialogSubmitting(true);
    setActionNotice(null);
    setActionError(null);
    try {
      await newsApi.deleteNews(article.id);
      setPendingDeleteArticle(null);
      setActionNotice(`Đã xóa bài viết "${article.title}".`);
      fetchNews();
    } catch (err) {
      const norm = normalizeAdminError(err);
      setActionError(norm.message);
      setPendingDeleteArticle(null);
    } finally {
      setDialogSubmitting(false);
    }
  };

  const columns: Column<NewsArticle>[] = [
    {
      key: 'image',
      title: 'Hình ảnh',
      width: '72px',
      render: (article) => (
        <div className="adm-product-thumb-wrap">
          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt=""
              className="adm-product-thumb"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="adm-product-thumb-placeholder" aria-hidden="true">
              Tin
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      title: 'Tiêu đề',
      render: (article) => (
        <div className="adm-product-info-cell">
          <Link to={`/quan-tri/tin-tuc/${article.id}`} className="adm-product-name-link">
            {article.title}
          </Link>
          <span className="adm-product-slug">{article.slug}</span>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Chuyên mục',
      width: '160px',
      render: (article) => (
        <StatusBadge variant="neutral">
          {NEWS_CATEGORIES[article.category as NewsCategory]?.label || article.category}
        </StatusBadge>
      ),
    },
    {
      key: 'publishedAt',
      title: 'Ngày đăng',
      width: '130px',
      render: (article) => {
        if (!article.publishedAt) return '-';
        try {
          return (
            <span className="adm-date-text">
              {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
            </span>
          );
        } catch {
          return '-';
        }
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '130px',
      render: (article) => (
        <StatusBadge status={article.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '220px',
      render: (article) => (
        <div className="adm-row-actions">
          <Link
            to={`/quan-tri/tin-tuc/${article.id}`}
            className="adm-btn adm-btn-secondary adm-btn-sm"
            aria-label={`Chỉnh sửa ${article.title}`}
          >
            Sửa
          </Link>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${
              article.isActive ? 'adm-btn-ghost' : 'adm-btn-secondary'
            }`}
            onClick={() => handleInitiateStatusChange(article)}
            aria-label={article.isActive ? `Tạm ẩn ${article.title}` : `Xuất bản ${article.title}`}
          >
            {article.isActive ? 'Tạm ẩn' : 'Xuất bản'}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn-sm adm-btn-ghost"
            onClick={() => setPendingDeleteArticle(article)}
            aria-label={`Xóa ${article.title}`}
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters = Boolean(
    search || categoryParam || statusParam || (sortParam && sortParam !== 'publishedAt,desc')
  );

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Quản lý tin tức</h1>
          <p className="adm-page-desc">
            Danh sách bài viết hiển thị trên trang Tin tức của website Echora.
          </p>
        </div>
        <div className="adm-page-actions">
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={fetchNews}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <Link to="/quan-tri/tin-tuc/moi" className="adm-btn adm-btn-primary">
            + Thêm bài viết
          </Link>
        </div>
      </div>

      {actionNotice && (
        <AdminAlert variant="success" message={actionNotice} onClose={() => setActionNotice(null)} />
      )}

      {actionError && (
        <AdminAlert variant="danger" message={actionError} onClose={() => setActionError(null)} />
      )}

      <AdminToolbar>
        <div className="adm-search-wrap">
          <input
            type="search"
            className="adm-input adm-search-input"
            placeholder="Tìm theo tiêu đề bài viết"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Tìm kiếm bài viết"
          />
        </div>

        <select
          className="adm-select"
          value={categoryParam}
          onChange={handleCategoryChange}
          aria-label="Lọc theo chuyên mục"
        >
          <option value="">Tất cả chuyên mục</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          className="adm-select"
          value={statusParam || ''}
          onChange={handleStatusFilterChange}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đã xuất bản</option>
          <option value="inactive">Tạm ẩn</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={handleClearFilters}
          >
            Xóa bộ lọc
          </button>
        )}
      </AdminToolbar>

      {error ? (
        <ErrorState
          title="Không thể tải danh sách bài viết"
          message={error}
          onRetry={fetchNews}
        />
      ) : !loading && articles.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy bài viết phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc chuyên mục và trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có bài viết nào trong hệ thống"
            description="Bắt đầu thêm bài viết đầu tiên để hiển thị cho du khách trên trang Tin tức."
            actionText="+ Thêm bài viết mới"
            onAction={() => navigate('/quan-tri/tin-tuc/moi')}
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={articles}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu bài viết hiển thị."
            ariaLabel="Bảng danh sách bài viết quản trị"
            stickyLastColumn
          />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            unitLabel="bài viết"
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingStatusArticle)}
        title="Xác nhận tạm ẩn bài viết"
        message={`Bạn có chắc chắn muốn tạm ẩn bài viết "${pendingStatusArticle?.title}" khỏi trang Tin tức?`}
        confirmText={dialogSubmitting ? 'Đang xử lý...' : 'Tạm ẩn bài viết'}
        cancelText="Hủy bỏ"
        variant="danger"
        onConfirm={() => {
          if (pendingStatusArticle) {
            executeStatusChange(pendingStatusArticle, false);
          }
        }}
        onCancel={() => {
          if (!dialogSubmitting) {
            setPendingStatusArticle(null);
          }
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteArticle)}
        title="Xác nhận xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn bài viết "${pendingDeleteArticle?.title}"? Hành động này không thể hoàn tác.`}
        confirmText={dialogSubmitting ? 'Đang xử lý...' : 'Xóa bài viết'}
        cancelText="Hủy bỏ"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteArticle) {
            executeDelete(pendingDeleteArticle);
          }
        }}
        onCancel={() => {
          if (!dialogSubmitting) {
            setPendingDeleteArticle(null);
          }
        }}
      />
    </div>
  );
};

export default NewsListPage;
