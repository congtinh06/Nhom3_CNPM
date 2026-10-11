import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '../types';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  short: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: 'JA' },
  { code: 'ko', label: '한국어', short: 'KO' },
];

export interface ExploreItemTranslation {
  title: string;
  desc: string;
}

export interface ShopTranslation {
  foodTitle: string;
  foodSubtitle: string;
  drinksTitle: string;
  drinksSubtitle: string;
  searchPlaceholder: string;
  searchBtn: string;
  all: string;
  addToCart: string;
  addedToCart: string;
  outOfStock: string;
  loading: string;
  loadMore: string;
  showingCount: string;
  noProducts: string;
  retry: string;
  errorLoad: string;
  detail: string;
  quantity: string;
  relatedItems: string;
  backToList: string;
  cartTitle: string;
  cartEmpty: string;
  total: string;
  checkout: string;
  clearCart: string;
  continueShopping: string;
  checkoutTitle: string;
  deliveryInfo: string;
  fullName: string;
  phone: string;
  address: string;
  note: string;
  notePlaceholder: string;
  paymentMethod: string;
  cod: string;
  codDesc: string;
  mockGateway: string;
  mockGatewayDesc: string;
  placeOrder: string;
  submitting: string;
  orderHistory: string;
  orderCode: string;
  orderDate: string;
  orderStatus: string;
  cancelOrder: string;
  cancelSuccess: string;
  cancelConfirm: string;
  reorder: string;
  statusPending: string;
  statusPaid: string;
  statusProcessing: string;
  statusCompleted: string;
  statusCancelled: string;
  paymentResultTitle: string;
  paymentSuccess: string;
  paymentFailed: string;
  viewOrder: string;
}

export interface NavTranslation {
  home: string;
  food: string;
  attractions: string;
  guide: string;
  explore: string;
  narration: string;
  about: string;
  contact: string;
  exploreItems: {
    culture: ExploreItemTranslation;
    food: ExploreItemTranslation;
    drinks: ExploreItemTranslation;
    places: ExploreItemTranslation;
  };
  auth: {
    login: string;
    register: string;
    myOrders: string;
    account: string;
    logout: string;
    guest: string;
    loginTitle: string;
    registerTitle: string;
    forgotPasswordTitle: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    fullNameLabel: string;
    rememberMe: string;
    forgotPasswordLink: string;
    loginSubmit: string;
    loginSubmitting: string;
    registerSubmit: string;
    registerSubmitting: string;
    forgotSubmit: string;
    forgotSubmitting: string;
    noAccount: string;
    createAccount: string;
    hasAccount: string;
    backToLogin: string;
    rememberPassword: string;
    close: string;
    loginSuccess: string;
    checkEmailTitle: string;
    checkEmailNotice: string;
    resendVerification: string;
    resending: string;
    resent: string;
    showPassword: string;
    hidePassword: string;
    forgotNote: string;
  };
  cart: string;
  openMenu: string;
  closeMenu: string;
  shop: ShopTranslation;
}

