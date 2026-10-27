/**
 * ============================================================================
 * ADAPTER CHUYỂN ĐỔI DỮ LIỆU ĐỊA ĐIỂM (POI Guide Adapter)
 * ============================================================================
 * 
 * Mục đích module:
 * - Chuyển đổi dữ liệu POI từ DB/API (PoiGuide) thành GeoPoi phục vụ giao diện du khách.
 * - Hợp nhất dữ liệu động từ backend với dữ liệu tĩnh mẫu (fallback từ nearbyPois.json).
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Audio Fallback]: Đảm bảo nếu API chưa có URL âm thanh riêng cho ngoại ngữ thì tự động
 *    lấy fallback từ dữ liệu chuẩn (`fallback.audio[lang]`), không để link âm thanh rỗng.
 * 2. [Cấu trúc phân đoạn]: Xử lý trích xuất `chapters` và `narration.full` cho 4 ngôn ngữ, phục vụ
 *    việc đồng bộ đoạn đọc và tiêu đề từng phần trên giao diện.
 * ============================================================================
 */

import type { GeoPoi, NarrationChapterBlock } from '../pages/NearbyPage';
import { PoiGuide, SupportedLanguage } from '../types';
import nearbyPoisData from './nearbyPois.json';

const LANGS: SupportedLanguage[] = ['vi', 'en', 'ja', 'ko'];

/**
 * Nhãn danh mục theo ngôn ngữ, dùng khi POI mới chưa có bản dịch danh mục.
 * (API công khai chỉ trả categoryCode + tên tiếng Việt.)
 */
const CATEGORY_LABELS: Record<string, Record<SupportedLanguage, string>> = {
  HISTORIC: {
    vi: 'Di tích lịch sử',
    en: 'Historical Landmark',
    ja: '歴史的建造物',
    ko: '역사 유적지',
  },
  ARCHITECTURE: {
    vi: 'Kiến trúc & Nghệ thuật',
    en: 'Architecture & Art',
    ja: '建築・芸術',
    ko: '건축 & 예술',
  },
  FOOD: {
    vi: 'Ẩm thực & Chợ truyền thống',
    en: 'Food & Market',
    ja: 'グルメ・市場',
    ko: '음식 & 시장',
  },
  RELIGION: {
    vi: 'Tín ngưỡng & Tôn giáo',
    en: 'Religion & Culture',
    ja: '信仰・宗教',
    ko: '신앙 & 종교',
  },
};

