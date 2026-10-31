import { SupportedLanguage } from '../types';
import { useNavbarLanguage } from './languages';

export type HomeKey =
  | 'heroKicker'
  | 'heroTitle'
  | 'heroDesc'
  | 'heroCtaPrimary'
  | 'heroCtaSecondary'
  | 'tourismTitle'
  | 'tourismParagraph'
  | 'tourismCta'
  | 'tourismCardCta'
  | 'foodTitle'
  | 'foodParagraph'
  | 'foodCta'
  | 'howTitle'
  | 'howSubtitle'
  | 'how1Title'
  | 'how1Desc'
  | 'how2Title'
  | 'how2Desc'
  | 'how3Title'
  | 'how3Desc'
  | 'featTitle'
  | 'featSubtitle'
  | 'feat1Title'
  | 'feat1Desc'
  | 'feat2Title'
  | 'feat2Desc'
  | 'feat3Title'
  | 'feat3Desc'
  | 'feat4Title'
  | 'feat4Desc'
  | 'faqTitle'
  | 'faqSubtitle'
  | 'faq1Q'
  | 'faq1A'
  | 'faq2Q'
  | 'faq2A'
  | 'faq3Q'
  | 'faq3A'
  | 'faq4Q'
  | 'faq4A'
  | 'faq5Q'
  | 'faq5A'
  | 'ctaTitle'
  | 'ctaDesc'
  | 'ctaPrimary'
  | 'ctaSecondary'
  | 'aboutTitle'
  | 'aboutText';

