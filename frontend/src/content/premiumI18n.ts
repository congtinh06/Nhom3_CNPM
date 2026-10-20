import { SupportedLanguage } from '../types';

interface PremiumFeature {
  title: string;
  description: string;
}

interface PremiumStep {
  title: string;
  description: string;
}

export interface PremiumCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  freeBadge: string;
  activeBadge: string;
  offerTitle: string;
  offerDescription: string;
  demoLabel: string;
  demoValue: string;
  demoNote: string;
  activateCta: string;
  continueCta: string;
  activeCta: string;
  deactivateCta: string;
  deactivatedNote: string;
  benefitsTitle: string;
  benefitsSubtitle: string;
  benefits: PremiumFeature[];
  contentTitle: string;
  contentSubtitle: string;
  freeLanguage: string;
  premiumLanguage: string;
  stepsTitle: string;
  steps: PremiumStep[];
  closingTitle: string;
  closingDescription: string;
  backToTour: string;
  requestedLanguageNote: string;
  unlockedNotice: string;
}

export const PREMIUM_COPY: Record<SupportedLanguage, PremiumCopy> = {
  vi: {
    eyebrow: 'ECHORA PREMIUM',
    title: 'Sài Gòn kể chuyện bằng ngôn ngữ của bạn',
    subtitle:
      'Mở khóa thuyết minh tiếng Anh, Nhật và Hàn cho toàn bộ hành trình 5 điểm đến. Tiếng Việt vẫn luôn miễn phí.',
    freeBadge: 'Bản miễn phí',
    activeBadge: 'Premium đang hoạt động',
    offerTitle: 'Một lần mở khóa, nghe trọn hành trình',
    offerDescription:
      'Toàn bộ {count} bản thuyết minh ngoại ngữ của {poiCount} điểm đến được mở khóa trên thiết bị này.',
    demoLabel: 'Gói Premium',
    demoValue: 'Bản demo',
    demoNote:
      'Đây là bản demo frontend, chưa kết nối thanh toán. Trạng thái Premium được lưu trên thiết bị này.',
    activateCta: 'Mở khóa Premium',
    continueCta: 'Tiếp tục trải nghiệm',
    activeCta: 'Premium đã kích hoạt',
    deactivateCta: 'Hủy kích hoạt trên thiết bị',
    deactivatedNote: 'Đã trở về bản miễn phí. Tiếng Việt vẫn được nghe đầy đủ.',
    benefitsTitle: 'Quyền lợi Premium',
    benefitsSubtitle:
      'Mọi quyền lợi đều dựa trên nội dung thuyết minh hiện có, không có tính năng trang trí.',
    benefits: [
      {
        title: '3 ngôn ngữ quốc tế',
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
    contentTitle: 'Nội dung bạn mở khóa',
    contentSubtitle:
      'Mỗi điểm đến đều có bản thuyết minh tiếng Việt miễn phí và ba bản ngoại ngữ dành cho Premium.',
    freeLanguage: 'Miễn phí',
    premiumLanguage: 'Premium',
    stepsTitle: 'Cách hoạt động',
    steps: [
      {
        title: 'Chọn ngôn ngữ',
        description: 'Chọn tiếng Anh, Nhật hoặc Hàn ở thanh ngôn ngữ hoặc trên trang quét QR.',
      },
      {
        title: 'Mở khóa Premium',
        description: 'Kích hoạt bản demo một lần trên thiết bị này để mở toàn bộ nội dung ngoại ngữ.',
      },
      {
        title: 'Nghe và tiếp tục hành trình',
        description: 'Quay lại điểm đến hoặc mã QR vừa chọn, ngôn ngữ đã chọn sẽ được giữ nguyên.',
      },
    ],
    closingTitle: 'Sẵn sàng kể câu chuyện Sài Gòn cho mọi du khách',
    closingDescription:
      'Mở khóa Premium để mỗi điểm đến có thể được nghe bằng ngôn ngữ phù hợp với từng người.',
    backToTour: 'Về trang điểm đến',
    requestedLanguageNote:
      'Bạn đã chọn ngôn ngữ cần Premium. Kích hoạt để tiếp tục với ngôn ngữ này.',
    unlockedNotice: 'Đã mở khóa Premium và chuyển sang ngôn ngữ bạn chọn.',
  },
  en: {
    eyebrow: 'ECHORA PREMIUM',
    title: 'Let Saigon speak your language',
    subtitle:
      'Unlock English, Japanese and Korean narration across all 5 stops. Vietnamese stays free forever.',
    freeBadge: 'Free plan',
    activeBadge: 'Premium is active',
    offerTitle: 'One unlock for the whole journey',
    offerDescription:
      'All {count} foreign-language narration scripts for {poiCount} stops are unlocked on this device.',
    demoLabel: 'Premium plan',
    demoValue: 'Demo access',
    demoNote:
      'This is a frontend demo without payment integration. Premium status is stored on this device.',
    activateCta: 'Unlock Premium',
    continueCta: 'Continue exploring',
    activeCta: 'Premium is active',
    deactivateCta: 'Deactivate on this device',
    deactivatedNote: 'You are back on the free plan. Vietnamese narration remains fully available.',
    benefitsTitle: 'Premium benefits',
    benefitsSubtitle:
      'Every benefit is based on the narration content already available, with no decorative features.',
    benefits: [
      {
        title: '3 international languages',
        description: 'Listen to English, Japanese and Korean narration with a matching voice.',
      },
      {
        title: '{count} narration scripts',
        description: 'Unlock every foreign-language script across the {poiCount} stops in the journey.',
      },
      {
        title: 'QR access for international guests',
        description: 'Guests can scan the code at a stop and listen in the language they choose.',
      },
      {
        title: 'GPS auto narration',
        description: 'Turn on auto narration and hear the right stop when you enter its trigger radius.',
      },
    ],
    contentTitle: 'What you unlock',
    contentSubtitle:
      'Every stop includes free Vietnamese narration plus three Premium languages.',
    freeLanguage: 'Free',
    premiumLanguage: 'Premium',
    stepsTitle: 'How it works',
    steps: [
      {
        title: 'Choose a language',
        description: 'Pick English, Japanese or Korean in the language menu or on the QR scan page.',
      },
      {
        title: 'Unlock Premium',
        description: 'Activate demo access once on this device to open all foreign-language content.',
      },
      {
        title: 'Listen and continue',
        description: 'Return to your selected stop or QR code and your language choice is kept.',
      },
    ],
    closingTitle: 'Ready to share Saigon with every visitor',
    closingDescription:
      'Unlock Premium so every stop can be heard in the language that suits each guest.',
    backToTour: 'Back to attractions',
    requestedLanguageNote:
      'The language you selected requires Premium. Activate to continue in that language.',
    unlockedNotice: 'Premium unlocked and your selected language is now active.',
  },
  ja: {
    eyebrow: 'ECHORA PREMIUM',
    title: 'サイゴンを、あなたの言語で',
    subtitle:
      '全5スポットの英語、日本語、韓国語の音声ガイドを解除できます。ベトナム語はいつでも無料です。',
    freeBadge: '無料プラン',
    activeBadge: 'Premium 利用中',
    offerTitle: '一度の解除で、旅の最後まで',
    offerDescription:
      '{poiCount}スポットの外国語音声ガイド{count}本を、この端末ですべて利用できます。',
    demoLabel: 'Premium プラン',
    demoValue: 'デモ利用',
    demoNote:
      'これは決済と接続していないフロントエンドのデモです。Premium の状態はこの端末に保存されます。',
    activateCta: 'Premium を解除',
    continueCta: '体験を続ける',
    activeCta: 'Premium は有効です',
    deactivateCta: 'この端末で解除する',
    deactivatedNote: '無料プランに戻りました。ベトナム語の音声ガイドは引き続き利用できます。',
    benefitsTitle: 'Premium の特典',
    benefitsSubtitle:
      'すべての特典は現在の音声ガイド内容に基づいており、装飾的な機能は含みません。',
    benefits: [
      {
        title: '3つの国際言語',
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
    contentTitle: '解除される内容',
    contentSubtitle:
      '各スポットには無料のベトナム語ガイドと、Premium 向けの3言語ガイドがあります。',
    freeLanguage: '無料',
    premiumLanguage: 'Premium',
    stepsTitle: '利用方法',
    steps: [
      {
        title: '言語を選ぶ',
        description: '言語メニューまたは QR 読み取り画面で英語、日本語、韓国語を選びます。',
      },
      {
        title: 'Premium を解除',
        description: 'この端末でデモ利用を一度有効にすると、外国語コンテンツがすべて開きます。',
      },
      {
        title: '聞いて旅を続ける',
        description: '選んだスポットまたは QR コードに戻ると、言語の選択が保持されています。',
      },
    ],
    closingTitle: 'すべての訪問者にサイゴンの物語を',
    closingDescription:
      'Premium を解除すると、各スポットを相手に合った言語で聞いてもらえます。',
    backToTour: '観光スポットへ戻る',
    requestedLanguageNote:
      '選択した言語には Premium が必要です。有効にするとその言語で続けられます。',
    unlockedNotice: 'Premium を解除し、選択した言語に切り替えました。',
  },
  ko: {
    eyebrow: 'ECHORA PREMIUM',
    title: '사이공을 당신의 언어로 만나보세요',
    subtitle:
      '5개 명소의 영어, 일본어, 한국어 해설을 모두 열 수 있습니다. 베트남어 해설은 언제나 무료입니다.',
    freeBadge: '무료 요금제',
    activeBadge: 'Premium 사용 중',
    offerTitle: '한 번 열면 여행 끝까지',
    offerDescription:
      '{poiCount}개 명소의 외국어 해설 {count}개를 이 기기에서 모두 이용할 수 있습니다.',
    demoLabel: 'Premium 요금제',
    demoValue: '데모 이용',
    demoNote:
      '결제와 연결되지 않은 프론트엔드 데모입니다. Premium 상태는 이 기기에 저장됩니다.',
    activateCta: 'Premium 열기',
    continueCta: '계속 둘러보기',
    activeCta: 'Premium이 활성화되었습니다',
    deactivateCta: '이 기기에서 해제',
    deactivatedNote: '무료 요금제로 돌아왔습니다. 베트남어 해설은 계속 이용할 수 있습니다.',
    benefitsTitle: 'Premium 혜택',
    benefitsSubtitle:
      '모든 혜택은 현재 제공되는 해설 콘텐츠를 기준으로 하며, 장식용 기능은 없습니다.',
    benefits: [
      {
        title: '3개 국제 언어',
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
    contentTitle: '열리는 콘텐츠',
    contentSubtitle:
      '각 명소에는 무료 베트남어 해설과 Premium용 3개 언어 해설이 있습니다.',
    freeLanguage: '무료',
    premiumLanguage: 'Premium',
    stepsTitle: '이용 방법',
    steps: [
      {
        title: '언어 선택',
        description: '언어 메뉴 또는 QR 스캔 화면에서 영어, 일본어, 한국어를 선택합니다.',
      },
      {
        title: 'Premium 열기',
        description: '이 기기에서 데모 이용을 한 번 활성화하면 모든 외국어 콘텐츠가 열립니다.',
      },
      {
        title: '듣고 여행 계속하기',
        description: '선택한 명소나 QR 코드로 돌아오면 선택한 언어가 유지됩니다.',
      },
    ],
    closingTitle: '모든 방문객에게 사이공의 이야기를',
    closingDescription:
      'Premium을 열면 각 명소를 방문객에게 맞는 언어로 들려줄 수 있습니다.',
    backToTour: '명소 페이지로',
    requestedLanguageNote:
      '선택한 언어는 Premium이 필요합니다. 활성화하면 해당 언어로 계속할 수 있습니다.',
    unlockedNotice: 'Premium을 열고 선택한 언어로 전환했습니다.',
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
