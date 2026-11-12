export type ProductCategory = 'FOOD' | 'DRINK' | 'SOUVENIR';

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: ProductCategory;
  shortDescription?: string | null;
  description?: string | null;
  price: number;
  imagePath?: string | null;
  rating?: number;
  reviewsCount?: number;
  poiId?: number | null;
  poiSlug?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  category: ProductCategory;
  shortDescription?: string;
  description?: string;
  price: number;
  imagePath?: string;
  poiId?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateProductInput {
  name: string;
  slug?: string;
  category: ProductCategory;
  shortDescription?: string;
  description?: string;
  price: number;
  imagePath?: string;
  poiId?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductQueryParams {
  page?: number;
  size?: number;
  search?: string;
  category?: ProductCategory;
  isActive?: boolean;
  sort?: string;
}

export interface ProductPageResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
