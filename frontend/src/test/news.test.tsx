import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  adaptNewsItem,
  adaptNewsDetail,
  adaptNewsListResponse,
  isWithin24Hours,
} from '../api/adapters';
import { hasNewerArticles } from '../api/news';
import { NewsListPage } from '../pages/NewsListPage';
import { NewsDetailPage } from '../pages/NewsDetailPage';
import { HomeNewsSection } from '../components/sections/HomeNewsSection';
import { SafeMarkdown } from '../components/news/SafeMarkdown';
import { NewsMeta } from '../components/news/NewsMeta';
import { NewsItem } from '../types/domain';

describe('News Feature Tests (Tin tức)', () => {
  describe('1. Adapters & Data Normalization', () => {
    it('handles empty/undefined raw input gracefully with safe defaults', () => {
      const adapted = adaptNewsItem({});

      expect(adapted.id).toBeDefined();
      expect(adapted.title).toBe('');
      expect(adapted.slug).toBeDefined();
      expect(adapted.category).toBe('diem-den'); // fallback category
      expect(adapted.summary).toBe('');
      expect(adapted.coverImageUrl).toBeNull();
      expect(adapted.coverImageAlt).toBe('Hình ảnh bài viết');
      expect(adapted.imageCredit).toBeNull();
      expect(adapted.readingMinutes).toBe(3); // default minimum reading time
      expect(adapted.audioUrl).toBeNull();
      expect(adapted.relatedPoiSlugs).toEqual([]);
      expect(adapted.isNew).toBe(true); // default nowMs falls in 48h
    });

    it('cleans up null, undefined and partial fields to prevent "undefined" in UI', () => {
      const adapted = adaptNewsItem({
        id: 'news-99',
        title: '   Tiêu đề bài viết   ',
        category: 'invalid-category',
        summary: 'Tóm tắt nội dung',
        coverImageUrl: null,
        coverImageAlt: '',
        imageCredit: undefined,
        readingMinutes: -5,
        audioUrl: '',
        relatedPoiSlugs: ['dinh-doc-lap', '', null as unknown as string],
      });

      expect(adapted.id).toBe('news-99');
      expect(adapted.title).toBe('Tiêu đề bài viết');
      expect(adapted.category).toBe('diem-den'); // fallback
      expect(adapted.coverImageUrl).toBeNull();
      expect(adapted.coverImageAlt).toBe('Tiêu đề bài viết'); // fallback to title
      expect(adapted.imageCredit).toBeNull();
      expect(adapted.readingMinutes).toBe(3); // normalized positive number
      expect(adapted.audioUrl).toBeNull();
      expect(adapted.relatedPoiSlugs).toEqual(['dinh-doc-lap']); // filtered falsy values
    });

    it('correctly computes isNew flag within 48h vs older', () => {
      const now = 1700000000000;
      const recent = new Date(now - 2 * 3600 * 1000).toISOString(); // 2 hours ago
      const older = new Date(now - 60 * 3600 * 1000).toISOString(); // 60 hours ago (>48h)

      expect(isWithin24Hours(recent, now)).toBe(true);
      expect(isWithin24Hours(older, now)).toBe(false);

      const recentItem = adaptNewsItem({ publishedAt: recent }, now);
      const olderItem = adaptNewsItem({ publishedAt: older }, now);

      expect(recentItem.isNew).toBe(true);
      expect(olderItem.isNew).toBe(false);
    });

    it('adaptNewsDetail fills default content string', () => {
      const detail = adaptNewsDetail({
        id: '1',
        title: 'Bài viết chi tiết',
      });
      expect(detail.content).toBe('');
      expect(detail.id).toBe('1');
    });

    it('adaptNewsListResponse handles empty list and announcement', () => {
      const resp = adaptNewsListResponse({
        items: [],
        announcement: '   Thông báo quan trọng   ',
      });
      expect(resp.items).toEqual([]);
      expect(resp.announcement).toBe('Thông báo quan trọng');

      const nullAnn = adaptNewsListResponse({ items: undefined, announcement: null });
      expect(nullAnn.items).toEqual([]);
      expect(nullAnn.announcement).toBeNull();
    });
  });

  describe('2. Near-Real-Time Freshness & Pill Logic', () => {
    it('detects when incoming articles have new IDs or newer dates', () => {
      const currentList: NewsItem[] = [
        adaptNewsItem({ id: '1', publishedAt: new Date(1000).toISOString() }),
        adaptNewsItem({ id: '2', publishedAt: new Date(2000).toISOString() }),
      ];

      // Same list -> no new articles
      expect(hasNewerArticles(currentList, currentList)).toBe(false);

      // Incoming has new article id '3'
      const withNewId: NewsItem[] = [
        adaptNewsItem({ id: '3', publishedAt: new Date(3000).toISOString() }),
        ...currentList,
      ];
      expect(hasNewerArticles(withNewId, currentList)).toBe(true);

      // Incoming has newer published date
      const withNewerDate: NewsItem[] = [
        adaptNewsItem({ id: '1', publishedAt: new Date(5000).toISOString() }),
        adaptNewsItem({ id: '2', publishedAt: new Date(2000).toISOString() }),
      ];
      expect(hasNewerArticles(withNewerDate, currentList)).toBe(true);
    });
  });

  describe('3. Safe Markdown Rendering', () => {
    it('renders safe headings, paragraphs, lists, and quotes', () => {
      const md = `### Tiêu đề phụ
Đây là một đoạn văn bản có **chữ đậm** và *chữ nghiêng* cùng [liên kết an toàn](/diem-du-lich).

> Đây là một trích dẫn sâu sắc

- Mục một
- Mục hai
1. Số một
2. Số hai`;

      const { container } = render(<SafeMarkdown content={md} />);

      expect(screen.getByText('Tiêu đề phụ')).toBeInTheDocument();
      expect(screen.getByText('chữ đậm')).toBeInTheDocument();
      expect(screen.getByText('chữ nghiêng')).toBeInTheDocument();

      const link = screen.getByRole('link', { name: 'liên kết an toàn' });
      expect(link).toHaveAttribute('href', '/diem-du-lich');

      expect(container.querySelector('blockquote')).toBeInTheDocument();
      expect(container.querySelectorAll('li')).toHaveLength(4);
    });

    it('does not execute or inject unsanitized HTML tags', () => {
      const dangerous = `<script>window.__hacked = true;</script><img src="x" onerror="alert(1)" />`;
      render(<SafeMarkdown content={dangerous} />);

      expect(document.querySelector('script[src="x"]')).not.toBeInTheDocument();
      expect((window as unknown as { __hacked?: boolean }).__hacked).toBeUndefined();
    });
  });

  describe('4. News List Page Layout (Hero + Sidebar + 4-col Grid)', () => {
    beforeEach(() => {
      (window as unknown as { __TEST_USE_4_ARTICLES?: boolean }).__TEST_USE_4_ARTICLES = false;
    });

    it('renders editorial newspaper layout (lead story, side items, and feed list) with zero duplicate articles', async () => {
      render(
        <MemoryRouter initialEntries={['/tin-tuc']}>
          <Routes>
            <Route path="/tin-tuc" element={<NewsListPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Header title & subtitle
      expect(await screen.findByRole('heading', { level: 1, name: /Tin tức/i })).toBeInTheDocument();
      expect(screen.getByText(/Cập nhật câu chuyện di sản, đời sống văn hóa/i)).toBeInTheDocument();

      // Filter tabs
      expect(screen.getByRole('button', { name: /Tất cả/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Điểm đến/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Văn hóa Sài Gòn/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mẹo tham quan/i })).toBeInTheDocument();

      // Top block (lead story and side items)
      expect(await screen.findByRole('region', { name: 'Bài viết tiêu điểm' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Tin nổi bật khác' })).toBeInTheDocument();

      // Feed list below
      expect(screen.getByRole('region', { name: 'Danh sách bài viết' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Mới nhất/i })).toBeInTheDocument();

      // Verify all cards have links pointing to reading pages (/tin-tuc/:slug)
      const storyLinks = screen.getAllByRole('link').filter((link) => {
        const href = link.getAttribute('href') || '';
        return href.startsWith('/tin-tuc/') && href !== '/tin-tuc';
      });
      expect(storyLinks.length).toBeGreaterThan(0);

      // Verify no duplicate articles rendered on the page
      const hrefs = storyLinks.map((l) => l.getAttribute('href'));
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
    });

    it('filters by category chip (?c=diem-den) and syncs URL', async () => {
      (window as unknown as { __TEST_USE_4_ARTICLES?: boolean }).__TEST_USE_4_ARTICLES = false;

      render(
        <MemoryRouter initialEntries={['/tin-tuc?c=diem-den']}>
          <Routes>
            <Route path="/tin-tuc" element={<NewsListPage />} />
          </Routes>
        </MemoryRouter>
      );

      const filterBar = await screen.findByText(/Đang lọc theo:/i);
      expect(filterBar).toBeInTheDocument();
      expect(filterBar).toHaveTextContent('Điểm đến');
      const activeChip = screen.getByRole('button', { name: /Điểm đến/i });
      expect(activeChip).toHaveClass('is-active');
    });

    it('filters by POI chip (?poi=dinh-doc-lap)', async () => {
      (window as unknown as { __TEST_USE_4_ARTICLES?: boolean }).__TEST_USE_4_ARTICLES = false;

      render(
        <MemoryRouter initialEntries={['/tin-tuc?poi=dinh-doc-lap']}>
          <Routes>
            <Route path="/tin-tuc" element={<NewsListPage />} />
          </Routes>
        </MemoryRouter>
      );

      const filterBar = await screen.findByText(/Đang lọc theo:/i);
      expect(filterBar).toBeInTheDocument();
      expect(screen.getByText(/#dinh-doc-lap/i)).toBeInTheDocument();
    });
  });

  describe('5. Article Reading Page (/tin-tuc/:slug)', () => {
    it('renders reading page with breadcrumb, serif H1, and a real external source link', async () => {
      render(
        <MemoryRouter initialEntries={['/tin-tuc/ao-dai-qua-hon-100-nam']}>
          <Routes>
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      // 1. Breadcrumb: Trang chủ › Tin tức › Category
      expect(await screen.findByRole('link', { name: 'Trang chủ' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tin tức' })).toBeInTheDocument();

      // 2. Article Title H1
      const title = screen.getByRole('heading', {
        level: 1,
        name: 'Áo dài Việt Nam: Hành trình hơn một thế kỷ của tà áo dân tộc',
      });
      expect(title).toBeInTheDocument();

      // 3. Primary button linking to the real external source (new tab, safe rel)
      const originalLink = screen.getByRole('link', { name: /Đọc tại VnExpress/i });
      expect(originalLink).toBeInTheDocument();
      expect(originalLink).toHaveAttribute(
        'href',
        'https://vnexpress.net/ao-dai-qua-hon-100-nam-4122267.html'
      );
      expect(originalLink).toHaveAttribute('target', '_blank');
      expect(originalLink).toHaveAttribute('rel', 'noopener noreferrer');

      // 5. Back-to-list link keeping filter
      expect(screen.getByRole('link', { name: /Quay lại danh sách Tin tức/i })).toHaveAttribute(
        'href',
        '/tin-tuc?category=trang-phuc'
      );

      // 6. Related stories (3 articles)
      expect(screen.getByRole('region', { name: 'Bài viết liên quan' })).toBeInTheDocument();
    });

    it('omits the external-link button for internal-only articles (no dead source link)', async () => {
      render(
        <MemoryRouter initialEntries={['/tin-tuc/dinh-doc-lap-nhung-can-phong-it-nguoi-de-y']}>
          <Routes>
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await screen.findByRole('heading', {
        level: 1,
        name: 'Dinh Độc Lập: Những căn phòng và dấu ấn lịch sử ít người để ý',
      });

      expect(screen.queryByRole('link', { name: /Đọc tại|Đọc bài gốc/i })).not.toBeInTheDocument();
    });

    it('shows friendly not-found state when slug is unknown', async () => {
      render(
        <MemoryRouter initialEntries={['/tin-tuc/unknown-article-slug-xyz']}>
          <Routes>
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'Không tìm thấy bài viết' },
          { timeout: 4000 }
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Quay lại Tin tức/i })).toHaveAttribute('href', '/tin-tuc');
    });
  });

  describe('6. Home Page News Section Integration', () => {
    it('renders HomeNewsSection using shared data layer with zero internal duplicates', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomeNewsSection />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for content to finish loading
      const viewAllLink = await screen.findByRole('link', { name: /Xem tất cả tin tức/i });
      expect(viewAllLink).toHaveAttribute('href', '/tin-tuc');

      // Section title
      expect(screen.getByRole('heading', { level: 2, name: /Tin tức & Câu chuyện Sài Gòn/i })).toBeInTheDocument();

      // Compact home row: at most 3 article cards, all linking to /tin-tuc/:slug
      const cardLinks = screen.getAllByRole('link').filter((l) => {
        const href = l.getAttribute('href') || '';
        return href.startsWith('/tin-tuc/') && href !== '/tin-tuc';
      });
      expect(cardLinks.length).toBeGreaterThan(0);
      expect(cardLinks.length).toBeLessThanOrEqual(3);

      // Verify no duplicate articles rendered anywhere on the home section
      const hrefs = cardLinks.map((l) => l.getAttribute('href'));
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
    });
  });

  describe('7. Newspaper Redesign Regressions & Meta Separator Checks', () => {
    it('renders meta line with no trailing separator when readingTime is missing or empty', () => {
      const { container } = render(
        <NewsMeta
          category={{ label: 'Điểm đến' }}
          formattedDate="14/10/2026"
          readingTime=""
        />
      );

      expect(screen.getByText('Điểm đến')).toBeInTheDocument();
      expect(screen.getByText('14/10/2026')).toBeInTheDocument();

      const metaParts = container.querySelectorAll('.nl-meta-part');
      expect(metaParts.length).toBe(2);

      // Part 0: Category (no separator)
      expect(metaParts[0]?.querySelector('.nl-meta-sep')).toBeNull();

      // Part 1: Date (no separator at all)
      expect(metaParts[1]?.querySelector('.nl-meta-sep')).toBeNull();
      expect(metaParts[1]?.textContent).toBe('14/10/2026');

      // Check that there is no trailing separator element or reading time
      const lastElement = container.querySelector('.nl-meta')?.lastElementChild;
      expect(lastElement?.classList.contains('nl-meta-sep')).toBe(false);
      expect(container.querySelector('.nl-meta-read')).toBeNull();
    });

    it('renders news detail page with no element having the old MOI badge class or dot', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/tin-tuc/dinh-doc-lap-nhung-can-phong-it-nguoi-de-y']}>
          <Routes>
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await screen.findByRole('heading', {
        level: 1,
        name: 'Dinh Độc Lập: Những căn phòng và dấu ấn lịch sử ít người để ý',
      });

      // Verify no old pill, badge, or colored dot elements exist
      expect(container.querySelector('.story-new-badge')).toBeNull();
      expect(container.querySelector('.story-cat-dot')).toBeNull();
      expect(container.querySelector('.story-cat-badge')).toBeNull();
    });
  });

  describe('8. External source card behavior', () => {
    it('renders external articles as new-tab links to the real publisher (whole card)', async () => {
      render(
        <MemoryRouter initialEntries={['/tin-tuc?c=trang-phuc']}>
          <Routes>
            <Route path="/tin-tuc" element={<NewsListPage />} />
          </Routes>
        </MemoryRouter>
      );

      await screen.findByRole('heading', { level: 2, name: /Áo dài Việt Nam/i });

      const extLinks = screen.getAllByRole('link', { name: /mở bài gốc tại/i });
      expect(extLinks.length).toBe(4); // lead + 3 side items for trang-phuc
      extLinks.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      });

      // No in-site reading link is produced for those external-only cards
      const internalForCat = screen
        .getAllByRole('link')
        .map((l) => l.getAttribute('href') || '')
        .filter((href) => href.startsWith('/tin-tuc/'));
      expect(internalForCat).toHaveLength(0);
    });

    it('keeps internal-only articles as in-site reading links', async () => {
      render(
        <MemoryRouter initialEntries={['/tin-tuc?c=diem-den']}>
          <Routes>
            <Route path="/tin-tuc" element={<NewsListPage />} />
          </Routes>
        </MemoryRouter>
      );

      await screen.findByRole('heading', { level: 2, name: /Dinh Độc Lập/i });

      const internalLinks = screen
        .getAllByRole('link')
        .filter((link) => (link.getAttribute('href') || '').startsWith('/tin-tuc/'));
      expect(internalLinks.length).toBeGreaterThan(0);
      expect(screen.queryByRole('link', { name: /mở bài gốc tại/i })).toBeNull();
    });
  });
});
