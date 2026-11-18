import { describe, it, expect } from 'vitest';
import {
  ADMIN_MENU,
  ADMIN_MENU_ROOT_LABEL,
  collectNavigableMenuPaths,
  getAdminBreadcrumbs,
  getAdminPageTitle,
  getVisibleAdminMenu,
  resolveAdminMenuMatch,
} from '../admin/config/adminMenu';
import type { AdminMenuItem } from '../admin/config/adminMenu';

const allItems: AdminMenuItem[] = ADMIN_MENU.flatMap((g) => g.items);
const allChildren = allItems.flatMap((i) => i.children ?? []);

describe('Cấu hình menu quản trị', () => {
  it('mã mục và mã mục con không trùng nhau', () => {
    const ids = [...allItems.map((i) => i.id), ...allChildren.map((c) => c.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('đường dẫn điều hướng không trùng nhau', () => {
    const paths = collectNavigableMenuPaths();
    expect(paths.length).toBeGreaterThan(0);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('mọi mục đều có đường dẫn bắt đầu bằng /quan-tri, không còn mục "Sắp có"', () => {
    for (const item of allItems) {
      if (item.children) {
        expect(item.path).toBeUndefined();
        expect(item.children.length).toBeGreaterThan(0);
        for (const child of item.children) {
          expect(child.isUpcoming).toBeFalsy();
          expect(child.path).toMatch(/^\/quan-tri\//);
        }
      } else {
        expect(item.isUpcoming).toBeFalsy();
        expect(item.path).toMatch(/^\/quan-tri\//);
      }
    }
  });

  it('mục không có con thì có icon, mục có con thì không vừa mang đường dẫn', () => {
    for (const item of allItems) {
      expect(item.icon).toBeTruthy();
      if (item.children) {
        expect(item.path).toBeUndefined();
      }
    }
  });

  it('cấu trúc đúng theo yêu cầu: đủ nhóm và các trang đang có', () => {
    expect(ADMIN_MENU.map((g) => g.id)).toEqual(['main', 'content', 'ops', 'system']);
    const pois = allItems.find((i) => i.id === 'pois');
    expect(pois?.children?.map((c) => c.label)).toEqual([
      'Danh sách điểm',
      'Bản dịch và audio',
      'Mã QR',
      'Nhật ký xử lý lỗi',
    ]);
    expect(pois?.children?.[0]?.path).toBe('/quan-tri/diem-thuyet-minh');
    expect(pois?.children?.find((c) => c.id === 'pois-i18n')?.path).toBe(
      '/quan-tri/diem-thuyet-minh/ban-dich'
    );
    expect(pois?.children?.find((c) => c.id === 'pois-qr')?.path).toBe(
      '/quan-tri/diem-thuyet-minh/ma-qr'
    );
    expect(pois?.children?.find((c) => c.id === 'pois-error-log')?.path).toBe(
      '/quan-tri/diem-thuyet-minh/nhat-ky-loi'
    );
    const food = allItems.find((i) => i.id === 'food');
    expect(food?.label).toBe('Quà lưu niệm');
    expect(food?.children?.map((c) => c.label)).toEqual(['Sản phẩm']);
    expect(food?.children?.[0]).toMatchObject({ label: 'Sản phẩm', matchSearch: 'category=SOUVENIR' });
    const users = allItems.find((i) => i.id === 'users');
    expect(users?.children?.map((c) => c.label)).toEqual(['Tài khoản']);
    expect(users?.children?.[0]).toMatchObject({ label: 'Tài khoản', path: '/quan-tri/nguoi-dung' });
  });

  it('khu vực và tổng quan là mục đơn, không xổ xuống', () => {
    const zones = allItems.find((i) => i.id === 'zones');
    const overview = allItems.find((i) => i.id === 'overview');
    expect(zones?.children).toBeUndefined();
    expect(zones?.path).toBe('/quan-tri/khu-vuc');
    expect(overview?.path).toBe('/quan-tri/tong-quan');
  });
});

describe('Breadcrumb từ cấu hình menu', () => {
  it('trang danh sách con: Quản trị, Điểm thuyết minh, Danh sách điểm', () => {
    expect(getAdminBreadcrumbs('/quan-tri/diem-thuyet-minh')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Điểm thuyết minh' },
      { label: 'Danh sách điểm' },
    ]);
  });

  it('trang form thêm mới có cấp "Thêm mới"', () => {
    expect(getAdminBreadcrumbs('/quan-tri/diem-thuyet-minh/moi')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Điểm thuyết minh' },
      { label: 'Danh sách điểm' },
      { label: 'Thêm mới' },
    ]);
  });

  it('chi tiết người dùng có cấp "Chi tiết"', () => {
    expect(getAdminBreadcrumbs('/quan-tri/nguoi-dung/7')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Người dùng' },
      { label: 'Tài khoản' },
      { label: 'Chi tiết' },
    ]);
  });

  it('các trang con của Điểm thuyết minh có breadcrumb và chọn đúng mục con', () => {
    expect(getAdminBreadcrumbs('/quan-tri/diem-thuyet-minh/ban-dich')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Điểm thuyết minh' },
      { label: 'Bản dịch và audio' },
    ]);
    expect(getAdminBreadcrumbs('/quan-tri/diem-thuyet-minh/ma-qr')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Điểm thuyết minh' },
      { label: 'Mã QR' },
    ]);
    expect(getAdminBreadcrumbs('/quan-tri/diem-thuyet-minh/nhat-ky-loi')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Điểm thuyết minh' },
      { label: 'Nhật ký xử lý lỗi' },
    ]);
    expect(resolveAdminMenuMatch('/quan-tri/diem-thuyet-minh/ban-dich')?.child?.id).toBe(
      'pois-i18n'
    );
    expect(resolveAdminMenuMatch('/quan-tri/diem-thuyet-minh/ma-qr')?.child?.id).toBe('pois-qr');
    expect(resolveAdminMenuMatch('/quan-tri/diem-thuyet-minh/nhat-ky-loi')?.child?.id).toBe(
      'pois-error-log'
    );
    expect(resolveAdminMenuMatch('/quan-tri/diem-thuyet-minh/12')?.child?.id).toBe('pois-list');
  });

  it('quà lưu niệm phân theo query, trang form không chọn mục con nào', () => {
    expect(getAdminBreadcrumbs('/quan-tri/san-pham', '?category=SOUVENIR')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Quà lưu niệm' },
      { label: 'Sản phẩm' },
    ]);
    expect(getAdminBreadcrumbs('/quan-tri/san-pham/moi')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Quà lưu niệm' },
      { label: 'Thêm mới' },
    ]);
  });

  it('trang tổng quan và trang lạ', () => {
    expect(getAdminBreadcrumbs('/quan-tri/tong-quan')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Tổng quan' },
    ]);
    expect(getAdminBreadcrumbs('/quan-tri/khong-ton-tai')).toEqual([
      { label: ADMIN_MENU_ROOT_LABEL },
      { label: 'Trang quản trị' },
    ]);
  });

  it('tiêu đề trang lấy nhãn cuối của breadcrumb', () => {
    expect(getAdminPageTitle('/quan-tri/diem-thuyet-minh')).toBe('Danh sách điểm');
    expect(getAdminPageTitle('/quan-tri/san-pham', '?category=SOUVENIR')).toBe('Sản phẩm');
  });
});

describe('Tô sáng theo URL và lọc theo vai trò', () => {
  it('khớp đúng mục con theo cả path và query', () => {
    expect(resolveAdminMenuMatch('/quan-tri/san-pham', '?category=SOUVENIR')?.child?.id).toBe(
      'food-souvenirs'
    );
    expect(resolveAdminMenuMatch('/quan-tri/san-pham')?.child).toBeUndefined();
    expect(resolveAdminMenuMatch('/quan-tri/diem-thuyet-minh/3')?.child?.id).toBe('pois-list');
  });

  it('quản trị viên thấy tất cả, vai trò khác không thấy mục không được cấp', () => {
    expect(getVisibleAdminMenu('ADMIN')).toBe(ADMIN_MENU);
    expect(getVisibleAdminMenu('USER')).toEqual([]);
    expect(getVisibleAdminMenu(undefined)).toEqual([]);
  });
});
