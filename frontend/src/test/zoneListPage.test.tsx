import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ZoneListPage } from '../admin/pages/ZoneListPage';
import { zoneApi } from '../admin/api/zoneApi';
import { AdminZoneListItem, AdminZonePageResponse } from '../admin/types/zone';

vi.mock('../admin/api/zoneApi', () => ({
  zoneApi: {
    getAdminZones: vi.fn(),
    getAdminZoneDetail: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
    updateZoneStatus: vi.fn(),
  },
}));

const pageOf = (
  content: AdminZoneListItem[],
  overrides: Partial<AdminZonePageResponse> = {}
): AdminZonePageResponse => ({
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

const mockRows: AdminZoneListItem[] = [
  {
    id: 1,
    code: 'Q1_HISTORIC',
    name: 'Trung tâm Quận 1',
    centerLat: 10.7769,
    centerLng: 106.7009,
    radiusMeters: 1200,
    isActive: true,
    poiCount: 5,
  },
  {
    id: 2,
    code: 'Q3_FOOD',
    name: 'Phố ẩm thực Quận 3',
    centerLat: 10.7825,
    centerLng: 106.687,
    radiusMeters: 800,
    isActive: false,
    poiCount: 0,
  },
];

describe('ZoneListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(zoneApi.getAdminZones).mockResolvedValue(pageOf(mockRows));
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/khu-vuc']}>
        <Routes>
          <Route path="/quan-tri/khu-vuc" element={<ZoneListPage />} />
          <Route path="/quan-tri/khu-vuc/moi" element={<div>Trang tạo mới</div>} />
          <Route path="/quan-tri/khu-vuc/:id" element={<div>Trang chỉnh sửa</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('hiển thị trạng thái đang tải khi dữ liệu chưa về', () => {
    vi.mocked(zoneApi.getAdminZones).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('gọi endpoint admin với tham số phân trang mặc định', async () => {
    renderComponent();

    await waitFor(() => {
      expect(zoneApi.getAdminZones).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined,
        isActive: undefined,
      });
    });
  });

  it('hiển thị danh sách khu vực kèm mã, bán kính, số điểm và trạng thái', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Phố ẩm thực Quận 3')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Q1_HISTORIC')).toBeInTheDocument();
    expect(within(table).getByText('1.200 m')).toBeInTheDocument();
    expect(within(table).getByText('Hoạt động')).toBeInTheDocument();
    expect(within(table).getByText('Tạm ngưng')).toBeInTheDocument();
  });

  it('hiển thị ErrorState kèm nút Thử lại và tải lại thành công', async () => {
    vi.mocked(zoneApi.getAdminZones)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(pageOf(mockRows));
    renderComponent();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/không thể tải danh sách khu vực/i);

    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }));

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });
  });

  it('hiển thị EmptyState khi chưa có khu vực nào', async () => {
    vi.mocked(zoneApi.getAdminZones).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có khu vực nào')).toBeInTheDocument();
    });
  });

  it('tìm kiếm gửi tham số search đã trim lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tìm kiếm khu vực/i), {
      target: { value: '  quận 3  ' },
    });

    await waitFor(() => {
      expect(zoneApi.getAdminZones).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'quận 3', page: 0 })
      );
    });
  });

  it('lọc theo trạng thái gửi isActive lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/lọc theo trạng thái khu vực/i), {
      target: { value: 'false' },
    });

    await waitFor(() => {
      expect(zoneApi.getAdminZones).toHaveBeenLastCalledWith(
        expect.objectContaining({ isActive: false, page: 0 })
      );
    });
  });

  it('ngừng hoạt động khu vực: gọi endpoint trạng thái một lần và cập nhật từ phản hồi', async () => {
    vi.mocked(zoneApi.updateZoneStatus).mockResolvedValue({
      id: 1,
      code: 'Q1_HISTORIC',
      name: 'Trung tâm Quận 1',
      description: 'Khu vực trung tâm',
      centerLat: 10.7769,
      centerLng: 106.7009,
      radiusMeters: 1200,
      isActive: false,
      poiCount: 5,
      routeCount: 1,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ngừng hoạt động trung tâm quận 1/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /ngừng hoạt động/i }));

    await waitFor(() => {
      expect(zoneApi.updateZoneStatus).toHaveBeenCalledTimes(1);
      expect(zoneApi.updateZoneStatus).toHaveBeenCalledWith(1, false);
    });

    expect(zoneApi.getAdminZoneDetail).not.toHaveBeenCalled();
    expect(zoneApi.updateZone).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/đã ngừng hoạt động khu vực "Trung tâm Quận 1"/i)).toBeInTheDocument();
    });

    expect(zoneApi.getAdminZones).toHaveBeenCalledTimes(1);
  });

  it('lỗi cập nhật trạng thái giữ nguyên trạng thái cũ và hiển thị thông báo', async () => {
    vi.mocked(zoneApi.updateZoneStatus).mockRejectedValue(
      new Error(
        'Không thể ngừng hoạt động khu vực khi vẫn còn 5 điểm thuyết minh thuộc khu vực này.'
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ngừng hoạt động trung tâm quận 1/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /ngừng hoạt động/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/không thể ngừng hoạt động khu vực/i);
    expect(zoneApi.getAdminZones).toHaveBeenCalledTimes(1);
  });

  it('gợi ý bộ lọc trạng thái áp dụng bộ lọc và hiển thị chip có thể xóa', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/tìm kiếm khu vực/i);
    fireEvent.focus(searchInput);
    fireEvent.click(await screen.findByRole('option', { name: /khu vực đang hoạt động/i }));

    await waitFor(() => {
      expect(zoneApi.getAdminZones).toHaveBeenLastCalledWith(
        expect.objectContaining({ isActive: true, page: 0 })
      );
    });

    const chip = await screen.findByRole('button', {
      name: /xóa bộ lọc trạng thái: hoạt động/i,
    });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(zoneApi.getAdminZones).toHaveBeenLastCalledWith(
        expect.objectContaining({ isActive: undefined, page: 0 })
      );
    });
    expect(screen.queryByRole('button', { name: /xóa bộ lọc trạng thái/i })).not.toBeInTheDocument();
  });

  it('gợi ý từ khóa chọn tên khu vực và gửi tìm kiếm lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Trung tâm Quận 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/tìm kiếm khu vực/i);
    fireEvent.change(searchInput, { target: { value: 'phố' } });
    fireEvent.click(await screen.findByRole('option', { name: /phố ẩm thực quận 3/i }));

    await waitFor(() => {
      expect(zoneApi.getAdminZones).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Phố ẩm thực Quận 3', page: 0 })
      );
    });
    expect(searchInput).toHaveValue('Phố ẩm thực Quận 3');
    expect(screen.getByRole('button', { name: /xóa bộ lọc từ khóa: phố ẩm thực quận 3/i })).toBeInTheDocument();
  });

  it('nút "Thêm khu vực mới" ở EmptyState điều hướng SPA, không tải lại trang', async () => {
    vi.mocked(zoneApi.getAdminZones).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có khu vực nào')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /thêm khu vực mới/i }));

    await waitFor(() => {
      expect(screen.getByText('Trang tạo mới')).toBeInTheDocument();
    });
  });
});
