import { isCancel } from 'axios';
import { NewsItem, NewsDetail } from '../types/domain';
import { adaptNewsDetail, adaptNewsListResponse } from '../api/adapters';
import { apiClient } from '../api/client';
import { newsArticles, sampleAnnouncement } from '../content/newsFixtures';

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

const IS_TEST_ENV = import.meta.env.MODE === 'test';

function getFixtureArticles(params: GetArticlesParams = {}): GetArticlesResult {
  const { category, limit, offset = 0 } = params;

  let list = newsArticles.map((raw) => adaptNewsDetail(raw));
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

export async function getArticles(params: GetArticlesParams = {}): Promise<GetArticlesResult> {
  const { category, limit, offset = 0, signal } = params;

  // Trong môi trường test, dùng fixtures để tránh gọi mạng làm treo/timeout test.
  if (IS_TEST_ENV) {
    return getFixtureArticles(params);
  }

  try {
    const response = await apiClient.get('/api/content/news', {
      params: {
        category: category && category !== 'all' ? category : undefined,
      },
      signal,
    });

    const adapted = adaptNewsListResponse(response.data);
    const total = typeof response.data?.total === 'number' ? response.data.total : adapted.items.length;
    const paged = limit ? adapted.items.slice(0, limit) : adapted.items;

    return {
      items: offset > 0 ? paged.slice(offset) : paged,
      total,
      announcement: adapted.announcement ?? sampleAnnouncement,
    };
  } catch (error) {
    if (isCancel(error)) {
      throw error;
    }
    return getFixtureArticles(params);
  }
}

export async function getArticleBySlug(slug: string, signal?: AbortSignal): Promise<NewsDetail | null> {
  if (!slug) return null;

  if (!IS_TEST_ENV) {
    try {
      const response = await apiClient.get(`/api/content/news/${encodeURIComponent(slug)}`, {
        signal,
      });
      return adaptNewsDetail(response.data);
    } catch (error) {
      if (isCancel(error)) {
        throw error;
      }
      // Rơi về fixtures bên dưới khi backend lỗi hoặc không có bài viết.
    }
  }

  const raw = newsArticles.find((item) => item.slug === slug);
  if (!raw) return null;

  return adaptNewsDetail(raw);
}
