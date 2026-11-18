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

export interface CheckoutTranslation {
  contactSection: string;
  addressSection: string;
  paymentSection: string;
  summarySection: string;
  nameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  provinceLabel: string;
  districtLabel: string;
  wardLabel: string;
  streetLabel: string;
  altAddressLabel: string;
  altAddressPlaceholder: string;
  deliverySection: string;
  deliveryTimeLabel: string;
  deliveryTimeAny: string;
  deliveryTimeMorning: string;
  deliveryTimeAfternoon: string;
  deliveryTimeEvening: string;
  deliveryTimeHint: string;
  otherReceiverToggle: string;
  otherReceiverNameLabel: string;
  otherReceiverPhoneLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  selectProvince: string;
  selectDistrict: string;
  selectWard: string;
  loadingProvinces: string;
  loadingDistricts: string;
  loadingWards: string;
  chooseDistrictFirst: string;
  errNameRequired: string;
  errNameShort: string;
  errPhoneRequired: string;
  errPhoneInvalid: string;
  errEmailInvalid: string;
  errProvinceRequired: string;
  errDistrictRequired: string;
  errWardRequired: string;
  errStreetRequired: string;
  errStreetInvalid: string;
  errOtherNameRequired: string;
  errOtherPhoneRequired: string;
  errOtherPhoneInvalid: string;
  vietQrTitle: string;
  vietQrDesc: string;
  vietQrDemoNotice: string;
  vnpayTitle: string;
  vnpayDesc: string;
  codTitle: string;
  codDesc: string;
  groupFromSpot: string;
  groupOther: string;
  itemCountLabel: string;
  itemCountValue: string;
  subtotalLabel: string;
  shippingFeeLabel: string;
  freeShip: string;
  grandTotalLabel: string;
  termsPrefix: string;
  termsLink: string;
  termsSuffix: string;
  expandSummary: string;
  collapseSummary: string;
  placeOrder: string;
  placingOrder: string;
  reasonSubmitting: string;
  reasonEmptyCart: string;
  reasonRequired: string;
  reasonInvalid: string;
  reasonTerms: string;
  supportLine: string;
  decreaseQty: string;
  increaseQty: string;
  removeItem: string;
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
  productUnavailable: string;
  productUnavailableDesc: string;
  backToSouvenirList: string;
  relatedSouvenirHeading: string;
  checkoutPage: CheckoutTranslation;
}

export interface NavTranslation {
  home: string;
  food: string;
  attractions: string;
  guide: string;
  news: string;
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
    loginTabPassword: string;
    loginTabQr: string;
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
    loginSuccessRedirect: string;
    checkEmailTitle: string;
    checkEmailNotice: string;
    resendVerification: string;
    resending: string;
    resent: string;
    showPassword: string;
    hidePassword: string;
    forgotNote: string;
    qrTitle: string;
    qrSubtitle: string;
    qrSecureNote: string;
    qrWaiting: string;
    qrScanned: string;
    qrApproved: string;
    qrExpired: string;
    qrDenied: string;
    qrRefresh: string;
    qrError: string;
    qrScanTitle: string;
    qrScanIntro: string;
    qrConfirm: string;
    qrCancel: string;
    qrSuccessTitle: string;
    qrSuccessNote: string;
    qrLoginRequired: string;
    qrAccountSwitchHint: string;
    qrManualLabel: string;
    qrManualPlaceholder: string;
    qrManualSubmit: string;
    qrOpenCamera: string;
    qrCameraError: string;
    qrScanAgain: string;
    qrDeviceLabel: string;
    qrBackHome: string;
    qrScanDeviceButton: string;
    qrGuestIntro: string;
    qrGuestSuccessTitle: string;
    qrGuestSuccessNote: string;
    qrGuestPanelWaiting: string;
    qrGuestTransferred: string;
    guestBadgeNote: string;
    guestBannerTitle: string;
    guestBannerNote: string;
    guestContinue: string;
    qrRealAccountHint: string;
    qrAlreadySignedIn: string;
    qrHandoffTitle: string;
    qrHandoffNote: string;
    qrHandoffDone: string;
    qrHandoffReceiveTitle: string;
    qrHandoffReceiveNote: string;
    qrHandoffReceiveAlready: string;
    qrMobileScanHint: string;
    qrLocalhostHint: string;
    qrEmailVerifiedLabel: string;
    qrEmailVerifiedOk: string;
    qrEmailNotVerified: string;
    qrResendVerify: string;
    guestTitle: string;
    exitGuestMode: string;
  };
  cart: string;
  openMenu: string;
  closeMenu: string;
  scanQrDesktop: string;
  scanPoiQr: string;
  scanLoginQr: string;
  shop: ShopTranslation;
}

