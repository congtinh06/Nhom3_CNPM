import { SupportedLanguage } from '../types';

export interface FaqItem {
  q: string;
  a: string;
}

export interface ContactTranslation {
  eyebrow: string;
  title: string;
  subtitle: string;
  // Info cards
  officeTitle: string;
  officeAddress: string;
  officeDesc: string;
  hotlineTitle: string;
  hotlineDesc: string;
  emailTitle: string;
  emailDesc: string;
  hoursTitle: string;
  hoursDesc: string;
  // Form
  formHeading: string;
  formSubheading: string;
  topicLabel: string;
  topicFeedback: string;
  topicReportIssue: string;
  topicPartnership: string;
  topicOther: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  sendBtn: string;
  sendingBtn: string;
  successTitle: string;
  successNotice: string;
  errorNotice: string;
  // Map
  mapHeading: string;
  mapSubheading: string;
  directionsBtn: string;
  // FAQ
  faqHeading: string;
  faqSubheading: string;
  faqs: FaqItem[];
  // Trust banner
  trustCommitment: string;
  trustResponseTime: string;
}

export const CONTACT_TRANSLATIONS: Record<SupportedLanguage, ContactTranslation> = {
  vi: {
    eyebrow: 'HỖ TRỢ & ĐỒNG HÀNH',
    title: 'Liên hệ',
    subtitle: 'Lắng nghe góp ý, báo lỗi thuyết minh, hỗ trợ du khách và kết nối hợp tác phát triển di sản Sài Gòn.',
    officeTitle: 'Trung tâm Thông tin Du khách',
    officeAddress: '02 Công xã Paris, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    officeDesc: 'Đối diện Bưu điện Trung tâm, cách Nhà thờ Đức Bà 50 mét',
    hotlineTitle: 'Đường dây nóng du khách',
    hotlineDesc: '1900 1234 · Hỗ trợ miễn phí 24/7',
    emailTitle: 'Hộp thư điện tử',
    emailDesc: 'contact@echora.vn · Phản hồi trong 2-4 giờ',
    hoursTitle: 'Thời gian phục vụ',
    hoursDesc: '07:30 - 21:00 hàng ngày (Kể cả ngày Lễ & Tết)',
    formHeading: 'Gửi thông điệp đến Ban quản trị',
    formSubheading: 'Chúng tôi trân trọng mọi ý kiến đóng góp nhằm hoàn thiện trải nghiệm văn hóa cho du khách.',
    topicLabel: 'Chủ đề liên hệ',
    topicFeedback: 'Góp ý trải nghiệm tour',
    topicReportIssue: 'Báo lỗi thuyết minh / bản dịch',
    topicPartnership: 'Hợp tác truyền thông & di sản',
    topicOther: 'Câu hỏi & Vấn đề khác',
    nameLabel: 'Họ và tên của bạn',
    namePlaceholder: 'Ví dụ: Nguyễn Văn An',
    emailLabel: 'Địa chỉ Email',
    emailPlaceholder: 'name@example.com',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: '090x xxx xxx (không bắt buộc)',
    subjectLabel: 'Tiêu đề thông điệp',
    subjectPlaceholder: 'Tóm tắt nội dung bạn muốn gửi...',
    messageLabel: 'Nội dung chi tiết',
    messagePlaceholder: 'Chia sẻ chi tiết góp ý, báo lỗi hoặc đề xuất hợp tác (tối thiểu 10 ký tự)...',
    sendBtn: 'Gửi thông điệp liên hệ',
    sendingBtn: 'Đang gửi thông điệp...',
    successTitle: 'Gửi thành công!',
    successNotice: 'Cảm ơn bạn đã gửi liên hệ! Ý kiến đóng góp của bạn đã được ghi nhận và chuyển tới đội ngũ chuyên trách.',
    errorNotice: 'Vui lòng điền họ tên, email hợp lệ và nội dung thông điệp ít nhất 10 ký tự.',
    mapHeading: 'Vị trí Trạm Thông tin Di sản',
    mapSubheading: 'Tọa lạc ngay trái tim lịch sử Sài Gòn, thuận tiện cho mọi hành trình đi bộ khám phá.',
    directionsBtn: 'Xem chỉ đường trên Google Maps',
    faqHeading: 'Câu hỏi thường gặp',
    faqSubheading: 'Giải đáp nhanh các thắc mắc phổ biến về audio tour và ứng dụng Echora.',
    faqs: [
      {
        q: 'Ứng dụng Echora có thu phí thuyết minh du lịch không?',
        a: 'Hoàn toàn không. Echora là dự án số hóa di sản phục vụ cộng đồng, toàn bộ tính năng nghe thuyết minh đa ngôn ngữ (Việt, Anh, Nhật, Hàn) và bản đồ đều được cung cấp miễn phí cho mọi du khách.',
      },
      {
        q: 'Làm thế nào để nghe thuyết minh tự động khi tôi đi bộ gần di tích?',
        a: 'Bạn chỉ cần truy cập trang "Điểm du lịch", bật công tắc "Thuyết minh tự động" ở góc trên bản đồ và cho phép trình duyệt truy cập vị trí GPS. Khi bạn bước vào bán kính 50 mét của điểm dừng, câu chuyện thuyết minh sẽ tự động phát.',
      },
      {
        q: 'Tôi có thể đóng góp tư liệu lịch sử, hình ảnh xưa hoặc phản hồi câu dịch sai sót không?',
        a: 'Rất hoan nghênh! Bạn có thể chọn chủ đề "Báo lỗi thuyết minh / bản dịch" hoặc "Hợp tác truyền thông & di sản" trong biểu mẫu trên trang này. Đội ngũ biên tập sẽ liên hệ và ghi nhận nguồn đóng góp của bạn.',
      },
      {
        q: 'Ứng dụng có thể hoạt động khi mất kết nối mạng (offline) không?',
        a: 'Dữ liệu các điểm đến và lời thuyết minh đã được lưu vào bộ nhớ đệm (cache) của trình duyệt. Bạn vẫn có thể xem danh sách điểm dừng và bản đồ cơ bản kể cả khi mạng chập chờn.',
      },
    ],
    trustCommitment: 'Cam kết bảo mật thông tin du khách',
    trustResponseTime: 'Thời gian phản hồi trung bình: dưới 2 giờ',
  },
  en: {
    eyebrow: 'SUPPORT & CONNECT',
    title: 'Contact Us',
    subtitle: 'Feedback, translation corrections, visitor assistance, and partnership opportunities for Saigon heritage.',
    officeTitle: 'Visitor Information Center',
    officeAddress: '02 Paris Commune Square, Ben Nghe Ward, District 1, Ho Chi Minh City',
    officeDesc: 'Opposite Central Post Office, 50m from Notre-Dame Cathedral',
    hotlineTitle: 'Visitor Hotline',
    hotlineDesc: '1900 1234 · Free 24/7 Assistance',
    emailTitle: 'Email Inbox',
    emailDesc: 'contact@echora.vn · Response within 2-4 hours',
    hoursTitle: 'Operating Hours',
    hoursDesc: '07:30 - 21:00 Daily (Including Public Holidays)',
    formHeading: 'Send a Message to Our Team',
    formSubheading: 'We value every piece of feedback to enhance the cultural heritage experience for travelers worldwide.',
    topicLabel: 'Inquiry Topic',
    topicFeedback: 'Tour Experience Feedback',
    topicReportIssue: 'Report Translation / Audio Bug',
    topicPartnership: 'Heritage & Media Partnership',
    topicOther: 'General Inquiry & Other',
    nameLabel: 'Your Full Name',
    namePlaceholder: 'e.g., John Smith',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@example.com',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '+84 xxx xxx xxx (optional)',
    subjectLabel: 'Message Subject',
    subjectPlaceholder: 'Brief summary of your inquiry...',
    messageLabel: 'Detailed Message',
    messagePlaceholder: 'Please describe your inquiry, issue, or proposal (min. 10 characters)...',
    sendBtn: 'Send Message Now',
    sendingBtn: 'Sending...',
    successTitle: 'Message Sent!',
    successNotice: 'Thank you for reaching out! Your message has been received and forwarded to our editorial team.',
    errorNotice: 'Please provide a valid name, email address, and a message of at least 10 characters.',
    mapHeading: 'Heritage Information Hub Location',
    mapSubheading: 'Located at the historic core of Saigon, convenient for walking heritage discovery.',
    directionsBtn: 'Get Directions on Google Maps',
    faqHeading: 'Frequently Asked Questions',
    faqSubheading: 'Quick answers to common questions about audio tours and the Echora platform.',
    faqs: [
      {
        q: 'Is the Echora audio tour free of charge?',
        a: 'Yes, completely free. Echora is a heritage digitization project for the community. All audio narrations in 4 languages and map features are accessible without any fees.',
      },
      {
        q: 'How does automatic GPS narration work during walking tours?',
        a: 'Simply open the "Attractions" page, toggle "Auto Narration" on above the map, and grant GPS location permissions. When you step within 50 meters of a landmark, the audio story begins automatically.',
      },
      {
        q: 'Can I contribute historical stories, vintage photos, or suggest translation fixes?',
        a: 'We warmly welcome contributions! Select "Report Translation / Audio Bug" or "Heritage & Media Partnership" in the form above. Our curation team will review and credit your contribution.',
      },
      {
        q: 'Does the application work in low-connectivity areas?',
        a: 'Yes. Core stop data and narration texts are cached in your browser so you can view stops and transcripts even with intermittent internet.',
      },
    ],
    trustCommitment: 'Strict visitor privacy & data protection',
    trustResponseTime: 'Average response time: under 2 hours',
  },
  ja: {
    eyebrow: 'サポート＆お問い合わせ',
    title: 'お問い合わせ',
    subtitle: 'ご意見、誤訳のご指摘、観光案内サポート、サイゴン遺産プロジェクトへのご協力について。',
    officeTitle: '観光案内インフォメーションセンター',
    officeAddress: 'ホーチミン市1区ベンゲー街区コンサパリ通り02番地',
    officeDesc: 'サイゴン中央郵便局向かい、サイゴン大聖堂より徒歩50メートル',
    hotlineTitle: '観光客ホットライン',
    hotlineDesc: '1900 1234 · 24時間年中無休対応',
    emailTitle: '電子メール',
    emailDesc: 'contact@echora.vn · 2〜4時間以内に返信',
    hoursTitle: '案内受付時間',
    hoursDesc: '07:30 - 21:00（土日祝日含む毎日）',
    formHeading: '事務局へメッセージを送信',
    formSubheading: '旅行者の皆様により良い文化遺産体験をお届けするため、貴重なご意見をお待ちしております。',
    topicLabel: 'お問い合わせ項目',
    topicFeedback: 'ツアー体験に関するご意見',
    topicReportIssue: '翻訳・音声の誤り報告',
    topicPartnership: '提携・メディア取材のご相談',
    topicOther: 'その他のお問い合わせ',
    nameLabel: 'お名前',
    namePlaceholder: '例：山田 太郎',
    emailLabel: 'メールアドレス',
    emailPlaceholder: 'name@example.com',
    phoneLabel: '電話番号',
    phonePlaceholder: '+81 xxx xxx xxx（任意）',
    subjectLabel: '件名',
    subjectPlaceholder: 'お問い合わせの概要を入力...',
    messageLabel: 'お問い合わせ内容',
    messagePlaceholder: 'ご意見やご質問の詳細をご記入ください（10文字以上）...',
    sendBtn: 'メッセージを送信する',
    sendingBtn: '送信中...',
    successTitle: '送信完了しました',
    successNotice: 'お問い合わせありがとうございます。担当チームが確認の上、迅速にご返信いたします。',
    errorNotice: 'お名前、有効なメールアドレス、および10文字以上のメッセージをご入力ください。',
    mapHeading: 'インフォメーションセンター所在地',
    mapSubheading: '歴史的中心地に位置し、徒歩での散策に最適なロケーションです。',
    directionsBtn: 'Googleマップでルートを確認',
    faqHeading: 'よくあるご質問（FAQ）',
    faqSubheading: '音声ガイドやアプリの使い方についてよくいただくご質問です。',
    faqs: [
      {
        q: 'Echora（エコーラ）の音声ガイドは無料ですか？',
        a: 'はい、完全無料です。Echoraは文化遺産のデジタル化プロジェクトであり、多言語音声解説（日本語対応）とマップはすべて無料でご利用いただけます。',
      },
      {
        q: '史跡に近づいたときに自動で音声が再生される仕組みは？',
        a: '「観光スポット」ページで「自動音声ガイド」をオンにし、端末の位置情報（GPS）を許可してください。スポットから50メートル以内に近づくと自動で解説が流れます。',
      },
      {
        q: '歴史資料の提供や誤訳の指摘はどこからできますか？',
        a: '本フォームの「翻訳・音声の誤り報告」または「提携・メディア取材」をお選びいただき、お気軽にお知らせください。',
      },
      {
        q: '電波が弱い環境でも利用できますか？',
        a: 'スポットの基本情報や文字起こしテキストはブラウザのキャッシュに保存されるため、電波が不安定な場所でも閲覧可能です。',
      },
    ],
    trustCommitment: '個人情報の厳正な保護',
    trustResponseTime: '平均返信時間：2時間以内',
  },
  ko: {
    eyebrow: '지원 및 문의',
    title: '문의하기',
    subtitle: '의견 접수, 번역 오류 제보, 여행자 안내 지원 및 사이공 문화유산 협업 문의.',
    officeTitle: '관광객 안내 센터',
    officeAddress: '호치민시 1군 벤응에동 파리 코뮌 광장 02번지',
    officeDesc: '중앙우체국 맞은편, 사이공 노트르담 대성당에서 50m',
    hotlineTitle: '여행자 핫라인',
    hotlineDesc: '1900 1234 · 24시간 연중무휴 무료 지원',
    emailTitle: '이메일 문의',
    emailDesc: 'contact@echora.vn · 2~4시간 내 신속 회신',
    hoursTitle: '운영 시간',
    hoursDesc: '07:30 - 21:00 매일 (공휴일 정상 운영)',
    formHeading: '운영팀에 메시지 보내기',
    formSubheading: '여행자 여러분께 더욱 깊이 있는 문화유산 경험을 제공하기 위해 소중한 의견을 기다립니다.',
    topicLabel: '문의 유형',
    topicFeedback: '투어 경험 피드백',
    topicReportIssue: '번역 및 오디오 오류 제보',
    topicPartnership: '제휴 및 미디어 협력',
    topicOther: '일반 문의 및 기타',
    nameLabel: '성함',
    namePlaceholder: '예: 홍길동',
    emailLabel: '이메일 주소',
    emailPlaceholder: 'name@example.com',
    phoneLabel: '연락처',
    phonePlaceholder: '+82 10 xxxx xxxx (선택 사항)',
    subjectLabel: '문의 제목',
    subjectPlaceholder: '문의 내용을 간략히 요약해 주세요...',
    messageLabel: '상세 내용',
    messagePlaceholder: '의견, 제보 또는 협업 제안 내용을 상세히 적어주세요 (최소 10자 이상)...',
    sendBtn: '메시지 전송하기',
    sendingBtn: '전송 중...',
    successTitle: '전송이 완료되었습니다!',
    successNotice: '소중한 의견을 남겨주셔서 감사합니다. 담당 부서에서 확인 후 신속하게 답변드리겠습니다.',
    errorNotice: '성함, 올바른 이메일 주소 및 10자 이상의 메시지를 입력해 주세요.',
    mapHeading: '유산 안내 센터 위치',
    mapSubheading: '사이공의 역사적 중심지에 위치하여 도보 탐방 시 편리하게 방문하실 수 있습니다.',
    directionsBtn: 'Google 지도에서 길찾기',
    faqHeading: '자주 묻는 질문 (FAQ)',
    faqSubheading: '오디오 투어 및 플랫폼 이용과 관련하여 자주 묻는 질문들입니다.',
    faqs: [
      {
        q: 'Echora 오디오 투어 이용 요금은 얼마인가요?',
        a: '완전 무료입니다. Echora는 지역사회를 위한 문화유산 디지털화 프로젝트로, 한국어를 포함한 4개 국어 음성 해설 및 지도 서비스를 무료로 제공합니다.',
      },
      {
        q: '유적지 근처에 도착했을 때 자동으로 음성을 들으려면 어떻게 하나요?',
        a: '‘관광 명소’ 페이지에서 지도 상단의 ‘자동 해설’ 토글을 켜고 GPS 위치 접근 권한을 허용하시면, 해당 장소 50m 반경 진입 시 자동으로 해설이 재생됩니다.',
      },
      {
        q: '역사 자료 기증이나 번역 오류 제보는 어떻게 하나요?',
        a: '위 양식에서 ‘번역 및 오디오 오류 제보’ 또는 ‘제휴 및 미디어 협력’을 선택하여 작성해 주시면 검토 후 기여자 명시와 함께 반영됩니다.',
      },
      {
        q: '인터넷 연결이 불안정한 환경에서도 이용할 수 있나요?',
        a: '기본적인 명소 정보와 해설 전문 텍스트는 브라우저 캐시에 저장되므로 네트워크 연결이 원활하지 않아도 열람하실 수 있습니다.',
      },
    ],
    trustCommitment: '이용자 개인정보 보호 원칙 준수',
    trustResponseTime: '평균 응답 소요 시간: 2시간 이내',
  },
};

export function tContact<K extends keyof ContactTranslation>(
  lang: SupportedLanguage,
  key: K
): ContactTranslation[K] {
  const dict = CONTACT_TRANSLATIONS[lang] || CONTACT_TRANSLATIONS.vi;
  return dict[key] !== undefined ? dict[key] : CONTACT_TRANSLATIONS.vi[key];
}
