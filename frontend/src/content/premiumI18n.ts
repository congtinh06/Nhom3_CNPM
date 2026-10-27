import { SupportedLanguage } from '../types';

export interface PremiumFeature {
  title: string;
  description: string;
}

export interface PremiumStep {
  title: string;
  description: string;
}

export interface PremiumCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  freeBadge: string;
  offerBadge: string;
  activeBadge: string;
  requestedLanguageNote: string;
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefits: PremiumFeature[];
  purchaseTitle: string;
  purchaseDescription: string;
  priceUnit: string;
  checkoutCta: string;
  checkoutPending: string;
  loginNote: string;
  secureNote: string;
  activeCta: string;
  continueCta: string;
  expiryLabel: string;
  packageBadge: string;
  packageTitle: string;
  packageDescription: string;
  packageIncludesLabel: string;
  discountTitle: string;
  discountDescription: string;
  discountCta: string;
  videoLabel: string;
  videoSectionTitle: string;
  videoSectionSubtitle: string;
  videoWatchCta: string;
  videoCloseCta: string;
  videoSourceLabel: string;
  videoSectionNote: string;
  detailsLabel: string;
  mediaExperienceCta: string;
  mediaLockedNote: string;
  listenCta: string;
  souvenirDiscountLabel: string;
  discountActiveNote: string;
  discountInactiveNote: string;
  poiSearchPlaceholder: string;
  poiNoResults: string;
  clearSearch: string;
  languagesTitle: string;
  languagesSubtitle: string;
  languageDescriptions: Record<'en' | 'ja' | 'ko', string>;
  includedLabel: string;
  openLabel: string;
  lockedLabel: string;
  stopsTitle: string;
  stopsSubtitle: string;
  stopColumn: string;
  languagesColumn: string;
  statusColumn: string;
  freeLabel: string;
  premiumLabel: string;
  stepsTitle: string;
  steps: PremiumStep[];
  closingTitle: string;
  closingDescription: string;
  backToTour: string;
  paymentError: string;
  paymentCancelled: string;
  paymentFailed: string;
  pendingBadge: string;
  pendingValue: string;
  pendingDescription: string;
  pendingCheckAgain: string;
  pendingTimedOut: string;
  retryCheckout: string;
  entitlementErrorTitle: string;
  entitlementErrorDescription: string;
  retry: string;
  dataLoading: string;
  dataError: string;
}

