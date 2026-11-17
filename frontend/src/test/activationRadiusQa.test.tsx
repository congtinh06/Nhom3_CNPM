import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoNarration, haversine } from '../hooks/useAutoNarration';
import { GeoPoi } from '../pages/NearbyPage';

const BASE_LAT = 10.77695;
const BASE_LNG = 106.69537;
const DEG_PER_METRE = 1 / 111195;

function atMetres(lat: number, lng: number, metres: number) {
  const shift = metres * DEG_PER_METRE;
  return { lat: lat + shift, lng };
}

function makePoi(overrides: Partial<GeoPoi> = {}): GeoPoi {
  return {
    id: 'poi-1',
    numericId: 1,
    premiumPrice: null,
    qrToken: 'qr-dinh-doc-lap-01',
    name: { vi: 'Dinh Độc Lập', en: 'Independence Palace', ko: '', ja: '' },
    lat: BASE_LAT,
    lng: BASE_LNG,
    triggerRadius: 50,
    category: { vi: '', en: '', ko: '', ja: '' },
    image: '',
    audio: { vi: '', en: '', ko: '', ja: '' },
    audioStatus: 'READY',
    audioStatusByLanguage: { vi: 'READY', en: null, ko: null, ja: null },
    audioUrl: null,
    transcript: { vi: '', en: '', ko: '', ja: '' },
    description: { vi: '', en: '', ko: '', ja: '' },
    ...overrides,
  } as unknown as GeoPoi;
}

function renderAuto(pois: GeoPoi[]) {
  const playPoi = vi.fn();
  const utils = renderHook(() =>
    useAutoNarration({
      pois,
      isAutoEnabled: true,
      currentPlayingId: null,
      isPlaying: false,
      isLoading: false,
      playPoi,
      gpsErrorMessage: 'err',
    })
  );
  return { playPoi, ...utils };
}

describe('QA: Ban kinh kich hoat cua Diem thuyet minh', () => {
  it('CA1: 0m / dia diem -> van thuong duoc phat', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    act(() => {
      result.current.applyPosition(BASE_LAT, BASE_LNG, 5);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
    expect(playPoi).toHaveBeenCalledWith('poi-1', true);
  });

  it('CA2: 30m / trong ban kinh 50m -> van thuong duoc phat', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const p = atMetres(BASE_LAT, BASE_LNG, 30);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
    expect(playPoi).toHaveBeenCalledWith('poi-1', true);
  });

  it('CA3: 49m / trong ban kinh 50m -> van thuong duoc phat', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const p = atMetres(BASE_LAT, BASE_LNG, 49);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
  });

  it('CA4: du 50m / nam ngay bien (dist <= radius) -> van thuong duoc phat', () => {
    const { result, playPoi } = renderAuto([makePoi({ triggerRadius: 50 })]);
    const p = atMetres(BASE_LAT, BASE_LNG, 50);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
  });

  it('CA5: 51m / ngoai ban kinh 50m -> khong phat', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const p = atMetres(BASE_LAT, BASE_LNG, 51);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).not.toHaveBeenCalled();
  });

  it('CA6: 200m / ngoai ban kinh -> khong phat', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const p = atMetres(BASE_LAT, BASE_LNG, 200);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).not.toHaveBeenCalled();
  });

  it('CA7: di ngoai vao trong -> van phat dung 1 lan', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const outside = atMetres(BASE_LAT, BASE_LNG, 200);
    act(() => {
      result.current.applyPosition(outside.lat, outside.lng, 10);
    });
    expect(playPoi).not.toHaveBeenCalled();
    const inside = atMetres(BASE_LAT, BASE_LNG, 30);
    act(() => {
      result.current.applyPosition(inside.lat, inside.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
    expect(playPoi).toHaveBeenCalledWith('poi-1', true);
  });

  it('CA8: ra roi vao lai -> khong phat tiep (da play 1 lan)', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const inside = atMetres(BASE_LAT, BASE_LNG, 30);
    act(() => {
      result.current.applyPosition(inside.lat, inside.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
    const outside = atMetres(BASE_LAT, BASE_LNG, 200);
    act(() => {
      result.current.applyPosition(outside.lat, outside.lng, 10);
    });
    const back = atMetres(BASE_LAT, BASE_LNG, 30);
    act(() => {
      result.current.applyPosition(back.lat, back.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
  });

  it('CA9: doi ban kinh 100 -> 80m van phat', () => {
    const playPoi = vi.fn();
    const utils = renderHook(() =>
      useAutoNarration({
        pois: [makePoi({ triggerRadius: 100 })],
        isAutoEnabled: true,
        currentPlayingId: null,
        isPlaying: false,
        isLoading: false,
        playPoi,
        gpsErrorMessage: 'err',
      })
    );
    const result = utils.result;
    const p = atMetres(BASE_LAT, BASE_LNG, 80);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
  });

  it('CA10: ban kinh 0 / am / rat lon (100000) / chua dat -> xu ly theo code hien tai', () => {
    const { result, playPoi } = renderAuto([makePoi({ triggerRadius: 0 })]);
    const p = atMetres(BASE_LAT, BASE_LNG, 10);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 10);
    });
    expect(playPoi).not.toHaveBeenCalled();

    const { result: result2, playPoi: playPoi2 } = renderAuto([makePoi({ triggerRadius: 100000 })]);
    const p2 = atMetres(BASE_LAT, BASE_LNG, 80);
    act(() => {
      result2.current.applyPosition(p2.lat, p2.lng, 10);
    });
    expect(playPoi2).toHaveBeenCalledTimes(1);

    const { result: result3, playPoi: playPoi3 } = renderAuto([makePoi({ triggerRadius: undefined })]);
    const p3 = atMetres(BASE_LAT, BASE_LNG, 49);
    act(() => {
      result3.current.applyPosition(p3.lat, p3.lng, 10);
    });
    expect(playPoi3).toHaveBeenCalledTimes(1);
  });

  it('CA11: hai diem trong cung ban kinh -> chon diem gan nhat, phat 1 lan', () => {
    const near = atMetres(BASE_LAT, BASE_LNG, 10);
    const pois = [
      makePoi({ id: 'poi-2', lat: near.lat, lng: near.lng }),
      makePoi({ id: 'poi-1', lat: BASE_LAT, lng: BASE_LNG }),
    ];
    const { result, playPoi } = renderAuto(pois);
    act(() => {
      result.current.applyPosition(near.lat, near.lng, 10);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
    expect(playPoi).toHaveBeenCalledWith('poi-2', true);
  });

  it('CA12: GPS accuracy lon (100/500m) -> ti le kich hoat van theo khoang cach thuc', () => {
    const { result, playPoi } = renderAuto([makePoi()]);
    const p = atMetres(BASE_LAT, BASE_LNG, 10);
    act(() => {
      result.current.applyPosition(p.lat, p.lng, 500);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
  });

  it('QA-DT: sai so haversine voi moc ~10.77m va ~21.0m phai < 1m', () => {
    const a = { lat: BASE_LAT, lng: BASE_LNG };
    const b1 = atMetres(BASE_LAT, BASE_LNG, 10.77);
    const b2 = atMetres(BASE_LAT, BASE_LNG, 21.0);
    expect(Math.abs(haversine(a.lat, a.lng, b1.lat, b1.lng) - 10.77)).toBeLessThan(1);
    expect(Math.abs(haversine(a.lat, a.lng, b2.lat, b2.lng) - 21.0)).toBeLessThan(1);
  });
});