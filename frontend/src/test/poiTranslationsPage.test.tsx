import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PoiTranslationsPage } from '../admin/pages/PoiTranslationsPage';
import { poiApi } from '../admin/api/poiApi';
import { AdminPoiListItem, AdminPoiPageResponse } from '../admin/types/poi';

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getAdminPois: vi.fn(),
    getZones: vi.fn(),
  },
}));

const pageOf = (
  content: AdminPoiListItem[],
  overrides: Partial<AdminPoiPageResponse> = {}
): AdminPoiPageResponse => ({
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

const rows: AdminPoiListItem[] = [
  {
    id: 1,
    code: 'BEN_THANH',
    name: 'Chợ Bến Thành',
    zoneId: 1,
    zoneCode: 'Q1',
    status: 'ACTIVE',
    version: 1,
    publishStatus: 'PUBLISHED',
    audioStatusByLanguage: { vi: 'READY', en: 'READY', ja: 'READY', ko: 'READY' },
    languages: [
      { languageCode: 'vi', languageName: 'Tiếng Việt', audioStatus: 'READY', audioDurationSeconds: 30, lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'en', languageName: 'Tiếng Anh', audioStatus: 'READY', audioDurationSeconds: 31, lastAttemptAt: '2026-10-14T08:00:00' },
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
    status: 'ACTIVE',
    version: 2,
    publishStatus: 'FAILED',
    audioStatusByLanguage: { vi: 'FAILED_TTS', en: 'PENDING' },
    languages: [
      { languageCode: 'vi', languageName: 'Tiếng Việt', audioStatus: 'FAILED_TTS', errorReason: 'TTS timeout', lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'en', languageName: 'Tiếng Anh', audioStatus: 'PENDING', lastAttemptAt: '2026-10-14T08:00:00' },
    ],
  },
];

const zones = [{ id: 1, code: 'Q1', name: 'Quận 1' }];

describe('PoiTranslationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(poiApi.getZones).mockResolvedValue(zones);
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(pageOf(rows));
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/ban-dich']}>
        <PoiTranslationsPage />
      </MemoryRouter>
    );

  it('hiển thị tiêu đề và trạng thái từng ngôn ngữ', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Bản dịch và audio' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
      expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(within(table).getByText('Tiếng Nhật')).toBeInTheDocument();
    expect(within(table).getAllByText('Sẵn sàng').length).toBeGreaterThan(0);
    expect(within(table).getByText('Lỗi tổng hợp')).toBeInTheDocument();
    expect(within(table).getByText('Chờ xử lý')).toBeInTheDocument();
  });

  it('gọi endpoint admin với tham số phân trang mặc định', async () => {
    renderComponent();

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith({
        page: 0,
        size: 10,
        search: undefined,
        zoneId: undefined,
      });
    });
  });

  it('lọc theo trạng thái ngôn ngữ gửi languageStatus lên máy chủ', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái ngôn ngữ'), {
      target: { value: 'ERROR' },
    });

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith(
        expect.objectContaining({ languageStatus: 'ERROR', page: 0 })
      );
    });
  });

  it('hiển thị EmptyState khi không có điểm nào', async () => {
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Chưa có điểm thuyết minh nào')).toBeInTheDocument();
    });
  });
});
