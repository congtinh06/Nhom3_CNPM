import { SupportedLanguage } from '../types';

export interface NewsTranslation {
  pageTitle: string;
  pageSubtitle: string;
  categoryAll: string;
  categoryDiemDen: string;
  categoryVanHoa: string;
  categoryMeoThamQuan: string;
  categoryTrangPhuc: string;
  categoryVeDep: string;
  filterByPoi: string;
  listenBtn: string;
  listenThisArticle: string;
  newPill: string;
  bannerTitle: string;
  bannerBtn: string;
  seeAll: string;
  latest: string;
  mightMiss: string;
  minutesRead: string;
  newBadge: string;
  emptyFilterMessage: string;
  readAtSource: string;
  relatedArticles: string;
  relatedPois: string;
  breadcrumbHome: string;
  breadcrumbNews: string;
  notFoundTitle: string;
  notFoundMessage: string;
  backToNews: string;
  retry: string;
  loading: string;
  errorLoad: string;
  searchPlaceholder: string;
  searchLabel: string;
  clearSearch: string;
  filteringBy: string;
  articlesCount: string;
  clearFilters: string;
  errorLoadTitle: string;
  noArticlesTitle: string;
  noArticlesForPoi: string;
  featured: string;
  prev: string;
  next: string;
  readByStop: string;
  readByStopDesc: string;
  articles: string;
  comingSoon: string;
  readArticle: string;
  listenTour: string;
  newsletterTitle: string;
  newsletterDesc: string;
  newsletterEmail: string;
  newsletterEmailPlaceholder: string;
  newsletterBtn: string;
  newsletterSuccess: string;
  ctaListenTitle: string;
  ctaListenDesc: string;
  ctaListenBtn: string;
  photo: string;
  source: string;
  keywords: string;
  backToNewsList: string;
  homeNewsEyebrow: string;
  homeNewsEyebrowAlt: string;
  homeNewsTitle: string;
  homeNewsDesc: string;
  homeNewsAll: string;
}

