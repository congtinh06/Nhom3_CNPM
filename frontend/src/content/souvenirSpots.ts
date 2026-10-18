import { SupportedLanguage } from '../types';

export interface SouvenirSpot {
  slug: string;
  name: Record<SupportedLanguage, string>;
}

export const SOUVENIR_SPOTS: SouvenirSpot[] = [
  {
    slug: 'dinh-doc-lap',
    name: {
      vi: 'Dinh Độc Lập',
      en: 'Independence Palace',
      ja: '統一会堂',
      ko: '통일궁',
    },
  },
  {
    slug: 'nha-tho-duc-ba',
    name: {
      vi: 'Nhà thờ Đức Bà Sài Gòn',
      en: 'Notre Dame Cathedral of Saigon',
      ja: 'サイゴン大聖堂',
      ko: '사이공 노트르담 대성당',
    },
  },
  {
    slug: 'buu-dien-trung-tam',
    name: {
      vi: 'Bưu điện Trung tâm Sài Gòn',
      en: 'Saigon Central Post Office',
      ja: 'サイゴン中央郵便局',
      ko: '사이공 중앙 우체국',
    },
  },
  {
    slug: 'cho-ben-thanh',
    name: {
      vi: 'Chợ Bến Thành',
      en: 'Ben Thanh Market',
      ja: 'ベンタイン市場',
      ko: '벤탄 시장',
    },
  },
  {
    slug: 'bao-tang-chung-tich-chien-tranh',
    name: {
      vi: 'Bảo tàng Chứng tích Chiến tranh',
      en: 'War Remnants Museum',
      ja: '戦争証跡博物館',
      ko: '전쟁 증적 박물관',
    },
  },
  {
    slug: 'chua-ba-thien-hau',
    name: {
      vi: 'Chùa Bà Thiên Hậu',
      en: 'Thien Hau Temple',
      ja: '天后宮',
      ko: '티엔하우 사원',
    },
  },
  {
    slug: 'cau-ba-son',
    name: {
      vi: 'Cầu Ba Son',
      en: 'Ba Son Bridge',
      ja: 'バーソン橋',
      ko: '바선 대교',
    },
  },
];

const spotBySlug = new Map(SOUVENIR_SPOTS.map((spot) => [spot.slug, spot]));

export function getSpotName(slug: string | null | undefined, lang: SupportedLanguage): string {
  if (!slug) return '';
  const spot = spotBySlug.get(slug);
  if (!spot) return slug;
  return spot.name[lang] || spot.name.vi;
}
