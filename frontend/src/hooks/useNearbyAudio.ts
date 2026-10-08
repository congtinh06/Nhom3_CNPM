import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SupportedLanguage } from '../types';
import { GeoPoi } from '../pages/NearbyPage';

const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

export const LANG_DISPLAY_NAMES: Record<SupportedLanguage, Record<SupportedLanguage, string>> = {
  vi: { vi: 'tiếng Việt', en: 'tiếng Anh', ko: 'tiếng Hàn', ja: 'tiếng Nhật', zh: 'tiếng Trung' },
  en: { vi: 'Vietnamese', en: 'English', ko: 'Korean', ja: 'Japanese', zh: 'Chinese' },
  ko: { vi: '베트남어', en: '영어', ko: '한국어', ja: '일본어', zh: '중국어' },
  ja: { vi: 'ベトナム語', en: '英語', ko: '韓国語', ja: '日本語', zh: '中国語' },
  zh: { vi: '越南语', en: '英语', ko: '韩语', ja: '日语', zh: '中文' },
};

interface UseNearbyAudioProps {
  pois: GeoPoi[];
  currentLang: SupportedLanguage;
  fallbackNoticeText: (langName: string) => string;
  autoTriggerNoticeText: (poiName: string) => string;
  getPoiName: (poi: GeoPoi) => string;
}

