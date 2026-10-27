import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PoiQrListPage } from '../admin/pages/PoiQrListPage';
import { poiApi } from '../admin/api/poiApi';
import { AdminPoiListItem, AdminPoiPageResponse } from '../admin/types/poi';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => null,
}));

vi.mock('../admin/api/poiApi', () => ({
  poiApi: {
    getAdminPois: vi.fn(),
    getZones: vi.fn(),
    getAdminPoiDetail: vi.fn(),
  },
}));

const pageOf = (content: AdminPoiListItem[]): AdminPoiPageResponse => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: 12,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
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
    audioStatusByLanguage: {},
  },
  {
    id: 2,
    code: 'DINH_DOC_LAP',
    name: 'Dinh Độc Lập',
    zoneId: 1,
    zoneCode: 'Q1',
    status: 'ACTIVE',
    version: 1,
    publishStatus: 'PUBLISHED',
    audioStatusByLanguage: {},
  },
];

const zones = [{ id: 1, code: 'Q1', name: 'Quận 1' }];

describe('PoiQrListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(poiApi.getZones).mockResolvedValue(zones);
    vi.mocked(poiApi.getAdminPois).mockResolvedValue(pageOf(rows));
    vi.mocked(poiApi.getAdminPoiDetail).mockImplementation(async (id: number) =>
      ({
        qrToken: id === 1 ? 'qr-ben-thanh' : '',
      } as never)
    );
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/quan-tri/diem-thuyet-minh/ma-qr']}>
        <PoiQrListPage />
      </MemoryRouter>
    );

  it('hiển thị mã QR của từng điểm và thông báo khi điểm chưa có mã', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Mã QR' })).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText('qr-ben-thanh')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(screen.getByText('Chưa có mã QR cho điểm này.')).toBeInTheDocument();
    expect(poiApi.getAdminPoiDetail).toHaveBeenCalledWith(1);
    expect(poiApi.getAdminPoiDetail).toHaveBeenCalledWith(2);
  });

  it('gọi endpoint admin với tham số phân trang mặc định', async () => {
    renderComponent();

    await waitFor(() => {
      expect(poiApi.getAdminPois).toHaveBeenCalledWith({
        page: 0,
        size: 12,
        search: undefined,
        zoneId: undefined,
      });
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
