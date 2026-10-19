import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { enrichProducts } from '../content/productAdapter';
import { api } from '../api/client';
import { Product } from '../types';
import { SortOptionKey } from '../types/productFilter';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../hooks/useFavorites';
import { useProductFilters } from '../hooks/useProductFilters';
import { useNavbarLanguage } from '../content/languages';
import { getSpotName } from '../content/souvenirSpots';
import { FoodHeroSection } from '../components/food/FoodHeroSection';
import { FoodSidebarFilter } from '../components/food/FoodSidebarFilter';
import { ProductCard } from '../components/food/ProductCard';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import '../styles/souvenir.css';

const ITEMS_PER_PAGE = 8;

// Trang "Ẩm thực" trước đây nay đổi nội dung thành quà lưu niệm, giữ nguyên bố cục (hero, bộ lọc, lưới sản phẩm).
const PAGE_LABEL = 'Quà lưu niệm';
const PAGE_HEADING = {
  title: 'Quà lưu niệm Sài Gòn',
  subtitle: 'Quà tặng và đặc sản gắn với từng điểm du lịch',
};

export const FoodBeveragePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { lang } = useNavbarLanguage();

  // Single Source of Truth for Filtering Logic
  const {
    filters,
    handleSearch,
    handleChangeFilter,
    handlePageChange,
    handleSortChange,
    handleResetFilters,
    isAnyFilterActive,
  } = useProductFilters();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Nguồn dữ liệu: API/DB (nguồn chung với admin). Không còn catalog tĩnh dự phòng.
  const [apiProducts, setApiProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (typeof api.getProducts !== 'function') {
      setApiProducts([]);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setHasError(false);
    api
      .getProducts({ size: 200, sortBy: 'sortOrder' })
      .then((page) => {
        if (cancelled) return;
        setApiProducts(enrichProducts(page?.content ?? []));
      })
      .catch(() => {
        if (cancelled) return;
        setApiProducts([]);
        setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Trang chỉ hiển thị quà lưu niệm (SOUVENIR); món ăn/đồ uống đã bỏ.
  const souvenirProducts = useMemo(() => {
    const list = apiProducts ?? [];
    return list.filter((item) => item.category === 'SOUVENIR');
  }, [apiProducts]);

  // Filter and sort items dynamically
  const filteredProducts = useMemo(() => {
    let list = [...souvenirProducts];

    // 1. Keyword search (normalized lowercase Vietnamese)
    if (filters.keyword.trim()) {
      const q = filters.keyword.toLowerCase().trim();
      list = list.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        if (nameMatch) return true;
        if (!filters.searchInDescription) return false;
        const descMatch = item.shortDescription.toLowerCase().includes(q);
        const fullDescMatch = item.description.toLowerCase().includes(q);
        return descMatch || fullDescMatch;
      });
    }

    // 2. Spot filter (thay cho cây danh mục cũ)
    if (filters.spot !== 'all') {
      list = list.filter((item) => item.poiSlug === filters.spot);
    }

    // 3. Price range filter
    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under-50k':
          list = list.filter((item) => item.price < 50000);
          break;
        case '50k-100k':
          list = list.filter((item) => item.price >= 50000 && item.price <= 100000);
          break;
        case '100k-200k':
          list = list.filter((item) => item.price > 100000 && item.price <= 200000);
          break;
        case 'above-200k':
          list = list.filter((item) => item.price > 200000);
          break;
      }
    }

    // 4. Rating filter
    if (filters.rating !== 'all') {
      const minRating = Number(filters.rating);
      list = list.filter((item) => (item.rating || 5.0) >= minRating);
    }

    // 5. Sorting
    switch (filters.sortBy) {
      case 'popular':
        list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case 'newest':
        list.sort((a, b) => b.id - a.id);
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return list;
  }, [filters, souvenirProducts]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(filters.page, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, safeCurrentPage]);

  // Add to cart with toast notification
  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product.isActive) return;
    addToCart(product, 1);
    showToast(`Đã thêm vào giỏ hàng: ${product.name}`);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  // Mở trang chi tiết quà lưu niệm thay cho modal chi tiết sản phẩm cũ
  const handleSelectProduct = (product: Product) => {
    navigate(`/am-thuc/${product.slug}`);
  };

  const heading = PAGE_HEADING;
  const currentSpotLabel =
    filters.spot !== 'all' ? getSpotName(filters.spot, lang) : '';

  return (
    <div className="food-beverage-page-container">
      {/* 1. HERO SECTION */}
      <FoodHeroSection
        filters={filters}
        products={apiProducts ?? []}
        onSearch={(newKeyword) => {
          handleSearch(newKeyword);
        }}
      />

      {/* 2. KHU VỰC SHOP (BỐ CỤC 2 CỘT: Cột trái 25% Sidebar Sticky, Cột phải 75% Product List) */}
      <main className="food-shop-main-layout" id="shop-panel">
        <div className="food-shop-container">
          {/* CỘT TRÁI (25%): BỘ LỌC TÌM KIẾM DUY NHẤT (STICKY) */}
          <FoodSidebarFilter
            filters={filters}
            onChangeFilter={handleChangeFilter}
            onResetFilters={handleResetFilters}
            isOpenMobile={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
            lang={lang}
          />

          {/* CỘT PHẢI: KHU VỰC SẢN PHẨM */}
          <section className="food-catalog-section" aria-label={heading.title}>
            {/* SECTION HEADER: Bố cục cùng 1 dòng, Trái: Breadcrumb + Title + Subtitle/Badge, Phải: Sắp xếp theo */}
            <div className="editorial-catalog-toolbar">
              <div className="toolbar-left-content">
                {/* Breadcrumb: Trang chủ / Quà lưu niệm */}
                <nav aria-label="Breadcrumb" className="editorial-breadcrumb">
                  <a
                    href="/"
                    className="breadcrumb-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                    }}
                  >
                    Trang chủ
                  </a>
                  <svg
                    className="breadcrumb-separator-icon"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span className="breadcrumb-current-text" aria-current="page">
                    {PAGE_LABEL}
                  </span>
                </nav>

                {/* Tiêu đề mục */}
                <h1 className="editorial-catalog-heading">{heading.title}</h1>

                {/* Hàng thông tin phụ: Badge số lượng sản phẩm + Subtitle mô tả */}
                <div className="editorial-catalog-meta-row">
                  <span className="editorial-count-badge">
                    {totalItems} sản phẩm
                  </span>
                  <p className="editorial-catalog-subtitle">
                    {heading.subtitle}
                  </p>
                </div>
              </div>

              {/* Cột phải: Canh đáy với tiêu đề */}
              <div className="toolbar-right-content">
                {/* Nút mở bộ lọc trên mobile */}
                <button
                  type="button"
                  className="mobile-filter-open-btn"
                  onClick={() => setIsMobileFilterOpen(true)}
                  aria-label="Mở bộ lọc tìm kiếm"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span>Bộ lọc</span>
                  {isAnyFilterActive && <span className="filter-active-dot" />}
                </button>

                {/* Dropdown Sắp xếp theo (borderless, border-b-2, transparent, font-medium) */}
                <div className="editorial-sort-group">
                  <label htmlFor="catalog-sort-select" className="editorial-sort-label">
                    Sắp xếp theo:
                  </label>
                  <div className="editorial-sort-select-box">
                    <select
                      id="catalog-sort-select"
                      className="editorial-clean-select"
                      value={filters.sortBy}
                      onChange={(e) => handleSortChange(e.target.value as SortOptionKey)}
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="newest">Mới nhất</option>
                      <option value="price-asc">Giá thấp đến cao</option>
                      <option value="price-desc">Giá cao đến thấp</option>
                      <option value="rating-desc">Đánh giá cao nhất</option>
                    </select>
                    <svg
                      className="clean-select-chevron"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Đường phân cách mỏng ngang toàn bộ chiều rộng lưới */}
            <div className="editorial-catalog-divider" role="separator" />

            {/* Dải filter pills đang áp dụng */}
            {isAnyFilterActive && (
              <div className="active-filters-bar">
                <span className="active-label">Đang lọc:</span>
                <div className="filter-pills-list">
                  {filters.keyword && (
                    <span className="active-pill">
                      Từ khóa: &ldquo;{filters.keyword}&rdquo;
                      <button
                        type="button"
                        onClick={() => handleSearch('')}
                        aria-label="Xóa từ khóa tìm kiếm"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.spot !== 'all' && (
                    <span className="active-pill">
                      Điểm đến: {currentSpotLabel}
                      <button
                        type="button"
                        onClick={() => handleChangeFilter('spot', 'all')}
                        aria-label="Bỏ lọc điểm đến"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.priceRange !== 'all' && (
                    <span className="active-pill">
                      Khoảng giá
                      <button
                        type="button"
                        onClick={() => handleChangeFilter('priceRange', 'all')}
                        aria-label="Bỏ lọc khoảng giá"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.rating !== 'all' && (
                    <span className="active-pill">
                      {filters.rating} sao
                      <button
                        type="button"
                        onClick={() => handleChangeFilter('rating', 'all')}
                        aria-label="Bỏ lọc đánh giá"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    className="clear-all-link"
                    onClick={handleResetFilters}
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}

            {/* LƯỚI SẢN PHẨM CHÍNH HOẶC TRẠNG THÁI LOADING/EMPTY */}
            {isLoading ? (
              <div className="souvenir-status" role="status">
                <RefreshCw size={26} aria-hidden="true" />
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="food-product-grid">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorited={isFavorite(product.id)}
                    onToggleFavorite={toggleFavorite}
                    onAddToCart={handleAddToCart}
                    onSelect={handleSelectProduct}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                keyword={hasError ? '' : filters.keyword}
                onClearFilters={handleResetFilters}
              />
            )}

            {/* PHÂN TRANG (EDITORIAL PAGINATION WITH MT-12) */}
            <div className="editorial-pagination-container">
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default FoodBeveragePage;