export function useNearbyAudio({
  pois,
  currentLang,
  fallbackNoticeText,
  autoTriggerNoticeText,
  getPoiName,
}: UseNearbyAudioProps) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [noticeWarn, setNoticeWarn] = useState<boolean>(false);

  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLangRef = useRef<SupportedLanguage>(currentLang);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopAllAudio = useCallback(() => {
    stopTimer();
    if (audioElemRef.current) {
      audioElemRef.current.pause();
      audioElemRef.current.currentTime = 0;
      audioElemRef.current.src = '';
      try {
        audioElemRef.current.load();
      } catch {
        // Ignore load error during reset
      }
      audioElemRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    setIsPlaying(false);
  }, []);

  const resolveAudio = useCallback(
    (poi: GeoPoi) => {
      const hasAudioInLang =
        poi.audio[currentLang] !== undefined &&
        poi.audio[currentLang] !== 0 &&
        poi.audio[currentLang] !== '';
      const actualLang: SupportedLanguage = hasAudioInLang ? currentLang : 'vi';
      const hasTxInLang = Boolean(poi.transcript[currentLang]);
      const actualTxLang: SupportedLanguage = hasTxInLang ? currentLang : 'vi';
      const text = poi.transcript[actualTxLang] || poi.transcript.vi || '';

      return {
        hasAudioInLang,
        actualLang,
        actualTxLang,
        text,
      };
    },
    [currentLang]
  );

  const speakText = useCallback(
    (text: string, langCode: SupportedLanguage, playbackRate: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLocale = SPEECH_LANG_MAP[langCode] || 'vi-VN';
        utterance.lang = targetLocale;
        utterance.rate = playbackRate;

        // Select matching system voice so browser does not fall back to default English voice
        const voices = window.speechSynthesis.getVoices?.() || [];
        const langPrefix = targetLocale.split('-')[0]?.toLowerCase() || 'vi';
        const matchedVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(langPrefix)
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onend = () => {
          stopTimer();
          setIsPlaying(false);
          setCurrentTime((prev) => prev);
        };

        utterance.onerror = () => {
          stopTimer();
          setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore speech synthesis failures
      }
    },
    []
  );

  const playPoi = useCallback(
    (poiId: string, isAuto: boolean = false) => {
      const targetPoi = pois.find((p) => p.id === poiId);
      if (!targetPoi) return;

      stopAllAudio();

      const res = resolveAudio(targetPoi);
      const estDuration = Math.max(14, Math.round(res.text.length / 10));

      setCurrentId(poiId);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(estDuration);

      const targetLangName = LANG_DISPLAY_NAMES[currentLang]?.[currentLang] || currentLang;

      if (!res.hasAudioInLang) {
        setNotice(fallbackNoticeText(targetLangName));
        setNoticeWarn(true);
      } else if (isAuto) {
        setNotice(autoTriggerNoticeText(getPoiName(targetPoi)));
        setNoticeWarn(false);
      } else {
        setNotice('');
        setNoticeWarn(false);
      }

      // Synchronously trigger speech synthesis with matching voice
      speakText(res.text, res.actualLang, speed);

      stopTimer();
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.25 * speed;
          if (next >= estDuration) {
            stopTimer();
            setIsPlaying(false);
            setNotice('');
            return estDuration;
          }
          return next;
        });
      }, 250);

      // Asynchronously check backend for audio file if API is reachable
      const numericId = parseInt(poiId.replace(/\D/g, ''), 10);
      if (!isNaN(numericId) && numericId > 0 && typeof api?.getPoiDetail === 'function') {
        api.getPoiDetail(numericId, currentLang)
          .then((detail) => {
            const isFallback = Boolean(
              detail?.fallbackLanguage ?? (detail as any)?.isFallbackLanguage
            );
            console.log('[NearbyAudio trace]', {
              poiId,
              lang: currentLang,
              audioUrl: detail?.audioUrl,
              audioStatus: detail?.audioStatus,
              isFallbackLanguage: isFallback,
            });

            if (isFallback) {
              setNotice(fallbackNoticeText(targetLangName));
              setNoticeWarn(true);
            }

            if (detail?.audioUrl && detail.audioStatus === 'READY') {
              const fullUrl = api.getAudioUrl(detail.audioUrl);
              console.log('[NearbyAudio BE ready]', { fullUrl });

              // Stop speech synthesis and reset current audio
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              if (audioElemRef.current) {
                audioElemRef.current.pause();
                audioElemRef.current.src = '';
                try {
                  audioElemRef.current.load();
                } catch {
                  // Ignore
                }
                audioElemRef.current = null;
              }

              const audio = new Audio(fullUrl);
              audio.playbackRate = speed;

              audio.onloadedmetadata = () => {
                if (audio.duration && !isNaN(audio.duration)) {
                  setDuration(Math.round(audio.duration));
                }
              };

              audio.ontimeupdate = () => {
                setCurrentTime(audio.currentTime);
              };

              audio.onended = () => {
                setIsPlaying(false);
                setNotice('');
                audioElemRef.current = null;
              };

              audio.play()
                .then(() => {
                  stopTimer();
                  audioElemRef.current = audio;
                })
                .catch((err) => {
                  console.warn('[NearbyAudio play blocked]', err);
                  if (isAuto) {
                    setNotice('Trình duyệt đã chặn tự phát âm thanh. Vui lòng bấm nút "Nghe" để bắt đầu.');
                    setNoticeWarn(true);
                  }
                });
            }
          })
          .catch((err) => {
            console.log('[NearbyAudio trace] getPoiDetail unavailable or failed:', err?.message);
          });
      }
    },
    [
      pois,
      stopAllAudio,
      currentLang,
      resolveAudio,
      speed,
      fallbackNoticeText,
      autoTriggerNoticeText,
      getPoiName,
      speakText,
    ]
  );

  // Synchronize language change: stop current audio, reset src, re-trigger if playing
  useEffect(() => {
    if (prevLangRef.current !== currentLang) {
      prevLangRef.current = currentLang;
      stopAllAudio();
      if (currentId) {
        const activePoi = pois.find((p) => p.id === currentId);
        if (activePoi) {
          const res = resolveAudio(activePoi);
          const langName = LANG_DISPLAY_NAMES[currentLang]?.[currentLang] || currentLang;
          if (!res.hasAudioInLang) {
            setNotice(fallbackNoticeText(langName));
            setNoticeWarn(true);
          } else {
            setNotice('');
            setNoticeWarn(false);
          }
          if (isPlaying) {
            playPoi(currentId, false);
          }
        }
      }
    }
  }, [currentLang, currentId, pois, resolveAudio, fallbackNoticeText, isPlaying, playPoi, stopAllAudio]);

  const togglePlay = useCallback(() => {
    if (!currentId) return;

    if (isPlaying) {
      setIsPlaying(false);
      stopTimer();
      if (audioElemRef.current) {
        audioElemRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.pause();
        } catch {
          // Ignore
        }
      }
    } else {
      if (audioElemRef.current) {
        audioElemRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            setNotice('Không thể phát tiếp âm thanh.');
          });
      } else if (currentTime >= duration) {
        playPoi(currentId, false);
      } else {
        setIsPlaying(true);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.resume();
          } catch {
            // Ignore
          }
        }
        stopTimer();
        timerRef.current = setInterval(() => {
          setCurrentTime((prev) => {
            const next = prev + 0.25 * speed;
            if (next >= duration) {
              stopTimer();
              setIsPlaying(false);
              setNotice('');
              return duration;
            }
            return next;
          });
        }, 250);
      }
    }
  }, [currentId, isPlaying, currentTime, duration, playPoi, speed]);

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      if (audioElemRef.current) {
        audioElemRef.current.playbackRate = newSpeed;
      }
      if (isPlaying && currentId) {
        playPoi(currentId, false);
      }
    },
    [isPlaying, currentId, playPoi]
  );

  const seekTime = useCallback(
    (newTime: number) => {
      setCurrentTime(newTime);
      if (audioElemRef.current) {
        audioElemRef.current.currentTime = newTime;
      } else if (currentId && isPlaying) {
        playPoi(currentId, false);
      }
    },
    [currentId, isPlaying, playPoi]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  return {
    currentId,
    setCurrentId,
    isPlaying,
    currentTime,
    duration,
    speed,
    showTranscript,
    setShowTranscript,
    notice,
    setNotice,
    noticeWarn,
    setNoticeWarn,
    resolveAudio,
    playPoi,
    togglePlay,
    changeSpeed,
    seekTime,
    stopAllAudio,
  };
}
