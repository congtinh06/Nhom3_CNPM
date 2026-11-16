import { SupportedLanguage } from '../../types';
import { useNavbarLanguage } from '../../content/languages';

export interface AccountTranslation {
  kicker: string;
  pageTitle: string;
  pageSubtitle: string;
  loading: string;
  menuLabel: string;
  navProfile: string;
  navOrders: string;
  navSecurity: string;
  navPreferences: string;
  navPremium: string;
  planLabel: string;
  planFree: string;
  planPremium: string;
  profileInfoTitle: string;
  profileStatusTitle: string;
  securitySessionsTitle: string;
  logoutAllNote: string;
  premiumTitle: string;
  premiumDesc: string;
  premiumActive: string;
  premiumInactive: string;
  premiumActiveNote: string;
  premiumFreeNote: string;
  premiumStatusLabel: string;
  premiumStatusActive: string;
  premiumStatusInactive: string;
  premiumExpires: string;
  premiumNoExpiry: string;
  premiumBenefitsTitle: string;
  premiumLanguagesTitle: string;
  premiumLanguagesDesc: string;
  premiumAudioTitle: string;
  premiumAudioDesc: string;
  premiumQrTitle: string;
  premiumQrDesc: string;
  premiumUnlocked: string;
  premiumLocked: string;
  premiumUpgrade: string;
  premiumRenew: string;
  premiumFreeLanguages: string;
  profileTitle: string;
  profileDesc: string;
  fullName: string;
  email: string;
  role: string;
  roleAdmin: string;
  roleUser: string;
  memberSince: string;
  emailStatus: string;
  verified: string;
  unverified: string;
  resend: string;
  resending: string;
  resent: string;
  resendFailed: string;
  editProfile: string;
  profileEmailNote: string;
  saveProfile: string;
  savingProfile: string;
  cancel: string;
  profileUpdated: string;
  fullNameTooShort: string;
  quickStatsOrders: string;
  quickStatsActive: string;
  quickStatsSpent: string;
  recentOrdersTitle: string;
  ordersTitle: string;
  ordersDesc: string;
  ordersEmpty: string;
  ordersLoading: string;
  ordersError: string;
  orderCode: string;
  orderDate: string;
  orderTotal: string;
  viewAllOrders: string;
  securityTitle: string;
  securityDesc: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  newPasswordHint: string;
  changePassword: string;
  changingPassword: string;
  passwordMismatch: string;
  passwordChanged: string;
  logoutAll: string;
  loggingOutAll: string;
  logoutAllDone: string;
  logoutAllFailed: string;
  preferencesTitle: string;
  preferencesDesc: string;
  language: string;
  signOut: string;
  signedOut: string;
}

