import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { SupportedLanguage, TriggerType } from '../types';
import { detectDeviceType } from '../lib/device';
import { getAnalyticsSessionId } from '../lib/analytics';
import { formatNarrationNumerals } from '../lib/numerals';
import { toNarrationScript } from '../lib/narrationScript';
import { getSharedAudio } from '../lib/audioUnlock';
import { GeoPoi, getNarration, NarrationLayer } from '../pages/NearbyPage';

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
  source: 'speech' | 'remote';
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
 * Remote backend audio is used only when the stop carries a READY audio URL.
 */
export function resolvePlayback(
  poi: GeoPoi,
  lang: SupportedLanguage,
  layer: NarrationLayer = 'full'
): PlaybackResolution {
  let text: string;
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

  text = formatNarrationNumerals(text, lang);

  // Per-language remote audio: only the entry for the currently selected language
  // may be used, and only when that entry is READY with a URL.
  const perLangUrl = poi.audio?.[lang];
  const perLangStatus = poi.audioStatusByLanguage?.[lang] ?? null;
  const langUrl = typeof perLangUrl === 'string' ? perLangUrl : '';

  if (perLangStatus === 'READY' && langUrl) {
    return {
      source: 'remote',
      url: langUrl,
      text,
      lang,
    };
  }

  // Legacy single-field values (audioUrl/audioStatus) are the Vietnamese source
  // audio, so they only apply to vi. Other languages must never fall back to them.
  if (lang === 'vi' && poi.audioStatus === 'READY' && poi.audioUrl) {
    return {
      source: 'remote',
      url: poi.audioUrl,
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

export function getAvailableVoices(timeoutMs = 250): Promise<SpeechSynthesisVoice[]> {
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
    setTimeout(finish, timeoutMs);
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
  if (subtagMatch) return subtagMatch;

  // 3. Fallback matching by language name or alternative codes
  if (targetSubtag === 'vi') {
    const viMatch = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      return (
        vLang === 'vie' ||
        vLang === 'vn' ||
        vLang.startsWith('vi') ||
        vName.includes('vietnam') ||
        vName.includes('tiếng việt') ||
        vName.includes('tieng viet') ||
        vName.includes('hoaimy') ||
        vName.includes('namminh')
      );
    });
    if (viMatch) return viMatch;
  }

  if (targetSubtag === 'ja') {
    const jaMatch = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      return (
        vLang === 'jpn' ||
        vLang.startsWith('ja') ||
        vName.includes('japanese') ||
        vName.includes('日本語') ||
        vName.includes('haruka') ||
        vName.includes('ichiro') ||
        vName.includes('ayumi')
      );
    });
    if (jaMatch) return jaMatch;
  }

  if (targetSubtag === 'ko') {
    const koMatch = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      return (
        vLang === 'kor' ||
        vLang.startsWith('ko') ||
        vName.includes('korean') ||
        vName.includes('한국어') ||
        vName.includes('heami') ||
        vName.includes('sunhi') ||
        vName.includes('injoon')
      );
    });
    if (koMatch) return koMatch;
  }

  return null;
}

/**
 * Id số của POI trong DB (dùng cho analytics). Ưu tiên `numericId` do adapter
 * lấy từ content-service; nếu thiếu thì lấy phần số của id dạng "poi-12".
 */
