import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RouteStopsPage } from '../admin/pages/RouteStopsPage';
import { routeApi } from '../admin/api/routeApi';
import { zoneApi } from '../admin/api/zoneApi';
import { poiApi } from '../admin/api/poiApi';
import { AdminRouteDetail, AdminRouteListItem, AdminRoutePageResponse } from '../admin/types/route';
import { AdminZonePageResponse } from '../admin/types/zone';
import { AdminPoiListItem, AdminPoiPageResponse } from '../admin/types/poi';

vi.mock('../admin/api/routeApi', () => ({
  routeApi: {
    getAdminRoutes: vi.fn(),
    getAdminRouteDetail: vi.fn(),
    updateStops: vi.fn(),
  },
}));

vi.mock('../admin/api/zoneApi', () => ({
  zoneApi: {
    getAdminZones: vi.fn(),
  },
}));

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getAdminPois: vi.fn(),
  },
}));

const routeRows: AdminRouteListItem[] = [
  {
    id: 8,
    zoneId: 1,
    zoneCode: 'Q1',
    zoneName: 'Quận 1',
    name: 'Tuyến di sản',
    displayOrder: 1,
    status: 'ACTIVE',
    stopCount: 2,
  },
  {
    id: 9,
    zoneId: 1,
    zoneCode: 'Q1',
    zoneName: 'Quận 1',
    name: 'Tuyến ẩm thực',
    displayOrder: 2,
    status: 'INACTIVE',
    stopCount: 0,
  },
];

const routePage = (content: AdminRouteListItem[]): AdminRoutePageResponse => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: 200,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
});

