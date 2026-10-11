import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { defaultProducts } from '../content/defaultProducts';
import { Product, ProductOptions } from '../types';
import { SortOptionKey } from '../types/productFilter';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../hooks/useFavorites';
import { useProductFilters } from '../hooks/useProductFilters';
import { FoodHeroSection } from '../components/food/FoodHeroSection';
import { FoodSidebarFilter } from '../components/food/FoodSidebarFilter';
import { ProductCard } from '../components/food/ProductCard';
import { ProductDetailModal } from '../components/food/ProductDetailModal';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';

const ITEMS_PER_PAGE = 8;

export const FoodBeveragePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

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

  // Selected product for Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filter and sort items dynamically
  const filteredProducts = useMemo(() => {
    let list = [...defaultProducts];

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

    // 2. Product Type filter (FOOD / DRINK)
    if (filters.productType !== 'all') {
      list = list.filter((item) => item.category === filters.productType);
    }

    // 3. Category filter
    if (filters.category !== 'all') {
      list = list.filter((item) => item.subCategory === filters.category);
    }

    // 4. Price range filter
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

    // 5. Rating filter
    if (filters.rating !== 'all') {
      const minRating = Number(filters.rating);
      list = list.filter((item) => (item.rating || 5.0) >= minRating);
    }

    // 6. Sorting
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
  }, [filters]);

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

  // Open modal
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Add from modal with custom options
  const handleModalAddToCart = (
    product: Product,
    quantity: number,
    options?: ProductOptions
  ) => {
    if (!product.isActive) return;
    addToCart(product, quantity);
    const optionsText = options?.size
      ? ` (${options.size}, ${options.sugar} đường, ${options.ice} đá)`
      : options?.note
      ? ` (${options.note})`
      : '';
    showToast(`Đã thêm vào giỏ: ${quantity} × ${product.name}${optionsText}`);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  // Buy now: add to cart & immediately navigate to checkout
  const handleModalBuyNow = (
    product: Product,
    quantity: number,
    _options?: ProductOptions
  ) => {
    if (!product.isActive) return;
    addToCart(product, quantity);
    (window as unknown as { __pop?: () => void }).__pop?.();
    setIsModalOpen(false);
    navigate('/thanh-toan');
  };

  return (
    <div className="food-beverage-page-container">
      {/* 1. HERO SECTION */}
      <FoodHeroSection
        filters={filters}
        onSearch={(newKeyword, newCategory) => {
          handleSearch(newKeyword);
          if (newCategory) {
            handleChangeFilter('category', newCategory);
          }
        }}
      />

      {/* 2. KHU VỰC SHOP (BỐ CỤC 2 CỘT: Cột trái 25% Sidebar Sticky, Cột phải 75% Product List) */}
      <main className="food-shop-main-layout" id="shop-catalog-anchor">
        <div className="food-shop-container">
          {/* CỘT TRÁI (25%): BỘ LỌC TÌM KIẾM DUY NHẤT (STICKY) */}
          <FoodSidebarFilter
            filters={filters}
            onChangeFilter={handleChangeFilter}
            onResetFilters={handleResetFilters}
            isOpenMobile={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
          />

          {/* CỘT PHẢI: KHU VỰC SẢN PHẨM */}
          <section className="food-catalog-section" aria-label="Danh sách món ăn và thức uống">
            {/* SECTION HEADER: Bố cục cùng 1 dòng, Trái: Breadcrumb + Title + Subtitle/Badge, Phải: Sắp xếp theo */}
            <div className="editorial-catalog-toolbar">
              <div className="toolbar-left-content">
                {/* Breadcrumb: Trang chủ / Thực đơn */}
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
                    Thực đơn
                  </span>
                </nav>

                {/* Tiêu đề mục: Thực đơn Sài Gòn (Playfair Display, text-4xl, font-bold) */}
                <h1 className="editorial-catalog-heading">Thực đơn Sài Gòn</h1>

                {/* Hàng thông tin phụ: Badge số lượng sản phẩm + Subtitle mô tả */}
                <div className="editorial-catalog-meta-row">
                  <span className="editorial-count-badge">
                    {totalItems} sản phẩm
                  </span>
                  <span className="editorial-meta-bullet" aria-hidden="true">•</span>
                  <p className="editorial-catalog-subtitle">
                    Khám phá hương vị đặc trưng của Sài Gòn
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
                  {filters.productType !== 'all' && (
                    <span className="active-pill">
                      {filters.productType === 'FOOD' ? 'Món ăn' : 'Thức uống'}
                      <button
                        type="button"
                        onClick={() => handleChangeFilter('productType', 'all')}
                        aria-label="Bỏ lọc loại sản phẩm"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.category !== 'all' && (
                    <span className="active-pill">
                      Danh mục: {filters.category}
                      <button
                        type="button"
                        onClick={() => handleChangeFilter('category', 'all')}
                        aria-label="Bỏ lọc danh mục"
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

            {/* LƯỚI SẢN PHẨM CHÍNH HOẶC TRẠNG THÁI EMPTY STATE */}
            {paginatedProducts.length > 0 ? (
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
                keyword={filters.keyword}
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

      {/* 4. MODAL CHI TIẾT SẢN PHẨM */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleModalAddToCart}
        onBuyNow={handleModalBuyNow}
        isFavorited={selectedProduct ? isFavorite(selectedProduct.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default FoodBeveragePage;