export const NEWS_TRANSLATIONS: Record<SupportedLanguage, NewsTranslation> = {
  vi: {
    pageTitle: 'Tin tức',
    pageSubtitle: 'Cập nhật câu chuyện di sản, đời sống văn hóa và cẩm nang khám phá Sài Gòn',
    categoryAll: 'Tất cả',
    categoryDiemDen: 'Điểm đến',
    categoryVanHoa: 'Văn hóa Sài Gòn',
    categoryMeoThamQuan: 'Mẹo tham quan',
    categoryTrangPhuc: 'Trang phục truyền thống',
    categoryVeDep: 'Vẻ đẹp Việt Nam',
    filterByPoi: 'Theo điểm tham quan',
    listenBtn: 'NGHE',
    listenThisArticle: 'Nghe bài này',
    newPill: 'Có bài mới, Tải lại',
    bannerTitle: 'Bắt đầu tuyến thuyết minh 5 điểm',
    bannerBtn: 'Nghe thử',
    seeAll: 'Xem tất cả',
    latest: 'Mới nhất',
    mightMiss: 'Bạn có thể bỏ lỡ',
    minutesRead: 'PHÚT ĐỌC',
    newBadge: 'Mới',
    emptyFilterMessage: 'Không tìm thấy bài viết nào trong chuyên mục đã chọn.',
    readAtSource: 'Đọc tại',
    relatedArticles: 'Bài viết liên quan',
    relatedPois: 'Điểm tham quan liên quan',
    breadcrumbHome: 'Trang chủ',
    breadcrumbNews: 'Tin tức',
    notFoundTitle: 'Không tìm thấy bài viết',
    notFoundMessage: 'Bài viết bạn đang tìm không tồn tại hoặc đã được chuyển địa chỉ.',
    backToNews: 'Quay lại Tin tức',
    retry: 'Thử lại',
    loading: 'Đang tải tin tức...',
    errorLoad: 'Đã xảy ra lỗi khi tải tin tức. Vui lòng thử lại sau.',
    searchPlaceholder: 'Tìm bài viết',
    searchLabel: 'Tìm bài viết',
    clearSearch: 'Xóa tìm kiếm',
    filteringBy: 'Đang lọc theo',
    articlesCount: 'bài viết',
    clearFilters: 'Xóa bộ lọc',
    errorLoadTitle: 'Không thể tải tin tức',
    noArticlesTitle: 'Chưa có bài viết phù hợp',
    noArticlesForPoi: 'Không có bài viết nào liên kết với điểm tham quan này.',
    featured: 'Tin nổi bật',
    prev: 'Trước',
    next: 'Sau',
    readByStop: 'Đọc theo điểm dừng',
    readByStopDesc: 'Mỗi điểm trong hành trình có bài viết đi kèm. Đọc trước khi đi, hoặc nghe thuyết minh ngay tại chỗ.',
    articles: 'bài viết',
    comingSoon: 'Sắp có bài',
    readArticle: 'Đọc bài',
    listenTour: 'Nghe thuyết minh',
    newsletterTitle: 'Nhận bài mới mỗi tuần',
    newsletterDesc: 'Câu chuyện di sản và mẹo khám phá Sài Gòn, gửi thẳng vào hộp thư của bạn.',
    newsletterEmail: 'Email của bạn',
    newsletterEmailPlaceholder: 'ban@vidu.com',
    newsletterBtn: 'Đăng ký',
    newsletterSuccess: 'Cảm ơn bạn, chúng tôi đã ghi nhận email.',
    ctaListenTitle: 'Muốn nghe thay vì đọc?',
    ctaListenDesc: 'Mỗi điểm dừng có một đoạn thuyết minh ngắn, nghe được bằng bốn ngôn ngữ.',
    ctaListenBtn: 'Đi tới Điểm du lịch',
    photo: 'Ảnh',
    source: 'Nguồn',
    keywords: 'Từ khóa',
    backToNewsList: 'Quay lại danh sách Tin tức',
    homeNewsEyebrow: 'GÓC NHÌN VÀ DI SẢN',
    homeNewsEyebrowAlt: 'CẬP NHẬT MỚI',
    homeNewsTitle: 'Tin tức & Câu chuyện Sài Gòn',
    homeNewsDesc: 'Cập nhật đời sống, văn hóa di sản và những kinh nghiệm trải nghiệm mới nhất từ các nguồn báo chí uy tín.',
    homeNewsAll: 'Xem tất cả tin tức',
  },
  en: {
    pageTitle: 'News',
    pageSubtitle: 'Heritage stories, cultural insights, and exploration guides to Saigon',
    categoryAll: 'All',
    categoryDiemDen: 'Destinations',
    categoryVanHoa: 'Saigon Culture',
    categoryMeoThamQuan: 'Visiting Tips',
    categoryTrangPhuc: 'Traditional Attire',
    categoryVeDep: 'Beauty of Vietnam',
    filterByPoi: 'By attraction',
    listenBtn: 'LISTEN',
    listenThisArticle: 'Listen to this article',
    newPill: 'New stories available, Refresh',
    bannerTitle: 'Start the 5-landmark audio tour',
    bannerBtn: 'Listen now',
    seeAll: 'View all',
    latest: 'Latest',
    mightMiss: 'You might have missed',
    minutesRead: 'MIN READ',
    newBadge: 'New',
    emptyFilterMessage: 'No articles found in the selected category.',
    readAtSource: 'Read at',
    relatedArticles: 'Related Stories',
    relatedPois: 'Related Attractions',
    breadcrumbHome: 'Home',
    breadcrumbNews: 'News',
    notFoundTitle: 'Article Not Found',
    notFoundMessage: 'The story you are looking for does not exist or has been moved.',
    backToNews: 'Back to News',
    retry: 'Retry',
    loading: 'Loading news...',
    errorLoad: 'Failed to load news. Please try again later.',
    searchPlaceholder: 'Search articles',
    searchLabel: 'Search articles',
    clearSearch: 'Clear search',
    filteringBy: 'Filtering by',
    articlesCount: 'articles',
    clearFilters: 'Clear filter',
    errorLoadTitle: 'Unable to load news',
    noArticlesTitle: 'No matching articles',
    noArticlesForPoi: 'No articles linked to this attraction.',
    featured: 'Featured Stories',
    prev: 'Previous',
    next: 'Next',
    readByStop: 'Read by landmark',
    readByStopDesc: 'Every landmark on the tour has accompanying stories. Read ahead or listen to the audio tour on site.',
    articles: 'articles',
    comingSoon: 'Coming soon',
    readArticle: 'Read story',
    listenTour: 'Listen to audio guide',
    newsletterTitle: 'Get new stories weekly',
    newsletterDesc: 'Heritage narratives and Saigon travel tips delivered straight to your inbox.',
    newsletterEmail: 'Your email address',
    newsletterEmailPlaceholder: 'you@example.com',
    newsletterBtn: 'Subscribe',
    newsletterSuccess: 'Thank you, your email has been subscribed.',
    ctaListenTitle: 'Prefer listening to reading?',
    ctaListenDesc: 'Each stop offers an audio narration available in four languages.',
    ctaListenBtn: 'Go to Attractions',
    photo: 'Photo',
    source: 'Source',
    keywords: 'Keywords',
    backToNewsList: 'Back to News',
    homeNewsEyebrow: 'INSIGHTS & HERITAGE',
    homeNewsEyebrowAlt: 'NEW UPDATES',
    homeNewsTitle: 'Saigon Stories & News',
    homeNewsDesc: 'Discover the heritage, local life, and travel tips curated from reputable cultural publications.',
    homeNewsAll: 'View all news',
  },
  ja: {
    pageTitle: 'ニュース',
    pageSubtitle: 'サイゴンの遺産、文化、そして旅のヒントをお届けします',
    categoryAll: 'すべて',
    categoryDiemDen: '観光名所',
    categoryVanHoa: 'サイゴンの文化',
    categoryMeoThamQuan: '観光のヒント',
    categoryTrangPhuc: '伝統衣装',
    categoryVeDep: 'ベトナムの美',
    filterByPoi: '見どころ別',
    listenBtn: '聴く',
    listenThisArticle: 'この記事を聴く',
    newPill: '新着記事があります, 再読み込み',
    bannerTitle: '5大名所の音声ガイドツアーを開始',
    bannerBtn: '試聴する',
    seeAll: 'すべて見る',
    latest: '最新情報',
    mightMiss: 'おすすめ記事',
    minutesRead: '分で読める',
    newBadge: '新着',
    emptyFilterMessage: '選択されたカテゴリーに記事は見つかりませんでした。',
    readAtSource: '元記事を読む: ',
    relatedArticles: '関連記事',
    relatedPois: '関連する観光名所',
    breadcrumbHome: 'ホーム',
    breadcrumbNews: 'ニュース',
    notFoundTitle: '記事が見つかりません',
    notFoundMessage: 'お探しの記事は存在しないか、移動された可能性があります。',
    backToNews: 'ニュース一覧へ戻る',
    retry: '再試行',
    loading: '読み込み中...',
    errorLoad: 'ニュースの取得に失敗しました。',
    searchPlaceholder: '記事を検索',
    searchLabel: '記事を検索',
    clearSearch: '検索をクリア',
    filteringBy: '現在のフィルター',
    articlesCount: '件の記事',
    clearFilters: 'フィルターを解除',
    errorLoadTitle: 'ニュースを読み込めませんでした',
    noArticlesTitle: '該当する記事がありません',
    noArticlesForPoi: 'この観光スポットに関連する記事はありません。',
    featured: '注目記事',
    prev: '前へ',
    next: '次へ',
    readByStop: 'スポット別に読む',
    readByStopDesc: '各スポットに関連する物語をご用意しています。事前に読むことも、現地で音声を聴くこともできます。',
    articles: '件の記事',
    comingSoon: '近日公開',
    readArticle: '記事を読む',
    listenTour: '音声ガイドを聴く',
    newsletterTitle: '毎週新しい記事をお届け',
    newsletterDesc: 'サイゴンの遺産ストーリーや旅のヒントをメールでお届けします。',
    newsletterEmail: 'メールアドレス',
    newsletterEmailPlaceholder: 'name@example.com',
    newsletterBtn: '登録する',
    newsletterSuccess: 'ご登録ありがとうございます。メールアドレスを受け付けました。',
    ctaListenTitle: '読む代わりに聴いてみませんか？',
    ctaListenDesc: '各スポットには4言語で聴ける音声ガイドが用意されています。',
    ctaListenBtn: '観光名所へ移動',
    photo: '写真',
    source: '出典',
    keywords: 'キーワード',
    backToNewsList: 'ニュース一覧へ戻る',
    homeNewsEyebrow: '視点と遺産',
    homeNewsEyebrowAlt: '最新情報',
    homeNewsTitle: 'サイゴンのニュース＆ストーリー',
    homeNewsDesc: '信頼できる文化情報源から、サイゴンの伝統文化や最新の街の表情をお届けします。',
    homeNewsAll: 'すべてのニュースを見る',
  },
  ko: {
    pageTitle: '뉴스',
    pageSubtitle: '사이공의 유산 이야기, 문화, 그리고 여행 팁을 만나보세요',
    categoryAll: '전체',
    categoryDiemDen: '여행지',
    categoryVanHoa: '사이공 문화',
    categoryMeoThamQuan: '관광 팁',
    categoryTrangPhuc: '전통 의상',
    categoryVeDep: '베트남의 아름다움',
    filterByPoi: '명소별 보기',
    listenBtn: '듣기',
    listenThisArticle: '이 기사 듣기',
    newPill: '새 기사 등록됨, 새로고침',
    bannerTitle: '5대 명소 오디오 가이드 투어 시작하기',
    bannerBtn: '체험하기',
    seeAll: '전체보기',
    latest: '최신순',
    mightMiss: '놓치지 말아야 할 기사',
    minutesRead: '분 소요',
    newBadge: '새소식',
    emptyFilterMessage: '선택한 카테고리에 등록된 기사가 없습니다.',
    readAtSource: '원문 보기: ',
    relatedArticles: '관련 기사',
    relatedPois: '관련 명소',
    breadcrumbHome: '홈',
    breadcrumbNews: '뉴스',
    notFoundTitle: '기사를 찾을 수 없습니다',
    notFoundMessage: '찾으시는 기사가 없거나 삭제되었을 수 있습니다.',
    backToNews: '뉴스 목록으로 돌아가기',
    retry: '다시 시도',
    loading: '로딩 중...',
    errorLoad: '뉴스를 불러오는 데 실패했습니다.',
    searchPlaceholder: '기사 검색',
    searchLabel: '기사 검색',
    clearSearch: '검색 초기화',
    filteringBy: '필터 기준',
    articlesCount: '개 기사',
    clearFilters: '필터 초기화',
    errorLoadTitle: '뉴스를 불러올 수 없습니다',
    noArticlesTitle: '해당하는 기사가 없습니다',
    noArticlesForPoi: '이 관광 명소와 연결된 기사가 없습니다.',
    featured: '주요 기사',
    prev: '이전',
    next: '다음',
    readByStop: '명소별 기사 보기',
    readByStopDesc: '각 명소마다 흥미로운 이야기가 준비되어 있습니다. 방문 전 읽어보거나 현장에서 오디오로 들어보세요.',
    articles: '개 기사',
    comingSoon: '준비 중',
    readArticle: '기사 읽기',
    listenTour: '오디오 가이드 듣기',
    newsletterTitle: '매주 새로운 기사 받아보기',
    newsletterDesc: '사이공의 문화유산 이야기와 여행 팁을 이메일로 바로 받아보세요.',
    newsletterEmail: '이메일 주소',
    newsletterEmailPlaceholder: 'name@example.com',
    newsletterBtn: '구독하기',
    newsletterSuccess: '감사합니다, 이메일 구독이 완료되었습니다.',
    ctaListenTitle: '글 대신 귀로 듣고 싶으신가요?',
    ctaListenDesc: '모든 명소마다 4개 언어로 제작된 오디오 가이드가 준비되어 있습니다.',
    ctaListenBtn: '관광 명소로 이동',
    photo: '사진',
    source: '출처',
    keywords: '키워드',
    backToNewsList: '뉴스 목록으로 돌아가기',
    homeNewsEyebrow: '시선과 유산',
    homeNewsEyebrowAlt: '새 소식',
    homeNewsTitle: '사이공 뉴스 & 이야기',
    homeNewsDesc: '믿을 수 있는 문화 미디어를 통해 사이공의 유산과 일상, 최신 여행 팁을 만나보세요.',
    homeNewsAll: '전체 뉴스 보기',
  },
};

export function tNews(lang: SupportedLanguage, key: keyof NewsTranslation): string {
  const dictionary = NEWS_TRANSLATIONS[lang] || NEWS_TRANSLATIONS.vi;
  return dictionary[key] || NEWS_TRANSLATIONS.vi[key] || '';
}
