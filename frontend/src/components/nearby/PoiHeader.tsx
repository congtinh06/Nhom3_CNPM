import React from 'react';

interface PoiHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export const PoiHeader: React.FC<PoiHeaderProps> = ({ eyebrow, title, description }) => {
  return (
    <header className="nearby-compact-header" aria-label="Tiêu đề trang điểm du lịch">
      <div className="header-inner">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
};
