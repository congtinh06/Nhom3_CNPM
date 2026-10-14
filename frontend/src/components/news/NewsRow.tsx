import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NewsItem, NEWS_CATEGORIES } from '../../types/domain';
import { SupportedLanguage } from '../../types';
import { formatNewsDate, formatReadingTime, getCategoryLabel } from './newsFormatters';
import { NewsMeta } from './NewsMeta';

export interface NewsRowProps {
  item: NewsItem;
  lang?: SupportedLanguage;
}

export const NewsRow: React.FC<NewsRowProps> = ({ item, lang = 'vi' }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = item.thumbnail || item.coverImageUrl;
  const categoryLabel = getCategoryLabel(item.category, lang);
  const categoryMeta = NEWS_CATEGORIES[item.category] || NEWS_CATEGORIES['diem-den'];
  const formattedDate = formatNewsDate(item.publishedAt, lang);
  const readingTime = formatReadingTime(item.readingTime || item.readingMinutes || 3, lang);

  return (
    <article className="nl-row-item" data-testid="news-row-item">
      <Link to={`/tin-tuc/${item.slug}`} className="nl-row-link">
        <div className="nl-row-media">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.coverImageAlt || item.title}
              className="nl-row-img"
              loading="lazy"
              width="240"
              height="180"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="nl-img-placeholder nl-row-placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="nl-row-body">
          <span className="nl-row-cat" style={{ color: categoryMeta.hex }}>
            {categoryLabel.toUpperCase()}
          </span>
          <h3 className="nl-row-title">{item.title}</h3>
          {(item.excerpt || item.summary) && (
            <p className="nl-row-excerpt">{item.excerpt || item.summary}</p>
          )}
          <NewsMeta
            category={{ label: categoryLabel }}
            publishedAt={item.publishedAt}
            formattedDate={formattedDate}
            readingTime={readingTime}
          />
        </div>
      </Link>
    </article>
  );
};

export default NewsRow;
