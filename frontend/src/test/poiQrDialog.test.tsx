import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoiQrDialog, QR_AUTO_CLOSE_SECONDS } from '../components/nearby/PoiQrDialog';
import type { GeoPoi } from '../pages/NearbyPage';

// The QR canvas needs a real 2D context, which jsdom does not provide. The
// countdown behaviour is what this file checks, so stub the QR block out.
vi.mock('../components/common/PlaceQR', () => ({
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

describe('PoiQrDialog auto-close countdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the remaining seconds in the accessibility tree', () => {
    render(
      <PoiQrDialog poi={poi} currentLang="vi" getPoiName={getPoiName} onClose={vi.fn()} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent(
      `Tự động đóng sau ${QR_AUTO_CLOSE_SECONDS} giây`
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('timer')).toHaveTextContent('25 giây');
  });

  it('closes itself once the countdown reaches zero', () => {
    const onClose = vi.fn();
    render(<PoiQrDialog poi={poi} currentLang="vi" getPoiName={getPoiName} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(QR_AUTO_CLOSE_SECONDS * 1000 - 1000);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
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

  it('localises the countdown text', () => {
    render(
      <PoiQrDialog poi={poi} currentLang="en" getPoiName={getPoiName} onClose={vi.fn()} />
    );

    expect(screen.getByRole('timer')).toHaveTextContent(
      `Closes automatically in ${QR_AUTO_CLOSE_SECONDS}s`
    );
  });
});
