import React from 'react';

interface PhotoFrameProps {
  hue: number;
  caption: string;
  src?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  hue,
  caption,
  src,
  className = '',
  style,
}) => {
  const combinedStyle = {
    '--h': hue,
    ...style,
  } as React.CSSProperties;

  return (
    <div className={`ph ${className}`} style={combinedStyle}>
      <div className="im" />
      {src ? <img src={src} alt={caption} loading="lazy" /> : null}
      <span>{caption}</span>
    </div>
  );
};
