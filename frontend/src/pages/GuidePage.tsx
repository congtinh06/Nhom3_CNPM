import { useNavbarLanguage } from '../content/languages';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const GUIDE_CONTENT = {
  vi: {
    title: 'Hướng dẫn sử dụng',
    subtitle:
      'Hướng dẫn sử dụng hệ thống thuyết minh tự động Echora, bao gồm cách kích hoạt định vị GPS, quét mã QR tại điểm di tích và trải nghiệm âm thanh đa ngôn ngữ.',
    step1Title: '1. Tự động phát theo vị trí (GPS)',
    step1Desc:
      'Khi bạn đi vào vùng kích hoạt (khoảng 40 - 60m) quanh điểm di tích, hệ thống sẽ tự động phát đoạn thuyết minh tương ứng mà không cần thao tác bấm nút.',
    step2Title: '2. Quét mã QR tại điểm đến',
    step2Desc:
      'Nếu bạn tắt định vị GPS hoặc muốn nghe ngay lập tức, hãy hướng camera vào mã QR dán trên bảng thông tin di tích để mở trang thuyết minh trong tích tắc.',
    step3Title: '3. Đổi ngôn ngữ linh hoạt',
    step3Desc:
      'Hệ thống hỗ trợ 4 ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Nhật và Tiếng Hàn. Bạn có thể chuyển đổi bất cứ lúc nào qua thanh điều hướng trên cùng.',
  },
  en: {
    title: 'User Guide',
    subtitle:
      'Comprehensive guide for using the Echora digital audio guide platform, covering GPS location triggers, on-site QR scanning, and multi-language features.',
    step1Title: '1. Automatic Location-Based Audio (GPS)',
    step1Desc:
      'When you enter the activation radius (about 40 - 60m) near a historical stop, the system automatically starts the matching narrative without pressing any buttons.',
    step2Title: '2. Scanning QR Codes On Site',
    step2Desc:
      'If GPS is disabled or you prefer instant access, aim your device camera at the QR code on the landmark board to load the narration in seconds.',
    step3Title: '3. Switching Languages Seamlessly',
    step3Desc:
      'The platform supports 4 languages: Vietnamese, English, Japanese, and Korean. Switch between them anytime using the language selector in the navbar.',
  },
  ja: {
    title: 'ご利用ガイド',
    subtitle:
      'GPS位置情報の自動連動、現地QRコードの読み取り、多言語音声ガイドの楽しみ方など、Echoraの使い方をご案内します。',
    step1Title: '1. GPS位置情報による自動音声ガイド',
    step1Desc:
      '名所の周辺（約40〜60メートル以内）に入ると、画面を操作することなく自動的に解説音声がスタートします。',
    step2Title: '2. 現地QRコードのスキャン',
    step2Desc:
      'GPSがオフの場合やすぐに聴きたい場合は、案内板のQRコードにカメラを向けるだけで瞬時に音声解説が開きます。',
    step3Title: '3. 自由な言語の切り替え',
    step3Desc:
      'ベトナム語、英語、日本語、韓国語の4言語に対応しています。上部ナビゲーションバーからいつでもお好みの言語に変更できます。',
  },
  ko: {
    title: '이용 안내',
    subtitle:
      'GPS 위치 기반 자동 재생, 현장 QR 코드 스캔, 다국어 오디오 가이드 청취 등 Echora 디지털 가이드 플랫폼의 상세 이용 방법입니다.',
    step1Title: '1. GPS 위치 기반 자동 안내',
    step1Desc:
      '역사적 명소 주변(반경 40 - 60m)에 진입하면 별도의 버튼을 누르지 않아도 해당 명소의 오디오 해설이 자동으로 시작됩니다.',
    step2Title: '2. 현장 QR 코드 스캔',
    step2Desc:
      'GPS를 꺼두었거나 즉시 청취를 원할 경우, 명소 안내판의 QR 코드를 카메라로 비추면 몇 초 만에 해설 페이지로 이동합니다.',
    step3Title: '3. 자유로운 언어 변경',
    step3Desc:
      '베트남어, 영어, 일본어, 한국어 4개 언어를 지원합니다. 상단 내비게이션 바의 언어 메뉴를 통해 언제든지 원하는 언어로 변경 가능합니다.',
  },
};

export function GuidePage() {
  const { lang } = useNavbarLanguage();
  const c = GUIDE_CONTENT[lang] || GUIDE_CONTENT.vi;

  useDocumentMeta(
    `${c.title} | Echora`,
    c.subtitle
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 font-body" style={{ minHeight: '60vh' }}>
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-textPrimary mb-4">
          {c.title}
        </h1>
        <p className="text-textSecondary text-base leading-relaxed max-w-2xl mx-auto">
          {c.subtitle}
        </p>
      </header>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white/70 border border-borderSubtle shadow-sm">
          <h2 className="font-semibold text-lg text-textPrimary mb-2">{c.step1Title}</h2>
          <p className="text-textSecondary text-sm leading-relaxed">{c.step1Desc}</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/70 border border-borderSubtle shadow-sm">
          <h2 className="font-semibold text-lg text-textPrimary mb-2">{c.step2Title}</h2>
          <p className="text-textSecondary text-sm leading-relaxed">{c.step2Desc}</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/70 border border-borderSubtle shadow-sm">
          <h2 className="font-semibold text-lg text-textPrimary mb-2">{c.step3Title}</h2>
          <p className="text-textSecondary text-sm leading-relaxed">{c.step3Desc}</p>
        </div>
      </div>
    </div>
  );
}

export default GuidePage;
