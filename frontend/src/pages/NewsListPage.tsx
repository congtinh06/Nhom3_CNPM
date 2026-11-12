import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, Search, X } from 'lucide-react';
import { useNewsListQuery } from '../api/news';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useNavbarLanguage } from '../content/languages';
import { tNews, NewsTranslation } from '../content/newsI18n';
import { getCategoryLabel } from '../components/news/newsFormatters';
import { NewsLeadStory } from '../components/news/NewsLeadStory';
import { NewsSideItem } from '../components/news/NewsSideItem';
import { NewsRow } from '../components/news/NewsRow';
import '../styles/news-list.css';

interface CategoryFilterOption {
  key: string;
  i18nKey: keyof NewsTranslation;
}

const FEED_PAGE_SIZE = 6;

const CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { key: 'all', i18nKey: 'categoryAll' },
  { key: 'diem-den', i18nKey: 'categoryDiemDen' },
  { key: 'van-hoa', i18nKey: 'categoryVanHoa' },
  { key: 'meo-tham-quan', i18nKey: 'categoryMeoThamQuan' },
  { key: 'trang-phuc', i18nKey: 'categoryTrangPhuc' },
  { key: 've-dep', i18nKey: 'categoryVeDep' },
];

const STOPS = [
  { name: 'Bảo tàng Chứng tích Chiến tranh', slug: 'bao-tang-chung-tich-chien-tranh' },
  { name: 'Nhà thờ Đức Bà Sài Gòn', slug: 'nha-tho-duc-ba' },
  { name: 'Chùa Bà Thiên Hậu', slug: 'chua-ba-thien-hau' },
  { name: 'Cầu Ba Son', slug: 'cau-ba-son' },
  { name: 'Bưu điện Trung tâm Sài Gòn', slug: 'buu-dien-trung-tam' },
  { name: 'Dinh Độc Lập', slug: 'dinh-doc-lap' },
  { name: 'Chợ Bến Thành', slug: 'cho-ben-thanh' },
];

