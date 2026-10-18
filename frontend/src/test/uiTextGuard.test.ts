import { describe, it, expect } from 'vitest';

const ALL_FILES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const FORBIDDEN: [string, string][] = [
  ['\u00b7', 'middle dot'], ['\u2022', 'bullet'], ['\u2023', 'tri bullet'],
  ['\u2027', 'hyphenation point'], ['\u2014', 'em dash'], ['\u2013', 'en dash'],
  ['\u2015', 'horizontal bar'],
  ['\u2190', 'left arrow'], ['\u2192', 'right arrow'], ['\u2191', 'up arrow'],
  ['\u2193', 'down arrow'], ['\u2196', 'up-left arrow'], ['\u2197', 'up-right arrow'],
  ['\u2198', 'down-right arrow'], ['\u2199', 'down-left arrow'],
  ['\u2039', 'left angle quote'], ['\u203a', 'right angle quote'],
  ['\u00ab', 'left guillemet'], ['\u00bb', 'right guillemet'],
  ['\u2713', 'check'], ['\u2714', 'heavy check'], ['\u2717', 'ballot x'],
  ['\u2718', 'heavy ballot x'], ['\u2605', 'star'], ['\u2606', 'white star'],
  ['\u25b6', 'play'], ['\u25c0', 'reverse'], ['\u25a0', 'square'],
  ['\u25cf', 'circle'], ['\u25aa', 'small square'], ['\u2759', 'vertical bar'],
  ['\u275a', 'light vertical bar'], ['\u2758', 'box vertical bar'],
  ['\u23f8', 'pause'], ['\u23f5', 'play triangle'], ['\u23f4', 'reverse triangle'],
  ['\u23ed', 'next'], ['\u23ee', 'prev'], ['\u00b6', 'pilcrow'],
];

const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2B05}\u{27A1}\u{2797}]/u;

const ALLOW_FILES = ['content/newsFixtures.ts'];
const ALLOW_SUBSTRINGS = ['Sài Gòn – TP. Hồ Chí Minh là thành phố lớn nhất'];

const files: [string, string][] = Object.entries(ALL_FILES)
  .filter(([p]) => !p.includes('/test/'))
  .filter(([p]) => !ALLOW_FILES.some((allow) => p.endsWith(allow)));

function label(path: string): string {
  return path.replace(/^\.\.\//, '');
}

interface Collected {
  masked: string;
  strings: { text: string; index: number }[];
}

function maskCommentsAndStrings(code: string): Collected {
  const masked = code.split('');
  const strings: { text: string; index: number }[] = [];
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    const c2 = code[i + 1];
    if (c === '/' && c2 === '/') {
      while (i < code.length && code[i] !== '\n') masked[i++] = ' ';
      continue;
    }
    if (c === '/' && c2 === '*') {
      masked[i++] = ' ';
      masked[i++] = ' ';
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] !== '\n') masked[i] = ' ';
        i++;
      }
      if (i < code.length) {
        masked[i++] = ' ';
        masked[i++] = ' ';
      }
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      let j = i + 1;
      let buf = '';
      while (j < code.length) {
        if (code[j] === '\\') {
          buf += code[j] + (code[j + 1] ?? '');
          j += 2;
          continue;
        }
        if (code[j] === quote) break;
        buf += code[j];
        j++;
      }
      strings.push({ text: buf, index: i });
      for (let k = i; k <= Math.min(j, code.length - 1); k++) {
        if (code[k] !== '\n') masked[k] = ' ';
      }
      i = j + 1;
      continue;
    }
    i++;
  }
  return { masked: masked.join(''), strings };
}

function lineOf(code: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < code.length; i++) {
    if (code[i] === '\n') line++;
  }
  return line;
}

function forbiddenLabel(text: string): string | null {
  for (const [ch, name] of FORBIDDEN) {
    if (text.includes(ch)) return `${name} (${JSON.stringify(ch)})`;
  }
  const m = text.match(EMOJI_RE);
  if (m) return `emoji/symbol (${JSON.stringify(m[0])})`;
  return null;
}

describe('UI text guard (no decorative symbols)', () => {
  it('string literals contain no forbidden decorative characters', () => {
    const violations: string[] = [];
    for (const [file, code] of files) {
      const { strings } = maskCommentsAndStrings(code);
      for (const s of strings) {
        if (ALLOW_SUBSTRINGS.some((a) => s.text.includes(a))) continue;
        const found = forbiddenLabel(s.text);
        if (found) {
          violations.push(
            `${label(file)}:${lineOf(code, s.index)} -> ${found} :: ${s.text.slice(0, 80)}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('JSX text nodes contain no forbidden decorative characters', () => {
    const violations: string[] = [];
    const jsxText = />([^<>{}]*?)</gs;
    for (const [file, code] of files) {
      const { masked } = maskCommentsAndStrings(code);
      for (const m of masked.matchAll(jsxText)) {
        const text = m[1];
        if (!text || !text.trim()) continue;
        if (ALLOW_SUBSTRINGS.some((a) => text.includes(a))) continue;
        const found = forbiddenLabel(text);
        if (found) {
          violations.push(
            `${label(file)}:${lineOf(code, m.index ?? 0)} -> ${found} :: ${text.trim().slice(0, 80)}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('placeholder attributes and *Placeholder keys have no trailing ellipsis', () => {
    const violations: string[] = [];
    const patterns = [
      /placeholder\s*=\s*["'][^"']*\.\.\.[^"']*["']/g,
      /Placeholder\s*:\s*["'][^"']*\.\.\.[^"']*["']/g,
    ];
    for (const [file, code] of files) {
      const { masked } = maskCommentsAndStrings(code);
      for (const re of patterns) {
        for (const m of masked.matchAll(re)) {
          violations.push(
            `${label(file)}:${lineOf(code, m.index ?? 0)} :: ${m[0].slice(0, 80)}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