export const PREMIUM_COPY: Record<SupportedLanguage, PremiumCopy> = {
  vi: {
    eyebrow: 'ECHORA PREMIUM',
    title: 'Sài Gòn kể chuyện bằng ngôn ngữ của bạn',
    subtitle:
      'Mở khóa thuyết minh tiếng Anh, Nhật và Hàn cho toàn bộ hành trình. Tiếng Việt vẫn luôn miễn phí.',
    freeBadge: 'Gói miễn phí',
    offerBadge: 'Gói Premium',
    activeBadge: 'Premium đang hoạt động',
    requestedLanguageNote:
      'Bạn đã chọn ngôn ngữ cần Premium. Hoàn tất thanh toán để tiếp tục với ngôn ngữ này.',
    benefitsTitle: 'Quyền lợi Premium',
    benefitsSubtitle:
      'Mọi quyền lợi đều gắn với tài khoản của bạn và dựa trên nội dung thuyết minh hiện có.',
    benefits: [
      {
        title: 'Một gói, bốn ngôn ngữ',
        description:
          'Tiếng Việt miễn phí cho mọi du khách. Một lần mua Premium mở khóa trọn bộ tiếng Anh, Nhật và Hàn.',
      },
      {
        title: '{count} bản thuyết minh chi tiết',
        description:
          'Nội dung biên tập đầy đủ cho từng điểm đến, gồm câu chuyện, kiến trúc và bối cảnh lịch sử.',
      },
      {
        title: 'Video giới thiệu từng điểm',
        description:
          'Xem trước không gian, kiến trúc và nhịp sống của mỗi điểm đến trước khi bắt đầu tham quan.',
      },
      {
        title: 'Giảm 10% quà lưu niệm',
        description:
          'Ưu đãi 10% cho từng sản phẩm lưu niệm khi mua sắm trong hành trình Echora.',
      },
    ],
    purchaseTitle: 'Combo Premium 7 điểm',
    purchaseDescription:
      'Một lần thanh toán 500.000đ mở khóa {count} bản thuyết minh tiếng Anh, Nhật, Hàn cho {poiCount} điểm đến, kèm video giới thiệu và ưu đãi 10% quà lưu niệm. Mua lẻ 100.000đ/điểm.',
    priceUnit: 'combo 7 điểm, thanh toán một lần',
    checkoutCta: 'Thanh toán 500.000đ qua VNPAY',
    checkoutPending: 'Đang chuyển sang VNPAY...',
    loginNote: 'Bạn cần đăng nhập để tiếp tục thanh toán.',
    secureNote:
      'Thanh toán qua VNPAY sandbox. Premium được kích hoạt cho tài khoản sau khi giao dịch thành công.',
    activeCta: 'Premium đã kích hoạt',
    continueCta: 'Tiếp tục trải nghiệm',
    expiryLabel: 'Có hiệu lực đến',
    packageBadge: 'Một gói duy nhất',
    packageTitle: 'Một gói Premium, bốn ngôn ngữ',
    packageDescription:
      'Không còn mua riêng từng ngôn ngữ. Tiếng Việt luôn miễn phí; Premium mở khóa đồng thời tiếng Anh, Nhật và Hàn cho toàn bộ hành trình.',
    packageIncludesLabel: 'Bao gồm trong gói',
    discountTitle: 'Giảm 10% mỗi sản phẩm lưu niệm',
    discountDescription:
      'Chủ tài khoản Premium được giảm 10% trên từng sản phẩm lưu niệm tại cửa hàng Echora. Ưu đãi áp dụng tự động khi thanh toán.',
    discountCta: 'Khám phá quà lưu niệm',
    videoLabel: 'Video giới thiệu',
    videoSectionTitle: 'Video giới thiệu 7 điểm đến',
    videoSectionSubtitle:
      'Xem trước không gian, kiến trúc và nhịp sống của từng điểm đến trước khi bắt đầu hành trình.',
    videoWatchCta: 'Xem video',
    videoCloseCta: 'Đóng video',
    videoSourceLabel: 'Nguồn',
    videoSectionNote:
      'Video được nhúng trực tiếp từ YouTube; nguồn và kênh phát hành hiển thị trên từng thẻ.',
    detailsLabel: 'Nội dung thuyết minh chi tiết',
    mediaExperienceCta: 'Xem video & nghe thuyết minh',
    mediaLockedNote: 'Mở khóa điểm này để xem video và nghe thuyết minh.',
    listenCta: 'Nghe thuyết minh',
    souvenirDiscountLabel: 'Giảm 10% quà lưu niệm',
    discountActiveNote:
      'Ưu đãi đang áp dụng tự động cho tài khoản Premium của bạn khi thanh toán.',
    discountInactiveNote:
      'Ưu đãi được áp dụng tự động sau khi bạn kích hoạt Premium.',
    poiSearchPlaceholder: 'Tìm điểm đến muốn mở khóa...',
    poiNoResults: 'Không tìm thấy điểm đến phù hợp.',
    clearSearch: 'Xóa tìm kiếm',
    languagesTitle: 'Một gói Premium, bốn ngôn ngữ',
    languagesSubtitle:
      'Tiếng Việt miễn phí. Một lần mua Premium mở khóa tiếng Anh, Nhật và Hàn, không bán riêng từng gói.',
    languageDescriptions: {
      en: 'Thuyết minh tiếng Anh cho toàn bộ điểm đến trong hành trình.',
      ja: 'Thuyết minh tiếng Nhật với nội dung được biên tập cho du khách Nhật Bản.',
      ko: 'Thuyết minh tiếng Hàn với nội dung được biên tập cho du khách Hàn Quốc.',
    },
    includedLabel: 'Đã bao gồm',
    openLabel: 'Đã mở khóa',
    lockedLabel: 'Cần Premium',
    stopsTitle: 'Nội dung trong hành trình',
    stopsSubtitle:
      'Mỗi điểm đến có bản tiếng Việt miễn phí và ba bản ngoại ngữ thuộc quyền Premium.',
    stopColumn: 'Điểm đến',
    languagesColumn: 'Ngôn ngữ',
    statusColumn: 'Trạng thái',
    freeLabel: 'Miễn phí',
    premiumLabel: 'Premium',
    stepsTitle: 'Cách hoạt động',
    steps: [
      {
        title: 'Chọn ngôn ngữ',
        description: 'Chọn tiếng Anh, Nhật hoặc Hàn ở thanh ngôn ngữ hoặc trên trang quét QR.',
      },
      {
        title: 'Thanh toán qua VNPAY',
        description: 'Hoàn tất giao dịch một lần để kích hoạt Premium cho tài khoản đang đăng nhập.',
      },
      {
        title: 'Nghe và tiếp tục hành trình',
        description: 'Quay lại điểm đến hoặc mã QR vừa chọn, ngôn ngữ đã chọn sẽ được giữ nguyên.',
      },
    ],
    closingTitle: 'Sẵn sàng kể câu chuyện Sài Gòn cho mọi du khách',
    closingDescription:
      'Kích hoạt Premium để mỗi điểm đến có thể được nghe bằng ngôn ngữ phù hợp với từng người.',
    backToTour: 'Về trang điểm đến',
    paymentError: 'Không thể tạo thanh toán VNPAY. Vui lòng thử lại.',
    paymentCancelled: 'Giao dịch đã bị hủy. Bạn có thể thử lại khi sẵn sàng.',
    paymentFailed: 'Thanh toán chưa thành công hoặc bị gián đoạn. Vui lòng thử lại.',
    pendingBadge: 'Đang chờ xác nhận',
    pendingValue: 'Đang kiểm tra giao dịch...',
    pendingDescription:
      'Hệ thống đang đồng bộ kết quả thanh toán từ VNPAY. Bạn không cần thanh toán lại.',
    pendingCheckAgain: 'Kiểm tra lại',
    pendingTimedOut: 'Chưa nhận được xác nhận. Bạn có thể kiểm tra lại hoặc thử thanh toán mới.',
    retryCheckout: 'Thanh toán lại',
    entitlementErrorTitle: 'Chưa tải được trạng thái Premium',
    entitlementErrorDescription:
      'Kết nối tới máy chủ đang gián đoạn. Trạng thái gói của bạn vẫn được giữ nguyên.',
    retry: 'Thử lại',
    dataLoading: 'Đang tải nội dung Premium...',
    dataError: 'Chưa tải được danh sách điểm đến. Vui lòng thử lại.',
  },
  en: {
    eyebrow: 'ECHORA PREMIUM',
    title: 'Let Saigon speak your language',
    subtitle:
      'Unlock English, Japanese and Korean narration across the whole journey. Vietnamese stays free.',
    freeBadge: 'Free plan',
    offerBadge: 'Premium plan',
    activeBadge: 'Premium is active',
    requestedLanguageNote:
      'The language you selected requires Premium. Complete payment to continue in that language.',
    benefitsTitle: 'Premium benefits',
    benefitsSubtitle:
      'Every benefit is tied to your account and based on the narration already available.',
    benefits: [
      {
        title: 'One plan, four languages',
        description:
          'Vietnamese is free for every visitor. One Premium purchase unlocks English, Japanese and Korean together.',
      },
      {
        title: '{count} detailed narration scripts',
        description:
          'Full edited stories for every stop, covering architecture, local life and historical context.',
      },
      {
        title: 'Intro videos for every stop',
        description:
          'Preview the space, architecture and rhythm of each destination before you arrive.',
      },
      {
        title: '10% off souvenirs',
        description:
          'Save 10% on every souvenir product when you shop during your Echora journey.',
      },
    ],
    purchaseTitle: 'Premium combo for 7 stops',
    purchaseDescription:
      'One payment of 500,000₫ unlocks {count} English, Japanese and Korean narration scripts for {poiCount} stops, plus intro videos and 10% off souvenirs. Single stops cost 100,000₫ each.',
    priceUnit: '7-stop combo, one-time payment',
    checkoutCta: 'Pay 500,000₫ with VNPAY',
    checkoutPending: 'Redirecting to VNPAY...',
    loginNote: 'Please sign in to continue to payment.',
    secureNote:
      'Payment runs through the VNPAY sandbox. Premium is activated for your account after a successful transaction.',
    activeCta: 'Premium is active',
    continueCta: 'Continue exploring',
    expiryLabel: 'Valid until',
    packageBadge: 'One plan only',
    packageTitle: 'One Premium plan, four languages',
    packageDescription:
      'No more buying each language separately. Vietnamese stays free; Premium unlocks English, Japanese and Korean across the whole journey.',
    packageIncludesLabel: 'Included in the plan',
    discountTitle: '10% off every souvenir',
    discountDescription:
      'Premium account holders get 10% off each souvenir product at the Echora shop. The discount is applied automatically at checkout.',
    discountCta: 'Explore souvenirs',
    videoLabel: 'Intro video',
    videoSectionTitle: 'Intro videos for all 7 stops',
    videoSectionSubtitle:
      'Preview each destination’s space, architecture and everyday rhythm before you set off.',
    videoWatchCta: 'Watch video',
    videoCloseCta: 'Close video',
    videoSourceLabel: 'Source',
    videoSectionNote:
      'Videos are embedded directly from YouTube; the original channel is credited on every card.',
    detailsLabel: 'Detailed narration content',
    mediaExperienceCta: 'Watch video & listen to narration',
    mediaLockedNote: 'Unlock this stop to watch the video and listen to the narration.',
    listenCta: 'Listen to narration',
    souvenirDiscountLabel: '10% off souvenirs',
    discountActiveNote:
      'The discount is applied automatically at checkout for your Premium account.',
    discountInactiveNote:
      'The discount applies automatically once you activate Premium.',
    poiSearchPlaceholder: 'Find a stop to unlock...',
    poiNoResults: 'No matching stops found.',
    clearSearch: 'Clear search',
    languagesTitle: 'One Premium plan, four languages',
    languagesSubtitle:
      'Vietnamese is free. One Premium purchase unlocks English, Japanese and Korean together, never sold separately.',
    languageDescriptions: {
      en: 'English narration for every stop in the journey.',
      ja: 'Japanese narration written for visitors from Japan.',
      ko: 'Korean narration written for visitors from Korea.',
    },
    includedLabel: 'Included',
    openLabel: 'Unlocked',
    lockedLabel: 'Premium required',
    stopsTitle: 'Content across the journey',
    stopsSubtitle:
      'Every stop includes free Vietnamese narration plus three Premium languages.',
    stopColumn: 'Stop',
    languagesColumn: 'Languages',
    statusColumn: 'Status',
    freeLabel: 'Free',
    premiumLabel: 'Premium',
    stepsTitle: 'How it works',
    steps: [
      {
        title: 'Choose a language',
        description: 'Pick English, Japanese or Korean in the language menu or on the QR page.',
      },
      {
        title: 'Pay with VNPAY',
        description: 'Complete one payment to activate Premium for the signed-in account.',
      },
      {
        title: 'Listen and continue',
        description: 'Return to your stop or QR code and your language choice is kept.',
      },
    ],
    closingTitle: 'Ready to share Saigon with every visitor',
    closingDescription:
      'Activate Premium so every stop can be heard in the language that suits each guest.',
    backToTour: 'Back to attractions',
    paymentError: 'Could not create the VNPAY payment. Please try again.',
    paymentCancelled: 'The transaction was cancelled. You can try again when ready.',
    paymentFailed: 'The payment did not complete. Please try again.',
    pendingBadge: 'Awaiting confirmation',
    pendingValue: 'Checking the transaction...',
    pendingDescription:
      'We are syncing the VNPAY result. You do not need to pay again.',
    pendingCheckAgain: 'Check again',
    pendingTimedOut: 'No confirmation yet. Check again or start a new payment.',
    retryCheckout: 'Pay again',
    entitlementErrorTitle: 'Could not load Premium status',
    entitlementErrorDescription:
      'The server connection was interrupted. Your current plan is unchanged.',
    retry: 'Try again',
    dataLoading: 'Loading Premium content...',
    dataError: 'Could not load the stop list. Please try again.',
  },
  ja: {
    eyebrow: 'ECHORA PREMIUM',
    title: 'サイゴンを、あなたの言語で',
    subtitle:
      '旅のすべてのスポットで英語、日本語、韓国語の音声ガイドを利用できます。ベトナム語は無料です。',
    freeBadge: '無料プラン',
    offerBadge: 'Premium プラン',
    activeBadge: 'Premium 利用中',
    requestedLanguageNote:
      '選択した言語には Premium が必要です。決済を完了すると、その言語で続けられます。',
    benefitsTitle: 'Premium の特典',
    benefitsSubtitle:
      '特典はすべてアカウントに紐づき、現在提供している音声ガイド内容に基づきます。',
    benefits: [
      {
        title: '1つのプランで4言語',
        description:
          'ベトナム語はすべての訪問者に無料。Premium を1回購入すると、英語・日本語・韓国語をまとめて利用できます。',
      },
      {
        title: '詳細な音声ガイド{count}本',
        description:
          '各スポットの建築、歴史、現地の暮らしを詳しく紹介する編集済みの内容です。',
      },
      {
        title: '各スポットの紹介動画',
        description:
          '訪問前に、それぞれの場所の空間や建築、雰囲気を動画で確認できます。',
      },
      {
        title: 'お土産10%オフ',
        description:
          'Echora の旅でお土産を購入すると、商品ごとに10%割引が適用されます。',
      },
    ],
    purchaseTitle: '7スポット Premium セット',
    purchaseDescription:
      '500,000đの1回の決済で、{poiCount}スポットの英語・日本語・韓国語の音声ガイド{count}本、紹介動画、お土産10%オフを利用できます。単品は1スポット100,000đです。',
    priceUnit: '7スポットセット・一括払い',
    checkoutCta: 'VNPAYで500,000đを支払う',
    checkoutPending: 'VNPAYへ移動中...',
    loginNote: 'お支払いにはログインが必要です。',
    secureNote:
      'VNPAYサンドボックスで決済します。決済完了後、アカウントに Premium が有効になります。',
    activeCta: 'Premium は有効です',
    continueCta: '体験を続ける',
    expiryLabel: '有効期限',
    packageBadge: '1つのプランだけ',
    packageTitle: '1つの Premium プランで4言語',
    packageDescription:
      '言語ごとに購入する必要はありません。ベトナム語は無料のまま、Premium で英語・日本語・韓国語を旅全体にわたって利用できます。',
    packageIncludesLabel: 'プランに含まれるもの',
    discountTitle: 'お土産すべて10%オフ',
    discountDescription:
      'Premium アカウントの方は、Echora ショップのお土産1点ごとに10%割引。決済時に自動で適用されます。',
    discountCta: 'お土産を見る',
    videoLabel: '紹介動画',
    videoSectionTitle: '7スポットの紹介動画',
    videoSectionSubtitle:
      '出発前に、各スポットの空間や建築、日常の雰囲気を動画でご覧ください。',
    videoWatchCta: '動画を見る',
    videoCloseCta: '動画を閉じる',
    videoSourceLabel: '出典',
    videoSectionNote:
      '動画はYouTubeから直接埋め込まれています。各カードに出典チャンネルを表示しています。',
    detailsLabel: '詳細な音声ガイド',
    mediaExperienceCta: '動画を見る・音声ガイドを聞く',
    mediaLockedNote: 'このスポットを解除すると、動画と音声ガイドを利用できます。',
    listenCta: '音声ガイドを聞く',
    souvenirDiscountLabel: 'お土産10%オフ',
    discountActiveNote:
      'Premiumアカウントの決済時に自動で適用されます。',
    discountInactiveNote:
      'Premiumを有効にすると自動で適用されます。',
    poiSearchPlaceholder: '解除したいスポットを検索...',
    poiNoResults: '該当するスポットが見つかりません。',
    clearSearch: '検索をクリア',
    languagesTitle: '1つの Premium プランで4言語',
    languagesSubtitle:
      'ベトナム語は無料。Premium を1回購入すると英語・日本語・韓国語がまとめて利用でき、個別販売はありません。',
    languageDescriptions: {
      en: '旅のすべてのスポットの英語音声ガイドです。',
      ja: '日本人旅行者向けに編集された日本語音声ガイドです。',
      ko: '韓国からの旅行者向けに編集された韓国語音声ガイドです。',
    },
    includedLabel: '含まれます',
    openLabel: '利用可能',
    lockedLabel: 'Premium が必要',
    stopsTitle: '旅のコンテンツ',
    stopsSubtitle:
      '各スポットには無料のベトナム語ガイドと、Premium 向けの3言語ガイドがあります。',
    stopColumn: 'スポット',
    languagesColumn: '言語',
    statusColumn: '状態',
    freeLabel: '無料',
    premiumLabel: 'Premium',
    stepsTitle: '利用方法',
    steps: [
      {
        title: '言語を選ぶ',
        description: '言語メニューまたは QR 画面で英語、日本語、韓国語を選びます。',
      },
      {
        title: 'VNPAY で支払う',
        description: '一度の決済で、ログイン中のアカウントに Premium を有効にします。',
      },
      {
        title: '聞いて旅を続ける',
        description: '選んだスポットまたは QR コードに戻ると、言語の選択が保持されています。',
      },
    ],
    closingTitle: 'すべての訪問者にサイゴンの物語を',
    closingDescription:
      'Premium を有効にすると、各スポットを相手に合った言語で聞いてもらえます。',
    backToTour: '観光スポットへ戻る',
    paymentError: 'VNPAY決済を作成できませんでした。もう一度お試しください。',
    paymentCancelled: '取引はキャンセルされました。準備ができたら再試行できます。',
    paymentFailed: '決済が完了しませんでした。もう一度お試しください。',
    pendingBadge: '確認待ち',
    pendingValue: '取引を確認しています...',
    pendingDescription:
      'VNPAY の決済結果を同期しています。再度お支払いいただく必要はありません。',
    pendingCheckAgain: '再確認',
    pendingTimedOut: 'まだ確認できません。再確認するか、新しい決済を開始してください。',
    retryCheckout: '再決済',
    entitlementErrorTitle: 'Premium の状態を読み込めません',
    entitlementErrorDescription:
      'サーバーとの接続が中断されました。現在のプランは変更されません。',
    retry: '再試行',
    dataLoading: 'Premium コンテンツを読み込み中...',
    dataError: 'スポット一覧を読み込めませんでした。もう一度お試しください。',
  },
  ko: {
    eyebrow: 'ECHORA PREMIUM',
    title: '사이공을 당신의 언어로 만나보세요',
    subtitle:
      '여행의 모든 명소에서 영어, 일본어, 한국어 해설을 이용할 수 있습니다. 베트남어는 무료입니다.',
    freeBadge: '무료 요금제',
    offerBadge: 'Premium 요금제',
    activeBadge: 'Premium 사용 중',
    requestedLanguageNote:
      '선택한 언어는 Premium이 필요합니다. 결제를 완료하면 해당 언어로 계속할 수 있습니다.',
    benefitsTitle: 'Premium 혜택',
    benefitsSubtitle:
      '모든 혜택은 계정에 연결되며 현재 제공되는 해설 콘텐츠를 기준으로 합니다.',
    benefits: [
      {
        title: '하나의 플랜, 네 개 언어',
        description:
          '베트남어는 모든 방문객에게 무료입니다. Premium을 한 번 구매하면 영어, 일본어, 한국어를 함께 이용할 수 있습니다.',
      },
      {
        title: '상세 해설 {count}개',
        description:
          '각 명소의 건축, 역사, 현지 생활을 담은 편집된 이야기를 제공합니다.',
      },
      {
        title: '명소별 소개 영상',
        description:
          '방문 전에 각 장소의 공간과 건축, 분위기를 영상으로 미리 확인하세요.',
      },
      {
        title: '기념품 10% 할인',
        description:
          'Echora 여행 중 기념품을 구매하면 상품마다 10% 할인이 적용됩니다.',
      },
    ],
    purchaseTitle: '7개 명소 Premium 콤보',
    purchaseDescription:
      '500,000đ을 한 번 결제하면 {poiCount}개 명소의 영어, 일본어, 한국어 해설 {count}개와 소개 영상, 기념품 10% 할인을 이용할 수 있습니다. 단품은 명소당 100,000đ입니다.',
    priceUnit: '7개 명소 콤보, 1회 결제',
    checkoutCta: 'VNPAY로 500,000đ 결제',
    checkoutPending: 'VNPAY로 이동 중...',
    loginNote: '결제하려면 로그인이 필요합니다.',
    secureNote:
      'VNPAY 샌드박스로 결제합니다. 결제가 완료되면 계정에 Premium이 활성화됩니다.',
    activeCta: 'Premium이 활성화되었습니다',
    continueCta: '계속 둘러보기',
    expiryLabel: '유효 기간',
    packageBadge: '하나의 플랜',
    packageTitle: '하나의 Premium 플랜, 네 개 언어',
    packageDescription:
      '언어별로 따로 구매할 필요가 없습니다. 베트남어는 무료이며, Premium으로 영어, 일본어, 한국어를 여행 전체에서 이용하세요.',
    packageIncludesLabel: '플랜에 포함된 항목',
    discountTitle: '모든 기념품 10% 할인',
    discountDescription:
      'Premium 계정은 Echora 상점의 기념품마다 10% 할인을 받습니다. 결제 시 자동으로 적용됩니다.',
    discountCta: '기념품 둘러보기',
    videoLabel: '소개 영상',
    videoSectionTitle: '7개 명소 소개 영상',
    videoSectionSubtitle:
      '출발 전에 각 명소의 공간과 건축, 일상의 분위기를 영상으로 미리 만나보세요.',
    videoWatchCta: '영상 보기',
    videoCloseCta: '영상 닫기',
    videoSourceLabel: '출처',
    videoSectionNote:
      '영상은 YouTube에서 직접 불러오며, 각 카드에 원본 채널을 표시합니다.',
    detailsLabel: '상세 해설 콘텐츠',
    mediaExperienceCta: '영상 보기 & 해설 듣기',
    mediaLockedNote: '이 명소를 해제하면 영상과 해설을 이용할 수 있습니다.',
    listenCta: '해설 듣기',
    souvenirDiscountLabel: '기념품 10% 할인',
    discountActiveNote:
      'Premium 계정 결제 시 자동으로 적용됩니다.',
    discountInactiveNote:
      'Premium을 활성화하면 자동으로 적용됩니다.',
    poiSearchPlaceholder: '해제할 명소 검색...',
    poiNoResults: '일치하는 명소가 없습니다.',
    clearSearch: '검색 지우기',
    languagesTitle: '하나의 Premium 플랜, 네 개 언어',
    languagesSubtitle:
      '베트남어는 무료입니다. Premium을 한 번 구매하면 영어, 일본어, 한국어가 함께 열리며 개별 판매는 없습니다.',
    languageDescriptions: {
      en: '여행의 모든 명소를 위한 영어 해설입니다.',
      ja: '일본인 여행자를 위해 편집된 일본어 해설입니다.',
      ko: '한국인 여행자를 위해 편집된 한국어 해설입니다.',
    },
    includedLabel: '포함',
    openLabel: '이용 가능',
    lockedLabel: 'Premium 필요',
    stopsTitle: '여행의 콘텐츠',
    stopsSubtitle:
      '각 명소에는 무료 베트남어 해설과 Premium용 3개 언어 해설이 있습니다.',
    stopColumn: '명소',
    languagesColumn: '언어',
    statusColumn: '상태',
    freeLabel: '무료',
    premiumLabel: 'Premium',
    stepsTitle: '이용 방법',
    steps: [
      {
        title: '언어 선택',
        description: '언어 메뉴 또는 QR 화면에서 영어, 일본어, 한국어를 선택합니다.',
      },
      {
        title: 'VNPAY로 결제',
        description: '한 번의 결제로 로그인한 계정에 Premium을 활성화합니다.',
      },
      {
        title: '듣고 여행 계속하기',
        description: '선택한 명소나 QR 코드로 돌아오면 선택한 언어가 유지됩니다.',
      },
    ],
    closingTitle: '모든 방문객에게 사이공의 이야기를',
    closingDescription:
      'Premium을 활성화하면 각 명소를 방문객에게 맞는 언어로 들려줄 수 있습니다.',
    backToTour: '명소 페이지로',
    paymentError: 'VNPAY 결제를 생성할 수 없습니다. 다시 시도해 주세요.',
    paymentCancelled: '거래가 취소되었습니다. 준비되면 다시 시도할 수 있습니다.',
    paymentFailed: '결제가 완료되지 않았습니다. 다시 시도해 주세요.',
    pendingBadge: '확인 대기 중',
    pendingValue: '거래를 확인하는 중...',
    pendingDescription:
      'VNPAY 결제 결과를 동기화하고 있습니다. 다시 결제할 필요가 없습니다.',
    pendingCheckAgain: '다시 확인',
    pendingTimedOut: '아직 확인되지 않았습니다. 다시 확인하거나 새 결제를 시작하세요.',
    retryCheckout: '다시 결제',
    entitlementErrorTitle: 'Premium 상태를 불러오지 못했습니다',
    entitlementErrorDescription:
      '서버 연결이 중단되었습니다. 현재 요금제는 그대로 유지됩니다.',
    retry: '다시 시도',
    dataLoading: 'Premium 콘텐츠를 불러오는 중...',
    dataError: '명소 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
  },
};

export function formatPremiumText(
  text: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    text
  );
}
