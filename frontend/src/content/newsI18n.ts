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
    newPill: 'Có bài mới · Tải lại',
    bannerTitle: 'Bắt đầu tuyến thuyết minh 5 điểm',
    bannerBtn: 'Nghe thử',
    seeAll: 'Xem tất cả',
    latest: 'Mới nhất',
    mightMiss: 'Bạn có thể bỏ lỡ',
    minutesRead: 'PHÚT ĐỌC',
    newBadge: 'Mới',
    emptyFilterMessage: 'Không tìm thấy bài viết nào trong chuyên mục đã chọn.',
    readAtSource: 'Đọc tại',
    relatedArticles: 'Bài liên quan',
    relatedPois: 'Điểm tham quan liên quan',
    breadcrumbHome: 'Trang chủ',
    breadcrumbNews: 'Tin tức',
    notFoundTitle: 'Không tìm thấy bài viết',
    notFoundMessage: 'Bài viết bạn đang tìm không tồn tại hoặc đã được chuyển địa chỉ.',
    backToNews: 'Quay lại Tin tức',
    retry: 'Thử lại',
    loading: 'Đang tải tin tức...',
    errorLoad: 'Đã xảy ra lỗi khi tải tin tức. Vui lòng thử lại sau.',
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
    newPill: 'New stories available · Refresh',
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
    newPill: '新着記事があります · 再読み込み',
    bannerTitle: '5大名所の音声ガイドツアーを開始',
    bannerBtn: '試聴する',
    seeAll: 'すべて見る',
    latest: '最新情報',
    mightMiss: 'おすすめ記事',
    minutesRead: '分で読める',
    newBadge: '新着',
    emptyFilterMessage: '選択されたカテゴリーに記事は見つかりませんでした。',
    readAtSource: '元記事を読む：',
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
    newPill: '새 기사 등록됨 · 새로고침',
    bannerTitle: '5대 명소 오디오 가이드 투어 시작하기',
    bannerBtn: '체험하기',
    seeAll: '전체보기',
    latest: '최신순',
    mightMiss: '놓치지 말아야 할 기사',
    minutesRead: '분 소요',
    newBadge: '새소식',
    emptyFilterMessage: '선택한 카테고리에 등록된 기사가 없습니다.',
    readAtSource: '원문 보기:',
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
  },
};

export function tNews(lang: SupportedLanguage, key: keyof NewsTranslation): string {
  const dictionary = NEWS_TRANSLATIONS[lang] || NEWS_TRANSLATIONS.vi;
  return dictionary[key] || NEWS_TRANSLATIONS.vi[key] || '';
}
