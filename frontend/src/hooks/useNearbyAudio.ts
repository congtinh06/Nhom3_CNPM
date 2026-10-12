import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SupportedLanguage } from '../types';
import { GeoPoi, getNarration, NarrationLayer } from '../pages/NearbyPage';

/**
 * Feature flag: while false, remote audio (backend TTS and static ambient files)
 * is never used; playback is always speechSynthesis reading the exact frontend narration text.
 * NOTE: This may only be enabled when the backend seeds the same 5 POIs with the same text.
 */
export const ENABLE_REMOTE_AUDIO = false;

export const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

export const NO_VOICE_MESSAGES: Record<SupportedLanguage, string> = {
  vi: 'Thiết bị chưa có giọng đọc tiếng Việt.',
  en: 'No English voice found on this device.',
  ja: 'このデバイスには日本語の音声がありません。',
  ko: '이 기기에는 한국어 음성이 지원되지 않습니다.',
};

export interface PlaybackResolution {
  source: 'speech' | 'backend' | 'static';
  url?: string;
  text: string;
  lang: SupportedLanguage;
}

/**
 * Single source of truth for audio playback resolution.
 * Text comes ONLY from the FE data for that exact stop and language:
 *   - vi/en short: poi.narration.short[lang] ?? poi.transcript[lang]
 *   - vi/en full:  poi.narration.full[lang] (joined by a space)
 *   - ja/ko:       poi.transcript[lang] (full does not exist in seed, uses transcript)
 * Strictly NO cross-language fallback, NO cross-stop data.
 */
export function resolvePlayback(
  poi: GeoPoi,
  lang: SupportedLanguage,
  layer: NarrationLayer = 'full'
): PlaybackResolution {
  let text = '';
  if (layer === 'full') {
    const fullParas = poi.narration?.full?.[lang];
    if (fullParas && fullParas.length > 0) {
      text = fullParas.join(' ');
    } else {
      text = poi.narration?.short?.[lang] || poi.transcript?.[lang] || '';
    }
  } else {
    text = poi.narration?.short?.[lang] || poi.transcript?.[lang] || '';
  }

  // When remote audio is disabled, playback is strictly speechSynthesis reading exact FE text
  if (!ENABLE_REMOTE_AUDIO) {
    return {
      source: 'speech',
      text,
      lang,
    };
  }

  // Preserved remote audio path (only active if ENABLE_REMOTE_AUDIO is true)
  // May only be enabled when the backend seeds the same 5 POIs with the same text.
  const staticUrl = poi.audio?.[lang];
  if (typeof staticUrl === 'string' && staticUrl.trim()) {
    return {
      source: 'static',
      url: staticUrl,
      text,
      lang,
    };
  }

  return {
    source: 'speech',
    text,
    lang,
  };
}

export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }
  const synth = window.speechSynthesis;
  const current = synth.getVoices?.() || [];
  if (current.length > 0) {
    return Promise.resolve(current);
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener?.('voiceschanged', finish);
      resolve(synth.getVoices?.() || []);
    };
    synth.addEventListener?.('voiceschanged', finish);
    setTimeout(finish, 250);
  });
}

export function findMatchingVoice(
  voices: SpeechSynthesisVoice[],
  targetLocale: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0 || !targetLocale) return null;
  const normalizedTarget = targetLocale.toLowerCase().replace('_', '-');
  const targetSubtag = normalizedTarget.split('-')[0];

  // 1. Exact match first (e.g. 'vi-VN' === 'vi-vn')
  const exact = voices.find((v) => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    return vLang === normalizedTarget;
  });
  if (exact) return exact;

  // 2. Same primary subtag match (e.g. 'vi' matches 'vi-VN')
  const subtagMatch = voices.find((v) => {
    const vLang = (v.lang || '').toLowerCase().replace('_', '-');
    const vSubtag = vLang.split('-')[0];
    return vSubtag === targetSubtag;
  });
  return subtagMatch || null;
}

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

