import { describe, expect, it } from 'vitest';
import {
  computeQrHealth,
  deltaPercent,
  funnelRates,
  percent,
  splitExpiredSlices,
} from '../admin/qr/qrMetrics';
import type { QrLoginStats } from '../admin/types/qr';

function stats(overrides: Partial<QrLoginStats['totals']> = {}): QrLoginStats {
  const totals: QrLoginStats['totals'] = {
    created: 100,
    scanned: 90,
    approved: 80,
    consumed: 70,
    denied: 5,
    expired: 15,
    cancelled: 5,
    pending: 0,
    active: 0,
    distinctUsers: 60,
    expiredUnscanned: 5,
    expiredScanned: 10,
    ...overrides,
  };

  return {
    range: { from: '2026-10-20', to: '2026-10-26', bucket: 'day' },
    totals,
    rates: {
      scanRate: percent(totals.scanned, totals.created),
      approvalRate: percent(totals.approved, totals.scanned),
      successRate: percent(totals.consumed, totals.created),
      expiredRate: percent(totals.expired, totals.created),
      expiredUnscannedRate: percent(totals.expiredUnscanned ?? 0, totals.created),
      expiredScannedRate: percent(totals.expiredScanned ?? 0, totals.created),
    },
    durations: { averageScanSeconds: 4, averageApproveSeconds: 6, averageLoginSeconds: 10 },
    series: [],
    statusBreakdown: [
      { status: 'CONSUMED', count: totals.consumed },
      { status: 'EXPIRED', count: totals.expired },
    ],
    devices: [],
    topUsers: [],
  };
}

describe('funnelRates', () => {
  it('tính tỷ lệ từng bước của phễu theo số phiên', () => {
    const rates = funnelRates({ created: 100, scanned: 90, approved: 80, consumed: 70 });

    expect(rates.scanRate).toBe(90);
    expect(rates.approvalRate).toBe(88.9);
    expect(rates.successRate).toBe(70);
    expect(rates.scanDropRate).toBe(11.1);
    expect(rates.approvalDropRate).toBe(12.5);
  });

  it('trả về 0 khi chưa có phiên tạo mã để tránh chia cho 0', () => {
    const rates = funnelRates({ created: 0, scanned: 0, approved: 0, consumed: 0 });

    expect(rates).toEqual({
      scanRate: 0,
      approvalRate: 0,
      successRate: 0,
      scanDropRate: 0,
      approvalDropRate: 0,
    });
  });

  it('không tạo tỷ lệ rơi âm khi số phiên xác nhận vượt số phiên quét', () => {
    const rates = funnelRates({ created: 10, scanned: 10, approved: 14, consumed: 12 });

    expect(rates.scanDropRate).toBe(0);
    expect(rates.approvalDropRate).toBe(14.3);
  });
});

describe('computeQrHealth', () => {
  it('trả về chưa đủ dữ liệu khi chưa có phiên QR', () => {
    const health = computeQrHealth(null);

    expect(health.level).toBe('unknown');
    expect(health.label).toBe('Chưa đủ dữ liệu');
  });

  it('đánh giá ổn định khi tỷ lệ thành công và hết hạn đều tốt', () => {
    const health = computeQrHealth(stats({ expired: 5, expiredUnscanned: 2, expiredScanned: 3 }));

    expect(health.level).toBe('good');
    expect(health.score).toBe(70);
    expect(health.reasons).toHaveLength(0);
  });

  it('đánh giá cần xử lý ngay khi tỷ lệ đăng nhập thành công quá thấp', () => {
    const health = computeQrHealth(
      stats({ created: 50, scanned: 45, approved: 30, consumed: 12, expired: 15 })
    );

    expect(health.level).toBe('critical');
    expect(health.reasons.join(' ')).toContain('Tỷ lệ đăng nhập thành công chỉ 24.0%');
  });

  it('đánh giá cần xử lý ngay khi tỷ lệ hết hạn vượt 40%', () => {
    const health = computeQrHealth(
      stats({ created: 20, scanned: 18, approved: 15, consumed: 12, expired: 9, expiredScanned: 7 })
    );

    expect(health.level).toBe('critical');
    expect(health.diagnosis).toContain('bước xác nhận');
  });

  it('cảnh báo khi phần lớn phiên hết hạn trước khi được quét', () => {
    const health = computeQrHealth(
      stats({
        created: 100,
        scanned: 80,
        approved: 75,
        consumed: 72,
        expired: 18,
        expiredUnscanned: 12,
        expiredScanned: 6,
      })
    );

    expect(health.level).toBe('warning');
    expect(health.diagnosis).toContain('bước quét');
    expect(health.reasons.join(' ')).toContain('hết hạn trước khi được quét');
  });

  it('không đánh giá tiêu cực khi mẫu quá nhỏ', () => {
    const health = computeQrHealth(
      stats({ created: 2, scanned: 2, approved: 0, consumed: 0, expired: 2, expiredUnscanned: 2 })
    );

    expect(health.level).toBe('unknown');
    expect(health.label).toBe('Chưa đủ dữ liệu');
    expect(health.reasons).toHaveLength(0);
  });
});

describe('splitExpiredSlices', () => {
  it('tách hết hạn thành hai lát riêng để phân biệt chưa quét và đã quét', () => {
    const slices = splitExpiredSlices(
      [
        { status: 'CONSUMED', count: 10 },
        { status: 'EXPIRED', count: 8 },
      ],
      { expiredUnscanned: 5, expiredScanned: 3 }
    );

    expect(slices.map((slice) => slice.key)).toEqual([
      'CONSUMED',
      'EXPIRED_UNSCANNED',
      'EXPIRED_SCANNED',
    ]);
    expect((slices[1]?.count ?? 0) + (slices[2]?.count ?? 0)).toBe(8);
    expect(slices[1]?.filter).toBe('EXPIRED');
  });
});

describe('deltaPercent', () => {
  it('tính phần trăm thay đổi so với kỳ trước', () => {
    expect(deltaPercent(120, 100)).toBe(20);
    expect(deltaPercent(80, 100)).toBe(-20);
  });

  it('trả về null khi kỳ trước không có dữ liệu', () => {
    expect(deltaPercent(10, 0)).toBeNull();
    expect(deltaPercent(10, null)).toBeNull();
  });
});
