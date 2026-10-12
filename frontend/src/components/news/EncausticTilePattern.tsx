import React from 'react';

/**
 * Authentic Saigon encaustic tile (gạch bông) 2-color geometric vector motif.
 * No external asset. Strict 2 colors: terracotta #8A2F12 and deep charcoal #2B2724.
 */
export const EncausticTileSvg: React.FC<{
  size?: number;
  className?: string;
  opacity?: number;
}> = ({ size = 48, className = '', opacity = 1 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ opacity }}
    aria-hidden="true"
    focusable="false"
  >
    {/* Outer border & corner squares */}
    <rect x="0.5" y="0.5" width="47" height="47" stroke="#8A2F12" strokeWidth="1" strokeOpacity="0.4" />
    <path d="M0 0L12 0L0 12Z" fill="#8A2F12" fillOpacity="0.35" />
    <path d="M48 0L36 0L48 12Z" fill="#8A2F12" fillOpacity="0.35" />
    <path d="M0 48L12 48L0 36Z" fill="#8A2F12" fillOpacity="0.35" />
    <path d="M48 48L36 48L48 36Z" fill="#8A2F12" fillOpacity="0.35" />

    {/* Diamond frame */}
    <polygon points="24,4 44,24 24,44 4,24" stroke="#2B2724" strokeWidth="1.2" strokeOpacity="0.4" fill="none" />

    {/* Center 8-petal geometric rosette */}
    <circle cx="24" cy="24" r="7" fill="#8A2F12" fillOpacity="0.25" stroke="#8A2F12" strokeWidth="1" strokeOpacity="0.5" />
    <polygon points="24,10 26.5,21.5 38,24 26.5,26.5 24,38 21.5,26.5 10,24 21.5,21.5" fill="#2B2724" fillOpacity="0.3" />
    <polygon points="14,14 24,20 34,14 28,24 34,34 24,28 14,34 20,24" fill="#8A2F12" fillOpacity="0.2" />
    <circle cx="24" cy="24" r="2.5" fill="#2B2724" fillOpacity="0.6" />
  </svg>
);

/**
 * (a) 12px divider strip between major sections
 */
export const TileDividerStrip: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`tile-divider-strip ${className}`}
    role="separator"
    aria-hidden="true"
  >
    <div className="tile-divider-pattern" />
  </div>
);

/**
 * (b) Behind the bottom banner (opacity <= 6%)
 */
export const TileBannerBackground: React.FC = () => (
  <div className="tile-banner-bg" aria-hidden="true" />
);

/**
 * Missing-image neutral placeholder (#F3EEE6 + small icon, no stripes, no text)
 */
export const NeutralImagePlaceholder: React.FC<{
  aspectRatio?: '4/3' | '16/10' | '16/9' | '1/1';
  altText?: string;
  className?: string;
}> = ({ aspectRatio = '4/3', altText = 'Chưa có ảnh bài viết', className = '' }) => (
  <div
    className={`news-neutral-placeholder aspect-${
      aspectRatio === '16/10'
        ? '16-10'
        : aspectRatio === '4/3'
        ? '4-3'
        : aspectRatio === '1/1'
        ? 'square'
        : '16-9'
    } ${className}`}
    aria-label={altText}
    role="img"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A8A29E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  </div>
);

export const TileImagePlaceholder = NeutralImagePlaceholder;
