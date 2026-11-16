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
  phoneInputLabel: string;
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
  // Extra page labels
  addressLabel: string;
  hoursLabel: string;
  locationTitle: string;
  directionsLabel: string;
  optionalPhoneAdd: string;
  optionalPhoneHide: string;
  sendAnother: string;
  helpSectionTitle: string;
  helpGuide1Title: string;
  helpGuide1Desc: string;
  helpGuide2Title: string;
  helpGuide2Desc: string;
  helpGuide3Title: string;
  helpGuide3Desc: string;
  fixSectionTitle: string;
  fix1Title: string;
  fix1Desc: string;
  fix2Title: string;
  fix2Desc: string;
  fix3Title: string;
  fix3Desc: string;
  aidSectionTitle: string;
  aidSectionDesc: string;
  aid1Label: string;
  aid1Desc: string;
  aid2Label: string;
  aid2Desc: string;
  aid3Label: string;
  aid3Desc: string;
  aid4Label: string;
  aid4Desc: string;
  errNameRequired: string;
  errEmailRequired: string;
  errEmailInvalid: string;
  errMessageRequired: string;
  errMessageMin: string;
  errSendFailed: string;
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
    subtitle: 'Bạn cần hỗ trợ khi nghe thuyết minh, có câu hỏi về điểm tham quan hay muốn gửi góp ý? Hãy để lại lời nhắn.',
    officeTitle: 'Thông tin liên hệ',
    officeAddress: '338 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh',
    officeDesc: 'Đối diện Bưu điện Trung tâm, cách Nhà thờ Đức Bà 50 mét',
    hotlineTitle: 'Đường dây nóng du khách',
    hotlineDesc: '0346358399',
    emailTitle: 'Hộp thư điện tử',
    emailDesc: 'congtinh1932006@gmail.com',
    hoursTitle: 'Thời gian phục vụ',
    hoursDesc: '8h - 23h hàng ngày',
    formHeading: 'Gửi tin nhắn',
    formSubheading: 'Chúng tôi trân trọng mọi ý kiến đóng góp nhằm hoàn thiện trải nghiệm văn hóa cho du khách.',
    topicLabel: 'Chủ đề liên hệ',
    topicFeedback: 'Góp ý trải nghiệm tour',
    topicReportIssue: 'Báo lỗi thuyết minh / bản dịch',
    topicPartnership: 'Hợp tác truyền thông & di sản',
    topicOther: 'Câu hỏi & Vấn đề khác',
    nameLabel: 'Họ và tên',
    namePlaceholder: 'Ví dụ: Nguyễn Văn An',
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    phoneLabel: 'Số điện thoại',
    phoneInputLabel: 'Số điện thoại (không bắt buộc)',
    phonePlaceholder: '090x xxx xxx (không bắt buộc)',
    subjectLabel: 'Tiêu đề thông điệp',
    subjectPlaceholder: '',
    messageLabel: 'Nội dung',
    messagePlaceholder: '',
    sendBtn: 'Gửi tin nhắn',
    sendingBtn: 'Đang gửi…',
    successTitle: 'Đã gửi tin nhắn thành công',
    successNotice: 'Tin nhắn đã được gửi thành công tới quản trị viên Echora. Phản hồi sẽ xuất hiện trong mục Tin nhắn hỗ trợ tại trang thông tin tài khoản.',
    errorNotice: 'Vui lòng điền họ tên, email hợp lệ và nội dung thông điệp ít nhất 10 ký tự.',
    mapHeading: 'Vị trí',
    mapSubheading: 'Tọa lạc ngay trái tim lịch sử Sài Gòn, thuận tiện cho mọi hành trình đi bộ khám phá.',
    directionsBtn: 'Xem chỉ đường trên Google Maps',
    faqHeading: 'Câu hỏi thường gặp',
    faqSubheading: 'Giải đáp nhanh các thắc mắc phổ biến về audio tour và website Echora.',
    faqs: [
      {
        q: 'Website Echora có thu phí thuyết minh du lịch không?',
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
        q: 'Website có thể hoạt động khi mất kết nối mạng (offline) không?',
        a: 'Dữ liệu các điểm đến và lời thuyết minh đã được lưu vào bộ nhớ đệm (cache) của trình duyệt. Bạn vẫn có thể xem danh sách điểm dừng và bản đồ cơ bản kể cả khi mạng chập chờn.',
      },
    ],
    trustCommitment: 'Cam kết bảo mật thông tin du khách',
    trustResponseTime: 'Thời gian phản hồi trung bình: dưới 2 giờ',
    addressLabel: 'Địa chỉ',
    hoursLabel: 'Thời gian làm việc',
    locationTitle: 'Vị trí',
    directionsLabel: 'Chỉ đường',
    optionalPhoneAdd: 'Thêm số điện thoại (không bắt buộc)',
    optionalPhoneHide: 'Ẩn số điện thoại',
    sendAnother: 'Gửi tin nhắn khác',
    helpSectionTitle: 'Hướng dẫn liên hệ',
    helpGuide1Title: 'Sử dụng thuyết minh',
    helpGuide1Desc: 'Chọn ngôn ngữ, bật tự động phát hoặc quét mã QR ở từng điểm tham quan.',
    helpGuide2Title: 'Đơn hàng quà lưu niệm',
    helpGuide2Desc: 'Ghi mã đơn hàng vào nội dung tin nhắn để chúng tôi kiểm tra nhanh hơn.',
    helpGuide3Title: 'Hợp tác và góp ý',
    helpGuide3Desc: 'Chọn chủ đề "Hợp tác hoặc góp ý" trong biểu mẫu, chúng tôi rất muốn lắng nghe bạn.',
    fixSectionTitle: 'Sự cố thường gặp khi nghe',
    fix1Title: 'Không nghe thấy âm thanh',
    fix1Desc: 'Kiểm tra âm lượng, tai nghe và chế độ im lặng của điện thoại, rồi thử bấm phát lại.',
    fix2Title: 'Thuyết minh không tự phát',
    fix2Desc: 'Hãy bật "Tự động phát" và cho phép trình duyệt truy cập vị trí. Bạn vẫn bấm nghe thủ công được.',
    fix3Title: 'Không đổi được ngôn ngữ',
    fix3Desc: 'Ngôn ngữ có biểu tượng khóa cần gói Premium. Tiếng Việt luôn dùng được miễn phí.',
    aidSectionTitle: 'Để chúng tôi hỗ trợ nhanh hơn',
    aidSectionDesc: 'Khi nhắn về một sự cố, hãy cho biết vài thông tin sau.',
    aid1Label: 'Điểm dừng',
    aid1Desc: 'Bạn đang nghe hoặc đang xem điểm nào.',
    aid2Label: 'Ngôn ngữ',
    aid2Desc: 'Ngôn ngữ thuyết minh bạn đang chọn.',
    aid3Label: 'Thiết bị',
    aid3Desc: 'Loại điện thoại và trình duyệt bạn đang dùng.',
    aid4Label: 'Ảnh chụp màn hình',
    aid4Desc: 'Nếu có, ảnh giúp chúng tôi hiểu vấn đề nhanh hơn.',
    errNameRequired: 'Vui lòng nhập họ tên.',
    errEmailRequired: 'Vui lòng nhập email.',
    errEmailInvalid: 'Email không hợp lệ.',
    errMessageRequired: 'Vui lòng nhập nội dung.',
    errMessageMin: 'Nội dung cần ít nhất 10 ký tự.',
    errSendFailed: 'Không gửi được tin nhắn. Vui lòng thử lại.',
  },
  en: {
    eyebrow: 'SUPPORT & CONNECT',
    title: 'Contact Us',
    subtitle: 'Feedback, translation corrections, visitor assistance, and partnership opportunities for Saigon heritage.',
    officeTitle: 'Visitor Information Center',
    officeAddress: '02 Paris Commune Square, Ben Nghe Ward, District 1, Ho Chi Minh City',
    officeDesc: 'Opposite Central Post Office, 50m from Notre-Dame Cathedral',
    hotlineTitle: 'Visitor Hotline',
    hotlineDesc: '1900 1234, Free 24/7 Assistance',
    emailTitle: 'Email Inbox',
    emailDesc: 'contact@echora.vn, Response within 2-4 hours',
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
    phoneInputLabel: 'Phone Number (optional)',
    phonePlaceholder: '+84 xxx xxx xxx (optional)',
    subjectLabel: 'Message Subject',
    subjectPlaceholder: '',
    messageLabel: 'Detailed Message',
    messagePlaceholder: '',
    sendBtn: 'Send Message Now',
    sendingBtn: 'Sending...',
    successTitle: 'Message sent successfully',
    successNotice: 'Your message has been sent successfully to the Echora team. Replies will appear in Support messages in your account.',
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
        q: 'Does the website work in low-connectivity areas?',
        a: 'Yes. Core stop data and narration texts are cached in your browser so you can view stops and transcripts even with intermittent internet.',
      },
    ],
    trustCommitment: 'Strict visitor privacy & data protection',
    trustResponseTime: 'Average response time: under 2 hours',
    addressLabel: 'Address',
    hoursLabel: 'Operating Hours',
    locationTitle: 'Location',
    directionsLabel: 'Directions',
    optionalPhoneAdd: 'Add phone number (optional)',
    optionalPhoneHide: 'Hide phone number',
    sendAnother: 'Send another message',
    helpSectionTitle: 'Contact Guide',
    helpGuide1Title: 'Using Audio Guide',
    helpGuide1Desc: 'Select language, toggle auto narration, or scan QR at each stop.',
    helpGuide2Title: 'Souvenir Orders',
    helpGuide2Desc: 'Note your order code in the message for faster inquiry support.',
    helpGuide3Title: 'Partnership & Feedback',
    helpGuide3Desc: 'Select partnership in the form; we are delighted to hear from you.',
    fixSectionTitle: 'Common Audio Issues',
    fix1Title: 'No Audio Heard',
    fix1Desc: 'Check device volume, headphones, and silent mode, then press play again.',
    fix2Title: 'Narration Does Not Autoplay',
    fix2Desc: 'Turn on "Auto Narration" and grant GPS permission. Manual play always works.',
    fix3Title: 'Cannot Switch Language',
    fix3Desc: 'Languages marked with a lock icon require Premium. Vietnamese is always free.',
    aidSectionTitle: 'For Faster Assistance',
    aidSectionDesc: 'When describing an issue, sharing these details helps us resolve it quickly.',
    aid1Label: 'Stop',
    aid1Desc: 'Which landmark you are listening to or viewing.',
    aid2Label: 'Language',
    aid2Desc: 'The narration language currently selected.',
    aid3Label: 'Device',
    aid3Desc: 'Your smartphone model and browser type.',
    aid4Label: 'Screenshot',
    aid4Desc: 'If possible, a screenshot helps us diagnose the problem faster.',
    errNameRequired: 'Please enter your name.',
    errEmailRequired: 'Please enter your email.',
    errEmailInvalid: 'Invalid email address.',
    errMessageRequired: 'Please enter your message.',
    errMessageMin: 'Message must be at least 10 characters.',
    errSendFailed: 'Could not send message. Please try again.',
  },
  ja: {
    eyebrow: 'サポート＆お問い合わせ',
    title: 'お問い合わせ',
    subtitle: 'ご意見、誤訳のご指摘、観光案内サポート、サイゴン遺産プロジェクトへのご協力について。',
    officeTitle: '観光案内インフォメーションセンター',
    officeAddress: 'ホーチミン市1区ベンゲー街区コンサパリ通り02番地',
    officeDesc: 'サイゴン中央郵便局向かい、サイゴン大聖堂より徒歩50メートル',
    hotlineTitle: '観光客ホットライン',
    hotlineDesc: '1900 1234, 24時間年中無休対応',
    emailTitle: '電子メール',
    emailDesc: 'contact@echora.vn, 2〜4時間以内に返信',
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
    phoneInputLabel: '電話番号（任意）',
    phonePlaceholder: '+81 xxx xxx xxx（任意）',
    subjectLabel: '件名',
    subjectPlaceholder: '',
    messageLabel: 'お問い合わせ内容',
    messagePlaceholder: '',
    sendBtn: 'メッセージを送信する',
    sendingBtn: '送信中...',
    successTitle: '送信が完了しました',
    successNotice: 'メッセージはEchoraチームに送信されました。返信はアカウントの「サポートメッセージ」に表示されます。',
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
    addressLabel: '住所',
    hoursLabel: '営業時間',
    locationTitle: '所在地',
    directionsLabel: 'ルート案内',
    optionalPhoneAdd: '電話番号を追加（任意）',
    optionalPhoneHide: '電話番号を非表示',
    sendAnother: '別のメッセージを送信',
    helpSectionTitle: 'お問い合わせガイド',
    helpGuide1Title: '音声ガイドの利用',
    helpGuide1Desc: '言語を選択し、自動再生をオンにするか現地QRをスキャンします。',
    helpGuide2Title: 'お土産のご注文',
    helpGuide2Desc: '注文コードをメッセージに記載いただくと確認がスムーズです。',
    helpGuide3Title: '提携・ご意見',
    helpGuide3Desc: 'フォームの「提携」をお選びください。貴重なご意見をお待ちしています。',
    fixSectionTitle: '音声トラブルシューティング',
    fix1Title: '音が聞こえない',
    fix1Desc: '音量、イヤホン、マナーモードを確認し、再度再生をお試しください。',
    fix2Title: '自動再生されない',
    fix2Desc: '「自動音声ガイド」をオンにし、位置情報を許可してください。手動再生も可能です。',
    fix3Title: '言語を変更できない',
    fix3Desc: '鍵マークの言語はプレミアムが必要です。ベトナム語は無料です。',
    aidSectionTitle: '迅速なサポートのために',
    aidSectionDesc: 'お問い合わせの際は、以下の情報を添えていただけますと幸いです。',
    aid1Label: 'スポット',
    aid1Desc: '現在聴いている、または見ている名所。',
    aid2Label: '言語',
    aid2Desc: '選択中の音声ガイド言語。',
    aid3Label: '端末',
    aid3Desc: 'ご利用の携帯電話機種とブラウザ。',
    aid4Label: '画面キャプチャ',
    aid4Desc: '状況がわかる画像があると迅速に対応できます。',
    errNameRequired: 'お名前を入力してください。',
    errEmailRequired: 'メールアドレスを入力してください。',
    errEmailInvalid: '有効なメールアドレスを入力してください。',
    errMessageRequired: 'お問い合わせ内容を入力してください。',
    errMessageMin: 'メッセージは10文字以上で入力してください。',
    errSendFailed: 'メッセージを送信できませんでした。もう一度お試しください。',
  },
  ko: {
    eyebrow: '지원 및 문의',
    title: '문의하기',
    subtitle: '의견 접수, 번역 오류 제보, 여행자 안내 지원 및 사이공 문화유산 협업 문의.',
    officeTitle: '관광객 안내 센터',
    officeAddress: '호치민시 1군 벤응에동 파리 코뮌 광장 02번지',
    officeDesc: '중앙우체국 맞은편, 사이공 노트르담 대성당에서 50m',
    hotlineTitle: '여행자 핫라인',
    hotlineDesc: '1900 1234, 24시간 연중무휴 무료 지원',
    emailTitle: '이메일 문의',
    emailDesc: 'contact@echora.vn, 2~4시간 내 신속 회신',
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
    phoneInputLabel: '연락처 (선택)',
    phonePlaceholder: '+82 10 xxxx xxxx (선택 사항)',
    subjectLabel: '문의 제목',
    subjectPlaceholder: '',
    messageLabel: '상세 내용',
    messagePlaceholder: '',
    sendBtn: '메시지 전송하기',
    sendingBtn: '전송 중...',
    successTitle: '메시지가 전송되었습니다',
    successNotice: '메시지가 Echora 팀에 성공적으로 전송되었습니다. 답변은 계정의 지원 메시지에서 확인할 수 있습니다.',
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
    addressLabel: '주소',
    hoursLabel: '운영 시간',
    locationTitle: '위치',
    directionsLabel: '길찾기',
    optionalPhoneAdd: '연락처 추가 (선택 사항)',
    optionalPhoneHide: '연락처 숨기기',
    sendAnother: '다른 메시지 보내기',
    helpSectionTitle: '문의 안내',
    helpGuide1Title: '오디오 가이드 이용',
    helpGuide1Desc: '언어를 선택하고 자동 재생을 켜거나 현장 QR 코드를 스캔하세요.',
    helpGuide2Title: '기념품 주문 문의',
    helpGuide2Desc: '주문 코드를 메시지에 기재해 주시면 더욱 신속하게 확인해 드립니다.',
    helpGuide3Title: '제휴 및 피드백',
    helpGuide3Desc: '양식에서 제휴/피드백을 선택해 주세요. 소중한 의견을 환영합니다.',
    fixSectionTitle: '자주 발생하는 오디오 문제',
    fix1Title: '소리가 들리지 않을 때',
    fix1Desc: '기기 음량, 이어폰 연결 및 무음 모드 설정을 확인한 후 다시 재생해 보세요.',
    fix2Title: '자동 재생이 되지 않을 때',
    fix2Desc: '‘자동 해설’을 켜고 위치 권한을 허용해 주세요. 수동 재생도 언제든 가능합니다.',
    fix3Title: '언어 변경이 안 될 때',
    fix3Desc: '자물쇠 표시 언어는 프리미엄이 필요합니다. 베트남어는 항상 무료입니다.',
    aidSectionTitle: '더 빠른 도움을 받으시려면',
    aidSectionDesc: '문의 시 아래 정보를 함께 공유해 주시면 문제 해결이 빨라집니다.',
    aid1Label: '명소',
    aid1Desc: '청취 또는 확인 중인 명소 이름.',
    aid2Label: '언어',
    aid2Desc: '현재 선택된 오디오 해설 언어.',
    aid3Label: '기기',
    aid3Desc: '사용 중인 스마트폰 기종과 웹 브라우저.',
    aid4Label: '화면 캡처',
    aid4Desc: '캡처 화면이 있으면 문제를 더 빠르게 진단할 수 있습니다.',
    errNameRequired: '성함을 입력해 주세요.',
    errEmailRequired: '이메일 주소를 입력해 주세요.',
    errEmailInvalid: '올바른 이메일 주소를 입력해 주세요.',
    errMessageRequired: '내용을 입력해 주세요.',
    errMessageMin: '내용은 최소 10자 이상 입력해 주세요.',
    errSendFailed: '메시지를 전송하지 못했습니다. 다시 시도해 주세요.',
  },
};

export function tContact<K extends keyof ContactTranslation>(
  lang: SupportedLanguage,
  key: K
): ContactTranslation[K] {
  const dict = CONTACT_TRANSLATIONS[lang] || CONTACT_TRANSLATIONS.vi;
  return dict[key] !== undefined ? dict[key] : CONTACT_TRANSLATIONS.vi[key];
}
