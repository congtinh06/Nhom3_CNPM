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
    kicker: 'SaigonVoice',
    pageTitle: 'Tài khoản của tôi',
    pageSubtitle: 'Quản lý hồ sơ, đơn hàng, bảo mật và tùy chọn hiển thị của bạn.',
    loading: 'Đang tải thông tin tài khoản…',
    menuLabel: 'Tài khoản của tôi',
    navProfile: 'Hồ sơ',
    navOrders: 'Đơn hàng',
    navSecurity: 'Bảo mật',
    navPreferences: 'Tùy chọn',
    profileTitle: 'Hồ sơ cá nhân',
    profileDesc: 'Thông tin tài khoản dùng để nhận diện bạn trên SaigonVoice.',
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
    kicker: 'SaigonVoice',
    pageTitle: 'My account',
    pageSubtitle: 'Manage your profile, orders, security and display preferences.',
    loading: 'Loading your account…',
    menuLabel: 'My account',
    navProfile: 'Profile',
    navOrders: 'Orders',
    navSecurity: 'Security',
    navPreferences: 'Preferences',
    profileTitle: 'Personal profile',
    profileDesc: 'Account details used to identify you across SaigonVoice.',
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
    kicker: 'SaigonVoice',
    pageTitle: 'マイアカウント',
    pageSubtitle: 'プロフィール、注文、セキュリティ、表示設定を管理します。',
    loading: 'アカウント情報を読み込んでいます…',
    menuLabel: 'マイアカウント',
    navProfile: 'プロフィール',
    navOrders: '注文',
    navSecurity: 'セキュリティ',
    navPreferences: '表示設定',
    profileTitle: 'プロフィール',
    profileDesc: 'SaigonVoice でお客様を識別するためのアカウント情報です。',
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
    kicker: 'SaigonVoice',
    pageTitle: '내 계정',
    pageSubtitle: '프로필, 주문, 보안 및 표시 설정을 관리하세요.',
    loading: '계정 정보를 불러오는 중…',
    menuLabel: '내 계정',
    navProfile: '프로필',
    navOrders: '주문',
    navSecurity: '보안',
    navPreferences: '환경설정',
    profileTitle: '개인 프로필',
    profileDesc: 'SaigonVoice에서 회원님을 식별하는 데 사용되는 계정 정보입니다.',
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