export function toNumericPoiId(poi: Pick<GeoPoi, 'id' | 'numericId'>): number | null {
  if (typeof poi.numericId === 'number' && Number.isFinite(poi.numericId) && poi.numericId > 0) {
    return Math.trunc(poi.numericId);
  }
  const match = /(\d+)/.exec(poi.id ?? '');
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
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
        if (prevChar && nextChar && /\d/.test(prevChar) && /\d/.test(nextChar)) {
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

interface SpokenSentenceRange {
  start: number;
  end: number;
  origStart: number;
  origEnd: number;
  index: number;
}

/**
 * The spoken script spells numerals out ("năm 1975" -> "năm một nghìn..."),
 * so boundary events report offsets in a LONGER string than the transcript we
 * highlight. Build the sentence ranges of the spoken string and keep the
 * matching original ranges, so an offset can be mapped back to the exact
 * sentence (and approximate word) the voice is reading.
 */
function buildSpokenSentenceRanges(
  text: string,
  sentences: ParsedSentence[],
  lang: SupportedLanguage,
  indexOffset = 0
): SpokenSentenceRange[] {
  if (!text || sentences.length === 0) return [];
  const spokenFull = toNarrationScript(text, lang);
  let cursor = 0;
  return sentences.map((sentence, offset) => {
    const spoken = toNarrationScript(sentence.sentence, lang);
    let start = spokenFull.indexOf(spoken, cursor);
    if (start === -1) start = Math.min(cursor, spokenFull.length);
    const end = start + spoken.length;
    cursor = Math.max(cursor, end);
    return {
      start,
      end,
      origStart: sentence.start,
      origEnd: sentence.end,
      index: indexOffset + offset,
    };
  });
}

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
  const [playbackRate, setPlaybackRate] = useState<1 | 1.25 | 1.5>(1);
  const [audioErrorPoiId, setAudioErrorPoiId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [noticeWarn, setNoticeWarn] = useState<boolean>(false);
  const [audioSourceType, setAudioSourceType] = useState<AudioSourceType>('speech');
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [activeCharOffset, setActiveCharOffset] = useState<number | null>(null);
  const [activeCharLength, setActiveCharLength] = useState<number>(0);
  const [syncMode, setSyncMode] = useState<'boundary' | 'estimate'>('boundary');
  const [sentences, setSentences] = useState<ParsedSentence[]>([]);

  const requestTokenRef = useRef<number>(0);
  const playbackRateRef = useRef<1 | 1.25 | 1.5>(1);
  const currentPoiIdRef = useRef<string | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpeechCancelAtRef = useRef<number>(0);
  const activeSourceTypeRef = useRef<AudioSourceType | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boundaryWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLangRef = useRef<SupportedLanguage>(currentLang);
  const sentencesRef = useRef<ParsedSentence[]>([]);
  const currentTextLengthRef = useRef<number>(0);
  const currentFullTextRef = useRef<string>('');
  const lastManualStoppedIdRef = useRef<string | null>(null);
  const lastManualStopTimeRef = useRef<number>(0);
  const onPoiListenedRef = useRef(onPoiListened);
  const hasBoundaryEventsRef = useRef<boolean>(false);
  const spokenSentenceRangesRef = useRef<SpokenSentenceRange[]>([]);

  // ------------------------------------------------------------------
  // Analytics: mỗi lượt nghe phải ghi nhận 2 sự kiện AUDIO_PLAY
  //   - bắt đầu nghe (completed = false)
  //   - nghe hoàn tất (completed = true)
  // Trước đây trang Điểm du lịch không gửi sự kiện nào nên dashboard admin
  // luôn hiển thị 0 lượt nghe hoàn tất.
  // ------------------------------------------------------------------
  const analyticsRef = useRef<{
    poiId: number | null;
    lang: SupportedLanguage;
    trigger: TriggerType;
    started: boolean;
    completed: boolean;
  }>({ poiId: null, lang: 'vi', trigger: 'MANUAL', started: false, completed: false });

  const beginPlaybackAnalytics = useCallback(
    (poi: GeoPoi, lang: SupportedLanguage, trigger: TriggerType) => {
      analyticsRef.current = {
        poiId: toNumericPoiId(poi),
        lang,
        trigger,
        started: false,
        completed: false,
      };
    },
    []
  );

  const sendAudioPlayEvent = useCallback((completed: boolean) => {
    const snapshot = analyticsRef.current;
    if (!snapshot.poiId) return;
    void api
      .recordAnalyticsEvent({
        eventType: 'AUDIO_PLAY',
        poiId: snapshot.poiId,
        languageCode: snapshot.lang,
        triggerType: snapshot.trigger,
        completed,
        deviceType: detectDeviceType(),
        sessionId: getAnalyticsSessionId(),
      })
      .catch(() => {
        // Analytics không được chặn trải nghiệm nghe.
      });
  }, []);

  const markPlaybackStarted = useCallback(() => {
    if (analyticsRef.current.started || analyticsRef.current.completed) return;
    analyticsRef.current.started = true;
    sendAudioPlayEvent(false);
  }, [sendAudioPlayEvent]);

  const markPlaybackCompleted = useCallback(() => {
    const snapshot = analyticsRef.current;
    if (!snapshot.poiId || snapshot.completed) return;
    // Nếu vì lý do nào đó chưa kịp ghi lượt bắt đầu, ghi bù để tỷ lệ hoàn tất
    // không vượt quá 100%.
    if (!snapshot.started) {
      snapshot.started = true;
      sendAudioPlayEvent(false);
    }
    snapshot.completed = true;
    sendAudioPlayEvent(true);
  }, [sendAudioPlayEvent]);

  useEffect(() => {
    onPoiListenedRef.current = onPoiListened;
  }, [onPoiListened]);

  // Preload speech synthesis voices and subscribe to voiceschanged
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices?.();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices?.();
      };
      window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener?.('voiceschanged', onVoicesChanged);
      };
    }
  }, []);

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
      a.removeAttribute('src');
      try {
        a.load();
      } catch (err) {
        console.warn('[useNearbyAudio] resetting audio element failed', err);
      }
      audioElemRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          lastSpeechCancelAtRef.current = Date.now();
        }
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn('[useNearbyAudio] speechSynthesis.cancel() failed during reset', err);
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
    setActiveSentenceIndex(null);
    setActiveCharOffset(null);
    setActiveCharLength(0);
    setSyncMode('boundary');
    setCurrentId(null);
    currentPoiIdRef.current = null;
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const clearAudioError = useCallback(() => {
    setAudioErrorPoiId(null);
  }, []);

  const cyclePlaybackRate = useCallback(() => {
    const nextRate: 1 | 1.25 | 1.5 =
      playbackRateRef.current === 1 ? 1.25 : playbackRateRef.current === 1.25 ? 1.5 : 1;
    playbackRateRef.current = nextRate;
    setPlaybackRate(nextRate);
    if (audioElemRef.current) {
      audioElemRef.current.playbackRate = nextRate;
    }
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

  const checkListenedProgress = useCallback((poiId: string, currentT: number, totalDuration?: number) => {
    // Chỉ đánh dấu điểm khi nghe xong hoặc nghe gần hết (>= 85% thời lượng)
    if (totalDuration && totalDuration > 0) {
      if (currentT >= totalDuration * 0.85) {
        onPoiListenedRef.current?.(poiId);
      }
    } else if (currentT >= 30) {
      onPoiListenedRef.current?.(poiId);
    }
  }, []);

  const speakText = useCallback(
    (
      text: string,
      langCode: SupportedLanguage,
      token: number,
      startSentenceOffset: number = 0,
      isFullTextReading: boolean = false
    ) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        stopTimer();
        setPlaybackStatus('idle');
        setIsPlaying(false);
        setIsLoading(false);
        setActiveSentenceIndex(null);
        if (currentPoiIdRef.current) {
          setAudioErrorPoiId(currentPoiIdRef.current);
        }
        return;
      }

      const targetLocale = SPEECH_LANG_MAP[langCode] || 'vi-VN';

      const doSpeak = (voices: SpeechSynthesisVoice[]) => {
        if (token !== requestTokenRef.current) return;

        // 1. Find matching voice from supplied list
        let matchedVoice = findMatchingVoice(voices, targetLocale);

        // 2. Re-query synth if not found (catches newly loaded async voices)
        if (!matchedVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const fresh = window.speechSynthesis.getVoices?.() || [];
          matchedVoice = findMatchingVoice(fresh, targetLocale);
        }

        if (!matchedVoice) {
          stopTimer();
          setPlaybackStatus('idle');
          setIsPlaying(false);
          setIsLoading(false);
          setActiveSentenceIndex(null);
          setNotice(resolveNoVoiceMsg(langCode));
          setNoticeWarn(true);
          if (currentPoiIdRef.current) {
            setAudioErrorPoiId(currentPoiIdRef.current);
          }
          return;
        }

        try {
          // Chrome can drop a speak() that follows a redundant cancel() in the
          // same tick, which made playback occasionally stall. Only cancel when
          // the engine actually has something queued, and let the queue settle
          // before enqueueing the new utterance.
          const synth = window.speechSynthesis;
          const hadPendingSpeech = Boolean(synth.speaking || synth.pending);
          if (hadPendingSpeech) {
            synth.cancel();
          }
          const spokenText = toNarrationScript(text, langCode);
          const utterance = new SpeechSynthesisUtterance(spokenText);
          activeUtteranceRef.current = utterance;
          utterance.lang = targetLocale; // Never left unset!
          utterance.voice = matchedVoice;
          utterance.rate = playbackRateRef.current;

          // Chỉ ghi nhận lượt bắt đầu khi máy thật sự đọc (tránh tính lượt
          // nghe cho thiết bị không có giọng đọc của ngôn ngữ này).
          utterance.onstart = () => {
            if (token !== requestTokenRef.current) return;
            markPlaybackStarted();
          };

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

              // Map the offset reported in the spoken script back onto the
              // displayed transcript so the highlighted word is the one being
              // heard (this is the sync fix for "nghe khác, đánh dấu khác").
              const hit = spokenSentenceRangesRef.current.find(
                (range) => rawIdx >= range.start && rawIdx <= range.end
              );
              if (hit) {
                const spokenSpan = Math.max(1, hit.end - hit.start);
                const ratio = Math.min(
                  1,
                  Math.max(0, (rawIdx - hit.start) / spokenSpan)
                );
                const origSpan = Math.max(0, hit.origEnd - hit.origStart);
                const origOffset = hit.origStart + Math.round(ratio * origSpan);
                const snapped = snapToWordBoundary(
                  currentFullTextRef.current,
                  origOffset,
                  langCode
                );
                setActiveCharOffset(snapped.charIndex);
                setActiveCharLength(snapped.charLength);
                setActiveSentenceIndex((prev) => (prev === hit.index ? prev : hit.index));
                return;
              }

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
            markPlaybackCompleted();
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

          utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
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
            if (e?.error !== 'interrupted' && e?.error !== 'canceled' && currentPoiIdRef.current) {
              setAudioErrorPoiId(currentPoiIdRef.current);
            }
          };

          logAudioDev('START', {
            sourceType: 'speech',
            lang: langCode,
            token,
            trigger: 'manual',
          });
          activeSourceTypeRef.current = 'speech';
          setAudioSourceType('speech');
          const startSpeech = () => {
            if (token !== requestTokenRef.current) return;
            synth.speak(utterance);
          };
          // Let the engine settle after a recent cancel(); speaking in the same
          // tick is what intermittently swallows the first words.
          const recentlyCancelled = Date.now() - lastSpeechCancelAtRef.current < 120;
          if (hadPendingSpeech || recentlyCancelled) {
            setTimeout(startSpeech, 50);
          } else {
            startSpeech();
          }
        } catch (err) {
          console.warn('[useNearbyAudio] speechSynthesis.speak() failed', err);
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
    [currentId, resolveNoVoiceMsg, markPlaybackStarted, markPlaybackCompleted]
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
      currentPoiIdRef.current = poiId;
      setAudioErrorPoiId(null);
      setCurrentId(poiId);
      setPlaybackStatus('playing');
      setIsPlaying(true);
      setIsLoading(false);
      setCurrentTime(0);

      // ONE narration source for both automatic and manual playback: the full
      // script. Auto and manual must never read different texts, otherwise the
      // transcript highlight and the heard audio drift apart.
      const layer: NarrationLayer = 'full';
      const playback = resolvePlayback(targetPoi, currentLang, layer);
      const chosenText = playback.text;

      // Mở phiên analytics cho lượt nghe này; sự kiện bắt đầu/hoàn tất được
      // ghi khi máy thực sự phát và khi phát hết nội dung.
      beginPlaybackAnalytics(targetPoi, currentLang, isAuto ? 'GPS' : 'MANUAL');

      const parsedSentences = splitTranscriptIntoSentences(chosenText);
      sentencesRef.current = parsedSentences;
      spokenSentenceRangesRef.current = buildSpokenSentenceRanges(
        chosenText,
        parsedSentences,
        currentLang
      );
      setSentences(parsedSentences);
      currentTextLengthRef.current = chosenText.length;
      currentFullTextRef.current = chosenText;

      const estDuration = Math.max(14, Math.round(chosenText.length / 10));
      setDuration(estDuration);
      const hasFullText = Boolean(getNarration(targetPoi, currentLang, 'full')?.length);
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

      if (playback.source === 'remote' && playback.url) {
        // Backend TTS is protected by the gateway, so fetch it with the bearer
        // token and play from an object URL instead of assigning the URL directly.
        const remotePath = playback.url;

        stopTimer();
        stopWatchdog();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
          } catch (err) {
            console.warn('[NearbyAudio] speechSynthesis.cancel failed before remote playback', err);
          }
        }
        activeUtteranceRef.current = null;

        const releaseObjectUrl = () => {
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
        };

        const loadAndPlayRemote = async () => {
          setPlaybackStatus('loading');
          setIsLoading(true);
          try {
            const blob = await api.getAudioBlob(remotePath);
            if (token !== requestTokenRef.current) return;

            const objectUrl = URL.createObjectURL(blob);
            if (token !== requestTokenRef.current) {
              URL.revokeObjectURL(objectUrl);
              return;
            }
            objectUrlRef.current = objectUrl;

            const audio = getSharedAudio();
            audioElemRef.current = audio;
            audio.src = objectUrl;
            audio.currentTime = 0;
            audio.playbackRate = playbackRateRef.current;

            audio.onerror = () => {
              if (token !== requestTokenRef.current) return;
              logAudioDev('STOP', { sourceType: 'backend', stopId: poiId, token, reason: 'error' });
              console.warn('[NearbyAudio] remote audio error, falling back to speech', { poiId });
              releaseObjectUrl();
              setIsLoading(false);
              setPlaybackStatus('playing');
              setAudioSourceType('speech');
              speakText(chosenText, currentLang, token, 0);
            };

            audio.onloadedmetadata = () => {
              if (token !== requestTokenRef.current) return;
              // Streamed/no-length media reports Infinity; never expose that to
              // the UI (it rendered as "0:00 / Infinity:NaN").
              if (
                Number.isFinite(audio.duration) &&
                audio.duration > 0
              ) {
                setDuration(Math.round(audio.duration));
              }
            };

            audio.ontimeupdate = () => {
              if (token !== requestTokenRef.current) return;
              setCurrentTime(audio.currentTime);
              setActiveSentenceIndex(null);
              checkListenedProgress(poiId, audio.currentTime, audio.duration);
              // Một số trình duyệt mobile không bắn "ended" khi tab bị ẩn;
              // coi như hoàn tất khi đã phát gần hết file.
              if (
                Number.isFinite(audio.duration) &&
                audio.duration > 0 &&
                audio.currentTime / audio.duration >= 0.95
              ) {
                markPlaybackCompleted();
              }
            };

            audio.onended = () => {
              if (token !== requestTokenRef.current) return;
              logAudioDev('STOP', { sourceType: 'backend', stopId: poiId, token, reason: 'ended' });
              markPlaybackCompleted();
              activeSourceTypeRef.current = null;
              setPlaybackStatus('idle');
              setIsPlaying(false);
              setActiveSentenceIndex(null);
              setCurrentId(null);
              setCurrentTime(0);
              setDuration(0);
              setNotice('');
              releaseObjectUrl();
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
                    setIsLoading(false);
                    setPlaybackStatus('playing');
                    setIsPlaying(true);
                    markPlaybackStarted();
                  })
                  .catch((err) => {
                    if (token !== requestTokenRef.current) return;
                    setIsLoading(false);
                    if (err?.name === 'NotAllowedError' || err?.message?.includes('NotAllowedError')) {
                      setNotice(clickToPlayText || 'Bấm để phát');
                      setNoticeWarn(true);
                      setPlaybackStatus('idle');
                      setIsPlaying(false);
                    } else {
                      console.warn('[NearbyAudio] remote play rejected, falling back to speech', err);
                      releaseObjectUrl();
                      setPlaybackStatus('playing');
                      setAudioSourceType('speech');
                      speakText(chosenText, currentLang, token, 0);
                    }
                  });
              } else {
                activeSourceTypeRef.current = 'backend';
                setAudioSourceType('backend');
                setIsLoading(false);
                setPlaybackStatus('playing');
                setIsPlaying(true);
                markPlaybackStarted();
              }
            } catch (err) {
              if (token !== requestTokenRef.current) return;
              console.warn('[NearbyAudio] remote playback threw, falling back to speech', err);
              releaseObjectUrl();
              setIsLoading(false);
              setPlaybackStatus('playing');
              setAudioSourceType('speech');
              speakText(chosenText, currentLang, token, 0);
            }
          } catch (err) {
            if (token !== requestTokenRef.current) return;
            console.warn('[NearbyAudio] authenticated remote audio load failed, falling back to speech', err);
            setIsLoading(false);
            setPlaybackStatus('playing');
            setAudioSourceType('speech');
            speakText(chosenText, currentLang, token, 0);
          }
        };

        void loadAndPlayRemote();
      } else {
        // Synchronously start speech narration.
        setAudioSourceType('speech');
        speakText(chosenText, currentLang, token, 0, hasFullText);

        stopTimer();
        timerRef.current = setInterval(() => {
          if (token !== requestTokenRef.current) return;
          setCurrentTime((prev) => {
            if (token !== requestTokenRef.current) return prev;
            const next = prev + 0.1 * playbackRateRef.current;
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
            checkListenedProgress(poiId, next, estDuration);
            if (next >= estDuration) {
              stopTimer();
              stopWatchdog();
              markPlaybackCompleted();
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
      beginPlaybackAnalytics,
      markPlaybackStarted,
      markPlaybackCompleted,
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
        } catch (err) {
          console.warn('[useNearbyAudio] speechSynthesis.cancel() failed while pausing', err);
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
        } catch (err) {
          console.warn('[useNearbyAudio] resuming audio playback failed', err);
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
        spokenSentenceRangesRef.current = buildSpokenSentenceRanges(
          remainingText,
          remainingSentences,
          currentLang,
          currentSentenceIdx
        );
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
          resumeToken,
          currentSentenceIdx,
          hasFullText
        );

        stopTimer();
        timerRef.current = setInterval(() => {
          if (resumeToken !== requestTokenRef.current) return;
          setCurrentTime((prev) => {
            if (resumeToken !== requestTokenRef.current) return prev;
            const next = prev + 0.1 * playbackRateRef.current;
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
            checkListenedProgress(currentId, next, duration);
            if (next >= duration) {
              stopTimer();
              stopWatchdog();
              markPlaybackCompleted();
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
    playbackRate,
    cyclePlaybackRate,
    audioErrorPoiId,
    clearAudioError,
    notice,
    setNotice,
    noticeWarn,
    setNoticeWarn,
    audioSourceType,
    activeSentenceIndex,
    activeCharOffset,
    activeCharLength,
    syncMode,
    sentences,
    resolveAudio,
    playPoi,
    togglePlay,
    stopAllAudio,
    lastManualStoppedId: lastManualStoppedIdRef.current,
    lastManualStopTime: lastManualStopTimeRef.current,
  };
}
