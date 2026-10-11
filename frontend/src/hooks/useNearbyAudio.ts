import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SupportedLanguage } from '../types';
import { GeoPoi, getNarration } from '../pages/NearbyPage';

const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ko: 'ko-KR',
  ja: 'ja-JP',
};

export const LANG_DISPLAY_NAMES: Record<SupportedLanguage, Record<SupportedLanguage, string>> = {
  vi: { vi: 'tiếng Việt', en: 'tiếng Anh', ko: 'tiếng Hàn', ja: 'tiếng Nhật' },
  en: { vi: 'Vietnamese', en: 'English', ko: 'Korean', ja: 'Japanese' },
  ko: { vi: '베트남어', en: '영어', ko: '한국어', ja: '일본어' },
  ja: { vi: 'ベトナム語', en: '英語', ko: '韓国語', ja: '日本語' },
};

export interface SentenceRange {
  sentence: string;
  start: number;
  end: number;
}
export type ParsedSentence = SentenceRange;

const HONORIFICS = new Set([
  'st',
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'vs',
  'etc',
  'approx',
  'no',
  'fig',
]);

export function splitTranscriptIntoSentences(text: string): SentenceRange[] {
  if (!text || !text.trim()) return [];

  const result: SentenceRange[] = [];
  const len = text.length;
  let start = 0;
  let i = 0;

  while (i < len) {
    const ch = text[i];
    const isPunct = ch === '.' || ch === '!' || ch === '?' || ch === '。' || ch === '！' || ch === '？';
    const isNewline = ch === '\n';

    if (isPunct || isNewline) {
      let isSplit = true;

      if (ch === '.') {
        const prevChar = i > 0 ? (text[i - 1] ?? '') : '';
        const nextChar = i + 1 < len ? (text[i + 1] ?? '') : '';

        // 1. Decimal check: digit before and digit after (e.g. 1.5 km)
        if (Boolean(prevChar && nextChar && /\d/.test(prevChar) && /\d/.test(nextChar))) {
          isSplit = false;
        }

        // 2. Intra-word / intra-acronym check (e.g. TP.HCM, Q.1, P.5)
        if (isSplit && prevChar && nextChar && /[a-zA-ZÀ-ỹ]/.test(prevChar) && /[a-zA-Z0-9À-ỹ]/.test(nextChar)) {
          isSplit = false;
        }

        // 3. Known title/honorific abbreviations followed by name (e.g. "St. Mary", "Dr. John")
        if (isSplit) {
          let wordStart = i - 1;
          while (wordStart >= 0 && /[a-zA-Z0-9À-ỹ]/.test(text[wordStart] ?? '')) {
            wordStart--;
          }
          const word = text.slice(wordStart + 1, i).toLowerCase();
          if (HONORIFICS.has(word)) {
            const afterPunct = text.slice(i + 1).trimStart();
            if (afterPunct.length > 0) {
              isSplit = false;
            }
          }
        }
      }

      if (isSplit) {
        let end = i + 1;
        while (
          end < len &&
          (text[end] === '.' ||
            text[end] === '!' ||
            text[end] === '?' ||
            text[end] === '"' ||
            text[end] === "'" ||
            text[end] === '”' ||
            text[end] === '’')
        ) {
          end++;
        }
        const sentenceText = text.slice(start, end).trim();
        if (sentenceText) {
          const actualStart = text.indexOf(sentenceText, start);
          const actualEnd = actualStart + sentenceText.length;
          result.push({
            sentence: sentenceText,
            start: actualStart,
            end: actualEnd,
          });
        }
        while (end < len && /\s/.test(text[end] ?? '')) {
          end++;
        }
        start = end;
        i = end;
        continue;
      }
    }
    i++;
  }

  if (start < len) {
    const remaining = text.slice(start).trim();
    if (remaining) {
      const actualStart = text.indexOf(remaining, start);
      result.push({
        sentence: remaining,
        start: actualStart,
        end: actualStart + remaining.length,
      });
    }
  }

  return result;
}

