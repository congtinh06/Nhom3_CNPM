import { NewsItem, NewsDetail } from '../types/domain';
import { adaptNewsDetail } from '../api/adapters';
import { thirteenNewsArticles, sampleAnnouncement } from '../content/newsFixtures';

export interface GetArticlesParams {
  category?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export interface GetArticlesResult {
  items: NewsItem[];
  total: number;
  announcement?: string | null;
}

export async function getArticles(params: GetArticlesParams = {}): Promise<GetArticlesResult> {
  const { category, limit, offset = 0 } = params;

  let list = thirteenNewsArticles.map((raw) => adaptNewsDetail(raw));
  if (category && category !== 'all') {
    list = list.filter((item) => item.category === category);
  }
  const total = list.length;
  const paged = limit ? list.slice(offset, offset + limit) : list.slice(offset);

  return {
    items: paged,
    total,
    announcement: sampleAnnouncement,
  };
}

export async function getArticleBySlug(slug: string, _signal?: AbortSignal): Promise<NewsDetail | null> {
  if (!slug) return null;

  const raw = thirteenNewsArticles.find((item) => item.slug === slug);
  if (!raw) return null;

  return adaptNewsDetail(raw);
}

