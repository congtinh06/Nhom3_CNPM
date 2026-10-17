import { SupportedLanguage } from '../../types';
import { NewsCategory, NEWS_CATEGORIES } from '../../types/domain';
import { tNews } from '../../content/newsI18n';

export function formatNewsDate(dateStr: string, lang: SupportedLanguage = 'vi'): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    if (lang === 'vi') {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    const locale = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

export function formatReadingTime(minutes: number = 3, lang: SupportedLanguage = 'vi'): string {
  const safeMinutes = Math.max(1, Math.round(minutes));
  if (lang === 'vi') return `${safeMinutes} phút đọc`;
  if (lang === 'en') return `${safeMinutes} min read`;
  if (lang === 'ja') return `${safeMinutes} 分で読める`;
  if (lang === 'ko') return `${safeMinutes}분 소요`;
  return `${safeMinutes} phút đọc`;
}

export function getCategoryLabel(category: string, lang: SupportedLanguage = 'vi'): string {
  if (category === 'diem-den') return tNews(lang, 'categoryDiemDen');
  if (category === 'van-hoa') return tNews(lang, 'categoryVanHoa');
  if (category === 'meo-tham-quan') return tNews(lang, 'categoryMeoThamQuan');
  if (category === 'trang-phuc') return tNews(lang, 'categoryTrangPhuc');
  if (category === 've-dep') return tNews(lang, 'categoryVeDep');
  const catMeta = NEWS_CATEGORIES[category as NewsCategory];
  return catMeta?.label || category;
}
