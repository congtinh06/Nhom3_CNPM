import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Newspaper } from 'lucide-react';
import { useNewsListQuery } from '../../api/news';
import { StoryCard } from '../news/StoryCard';
import { useNavbarLanguage } from '../../content/languages';
import { tNews } from '../../content/newsI18n';
import '../../styles/news.css';

export const HomeNewsSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const { displayedData, isLoading, isError } = useNewsListQuery({ lang });

  const homeArticles = (displayedData?.items ?? []).slice(0, 3);

  if (isLoading) {
    return (
      <section className="s home-news-section" id="tin-tuc-trang-chu" aria-label="Tin tức du lịch">
        <div className="home-news-header">
          <div className="home-news-title-wrap">
            <span className="home-news-eyebrow">{tNews(lang, 'homeNewsEyebrowAlt')}</span>
            <h2 className="home-news-title">{tNews(lang, 'homeNewsTitle')}</h2>
          </div>
        </div>
        <div className="news-skeleton-featured" style={{ height: 220 }} />
      </section>
    );
  }

  if (isError || homeArticles.length === 0) {
    return null;
  }

  return (
    <section className="s home-news-section" id="tin-tuc-trang-chu" aria-label="Tin tức du lịch">
      <div className="home-news-container">
        <div className="home-news-header">
          <div className="home-news-title-wrap">
            <span className="home-news-eyebrow">
              <Newspaper size={14} aria-hidden="true" />
              <span>{tNews(lang, 'homeNewsEyebrow')}</span>
            </span>
            <h2 className="home-news-title">{tNews(lang, 'homeNewsTitle')}</h2>
            <p className="home-news-desc">
              {tNews(lang, 'homeNewsDesc')}
            </p>
          </div>

          <Link to="/tin-tuc" className="home-news-all-link">
            <span>{tNews(lang, 'homeNewsAll')}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="news-cards-grid home-news-grid-3col">
          {homeArticles.map((item) => (
            <StoryCard key={item.id} item={item} variant="grid" compact lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeNewsSection;
