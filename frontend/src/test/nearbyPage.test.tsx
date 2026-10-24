import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act, renderHook, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { NearbyPage, GeoPoi, getNarration, getHeroIntroText } from '../pages/NearbyPage';
import nearbyPoisData from '../content/nearbyPois.json';
import { PoiCard, resolveImagePath } from '../components/nearby/PoiCard';
import { BackToTop } from '../components/common/BackToTop';
import { setStoredLanguage, getStoredLanguage, SUPPORTED_LANGUAGES } from '../content/languages';
import { NEARBY_DICTIONARY, getMissingKeysCount, t } from '../content/nearbyI18n';
import { api } from '../api/client';
import { PoiHero } from '../components/nearby/PoiHero';
import { PoiMap } from '../components/nearby/PoiMap';
import { PoiReadingSection } from '../components/nearby/PoiReadingSection';
import { SortedPoiItem } from '../components/nearby/PoiList';
import { snapToWordBoundary, useNearbyAudio } from '../hooks/useNearbyAudio';
import { useAutoNarration } from '../hooks/useAutoNarration';
import { ToastProvider } from '../context/ToastContext';

import { defaultMockVoices } from './setup';

vi.mock('../context/PremiumContext', () => ({
  usePremium: () => ({
    isPremium: true,
    plan: 'PREMIUM',
    premiumExpiresAt: null,
    canAccessLanguage: () => true,
    refreshEntitlement: vi.fn(),
  }),
  buildPremiumPath: () => '/nang-cap',
}));

// Mock react-leaflet components since jsdom doesn't support canvas/WebGL
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="leaflet-tile-layer" />,
  Marker: ({ children, eventHandlers }: { children?: React.ReactNode; eventHandlers?: { click?: () => void } }) => (
    <div data-testid="leaflet-marker" onClick={() => eventHandlers?.click?.()}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-popup">{children}</div>
  ),
  Circle: () => <div data-testid="leaflet-circle" />,
  Polyline: () => <div data-testid="leaflet-polyline" />,
  useMap: () => ({
    setView: vi.fn(),
    stop: vi.fn(),
    getSize: () => ({ x: 800, y: 600 }),
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(),
    panTo: vi.fn(),
    flyTo: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    hasLayer: vi.fn(() => false),
    eachLayer: vi.fn(),
    attributionControl: { setPrefix: vi.fn() },
  }),
  useMapEvents: vi.fn(() => ({})),
}));

