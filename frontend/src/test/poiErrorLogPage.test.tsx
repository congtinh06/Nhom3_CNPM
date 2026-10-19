import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PoiErrorLogPage } from '../admin/pages/PoiErrorLogPage';
import { poiApi } from '../admin/api/poiApi';
import { AdminPoiListItem, AdminPoiPageResponse } from '../admin/types/poi';

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getAdminPois: vi.fn(),
    republish: vi.fn(),
  },
}));

const pageOf = (content: AdminPoiListItem[]): AdminPoiPageResponse => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
});

const rows: AdminPoiListItem[] = [
  {
    id: 2,
    code: 'DINH_DOC_LAP',
    name: 'Dinh Độc Lập',
    zoneId: 1,
    zoneCode: 'Q1',
    status: 'ACTIVE',
    version: 2,
    publishStatus: 'FAILED',
    overallStatus: 'NEEDS_ATTENTION',
    attentionReasons: ['Phát hành sự kiện thất bại'],
    audioStatusByLanguage: { vi: 'FAILED_TTS', en: 'PENDING' },
    languages: [
      { languageCode: 'vi', languageName: 'Tiếng Việt', audioStatus: 'FAILED_TTS', errorReason: 'TTS timeout', lastAttemptAt: '2026-10-14T08:00:00' },
      { languageCode: 'en', languageName: 'Tiếng Anh', audioStatus: 'PENDING', lastAttemptAt: '2026-10-14T08:00:00' },
    ],
  },
];

describe('PoiErrorLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(pageOf(rows));
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/nhat-ky-loi']}>
        <PoiErrorLogPage />
      </MemoryRouter>
    );

  it('hiển thị các dòng lỗi theo ngôn ngữ và lỗi phát hành', async () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Nhật ký xử lý lỗi' })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tiếng Việt')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Dinh Độc Lập').length).toBeGreaterThan(0);
    expect(within(table).getByText('TTS timeout')).toBeInTheDocument();
    expect(within(table).getByText('Lỗi tổng hợp')).toBeInTheDocument();
    expect(within(table).getByText('Phát hành lỗi')).toBeInTheDocument();
    expect(within(table).queryByText('Tiếng Anh')).not.toBeInTheDocument();
    expect(poiApi.getAdminPois).toHaveBeenCalledWith(
      expect.objectContaining({ overallStatus: 'NEEDS_ATTENTION' })
    );
  });

  it('hiển thị EmptyState khi không có lỗi', async () => {
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(pageOf([]));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Không có lỗi xử lý')).toBeInTheDocument();
    });
  });

  it('phát hành lại sau khi xác nhận và tải lại danh sách', async () => {
    vi.mocked(poiApi.republish).mockResolvedValueOnce({
      poiId: 2,
      poiCode: 'DINH_DOC_LAP',
      publishStatus: 'PENDING',
    });
    renderComponent();

    const republishButtons = await screen.findAllByRole('button', { name: /phát hành lại/i });
    fireEvent.click(republishButtons[0]!);

    fireEvent.click(
      await screen.findByRole('button', { name: /xác nhận phát hành lại/i })
    );

    await waitFor(() => {
      expect(poiApi.republish).toHaveBeenCalledWith(2);
      expect(screen.getByRole('status')).toHaveTextContent(/đã gửi yêu cầu phát hành lại/i);
    });
  });
});
