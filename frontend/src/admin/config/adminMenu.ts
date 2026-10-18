import type { UserRoleValue } from '../types/user';

export type AdminMenuIconId =
  | 'overview'
  | 'pois'
  | 'zones'
  | 'routes'
  | 'food'
  | 'news'
  | 'gallery'
  | 'orders'
  | 'feedback'
  | 'users'
  | 'logs'
  | 'settings';

export interface AdminMenuLeaf {
  id: string;
  label: string;
  path?: string;
  isUpcoming?: boolean;
  roles?: UserRoleValue[];
  // Chuỗi query bắt buộc phải khớp để chọn mục này, ví dụ 'category=FOOD'.
  matchSearch?: string;
}

export interface AdminMenuItem {
  id: string;
  label: string;
  icon: AdminMenuIconId;
  path?: string;
  isUpcoming?: boolean;
  roles?: UserRoleValue[];
  children?: AdminMenuLeaf[];
}

export interface AdminMenuGroup {
  id: string;
  label?: string;
  items: AdminMenuItem[];
}

export interface AdminBreadcrumb {
  label: string;
  to?: string;
}

export interface AdminMenuMatch {
  group: AdminMenuGroup;
  item: AdminMenuItem;
  child?: AdminMenuLeaf;
}

// Nguồn duy nhất cho sidebar và breadcrumb: thêm trang mới chỉ cần sửa file này.
export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    id: 'main',
    items: [
      {
        id: 'overview',
        label: 'Tổng quan',
        icon: 'overview',
        path: '/quan-tri/tong-quan',
      },
    ],
  },
  {
    id: 'content',
    label: 'Nội dung',
    items: [
      {
        id: 'pois',
        label: 'Điểm thuyết minh',
        icon: 'pois',
        children: [
          { id: 'pois-list', label: 'Danh sách điểm', path: '/quan-tri/diem-thuyet-minh' },
          { id: 'pois-i18n', label: 'Bản dịch và audio', isUpcoming: true },
          { id: 'pois-segments', label: 'Đoạn và ảnh', isUpcoming: true },
          { id: 'pois-qr', label: 'Mã QR', isUpcoming: true },
          { id: 'pois-error-log', label: 'Nhật ký xử lý lỗi', isUpcoming: true },
        ],
      },
      {
        id: 'zones',
        label: 'Khu vực',
        icon: 'zones',
        path: '/quan-tri/khu-vuc',
      },
      {
        id: 'routes',
        label: 'Lộ trình',
        icon: 'routes',
        children: [
          { id: 'routes-list', label: 'Danh sách tuyến', path: '/quan-tri/lo-trinh' },
          { id: 'routes-stops', label: 'Thứ tự điểm dừng', isUpcoming: true },
        ],
      },
      {
        id: 'food',
        label: 'Ẩm thực',
        icon: 'food',
        children: [
          {
            id: 'food-dishes',
            label: 'Món ăn',
            path: '/quan-tri/san-pham',
            matchSearch: 'category=FOOD',
          },
          {
            id: 'food-drinks',
            label: 'Thức uống',
            path: '/quan-tri/san-pham',
            matchSearch: 'category=DRINK',
          },
          { id: 'food-categories', label: 'Danh mục', isUpcoming: true },
          { id: 'food-featured', label: 'Món nổi bật', isUpcoming: true },
        ],
      },
      {
        id: 'news',
        label: 'Tin tức',
        icon: 'news',
        children: [
          { id: 'news-articles', label: 'Bài viết', isUpcoming: true },
          { id: 'news-topics', label: 'Chuyên mục', isUpcoming: true },
        ],
      },
      {
        id: 'gallery',
        label: 'Thư viện ảnh',
        icon: 'gallery',
        isUpcoming: true,
      },
    ],
  },
  {
    id: 'ops',
    label: 'Vận hành',
    items: [
      { id: 'orders', label: 'Đơn hàng', icon: 'orders', isUpcoming: true },
      { id: 'feedback', label: 'Góp ý', icon: 'feedback', isUpcoming: true },
    ],
  },
  {
    id: 'system',
    label: 'Hệ thống',
    items: [
      {
        id: 'users',
        label: 'Người dùng',
        icon: 'users',
        children: [
          { id: 'users-accounts', label: 'Tài khoản', path: '/quan-tri/nguoi-dung' },
          { id: 'users-roles', label: 'Vai trò và quyền', isUpcoming: true },
        ],
      },
      { id: 'audit-logs', label: 'Nhật ký thao tác', icon: 'logs', isUpcoming: true },
      { id: 'settings', label: 'Cài đặt', icon: 'settings', isUpcoming: true },
    ],
  },
];

export const ADMIN_MENU_ROOT_LABEL = 'Quản trị';
export const ADMIN_MENU_FALLBACK_LABEL = 'Trang quản trị';
export const ADMIN_MENU_UPCOMING_BADGE = 'Sắp có';

// Nhãn cấp chi tiết cho các trang form/:id, theo nhóm item cha.
const DETAIL_LEAF_LABELS: Record<string, string> = {
  users: 'Chi tiết',
};

function isAdminRole(role?: UserRoleValue): boolean {
  return role === 'ADMIN';
}

// Không khai báo roles = chỉ quản trị viên thấy; khai báo thì thêm vai trò vào danh sách.
function hasAllowedRole(roles: UserRoleValue[] | undefined, role?: UserRoleValue): boolean {
  if (!isAdminRole(role)) {
    return false;
  }
  if (!roles || roles.length === 0) {
    return true;
  }
  return roles.includes(role!);
}

