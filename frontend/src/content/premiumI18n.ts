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
        title: '{languageCount} ngôn ngữ quốc tế',
        description: 'Nghe thuyết minh tiếng Anh, Nhật và Hàn với đúng giọng đọc của từng ngôn ngữ.',
      },
      {
        title: '{count} bản thuyết minh',
        description: 'Mở khóa toàn bộ nội dung ngoại ngữ của {poiCount} điểm đến trong hành trình.',
      },
      {
        title: 'Quét QR cho khách quốc tế',
        description: 'Khách quét mã tại điểm đến có thể nghe ngay bằng ngôn ngữ mình chọn.',
      },
      {
        title: 'Tự động thuyết minh theo GPS',
        description: 'Bật tự động thuyết minh và nghe đúng điểm đến khi bước vào bán kính kích hoạt.',
      },
    ],
    purchaseTitle: 'Premium trọn bộ',
    purchaseDescription:
      'Mở khóa {count} bản thuyết minh ngoại ngữ của {poiCount} điểm đến trên tài khoản của bạn.',
    priceUnit: 'thanh toán một lần',
    checkoutCta: 'Thanh toán 500.000đ qua VNPAY',
    checkoutPending: 'Đang chuyển sang VNPAY...',
    loginNote: 'Bạn cần đăng nhập để tiếp tục thanh toán.',
    secureNote:
      'Thanh toán qua VNPAY sandbox. Premium được kích hoạt cho tài khoản sau khi giao dịch thành công.',
    activeCta: 'Premium đã kích hoạt',
    continueCta: 'Tiếp tục trải nghiệm',
    expiryLabel: 'Có hiệu lực đến',
    languagesTitle: '3 gói ngôn ngữ trong Premium',
    languagesSubtitle:
      'Ba ngôn ngữ quốc tế dùng chung một quyền Premium, không cần mua riêng từng gói.',
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
        title: '{languageCount} international languages',
        description: 'Hear English, Japanese and Korean narration with a matching voice.',
      },
      {
        title: '{count} narration scripts',
        description: 'Unlock every foreign-language script across the {poiCount} stops.',
      },
      {
        title: 'QR access for international guests',
        description: 'Guests can scan the code at a stop and listen in the language they choose.',
      },
      {
        title: 'GPS auto narration',
        description: 'Turn on auto narration and hear the right stop when you enter its radius.',
      },
    ],
    purchaseTitle: 'Premium access',
    purchaseDescription:
      'Unlock {count} foreign-language narration scripts across {poiCount} stops on your account.',
    priceUnit: 'one-time payment',
    checkoutCta: 'Pay 500,000₫ with VNPAY',
    checkoutPending: 'Redirecting to VNPAY...',
    loginNote: 'Please sign in to continue to payment.',
    secureNote:
      'Payment runs through the VNPAY sandbox. Premium is activated for your account after a successful transaction.',
    activeCta: 'Premium is active',
    continueCta: 'Continue exploring',
    expiryLabel: 'Valid until',
    languagesTitle: '3 language packages in Premium',
    languagesSubtitle:
      'All three international languages share one Premium entitlement, with no separate purchase.',
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
        title: '{languageCount}つの国際言語',
        description: '英語、日本語、韓国語の音声ガイドを、それぞれの言語の声で聞けます。',
      },
      {
        title: '音声ガイド{count}本',
        description: '{poiCount}スポットの外国語コンテンツをすべて利用できます。',
      },
      {
        title: '海外からのお客様向け QR',
        description: 'スポットで QR コードを読み取り、選んだ言語ですぐに聞けます。',
      },
      {
        title: 'GPS 自動ガイド',
        description: '自動ガイドをオンにすると、対象範囲に入ったスポットを自動で再生します。',
      },
    ],
    purchaseTitle: 'Premium アクセス',
    purchaseDescription:
      '{poiCount}スポットの外国語音声ガイド{count}本を、アカウントで利用できます。',
    priceUnit: '一括払い',
    checkoutCta: 'VNPAYで500,000đを支払う',
    checkoutPending: 'VNPAYへ移動中...',
    loginNote: 'お支払いにはログインが必要です。',
    secureNote:
      'VNPAYサンドボックスで決済します。決済完了後、アカウントに Premium が有効になります。',
    activeCta: 'Premium は有効です',
    continueCta: '体験を続ける',
    expiryLabel: '有効期限',
    languagesTitle: 'Premiumに含まれる3つの言語パッケージ',
    languagesSubtitle:
      '3つの国際言語は1つの Premium 権利に含まれ、個別購入は不要です。',
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
        title: '{languageCount}개 국제 언어',
        description: '영어, 일본어, 한국어 해설을 각 언어에 맞는 음성으로 들을 수 있습니다.',
      },
      {
        title: '해설 {count}개',
        description: '{poiCount}개 명소의 모든 외국어 콘텐츠를 이용할 수 있습니다.',
      },
      {
        title: '외국인 방문객을 위한 QR',
        description: '명소에서 QR 코드를 스캔하고 원하는 언어로 바로 들을 수 있습니다.',
      },
      {
        title: 'GPS 자동 해설',
        description: '자동 해설을 켜면 반경에 들어선 명소의 해설이 자동으로 재생됩니다.',
      },
    ],
    purchaseTitle: 'Premium 이용권',
    purchaseDescription:
      '{poiCount}개 명소의 외국어 해설 {count}개를 계정에서 이용할 수 있습니다.',
    priceUnit: '1회 결제',
    checkoutCta: 'VNPAY로 500,000đ 결제',
    checkoutPending: 'VNPAY로 이동 중...',
    loginNote: '결제하려면 로그인이 필요합니다.',
    secureNote:
      'VNPAY 샌드박스로 결제합니다. 결제가 완료되면 계정에 Premium이 활성화됩니다.',
    activeCta: 'Premium이 활성화되었습니다',
    continueCta: '계속 둘러보기',
    expiryLabel: '유효 기간',
    languagesTitle: '프리미엄에 포함된 3개 언어 패키지',
    languagesSubtitle:
      '3개 국제 언어는 하나의 Premium 이용권에 포함되며 별도 구매가 필요하지 않습니다.',
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
