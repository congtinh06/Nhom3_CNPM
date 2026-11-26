import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
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

describe('PlaceQR - one-minute expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides the QR after the lifetime and can generate a fresh one', () => {
    const poi = { qrToken: 'qr-ben-thanh-01' };
    const { container } = render(<PlaceQR poi={poi} lang="vi" expiresInSeconds={60} />);

    expect(screen.getByRole('timer')).toHaveTextContent('Mã hết hạn sau 60s');
    expect(container.querySelector('canvas')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText('Mã QR đã hết hạn')).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Tạo mã mới' }));

    expect(screen.getByRole('timer')).toHaveTextContent('Mã hết hạn sau 60s');
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('generates a fresh QR automatically a few seconds after expiry', () => {
    const poi = { qrToken: 'qr-ben-thanh-01' };
    const { container } = render(
      <PlaceQR poi={poi} lang="vi" showActions expiresInSeconds={60} />
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Mã QR đã hết hạn')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.queryByText('Mã QR đã hết hạn')).toBeNull();
    expect(screen.getByRole('timer')).toHaveTextContent('Mã hết hạn sau 60s');
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('never expires when no lifetime is provided', () => {
    const poi = { qrToken: 'qr-ben-thanh-01' };
    const { container } = render(<PlaceQR poi={poi} lang="vi" />);

    act(() => {
      vi.advanceTimersByTime(120_000);
    });

    expect(screen.queryByText('Mã QR đã hết hạn')).toBeNull();
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});
