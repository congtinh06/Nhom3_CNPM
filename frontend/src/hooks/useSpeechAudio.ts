import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechAudioReturn {
  activeId: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  toggleSpeech: (articleId: string, textToSpeak: string) => void;
  stopSpeech: () => void;
}

/**
 * Global singleton reference so that only one article speaks at a time across the entire site.
 */
let globalSpeakingId: string | null = null;
let globalSpeakingCallback: (() => void) | null = null;

export function useSpeechAudio(): UseSpeechAudioReturn {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveId(null);
    setIsPlaying(false);
    setIsPaused(false);
    globalSpeakingId = null;
  }, []);

  const toggleSpeech = useCallback((articleId: string, textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const synth = window.speechSynthesis;

    // 1. If currently playing this same article
    if (activeId === articleId) {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        setIsPaused(true);
        setIsPlaying(false);
        return;
      }
      if (synth.paused) {
        synth.resume();
        setIsPaused(false);
        setIsPlaying(true);
        return;
      }
    }

    // 2. If speaking something else or starting fresh, stop previous
    if (globalSpeakingCallback) {
      globalSpeakingCallback();
    }
    synth.cancel();

    // Clean plain text
    const cleanText = textToSpeak.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'vi-VN';
    utter.rate = 0.95; // Slightly slower for clear narration
    utter.pitch = 1.0;

    // Pick Vietnamese voice if available
    const voices = synth.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VI'));
    if (viVoice) {
      utter.voice = viVoice;
    }

    utter.onstart = () => {
      setActiveId(articleId);
      setIsPlaying(true);
      setIsPaused(false);
      globalSpeakingId = articleId;
    };

    utter.onend = () => {
      setActiveId(null);
      setIsPlaying(false);
      setIsPaused(false);
      if (globalSpeakingId === articleId) {
        globalSpeakingId = null;
      }
    };

    utter.onerror = () => {
      setActiveId(null);
      setIsPlaying(false);
      setIsPaused(false);
      if (globalSpeakingId === articleId) {
        globalSpeakingId = null;
      }
    };

    utteranceRef.current = utter;
    globalSpeakingCallback = () => {
      setActiveId(null);
      setIsPlaying(false);
      setIsPaused(false);
    };

    synth.speak(utter);
  }, [activeId]);

  useEffect(() => {
    return () => {
      // Do not cancel on small re-renders unless unmounting speaking instance
      if (utteranceRef.current && globalSpeakingId === activeId) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
    };
  }, [activeId]);

  return {
    activeId,
    isPlaying,
    isPaused,
    toggleSpeech,
    stopSpeech,
  };
}
