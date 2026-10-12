import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useNewsListQuery } from '../api/news';
import { NewsCategory, NEWS_CATEGORIES } from '../types/domain';
import { StoryCard } from '../components/news/StoryCard';
import { useSpeechAudio } from '../hooks/useSpeechAudio';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useNavbarLanguage } from '../content/languages';
import { tNews } from '../content/newsI18n';
import '../styles/news.css';

interface CategoryFilterOption {
  key: string;
  label: string;
  dotColor?: string;
}

const CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'diem-den', label: 'Điểm đến', dotColor: NEWS_CATEGORIES['diem-den'].hex },
  { key: 'van-hoa', label: 'Văn hóa Sài Gòn', dotColor: NEWS_CATEGORIES['van-hoa'].hex },
  { key: 'meo-tham-quan', label: 'Mẹo tham quan', dotColor: NEWS_CATEGORIES['meo-tham-quan'].hex },
];

export const NewsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useNavbarLanguage();
  const { activeId, toggleSpeech } = useSpeechAudio();

  useDocumentMeta(
    'Tin tức & Câu chuyện Di sản Sài Gòn',
    'Khám phá câu chuyện lịch sử, nếp sống văn hóa và cẩm nang du lịch trải nghiệm tại Thành phố Hồ Chí Minh.'
  );

  // URL query params: ?c=diem-den & ?poi=dinh-doc-lap
  const categoryParam = searchParams.get('c') || searchParams.get('category') || 'all';
  const poiParam = searchParams.get('poi') || '';

  // Freshness query hook
  const {
    displayedData,
    hasNewArticles,
    applyNewArticles,
    isLoading,
    isError,
    error,
    refetch,
  } = useNewsListQuery({
    lang,
  });

  const allItems = useMemo(() => displayedData?.items ?? [], [displayedData]);

  // Filter items by category & poi
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (categoryParam !== 'all') {
      list = list.filter((item) => item.category === categoryParam);
    }
    if (poiParam) {
      list = list.filter((item) => item.relatedPoiSlugs?.includes(poiParam));
    }
    return list;
  }, [allItems, categoryParam, poiParam]);

  // Sort newest-first (strict descending order by publishedAt)
  const sortedFilteredItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return timeB - timeA;
    });
  }, [filteredItems]);

  // Category change handler
  const handleSelectCategory = (catKey: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catKey === 'all') {
      nextParams.delete('c');
      nextParams.delete('category');
    } else {
      nextParams.set('c', catKey);
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const activeCategoryLabel = useMemo(() => {
    if (categoryParam === 'all') return 'Tất cả';
    return NEWS_CATEGORIES[categoryParam as NewsCategory]?.label || categoryParam;
  }, [categoryParam]);

  // Exact single-placement distribution (each article appears exactly ONCE):
  // 1. Hero: newest article of current filter (1)
  // 2. "MỚI NHẤT" sidebar: next 4
  // 3. "BẠN CÓ THỂ BỎ LỠ" sidebar: next 3
  // 4. 4-column grid: all remaining articles
  const heroArticle = sortedFilteredItems[0] || null;
  const latestSidebarArticles = sortedFilteredItems.slice(1, 5);
  const missedSidebarArticles = sortedFilteredItems.slice(5, 8);
  const gridArticles = sortedFilteredItems.slice(8);

  const handleSpeakItem = (item: (typeof allItems)[0]) => {
    toggleSpeech(item.id, `${item.title}. ${item.excerpt || item.summary || ''}`);
  };

  return (
    <div className="news-page-root news-classic-page-root">
      <main className="news-container news-main-flow" id="news-main-content">
        {/* ==================================================================
            PAGE HEADER: title, description, filter chips, filter status line
            ================================================================== */}
        <header className="news-header-block" id="news-header">
          <h1 className="news-title">Tin tức</h1>
          <p className="news-subtitle">
            Cập nhật câu chuyện di sản, đời sống văn hóa và cẩm nang khám phá Sài Gòn.
          </p>

          {/* Near-real-time freshness pill */}
          {hasNewArticles && (
            <div className="news-freshness-row">
              <button
                type="button"
                className="news-freshness-btn"
                onClick={applyNewArticles}
                aria-label="Tải lại danh sách với bài viết mới"
              >
                <RefreshCw size={13} className="news-freshness-icon" />
                <span>{tNews(lang, 'newPill')}</span>
              </button>
            </div>
          )}

          {/* Filter Chips: Tất cả / Điểm đến / Văn hóa Sài Gòn / Mẹo tham quan */}
          <nav className="news-chips-nav" aria-label="Lọc theo chuyên mục tin tức">
            <div className="news-chips-row">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = categoryParam === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={`news-chip ${isActive ? 'is-active' : ''} ${
                      opt.key === 'all' ? 'is-all' : ''
                    }`}
                    onClick={() => handleSelectCategory(opt.key)}
                    aria-pressed={isActive}
                    style={
                      isActive && opt.dotColor
                        ? { borderColor: opt.dotColor }
                        : undefined
                    }
                  >
                    {opt.dotColor && (
                      <span
                        className="news-chip-dot"
                        style={{ backgroundColor: opt.dotColor }}
                        aria-hidden="true"
                      />
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Filter Active indicator */}
          {(categoryParam !== 'all' || poiParam) && (
            <div className="news-filter-active-line">
              <span>
                Đang lọc theo: <strong>{activeCategoryLabel}</strong>
                {poiParam ? ` (#${poiParam})` : ''} ({sortedFilteredItems.length} bài viết)
              </span>
              <span className="news-filter-sep" aria-hidden="true">·</span>
              <button
                type="button"
                className="news-filter-clear-link"
                onClick={handleClearFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </header>

        {/* Loading state skeleton */}
        {isLoading && (
          <div className="news-skeleton-wrap" aria-busy="true" aria-label="Đang tải tin tức">
            <div className="news-skeleton-featured" />
            <div className="news-skeleton-grid">
              <div className="news-skeleton-card" />
              <div className="news-skeleton-card" />
              <div className="news-skeleton-card" />
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="news-state-box news-state-error" role="alert">
            <h2 className="news-state-title">Không thể tải tin tức</h2>
            <p className="news-state-desc">
              {error?.message || tNews(lang, 'errorLoad')}
            </p>
            <button
              type="button"
              className="news-btn-primary"
              onClick={() => refetch()}
            >
              {tNews(lang, 'retry')}
            </button>
          </div>
        )}

        {/* Empty filter state */}
        {!isLoading && !isError && sortedFilteredItems.length === 0 && (
          <div className="news-state-box news-state-empty">
            <h2 className="news-state-title">Chưa có bài viết phù hợp</h2>
            <p className="news-state-desc">
              {poiParam
                ? 'Không có bài viết nào liên kết với điểm tham quan này.'
                : tNews(lang, 'emptyFilterMessage')}
            </p>
            <button
              type="button"
              className="news-btn-primary"
              onClick={handleClearFilters}
            >
              {tNews(lang, 'seeAll')}
            </button>
          </div>
        )}

        {/* ==================================================================
            MAIN LAYOUT: Hero (Left) + Sidebar (Right: MỚI NHẤT & BẠN CÓ THỂ BỎ LỠ)
            ================================================================== */}
        {!isLoading && !isError && heroArticle && (
          <div className="news-hero-sidebar-layout">
            {/* 1. HERO: newest article of current filter */}
            <section className="news-hero-main-column" aria-label="Bài viết tiêu điểm">
              <StoryCard
                item={heroArticle}
                variant="featured"
                lang={lang}
                isFeaturedEager={true}
                isSpeaking={activeId === heroArticle.id}
                onToggleSpeech={handleSpeakItem}
              />
            </section>

            {/* 2. RIGHT SIDEBAR (sticky, thin lines, no striped separators) */}
            {(latestSidebarArticles.length > 0 || missedSidebarArticles.length > 0) && (
              <aside className="news-right-sidebar" aria-label="Tin mới và gợi ý">
                {/* Block A: MỚI NHẤT (next 4) */}
                {latestSidebarArticles.length > 0 && (
                  <section className="news-sidebar-block" aria-label="Mới nhất">
                    <h2 className="news-sidebar-title">MỚI NHẤT</h2>
                    <div className="news-sidebar-list">
                      {latestSidebarArticles.map((item) => (
                        <StoryCard
                          key={item.id}
                          item={item}
                          variant="sidebar"
                          lang={lang}
                          isSpeaking={activeId === item.id}
                          onToggleSpeech={handleSpeakItem}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Block B: BẠN CÓ THỂ BỎ LỠ (next 3) */}
                {missedSidebarArticles.length > 0 && (
                  <section className="news-sidebar-block" aria-label="Bạn có thể bỏ lỡ">
                    <h2 className="news-sidebar-title">BẠN CÓ THỂ BỎ LỠ</h2>
                    <div className="news-sidebar-list">
                      {missedSidebarArticles.map((item) => (
                        <StoryCard
                          key={item.id}
                          item={item}
                          variant="sidebar"
                          lang={lang}
                          isSpeaking={activeId === item.id}
                          onToggleSpeech={handleSpeakItem}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            )}
          </div>
        )}

        {/* ==================================================================
            4-COLUMN GRID: all remaining articles (equal height, pinned footer)
            ================================================================== */}
        {!isLoading && !isError && gridArticles.length > 0 && (
          <section className="news-grid-section" aria-label="Danh sách bài viết">
            <div className="news-cards-grid news-cards-grid-4col">
              {gridArticles.map((item) => (
                <StoryCard
                  key={item.id}
                  item={item}
                  variant="grid"
                  lang={lang}
                  isSpeaking={activeId === item.id}
                  onToggleSpeech={handleSpeakItem}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default NewsListPage;
