import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NewsItem, NEWS_CATEGORIES } from '../../types/domain';
import { NeutralImagePlaceholder } from './EncausticTilePattern';
import { SupportedLanguage } from '../../types';
import { NewsExternalFlag } from './NewsExternalFlag';
import { isExternalArticle } from './NewsCardLink';
import { getCategoryLabel, formatReadingTime } from './newsFormatters';
import { tNews } from '../../content/newsI18n';
import '../../styles/news.css';

export type StoryCardVariant = 'grid' | 'featured' | 'sidebar' | 'large' | 'row';

export interface StoryCardProps {
  item: NewsItem;
  variant?: StoryCardVariant;
  lang?: SupportedLanguage;
  isFeaturedEager?: boolean;
  showDivider?: boolean;
  compact?: boolean;
}

const POI_MAP: Record<string, string> = {
  'dinh-doc-lap': 'Dinh Độc Lập',
  'nha-tho-duc-ba': 'Nhà thờ Đức Bà',
  'buu-dien-trung-tam': 'Bưu điện Trung tâm',
  'cho-ben-thanh': 'Chợ Bến Thành',
  'bao-tang-chung-tich-chien-tranh': 'BT Chứng tích',
};

function formatDate(dateStr: string, lang: SupportedLanguage = 'vi'): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

export const StoryCard: React.FC<StoryCardProps> = ({
  item,
  variant = 'grid',
  lang = 'vi',
  isFeaturedEager = false,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const categoryMeta = NEWS_CATEGORIES[item.category] || NEWS_CATEGORIES['diem-den'];
  const formattedDate = formatDate(item.publishedAt, lang);

  // Tags: priority to item.tags, then relatedPoiSlugs, max 2
  const displayTags = (item.tags && item.tags.length > 0 ? item.tags : item.relatedPoiSlugs || []).slice(0, 2);

  const isFeatured = variant === 'featured';
  const isSidebar = variant === 'sidebar';

  const imageUrl = item.thumbnail || item.coverImageUrl;
  const categoryLabel = getCategoryLabel(item.category, lang);
  const photoPrefix = lang === 'en' ? 'Photo: ' : lang === 'ja' ? '写真: ' : lang === 'ko' ? '사진: ' : 'Ảnh: ';
  const captionText = item.source ? item.source : item.imageCredit ? `${photoPrefix}${item.imageCredit}` : '';

  const isExternal = isExternalArticle(item);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (isExternal && item.externalUrl) {
      window.open(item.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/tin-tuc/${item.slug}`);
    }
  };

  const renderTitleLink = () =>
    isExternal ? (
      <a
        href={item.externalUrl as string}
        target="_blank"
        rel="noopener noreferrer"
        className="story-title-link"
      >
        {item.title}
      </a>
    ) : (
      <Link to={`/tin-tuc/${item.slug}`} className="story-title-link">
        {item.title}
      </Link>
    );


  // 1. SIDEBAR VARIANT
  if (isSidebar) {
    return (
      <article
        className="story-card story-card--sidebar"
        onClick={handleCardClick}
        data-testid="story-card-sidebar"
      >
        <div className="story-sidebar-content">
          <div className="story-meta-row story-meta-row--sidebar">
            <span className="story-cat-badge" style={{ color: categoryMeta.hex }}>
              <span
                className="story-cat-dot"
                style={{ backgroundColor: categoryMeta.hex }}
                aria-hidden="true"
              />
              {categoryLabel.toUpperCase()}
            </span>
            <span className="story-read-time">{formatReadingTime(item.readingTime || item.readingMinutes || 3, lang)}</span>
            {item.isNew && (
              <span className="story-new-badge" aria-label="New">
                {tNews(lang, 'newBadge').toUpperCase()}
              </span>
            )}
          </div>

          <h3 className="story-sidebar-title">{renderTitleLink()}</h3>

          <NewsExternalFlag item={item} lang={lang} />

          <div className="story-sidebar-footer">
            {formattedDate && <time className="story-date">{formattedDate}</time>}
          </div>
        </div>
      </article>
    );
  }

  // 2. FEATURED OR STANDARD GRID VARIANT
  return (
    <article
      className={`story-card ${isFeatured ? 'story-card--featured' : 'story-card--grid'}${compact ? ' story-card--compact' : ''}`}
      onClick={handleCardClick}
      data-testid="story-card"
    >
      {/* 1. IMAGE: 16:10 for featured and compact, 4:3 for the default grid */}
      <div className="story-media-wrap">
        <div className={`story-img-container ${isFeatured || compact ? 'aspect-16-10' : 'aspect-4-3'}`}>
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.coverImageAlt || item.title}
              className="story-img"
              loading={isFeaturedEager || isFeatured ? 'eager' : 'lazy'}
              width={isFeatured ? '600' : '400'}
              height={isFeatured ? '375' : compact ? '250' : '300'}
              onError={() => setImageError(true)}
            />
          ) : (
            <NeutralImagePlaceholder
              aspectRatio={isFeatured || compact ? '16/10' : '4/3'}
              altText={item.title}
            />
          )}
        </div>
        {captionText && (
          <span className="story-img-caption" title={captionText}>
            {captionText}
          </span>
        )}
      </div>

      {/* 2. BODY CONTENT */}
      <div className="story-content">
        {/* Meta row: category, reading time, MỚI */}
        <div className="story-meta-row">
          <span className="story-cat-badge" style={{ color: categoryMeta.hex }}>
            <span
              className="story-cat-dot"
              style={{ backgroundColor: categoryMeta.hex }}
              aria-hidden="true"
            />
            {categoryLabel.toUpperCase()}
          </span>

          <span className="story-read-time">
            {formatReadingTime(item.readingTime || item.readingMinutes || 3, lang)}
          </span>

          {item.isNew && (
            <span className="story-new-badge" aria-label="New">
              {tNews(lang, 'newBadge').toUpperCase()}
            </span>
          )}
        </div>

        {/* Title: Playfair serif, sentence case, clamp 3 */}
        <h2 className={`story-title ${isFeatured ? 'story-title--featured' : 'story-title--grid'}`}>
          {renderTitleLink()}
        </h2>

        {/* Date: 13px gray */}
        {formattedDate && (
          <time className="story-date" dateTime={item.publishedAt}>
            {formattedDate}
          </time>
        )}

        <NewsExternalFlag item={item} lang={lang} />

        {/* Excerpt: clamp 2 lines */}
        {(item.excerpt || item.summary) && (
          <p className="story-excerpt">{item.excerpt || item.summary}</p>
        )}

        {/* Footer: max 2 tags left (omitted in the compact variant) */}
        {!compact && (
          <div className="story-footer">
            <div className="story-tags-group">
              {displayTags.map((tag) => {
                const label = POI_MAP[tag] || tag;
                return (
                  <span key={tag} className="story-tag" title={`#${label}`}>
                    #{label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default StoryCard;
