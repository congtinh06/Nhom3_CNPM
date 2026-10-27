import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { getSharedAudio } from '../lib/audioUnlock';
import { getAnalyticsSessionId } from '../lib/analytics';
import { detectDeviceType } from '../lib/device';
import { useToast } from '../context/ToastContext';
import { SupportedLanguage, TriggerType } from '../types';
import {
  findMatchingVoice,
  getAvailableVoices,
  NO_VOICE_MESSAGES,
  SPEECH_LANG_MAP,
} from './useNearbyAudio';

export type PlayerState = 'idle' | 'loading' | 'playing' | 'error';

// How long to wait for the browser to populate its speech voices before deciding
// that a voice for the requested language is genuinely unavailable.
const SPEECH_VOICE_WAIT_MS = 1500;

// Speech synthesis is only offered for the languages the caller opts into.
// Defaults to Vietnamese only, which is the historical behaviour for the map /
// places section where the spoken text is always Vietnamese.
const DEFAULT_SPEECH_LANGS: SupportedLanguage[] = ['vi'];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  value === 'vi' || value === 'en' || value === 'ja' || value === 'ko';

interface PlayParams {
  poiId: number;
  audioUrl?: string | null;
  audioStatus?: string;
  title: string;
  textToSpeak?: string;
  lang: string;
  speechLangs?: SupportedLanguage[];
  triggerType?: TriggerType;
}

export const useAudioPlayer = () => {
  const { showToast } = useToast();
  const [playingPoiId, setPlayingPoiId] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const rateLimitedUntilRef = useRef<number>(0);
  const playTokenRef = useRef<number>(0);

  const stopAudio = useCallback(() => {
    // Invalidate any pending async speech resolution (e.g. waiting for voices).
    playTokenRef.current += 1;
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.oncanplay = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingPoiId(null);
    setPlayerState('idle');
  }, []);

  const fireAnalytics = useCallback(
    (poiId: number, lang: string, triggerType: TriggerType = 'MANUAL', completed = false) => {
      const now = Date.now();
      if (now < rateLimitedUntilRef.current) {
        return;
      }

      const validLang = ['vi', 'en', 'ja', 'ko'].includes(lang) ? lang : 'vi';

      api.recordAnalyticsEvent({
        eventType: 'AUDIO_PLAY',
        poiId,
        languageCode: validLang,
        triggerType,
        completed,
        deviceType: detectDeviceType(),
        sessionId: getAnalyticsSessionId(),
      }).catch((err: unknown) => {
        const status = (err as { response?: { status?: number; headers?: Record<string, string> } })?.response?.status;
        if (status === 429) {
          rateLimitedUntilRef.current = Date.now() + 60000;
        }
      });
    },
    []
  );

  const playAudio = useCallback(
    ({
      poiId,
      audioUrl,
      audioStatus,
      title,
      textToSpeak,
      lang,
      speechLangs,
      triggerType = 'MANUAL',
    }: PlayParams) => {
      if (playingPoiId === poiId) {
        stopAudio();
        return;
      }

      stopAudio();

      const hasBackendAudio = Boolean(audioUrl && audioStatus === 'READY');

      if (hasBackendAudio && audioUrl) {
        setPlayerState('loading');
        setPlayingPoiId(poiId);

        const token = playTokenRef.current;
        const loadAndPlay = async () => {
          try {
            const blob = await api.getAudioBlob(audioUrl);
            if (token !== playTokenRef.current) return;

            const objectUrl = URL.createObjectURL(blob);
            if (token !== playTokenRef.current) {
              URL.revokeObjectURL(objectUrl);
              return;
            }

            objectUrlRef.current = objectUrl;
            const audio = getSharedAudio();
            audio.src = objectUrl;
            audio.playbackRate = 1;
            audio.currentTime = 0;
            audioRef.current = audio;

            audio.oncanplay = () => {
              if (audioRef.current === audio) {
                setPlayerState('playing');
              }
            };

            audio.onended = () => {
              if (audioRef.current === audio && token === playTokenRef.current) {
                fireAnalytics(poiId, lang, triggerType, true);
                stopAudio();
              }
            };

            audio.onerror = () => {
              console.warn('[useAudioPlayer] audio element failed to load or play', audio.error);
              if (audioRef.current === audio) {
                stopAudio();
                showToast('Không phát được thuyết minh.');
              }
            };

            await audio.play();
            if (token !== playTokenRef.current) return;
            fireAnalytics(poiId, lang, triggerType);
          } catch (err) {
            console.warn('[useAudioPlayer] authenticated audio load or play failed', err);
            if (token === playTokenRef.current) {
              stopAudio();
              showToast('Không phát được thuyết minh.');
            }
          }
        };

        void loadAndPlay();
        return;
      }

      const allowedSpeechLangs = speechLangs ?? DEFAULT_SPEECH_LANGS;
      const speechLang =
        isSupportedLanguage(lang) && allowedSpeechLangs.includes(lang) ? lang : null;

      if (speechLang) {
        if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
          showToast('Trình duyệt chưa hỗ trợ đọc thuyết minh.');
          return;
        }

        const synthesis = window.speechSynthesis;
        synthesis.cancel();

        // Capture a token so a language change / stop during the async voice wait
        // cannot start a stale utterance.
        const token = playTokenRef.current;
        const speechText = textToSpeak ? `${title}. ${textToSpeak}` : title;
        const targetLocale = SPEECH_LANG_MAP[speechLang];
        const noVoiceMessage = NO_VOICE_MESSAGES[speechLang] || NO_VOICE_MESSAGES.vi;

        setPlayerState('loading');
        setPlayingPoiId(poiId);

        const speakWithMatchedVoice = (voices: SpeechSynthesisVoice[]) => {
          if (token !== playTokenRef.current) return;

          const matchedVoice = findMatchingVoice(voices, targetLocale);
          if (!matchedVoice) {
            // Never fall back to an unrelated/default voice for this language.
            stopAudio();
            showToast(noVoiceMessage);
            return;
          }

          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = targetLocale;
          utterance.voice = matchedVoice;
          utterance.rate = 0.95;

          utterance.onstart = () => {
            if (token !== playTokenRef.current) return;
            setPlayerState('playing');
            setPlayingPoiId(poiId);
            fireAnalytics(poiId, speechLang, triggerType);
          };

          utterance.onend = () => {
            if (token !== playTokenRef.current) return;
            fireAnalytics(poiId, speechLang, triggerType, true);
            stopAudio();
          };

          utterance.onerror = (event) => {
            console.warn('[useAudioPlayer] speech synthesis failed', event.error);
            if (token !== playTokenRef.current) return;
            stopAudio();
          };

          synthesis.speak(utterance);
        };

        // Voices are often populated asynchronously; wait briefly for voiceschanged
        // before giving up so we do not falsely report a missing voice.
        const syncVoices = synthesis.getVoices?.() ?? [];
        if (syncVoices.length > 0) {
          speakWithMatchedVoice(syncVoices);
        } else {
          getAvailableVoices(SPEECH_VOICE_WAIT_MS).then(speakWithMatchedVoice);
        }
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
