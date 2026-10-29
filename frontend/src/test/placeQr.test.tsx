import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PlaceQR, isQrAvailable, resolveQrBaseUrl } from '../components/common/PlaceQR';

describe('PlaceQR - availability, origin and sample mode (Hạng mục 3)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports availability from the qrToken and never for sample tokens', () => {
    expect(isQrAvailable({ qrToken: 'qr-dinh-doc-lap-01' })).toBe(true);
    expect(isQrAvailable({ qrToken: 'sample_qr_demo' })).toBe(false);
    expect(isQrAvailable({ qrToken: '   ' })).toBe(false);
    expect(isQrAvailable(null)).toBe(false);
  });

  it('does not render a QR in sample-data mode', () => {
    const { container } = render(
      <PlaceQR poi={{ qrToken: 'sample_qr_demo' }} lang="vi" showActions />
    );
    expect(container.querySelector('.place-qr')).toBeNull();
  });

  it('dùng VITE_QR_BASE_URL (tunnel HTTPS) khi được cấu hình', () => {
    vi.stubEnv('VITE_QR_BASE_URL', 'https://affection-smokiness-watch.ngrok-free.dev');
    expect(resolveQrBaseUrl()).toBe('https://affection-smokiness-watch.ngrok-free.dev');

    vi.stubEnv('VITE_QR_BASE_URL', '  https://abc.ngrok-free.app/  ');
    expect(resolveQrBaseUrl()).toBe('https://abc.ngrok-free.app');
  });

  it('quay về origin của trang hiện tại khi không cấu hình VITE_QR_BASE_URL', () => {
    vi.stubEnv('VITE_QR_BASE_URL', '');
    expect(resolveQrBaseUrl()).toBe(window.location.origin);

    vi.stubEnv('VITE_QR_BASE_URL', '   ');
    expect(resolveQrBaseUrl()).toBe(window.location.origin);
  });
});
