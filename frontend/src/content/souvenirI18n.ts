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
  | 'quickAdd'
  | 'addedOk'
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
  | 'ctaBtn'
  | 'showingRange'
  | 'pagerLabel'
  | 'prevPage'
  | 'nextPage'
  | 'editorialTitle'
  | 'editorialP1'
  | 'editorialP2'
  | 'editorialCta'
  | 'destiTitle'
  | 'destiCount'
  | 'destiCta'
  | 'setsTitle'
  | 'set1Title'
  | 'set1Desc'
  | 'set2Title'
  | 'set2Desc'
  | 'set3Title'
  | 'set3Desc'
  | 'setAdd'
  | 'setAdded'
  | 'waysTitle'
  | 'waysDisplayTitle'
  | 'waysDisplayP1'
  | 'waysDisplayP2'
  | 'waysTravelTitle'
  | 'waysTravelP1'
  | 'waysTravelP2'
  | 'waysGiftTitle'
  | 'waysGiftP1'
  | 'waysGiftP2'
  | 'faqQ5'
  | 'faqA5'
  | 'faqQ6'
  | 'faqA6'
  | 'closingTitle'
  | 'closingDesc'
  | 'closingBtn';

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
  quickAdd: 'Thêm nhanh',
  addedOk: 'Đã thêm ✓',
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
  showingRange: 'Hiển thị {start}–{end} trên {total} món',
  pagerLabel: 'Phân trang',
  prevPage: 'Trước',
  nextPage: 'Sau',
  editorialTitle: 'Một góc Sài Gòn giữa hành trình',
  editorialP1:
    'Một món quà nhỏ, một góc phố, một khoảnh khắc bạn sẽ nhớ trước khi rời đi.',
  editorialP2:
    'Chọn theo điểm vừa nghe, mỗi bộ sưu tập là một mảnh ghép của hành trình đó.',
  editorialCta: 'Xem bộ sưu tập {name} →',
  destiTitle: 'Chọn theo điểm đã đi',
  destiCount: '{count} món',
  destiCta: 'Xem quà',
  setsTitle: 'Bộ quà gợi ý',
  set1Title: 'Nhỏ gọn cho cả nhóm',
  set1Desc: 'Dễ xếp vào vali, chia được cho nhiều người.',
  set2Title: 'Để trưng bày',
  set2Desc: 'Hai món lấy điểm làm điểm nhấn cho góc làm việc.',
  set3Title: 'Một ngày ở Chợ Bến Thành',
  set3Desc: 'Nón lá, cà phê và trà, đủ cho một buổi sáng đi chợ.',
  setAdd: 'Thêm cả bộ',
  setAdded: 'Đã thêm {count} món quà vào giỏ hàng',
  waysTitle: 'Cách chọn quà',
  waysDisplayTitle: 'Để trưng bày',
  waysDisplayP1: 'Treo gọn trong phòng, để câu chuyện điểm dừng được kể lại bằng hình ảnh.',
  waysDisplayP2: 'Phù hợp cho người ở lại nhà hoặc mang về ngôi nhà mới.',
  waysTravelTitle: 'Mang về vali',
  waysTravelP1: 'Vỏ bìa cứng, túi zip, quà nhỏ nhưng đủ lớn để nhớ.',
  waysTravelP2: 'Cho hành trình dài hoặc tặng người ở xa.',
  waysGiftTitle: 'Tặng',
  waysGiftP1: 'Quà giới hạn theo món, ghi rõ món quà trên tờ quà.',
  waysGiftP2: 'Tặng cùng voucher nghe giới thiệu.',
  faqQ5: 'Tôi muốn tặng quà cho người khác, có cần tạo đơn riêng không?',
  faqA5: 'Không bắt buộc. Bạn chọn món quà rồi nhập email người nhận ở bước thanh toán.',
  faqQ6: 'Giao quà sau khi thanh toán mất bao lâu?',
  faqA6: 'Thường 3-7 ngày tùy điểm đến. Nếu có quầy bán trực tiếp thì có thể nhận ngay.',
  closingTitle: 'Cần thêm cảm hứng trước khi chọn quà?',
  closingDesc:
    'Nghe một điểm dừng nữa, hoặc để chúng tôi gợi ý món quà phù hợp với hành trình của bạn.',
  closingBtn: 'Đọc tin tức',
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
    quickAdd: 'Quick add',
    addedOk: 'Added ✓',
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
    showingRange: 'Showing {start}–{end} of {total}',
    pagerLabel: 'Pagination',
    prevPage: 'Previous',
    nextPage: 'Next',
    editorialTitle: 'A corner of Saigon between journeys',
    editorialP1: 'One small keepsake, one street corner, one moment you will remember before leaving.',
    editorialP2: 'Choose from a stop you just heard, each collection is a piece of that journey.',
    editorialCta: 'See the {name} collection →',
    destiTitle: 'Choose by the places you visited',
    destiCount: '{count} items',
    destiCta: 'See the gifts',
    setsTitle: 'Suggested gift sets',
    set1Title: 'Light for the whole group',
    set1Desc: 'Easy to pack, can be split among several people.',
    set2Title: 'For display',
    set2Desc: 'Two pieces built around one stop, made for a desk corner.',
    set3Title: 'A day in Ben Thanh market',
    set3Desc: 'Conical hat, drip coffee, and lotus tea, enough for one market morning.',
    setAdd: 'Add the set',
    setAdded: 'Added {count} keepsakes to cart',
    waysTitle: 'How to choose a keepsake',
    waysDisplayTitle: 'For display',
    waysDisplayP1: 'Hang it lightly at home so the story of the stop comes alive again.',
    waysDisplayP2: 'Good for staying at home or moving into a new space.',
    waysTravelTitle: 'For travel',
    waysTravelP1: 'Rigid case and zip pouch, small but big enough to remember.',
    waysTravelP2: 'For long trips or gifts to faraway friends.',
    waysGiftTitle: 'As a gift',
    waysGiftP1: 'Gift editions limited to the piece, noted on the gift card.',
    waysGiftP2: 'Pair it with a listening voucher for the stop.',
    faqQ5: 'Do I need a separate order to send a gift?',
    faqA5: 'No. Pick the keepsake and add the recipient email at checkout.',
    faqQ6: 'How long does delivery take after payment?',
    faqA6: 'Usually 3-7 days depending on the stop. Some stops have counters for pickup.',
    closingTitle: 'Need a little more inspiration before choosing?',
    closingDesc: 'Listen to one more stop, or let us suggest a keepsake for your journey.',
    closingBtn: 'Read the news',
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
    quickAdd: 'クイック追加',
    addedOk: '追加済み ✓',
    loadMore: 'もっと見る',
    faqTitle: 'よくある質問',
    ctaBtn: '観光スポットへ',
    showingRange: '{total}点中 {start}–{end} を表示',
    pagerLabel: 'ページネーション',
    prevPage: '前へ',
    nextPage: '次へ',
    editorialTitle: '旅の合間に流れるサゴンの片隅',
    editorialP1: '小さなお土産、一つの路地、そして旅の前に忘れそうな瞬間。',
    editorialP2: '最近訪れた場所から選ぶ。各コレクションはその旅の一片。',
    editorialCta: '{name}コレクションを見る →',
    destiTitle: '訪れた場所で選ぶ',
    destiCount: '{count}点',
    destiCta: 'ギフトを見る',
    setsTitle: 'おすすめのギフトセット',
    set1Title: '小さなグループへ',
    set1Desc: '荷物に優しく、複数人に分けられる。',
    set2Title: '展示用の2点セット',
    set2Desc: '1つのスポットを軸にした2点セット。',
    set3Title: '麦わら帽子と朝',
    set3Desc: 'コーヒーとセージティーと麦わら帽子で、市場の朝。',
    setAdd: 'セットを追加',
    setAdded: '{count}点をカートに追加しました',
    waysTitle: 'お土産の選び方',
    waysDisplayTitle: '展示用',
    waysDisplayP1: '家にそっと飾って、stop の物語を映し出す。',
    waysDisplayP2: '自宅にいる場合や新しい暮らしの場へ送る場合に。',
    waysTravelTitle: '持ち運び用',
    waysTravelP1: '硬いケースとジッパー付きポーチ、小さくても忘れ物には十分。',
    waysTravelP2: '長い旅や遠くへ送るギフトに。',
    waysGiftTitle: 'ギフト用',
    waysGiftP1: '作品ごとに限定のギフト版、ギフトカードに明記。',
    waysGiftP2: 'stop のリスニング招待と合わせて。',
    faqQ5: 'ギフト用に別の注文が必要ですか？',
    faqA5: '不要です。ギフトを選んでチェックアウトで受取人のメールを入れてください。',
    faqQ6: '支払い後、配送までどのくらいかかりますか？',
    faqA6: '通常3-7日です。対象 stop によっては受け取り窓口があります。',
    closingTitle: '選ぶ前にもう少しインスピレーションが欲しいですか？',
    closingDesc: 'stop をもう一つ聴いてみるか、旅に合うお土産を提案してください。',
    closingBtn: 'ニュースを読む',
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
    quickAdd: '빠르게 추가',
    addedOk: '추가됨 ✓',
    loadMore: '더 보기',
    faqTitle: '자주 묻는 질문',
    ctaBtn: '관광 명소로 이동',
    showingRange: '{total}개 중 {start}–{end} 표시',
    pagerLabel: '페이지네이션',
    prevPage: '이전',
    nextPage: '다음',
    editorialTitle: '여정 사이의 사이공 한 조각',
    editorialP1: '작은 기념품 한 개, 길고요, 그리고 떠나기 전에 잊을 만한 순간.',
    editorialP2: '최근 들은 지점에서 선택하세요, 각 컬렉션은 그 여정의 조각입니다.',
    editorialCta: '{name} 컬렉션 보기 →',
    destiTitle: '다녀온 장소로 골라',
    destiCount: '{count}개',
    destiCta: '선물 보기',
    setsTitle: '추천 기념품 세트',
    set1Title: '가족과 친구를 위한',
    set1Desc: '가볍게 포장해서 여러 명에게 나눠 줄 수 있어요.',
    set2Title: '전시용 세트',
    set2Desc: '한 지점을 중심으로 만든 두 가지 기념품 세트예요.',
    set3Title: '쇼핑 시장 하루',
    set3Desc: '모자, 커피, 차 세트로 아침을 여행처럼 보내요.',
    setAdd: '세트 추가',
    setAdded: '{count}개의 기념품을 장바구니에 담았어요',
    waysTitle: '기념품 고르는 법',
    waysDisplayTitle: '전시용',
    waysDisplayP1: '집에 조용히 걸고, 지점의 이야기를 다시 살리세요.',
    waysDisplayP2: '거주 중이거나 새 공간으로 옮길 때 좋아요.',
    waysTravelTitle: '여행용',
    waysTravelP1: '단단한 케이스와 지퍼 파우치, 작아도 기억에는 충분해요.',
    waysTravelP2: '긴 여행이나 먼 친구에게 선물할 때. 잘 맞아요.',
    waysGiftTitle: '선물용',
    waysGiftP1: '작품별 한정 선물판, 선물 카드에 명시.',
    waysGiftP2: '지점의 리스닝 초대와 함께.',
    faqQ5: '선물용으로 별도 주문이 필요한가요?',
    faqA5: '필요 없어요. 선물을 고르고 결제에서 받는 사람 이메일을 넣으세요.',
    faqQ6: '결제 후 배송은 얼마나 걸리나요?',
    faqA6: '보통 3-7일이에요. 지점에 따라 셀프픽업도 있어요.',
    closingTitle: '선택하기 전에 마음에 더 좋은 영감이 필요한가요?',
    closingDesc: '한 곳을 더 들어보거나, 여행에 맞는 기념품을 제안해 드릴게요.',
    closingBtn: '뉴스 읽기',
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

