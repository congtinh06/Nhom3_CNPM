import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PoiQrPanel } from '../admin/components/PoiQrPanel';

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: () => null,
}));

describe('PoiQrPanel', () => {
  it('hiển thị mã QR và nút tải khi điểm có mã QR', () => {
    render(<PoiQrPanel qrToken="qr-ben-thanh" poiName="Chợ Bến Thành" />);

    expect(screen.getByText('Mã QR của điểm')).toBeInTheDocument();
    expect(screen.getByText('qr-ben-thanh')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tải mã qr/i })).toBeInTheDocument();
  });

  it('hiển thị thông báo khi điểm chưa có mã QR', () => {
    render(<PoiQrPanel qrToken="" poiName="Chợ Bến Thành" />);

    expect(screen.getByText('Chưa có mã QR cho điểm này.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tải mã qr/i })).not.toBeInTheDocument();
  });
});