const zonePage: AdminZonePageResponse = {
  content: [
    {
      id: 1,
      code: 'Q1',
      name: 'Quận 1',
      centerLat: 10.77,
      centerLng: 106.7,
      radiusMeters: 1000,
      isActive: true,
      poiCount: 3,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  size: 200,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

const detail: AdminRouteDetail = {
  id: 8,
  zoneId: 1,
  zoneCode: 'Q1',
  zoneName: 'Quận 1',
  name: 'Tuyến di sản',
  description: 'Mô tả tuyến',
  displayOrder: 1,
  status: 'ACTIVE',
  stopCount: 2,
  stops: [
    { id: 5, code: 'A', name: 'Điểm A' },
    { id: 2, code: 'B', name: 'Điểm B' },
  ],
  version: 3,
};

const poRows: AdminPoiListItem[] = [
  {
    id: 5,
    code: 'A',
    name: 'Điểm A',
    zoneId: 1,
    zoneCode: 'Q1',
    status: 'ACTIVE',
    version: 0,
    publishStatus: 'PUBLISHED',
    audioStatusByLanguage: {},
  },
  {
    id: 2,
    code: 'B',
    name: 'Điểm B',
    zoneId: 1,
    zoneCode: 'Q1',
    status: 'ACTIVE',
    version: 0,
    publishStatus: 'PUBLISHED',
    audioStatusByLanguage: {},
  },
  {
    id: 9,
    code: 'C',
    name: 'Điểm C',
    zoneId: 1,
    zoneCode: 'Q1',
    status: 'ACTIVE',
    version: 0,
    publishStatus: 'PUBLISHED',
    audioStatusByLanguage: {},
  },
];

const poiPage: AdminPoiPageResponse = {
  content: poRows,
  totalElements: poRows.length,
  totalPages: 1,
  size: 200,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <RouteStopsPage />
    </MemoryRouter>
  );

describe('RouteStopsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(routeApi.getAdminRoutes).mockResolvedValue(routePage(routeRows));
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    vi.mocked(zoneApi.getAdminZones).mockResolvedValue(zonePage);
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(poiPage);
  });

  const waitForEditor = async () => {
    await waitFor(() => {
      expect(screen.getByText('Điểm A')).toBeInTheDocument();
      expect(screen.getByText('Điểm B')).toBeInTheDocument();
    });
  };

  it('tự chọn tuyến đầu tiên và hiển thị thứ tự điểm dừng hiện tại', async () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Thứ tự điểm dừng' })).toBeInTheDocument();
    await waitForEditor();

    expect(routeApi.getAdminRouteDetail).toHaveBeenCalledWith(8);
    expect(poiApi.getAdminPois).toHaveBeenCalledWith({ zoneId: 1, size: 200 });
    expect(screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i })).toBeDisabled();
  });

  it('di chuyển điểm dừng và lưu đúng thứ tự mới kèm version', async () => {
    vi.mocked(routeApi.updateStops).mockResolvedValue({
      id: 8,
      zoneId: 1,
      zoneCode: 'Q1',
      zoneName: 'Quận 1',
      name: 'Tuyến di sản',
      displayOrder: 1,
      status: 'ACTIVE',
      stopCount: 2,
      stops: [
        { id: 2, code: 'B', name: 'Điểm B' },
        { id: 5, code: 'A', name: 'Điểm A' },
      ],
      version: 4,
    });

    renderPage();
    await waitForEditor();

    fireEvent.click(screen.getByRole('button', { name: /di chuyển điểm b lên trên/i }));

    expect(screen.getByText(/có thay đổi chưa lưu/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i }));

    await waitFor(() => {
      expect(routeApi.updateStops).toHaveBeenCalledWith(8, {
        poiIds: [2, 5],
        version: 3,
      });
    });

    expect(await screen.findByText(/đã lưu thứ tự điểm dừng/i)).toBeInTheDocument();
  });

  it('thêm điểm dừng mới vào cuối lộ trình trước khi lưu', async () => {
    vi.mocked(routeApi.updateStops).mockResolvedValue({
      id: 8,
      zoneId: 1,
      zoneCode: 'Q1',
      zoneName: 'Quận 1',
      name: 'Tuyến di sản',
      displayOrder: 1,
      status: 'ACTIVE',
      stopCount: 3,
      stops: [
        { id: 5, code: 'A', name: 'Điểm A' },
        { id: 2, code: 'B', name: 'Điểm B' },
        { id: 9, code: 'C', name: 'Điểm C' },
      ],
      version: 4,
    });

    renderPage();
    await waitForEditor();

    fireEvent.change(screen.getByLabelText('Thêm điểm dừng'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ thêm/i }));

    expect(screen.getByText('Điểm C')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i }));

    await waitFor(() => {
      expect(routeApi.updateStops).toHaveBeenCalledWith(8, {
        poiIds: [5, 2, 9],
        version: 3,
      });
    });
  });

  it('lọc danh sách tuyến theo từ khóa tìm kiếm', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Tuyến ẩm thực')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tìm tuyến để sắp xếp điểm dừng/i), {
      target: { value: 'ẩm thực' },
    });

    const routeList = screen.getByRole('complementary', { name: /danh sách tuyến/i });
    expect(within(routeList).getByText('Tuyến ẩm thực')).toBeInTheDocument();
    expect(within(routeList).queryByText('Tuyến di sản')).not.toBeInTheDocument();
  });

  it('xác nhận trước khi chuyển tuyến nếu đang có thay đổi chưa lưu', async () => {
    renderPage();
    await waitForEditor();

    fireEvent.click(screen.getByRole('button', { name: /di chuyển điểm b lên trên/i }));

    const routeList = screen.getByRole('complementary', { name: /danh sách tuyến/i });
    fireEvent.click(within(routeList).getByRole('button', { name: /tuyến ẩm thực/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/chuyển tuyến khi chưa lưu/i)).toBeInTheDocument();
    expect(routeApi.getAdminRouteDetail).not.toHaveBeenCalledWith(9);
  });

  it('hiển thị thông báo khi danh sách tuyến trống', async () => {
    vi.mocked(routeApi.getAdminRoutes).mockResolvedValue(routePage([]));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/không có tuyến nào phù hợp/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Chưa chọn tuyến')).toBeInTheDocument();
  });
});
