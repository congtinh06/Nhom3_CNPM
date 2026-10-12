import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import { NewsItem, NEWS_CATEGORIES } from '../../types/domain';
import { NeutralImagePlaceholder } from './EncausticTilePattern';
import { SupportedLanguage } from '../../types';

export type StoryCardVariant = 'grid' | 'featured' | 'sidebar' | 'large' | 'row';

export interface StoryCardProps {
  item: NewsItem;
  variant?: StoryCardVariant;
  lang?: SupportedLanguage;
  isFeaturedEager?: boolean;
  showDivider?: boolean;
  isSpeaking?: boolean;
  onToggleSpeech?: (item: NewsItem) => void;
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
  isSpeaking = false,
  onToggleSpeech,
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
  const captionText = item.source ? item.source : item.imageCredit ? `Ảnh: ${item.imageCredit}` : '';

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    navigate(`/tin-tuc/${item.slug}`);
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSpeech?.(item);
  };

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
              {categoryMeta.label.toUpperCase()}
            </span>
            <span className="story-meta-dot" aria-hidden="true">·</span>
            <span className="story-read-time">{item.readingTime || item.readingMinutes || 3}P ĐỌC</span>
            {item.isNew && (
              <span className="story-new-badge" aria-label="Bài mới trong 48 giờ">
                MỚI
              </span>
            )}
          </div>

          <h3 className="story-sidebar-title">
            <Link to={`/tin-tuc/${item.slug}`} className="story-title-link">
              {item.title}
            </Link>
          </h3>

          <div className="story-sidebar-footer">
            {formattedDate && <time className="story-date">{formattedDate}</time>}
            {onToggleSpeech && (
              <button
                type="button"
                className={`story-audio-pill ${isSpeaking ? 'is-playing' : ''}`}
                onClick={handleAudioClick}
                aria-label={isSpeaking ? `Tạm dừng nghe: ${item.title}` : `Nghe bài viết: ${item.title}`}
                title={isSpeaking ? 'Tạm dừng nghe' : 'Nghe bài viết'}
              >
                {isSpeaking ? <Pause size={11} aria-hidden="true" /> : <Play size={11} aria-hidden="true" />}
                <span>NGHE</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // 2. FEATURED OR STANDARD GRID VARIANT
  return (
    <article
      className={`story-card ${isFeatured ? 'story-card--featured' : 'story-card--grid'}`}
      onClick={handleCardClick}
      data-testid="story-card"
    >
      {/* 1. IMAGE: 4:3 for grid, 16:10 for featured */}
      <div className="story-media-wrap">
        <div className={`story-img-container ${isFeatured ? 'aspect-16-10' : 'aspect-4-3'}`}>
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.coverImageAlt || item.title}
              className="story-img"
              loading={isFeaturedEager || isFeatured ? 'eager' : 'lazy'}
              width={isFeatured ? '600' : '400'}
              height={isFeatured ? '375' : '300'}
              onError={() => setImageError(true)}
            />
          ) : (
            <NeutralImagePlaceholder
              aspectRatio={isFeatured ? '16/10' : '4/3'}
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
        {/* Meta row: dot · category · reading time · MỚI */}
        <div className="story-meta-row">
          <span className="story-cat-badge" style={{ color: categoryMeta.hex }}>
            <span
              className="story-cat-dot"
              style={{ backgroundColor: categoryMeta.hex }}
              aria-hidden="true"
            />
            {categoryMeta.label.toUpperCase()}
          </span>

          <span className="story-meta-dot" aria-hidden="true">·</span>

          <span className="story-read-time">
            {item.readingTime || item.readingMinutes || 3} PHÚT ĐỌC
          </span>

          {item.isNew && (
            <span className="story-new-badge" aria-label="Bài viết mới trong 48 giờ">
              MỚI
            </span>
          )}
        </div>

        {/* Title: Playfair serif, sentence case, clamp 3 */}
        <h2 className={`story-title ${isFeatured ? 'story-title--featured' : 'story-title--grid'}`}>
          <Link to={`/tin-tuc/${item.slug}`} className="story-title-link">
            {item.title}
          </Link>
        </h2>

        {/* Date: 13px gray */}
        {formattedDate && (
          <time className="story-date" dateTime={item.publishedAt}>
            {formattedDate}
          </time>
        )}

        {/* Excerpt: clamp 2 lines */}
        {(item.excerpt || item.summary) && (
          <p className="story-excerpt">{item.excerpt || item.summary}</p>
        )}

        {/* Footer: max 2 tags left, NGHE button right, pinned to bottom */}
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

          <button
            type="button"
            className={`story-audio-pill ${isSpeaking ? 'is-playing' : ''}`}
            onClick={handleAudioClick}
            aria-label={isSpeaking ? `Tạm dừng nghe: ${item.title}` : `Nghe bài viết: ${item.title}`}
            title={isSpeaking ? 'Tạm dừng nghe' : 'Nghe bài viết'}
          >
            {isSpeaking ? (
              <Pause size={12} aria-hidden="true" />
            ) : (
              <Play size={12} style={{ marginLeft: 1 }} aria-hidden="true" />
            )}
            <span>NGHE</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default StoryCard;
