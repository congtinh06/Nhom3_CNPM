import { describe, it, expect } from 'vitest';
import { buildPoiSections } from '../lib/poiSections';

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
