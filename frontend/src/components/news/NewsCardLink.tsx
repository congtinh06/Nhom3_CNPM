import React from 'react';
import { Link } from 'react-router-dom';
import { NewsItem } from '../../types/domain';

export function isExternalArticle(item: NewsItem): boolean {
  return Boolean(item.externalUrl);
}

export interface NewsCardLinkProps {
  item: NewsItem;
  className?: string;
  children: React.ReactNode;
}

/**
 * Renders the whole card as a link.
 * - Articles with a real `externalUrl` open the source article in a new tab.
 * - Internal-only articles navigate to the in-site reading page.
 */
export const NewsCardLink: React.FC<NewsCardLinkProps> = ({ item, className, children }) => {
  if (isExternalArticle(item)) {
    return (
      <a
        href={item.externalUrl as string}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${item.title}, mở bài gốc tại ${item.source} trong tab mới`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={`/tin-tuc/${item.slug}`} className={className}>
      {children}
    </Link>
  );
};

export default NewsCardLink;
