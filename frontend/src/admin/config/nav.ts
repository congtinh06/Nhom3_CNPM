import type { AdminNavSection } from '../types';

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: 'main',
    items: [{ id: 'overview', label: 'Tổng quan', path: '/quan-tri/tong-quan' }],
  },
  {
    id: 'content',
    label: 'Nội dung',
    items: [
      { id: 'pois', label: 'Điểm thuyết minh', path: '/quan-tri/diem-thuyet-minh' },
      { id: 'zones', label: 'Khu vực', path: '/quan-tri/khu-vuc' },
      { id: 'routes', label: 'Lộ trình', path: '/quan-tri/lo-trinh' },
      { id: 'products', label: 'Sản phẩm', path: '/quan-tri/san-pham' },
    ],
  },
  {
    id: 'system',
    label: 'Hệ thống',
    items: [
      {
        id: 'orders',
        label: 'Đơn hàng',
        path: '/quan-tri/don-hang',
        badge: 'Sắp có',
        isUpcoming: true,
      },
      { id: 'users', label: 'Người dùng', path: '/quan-tri/nguoi-dung' },
    ],
  },
];

export const ADMIN_SECTION_LABELS: Record<string, string> = {
  '/quan-tri/diem-thuyet-minh': 'Điểm thuyết minh',
  '/quan-tri/khu-vuc': 'Khu vực',
  '/quan-tri/lo-trinh': 'Lộ trình',
  '/quan-tri/san-pham': 'Sản phẩm',
  '/quan-tri/nguoi-dung': 'Người dùng',
};

export const ADMIN_SECTION_ROOTS: string[] = Object.keys(ADMIN_SECTION_LABELS);

export const ADMIN_DETAIL_LABELS: Record<string, string> = {
  '/quan-tri/nguoi-dung': 'Chi tiết',
};
