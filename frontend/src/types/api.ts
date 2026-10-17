/**
 * Types as returned by the Backend API for News / Tin tức
 * Draft contract:
 * GET /api/content/news?category=&limit=&lang= -> { items: ApiNewsListItem[], announcement?: string }
 * GET /api/content/news/{slug} -> ApiNewsDetail
 */

export type ApiNewsCategory =
  | 'diem-den'
  | 'van-hoa'
  | 'meo-tham-quan'
  | 'trang-phuc'
  | 've-dep';

export interface ApiNewsListItem {
  id: string | number;
  slug: string;
  title: string;
  category: ApiNewsCategory | string;
  summary: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  imageCredit?: string | null;
  publishedAt: string; // ISO string
  readingMinutes: number;
  audioUrl?: string | null;
  relatedPoiSlugs?: string[];
  source?: string;
  sourceUrl?: string;
  externalUrl?: string | null;
  thumbnail?: string | null;
  excerpt?: string;
  tags?: string[];
  readingTime?: number;
}

export interface ApiNewsListResponse {
  items: ApiNewsListItem[];
  announcement?: string | null;
}

export interface ApiNewsDetail extends ApiNewsListItem {
  content: string; // markdown format
}
