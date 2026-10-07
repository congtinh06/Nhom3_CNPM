import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'error';

interface PlayParams {
  poiId: number;
  audioUrl?: string | null;
  audioStatus?: string;
  title: string;
  textToSpeak?: string;
  lang: string;
}

const getSessionId = (): string => {
  try {
    let sid = sessionStorage.getItem('sv:session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      sessionStorage.setItem('sv:session_id', sid);
    }
    return sid;
  } catch {
    return 'sid_default';
  }
};

export const useAudioPlayer = () => {
  const { showToast } = useToast();
  const [playingPoiId, setPlayingPoiId] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rateLimitedUntilRef = useRef<number>(0);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingPoiId(null);
    setPlayerState('idle');
  }, []);

  const fireAnalytics = useCallback((poiId: number, lang: string) => {
    const now = Date.now();
    if (now < rateLimitedUntilRef.current) {
      return;
    }

    const validLang = ['vi', 'en', 'ja', 'ko'].includes(lang) ? lang : 'vi';

    api.recordAnalyticsEvent({
      eventType: 'AUDIO_PLAY',
      poiId,
      languageCode: validLang,
      triggerType: 'MANUAL',
      sessionId: getSessionId(),
    }).catch((err: unknown) => {
      const status = (err as { response?: { status?: number; headers?: Record<string, string> } })?.response?.status;
      if (status === 429) {
        rateLimitedUntilRef.current = Date.now() + 60000;
      }
    });
  }, []);

  const playAudio = useCallback(
    ({ poiId, audioUrl, audioStatus, title, textToSpeak, lang }: PlayParams) => {
      if (playingPoiId === poiId) {
        stopAudio();
        return;
      }

      stopAudio();

      const hasBackendAudio = Boolean(audioUrl && audioStatus === 'READY');

      if (hasBackendAudio && audioUrl) {
        setPlayerState('loading');
        setPlayingPoiId(poiId);

        const fullAudioUrl = api.getAudioUrl(audioUrl);
        const audio = new Audio(fullAudioUrl);
        audioRef.current = audio;

        audio.oncanplay = () => {
          if (audioRef.current === audio) {
            setPlayerState('playing');
          }
        };

        audio.onended = () => {
          if (audioRef.current === audio) {
            stopAudio();
          }
        };

        audio.onerror = () => {
          if (audioRef.current === audio) {
            stopAudio();
            showToast('Không phát được thuyết minh.');
          }
        };

        audio.play().then(() => {
          fireAnalytics(poiId, lang);
        }).catch(() => {
          if (audioRef.current === audio) {
            stopAudio();
            showToast('Không phát được thuyết minh.');
          }
        });
        return;
      }

      if (lang === 'vi') {
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
          showToast('Trình duyệt chưa hỗ trợ đọc thuyết minh.');
          return;
        }

        const synthesis = window.speechSynthesis;
        synthesis.cancel();

        const speechText = textToSpeak ? `${title}. ${textToSpeak}` : title;
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;

        const voices = synthesis.getVoices();
        const viVoice = voices.find((v) => /^vi/i.test(v.lang));
        if (viVoice) {
          utterance.voice = viVoice;
        } else if (voices.length > 0) {
          showToast('Thiết bị chưa có giọng đọc tiếng Việt, giọng đọc có thể không chuẩn.');
        }

        utterance.onstart = () => {
          setPlayerState('playing');
          setPlayingPoiId(poiId);
          fireAnalytics(poiId, lang);
        };

        utterance.onend = () => {
          stopAudio();
        };

        utterance.onerror = () => {
          stopAudio();
        };

        synthesis.speak(utterance);
        return;
      }

      showToast('Bản dịch âm thanh cho ngôn ngữ này chưa sẵn sàng.');
    },
    [playingPoiId, stopAudio, showToast, fireAnalytics]
  );

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    playingPoiId,
    playerState,
    playAudio,
    stopAudio,
    isPlaying: (poiId: number) => playingPoiId === poiId,
  };
};
