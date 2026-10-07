import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Plus, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useNavbarLanguage } from '../content/languages';
import { formatPrice } from '../utils/formatters';
import { defaultProducts } from '../content/defaultProducts';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { Product, ProductCategory } from '../types';

interface ProductListPageProps {
  category: ProductCategory;
}

const PAGE_SIZE = 8;

export const ProductListPage: React.FC<ProductListPageProps> = ({ category }) => {
  const navigate = useNavigate();
  const { t } = useNavbarLanguage();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const basePath = category === 'FOOD' ? '/am-thuc' : '/thuc-uong';
  const pageTitle = category === 'FOOD' ? t.shop.foodTitle : t.shop.drinksTitle;
  const pageSubtitle = category === 'FOOD' ? t.shop.foodSubtitle : t.shop.drinksSubtitle;

  const fetchProducts = useCallback(
    async (targetPage: number, keyword: string, isAppend: boolean = false) => {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await api.getProducts({
          category,
          search: keyword.trim() || undefined,
          page: targetPage,
          size: PAGE_SIZE,
        });

        if (response && Array.isArray(response.content) && response.content.length > 0) {
          if (isAppend) {
            setProducts((prev) => [...prev, ...response.content]);
          } else {
            setProducts(response.content);
          }
          setTotalPages(response.totalPages);
          setTotalElements(response.totalElements);
          setPage(response.number);
        } else {
          // Nếu backend trả về rỗng nhưng có từ khóa tìm kiếm
          if (keyword.trim()) {
            setProducts(isAppend ? (prev) => prev : []);
            setTotalElements(0);
            setTotalPages(1);
          } else {
            // Dùng dữ liệu mẫu mặc định cho category
            const filteredFallback = defaultProducts.filter(
              (p) => p.category === category && p.isActive
            );
            const start = targetPage * PAGE_SIZE;
            const slice = filteredFallback.slice(start, start + PAGE_SIZE);
            if (isAppend) {
              setProducts((prev) => [...prev, ...slice]);
            } else {
              setProducts(slice);
            }
            setTotalPages(Math.ceil(filteredFallback.length / PAGE_SIZE) || 1);
            setTotalElements(filteredFallback.length);
            setPage(targetPage);
          }
        }
      } catch {
        // Fallback offline an toàn khi mạng hoặc backend chưa sẵn sàng
        const filteredFallback = defaultProducts.filter((p) => {
          const matchCat = p.category === category && p.isActive;
          if (!matchCat) return false;
          if (!keyword.trim()) return true;
          const kw = keyword.toLowerCase().trim();
          return (
            p.name.toLowerCase().includes(kw) ||
            p.shortDescription.toLowerCase().includes(kw)
          );
        });

        const start = targetPage * PAGE_SIZE;
        const slice = filteredFallback.slice(start, start + PAGE_SIZE);

        if (isAppend) {
          setProducts((prev) => [...prev, ...slice]);
        } else {
          setProducts(slice);
        }
        setTotalPages(Math.ceil(filteredFallback.length / PAGE_SIZE) || 1);
        setTotalElements(filteredFallback.length);
        setPage(targetPage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    setSearchKeyword('');
    setAppliedSearch('');
    setPage(0);
    fetchProducts(0, '', false);
  }, [category, fetchProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchKeyword);
    setPage(0);
    fetchProducts(0, searchKeyword, false);
  };

  const handleClearSearch = () => {
    setSearchKeyword('');
    setAppliedSearch('');
    setPage(0);
    fetchProducts(0, '', false);
  };

  const handleLoadMore = () => {
    if (page + 1 < totalPages && !loadingMore) {
      const nextPage = page + 1;
      fetchProducts(nextPage, appliedSearch, true);
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isActive) return;
    addToCart(product, 1);
    showToast(`${t.shop.addedToCart}: ${product.name}`);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  const handleCardClick = (slug: string) => {
    navigate(`${basePath}/${slug}`);
  };

  const hasMore = page + 1 < totalPages;

  return (
    <div className="product-page-container">
      {/* Banner đầu trang */}
      <section className="product-banner" aria-label={pageTitle}>
        <div className="product-banner-content">
          <p className="product-banner-tag">SaigonVoice</p>
          <h1 className="product-banner-title">{pageTitle}</h1>
          <p className="product-banner-desc">{pageSubtitle}</p>
        </div>
      </section>

      {/* Thanh điều khiển & Tìm kiếm */}
      <section className="product-toolbar-section">
        <div className="product-toolbar">
          <form className="product-search-form" onSubmit={handleSearchSubmit}>
            <div className="product-search-input-wrap">
              <Search size={18} strokeWidth={1.75} className="search-icon" aria-hidden="true" />
              <input
                type="text"
                className="product-search-input"
                placeholder={t.shop.searchPlaceholder}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                aria-label={t.shop.searchPlaceholder}
              />
              {searchKeyword && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="tb search-submit-btn">
              {t.shop.searchBtn}
            </button>
          </form>

          {appliedSearch && (
            <div className="search-results-info">
              <span>
                Kết quả tìm kiếm cho: <b>&ldquo;{appliedSearch}&rdquo;</b>
              </span>
              <button
                type="button"
                className="clear-search-link"
                onClick={handleClearSearch}
              >
                Đặt lại
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Nội dung danh sách */}
      <section className="product-grid-section s">
        {loading ? (
          <div className="product-loading-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="product-card-skeleton">
                <div className="skeleton-image" />
                <div className="skeleton-content">
                  <div className="skeleton-line line-title" />
                  <div className="skeleton-line line-desc" />
                  <div className="skeleton-line line-desc short" />
                  <div className="skeleton-line line-price" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="product-state-card error-card" role="alert">
            <AlertCircle size={36} strokeWidth={1.75} className="state-icon" aria-hidden="true" />
            <h3>{t.shop.errorLoad}</h3>
            <p>{error}</p>
            <button
              type="button"
              className="tb"
              onClick={() => fetchProducts(0, appliedSearch, false)}
            >
              <RefreshCw size={15} strokeWidth={1.75} aria-hidden="true" />
              {t.shop.retry}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="product-state-card empty-card">
            <ShoppingBag size={40} strokeWidth={1.75} className="state-icon" aria-hidden="true" />
            <h3>{t.shop.noProducts}</h3>
            {appliedSearch ? (
              <p>Thử tìm với từ khóa khác hoặc xem tất cả các món.</p>
            ) : (
              <p>Danh sách món đang được cập nhật.</p>
            )}
            {appliedSearch && (
              <button type="button" className="tb" onClick={handleClearSearch}>
                Xem tất cả món
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="product-grid">
              {products.map((item) => {
                const isOutOfStock = !item.isActive;
                const hue = (item.id * 47) % 360;

                return (
                  <article
                    key={item.id}
                    className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => handleCardClick(item.slug)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCardClick(item.slug);
                      }
                    }}
                    aria-label={`${item.name} - ${formatPrice(item.price)}`}
                  >
                    <div className="product-card-media">
                      <PhotoFrame
                        hue={hue}
                        caption={`Ảnh: ${item.name}`}
                        src={item.imagePath}
                        className="product-card-photo"
                      />
                      {isOutOfStock && (
                        <div className="badge-out-of-stock">
                          {t.shop.outOfStock}
                        </div>
                      )}
                    </div>

                    <div className="product-card-body">
                      <h2 className="product-card-title">{item.name}</h2>
                      <p className="product-card-desc">{item.shortDescription}</p>

                      <div className="product-card-footer">
                        <div className="product-price-box">
                          <span className="product-price-label">Giá</span>
                          <b className="product-price-value">{formatPrice(item.price)}</b>
                        </div>

                        <button
                          type="button"
                          className="tb product-add-btn"
                          disabled={isOutOfStock}
                          onClick={(e) => handleAddToCart(item, e)}
                          aria-label={`Thêm ${item.name} vào giỏ hàng`}
                        >
                          <Plus size={15} strokeWidth={2} aria-hidden="true" />
                          <span>{t.shop.addToCart}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Phân trang / Tải thêm */}
            <div className="product-pagination-bar">
              <p className="product-counter">
                {t.shop.showingCount} <b>{products.length}</b> / <b>{totalElements || products.length}</b> món
              </p>

              {hasMore && (
                <button
                  type="button"
                  className="tb product-load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw size={15} strokeWidth={1.75} className="spin-icon" aria-hidden="true" />
                      <span>{t.shop.loading}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.shop.loadMore}</span>
                      <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default ProductListPage;
