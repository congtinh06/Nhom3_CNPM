import React, { useState } from 'react';
import { NewsItem, NEWS_CATEGORIES } from '../../types/domain';
import { SupportedLanguage } from '../../types';
import { formatNewsDate, formatReadingTime, getCategoryLabel } from './newsFormatters';
import { NewsMeta } from './NewsMeta';
import { NewsCardLink } from './NewsCardLink';
import { NewsExternalFlag } from './NewsExternalFlag';

export interface NewsLeadStoryProps {
  item: NewsItem;
  lang?: SupportedLanguage;
}

export const NewsLeadStory: React.FC<NewsLeadStoryProps> = ({ item, lang = 'vi' }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = item.thumbnail || item.coverImageUrl;
  const categoryLabel = getCategoryLabel(item.category, lang);
  const categoryMeta = NEWS_CATEGORIES[item.category] || NEWS_CATEGORIES['diem-den'];
  const formattedDate = formatNewsDate(item.publishedAt, lang);
  const readingTime = formatReadingTime(item.readingTime || item.readingMinutes || 3, lang);
  const photoPrefix = lang === 'en' ? 'Photo: ' : lang === 'ja' ? '写真: ' : lang === 'ko' ? '사진: ' : 'Ảnh: ';
  const captionText = item.imageCredit
    ? `${photoPrefix}${item.imageCredit}`
    : (item.source && item.source.trim().toLowerCase() !== 'echora' ? item.source : '');

  return (
    <article className="nl-lead-card" data-testid="news-lead-story">
      <NewsCardLink item={item} className="nl-lead-link">
        <div className="nl-lead-visual">
          <div className="nl-lead-media">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={item.coverImageAlt || item.title}
                className="nl-lead-img"
                loading="eager"
                width="800"
                height="450"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="nl-img-placeholder nl-lead-placeholder" aria-hidden="true" />
            )}
          </div>
          {captionText && <p className="nl-lead-caption">{captionText}</p>}
        </div>
        <div className="nl-lead-body">
          <h2 className="nl-lead-title">{item.title}</h2>
          {(item.excerpt || item.summary) && (
            <p className="nl-lead-sapo">{item.excerpt || item.summary}</p>
          )}
          <NewsMeta
            category={{ label: categoryLabel, color: categoryMeta.hex }}
            publishedAt={item.publishedAt}
            formattedDate={formattedDate}
            readingTime={readingTime}
          />
          <NewsExternalFlag item={item} lang={lang} />
        </div>
      </NewsCardLink>
    </article>
  );
};

export default NewsLeadStory;
