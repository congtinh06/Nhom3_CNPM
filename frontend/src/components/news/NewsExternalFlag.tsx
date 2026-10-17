import React from 'react';
import { ExternalLink } from 'lucide-react';
import { NewsItem } from '../../types/domain';
import { SupportedLanguage } from '../../types';
import { tNews } from '../../content/newsI18n';

export interface NewsExternalFlagProps {
  item: NewsItem;
  lang?: SupportedLanguage;
}

/**
 * Small inline badge shown on cards/articles that link to an external source.
 */
export const NewsExternalFlag: React.FC<NewsExternalFlagProps> = ({ item, lang = 'vi' }) => {
  if (!item.externalUrl) return null;

  return (
    <span className="nl-ext-flag">
      <ExternalLink size={12} aria-hidden="true" />
      <span className="nl-ext-flag-text">
        {tNews(lang, 'readAtSource')} {item.source}
      </span>
    </span>
  );
};

export default NewsExternalFlag;