export const HOME_DICTIONARY: Record<SupportedLanguage, Record<HomeKey, string>> = {
  vi: {
    heroKicker: 'Thuyết minh viên số của bạn',
    heroTitle: 'Nghe kể chuyện Sài Gòn qua từng điểm đến',
    heroDesc:
      'Tự động thuyết minh theo vị trí hoặc quét mã QR, bằng bốn ngôn ngữ Việt, Anh, Nhật và Hàn.',
    heroCtaPrimary: 'Bắt đầu tuyến thuyết minh',
    heroCtaSecondary: 'Quét mã QR',
    tourismTitle: 'Du lịch Sài Gòn',
    tourismParagraph:
      'Bảy điểm dừng nằm gần nhau ở trung tâm Quận 1. Mỗi điểm có thuyết minh tự động, bản đồ dẫn đường và mã QR riêng.',
    tourismCta: 'Xem tuyến thuyết minh',
    tourismCardCta: 'Xem chi tiết',
    foodTitle: 'Quà lưu niệm Sài Gòn',
    foodParagraph:
      'Từ tranh mạ vàng, nón lá đến lụa tơ tằm và đặc sản, mỗi món quà đều gắn với một điểm du lịch của Sài Gòn.',
    foodCta: 'Khám phá Quà lưu niệm',
    howTitle: 'Cách hoạt động',
    howSubtitle: 'Ba bước để bắt đầu lắng nghe câu chuyện của thành phố.',
    how1Title: 'Chọn điểm đến',
    how1Desc: 'Mở bản đồ và chọn một điểm dừng, hoặc quét mã QR dán tại điểm đó.',
    how2Title: 'Nghe thuyết minh',
    how2Desc: 'Bật phát và nghe câu chuyện của điểm đến bằng giọng đọc ngay trên thiết bị.',
    how3Title: 'Đổi ngôn ngữ hoặc đi tiếp',
    how3Desc: 'Chuyển sang tiếng Anh, Nhật, Hàn bất cứ lúc nào, rồi sang điểm kế tiếp trong tuyến.',
    featTitle: 'Tính năng',
    featSubtitle: 'Những gì bạn có thể dùng trong bản demo này.',
    feat1Title: 'Thuyết minh tự động theo GPS',
    feat1Desc: 'Câu chuyện tự phát khi bạn đi vào gần điểm dừng, không cần bấm gì.',
    feat2Title: 'Quét mã QR tại điểm',
    feat2Desc: 'Không cần GPS, chỉ cần quét mã là mở ngay thuyết minh của điểm đó.',
    feat3Title: 'Bốn ngôn ngữ',
    feat3Desc: 'Tiếng Việt, English, 日本語 và 한국어 cho mỗi điểm dừng.',
    feat4Title: 'Bản đồ tuyến đường',
    feat4Desc: 'Xem các điểm dừng và đường đi trên bản đồ tương tác.',
    faqTitle: 'Câu hỏi thường gặp',
    faqSubtitle: 'Vài điều nên biết trước khi bắt đầu.',
    faq1Q: 'Vì sao đôi lúc không nghe được tiếng Việt?',
    faq1A:
      'Thuyết minh được đọc bằng giọng có sẵn trên thiết bị của bạn. Nếu máy chưa cài giọng tiếng Việt, hãy thêm gói giọng đó trong cài đặt hệ điều hành rồi mở lại trang.',
    faq2Q: 'Ứng dụng có lưu vị trí của tôi không?',
    faq2A:
      'Không. Vị trí chỉ được dùng ngay trên thiết bị để quyết định khi nào phát thuyết minh. Vị trí không được gửi lên máy chủ và không được lưu lại.',
    faq3Q: 'Vì sao thuyết minh tự phát khi tôi vừa tới?',
    faq3A:
      'Mỗi điểm có bán kính kích hoạt riêng, khoảng 40 đến 60 mét. Khi bạn bước vào bán kính đó, thuyết minh của điểm sẽ tự phát.',
    faq4Q: 'Tôi có thể dùng mã QR để làm gì?',
    faq4A:
      'Tại mỗi điểm có dán một mã QR. Quét mã sẽ mở ngay thuyết minh của điểm đó mà không cần bật GPS.',
    faq5Q: 'Làm sao để đổi ngôn ngữ?',
    faq5A:
      'Dùng nút ngôn ngữ ở thanh điều hướng hoặc trong trang điểm du lịch để chuyển giữa bốn ngôn ngữ.',
    ctaTitle: 'Sẵn sàng nghe Sài Gòn kể chuyện?',
    ctaDesc:
      'Bắt đầu tuyến thuyết minh 7 điểm ở trung tâm Quận 1, hoặc quét mã QR khi bạn đã tới nơi.',
    ctaPrimary: 'Bắt đầu tuyến thuyết minh',
    ctaSecondary: 'Quét mã QR',
    aboutTitle: 'Về dự án',
    aboutText:
      'Echora là sản phẩm demo của Nhóm 3 trong môn Công nghệ phần mềm. Nhóm xây dựng một ứng dụng thuyết minh du lịch tự động cho TP. Hồ Chí Minh, kết hợp bản đồ, mã QR và giọng đọc bốn ngôn ngữ.',
  },
  en: {
    heroKicker: 'Your digital audio guide',
    heroTitle: "Hear Saigon's stories, one stop at a time",
    heroDesc:
      'Automatic narration by location or QR scan, in four languages: Vietnamese, English, Japanese and Korean.',
    heroCtaPrimary: 'Start the audio tour',
    heroCtaSecondary: 'Scan QR code',
    tourismTitle: 'Explore Saigon',
    tourismParagraph:
      'Seven stops sit close together in central District 1. Each one has automatic narration, a route map, and its own QR code.',
    tourismCta: 'View the audio tour',
    tourismCardCta: 'View details',
    foodTitle: 'Saigon Souvenirs',
    foodParagraph:
      "From gold-plated paintings and conical hats to silk and local specialties, every gift is tied to a Saigon landmark.",
    foodCta: 'Explore souvenirs',
    howTitle: 'How it works',
    howSubtitle: "Three steps to start listening to the city's stories.",
    how1Title: 'Choose a stop',
    how1Desc: 'Open the map and pick a stop, or scan the QR code posted at the site.',
    how2Title: 'Listen to the narration',
    how2Desc: 'Press play and hear the story of the stop, read aloud right on your device.',
    how3Title: 'Switch language or keep going',
    how3Desc: 'Change to English, Japanese or Korean anytime, then move on to the next stop.',
    featTitle: 'Features',
    featSubtitle: 'What you can use in this demo.',
    feat1Title: 'Automatic GPS narration',
    feat1Desc: 'The story plays by itself as you get near a stop, with no button to press.',
    feat2Title: 'Scan the QR code on site',
    feat2Desc: "No GPS needed, scan the code to open that stop's narration right away.",
    feat3Title: 'Four languages',
    feat3Desc: 'Vietnamese, English, Japanese and Korean for every stop.',
    feat4Title: 'Route map',
    feat4Desc: 'See all the stops and the walking route on an interactive map.',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: 'A few things to know before you start.',
    faq1Q: 'Why is the Vietnamese voice sometimes missing?',
    faq1A:
      'The narration is read aloud with a voice installed on your device. If your device has no Vietnamese voice, add that voice in your system settings and reload the page.',
    faq2Q: 'Does the app store my location?',
    faq2A:
      'No. Location is used only on your device to decide when to play the narration. It is not sent to any server and is not saved.',
    faq3Q: 'Why does the narration start by itself as I arrive?',
    faq3A:
      'Each stop has its own trigger radius, about 40 to 60 metres. When you walk inside that radius, the stop\u2019s narration plays automatically.',
    faq4Q: 'What can I use the QR code for?',
    faq4A:
      'A QR code is posted at each stop. Scanning it opens that stop\u2019s narration right away, with no need to turn on GPS.',
    faq5Q: 'How do I change the language?',
    faq5A:
      'Use the language button in the navigation bar or on the attractions page to switch between the four languages.',
    ctaTitle: 'Ready to hear Saigon tell its story?',
    ctaDesc:
      'Start the seven-stop audio tour in central District 1, or scan the QR code once you arrive.',
    ctaPrimary: 'Start the audio tour',
    ctaSecondary: 'Scan QR code',
    aboutTitle: 'About the project',
    aboutText:
      'Echora is a demo project by Group 3 for a Software Engineering course. We built an automatic audio-guide app for Ho Chi Minh City that combines a map, QR codes and four-language narration.',
  },
  ja: {
    heroKicker: 'あなたのデジタル音声ガイド',
    heroTitle: '訪れるたびに、サイゴンの物語を聴く',
    heroDesc:
      '位置情報またはQRコードの読み取りで、ベトナム語・英語・日本語・韓国語の4言語で自動音声ガイドを再生します。',
    heroCtaPrimary: '音声ツアーを始める',
    heroCtaSecondary: 'QRコードを読み取る',
    tourismTitle: 'サイゴンを巡る',
    tourismParagraph:
      '中心部1区に7つのスポットが近接しています。それぞれに自動音声ガイド、ルートマップ、専用のQRコードがあります。',
    tourismCta: '音声ツアーを見る',
    tourismCardCta: '詳細を見る',
    foodTitle: 'サイゴンのお土産',
    foodParagraph:
      '金メッキの絵やベトナムの笠、シルク、特産品まで、どのお土産もサイゴンの名所に結びついています。',
    foodCta: 'お土産を探す',
    howTitle: '使い方',
    howSubtitle: '街の物語を聴き始めるまでの3ステップ。',
    how1Title: 'スポットを選ぶ',
    how1Desc: '地図を開いてスポットを選ぶか、現地に掲示されたQRコードを読み取ります。',
    how2Title: '音声ガイドを聴く',
    how2Desc: '再生を押すと、スポットの物語をお使いの端末の音声で読み上げます。',
    how3Title: '言語を変える・次へ進む',
    how3Desc: 'いつでも英語・日本語・韓国語に切り替え、次のスポットへ進めます。',
    featTitle: '機能',
    featSubtitle: 'このデモで利用できる機能です。',
    feat1Title: 'GPSによる自動音声ガイド',
    feat1Desc: 'スポットに近づくと、ボタンを押さずに物語が自動で再生されます。',
    feat2Title: '現地でQRコードを読み取り',
    feat2Desc: 'GPSは不要。読み取るだけでそのスポットの音声ガイドが開きます。',
    feat3Title: '4つの言語',
    feat3Desc: '各スポットをベトナム語・英語・日本語・韓国語で聴けます。',
    feat4Title: 'ルートマップ',
    feat4Desc: '地図上でスポットと徒歩ルートを確認できます。',
    faqTitle: 'よくある質問',
    faqSubtitle: '始める前に知っておきたいこと。',
    faq1Q: 'ベトナム語の音声が聞こえないことがあるのはなぜですか？',
    faq1A:
      '音声ガイドは端末にインストールされた音声で読み上げます。端末にベトナム語の音声がない場合は、OSの設定で音声を追加してからページを再読み込みしてください。',
    faq2Q: 'アプリは私の位置情報を保存しますか？',
    faq2A:
      'いいえ。位置情報は音声ガイドを再生するタイミングを決めるため、端末上でのみ使用されます。サーバーに送信されることも、保存されることもありません。',
    faq3Q: '到着すると音声ガイドが自動で始まるのはなぜですか？',
    faq3A:
      '各スポットには約40〜60メートルの起動範囲があります。その範囲に入ると、そのスポットの音声ガイドが自動で再生されます。',
    faq4Q: 'QRコードは何に使えますか？',
    faq4A:
      '各スポットにはQRコードが掲示されています。読み取ると、GPSをオンにしなくてもそのスポットの音声ガイドがすぐに開きます。',
    faq5Q: '言語を切り替えるには？',
    faq5A:
      'ナビゲーションバーまたは観光スポットページの言語ボタンで、4つの言語を切り替えられます。',
    ctaTitle: 'サイゴンの物語を聴く準備はできましたか？',
    ctaDesc:
      '中心部1区の7スポットの音声ツアーを始めるか、現地に着いたらQRコードを読み取ってください。',
    ctaPrimary: '音声ツアーを始める',
    ctaSecondary: 'QRコードを読み取る',
    aboutTitle: 'プロジェクトについて',
    aboutText:
      'Echoraは、ソフトウェア工学の授業で「グループ3」が制作したデモ作品です。地図・QRコード・4言語の音声を組み合わせた、ホーチミン市の自動音声ガイドアプリです。',
  },
  ko: {
    heroKicker: '당신의 디지털 오디오 가이드',
    heroTitle: '장소마다 들려주는 사이공의 이야기',
    heroDesc:
      '위치 기반 또는 QR 코드 스캔으로 베트남어, 영어, 일본어, 한국어 4개 언어의 오디오 해설을 자동으로 재생합니다.',
    heroCtaPrimary: '오디오 투어 시작',
    heroCtaSecondary: 'QR 코드 스캔',
    tourismTitle: '사이공 여행',
    tourismParagraph:
      '1군 중심에 일곱 개의 명소가 가까이 모여 있습니다. 각 명소에는 자동 해설, 경로 지도, 전용 QR 코드가 있습니다.',
    tourismCta: '오디오 투어 보기',
    tourismCardCta: '상세 보기',
    foodTitle: '사이공 기념품',
    foodParagraph:
      '금박 그림, 베트남 모자, 실크, 특산품까지, 각 기념품은 사이공의 명소와 이어져 있습니다.',
    foodCta: '기념품 둘러보기',
    howTitle: '이용 방법',
    howSubtitle: '도시의 이야기를 듣기 시작하는 세 단계.',
    how1Title: '명소 선택하기',
    how1Desc: '지도를 열어 명소를 고르거나 현장에 붙어 있는 QR 코드를 스캔하세요.',
    how2Title: '해설 듣기',
    how2Desc: '재생을 누르면 기기에 내장된 음성으로 명소의 이야기를 들려줍니다.',
    how3Title: '언어 바꾸기 또는 계속 이동',
    how3Desc: '언제든 영어, 일본어, 한국어로 바꾸고 다음 명소로 이동하세요.',
    featTitle: '기능',
    featSubtitle: '이 데모에서 사용할 수 있는 기능입니다.',
    feat1Title: 'GPS 자동 해설',
    feat1Desc: '명소에 가까워지면 버튼을 누르지 않아도 이야기가 자동으로 재생됩니다.',
    feat2Title: '현장에서 QR 코드 스캔',
    feat2Desc: 'GPS 없이 코드만 스캔하면 해당 명소의 해설이 바로 열립니다.',
    feat3Title: '4개 언어',
    feat3Desc: '모든 명소를 베트남어, 영어, 일본어, 한국어로 들을 수 있습니다.',
    feat4Title: '경로 지도',
    feat4Desc: '지도에서 명소와 도보 경로를 확인하세요.',
    faqTitle: '자주 묻는 질문',
    faqSubtitle: '시작하기 전에 알아 두면 좋은 내용입니다.',
    faq1Q: '베트남어 음성이 들리지 않을 때가 있는 이유는 무엇인가요?',
    faq1A:
      '해설은 기기에 설치된 음성으로 읽어 줍니다. 기기에 베트남어 음성이 없다면 운영체제 설정에서 해당 음성을 추가한 뒤 페이지를 새로 고치세요.',
    faq2Q: '앱이 제 위치를 저장하나요?',
    faq2A:
      '아니요. 위치는 해설을 언제 재생할지 결정하기 위해 기기에서만 사용됩니다. 서버로 전송되지 않으며 저장되지도 않습니다.',
    faq3Q: '도착하자마자 해설이 자동으로 시작되는 이유는 무엇인가요?',
    faq3A:
      '각 명소에는 약 40~60미터의 작동 반경이 있습니다. 그 반경 안으로 들어가면 해당 명소의 해설이 자동으로 재생됩니다.',
    faq4Q: 'QR 코드는 어디에 사용하나요?',
    faq4A:
      '각 명소에는 QR 코드가 붙어 있습니다. 스캔하면 GPS를 켜지 않고도 해당 명소의 해설이 바로 열립니다.',
    faq5Q: '언어는 어떻게 바꾸나요?',
    faq5A: '내비게이션 바나 관광 명소 페이지의 언어 버튼으로 네 가지 언어를 전환할 수 있습니다.',
    ctaTitle: '사이공의 이야기를 들을 준비 되셨나요?',
    ctaDesc:
      '1군 중심의 7개 명소 오디오 투어를 시작하거나, 도착한 뒤 QR 코드를 스캔하세요.',
    ctaPrimary: '오디오 투어 시작',
    ctaSecondary: 'QR 코드 스캔',
    aboutTitle: '프로젝트 소개',
    aboutText:
      'Echora는 소프트웨어 공학 수업에서 3팀이 만든 데모 프로젝트입니다. 지도, QR 코드, 4개 언어 음성을 결합한 호찌민시 자동 오디오 가이드 앱입니다.',
  },
};

export function useHomeI18n() {
  const { lang } = useNavbarLanguage();
  return { lang, t: HOME_DICTIONARY[lang] ?? HOME_DICTIONARY.vi };
}
