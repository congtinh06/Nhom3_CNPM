import { SupportedLanguage } from '../types';

const DIGITS: Record<string, number> = {
  không: 0,
  một: 1,
  mốt: 1,
  hai: 2,
  ba: 3,
  bốn: 4,
  tư: 4,
  năm: 5,
  lăm: 5,
  nhăm: 5,
  sáu: 6,
  bảy: 7,
  tám: 8,
  chín: 9,
};

const NUMBER_WORD =
  'không|một|mốt|hai|ba|bốn|tư|năm|lăm|nhăm|sáu|bảy|tám|chín|mười|mươi|trăm|nghìn|ngàn|lẻ|linh';

const YEAR_PATTERN = new RegExp(
  `(^|[\\s(])(thế kỷ|những năm|năm)((?:\\s+(?:${NUMBER_WORD}))+)`,
  'gi'
);

function parseVietnameseNumber(words: string[]): number | null {
  if (words.length === 0) return null;
  if (['mươi', 'trăm', 'nghìn', 'ngàn', 'lẻ', 'linh'].includes((words[0] ?? '').toLowerCase())) {
    return null;
  }

  let total = 0;
  let current = 0;

  for (let i = 0; i < words.length; i += 1) {
    const word = (words[i] ?? '').toLowerCase();

    if (word in DIGITS) {
      const digit = DIGITS[word] as number;
      const next = words[i + 1]?.toLowerCase();
      if (next === 'mươi') {
        current += digit * 10;
        i += 1;
      } else if (next === 'trăm') {
        current += digit * 100;
        i += 1;
      } else {
        current += digit;
      }
      continue;
    }

    if (word === 'mười') {
      current += 10;
    } else if (word === 'trăm') {
      current += 100;
    } else if (word === 'nghìn' || word === 'ngàn') {
      total += (current || 1) * 1000;
      current = 0;
    } else if (word !== 'lẻ' && word !== 'linh') {
      return null;
    }
  }

  return total + current;
}

/**
 * Display-only normalization for years and centuries written in words.
 *
 * Only sequences immediately following "năm", "những năm" or "thế kỷ" are
 * considered, and they must parse as a plausible year/century. Everything else
 * (names, addresses, quantities) is left untouched.
 */
export function formatNarrationNumerals(text: string, lang: SupportedLanguage): string {
  if (lang !== 'vi' || !text) return text;

  return text.replace(YEAR_PATTERN, (match, separator, prefix, rawWords) => {
    const words = rawWords.trim().split(/\s+/);
    const parsed = parseVietnameseNumber(words);
    if (parsed === null) return match;

    const prefixKey = prefix.toLowerCase();
    let value = parsed;

    if (prefixKey === 'những năm' && parsed < 100) {
      value = 1900 + parsed;
    }

    const isCentury = prefixKey === 'thế kỷ';
    const isPlausible = isCentury
      ? value >= 1 && value <= 21
      : value >= 1000 && value <= 2100;

    return isPlausible ? `${separator}${prefix} ${value}` : match;
  });
}
