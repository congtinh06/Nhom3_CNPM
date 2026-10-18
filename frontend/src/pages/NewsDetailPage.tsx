import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNewsDetailQuery, useNewsListQuery } from '../api/news';
import { NEWS_CATEGORIES, NewsCategory } from '../types/domain';
import { NewsRow } from '../components/news/NewsRow';
import { NewsMeta } from '../components/news/NewsMeta';
import { formatNewsDate, formatReadingTime, getCategoryLabel } from '../components/news/newsFormatters';
import { SafeMarkdown } from '../components/news/SafeMarkdown';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useNavbarLanguage } from '../content/languages';
import { tNews } from '../content/newsI18n';
import '../styles/news-list.css';
import '../styles/news-detail.css';

export const NewsDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useNavbarLanguage();
  const [imageError, setImageError] = useState(false);

  const { data: article, isLoading, isError } = useNewsDetailQuery(slug || '');
  const { data: allData } = useNewsListQuery({ lang });

  // SEO & Open Graph Tags
  useDocumentMeta(
    article?.title || 'Chi tiết bài viết',
    article?.excerpt || article?.summary || 'Tin tức và cẩm nang du lịch văn hóa Sài Gòn',
    article?.thumbnail || article?.coverImageUrl || null,
    typeof window !== 'undefined' ? window.location.href : undefined
  );

  // All other articles excluding current
  const otherArticles = useMemo(() => {
    if (!article || !allData?.items) return [];
    return allData.items.filter((item) => item.slug !== article.slug);
  }, [article, allData]);

  // Up to 5 items for sidebar "Tin mới nhất" if extra articles exist beyond 3 related items
  const sidebarArticles = useMemo(() => {
    if (otherArticles.length <= 3) {
      // If 3 or fewer items exist, omit sidebar so article is centered and related articles has content
      return [];
    }
    // Up to 5 items
    return otherArticles.slice(0, Math.min(5, otherArticles.length - 3));
  }, [otherArticles]);

  // Related articles (up to 3 items, excluding sidebar articles, prioritizing same category)
  const relatedArticles = useMemo(() => {
    if (!article || otherArticles.length === 0) return [];
    const sidebarSlugs = new Set(sidebarArticles.map((s) => s.slug));
    const available = otherArticles.filter((item) => !sidebarSlugs.has(item.slug));

    const sameCat = available.filter((item) => item.category === article.category);
    const diffCat = available.filter((item) => item.category !== article.category);
    return [...sameCat, ...diffCat].slice(0, 3);
  }, [article, otherArticles, sidebarArticles]);

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="nd-page-root">
        <main className="nd-container" id="main-article" aria-busy="true">
          <div className="nd-state-box">
            <p className="nd-state-desc">{tNews(lang, 'loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  // 2. Error or Not Found state
  if (isError || !article) {
    return (
      <div className="nd-page-root">
        <main className="nd-container" id="main-article">
          <div className="nd-state-box">
            <h1 className="nd-state-title">{tNews(lang, 'notFoundTitle')}</h1>
            <p className="nd-state-desc">{tNews(lang, 'notFoundMessage')}</p>
            <Link to="/tin-tuc" className="nd-btn-original">
              {tNews(lang, 'backToNews')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const categoryLabel = getCategoryLabel(article.category, lang);
  const categoryMeta = NEWS_CATEGORIES[article.category as NewsCategory] || NEWS_CATEGORIES['diem-den'];
  const formattedDate = formatNewsDate(article.publishedAt, lang);
  const readingTime = formatReadingTime(article.readingTime || article.readingMinutes || 3, lang);
  const imageUrl = article.thumbnail || article.coverImageUrl;
  const captionText = article.imageCredit
    ? `Ảnh: ${article.imageCredit}`
    : article.source
    ? `Nguồn: ${article.source}`
    : '';

  return (
    <div className="nd-page-root">
      <main className="nd-container" id="main-article">
        <div className={`nd-layout ${sidebarArticles.length === 0 ? 'is-centered' : ''}`}>
          <article className="nd-article-col">
            {/* 1. Breadcrumb: plain text, "/" separators, no icons */}
            <nav className="nd-breadcrumb" aria-label="Đường dẫn trang">
              <ol className="nd-breadcrumb-list">
                <li className="nd-breadcrumb-item">
                  <Link to="/" className="nd-breadcrumb-link">
                    {tNews(lang, 'breadcrumbHome')}
                  </Link>
                </li>
                <li className="nd-breadcrumb-sep" aria-hidden="true">/</li>
                <li className="nd-breadcrumb-item">
                  <Link to="/tin-tuc" className="nd-breadcrumb-link">
                    {tNews(lang, 'breadcrumbNews')}
                  </Link>
                </li>
                <li className="nd-breadcrumb-sep" aria-hidden="true">/</li>
                <li className="nd-breadcrumb-item nd-breadcrumb-current" aria-current="page">
                  <Link
                    to={`/tin-tuc?category=${article.category}`}
                    className="nd-breadcrumb-link"
                    style={{ color: categoryMeta.hex }}
                  >
                    {categoryLabel}
                  </Link>
                </li>
              </ol>
            </nav>

            {/* 2. Category label: small uppercase text in category color, no dot, no badge */}
            <div className="nd-category-row">
              <Link
                to={`/tin-tuc?category=${article.category}`}
                className="nd-category-label"
                style={{ color: categoryMeta.hex }}
              >
                {categoryLabel.toUpperCase()}
              </Link>
            </div>

            {/* 3. Headline: serif, bold, sentence case, no uppercase leak */}
            <h1 className="nd-title">{article.title}</h1>

            {/* 4. Standfirst: excerpt/summary */}
            {(article.excerpt || article.summary) && (
              <p className="nd-standfirst">{article.excerpt || article.summary}</p>
            )}

            {/* 5. Meta line: Nguồn: X , dd/MM/yyyy , N phút đọc */}
            <div className="nd-meta-row">
              <NewsMeta
                source={article.source}
                publishedAt={article.publishedAt}
                formattedDate={formattedDate}
                readingTime={readingTime}
                className="nl-meta"
              />
            </div>

            {/* 6. Hero image: aligned with left edge, 16:9, radius 0, eager */}
            <figure className="nd-hero-figure">
              <div className="nd-hero-media">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt={article.coverImageAlt || article.title}
                    className="nd-hero-img"
                    loading="eager"
                    width="760"
                    height="428"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="nd-hero-placeholder" aria-hidden="true" />
                )}
              </div>
              {captionText && (
                <figcaption className="nd-hero-caption">{captionText}</figcaption>
              )}
            </figure>

            {/* 7. Body text & blockquotes */}
            <div className="nd-body">
              {article.content ? (
                <SafeMarkdown content={article.content} />
              ) : (
                <p>{article.excerpt || article.summary}</p>
              )}
            </div>

            {/* 8. Tags: plain text line "Từ khóa:" without hashtag chips */}
            {article.tags && article.tags.length > 0 && (
              <div className="nd-tags-row">
                <span className="nd-tags-label">Từ khóa:</span>
                <span className="nd-tags-list">{article.tags.join(', ')}</span>
              </div>
            )}

            {/* 9. "Read original" button (external sources only) */}
            {article.externalUrl && (
              <div className="nd-actions-row">
                <a
                  href={article.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nd-btn-original"
                >
                  <span>
                    {tNews(lang, 'readAtSource')} {article.source}
                  </span>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>
            )}

            <div className="nd-divider" role="separator" />

            {/* 10. Back link */}
            <div className="nd-back-wrap">
              <Link
                to={`/tin-tuc?category=${article.category}`}
                className="nd-back-link"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Quay lại danh sách Tin tức ({categoryMeta.label})</span>
              </Link>
            </div>
          </article>

          {/* 11. Sidebar "Tin mới nhất" */}
          {sidebarArticles.length > 0 && (
            <aside className="nd-sidebar-col" aria-label="Tin mới nhất">
              <div className="nd-sidebar-card">
                <h2 className="nd-sidebar-title">Tin mới nhất</h2>
                <div className="nd-sidebar-list">
                  {sidebarArticles.map((sItem) => {
                    const sCatLabel = getCategoryLabel(sItem.category, lang);
                    const sCatMeta = NEWS_CATEGORIES[sItem.category as NewsCategory] || NEWS_CATEGORIES['diem-den'];
                    const sDate = formatNewsDate(sItem.publishedAt, lang);
                    return (
                      <article key={sItem.id} className="nd-sidebar-item">
                        <Link to={`/tin-tuc/${sItem.slug}`} className="nd-sidebar-link">
                          <h3 className="nd-sidebar-item-title">{sItem.title}</h3>
                          <div className="nd-sidebar-meta">
                            <span className="nd-sidebar-cat" style={{ color: sCatMeta.hex }}>
                              {sCatLabel}
                            </span>
                            {sDate && (
                              <time className="nd-sidebar-date" dateTime={sItem.publishedAt}>
                                {sDate}
                              </time>
                            )}
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* 12. Related articles section */}
        {relatedArticles.length > 0 && (
          <section className="nd-related-section" aria-label="Bài viết liên quan">
            <h2 className="nd-related-title">Bài viết liên quan</h2>
            <div className="nd-related-list">
              {relatedArticles.map((relItem) => (
                <NewsRow key={relItem.id} item={relItem} lang={lang} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default NewsDetailPage;
