import { describe, it, expect } from 'vitest';
import { buildPoiSections } from '../lib/poiSections';
import { formatNarrationNumerals } from '../lib/numerals';

describe('buildPoiSections (Hạng mục 4)', () => {
  it('auto-splits existing paragraphs and reuses the cover image on the first section only', () => {
    const poi = { image: '/images/pois/dinh-doc-lap.jpg' };
    const sections = buildPoiSections(poi, 'vi', ['Đoạn một.', 'Đoạn hai.']);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({ text: 'Đoạn một.', image: '/images/pois/dinh-doc-lap.jpg' });
    expect(sections[1]).toMatchObject({ text: 'Đoạn hai.', image: '' });
  });

  it('prefers explicit sections, localizes text and falls back to Vietnamese', () => {
    const poi = {
      image: '/images/pois/cover.jpg',
      sections: [
        {
          text: { vi: 'Xin chào', en: 'Hello' },
          image: '/images/pois/dinh-doc-lap/1.webp',
          caption: { en: 'Facade' },
          alt: { en: 'Palace facade' },
        },
        { text: { vi: 'Chỉ tiếng Việt' } },
      ],
    };

    const en = buildPoiSections(poi, 'en', ['ignored']);
    expect(en[0]).toMatchObject({
      text: 'Hello',
      image: '/images/pois/dinh-doc-lap/1.webp',
      caption: 'Facade',
      alt: 'Palace facade',
    });
    expect(en[1]!.text).toBe('Chỉ tiếng Việt');

    const ja = buildPoiSections(poi, 'ja', ['ignored']);
    expect(ja[0]!.text).toBe('Xin chào');
  });

  it('drops sections without any text', () => {
    const poi = { image: '', sections: [{ text: { vi: '' } }, { text: { vi: 'Có chữ' } }] };
    const sections = buildPoiSections(poi, 'vi', []);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.text).toBe('Có chữ');
  });
});

describe('formatNarrationNumerals', () => {
  it('converts years written in words after "năm"', () => {
    expect(
      formatNarrationNumerals(
        'Xe tăng tiến vào ngày ba mươi tháng tư năm một nghìn chín trăm bảy mươi lăm.',
        'vi'
      )
    ).toBe('Xe tăng tiến vào ngày ba mươi tháng tư năm 1975.');
  });

  it('converts centuries after "thế kỷ"', () => {
    expect(formatNarrationNumerals('Xây dựng từ thế kỷ mười chín.', 'vi')).toBe(
      'Xây dựng từ thế kỷ 19.'
    );
  });

  it('converts decades after "những năm"', () => {
    expect(formatNarrationNumerals('Tòa nhà được xây vào những năm sáu mươi.', 'vi')).toBe(
      'Tòa nhà được xây vào những năm 1960.'
    );
  });

  it('leaves quantities, names and other languages untouched', () => {
    expect(formatNarrationNumerals('Có một nghìn người tại Quận Một.', 'vi')).toBe(
      'Có một nghìn người tại Quận Một.'
    );
    expect(formatNarrationNumerals('Built in nineteen seventy-five.', 'en')).toBe(
      'Built in nineteen seventy-five.'
    );
  });
});
