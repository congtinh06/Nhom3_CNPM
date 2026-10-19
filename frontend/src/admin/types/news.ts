export type NewsCategoryValue =
  | 'diem-den'
  | 'van-hoa'
  | 'meo-tham-quan'
  | 'trang-phuc'
  | 've-dep';

export interface NewsArticle {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary?: string | null;
  excerpt?: string | null;
  content?: string | null;
  coverImageUrl?: string | null;
  thumbnail?: string | null;
  coverImageAlt?: string | null;
  imageCredit?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  externalUrl?: string | null;
  tags?: string[];
  relatedPoiSlugs?: string[];
  readingMinutes?: number | null;
  readingTime?: number | null;
  audioUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateNewsArticleInput {
  title: string;
  slug?: string;
  category: string;
  summary?: string;
  content?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  imageCredit?: string;
  source?: string;
  sourceUrl?: string;
  externalUrl?: string;
  tags?: string[];
  relatedPoiSlugs?: string[];
  readingMinutes?: number;
  audioUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  publishedAt?: string | null;
}

export type UpdateNewsArticleInput = CreateNewsArticleInput;

export interface NewsQueryParams {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sort?: string;
}

export interface NewsPageResponse {
  content: NewsArticle[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
