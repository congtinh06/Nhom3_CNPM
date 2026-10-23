import React from 'react';

const ICONS: Record<string, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  pois: (
    <>
      <path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.3" />
    </>
  ),
  zones: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  routes: (
    <>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H14a3.8 3.8 0 0 0 0-7.6H9.8a3.2 3.2 0 0 1 0-4.4H16" />
    </>
  ),
  products: (
    <>
      <path d="M4 11h16a8 8 0 0 1-16 0Z" />
      <path d="M9 11V4M15 11V4" />
      <path d="M3 21h18" />
    </>
  ),
  food: (
    <>
      <path d="M4 11h16a8 8 0 0 1-16 0Z" />
      <path d="M9 11V4M15 11V4" />
      <path d="M3 21h18" />
    </>
  ),
  news: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1.8" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" />
    </>
  ),
  gallery: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5.5 17 4.2-4.2L13 16l2.8-2.8 2.7 2.7" />
    </>
  ),
  orders: (
    <>
      <path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
      <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
      <path d="M14.5 14.5h2.5v2.5h-2.5zM19.5 14.5h1M14.5 19.5h1M18 18h2.5v2.5H18z" />
    </>
  ),
  feedback: (
    <>
      <path d="M4.5 5h15v10.5H9.5L4.5 19.5V5Z" />
      <path d="M8 8.5h8M8 11.5h5" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  logs: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 1.9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3.5v2.1M12 18.4v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M3.5 12h2.1M18.4 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </>
  ),
};

export interface AdminNavIconProps {
  id: string;
  className?: string;
}

export const AdminNavIcon: React.FC<AdminNavIconProps> = ({ id, className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    {ICONS[id] ?? ICONS.overview}
  </svg>
);

export const AdminChevronIcon: React.FC<{ open?: boolean; className?: string }> = ({
  open = false,
  className = '',
}) => (
  <svg
    className={`adm-nav-chevron ${open ? 'adm-nav-chevron-open' : ''} ${className}`.trim()}
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const AdminChevronLeftIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const AdminSidebarCollapseIcon: React.FC<{ collapsed?: boolean; className?: string }> = ({
  collapsed = false,
  className = '',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    {collapsed ? <path d="m14 9 3 3-3 3" /> : <path d="m17 9-3 3 3 3" />}
  </svg>
);

