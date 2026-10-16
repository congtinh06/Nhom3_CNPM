// Shared HTMLAudioElement + mobile autoplay unlock helpers.
// Mobile browsers (iOS Safari, mobile Chrome) only allow audio playback that is
// started from a direct user gesture. We unlock once from a tap, then reuse the
// same element for later playback so it stays permitted.

const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';

let sharedAudio: HTMLAudioElement | null = null;

export function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

export function unlockAudio(): void {
  try {
    const audio = getSharedAudio();
    audio.src = SILENT_WAV_DATA_URI;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          audio.pause();
        })
        .catch((err) => {
          console.warn('[audioUnlock] silent audio unlock rejected', err);
        });
    } else {
      audio.pause();
    }
  } catch (err) {
    console.warn('[audioUnlock] silent audio unlock failed', err);
  }

  if (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  ) {
    try {
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[audioUnlock] speech synthesis unlock failed', err);
    }
  }
}
