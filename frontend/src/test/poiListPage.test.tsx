import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PoiListPage } from '../admin/pages/PoiListPage';
import { poiApi } from '../admin/api/poiApi';
import { AdminPoiDetail, AdminPoiListItem, AdminPoiPageResponse } from '../admin/types/poi';

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getAdminPois: vi.fn(),
    getZones: vi.fn(),
    getRoutes: vi.fn(),
    updatePoiStatus: vi.fn(),
  },
}));

const pageOf = (content: AdminPoiListItem[], overrides: Partial<AdminPoiPageResponse> = {}): AdminPoiPageResponse => ({
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

const mockRows: AdminPoiListItem[] = [
  {
    id: 1,
    code: 'BEN_THANH',
    name: 'Chợ Bến Thành',
    zoneId: 1,
    zoneCode: 'Q1',
    routeId: 7,
    routeName: 'Tuyến trung tâm',
    stopOrder: 2,
    status: 'ACTIVE',
    version: 3,
    publishStatus: 'PUBLISHED',
    audioStatusByLanguage: { vi: 'PENDING', en: 'PENDING', ja: 'READY', ko: 'READY' },
    overallStatus: 'ACTIVE',
    attentionReasons: [],
    languageSummary: { total: 4, ready: 2, pending: 2, failed: 0 },
    languages: [
      { languageCode: 'vi', languageName: 'Tiếng Việt', audioStatus: 'PENDING', audioDurationSeconds: 0, lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'en', languageName: 'Tiếng Anh', audioStatus: 'PENDING', audioDurationSeconds: 0, lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'ja', languageName: 'Tiếng Nhật', audioStatus: 'READY', audioDurationSeconds: 33, lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'ko', languageName: 'Tiếng Hàn', audioStatus: 'READY', audioDurationSeconds: 29, lastAttemptAt: '2026-10-14T08:00:00' },
    ],
  },
  {
    id: 2,
    code: 'DINH_DOC_LAP',
    name: 'Dinh Độc Lập',
    zoneId: 1,
    zoneCode: 'Q1',
    routeId: null,
    routeName: null,
    stopOrder: null,
    status: 'INACTIVE',
    version: 0,
    publishStatus: 'FAILED',
    audioStatusByLanguage: { vi: 'FAILED_TTS', en: 'PENDING', ja: 'FAILED_TTS', ko: 'FAILED_TTS' },
    overallStatus: 'HIDDEN',
    attentionReasons: ['Tiếng Việt: lỗi tổng hợp giọng đọc'],
    languageSummary: { total: 4, ready: 0, pending: 1, failed: 3 },
    languages: [
      { languageCode: 'vi', languageName: 'Tiếng Việt', audioStatus: 'FAILED_TTS', audioDurationSeconds: 0, errorReason: 'TTS timeout', lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'en', languageName: 'Tiếng Anh', audioStatus: 'PENDING', audioDurationSeconds: 0, lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'ja', languageName: 'Tiếng Nhật', audioStatus: 'FAILED_TTS', audioDurationSeconds: 0, errorReason: 'TTS timeout', lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'ko', languageName: 'Tiếng Hàn', audioStatus: 'FAILED_TTS', audioDurationSeconds: 0, errorReason: 'TTS timeout', lastAttemptAt: '2026-10-14T08:00:00' },
    ],
  },
];

const mockZones = [
  { id: 1, code: 'Q1', name: 'Quận 1' },
  { id: 2, code: 'Q3', name: 'Quận 3' },
];

const mockRoutes = [{ id: 7, zoneId: 1, name: 'Tuyến trung tâm' }];

// Mô phỏng máy chủ: request size=1 + overallStatus=NEEDS_ATTENTION là dòng đếm,
// còn lại lọc theo overallStatus/languageStatus như backend thật.
const mockList = (
  content: AdminPoiListItem[],
  overrides: Partial<AdminPoiPageResponse> = {},
  attentionTotal = 0
) => {
  vi.mocked(poiApi.getAdminPois).mockImplementation(async (params) => {
    if (params.overallStatus === 'NEEDS_ATTENTION' && params.size === 1) {
      return pageOf([], { totalElements: attentionTotal });
    }
    let filtered = content;
    if (params.overallStatus) {
      filtered = filtered.filter((poi) => poi.overallStatus === params.overallStatus);
    }
    if (params.languageStatus === 'ERROR') {
      filtered = filtered.filter((poi) => (poi.languageSummary?.failed ?? 0) > 0);
    }
    if (params.languageStatus === 'PENDING') {
      filtered = filtered.filter((poi) => (poi.languageSummary?.pending ?? 0) > 0);
    }
    return pageOf(filtered, overrides);
  });
};

describe('PoiListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(poiApi.getZones).mockResolvedValue(mockZones);
    vi.mocked(poiApi.getRoutes).mockResolvedValue(mockRoutes);
    mockList(mockRows);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh']}>
        <Routes>
          <Route path="/quan-tri/diem-thuyet-minh" element={<PoiListPage />} />
          <Route path="/quan-tri/diem-thuyet-minh/moi" element={<div>Trang tạo mới</div>} />
          <Route path="/quan-tri/diem-thuyet-minh/:id" element={<div>Trang chỉnh sửa</div>} />
        </Routes>
      </MemoryRouter>
    );

  it('hiển thị trạng thái đang tải khi dữ liệu chưa về', () => {
    vi.mocked(poiApi.getAdminPois).mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('gọi endpoint admin với tham số phân trang mặc định', async () => {
    renderComponent();

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined,
        zoneId: undefined,
        routeId: undefined,
      });
    });
  });

  it('hiển thị danh sách điểm kèm khu vực, tuyến, trạng thái và tóm tắt thuyết minh', async () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { level: 1, name: /quản lý điểm thuyết minh/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(within(table).getByText('Tuyến trung tâm')).toBeInTheDocument();
    expect(within(table).getByText('Thứ tự 2')).toBeInTheDocument();
    expect(within(table).getByText('Hoạt động')).toBeInTheDocument();
    expect(within(table).getByText('Đã ẩn')).toBeInTheDocument();
    // Cột Phát hành đã bỏ khỏi bảng danh sách
    expect(within(table).queryByText('Đã phát')).not.toBeInTheDocument();
    expect(within(table).queryByText('Thất bại')).not.toBeInTheDocument();
    expect(within(table).getByText('2/4 sẵn sàng')).toBeInTheDocument();
    expect(within(table).getByText('0/4 sẵn sàng')).toBeInTheDocument();
    expect(within(table).getByText('3 lỗi')).toBeInTheDocument();
    // Mã điểm và phiên bản không còn hiển thị trên bảng
    expect(screen.queryByText('BEN_THANH')).not.toBeInTheDocument();
    expect(screen.queryByText('v3')).not.toBeInTheDocument();
    // Một request cho danh sách + một request cho dòng đếm "Cần xử lý"
    expect(poiApi.getAdminPois).toHaveBeenCalledTimes(2);
    expect(poiApi.getAdminPois).toHaveBeenCalledWith(
      expect.objectContaining({ overallStatus: 'NEEDS_ATTENTION', size: 1 })
    );
  });

  it('mở popover chi tiết thuyết minh theo ngôn ngữ bằng bấm và đóng bằng Esc', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });

    const trigger = screen.getByRole('button', {
      name: 'Xem trạng thái ngôn ngữ của Dinh Độc Lập',
    });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Tiếng Việt')).toBeInTheDocument();
    expect(within(dialog).getByText('Tiếng Anh')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Lỗi tổng hợp')).toHaveLength(3);
    expect(within(dialog).getAllByText('TTS timeout')).toHaveLength(3);
    expect(within(dialog).getByRole('button', { name: 'Sắp có' })).toBeDisabled();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('chỉ mở một popover ngôn ngữ tại một thời điểm', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Xem trạng thái ngôn ngữ của Chợ Bến Thành' })
    );
    await screen.findByRole('dialog');

    fireEvent.click(
      screen.getByRole('button', { name: 'Xem trạng thái ngôn ngữ của Dinh Độc Lập' })
    );

    await waitFor(() => {
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(1);
    });
  });

  it('hiển thị ErrorState kèm nút Thử lại và tải lại thành công', async () => {
    vi.mocked(poiApi.getAdminPois)
      .mockRejectedValueOnce(new Error('Lỗi kết nối máy chủ'))
      .mockResolvedValueOnce(pageOf(mockRows));
    renderComponent();

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent(/không thể tải danh sách điểm thuyết minh/i);

    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }));

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });
  });

  it('hiển thị EmptyState khi không có điểm nào', async () => {
    mockList([]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có điểm thuyết minh nào')).toBeInTheDocument();
    });
  });

  it('ẩn một điểm đang hoạt động qua endpoint đổi trạng thái', async () => {
    vi.mocked(poiApi.updatePoiStatus).mockResolvedValue({} as AdminPoiDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn Chợ Bến Thành' }));

    await waitFor(() => {
      expect(poiApi.updatePoiStatus).toHaveBeenCalledWith(1, 'INACTIVE');
    });
  });

  it('hiện lại một điểm đã ẩn qua endpoint đổi trạng thái', async () => {
    vi.mocked(poiApi.updatePoiStatus).mockResolvedValue({} as AdminPoiDetail);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Hiện Dinh Độc Lập' }));

    await waitFor(() => {
      expect(poiApi.updatePoiStatus).toHaveBeenCalledWith(2, 'ACTIVE');
    });
  });

  it('tìm kiếm gửi tham số search đã trim lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/tìm kiếm điểm thuyết minh/i), {
      target: { value: '  dinh  ' },
    });

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'dinh', page: 0 })
      );
    });
  });

  it('lọc theo khu vực nạp tuyến và gửi zoneId lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/lọc theo khu vực/i), {
      target: { value: '1' },
    });

    await waitFor(() => {
      expect(poiApi.getRoutes).toHaveBeenCalledWith(1);
      expect(poiApi.getAdminPois).toHaveBeenLastCalledWith(
        expect.objectContaining({ zoneId: 1, page: 0 })
      );
    });
  });

  it('lọc theo trạng thái gửi overallStatus lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), {
      target: { value: 'HIDDEN' },
    });

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith(
        expect.objectContaining({ overallStatus: 'HIDDEN', page: 0 })
      );
      expect(screen.queryByText('Chợ Bến Thành')).not.toBeInTheDocument();
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });
  });

  it('lọc theo ngôn ngữ gửi languageStatus lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Lọc theo ngôn ngữ'), {
      target: { value: 'ERROR' },
    });

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith(
        expect.objectContaining({ languageStatus: 'ERROR', page: 0 })
      );
      expect(screen.queryByText('Chợ Bến Thành')).not.toBeInTheDocument();
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Lọc theo ngôn ngữ'), {
      target: { value: 'PENDING' },
    });

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith(
        expect.objectContaining({ languageStatus: 'PENDING', page: 0 })
      );
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });
  });

  it('dòng tóm tắt Cần xử lý bấm để lọc nhanh theo trạng thái đó', async () => {
    const needsAttentionRow: AdminPoiListItem = {
      ...mockRows[0]!,
      overallStatus: 'NEEDS_ATTENTION',
    };
    mockList([needsAttentionRow, mockRows[1]!], {}, 1);
    renderComponent();

    const summary = await screen.findByRole('button', { name: 'Cần xử lý: 1 điểm' });
    fireEvent.click(summary);

    await waitFor(() => {
      expect(screen.getByLabelText('Lọc theo trạng thái')).toHaveValue('NEEDS_ATTENTION');
      expect(poiApi.getAdminPois).toHaveBeenCalledWith(
        expect.objectContaining({ overallStatus: 'NEEDS_ATTENTION', size: 10 })
      );
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
      expect(screen.queryByText('Dinh Độc Lập')).not.toBeInTheDocument();
    });
  });

  it('phân trang phía máy chủ khi bấm Trang sau', async () => {
    mockList(mockRows, { totalPages: 2, last: false });
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /trang sau/i }));

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });
  });
});