// Backend detail fields used to verify that a TTS response actually belongs to the
// requested stop. The content-service seed does NOT share an id space with the
// frontend Poi data (e.g. backend id 3 = "Chợ Bến Thành" while frontend poi-3 =
// "Bưu điện Trung tâm"), so matching by the numeric id alone can play the wrong stop.
export interface BackendPoiDetailLike {
  code?: string | null;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Maximum degrees of latitude/longitude difference (~55m at Saigon's latitude)
// still considered the same physical stop.
export const BACKEND_POI_COORD_TOLERANCE = 0.0005;

// Diacritic-insensitive, punctuation-insensitive normalization for name comparison
// (e.g. "Bưu điện Trung tâm Sài Gòn" -> "buu dien trung tam sai gon").
export function normalizePoiName(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Decide whether a backend PoiDetail response is verifiably the SAME stop as the
 * frontend Poi. Backend TTS audio is only allowed to replace the correct spoken
 * narration when this returns true (strict multi-signal match):
 *   1. explicit identity: backend `code` equals the frontend id or slug, OR
 *   2. geographic proximity: coordinates within BACKEND_POI_COORD_TOLERANCE, OR
 *   3. canonical name match: backend `name` (always Vietnamese) equals `name.vi`.
 * If none hold we cannot prove identity, so the caller must NOT play the audio.
 */
export function isBackendDetailForPoi(
  detail: BackendPoiDetailLike | null | undefined,
  poi: Pick<GeoPoi, 'id' | 'slug' | 'lat' | 'lng' | 'name'>
): boolean {
  if (!detail) return false;

  const code = (detail.code || '').trim();
  if (code && (code === poi.id || code === poi.slug)) {
    return true;
  }

  const { latitude, longitude } = detail;
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    if (
      Math.abs(latitude - poi.lat) <= BACKEND_POI_COORD_TOLERANCE &&
      Math.abs(longitude - poi.lng) <= BACKEND_POI_COORD_TOLERANCE
    ) {
      return true;
    }
  }

  const backendName = normalizePoiName(detail.name);
  if (backendName && backendName === normalizePoiName(poi.name?.vi)) {
    return true;
  }

  return false;
}

export type AudioSourceType = 'backend' | 'static' | 'speech';
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused';

export const ENABLE_AUDIO_DEBUG = false;

let globalActiveSourceCount = 0;

function logAudioDev(
  action: 'START' | 'STOP' | 'PAUSE' | 'RESUME' | 'DISCARD_STALE',
  details: {
    sourceType?: AudioSourceType | 'none';
    stopId?: string | null;
    lang?: SupportedLanguage;
    trigger?: 'manual' | 'auto' | 'simulation';
    token?: number;
    reason?: string;
  }
) {
  if (!ENABLE_AUDIO_DEBUG) return;
  if (action === 'START') {
    globalActiveSourceCount++;
  } else if (action === 'STOP') {
    globalActiveSourceCount = Math.max(0, globalActiveSourceCount - 1);
  }
  console.log(
    `[Audio DEV] ${action} | source=${details.sourceType || 'none'} | stopId=${details.stopId || 'none'} | lang=${details.lang || 'none'} | trigger=${details.trigger || 'manual'} | token=${details.token ?? '-'} | activeSources=${globalActiveSourceCount}${details.reason ? ` | reason=${details.reason}` : ''}`
  );
}

interface UseNearbyAudioProps {
  pois: GeoPoi[];
  currentLang: SupportedLanguage;
  fallbackNoticeText: (langName: string) => string;
  autoTriggerNoticeText: (poiName: string) => string;
  getPoiName: (poi: GeoPoi) => string;
  onPoiListened?: (poiId: string) => void;
  audioFallbackStaticText?: string;
  audioFallbackSpeechText?: string;
  clickToPlayText?: string;
  cannotResumeText?: string;
}

export function useNearbyAudio({
  pois,
  currentLang,
  fallbackNoticeText,
  autoTriggerNoticeText,
  getPoiName,
  onPoiListened,
  audioFallbackStaticText: _audioFallbackStaticText,
  audioFallbackSpeechText: _audioFallbackSpeechText,
  clickToPlayText,
  cannotResumeText,
}: UseNearbyAudioProps) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [noticeWarn, setNoticeWarn] = useState<boolean>(false);
  const [audioSourceType, setAudioSourceType] = useState<AudioSourceType>('speech');
  const [isHtml5Audio, setIsHtml5Audio] = useState<boolean>(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [sentences, setSentences] = useState<ParsedSentence[]>([]);

  const requestTokenRef = useRef<number>(0);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeSourceTypeRef = useRef<AudioSourceType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevLangRef = useRef<SupportedLanguage>(currentLang);
  const speedRef = useRef<number>(1);
  const sentencesRef = useRef<ParsedSentence[]>([]);
  const currentTextLengthRef = useRef<number>(0);
  const currentFullTextRef = useRef<string>('');
  const lastManualStoppedIdRef = useRef<string | null>(null);
  const lastManualStopTimeRef = useRef<number>(0);
  const onPoiListenedRef = useRef(onPoiListened);

  useEffect(() => {
    onPoiListenedRef.current = onPoiListened;
  }, [onPoiListened]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopAllAudio = useCallback((reason?: string) => {
    // Increment request token so any pending async promise or delayed callback is discarded immediately
    const oldToken = requestTokenRef.current;
    requestTokenRef.current += 1;

    stopTimer();

    if (audioElemRef.current) {
      const a = audioElemRef.current;
      a.onended = null;
      a.onerror = null;
      a.ontimeupdate = null;
      a.onloadedmetadata = null;
      a.pause();
      a.currentTime = 0;
      a.src = '';
      try {
        a.load();
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
    activeUtteranceRef.current = null;

    if (activeSourceTypeRef.current) {
      logAudioDev('STOP', {
        sourceType: activeSourceTypeRef.current,
        token: oldToken,
        reason: reason || 'stopAllAudio',
      });
      activeSourceTypeRef.current = null;
    }

    setPlaybackStatus('idle');
    setIsPlaying(false);
    setIsLoading(false);
    setIsHtml5Audio(false);
    setActiveSentenceIndex(null);
    setCurrentId(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const resolveAudio = useCallback(
    (poi: GeoPoi) => {
      const hasAudioInLang =
        poi.audio[currentLang] !== undefined &&
        poi.audio[currentLang] !== 0 &&
        poi.audio[currentLang] !== '';
      const actualLang: SupportedLanguage = hasAudioInLang ? currentLang : 'vi';
      const shortText = getNarration(poi, currentLang, 'short') || '';

      return {
        hasAudioInLang,
        actualLang,
        actualTxLang: currentLang,
        text: shortText,
      };
    },
    [currentLang]
  );

  // Update sentence highlighting by character proportion
  const updateSentenceHighlight = useCallback(
    (timeVal: number, totalDuration: number) => {
      const sList = sentencesRef.current;
      const tLen = currentTextLengthRef.current;
      if (totalDuration <= 0 || tLen <= 0 || sList.length === 0) {
        setActiveSentenceIndex(null);
        return;
      }
      const charPos = Math.min(tLen, (timeVal / totalDuration) * tLen);
      const idx = sList.findIndex((s) => charPos >= s.start && charPos <= s.end);
      setActiveSentenceIndex(idx !== -1 ? idx : sList.length - 1);
    },
    []
  );

  const checkListenedProgress = useCallback((poiId: string, currentT: number) => {
    if (currentT >= 5) {
      onPoiListenedRef.current?.(poiId);
    }
  }, []);

  const speakText = useCallback(
    (
      text: string,
      langCode: SupportedLanguage,
      playbackRate: number,
      token: number,
      startSentenceOffset: number = 0,
      isFullTextReading: boolean = false
    ) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtteranceRef.current = utterance;
        const targetLocale = SPEECH_LANG_MAP[langCode] || 'vi-VN';
        utterance.lang = targetLocale;
        utterance.rate = playbackRate;

        // Select matching system voice
        const voices = window.speechSynthesis.getVoices?.() || [];
        const langPrefix = targetLocale.split('-')[0]?.toLowerCase() || 'vi';
        const matchedVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(langPrefix)
        );
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onboundary = (e: SpeechSynthesisEvent) => {
          if (token !== requestTokenRef.current) return;
          if (!isFullTextReading) {
            setActiveSentenceIndex(null);
            return;
          }
          if (e.name === 'sentence' || e.name === 'word') {
            const charIdx = e.charIndex;
            const sList = sentencesRef.current;
            if (sList.length > 0) {
              const relIdx = sList
                .slice(startSentenceOffset)
                .findIndex((s) => charIdx >= s.start && charIdx <= s.end);
              if (relIdx !== -1) {
                setActiveSentenceIndex(startSentenceOffset + relIdx);
              }
            }
          }
        };

        utterance.onend = () => {
          if (token !== requestTokenRef.current) return;
          logAudioDev('STOP', { sourceType: 'speech', token, reason: 'utterance_ended' });
          activeSourceTypeRef.current = null;
          stopTimer();
          setPlaybackStatus('idle');
          setIsPlaying(false);
          setActiveSentenceIndex(null);
          setCurrentId(null);
          setCurrentTime(0);
          setDuration(0);
          setNotice('');
          if (currentId) onPoiListenedRef.current?.(currentId);
        };

        utterance.onerror = () => {
          if (token !== requestTokenRef.current) return;
          logAudioDev('STOP', { sourceType: 'speech', token, reason: 'utterance_error' });
          activeSourceTypeRef.current = null;
          stopTimer();
          setPlaybackStatus('idle');
          setIsPlaying(false);
          setActiveSentenceIndex(null);
        };

        logAudioDev('START', {
          sourceType: 'speech',
          lang: langCode,
          token,
          trigger: 'manual',
        });
        activeSourceTypeRef.current = 'speech';
        setAudioSourceType('speech');
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fall back gracefully
      }
    },
    [currentId]
  );

  const playPoi = useCallback(
    (poiId: string, isAuto: boolean = false) => {
      const targetPoi = pois.find((p) => p.id === poiId);
      if (!targetPoi) return;

      // Single Controller: increment token and cancel any active source synchronously
      const token = ++requestTokenRef.current;
      stopAllAudio('new_poi_start');
      requestTokenRef.current = token; // Maintain the active token for this start

      const triggerType = isAuto ? 'auto' : 'manual';
      setCurrentId(poiId);
      setPlaybackStatus('playing');
      setIsPlaying(true);
      setIsLoading(false);
      setCurrentTime(0);

      const res = resolveAudio(targetPoi);

      // Select narration text:
      // manual Play uses the full text (paragraphs joined by a space);
      // auto-narration and simulation triggers use the short text;
      // for ko, ja both use the short text.
      let chosenText = '';
      if (isAuto) {
        chosenText = getNarration(targetPoi, currentLang, 'short') || res.text;
      } else {
        const fullParas = getNarration(targetPoi, currentLang, 'full');
        if (fullParas && fullParas.length > 0) {
          chosenText = fullParas.join(' ');
        } else {
          chosenText = getNarration(targetPoi, currentLang, 'short') || res.text;
        }
      }

      const parsedSentences = splitTranscriptIntoSentences(chosenText);
      sentencesRef.current = parsedSentences;
      setSentences(parsedSentences);
      currentTextLengthRef.current = chosenText.length;
      currentFullTextRef.current = chosenText;

      const estDuration = Math.max(14, Math.round(chosenText.length / 10));
      setDuration(estDuration);
      const hasFullText = Boolean(!isAuto && getNarration(targetPoi, currentLang, 'full')?.length);
      setActiveSentenceIndex(hasFullText && parsedSentences.length > 0 ? 0 : null);

      const targetLangName = LANG_DISPLAY_NAMES[currentLang]?.[currentLang] || currentLang;

      if (isAuto) {
        setNotice(autoTriggerNoticeText(getPoiName(targetPoi)));
        setNoticeWarn(false);
      } else {
        setNotice('');
        setNoticeWarn(false);
      }

      // Synchronously start speech narration (hierarchy fallback).
      // The narration text is always in currentLang (getNarration never falls
      // back across languages), so the voice must match currentLang too — using
      // a per-POI audio-availability flag here would read ja/ko text with a
      // Vietnamese voice.
      setAudioSourceType('speech');
      setIsHtml5Audio(false);
      speakText(chosenText, currentLang, speedRef.current, token, 0, hasFullText);

      stopTimer();
      timerRef.current = setInterval(() => {
        if (token !== requestTokenRef.current) return;
        setCurrentTime((prev) => {
          if (token !== requestTokenRef.current) return prev;
          const next = prev + 0.25 * speedRef.current;
          if (hasFullText) {
            updateSentenceHighlight(next, estDuration);
          } else {
            setActiveSentenceIndex(null);
          }
          checkListenedProgress(poiId, next);
          if (next >= estDuration) {
            stopTimer();
            setPlaybackStatus('idle');
            setIsPlaying(false);
            setActiveSentenceIndex(null);
            setCurrentId(null);
            setCurrentTime(0);
            setDuration(0);
            setNotice('');
            if (poiId) onPoiListenedRef.current?.(poiId);
            return estDuration;
          }
          return next;
        });
      }, 250);

      // Asynchronously query backend TTS (priority 1 in hierarchy)
      const numericId = parseInt(poiId.replace(/\D/g, ''), 10);
      if (!isNaN(numericId) && numericId > 0 && typeof api?.getPoiDetail === 'function') {
        api.getPoiDetail(numericId, currentLang)
          .then((detail) => {
            // Request token validation: discard stale resolved request
            if (token !== requestTokenRef.current) {
              logAudioDev('DISCARD_STALE', {
                stopId: poiId,
                token,
                reason: 'token_mismatch_getPoiDetail',
              });
              return;
            }

            // Identity verification: the backend id space does not match the frontend
            // stop ids, so never replace the correct spoken narration with TTS audio
            // belonging to a different stop. On mismatch, keep the current speech.
            if (!isBackendDetailForPoi(detail, targetPoi)) {
              logAudioDev('DISCARD_STALE', {
                stopId: poiId,
                token,
                reason: `backend_poi_mismatch (code=${detail?.code ?? 'none'}, id=${(detail as any)?.id ?? 'none'})`,
              });
              if (import.meta.env.DEV) {
                console.warn(
                  '[NearbyAudio] Discarded backend TTS: response does not match the requested stop',
                  {
                    requestedStopId: poiId,
                    requestedName: targetPoi.name.vi,
                    backendId: (detail as any)?.id,
                    backendCode: detail?.code,
                    backendName: detail?.name,
                  }
                );
              }
              return;
            }

            const isFallback = Boolean(
              detail?.fallbackLanguage ?? (detail as any)?.isFallbackLanguage
            );

            if (isFallback) {
              setNotice(fallbackNoticeText(targetLangName));
              setNoticeWarn(true);
            }

            if (detail?.audioUrl && detail.audioStatus === 'READY') {
              const fullUrl = api.getAudioUrl(detail.audioUrl);

              // Stop speech synthesis completely before mounting backend audio
              stopTimer();
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                try {
                  window.speechSynthesis.cancel();
                } catch {
                  // Ignore
                }
              }
              activeUtteranceRef.current = null;

              if (audioElemRef.current) {
                const prevAudio = audioElemRef.current;
                prevAudio.onended = null;
                prevAudio.onerror = null;
                prevAudio.ontimeupdate = null;
                prevAudio.pause();
                prevAudio.src = '';
                try {
                  prevAudio.load();
                } catch {
                  // Ignore
                }
                audioElemRef.current = null;
              }

              const audio = new Audio(fullUrl);
              // Assign immediately to audioElemRef so any subsequent stopAllAudio can pause it
              audioElemRef.current = audio;
              audio.playbackRate = speedRef.current;

              audio.onerror = () => {
                if (token !== requestTokenRef.current) return;
                logAudioDev('STOP', { sourceType: 'backend', stopId: poiId, token, reason: 'error' });
                // Fall back to speech synthesis if backend audio fails
                setIsHtml5Audio(false);
                setAudioSourceType('speech');
                speakText(chosenText, currentLang, speedRef.current, token, 0);
              };

              audio.onloadedmetadata = () => {
                if (token !== requestTokenRef.current) return;
                if (audio.duration && !isNaN(audio.duration)) {
                  setDuration(Math.round(audio.duration));
                }
              };

              audio.ontimeupdate = () => {
                if (token !== requestTokenRef.current) return;
                setCurrentTime(audio.currentTime);
                // Highlight rule: sentence highlighting in the reading section runs ONLY when
                // the audio being played is speechSynthesis reading that exact same full text.
                // When backend TTS or static audio is playing, show NO proportional or estimated highlight.
                setActiveSentenceIndex(null);
                checkListenedProgress(poiId, audio.currentTime);
              };

              audio.onended = () => {
                if (token !== requestTokenRef.current) return;
                logAudioDev('STOP', { sourceType: 'backend', stopId: poiId, token, reason: 'ended' });
                activeSourceTypeRef.current = null;
                setPlaybackStatus('idle');
                setIsPlaying(false);
                setActiveSentenceIndex(null);
                setCurrentId(null);
                setCurrentTime(0);
                setDuration(0);
                setNotice('');
                if (poiId) onPoiListenedRef.current?.(poiId);
                audioElemRef.current = null;
              };

              try {
                const playPromise = audio.play();
                if (playPromise && typeof playPromise.then === 'function') {
                  playPromise
                    .then(() => {
                      if (token !== requestTokenRef.current) {
                        audio.pause();
                        audio.src = '';
                        return;
                      }
                      logAudioDev('START', {
                        sourceType: 'backend',
                        stopId: poiId,
                        lang: currentLang,
                        trigger: triggerType,
                        token,
                      });
                      activeSourceTypeRef.current = 'backend';
                      setAudioSourceType('backend');
                      setIsHtml5Audio(true);
                      setPlaybackStatus('playing');
                      setIsPlaying(true);
                    })
                    .catch((err) => {
                      if (token !== requestTokenRef.current) return;
                      if (err?.name === 'NotAllowedError' || err?.message?.includes('NotAllowedError')) {
                        setNotice(clickToPlayText || 'Bấm để phát');
                        setNoticeWarn(true);
                        setPlaybackStatus('idle');
                        setIsPlaying(false);
                      } else {
                        setIsHtml5Audio(false);
                        setAudioSourceType('speech');
                speakText(chosenText, currentLang, speedRef.current, token, 0);
                      }
                    });
                } else {
                  activeSourceTypeRef.current = 'backend';
                  setAudioSourceType('backend');
                  setIsHtml5Audio(true);
                  setPlaybackStatus('playing');
                  setIsPlaying(true);
                }
              } catch {
                if (token !== requestTokenRef.current) return;
                setIsHtml5Audio(false);
                setAudioSourceType('speech');
                speakText(chosenText, currentLang, speedRef.current, token, 0);
              }
            }
          })
          .catch((err) => {
            if (token !== requestTokenRef.current) return;
            if (import.meta.env.DEV) {
              console.log('[NearbyAudio trace] getPoiDetail unavailable:', err?.message);
            }
          });
      }
    },
    [
      pois,
      stopAllAudio,
      currentLang,
      resolveAudio,
      fallbackNoticeText,
      autoTriggerNoticeText,
      getPoiName,
      speakText,
      updateSentenceHighlight,
      checkListenedProgress,
      clickToPlayText,
    ]
  );

  // Synchronize language change: Stop playback cleanly, do not auto-restart
  useEffect(() => {
    if (prevLangRef.current !== currentLang) {
      prevLangRef.current = currentLang;
      stopAllAudio('language_change');
      // The narration text always follows currentLang (getNarration never falls
      // back across languages), so no cross-language notice is warranted here.
      setNotice('');
      setNoticeWarn(false);
    }
  }, [currentLang, stopAllAudio]);

  const togglePlay = useCallback(() => {
    if (!currentId) return;

    if (isPlaying) {
      // Pause action
      logAudioDev('PAUSE', {
        sourceType: audioSourceType,
        stopId: currentId,
        lang: currentLang,
      });
      lastManualStoppedIdRef.current = currentId;
      lastManualStopTimeRef.current = Date.now();
      setPlaybackStatus('paused');
      setIsPlaying(false);
      stopTimer();

      if (audioElemRef.current) {
        audioElemRef.current.pause();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel(); // Cancel to avoid Chrome pause/resume queue issues
        } catch {
          // Ignore
        }
      }
      activeUtteranceRef.current = null;
    } else {
      // Resume action
      if (audioElemRef.current) {
        try {
          const playPromise = audioElemRef.current.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise
              .then(() => {
                setPlaybackStatus('playing');
                setIsPlaying(true);
              })
              .catch((err) => {
                if (err?.name === 'NotAllowedError' || err?.message?.includes('NotAllowedError')) {
                  setNotice(clickToPlayText || 'Bấm để phát');
                  setNoticeWarn(true);
                } else {
                  setNotice(cannotResumeText || 'Không thể phát tiếp âm thanh.');
                  setNoticeWarn(true);
                }
                setPlaybackStatus('paused');
                setIsPlaying(false);
              });
          } else {
            setPlaybackStatus('playing');
            setIsPlaying(true);
          }
        } catch {
          setNotice(cannotResumeText || 'Không thể phát tiếp âm thanh.');
          setNoticeWarn(true);
          setPlaybackStatus('paused');
          setIsPlaying(false);
        }
      } else if (currentTime >= duration) {
        playPoi(currentId, false);
      } else {
        // Resume speech synthesis cleanly from the active sentence
        setPlaybackStatus('playing');
        setIsPlaying(true);
        const resumeToken = ++requestTokenRef.current;
        const currentSentenceIdx = activeSentenceIndex ?? 0;
        const remainingSentences = sentencesRef.current.slice(currentSentenceIdx);
        const remainingText =
          remainingSentences.map((s) => s.sentence).join(' ') || currentFullTextRef.current;
        const targetPoi = pois.find((p) => p.id === currentId);
        const hasFullText = Boolean(targetPoi && getNarration(targetPoi, currentLang, 'full')?.length);

        speakText(
          remainingText,
          currentLang,
          speedRef.current,
          resumeToken,
          currentSentenceIdx,
          hasFullText
        );

        stopTimer();
        timerRef.current = setInterval(() => {
          if (resumeToken !== requestTokenRef.current) return;
          setCurrentTime((prev) => {
            if (resumeToken !== requestTokenRef.current) return prev;
            const next = prev + 0.25 * speedRef.current;
            if (hasFullText) {
              updateSentenceHighlight(next, duration);
            } else {
              setActiveSentenceIndex(null);
            }
            checkListenedProgress(currentId, next);
            if (next >= duration) {
              stopTimer();
              setPlaybackStatus('idle');
              setIsPlaying(false);
              setActiveSentenceIndex(null);
              setCurrentId(null);
              setCurrentTime(0);
              setDuration(0);
              setNotice('');
              if (currentId) onPoiListenedRef.current?.(currentId);
              return duration;
            }
            return next;
          });
        }, 250);
      }
    }
  }, [
    currentId,
    isPlaying,
    currentTime,
    duration,
    playPoi,
    updateSentenceHighlight,
    audioSourceType,
    currentLang,
    speakText,
    checkListenedProgress,
    clickToPlayText,
    cannotResumeText,
    activeSentenceIndex,
  ]);

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      speedRef.current = newSpeed;
      if (audioElemRef.current) {
        audioElemRef.current.playbackRate = newSpeed;
      }
    },
    []
  );

