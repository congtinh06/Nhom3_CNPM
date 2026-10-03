import { AppLanguage } from '../context/PreferencesContext';

export interface RealVsFakeItem {
  id: number;
  label: string;
  realText: string;
  fakeText: string;
}

export interface ScamCategoryContent {
  id: 'atm_skimmer' | 'fake_qr' | 'fake_call';
  title: string;
  shortDesc: string;
  howItLooks: string;
  realVsFake: {
    realTitle: string;
    fakeTitle: string;
    items: RealVsFakeItem[];
  };
  redFlags: string[];
  whatToDo: string;
  ifHappened: string;
}

export interface ChecklistQuestion {
  id: number;
  text: string;
  dangerIfYes: boolean;
}

export interface SeniorI18nData {
  nav: {
    guide: string;
    learn: string;
    check: string;
    help: string;
    settings: string;
    emergencyBtn: string;
  };
  settings: {
    title: string;
    subtitle: string;
    textSize: string;
    theme: string;
    themeLight: string;
    themeHighContrast: string;
    speechRate: string;
    rateSlow: string;
    rateNormal: string;
    reduceMotion: string;
    autoRead: string;
    language: string;
    backBtn: string;
  };
  emergency: {
    title: string;
    subtitle: string;
    action1Title: string;
    action1Desc: string;
    action2Title: string;
    action2Desc: string;
    action2Btn: string;
    action3Title: string;
    action3Desc: string;
    callPoliceBtn: string;
    callEmbassyBtn: string;
    helperCardTitle: string;
    helperCardText: string;
    copyHelperBtn: string;
    copiedNotice: string;
    reportBtn: string;
    backBtn: string;
  };
  checklist: {
    tabCheckLink: string;
    tabChecklist: string;
    pinWarning: string;
    title: string;
    subtitle: string;
    questions: ChecklistQuestion[];
    yesBtn: string;
    noBtn: string;
    resultSafe: string;
    resultWarning: string;
    resultDanger: string;
    safeAdvice: string;
    warningAdvice: string;
    dangerAdvice: string;
    disclaimer: string;
    resetBtn: string;
  };
  learn: {
    title: string;
    subtitle: string;
    stepIndicator: (current: number, total: number) => string;
    step1Title: string;
    step2Title: string;
    step3Title: string;
    step4Title: string;
    step5Title: string;
    prevBtn: string;
    nextBtn: string;
    categories: ScamCategoryContent[];
  };
}

