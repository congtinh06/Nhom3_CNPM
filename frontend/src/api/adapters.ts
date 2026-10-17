import { ApiNewsListItem, ApiNewsDetail, ApiNewsListResponse } from '../types/api';
import { NewsItem, NewsDetail, NewsListDomain, NewsCategory } from '../types/domain';

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'diem-den',
  'van-hoa',
  'meo-tham-quan',
  'trang-phuc',
  've-dep',
]);
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if a date ISO string is within the last 24 hours (relative to now)
 */
export function isWithin24Hours(dateStr?: string, nowMs = Date.now()): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr).getTime();
  if (Number.isNaN(parsed)) return false;
  const diff = nowMs - parsed;
  return diff >= 0 && diff <= TWENTY_FOUR_HOURS_MS;
}

/**
 * Checks if a date ISO string is within the last 48 hours (relative to now)
 */
export function isWithin48Hours(dateStr?: string, nowMs = Date.now()): boolean {
  if (!dateStr) return false;
  const parsed = new Date(dateStr).getTime();
  if (Number.isNaN(parsed)) return false;
  const diff = nowMs - parsed;
  return diff >= 0 && diff <= FORTY_EIGHT_HOURS_MS;
}

/**
 * Adapts a raw API news list item to a clean domain model.
 * Guarantees no 'undefined' values will bleed into UI.
 */
export function adaptNewsItem(
  raw?: Partial<ApiNewsListItem> & {
    source?: string;
    sourceUrl?: string;
    externalUrl?: string | null;
    thumbnail?: string | null;
    excerpt?: string;
    tags?: string[];
    readingTime?: number;
  } | null,
  nowMs = Date.now()
): NewsItem {
  const safeId = raw?.id != null ? String(raw.id) : `fallback-${Math.random().toString(36).slice(2, 8)}`;
  const safeTitle = (raw?.title ?? '').trim();
  const safeSlug = (raw?.slug ?? safeId).trim();

  const rawCat = (raw?.category ?? '').trim();
  const safeCategory: NewsCategory = VALID_CATEGORIES.has(rawCat)
    ? (rawCat as NewsCategory)
    : 'diem-den';

  const safeSummary = (raw?.summary ?? raw?.excerpt ?? '').trim();
  const rawCover = (raw?.coverImageUrl ?? raw?.thumbnail ?? '').trim();
  const safeCoverImageUrl = rawCover ? rawCover : null;

  const rawAlt = (raw?.coverImageAlt ?? '').trim();
  const safeCoverImageAlt = rawAlt || safeTitle || 'Hình ảnh bài viết';

  const rawCredit = (raw?.imageCredit ?? raw?.source ?? '').trim();
  const safeImageCredit = rawCredit ? rawCredit : null;

  const rawDate = (raw?.publishedAt ?? '').trim();
  const safePublishedAt = rawDate || new Date(nowMs).toISOString();

  const numMinutes = Number(raw?.readingMinutes ?? raw?.readingTime);
  const safeReadingMinutes = Number.isFinite(numMinutes) && numMinutes > 0 ? Math.round(numMinutes) : 3;

  const rawAudio = (raw?.audioUrl ?? '').trim();
  const safeAudioUrl = rawAudio ? rawAudio : null;

  const rawPois = raw?.relatedPoiSlugs;
  const safeRelatedPoiSlugs: string[] = Array.isArray(rawPois)
    ? rawPois.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    : [];

  const rawTags = raw?.tags;
  const safeTags: string[] = Array.isArray(rawTags)
    ? rawTags.slice(0, 2).map((t) => String(t).trim()).filter(Boolean)
    : safeRelatedPoiSlugs.slice(0, 2);

  const safeSource = (raw?.source || 'Echora').trim();
  const rawExternal = (raw?.externalUrl ?? raw?.sourceUrl ?? '').trim();
  const safeExternalUrl = rawExternal ? rawExternal : null;
  const safeSourceUrl = safeExternalUrl ?? '';

  const isNew = isWithin48Hours(safePublishedAt, nowMs);

  return {
    id: safeId,
    slug: safeSlug,
    title: safeTitle,
    source: safeSource,
    sourceUrl: safeSourceUrl,
    externalUrl: safeExternalUrl,
    publishedAt: safePublishedAt,
    thumbnail: safeCoverImageUrl,
    coverImageUrl: safeCoverImageUrl,
    coverImageAlt: safeCoverImageAlt,
    imageCredit: safeImageCredit,
    excerpt: safeSummary,
    summary: safeSummary,
    category: safeCategory,
    tags: safeTags,
    readingTime: safeReadingMinutes,
    readingMinutes: safeReadingMinutes,
    audioUrl: safeAudioUrl,
    relatedPoiSlugs: safeRelatedPoiSlugs,
    isNew,
  };
}

/**
 * Adapts raw detail payload into domain NewsDetail
 */
export function adaptNewsDetail(
  raw?: Partial<ApiNewsDetail> & {
    source?: string;
    sourceUrl?: string;
    externalUrl?: string | null;
    thumbnail?: string | null;
    excerpt?: string;
    tags?: string[];
    readingTime?: number;
  } | null,
  nowMs = Date.now()
): NewsDetail {
  const baseItem = adaptNewsItem(raw, nowMs);
  const safeContent = (raw?.content ?? baseItem.excerpt ?? '').trim();

  return {
    ...baseItem,
    content: safeContent,
  };
}

/**
 * Adapts list response payload into domain NewsListDomain
 */
export function adaptNewsListResponse(
  raw?: Partial<ApiNewsListResponse> | null,
  nowMs = Date.now()
): NewsListDomain {
  const rawItems = Array.isArray(raw?.items) ? raw.items : [];
  const items = rawItems
    .filter((item): item is ApiNewsListItem => item != null && typeof item === 'object')
    .map((item) => adaptNewsItem(item, nowMs));

  const rawAnn = (raw?.announcement ?? '').trim();
  const announcement = rawAnn ? rawAnn : null;

  return {
    items,
    announcement,
  };
}
