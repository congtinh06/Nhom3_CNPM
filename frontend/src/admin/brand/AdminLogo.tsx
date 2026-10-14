import React from 'react';
import { BRAND_NAME } from './brand';

interface AdminLogoProps {
  className?: string;
  showSubtitle?: boolean;
}

export const AdminLogo: React.FC<AdminLogoProps> = ({
  className = '',
  showSubtitle = true,
}) => {
  return (
    <div className={`adm-sidebar-brand ${className}`.trim()}>
      <span className="adm-brand-title">{BRAND_NAME}</span>
      {showSubtitle && <span className="adm-brand-subtitle">Quản trị hệ thống</span>}
    </div>
  );
};
