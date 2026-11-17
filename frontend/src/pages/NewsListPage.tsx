import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, Search, X } from 'lucide-react';
import { useNewsListQuery } from '../api/news';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useNavbarLanguage } from '../content/languages';
import { SupportedLanguage } from '../types';
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

const STOPS: { slug: string; names: Record<SupportedLanguage, string> }[] = [
  {
    slug: 'bao-tang-chung-tich-chien-tranh',
    names: {
      vi: 'Bảo tàng Chứng tích Chiến tranh',
      en: 'War Remnants Museum',
      ja: '戦争証跡博物館',
      ko: '전쟁증적박물관',
    },
  },
  {
    slug: 'nha-tho-duc-ba',
    names: {
      vi: 'Nhà thờ Đức Bà Sài Gòn',
      en: 'Notre Dame Cathedral of Saigon',
      ja: 'サイゴン大聖堂',
      ko: '사이공 노트르담 대성당',
    },
  },
  {
    slug: 'chua-ba-thien-hau',
    names: {
      vi: 'Chùa Bà Thiên Hậu',
      en: 'Ba Thien Hau Pagoda',
      ja: '天后宮（ティエンハウ寺）',
      ko: '바티엔하우 사원',
    },
  },
  {
    slug: 'cau-ba-son',
    names: {
      vi: 'Cầu Ba Son',
      en: 'Ba Son Bridge',
      ja: 'バーソン橋',
      ko: '바손 다리',
    },
  },
  {
    slug: 'buu-dien-trung-tam',
    names: {
      vi: 'Bưu điện Trung tâm Sài Gòn',
      en: 'Saigon Central Post Office',
      ja: 'サイゴン中央郵便局',
      ko: '사이공 중앙우체국',
    },
  },
  {
    slug: 'dinh-doc-lap',
    names: {
      vi: 'Dinh Độc Lập',
      en: 'Independence Palace',
      ja: '統一会堂',
      ko: '통일궁',
    },
  },
  {
    slug: 'cho-ben-thanh',
    names: {
      vi: 'Chợ Bến Thành',
      en: 'Ben Thanh Market',
      ja: 'ベンタイン市場',
      ko: '벤탄 시장',
    },
  },
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
              {tNews(lang, 'searchLabel')}
            </label>
            <div className="nl-search-box">
              <Search size={18} className="nl-search-icon" aria-hidden="true" />
              <input
                id="news-search-input"
                type="search"
                className="nl-search-input"
                placeholder={tNews(lang, 'searchPlaceholder')}
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="nl-search-clear"
                  onClick={handleClearSearch}
                  aria-label={tNews(lang, 'clearSearch')}
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
              {tNews(lang, 'filteringBy')}: <strong>{activeCategoryLabel}</strong>
              {poiParam ? ` (#${poiParam})` : ''}
              {searchQuery ? ` ("${searchQuery}")` : ''} ({sortedFilteredItems.length} {tNews(lang, 'articlesCount')})
            </span>
            <button
              type="button"
              className="nl-filter-clear-btn"
              onClick={handleClearFilters}
            >
              {tNews(lang, 'clearFilters')}
            </button>
          </div>
        )}

        {isLoading && (
          <div className="nl-skeleton-wrap" aria-busy="true" aria-label={tNews(lang, 'loading')}>
            <div className="nl-skeleton-lead" />
            <div className="nl-skeleton-row" />
            <div className="nl-skeleton-row" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="nl-state-box" role="alert">
            <h2 className="nl-state-title">{tNews(lang, 'errorLoadTitle')}</h2>
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
            <h2 className="nl-state-title">{tNews(lang, 'noArticlesTitle')}</h2>
            <p className="nl-state-desc">
              {poiParam
                ? tNews(lang, 'noArticlesForPoi')
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
              <section className="nl-top-side" aria-label={lang === 'vi' ? 'Tin nổi bật khác' : tNews(lang, 'featured')}>
                <h2 className="nl-side-heading">{tNews(lang, 'featured')}</h2>
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
          <section id="news-feed-section" className="nl-feed-section" aria-label={lang === 'vi' ? 'Danh sách bài viết' : tNews(lang, 'latest')}>
            <div className="nl-feed-header">
              <h2 className="nl-feed-title">{tNews(lang, 'latest')}</h2>
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
                  {tNews(lang, 'prev')}
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
                  {tNews(lang, 'next')}
                </button>
              </nav>
            )}
          </section>
        )}

        {/* Section: Đọc theo điểm dừng */}
        <section className="nl-stops-section" aria-labelledby="nl-stops-heading">
          <div className="nl-stops-header">
            <h2 id="nl-stops-heading" className="nl-stops-title">
              {tNews(lang, 'readByStop')}
            </h2>
            <p className="nl-stops-desc">
              {tNews(lang, 'readByStopDesc')}
            </p>
          </div>
          <div className="nl-stops-list">
            {STOPS.map((stop, index) => {
              const stopName = stop.names[lang] || stop.names.vi || '';
              const stopVi = stop.names.vi || '';
              const stopCount = allItems.filter(
                (a) =>
                  a.relatedPoiSlugs?.includes(stop.slug) ||
                  (stopVi && norm(a.title + ' ' + (a.summary || '')).includes(norm(stopVi))) ||
                  (stopName && norm(a.title + ' ' + (a.summary || '')).includes(norm(stopName)))
              ).length;
              return (
                <div key={stop.slug} className="nl-stop-row">
                  <div className="nl-stop-info">
                    <strong className="nl-stop-name">
                      {index + 1}. {stopName}
                    </strong>
                    <span className="nl-stop-count">
                      {stopCount > 0 ? `${stopCount} ${tNews(lang, 'articles')}` : tNews(lang, 'comingSoon')}
                    </span>
                  </div>
                  <div className="nl-stop-actions">
                    {stopCount > 0 && (
                      <button
                        type="button"
                        className="nl-stop-read-btn"
                        onClick={() => handleSelectPoi(stop.slug)}
                      >
                        {tNews(lang, 'readArticle')}
                      </button>
                    )}
                    <Link
                      to={`/diem-du-lich?stop=${encodeURIComponent(stop.slug)}`}
                      className="nl-stop-audio-link"
                    >
                      {tNews(lang, 'listenTour')}
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
              {tNews(lang, 'newsletterTitle')}
            </h2>
            <p className="nl-sub-desc">
              {tNews(lang, 'newsletterDesc')}
            </p>
          </div>
          <form className="nl-sub-form" onSubmit={handleSubscribe}>
            <label htmlFor="nl-sub-email" className="nl-sub-label">
              {tNews(lang, 'newsletterEmail')}
            </label>
            <div className="nl-sub-input-row">
              <input
                id="nl-sub-email"
                type="email"
                required
                placeholder={tNews(lang, 'newsletterEmailPlaceholder')}
                className="nl-sub-input"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
              />
              <button type="submit" className="nl-sub-btn">
                {tNews(lang, 'newsletterBtn')}
              </button>
            </div>
            {isSubscribed && (
              <p className="nl-sub-success" role="status">
                {tNews(lang, 'newsletterSuccess')}
              </p>
            )}
          </form>
        </section>

        {/* Section: Muốn nghe thay vì đọc? */}
        <section className="nl-cta-section" aria-labelledby="nl-cta-heading">
          <div className="nl-cta-content">
            <h2 id="nl-cta-heading" className="nl-cta-title">
              {tNews(lang, 'ctaListenTitle')}
            </h2>
            <p className="nl-cta-desc">
              {tNews(lang, 'ctaListenDesc')}
            </p>
          </div>
          <Link to="/diem-du-lich" className="nl-cta-btn">
            {tNews(lang, 'ctaListenBtn')}
          </Link>
        </section>
        </main>
      </div>
    </div>
  );
};

export default NewsListPage;