// Quản trị viên thấy tất cả; vai trò khác chỉ thấy mục không giới hạn hoặc có vai trò khớp.
export function getVisibleAdminMenu(role?: UserRoleValue): AdminMenuGroup[] {
  if (isAdminRole(role)) {
    return ADMIN_MENU;
  }
  return ADMIN_MENU.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => hasAllowedRole(item.roles, role))
      .map((item) =>
        item.children
          ? { ...item, children: item.children.filter((c) => hasAllowedRole(c.roles, role)) }
          : item
      )
      .filter((item) => !item.children || item.children.length > 0),
  })).filter((group) => group.items.length > 0);
}

function matchesSearch(search: string, matchSearch?: string): boolean {
  if (!matchSearch) {
    return true;
  }
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return matchSearch.split('&').every((pair) => {
    const [key, value] = pair.split('=');
    return params.get(key || '') === value;
  });
}

function stripSearch(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search;
}

// Tìm mục menu ứng với URL hiện tại (kèm chuỗi query), dùng cho tô sáng và breadcrumb.
export function resolveAdminMenuMatch(
  pathname: string,
  search = ''
): AdminMenuMatch | null {
  for (const group of ADMIN_MENU) {
    for (const item of group.items) {
      if (item.children) {
        const child = item.children.find((c) => isMenuChildActive(c, pathname, search));
        if (child) {
          return { group, item, child };
        }
        // Trang form/:id nằm dưới đường dẫn của một mục con nhưng không khớp query
        // (ví dụ /quan-tri/san-pham/moi) -> gán về item cha, không chọn mục con nào.
        const underChildPath = item.children.some(
          (c) => c.path && (pathname === c.path || pathname.startsWith(`${c.path}/`))
        );
        if (underChildPath) {
          return { group, item };
        }
      } else if (item.path && !item.isUpcoming) {
        const active =
          item.id === 'overview'
            ? pathname === '/quan-tri' || pathname === item.path
            : pathname === item.path || pathname.startsWith(`${item.path}/`);
        if (active) {
          return { group, item };
        }
      }
    }
  }
  return null;
}

// Có đúng một mục con đang chọn theo URL hay không (dùng cho tô sáng mục xổ xuống).
export function isMenuChildActive(child: AdminMenuLeaf, pathname: string, search = ''): boolean {
  if (!child.path || child.isUpcoming) {
    return false;
  }
  const pathMatch = pathname === child.path || pathname.startsWith(`${child.path}/`);
  return pathMatch && matchesSearch(stripSearch(search), child.matchSearch);
}

export function isMenuItemActive(item: AdminMenuItem, pathname: string, search = ''): boolean {
  return resolveAdminMenuMatch(pathname, search)?.item.id === item.id;
}

function buildDetailCrumb(item: AdminMenuItem, pathname: string): AdminBreadcrumb | null {
  const matchedChild = item.children?.find((c) => isMenuChildActive(c, pathname));
  const leafPath =
    matchedChild?.path ||
    item.children?.find((c) => c.path && pathname.startsWith(`${c.path}/`))?.path ||
    item.path;
  if (!leafPath || pathname.length <= leafPath.length) {
    return null;
  }
  const rest = pathname.slice(leafPath.length);
  if (rest === '/moi') {
    return { label: 'Thêm mới' };
  }
  if (rest.startsWith('/')) {
    return { label: DETAIL_LEAF_LABELS[item.id] || 'Chỉnh sửa' };
  }
  return null;
}

export function getAdminBreadcrumbs(pathname: string, search = ''): AdminBreadcrumb[] {
  if (pathname === '/quan-tri' || pathname === '/quan-tri/tong-quan') {
    return [{ label: ADMIN_MENU_ROOT_LABEL }, { label: 'Tổng quan' }];
  }
  const match = resolveAdminMenuMatch(pathname, search);
  if (!match) {
    return [{ label: ADMIN_MENU_ROOT_LABEL }, { label: ADMIN_MENU_FALLBACK_LABEL }];
  }
  const crumbs: AdminBreadcrumb[] = [{ label: ADMIN_MENU_ROOT_LABEL }, { label: match.item.label }];
  if (match.child) {
    crumbs.push({ label: match.child.label });
  }
  const detail = buildDetailCrumb(match.item, pathname);
  if (detail) {
    crumbs.push(detail);
  }
  return crumbs;
}

export function getAdminPageTitle(pathname: string, search = ''): string {
  const crumbs = getAdminBreadcrumbs(pathname, search).filter(
    (c) => c.label !== ADMIN_MENU_ROOT_LABEL
  );
  return crumbs[crumbs.length - 1]?.label || ADMIN_MENU_FALLBACK_LABEL;
}

// Danh sách đường dẫn có thể điều hướng — dùng cho test đối chiếu với router.
export function collectNavigableMenuPaths(): string[] {
  const paths: string[] = [];
  for (const group of ADMIN_MENU) {
    for (const item of group.items) {
      if (item.children) {
        for (const child of item.children) {
          if (!child.isUpcoming && child.path) {
            paths.push(child.path + (child.matchSearch ? `?${child.matchSearch}` : ''));
          }
        }
      } else if (!item.isUpcoming && item.path) {
        paths.push(item.path);
      }
    }
  }
  return paths;
}
