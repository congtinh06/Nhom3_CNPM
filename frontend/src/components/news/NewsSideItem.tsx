import React, { useState } from 'react';
import { NewsItem, NEWS_CATEGORIES } from '../../types/domain';
import { SupportedLanguage } from '../../types';
import { formatNewsDate, formatReadingTime, getCategoryLabel } from './newsFormatters';
import { NewsMeta } from './NewsMeta';
import { NewsCardLink } from './NewsCardLink';
import { NewsExternalFlag } from './NewsExternalFlag';

export interface NewsSideItemProps {
  item: NewsItem;
  lang?: SupportedLanguage;
}

export const NewsSideItem: React.FC<NewsSideItemProps> = ({ item, lang = 'vi' }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = item.thumbnail || item.coverImageUrl;
  const categoryLabel = getCategoryLabel(item.category, lang);
  const categoryMeta = NEWS_CATEGORIES[item.category] || NEWS_CATEGORIES['diem-den'];
  const formattedDate = formatNewsDate(item.publishedAt, lang);
  const readingTime = formatReadingTime(item.readingTime || item.readingMinutes || 3, lang);

  return (
    <article className="nl-side-item" data-testid="news-side-item">
      <NewsCardLink item={item} className="nl-side-link">
        <div className="nl-side-body">
          <h3 className="nl-side-title">{item.title}</h3>
          <NewsMeta
            category={{ label: categoryLabel, color: categoryMeta.hex }}
            publishedAt={item.publishedAt}
            formattedDate={formattedDate}
            readingTime={readingTime}
          />
          <NewsExternalFlag item={item} lang={lang} />
        </div>
        <div className="nl-side-media">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.coverImageAlt || item.title}
              className="nl-side-img"
              loading="lazy"
              width="120"
              height="90"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="nl-img-placeholder nl-side-placeholder" aria-hidden="true" />
          )}
        </div>
      </NewsCardLink>
    </article>
  );
};

export default NewsSideItem;
