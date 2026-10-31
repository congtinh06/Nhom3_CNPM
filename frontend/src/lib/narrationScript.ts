import { SupportedLanguage } from '../types';

/**
 * Numbers spelled out in Vietnamese
 */
const VI_ONES = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

export function spellVietnameseNumber(n: number): string {
  if (n < 0 || !Number.isInteger(n)) return String(n);
  if (n < 10) return VI_ONES[n]!;
  if (n < 20) {
    if (n === 10) return 'mười';
    if (n === 15) return 'mười lăm';
    return `mười ${VI_ONES[n % 10]}`;
  }
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const tensStr = tens === 2 ? 'hai mươi' : `${VI_ONES[tens]} mươi`;
    if (ones === 0) return tensStr;
    if (ones === 1) return `${tensStr} mốt`;
    if (ones === 4) return `${tensStr} tư`;
    if (ones === 5) return `${tensStr} lăm`;
    return `${tensStr} ${VI_ONES[ones]}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    const hundredsStr = `${VI_ONES[hundreds]} trăm`;
    if (rem === 0) return hundredsStr;
    if (rem < 10) return `${hundredsStr} lẻ ${VI_ONES[rem]}`;
    return `${hundredsStr} ${spellVietnameseNumber(rem)}`;
  }
  if (n < 10000) {
    const thousands = Math.floor(n / 1000);
    const rem = n % 1000;
    const thousandsStr = `${spellVietnameseNumber(thousands)} nghìn`;
    if (rem === 0) return thousandsStr;
    if (rem < 100) return `${thousandsStr} không trăm ${rem < 10 ? 'lẻ ' + VI_ONES[rem] : spellVietnameseNumber(rem)}`;
    return `${thousandsStr} ${spellVietnameseNumber(rem)}`;
  }
  return String(n);
}

/**
 * Spells out standard 4-digit years in Vietnamese (e.g. 1975 -> "một nghìn chín trăm bảy mươi lăm")
 */
export function spellVietnameseYear(year: number): string {
  return spellVietnameseNumber(year);
}

/**
 * Numbers spelled out in English
 */
const EN_ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'
];

const EN_TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

export function spellEnglishNumber(n: number): string {
  if (n < 0 || !Number.isInteger(n)) return String(n);
  if (n < 20) return EN_ONES[n]!;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return ones === 0 ? EN_TENS[tens]! : `${EN_TENS[tens]}-${EN_ONES[ones]}`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    const hundredsStr = `${EN_ONES[hundreds]} hundred`;
    return rem === 0 ? hundredsStr : `${hundredsStr} and ${spellEnglishNumber(rem)}`;
  }
  return String(n);
}

export function spellEnglishYear(year: number): string {
  if (year >= 1000 && year < 2000) {
    const century = Math.floor(year / 100);
    const rem = year % 100;
    const cStr = spellEnglishNumber(century);
    if (rem === 0) return `${cStr} hundred`;
    if (rem < 10) return `${cStr} o-${EN_ONES[rem]}`;
    return `${cStr} ${spellEnglishNumber(rem)}`;
  }
  if (year >= 2000 && year < 2100) {
    const rem = year % 100;
    if (rem === 0) return 'two thousand';
    if (rem < 10) return `two thousand ${EN_ONES[rem]}`;
    return `twenty ${spellEnglishNumber(rem)}`;
  }
  return String(year);
}

/**
 * Converts TTS spoken text: spells out years, numbers, ordinals, ranges, units.
 * Leaves ja, ko untouched.
 */
export function toNarrationScript(text: string, lang: SupportedLanguage): string {
  if (!text || (lang !== 'vi' && lang !== 'en')) {
    return text;
  }

  if (lang === 'vi') {
    let out = text;
    // Ranges: 40 - 60 m -> 40 đến 60 mét
    out = out.replace(/(\d+)\s*[-–]\s*(\d+)\s*(m|mét)\b/gi, (_, a, b) => {
      return `${spellVietnameseNumber(Number(a))} đến ${spellVietnameseNumber(Number(b))} mét`;
    });

    // Units: "113 m" or "50 mét"
    out = out.replace(/(\d+)\s*(m|mét)\b/gi, (_, num) => {
      return `${spellVietnameseNumber(Number(num))} mét`;
    });

    // Dates: "30/4/1975" -> "ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm"
    out = out.replace(/(?:ngày\s+)?(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (_, day, month, year) => {
      const monthNames = ['', 'một', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai'];
      const mStr = monthNames[Number(month)] || spellVietnameseNumber(Number(month));
      return `ngày ${spellVietnameseNumber(Number(day))} tháng ${mStr} năm ${spellVietnameseYear(Number(year))}`;
    });

    // Dates: "30/4" -> "ngày ba mươi tháng tư"
    out = out.replace(/(?:ngày\s+)?\b(\d{1,2})\/(\d{1,2})\b/g, (_, day, month) => {
      const monthNames = ['', 'một', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai'];
      const mStr = monthNames[Number(month)] || spellVietnameseNumber(Number(month));
      return `ngày ${spellVietnameseNumber(Number(day))} tháng ${mStr}`;
    });

    // Centuriess: "thế kỷ 19" -> "thế kỷ mười chín", "thế kỷ XIX" -> "thế kỷ mười chín"
    out = out.replace(/thế kỷ\s+(\d{1,2})\b/gi, (_, c) => {
      return `thế kỷ ${spellVietnameseNumber(Number(c))}`;
    });

    // Years: "năm 1975" -> "năm một nghìn chín trăm bảy mươi lăm"
    out = out.replace(/\b(năm|năm\s+khoảng|khoảng\s+năm)\s+(\d{4})\b/gi, (_, prefix, year) => {
      return `${prefix} ${spellVietnameseYear(Number(year))}`;
    });

    return out;
  }

  // English
  let out = text;
  // Ranges: "40 - 60 m" / "40 to 60 meters"
  out = out.replace(/(\d+)\s*[-–]\s*(\d+)\s*(m|meters|metres)\b/gi, (_, a, b) => {
    return `${spellEnglishNumber(Number(a))} to ${spellEnglishNumber(Number(b))} meters`;
  });

  // Units: "113 m", "113-meter", "50 meters"
  out = out.replace(/(\d+)\s*[-]?\s*(m|meter|meters|metres)\b/gi, (_, num) => {
    const val = Number(num);
    return `${spellEnglishNumber(val)} ${val === 1 ? 'meter' : 'meters'}`;
  });

  // Centuries: "19th century", "20th century"
  out = out.replace(/\b(\d+)(st|nd|rd|th)\s+century\b/gi, (_, num) => {
    const ordinals: Record<number, string> = {
      18: 'eighteenth', 19: 'nineteenth', 20: 'twentieth', 21: 'twenty-first'
    };
    const n = Number(num);
    return `${ordinals[n] || spellEnglishNumber(n) + 'th'} century`;
  });

  // Decades: "1960s" -> "nineteen sixties"
  out = out.replace(/\b19(\d)0s\b/g, (_, d) => {
    const decades: Record<string, string> = {
      '5': 'fifties', '6': 'sixties', '7': 'seventies', '8': 'eighties', '9': 'nineties'
    };
    return `nineteen ${decades[d] || 'sixties'}`;
  });

  // Years: "in 1975" -> "in nineteen seventy-five"
  out = out.replace(/\b(in|since|until|around|year)\s+(\d{4})\b/gi, (_, prefix, year) => {
    return `${prefix} ${spellEnglishYear(Number(year))}`;
  });

  return out;
}

/**
 * Natural reading text for display on UI (keeps numerals, digits, e.g. "năm 1975", "113 m").
 * Reverses spelled out numbers in source text to natural reading numerals.
 */
export function toDisplayText(text: string, lang: SupportedLanguage): string {
  if (!text) return '';
  if (lang !== 'vi' && lang !== 'en') return text;

  if (lang === 'vi') {
    let out = text;
    out = out.replace(/năm một nghìn chín trăm bảy mươi lăm/gi, 'năm 1975');
    out = out.replace(/năm một nghìn tám trăm tám mươi/gi, 'năm 1880');
    out = out.replace(/năm một nghìn tám trăm sáu mươi ba/gi, 'năm 1863');
    out = out.replace(/năm một nghìn tám trăm chín mươi lăm/gi, 'năm 1895');
    out = out.replace(/năm một nghìn tám trăm tám mươi sáu/gi, 'năm 1886');
    out = out.replace(/năm một nghìn tám trăm chín mươi mốt/gi, 'năm 1891');
    out = out.replace(/năm một nghìn chín trăm năm mươi tư/gi, 'năm 1954');
    out = out.replace(/năm một nghìn chín trăm năm mươi chín/gi, 'năm 1959');
    out = out.replace(/năm một nghìn chín trăm sáu mươi hai/gi, 'năm 1962');
    out = out.replace(/năm một nghìn chín trăm sáu mươi sáu/gi, 'năm 1966');
    out = out.replace(/năm một nghìn chín trăm mười hai/gi, 'năm 1912');
    out = out.replace(/năm một nghìn chín trăm mười bốn/gi, 'năm 1914');
    out = out.replace(/năm hai nghìn không trăm lẻ chín/gi, 'năm 2009');
    out = out.replace(/năm hai nghìn không trăm hai mươi hai/gi, 'năm 2022');
    out = out.replace(/những năm sáu mươi/gi, 'thập niên 1960');
    out = out.replace(/thế kỷ mười chín/gi, 'thế kỷ 19');
    out = out.replace(/thế kỷ hai mươi/gi, 'thế kỷ 20');
    out = out.replace(/ngày ba mươi tháng tư năm 1975/gi, 'ngày 30/4/1975');
    out = out.replace(/ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm/gi, 'ngày 30/4/1975');
    return out;
  }

  // English natural display
  let out = text;
  out = out.replace(/in nineteen seventy-five/gi, 'in 1975');
  out = out.replace(/in nineteen sixty-six/gi, 'in 1966');
  out = out.replace(/in eighteen eighty/gi, 'in 1880');
  out = out.replace(/in nineteen fourteen/gi, 'in 1914');
  out = out.replace(/in nineteen sixty-two/gi, 'in 1962');
  out = out.replace(/in two thousand nine/gi, 'in 2009');
  out = out.replace(/in the nineteen sixties/gi, 'in the 1960s');
  out = out.replace(/in the nineteenth century/gi, 'in the 19th century');
  out = out.replace(/thirtieth of April, nineteen seventy-five/gi, 'April 30, 1975');
  return out;
}
