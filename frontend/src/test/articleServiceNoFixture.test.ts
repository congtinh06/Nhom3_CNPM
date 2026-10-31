import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../api/client', () => ({
  apiClient: { get: getMock },
}));

// Bản build thật: không bật dữ liệu mẫu.
vi.mock('../config/demoMode', () => ({ DEMO_FIXTURES_ENABLED: false }));

import { getArticles, getArticleBySlug } from '../services/articleService';

describe('articleService without demo fixtures', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('throws when the news list API fails instead of returning sample articles', async () => {
    getMock.mockRejectedValue(new Error('network down'));

    await expect(getArticles({ limit: 10 })).rejects.toThrow('network down');
  });

  it('throws when the news detail API fails instead of returning a sample article', async () => {
    getMock.mockRejectedValue(new Error('network down'));

    await expect(getArticleBySlug('nha-tho-duc-ba')).rejects.toThrow('network down');
  });

  it('returns API data and does not inject the sample announcement', async () => {
    getMock.mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            title: 'Bài viết thật',
            slug: 'bai-viet-that',
            category: 'diem-den',
            summary: 'Tóm tắt',
            content: 'Nội dung',
          },
        ],
        total: 1,
      },
    });

    const result = await getArticles();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Bài viết thật');
    expect(result.announcement).toBeNull();
  });
});
