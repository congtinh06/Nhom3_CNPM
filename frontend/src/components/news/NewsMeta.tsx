import React from 'react';

export interface NewsMetaProps {
  category?: {
    label: string;
    color?: string;
    uppercase?: boolean;
  };
  source?: string;
  publishedAt?: string;
  formattedDate?: string;
  readingTime?: string;
  className?: string;
}

export const NewsMeta: React.FC<NewsMetaProps> = ({
  category,
  source,
  publishedAt,
  formattedDate,
  readingTime,
  className = 'nl-meta',
}) => {
  const parts: { key: string; node: React.ReactNode }[] = [];

  if (category?.label) {
    parts.push({
      key: 'cat',
      node: (
        <span className="nl-meta-cat">
          {category.label}
        </span>
      ),
    });
  }

  if (source) {
    parts.push({
      key: 'source',
      node: (
        <span className="nl-meta-source">
          Nguồn: <strong>{source}</strong>
        </span>
      ),
    });
  }

  if (formattedDate) {
    parts.push({
      key: 'date',
      node: (
        <time className="nl-meta-date" dateTime={publishedAt}>
          {formattedDate}
        </time>
      ),
    });
  }

  if (readingTime && readingTime.trim()) {
    parts.push({
      key: 'read',
      node: <span className="nl-meta-read">{readingTime}</span>,
    });
  }

  if (parts.length === 0) return null;

  return (
    <div className={className} data-testid="news-meta">
      {parts.map((part) => (
        <span key={part.key} className="nl-meta-part">
          {part.node}
        </span>
      ))}
    </div>
  );
};