  const seekTime = useCallback(
    (newTime: number) => {
      // Seek is only supported for HTML5 audio
      if (!isHtml5Audio) return;
      const targetTime = Math.max(0, Math.min(duration, newTime));
      setCurrentTime(targetTime);
      if (audioElemRef.current) {
        audioElemRef.current.currentTime = targetTime;
        updateSentenceHighlight(targetTime, duration);
      }
    },
    [isHtml5Audio, duration, updateSentenceHighlight]
  );

  const seekRelative = useCallback(
    (offsetSeconds: number) => {
      if (!isHtml5Audio) return;
      seekTime(currentTime + offsetSeconds);
    },
    [isHtml5Audio, currentTime, seekTime]
  );

  // Clean up on unmount or route change
  useEffect(() => {
    return () => {
      stopAllAudio('unmount');
    };
  }, [stopAllAudio]);

  return {
    currentId,
    setCurrentId,
    playbackStatus,
    isLoading,
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
    audioSourceType,
    isHtml5Audio,
    activeSentenceIndex,
    sentences,
    resolveAudio,
    playPoi,
    togglePlay,
    changeSpeed,
    seekTime,
    seekRelative,
    stopAllAudio,
    lastManualStoppedId: lastManualStoppedIdRef.current,
    lastManualStopTime: lastManualStopTimeRef.current,
  };
}
