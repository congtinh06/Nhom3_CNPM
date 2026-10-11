import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import {
  splitTranscriptIntoSentences,
  isBackendDetailForPoi,
  normalizePoiName,
} from '../hooks/useNearbyAudio';
import { ToastProvider } from '../context/ToastContext';
import { AudioPlayerBar } from '../components/nearby/AudioPlayerBar';
import { GeoPoi } from '../pages/NearbyPage';
import { TILE_PROVIDERS } from '../components/nearby/PoiMap';
import nearbyPoisData from '../content/nearbyPois.json';

describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(ToastProvider, null, children)
  );

  it('initializes in idle state with null playingPoiId', () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });
    expect(result.current.playerState).toBe('idle');
    expect(result.current.playingPoiId).toBeNull();
    expect(result.current.isPlaying(1)).toBe(false);
  });

  it('stops audio and returns to idle when stopAudio is called', () => {
    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    act(() => {
      result.current.stopAudio();
    });

    expect(result.current.playerState).toBe('idle');
    expect(result.current.playingPoiId).toBeNull();
  });
});

describe('splitTranscriptIntoSentences - Abbreviation and Decimal Protection', () => {
  it('does not split on Vietnamese abbreviations like TP.HCM and Q.1', () => {
    const text = 'Dinh Độc Lập tọa lạc tại Q.1, TP.HCM và là di tích lịch sử nổi tiếng.';
    const sentences = splitTranscriptIntoSentences(text);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]?.sentence).toBe(text);
  });

  it('does not split on decimals like 1.5 km', () => {
    const text = 'Từ chợ Bến Thành đến bảo tàng cách khoảng 1.5 km đi bộ.';
    const sentences = splitTranscriptIntoSentences(text);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]?.sentence).toBe(text);
  });

  it('does not split on title abbreviations like St. Mary', () => {
    const text = 'Nhà thờ có phong cách kiến trúc giống nhà thờ St. Mary tại Pháp.';
    const sentences = splitTranscriptIntoSentences(text);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]?.sentence).toBe(text);
  });

  it('correctly splits multi-sentence paragraphs containing both abbreviations and decimals', () => {
    const text = 'Dinh Độc Lập nằm tại Q.1, TP.HCM. Công trình cách đây 1.5 km và gần nhà thờ St. Mary. Du khách có thể đến tham quan hàng ngày!';
    const sentences = splitTranscriptIntoSentences(text);
    expect(sentences).toHaveLength(3);
    expect(sentences[0]?.sentence).toBe('Dinh Độc Lập nằm tại Q.1, TP.HCM.');
    expect(sentences[1]?.sentence).toBe('Công trình cách đây 1.5 km và gần nhà thờ St. Mary.');
    expect(sentences[2]?.sentence).toBe('Du khách có thể đến tham quan hàng ngày!');
  });
});

describe('AudioPlayerBar - Scoped Space play/pause & No Arrow/15s Seek', () => {
  const mockPoi: GeoPoi = {
    id: 'poi-1',
    slug: 'dinh-doc-lap',
    stopOrder: 1,
    name: { vi: 'Dinh Độc Lập', en: 'Independence Palace', ko: '통일궁', ja: '統一会堂' },
    lat: 10.77695,
    lng: 106.69537,
    triggerRadius: 50,
    category: { vi: 'Di tích lịch sử', en: 'Historical Landmark', ko: '역사 유적지', ja: '歴史的史跡' },
    image: '/images/pois/dinh-doc-lap.jpg',
    audio: { vi: 'test.mp3', en: '', ko: '', ja: '' },
    transcript: { vi: 'Test transcript', en: '', ko: '', ja: '' },
  };

  it('does not render any +/- 15s seek buttons and retains the HTML5 seek slider', () => {
    render(
      React.createElement(AudioPlayerBar, {
        activePoi: mockPoi,
        currentLang: 'vi',
        isPlaying: false,
        currentTime: 10,
        duration: 100,
        speed: 1,
        showTranscript: false,
        notice: '',
        noticeWarn: false,
        isHtml5Audio: true,
        onTogglePlay: vi.fn(),
        onSeek: vi.fn(),
        onChangeSpeed: vi.fn(),
        onViewChapterTranscript: vi.fn(),
        resolveAudio: () => ({ hasAudioInLang: true, actualLang: 'vi' as const, actualTxLang: 'vi' as const, text: 'Test' }),
        getPoiName: (p) => p.name.vi,
        noPoiSelectedText: 'Chưa chọn',
        playingInLangText: (l) => `Đang phát ${l}`,
        pausedStatusText: 'Tạm dừng',
        clickToStartText: 'Bấm để phát',
        speedLabelText: 'Tốc độ',
        viewTextBtnText: 'Xem',
        hideTextBtnText: 'Ẩn',
        fallbackTxNoticeText: () => '',
      })
    );

    // Verify NO +/- 15s buttons are rendered
    expect(screen.queryByLabelText(/15 giây/i)).not.toBeInTheDocument();
    expect(screen.queryByText('15')).not.toBeInTheDocument();

    // Verify HTML5 seek slider is retained
    expect(screen.getByRole('progressbar', { name: /Tiến trình phát âm thanh/i })).toBeInTheDocument();
  });

  it('triggers onTogglePlay on Space when focused on player container, but not on interactive controls', () => {
    const onTogglePlay = vi.fn();
    render(
      React.createElement(AudioPlayerBar, {
        activePoi: mockPoi,
        currentLang: 'vi',
        isPlaying: false,
        currentTime: 10,
        duration: 100,
        speed: 1,
        showTranscript: false,
        notice: '',
        noticeWarn: false,
        isHtml5Audio: true,
        onTogglePlay,
        onSeek: vi.fn(),
        onChangeSpeed: vi.fn(),
        onViewChapterTranscript: vi.fn(),
        resolveAudio: () => ({ hasAudioInLang: true, actualLang: 'vi' as const, actualTxLang: 'vi' as const, text: 'Test' }),
        getPoiName: (p) => p.name.vi,
        noPoiSelectedText: 'Chưa chọn',
        playingInLangText: (l) => `Đang phát ${l}`,
        pausedStatusText: 'Tạm dừng',
        clickToStartText: 'Bấm để phát',
        speedLabelText: 'Tốc độ',
        viewTextBtnText: 'Xem',
        hideTextBtnText: 'Ẩn',
        fallbackTxNoticeText: () => '',
      })
    );

    const playerContainer = screen.getByLabelText(/Trình phát thuyết minh du lịch/i);

    // Space on player container triggers onTogglePlay
    fireEvent.keyDown(playerContainer, { code: 'Space' });
    expect(onTogglePlay).toHaveBeenCalledTimes(1);

    // ArrowLeft and ArrowRight do not seek or alter play state
    fireEvent.keyDown(playerContainer, { code: 'ArrowLeft' });
    fireEvent.keyDown(playerContainer, { code: 'ArrowRight' });
    expect(onTogglePlay).toHaveBeenCalledTimes(1);

    // Space on a button inside player container does NOT invoke container handler
    const playBtn = screen.getByRole('button', { name: /Phát|Play/i });
    fireEvent.keyDown(playBtn, { code: 'Space' });
    expect(onTogglePlay).toHaveBeenCalledTimes(1); // Not incremented by container
  });
});

