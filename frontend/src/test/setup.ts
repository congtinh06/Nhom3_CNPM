import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock window.scrollTo
window.scrollTo = () => {};

// Polyfill ResizeObserver cho recharts ResponsiveContainer trong jsdom.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window.ResizeObserver === 'undefined') {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });
}

// Mock HTMLDialogElement methods in jsdom
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// Mock speechSynthesis
export const defaultMockVoices: SpeechSynthesisVoice[] = [
  {
    voiceURI: 'vi-VN-Standard',
    name: 'Google Tiếng Việt',
    lang: 'vi-VN',
    localService: true,
    default: true,
  } as SpeechSynthesisVoice,
  {
    voiceURI: 'en-US-Standard',
    name: 'Google US English',
    lang: 'en-US',
    localService: true,
    default: false,
  } as SpeechSynthesisVoice,
  {
    voiceURI: 'ja-JP-Standard',
    name: 'Google 日本語',
    lang: 'ja-JP',
    localService: true,
    default: false,
  } as SpeechSynthesisVoice,
  {
    voiceURI: 'ko-KR-Standard',
    name: 'Google 한국어',
    lang: 'ko-KR',
    localService: true,
    default: false,
  } as SpeechSynthesisVoice,
];

const mockSpeechSynthesis = {
  speak: () => {},
  cancel: () => {},
  pause: () => {},
  resume: () => {},
  getVoices: () => defaultMockVoices,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  onvoiceschanged: null,
};
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

class MockSpeechSynthesisUtterance {
  text = '';
  lang = '';
  rate = 1;
  voice = null;
  onstart = null;
  onend = null;
  onerror = null;
  onboundary = null;
  constructor(text?: string) {
    if (text) this.text = text;
  }
}
Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: MockSpeechSynthesisUtterance,
});
