import { useState, useRef, useCallback, useEffect } from 'react';
import { usePreferences, SpeechRate } from '../context/PreferencesContext';

export interface UseSpeechReturn {
  isSpeaking: boolean;
  rate: SpeechRate;
  setRate: (rate: SpeechRate) => void;
  currentSentenceIndex: number;
  sentences: string[];
  ttsNotice: string | null;
  hasMatchingVoice: boolean;
  speakText: (text: string, ttsLang?: string) => void;
  stopSpeaking: () => void;
  replay: () => void;
  playServerTts: (text?: string, ttsLang?: string) => Promise<void>;
}

// In-memory cache for audio URLs by hash(text + lang)
const audioBlobCache = new Map<string, string>();

// Fast deterministic 32-bit hash function for text + lang
const hashTextLang = (text: string, lang: string): string => {
  const str = `${lang}___${text}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'tts_' + Math.abs(hash).toString(16);
};

export const useSpeech = (initialLang?: string): UseSpeechReturn => {
  const { speechRate, setSpeechRate, language } = usePreferences();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(-1);
  const [sentences, setSentences] = useState<string[]>([]);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [hasMatchingVoice, setHasMatchingVoice] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const lastTextRef = useRef<string>('');
  const lastLangRef = useRef<string>('');
  const isCancelledRef = useRef<boolean>(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // 1. Map generic language codes to full BCP-47 TTS codes
  // vi -> vi-VN, en -> en-US, ja -> ja-JP, ko -> ko-KR, zh -> zh-CN
  const resolveTtsLang = useCallback((langCode?: string): string => {
    const code = (langCode || language || 'vi').toLowerCase();
    if (code.startsWith('vi')) return 'vi-VN';
    if (code.startsWith('en')) return 'en-US';
    if (code.startsWith('ja')) return 'ja-JP';
    if (code.startsWith('ko')) return 'ko-KR';
    if (code.startsWith('zh')) return 'zh-CN';
    return 'vi-VN';
  }, [language]);

  // 2. Chờ speechSynthesis 'voiceschanged' và nạp danh sách voice
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Tìm voice phù hợp nhất theo BCP-47 targetLang
  const findMatchingVoice = useCallback(
    (targetLang: string): SpeechSynthesisVoice | null => {
      const voicesToSearch = availableVoices.length > 0
        ? availableVoices
        : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

      if (!voicesToSearch || voicesToSearch.length === 0) return null;

      // Tìm khớp chính xác (ví dụ vi-VN)
      const exactMatch = voicesToSearch.find(
        (v) => v.lang.toLowerCase() === targetLang.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      // Tìm khớp theo tiền tố ngôn ngữ (ví dụ vi, ja, ko, zh, en)
      const prefix = targetLang.split('-')[0].toLowerCase();
      const prefixMatch = voicesToSearch.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
      );
      return prefixMatch || null;
    },
    [availableVoices]
  );

  // Dừng phát âm thanh (cả Web Speech lẫn HTML Audio)
  const stopSpeaking = useCallback(() => {
    isCancelledRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setCurrentSentenceIndex(-1);
  }, []);

  // Tách câu để highlight
  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    const matches = text.match(/[^.!?。！？\n]+[.!?。！？\n]*/g);
    if (!matches || matches.length === 0) {
      return [text.trim()];
    }
    return matches.map((s) => s.trim()).filter((s) => s.length > 0);
  };

  // Dự phòng: gọi endpoint /api/tts?lang=&text= (hoặc Google TTS direct) và phát bằng <audio>
  const playServerTts = useCallback(
    async (textToPlay?: string, customTtsLang?: string) => {
      const text = textToPlay || lastTextRef.current;
      const targetLang = customTtsLang || lastLangRef.current || resolveTtsLang(initialLang);

      if (!text) return;

      stopSpeaking();
      isCancelledRef.current = false;
      setIsSpeaking(true);

      const parsed = splitIntoSentences(text);
      setSentences(parsed);
      setCurrentSentenceIndex(0);

      const cacheKey = hashTextLang(text, targetLang);
      const shortLang = targetLang.split('-')[0].toLowerCase();

      // Sử dụng HTMLAudioElement để phát
      let audio = audioElementRef.current;
      if (!audio) {
        audio = new Audio();
        audioElementRef.current = audio;
      }

      audio.playbackRate = speechRate;

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentSentenceIndex(-1);
      };

      audio.onerror = () => {
        console.warn('Primary audio stream failed, attempting direct Google TTS stream...');
        if (audio) {
          // Thử link trực tiếp
          audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${shortLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
          audio.play().catch(() => {
            setIsSpeaking(false);
            setCurrentSentenceIndex(-1);
            setTtsNotice('Chạm vào nút "Phát âm thanh" để kích hoạt loa.');
          });
        }
      };

      // Đặt URL âm thanh (hỗ trợ cả dev proxy và production backend)
      let audioUrl = audioBlobCache.get(cacheKey);
      if (!audioUrl) {
        audioUrl = `/api/tts?lang=${encodeURIComponent(shortLang)}&text=${encodeURIComponent(text)}`;
      }

      audio.src = audioUrl;

      try {
        await audio.play();
        setTtsNotice(null);
      } catch (err: any) {
        console.warn('Audio play was interrupted or requires user gesture:', err);
        setIsSpeaking(false);
        setCurrentSentenceIndex(-1);
        setTtsNotice('Chạm vào nút "Phát âm thanh" để nghe thuyết minh.');
      }
    },
    [initialLang, resolveTtsLang, speechRate, stopSpeaking]
  );

  // Speak a single sentence by index sequentially using Web Speech API
  const speakSentenceAtIndex = useCallback(
    (sentenceList: string[], index: number, targetLang: string, voice: SpeechSynthesisVoice | null) => {
      if (isCancelledRef.current || index >= sentenceList.length) {
        setIsSpeaking(false);
        setCurrentSentenceIndex(-1);
        return;
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setIsSpeaking(false);
        playServerTts(sentenceList.join(' '), targetLang);
        return;
      }

      setCurrentSentenceIndex(index);
      const textChunk = sentenceList[index];
      const utterance = new SpeechSynthesisUtterance(textChunk);
      utterance.lang = targetLang;
      utterance.rate = speechRate; // 0.75x or 1.0x
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (!isCancelledRef.current) {
          speakSentenceAtIndex(sentenceList, index + 1, targetLang, voice);
        }
      };

      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        console.warn('Web Speech error, switching to server audio:', e.error);
        setIsSpeaking(false);
        setCurrentSentenceIndex(-1);
        // Tự động chuyển sang audio dự phòng
        playServerTts(sentenceList.join(' '), targetLang);
      };

      window.speechSynthesis.speak(utterance);
    },
    [playServerTts, speechRate]
  );

  // Main speak function
  const speakText = useCallback(
    (text: string, customTtsLang?: string) => {
      if (!text || typeof window === 'undefined') {
        return;
      }

      stopSpeaking();
      isCancelledRef.current = false;
      setTtsNotice(null);

      const targetLang = customTtsLang || resolveTtsLang(initialLang);
      lastTextRef.current = text;
      lastLangRef.current = targetLang;

      // 1. Kiểm tra hỗ trợ Web Speech API
      if (!('speechSynthesis' in window)) {
        setHasMatchingVoice(false);
        playServerTts(text, targetLang);
        return;
      }

      // 2. Tìm voice khớp lang
      const matchedVoice = findMatchingVoice(targetLang);

      // Nếu thiết bị KHÔNG có voice cục bộ khớp lang:
      // KHÔNG để im lặng! TỰ ĐỘNG PHÁT BẰNG ÂM THANH MÁY CHỦ (TTS MP3)!
      if (!matchedVoice) {
        setHasMatchingVoice(false);
        playServerTts(text, targetLang);
        return;
      }

      // Có voice khớp -> Dùng Web Speech API
      setHasMatchingVoice(true);
      const parsedSentences = splitIntoSentences(text);
      setSentences(parsedSentences);
      setIsSpeaking(true);

      speakSentenceAtIndex(parsedSentences, 0, targetLang, matchedVoice);
    },
    [findMatchingVoice, initialLang, playServerTts, resolveTtsLang, speakSentenceAtIndex, stopSpeaking]
  );

  // Replay last spoken text
  const replay = useCallback(() => {
    if (lastTextRef.current) {
      if (hasMatchingVoice) {
        speakText(lastTextRef.current, lastLangRef.current);
      } else {
        playServerTts(lastTextRef.current, lastLangRef.current);
      }
    }
  }, [hasMatchingVoice, playServerTts, speakText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  return {
    isSpeaking,
    rate: speechRate,
    setRate: setSpeechRate,
    currentSentenceIndex,
    sentences,
    ttsNotice,
    hasMatchingVoice,
    speakText,
    stopSpeaking,
    replay,
    playServerTts,
  };
};