export const NAV_TRANSLATIONS: Record<SupportedLanguage, NavTranslation> = {
  vi: {
    home: 'Trang chủ',
    food: 'Ẩm thực',
    attractions: 'Điểm du lịch',
    guide: 'Hướng dẫn',
    explore: 'Khám phá',
    narration: 'Thuyết minh',
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    exploreItems: {
      culture: {
        title: 'Văn hóa',
        desc: 'Nét sống và nghệ thuật truyền thống',
      },
      food: {
        title: 'Ẩm thực & Thức uống',
        desc: 'Hương vị đường phố đặc trưng Sài Gòn',
      },
      drinks: {
        title: 'Thức uống',
        desc: 'Cà phê vợt và các món trà giải nhiệt',
      },
      places: {
        title: 'Điểm du lịch',
        desc: 'Di tích lịch sử và kiến trúc tiêu biểu',
      },
    },
    auth: {
      login: 'Đăng nhập',
      register: 'Đăng ký',
      myOrders: 'Đơn hàng của tôi',
      account: 'Tài khoản',
      logout: 'Đăng xuất',
      guest: 'Tài khoản',
      loginTitle: 'Đăng nhập',
      registerTitle: 'Tạo tài khoản',
      forgotPasswordTitle: 'Quên mật khẩu',
      emailLabel: 'Email',
      passwordLabel: 'Mật khẩu',
      confirmPasswordLabel: 'Nhập lại mật khẩu',
      fullNameLabel: 'Họ và tên',
      rememberMe: 'Duy trì đăng nhập 30 ngày',
      forgotPasswordLink: 'Quên mật khẩu?',
      loginSubmit: 'Đăng nhập',
      loginSubmitting: 'Đang đăng nhập…',
      registerSubmit: 'Đăng ký',
      registerSubmitting: 'Đang tạo tài khoản…',
      forgotSubmit: 'Gửi liên kết đặt lại',
      forgotSubmitting: 'Đang gửi…',
      noAccount: 'Chưa có tài khoản?',
      createAccount: 'Tạo tài khoản',
      hasAccount: 'Đã có tài khoản?',
      backToLogin: 'Đăng nhập',
      rememberPassword: 'Nhớ mật khẩu?',
      close: 'Đóng',
      loginSuccess: 'Đăng nhập thành công',
      checkEmailTitle: 'Kiểm tra email',
      checkEmailNotice: 'Vui lòng kiểm tra email để xác thực tài khoản.',
      resendVerification: 'Gửi lại email',
      resending: 'Đang gửi…',
      resent: 'Đã gửi lại',
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      forgotNote: 'Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.',
    },
    cart: 'Giỏ hàng',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    shop: {
      foodTitle: 'Ẩm thực Sài Gòn',
      foodSubtitle: 'Hương vị đường phố và các món ngon đặc trưng Sài thành',
      drinksTitle: 'Thức uống Sài Gòn',
      drinksSubtitle: 'Cà phê vợt truyền thống và thức uống giải nhiệt dân dã',
      searchPlaceholder: 'Tìm kiếm theo tên món...',
      searchBtn: 'Tìm kiếm',
      all: 'Tất cả',
      addToCart: 'Thêm vào giỏ',
      addedToCart: 'Đã thêm vào giỏ hàng',
      outOfStock: 'Tạm hết hàng',
      loading: 'Đang tải dữ liệu...',
      loadMore: 'Xem thêm món',
      showingCount: 'Đang hiển thị',
      noProducts: 'Không tìm thấy món nào phù hợp.',
      retry: 'Thử lại',
      errorLoad: 'Không thể tải danh sách. Vui lòng kiểm tra lại.',
      detail: 'Chi tiết',
      quantity: 'Số lượng',
      relatedItems: 'Món cùng loại',
      backToList: 'Quay lại danh sách',
      cartTitle: 'Giỏ hàng',
      cartEmpty: 'Giỏ hàng của bạn đang trống.',
      total: 'Tổng cộng',
      checkout: 'Tiến hành thanh toán',
      clearCart: 'Xóa giỏ',
      continueShopping: 'Tiếp tục chọn món',
      checkoutTitle: 'Thanh toán đơn hàng',
      deliveryInfo: 'Thông tin nhận hàng',
      fullName: 'Họ và tên',
      phone: 'Số điện thoại',
      address: 'Địa chỉ nhận hàng',
      note: 'Ghi chú đơn hàng (tùy chọn)',
      notePlaceholder: 'Ví dụ: ít đường, giao giờ hành chính...',
      paymentMethod: 'Phương thức thanh toán',
      cod: 'Thanh toán khi nhận hàng (COD)',
      codDesc: 'Thanh toán tiền mặt trực tiếp khi nhận món',
      mockGateway: 'Chuyển khoản ngân hàng',
      mockGatewayDesc: 'Quét mã QR / Chuyển khoản qua số tài khoản ngân hàng',
      placeOrder: 'Đặt hàng',
      submitting: 'Đang xử lý đơn hàng...',
      orderHistory: 'Đơn hàng của tôi',
      orderCode: 'Mã đơn',
      orderDate: 'Ngày đặt',
      orderStatus: 'Trạng thái',
      cancelOrder: 'Hủy đơn',
      cancelSuccess: 'Đã hủy đơn hàng thành công',
      cancelConfirm: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      reorder: 'Mua lại',
      statusPending: 'Chờ thanh toán',
      statusPaid: 'Đã thanh toán',
      statusProcessing: 'Đang xử lý',
      statusCompleted: 'Hoàn thành',
      statusCancelled: 'Đã hủy',
      paymentResultTitle: 'Kết quả thanh toán',
      paymentSuccess: 'Thanh toán thành công',
      paymentFailed: 'Thanh toán không thành công',
      viewOrder: 'Xem chi tiết đơn hàng',
    },
  },
  en: {
    home: 'Home',
    food: 'Cuisine',
    attractions: 'Attractions',
    guide: 'Guide',
    explore: 'Explore',
    narration: 'Audio Tour',
    about: 'About',
    contact: 'Contact',
    exploreItems: {
      culture: {
        title: 'Culture',
        desc: 'Traditional heritage and performing arts',
      },
      food: {
        title: 'Cuisine',
        desc: 'Signature Saigon street flavors',
      },
      drinks: {
        title: 'Drinks',
        desc: 'Filter coffee and refreshing local teas',
      },
      places: {
        title: 'Attractions',
        desc: 'Historical landmarks and architecture',
      },
    },
    auth: {
      login: 'Sign in',
      register: 'Sign up',
      myOrders: 'My orders',
      account: 'Account',
      logout: 'Log out',
      guest: 'Account',
      loginTitle: 'Sign in',
      registerTitle: 'Create an account',
      forgotPasswordTitle: 'Forgot password',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm password',
      fullNameLabel: 'Full name',
      rememberMe: 'Remember me for 30 days',
      forgotPasswordLink: 'Forgot password?',
      loginSubmit: 'Sign in',
      loginSubmitting: 'Signing in…',
      registerSubmit: 'Create account',
      registerSubmitting: 'Creating account…',
      forgotSubmit: 'Send reset link',
      forgotSubmitting: 'Sending…',
      noAccount: "Don't have an account?",
      createAccount: 'Sign up',
      hasAccount: 'Already have an account?',
      backToLogin: 'Sign in',
      rememberPassword: 'Remember password?',
      close: 'Close',
      loginSuccess: 'Signed in successfully',
      checkEmailTitle: 'Check your email',
      checkEmailNotice: 'Please check your email to verify your account.',
      resendVerification: 'Resend email',
      resending: 'Sending…',
      resent: 'Email resent',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      forgotNote: 'Enter your registered email and we will send you a reset link.',
    },
    cart: 'Cart',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    shop: {
      foodTitle: 'Saigon Cuisine',
      foodSubtitle: 'Street flavors and signature delicacies of Saigon',
      drinksTitle: 'Saigon Drinks',
      drinksSubtitle: 'Traditional filter coffee and refreshing cooling teas',
      searchPlaceholder: 'Search by dish name...',
      searchBtn: 'Search',
      all: 'All',
      addToCart: 'Add to cart',
      addedToCart: 'Added to cart',
      outOfStock: 'Out of stock',
      loading: 'Loading...',
      loadMore: 'Load more items',
      showingCount: 'Showing',
      noProducts: 'No matching items found.',
      retry: 'Retry',
      errorLoad: 'Unable to load items. Please try again.',
      detail: 'Details',
      quantity: 'Quantity',
      relatedItems: 'Related items',
      backToList: 'Back to list',
      cartTitle: 'Shopping Cart',
      cartEmpty: 'Your shopping cart is empty.',
      total: 'Total',
      checkout: 'Proceed to checkout',
      clearCart: 'Clear cart',
      continueShopping: 'Continue browsing',
      checkoutTitle: 'Checkout',
      deliveryInfo: 'Delivery details',
      fullName: 'Full name',
      phone: 'Phone number',
      address: 'Delivery address',
      note: 'Order notes (optional)',
      notePlaceholder: 'E.g., less sugar, deliver during office hours...',
      paymentMethod: 'Payment method',
      cod: 'Cash on delivery (COD)',
      codDesc: 'Pay in cash upon receiving your order',
      mockGateway: 'Mock payment gateway',
      mockGatewayDesc: 'Test card / transfer payment flow safely',
      placeOrder: 'Place order',
      submitting: 'Processing order...',
      orderHistory: 'My Orders',
      orderCode: 'Order code',
      orderDate: 'Date',
      orderStatus: 'Status',
      cancelOrder: 'Cancel order',
      cancelSuccess: 'Order cancelled successfully',
      cancelConfirm: 'Are you sure you want to cancel this order?',
      reorder: 'Reorder',
      statusPending: 'Pending payment',
      statusPaid: 'Paid',
      statusProcessing: 'Processing',
      statusCompleted: 'Completed',
      statusCancelled: 'Cancelled',
      paymentResultTitle: 'Payment Result',
      paymentSuccess: 'Payment successful',
      paymentFailed: 'Payment unsuccessful',
      viewOrder: 'View order details',
    },
  },
  ja: {
    home: 'ホーム',
    food: 'グルメ',
    attractions: '観光名所',
    guide: '案内',
    explore: '探索',
    narration: '音声ガイド',
    about: '紹介',
    contact: 'お問い合わせ',
    exploreItems: {
      culture: {
        title: '文化',
        desc: '伝統の暮らしと芸能',
      },
      food: {
        title: 'グルメ',
        desc: 'サイゴン特有の屋台の味',
      },
      drinks: {
        title: '飲み物',
        desc: 'ネルドリップ珈琲と伝統茶',
      },
      places: {
        title: '観光名所',
        desc: '歴史的建造物と見どころ',
      },
    },
    auth: {
      login: 'ログイン',
      register: '新規登録',
      myOrders: '注文履歴',
      account: 'アカウント',
      logout: 'ログアウト',
      guest: 'アカウント',
      loginTitle: 'ログイン',
      registerTitle: '新規アカウント作成',
      forgotPasswordTitle: 'パスワードをお忘れの方',
      emailLabel: 'メールアドレス',
      passwordLabel: 'パスワード',
      confirmPasswordLabel: 'パスワードの再入力',
      fullNameLabel: '氏名',
      rememberMe: 'ログイン状態を30日間保持',
      forgotPasswordLink: 'パスワードをお忘れですか？',
      loginSubmit: 'ログイン',
      loginSubmitting: 'ログイン中…',
      registerSubmit: 'アカウントを作成',
      registerSubmitting: '作成中…',
      forgotSubmit: '再設定リンクを送信',
      forgotSubmitting: '送信中…',
      noAccount: 'アカウントをお持ちでない方',
      createAccount: '新規登録',
      hasAccount: 'すでにアカウントをお持ちですか？',
      backToLogin: 'ログイン',
      rememberPassword: 'パスワードを覚えていますか？',
      close: '閉じる',
      loginSuccess: 'ログインに成功しました',
      checkEmailTitle: 'メールをご確認ください',
      checkEmailNotice: 'アカウント確認用のメールを送信しました。',
      resendVerification: 'メールを再送',
      resending: '再送中…',
      resent: '再送完了',
      showPassword: 'パスワードを表示',
      hidePassword: 'パスワードを非表示',
      forgotNote: 'ご登録のメールアドレスを入力してください。再設定リンクをお送りします。',
    },
    cart: 'カート',
    openMenu: 'メニューを開く',
    closeMenu: 'メニューを閉じる',
    shop: {
      foodTitle: 'サイゴングルメ',
      foodSubtitle: '街角の屋台料理と伝統の味わい',
      drinksTitle: 'サイゴンの飲み物',
      drinksSubtitle: '伝統のネルドリップ珈琲と爽快なお茶',
      searchPlaceholder: '料理名で検索...',
      searchBtn: '検索',
      all: 'すべて',
      addToCart: 'カートに追加',
      addedToCart: 'カートに追加しました',
      outOfStock: '一時品切れ',
      loading: '読み込み中...',
      loadMore: 'さらに表示',
      showingCount: '表示中',
      noProducts: '該当する品が見つかりませんでした。',
      retry: '再試行',
      errorLoad: '読み込めませんでした。もう一度お試しください。',
      detail: '詳細',
      quantity: '数量',
      relatedItems: 'おすすめの品',
      backToList: '一覧に戻る',
      cartTitle: 'ショッピングカート',
      cartEmpty: 'カートは空です。',
      total: '合計',
      checkout: '注文手続きへ',
      clearCart: 'カートを空にする',
      continueShopping: '商品一覧に戻る',
      checkoutTitle: 'ご注文手続き',
      deliveryInfo: 'お届け先情報',
      fullName: 'お名前',
      phone: '電話番号',
      address: 'お届け先住所',
      note: '注文メモ（任意）',
      notePlaceholder: '例：甘さ控えめ、日中のお届け希望...',
      paymentMethod: 'お支払い方法',
      cod: '代金引換（COD）',
      codDesc: '受取時に現金でお支払い',
      mockGateway: '模擬決済ゲートウェイ',
      mockGatewayDesc: '安全なカード・振込決済テスト',
      placeOrder: '注文を確定する',
      submitting: '注文処理中...',
      orderHistory: '注文履歴',
      orderCode: '注文番号',
      orderDate: '注文日時',
      orderStatus: '状態',
      cancelOrder: '注文を取り消す',
      cancelSuccess: '注文を取り消しました',
      cancelConfirm: 'この注文を取り消してもよろしいですか？',
      reorder: '再注文',
      statusPending: '支払い待ち',
      statusPaid: '支払完了',
      statusProcessing: '準備中',
      statusCompleted: '完了',
      statusCancelled: '取消済',
      paymentResultTitle: '決済結果',
      paymentSuccess: '決済が完了しました',
      paymentFailed: '決済に失敗しました',
      viewOrder: '注文詳細を見る',
    },
  },
  ko: {
    home: '홈',
    food: '음식',
    attractions: '관광 명소',
    guide: '이용 안내',
    explore: '둘러보기',
    narration: '오디오 가이드',
    about: '소개',
    contact: '문의',
    exploreItems: {
      culture: {
        title: '문화',
        desc: '전통 생활 방식과 예술',
      },
      food: {
        title: '음식',
        desc: '사이공의 특색 있는 길거리 미식',
      },
      drinks: {
        title: '음료',
        desc: '전통 드립 커피와 시원한 차',
      },
      places: {
        title: '관광 명소',
        desc: '유서 깊은 역사 유적과 건축',
      },
    },
    auth: {
      login: '로그인',
      register: '회원가입',
      myOrders: '내 주문',
      account: '계정',
      logout: '로그아웃',
      guest: '계정',
      loginTitle: '로그인',
      registerTitle: '회원가입',
      forgotPasswordTitle: '비밀번호 찾기',
      emailLabel: '이메일',
      passwordLabel: '비밀번호',
      confirmPasswordLabel: '비밀번호 확인',
      fullNameLabel: '이름',
      rememberMe: '로그인 상태 30일 유지',
      forgotPasswordLink: '비밀번호를 잊으셨나요?',
      loginSubmit: '로그인',
      loginSubmitting: '로그인 중…',
      registerSubmit: '회원가입',
      registerSubmitting: '가입 중…',
      forgotSubmit: '재설정 링크 전송',
      forgotSubmitting: '전송 중…',
      noAccount: '계정이 없으신가요?',
      createAccount: '회원가입',
      hasAccount: '이미 계정이 있으신가요?',
      backToLogin: '로그인',
      rememberPassword: '비밀번호가 기억나셨나요?',
      close: '닫기',
      loginSuccess: '로그인되었습니다',
      checkEmailTitle: '이메일을 확인하세요',
      checkEmailNotice: '계정 인증을 위한 이메일을 확인해 주세요.',
      resendVerification: '이메일 재전송',
      resending: '전송 중…',
      resent: '재전송 완료',
      showPassword: '비밀번호 표시',
      hidePassword: '비밀번호 숨기기',
      forgotNote: '가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.',
    },
    cart: '장바구니',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    shop: {
      foodTitle: '사이공 미식',
      foodSubtitle: '거리의 풍미와 사이공 대표 맛집 요리',
      drinksTitle: '사이공 음료',
      drinksSubtitle: '전통 드립 커피와 시원한 전통차',
      searchPlaceholder: '메뉴 이름으로 검색...',
      searchBtn: '검색',
      all: '전체',
      addToCart: '장바구니 담기',
      addedToCart: '장바구니에 담았습니다',
      outOfStock: '일시 품절',
      loading: '불러오는 중...',
      loadMore: '더 보기',
      showingCount: '표시 중',
      noProducts: '해당하는 메뉴가 없습니다.',
      retry: '다시 시도',
      errorLoad: '데이터를 불러오지 못했습니다. 다시 시도해 주세요.',
      detail: '상세보기',
      quantity: '수량',
      relatedItems: '추천 메뉴',
      backToList: '목록으로',
      cartTitle: '장바구니',
      cartEmpty: '장바구니가 비어 있습니다.',
      total: '총 금액',
      checkout: '주문하기',
      clearCart: '장바구니 비우기',
      continueShopping: '쇼핑 계속하기',
      checkoutTitle: '주문서 작성',
      deliveryInfo: '배송 정보',
      fullName: '받는 분',
      phone: '연락처',
      address: '배송 주소',
      note: '요청 사항 (선택)',
      notePlaceholder: '예: 덜 달게, 배송 전 연락 바랍니다...',
      paymentMethod: '결제 수단',
      cod: '착불 현금 결제 (COD)',
      codDesc: '상품 수령 시 현금 직접 결제',
      mockGateway: '모의 결제 게이트웨이',
      mockGatewayDesc: '안전한 카드/계좌이체 결제 테스트',
      placeOrder: '주문 완료',
      submitting: '주문 처리 중...',
      orderHistory: '내 주문 내역',
      orderCode: '주문 번호',
      orderDate: '주문 일시',
      orderStatus: '상태',
      cancelOrder: '주문 취소',
      cancelSuccess: '주문이 취소되었습니다',
      cancelConfirm: '정말 주문을 취소하시겠습니까?',
      reorder: '다시 담기',
      statusPending: '결제 대기',
      statusPaid: '결제 완료',
      statusProcessing: '준비 중',
      statusCompleted: '완료',
      statusCancelled: '취소됨',
      paymentResultTitle: '결제 결과',
      paymentSuccess: '결제가 성공했습니다',
      paymentFailed: '결제에 실패했습니다',
      viewOrder: '주문 상세 보기',
    },
  },
};

