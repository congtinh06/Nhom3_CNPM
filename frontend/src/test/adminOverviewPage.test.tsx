import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminOverviewPage } from '../admin/pages/AdminOverviewPage';
import { adminClient } from '../admin/api/adminClient';

vi.mock('../admin/api/adminClient', () => ({
  adminClient: {
    get: vi.fn(),
  },
  normalizeAdminError: (err: unknown) => ({
    status: 0,
    message: err instanceof Error ? err.message : 'Đã xảy ra lỗi',
  }),
}));

const summary = {
  totalScans: 120,
  totalAudioPlays: 80,
  audioCompleted: 40,
  scansByTrigger: { QR: 100, GPS: 20 },
  playsByLanguage: { vi: 60, en: 20 },
  topPois: [{ poiId: 1, name: 'Dinh Độc Lập', scans: 50, plays: 30 }],
};

const trends = {
  days: 2,
  series: [
    { date: '2026-10-24', visits: 5, scans: 6, plays: 4 },
    { date: '2026-10-25', visits: 10, scans: 12, plays: 8 },
  ],
  today: { visits: 10, scans: 12, plays: 8 },
  yesterday: { visits: 5, scans: 6, plays: 4 },
};

function mockGet(
  trendsResponse: unknown | Promise<never> | null,
  counts = 7,
  failCountUrl?: string
) {
  vi.mocked(adminClient.get).mockImplementation((url: string) => {
    if (url === '/api/analytics/summary') {
      return Promise.resolve({ data: summary } as never);
    }
    if (url === '/api/analytics/admin/trends') {
      if (trendsResponse === null) {
        return Promise.reject(new Error('Trends lỗi'));
      }
      return Promise.resolve({ data: trendsResponse } as never);
    }
    if (failCountUrl && url === failCountUrl) {
      return Promise.reject(new Error('Không tải được'));
    }
    return Promise.resolve({ data: { totalElements: counts } } as never);
  });
}

describe('AdminOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị thẻ đếm nội dung và liên kết tới trang quản lý tương ứng', async () => {
    mockGet(trends);

    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminClient.get).toHaveBeenCalledWith('/api/admin/products', {
        params: { page: 0, size: 1 },
      });
    });

    const productsLink = await screen.findByRole('link', { name: /sản phẩm/i });
    expect(productsLink).toHaveAttribute('href', '/quan-tri/san-pham');

    await waitFor(() => {
      expect(adminClient.get).toHaveBeenCalledWith('/api/auth/admin/users', {
        params: { page: 0, size: 1 },
      });
    });

    expect(await screen.findByText('Tổng lượt quét QR')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('gọi API xu hướng 14 ngày và hiển thị badge so sánh hôm nay với hôm qua', async () => {
    mockGet(trends);

    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminClient.get).toHaveBeenCalledWith('/api/analytics/admin/trends', {
        params: { days: 14 },
      });
    });

    expect(await screen.findByText('Xu hướng 14 ngày')).toBeInTheDocument();
    const upBadges = await screen.findAllByText('▲ 100%');
    expect(upBadges.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/Hôm nay: 12/)).toBeInTheDocument();
  });

  it('hiển thị badge giảm khi lượt quét hôm nay thấp hơn hôm qua', async () => {
    mockGet({
      ...trends,
      series: [
        { date: '2026-10-24', visits: 5, scans: 6, plays: 4 },
        { date: '2026-10-25', visits: 3, scans: 2, plays: 4 },
      ],
      today: { visits: 3, scans: 2, plays: 4 },
    });

    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('▼ 66.7%')).toBeInTheDocument();
  });

  it('hiển thị thông báo trống khi không tải được dữ liệu xu hướng', async () => {
    mockGet(null);

    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Chưa có dữ liệu theo ngày/)).toBeInTheDocument();
    // Dashboard vẫn hiển thị phần tổng hợp còn lại.
    expect(screen.getByText('Tổng lượt quét QR')).toBeInTheDocument();
  });

  it('hiển thị dấu gạch khi không tải được một thẻ đếm', async () => {
    mockGet(trends, 3, '/api/content/admin/zones');

    render(
      <MemoryRouter>
        <AdminOverviewPage />
      </MemoryRouter>
    );

    const zonesLink = await screen.findByRole('link', { name: /khu vực/i });
    await waitFor(() => {
      expect(zonesLink).toHaveTextContent('-');
    });
  });
});
