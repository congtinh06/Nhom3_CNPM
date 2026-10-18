import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ProductFilterState,
  CategoryFilterKey,
  PriceRangeFilter,
  RatingFilter,
  ProductTypeFilter,
  SpotFilterKey,
  SortOptionKey,
  AdvancedSearchValues,
} from '../types/productFilter';

const DEFAULT_FILTERS: ProductFilterState = {
  keyword: '',
  productType: 'all',
  category: 'all',
  spot: 'all',
  priceRange: 'all',
  rating: 'all',
  sortBy: 'popular',
  searchInDescription: true,
  page: 1,
};

export const useProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo state từ URL params
  const [filters, setFilters] = useState<ProductFilterState>(() => {
    const q = searchParams.get('q') || '';
    const cat = (searchParams.get('cat') as CategoryFilterKey) || 'all';
    const type = (searchParams.get('type') as ProductTypeFilter) || 'all';
    const spot = (searchParams.get('spot') as SpotFilterKey) || 'all';
    const price = (searchParams.get('price') as PriceRangeFilter) || 'all';
    const rating = (searchParams.get('rating') as RatingFilter) || 'all';
    const sort = (searchParams.get('sort') as SortOptionKey) || 'popular';
    const desc = searchParams.get('desc') !== '0';
    const page = parseInt(searchParams.get('page') || '1', 10);

    return {
      keyword: q,
      productType: type,
      category: cat,
      spot,
      priceRange: price,
      rating: rating,
      sortBy: sort,
      searchInDescription: desc,
      page: isNaN(page) || page < 1 ? 1 : page,
    };
  });

  // Đồng bộ hóa URL query params khi state thay đổi.
  // Giữ nguyên các tham số không thuộc bộ lọc (ví dụ `tab` của trang Ẩm thực).
  const syncToUrl = useCallback(
    (nextState: ProductFilterState) => {
      const params = new URLSearchParams(searchParams);

      const setOrDelete = (key: string, value: string, defaultValue: string) => {
        if (value && value !== defaultValue) params.set(key, value);
        else params.delete(key);
      };

      setOrDelete('q', nextState.keyword.trim(), '');
      setOrDelete('type', nextState.productType, 'all');
      setOrDelete('cat', nextState.category, 'all');
      setOrDelete('spot', nextState.spot, 'all');
      setOrDelete('price', nextState.priceRange, 'all');
      setOrDelete('rating', nextState.rating, 'all');
      setOrDelete('sort', nextState.sortBy, 'popular');

      if (!nextState.searchInDescription) params.set('desc', '0');
      else params.delete('desc');

      if (nextState.page > 1) params.set('page', String(nextState.page));
      else params.delete('page');

      setSearchParams(params, { replace: true });
    },
    [setSearchParams, searchParams]
  );

  // Lắng nghe thay đổi từ bên ngoài URL (ví dụ back/forward button hoặc header navigation)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const catParam = searchParams.get('cat');
    let cat: CategoryFilterKey = 'all';
    let type: ProductTypeFilter = 'all';

    if (catParam === 'dr' || catParam === 'thuc-uong') {
      type = 'DRINK';
    } else if (catParam === 'food' || catParam === 'am-thuc') {
      type = 'FOOD';
    } else if (catParam) {
      cat = catParam as CategoryFilterKey;
    }

    const price = (searchParams.get('price') as PriceRangeFilter) || 'all';
    const rating = (searchParams.get('rating') as RatingFilter) || 'all';
    const spot = (searchParams.get('spot') as SpotFilterKey) || 'all';
    const sort = (searchParams.get('sort') as SortOptionKey) || 'popular';
    const desc = searchParams.get('desc') !== '0';
    const page = parseInt(searchParams.get('page') || '1', 10);

    setFilters((prev) => {
      if (
        prev.keyword === q &&
        prev.category === cat &&
        prev.productType === type &&
        prev.spot === spot &&
        prev.priceRange === price &&
        prev.rating === rating &&
        prev.sortBy === sort &&
        prev.searchInDescription === desc &&
        prev.page === (isNaN(page) ? 1 : page)
      ) {
        return prev;
      }
      return {
        keyword: q,
        productType: type,
        category: cat,
        spot,
        priceRange: price,
        rating: rating,
        sortBy: sort,
        searchInDescription: desc,
        page: isNaN(page) || page < 1 ? 1 : page,
      };
    });
  }, [searchParams]);

  // CRITICAL FIX: Khi người dùng tìm kiếm theo từ khóa, TỰ ĐỘNG RESET category & type về 'all'
  const handleSearch = useCallback(
    (newKeyword: string) => {
      setFilters((prev) => {
        const next: ProductFilterState = {
          ...prev,
          keyword: newKeyword,
          category: 'all', // RESET Danh mục về "Tất cả" để tránh xung đột 0 sản phẩm!
          productType: 'all', // RESET Loại sản phẩm để tìm kiếm toàn diện
          page: 1,
        };
        syncToUrl(next);
        return next;
      });
    },
    [syncToUrl]
  );

  // Thay đổi từng bộ lọc cụ thể (Loại, Danh mục, Giá, Rating)
  const handleChangeFilter = useCallback(
    <K extends keyof Omit<ProductFilterState, 'keyword' | 'page'>>(
      key: K,
      value: ProductFilterState[K]
    ) => {
      setFilters((prev) => {
        const next: ProductFilterState = {
          ...prev,
          [key]: value,
          page: 1,
        };
        syncToUrl(next);
        return next;
      });
    },
    [syncToUrl]
  );

  // Đổi trang phân trang
  const handlePageChange = useCallback(
    (newPage: number) => {
      setFilters((prev) => {
        const next: ProductFilterState = {
          ...prev,
          page: newPage,
        };
        syncToUrl(next);
        return next;
      });
    },
    [syncToUrl]
  );

  // Đổi cách sắp xếp
  const handleSortChange = useCallback(
    (newSort: SortOptionKey) => {
      setFilters((prev) => {
        const next: ProductFilterState = {
          ...prev,
          sortBy: newSort,
          page: 1,
        };
        syncToUrl(next);
        return next;
      });
    },
    [syncToUrl]
  );

  // Áp dụng đồng thời nhiều tiêu chí từ khối "Tìm kiếm nâng cao"
  const handleApplyAdvanced = useCallback(
    (values: AdvancedSearchValues) => {
      setFilters((prev) => {
        const next: ProductFilterState = {
          ...prev,
          ...values,
          page: 1,
        };
        syncToUrl(next);
        return next;
      });
    },
    [syncToUrl]
  );

  // Xóa toàn bộ bộ lọc (giữ lại tham số ngoài bộ lọc như `tab`)
  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    const params = new URLSearchParams(searchParams);
    ['q', 'type', 'cat', 'spot', 'price', 'rating', 'sort', 'desc', 'page'].forEach((key) =>
      params.delete(key)
    );
    setSearchParams(params, { replace: true });
  }, [setSearchParams, searchParams]);

  const isAnyFilterActive =
    filters.category !== 'all' ||
    filters.productType !== 'all' ||
    filters.spot !== 'all' ||
    filters.priceRange !== 'all' ||
    filters.rating !== 'all' ||
    !filters.searchInDescription ||
    Boolean(filters.keyword.trim());

  return {
    filters,
    handleSearch,
    handleChangeFilter,
    handleApplyAdvanced,
    handlePageChange,
    handleSortChange,
    handleResetFilters,
    isAnyFilterActive,
  };
};
