/**
 * Clean domain types used across the News and Home UI layers
 * Adapters guarantee that required fields are always present with safe fallbacks.
 */

export type NewsCategory =
  | 'diem-den'
  | 'van-hoa'
  | 'meo-tham-quan'
  | 'trang-phuc'
  | 've-dep';

export interface NewsItem {
  id: string; // Hash of URL
  slug: string;
  title: string;
  source: string;
  sourceUrl: string;
  externalUrl: string | null; // Real link to the original/source article, null when internal-only
  publishedAt: string; // ISO string
  thumbnail: string | null; // RSS media or og:image
  coverImageUrl?: string | null; // Alias for thumbnail
  coverImageAlt?: string;
  imageCredit?: string | null;
  excerpt: string;
  summary?: string; // Alias for excerpt
  category: NewsCategory;
  tags: string[]; // Max 2 tags
  readingTime: number; // In minutes
  readingMinutes?: number; // Alias for readingTime
  audioUrl?: string | null;
  relatedPoiSlugs: string[];
  isNew: boolean; // Published within 48 hours
}

export interface NewsDetail extends NewsItem {
  content: string; // Safe content or summary
}

export interface NewsListDomain {
  items: NewsItem[];
  announcement: string | null;
}

export interface NewsCategoryMeta {
  key: NewsCategory;
  label: string;
  cssVar: string;
  hex: string;
}

export const NEWS_CATEGORIES: Record<NewsCategory, NewsCategoryMeta> = {
  'diem-den': {
    key: 'diem-den',
    label: 'Điểm đến',
    cssVar: '--cat-diem-den',
    hex: '#8A2F12', // Deep terracotta brown (contrast >= 6:1 on cream)
  },
  'van-hoa': {
    key: 'van-hoa',
    label: 'Văn hóa Sài Gòn',
    cssVar: '--cat-van-hoa',
    hex: '#135A4B', // Deep teal green (contrast >= 6:1 on cream)
  },
  'meo-tham-quan': {
    key: 'meo-tham-quan',
    label: 'Mẹo tham quan',
    cssVar: '--cat-meo-tham-quan',
    hex: '#8A5200', // Deep ochre (contrast >= 5.4:1 on cream)
  },
  'trang-phuc': {
    key: 'trang-phuc',
    label: 'Trang phục truyền thống',
    cssVar: '--cat-trang-phuc',
    hex: '#8A1F5C', // Deep magenta (contrast >= 6:1 on cream)
  },
  've-dep': {
    key: 've-dep',
    label: 'Vẻ đẹp Việt Nam',
    cssVar: '--cat-ve-dep',
    hex: '#0F5B7A', // Deep cyan-blue (contrast >= 6:1 on cream)
  },
};