export const seniorTranslations: Record<AppLanguage, SeniorI18nData> = {
  vi: {
    nav: {
      guide: 'Hướng dẫn viên',
      learn: 'Nhận biết lừa đảo',
      check: 'Kiểm tra lừa đảo',
      help: 'Trợ giúp khẩn cấp',
      settings: 'Cài đặt trợ năng',
      emergencyBtn: 'Tôi nghĩ mình đang bị lừa',
    },
    settings: {
      title: 'Cài đặt trợ năng',
      subtitle: 'Tùy chỉnh cỡ chữ, độ tương phản và giọng đọc để dễ nhìn và dễ nghe hơn.',
      textSize: 'Cỡ chữ hiển thị',
      theme: 'Độ tương phản giao diện',
      themeLight: 'Giao diện sáng chuẩn',
      themeHighContrast: 'Tương phản cao (Nền đen)',
      speechRate: 'Tốc độ giọng đọc mặc định',
      rateSlow: 'Chậm rãi (0.75x)',
      rateNormal: 'Bình thường (1.0x)',
      reduceMotion: 'Giảm bớt chuyển động hoạt họa',
      autoRead: 'Tự động đọc bài khi mở nội dung mới',
      language: 'Ngôn ngữ ứng dụng',
      backBtn: 'Quay lại',
    },
    emergency: {
      title: 'Trợ giúp khẩn cấp',
      subtitle: 'Bạn đang nghi ngờ mình bị lừa đảo? Hãy bình tĩnh và làm ngay 3 bước sau.',
      action1Title: '1. Dừng lại ngay lập tức',
      action1Desc: 'Không chuyển bất kỳ khoản tiền nào. Không đọc mã PIN hoặc mã OTP cho ai.',
      action2Title: '2. Khóa thẻ & gọi ngân hàng',
      action2Desc: 'Lật mặt sau thẻ ngân hàng và gọi vào số điện thoại in ở đó.',
      action2Btn: 'Gọi hotline in sau thẻ ngân hàng',
      action3Title: '3. Báo cơ quan công an hoặc đại sứ quán',
      action3Desc: 'Nếu bạn đang ở Việt Nam, hãy bấm gọi cảnh sát 113 để được bảo vệ.',
      callPoliceBtn: 'Gọi Cảnh sát Việt Nam (113)',
      callEmbassyBtn: 'Tổng đài hỗ trợ du khách (1900 8888)',
      helperCardTitle: 'Đưa tin nhắn tiếng Việt này cho người địa phương:',
      helperCardText: 'Tôi là du khách nước ngoài. Tôi nghi ngờ tài khoản của tôi đang bị lừa đảo. Xin vui lòng giúp tôi gọi cảnh sát hoặc ngân hàng.',
      copyHelperBtn: 'Sao chép tin nhắn này',
      copiedNotice: 'Đã sao chép vào bộ nhớ tạm!',
      reportBtn: 'Gửi báo cáo sự việc lên hệ thống',
      backBtn: 'Quay lại',
    },
    checklist: {
      tabCheckLink: 'Kiểm tra Link / SMS',
      tabChecklist: 'Trả lời vài câu hỏi',
      pinWarning: 'Lưu ý an toàn: Không bao giờ dán mã PIN, mã OTP hay số thẻ vào ô kiểm tra.',
      title: 'Đánh giá nguy cơ lừa đảo nhanh',
      subtitle: 'Hãy bấm Có hoặc Không cho các câu hỏi sau để kiểm tra tình huống của bạn.',
      questions: [
        { id: 1, text: 'Có ai yêu cầu bạn đọc mã OTP gửi về điện thoại không?', dangerIfYes: true },
        { id: 2, text: 'Có ai tự xưng là công an dọa bắt bạn và đòi chuyển tiền không?', dangerIfYes: true },
        { id: 3, text: 'Mã QR thanh toán có dấu hiệu bị dán một miếng giấy đè lên không?', dangerIfYes: false },
        { id: 4, text: 'Người lạ tại cây ATM đề nghị "giúp bạn" thao tác rút tiền?', dangerIfYes: true },
        { id: 5, text: 'Bạn bị hối thúc phải chuyển tiền gấp trong vòng vài phút?', dangerIfYes: false },
      ],
      yesBtn: 'Có',
      noBtn: 'Không',
      resultSafe: 'Chưa thấy dấu hiệu nguy hiểm',
      resultWarning: 'Cần chú ý thận trọng',
      resultDanger: 'Cực kỳ nguy hiểm - Dấu hiệu lừa đảo rõ ràng',
      safeAdvice: 'Tình huống chưa có dấu hiệu nguy cơ cao. Hãy luôn giữ bí mật mã PIN và OTP.',
      warningAdvice: 'Có dấu hiệu bất thường. Hãy dừng lại và xác minh với nhân viên ngân hàng chính thức.',
      dangerAdvice: 'Dừng giao dịch ngay lập tức! Ngân hàng và công an không bao giờ đòi tiền hay mã OTP qua điện thoại.',
      disclaimer: 'Lưu ý: Kết quả là hướng dẫn định hướng an toàn, không phải bảo đảm tuyệt đối 100%.',
      resetBtn: 'Làm lại bảng câu hỏi',
    },
    learn: {
      title: 'Nhận biết lừa đảo ngoài đời thực',
      subtitle: 'Các thủ đoạn thực tế mà công cụ kiểm tra link không thể phát hiện.',
      stepIndicator: (cur, tot) => `Bước ${cur} / ${tot}`,
      step1Title: '1. Trông như thế nào',
      step2Title: '2. Thật và Giả (So sánh)',
      step3Title: '3. Dấu hiệu nhận biết',
      step4Title: '4. Bạn cần làm gì',
      step5Title: '5. Nếu đã lỡ xảy ra',
      prevBtn: 'Quay lại',
      nextBtn: 'Tiếp theo',
      categories: [
        {
          id: 'atm_skimmer',
          title: 'Máy ATM bị gắn chip & Người lạ giúp đỡ',
          shortDesc: 'Kẻ gian gắn đầu đọc trộm thẻ tại khe cắm hoặc đứng kế bên nhìn lén mã PIN.',
          howItLooks: 'Khe cắm thẻ ATM trông nhô ra bất thường, lỏng lẻo hoặc có người lạ nhiệt tình đứng gần hướng dẫn rút tiền.',
          realVsFake: {
            realTitle: 'Cây ATM chuẩn an toàn',
            fakeTitle: 'Cây ATM bị kẻ gian can thiệp',
            items: [
              { id: 1, label: 'Khe cắm thẻ', realText: 'Gắn chặt vào máy, không lung lay, có đèn xanh nhấp nháy.', fakeText: 'Vỏ nhựa gắn đè nhô ra, lỏng lẻo khi lắc nhẹ bằng tay.' },
              { id: 2, label: 'Bàn phím PIN', realText: 'Bàn phím kim loại chắc chắn chìm phẳng trong máy.', fakeText: 'Bàn phím dán đè giả mạo, bấm có cảm giác dày cộm xốp.' },
              { id: 3, label: 'Khu vực xung quanh', realText: 'Không có vật thể lạ gắn trên nóc máy ATM.', fakeText: 'Có hộp tờ rơi nhỏ gắn camera giấu kín chĩa vào bàn phím.' },
            ],
          },
          redFlags: [
            'Khe cắm thẻ bị lỏng lẻo khi bạn dùng ngón tay lắc nhẹ.',
            'Bàn phím nhập mã PIN bị cộm, ọp ẹp hoặc đổi màu khác lạ.',
            'Người lạ đứng quá gần và nhìn vào tay bạn khi bấm số.',
            'Người lạ tự ý với tay bấm hộ nút trên màn hình máy ATM.',
          ],
          whatToDo: 'Luôn dùng một bàn tay che kín bàn phím khi bấm PIN. Nếu khe cắm lỏng lẻo, hãy đổi cây ATM khác.',
          ifHappened: 'Mở ứng dụng ngân hàng khóa thẻ ngay lập tức. Sau đó gọi hotline ngân hàng in sau thẻ.',
        },
        {
          id: 'fake_qr',
          title: 'Mã QR giả mạo dán đè',
          shortDesc: 'Kẻ gian in mã QR của họ rồi dán đè lên mã thanh toán của nhà hàng, quán cà phê.',
          howItLooks: 'Mã QR tại quầy thanh toán là một miếng decal dán chồng lên tấm mica hoặc bảng menu cũ.',
          realVsFake: {
            realTitle: 'Mã QR thật của quán',
            fakeTitle: 'Mã QR giả bị dán đè',
            items: [
              { id: 1, label: 'Bề mặt mã', realText: 'In liền mạch sắc nét trên bảng gỗ hoặc mica cố định.', fakeText: 'Là miếng sticker dán chồng lên, góc cạnh bị bong tróc.' },
              { id: 2, label: 'Tên người nhận', realText: 'Hiện đúng tên quán hoặc tên chủ cửa hàng quen thuộc.', fakeText: 'Hiện tên một cá nhân lạ hoặc số tài khoản ví điện tử lạ.' },
            ],
          },
          redFlags: [
            'Miếng decal mã QR bị cộm lên khi vuốt ngón tay qua.',
            'Tên người nhận tiền trên màn hình không khớp tên cửa hàng.',
            'Nhân viên quán không biết về mã QR dán trên bàn.',
          ],
          whatToDo: 'Luôn nhìn kỹ tên người nhận trước khi bấm chuyển tiền. Hãy hỏi nhân viên quán xác nhận.',
          ifHappened: 'Báo ngay cho nhân viên cửa hàng. Chụp lại màn hình chuyển khoản để đối chiếu ngân hàng.',
        },
        {
          id: 'fake_call',
          title: 'Cuộc gọi giả danh công an hoặc ngân hàng',
          shortDesc: 'Kẻ lừa đảo gọi điện dọa khóa tài khoản hoặc dọa bắt giam để ép gửi tiền.',
          howItLooks: 'Người gọi nói giọng rất nghiêm khắc, gấp gáp, tự xưng là điều tra viên công an hoặc bộ phận an ninh ngân hàng.',
          realVsFake: {
            realTitle: 'Cơ quan chức năng thật',
            fakeTitle: 'Kẻ lừa đảo qua điện thoại',
            items: [
              { id: 1, label: 'Cách làm việc', realText: 'Gửi giấy mời trực tiếp đến trụ sở, không làm việc qua Zalo.', fakeText: 'Gọi điện đe dọa, đòi kết bạn Zalo gửi lệnh bắt giả.' },
              { id: 2, label: 'Yêu cầu tiền', realText: 'Tuyệt đối không bao giờ đòi chuyển tiền vào "tài khoản an toàn".', fakeText: 'Yêu cầu chuyển tiền vào tài khoản cá nhân để "giám định".' },
            ],
          },
          redFlags: [
            'Đe dọa bắt giam và cấm không được kể cho người thân biết.',
            'Đòi bạn đọc mã OTP hoặc mật khẩu đăng nhập ngân hàng.',
            'Yêu cầu chuyển tiền vào một "tài khoản an toàn" để chứng minh vô tội.',
            'Hối thúc bạn phải làm ngay trong vòng 10 đến 15 phút.',
          ],
          whatToDo: 'Cúp máy ngay lập tức! Công an và ngân hàng Việt Nam không bao giờ đòi tiền qua điện thoại.',
          ifHappened: 'Không làm theo bất kỳ hướng dẫn nào tiếp theo. Bấm nút Trợ giúp khẩn cấp và gọi công an 113.',
        },
      ],
    },
  },
  en: {
    nav: {
      guide: 'Bank Guide',
      learn: 'Scam Awareness',
      check: 'Check Scam',
      help: 'Emergency Help',
      settings: 'Settings',
      emergencyBtn: "I think I'm being scammed",
    },
    settings: {
      title: 'Accessibility Settings',
      subtitle: 'Adjust text size, contrast, and voice speed for comfortable reading and listening.',
      textSize: 'Display Text Size',
      theme: 'Theme & Contrast',
      themeLight: 'Clear Light Theme',
      themeHighContrast: 'High Contrast (Dark AAA)',
      speechRate: 'Default Voice Speed',
      rateSlow: 'Slow (0.75x)',
      rateNormal: 'Normal (1.0x)',
      reduceMotion: 'Reduce Animations and Motion',
      autoRead: 'Automatically read new articles aloud',
      language: 'App Language',
      backBtn: 'Back',
    },
    emergency: {
      title: 'Emergency Help',
      subtitle: 'Suspect a scam? Stay calm and take these 3 immediate actions.',
      action1Title: '1. Stop right now',
      action1Desc: 'Do not send any money. Never share your PIN or OTP codes.',
      action2Title: '2. Freeze card & call your bank',
      action2Desc: 'Flip your card over and call the phone number printed on the back.',
      action2Btn: 'Call hotline printed on bank card',
      action3Title: '3. Contact local police or embassy',
      action3Desc: 'In Vietnam, dial 113 to reach the police immediately.',
      callPoliceBtn: 'Call Vietnam Police (113)',
      callEmbassyBtn: 'Tourist Support Hotline (1900 8888)',
      helperCardTitle: 'Show this Vietnamese message to any local person:',
      helperCardText: 'Tôi là du khách nước ngoài. Tôi nghi ngờ tài khoản của tôi đang bị lừa đảo. Xin vui lòng giúp tôi gọi cảnh sát hoặc ngân hàng.',
      copyHelperBtn: 'Copy this message',
      copiedNotice: 'Copied to clipboard!',
      reportBtn: 'Submit report to BankShield',
      backBtn: 'Back',
    },
    checklist: {
      tabCheckLink: 'Check Link / SMS',
      tabChecklist: 'Answer a few questions',
      pinWarning: 'Safety note: Never paste your PIN, OTP, or card number into this box.',
      title: 'Quick Scam Risk Assessment',
      subtitle: 'Answer Yes or No to check if you are facing a potential scam.',
      questions: [
        { id: 1, text: 'Did someone ask for your secret PIN or OTP code?', dangerIfYes: true },
        { id: 2, text: 'Did a caller claim to be police demanding money transfer?', dangerIfYes: true },
        { id: 3, text: 'Is the QR payment code a sticker pasted on top?', dangerIfYes: false },
        { id: 4, text: 'Did a stranger at an ATM offer to help you withdraw?', dangerIfYes: true },
        { id: 5, text: 'Are you being rushed to send money within minutes?', dangerIfYes: false },
      ],
      yesBtn: 'Yes',
      noBtn: 'No',
      resultSafe: 'No immediate danger detected',
      resultWarning: 'Proceed with caution',
      resultDanger: 'Extreme Danger - High Scam Probability',
      safeAdvice: 'No major red flags detected. Always keep your PIN and OTP secret.',
      warningAdvice: 'Suspicious behavior detected. Stop and verify with official bank staff.',
      dangerAdvice: 'Stop immediately! Banks and police never ask for money or OTPs over the phone.',
      disclaimer: 'Note: This tool provides general guidance, not a 100% legal guarantee.',
      resetBtn: 'Reset Questionnaire',
    },
    learn: {
      title: 'Real-World Scam Awareness',
      subtitle: 'Physical scam tactics that link checkers cannot detect.',
      stepIndicator: (cur, tot) => `Step ${cur} of ${tot}`,
      step1Title: '1. How It Looks',
      step2Title: '2. Real vs Fake Comparison',
      step3Title: '3. Red Flags',
      step4Title: '4. What To Do',
      step5Title: '5. If It Already Happened',
      prevBtn: 'Back',
      nextBtn: 'Next',
      categories: [
        {
          id: 'atm_skimmer',
          title: 'ATM Skimmers & Helpful Strangers',
          shortDesc: 'Thieves attach card readers to ATM slots or look over your shoulder.',
          howItLooks: 'The card slot looks bulky or loose, or a stranger stands unusually close to offer help.',
          realVsFake: {
            realTitle: 'Legitimate ATM',
            fakeTitle: 'Tampered ATM',
            items: [
              { id: 1, label: 'Card slot', realText: 'Firmly built into the machine with a steady green light.', fakeText: 'Bulky plastic cover pasted over, wobbles when wiggled.' },
              { id: 2, label: 'PIN keypad', realText: 'Solid metal keys aligned flush with the casing.', fakeText: 'Fake overlay keypad placed on top, feels soft or spongy.' },
              { id: 3, label: 'Surroundings', realText: 'Clean surface without extra boxes or brochures.', fakeText: 'Tiny pinhole camera hidden in a brochure holder above keys.' },
            ],
          },
          redFlags: [
            'The card slot feels loose when wiggled with fingers.',
            'The keypad feels unusually thick or colors look mismatched.',
            'A stranger stands right behind you watching your hands.',
            'A stranger reaches over to press buttons for you.',
          ],
          whatToDo: 'Always cover the keypad with your free hand. If the slot feels loose, walk away.',
          ifHappened: 'Freeze your card immediately in your bank mobile app. Call the number on the back.',
        },
        {
          id: 'fake_qr',
          title: 'Fake Overlaid QR Codes',
          shortDesc: 'Scammers print their own QR sticker and paste it over store payment codes.',
          howItLooks: 'The QR code at the counter is a sticker pasted over an older menu board or table acrylic.',
          realVsFake: {
            realTitle: 'Official Shop QR',
            fakeTitle: 'Overlaid Fake QR',
            items: [
              { id: 1, label: 'Surface', realText: 'Printed directly on the permanent acrylic or wooden stand.', fakeText: 'Paper or vinyl sticker pasted over, edges peeling off.' },
              { id: 2, label: 'Recipient Name', realText: 'Matches the official store name or business registered name.', fakeText: 'Shows an unknown personal name or stranger e-wallet.' },
            ],
          },
          redFlags: [
            'You feel a raised sticker edge over the original code.',
            'The recipient name on your screen does not match the shop.',
            'Staff are unaware of the QR code on your table.',
          ],
          whatToDo: 'Always verify the recipient name before confirming payment. Ask staff to double check.',
          ifHappened: 'Alert staff immediately. Screenshot your transaction receipt for bank dispute.',
        },
        {
          id: 'fake_call',
          title: 'Fake Police or Bank Phone Calls',
          shortDesc: 'Scammers impersonate officers demanding immediate money transfers.',
          howItLooks: 'Caller speaks with harsh urgency, claiming your account is involved in illegal activity.',
          realVsFake: {
            realTitle: 'Official Authorities',
            fakeTitle: 'Phone Scammer',
            items: [
              { id: 1, label: 'Process', realText: 'Issues written summons to an official police station.', fakeText: 'Demands video calls or messages via social apps.' },
              { id: 2, label: 'Money request', realText: 'Never asks for money transfer to verify innocence.', fakeText: 'Demands transfer into a "safe investigation account".' },
            ],
          },
          redFlags: [
            'Threatens immediate arrest if you hang up or tell family.',
            'Asks you to read aloud an SMS OTP or password.',
            'Demands transfer into a "safe account" for verification.',
            'Forces you to act within 10 to 15 minutes.',
          ],
          whatToDo: 'Hang up immediately! Vietnamese authorities never demand money over the phone.',
          ifHappened: 'Do not follow further orders. Tap Emergency Help and call 113.',
        },
      ],
    },
  },
  ja: {
    nav: {
      guide: '銀行ガイド',
      learn: '詐欺の手口',
      check: '安全確認',
      help: '緊急支援',
      settings: '設定',
      emergencyBtn: '詐欺にあっているかも',
    },
    settings: {
      title: 'アクセシビリティ設定',
      subtitle: '文字サイズ、コントラスト、読み上げ速度を見やすく調整できます。',
      textSize: '文字の大きさ',
      theme: '表示テーマと対比度',
      themeLight: '標準ライトテーマ',
      themeHighContrast: '高コントラスト (黒背景 AAA)',
      speechRate: '標準の読み上げ速度',
      rateSlow: 'ゆっくり (0.75倍)',
      rateNormal: '標準 (1.0倍)',
      reduceMotion: 'アニメーションと動きを減らす',
      autoRead: '新しい記事を自動的に読み上げる',
      language: '表示言語',
      backBtn: '戻る',
    },
    emergency: {
      title: '緊急支援',
      subtitle: '詐欺の疑いがありますか？ 落ち着いて次の3つの行動をとってください。',
      action1Title: '1. 今すぐ中止する',
      action1Desc: '送金しないでください。暗証番号やワンタイムパスワード（OTP）を他人に教えないでください。',
      action2Title: '2. カードを停止し、銀行へ電話',
      action2Desc: 'クレジットカードの裏面を確認し、記載された電話番号に電話してください。',
      action2Btn: 'カード裏面の電話番号にかける',
      action3Title: '3. 警察または大使館に通報',
      action3Desc: 'ベトナム滞在中は、警察（113）にダイヤルして助けを求めてください。',
      callPoliceBtn: 'ベトナム警察に電話 (113)',
      callEmbassyBtn: '旅行者支援ホットライン (1900 8888)',
      helperCardTitle: '現地の人にこのベトナム語メッセージを見せてください:',
      helperCardText: 'Tôi là du khách nước ngoài. Tôi nghi ngờ tài khoản của tôi đang bị lừa đảo. Xin vui lòng giúp tôi gọi cảnh sát hoặc ngân hàng.',
      copyHelperBtn: 'この文をコピーする',
      copiedNotice: 'クリップボードにコピーしました！',
      reportBtn: '被害・手口をシステムに報告する',
      backBtn: '戻る',
    },
    checklist: {
      tabCheckLink: 'リンク / SMSの確認',
      tabChecklist: '質問に答えてチェック',
      pinWarning: '注意: ここにカード番号、暗証番号、OTPを絶対に入力しないでください。',
      title: '詐欺リスク簡易診断',
      subtitle: '状況に当てはまる項目に「はい」か「いいえ」でお答えください。',
      questions: [
        { id: 1, text: '暗証番号やSMSのOTPコードを教えるよう要求されましたか？', dangerIfYes: true },
        { id: 2, text: '警察を名乗る人物から送金を要求する電話を受けましたか？', dangerIfYes: true },
        { id: 3, text: 'QRコードの上に別のシールが上貼りされているように見えますか？', dangerIfYes: false },
        { id: 4, text: 'ATMで知らない人から「手伝う」と声をかけられましたか？', dangerIfYes: true },
        { id: 5, text: '「数分以内に急いで送金しろ」と急かされていますか？', dangerIfYes: false },
      ],
      yesBtn: 'はい',
      noBtn: 'いいえ',
      resultSafe: '直ちに危険な兆候は見られません',
      resultWarning: '注意が必要です',
      resultDanger: '極めて危険 - 詐欺の可能性大',
      safeAdvice: '重大な兆候は見られませんが、暗証番号は常に厳重に管理してください。',
      warningAdvice: '不審な点があります。操作を中断し、正規の銀行窓口に確認してください。',
      dangerAdvice: '直ちに操作を中止してください！警察や銀行が電話で送金やOTPを要求することはありません。',
      disclaimer: '注記: 本診断は安全指針を示すものであり、絶対的な保証をするものではありません。',
      resetBtn: 'もう一度診断する',
    },
    learn: {
      title: '実社会での詐欺手口',
      subtitle: 'リンク確認ツールでは検知できない、街中の手口を解説します。',
      stepIndicator: (cur, tot) => `ステップ ${cur} / ${tot}`,
      step1Title: '1. どのような見た目か',
      step2Title: '2. 本物と偽物の比較',
      step3Title: '3. 危険の兆候（チェック）',
      step4Title: '4. どう行動すべきか',
      step5Title: '5. もし被害に遭ってしまったら',
      prevBtn: '前へ',
      nextBtn: '次へ',
      categories: [
        {
          id: 'atm_skimmer',
          title: 'ATMスキマーと親切を装う他人',
          shortDesc: 'カード挿入口に読取機をつけたり、暗証番号を盗み見たりします。',
          howItLooks: '挿入口が不自然に出っ張っていたり、他人が真後ろに立って見つめてきたりします。',
          realVsFake: {
            realTitle: '正規のATM',
            fakeTitle: '細工されたATM',
            items: [
              { id: 1, label: 'カード挿入口', realText: '本体と一体化しており、緑色のランプが点滅している。', fakeText: '上からプラスチック枠が貼られ、手で揺らすとグラつく。' },
              { id: 2, label: '暗証番号キー', realText: '平らな金属製キーで本体に埋め込まれている。', fakeText: '上に偽のキーパッドが重ねられ、押すとフワフワする。' },
              { id: 3, label: '周辺の様子', realText: 'パンフレット立てなどに不審な穴はない。', fakeText: '手元を撮影する小型カメラが隠されている。' },
            ],
          },
          redFlags: [
            'カード挿入口を指で軽く揺らすとグラグラ動く。',
            'テンキーパッドが不自然に厚く感じる。',
            '知らない人が真後ろに立ち、手元を見つめている。',
            '他人が勝手に画面のボタンを押そうとしてくる。',
          ],
          whatToDo: '番号を押す時は必ずもう一方の手で隠してください。グラつくATMは使わないでください。',
          ifHappened: '銀行アプリで即座にカードを一時停止し、カード裏面の電話番号に電話してください。',
        },
        {
          id: 'fake_qr',
          title: '上貼りされた偽のQRコード',
          shortDesc: '店頭の決済QRコードの上に、犯人のQRシールを重ね貼りします。',
          howItLooks: 'お店の支払い用QRコードが、元のスタンドの上にシールで貼られています。',
          realVsFake: {
            realTitle: '正規の店舗QR',
            fakeTitle: '上貼りされた偽QR',
            items: [
              { id: 1, label: '表面の感触', realText: 'プレートやメニューに直接綺麗に印刷されている。', fakeText: 'シールが重ね貼りされており、角が浮いている。' },
              { id: 2, label: '受取人の名前', realText: 'お店の正式名称が表示される。', fakeText: '知らない個人の名前や別のアカウントが表示される。' },
            ],
          },
          redFlags: [
            'QRコード部分を指で触るとシールの段差がある。',
            '送金確認画面の受取人名が店名と一致しない。',
            '店員がそのQRコードの存在を把握していない。',
          ],
          whatToDo: '送金ボタンを押す前に必ず受取人名を確認し、店員に確認してください。',
          ifHappened: '店員にすぐ知らせ、送金完了画面のスクリーンショットを保存してください。',
        },
        {
          id: 'fake_call',
          title: '警察や銀行員を名乗る偽電話',
          shortDesc: '捜査員を名乗り、逮捕をちらつかせて指定口座へ送金させます。',
          howItLooks: '厳しい口調で早口に話し、あなたの口座が犯罪に関与していると脅してきます。',
          realVsFake: {
            realTitle: '正規の警察・銀行',
            fakeTitle: '偽の警察・詐欺師',
            items: [
              { id: 1, label: '連絡方法', realText: '書面で正式な警察署へ出頭を要請する。', fakeText: '電話やSNSアプリで逮捕状の画像などを送りつける。' },
              { id: 2, label: '送金の要求', realText: '「調査のため」にお金を振り込ませることは絶対にない。', fakeText: '「潔白を証明するため安全口座へ送金しろ」と要求する。' },
            ],
          },
          redFlags: [
            '「家族に話したら逮捕する」と脅してくる。',
            '暗証番号やSMSの認証コード（OTP）を聞き出そうとする。',
            '「安全な口座」にお金を移すよう指示してくる。',
            '「今すぐ10分以内に振り込め」と急かしてくる。',
          ],
          whatToDo: 'すぐに電話を切ってください！警察や銀行が電話で送金を要求することは絶対にありません。',
          ifHappened: 'これ以上の指示に従わず、「緊急支援」画面から警察（113）に通報してください。',
        },
      ],
    },
  },
  ko: {
    nav: {
      guide: '은행 가이드',
      learn: '사기 수법 알기',
      check: '사기 여부 확인',
      help: '긴급 지원',
      settings: '접근성 설정',
      emergencyBtn: '사기를 당한 것 같아요',
    },
    settings: {
      title: '접근성 설정',
      subtitle: '글자 크기, 대비, 음성 속도를 보기 편하게 조절하세요.',
      textSize: '화면 글자 크기',
      theme: '화면 테마 및 대비',
      themeLight: '밝은 테마',
      themeHighContrast: '고대비 테마 (검은 배경 AAA)',
      speechRate: '기본 음성 속도',
      rateSlow: '느리게 (0.75배)',
      rateNormal: '보통 (1.0배)',
      reduceMotion: '화면 움직임 효과 줄이기',
      autoRead: '새 글을 열면 자동으로 읽어주기',
      language: '사용 언어',
      backBtn: '뒤로 가기',
    },
    emergency: {
      title: '긴급 지원',
      subtitle: '사기가 의심되시나요? 침착하게 다음 3단계를 바로 진행하세요.',
      action1Title: '1. 즉시 멈추세요',
      action1Desc: '돈을 보내지 마세요. 비밀번호나 인증번호(OTP)를 아무에게도 알려주지 마세요.',
      action2Title: '2. 카드 정지 및 은행 전화',
      action2Desc: '은행 카드 뒷면에 적힌 고객센터 전화번호로 즉시 전화하세요.',
      action2Btn: '카드 뒷면 고객센터로 전화하기',
      action3Title: '3. 경찰 또는 대사관에 신고',
      action3Desc: '베트남 체류 중인 경우 113번을 눌러 경찰에 도움을 요청하세요.',
      callPoliceBtn: '베트남 경찰에 전화하기 (113)',
      callEmbassyBtn: '관광객 지원 핫라인 (1900 8888)',
      helperCardTitle: '현지인에게 이 베트남어 메시지를 보여주세요:',
      helperCardText: 'Tôi là du khách nước ngoài. Tôi nghi ngờ tài khoản của tôi đang bị lừa đảo. Xin vui lòng giúp tôi gọi cảnh sát hoặc ngân hàng.',
      copyHelperBtn: '이 메시지 복사하기',
      copiedNotice: '클립보드에 복사되었습니다!',
      reportBtn: '시스템에 사기 수법 제보하기',
      backBtn: '뒤로 가기',
    },
    checklist: {
      tabCheckLink: '링크 / 문자 검사',
      tabChecklist: '질문에 답하고 위험도 확인',
      pinWarning: '안전 주의: 비밀번호, 카드번호, 인증번호(OTP)를 절대 입력하지 마세요.',
      title: '사기 위험 자가 진단',
      subtitle: '현재 상황에 맞는 질문에 예 또는 아니오를 선택하세요.',
      questions: [
        { id: 1, text: '휴대폰으로 전송된 OTP 인증번호를 불러달라는 요구를 받았나요?', dangerIfYes: true },
        { id: 2, text: '경찰이나 검찰이라며 계좌 이체를 요구하는 전화를 받았나요?', dangerIfYes: true },
        { id: 3, text: '결제 QR 코드 위에 스티커가 덧붙여져 있나요?', dangerIfYes: false },
        { id: 4, text: 'ATM 앞에서 낯선 사람이 출금을 도와주겠다고 접근했나요?', dangerIfYes: true },
        { id: 5, text: '지금 당장 몇 분 안에 돈을 보내라며 재촉당하고 있나요?', dangerIfYes: false },
      ],
      yesBtn: '예',
      noBtn: '아니오',
      resultSafe: '즉각적인 위험 신호가 없습니다',
      resultWarning: '주의가 필요합니다',
      resultDanger: '매우 위험 - 사기 가능성 높음',
      safeAdvice: '주요 위험 신호는 발견되지 않았습니다. 비밀번호 관리에 유의하세요.',
      warningAdvice: '의심스러운 정황이 있습니다. 거래를 멈추고 은행 창구에서 확인하세요.',
      dangerAdvice: '즉시 중단하세요! 은행과 경찰은 전화로 돈이나 인증번호를 요구하지 않습니다.',
      disclaimer: '참고: 본 진단은 안전 가이드라인이며 법적 보증은 아닙니다.',
      resetBtn: '질문 다시 하기',
    },
    learn: {
      title: '현장 사기 수법 바로알기',
      subtitle: '링크 검사기로는 잡아낼 수 없는 오프라인 사기 수법입니다.',
      stepIndicator: (cur, tot) => `${cur}단계 / 총 ${tot}단계`,
      step1Title: '1. 어떤 모습인가요?',
      step2Title: '2. 진짜와 가짜 비교',
      step3Title: '3. 의심해야 할 징후',
      step4Title: '4. 어떻게 해야 하나요?',
      step5Title: '5. 이미 피해를 입었다면',
      prevBtn: '이전',
      nextBtn: '다음',
      categories: [
        {
          id: 'atm_skimmer',
          title: 'ATM 복제기 및 친절한 낯선 사람',
          shortDesc: 'ATM 카드 투입구에 복제기를 덧씌우거나 비밀번호를 훔쳐봅니다.',
          howItLooks: '카드 투입구가 불룩하게 튀어나와 흔들리거나, 낯선 사람이 바짝 붙어 출금을 도와주려 합니다.',
          realVsFake: {
            realTitle: '정상 ATM 기기',
            fakeTitle: '변조된 ATM 기기',
            items: [
              { id: 1, label: '카드 투입구', realText: '기기에 단단히 고정되어 있고 초록불이 깜빡입니다.', fakeText: '플라스틱 덮개가 덧붙여져 손으로 잡고 흔들면 덜렁거립니다.' },
              { id: 2, label: '키패드', realText: '단단한 금속제 키패드가 기기 표면과 평평합니다.', fakeText: '위에 가짜 키패드가 덧대어져 누를 때 푹신푹신합니다.' },
              { id: 3, label: '주변 환경', realText: '안내문 거치대 등에 불필요한 구멍이 없습니다.', fakeText: '손가락을 겨냥한 초소형 핀홀 카메라가 숨겨져 있습니다.' },
            ],
          },
          redFlags: [
            '손가락으로 투입구를 살짝 흔들었을 때 덜컹거림.',
            '비밀번호 키패드가 비정상적으로 두껍게 느껴짐.',
            '낯선 사람이 너무 가까이 서서 손을 쳐다봄.',
            '타인이 내 대신 화면 버튼을 누르려고 함.',
          ],
          whatToDo: '비밀번호를 누를 때는 항상 반대쪽 손으로 가리세요. 덜렁거리는 ATM은 쓰지 마세요.',
          ifHappened: '은행 앱에서 카드를 즉시 일시 정지하고, 카드 뒷면 고객센터로 전화하세요.',
        },
        {
          id: 'fake_qr',
          title: '덧붙여진 가짜 QR 코드',
          shortDesc: '가게 결제용 QR 코드 위에 사기꾼의 스티커를 덧붙입니다.',
          howItLooks: '테이블이나 계산대에 놓인 QR 코드가 기존 판 위에 스티커로 덧붙여져 있습니다.',
          realVsFake: {
            realTitle: '가게 공식 QR 코드',
            fakeTitle: '덧붙여진 가짜 QR',
            items: [
              { id: 1, label: '표면 상태', realText: '아크릴이나 나무판에 매끄럽게 인쇄되어 있습니다.', fakeText: '스티커가 덧붙여져 모서리가 들떠 있습니다.' },
              { id: 2, label: '받는 사람 이름', realText: '가게 상호나 사업자명이 올바르게 표시됩니다.', fakeText: '모르는 개인 이름이나 낯선 전자지갑이 뜹니다.' },
            ],
          },
          redFlags: [
            'QR 코드 모서리를 만졌을 때 턱이 걸리는 스티커 느낌.',
            '송금 확인 화면의 받는 사람 이름이 가게 이름과 다름.',
            '가게 직원이 해당 QR 코드에 대해 잘 모름.',
          ],
          whatToDo: '송금 버튼을 누르기 전에 받는 사람 이름을 반드시 확인하고 직원에게 물어보세요.',
          ifHappened: '즉시 매장 직원에게 알리고, 이체 내역 화면을 캡처해 두세요.',
        },
        {
          id: 'fake_call',
          title: '경찰이나 은행을 사칭한 가짜 전화',
          shortDesc: '수사관을 사칭하여 계좌가 범죄에 연루되었다며 송금을 협박합니다.',
          howItLooks: '위압적인 어조로 체포하겠다고 협박하며 안전 계좌로 돈을 보내라고 합니다.',
          realVsFake: {
            realTitle: '진짜 수사기관',
            fakeTitle: '사칭 전화 사기꾼',
            items: [
              { id: 1, label: '업무 방식', realText: '서면 출석요구서를 발송하여 경찰서 출석을 요구합니다.', fakeText: '전화나 메신저로 구속영장 사진을 보내며 협박합니다.' },
              { id: 2, label: '금전 요구', realText: '결백 증명을 명목으로 이체를 요구하지 않습니다.', fakeText: '소위 "안전 계좌"로 돈을 입금하라고 요구합니다.' },
            ],
          },
          redFlags: [
            '가족에게 알리면 즉시 체포하겠다고 위협함.',
            '비밀번호나 SMS 인증번호(OTP)를 불러달라고 함.',
            '안전 계좌로 돈을 보내라고 요구함.',
            '10분 안에 안 보내면 구속된다고 재촉함.',
          ],
          whatToDo: '즉시 전화를 끊으세요! 베트남 경찰과 은행은 전화로 돈을 요구하지 않습니다.',
          ifHappened: '추가 지시에 따르지 마시고 긴급 지원 화면을 열어 113에 신고하세요.',
        },
      ],
    },
  },
  zh: {
    nav: {
      guide: '银行导览',
      learn: '防范诈骗',
      check: '安全检测',
      help: '紧急求助',
      settings: '无障碍设置',
      emergencyBtn: '我怀疑自己遇到了诈骗',
    },
    settings: {
      title: '无障碍偏好设置',
      subtitle: '调整字号大小、对比度及语速，提供清晰易读的界面体验。',
      textSize: '文字显示大小',
      theme: '主题与对比度',
      themeLight: '清晰明亮主题',
      themeHighContrast: '高对比度模式 (黑底 AAA)',
      speechRate: '默认语音语速',
      rateSlow: '慢速 (0.75倍速)',
      rateNormal: '标准 (1.0倍速)',
      reduceMotion: '减少动态效果',
      autoRead: '打开新内容时自动朗读',
      language: '界面语言',
      backBtn: '返回',
    },
    emergency: {
      title: '紧急求助',
      subtitle: '怀疑自己遭遇诈骗？请保持冷静，立即执行以下3项操作。',
      action1Title: '1. 立即停止一切操作',
      action1Desc: '请勿向任何人转账，绝不能透露银行卡密码或短信验证码（OTP）。',
      action2Title: '2. 冻结银行卡并致电银行',
      action2Desc: '翻看您的银行卡背面，拨打卡片上印制的服务热线。',
      action2Btn: '拨打卡片背面的服务电话',
      action3Title: '3. 报警或联络领事馆',
      action3Desc: '在越南境内，请直接拨打报警电话 113。',
      callPoliceBtn: '拨打越南报警电话 (113)',
      callEmbassyBtn: '游客求助热线 (1900 8888)',
      helperCardTitle: '向当地人出示此求助文本：',
      helperCardText: 'Tôi là du khách nước ngoài. Tôi nghi ngờ tài khoản của tôi đang bị lừa đảo. Xin vui lòng giúp tôi gọi cảnh sát hoặc ngân hàng.',
      copyHelperBtn: '复制此文本',
      copiedNotice: '已复制到剪贴板！',
      reportBtn: '向系统举报可疑手法',
      backBtn: '返回',
    },
    checklist: {
      tabCheckLink: '检测网址 / 短信',
      tabChecklist: '回答问卷快速排查',
      pinWarning: '安全警示：请勿在此输入框内粘贴银行卡密码、OTP验证码或完整卡号。',
      title: '诈骗风险自测问卷',
      subtitle: '根据您当前的情况回答“是”或“否”。',
      questions: [
        { id: 1, text: '是否有人向您索取手机收到的OTP短信验证码？', dangerIfYes: true },
        { id: 2, text: '是否有自称警察或法官的人要求您向其转账？', dangerIfYes: true },
        { id: 3, text: '商户的收款二维码是否有一层贴纸覆盖在上方？', dangerIfYes: false },
        { id: 4, text: '在ATM机旁是否有陌生人主动搭讪提出“帮您取款”？', dangerIfYes: true },
        { id: 5, text: '是否有人催促您必须在几分钟内立即完成汇款？', dangerIfYes: false },
      ],
      yesBtn: '是',
      noBtn: '否',
      resultSafe: '暂未发现明显危险信号',
      resultWarning: '需提高警惕，存在异常',
      resultDanger: '极其危险 - 极高诈骗概率',
      safeAdvice: '当前未检出典型欺诈特征，请继续妥善保管好您的支付密码。',
      warningAdvice: '存在可疑特征，请立即停止转账，向银行官方工作人员核实。',
      dangerAdvice: '立即中断操作！公检法与银行绝不会通过电话要求转账或索取验证码。',
      disclaimer: '提示：本自测工具仅提供安全参考指引，不构成法律保证。',
      resetBtn: '重新测试',
    },
    learn: {
      title: '线下常见诈骗手法',
      subtitle: '链接排查工具无法防范的真实物理场景诈骗手段。',
      stepIndicator: (cur, tot) => `第 ${cur} 步 / 共 ${tot} 步`,
      step1Title: '1. 外观特征',
      step2Title: '2. 真假对比',
      step3Title: '3. 危险信号（红线）',
      step4Title: '4. 正确应对措施',
      step5Title: '5. 若已遭受损失',
      prevBtn: '上一步',
      nextBtn: '下一步',
      categories: [
        {
          id: 'atm_skimmer',
          title: 'ATM 侧录器与“热心”陌生人',
          shortDesc: '不法分子在插卡口加装读卡器，或在身旁窥视密码。',
          howItLooks: '插卡口异常凸起、松动，或有陌生人紧贴身后主动指导取款。',
          realVsFake: {
            realTitle: '正规安全 ATM',
            fakeTitle: '被改装过的 ATM',
            items: [
              { id: 1, label: '插卡口', realText: '紧密固定在机身内部，绿灯匀速闪烁。', fakeText: '塑料外壳为后贴上去的，用手轻摇会晃动。' },
              { id: 2, label: '密码键盘', realText: '平整嵌入机身的金属键盘。', fakeText: '键盘上覆盖有假按键层，按压手感松软。' },
              { id: 3, label: '周边设施', realText: '周边无异常孔洞或多余杂物架。', fakeText: '宣传册盒中隐藏有针孔镜头对准键盘。' },
            ],
          },
          redFlags: [
            '用手指轻轻摇晃插卡口时感觉明显晃动。',
            '密码键盘手感过厚或颜色与机身不一致。',
            '身旁陌生人靠得极近，盯着您的手指动作。',
            '陌生人擅自伸手替您按屏幕按键。',
          ],
          whatToDo: '输入密码时务必用另一只手遮挡按键。若插卡口松动，请换一台取款机。',
          ifHappened: '立即在手机银行 App 内临时冻结卡片，并拨打卡片背面电话。',
        },
        {
          id: 'fake_qr',
          title: '被掉包的伪造收款二维码',
          shortDesc: '骗子打印个人收款码贴纸，直接覆盖在商家的正规收款码上。',
          howItLooks: '收银台或餐桌上的二维码是后贴上去的贴纸，边缘有撕裂或重叠痕迹。',
          realVsFake: {
            realTitle: '商家官方二维码',
            fakeTitle: '恶意覆盖的假二维码',
            items: [
              { id: 1, label: '材质表面', realText: '直接平整印刷在木牌、亚克力板或点餐牌上。', fakeText: '为贴纸覆盖，用手指触摸能明显感到贴纸边缘。' },
              { id: 2, label: '收款人姓名', realText: '与店铺名称或营业执照商户名称一致。', fakeText: '显示为陌生个人姓名或不明个人电子钱包。' },
            ],
          },
          redFlags: [
            '手指划过二维码时能摸出明显的贴纸凸起边缘。',
            '手机付款界面显示的收款人姓名与店铺名称不符。',
            '店员表示不知晓桌上有该二维码。',
          ],
          whatToDo: '在点击确认付款前务必核对收款人名称，必要时请店员当面确认。',
          ifHappened: '立即告知店内工作人员，并保存付款成功截图以便联系银行追溯。',
        },
        {
          id: 'fake_call',
          title: '冒充警察或银行人员的诈骗电话',
          shortDesc: '骗子伪装成办案警官，以涉案为由恐吓被害人转账。',
          howItLooks: '来电者语气严厉急促，声称您的账户涉嫌严重违法活动，威胁逮捕。',
          realVsFake: {
            realTitle: '正规执法机关',
            fakeTitle: '电话冒充骗子',
            items: [
              { id: 1, label: '办案流程', realText: '发送正式书面传票，要求当事人到派出所当面处理。', fakeText: '通过电话或社交软件发送伪造的逮捕令图片。' },
              { id: 2, label: '资金要求', realText: '绝不会要求当事人将资金转入所谓的“安全账户”。', fakeText: '要求转账到指定“安全监管账户”以证明清白。' },
            ],
          },
          redFlags: [
            '严厉威胁“若告诉家人或挂断电话将立刻实施抓捕”。',
            '要求您报出短信验证码（OTP）或网银登录密码。',
            '要求将名下存款汇入一个陌生的“安全账户”。',
            '催促必须在10至15分钟内必须办完。',
          ],
          whatToDo: '立即挂断电话！越南公检法机关绝不会在电话中要求转账。',
          ifHappened: '切勿继续理睬其指令，打开“紧急求助”页面并直接拨打 113 报警。',
        },
      ],
    },
  },
};
