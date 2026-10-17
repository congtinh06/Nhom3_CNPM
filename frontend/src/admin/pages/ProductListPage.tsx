import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { normalizeAdminError } from '../api/adminClient';
import { Product, ProductCategory } from '../types/product';
import { DataTable, Column } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters state from URL or defaults
  const page = parseInt(searchParams.get('page') || '0', 10);
  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') as ProductCategory | null;
  const statusParam = searchParams.get('status'); // 'active', 'inactive', or null
  const sortParam = searchParams.get('sort') || 'sortOrder,asc';

  const [searchInput, setSearchInput] = useState(search);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Status Change Dialog state
  const [pendingStatusProduct, setPendingStatusProduct] = useState<Product | null>(null);
  const [statusDialogSubmitting, setStatusDialogSubmitting] = useState(false);

  // Feedback banner / inline toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sort Order Editing state: productId -> current draft order
  const [sortOrderDrafts, setSortOrderDrafts] = useState<Record<number, number>>({});
  const [savingSortId, setSavingSortId] = useState<number | null>(null);

  const isFirstRender = useRef(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActiveFilter =
        statusParam === 'active' ? true : statusParam === 'inactive' ? false : undefined;

      const data = await productApi.getProducts({
        page,
        size: 10,
        search: search.trim() || undefined,
        category: categoryParam || undefined,
        isActive: isActiveFilter,
        sort: sortParam,
      });

      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);

      // Initialize sort drafts
      const initialDrafts: Record<number, number> = {};
      (data.content || []).forEach((p) => {
        initialDrafts[p.id] = p.sortOrder;
      });
      setSortOrderDrafts(initialDrafts);
    } catch (err) {
      const norm = normalizeAdminError(err);
      setError(norm.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryParam, statusParam, sortParam]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Keep searchInput in sync with URL
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounced search sync to URL
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

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val && val !== 'sortOrder,asc') {
        next.set('sort', val);
      } else {
        next.delete('sort');
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

  // Status Change Flow (no optimistic UI: refetch or update from response)
  const handleInitiateStatusChange = (product: Product) => {
    if (product.isActive) {
      // Destructive transition: show ConfirmDialog
      setPendingStatusProduct(product);
    } else {
      // Activating: can activate directly or via confirm
      executeStatusChange(product, true);
    }
  };

  const executeStatusChange = async (product: Product, newStatus: boolean) => {
    setStatusDialogSubmitting(true);
    setActionNotice(null);
    setActionError(null);
    try {
      const updated = await productApi.updateProductStatus(product.id, newStatus);
      // Update from response
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setPendingStatusProduct(null);
      setActionNotice(
        newStatus
          ? `Đã kích hoạt sản phẩm "${updated.name}".`
          : `Đã tạm ngưng hiển thị sản phẩm "${updated.name}".`
      );
    } catch (err) {
      const norm = normalizeAdminError(err);
      setActionError(norm.message);
      setPendingStatusProduct(null);
    } finally {
      setStatusDialogSubmitting(false);
    }
  };

  // Sort order save
  const handleSortOrderChange = (productId: number, val: string) => {
    const parsed = parseInt(val, 10);
    setSortOrderDrafts((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSaveSortOrder = async (product: Product) => {
    const newOrder = sortOrderDrafts[product.id];
    if (newOrder === undefined || newOrder === product.sortOrder) return;

    setSavingSortId(product.id);
    setActionNotice(null);
    setActionError(null);
    try {
      const updated = await productApi.updateProductSortOrder(product.id, newOrder);
      // Update from response
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setActionNotice(`Đã cập nhật thứ tự cho sản phẩm "${product.name}".`);
    } catch (err) {
      const norm = normalizeAdminError(err);
      setActionError(`Không thể cập nhật thứ tự: ${norm.message}`);
      // Revert draft to server state
      setSortOrderDrafts((prev) => ({
        ...prev,
        [product.id]: product.sortOrder,
      }));
    } finally {
      setSavingSortId(null);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'image',
      title: 'Hình ảnh',
      width: '72px',
      render: (product) => (
        <div className="adm-product-thumb-wrap">
          {product.imagePath ? (
            <img
              src={product.imagePath}
              alt=""
              className="adm-product-thumb"
              onError={(e) => {
                // Muted fallback
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="adm-product-thumb-placeholder" aria-hidden="true">
              Món
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      title: 'Tên sản phẩm',
      render: (product) => (
        <div className="adm-product-info-cell">
          <Link
            to={`/quan-tri/san-pham/${product.id}`}
            className="adm-product-name-link"
          >
            {product.name}
          </Link>
          <span className="adm-product-slug">{product.slug}</span>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục',
      width: '120px',
      render: (product) => (
        <span className="adm-category-tag">
          {product.category === 'FOOD' ? 'Món ăn' : 'Đồ uống'}
        </span>
      ),
    },
    {
      key: 'price',
      title: 'Giá bán',
      align: 'right',
      width: '120px',
      render: (product) => (
        <span className="adm-product-price">
          {product.price.toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      key: 'sortOrder',
      title: 'Thứ tự',
      align: 'center',
      width: '130px',
      render: (product) => {
        const draft = sortOrderDrafts[product.id] ?? product.sortOrder;
        const isDirty = draft !== product.sortOrder;
        const isSaving = savingSortId === product.id;

        return (
          <div className="adm-sort-cell">
            <input
              type="number"
              className="adm-input adm-sort-input"
              value={draft}
              onChange={(e) => handleSortOrderChange(product.id, e.target.value)}
              disabled={isSaving}
              aria-label={`Thứ tự của ${product.name}`}
              min={0}
            />
            {isDirty && (
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm adm-sort-save-btn"
                onClick={() => handleSaveSortOrder(product)}
                disabled={isSaving}
                title="Lưu thứ tự"
              >
                {isSaving ? '...' : 'Lưu'}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: '130px',
      render: (product) => (
        <StatusBadge status={product.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'updatedAt',
      title: 'Cập nhật',
      width: '140px',
      render: (product) => {
        if (!product.updatedAt && !product.createdAt) return '—';
        const dateStr = product.updatedAt || product.createdAt || '';
        try {
          const d = new Date(dateStr);
          return (
            <span className="adm-date-text">
              {d.toLocaleDateString('vi-VN')}
            </span>
          );
        } catch {
          return '—';
        }
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: '160px',
      render: (product) => (
        <div className="adm-row-actions">
          <Link
            to={`/quan-tri/san-pham/${product.id}`}
            className="adm-btn adm-btn-secondary adm-btn-sm"
            aria-label={`Chỉnh sửa ${product.name}`}
          >
            Sửa
          </Link>
          <button
            type="button"
            className={`adm-btn adm-btn-sm ${
              product.isActive ? 'adm-btn-ghost' : 'adm-btn-secondary'
            }`}
            onClick={() => handleInitiateStatusChange(product)}
            aria-label={
              product.isActive
                ? `Tạm ngưng ${product.name}`
                : `Kích hoạt ${product.name}`
            }
          >
            {product.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
          </button>
        </div>
      ),
    },
  ];

  const hasActiveFilters = Boolean(
    search || categoryParam || statusParam || (sortParam && sortParam !== 'sortOrder,asc')
  );

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h1 className="adm-page-title">Quản lý sản phẩm</h1>
          <p className="adm-page-desc">
            Danh sách món ăn, thức uống và ẩm thực hiển thị trên website Echora.
          </p>
        </div>
        <Link to="/quan-tri/san-pham/moi" className="adm-btn adm-btn-primary">
          + Thêm sản phẩm
        </Link>
      </div>

      {actionNotice && (
        <div className="adm-alert adm-alert-success" role="status">
          <span>{actionNotice}</span>
          <button
            type="button"
            className="adm-alert-close"
            onClick={() => setActionNotice(null)}
            aria-label="Đóng thông báo"
          >
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div className="adm-alert adm-alert-danger" role="alert">
          <span>{actionError}</span>
          <button
            type="button"
            className="adm-alert-close"
            onClick={() => setActionError(null)}
            aria-label="Đóng lỗi"
          >
            &times;
          </button>
        </div>
      )}

      {/* Toolbar / Bộ lọc */}
      <div className="adm-toolbar">
        <div className="adm-toolbar-left">
          <div className="adm-search-wrap">
            <input
              type="search"
              className="adm-input adm-search-input"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
          </div>

          <select
            className="adm-select"
            value={categoryParam || ''}
            onChange={handleCategoryChange}
            aria-label="Lọc theo danh mục"
          >
            <option value="">Tất cả danh mục</option>
            <option value="FOOD">Món ăn (FOOD)</option>
            <option value="DRINK">Đồ uống (DRINK)</option>
          </select>

          <select
            className="adm-select"
            value={statusParam || ''}
            onChange={handleStatusFilterChange}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngưng</option>
          </select>

          <select
            className="adm-select"
            value={sortParam}
            onChange={handleSortChange}
            aria-label="Sắp xếp danh sách"
          >
            <option value="sortOrder,asc">Thứ tự hiển thị (tăng dần)</option>
            <option value="sortOrder,desc">Thứ tự hiển thị (giảm dần)</option>
            <option value="id,desc">Mới nhất (ID giảm dần)</option>
            <option value="price,asc">Giá bán (tăng dần)</option>
            <option value="price,desc">Giá bán (giảm dần)</option>
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
        </div>

        <div className="adm-toolbar-right">
          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={fetchProducts}
            disabled={loading}
            title="Tải lại danh sách"
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Danh sách dữ liệu */}
      {error ? (
        <ErrorState
          title="Không thể tải danh sách sản phẩm"
          message={error}
          onRetry={fetchProducts}
        />
      ) : !loading && products.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Không tìm thấy sản phẩm phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc danh mục và trạng thái."
            actionText="Xóa toàn bộ bộ lọc"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có sản phẩm nào trong hệ thống"
            description="Bắt đầu thêm món ăn hoặc đồ uống đầu tiên để hiển thị cho du khách khám phá ẩm thực Sài Gòn."
            actionText="+ Thêm sản phẩm mới"
            onAction={() => navigate('/quan-tri/san-pham/moi')}
          />
        )
      ) : (
        <>
          <DataTable
            columns={columns}
            data={products}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyText="Chưa có dữ liệu sản phẩm hiển thị."
            ariaLabel="Bảng danh sách sản phẩm quản trị"
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="adm-pagination">
              <div className="adm-pagination-info">
                Hiển thị trang {page + 1} trên {totalPages} (Tổng cộng{' '}
                {totalElements.toLocaleString('vi-VN')} sản phẩm)
              </div>
              <div className="adm-pagination-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 0 || loading}
                >
                  &larr; Trang trước
                </button>

                <span className="adm-pagination-current">
                  {page + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Trang sau &rarr;
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Dialog for deactivating product */}
      <ConfirmDialog
        isOpen={Boolean(pendingStatusProduct)}
        title="Xác nhận tạm ngưng sản phẩm"
        message={`Bạn có chắc chắn muốn tạm ngưng hiển thị sản phẩm "${pendingStatusProduct?.name}" trên website? Du khách sẽ không thể tìm kiếm hoặc đặt món ăn này.`}
        confirmText={statusDialogSubmitting ? 'Đang xử lý...' : 'Tạm ngưng sản phẩm'}
        cancelText="Hủy bỏ"
        variant="danger"
        onConfirm={() => {
          if (pendingStatusProduct) {
            executeStatusChange(pendingStatusProduct, false);
          }
        }}
        onCancel={() => {
          if (!statusDialogSubmitting) {
            setPendingStatusProduct(null);
          }
        }}
      />
    </div>
  );
};
