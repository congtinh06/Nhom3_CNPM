import { describe, it, expect } from 'vitest';
import { matchesSearch, removeDiacritics } from '../content/searchUtils';

describe('searchUtils', () => {
  describe('removeDiacritics', () => {
    it('normalizes Vietnamese characters with accents', () => {
      expect(removeDiacritics('Dinh Độc Lập')).toBe('dinh doc lap');
      expect(removeDiacritics('Chợ Bến Thành')).toBe('cho ben thanh');
      expect(removeDiacritics('Cà phê sữa đá')).toBe('ca phe sua da');
    });
  });

  describe('matchesSearch', () => {
    it('matches text case-insensitively and diacritic-insensitively', () => {
      const target = 'Dinh Độc Lập - Di tích lịch sử nổi tiếng';

      expect(matchesSearch(target, 'dinh')).toBe(true);
      expect(matchesSearch(target, 'doc lap')).toBe(true);
      expect(matchesSearch(target, 'ĐỘC LẬP')).toBe(true);
      expect(matchesSearch(target, 'lich su')).toBe(true);
      expect(matchesSearch(target, 'hà nội')).toBe(false);
    });

    it('returns true for empty or whitespace query', () => {
      expect(matchesSearch('Bất kỳ địa điểm nào', '')).toBe(true);
      expect(matchesSearch('Bất kỳ địa điểm nào', '   ')).toBe(true);
    });
  });
});
