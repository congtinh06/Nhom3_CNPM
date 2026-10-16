import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RouteListPage } from '../admin/pages/RouteListPage';
import { routeApi } from '../admin/api/routeApi';
import { zoneApi } from '../admin/api/zoneApi';
import { AdminRouteListItem, AdminRoutePageResponse } from '../admin/types/route';
import { AdminZonePageResponse } from '../admin/types/zone';

vi.mock('../admin/api/routeApi', () => ({
  routeApi: {
    getAdminRoutes: vi.fn(),
    getAdminRouteDetail: vi.fn(),
    createRoute: vi.fn(),
    updateRoute: vi.fn(),
    updateStops: vi.fn(),
    updateRouteStatus: vi.fn(),
  },
}));

vi.mock('../admin/api/zoneApi', () => ({
  zoneApi: {
    getAdminZones: vi.fn(),
    getAdminZoneDetail: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
  },
}));

const pageOf = (
  content: AdminRouteListItem[],
  overrides: Partial<AdminRoutePageResponse> = {}
): AdminRoutePageResponse => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
  ...overrides,
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
    {
      id: 2,
      code: 'Q3',
      name: 'Quận 3',
      centerLat: 10.78,
      centerLng: 106.69,
      radiusMeters: 800,
      isActive: true,
      poiCount: 1,
    },
  ],
  totalElements: 2,
  totalPages: 1,
  size: 200,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

const mockRows: AdminRouteListItem[] = [
  {
    id: 1,
    zoneId: 1,
    zoneCode: 'Q1',
    zoneName: 'Quận 1',
    name: 'Tuyến di sản',
    displayOrder: 1,
    status: 'ACTIVE',
    stopCount: 4,
  },
  {
    id: 2,
    zoneId: 2,
    zoneCode: 'Q3',
    zoneName: 'Quận 3',
    name: 'Tuyến ẩm thực',
    displayOrder: 2,
    status: 'INACTIVE',
    stopCount: 0,
  },
];

describe('RouteListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(zoneApi.getAdminZones).mockResolvedValue(zonePage);
    vi.mocked(routeApi.getAdminRoutes).mockResolvedValue(pageOf(mockRows));
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/lo-trinh']}>
        <Routes>
          <Route path="/quan-tri/lo-trinh" element={<RouteListPage />} />
          <Route path="/quan-tri/lo-trinh/moi" element={<div>Trang tạo mới</div>} />
          <Route path="/quan-tri/lo-trinh/:id" element={<div>Trang chỉnh sửa</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('hiển thị trạng thái đang tải khi dữ liệu chưa về', () => {
    vi.mocked(routeApi.getAdminRoutes).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('gọi endpoint admin với tham số phân trang mặc định', async () => {
    renderComponent();

    await waitFor(() => {
      expect(routeApi.getAdminRoutes).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined,
        zoneId: undefined,
        status: undefined,
      });
    });
  });

  it('hiển thị danh sách tuyến kèm khu vực, thứ tự, số điểm dừng và trạng thái', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tuyến di sản')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(within(table).getByText('Tuyến ẩm thực')).toBeInTheDocument();
    expect(within(table).getByText('Hoạt động')).toBeInTheDocument();
    expect(within(table).getByText('Tạm ngưng')).toBeInTheDocument();
    expect(table).toHaveTextContent('Quận 1');
  });

  it('hiển thị ErrorState kèm nút Thử lại và tải lại thành công', async () => {
    vi.mocked(routeApi.getAdminRoutes)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(pageOf(mockRows));
    renderComponent();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/không thể tải danh sách tuyến/i);

    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }));

    await waitFor(() => {
      expect(screen.getByText('Tuyến di sản')).toBeInTheDocument();
    });
  });

  it('hiển thị EmptyState khi chưa có tuyến nào', async () => {
    vi.mocked(routeApi.getAdminRoutes).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có tuyến tham quan nào')).toBeInTheDocument();
    });
  });

  it('lọc theo khu vực gửi zoneId lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tuyến di sản')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/lọc theo khu vực/i), { target: { value: '1' } });

    await waitFor(() => {
      expect(routeApi.getAdminRoutes).toHaveBeenLastCalledWith(
        expect.objectContaining({ zoneId: 1, page: 0 })
      );
    });
  });

  it('lọc theo trạng thái gửi status lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tuyến di sản')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/lọc theo trạng thái tuyến/i), {
      target: { value: 'INACTIVE' },
    });

    await waitFor(() => {
      expect(routeApi.getAdminRoutes).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'INACTIVE', page: 0 })
      );
    });
  });

  it('ngừng hoạt động tuyến: gọi endpoint trạng thái một lần và cập nhật từ phản hồi', async () => {
    vi.mocked(routeApi.updateRouteStatus).mockResolvedValue({
      id: 1,
      zoneId: 1,
      zoneCode: 'Q1',
      zoneName: 'Quận 1',
      name: 'Tuyến di sản',
      description: 'Mô tả tuyến',
      displayOrder: 1,
      status: 'INACTIVE',
      stopCount: 4,
      stops: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tuyến di sản')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ngừng hoạt động tuyến di sản/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /ngừng hoạt động/i }));

    await waitFor(() => {
      expect(routeApi.updateRouteStatus).toHaveBeenCalledTimes(1);
      expect(routeApi.updateRouteStatus).toHaveBeenCalledWith(1, false);
    });

    expect(routeApi.getAdminRouteDetail).not.toHaveBeenCalled();
    expect(routeApi.updateRoute).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/đã ngừng hoạt động tuyến "Tuyến di sản"/i)).toBeInTheDocument();
    });

    expect(routeApi.getAdminRoutes).toHaveBeenCalledTimes(1);
  });

  it('lỗi cập nhật trạng thái giữ nguyên trạng thái cũ và hiển thị thông báo', async () => {
    vi.mocked(routeApi.updateRouteStatus).mockRejectedValue(
      new Error('Không thể ngừng hoạt động tuyến khi vẫn còn 4 điểm dừng.')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tuyến di sản')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ngừng hoạt động tuyến di sản/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /ngừng hoạt động/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/không thể ngừng hoạt động tuyến/i);
    expect(routeApi.getAdminRoutes).toHaveBeenCalledTimes(1);
  });

  it('nút "Thêm tuyến mới" ở EmptyState điều hướng SPA, không tải lại trang', async () => {
    vi.mocked(routeApi.getAdminRoutes).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có tuyến tham quan nào')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /thêm tuyến mới/i }));

    await waitFor(() => {
      expect(screen.getByText('Trang tạo mới')).toBeInTheDocument();
    });
  });
});