export function snapToWordBoundary(
  text: string,
  rawOffset: number,
  lang?: string
): { charIndex: number; charLength: number } {
  if (!text || text.length === 0) return { charIndex: 0, charLength: 0 };
  const len = text.length;
  let pos = Math.max(0, Math.min(len - 1, Math.floor(rawOffset)));

  // If on whitespace, advance to next non-whitespace character
  while (pos < len && /\s/.test(text[pos] ?? '')) {
    pos++;
  }
  if (pos >= len) {
    return { charIndex: len, charLength: 0 };
  }

  // Japanese (ja) without space separation: stop at punctuation or take 1-2 chars
  if (lang === 'ja') {
    let end = pos;
    while (end < len && !/\s|[.,!?;:。！？、]/.test(text[end] ?? '')) {
      end++;
      if (end - pos >= 2) break;
    }
    return { charIndex: pos, charLength: Math.max(1, end - pos) };
  }

  // Space-delimited languages (vi, en, ko)
  let start = pos;
  while (start > 0 && !/\s/.test(text[start - 1] ?? '')) {
    start--;
  }
  let end = pos;
  while (end < len && !/\s|[.,!?;:。！？]/.test(text[end] ?? '')) {
    end++;
  }

  const charLength = Math.max(1, end - start);
  return { charIndex: start, charLength };
}

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
  noVoiceNoticeText?: (lang: SupportedLanguage) => string;
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
  noVoiceNoticeText,
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
  const [activeCharOffset, setActiveCharOffset] = useState<number | null>(null);
  const [activeCharLength, setActiveCharLength] = useState<number>(0);
  const [syncMode, setSyncMode] = useState<'boundary' | 'estimate'>('boundary');
  const [sentences, setSentences] = useState<ParsedSentence[]>([]);

  const requestTokenRef = useRef<number>(0);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeSourceTypeRef = useRef<AudioSourceType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boundaryWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLangRef = useRef<SupportedLanguage>(currentLang);
  const speedRef = useRef<number>(1);
  const sentencesRef = useRef<ParsedSentence[]>([]);
  const currentTextLengthRef = useRef<number>(0);
  const currentFullTextRef = useRef<string>('');
  const lastManualStoppedIdRef = useRef<string | null>(null);
  const lastManualStopTimeRef = useRef<number>(0);
  const onPoiListenedRef = useRef(onPoiListened);
  const hasBoundaryEventsRef = useRef<boolean>(false);

  useEffect(() => {
    onPoiListenedRef.current = onPoiListened;
  }, [onPoiListened]);

  const resolveNoVoiceMsg = useCallback(
    (l: SupportedLanguage) => {
      if (noVoiceNoticeText) return noVoiceNoticeText(l);
      return NO_VOICE_MESSAGES[l] || NO_VOICE_MESSAGES.vi;
    },
    [noVoiceNoticeText]
  );

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopWatchdog = () => {
    if (boundaryWatchdogRef.current) {
      clearTimeout(boundaryWatchdogRef.current);
      boundaryWatchdogRef.current = null;
    }
  };

  const stopAllAudio = useCallback((reason?: string) => {
    // Increment request token so any pending async promise or delayed callback is discarded immediately
    const oldToken = requestTokenRef.current;
    requestTokenRef.current += 1;

    stopTimer();
    stopWatchdog();

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
    setActiveCharOffset(null);
    setActiveCharLength(0);
    setSyncMode('boundary');
    setCurrentId(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const resolveAudio = useCallback(
    (poi: GeoPoi) => {
      const playback = resolvePlayback(poi, currentLang, 'short');
      return {
        hasAudioInLang: true,
        actualLang: currentLang,
        actualTxLang: currentLang,
        text: playback.text,
      };
    },
    [currentLang]
  );

  // Update sentence highlighting by character proportion (fallback when boundary events not emitted)
  const updateSentenceHighlight = useCallback(
    (timeVal: number, totalDuration: number) => {
      if (hasBoundaryEventsRef.current) return;
      const sList = sentencesRef.current;
      const tLen = currentTextLengthRef.current;
      if (totalDuration <= 0 || tLen <= 0 || sList.length === 0) {
        setActiveSentenceIndex(null);
        return;
      }
      const charPos = Math.min(tLen, (timeVal / totalDuration) * tLen);
      const idx = sList.findIndex((s) => charPos >= s.start && charPos <= s.end);
      const targetIdx = idx !== -1 ? idx : sList.length - 1;
      setActiveSentenceIndex((prev) => {
        if (prev === null) return targetIdx;
        return Math.max(prev, targetIdx);
      });
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

      const targetLocale = SPEECH_LANG_MAP[langCode] || 'vi-VN';

      const doSpeak = (voices: SpeechSynthesisVoice[]) => {
        if (token !== requestTokenRef.current) return;

        const matchedVoice = findMatchingVoice(voices, targetLocale);

        // Task 3: If no voice matches the selected language, do NOT speak with a different-language voice:
        // show a short, plain message in the player bar in the selected language and do not start playback.
        if (!matchedVoice) {
          stopTimer();
          setPlaybackStatus('idle');
          setIsPlaying(false);
          setIsLoading(false);
          setActiveSentenceIndex(null);
          setNotice(resolveNoVoiceMsg(langCode));
          setNoticeWarn(true);
          return;
        }

        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          activeUtteranceRef.current = utterance;
          utterance.lang = targetLocale; // Never left unset!
          utterance.voice = matchedVoice;
          utterance.rate = playbackRate;

          utterance.onboundary = (e: SpeechSynthesisEvent) => {
            if (token !== requestTokenRef.current) return;
            if (!isFullTextReading) {
              setActiveSentenceIndex(null);
              setActiveCharOffset(null);
              setActiveCharLength(0);
              return;
            }
            hasBoundaryEventsRef.current = true;
            setSyncMode('boundary');
            if (e.name === 'word' || e.name === 'sentence') {
              const rawIdx = e.charIndex;
              const rawLen = (e as any).charLength || 0;
              if (rawLen > 0) {
                setActiveCharOffset(rawIdx);
                setActiveCharLength(rawLen);
              } else {
                const snapped = snapToWordBoundary(currentFullTextRef.current, rawIdx, langCode);
                setActiveCharOffset(snapped.charIndex);
                setActiveCharLength(snapped.charLength);
              }

              const sList = sentencesRef.current;
              if (sList.length > 0) {
                const relIdx = sList
                  .slice(startSentenceOffset)
                  .findIndex((s) => rawIdx >= s.start && rawIdx <= s.end);
                if (relIdx !== -1) {
                  const targetIdx = startSentenceOffset + relIdx;
                  setActiveSentenceIndex((prev) => (prev === targetIdx ? prev : targetIdx));
                }
              }
            }
          };

          utterance.onend = () => {
            if (token !== requestTokenRef.current) return;
            logAudioDev('STOP', { sourceType: 'speech', token, reason: 'utterance_ended' });
            activeSourceTypeRef.current = null;
            stopTimer();
            stopWatchdog();
            setPlaybackStatus('idle');
            setIsPlaying(false);
            setActiveSentenceIndex(null);
            setActiveCharOffset(null);
            setActiveCharLength(0);
            setSyncMode('boundary');
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
            stopWatchdog();
            setPlaybackStatus('idle');
            setIsPlaying(false);
            setActiveSentenceIndex(null);
            setActiveCharOffset(null);
            setActiveCharLength(0);
            setSyncMode('boundary');
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
      };

      const syncVoices = window.speechSynthesis.getVoices?.() || [];
      if (syncVoices.length > 0) {
        doSpeak(syncVoices);
      } else {
        getAvailableVoices().then((voices) => {
          doSpeak(voices);
        });
      }
    },
    [currentId, resolveNoVoiceMsg]
  );

  const playPoi = useCallback(
    (poiId: string, isAuto: boolean = false) => {
      const targetPoi = pois.find((p) => p.id === poiId);
      if (!targetPoi) return;

      // Single Controller: increment token and cancel any active source synchronously
      const token = ++requestTokenRef.current;
      hasBoundaryEventsRef.current = false;
      setSyncMode('boundary');
      stopAllAudio('new_poi_start');
      requestTokenRef.current = token; // Maintain the active token for this start

      const triggerType = isAuto ? 'auto' : 'manual';
      setCurrentId(poiId);
      setPlaybackStatus('playing');
      setIsPlaying(true);
      setIsLoading(false);
      setCurrentTime(0);

      // Task 1: Single source of truth resolvePlayback decides what is played
      const layer: NarrationLayer = isAuto ? 'short' : 'full';
      const playback = resolvePlayback(targetPoi, currentLang, layer);
      const chosenText = playback.text;

      const parsedSentences = splitTranscriptIntoSentences(chosenText);
      sentencesRef.current = parsedSentences;
      setSentences(parsedSentences);
      currentTextLengthRef.current = chosenText.length;
      currentFullTextRef.current = chosenText;

      const estDuration = Math.max(14, Math.round(chosenText.length / 10));
      setDuration(estDuration);
      const hasFullText = Boolean(!isAuto && getNarration(targetPoi, currentLang, 'full')?.length);
      setActiveSentenceIndex(hasFullText && parsedSentences.length > 0 ? 0 : null);
      if (hasFullText) {
        const initSnap = snapToWordBoundary(chosenText, 0, currentLang);
        setActiveCharOffset(initSnap.charIndex);
        setActiveCharLength(initSnap.charLength);
        if (boundaryWatchdogRef.current) {
          clearTimeout(boundaryWatchdogRef.current);
        }
        boundaryWatchdogRef.current = setTimeout(() => {
          if (token !== requestTokenRef.current) return;
          if (!hasBoundaryEventsRef.current) {
            setSyncMode('estimate');
          }
        }, 1000);
      } else {
        setActiveCharOffset(null);
        setActiveCharLength(0);
      }

      if (isAuto) {
        setNotice(autoTriggerNoticeText(getPoiName(targetPoi)));
        setNoticeWarn(false);
      } else {
        setNotice('');
        setNoticeWarn(false);
      }

      // Synchronously start speech narration
      setAudioSourceType('speech');
      setIsHtml5Audio(false);
      speakText(chosenText, currentLang, speedRef.current, token, 0, hasFullText);

      stopTimer();
      timerRef.current = setInterval(() => {
        if (token !== requestTokenRef.current) return;
        setCurrentTime((prev) => {
          if (token !== requestTokenRef.current) return prev;
          const next = prev + 0.1 * speedRef.current;
          if (hasFullText) {
            updateSentenceHighlight(next, estDuration);
            if (!hasBoundaryEventsRef.current) {
              const tLen = currentTextLengthRef.current;
              const rawOffset = estDuration > 0 ? (next / estDuration) * tLen : 0;
              const snapped = snapToWordBoundary(currentFullTextRef.current, rawOffset, currentLang);
              setActiveCharOffset(snapped.charIndex);
              setActiveCharLength(snapped.charLength);
            }
          } else {
            setActiveSentenceIndex(null);
            setActiveCharOffset(null);
            setActiveCharLength(0);
          }
          checkListenedProgress(poiId, next);
          if (next >= estDuration) {
            stopTimer();
            stopWatchdog();
            setPlaybackStatus('idle');
            setIsPlaying(false);
            setActiveSentenceIndex(null);
            setActiveCharOffset(null);
            setActiveCharLength(0);
            setSyncMode('boundary');
            setCurrentId(null);
            setCurrentTime(0);
            setDuration(0);
            setNotice('');
            if (poiId) onPoiListenedRef.current?.(poiId);
            return estDuration;
          }
          return next;
        });
      }, 100);

      // Task 2: Remote audio path (behind ENABLE_REMOTE_AUDIO flag)
      // NOTE: May only be enabled when the backend seeds the same 5 POIs with the same text.
      if (ENABLE_REMOTE_AUDIO) {
        const numericId = parseInt(poiId.replace(/\D/g, ''), 10);
        if (!isNaN(numericId) && numericId > 0 && typeof api?.getPoiDetail === 'function') {
          api.getPoiDetail(numericId, currentLang)
            .then((detail) => {
              if (token !== requestTokenRef.current) {
                logAudioDev('DISCARD_STALE', {
                  stopId: poiId,
                  token,
                  reason: 'token_mismatch_getPoiDetail',
                });
                return;
              }

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
                const targetLangName = LANG_DISPLAY_NAMES[currentLang]?.[currentLang] || currentLang;
                setNotice(fallbackNoticeText(targetLangName));
                setNoticeWarn(true);
              }

              if (detail?.audioUrl && detail.audioStatus === 'READY') {
                const fullUrl = api.getAudioUrl(detail.audioUrl);

                stopTimer();
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  try {
                    window.speechSynthesis.cancel();
                  } catch {}
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
                  } catch {}
                  audioElemRef.current = null;
                }

                const audio = new Audio(fullUrl);
                audioElemRef.current = audio;
                audio.playbackRate = speedRef.current;

                audio.onerror = () => {
                  if (token !== requestTokenRef.current) return;
                  logAudioDev('STOP', { sourceType: 'backend', stopId: poiId, token, reason: 'error' });
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
      }
    },
    [
      pois,
      stopAllAudio,
      currentLang,
      autoTriggerNoticeText,
      getPoiName,
      speakText,
      updateSentenceHighlight,
      checkListenedProgress,
      fallbackNoticeText,
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
        hasBoundaryEventsRef.current = false;
        setSyncMode('boundary');
        const currentSentenceIdx = activeSentenceIndex ?? 0;
        const remainingSentences = sentencesRef.current.slice(currentSentenceIdx);
        const remainingText =
          remainingSentences.map((s) => s.sentence).join(' ') || currentFullTextRef.current;
        const targetPoi = pois.find((p) => p.id === currentId);
        const hasFullText = Boolean(targetPoi && getNarration(targetPoi, currentLang, 'full')?.length);

        if (hasFullText) {
          if (boundaryWatchdogRef.current) {
            clearTimeout(boundaryWatchdogRef.current);
          }
          boundaryWatchdogRef.current = setTimeout(() => {
            if (resumeToken !== requestTokenRef.current) return;
            if (!hasBoundaryEventsRef.current) {
              setSyncMode('estimate');
            }
          }, 1000);
        }

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
            const next = prev + 0.1 * speedRef.current;
            if (hasFullText) {
              updateSentenceHighlight(next, duration);
              if (!hasBoundaryEventsRef.current) {
                const tLen = currentTextLengthRef.current;
                const rawOffset = duration > 0 ? (next / duration) * tLen : 0;
                const snapped = snapToWordBoundary(currentFullTextRef.current, rawOffset, currentLang);
                setActiveCharOffset(snapped.charIndex);
                setActiveCharLength(snapped.charLength);
              }
            } else {
              setActiveSentenceIndex(null);
              setActiveCharOffset(null);
              setActiveCharLength(0);
            }
            checkListenedProgress(currentId, next);
            if (next >= duration) {
              stopTimer();
              stopWatchdog();
              setPlaybackStatus('idle');
              setIsPlaying(false);
              setActiveSentenceIndex(null);
              setActiveCharOffset(null);
              setActiveCharLength(0);
              setSyncMode('boundary');
              setCurrentId(null);
              setCurrentTime(0);
              setDuration(0);
              setNotice('');
              if (currentId) onPoiListenedRef.current?.(currentId);
              return duration;
            }
            return next;
          });
        }, 100);
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
    activeCharOffset,
    activeCharLength,
    syncMode,
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
