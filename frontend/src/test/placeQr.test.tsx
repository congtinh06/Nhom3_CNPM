import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PlaceQR, isQrAvailable, shouldWarnQrLocalhost } from '../components/common/PlaceQR';

describe('PlaceQR - availability, dev warning and sample mode (Hạng mục 3)', () => {
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

  it('warns only when the QR base URL is localhost and no VITE_QR_BASE_URL is set', () => {
    vi.stubEnv('VITE_QR_BASE_URL', '');
    expect(shouldWarnQrLocalhost()).toBe(true);

    vi.stubEnv('VITE_QR_BASE_URL', 'https://nhom3-cnpm.vercel.app');
    expect(shouldWarnQrLocalhost()).toBe(false);
  });
});
