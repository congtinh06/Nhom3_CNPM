import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useNewsListQuery } from '../../api/news';
import { NewsCategory, NEWS_CATEGORIES } from '../../types/domain';
import { StoryCard } from '../news/StoryCard';
import { useNavbarLanguage } from '../../content/languages';

const HOME_CATEGORIES: { key: NewsCategory; label: string; dotColor: string }[] = [
  { key: 'diem-den', label: 'Điểm đến', dotColor: NEWS_CATEGORIES['diem-den'].hex },
  { key: 'van-hoa', label: 'Văn hóa Sài Gòn', dotColor: NEWS_CATEGORIES['van-hoa'].hex },
  { key: 'meo-tham-quan', label: 'Mẹo tham quan', dotColor: NEWS_CATEGORIES['meo-tham-quan'].hex },
];

export const HomeNewsSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const [activeCategoryTab, setActiveCategoryTab] = useState<NewsCategory>('diem-den');

  const { displayedData, isLoading, isError } = useNewsListQuery({ lang });
  const allItems = useMemo(() => displayedData?.items ?? [], [displayedData]);

  // Home Page Mapping (strictly 0 duplicates anywhere on the Home page):
  // 1. [Home "featured news" block] = newest 1 article
  const featuredArticle = allItems[0] || null;

  // 2. [Home "latest news" row] = next 3 newest (non-duplicated)
  const latestNewsArticles = useMemo(() => {
    if (!featuredArticle) return [];
    return allItems
      .filter((item) => item.id !== featuredArticle.id)
      .slice(0, 3);
  }, [allItems, featuredArticle]);

  // Set of IDs already shown in featured & latest row
  const alreadyUsedIds = useMemo(() => {
    const ids = new Set<string>();
    if (featuredArticle) ids.add(featuredArticle.id);
    latestNewsArticles.forEach((item) => ids.add(item.id));
    return ids;
  }, [featuredArticle, latestNewsArticles]);

  // 3. [Home sections for Điểm đến / Văn hóa / Mẹo tham quan] = newest 3-4 of matching category (never repeating anything from featured/latest)
  const categoryArticles = useMemo(() => {
    return allItems
      .filter((item) => item.category === activeCategoryTab && !alreadyUsedIds.has(item.id))
      .slice(0, 3);
  }, [allItems, activeCategoryTab, alreadyUsedIds]);


  if (isLoading) {
    return (
      <section className="s home-news-section" id="tin-tuc-trang-chu" aria-label="Tin tức du lịch">
        <div className="home-news-header">
          <div className="home-news-title-wrap">
            <span className="home-news-eyebrow">CẬP NHẬT MỚI</span>
            <h2 className="home-news-title">Tin tức & Câu chuyện Sài Gòn</h2>
          </div>
        </div>
        <div className="news-skeleton-featured" style={{ height: 260 }} />
      </section>
    );
  }

  if (isError || allItems.length === 0) {
    return null;
  }

  const activeCategoryMeta = NEWS_CATEGORIES[activeCategoryTab];

  return (
    <section className="s home-news-section" id="tin-tuc-trang-chu" aria-label="Tin tức du lịch">
      <div className="home-news-container">
        {/* ==================================================================
            1. SECTION HEADER
            ================================================================== */}
        <div className="home-news-header">
          <div className="home-news-title-wrap">
            <span className="home-news-eyebrow">
              <Newspaper size={14} aria-hidden="true" />
              <span>GÓC NHÌN & DI SẢN</span>
            </span>
            <h2 className="home-news-title">Tin tức & Câu chuyện Sài Gòn</h2>
            <p className="home-news-desc">
              Cập nhật đời sống, văn hóa di sản và những kinh nghiệm trải nghiệm mới nhất từ các nguồn báo chí uy tín.
            </p>
          </div>

          <Link to="/tin-tuc" className="home-news-all-link">
            <span>Xem tất cả tin tức</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* ==================================================================
            2. FEATURED NEWS BLOCK (Newest 1 article)
            ================================================================== */}
        {featuredArticle && (
          <div className="home-news-featured-block">
            <StoryCard
              item={featuredArticle}
              variant="featured"
              lang={lang}
            />
          </div>
        )}

        {/* ==================================================================
            3. LATEST NEWS ROW (Next 3 newest)
            ================================================================== */}
        {latestNewsArticles.length > 0 && (
          <div className="home-news-latest-block">
            <div className="home-news-subhead-row">
              <h3 className="home-news-subhead">MỚI NHẤT</h3>
              <Link to="/tin-tuc" className="home-news-subhead-link">
                Xem thêm tin mới →
              </Link>
            </div>
            <div className="news-cards-grid home-news-grid-3col">
              {latestNewsArticles.map((item) => (
                <StoryCard
                  key={item.id}
                  item={item}
                  variant="grid"
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            4. CATEGORY SECTIONS (Điểm đến / Văn hóa / Mẹo tham quan: 3 items)
            ================================================================== */}
        <div className="home-news-category-block">
          <div className="home-news-cat-tabs-row">
            <div className="home-news-cat-tabs" role="tablist" aria-label="Chuyên mục tin tức">
              {HOME_CATEGORIES.map((cat) => {
                const isActive = activeCategoryTab === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`home-news-cat-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveCategoryTab(cat.key)}
                    style={
                      isActive
                        ? { borderColor: cat.dotColor, color: cat.dotColor }
                        : undefined
                    }
                  >
                    <span
                      className="story-cat-dot"
                      style={{ backgroundColor: cat.dotColor }}
                      aria-hidden="true"
                    />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <Link
              to={`/tin-tuc?category=${activeCategoryTab}`}
              className="home-news-cat-viewall-link"
              style={{ color: activeCategoryMeta.hex }}
            >
              <span>Xem tất cả bài viết {activeCategoryMeta.label}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {categoryArticles.length > 0 ? (
            <div className="news-cards-grid home-news-grid-3col">
              {categoryArticles.map((item) => (
                <StoryCard
                  key={item.id}
                  item={item}
                  variant="grid"
                  lang={lang}
                />
              ))}
            </div>
          ) : (
            <div className="home-news-empty-cat">
              <p>Đã xem hết các bài viết nổi bật trong chuyên mục {activeCategoryMeta.label}.</p>
              <Link to={`/tin-tuc?category=${activeCategoryTab}`} className="news-btn-primary">
                Xem chuyên mục trên trang Tin tức
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeNewsSection;
