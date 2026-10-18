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

describe('AdminOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hiển thị thẻ đếm nội dung và liên kết tới trang quản lý tương ứng', async () => {
    vi.mocked(adminClient.get).mockImplementation((url: string) => {
      if (url === '/api/analytics/summary') {
        return Promise.resolve({ data: summary } as never);
      }
      return Promise.resolve({ data: { totalElements: 7 } } as never);
    });

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

  it('hiển thị dấu gạch khi không tải được một thẻ đếm', async () => {
    vi.mocked(adminClient.get).mockImplementation((url: string) => {
      if (url === '/api/analytics/summary') {
        return Promise.resolve({ data: summary } as never);
      }
      if (url === '/api/content/admin/zones') {
        return Promise.reject(new Error('Không tải được'));
      }
      return Promise.resolve({ data: { totalElements: 3 } } as never);
    });

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
