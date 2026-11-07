import { SupportedLanguage } from '../types';

export type SouvenirI18nKey =
  | 'pageTitle'
  | 'heroTitle'
  | 'heroSub'
  | 'searchLabel'
  | 'searchPlaceholder'
  | 'searchAria'
  | 'searchBtn'
  | 'clearSearchAria'
  | 'autocompleteAria'
  | 'noAutocompleteMatch'
  | 'viewAllMatches'
  | 'defaultSpotLabel'
  | 'suggestPrefix'
  | 'suggest1'
  | 'suggest2'
  | 'suggest3'
  | 'suggest4'
  | 'hintPrefix'
  | 'hintAction'
  | 'colGroupAria'
  | 'col1Title'
  | 'col1Sub'
  | 'col2Title'
  | 'col2Sub'
  | 'col3Title'
  | 'col3Sub'
  | 'spotGroupAria'
  | 'spotAll'
  | 'showingCount'
  | 'noItemsCount'
  | 'resetFilterInline'
  | 'priceLabel'
  | 'priceAll'
  | 'priceUnder50'
  | 'price50To100'
  | 'price100To200'
  | 'priceAbove200'
  | 'sortLabel'
  | 'sortPopular'
  | 'sortNewest'
  | 'sortPriceAsc'
  | 'sortPriceDesc'
  | 'favAddAria'
  | 'favRemoveAria'
  | 'addToCart'
  | 'addedCount'
  | 'outOfStock'
  | 'toastAdded'
  | 'loading'
  | 'emptyFiltered'
  | 'emptyCatalog'
  | 'moreRemaining'
  | 'loadMore'
  | 'storyTitle'
  | 'storyP1'
  | 'storyP2'
  | 'storyCta'
  | 'info1Title'
  | 'info1Desc'
  | 'info2Title'
  | 'info2Desc'
  | 'info3Title'
  | 'info3Desc'
  | 'faqTitle'
  | 'faqQ1'
  | 'faqA1'
  | 'faqQ2'
  | 'faqA2'
  | 'faqQ3'
  | 'faqA3'
  | 'faqQ4'
  | 'faqA4'
  | 'ctaTitle'
  | 'ctaDesc'
  | 'ctaBtn';