const LANG_STORAGE_KEY = 'sv:lang';
const LANG_CHANGE_EVENT = 'sv:lang-change';

export function getStoredLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'zh') {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, 'vi');
      } catch {
        // Ignore storage write error
      }
      return 'vi';
    }
    if (saved && (['vi', 'en', 'ja', 'ko'] as string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // Ignore storage read error
  }
  return 'vi';
}

export function setStoredLanguage(lang: SupportedLanguage): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Ignore storage write error
  }
  window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: lang }));
}

export function useNavbarLanguage() {
  const [lang, setLangState] = useState<SupportedLanguage>(getStoredLanguage);

  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail) {
        setLangState(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANG_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'zh') {
          setStoredLanguage('vi');
          setLangState('vi');
        } else if ((['vi', 'en', 'ja', 'ko'] as string[]).includes(e.newValue)) {
          setLangState(e.newValue as SupportedLanguage);
        }
      }
    };

    window.addEventListener(LANG_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const changeLanguage = useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang);
    setStoredLanguage(newLang);
  }, []);

  const currentOption: LanguageOption =
    SUPPORTED_LANGUAGES.find((item) => item.code === lang) ?? {
      code: 'vi',
      label: 'Tiếng Việt',
      short: 'VI',
    };
  const t = NAV_TRANSLATIONS[lang] || NAV_TRANSLATIONS.vi;

  return {
    lang,
    currentOption,
    t,
    changeLanguage,
  };
}
