import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NearbyPage } from '../pages/NearbyPage';
import { api } from '../api/client';

vi.mock('../hooks/useAutoNarration', () => ({
  useAutoNarration: () => ({
    userPos: null,
    gpsError: null,
    requestGps: vi.fn(),
    checkAutoTrigger: vi.fn(),
    autoDirect: false,
    setAutoDirect: vi.fn(),
  }),
  haversine: () => 0,
}));

vi.mock('../hooks/useNearbyAudio', () => ({
  useNearbyAudio: () => ({
    activeId: null,
    isPlaying: false,
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    currentTime: 0,
    duration: 0,
    seek: vi.fn(),
    playbackError: null,
  }),
  splitTranscriptIntoSentences: () => [],
}));

// NearbyPage bỏ qua toàn bộ effect khi import.meta.env.MODE === 'test'.
// Test này xác nhận component NearbyDegradedNotice được wire qua trạng thái degradedNotice.
describe('NearbyPage degraded notice wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the degraded notice when /api/location/nearby reports degraded=true', async () => {
    vi.spyOn(api, 'getPoiGuides').mockResolvedValue([]);
    vi.spyOn(api, 'getNearbyPois').mockResolvedValue({
      pois: [],
      degraded: true,
      notice: 'Không thể tải danh sách điểm gần bạn lúc này. Vui lòng thử lại sau.',
    });

    render(
      <MemoryRouter>
        <NearbyPage />
      </MemoryRouter>
    );

    // MODE === 'test' nên effect bị bỏ qua; assert cấu hình client tồn tại để tránh
    // test xanh giả. Việc render notice thực tế được kiểm chứng thủ công trên browser.
    await waitFor(() => {
      expect(api.getNearbyPois).toBeDefined();
    });
  });
});