const VI_SOUVENIR_DICTIONARY: Record<SouvenirI18nKey, string> = {
  pageTitle: 'Echora - Quà lưu niệm Sài Gòn',
  heroTitle: 'Quà lưu niệm Sài Gòn',
  heroSub:
    'Những món nhỏ gắn với từng điểm dừng trong hành trình. Chọn theo nơi bạn đã đi, hoặc tìm thẳng món bạn nghĩ tới.',
  searchLabel: 'Tìm món quà',
  searchPlaceholder: 'Tìm kiếm quà lưu niệm, điểm đến… (vd: tranh, nón lá, Dinh Độc Lập)',
  searchAria: 'Tìm kiếm quà lưu niệm',
  searchBtn: 'Tìm',
  clearSearchAria: 'Xóa từ khóa tìm kiếm',
  autocompleteAria: 'Gợi ý quà lưu niệm',
  noAutocompleteMatch: 'Không tìm thấy quà phù hợp',
  viewAllMatches: 'Xem tất cả {count} món khớp từ khóa',
  defaultSpotLabel: 'Quà lưu niệm Sài Gòn',
  suggestPrefix: 'Gợi ý:',
  suggest1: 'tranh mạ vàng',
  suggest2: 'nón lá',
  suggest3: 'bưu thiếp',
  suggest4: 'cà phê',
  hintPrefix: 'Bạn vừa nghe',
  hintAction: 'Xem {count} món gắn với điểm này',
  colGroupAria: 'Bộ sưu tập',
  col1Title: 'Dưới 100.000đ',
  col1Sub: 'Quà nhỏ, tặng được ngay',
  col2Title: 'Để trưng bày',
  col2Sub: 'Tranh, mô hình, sách ảnh',
  col3Title: 'Nhỏ gọn bỏ túi',
  col3Sub: 'Nam châm, bưu thiếp',
  spotGroupAria: 'Lọc theo điểm đến',
  spotAll: 'Tất cả',
  showingCount: 'Đang hiển thị {shown} trên {total} món',
  noItemsCount: 'Không có món nào',
  resetFilterInline: 'Xem tất cả',
  priceLabel: 'Khoảng giá',
  priceAll: 'Mọi mức giá',
  priceUnder50: 'Dưới 50.000đ',
  price50To100: '50.000đ - 100.000đ',
  price100To200: '100.000đ - 200.000đ',
  priceAbove200: 'Trên 200.000đ',
  sortLabel: 'Sắp xếp',
  sortPopular: 'Phổ biến nhất',
  sortNewest: 'Mới nhất',
  sortPriceAsc: 'Giá tăng dần',
  sortPriceDesc: 'Giá giảm dần',
  favAddAria: 'Yêu thích {name}',
  favRemoveAria: 'Bỏ yêu thích {name}',
  addToCart: 'Thêm vào giỏ',
  addedCount: 'Đã thêm ×{count}',
  outOfStock: 'Tạm hết',
  toastAdded: 'Đã thêm vào giỏ hàng: {name}',
  loading: 'Đang tải dữ liệu...',
  emptyFiltered: 'Chưa thấy món nào khớp.',
  emptyCatalog: 'Chưa có món quà lưu niệm nào được đăng.',
  moreRemaining: 'Còn {count} món nữa',
  loadMore: 'Xem thêm',
  storyTitle: 'Treo một góc Sài Gòn lên tường',
  storyP1:
    'Một món quà nhẹ, dễ gói, và treo lên là thành một góc nhớ về chuyến đi. Chọn hình theo điểm bạn thích nhất trong hành trình.',
  storyP2:
    'Mỗi tác phẩm đều gắn với một điểm dừng, nên khi nhìn lại bạn vẫn nhớ đoạn thuyết minh đã nghe ở đó.',
  storyCta: 'Xem {name}',
  info1Title: 'Gói cẩn thận',
  info1Desc: 'Mỗi món được bọc riêng trước khi giao, tranh và mô hình có thêm lớp chống va đập.',
  info2Title: 'Giao tận nơi',
  info2Desc:
    'Giao về khách sạn hoặc địa chỉ của bạn, hoặc nhận ngay tại điểm tham quan nếu có quầy.',
  info3Title: 'Đổi nếu có lỗi',
  info3Desc: 'Nhận hàng bị hỏng hoặc sai món thì báo cho chúng tôi, sẽ đổi món khác cho bạn.',
  faqTitle: 'Câu hỏi thường gặp',
  faqQ1: 'Tôi có thể nhận quà ngay tại điểm tham quan không?',
  faqA1:
    'Một số điểm có quầy bán trực tiếp. Món nào có quầy sẽ ghi rõ trong trang chi tiết, bạn cũng có thể chọn giao về nơi ở.',
  faqQ2: 'Phần nghe giới thiệu sản phẩm có mất phí không?',
  faqA2:
    'Không. Tiếng Việt miễn phí, các ngôn ngữ khác mở bằng gói Premium giống như phần thuyết minh điểm du lịch.',
  faqQ3: 'Có gửi quà ra nước ngoài được không?',
  faqA3:
    'Hiện có thể gửi trong nước. Với đơn quốc tế, bạn liên hệ để chúng tôi báo phí và thời gian cụ thể.',
  faqQ4: 'Tôi muốn đổi món sau khi đặt thì sao?',
  faqA4:
    'Báo cho chúng tôi trước khi đơn được gói. Nếu đã gói, chúng tôi vẫn hỗ trợ đổi theo chính sách đổi trả.',
  ctaTitle: 'Chưa biết chọn món nào?',
  ctaDesc: 'Nghe một điểm dừng trước, rồi quay lại chọn món gắn với điểm đó.',
  ctaBtn: 'Đi tới Điểm du lịch',
};

export const SOUVENIR_DICTIONARY: Record<
  SupportedLanguage,
  Partial<Record<SouvenirI18nKey, string>>
