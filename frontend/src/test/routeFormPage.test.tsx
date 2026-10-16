import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AxiosError, AxiosHeaders } from 'axios';
import { RouteFormPage } from '../admin/pages/RouteFormPage';
import { routeApi } from '../admin/api/routeApi';
import { zoneApi } from '../admin/api/zoneApi';
import { poiApi } from '../admin/api/poiApi';
import { AdminRouteDetail } from '../admin/types/route';
import { AdminZonePageResponse } from '../admin/types/zone';
import { AdminPoiListItem, AdminPoiPageResponse } from '../admin/types/poi';

vi.mock('../admin/api/routeApi', () => ({
  routeApi: {
    getAdminRoutes: vi.fn(),
    getAdminRouteDetail: vi.fn(),
    createRoute: vi.fn(),
    updateRoute: vi.fn(),
    updateStops: vi.fn(),
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

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getAdminPois: vi.fn(),
  },
}));

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

const poiPage: AdminPoiPageResponse = {
  content: [
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
  ] as AdminPoiListItem[],
  totalElements: 3,
  totalPages: 1,
  size: 200,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

const renderCreate = () =>
  render(
    <MemoryRouter initialEntries={['/quan-tri/lo-trinh/moi']}>
      <Routes>
        <Route path="/quan-tri/lo-trinh" element={<div>Danh sách tuyến</div>} />
        <Route path="/quan-tri/lo-trinh/moi" element={<RouteFormPage />} />
        <Route path="/quan-tri/lo-trinh/:id" element={<div>Trang chỉnh sửa tuyến</div>} />
      </Routes>
    </MemoryRouter>
  );

const renderEdit = (id = 8) =>
  render(
    <MemoryRouter initialEntries={[`/quan-tri/lo-trinh/${id}`]}>
      <Routes>
        <Route path="/quan-tri/lo-trinh" element={<div>Danh sách tuyến</div>} />
        <Route path="/quan-tri/lo-trinh/:id" element={<RouteFormPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('RouteFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(zoneApi.getAdminZones).mockResolvedValue(zonePage);
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(poiPage);
  });

  it('chế độ tạo mới: hiển thị lỗi bắt buộc khi thiếu khu vực và tên', async () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: /tạo tuyến/i }));

    expect(await screen.findByText('Vui lòng chọn khu vực cho tuyến')).toBeInTheDocument();
    expect(screen.getByText('Tên tuyến không được để trống')).toBeInTheDocument();
    expect(routeApi.createRoute).not.toHaveBeenCalled();
  });

  it('chế độ tạo mới: gửi payload và chuyển sang trang chỉnh sửa tuyến vừa tạo', async () => {
    vi.mocked(routeApi.createRoute).mockResolvedValue({
      id: 10,
      zoneId: 1,
      zoneCode: 'Q1',
      name: 'Tuyến mới',
      displayOrder: 3,
      status: 'ACTIVE',
      stopCount: 0,
    });

    renderCreate();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /quận 1/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/^khu vực/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/tên tuyến/i), { target: { value: 'Tuyến mới' } });
    fireEvent.change(screen.getByLabelText(/thứ tự hiển thị/i), { target: { value: '3' } });

    fireEvent.click(screen.getByRole('button', { name: /tạo tuyến/i }));

    await waitFor(() => {
      expect(routeApi.createRoute).toHaveBeenCalledWith(
        expect.objectContaining({ zoneId: 1, name: 'Tuyến mới', displayOrder: 3 })
      );
    });

    expect(await screen.findByText('Trang chỉnh sửa tuyến')).toBeInTheDocument();
  });

  it('chế độ chỉnh sửa: nạp thông tin và danh sách điểm dừng theo thứ tự', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    renderEdit();

    await waitFor(() => {
      expect(routeApi.getAdminRouteDetail).toHaveBeenCalledWith(8);
    });

    expect((await screen.findByLabelText(/tên tuyến/i) as HTMLInputElement).value).toBe(
      'Tuyến di sản'
    );

    const list = screen.getByRole('list', { name: /danh sách điểm dừng theo thứ tự/i });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Điểm A');
    expect(items[1]).toHaveTextContent('Điểm B');
  });

  it('sắp xếp lại điểm dừng và lưu đúng thứ tự poiIds', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    vi.mocked(routeApi.updateStops).mockResolvedValue({
      id: 8,
      zoneId: 1,
      zoneCode: 'Q1',
      name: 'Tuyến di sản',
      displayOrder: 1,
      status: 'ACTIVE',
      stops: [
        { id: 2, code: 'B', name: 'Điểm B', stopOrder: 1 },
        { id: 5, code: 'A', name: 'Điểm A', stopOrder: 2 },
      ],
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Điểm A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /di chuyển điểm b lên trên/i }));
    fireEvent.click(screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i }));

    await waitFor(() => {
      expect(routeApi.updateStops).toHaveBeenCalledWith(8, { poiIds: [2, 5], version: 3 });
    });

    expect(await screen.findByText('Đã lưu thứ tự điểm dừng.')).toBeInTheDocument();
  });

  it('thêm điểm dừng mới từ danh sách khả dụng rồi lưu', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    vi.mocked(routeApi.updateStops).mockResolvedValue({
      id: 8,
      zoneId: 1,
      zoneCode: 'Q1',
      name: 'Tuyến di sản',
      displayOrder: 1,
      status: 'ACTIVE',
      stops: [
        { id: 5, code: 'A', name: 'Điểm A', stopOrder: 1 },
        { id: 2, code: 'B', name: 'Điểm B', stopOrder: 2 },
        { id: 9, code: 'C', name: 'Điểm C', stopOrder: 3 },
      ],
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Điểm A')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/thêm điểm dừng/i), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: /\+ thêm/i }));

    expect(await screen.findByText('Điểm C')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i }));

    await waitFor(() => {
      expect(routeApi.updateStops).toHaveBeenCalledWith(8, { poiIds: [5, 2, 9], version: 3 });
    });
  });

  it('gỡ điểm dừng khỏi danh sách và lưu danh sách còn lại', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    vi.mocked(routeApi.updateStops).mockResolvedValue({
      id: 8,
      zoneId: 1,
      zoneCode: 'Q1',
      name: 'Tuyến di sản',
      displayOrder: 1,
      status: 'ACTIVE',
      stops: [{ id: 2, code: 'B', name: 'Điểm B', stopOrder: 1 }],
    });

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Điểm A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /gỡ điểm a khỏi tuyến/i }));
    fireEvent.click(screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i }));

    await waitFor(() => {
      expect(routeApi.updateStops).toHaveBeenCalledWith(8, { poiIds: [2], version: 3 });
    });
  });

  it('khi lưu thứ tự thất bại thì khôi phục trạng thái máy chủ và hiển thị lỗi', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    vi.mocked(routeApi.updateStops).mockRejectedValue(new Error('Không thể lưu thứ tự điểm dừng.'));

    renderEdit();

    await waitFor(() => {
      expect(screen.getByText('Điểm A')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /lưu thứ tự điểm dừng/i });
    fireEvent.click(screen.getByRole('button', { name: /di chuyển điểm b lên trên/i }));
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    expect(await screen.findByText('Không thể lưu thứ tự điểm dừng.')).toBeInTheDocument();

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });

    const list = screen.getByRole('list', { name: /danh sách điểm dừng theo thứ tự/i });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Điểm A');
  });

  it('chặn phía client khi ngừng hoạt động tuyến còn điểm dừng', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    renderEdit();

    await waitFor(() => {
      expect(screen.getByLabelText(/tên tuyến/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/trạng thái/i), { target: { value: 'INACTIVE' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu thông tin tuyến/i }));

    expect(
      await screen.findByText(/không thể ngừng hoạt động tuyến khi vẫn còn 2 điểm dừng/i)
    ).toBeInTheDocument();
    expect(routeApi.updateRoute).not.toHaveBeenCalled();
  });

  it('hiển thị hộp thoại xung đột khi cập nhật tuyến trả về 409 và tải lại khi xác nhận', async () => {
    vi.mocked(routeApi.getAdminRouteDetail).mockResolvedValue(detail);
    vi.mocked(routeApi.updateRoute).mockRejectedValue(
      new AxiosError('Conflict', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'Nội dung đã được người khác cập nhật. Vui lòng tải lại trang.' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      })
    );

    renderEdit();

    await waitFor(() => {
      expect(screen.getByLabelText(/tên tuyến/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tên tuyến/i), { target: { value: 'Tuyến đổi tên' } });
    fireEvent.click(screen.getByRole('button', { name: /lưu thông tin tuyến/i }));

    expect(
      await screen.findByText(/Nội dung đã được người khác cập nhật/i)
    ).toBeInTheDocument();
    expect(routeApi.updateRoute).toHaveBeenCalledWith(8, expect.objectContaining({ version: 3 }));

    fireEvent.click(screen.getByRole('button', { name: /tải lại/i }));
    await waitFor(() => {
      expect(routeApi.getAdminRouteDetail).toHaveBeenCalledTimes(2);
    });
  });
});
