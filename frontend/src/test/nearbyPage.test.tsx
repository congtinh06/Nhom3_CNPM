import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NearbyPage } from '../pages/NearbyPage';
import { setStoredLanguage } from '../content/languages';

// Mock react-leaflet components since jsdom doesn't support canvas/WebGL
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="leaflet-tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="leaflet-popup">{children}</div>
  ),
  Circle: () => <div data-testid="leaflet-circle" />,
  Polyline: () => <div data-testid="leaflet-polyline" />,
  useMap: () => ({
    invalidateSize: vi.fn(),
    fitBounds: vi.fn(),
    panTo: vi.fn(),
  }),
}));

describe('NearbyPage - Clean Multilingual & Audio Narration Integration', () => {
  beforeEach(() => {
    localStorage.clear();
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
      getVoices: vi.fn(() => []),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as SpeechSynthesis;
  });

  it('renders default Vietnamese interface with 5 Saigon heritage POIs', () => {
    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Điểm du lịch Sài Gòn')).toBeInTheDocument();
    expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
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

    // Switch language to English via the language selector
    const langSelect = screen.getByLabelText('Ngôn ngữ') as HTMLSelectElement;
    act(() => {
      fireEvent.change(langSelect, { target: { value: 'en' } });
    });

    // Check English translations
    expect(screen.getByText('Saigon Attractions')).toBeInTheDocument();
    expect(screen.getByText('Independence Palace')).toBeInTheDocument();
    expect(screen.getByText('Notre Dame Cathedral of Saigon')).toBeInTheDocument();
    expect(screen.getByText('Saigon Central Post Office')).toBeInTheDocument();
    expect(screen.getByText('Ben Thanh Market')).toBeInTheDocument();
    expect(screen.getByText('War Remnants Museum')).toBeInTheDocument();

    // Click Listen on the first POI (Independence Palace)
    const listenButtons = screen.getAllByRole('button', { name: /▶ Listen/i });
    act(() => {
      fireEvent.click(listenButtons[0]!);
    });

    // Verify speech synthesis spoke English text with en-US
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const calls = (window.speechSynthesis.speak as any).mock.calls;
    const utterance = calls[calls.length - 1][0] as SpeechSynthesisUtterance;
    expect(utterance.lang).toBe('en-US');
    expect(utterance.text).toContain('The Independence Palace is a landmark national monument');
  });

  it('handles language fallback when a POI lacks voice audio in a target language', () => {
    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Switch language to Korean
    const langSelect = screen.getByLabelText('Ngôn ngữ') as HTMLSelectElement;
    act(() => {
      fireEvent.change(langSelect, { target: { value: 'ko' } });
    });

    // POI 2 (Notre Dame Cathedral) has audio.ko = 0/empty
    const listenButtons = screen.getAllByRole('button', { name: /▶ 듣기/i });
    act(() => {
      fireEvent.click(listenButtons[1]!); // Notre Dame Cathedral
    });

    // Verify fallback notice is displayed in the audio player
    expect(
      screen.getByText(/이 명소는 한국어 음성이 지원되지 않아 베트남어로 재생됩니다/i)
    ).toBeInTheDocument();
  });

  it('triggers auto narration simulation when coordinates match a POI radius', () => {
    render(
      <BrowserRouter>
        <NearbyPage />
      </BrowserRouter>
    );

    // Enable auto-narration switch
    const autoSwitch = screen.getByRole('switch');
    act(() => {
      fireEvent.click(autoSwitch);
    });

    // Click preset chip right near Independence Palace (≈10 m)
    const presetBtn = screen.getByText('Sát Dinh Độc Lập (≈10 m)');
    act(() => {
      fireEvent.click(presetBtn);
    });

    // Check that auto narration triggered playback for Independence Palace
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(
      screen.getByText(/Bạn đã tới gần Dinh Độc Lập, tự động phát thuyết minh/i)
    ).toBeInTheDocument();
  });
});
