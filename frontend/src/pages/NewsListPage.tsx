import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useNewsListQuery } from '../api/news';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useNavbarLanguage } from '../content/languages';
import { tNews, NewsTranslation } from '../content/newsI18n';
import { getCategoryLabel } from '../components/news/newsFormatters';
import { PageHero } from '../components/common/PageHero';
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

export const NewsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useNavbarLanguage();

  useDocumentMeta(
    'Tin tức & Câu chuyện Di sản Sài Gòn',
    'Khám phá câu chuyện lịch sử, nếp sống văn hóa và cẩm nang du lịch trải nghiệm tại Thành phố Hồ Chí Minh.'
  );

  const categoryParam = searchParams.get('c') || searchParams.get('category') || 'all';
  const poiParam = searchParams.get('poi') || '';

  const [visibleFeedCount, setVisibleFeedCount] = useState(FEED_PAGE_SIZE);

  useEffect(() => {
    setVisibleFeedCount(FEED_PAGE_SIZE);
  }, [categoryParam, poiParam]);

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

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const activeCategoryLabel = useMemo(() => {
    if (categoryParam === 'all') return tNews(lang, 'categoryAll');
    return getCategoryLabel(categoryParam, lang);
  }, [categoryParam, lang]);

  const heroArticle = sortedFilteredItems[0] || null;
  const sideArticles = sortedFilteredItems.slice(1, 4);
  const feedAll = sortedFilteredItems.slice(4);
  const feedArticles = feedAll.slice(0, visibleFeedCount);
  const hasMoreFeed = feedAll.length > feedArticles.length;

  return (
    <div className="nl-page-root">
      <PageHero
        className="news-hero"
        eyebrow=""
        title={tNews(lang, 'pageTitle')}
        subtitle={tNews(lang, 'pageSubtitle')}
        imageSrc="/images/home/intro-nguyen-hue.jpg"
        imagePosition="center"
        imageCredit="Echora"
      />

      <div className="nl-body">
        <main className="nl-container" id="news-main-content">
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
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={isActive}
                  className={`nl-tab ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelectCategory(opt.key)}
                >
                  {tNews(lang, opt.i18nKey)}
                </button>
              );
            })}
          </div>
        </nav>

        {(categoryParam !== 'all' || poiParam) && (
          <div className="nl-filter-status">
            <span>
              Đang lọc theo: <strong>{activeCategoryLabel}</strong>
              {poiParam ? ` (#${poiParam})` : ''} ({sortedFilteredItems.length} bài viết)
            </span>
            <span className="nl-filter-sep" aria-hidden="true">·</span>
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
          <section className="nl-feed-section" aria-label="Danh sách bài viết">
            <div className="nl-feed-header">
              <h2 className="nl-feed-title">Mới nhất</h2>
            </div>
            <div className="nl-feed-list">
              {feedArticles.map((item) => (
                <NewsRow key={item.id} item={item} lang={lang} />
              ))}
            </div>
            {hasMoreFeed && (
              <div className="nl-more-wrap">
                <button
                  type="button"
                  className="nl-more-btn"
                  onClick={() => setVisibleFeedCount((c) => c + FEED_PAGE_SIZE)}
                >
                  Xem thêm bài viết
                </button>
              </div>
            )}
          </section>
        )}
        </main>
      </div>
    </div>
  );
};

export default NewsListPage;