export const NAV_TRANSLATIONS: Record<SupportedLanguage, NavTranslation> = {
  vi: {
    home: 'Trang chủ',
    food: 'Quà lưu niệm',
    attractions: 'Điểm du lịch',
    guide: 'Hướng dẫn',
    news: 'Tin tức',
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
      guest: 'Khách',
      loginTitle: 'Đăng nhập',
      loginTabPassword: 'Mật khẩu',
      loginTabQr: 'Quét mã QR',
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
      loginSuccessRedirect: 'Đang chuyển hướng…',
      checkEmailTitle: 'Kiểm tra email',
      checkEmailNotice: 'Vui lòng kiểm tra email để xác thực tài khoản.',
      resendVerification: 'Gửi lại email',
      resending: 'Đang gửi…',
      resent: 'Đã gửi lại',
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      forgotNote: 'Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.',
      qrTitle: 'Đăng nhập bằng QR',
      qrSubtitle:
        'Mở web trên điện thoại đã đăng nhập, vào menu và chọn Quét mã đăng nhập.',
      qrSecureNote: 'Chỉ tài khoản đã xác thực mới có thể quét mã.',
      qrWaiting: 'Đang chờ quét mã…',
      qrScanned: 'Đã quét. Xác nhận trên điện thoại của bạn.',
      qrApproved: 'Đã xác nhận. Đang đăng nhập…',
      qrExpired: 'Mã QR đã hết hạn.',
      qrDenied: 'Đăng nhập đã bị từ chối.',
      qrRefresh: 'Tạo mã mới',
      qrError: 'Không thể tạo mã QR. Vui lòng thử lại.',
      qrScanTitle: 'Quét mã QR đăng nhập',
      qrScanIntro: 'Dùng camera để quét mã QR trên màn hình thiết bị khác.',
      qrConfirm: 'Xác nhận đăng nhập',
      qrCancel: 'Từ chối',
      qrSuccessTitle: 'Đã xác nhận đăng nhập',
      qrSuccessNote: 'Quay lại thiết bị kia để tiếp tục. Bạn có thể đóng trang này.',
      qrLoginRequired: 'Bạn cần đăng nhập trên thiết bị này trước khi quét mã.',
      qrAccountSwitchHint:
        'Muốn chuyển phiên bằng tài khoản thật? Hãy đăng nhập trên thiết bị này rồi quét lại.',
      qrManualLabel: 'Hoặc nhập mã QR',
      qrManualPlaceholder: 'Dán mã QR tại đây',
      qrManualSubmit: 'Tiếp tục',
      qrOpenCamera: 'Mở camera',
      qrCameraError: 'Không thể mở camera. Hãy nhập mã thủ công.',
      qrScanAgain: 'Quét lại',
      qrDeviceLabel: 'Thiết bị yêu cầu đăng nhập',
      qrBackHome: 'Về trang chủ',
      qrScanDeviceButton: 'Quét mã bằng camera',
      qrGuestIntro:
        'Bạn chưa có tài khoản. Quét mã để dùng thử Echora với tư cách Khách trên thiết bị kia: nghe thuyết minh tiếng Việt miễn phí.',
      qrGuestSuccessTitle: 'Đã chuyển sang chế độ Khách',
      qrGuestSuccessNote:
        'Thiết bị kia giờ đang ở chế độ Khách: nghe thuyết minh tiếng Việt miễn phí, không cần đăng nhập. Nâng cấp Premium, mua quà lưu niệm và dịch vụ khác cần tài khoản thật.',
      qrGuestPanelWaiting: 'Đang chuyển sang chế độ Khách…',
      qrGuestTransferred: 'Đang dùng thử Echora ở chế độ Khách trên thiết bị này',
      guestBadgeNote: 'Bạn đang dùng thử Echora với tư cách Khách: nghe thuyết minh tiếng Việt miễn phí.',
      guestBannerTitle: 'Bạn đang ở chế độ Khách',
      guestBannerNote:
        'Nghe thuyết minh tiếng Việt miễn phí, không cần đăng nhập. Đăng nhập hoặc tạo tài khoản để mua quà lưu niệm và mở khóa Premium.',
      guestContinue: 'Tiếp tục với tư cách Khách',
      qrRealAccountHint: 'Tài khoản thật của bạn:',
      qrAlreadySignedIn: 'Thiết bị này đã đăng nhập. Không cần tạo mã QR mới.',
      qrHandoffTitle: 'Đăng nhập thiết bị khác bằng QR',
      qrHandoffNote: 'Quét mã này bằng camera điện thoại để đăng nhập cùng tài khoản. Chỉ dùng cho thiết bị của bạn.',
      qrHandoffDone: 'Điện thoại đã đăng nhập cùng tài khoản.',
      qrHandoffReceiveTitle: 'Nhận đăng nhập từ máy tính',
      qrHandoffReceiveNote: 'Mã này sẽ đăng nhập tài khoản đang dùng trên máy tính vào thiết bị này.',
      qrHandoffReceiveAlready: 'Thiết bị này đã đăng nhập. Hãy đăng xuất trước khi nhận tài khoản khác.',
      qrMobileScanHint: 'Mở camera để quét mã QR hiển thị trên máy tính.',
      qrLocalhostHint:
        'Mã QR dùng cùng địa chỉ với trang hiện tại. Điện thoại không mở được localhost, hãy mở trang bằng địa chỉ IP LAN của máy tính.',
      qrEmailVerifiedLabel: 'Xác thực email',
      qrEmailVerifiedOk: 'Đã xác thực',
      qrEmailNotVerified:
        'Tài khoản chưa xác thực email. Hãy xác thực trước khi chuyển sang tài khoản thật.',
      qrResendVerify: 'Gửi lại email xác thực',
      guestTitle: 'Khách tham quan',
      exitGuestMode: 'Thoát chế độ Khách',
    },
    cart: 'Giỏ hàng',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    scanQrDesktop: 'Quét mã QR trên máy tính',
    scanPoiQr: 'Quét mã điểm du lịch',
    scanLoginQr: 'Quét mã đăng nhập',
    shop: {
      foodTitle: 'Ẩm thực Sài Gòn',
      foodSubtitle: 'Hương vị đường phố và các món ngon đặc trưng Sài thành',
      drinksTitle: 'Thức uống Sài Gòn',
      drinksSubtitle: 'Cà phê vợt truyền thống và thức uống giải nhiệt dân dã',
      searchPlaceholder: '',
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
      notePlaceholder: '',
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
      productUnavailable: 'Sản phẩm không khả dụng',
      productUnavailableDesc: 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng bán.',
      backToSouvenirList: 'Quay lại danh sách quà lưu niệm',
      relatedSouvenirHeading: 'Gợi ý sản phẩm cùng danh mục',
      checkoutPage: {
        contactSection: 'Thông tin liên hệ',
        addressSection: 'Địa chỉ giao hàng',
        paymentSection: 'Phương thức thanh toán',
        summarySection: 'Tóm tắt đơn hàng',
        nameLabel: 'Họ và tên',
        phoneLabel: 'Số điện thoại',
        emailLabel: 'Email (để nhận xác nhận đơn hàng)',
        provinceLabel: 'Tỉnh / Thành phố',
        districtLabel: 'Quận / Huyện',
        wardLabel: 'Phường / Xã',
        streetLabel: 'Số nhà, tên đường',
        altAddressLabel: 'Địa chỉ khác (tùy chọn)',
        altAddressPlaceholder: 'Ví dụ: tòa nhà B, căn hộ 1203, tầng 12',
        deliverySection: 'Tùy chọn giao hàng',
        deliveryTimeLabel: 'Khung giờ giao hàng mong muốn',
        deliveryTimeAny: 'Không yêu cầu',
        deliveryTimeMorning: 'Buổi sáng (8:00 - 12:00)',
        deliveryTimeAfternoon: 'Buổi chiều (13:00 - 17:00)',
        deliveryTimeEvening: 'Buổi tối (18:00 - 21:00)',
        deliveryTimeHint: 'Thời gian chỉ mang tính tham khảo, Echora sẽ liên hệ xác nhận với bạn.',
        otherReceiverToggle: 'Giao cho người khác',
        otherReceiverNameLabel: 'Tên người nhận',
        otherReceiverPhoneLabel: 'Số điện thoại người nhận',
        noteLabel: 'Ghi chú giao hàng (tùy chọn)',
        notePlaceholder: 'Ví dụ: gọi trước khi giao, giao giờ hành chính',
        selectProvince: 'Chọn Tỉnh / Thành phố',
        selectDistrict: 'Chọn Quận/Huyện',
        selectWard: 'Chọn Phường/Xã',
        loadingProvinces: 'Đang tải tỉnh thành',
        loadingDistricts: 'Đang tải quận huyện',
        loadingWards: 'Đang tải phường xã',
        chooseDistrictFirst: 'Vui lòng chọn Quận/Huyện trước',
        errNameRequired: 'Vui lòng nhập họ và tên.',
        errNameShort: 'Họ và tên cần ít nhất 2 ký tự.',
        errPhoneRequired: 'Vui lòng nhập số điện thoại.',
        errPhoneInvalid: 'Số điện thoại gồm 10 chữ số và bắt đầu bằng 0.',
        errEmailInvalid: 'Email chưa đúng định dạng, ví dụ ten@gmail.com.',
        errProvinceRequired: 'Vui lòng chọn tỉnh / thành phố.',
        errDistrictRequired: 'Vui lòng chọn quận / huyện.',
        errWardRequired: 'Vui lòng chọn phường / xã.',
        errStreetRequired: 'Vui lòng nhập số nhà và tên đường.',
        errStreetInvalid: 'Số nhà và tên đường cần ít nhất 5 ký tự và có chữ cái, ví dụ 12 Nguyễn Huệ.',
        errOtherNameRequired: 'Vui lòng nhập tên người nhận (ít nhất 2 ký tự).',
        errOtherPhoneRequired: 'Vui lòng nhập số điện thoại người nhận.',
        errOtherPhoneInvalid: 'Số điện thoại người nhận gồm 10 chữ số và bắt đầu bằng 0.',
        vietQrTitle: 'Chuyển khoản VietQR',
        vietQrDesc: 'Quét mã QR để thanh toán sau khi đặt hàng.',
        vietQrDemoNotice: 'Thanh toán thử trong môi trường demo, không phát sinh giao dịch thật.',
        vnpayTitle: 'Cổng thanh toán VNPAY',
        vnpayDesc: 'Chuyển sang cổng VNPAY để thanh toán bằng thẻ ATM, Visa/Mastercard hoặc QR.',
        codTitle: 'Thanh toán khi nhận hàng',
        codDesc: 'Trả tiền mặt khi nhận được sản phẩm.',
        groupFromSpot: 'Từ {spot}',
        groupOther: 'Sản phẩm khác',
        itemCountLabel: 'Số lượng sản phẩm',
        itemCountValue: '{n} sản phẩm',
        subtotalLabel: 'Tạm tính',
        shippingFeeLabel: 'Phí giao hàng',
        freeShip: 'Miễn phí',
        grandTotalLabel: 'Tổng cộng',
        termsPrefix: 'Tôi đồng ý với ',
        termsLink: 'Điều khoản dịch vụ',
        termsSuffix: ' của Echora.',
        expandSummary: 'Mở rộng',
        collapseSummary: 'Thu gọn',
        placeOrder: 'Đặt hàng',
        placingOrder: 'Đang đặt hàng',
        reasonSubmitting: 'Đơn hàng đang được xử lý, vui lòng chờ.',
        reasonEmptyCart: 'Giỏ hàng đang trống, hãy thêm sản phẩm trước khi đặt hàng.',
        reasonRequired: 'Vui lòng điền đủ các ô có dấu * để đặt hàng.',
        reasonInvalid: 'Một số thông tin chưa hợp lệ, vui lòng kiểm tra các ô báo lỗi.',
        reasonTerms: 'Vui lòng đồng ý với Điều khoản dịch vụ để đặt hàng.',
        supportLine: 'Cần hỗ trợ? Gọi {phone} ({hours})',
        decreaseQty: 'Giảm số lượng {name}',
        increaseQty: 'Tăng số lượng {name}',
        removeItem: 'Xóa {name}',
      },
    },
  },
  en: {
    home: 'Home',
    food: 'Souvenirs',
    attractions: 'Attractions',
    guide: 'Guide',
    news: 'News',
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
      guest: 'Guest',
      loginTitle: 'Sign in',
      loginTabPassword: 'Password',
      loginTabQr: 'Scan QR',
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
      loginSuccessRedirect: 'Redirecting…',
      checkEmailTitle: 'Check your email',
      checkEmailNotice: 'Please check your email to verify your account.',
      resendVerification: 'Resend email',
      resending: 'Sending…',
      resent: 'Email resent',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      forgotNote: 'Enter your registered email and we will send you a reset link.',
      qrTitle: 'Sign in with QR',
      qrSubtitle:
        'Open the website on your signed-in phone, open the menu and choose Scan login code.',
      qrSecureNote: 'Only verified accounts can scan the code.',
      qrWaiting: 'Waiting for scan…',
      qrScanned: 'Scanned. Confirm on your phone.',
      qrApproved: 'Confirmed. Signing you in…',
      qrExpired: 'The QR code has expired.',
      qrDenied: 'Sign-in was declined.',
      qrRefresh: 'Create a new code',
      qrError: 'Could not create a QR code. Please try again.',
      qrScanTitle: 'Scan login QR code',
      qrScanIntro: 'Use your camera to scan the QR code on the other device.',
      qrConfirm: 'Confirm sign-in',
      qrCancel: 'Decline',
      qrSuccessTitle: 'Sign-in confirmed',
      qrSuccessNote: 'Return to the other device to continue. You can close this page.',
      qrLoginRequired: 'You need to sign in on this device before scanning.',
      qrAccountSwitchHint:
        'Want to transfer a real account? Sign in on this device, then scan again.',
      qrManualLabel: 'Or enter the QR code',
      qrManualPlaceholder: 'Paste the QR code here',
      qrManualSubmit: 'Continue',
      qrOpenCamera: 'Open camera',
      qrCameraError: 'Could not open the camera. Please enter the code manually.',
      qrScanAgain: 'Scan again',
      qrDeviceLabel: 'Device requesting sign-in',
      qrBackHome: 'Back to home',
      qrScanDeviceButton: 'Scan code with camera',
      qrGuestIntro:
        "You don't have an account yet. Scan the code to try Echora as a Guest on the other device: free Vietnamese narration.",
      qrGuestSuccessTitle: 'Switched to Guest mode',
      qrGuestSuccessNote:
        'The other device is now in Guest mode: free narration in Vietnamese, no sign-in needed. Premium upgrades, souvenirs and other services require a real account.',
      qrGuestPanelWaiting: 'Switching to Guest mode…',
      qrGuestTransferred: 'Now browsing Echora as a Guest on this device',
      guestBadgeNote:
        'You are trying Echora as a Guest: free Vietnamese narration, no account needed.',
      guestBannerTitle: 'You are in Guest mode',
      guestBannerNote:
        'Free Vietnamese narration without signing in. Sign in or create an account to buy souvenirs and unlock Premium.',
      guestContinue: 'Continue as Guest',
      qrRealAccountHint: 'Your real account:',
      qrAlreadySignedIn: 'This device is already signed in. No new QR code is needed.',
      qrHandoffTitle: 'Sign in on another device with QR',
      qrHandoffNote: 'Scan this code with your phone camera to sign in with the same account. Use it only on your own devices.',
      qrHandoffDone: 'Your phone is now signed in with the same account.',
      qrHandoffReceiveTitle: 'Receive sign-in from computer',
      qrHandoffReceiveNote: 'This code signs this device in to the account currently used on the computer.',
      qrHandoffReceiveAlready: 'This device is already signed in. Sign out before receiving another account.',
      qrMobileScanHint: 'Open the camera to scan the QR code shown on your computer.',
      qrLocalhostHint:
        'The QR code uses the same address as this page. Phones cannot open localhost, so open the site using your computer’s LAN IP instead.',
      qrEmailVerifiedLabel: 'Email verification',
      qrEmailVerifiedOk: 'Verified',
      qrEmailNotVerified:
        'The account has not verified its email yet. Verify it before transferring the real account.',
      qrResendVerify: 'Resend verification email',
      guestTitle: 'Guest visitor',
      exitGuestMode: 'Exit guest mode',
    },
    cart: 'Cart',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    scanQrDesktop: 'QR Code Login',
    scanPoiQr: 'Scan place QR',
    scanLoginQr: 'Scan login QR',
    shop: {
      foodTitle: 'Saigon Cuisine',
      foodSubtitle: 'Street flavors and signature delicacies of Saigon',
      drinksTitle: 'Saigon Drinks',
      drinksSubtitle: 'Traditional filter coffee and refreshing cooling teas',
      searchPlaceholder: '',
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
      notePlaceholder: '',
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
      productUnavailable: 'Product unavailable',
      productUnavailableDesc: 'The product you are looking for does not exist or is no longer for sale.',
      backToSouvenirList: 'Back to souvenir list',
      relatedSouvenirHeading: 'Related products in the same category',
      checkoutPage: {
        contactSection: 'Contact details',
        addressSection: 'Delivery address',
        paymentSection: 'Payment method',
        summarySection: 'Order summary',
        nameLabel: 'Full name',
        phoneLabel: 'Phone number',
        emailLabel: 'Email (to receive order confirmation)',
        provinceLabel: 'Province / City',
        districtLabel: 'District',
        wardLabel: 'Ward',
        streetLabel: 'Street address',
        altAddressLabel: 'Additional address (optional)',
        altAddressPlaceholder: 'Example: building B, apartment 1203, floor 12',
        deliverySection: 'Delivery options',
        deliveryTimeLabel: 'Preferred delivery time',
        deliveryTimeAny: 'No preference',
        deliveryTimeMorning: 'Morning (8:00 - 12:00)',
        deliveryTimeAfternoon: 'Afternoon (13:00 - 17:00)',
        deliveryTimeEvening: 'Evening (18:00 - 21:00)',
        deliveryTimeHint: 'The time is only a reference, Echora will contact you to confirm.',
        otherReceiverToggle: 'Deliver to someone else',
        otherReceiverNameLabel: 'Recipient name',
        otherReceiverPhoneLabel: 'Recipient phone number',
        noteLabel: 'Delivery notes (optional)',
        notePlaceholder: 'Example: call before delivery, deliver during office hours',
        selectProvince: 'Select province / city',
        selectDistrict: 'Select district',
        selectWard: 'Select ward',
        loadingProvinces: 'Loading provinces',
        loadingDistricts: 'Loading districts',
        loadingWards: 'Loading wards',
        chooseDistrictFirst: 'Please select a district first',
        errNameRequired: 'Please enter your full name.',
        errNameShort: 'Full name must be at least 2 characters.',
        errPhoneRequired: 'Please enter your phone number.',
        errPhoneInvalid: 'Phone number must be 10 digits and start with 0.',
        errEmailInvalid: 'Email format is invalid, for example ten@gmail.com.',
        errProvinceRequired: 'Please select a province / city.',
        errDistrictRequired: 'Please select a district.',
        errWardRequired: 'Please select a ward.',
        errStreetRequired: 'Please enter your street address.',
        errStreetInvalid: 'Street address must be at least 5 characters and contain a letter, for example 12 Nguyen Hue.',
        errOtherNameRequired: 'Please enter the recipient name (at least 2 characters).',
        errOtherPhoneRequired: 'Please enter the recipient phone number.',
        errOtherPhoneInvalid: 'Recipient phone number must be 10 digits and start with 0.',
        vietQrTitle: 'VietQR transfer',
        vietQrDesc: 'Scan the QR code to pay after placing your order.',
        vietQrDemoNotice: 'Test payment in a demo environment, no real transaction is made.',
        vnpayTitle: 'VNPAY payment gateway',
        vnpayDesc: 'Continue to VNPAY to pay by ATM card, Visa/Mastercard or QR.',
        codTitle: 'Cash on delivery',
        codDesc: 'Pay in cash when you receive the products.',
        groupFromSpot: 'From {spot}',
        groupOther: 'Other products',
        itemCountLabel: 'Number of products',
        itemCountValue: '{n} products',
        subtotalLabel: 'Subtotal',
        shippingFeeLabel: 'Shipping fee',
        freeShip: 'Free',
        grandTotalLabel: 'Total',
        termsPrefix: 'I agree to the ',
        termsLink: 'Echora Terms of Service',
        termsSuffix: '.',
        expandSummary: 'Expand',
        collapseSummary: 'Collapse',
        placeOrder: 'Place order',
        placingOrder: 'Placing order',
        reasonSubmitting: 'Your order is being processed, please wait.',
        reasonEmptyCart: 'Your cart is empty, please add products before placing an order.',
        reasonRequired: 'Please fill in all fields marked with * to place your order.',
        reasonInvalid: 'Some information is invalid, please check the highlighted fields.',
        reasonTerms: 'Please agree to the Terms of Service to place your order.',
        supportLine: 'Need help? Call {phone} ({hours})',
        decreaseQty: 'Decrease quantity of {name}',
        increaseQty: 'Increase quantity of {name}',
        removeItem: 'Remove {name}',
      },
    },
  },
  ja: {
    home: 'ホーム',
    food: 'お土産',
    attractions: '観光名所',
    guide: '案内',
    news: 'ニュース',
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
      guest: 'ゲスト',
      loginTitle: 'ログイン',
      loginTabPassword: 'パスワード',
      loginTabQr: 'QR スキャン',
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
      loginSuccessRedirect: 'リダイレクトしています…',
      checkEmailTitle: 'メールをご確認ください',
      checkEmailNotice: 'アカウント確認用のメールを送信しました。',
      resendVerification: 'メールを再送',
      resending: '再送中…',
      resent: '再送完了',
      showPassword: 'パスワードを表示',
      hidePassword: 'パスワードを非表示',
      forgotNote: 'ご登録のメールアドレスを入力してください。再設定リンクをお送りします。',
      qrTitle: 'QRコードでログイン',
      qrSubtitle:
        'ログイン済みのスマートフォンでサイトを開き、メニューから「ログインQRをスキャン」を選んでください。',
      qrSecureNote: '認証済みのアカウントのみ読み取りできます。',
      qrWaiting: 'コードの読み取りを待っています…',
      qrScanned: '読み取りました。スマートフォンで確認してください。',
      qrApproved: '確認済み。ログインしています…',
      qrExpired: 'QRコードの有効期限が切れました。',
      qrDenied: 'ログインが拒否されました。',
      qrRefresh: '新しいコードを作成',
      qrError: 'QRコードを作成できません。もう一度お試しください。',
      qrScanTitle: 'ログインQRコードを読み取る',
      qrScanIntro: 'カメラで他の端末のQRコードを読み取ってください。',
      qrConfirm: 'ログインを確認',
      qrCancel: '拒否',
      qrSuccessTitle: 'ログインを確認しました',
      qrSuccessNote: '他の端末に戻って続行してください。このページは閉じてもかまいません。',
      qrLoginRequired: '読み取る前に、この端末でログインしてください。',
      qrAccountSwitchHint: '本アカウントに切り替えますか？この端末でログインしてから、もう一度読み取ってください。',
      qrManualLabel: 'またはQRコードを入力',
      qrManualPlaceholder: 'QRコードを貼り付け',
      qrManualSubmit: '続行',
      qrOpenCamera: 'カメラを開く',
      qrCameraError: 'カメラを開けませんでした。手動で入力してください。',
      qrScanAgain: '再読み取り',
      qrDeviceLabel: 'ログインを要求している端末',
      qrBackHome: 'ホームへ戻る',
      qrScanDeviceButton: 'カメラでコードを読み取る',
      qrGuestIntro:
        'アカウントをお持ちでない場合は、コードを読み取って他の端末でゲストとしてEchoraをお試しいただけます。ベトナム語の解説は無料です。',
      qrGuestSuccessTitle: 'ゲストモードに切り替えました',
      qrGuestSuccessNote:
        '相手の端末はゲストモードになりました。ベトナム語の解説は無料で聴けます。Premiumやお土産の購入などには本アカウントが必要です。',
      qrGuestPanelWaiting: 'ゲストモードに切り替えています…',
      qrGuestTransferred: 'この端末ではゲストとしてEchoraを利用中です',
      guestBadgeNote:
        'ゲストとしてEchoraをお試し中です。ベトナム語の解説は無料です。',
      guestBannerTitle: 'ゲストモード利用中',
      guestBannerNote:
        'ログインなしでベトナム語の解説を無料で聴けます。お土産の購入やPremiumの解除にはログイン・新規登録が必要です。',
      guestContinue: 'ゲストとして続ける',
      qrRealAccountHint: 'あなたの本アカウント:',
      qrAlreadySignedIn: 'この端末はすでにログインしています。新しいQRコードは必要ありません。',
      qrHandoffTitle: 'QRで別の端末にログイン',
      qrHandoffNote: 'スマートフォンのカメラでこのコードを読み取ると、同じアカウントでログインします。自分の端末でのみ使用してください。',
      qrHandoffDone: 'スマートフォンが同じアカウントでログインしました。',
      qrHandoffReceiveTitle: 'パソコンからログインを受け取る',
      qrHandoffReceiveNote: 'このコードは、パソコンで使用中のアカウントをこの端末にログインします。',
      qrHandoffReceiveAlready: 'この端末はすでにログインしています。別のアカウントを受け取る前にログアウトしてください。',
      qrMobileScanHint: 'パソコンに表示されたQRコードを読み取るにはカメラを開いてください。',
      qrLocalhostHint:
        'QRコードはこのページと同じアドレスを使用します。スマートフォンからlocalhostは開けません。パソコンのLAN IPでページを開いてください。',
      qrEmailVerifiedLabel: 'メール認証',
      qrEmailVerifiedOk: '認証済み',
      qrEmailNotVerified:
        'アカウントのメール認証が未完了です。本アカウントへ切り替える前に認証してください。',
      qrResendVerify: '認証メールを再送する',
      guestTitle: 'ゲスト観光客',
      exitGuestMode: 'ゲストモードを終了',
    },
    cart: 'カート',
    openMenu: 'メニューを開く',
    closeMenu: 'メニューを閉じる',
    scanQrDesktop: 'QRコードログイン',
    scanPoiQr: '観光地QRを読み取る',
    scanLoginQr: 'ログインQRをスキャン',
    shop: {
      foodTitle: 'サイゴングルメ',
      foodSubtitle: '街角の屋台料理と伝統の味わい',
      drinksTitle: 'サイゴンの飲み物',
      drinksSubtitle: '伝統のネルドリップ珈琲と爽快なお茶',
      searchPlaceholder: '',
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
      notePlaceholder: '',
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
      productUnavailable: '商品をご利用いただけません',
      productUnavailableDesc: 'お探しの商品は存在しないか、販売を終了しました。',
      backToSouvenirList: 'お土産一覧に戻る',
      relatedSouvenirHeading: '同じカテゴリのおすすめ商品',
      checkoutPage: {
        contactSection: '連絡先情報',
        addressSection: '配達先住所',
        paymentSection: 'お支払い方法',
        summarySection: 'ご注文内容',
        nameLabel: '氏名',
        phoneLabel: '電話番号',
        emailLabel: 'メールアドレス（注文確認用）',
        provinceLabel: '省 / 市',
        districtLabel: '区 / 郡',
        wardLabel: '坊 / 社',
        streetLabel: '番地・通り名',
        altAddressLabel: '追加住所（任意）',
        altAddressPlaceholder: '例：B棟、1203号室、12階',
        deliverySection: '配達オプション',
        deliveryTimeLabel: '希望の配達時間帯',
        deliveryTimeAny: '指定なし',
        deliveryTimeMorning: '午前 (8:00 - 12:00)',
        deliveryTimeAfternoon: '午後 (13:00 - 17:00)',
        deliveryTimeEvening: '夜間 (18:00 - 21:00)',
        deliveryTimeHint: '時間帯は目安です。Echora より確認のご連絡をします。',
        otherReceiverToggle: '別の人に届ける',
        otherReceiverNameLabel: '受取人の氏名',
        otherReceiverPhoneLabel: '受取人の電話番号',
        noteLabel: '配達メモ（任意）',
        notePlaceholder: '例：配達前に電話、平日日中に配達',
        selectProvince: '省 / 市を選択',
        selectDistrict: '区 / 郡を選択',
        selectWard: '坊 / 社を選択',
        loadingProvinces: '省 / 市を読み込み中',
        loadingDistricts: '区 / 郡を読み込み中',
        loadingWards: '坊 / 社を読み込み中',
        chooseDistrictFirst: '先に区 / 郡を選択してください',
        errNameRequired: '氏名を入力してください。',
        errNameShort: '氏名は2文字以上で入力してください。',
        errPhoneRequired: '電話番号を入力してください。',
        errPhoneInvalid: '電話番号は10桁で0から始めてください。',
        errEmailInvalid: 'メール形式が正しくありません。例：ten@gmail.com',
        errProvinceRequired: '省 / 市を選択してください。',
        errDistrictRequired: '区 / 郡を選択してください。',
        errWardRequired: '坊 / 社を選択してください。',
        errStreetRequired: '番地と通り名を入力してください。',
        errStreetInvalid: '番地と通り名は5文字以上で文字を含めてください。例：12 Nguyen Hue',
        errOtherNameRequired: '受取人の氏名を入力してください（2文字以上）。',
        errOtherPhoneRequired: '受取人の電話番号を入力してください。',
        errOtherPhoneInvalid: '受取人の電話番号は10桁で0から始めてください。',
        vietQrTitle: 'VietQR 振込',
        vietQrDesc: '注文後にQRコードを読み取ってお支払いください。',
        vietQrDemoNotice: 'デモ環境でのテスト決済です。実際の取引は発生しません。',
        vnpayTitle: 'VNPAY 決済ゲートウェイ',
        vnpayDesc: 'VNPAY に移動し、ATM カード、Visa/Mastercard、QR でお支払いください。',
        codTitle: '代金引換',
        codDesc: '商品受け取り時に現金でお支払いください。',
        groupFromSpot: '{spot} から',
        groupOther: 'その他の商品',
        itemCountLabel: '商品数',
        itemCountValue: '{n} 点',
        subtotalLabel: '小計',
        shippingFeeLabel: '配送料',
        freeShip: '無料',
        grandTotalLabel: '合計',
        termsPrefix: '',
        termsLink: 'Echora 利用規約',
        termsSuffix: ' に同意します',
        expandSummary: '展開する',
        collapseSummary: '折りたたむ',
        placeOrder: '注文を確定する',
        placingOrder: '注文処理中',
        reasonSubmitting: '注文を処理しています。しばらくお待ちください。',
        reasonEmptyCart: 'カートが空です。商品を追加してから注文してください。',
        reasonRequired: '* の付いた項目をすべて入力してください。',
        reasonInvalid: '一部の情報が正しくありません。エラーの項目をご確認ください。',
        reasonTerms: '注文するには利用規約に同意してください。',
        supportLine: 'ご不明な点は {phone}（{hours}）までお電話ください',
        decreaseQty: '{name} の数量を減らす',
        increaseQty: '{name} の数量を増やす',
        removeItem: '{name} を削除',
      },
    },
  },
  ko: {
    home: '홈',
    food: '기념품',
    attractions: '관광 명소',
    guide: '이용 안내',
    news: '뉴스',
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
      guest: '게스트',
      loginTitle: '로그인',
      loginTabPassword: '비밀번호',
      loginTabQr: 'QR 스캔',
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
      loginSuccessRedirect: '이동 중…',
      checkEmailTitle: '이메일을 확인하세요',
      checkEmailNotice: '계정 인증을 위한 이메일을 확인해 주세요.',
      resendVerification: '이메일 재전송',
      resending: '전송 중…',
      resent: '재전송 완료',
      showPassword: '비밀번호 표시',
      hidePassword: '비밀번호 숨기기',
      forgotNote: '가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.',
      qrTitle: 'QR 코드로 로그인',
      qrSubtitle:
        '로그인된 휴대폰에서 웹을 열고 메뉴에서 "로그인 QR 스캔"을 선택하세요.',
      qrSecureNote: '인증된 계정만 스캔할 수 있습니다.',
      qrWaiting: '코드 스캔을 기다리는 중…',
      qrScanned: '스캔되었습니다. 휴대폰에서 확인해 주세요.',
      qrApproved: '확인되었습니다. 로그인 중…',
      qrExpired: 'QR 코드가 만료되었습니다.',
      qrDenied: '로그인이 거부되었습니다.',
      qrRefresh: '새 코드 만들기',
      qrError: 'QR 코드를 만들 수 없습니다. 다시 시도해 주세요.',
      qrScanTitle: '로그인 QR 코드 스캔',
      qrScanIntro: '카메라로 다른 기기의 QR 코드를 스캔하세요.',
      qrConfirm: '로그인 확인',
      qrCancel: '거부',
      qrSuccessTitle: '로그인이 확인되었습니다',
      qrSuccessNote: '다른 기기로 돌아가 계속하세요. 이 페이지는 닫아도 됩니다.',
      qrLoginRequired: '스캔하기 전에 이 기기에서 로그인해야 합니다.',
      qrAccountSwitchHint: '실제 계정으로 전환하려면 이 기기에서 로그인한 후 다시 스캔하세요.',
      qrManualLabel: '또는 QR 코드 입력',
      qrManualPlaceholder: 'QR 코드를 붙여넣기',
      qrManualSubmit: '계속',
      qrOpenCamera: '카메라 열기',
      qrCameraError: '카메라를 열 수 없습니다. 직접 입력해 주세요.',
      qrScanAgain: '다시 스캔',
      qrDeviceLabel: '로그인을 요청한 기기',
      qrBackHome: '홈으로',
      qrScanDeviceButton: '카메라로 코드 스캔',
      qrGuestIntro:
        '아직 계정이 없다면 코드를 스캔하여 다른 기기에서 게스트로 Echora를 체험해 보세요. 베트남어 해설은 무료입니다.',
      qrGuestSuccessTitle: '게스트 모드로 전환되었습니다',
      qrGuestSuccessNote:
        '상대 기기는 이제 게스트 모드입니다. 베트남어 해설은 무료로 들을 수 있으며, 프리미엄이나 기념품 구매 등은 실제 계정이 필요합니다.',
      qrGuestPanelWaiting: '게스트 모드로 전환하는 중…',
      qrGuestTransferred: '이 기기에서 게스트로 Echora를 이용 중입니다',
      guestBadgeNote: '게스트로 Echora를 이용 중입니다. 베트남어 해설은 무료입니다.',
      guestBannerTitle: '게스트 모드 이용 중',
      guestBannerNote:
        '로그인 없이 베트남어 해설을 무료로 들을 수 있습니다. 기념품 구매나 프리미엄 해제는 로그인 또는 회원가입이 필요합니다.',
      guestContinue: '게스트로 계속하기',
      qrRealAccountHint: '실제 계정:',
      qrAlreadySignedIn: '이 기기는 이미 로그인되어 있습니다. 새 QR 코드가 필요하지 않습니다.',
      qrHandoffTitle: 'QR로 다른 기기 로그인',
      qrHandoffNote: '휴대폰 카메라로 이 코드를 스캔하면 같은 계정으로 로그인됩니다. 본인 기기에서만 사용하세요.',
      qrHandoffDone: '휴대폰이 같은 계정으로 로그인되었습니다.',
      qrHandoffReceiveTitle: '컴퓨터에서 로그인 받기',
      qrHandoffReceiveNote: '이 코드는 컴퓨터에서 사용 중인 계정을 이 기기에 로그인합니다.',
      qrHandoffReceiveAlready: '이 기기는 이미 로그인되어 있습니다. 다른 계정을 받기 전에 로그아웃하세요.',
      qrMobileScanHint: '컴퓨터에 표시된 QR 코드를 스캔하려면 카메라를 여세요.',
      qrLocalhostHint:
        'QR 코드는 현재 페이지와 같은 주소를 사용합니다. 휴대폰에서는 localhost를 열 수 없으므로 컴퓨터의 LAN IP로 페이지를 여세요.',
      qrEmailVerifiedLabel: '이메일 인증',
      qrEmailVerifiedOk: '인증 완료',
      qrEmailNotVerified:
        '계정의 이메일 인증이 아직 완료되지 않았습니다. 실제 계정으로 전환하기 전에 인증해 주세요.',
      qrResendVerify: '인증 이메일 다시 보내기',
      guestTitle: '게스트 방문자',
      exitGuestMode: '게스트 모드 종료',
    },
    cart: '장바구니',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
    scanQrDesktop: 'QR 코드 로그인',
    scanPoiQr: '관광지 QR 스캔',
    scanLoginQr: '로그인 QR 스캔',
    shop: {
      foodTitle: '사이공 미식',
      foodSubtitle: '거리의 풍미와 사이공 대표 맛집 요리',
      drinksTitle: '사이공 음료',
      drinksSubtitle: '전통 드립 커피와 시원한 전통차',
      searchPlaceholder: '',
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
      notePlaceholder: '',
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
      productUnavailable: '상품을 이용할 수 없습니다',
      productUnavailableDesc: '찾으시는 상품이 존재하지 않거나 판매가 중단되었습니다.',
      backToSouvenirList: '기념품 목록으로 돌아가기',
      relatedSouvenirHeading: '같은 카테고리의 추천 상품',
      checkoutPage: {
        contactSection: '연락처 정보',
        addressSection: '배송 주소',
        paymentSection: '결제 수단',
        summarySection: '주문 요약',
        nameLabel: '받는 분',
        phoneLabel: '연락처',
        emailLabel: '이메일 (주문 확인용)',
        provinceLabel: '시 / 도',
        districtLabel: '구 / 군',
        wardLabel: '읍 / 면 / 동',
        streetLabel: '도로명 주소',
        altAddressLabel: '추가 주소 (선택)',
        altAddressPlaceholder: '예: B동, 1203호, 12층',
        deliverySection: '배송 옵션',
        deliveryTimeLabel: '희망 배송 시간대',
        deliveryTimeAny: '상관 없음',
        deliveryTimeMorning: '오전 (8:00 - 12:00)',
        deliveryTimeAfternoon: '오후 (13:00 - 17:00)',
        deliveryTimeEvening: '저녁 (18:00 - 21:00)',
        deliveryTimeHint: '시간대는 참고용이며, Echora가 확인을 위해 연락드립니다.',
        otherReceiverToggle: '다른 사람에게 배송',
        otherReceiverNameLabel: '받는 사람 이름',
        otherReceiverPhoneLabel: '받는 사람 전화번호',
        noteLabel: '배송 메모 (선택)',
        notePlaceholder: '예: 배송 전 전화, 평일 업무 시간 배송',
        selectProvince: '시 / 도 선택',
        selectDistrict: '구 / 군 선택',
        selectWard: '읍 / 면 / 동 선택',
        loadingProvinces: '시 / 도 불러오는 중',
        loadingDistricts: '구 / 군 불러오는 중',
        loadingWards: '읍 / 면 / 동 불러오는 중',
        chooseDistrictFirst: '먼저 구 / 군을 선택해 주세요',
        errNameRequired: '받는 분 성함을 입력해 주세요.',
        errNameShort: '성함은 2자 이상 입력해 주세요.',
        errPhoneRequired: '연락처를 입력해 주세요.',
        errPhoneInvalid: '연락처는 10자리이며 0으로 시작해야 합니다.',
        errEmailInvalid: '이메일 형식이 올바르지 않습니다. 예: ten@gmail.com',
        errProvinceRequired: '시 / 도를 선택해 주세요.',
        errDistrictRequired: '구 / 군을 선택해 주세요.',
        errWardRequired: '읍 / 면 / 동을 선택해 주세요.',
        errStreetRequired: '도로명 주소를 입력해 주세요.',
        errStreetInvalid: '도로명 주소는 5자 이상이며 문자를 포함해야 합니다. 예: 12 Nguyen Hue',
        errOtherNameRequired: '받는 사람 이름을 입력해 주세요 (2자 이상).',
        errOtherPhoneRequired: '받는 사람 전화번호를 입력해 주세요.',
        errOtherPhoneInvalid: '받는 사람 전화번호는 10자리이며 0으로 시작해야 합니다.',
        vietQrTitle: 'VietQR 계좌이체',
        vietQrDesc: '주문 후 QR 코드를 스캔하여 결제해 주세요.',
        vietQrDemoNotice: '데모 환경의 테스트 결제이며 실제 거래는 발생하지 않습니다.',
        vnpayTitle: 'VNPAY 결제 게이트웨이',
        vnpayDesc: 'VNPAY로 이동하여 ATM 카드, Visa/Mastercard 또는 QR로 결제하세요.',
        codTitle: '착불 결제',
        codDesc: '상품 수령 시 현금으로 결제해 주세요.',
        groupFromSpot: '{spot}에서',
        groupOther: '기타 상품',
        itemCountLabel: '상품 수량',
        itemCountValue: '{n}개',
        subtotalLabel: '소계',
        shippingFeeLabel: '배송비',
        freeShip: '무료',
        grandTotalLabel: '총 금액',
        termsPrefix: '',
        termsLink: 'Echora 이용약관',
        termsSuffix: '에 동의합니다.',
        expandSummary: '펼치기',
        collapseSummary: '접기',
        placeOrder: '주문 완료',
        placingOrder: '주문 처리 중',
        reasonSubmitting: '주문을 처리 중입니다. 잠시만 기다려 주세요.',
        reasonEmptyCart: '장바구니가 비어 있습니다. 상품을 추가한 후 주문해 주세요.',
        reasonRequired: '* 표시된 항목을 모두 입력해 주세요.',
        reasonInvalid: '일부 정보가 올바르지 않습니다. 오류 항목을 확인해 주세요.',
        reasonTerms: '주문하려면 이용약관에 동의해 주세요.',
        supportLine: '도움이 필요하시면 {phone} ({hours})로 전화해 주세요',
        decreaseQty: '{name} 수량 줄이기',
        increaseQty: '{name} 수량 늘리기',
        removeItem: '{name} 삭제',
      },
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

const PENDING_PREMIUM_LANGUAGE_KEY = 'echora:pending_premium_language';
const PENDING_PREMIUM_LANGUAGES = ['en', 'ja', 'ko'] as const;

export function savePendingPremiumLanguage(lang: SupportedLanguage): void {
  if (!(PENDING_PREMIUM_LANGUAGES as readonly string[]).includes(lang)) return;
  try {
    sessionStorage.setItem(PENDING_PREMIUM_LANGUAGE_KEY, lang);
  } catch {
    return;
  }
}

export function consumePendingPremiumLanguage(): SupportedLanguage | null {
  try {
    const saved = sessionStorage.getItem(PENDING_PREMIUM_LANGUAGE_KEY);
    sessionStorage.removeItem(PENDING_PREMIUM_LANGUAGE_KEY);
    if (saved && (PENDING_PREMIUM_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch {
    return null;
  }
  return null;
}

export function clearPendingPremiumLanguage(): void {
  try {
    sessionStorage.removeItem(PENDING_PREMIUM_LANGUAGE_KEY);
  } catch {
    return;
  }
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
