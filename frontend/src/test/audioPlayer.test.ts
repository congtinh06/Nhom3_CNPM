import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import {
  splitTranscriptIntoSentences,
  isBackendDetailForPoi,
  normalizePoiName,
  resolvePlayback,
  SPEECH_LANG_MAP,
  findMatchingVoice,
  useNearbyAudio,
} from '../hooks/useNearbyAudio';
import { ToastProvider } from '../context/ToastContext';
import { AudioPlayerBar } from '../components/nearby/AudioPlayerBar';
import { GeoPoi } from '../pages/NearbyPage';
import { SupportedLanguage } from '../types';
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

  it('does not speak and shows a clear notice when there is no Vietnamese voice', () => {
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    const getVoicesSpy = vi
      .spyOn(window.speechSynthesis, 'getVoices')
      .mockReturnValue([
        { lang: 'en-US', name: 'Google US English', voiceURI: 'en' } as SpeechSynthesisVoice,
      ]);

    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    act(() => {
      result.current.playAudio({
        poiId: 1,
        title: 'Dinh Độc Lập',
        textToSpeak: 'Di tích lịch sử nổi tiếng.',
        lang: 'vi',
      });
    });

    expect(speakSpy).not.toHaveBeenCalled();
    expect(result.current.playerState).toBe('idle');
    expect(result.current.playingPoiId).toBeNull();
    expect(screen.getByText('Thiết bị chưa có giọng đọc tiếng Việt')).toBeInTheDocument();

    speakSpy.mockRestore();
    getVoicesSpy.mockRestore();
  });

  it('waits for asynchronously loaded voices before deciding a Vietnamese voice is missing', async () => {
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    const viVoice = {
      lang: 'vi-VN',
      name: 'Google Tiếng Việt',
      voiceURI: 'vi',
    } as SpeechSynthesisVoice;
    let ready = false;
    const getVoicesSpy = vi
      .spyOn(window.speechSynthesis, 'getVoices')
      .mockImplementation(() => (ready ? [viVoice] : []));
    const listeners: Array<() => void> = [];
    const addEventListenerSpy = vi
      .spyOn(window.speechSynthesis, 'addEventListener')
      .mockImplementation((event: string, handler: any) => {
        if (event === 'voiceschanged') listeners.push(handler);
      });

    const { result } = renderHook(() => useAudioPlayer(), { wrapper });

    act(() => {
      result.current.playAudio({
        poiId: 1,
        title: 'Dinh Độc Lập',
        textToSpeak: 'Di tích lịch sử nổi tiếng.',
        lang: 'vi',
      });
    });

    // Not spoken yet, but still loading while voices populate.
    expect(speakSpy).not.toHaveBeenCalled();
    expect(result.current.playerState).toBe('loading');

    ready = true;
    await act(async () => {
      listeners.forEach((fn) => fn());
      await Promise.resolve();
    });

    expect(speakSpy).toHaveBeenCalledTimes(1);
    const utterance = speakSpy.mock.calls[0]?.[0] as SpeechSynthesisUtterance;
    expect(utterance.voice).toBe(viVoice);

    speakSpy.mockRestore();
    getVoicesSpy.mockRestore();
    addEventListenerSpy.mockRestore();
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

describe('AudioPlayerBar - No Space Hijack / No Arrow or 15s Seek (a11y)', () => {
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

  it('keeps the player landmark non-focusable and does not hijack Space or arrow keys', () => {
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

    // The landmark must not be a tab stop
    expect(playerContainer.tagName).toBe('FOOTER');
    expect(playerContainer).not.toHaveAttribute('tabindex');

    // Space / arrows on the landmark must not toggle playback (native play button owns keyboard)
    fireEvent.keyDown(playerContainer, { code: 'Space' });
    fireEvent.keyDown(playerContainer, { code: 'ArrowLeft' });
    fireEvent.keyDown(playerContainer, { code: 'ArrowRight' });
    expect(onTogglePlay).not.toHaveBeenCalled();
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

describe('Audio Resolution, Voice Selection & Linkage (Tasks 1 to 6)', () => {
  const pois = nearbyPoisData as GeoPoi[];
  const languages: SupportedLanguage[] = ['vi', 'en', 'ja', 'ko'];

  it('(a) for every stop x language, text passed to speak() equals displayed text of the selected layer', () => {
    for (const poi of pois) {
      for (const lang of languages) {
        // 1. Full layer: for vi/en equals full paragraphs joined; for ja/ko equals transcript
        const fullResolution = resolvePlayback(poi, lang, 'full');
        expect(fullResolution.lang).toBe(lang);
        expect(fullResolution.source).toBe('speech');
        expect(fullResolution.text.trim().length).toBeGreaterThan(0);

        const expectedFull = poi.narration?.full?.[lang]?.join(' ') || poi.transcript[lang];
        expect(fullResolution.text).toBe(expectedFull);

        // 2. Short layer: equals narration.short (or transcript fallback)
        const shortResolution = resolvePlayback(poi, lang, 'short');
        expect(shortResolution.lang).toBe(lang);
        expect(shortResolution.source).toBe('speech');
        expect(shortResolution.text.trim().length).toBeGreaterThan(0);

        const expectedShort = poi.narration?.short?.[lang] || poi.transcript[lang];
        expect(shortResolution.text).toBe(expectedShort);
      }
    }
  });

  it('(b) stops without backend audio resolve to speech; a READY audio URL resolves to remote', () => {
    for (const poi of pois) {
      for (const lang of languages) {
        const fullRes = resolvePlayback(poi, lang, 'full');
        expect(fullRes.source).toBe('speech');
        expect(fullRes.url).toBeUndefined();

        const shortRes = resolvePlayback(poi, lang, 'short');
        expect(shortRes.source).toBe('speech');
        expect(shortRes.url).toBeUndefined();
      }
    }

    const remotePoi: GeoPoi = {
      ...pois[0]!,
      audioUrl: '/api/tts/audio/poi_1_vi_ab12cd34.mp3',
      audioStatus: 'READY',
    };
    for (const lang of languages) {
      const remoteRes = resolvePlayback(remotePoi, lang, 'short');
      expect(remoteRes.source).toBe('remote');
      expect(remoteRes.url).toBe('/api/tts/audio/poi_1_vi_ab12cd34.mp3');
    }

    // A non-READY status must never be treated as remote.
    const pendingPoi: GeoPoi = {
      ...pois[0]!,
      audioUrl: '/api/tts/audio/poi_1_vi_ab12cd34.mp3',
      audioStatus: 'PENDING',
    };
    expect(resolvePlayback(pendingPoi, 'vi', 'short').source).toBe('speech');
  });

  it('(c) utterance.lang matches the selected language', () => {
    expect(SPEECH_LANG_MAP.vi).toBe('vi-VN');
    expect(SPEECH_LANG_MAP.en).toBe('en-US');
    expect(SPEECH_LANG_MAP.ja).toBe('ja-JP');
    expect(SPEECH_LANG_MAP.ko).toBe('ko-KR');

    // Matching function verifies exact locale or primary subtag
    const mockVoices = [
      { lang: 'vi-VN', name: 'Voice VI', voiceURI: 'v1' } as SpeechSynthesisVoice,
      { lang: 'en-US', name: 'Voice EN', voiceURI: 'v2' } as SpeechSynthesisVoice,
      { lang: 'ja-JP', name: 'Voice JA', voiceURI: 'v3' } as SpeechSynthesisVoice,
      { lang: 'ko-KR', name: 'Voice KO', voiceURI: 'v4' } as SpeechSynthesisVoice,
    ];

    expect(findMatchingVoice(mockVoices, 'vi-VN')?.lang).toBe('vi-VN');
    expect(findMatchingVoice(mockVoices, 'en-US')?.lang).toBe('en-US');
    expect(findMatchingVoice(mockVoices, 'ja-JP')?.lang).toBe('ja-JP');
    expect(findMatchingVoice(mockVoices, 'ko-KR')?.lang).toBe('ko-KR');
  });

  it('a voice named "Daniel" must not match vi', () => {
    const danielVoices = [
      { lang: 'en-US', name: 'Daniel', voiceURI: 'daniel' } as SpeechSynthesisVoice,
    ];
    expect(findMatchingVoice(danielVoices, 'vi-VN')).toBeNull();
  });

  it('(d) no matching voice shows the no-voice message and does not call speak', async () => {
    // Only English voice is available in system
    const englishOnlyVoices = [
      { lang: 'en-US', name: 'Voice EN', voiceURI: 'en' } as SpeechSynthesisVoice,
    ];
    expect(findMatchingVoice(englishOnlyVoices, 'vi-VN')).toBeNull();

    const speakSpy = vi.fn();
    (window.speechSynthesis as any).speak = speakSpy;
    (window.speechSynthesis as any).getVoices = () => englishOnlyVoices;

    const { result } = renderHook(() =>
      useNearbyAudio({
        pois,
        currentLang: 'vi',
        fallbackNoticeText: () => '',
        autoTriggerNoticeText: () => '',
        getPoiName: (p) => p.name.vi,
      })
    );

    await act(async () => {
      result.current.playPoi('poi-1');
    });

    expect(speakSpy).not.toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playbackStatus).toBe('idle');
    expect(result.current.notice).toBe('Thiết bị chưa có giọng đọc tiếng Việt.');
    expect(result.current.noticeWarn).toBe(true);
  });


  it('empty sync voices waits for async load', async () => {
    const speakSpy = vi.fn();
    (window.speechSynthesis as any).speak = speakSpy;

    const viVoice = { lang: 'vi-VN', name: 'Voice VI', voiceURI: 'vi' } as SpeechSynthesisVoice;
    let syncDone = false;
    const listeners: Array<() => void> = [];

    const addEventListenerSpy = vi
      .spyOn(window.speechSynthesis, 'addEventListener')
      .mockImplementation((event: string, handler: any) => {
        if (event === 'voiceschanged') {
          listeners.push(handler);
        }
      });

    (window.speechSynthesis as any).getVoices = () => {
      if (!syncDone) {
        return [];
      }
      return [viVoice];
    };

    const { result } = renderHook(() =>
      useNearbyAudio({
        pois,
        currentLang: 'vi',
        fallbackNoticeText: () => '',
        autoTriggerNoticeText: () => '',
        getPoiName: (p) => p.name.vi,
      })
    );

    await act(async () => {
      result.current.playPoi('poi-1');
    });

    expect(speakSpy).not.toHaveBeenCalled();

    syncDone = true;
    await act(async () => {
      listeners.forEach((fn) => fn());
    });

    expect(speakSpy).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.playbackStatus).toBe('playing');

    addEventListenerSpy.mockRestore();
  });

  it('(e) rapid clicks A, B, C end with only C speaking', async () => {
    const speakSpy = vi.fn();
    (window.speechSynthesis as any).speak = speakSpy;
    (window.speechSynthesis as any).getVoices = () => [
      { lang: 'vi-VN', name: 'Voice VI', voiceURI: 'vi' } as SpeechSynthesisVoice,
    ];

    const { result } = renderHook(() =>
      useNearbyAudio({
        pois,
        currentLang: 'vi',
        fallbackNoticeText: () => '',
        autoTriggerNoticeText: () => '',
        getPoiName: (p) => p.name.vi,
      })
    );

    await act(async () => {
      result.current.playPoi('poi-1');
      result.current.playPoi('poi-2');
      result.current.playPoi('poi-3');
    });

    // Active stop is C (poi-3)
    expect(result.current.currentId).toBe('poi-3');
    expect(result.current.isPlaying).toBe(true);
    // Spoken text belongs to C (Bưu điện Trung tâm Sài Gòn)
    expect(speakSpy).toHaveBeenCalled();
    const calls = speakSpy.mock.calls;
    const lastCall = calls[calls.length - 1];
    const lastUtterance = lastCall ? (lastCall[0] as SpeechSynthesisUtterance) : null;
    expect(lastUtterance?.text).toContain('Bưu điện Trung tâm');
    expect(lastUtterance?.text).not.toContain('Dinh Độc Lập');
  });

  it('(f) language change stops playback and does not auto-start another stop', async () => {
    const speakSpy = vi.fn();
    const cancelSpy = vi.fn();
    (window.speechSynthesis as any).speak = speakSpy;
    (window.speechSynthesis as any).cancel = cancelSpy;
    (window.speechSynthesis as any).getVoices = () => [
      { lang: 'vi-VN', name: 'Voice VI', voiceURI: 'vi' } as SpeechSynthesisVoice,
      { lang: 'en-US', name: 'Voice EN', voiceURI: 'en' } as SpeechSynthesisVoice,
    ];

    let currentLang: SupportedLanguage = 'vi';
    const { result, rerender } = renderHook(() =>
      useNearbyAudio({
        pois,
        currentLang,
        fallbackNoticeText: () => '',
        autoTriggerNoticeText: () => '',
        getPoiName: (p) => p.name[currentLang] || p.name.vi,
      })
    );

    await act(async () => {
      result.current.playPoi('poi-1');
    });
    expect(result.current.isPlaying).toBe(true);

    speakSpy.mockClear();

    // Change language to English
    currentLang = 'en';
    await act(async () => {
      rerender();
    });

    // Audio cancelled, not playing, and does NOT auto-restart
    expect(cancelSpy).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playbackStatus).toBe('idle');
    expect(speakSpy).not.toHaveBeenCalled();
  });
});

