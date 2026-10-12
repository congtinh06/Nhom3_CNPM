import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Play, Pause, Square, ExternalLink } from 'lucide-react';
import { useNewsDetailQuery, useNewsListQuery } from '../api/news';
import { NEWS_CATEGORIES } from '../types/domain';
import { StoryCard } from '../components/news/StoryCard';
import { NeutralImagePlaceholder } from '../components/news/EncausticTilePattern';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useSpeechAudio } from '../hooks/useSpeechAudio';
import { useNavbarLanguage } from '../content/languages';
import { tNews } from '../content/newsI18n';
import '../styles/news.css';

function formatDate(dateStr?: string, lang = 'vi'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

export const NewsDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useNavbarLanguage();
  const [imageError, setImageError] = useState(false);

  const { data: article, isLoading, isError } = useNewsDetailQuery(slug || '');
  const { data: allData } = useNewsListQuery({ lang });
  const { activeId, isPlaying, isPaused, toggleSpeech, stopSpeech } = useSpeechAudio();

  // SEO & Open Graph Tags
  useDocumentMeta(
    article?.title || 'Chi tiết bài viết',
    article?.excerpt || article?.summary || 'Tin tức và cẩm nang du lịch văn hóa Sài Gòn',
    article?.thumbnail || article?.coverImageUrl || null,
    typeof window !== 'undefined' ? window.location.href : undefined
  );

  // Related articles: 3 articles of the SAME category, excluding current
  const relatedArticles = useMemo(() => {
    if (!article || !allData?.items) return [];
    const others = allData.items.filter((i) => i.slug !== article.slug);
    const sameCategory = others.filter((i) => i.category === article.category);
    // If not enough in same category, pad with newest others
    const fallbackOthers = others.filter((i) => i.category !== article.category);
    const combined = [...sameCategory, ...fallbackOthers];
    return combined.slice(0, 3);
  }, [article, allData]);

  // Handle SpeechSynthesis audio read
  const handleToggleSpeech = () => {
    if (!article) return;
    const textToRead = `${article.title}. ${article.excerpt || article.summary || ''}`;
    toggleSpeech(article.id, textToRead);
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="news-page-root news-detail-root">
        <div className="news-container news-detail-loading" aria-busy="true">
          <div className="news-skeleton-breadcrumb" />
          <div className="news-skeleton-title" />
          <div className="news-skeleton-body" />
        </div>
      </div>
    );
  }

  // 2. Not found or error state (404 state if slug not found or expired from cache)
  if (isError || !article) {
    return (
      <div className="news-page-root news-detail-root">
        <div className="news-container news-state-box news-state-notfound" role="alert">
          <h1 className="news-state-title">{tNews(lang, 'notFoundTitle')}</h1>
          <p className="news-state-desc">{tNews(lang, 'notFoundMessage')}</p>
          <Link to="/tin-tuc" className="news-btn-primary">
            <ArrowLeft size={16} /> {tNews(lang, 'backToNews')}
          </Link>
        </div>
      </div>
    );
  }

  const categoryMeta = NEWS_CATEGORIES[article.category] || NEWS_CATEGORIES['diem-den'];
  const formattedDate = formatDate(article.publishedAt, lang);
  const imageUrl = article.thumbnail || article.coverImageUrl;
  const isThisArticleSpeaking = activeId === article.id && isPlaying;
  const isThisArticlePaused = activeId === article.id && isPaused;

  return (
    <div className="news-page-root news-detail-root">
      <main className="news-container news-detail-reading-container" id="main-article">
        {/* ==================================================================
            1. BREADCRUMB: (Trang chủ › Tin tức › category)
            ================================================================== */}
        <nav className="news-breadcrumb-nav" aria-label="Đường dẫn trang">
          <ol className="news-breadcrumb-list">
            <li className="news-breadcrumb-item">
              <Link to="/" className="news-breadcrumb-link">
                {tNews(lang, 'breadcrumbHome')}
              </Link>
            </li>
            <li className="news-breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li className="news-breadcrumb-item">
              <Link to="/tin-tuc" className="news-breadcrumb-link">
                {tNews(lang, 'breadcrumbNews')}
              </Link>
            </li>
            <li className="news-breadcrumb-separator" aria-hidden="true">
              <ChevronRight size={14} />
            </li>
            <li className="news-breadcrumb-item is-current" aria-current="page">
              <Link
                to={`/tin-tuc?category=${article.category}`}
                className="news-breadcrumb-link news-breadcrumb-cat-link"
                style={{ color: categoryMeta.hex }}
              >
                {categoryMeta.label}
              </Link>
            </li>
          </ol>
        </nav>

        {/* ==================================================================
            2. META: Category + reading time + MỚI
            ================================================================== */}
        <div className="news-article-meta-row">
          <Link
            to={`/tin-tuc?category=${article.category}`}
            className="story-cat-badge"
            style={{ color: categoryMeta.hex }}
          >
            <span
              className="story-cat-dot"
              style={{ backgroundColor: categoryMeta.hex }}
              aria-hidden="true"
            />
            {categoryMeta.label.toUpperCase()}
          </Link>

          <span className="story-meta-dot" aria-hidden="true">·</span>

          <span className="story-read-time">
            {article.readingTime || article.readingMinutes || 3} PHÚT ĐỌC
          </span>

          {article.isNew && (
            <span className="story-new-badge" aria-label="Bài viết mới trong 48 giờ">
              MỚI
            </span>
          )}
        </div>

        {/* ==================================================================
            3. SERIF TITLE (h1, Playfair Display)
            ================================================================== */}
        <h1 className="news-article-title">{article.title}</h1>

        {/* ==================================================================
            4. SOURCE + DATE
            ================================================================== */}
        <div className="news-article-byline">
          {article.source && (
            <span className="news-article-source">
              Nguồn: <strong>{article.source}</strong>
            </span>
          )}
          {article.source && formattedDate && (
            <span className="story-meta-dot" aria-hidden="true">·</span>
          )}
          {formattedDate && (
            <time dateTime={article.publishedAt} className="news-article-date">
              Xuất bản: {formattedDate}
            </time>
          )}
        </div>

        {/* ==================================================================
            5. MAIN IMAGE WITH SOURCE CAPTION
            ================================================================== */}
        <figure className="news-article-figure">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={article.coverImageAlt || article.title}
              className="news-article-cover-img"
              width="720"
              height="450"
              onError={() => setImageError(true)}
            />
          ) : (
            <NeutralImagePlaceholder
              aspectRatio="16/9"
              altText={article.title}
            />
          )}
          <figcaption className="news-article-figcaption">
            <span>Nguồn ảnh: {article.source || article.imageCredit || 'Báo chí tổng hợp'}</span>
          </figcaption>
        </figure>

        {/* ==================================================================
            6. EXCERPT AS LEAD PARAGRAPH
            (Do NOT copy full article text for copyright. Excerpt/summary only)
            ================================================================== */}
        <div className="news-reading-lead">
          <p>{article.excerpt || article.summary}</p>
        </div>

        {/* ==================================================================
            7. BUTTONS: "NGHE" (SpeechSynthesis) & "Đọc bài gốc tại [source]"
            ================================================================== */}
        <div className="news-detail-actions-row">
          <button
            type="button"
            className={`news-btn-audio ${isThisArticleSpeaking ? 'is-playing' : ''}`}
            onClick={handleToggleSpeech}
            aria-label={
              isThisArticleSpeaking
                ? 'Tạm dừng nghe bài viết'
                : isThisArticlePaused
                ? 'Tiếp tục nghe bài viết'
                : 'Nghe bài viết'
            }
          >
            {isThisArticleSpeaking ? (
              <Pause size={17} aria-hidden="true" />
            ) : (
              <Play size={17} style={{ marginLeft: 2 }} aria-hidden="true" />
            )}
            <span>
              {isThisArticleSpeaking
                ? 'TẠM DỪNG'
                : isThisArticlePaused
                ? 'TIẾP TỤC NGHE'
                : 'NGHE'}
            </span>
          </button>

          {(isThisArticleSpeaking || isThisArticlePaused) && (
            <button
              type="button"
              className="news-btn-stop"
              onClick={stopSpeech}
              aria-label="Dừng phát thanh"
              title="Dừng phát thanh"
            >
              <Square size={14} aria-hidden="true" />
              <span>DỪNG</span>
            </button>
          )}

          <a
            href={article.sourceUrl || 'https://vnexpress.net/du-lich'}
            target="_blank"
            rel="noopener noreferrer"
            className="news-btn-read-original"
          >
            <span>Đọc bài gốc tại {article.source || 'VnExpress'}</span>
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>

        {/* ==================================================================
            8. BACK-TO-LIST LINK (Retains previous filter)
            ================================================================== */}
        <div className="news-back-to-list-wrap">
          <Link
            to={`/tin-tuc?category=${article.category}`}
            className="news-back-link"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Quay lại danh sách Tin tức ({categoryMeta.label})</span>
          </Link>
        </div>

        {/* ==================================================================
            9. BÀI LIÊN QUAN: 3 articles of the same category
            ================================================================== */}
        {relatedArticles.length > 0 && (
          <section className="news-article-related-section" aria-label="Bài viết liên quan">
            <h2 className="news-article-section-heading">
              <span>Bài viết liên quan</span>
            </h2>
            <div className="news-cards-grid news-cards-grid-related">
              {relatedArticles.map((relItem) => (
                <StoryCard
                  key={relItem.id}
                  item={relItem}
                  variant="grid"
                  lang={lang}
                  isSpeaking={activeId === relItem.id}
                  onToggleSpeech={(item) =>
                    toggleSpeech(item.id, `${item.title}. ${item.excerpt || item.summary || ''}`)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default NewsDetailPage;
