import { RSS_FEED_SOURCES, classifyArticleCategory } from '../config/rssCategories';
import { ApiNewsDetail } from '../types/api';

// Cache configuration: 20 minutes (between 15-30 min)
const CACHE_DURATION_MS = 20 * 60 * 1000;

interface CacheStore {
  articles: ApiNewsDetail[];
  timestamp: number;
}

let inMemoryCache: CacheStore | null = null;

async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching ${url}`);
  }

  return await res.text();
}

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(itemXml: string, tagName: string): string {
  const match = itemXml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match && match[1] ? cleanHtmlEntities(match[1]) : '';
}

function extractImage(itemXml: string): string | null {
  // 1. Enclosure
  const encMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (encMatch && encMatch[1]) return encMatch[1].replace(/&amp;/g, '&');

  // 2. Media content
  const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch && mediaMatch[1]) return mediaMatch[1].replace(/&amp;/g, '&');

  // 3. Img tag in description or CDATA
  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) return imgMatch[1].replace(/&amp;/g, '&');

  return null;
}

function stringToHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

export async function fetchAndCacheRssArticles(): Promise<ApiNewsDetail[]> {
  const now = Date.now();

  if (inMemoryCache && now - inMemoryCache.timestamp < CACHE_DURATION_MS) {
    return inMemoryCache.articles;
  }

  const collectedArticles: ApiNewsDetail[] = [];
  const seenUrls = new Set<string>();

  for (const feed of RSS_FEED_SOURCES) {
    try {
      const xml = await fetchUrl(feed.url);
      const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const block of itemBlocks) {
        let link = extractTag(block, 'link');
        // Handle raw link tag that might not have closing tag or was enclosed
        if (!link) {
          const rawLinkMatch = block.match(/<link>([^<]+)/i);
          if (rawLinkMatch && rawLinkMatch[1]) link = rawLinkMatch[1].trim();
        }

        if (!link || seenUrls.has(link)) continue;

        const title = extractTag(block, 'title');
        const description = extractTag(block, 'description');
        if (!title) continue;

        const category = classifyArticleCategory(title, description);
        if (!category) continue; // Unmatched articles are dropped

        seenUrls.add(link);

        const pubDateRaw = extractTag(block, 'pubDate');
        let publishedAt = new Date().toISOString();
        if (pubDateRaw) {
          const parsedDate = new Date(pubDateRaw);
          if (!Number.isNaN(parsedDate.getTime())) {
            publishedAt = parsedDate.toISOString();
          }
        }

        const idHash = stringToHash(link);
        const slugBase = slugify(title);
        const slug = slugBase ? `${slugBase}-${idHash}` : `bai-viet-${idHash}`;

        const thumbnail = extractImage(block);
        const words = (title + ' ' + description).split(/\s+/).length;
        const readingMinutes = Math.max(2, Math.min(8, Math.round(words / 45)));

        const derivedTags: string[] = [];
        if (category === 'diem-den') derivedTags.push('Điểm đến', 'Di sản');
        else if (category === 'van-hoa') derivedTags.push('Văn hóa', 'Sài Gòn');
        else derivedTags.push('Mẹo tham quan', 'Cẩm nang');

        collectedArticles.push({
          id: `rss-${idHash}`,
          slug,
          title,
          category,
          summary: description.slice(0, 320),
          coverImageUrl: thumbnail,
          coverImageAlt: title,
          imageCredit: feed.source,
          publishedAt,
          readingMinutes,
          audioUrl: null,
          relatedPoiSlugs: [],
          content: description,
          source: feed.source,
          sourceUrl: link,
          thumbnail,
          excerpt: description.slice(0, 320),
          tags: derivedTags,
          readingTime: readingMinutes,
        });
      }
    } catch {
      // Continue to next feed on error
    }
  }

  // Sort newest first
  collectedArticles.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  inMemoryCache = {
    articles: collectedArticles,
    timestamp: now,
  };

  return collectedArticles;
}

export function getCachedArticles(): ApiNewsDetail[] {
  return inMemoryCache?.articles ?? [];
}
