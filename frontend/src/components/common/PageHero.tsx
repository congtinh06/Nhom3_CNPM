import React, { useState } from 'react';
import '../../styles/pageHero.css';

export interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageSrcMobile?: string;
  imagePosition?: string;
  imageCredit?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageSrcMobile,
  imagePosition = 'center',
  imageCredit,
  rightSlot,
  className = '',
}) => {
  const [hasImageError, setHasImageError] = useState(!imageSrc);

  return (
    <section className={`page-hero ${className}`} aria-label={title}>
      {/* 1. Background image with <picture> for responsive loading or fallback */}
      {!hasImageError && imageSrc ? (
        <picture className="page-hero-picture">
          {imageSrcMobile && (
            <source media="(max-width: 640px)" srcSet={imageSrcMobile} />
          )}
          <img
            src={imageSrc}
            alt=""
            width="2400"
            height="1200"
            // @ts-expect-error fetchpriority is supported in React 18.3+ modern browsers
            fetchpriority="high"
            loading="eager"
            decoding="async"
            className="page-hero-img"
            style={{ objectPosition: imagePosition }}
            onError={() => setHasImageError(true)}
          />
        </picture>
      ) : (
        <div className="page-hero-fallback" aria-hidden="true">
          <div className="page-hero-fallback-pattern" />
        </div>
      )}

      {/* 2. Dark contrast gradient overlay */}
      <div className="page-hero-overlay" aria-hidden="true" />

      {/* 3. Content container: Left edge lines up with content below */}
      <div className="page-hero-container">
        <div className="page-hero-content">
          <div className="page-hero-top-row">
            <div className="page-hero-eyebrow">
              <span>{eyebrow}</span>
            </div>
            {rightSlot && <div className="page-hero-right-slot">{rightSlot}</div>}
          </div>

          <h1 className="page-hero-title">{title}</h1>

          <p className="page-hero-subtitle">{subtitle}</p>
        </div>

        {/* Tiny caption bottom-right when image exists */}
        {imageCredit && !hasImageError && (
          <span className="page-hero-credit" title={`Nguồn ảnh: ${imageCredit}`}>
            Ảnh: {imageCredit}
          </span>
        )}
      </div>
    </section>
  );
};

export default PageHero;
