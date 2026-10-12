/**
 * RSS Feed Sources and Keyword Classification Rules
 * Target: Saigon travel, heritage, and culture articles
 */

export interface RssFeedSource {
  source: string;
  url: string;
}

export const RSS_FEED_SOURCES: RssFeedSource[] = [
  { source: 'VnExpress', url: 'https://vnexpress.net/rss/du-lich.rss' },
  { source: 'Tuổi Trẻ', url: 'https://tuoitre.vn/rss/du-lich.rss' },
  { source: 'Thanh Niên', url: 'https://thanhnien.vn/rss/du-lich.rss' },
  { source: 'Thanh Niên Văn Hóa', url: 'https://thanhnien.vn/rss/van-hoa.rss' },
  { source: 'VnExpress Thời Sự', url: 'https://vnexpress.net/rss/thoi-su.rss' },
];

export type CategoryKey = 'diem-den' | 'van-hoa' | 'meo-tham-quan';

export const CATEGORY_KEYWORD_RULES: Record<CategoryKey, string[]> = {
  'meo-tham-quan': [
    'mẹo',
    'kinh nghiệm',
    'lưu ý',
    'cẩm nang',
    'hướng dẫn',
    'lộ trình',
    'thời tiết',
    'chụp ảnh',
    'tránh kẹt xe',
    'chi phí',
    'giá vé',
    'khách sạn',
    'xe buýt',
    'di chuyển',
    'bí quyết',
    'lịch trình',
    'chuẩn bị',
    'tour',
    'kỳ nghỉ',
    'vé máy bay',
    'đặt phòng',
    'thị thực',
    'visa',
    'đi lại',
    'hành lý',
  ],
  'van-hoa': [
    'văn hóa',
    'cà phê',
    'ẩm thực',
    'cơm tấm',
    'bánh mì',
    'hủ tiếu',
    'đờn ca tài tử',
    'áo dài',
    'áo bà ba',
    'hẻm',
    'thị dân',
    'truyền thống',
    'lễ hội',
    'nghệ thuật',
    'ký ức',
    'phố phường',
    'người sài gòn',
    'đời sống',
    'di sản',
    'triển lãm',
    'âm nhạc',
    'hát bội',
    'cải lương',
    'phim',
    'trưng bày',
    'nghệ sĩ',
    'sân khấu',
    'món ngon',
    'quán quen',
    'hương vị',
  ],
  'diem-den': [
    'sài gòn',
    'tp.hcm',
    'tphcm',
    'hồ chí minh',
    'dinh độc lập',
    'nhà thờ đức bà',
    'bưu điện',
    'chợ bến thành',
    'bảo tàng',
    'củ chi',
    'bạch đằng',
    'landmark',
    'nguyễn huệ',
    'quận 1',
    'quận 5',
    'chợ lớn',
    'hồ con rùa',
    'điểm đến',
    'điểm tham quan',
    'khu du lịch',
    'du lịch',
    'check-in',
    'di tích',
    'danh thắng',
    'biển',
    'đảo',
    'núi',
    'phố cổ',
    'thắng cảnh',
    'tuyến tham quan',
    'địa đạo',
  ],
};

/**
 * Classify article text into category based on keyword density
 */
export function classifyArticleCategory(title: string, description: string): CategoryKey | null {
  const text = (title + ' ' + description).toLowerCase();

  let matchedCategory: CategoryKey | null = null;
  let maxHits = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORD_RULES) as [CategoryKey, string[]][]) {
    let hits = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        hits++;
      }
    }
    if (hits > maxHits) {
      maxHits = hits;
      matchedCategory = category;
    }
  }

  return matchedCategory;
}