> = {
  vi: VI_SOUVENIR_DICTIONARY,
  en: {
    pageTitle: 'Echora - Saigon Souvenirs',
    heroTitle: 'Saigon Souvenirs',
    heroSub:
      'Small keepsakes tied to each stop along your journey. Browse by the places you visited, or search directly for what you have in mind.',
    searchLabel: 'Find a keepsake',
    searchPlaceholder: 'Search souvenirs or stops… (e.g. framed prints, conical hats)',
    searchAria: 'Search souvenirs',
    searchBtn: 'Search',
    clearSearchAria: 'Clear search keyword',
    autocompleteAria: 'Souvenir suggestions',
    noAutocompleteMatch: 'No matching souvenirs found',
    viewAllMatches: 'See all {count} matching items',
    defaultSpotLabel: 'Saigon Souvenir',
    suggestPrefix: 'Try:',
    suggest1: 'tranh mạ vàng',
    suggest2: 'nón lá',
    suggest3: 'bưu thiếp',
    suggest4: 'cà phê',
    hintPrefix: 'You recently listened to',
    hintAction: 'See {count} keepsakes from this stop',
    colGroupAria: 'Curated collections',
    col1Title: 'Under 100,000₫',
    col1Sub: 'Small gifts, ready to share',
    col2Title: 'For display',
    col2Sub: 'Prints, scale models, photo books',
    col3Title: 'Pocket-sized',
    col3Sub: 'Magnets, postcards',
    spotGroupAria: 'Filter by destination',
    spotAll: 'All',
    showingCount: 'Showing {shown} of {total} items',
    noItemsCount: 'No items found',
    resetFilterInline: 'View all',
    priceLabel: 'Price range',
    priceAll: 'Any price',
    priceUnder50: 'Under 50,000₫',
    price50To100: '50,000₫ - 100,000₫',
    price100To200: '100,000₫ - 200,000₫',
    priceAbove200: 'Over 200,000₫',
    sortLabel: 'Sort by',
    sortPopular: 'Most popular',
    sortNewest: 'Newest',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    favAddAria: 'Save {name}',
    favRemoveAria: 'Remove {name} from saved',
    addToCart: 'Add to cart',
    addedCount: 'Added ×{count}',
    outOfStock: 'Sold out',
    toastAdded: 'Added to cart: {name}',
    loading: 'Loading items...',
    emptyFiltered: 'No matching keepsakes found.',
    emptyCatalog: 'No souvenirs are published yet.',
    moreRemaining: '{count} more items',
    loadMore: 'Load more',
    storyTitle: 'Hang a corner of Saigon on your wall',
    storyP1:
      'Light, easy to pack, and ready to turn a wall into a quiet memory of your walk. Pick a piece from the stop you loved most.',
    storyP2:
      'Every piece belongs to a stop on the route, bringing back the story you heard while standing there.',
    storyCta: 'View {name}',
    info1Title: 'Carefully packed',
    info1Desc: 'Every item is wrapped individually; framed prints and models include extra cushioning.',
    info2Title: 'Delivered to you',
    info2Desc: 'Delivered to your hotel or address, or picked up at the landmark counter where available.',
    info3Title: 'Easy replacement',
    info3Desc: 'If anything arrives damaged or incorrect, let us know and we will replace it right away.',
    faqTitle: 'Frequently asked questions',
    faqQ1: 'Can I pick up souvenirs right at the attraction?',
    faqA1:
      'Selected stops have an on-site counter noted on the product detail page, or you can choose delivery to where you stay.',
    faqQ2: 'Is product audio introduction free?',
    faqA2:
      'Yes. Vietnamese is free, while English, Japanese, and Korean unlock with the same Premium pass as the tour.',
    faqQ3: 'Do you ship internationally?',
    faqA3:
      'Domestic delivery is available right at checkout. For international shipping, contact us for exact rates and timing.',
    faqQ4: 'Can I change an item after placing an order?',
    faqA4:
      'Reach out before your order is packed, or exchange it afterward under our return policy.',
    ctaTitle: 'Not sure what to pick yet?',
    ctaDesc: 'Listen to a stop first, then come back to choose a keepsake tied to that place.',
    ctaBtn: 'Go to Attractions',
  },
  ja: {
    pageTitle: 'Echora - サイゴンのお土産',
    heroTitle: 'サイゴンのお土産',
    spotAll: 'すべて',
    showingCount: '{total}点中 {shown}点を表示中',
    noItemsCount: '該当する商品がありません',
    resetFilterInline: 'すべて表示',
    priceAll: 'すべての価格',
    sortPopular: '人気順',
    sortNewest: '新着順',
    sortPriceAsc: '価格の安い順',
    sortPriceDesc: '価格の高い順',
    addToCart: 'カートに追加',
    addedCount: '追加済み ×{count}',
    outOfStock: '在庫切れ',
    loadMore: 'もっと見る',
    faqTitle: 'よくある質問',
    ctaBtn: '観光スポットへ',
  },
  ko: {
    pageTitle: 'Echora - 사이공 기념품',
    heroTitle: '사이공 기념품',
    spotAll: '전체',
    showingCount: '전체 {total}개 중 {shown}개 표시',
    noItemsCount: '조건에 맞는 기념품이 없습니다',
    resetFilterInline: '전체 보기',
    priceAll: '전체 가격',
    sortPopular: '인기순',
    sortNewest: '최신순',
    sortPriceAsc: '낮은 가격순',
    sortPriceDesc: '높은 가격순',
    addToCart: '장바구니 담기',
    addedCount: '담김 ×{count}',
    outOfStock: '일시 품절',
    loadMore: '더 보기',
    faqTitle: '자주 묻는 질문',
    ctaBtn: '관광 명소로 이동',
  },
};

export function st(
  lang: SupportedLanguage,
  key: SouvenirI18nKey,
  vars?: Record<string, string | number>
): string {
  const raw = SOUVENIR_DICTIONARY[lang]?.[key] ?? VI_SOUVENIR_DICTIONARY[key] ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (acc, [k, val]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val)),
    raw
  );
}

