import { isCancel } from 'axios';
import { NewsItem, NewsDetail } from '../types/domain';
import { adaptNewsDetail, adaptNewsListResponse } from '../api/adapters';
import { apiClient } from '../api/client';
import { newsArticles, sampleAnnouncement } from '../content/newsFixtures';
import { DEMO_FIXTURES_ENABLED } from '../config/demoMode';

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

  // Chế độ test/demo: dùng fixtures để tránh gọi mạng.
  if (DEMO_FIXTURES_ENABLED) {
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
      announcement: adapted.announcement ?? (DEMO_FIXTURES_ENABLED ? sampleAnnouncement : null),
    };
  } catch (error) {
    if (isCancel(error)) {
      throw error;
    }
    if (DEMO_FIXTURES_ENABLED) {
      return getFixtureArticles(params);
    }
    // Bản build thật: để trang hiển thị lỗi thay vì thay bằng dữ liệu mẫu.
    throw error;
  }
}

export async function getArticleBySlug(slug: string, signal?: AbortSignal): Promise<NewsDetail | null> {
  if (!slug) return null;

  if (!DEMO_FIXTURES_ENABLED) {
    try {
      const response = await apiClient.get(`/api/content/news/${encodeURIComponent(slug)}`, {
        signal,
      });
      return adaptNewsDetail(response.data);
    } catch (error) {
      // Bản build thật: lỗi API phải hiện ra, không thay bằng bài mẫu.
      throw error;
    }
  }

  const raw = newsArticles.find((item) => item.slug === slug);
  if (!raw) return null;

  return adaptNewsDetail(raw);
}