function splitParagraphs(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function emptyByLang(): Record<SupportedLanguage, string> {
  return { vi: '', en: '', ja: '', ko: '' };
}

function emptyNarration() {
  return {
    short: emptyByLang(),
    full: { vi: [], en: [], ja: [], ko: [] } as Partial<Record<SupportedLanguage, string[]>>,
    chapters: { vi: [], en: [], ja: [], ko: [] } as Partial<
      Record<SupportedLanguage, NarrationChapterBlock[]>
    >,
  };
}

function deriveSlug(guide: PoiGuide): string {
  if (guide.slug) return guide.slug;
  const base = guide.code || guide.qrToken || String(guide.id);
  return base
    .toLowerCase()
    .replace(/^poi[-_]?/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Bản ghi tĩnh cũ (nearbyPois.json) chỉ dùng để bù các ngôn ngữ DB chưa có (ví dụ ja/ko). */
const staticPois = nearbyPoisData as unknown as GeoPoi[];

function findStatic(guide: PoiGuide): GeoPoi | undefined {
  return staticPois.find(
    (p) =>
      (guide.slug && p.slug === guide.slug) ||
      (guide.qrToken && p.qrToken === guide.qrToken) ||
      p.id === String(guide.id)
  );
}

/**
 * Gộp POI từ API (nguồn chung với admin) thành GeoPoi cho trang du khách.
 * DB là nguồn chính; ngôn ngữ DB chưa có sẽ lấy bù từ dữ liệu tĩnh cũ (không hồi quy ja/ko).
 */
export function mapGuideToGeoPoi(guide: PoiGuide): GeoPoi {
  const fallback = findStatic(guide);
  const slug = deriveSlug(guide);

  const name: Record<SupportedLanguage, string> = emptyByLang();
  const category: Record<SupportedLanguage, string> = emptyByLang();
  const transcript: Record<SupportedLanguage, string> = emptyByLang();
  const description: Record<SupportedLanguage, string> = emptyByLang();
  const narration = emptyNarration();
  const audio: Record<SupportedLanguage, string | number> = emptyByLang();
  const audioStatusByLanguage: Record<SupportedLanguage, string | null> = emptyByLang();

  for (const lang of LANGS) {
    const tr = guide.translations?.[lang];
    const trTitle = tr?.title?.trim();
    const trSummary = tr?.summary?.trim();
    const trDescription = tr?.description?.trim();
    const trHistorical = tr?.historicalSignificance?.trim();

    name[lang] = trTitle || fallback?.name?.[lang] || guide.name;

    category[lang] =
      fallback?.category?.[lang] ||
      CATEGORY_LABELS[guide.categoryCode]?.[lang] ||
      guide.categoryNameVi ||
      '';

    const text = trDescription || trHistorical || fallback?.transcript?.[lang] || '';
    transcript[lang] = text;
    description[lang] = text;

    const shortText = trSummary || fallback?.narration?.short?.[lang] || text;
    if (shortText) narration.short[lang] = shortText;

    audio[lang] = tr?.audioUrl || fallback?.audio?.[lang] || '';
    audioStatusByLanguage[lang] = tr?.audioStatus ?? null;

    const dbChapters = tr?.chapters ?? [];
    if (dbChapters.length > 0) {
      // DB trả về phân đoạn (chap): nguồn chính của bài thuyết minh theo ngôn ngữ.
      const chapterBlocks: NarrationChapterBlock[] = dbChapters
        .map((chapter) => ({
          title: (chapter.title || '').trim(),
          paras: splitParagraphs(chapter.narrationText),
        }))
        .filter((chapter) => chapter.title || chapter.paras.length > 0);
      if (chapterBlocks.length > 0) {
        narration.chapters[lang] = chapterBlocks;
        narration.full[lang] = chapterBlocks.flatMap((chapter) => chapter.paras);
        if (!narration.short[lang]) {
          const firstPara = chapterBlocks[0]?.paras[0] ?? '';
          if (firstPara) narration.short[lang] = firstPara;
        }
        continue;
      }
    }

    const fullParas = splitParagraphs(trDescription);
    if (fullParas.length > 0) {
      narration.full[lang] = fullParas;
    } else if (fallback?.narration?.full?.[lang]?.length) {
      narration.full[lang] = fallback.narration.full[lang];
    } else if (text) {
      narration.full[lang] = [text];
    }
  }

  const viTr = guide.translations?.vi;
  const audioUrl = viTr?.audioUrl ?? fallback?.audioUrl ?? null;
  const audioStatus = viTr?.audioStatus ?? fallback?.audioStatus ?? 'PENDING';

  return {
    id: String(guide.id),
    numericId: guide.id,
    premiumPrice: guide.premiumPrice ?? null,
    qrToken: guide.qrToken,
    name,
    lat: Number(guide.latitude),
    lng: Number(guide.longitude),
    triggerRadius: guide.triggerRadiusMeters ?? 60,
    category,
    image: guide.thumbnailUrl || fallback?.image || '',
    audio,
    audioStatusByLanguage,
    audioUrl,
    audioStatus,
    transcript,
    narration,
    stopOrder: guide.stopOrder ?? fallback?.stopOrder ?? undefined,
    slug,
    description,
  };
}

export function mapGuidesToGeoPois(guides: PoiGuide[]): GeoPoi[] {
  return guides.map(mapGuideToGeoPoi);
}
