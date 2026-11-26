import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoiQrDialog } from '../components/nearby/PoiQrDialog';
import type { GeoPoi } from '../pages/NearbyPage';

// The QR canvas needs a real 2D context, which jsdom does not provide. The
// dialog behaviour is what this file checks, so stub the QR block out.
vi.mock('../components/common/PlaceQR', () => ({
  POI_QR_LIFETIME_SECONDS: 60,
  PlaceQR: () => <div data-testid="place-qr" />,
  buildPoiQrUrl: () => 'https://echora.test/qr/ben-thanh',
}));

const poi = {
  id: 'poi-ben-thanh',
  qrToken: 'BEN_THANH',
  name: {
    vi: 'Chợ Bến Thành',
    en: 'Ben Thanh Market',
    ko: '벤탄 시장',
    ja: 'ベンタイン市場',
  },
  lat: 10.7725,
  lng: 106.698,
  triggerRadius: 30,
  category: { vi: 'Chợ', en: 'Market', ko: '시장', ja: '市場' },
  image: 'bg1',
  audio: { vi: '', en: '', ko: '', ja: '' },
  transcript: { vi: '', en: '', ko: '', ja: '' },
} as unknown as GeoPoi;

const getPoiName = (target: GeoPoi) => target.name.vi;

describe('PoiQrDialog lifetime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the QR block and keeps the dialog open', () => {
    render(<PoiQrDialog poi={poi} currentLang="vi" getPoiName={getPoiName} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('place-qr')).toBeInTheDocument();
  });

  it('does not auto-close at the QR lifetime: the expired warning stays visible', () => {
    const onClose = vi.fn();
    render(<PoiQrDialog poi={poi} currentLang="vi" getPoiName={getPoiName} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // PoiQrDialog không tự đóng; PlaceQR hiện lớp "mã đã hết hạn" + nút tạo lại.
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not fire onClose after unmounting early', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <PoiQrDialog poi={poi} currentLang="vi" getPoiName={getPoiName} onClose={onClose} />
    );

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
