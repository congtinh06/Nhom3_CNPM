import React from 'react';

interface PhotoFrameProps {
  hue: number;
  caption: string;
  src?: string | null;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  'aria-label'?: string;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  hue,
  caption,
  src,
  className = '',
  style,
  onClick,
  'aria-label': ariaLabel,
}) => {
  const combinedStyle = {
    '--h': hue,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      className={`ph ${className}`}
      style={combinedStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? ariaLabel : undefined}
    >
      <div className="im" />
      {src ? <img src={src} alt={caption} loading="lazy" /> : null}
      <span>{caption}</span>
    </div>
  );
};
