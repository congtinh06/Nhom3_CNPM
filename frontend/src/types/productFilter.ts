export type ProductTypeFilter = 'all' | 'FOOD' | 'DRINK' | 'SOUVENIR';

export type CategoryFilterKey =
  | 'all'
  | 'mon-an'
  | 'mon-an-vat'
  | 'dac-san'
  | 'ca-phe'
  | 'tra'
  | 'nuoc-giai-khat'
  | 'sinh-to';

export type PriceRangeFilter =
  | 'all'
  | 'under-50k'
  | '50k-100k'
  | '100k-200k'
  | 'above-200k';

export type RatingFilter = 'all' | '5' | '4' | '3';

// Điểm du lịch gắn với sản phẩm: 'all' hoặc slug của một trong 7 điểm.
export type SpotFilterKey = 'all' | (string & {});

export type SortOptionKey = 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';

export interface ProductFilterState {
  keyword: string;
  productType: ProductTypeFilter;
  category: CategoryFilterKey;
  spot: SpotFilterKey;
  priceRange: PriceRangeFilter;
  rating: RatingFilter;
  sortBy: SortOptionKey;
  searchInDescription: boolean;
  page: number;
}

export type AdvancedSearchValues = Partial<
  Pick<
    ProductFilterState,
    'keyword' | 'productType' | 'category' | 'priceRange' | 'rating' | 'sortBy' | 'searchInDescription'
  >
>;
