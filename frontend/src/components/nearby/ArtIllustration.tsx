import React from 'react';

interface ArtIllustrationProps {
  hue: number;
  idSuffix?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const ArtIllustration: React.FC<ArtIllustrationProps> = ({
  hue,
  idSuffix = '0',
  className,
  style,
}) => {
  const gradId = `art_g_${hue}_${idSuffix}`;

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 35% 62%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 40% 30%)`} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${gradId})`} />
      <path
        d="M0 150 L40 110 L70 130 L110 80 L150 120 L190 95 L240 130 L280 100 L320 125 V180 H0Z"
        fill="rgba(0,0,0,.28)"
      />
    </svg>
  );
};
