import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { ToastProvider } from '../context/ToastContext';

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