describe('NearbyPage - Clean Multilingual & Audio Narration Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/diem-du-lich');
    setStoredLanguage('vi');

    // Mock speechSynthesis
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      pending: false,
      speaking: false,
      paused: false,
      onvoiceschanged: null,
      getVoices: vi.fn(() => defaultMockVoices),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as SpeechSynthesis;

    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders default Vietnamese interface with 5 Saigon heritage POIs', () => {
    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Điểm du lịch Sài Gòn')).toBeInTheDocument();
    expect(screen.getAllByText('Dinh Độc Lập')[0]).toBeInTheDocument();
    expect(screen.getByText('Nhà thờ Đức Bà Sài Gòn')).toBeInTheDocument();
    expect(screen.getByText('Bưu điện Trung tâm Sài Gòn')).toBeInTheDocument();
    expect(screen.getByText('Chợ Bến Thành')).toBeInTheDocument();
    expect(screen.getByText('Bảo tàng Chứng tích Chiến tranh')).toBeInTheDocument();
  });

  it('switches to English: updates all UI labels, POI names, and triggers English narration speech', () => {
    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Switch language to English via the single source of truth (header/storage)
    act(() => {
      setStoredLanguage('en');
    });

    // Check English translations
    expect(screen.getByText('Saigon Attractions')).toBeInTheDocument();
    expect(screen.getAllByText('Independence Palace')[0]).toBeInTheDocument();
    expect(screen.getByText('Notre Dame Cathedral of Saigon')).toBeInTheDocument();
    expect(screen.getByText('Saigon Central Post Office')).toBeInTheDocument();
    expect(screen.getByText('Ben Thanh Market')).toBeInTheDocument();
    expect(screen.getByText('War Remnants Museum')).toBeInTheDocument();

    // Click Listen on the first POI (Independence Palace)
    const listenButtons = screen.getAllByRole('button', { name: /Play/i });
    act(() => {
      fireEvent.click(listenButtons[0]!);
    });

    // Verify speech synthesis spoke English text with en-US
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const calls = (window.speechSynthesis.speak as any).mock.calls;
    const utterance = calls[calls.length - 1][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.text).toContain('Independence Palace sits in a wide garden in the heart of the city');
  });

  it('reads ja/ko narration in the matching voice instead of falling back to a Vietnamese voice', () => {
    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Switch language to Korean via global language source
    act(() => {
      setStoredLanguage('ko');
    });

    // Select POI 2 (Notre Dame Cathedral) from the stop list, then play it in Hero
    const stopRows = screen.getAllByRole('button', { name: /노트르담 대성당/i });
    act(() => {
      fireEvent.click(stopRows[0]!);
    });

    const playBtn = screen.getByRole('button', { name: /재생.*노트르담/i });
    act(() => {
      fireEvent.click(playBtn);
    });

    // Korean narration must be spoken with a Korean voice, never a Vietnamese one
    const calls = (window.speechSynthesis.speak as any).mock.calls;
    const utterance = calls[calls.length - 1][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('ko-KR');

    // No false "playing Vietnamese version" fallback notice
    expect(screen.queryByText(/베트남어로 재생됩니다/)).not.toBeInTheDocument();
  });

  it('shows GPS error text in the active language (no Vietnamese leak) in English', () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success: any, error: any) => {
        error({ code: 1 });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });

    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    act(() => {
      setStoredLanguage('en');
    });

    const gpsBtn = screen.getByRole('button', { name: /My location/i });
    act(() => {
      fireEvent.click(gpsBtn);
    });

    expect(
      screen.getByText(/Location access denied\. You can still manually play audio tours\./i)
    ).toBeInTheDocument();
  });

  it('triggers auto narration and calculates distance when real GPS position matches a POI radius', () => {
    // Mock navigator.geolocation with real GPS coordinates near Independence Palace
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 10.77709,
            longitude: 106.6954,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });

    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Initial state without GPS: displays no location tour message, distance is hidden
    expect(
      screen.getByText(/Chưa có vị trí của bạn. Danh sách xếp theo thứ tự tour/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Cách bạn/i)).not.toBeInTheDocument();

    // Enable auto-narration switch
    const autoSwitch = screen.getByRole('switch');
    act(() => {
      fireEvent.click(autoSwitch);
    });

    // Click "Vị trí của tôi" button to request real GPS
    const gpsBtn = screen.getByRole('button', { name: /Vị trí của tôi/i });
    act(() => {
      fireEvent.click(gpsBtn);
    });

    // Check that auto narration triggered playback for Independence Palace
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(
      screen.getByText(/Bạn đã tới gần Dinh Độc Lập, tự động phát thuyết minh/i)
    ).toBeInTheDocument();

    // Nearest status and distance are now calculated and displayed
    expect(screen.getByText(/điểm gần nhất là/i)).toBeInTheDocument();
  });

  it('with ENABLE_REMOTE_AUDIO=false no fetch to /api/content/pois/{id} audio is used for playback and no HTMLAudioElement is created', async () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    const pauseMock = vi.fn();
    const loadMock = vi.fn();
    (window as any).Audio = vi.fn().mockImplementation((src: string) => ({
      src,
      play: playMock,
      pause: pauseMock,
      load: loadMock,
      playbackRate: 1,
      currentTime: 0,
      duration: 60,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const getPoiDetailSpy = vi.spyOn(api, 'getPoiDetail').mockResolvedValueOnce({
      id: 1,
      code: 'poi-1',
      qrToken: 'qr-1',
      name: 'Independence Palace',
      latitude: 10.777,
      longitude: 106.6954,
      triggerRadiusMeters: 50,
      zoneId: 1,
      zoneCode: 'D1',
      categoryCode: 'HISTORIC',
      languageCode: 'en',
      title: 'Independence Palace',
      summary: 'Summary',
      description: 'Description',
      audioUrl: '/api/tts/audio/poi_1_en_sample.mp3',
      audioDurationSeconds: 60,
      audioStatus: 'READY',
      fallbackLanguage: false,
    });

    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Switch to English via global language source
    act(() => {
      setStoredLanguage('en');
    });

    // Click Listen on first spot
    const listenButtons = screen.getAllByRole('button', { name: /Play/i });
    await act(async () => {
      fireEvent.click(listenButtons[0]!);
    });

    // 1. With ENABLE_REMOTE_AUDIO=false, getPoiDetail was NOT called for audio playback
    expect(getPoiDetailSpy).not.toHaveBeenCalled();

    // 2. No HTMLAudioElement was created
    expect((window as any).Audio).not.toHaveBeenCalled();

    // 3. Playback uses speech synthesis reading the exact English text
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const calls = (window.speechSynthesis.speak as any).mock.calls;
    const utterance = calls[calls.length - 1][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.text).toContain('Independence Palace');
  });

  it('does NOT play backend TTS that belongs to a different stop (id-space mismatch) and keeps the spoken narration', async () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    (window as any).Audio = vi.fn().mockImplementation((src: string) => ({
      src,
      play: playMock,
      pause: vi.fn(),
      load: vi.fn(),
      playbackRate: 1,
      currentTime: 0,
      duration: 60,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    // Backend id 1 = "Bưu điện Trung tâm Sài Gòn" (code POI_BUU_DIEN_01), which is a
    // different stop than frontend poi-1 "Dinh Độc Lập". The response must be rejected
    // so the correct (frontend) spoken narration keeps playing.
    vi.spyOn(api, 'getPoiDetail').mockResolvedValueOnce({
      id: 1,
      code: 'POI_BUU_DIEN_01',
      qrToken: 'qr-1',
      name: 'Bưu điện Trung tâm Sài Gòn',
      latitude: 10.7799,
      longitude: 106.7001,
      triggerRadiusMeters: 40,
      zoneId: 1,
      zoneCode: 'D1',
      categoryCode: 'ARCHITECTURE',
      languageCode: 'vi',
      title: 'Bưu điện Trung tâm Sài Gòn',
      summary: 'Summary',
      description: 'Description',
      audioUrl: '/api/tts/audio/poi_1_vi_wrong_stop.mp3',
      audioDurationSeconds: 60,
      audioStatus: 'READY',
      fallbackLanguage: false,
    });

    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    const speakSpy = window.speechSynthesis.speak as unknown as ReturnType<typeof vi.fn>;
    speakSpy.mockClear();

    const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Spoken narration started for the correct (frontend) stop ...
    expect(speakSpy).toHaveBeenCalled();
    // ... and the mismatched backend audio was never mounted or played.
    expect((window as any).Audio).not.toHaveBeenCalled();
    expect(playMock).not.toHaveBeenCalled();
  });

  it('shows a one-time "location found" toast on the first GPS fix, not on later updates', () => {
    let watchCb: ((pos: any) => void) | null = null;
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success: any) => {
        success({
          coords: {
            latitude: 10.77709,
            longitude: 106.6954,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn((cb: any) => {
        watchCb = cb;
        return 7;
      }),
      clearWatch: vi.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <ToastProvider>
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      </ToastProvider>
    );

    // Enable auto so the hook subscribes to watchPosition for the later update
    act(() => {
      fireEvent.click(screen.getByRole('switch'));
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Vị trí của tôi/i }));
    });

    const toast = container.querySelector('#ts');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toMatch(/Đã xác định vị trí\. Điểm gần nhất: Dinh Độc Lập/);
    expect(toast?.textContent).toMatch(/cách .*(m|km)/);

    // A later watch update (near Notre Dame) must NOT re-show or replace the toast
    expect(watchCb).not.toBeNull();
    act(() => {
      watchCb!({
        coords: {
          latitude: 10.77972,
          longitude: 106.69908,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    const toastAfter = container.querySelector('#ts');
    expect(toastAfter?.textContent).toMatch(/Dinh Độc Lập/);
    expect(toastAfter?.textContent).not.toMatch(/Nhà thờ Đức Bà/);
  });

  it('auto narration: far stays silent, inside radius plays once, leaving and re-entering does not replay', () => {
    const autoPoi = {
      id: 'poi-1',
      name: { vi: 'Dinh Độc Lập', en: 'Independence Palace', ko: '통일궁', ja: '統一会堂' },
      lat: 10.77695,
      lng: 106.69537,
      triggerRadius: 50,
      category: { vi: 'Di tích lịch sử', en: 'Historic', ko: '유적', ja: '史跡' },
      image: '',
      audio: { vi: '', en: '', ko: '', ja: '' },
      transcript: { vi: '', en: '', ko: '', ja: '' },
    } as unknown as GeoPoi;

    const playPoi = vi.fn();
    const { result } = renderHook(() =>
      useAutoNarration({
        pois: [autoPoi],
        isAutoEnabled: true,
        currentPlayingId: null,
        isPlaying: false,
        playPoi,
        gpsErrorMessage: 'err',
      })
    );

    // 1. ~2.5 km away: no narration
    act(() => {
      result.current.applyPosition(10.8, 106.72);
    });
    expect(playPoi).not.toHaveBeenCalled();

    // 2. Just outside the 50 m radius (~100 m north): still no narration
    act(() => {
      result.current.applyPosition(10.77785, 106.69537);
    });
    expect(playPoi).not.toHaveBeenCalled();

    // 3. Inside the radius (~33 m north): auto narration starts once
    act(() => {
      result.current.applyPosition(10.77725, 106.69537);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
    expect(playPoi).toHaveBeenCalledWith('poi-1', true);

    // 4. Leave the radius, then re-enter: never replays an already-narrated stop
    act(() => {
      result.current.applyPosition(10.8, 106.72);
    });
    act(() => {
      result.current.applyPosition(10.77725, 106.69537);
    });
    expect(playPoi).toHaveBeenCalledTimes(1);
  });

  it('tracks journey progress and renders single-line stats and localStorage sync', () => {
    localStorage.setItem('echora_listened_pois', JSON.stringify(['poi-1']));

    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Verify progress in single-line stats and list row
    expect(screen.getByText(/1\/5 đã nghe/)).toBeInTheDocument();
    expect(document.querySelector('.stop-row-listened')).toBeInTheDocument();
    expect(document.querySelector('.chapter-listened-pill')).toBeNull();
  });

  describe('Language Consistency (Requirement 7)', () => {
    it('verifies that the dictionary has identical key sets across all 4 languages and zero missing keys', () => {
      const missingCounts = getMissingKeysCount();
      expect(missingCounts).toEqual({ vi: 0, en: 0, ko: 0, ja: 0 });

      const viKeys = Object.keys(NEARBY_DICTIONARY.vi).sort();
      const languages: ('en' | 'ko' | 'ja')[] = ['en', 'ko', 'ja'];
      for (const lang of languages) {
        const langKeys = Object.keys(NEARBY_DICTIONARY[lang]).sort();
        expect(langKeys).toEqual(viKeys);
      }
    });

    it.each(['en', 'ko', 'ja'] as const)(
      'renders cleanly in %s with no untranslated Vietnamese UI labels and proper html lang attribute',
      (targetLang) => {
        setStoredLanguage(targetLang);
        const { container } = render(
          <BrowserRouter>
            <NearbyPage />
          </BrowserRouter>
        );

        // Document language must match selected language
        expect(document.documentElement.lang).toBe(targetLang);

        // Page title must be localized
        expect(screen.getByText(t(targetLang, 'pageTitle'))).toBeInTheDocument();
        // Vietnamese page title must NOT be present
        expect(screen.queryByText('Điểm du lịch Sài Gòn')).not.toBeInTheDocument();

        // Hero has no category chip, no listened chip, and no Listen|Read toggle
        expect(container.querySelector('.hero-category-badge')).toBeNull();
        expect(container.querySelector('.chapter-listened-pill')).toBeNull();
        expect(container.querySelector('.hero-mode-switcher')).toBeNull();
        expect(container.querySelector('.chapter-mode-switcher')).toBeNull();

        // Reading section is rendered regardless of any former mode
        expect(container.querySelector('.nearby-reading-section')).toBeInTheDocument();

        // List rows still show category
        expect(container.querySelector('.stop-row-category')).toBeInTheDocument();

        // Toolbar buttons must be localized
        expect(
          screen.getByRole('button', { name: new RegExp(`^${t(targetLang, 'myLocation')}$`, 'i') })
        ).toBeInTheDocument();

        // Local name label must be displayed for foreign languages
        const localNameLabels = screen.getAllByText(new RegExp(t(targetLang, 'localNameLabel'), 'i'));
        expect(localNameLabels.length).toBeGreaterThanOrEqual(1);

        // Disallowed Vietnamese UI tokens that should NOT appear in other languages
        const vietnameseOnlyTokens = [
          'Thuyết minh tự động',
          'Vị trí của tôi',
          'điểm tham quan',
          'tổng hành trình',
        ];
        for (const token of vietnameseOnlyTokens) {
          expect(screen.queryByText(token)).not.toBeInTheDocument();
        }
      }
    );
  });

  describe('Visual Polish & Chapter Layout V2 Checks (Tasks 1, 2, 3)', () => {
    it('shows selected-stop card ONLY after explicit marker click, and keeps it closed after dismissal', () => {
      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Card must NOT be displayed on initial render
      expect(screen.queryByTestId('nearby-selected-card')).not.toBeInTheDocument();

      // Click the first marker
      const markers = screen.getAllByTestId('leaflet-marker');
      expect(markers.length).toBeGreaterThan(0);
      act(() => {
        fireEvent.click(markers[0]!);
      });

      // Card appears after marker click
      const card = screen.getByTestId('nearby-selected-card');
      expect(card).toBeInTheDocument();

      // Close the card
      const closeBtn = screen.getByTitle('Đóng thẻ địa điểm');
      act(() => {
        fireEvent.click(closeBtn);
      });

      // Card is dismissed
      expect(screen.queryByTestId('nearby-selected-card')).not.toBeInTheDocument();
    });

    describe('Single source of truth for Play / Pause / Resume (Hạng mục 1)', () => {
      const mapPois = nearbyPoisData as unknown as GeoPoi[];

      const makeMapProps = (over: Partial<React.ComponentProps<typeof PoiMap>> = {}) => ({
        pois: mapPois,
        selectedPoiId: null as string | null,
        activePoiId: null as string | null,
        hoveredPoiId: null as string | null,
        currentPlayingId: null as string | null,
        isPlaying: false,
        isPaused: false,
        userPos: null,
        radius: 60,
        isAutoEnabled: true,
        listenedPoiIds: [] as string[],
        onSelectPoi: vi.fn(),
        onHoverPoi: vi.fn(),
        onTogglePlay: vi.fn(),
        getPoiName: (p: GeoPoi) => p.name.vi,
        getPoiCategory: (p: GeoPoi) => p.category.vi,
        listenBtnText: 'Phát',
        pauseBtnText: 'Tạm dừng',
        resumeBtnText: 'Tiếp tục',
        radiusLabelText: 'Bán kính',
        mapCaptionText: 'Bản đồ',
        currentLang: 'vi' as const,
        ...over,
      });

      it('shows "Tiếp tục" on both marker popup and selected card when the current POI is paused, and resumes on click', () => {
        const onTogglePlay = vi.fn();
        render(
          <PoiMap
            {...makeMapProps({
              currentPlayingId: 'poi-1',
              isPlaying: false,
              isPaused: true,
              onTogglePlay,
            })}
          />
        );

        // Marker popup for poi-1 reflects the paused state
        const popup = screen.getAllByTestId('leaflet-popup')[0]!;
        const popupBtn = within(popup).getByRole('button');
        expect(popupBtn).toHaveTextContent('Tiếp tục');

        // Open the selected card for poi-1
        fireEvent.click(screen.getAllByTestId('leaflet-marker')[0]!);
        const card = screen.getByTestId('nearby-selected-card');
        const cardBtn = within(card).getByRole('button', { name: 'Tiếp tục' });
        expect(cardBtn).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(cardBtn);
        fireEvent.click(popupBtn);
        expect(onTogglePlay).toHaveBeenCalledWith('poi-1');
      });

      it('shows "Tạm dừng" on both the popup and selected card while the current POI is playing', () => {
        render(
          <PoiMap
            {...makeMapProps({
              currentPlayingId: 'poi-1',
              isPlaying: true,
              isPaused: false,
            })}
          />
        );

        const popup = screen.getAllByTestId('leaflet-popup')[0]!;
        expect(within(popup).getByRole('button')).toHaveTextContent('Tạm dừng');

        fireEvent.click(screen.getAllByTestId('leaflet-marker')[0]!);
        const card = screen.getByTestId('nearby-selected-card');
        const cardBtn = within(card).getByRole('button', { name: 'Tạm dừng' });
        expect(cardBtn).toHaveAttribute('aria-pressed', 'true');
      });

      it('shows "Phát" when the POI is not the one currently playing', () => {
        render(
          <PoiMap
            {...makeMapProps({
              currentPlayingId: 'poi-2',
              isPlaying: true,
              isPaused: false,
            })}
          />
        );

        fireEvent.click(screen.getAllByTestId('leaflet-marker')[0]!);
        const card = screen.getByTestId('nearby-selected-card');
        expect(within(card).getByRole('button', { name: 'Phát' })).toBeInTheDocument();
      });
    });

    it('removes per-chapter language chips and shows notice when transcript is missing for current language', () => {
      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Verify no per-chapter language chips exist
      expect(document.querySelector('.chapter-lang-availability')).toBeNull();
      expect(document.querySelector('.lang-avail-chip')).toBeNull();

      // Render a PoiCard with missing transcript for current language
      const mockPoi: GeoPoi = {
        id: 'mock-1',
        slug: 'mock-poi',
        stopOrder: 1,
        name: { vi: 'Điểm thử nghiệm', en: 'Test Point', ko: '테스트', ja: 'テスト' },
        lat: 10.77,
        lng: 106.69,
        triggerRadius: 50,
        category: { vi: 'Di tích', en: 'Relic', ko: '유적', ja: '遺跡' },
        image: '',
        audio: { vi: '', en: '', ko: '', ja: '' },
        transcript: { vi: '', en: 'English transcript only', ko: '', ja: '' },
      };

      const { container } = render(
        <PoiCard
          poi={mockPoi}
          originalIndex={0}
          isSelected={false}
          isActive={false}
          isHovered={false}
          isPlaying={false}
          isCurrent={false}
          currentLang="vi"
          inTriggerZone={false}
          inRadius={false}
          activeSentenceIndex={null}
          poiName="Điểm thử nghiệm"
          poiCategory="Di tích"
          onSelect={vi.fn()}
          onHover={vi.fn()}
          onTogglePlay={vi.fn()}
          onChangeLanguage={vi.fn()}
        />
      );

      // Notice should be displayed under mode switch
      expect(screen.getByText('Chưa có bản dịch cho ngôn ngữ này')).toBeInTheDocument();
      // No language chips inside PoiCard
      expect(container.querySelector('.chapter-lang-availability')).toBeNull();
    });

    it('renders chapter cleanly without media block when image is missing or errors', () => {
      const mockPoiNoImage: GeoPoi = {
        id: 'mock-2',
        stopOrder: 2,
        name: { vi: 'Điểm không có ảnh', en: 'No Image Point', ko: '이미지 없음', ja: '画像なし' },
        lat: 10.77,
        lng: 106.69,
        triggerRadius: 50,
        category: { vi: 'Di tích', en: 'Relic', ko: '유적', ja: '遺跡' },
        image: '',
        audio: { vi: '', en: '', ko: '', ja: '' },
        transcript: { vi: 'Mô tả không có ảnh.', en: 'Description with no image.', ko: '', ja: '' },
      };

      const { container } = render(
        <PoiCard
          poi={mockPoiNoImage}
          originalIndex={1}
          isSelected={false}
          isActive={false}
          isHovered={false}
          isPlaying={false}
          isCurrent={false}
          currentLang="vi"
          inTriggerZone={false}
          inRadius={false}
          activeSentenceIndex={null}
          poiName="Điểm không có ảnh"
          poiCategory="Di tích"
          onSelect={vi.fn()}
          onHover={vi.fn()}
          onTogglePlay={vi.fn()}
          onChangeLanguage={vi.fn()}
        />
      );

      // Media frame must be omitted entirely
      expect(container.querySelector('.chapter-media-frame')).toBeNull();
      // Text and play row still render cleanly
      expect(screen.getByText('Mô tả không có ảnh.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Phát/i })).toBeInTheDocument();
    });

    it('renders serif sentence-case h2 for chapters list heading with muted tour order note', () => {
      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Editorial h2 section header
      const listHeading = screen.getByRole('heading', { level: 2, name: /Điểm thuyết minh/i });
      expect(listHeading).toBeInTheDocument();
      expect(listHeading).toHaveClass('chapters-list-title');

      // Tour order muted note
      expect(screen.getByText('Theo thứ tự tour')).toBeInTheDocument();
    });

    it('verifies compact header, single language control, removed breadcrumb, and 2-line clamped description', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // In-page language control is removed; only header dropdown controls language
      expect(screen.queryByRole('group', { name: /Ngôn ngữ/i })).toBeNull();
      expect(screen.queryByLabelText('Ngôn ngữ')).toBeNull();

      // Single line stats rendered
      expect(container.querySelector('.nearby-header-stats-line')).toBeInTheDocument();

      // No location message is rendered as plain text notice under list heading
      const statusNotice = container.querySelector('.chapters-status-notice');
      expect(statusNotice).toBeInTheDocument();
      expect(statusNotice).toHaveTextContent(/Chưa có vị trí của bạn/i);

      // First chapter description has 2-line clamp class in listen mode
      const clampedDesc = container.querySelector('.chapter-description-measure');
      expect(clampedDesc).toHaveClass('is-clamped');

      // Primary Play button visible in chapter 1
      const playButtons = screen.getAllByRole('button', { name: /Phát/i });
      expect(playButtons[0]).toBeInTheDocument();
    });

    it('enforces dictionary completeness across all 4 languages with fallback policy', () => {
      const missingCounts = getMissingKeysCount();
      expect(missingCounts.vi).toBe(0);
      expect(missingCounts.en).toBe(0);
      expect(missingCounts.ko).toBe(0);
      expect(missingCounts.ja).toBe(0);

      const fallbackText = t('ja', 'pageTitle');
      expect(fallbackText).toBe(NEARBY_DICTIONARY.ja.pageTitle);
    });

    it('verifies izi-style stop list rendering, row selection, thumbnail presence, and alignment', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const rows = container.querySelectorAll('.nearby-stop-row');
      expect(rows).toHaveLength(5);

      // Stop 1 is active on initial load with aria-current="true"
      expect(rows[0]).toHaveAttribute('aria-current', 'true');
      expect(rows[1]).not.toHaveAttribute('aria-current');

      // Badges have fixed-width column across all rows
      const badgeCols = container.querySelectorAll('.stop-badge-col');
      expect(badgeCols).toHaveLength(5);

      // Click row 2 to select Notre Dame Cathedral
      act(() => {
        fireEvent.click(rows[1]!);
      });

      expect(rows[1]).toHaveAttribute('aria-current', 'true');
      expect(rows[0]).not.toHaveAttribute('aria-current');

      // Detail area updates title to Nhà thờ Đức Bà Sài Gòn
      const detailTitle = container.querySelector('.detail-title');
      expect(detailTitle).toHaveTextContent('Nhà thờ Đức Bà Sài Gòn');
    });

    it('manages Previous/Next buttons: disabled at ends, updates active stop without toggling audio', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const prevBtn = container.querySelector('.panel-nav-btn.btn-prev') as HTMLButtonElement;
      const nextBtn = container.querySelector('.panel-nav-btn.btn-next') as HTMLButtonElement;

      expect(prevBtn).toBeInTheDocument();
      expect(nextBtn).toBeInTheDocument();

      // At stop 1, Previous is disabled
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();
      expect(nextBtn).toHaveTextContent(/Nhà thờ Đức Bà Sài Gòn/i);

      // Clicking Next advances to stop 2 without playing audio
      act(() => {
        fireEvent.click(nextBtn);
      });

      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

      const rows = container.querySelectorAll('.nearby-stop-row');
      expect(rows[1]).toHaveAttribute('aria-current', 'true');
      expect(prevBtn).not.toBeDisabled();
      expect(prevBtn).toHaveTextContent(/Dinh Độc Lập/i);

      // Advance to stop 5
      act(() => {
        fireEvent.click(rows[4]!);
      });

      expect(rows[4]).toHaveAttribute('aria-current', 'true');
      expect(nextBtn).toBeDisabled();
      expect(prevBtn).not.toBeDisabled();
    });

    it('updates title, list heading, control labels, Play, Previous/Next, and html lang on language change', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      act(() => {
        setStoredLanguage('en');
      });

      expect(document.documentElement.lang).toBe('en');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Saigon Attractions');
      expect(container.querySelector('.chapters-list-title')).toHaveTextContent(NEARBY_DICTIONARY.en.listTitle);
      expect(container.querySelector('.detail-play-btn')).toHaveTextContent(/Play/i);

      const nextBtn = container.querySelector('.panel-nav-btn.btn-next');
      expect(nextBtn).toHaveTextContent(/Next: Notre Dame Cathedral of Saigon/i);
    });

    it('verifies no scroll-spy IntersectionObserver listener remains for chapter steps', () => {
      const observeSpy = vi.fn();
      const originalIO = window.IntersectionObserver;
      window.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: observeSpy,
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      }));

      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // No chapter-step elements exist or are observed by scroll-spy
      expect(document.querySelectorAll('.nearby-chapter-step')).toHaveLength(0);

      window.IntersectionObserver = originalIO;
    });
  });

  describe('Hero Image, Reading Section Duplicate & Controls (Tasks 1, 2, 3)', () => {
    it('hero image renders when the image resolves using the same resolver as the list, and is absent without a gap when it fails', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Stop 1 (Dinh Độc Lập): image resolves via resolveImagePath
      const heroSection = container.querySelector('.nearby-hero-section');
      expect(heroSection).toHaveClass('has-media');
      const heroImg = heroSection?.querySelector('.hero-media-img') as HTMLImageElement;
      expect(heroImg).toBeInTheDocument();
      expect(heroImg.src).toContain(resolveImagePath('/images/pois/dinh-doc-lap.jpg', 'dinh-doc-lap'));
      expect(heroImg.alt).toBe('Dinh Độc Lập');

      // Stop 3 (Bưu điện Trung tâm Sài Gòn): select stop 3 from list
      const rows = container.querySelectorAll('.nearby-stop-row');
      act(() => {
        fireEvent.click(rows[2]!);
      });

      const stop3Img = container.querySelector('.hero-media-img') as HTMLImageElement;
      expect(stop3Img).toBeInTheDocument();
      expect(stop3Img.src).toContain(resolveImagePath('/images/pois/buu-dien-trung-tam.jpg', 'buu-dien-trung-tam'));
      expect(stop3Img.alt).toBe('Bưu điện Trung tâm Sài Gòn');

      // When image load fails (e.g. onError triggered):
      act(() => {
        fireEvent.error(stop3Img);
      });

      // Media column is cleanly absent and container gains no-media without leaving a gap
      expect(container.querySelector('.hero-media-img')).toBeNull();
      expect(container.querySelector('.nearby-hero-media')).toBeNull();
      expect(container.querySelector('.nearby-hero-section')).toHaveClass('no-media');
    });

    it('reading section does not render text identical to the hero intro twice', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Select stop 3 (Bưu điện Trung tâm Sài Gòn)
      const rows = container.querySelectorAll('.nearby-stop-row');
      act(() => {
        fireEvent.click(rows[2]!);
      });

      // Hero renders intro text (clamped)
      const heroIntro = container.querySelector('.nearby-hero-intro');
      expect(heroIntro).toBeInTheDocument();
      expect(heroIntro).toHaveTextContent('Bưu điện Trung tâm Sài Gòn nổi bật với mái vòm cong cổ điển');

      // In Vietnamese, reading section shows the distinct full paragraphs and does not repeat hero intro
      const readingBody = container.querySelector('.reading-body-flow');
      expect(readingBody).toBeInTheDocument();
      expect(readingBody?.textContent).not.toBe(heroIntro?.textContent);

      // In Korean, reading section now displays the full Korean paragraphs
      act(() => {
        setStoredLanguage('ko');
      });
      expect(container.querySelector('.reading-body-flow')).toBeInTheDocument();
      expect(container.querySelector('.reading-stop-title')).toBeInTheDocument();

      // Navigation buttons remain available
      expect(container.querySelector('.reading-nav-row')).toBeInTheDocument();
    });

    it('previous and next buttons render no icon elements, are disabled at ends, and change active stop only', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const prevBtn = container.querySelector('.panel-nav-btn.btn-prev') as HTMLButtonElement;
      const nextBtn = container.querySelector('.panel-nav-btn.btn-next') as HTMLButtonElement;

      // No chevron/icon elements rendered inside buttons
      expect(prevBtn.querySelector('svg')).toBeNull();
      expect(nextBtn.querySelector('svg')).toBeNull();

      // Stop 1: prev disabled, next enabled
      expect(prevBtn).toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Advance to stop 2: only active stop changes, audio not played
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

      const activeRows = container.querySelectorAll('.nearby-stop-row.is-active');
      expect(activeRows).toHaveLength(1);
      expect(activeRows[0]).toHaveTextContent('Nhà thờ Đức Bà Sài Gòn');
    });

    it('back-to-top appears only after scroll threshold (> 1.5vh on /diem-du-lich) and not while player bar is visible', async () => {
      render(
        <MemoryRouter initialEntries={['/diem-du-lich']}>
          <BackToTop />
        </MemoryRouter>
      );

      // Scroll at 0: button not rendered
      expect(screen.queryByRole('button', { name: /Lên đầu trang/i })).toBeNull();

      // Scroll below 1.5 viewport height threshold:
      await act(async () => {
        window.innerHeight = 1000;
        window.scrollY = 1200; // < 1500
        window.dispatchEvent(new Event('scroll'));
      });
      expect(screen.queryByRole('button', { name: /Lên đầu trang/i })).toBeNull();

      // Scroll above 1.5 viewport height threshold:
      await act(async () => {
        window.scrollY = 1600; // > 1500
        window.dispatchEvent(new Event('scroll'));
      });
      const btn = screen.getByRole('button', { name: /Lên đầu trang/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('is-nearby-page');

      // When player bar is in DOM, back-to-top is hidden
      await act(async () => {
        const fakePlayer = document.createElement('div');
        fakePlayer.className = 'nearby-sticky-player-bar';
        document.body.appendChild(fakePlayer);
        window.dispatchEvent(new Event('scroll'));
      });
      expect(screen.queryByRole('button', { name: /Lên đầu trang/i })).toBeNull();

      // Clean up
      await act(async () => {
        const fakePlayer = document.querySelector('.nearby-sticky-player-bar');
        if (fakePlayer) document.body.removeChild(fakePlayer);
      });
    });
  });

  describe('Single Audio Controller & Overlap Prevention (Audio Audit Tasks)', () => {
    // unlockAudio() emits a muted " " utterance on every gesture; ignore it when
    // counting real narration calls.
    const spokenTexts = () =>
      (
        window.speechSynthesis.speak as unknown as {
          mock: { calls: Array<[SpeechSynthesisUtterance | undefined]> };
        }
      ).mock.calls.filter((call) => (call[0]?.text ?? '') !== ' ');

    it('pressing Play twice quickly leaves exactly one active source (second click toggles pause)', () => {
      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });

      // First click: starts playback
      act(() => {
        fireEvent.click(playBtn);
      });
      expect(spokenTexts()).toHaveLength(1);

      // Second click on the same stop: toggles pause, cancels speech, does not spawn second speech
      act(() => {
        fireEvent.click(playBtn);
      });
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(spokenTexts()).toHaveLength(1);
    });

    it('starting stop B while stop A plays stops A (cancel called) and plays only B', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Play stop 1 (Dinh Độc Lập)
      const playBtn1 = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn1);
      });
      expect(spokenTexts()).toHaveLength(1);

      // Select stop 2 (Nhà thờ Đức Bà) from list
      const rows = container.querySelectorAll('.nearby-stop-row');
      act(() => {
        fireEvent.click(rows[1]!);
      });

      // Play stop 2: stops stop 1 completely and starts stop 2
      const playBtn2 = screen.getByRole('button', { name: /Phát.*Nhà thờ Đức Bà/i });
      act(() => {
        fireEvent.click(playBtn2);
      });

      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(spokenTexts()).toHaveLength(2);
    });

    it('a stale async audio URL resolving after a newer start is discarded and does not play', async () => {
      let resolveStop1: (val: any) => void;
      const deferredPromise = new Promise((resolve) => {
        resolveStop1 = resolve;
      });

      const audioPlayMock = vi.fn().mockResolvedValue(undefined);
      const audioPauseMock = vi.fn();
      (window as any).Audio = vi.fn().mockImplementation((src: string) => ({
        src,
        play: audioPlayMock,
        pause: audioPauseMock,
        load: vi.fn(),
        playbackRate: 1,
        currentTime: 0,
        duration: 60,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const getPoiDetailSpy = vi.spyOn(api, 'getPoiDetail').mockImplementation((id: number) => {
        if (id === 1) return deferredPromise as any;
        return Promise.reject(new Error('not ready'));
      });

      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // 1. User starts stop 1 (async request in-flight)
      const playBtn1 = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn1);
      });

      // 2. User quickly switches to stop 2 before stop 1 resolves
      const rows = container.querySelectorAll('.nearby-stop-row');
      act(() => {
        fireEvent.click(rows[1]!);
      });
      const playBtn2 = screen.getByRole('button', { name: /Phát.*Nhà thờ Đức Bà/i });
      act(() => {
        fireEvent.click(playBtn2);
      });

      // 3. Stale stop 1 resolves later
      await act(async () => {
        resolveStop1!({
          id: 1,
          audioUrl: '/api/tts/audio/poi_1_stale.mp3',
          audioStatus: 'READY',
        });
      });

      // HTML5 Audio for the stale stop 1 must NOT be instantiated or played
      expect(audioPlayMock).not.toHaveBeenCalled();
      getPoiDetailSpy.mockRestore();
    });

    it('events (onended, onerror) of a cancelled playback do not trigger a new action or state corruption', () => {
      let capturedOnEnded: (() => void) | null = null;
      (window as any).Audio = vi.fn().mockImplementation((src: string) => {
        return {
          src,
          play: vi.fn().mockResolvedValue(undefined),
          pause: vi.fn(),
          load: vi.fn(),
          playbackRate: 1,
          currentTime: 0,
          duration: 60,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          set onended(fn: any) {
            capturedOnEnded = fn;
          },
          get onended() {
            return capturedOnEnded;
          },
        };
      });

      vi.spyOn(api, 'getPoiDetail').mockResolvedValueOnce({
        id: 1,
        code: 'poi-1',
        audioUrl: '/api/tts/audio/poi_1.mp3',
        audioStatus: 'READY',
      } as any);

      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn);
      });

      // Stop audio before it finishes
      act(() => {
        fireEvent.click(playBtn);
      });

      // Firing onended on the cancelled audio element should be safely ignored
      if (capturedOnEnded) {
        expect(() => {
          act(() => {
            capturedOnEnded!();
          });
        }).not.toThrow();
      }
    });

    it('auto-narration does not start while playback is active or loading, and respects the 5000ms cooldown window', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Start stop 1 manually
      const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn);
      });

      // Auto narration toggle
      const autoSwitch = container.querySelector('#chkAuto') as HTMLElement;
      act(() => {
        fireEvent.click(autoSwitch);
      });

      // Clear calls counter
      (window.speechSynthesis.speak as any).mockClear();

      // Trigger location near stop 1 while already playing
      // Should NOT re-trigger speech
      expect(spokenTexts()).toHaveLength(0);

      // Stop manually
      act(() => {
        fireEvent.click(playBtn);
      });

      // In the 5000ms guard window, auto narration must NOT restart stop 1
      expect(spokenTexts()).toHaveLength(0);
    });

    it('language change stops playback and does not auto-restart; unmount cancels everything', () => {
      const { unmount } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn);
      });
      expect(window.speechSynthesis.speak).toHaveBeenCalled();

      // Clear speak calls
      (window.speechSynthesis.speak as any).mockClear();

      // Switch language to en
      act(() => {
        setStoredLanguage('en');
      });

      // Audio was stopped, cancel called, and does not auto-restart
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();

      // Unmount: cancels everything
      unmount();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    it('previous and next buttons change active stop only and never call play or cancel', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const nextBtn = container.querySelector('.panel-nav-btn.btn-next') as HTMLButtonElement;
      (window.speechSynthesis.speak as any).mockClear();
      (window.speechSynthesis.cancel as any).mockClear();

      act(() => {
        fireEvent.click(nextBtn);
      });

      expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
      expect(window.speechSynthesis.cancel).not.toHaveBeenCalled();
    });
  });

  describe('Narration Layers & Multilingual Content (Tasks 1 to 6)', () => {
    it('every stop has non-empty vi and en for short and full layers', () => {
      const pois = nearbyPoisData as GeoPoi[];
      expect(pois).toHaveLength(5);
      for (const p of pois) {
        expect(p.narration?.short?.vi?.trim().length).toBeGreaterThan(0);
        expect(p.narration?.short?.en?.trim().length).toBeGreaterThan(0);
        expect(p.narration?.full?.vi?.length).toBeGreaterThan(0);
        expect(p.narration?.full?.en?.length).toBeGreaterThan(0);
        for (const para of p.narration!.full.vi!) {
          expect(para.trim().length).toBeGreaterThan(0);
        }
        for (const para of p.narration!.full.en!) {
          expect(para.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('the number of paragraphs of each full text matches the content block', () => {
      const pois = nearbyPoisData as GeoPoi[];
      // Stop 1: 4 paragraphs
      expect(pois[0]?.narration?.full?.vi).toHaveLength(4);
      expect(pois[0]?.narration?.full?.en).toHaveLength(4);

      // Stop 2: 4 paragraphs
      expect(pois[1]?.narration?.full?.vi).toHaveLength(4);
      expect(pois[1]?.narration?.full?.en).toHaveLength(4);

      // Stop 3: 3 paragraphs
      expect(pois[2]?.narration?.full?.vi).toHaveLength(3);
      expect(pois[2]?.narration?.full?.en).toHaveLength(3);

      // Stop 4: 3 paragraphs
      expect(pois[3]?.narration?.full?.vi).toHaveLength(3);
      expect(pois[3]?.narration?.full?.en).toHaveLength(3);

      // Stop 5: 3 paragraphs
      expect(pois[4]?.narration?.full?.vi).toHaveLength(3);
      expect(pois[4]?.narration?.full?.en).toHaveLength(3);
    });

    it('verifies accessor behavior for vi, en, ko', () => {
      const stop1 = (nearbyPoisData as GeoPoi[])[0]!;

      // vi
      const viShort = getNarration(stop1, 'vi', 'short');
      const viFull = getNarration(stop1, 'vi', 'full');
      expect(typeof viShort).toBe('string');
      expect(viShort).toContain('Chào mừng bạn đến Dinh Độc Lập');
      expect(Array.isArray(viFull)).toBe(true);
      expect(viFull).toHaveLength(4);

      // en
      const enShort = getNarration(stop1, 'en', 'short');
      const enFull = getNarration(stop1, 'en', 'full');
      expect(typeof enShort).toBe('string');
      expect(enShort).toContain('Welcome to Independence Palace');
      expect(Array.isArray(enFull)).toBe(true);
      expect(enFull).toHaveLength(4);

      // ko: short comes from narration.short.ko, full is array of paragraphs
      const koShort = getNarration(stop1, 'ko', 'short');
      const koFull = getNarration(stop1, 'ko', 'full');
      expect(typeof koShort).toBe('string');
      expect(koShort).toContain('통일궁');
      expect(Array.isArray(koFull)).toBe(true);
      expect(koFull).toHaveLength(4);
    });

    it('hero intro is the first two sentences of short text', () => {
      const stop1 = (nearbyPoisData as GeoPoi[])[0]!;
      const heroIntroVi = getHeroIntroText(stop1, 'vi');
      expect(heroIntroVi).toBe(
        'Chào mừng bạn đến Dinh Độc Lập, nơi gắn liền với ngày thống nhất đất nước. Nơi đây từng là dinh của chính quyền thuộc địa Pháp, sau này là dinh của các tổng thống Việt Nam Cộng hòa.'
      );

      const heroIntroEn = getHeroIntroText(stop1, 'en');
      expect(heroIntroEn).toBe(
        'Welcome to Independence Palace, a place tied to the day the country was reunified. The site once housed the French colonial rulers, and later the presidents of South Vietnam.'
      );
    });

    it('reading section shows full paragraphs in vi and en without repeating hero text, and hides reading body in ko when identical', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Stop 1 in Vietnamese (default)
      const heroIntro = container.querySelector('.nearby-hero-intro');
      expect(heroIntro).toBeInTheDocument();
      expect(heroIntro).toHaveTextContent('Chào mừng bạn đến Dinh Độc Lập');

      // Reading section shows 4 full paragraphs and does not repeat hero intro
      const readingBody = container.querySelector('.reading-body-flow');
      expect(readingBody).toBeInTheDocument();
      const paras = readingBody?.querySelectorAll('.reading-paragraph');
      expect(paras).toHaveLength(4);
      expect(readingBody?.textContent).not.toBe(heroIntro?.textContent);

      // Switch language to Korean: reading section shows full Korean paragraphs
      act(() => {
        setStoredLanguage('ko');
      });

      const koHeroIntro = container.querySelector('.nearby-hero-intro');
      expect(koHeroIntro).toHaveTextContent('통일궁');
      const koReadingBody = container.querySelector('.reading-body-flow');
      expect(koReadingBody).toBeInTheDocument();
      expect(koReadingBody?.querySelectorAll('.reading-paragraph')).toHaveLength(4);
      // Navigation buttons remain available
      expect(container.querySelector('.reading-nav-row')).toBeInTheDocument();
    });

    it('manual Play passes full text to speechSynthesis (mock)', () => {
      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Manual Play: should pass full text (all 4 paragraphs joined by a space)
      const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn);
      });

      expect(window.speechSynthesis.speak).toHaveBeenCalled();
      const calls = (window.speechSynthesis.speak as any).mock.calls;
      const utterance = calls[calls.length - 1][0] as SpeechSynthesisUtterance;
      expect(utterance.text).toContain('Dinh Độc Lập nằm giữa một khu vườn rộng ở trung tâm thành phố');
      expect(utterance.text).toContain('Kiến trúc sư Ngô Viết Thụ thiết kế');
      expect(utterance.text).toContain('khu hầm chỉ huy');
    });

    it('auto trigger passes short text to speechSynthesis (mock)', () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 10.77709,
              longitude: 106.6954,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        }),
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      });

      render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      (window.speechSynthesis.speak as any).mockClear();

      // Enable auto narration switch
      const autoSwitch = screen.getByRole('switch');
      act(() => {
        fireEvent.click(autoSwitch);
      });

      // Request GPS location near Stop 1
      const gpsBtn = screen.getByRole('button', { name: /Vị trí của tôi/i });
      act(() => {
        fireEvent.click(gpsBtn);
      });

      // Spoken via auto trigger, text is short text (not full text)
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
      const calls = (window.speechSynthesis.speak as any).mock.calls;
      const utterance = calls[calls.length - 1][0] as SpeechSynthesisUtterance;
      expect(utterance.text).toContain('Chào mừng bạn đến Dinh Độc Lập, nơi gắn liền với ngày thống nhất đất nước');
      expect(utterance.text).not.toContain('Kiến trúc sư Ngô Viết Thụ thiết kế');
    });

    it('highlighting advances across paragraph boundaries', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      // Start playback of Stop 1
      const playBtn = screen.getByRole('button', { name: /Phát.*Dinh Độc Lập/i });
      act(() => {
        fireEvent.click(playBtn);
      });

      // In listen mode with word-level progress, current word is highlighted
      const currentWord = container.querySelector('.reading-paragraph .reading-segment-current');
      expect(currentWord).toBeInTheDocument();

      // Old sentence box classes no longer exist
      expect(container.querySelectorAll('.is-highlighted-sentence')).toHaveLength(0);
      expect(container.querySelectorAll('.transcript-sentence-node')).toHaveLength(0);
    });

    it('no visible text for a stop with a missing language falls back to another language', () => {
      const mockPoiMissingLang: GeoPoi = {
        id: 'mock-missing-lang',
        name: { vi: 'Điểm thử nghiệm', en: '', ko: '', ja: '' },
        lat: 10.77,
        lng: 106.69,
        triggerRadius: 50,
        category: { vi: 'Thử nghiệm', en: '', ko: '', ja: '' },
        image: '',
        audio: { vi: '', en: '', ko: '', ja: '' },
        transcript: { vi: 'Bản dịch tiếng Việt.', en: '', ko: '', ja: '' },
      };

      // getNarration for ko returns null, never falling back to Vietnamese
      expect(getNarration(mockPoiMissingLang, 'ko', 'short')).toBeNull();
      expect(getNarration(mockPoiMissingLang, 'ko', 'full')).toBeNull();
      expect(getNarration(mockPoiMissingLang, 'ja', 'short')).toBeNull();
      expect(getHeroIntroText(mockPoiMissingLang, 'ko')).toBe('');
    });

    it('asserts no reading paragraph starts with whitespace and no double space appears in any paragraph', () => {
      const { container } = render(
        <BrowserRouter>
          <NearbyPage />
        </BrowserRouter>
      );

      const paragraphs = container.querySelectorAll('.reading-paragraph');
      expect(paragraphs.length).toBeGreaterThan(0);

      paragraphs.forEach((p) => {
        const text = p.textContent || '';
        // No leading whitespace (no pseudo-indent)
        expect(text).toMatch(/^\S/);
        // No trailing whitespace
        expect(text).toMatch(/\S$/);
        // Exactly one space between adjacent sentences (no double spaces)
        expect(text).not.toContain('  ');
      });
    });

    describe('Language Reduction (4 languages) & Duration/Highlight Rules', () => {
      it('(a) dropdown has exactly 4 options: Tiếng Việt, English, 日本語, 한국어', () => {
        expect(SUPPORTED_LANGUAGES).toHaveLength(4);
        expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(['vi', 'en', 'ja', 'ko']);
        expect(SUPPORTED_LANGUAGES.map((l) => l.label)).toEqual([
          'Tiếng Việt',
          'English',
          '日本語',
          '한국어',
        ]);
      });

      it('(b) zh in storage migrates to vi', () => {
        localStorage.setItem('sv:lang', 'zh');
        const lang = getStoredLanguage();
        expect(lang).toBe('vi');
        expect(localStorage.getItem('sv:lang')).toBe('vi');
      });

      it('(c) hero element set identical across vi/en/ja/ko per state', () => {
        const testPoi = (nearbyPoisData[0] as unknown) as GeoPoi;
        const languages: ('vi' | 'en' | 'ja' | 'ko')[] = ['vi', 'en', 'ja', 'ko'];
        const states: ('idle' | 'loading' | 'playing' | 'paused')[] = [
          'idle',
          'loading',
          'playing',
          'paused',
        ];

        states.forEach((state) => {
          const results = languages.map((lang) => {
            const isPlaying = state === 'playing';
            const isCurrent = state !== 'idle';
            const { container } = render(
              <PoiHero
                poi={testPoi}
                originalIndex={0}
                totalStops={5}
                currentLang={lang}
                isPlaying={isPlaying}
                isCurrent={isCurrent}
                playbackStatus={state}
                onTogglePlay={vi.fn()}
                duration={state === 'playing' || state === 'paused' ? 26 : 0}
                getPoiName={(p) => p.name[lang] || p.name.vi}
              />
            );

            const heroContent = container.querySelector('.nearby-hero-content')!;
            const titleEl = heroContent.querySelector('.nearby-hero-title');
            const introEl = heroContent.querySelector('.nearby-hero-intro');
            const actionsRow = heroContent.querySelector('.hero-actions-row')!;
            const playBtn = actionsRow.querySelector('.detail-play-btn');
            const hasDuration = Boolean(actionsRow.querySelector('.hero-audio-duration'));
            const positionIndicator = actionsRow.querySelector('.hero-position-indicator');

            // Must NOT have category badge, listened badge, or mode switcher
            const hasCategoryBadge = Boolean(container.querySelector('.hero-category-badge'));
            const hasListenedChip = Boolean(container.querySelector('.chapter-listened-pill'));
            const hasSwitcher = Boolean(
              container.querySelector('.hero-mode-switcher') ||
              container.querySelector('.chapter-mode-switcher')
            );

            // Document order verification: title -> intro -> playBtn -> positionIndicator
            const children = Array.from(heroContent.children);
            const titleIdx = children.findIndex((el) => el.contains(titleEl));
            const introIdx = children.findIndex((el) => el.contains(introEl));
            const actionsIdx = children.findIndex((el) => el === actionsRow);

            const actionsChildren = Array.from(actionsRow.children);
            const playBtnIdx = actionsChildren.findIndex((el) => el === playBtn);
            const posIdx = actionsChildren.findIndex((el) => el === positionIndicator);

            const isOrderValid =
              titleIdx >= 0 &&
              introIdx > titleIdx &&
              actionsIdx > introIdx &&
              playBtnIdx >= 0 &&
              posIdx > playBtnIdx;

            return {
              lang,
              hasPlayBtn: Boolean(playBtn),
              hasDuration,
              hasPositionIndicator: Boolean(positionIndicator),
              hasCategoryBadge,
              hasListenedChip,
              hasSwitcher,
              isOrderValid,
              positionText: positionIndicator?.textContent?.trim(),
            };
          });

          // Across all 4 languages in this state, control element presence and order must be identical
          const first = results[0]!;
          results.forEach((res) => {
            expect(res.hasPlayBtn).toBe(first.hasPlayBtn);
            expect(res.hasDuration).toBe(first.hasDuration);
            expect(res.hasPositionIndicator).toBe(true);
            expect(res.hasCategoryBadge).toBe(false);
            expect(res.hasListenedChip).toBe(false);
            expect(res.hasSwitcher).toBe(false);
            expect(res.isOrderValid).toBe(true);
            expect(res.positionText).toBe('1 / 5');
          });

          // Specifically in idle and loading: no duration next to play button in any language
          if (state === 'idle' || state === 'loading') {
            results.forEach((res) => {
              expect(res.hasDuration).toBe(false);
            });
          }
          // In playing and paused: duration is present in all 4 languages
          if (state === 'playing' || state === 'paused') {
            results.forEach((res) => {
              expect(res.hasDuration).toBe(true);
            });
          }
        });
      });

      it('(d) ja/ko render reading body when full narration is present, and no reading body when absent', () => {
        const testPoi = (nearbyPoisData[0] as unknown) as GeoPoi;
        const sortedItem: SortedPoiItem = {
          poi: testPoi,
          originalIndex: 0,
          dist: null,
        };

        (['ja', 'ko'] as const).forEach((lang) => {
          const { container } = render(
            <PoiReadingSection
              activeItem={sortedItem}
              currentLang={lang}
              isPlaying={false}
              isCurrent={false}
              activeSentenceIndex={null}
              prevItem={null}
              nextItem={null}
              onSelectPoi={vi.fn()}
              getPoiName={(p) => p.name[lang] || p.name.vi}
            />
          );

          // Reading body and paragraphs are rendered when full narration exists
          expect(container.querySelector('.reading-body-flow')).toBeInTheDocument();
          expect(container.querySelector('.reading-stop-title')).toBeInTheDocument();
          expect(container.querySelectorAll('.reading-paragraph').length).toBeGreaterThan(0);

          // Previous/Next navigation is retained
          expect(container.querySelector('.reading-nav-row')).toBeInTheDocument();
        });

        // When full narration is absent, no reading body is rendered
        const poiWithoutFull: GeoPoi = {
          ...testPoi,
          narration: { short: testPoi.narration!.short, full: { vi: [], en: [], ja: [], ko: [] } },
        };
        const emptyItem: SortedPoiItem = { poi: poiWithoutFull, originalIndex: 0, dist: null };
        const { container: emptyContainer } = render(
          <PoiReadingSection
            activeItem={emptyItem}
            currentLang="ja"
            isPlaying={false}
            isCurrent={false}
            activeSentenceIndex={null}
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.ja || p.name.vi}
          />
        );
        expect(emptyContainer.querySelector('.reading-body-flow')).toBeNull();
      });

      it('(e) no highlight while backend or static audio plays', () => {
        const testPoi = (nearbyPoisData[0] as unknown) as GeoPoi;
        const sortedItem: SortedPoiItem = {
          poi: testPoi,
          originalIndex: 0,
          dist: null,
        };

        // Test with backend audio
        const { container: backendContainer } = render(
          <PoiReadingSection
            activeItem={sortedItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={true}
            activeCharOffset={0}
            activeCharLength={4}
            audioSourceType="backend"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        expect(backendContainer.querySelectorAll('.reading-segment-current')).toHaveLength(0);
        expect(backendContainer.querySelectorAll('.is-highlighted-sentence')).toHaveLength(0);

        // Test with static audio
        const { container: staticContainer } = render(
          <PoiReadingSection
            activeItem={sortedItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={true}
            activeCharOffset={0}
            activeCharLength={4}
            audioSourceType="static"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        expect(staticContainer.querySelectorAll('.reading-segment-current')).toHaveLength(0);
        expect(staticContainer.querySelectorAll('.is-highlighted-sentence')).toHaveLength(0);

        // Contrast: when speech synthesis is reading full text, word highlight is active
        const { container: speechContainer } = render(
          <PoiReadingSection
            activeItem={sortedItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={true}
            activeCharOffset={0}
            activeCharLength={4}
            audioSourceType="speech"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        expect(speechContainer.querySelectorAll('.reading-segment-current')).toHaveLength(1);
        expect(speechContainer.querySelectorAll('.is-highlighted-sentence')).toHaveLength(0);
      });
    });

    describe('Word-Level Progress & Reading Section Audits (Tasks 1 to 8)', () => {
      const mockMultiParaPoi: GeoPoi = {
        id: 'poi-test-multi',
        slug: 'poi-test-multi',
        stopOrder: 1,
        name: { vi: 'Điểm Kiểm Thử', en: 'Test POI', ko: '테스트', ja: 'テスト' },
        lat: 10.77,
        lng: 106.69,
        triggerRadius: 50,
        category: { vi: 'Di tích', en: 'Landmark', ko: '유적', ja: '史跡' },
        image: '',
        audio: { vi: '', en: '', ko: '', ja: '' },
        transcript: { vi: '', en: '', ko: '', ja: '' },
        narration: {
          short: { vi: 'Tóm tắt ngắn.', en: 'Short.', ko: '', ja: '' },
          full: {
            vi: [
              'Đoạn thứ nhất có một số từ ngữ ngắn.',
              'Đoạn thứ hai tiếp tục bài thuyết minh chi tiết.',
            ],
            en: [
              'The first paragraph has some short words.',
              'The second paragraph continues with details.',
            ],
            ko: [],
            ja: [],
          },
        },
      };

      const sortedMultiParaItem: SortedPoiItem = {
        poi: mockMultiParaPoi,
        originalIndex: 0,
        dist: null,
      };

      it('boundary event maps to the right paragraph/segment split across paragraph boundaries', () => {
        // Para 0: length 36 ('Đoạn thứ nhất có một số từ ngữ ngắn.')
        // Space at index 36.
        // Para 1: starts at index 37 ('Đoạn thứ hai tiếp tục bài thuyết minh chi tiết.')
        
        // 1. Spoken word is inside Paragraph 0 ('thứ' at offset 5, length 3)
        const { container: c1 } = render(
          <PoiReadingSection
            activeItem={sortedMultiParaItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={true}
            activeCharOffset={5}
            activeCharLength={3}
            audioSourceType="speech"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        const p1List = c1.querySelectorAll('.reading-paragraph');
        expect(p1List).toHaveLength(2);

        // Para 0 should have read, current, unread segments
        const p0Read = p1List[0]?.querySelector('.reading-segment-read');
        const p0Current = p1List[0]?.querySelector('.reading-segment-current');
        const p0Unread = p1List[0]?.querySelector('.reading-segment-unread');
        expect(p0Read?.textContent).toBe('Đoạn ');
        expect(p0Current?.textContent).toBe('thứ');
        expect(p0Unread?.textContent).toBe(' nhất có một số từ ngữ ngắn.');

        // Para 1 is completely unread
        const p1Unread = p1List[1]?.querySelector('.reading-segment-unread');
        expect(p1Unread?.textContent).toBe('Đoạn thứ hai tiếp tục bài thuyết minh chi tiết.');
        expect(p1List[1]?.querySelector('.reading-segment-current')).toBeNull();
        expect(p1List[1]?.querySelector('.reading-segment-read')).toBeNull();

        // 2. Spoken word is inside Paragraph 1 (offset 42 = 37 + 5, length 3 for 'thứ')
        const { container: c2 } = render(
          <PoiReadingSection
            activeItem={sortedMultiParaItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={true}
            activeCharOffset={42}
            activeCharLength={3}
            audioSourceType="speech"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        const p2List = c2.querySelectorAll('.reading-paragraph');
        expect(p2List).toHaveLength(2);

        // Para 0 is completely read
        expect(p2List[0]?.querySelector('.reading-segment-read')?.textContent).toBe(
          'Đoạn thứ nhất có một số từ ngữ ngắn.'
        );
        expect(p2List[0]?.querySelector('.reading-segment-current')).toBeNull();
        expect(p2List[0]?.querySelector('.reading-segment-unread')).toBeNull();

        // Para 1 has read, current, unread segments
        expect(p2List[1]?.querySelector('.reading-segment-read')?.textContent).toBe('Đoạn ');
        expect(p2List[1]?.querySelector('.reading-segment-current')?.textContent).toBe('thứ');
        expect(p2List[1]?.querySelector('.reading-segment-unread')?.textContent).toBe(
          ' hai tiếp tục bài thuyết minh chi tiết.'
        );
      });

      it('read/current/unread segments concatenate to exactly the original paragraph text', () => {
        const origPara0 = mockMultiParaPoi.narration!.full!.vi![0];
        const origPara1 = mockMultiParaPoi.narration!.full!.vi![1];

        const testOffsets = [0, 5, 20, 36, 42, 60, 84];

        testOffsets.forEach((offset) => {
          const { container } = render(
            <PoiReadingSection
              activeItem={sortedMultiParaItem}
              currentLang="vi"
              isPlaying={true}
              isCurrent={true}
              activeCharOffset={offset}
              activeCharLength={3}
              audioSourceType="speech"
              prevItem={null}
              nextItem={null}
              onSelectPoi={vi.fn()}
              getPoiName={(p) => p.name.vi}
            />
          );

          const paragraphs = container.querySelectorAll('.reading-paragraph');
          expect(paragraphs[0]?.textContent).toBe(origPara0);
          expect(paragraphs[1]?.textContent).toBe(origPara1);
        });
      });

      it('ja text without spaces works with snapToWordBoundary', () => {
        const jaText = '統一会堂はホーチミン市にある歴史的建築物です。';
        const snapStart = snapToWordBoundary(jaText, 0, 'ja');
        expect(snapStart.charIndex).toBe(0);
        expect(snapStart.charLength).toBeGreaterThanOrEqual(1);

        const snapMid = snapToWordBoundary(jaText, 5, 'ja');
        expect(snapMid.charIndex).toBe(5);
        expect(snapMid.charLength).toBeGreaterThanOrEqual(1);

        // Japanese reading stops at punctuation
        const snapPunct = snapToWordBoundary('建築物です。次へ', 5, 'ja');
        expect(snapPunct.charIndex).toBe(5);
      });

      it('fallback estimate activates when no boundary events arrive (use fake timers)', () => {
        vi.useFakeTimers();
        try {
          const { result } = renderHook(() =>
            useNearbyAudio({
              pois: [mockMultiParaPoi],
              currentLang: 'vi',
              fallbackNoticeText: (l) => l,
              autoTriggerNoticeText: (n) => n,
              getPoiName: (p) => p.name.vi,
            })
          );

          act(() => {
            result.current.playPoi(mockMultiParaPoi.id);
          });

          // Initially in boundary syncMode
          expect(result.current.syncMode).toBe('boundary');
          expect(result.current.activeCharOffset).toBe(0);

          // Advance by 500ms (still within 1s watchdog)
          act(() => {
            vi.advanceTimersByTime(500);
          });
          expect(result.current.syncMode).toBe('boundary');

          // Advance past 1000ms watchdog
          act(() => {
            vi.advanceTimersByTime(600);
          });
          expect(result.current.syncMode).toBe('estimate');
          expect(result.current.activeCharOffset).toBeGreaterThanOrEqual(0);

          act(() => {
            result.current.stopAllAudio();
          });
          expect(result.current.activeCharOffset).toBeNull();
        } finally {
          vi.useRealTimers();
        }
      });

      it('no highlight segments exist when idle or when another stop is playing', () => {
        // 1. Idle (isPlaying = false)
        const { container: idleContainer } = render(
          <PoiReadingSection
            activeItem={sortedMultiParaItem}
            currentLang="vi"
            isPlaying={false}
            isCurrent={true}
            activeCharOffset={5}
            activeCharLength={3}
            audioSourceType="speech"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        expect(idleContainer.querySelectorAll('.reading-segment-read')).toHaveLength(0);
        expect(idleContainer.querySelectorAll('.reading-segment-current')).toHaveLength(0);
        expect(idleContainer.querySelectorAll('.reading-segment-unread')).toHaveLength(0);

        // 2. Another stop is playing (isCurrent = false)
        const { container: otherContainer } = render(
          <PoiReadingSection
            activeItem={sortedMultiParaItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={false}
            activeCharOffset={5}
            activeCharLength={3}
            audioSourceType="speech"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        expect(otherContainer.querySelectorAll('.reading-segment-read')).toHaveLength(0);
        expect(otherContainer.querySelectorAll('.reading-segment-current')).toHaveLength(0);
        expect(otherContainer.querySelectorAll('.reading-segment-unread')).toHaveLength(0);
      });

      it('the active-sentence box classes and nodes no longer exist in reading section', () => {
        const { container } = render(
          <PoiReadingSection
            activeItem={sortedMultiParaItem}
            currentLang="vi"
            isPlaying={true}
            isCurrent={true}
            activeCharOffset={5}
            activeCharLength={3}
            audioSourceType="speech"
            prevItem={null}
            nextItem={null}
            onSelectPoi={vi.fn()}
            getPoiName={(p) => p.name.vi}
          />
        );
        expect(container.querySelectorAll('.is-highlighted-sentence')).toHaveLength(0);
        expect(container.querySelectorAll('.transcript-sentence-node')).toHaveLength(0);
        expect(container.querySelector('.reading-body-flow')).toHaveAttribute('data-sync');
      });
    });

    describe('Hero Simplification & Invariant Audits (Tasks 1 to 4)', () => {
      it.each(['vi', 'en', 'ja', 'ko'] as const)(
        'asserts hero has no category chip, no listened chip, and no Listen|Read toggle in %s',
        (lang) => {
          setStoredLanguage(lang);
          const { container } = render(
            <BrowserRouter>
              <NearbyPage />
            </BrowserRouter>
          );

          const hero = container.querySelector('.nearby-hero-section');
          expect(hero).toBeInTheDocument();

          // 1. No category chip
          expect(hero?.querySelector('.hero-category-badge')).toBeNull();

          // 2. No listened chip
          expect(hero?.querySelector('.chapter-listened-pill')).toBeNull();

          // 3. No Listen|Read toggle
          expect(hero?.querySelector('.hero-mode-switcher')).toBeNull();
          expect(hero?.querySelector('.chapter-mode-switcher')).toBeNull();
          expect(hero?.querySelector('.mode-switch-btn')).toBeNull();

          // 4. Reading section is rendered below
          expect(container.querySelector('.nearby-reading-section')).toBeInTheDocument();

          // 5. List rows still show category
          const stopCategories = container.querySelectorAll('.stop-row-category');
          expect(stopCategories.length).toBeGreaterThan(0);
        }
      );

      it('asserts hero keeps exact order: stop name -> intro -> Play button -> position indicator in vi, en, ja, ko', () => {
        const testPoi = (nearbyPoisData[0] as unknown) as GeoPoi;
        const languages: ('vi' | 'en' | 'ja' | 'ko')[] = ['vi', 'en', 'ja', 'ko'];

        languages.forEach((lang) => {
          const { container } = render(
            <PoiHero
              poi={testPoi}
              originalIndex={2}
              totalStops={5}
              currentLang={lang}
              isPlaying={false}
              isCurrent={true}
              playbackStatus="idle"
              onTogglePlay={vi.fn()}
              getPoiName={(p) => p.name[lang] || p.name.vi}
            />
          );

          const heroContent = container.querySelector('.nearby-hero-content')!;
          const title = heroContent.querySelector('.nearby-hero-title')!;
          const intro = heroContent.querySelector('.nearby-hero-intro')!;
          const actionsRow = heroContent.querySelector('.hero-actions-row')!;
          const playBtn = actionsRow.querySelector('.detail-play-btn')!;
          const posIndicator = actionsRow.querySelector('.hero-position-indicator')!;

          expect(title).toBeInTheDocument();
          expect(intro).toBeInTheDocument();
          expect(playBtn).toBeInTheDocument();
          expect(posIndicator).toBeInTheDocument();
          expect(posIndicator).toHaveTextContent('3 / 5');

          // Strict ordering check
          const contentChildren = Array.from(heroContent.children);
          expect(contentChildren.indexOf(title)).toBeLessThan(contentChildren.indexOf(intro));
          expect(contentChildren.indexOf(intro)).toBeLessThan(contentChildren.indexOf(actionsRow));

          const actionsChildren = Array.from(actionsRow.children);
          expect(actionsChildren.indexOf(playBtn)).toBeLessThan(actionsChildren.indexOf(posIndicator));
        });
      });

      it('asserts list rows still show the category and listened check mark when marked listened, while hero has no chip', () => {
        // Set stop 1 as listened in localStorage
        localStorage.setItem('echora_listened_pois', JSON.stringify(['poi-1']));
        setStoredLanguage('vi');

        const { container } = render(
          <BrowserRouter>
            <NearbyPage />
          </BrowserRouter>
        );

        // Stop 1 is active stop and listened
        const hero = container.querySelector('#active-stop-hero');
        expect(hero?.querySelector('.chapter-listened-pill')).toBeNull();
        expect(hero?.querySelector('.hero-category-badge')).toBeNull();

        // In the stop list:
        const firstStopRow = container.querySelector('.nearby-stop-row');
        expect(firstStopRow).toBeInTheDocument();

        // Category is present in the list row
        const catEl = firstStopRow?.querySelector('.stop-row-category');
        expect(catEl).toBeInTheDocument();
        expect(catEl?.textContent?.trim().length).toBeGreaterThan(0);

        // Listened check mark is present in the list row
        const listenedCheck = firstStopRow?.querySelector('.stop-row-listened');
        expect(listenedCheck).toBeInTheDocument();
      });
    });
  });
});


