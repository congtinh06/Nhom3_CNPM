import React from 'react';
import { Link } from 'react-router-dom';

interface PhotoFrameProps {
  hue: number;
  caption: string;
  src?: string | null;
  className?: string;
  style?: React.CSSProperties;
  link?: string;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  hue,
  caption,
  src,
  className = '',
  style,
  link,
}) => {
  const combinedStyle = {
    '--h': hue,
    ...style,
  } as React.CSSProperties;

  const inner = (
    <div className={`ph ${className}`} style={combinedStyle}>
      <div className="im" />
      {src ? <img src={src} alt={caption} loading="lazy" /> : null}
      <span>{caption}</span>
    </div>
  );
  if (link) {
    return <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>;
  }
  return inner;
};