describe('Tile Provider Config & WGS84 Heritage Coordinates', () => {
  it('configures raster tile providers and verifies vector/MapLibre layers are removed', () => {
    // 1. CARTO and vector providers are removed
    expect((TILE_PROVIDERS as any).carto).toBeUndefined();
    expect((TILE_PROVIDERS as any).openfreemap).toBeUndefined();

    // 2. Ordered raster providers list
    expect(TILE_PROVIDERS.length).toBeGreaterThan(0);
    const osmProvider = TILE_PROVIDERS.find((p) => p.key === 'osm');
    expect(osmProvider).toBeDefined();
    expect(osmProvider?.url).toContain('tile.openstreetmap.org');
    expect(osmProvider?.referrerPolicy).toBe('strict-origin-when-cross-origin');
  });

  it('matches all 5 Saigon heritage POIs to the Google Maps WGS84 standard coordinates', () => {
    const p1 = nearbyPoisData.find((p) => p.id === 'poi-1');
    const p2 = nearbyPoisData.find((p) => p.id === 'poi-2');
    const p3 = nearbyPoisData.find((p) => p.id === 'poi-3');
    const p4 = nearbyPoisData.find((p) => p.id === 'poi-4');
    const p5 = nearbyPoisData.find((p) => p.id === 'poi-5');

    // 1. Dinh Độc Lập
    expect(p1?.lat).toBe(10.77695);
    expect(p1?.lng).toBe(106.69537);

    // 2. Nhà thờ Đức Bà Sài Gòn
    expect(p2?.lat).toBe(10.77972);
    expect(p2?.lng).toBe(106.69908);

    // 3. Bưu điện Trung tâm Sài Gòn
    expect(p3?.lat).toBe(10.77995);
    expect(p3?.lng).toBe(106.69971);

    // 4. Chợ Bến Thành
    expect(p4?.lat).toBe(10.77232);
    expect(p4?.lng).toBe(106.69811);

    // 5. Bảo tàng Chứng tích Chiến tranh
    expect(p5?.lat).toBe(10.77926);
    expect(p5?.lng).toBe(106.69247);
  });
});

describe('isBackendDetailForPoi - backend/stop identity gate', () => {
  const poi1 = nearbyPoisData.find((p) => p.id === 'poi-1') as unknown as GeoPoi; // Dinh Độc Lập
  const poi2 = nearbyPoisData.find((p) => p.id === 'poi-2') as unknown as GeoPoi; // Nhà thờ Đức Bà
  const poi3 = nearbyPoisData.find((p) => p.id === 'poi-3') as unknown as GeoPoi; // Bưu điện

  it('rejects a backend detail whose code/name/coords belong to another stop', () => {
    // Real content-service seed: id 3 = "Chợ Bến Thành", not frontend poi-3 "Bưu điện".
    expect(
      isBackendDetailForPoi(
        {
          code: 'POI_BEN_THANH_01',
          name: 'Chợ Bến Thành',
          latitude: 10.7725,
          longitude: 106.698,
        },
        poi3
      )
    ).toBe(false);
  });

  it('accepts on exact code match against the frontend id or slug', () => {
    expect(isBackendDetailForPoi({ code: 'poi-3' }, poi3)).toBe(true);
    expect(isBackendDetailForPoi({ code: 'buu-dien-trung-tam' }, poi3)).toBe(true);
  });

  it('accepts on coordinate proximity within tolerance', () => {
    expect(isBackendDetailForPoi({ latitude: 10.7798, longitude: 106.699 }, poi2)).toBe(
      true
    );
  });

  it('accepts on canonical Vietnamese name match', () => {
    expect(
      isBackendDetailForPoi({ name: 'Bưu điện Trung tâm Sài Gòn' }, poi3)
    ).toBe(true);
  });

  it('rejects empty or unknown details rather than guessing', () => {
    expect(isBackendDetailForPoi(null, poi1)).toBe(false);
    expect(isBackendDetailForPoi({}, poi1)).toBe(false);
  });

  it('normalizes Vietnamese diacritics for name comparison', () => {
    expect(normalizePoiName('Bưu điện Trung tâm Sài Gòn')).toBe(
      'buu dien trung tam sai gon'
    );
  });
});

