import '@testing-library/jest-dom';

// Mock Storage for jsdom and Node 22+ environments
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
  configurable: true,
});
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
}

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
