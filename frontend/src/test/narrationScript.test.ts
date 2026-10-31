import { describe, it, expect } from 'vitest';
import {
  spellVietnameseNumber,
  spellVietnameseYear,
  spellEnglishNumber,
  spellEnglishYear,
  toNarrationScript,
  toDisplayText,
} from '../lib/narrationScript';

describe('T2.3 Narration Script and Display Text Quality', () => {
  describe('Vietnamese number & year spelling for TTS', () => {
    it('spells basic numbers and units', () => {
      expect(spellVietnameseNumber(50)).toBe('năm mươi');
      expect(spellVietnameseNumber(113)).toBe('một trăm mười ba');
      expect(spellVietnameseNumber(710)).toBe('bảy trăm mười');
    });

    it('spells years like 1975, 1880, 2022', () => {
      expect(spellVietnameseYear(1975)).toBe('một nghìn chín trăm bảy mươi lăm');
      expect(spellVietnameseYear(1880)).toBe('một nghìn tám trăm tám mươi');
      expect(spellVietnameseYear(2022)).toBe('hai nghìn không trăm hai mươi hai');
    });

    it('converts narration text with units and ranges', () => {
      expect(toNarrationScript('Bán kính kích hoạt 40 - 60 m quanh điểm.', 'vi')).toBe(
        'Bán kính kích hoạt bốn mươi đến sáu mươi mét quanh điểm.'
      );
      expect(toNarrationScript('Trụ tháp cao 113 m nghiêng về Thủ Thiêm.', 'vi')).toBe(
        'Trụ tháp cao một trăm mười ba mét nghiêng về Thủ Thiêm.'
      );
    });

    it('converts years and centuries in sentences', () => {
      expect(toNarrationScript('Khởi công từ thế kỷ 19 và hoàn thành năm 1975.', 'vi')).toBe(
        'Khởi công từ thế kỷ mười chín và hoàn thành năm một nghìn chín trăm bảy mươi lăm.'
      );
    });

    it('converts dates for speech synthesis', () => {
      expect(toNarrationScript('Chiến tranh kết thúc ngày 30/4/1975.', 'vi')).toBe(
        'Chiến tranh kết thúc ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm.'
      );
    });
  });

  describe('English number & year spelling for TTS', () => {
    it('spells numbers and units', () => {
      expect(spellEnglishNumber(50)).toBe('fifty');
      expect(spellEnglishNumber(113)).toBe('one hundred and thirteen');
    });

    it('spells years like 1975, 1880, 2022', () => {
      expect(spellEnglishYear(1975)).toBe('nineteen seventy-five');
      expect(spellEnglishYear(1880)).toBe('eighteen eighty');
      expect(spellEnglishYear(2022)).toBe('twenty twenty-two');
    });

    it('converts units, ranges and centuries in English sentences', () => {
      expect(toNarrationScript('Trigger radius is 40 - 60 m around each stop.', 'en')).toBe(
        'Trigger radius is forty to sixty meters around each stop.'
      );
      expect(toNarrationScript('Built in the 19th century and completed in 1975.', 'en')).toBe(
        'Built in the nineteenth century and completed in nineteen seventy-five.'
      );
      expect(toNarrationScript('Features a 113-meter tower built in the 1960s.', 'en')).toBe(
        'Features a one hundred and thirteen meters tower built in the nineteen sixties.'
      );
    });
  });

  describe('Untouched foreign languages (ko, ja)', () => {
    it('keeps Japanese text completely untouched', () => {
      const jaText = '1975年4月30日、戦車が正門を突破しました。';
      expect(toNarrationScript(jaText, 'ja')).toBe(jaText);
      expect(toDisplayText(jaText, 'ja')).toBe(jaText);
    });

    it('keeps Korean text completely untouched', () => {
      const koText = '1975년 4월 30일 통일궁 정문을 통과했습니다.';
      expect(toNarrationScript(koText, 'ko')).toBe(koText);
      expect(toDisplayText(koText, 'ko')).toBe(koText);
    });
  });

  describe('toDisplayText keeps natural formatting for reading', () => {
    it('reverses spelled out years to natural numerals for Vietnamese display', () => {
      const rawVi =
        'Tòa nhà xây dựng năm một nghìn chín trăm sáu mươi sáu, gắn liền với ngày 30 tháng 4 năm một nghìn chín trăm bảy mươi lăm.';
      const displayed = toDisplayText(rawVi, 'vi');
      expect(displayed).toContain('năm 1966');
      expect(displayed).toContain('năm 1975');
    });

    it('reverses spelled out years to natural numerals for English display', () => {
      const rawEn = 'Completed in nineteen sixty-six, witnessed reunification in nineteen seventy-five.';
      const displayed = toDisplayText(rawEn, 'en');
      expect(displayed).toContain('in 1966');
      expect(displayed).toContain('in 1975');
    });
  });
});