const ACCOUNT_TRANSLATIONS: Record<SupportedLanguage, AccountTranslation> = {
  vi: {
    kicker: 'Echora',
    pageTitle: 'Tài khoản của tôi',
    pageSubtitle: 'Quản lý hồ sơ, đơn hàng, bảo mật và tùy chọn hiển thị của bạn.',
    loading: 'Đang tải thông tin tài khoản…',
    menuLabel: 'Tài khoản của tôi',
    navProfile: 'Hồ sơ',
    navOrders: 'Đơn hàng',
    navSecurity: 'Bảo mật',
    navPreferences: 'Tùy chọn',
    navPremium: 'Premium',
    planLabel: 'Gói tài khoản',
    planFree: 'Miễn phí',
    planPremium: 'Premium',
    profileInfoTitle: 'Thông tin cá nhân',
    profileStatusTitle: 'Trạng thái tài khoản',
    securitySessionsTitle: 'Phiên đăng nhập',
    logoutAllNote:
      'Đăng xuất khỏi mọi thiết bị sẽ kết thúc tất cả phiên đang hoạt động. Bạn sẽ cần đăng nhập lại.',
    premiumTitle: 'Premium',
    premiumDesc: 'Quản lý quyền lợi Premium và thời hạn sử dụng của tài khoản.',
    premiumActive: 'Premium đang hoạt động',
    premiumInactive: 'Chưa kích hoạt Premium',
    premiumActiveNote:
      'Bạn đang có quyền truy cập toàn bộ thuyết minh tiếng Anh, Nhật và Hàn trên mọi điểm đến.',
    premiumFreeNote:
      'Nâng cấp để mở khóa thuyết minh tiếng Anh, Nhật và Hàn cho toàn bộ hành trình.',
    premiumStatusLabel: 'Trạng thái',
    premiumStatusActive: 'Đang hoạt động',
    premiumStatusInactive: 'Chưa kích hoạt',
    premiumExpires: 'Có hiệu lực đến',
    premiumNoExpiry: 'Không thời hạn',
    premiumBenefitsTitle: 'Quyền lợi của bạn',
    premiumLanguagesTitle: '3 ngôn ngữ quốc tế',
    premiumLanguagesDesc: 'Nghe thuyết minh tiếng Anh, Nhật và Hàn với đúng giọng đọc.',
    premiumAudioTitle: 'Toàn bộ nội dung ngoại ngữ',
    premiumAudioDesc: 'Mở khóa mọi bản thuyết minh ngoại ngữ của các điểm đến.',
    premiumQrTitle: 'Quét QR cho khách quốc tế',
    premiumQrDesc: 'Khách quét mã tại điểm đến và nghe ngay bằng ngôn ngữ đã chọn.',
    premiumUnlocked: 'Đã mở khóa',
    premiumLocked: 'Cần Premium',
    premiumUpgrade: 'Nâng cấp Premium',
    premiumRenew: 'Gia hạn Premium',
    premiumFreeLanguages: 'Tiếng Việt luôn miễn phí cho mọi tài khoản.',
    profileTitle: 'Hồ sơ cá nhân',
    profileDesc: 'Thông tin tài khoản dùng để nhận diện bạn trên Echora.',
    fullName: 'Họ và tên',
    email: 'Email',
    role: 'Vai trò',
    roleAdmin: 'Quản trị viên',
    roleUser: 'Người dùng',
    memberSince: 'Thành viên từ',
    emailStatus: 'Trạng thái email',
    verified: 'Đã xác thực',
    unverified: 'Chưa xác thực',
    resend: 'Gửi lại email xác thực',
    resending: 'Đang gửi…',
    resent: 'Đã gửi lại email xác thực.',
    resendFailed: 'Không thể gửi lại email. Vui lòng thử lại sau.',
    editProfile: 'Chỉnh sửa thông tin',
    profileEmailNote: 'Email là thông tin đăng nhập nên chưa thể đổi tại đây.',
    saveProfile: 'Lưu thay đổi',
    savingProfile: 'Đang lưu…',
    cancel: 'Hủy',
    profileUpdated: 'Đã cập nhật thông tin cá nhân.',
    fullNameTooShort: 'Họ và tên phải có ít nhất 2 ký tự.',
    quickStatsOrders: 'Tổng đơn hàng',
    quickStatsActive: 'Đang xử lý',
    quickStatsSpent: 'Tổng chi tiêu',
    recentOrdersTitle: 'Đơn hàng gần nhất',
    ordersTitle: 'Đơn hàng gần đây',
    ordersDesc: 'Theo dõi tình trạng các đơn hàng bạn đã đặt.',
    ordersEmpty: 'Bạn chưa có đơn hàng nào.',
    ordersLoading: 'Đang tải đơn hàng…',
    ordersError: 'Không thể tải đơn hàng. Vui lòng thử lại sau.',
    orderCode: 'Mã đơn',
    orderDate: 'Ngày đặt',
    orderTotal: 'Tổng tiền',
    viewAllOrders: 'Xem tất cả đơn hàng',
    securityTitle: 'Bảo mật tài khoản',
    securityDesc: 'Đổi mật khẩu định kỳ và đăng xuất khỏi các thiết bị bạn không sử dụng.',
    oldPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu mới',
    newPasswordHint: 'Tối thiểu 8 ký tự',
    changePassword: 'Cập nhật mật khẩu',
    changingPassword: 'Đang cập nhật…',
    passwordMismatch: 'Mật khẩu xác nhận không khớp.',
    passwordChanged: 'Đã cập nhật mật khẩu thành công.',
    logoutAll: 'Đăng xuất khỏi mọi thiết bị',
    loggingOutAll: 'Đang đăng xuất…',
    logoutAllDone: 'Đã đăng xuất khỏi mọi thiết bị.',
    logoutAllFailed: 'Không thể đăng xuất khỏi mọi thiết bị. Vui lòng thử lại sau.',
    preferencesTitle: 'Tùy chọn hiển thị',
    preferencesDesc: 'Chọn ngôn ngữ hiển thị của trang web.',
    language: 'Ngôn ngữ',
    signOut: 'Đăng xuất',
    signedOut: 'Bạn đã đăng xuất.',
  },
  en: {
    kicker: 'Echora',
    pageTitle: 'My account',
    pageSubtitle: 'Manage your profile, orders, security and display preferences.',
    loading: 'Loading your account…',
    menuLabel: 'My account',
    navProfile: 'Profile',
    navOrders: 'Orders',
    navSecurity: 'Security',
    navPreferences: 'Preferences',
    navPremium: 'Premium',
    planLabel: 'Account plan',
    planFree: 'Free',
    planPremium: 'Premium',
    profileInfoTitle: 'Personal information',
    profileStatusTitle: 'Account status',
    securitySessionsTitle: 'Active sessions',
    logoutAllNote:
      'Signing out of all devices ends every active session. You will need to sign in again.',
    premiumTitle: 'Premium',
    premiumDesc: 'Manage your Premium benefits and entitlement period.',
    premiumActive: 'Premium is active',
    premiumInactive: 'Premium is not active',
    premiumActiveNote:
      'You can access every English, Japanese and Korean narration across all stops.',
    premiumFreeNote:
      'Upgrade to unlock English, Japanese and Korean narration across the whole journey.',
    premiumStatusLabel: 'Status',
    premiumStatusActive: 'Active',
    premiumStatusInactive: 'Not active',
    premiumExpires: 'Valid until',
    premiumNoExpiry: 'No expiry',
    premiumBenefitsTitle: 'Your benefits',
    premiumLanguagesTitle: '3 international languages',
    premiumLanguagesDesc: 'Hear English, Japanese and Korean narration with matching voices.',
    premiumAudioTitle: 'All foreign-language content',
    premiumAudioDesc: 'Unlock every foreign-language narration script across the stops.',
    premiumQrTitle: 'QR access for international guests',
    premiumQrDesc: 'Guests scan the code at a stop and listen in their chosen language.',
    premiumUnlocked: 'Unlocked',
    premiumLocked: 'Premium required',
    premiumUpgrade: 'Upgrade to Premium',
    premiumRenew: 'Renew Premium',
    premiumFreeLanguages: 'Vietnamese is always free for every account.',
    profileTitle: 'Personal profile',
    profileDesc: 'Account details used to identify you across Echora.',
    fullName: 'Full name',
    email: 'Email',
    role: 'Role',
    roleAdmin: 'Administrator',
    roleUser: 'User',
    memberSince: 'Member since',
    emailStatus: 'Email status',
    verified: 'Verified',
    unverified: 'Not verified',
    resend: 'Resend verification email',
    resending: 'Sending…',
    resent: 'Verification email sent again.',
    resendFailed: 'Could not resend the email. Please try again later.',
    editProfile: 'Edit information',
    profileEmailNote: 'Email is your sign-in identifier, so it cannot be changed here.',
    saveProfile: 'Save changes',
    savingProfile: 'Saving…',
    cancel: 'Cancel',
    profileUpdated: 'Your profile has been updated.',
    fullNameTooShort: 'Full name must be at least 2 characters.',
    quickStatsOrders: 'Total orders',
    quickStatsActive: 'In progress',
    quickStatsSpent: 'Total spent',
    recentOrdersTitle: 'Latest orders',
    ordersTitle: 'Recent orders',
    ordersDesc: 'Track the status of the orders you have placed.',
    ordersEmpty: 'You have no orders yet.',
    ordersLoading: 'Loading orders…',
    ordersError: 'Could not load your orders. Please try again later.',
    orderCode: 'Order code',
    orderDate: 'Placed on',
    orderTotal: 'Total',
    viewAllOrders: 'View all orders',
    securityTitle: 'Account security',
    securityDesc: 'Change your password regularly and sign out of devices you no longer use.',
    oldPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    newPasswordHint: 'At least 8 characters',
    changePassword: 'Update password',
    changingPassword: 'Updating…',
    passwordMismatch: 'The confirmation password does not match.',
    passwordChanged: 'Your password has been updated.',
    logoutAll: 'Sign out of all devices',
    loggingOutAll: 'Signing out…',
    logoutAllDone: 'You have been signed out of all devices.',
    logoutAllFailed: 'Could not sign out of all devices. Please try again later.',
    preferencesTitle: 'Display preferences',
    preferencesDesc: 'Choose the display language of the website.',
    language: 'Language',
    signOut: 'Sign out',
    signedOut: 'You have signed out.',
  },
  ja: {
    kicker: 'Echora',
    pageTitle: 'マイアカウント',
    pageSubtitle: 'プロフィール、注文、セキュリティ、表示設定を管理します。',
    loading: 'アカウント情報を読み込んでいます…',
    menuLabel: 'マイアカウント',
    navProfile: 'プロフィール',
    navOrders: '注文',
    navSecurity: 'セキュリティ',
    navPreferences: '表示設定',
    navPremium: 'Premium',
    planLabel: 'アカウントプラン',
    planFree: '無料',
    planPremium: 'Premium',
    profileInfoTitle: '個人情報',
    profileStatusTitle: 'アカウントの状態',
    securitySessionsTitle: 'ログインセッション',
    logoutAllNote:
      'すべての端末からログアウトすると、現在のセッションがすべて終了します。再度ログインが必要です。',
    premiumTitle: 'Premium',
    premiumDesc: 'Premium の特典と有効期間を管理します。',
    premiumActive: 'Premium 利用中',
    premiumInactive: 'Premium 未登録',
    premiumActiveNote:
      'すべてのスポットで英語、日本語、韓国語の音声ガイドを利用できます。',
    premiumFreeNote:
      'アップグレードすると、旅のすべてのスポットで英語、日本語、韓国語の音声ガイドを利用できます。',
    premiumStatusLabel: '状態',
    premiumStatusActive: '利用中',
    premiumStatusInactive: '未登録',
    premiumExpires: '有効期限',
    premiumNoExpiry: '期限なし',
    premiumBenefitsTitle: '利用できる特典',
    premiumLanguagesTitle: '3つの国際言語',
    premiumLanguagesDesc: '英語、日本語、韓国語の音声ガイドを各言語の声で聞けます。',
    premiumAudioTitle: 'すべての外国語コンテンツ',
    premiumAudioDesc: '各スポットの外国語音声ガイドをすべて利用できます。',
    premiumQrTitle: '海外からのお客様向け QR',
    premiumQrDesc: 'スポットで QR を読み取り、選んだ言語ですぐに聞けます。',
    premiumUnlocked: '利用可能',
    premiumLocked: 'Premium が必要',
    premiumUpgrade: 'Premium にアップグレード',
    premiumRenew: 'Premium を更新',
    premiumFreeLanguages: 'ベトナム語はすべてのアカウントで無料です。',
    profileTitle: 'プロフィール',
    profileDesc: 'Echora でお客様を識別するためのアカウント情報です。',
    fullName: '氏名',
    email: 'メールアドレス',
    role: '権限',
    roleAdmin: '管理者',
    roleUser: 'ユーザー',
    memberSince: '登録日',
    emailStatus: 'メール認証',
    verified: '認証済み',
    unverified: '未認証',
    resend: '認証メールを再送する',
    resending: '送信中…',
    resent: '認証メールを再送しました。',
    resendFailed: 'メールを再送できませんでした。しばらくしてからお試しください。',
    editProfile: '情報を編集',
    profileEmailNote: 'メールアドレスはログイン情報のため、ここでは変更できません。',
    saveProfile: '変更を保存',
    savingProfile: '保存中…',
    cancel: 'キャンセル',
    profileUpdated: 'プロフィールを更新しました。',
    fullNameTooShort: '氏名は2文字以上で入力してください。',
    quickStatsOrders: '注文数',
    quickStatsActive: '処理中',
    quickStatsSpent: '合計支出',
    recentOrdersTitle: '最新の注文',
    ordersTitle: '最近の注文',
    ordersDesc: 'これまでにご注文いただいた内容の状況を確認できます。',
    ordersEmpty: 'まだ注文はありません。',
    ordersLoading: '注文を読み込んでいます…',
    ordersError: '注文を読み込めませんでした。しばらくしてからお試しください。',
    orderCode: '注文番号',
    orderDate: '注文日',
    orderTotal: '合計',
    viewAllOrders: 'すべての注文を見る',
    securityTitle: 'アカウントのセキュリティ',
    securityDesc: '定期的にパスワードを変更し、使わなくなった端末からはログアウトしてください。',
    oldPassword: '現在のパスワード',
    newPassword: '新しいパスワード',
    confirmPassword: '新しいパスワード（確認）',
    newPasswordHint: '8文字以上',
    changePassword: 'パスワードを更新',
    changingPassword: '更新中…',
    passwordMismatch: '確認用パスワードが一致しません。',
    passwordChanged: 'パスワードを更新しました。',
    logoutAll: 'すべての端末からログアウト',
    loggingOutAll: 'ログアウトしています…',
    logoutAllDone: 'すべての端末からログアウトしました。',
    logoutAllFailed: 'すべての端末からログアウトできませんでした。しばらくしてからお試しください。',
    preferencesTitle: '表示設定',
    preferencesDesc: 'ウェブサイトの表示言語を選択してください。',
    language: '言語',
    signOut: 'ログアウト',
    signedOut: 'ログアウトしました。',
  },
  ko: {
    kicker: 'Echora',
    pageTitle: '내 계정',
    pageSubtitle: '프로필, 주문, 보안 및 표시 설정을 관리하세요.',
    loading: '계정 정보를 불러오는 중…',
    menuLabel: '내 계정',
    navProfile: '프로필',
    navOrders: '주문',
    navSecurity: '보안',
    navPreferences: '환경설정',
    navPremium: 'Premium',
    planLabel: '계정 요금제',
    planFree: '무료',
    planPremium: 'Premium',
    profileInfoTitle: '개인 정보',
    profileStatusTitle: '계정 상태',
    securitySessionsTitle: '로그인 세션',
    logoutAllNote:
      '모든 기기에서 로그아웃하면 현재 활성화된 모든 세션이 종료됩니다. 다시 로그인해야 합니다.',
    premiumTitle: 'Premium',
    premiumDesc: 'Premium 혜택과 이용 기간을 관리하세요.',
    premiumActive: 'Premium 사용 중',
    premiumInactive: 'Premium 미활성화',
    premiumActiveNote:
      '모든 명소에서 영어, 일본어, 한국어 해설을 이용할 수 있습니다.',
    premiumFreeNote:
      '업그레이드하면 여행의 모든 명소에서 영어, 일본어, 한국어 해설을 이용할 수 있습니다.',
    premiumStatusLabel: '상태',
    premiumStatusActive: '사용 중',
    premiumStatusInactive: '미활성화',
    premiumExpires: '유효 기간',
    premiumNoExpiry: '기간 제한 없음',
    premiumBenefitsTitle: '이용 가능한 혜택',
    premiumLanguagesTitle: '3개 국제 언어',
    premiumLanguagesDesc: '영어, 일본어, 한국어 해설을 각 언어에 맞는 음성으로 들을 수 있습니다.',
    premiumAudioTitle: '모든 외국어 콘텐츠',
    premiumAudioDesc: '모든 명소의 외국어 해설을 이용할 수 있습니다.',
    premiumQrTitle: '외국인 방문객을 위한 QR',
    premiumQrDesc: '명소에서 QR을 스캔하고 선택한 언어로 바로 들을 수 있습니다.',
    premiumUnlocked: '이용 가능',
    premiumLocked: 'Premium 필요',
    premiumUpgrade: 'Premium으로 업그레이드',
    premiumRenew: 'Premium 갱신',
    premiumFreeLanguages: '베트남어는 모든 계정에서 무료입니다.',
    profileTitle: '개인 프로필',
    profileDesc: 'Echora에서 회원님을 식별하는 데 사용되는 계정 정보입니다.',
    fullName: '이름',
    email: '이메일',
    role: '권한',
    roleAdmin: '관리자',
    roleUser: '사용자',
    memberSince: '가입일',
    emailStatus: '이메일 상태',
    verified: '인증됨',
    unverified: '미인증',
    resend: '인증 이메일 다시 보내기',
    resending: '전송 중…',
    resent: '인증 이메일을 다시 보냈습니다.',
    resendFailed: '이메일을 다시 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.',
    editProfile: '정보 수정',
    profileEmailNote: '이메일은 로그인 정보이므로 여기에서 변경할 수 없습니다.',
    saveProfile: '변경 사항 저장',
    savingProfile: '저장 중…',
    cancel: '취소',
    profileUpdated: '프로필이 업데이트되었습니다.',
    fullNameTooShort: '이름은 2자 이상이어야 합니다.',
    quickStatsOrders: '전체 주문',
    quickStatsActive: '처리 중',
    quickStatsSpent: '총 결제액',
    recentOrdersTitle: '최근 주문',
    ordersTitle: '최근 주문',
    ordersDesc: '주문한 내역의 상태를 확인하세요.',
    ordersEmpty: '아직 주문이 없습니다.',
    ordersLoading: '주문을 불러오는 중…',
    ordersError: '주문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    orderCode: '주문 번호',
    orderDate: '주문일',
    orderTotal: '합계',
    viewAllOrders: '모든 주문 보기',
    securityTitle: '계정 보안',
    securityDesc: '비밀번호를 주기적으로 변경하고 더 이상 사용하지 않는 기기에서 로그아웃하세요.',
    oldPassword: '현재 비밀번호',
    newPassword: '새 비밀번호',
    confirmPassword: '새 비밀번호 확인',
    newPasswordHint: '최소 8자 이상',
    changePassword: '비밀번호 변경',
    changingPassword: '변경 중…',
    passwordMismatch: '확인용 비밀번호가 일치하지 않습니다.',
    passwordChanged: '비밀번호가 변경되었습니다.',
    logoutAll: '모든 기기에서 로그아웃',
    loggingOutAll: '로그아웃 중…',
    logoutAllDone: '모든 기기에서 로그아웃되었습니다.',
    logoutAllFailed: '모든 기기에서 로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    preferencesTitle: '표시 설정',
    preferencesDesc: '웹사이트 표시 언어를 선택하세요.',
    language: '언어',
    signOut: '로그아웃',
    signedOut: '로그아웃되었습니다.',
  },
};

const LOCALES: Record<SupportedLanguage, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

export function accountLocale(lang: SupportedLanguage): string {
  return LOCALES[lang] ?? 'vi-VN';
}

export function useAccountI18n(): { lang: SupportedLanguage; t: AccountTranslation } {
  const { lang } = useNavbarLanguage();
  return { lang, t: ACCOUNT_TRANSLATIONS[lang] ?? ACCOUNT_TRANSLATIONS.vi };
}