const norm = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export const NewsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useNavbarLanguage();

  useDocumentMeta(
    'Tin tức & Câu chuyện Di sản Sài Gòn',
    'Khám phá câu chuyện lịch sử, nếp sống văn hóa và cẩm nang du lịch trải nghiệm tại Thành phố Hồ Chí Minh.'
  );

  const categoryParam = searchParams.get('c') || searchParams.get('category') || 'all';
  const poiParam = searchParams.get('poi') || '';
  const searchParam = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [currentPage, setCurrentPage] = useState(1);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryParam, poiParam, searchParam]);

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    for (const opt of CATEGORY_OPTIONS) {
      if (opt.key !== 'all') {
        counts[opt.key] = allItems.filter((it) => it.category === opt.key).length;
      }
    }
    return counts;
  }, [allItems]);

  const filteredItems = useMemo(() => {
    let list = allItems;
    if (categoryParam !== 'all') {
      list = list.filter((item) => item.category === categoryParam);
    }
    if (poiParam) {
      list = list.filter((item) => item.relatedPoiSlugs?.includes(poiParam));
    }
    if (searchQuery.trim()) {
      const qNorm = norm(searchQuery.trim());
      list = list.filter((item) => {
        const fullText = `${item.title} ${item.summary || ''} ${item.excerpt || ''}`;
        return norm(fullText).includes(qNorm);
      });
    }
    return list;
  }, [allItems, categoryParam, poiParam, searchQuery]);

  const sortedFilteredItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return timeB - timeA;
    });
  }, [filteredItems]);

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

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      nextParams.set('q', val.trim());
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    handleSearchChange('');
  };

  const handleSelectPoi = (slug: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('poi', slug);
    nextParams.delete('c');
    nextParams.delete('category');
    setSearchParams(nextParams);
    const mainEl = document.getElementById('news-main-content');
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    setSearchParams({});
    setSearchQuery('');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribeEmail.trim()) {
      setIsSubscribed(true);
      setSubscribeEmail('');
    }
  };

  const activeCategoryLabel = useMemo(() => {
    if (categoryParam === 'all') return tNews(lang, 'categoryAll');
    return getCategoryLabel(categoryParam, lang);
  }, [categoryParam, lang]);

  const heroArticle = sortedFilteredItems[0] || null;
  const sideArticles = sortedFilteredItems.slice(1, 4);
  const feedAll = sortedFilteredItems.slice(4);
  const totalPages = Math.ceil(feedAll.length / FEED_PAGE_SIZE);
  const feedArticles = feedAll.slice((currentPage - 1) * FEED_PAGE_SIZE, currentPage * FEED_PAGE_SIZE);

  return (
    <div className="nl-page-root">
      <div className="nl-wrap">
        <header className="nl-header">
          <div className="nl-header-inner">
            <h1 className="nl-header-title">{tNews(lang, 'pageTitle')}</h1>
            <p className="nl-header-subtitle">{tNews(lang, 'pageSubtitle')}</p>
          </div>
          <div className="nl-header-search">
            <label htmlFor="news-search-input" className="sr-only">
              Tìm bài viết
            </label>
            <div className="nl-search-box">
              <Search size={18} className="nl-search-icon" aria-hidden="true" />
              <input
                id="news-search-input"
                type="search"
                className="nl-search-input"
                placeholder="Tìm bài viết…"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nl-search-clear"
                  onClick={handleClearSearch}
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="nl-main" id="news-main-content">
          {hasNewArticles && (
            <div className="nl-freshness-row">
              <button
                type="button"
                className="nl-freshness-btn"
                onClick={applyNewArticles}
                aria-label="Tải lại danh sách với bài viết mới"
              >
                <RefreshCw size={13} className="nl-freshness-icon" />
                <span>{tNews(lang, 'newPill')}</span>
              </button>
            </div>
          )}

          <nav className="nl-nav" aria-label="Lọc theo chuyên mục tin tức">
            <div className="nl-tabs-row">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = categoryParam === opt.key;
                const count = categoryCounts[opt.key] ?? 0;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={isActive}
                    className={`nl-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSelectCategory(opt.key)}
                  >
                    <span>{tNews(lang, opt.i18nKey)}</span>
                    <span className="nl-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </nav>

        {(categoryParam !== 'all' || poiParam || searchQuery) && (
          <div className="nl-filter-status">
            <span>
              Đang lọc theo: <strong>{activeCategoryLabel}</strong>
              {poiParam ? ` (#${poiParam})` : ''}
              {searchQuery ? ` ("${searchQuery}")` : ''} ({sortedFilteredItems.length} bài viết)
            </span>
            <button
              type="button"
              className="nl-filter-clear-btn"
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {isLoading && (
          <div className="nl-skeleton-wrap" aria-busy="true" aria-label="Đang tải tin tức">
            <div className="nl-skeleton-lead" />
            <div className="nl-skeleton-row" />
            <div className="nl-skeleton-row" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="nl-state-box" role="alert">
            <h2 className="nl-state-title">Không thể tải tin tức</h2>
            <p className="nl-state-desc">
              {error?.message || tNews(lang, 'errorLoad')}
            </p>
            <button
              type="button"
              className="nl-btn-primary"
              onClick={() => refetch()}
            >
              {tNews(lang, 'retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && sortedFilteredItems.length === 0 && (
          <div className="nl-state-box">
            <h2 className="nl-state-title">Chưa có bài viết phù hợp</h2>
            <p className="nl-state-desc">
              {poiParam
                ? 'Không có bài viết nào liên kết với điểm tham quan này.'
                : tNews(lang, 'emptyFilterMessage')}
            </p>
            <button
              type="button"
              className="nl-btn-primary"
              onClick={handleClearFilters}
            >
              {tNews(lang, 'seeAll')}
            </button>
          </div>
        )}

        {!isLoading && !isError && heroArticle && (
          <div className="nl-top-block">
            <section className="nl-top-lead" aria-label="Bài viết tiêu điểm">
              <NewsLeadStory item={heroArticle} lang={lang} />
            </section>

            {sideArticles.length > 0 && (
              <section className="nl-top-side" aria-label="Tin nổi bật khác">
                <h2 className="nl-side-heading">Tin nổi bật</h2>
                <div className="nl-side-list">
                  {sideArticles.map((item) => (
                    <NewsSideItem key={item.id} item={item} lang={lang} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!isLoading && !isError && feedArticles.length > 0 && (
          <section id="news-feed-section" className="nl-feed-section" aria-label="Danh sách bài viết">
            <div className="nl-feed-header">
              <h2 className="nl-feed-title">Mới nhất</h2>
            </div>
            <div className="nl-feed-list">
              {feedArticles.map((item) => (
                <NewsRow key={item.id} item={item} lang={lang} />
              ))}
            </div>
            {totalPages > 1 && (
              <nav className="nl-pagination" aria-label="Phân trang bài viết">
                <button
                  type="button"
                  className="nl-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    document.getElementById('news-feed-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`nl-page-num${p === currentPage ? ' is-active' : ''}`}
                    aria-current={p === currentPage ? 'page' : undefined}
                    onClick={() => {
                      setCurrentPage(p);
                      document.getElementById('news-feed-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="nl-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    document.getElementById('news-feed-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Sau
                </button>
              </nav>
            )}
          </section>
        )}

        {/* Section: Đọc theo điểm dừng */}
        <section className="nl-stops-section" aria-labelledby="nl-stops-heading">
          <div className="nl-stops-header">
            <h2 id="nl-stops-heading" className="nl-stops-title">
              Đọc theo điểm dừng
            </h2>
            <p className="nl-stops-desc">
              Mỗi điểm trong hành trình có bài viết đi kèm. Đọc trước khi đi, hoặc nghe thuyết minh ngay tại chỗ.
            </p>
          </div>
          <div className="nl-stops-list">
            {STOPS.map((stop, index) => {
              const stopCount = allItems.filter(
                (a) =>
                  a.relatedPoiSlugs?.includes(stop.slug) ||
                  norm(a.title + ' ' + (a.summary || '')).includes(norm(stop.name))
              ).length;
              return (
                <div key={stop.slug} className="nl-stop-row">
                  <div className="nl-stop-info">
                    <strong className="nl-stop-name">
                      {index + 1}. {stop.name}
                    </strong>
                    <span className="nl-stop-count">
                      {stopCount > 0 ? `${stopCount} bài viết` : 'Sắp có bài'}
                    </span>
                  </div>
                  <div className="nl-stop-actions">
                    {stopCount > 0 && (
                      <button
                        type="button"
                        className="nl-stop-read-btn"
                        onClick={() => handleSelectPoi(stop.slug)}
                      >
                        Đọc bài
                      </button>
                    )}
                    <Link to={`/nearby?poi=${stop.slug}`} className="nl-stop-audio-link">
                      Nghe thuyết minh
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Nhận bài mới mỗi tuần */}
        <section className="nl-sub-section" aria-labelledby="nl-sub-heading">
          <div className="nl-sub-content">
            <h2 id="nl-sub-heading" className="nl-sub-title">
              Nhận bài mới mỗi tuần
            </h2>
            <p className="nl-sub-desc">
              Câu chuyện di sản và mẹo khám phá Sài Gòn, gửi thẳng vào hộp thư của bạn.
            </p>
          </div>
          <form className="nl-sub-form" onSubmit={handleSubscribe}>
            <label htmlFor="nl-sub-email" className="nl-sub-label">
              Email của bạn
            </label>
            <div className="nl-sub-input-row">
              <input
                id="nl-sub-email"
                type="email"
                required
                placeholder="ban@vidu.com"
                className="nl-sub-input"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
              />
              <button type="submit" className="nl-sub-btn">
                Đăng ký
              </button>
            </div>
            {isSubscribed && (
              <p className="nl-sub-success" role="status">
                Cảm ơn bạn, chúng tôi đã ghi nhận email.
              </p>
            )}
          </form>
        </section>

        {/* Section: Muốn nghe thay vì đọc? */}
        <section className="nl-cta-section" aria-labelledby="nl-cta-heading">
          <div className="nl-cta-content">
            <h2 id="nl-cta-heading" className="nl-cta-title">
              Muốn nghe thay vì đọc?
            </h2>
            <p className="nl-cta-desc">
              Mỗi điểm dừng có một đoạn thuyết minh ngắn, nghe được bằng bốn ngôn ngữ.
            </p>
          </div>
          <Link to="/nearby" className="nl-cta-btn">
            Đi tới Điểm du lịch
          </Link>
        </section>
        </main>
      </div>
    </div>
  );
};

export default NewsListPage;
