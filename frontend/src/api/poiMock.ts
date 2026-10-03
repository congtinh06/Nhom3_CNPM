import { Locale, NearbyResponse, Poi, VisitStats } from '../types/poi';

/**
 * Danh sách 5 locale hỗ trợ thuyết minh tự động
 */
export const mockLocales: Locale[] = [
  { code: 'vi', label: 'Tiếng Việt', ttsLang: 'vi-VN' },
  { code: 'en', label: 'English', ttsLang: 'en-US' },
  { code: 'ja', label: '日本語', ttsLang: 'ja-JP' },
  { code: 'ko', label: '한국어', ttsLang: 'ko-KR' },
  { code: 'zh', label: '中文', ttsLang: 'zh-CN' },
];

/**
 * Danh sách điểm POI mẫu (Quận 1 & Quận 5 TP.HCM)
 */
export const mockPois: Poi[] = [
  {
    id: 1,
    name: 'ATM Techcombank - Nguyễn Huệ',
    type: 'ATM',
    bankName: 'Techcombank',
    address: 'Phố đi bộ Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    latitude: 10.7743,
    longitude: 106.7032,
    hasCrmDeposit: true,
    acceptsInternationalCards: true,
    hasSecurityGuard: true,
    isOpen247: true,
    isIndoor: true,
    incidentReportsCount: 0,
  },
  {
    id: 2,
    name: 'ATM Vietcombank - Bến Thành',
    type: 'ATM',
    bankName: 'Vietcombank',
    address: '68 Lê Lợi, Phường Bến Thành, Quận 1',
    latitude: 10.7721,
    longitude: 106.6983,
    hasCrmDeposit: true,
    acceptsInternationalCards: true,
    hasSecurityGuard: true,
    isOpen247: true,
    isIndoor: true,
    incidentReportsCount: 0,
  },
  {
    id: 3,
    name: 'ATM BIDV - Chi nhánh Hàm Nghi',
    type: 'ATM',
    bankName: 'BIDV',
    address: '36 Hàm Nghi, Phường Bến Nghé, Quận 1',
    latitude: 10.7708,
    longitude: 106.7045,
    hasCrmDeposit: false,
    acceptsInternationalCards: true,
    hasSecurityGuard: false,
    isOpen247: true,
    isIndoor: false,
    incidentReportsCount: 3,
    incidentAlerts: ['Bàn phím lỏng lẻo', 'Khu vực tối về đêm'],
  },
  {
    id: 4,
    name: 'Điểm đổi ngoại tệ Eximbank - Đồng Khởi',
    type: 'FX_EXCHANGE',
    bankName: 'Eximbank',
    address: '58 Đồng Khởi, Phường Bến Nghé, Quận 1',
    latitude: 10.7769,
    longitude: 106.7031,
    hasCrmDeposit: false,
    acceptsInternationalCards: true,
    hasSecurityGuard: true,
    isOpen247: false,
    isIndoor: true,
    incidentReportsCount: 0,
  },
  {
    id: 5,
    name: 'Chi nhánh VietinBank - Hai Bà Trưng',
    type: 'BRANCH',
    bankName: 'VietinBank',
    address: '93 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
    latitude: 10.7798,
    longitude: 106.6990,
    hasCrmDeposit: true,
    acceptsInternationalCards: true,
    hasSecurityGuard: true,
    isOpen247: false,
    isIndoor: true,
    incidentReportsCount: 0,
  },
  // Điểm Quận 5 (Demo: Quận 5 - Chợ Lớn / An Đông)
  {
    id: 6,
    name: 'ATM Agribank - Chợ Lớn Quận 5',
    type: 'ATM',
    bankName: 'Agribank',
    address: '126 Hồng Bàng, Phường 12, Quận 5',
    latitude: 10.7554,
    longitude: 106.6652,
    hasCrmDeposit: false,
    acceptsInternationalCards: true,
    hasSecurityGuard: false,
    isOpen247: true,
    isIndoor: false,
    incidentReportsCount: 0,
  },
  {
    id: 7,
    name: 'ATM Vietcombank - An Đông Quận 5',
    type: 'ATM',
    bankName: 'Vietcombank',
    address: '18 An Dương Vương, Phường 9, Quận 5',
    latitude: 10.7570,
    longitude: 106.6690,
    hasCrmDeposit: true,
    acceptsInternationalCards: true,
    hasSecurityGuard: true,
    isOpen247: true,
    isIndoor: true,
    incidentReportsCount: 0,
  },
  {
    id: 8,
    name: 'ATM BIDV - Nguyễn Tri Phương Quận 5',
    type: 'ATM',
    bankName: 'BIDV',
    address: '320 Nguyễn Tri Phương, Phường 4, Quận 5',
    latitude: 10.7595,
    longitude: 106.6660,
    hasCrmDeposit: true,
    acceptsInternationalCards: true,
    hasSecurityGuard: true,
    isOpen247: true,
    isIndoor: true,
    incidentReportsCount: 0,
  },
  {
    id: 9,
    name: 'ATM Techcombank - Trần Hưng Đạo Quận 5',
    type: 'ATM',
    bankName: 'Techcombank',
    address: '600 Trần Hưng Đạo, Phường 2, Quận 5',
    latitude: 10.7538,
    longitude: 106.6730,
  },
  {
    id: 10,
    name: 'ATM MB Bank - Hải Thượng Lãn Ông Quận 5',
    type: 'ATM',
    bankName: 'MB Bank',
    address: '82 Hải Thượng Lãn Ông, Phường 10, Quận 5',
    latitude: 10.7510,
    longitude: 106.6610,
  },
  {
    id: 11,
    name: 'ATM ACB - Châu Văn Liêm Quận 5',
    type: 'ATM',
    bankName: 'ACB',
    address: '35 Châu Văn Liêm, Phường 14, Quận 5',
    latitude: 10.7525,
    longitude: 106.6580,
  },
  {
    id: 12,
    name: 'ATM Sacombank - Hùng Vương Quận 5',
    type: 'ATM',
    bankName: 'Sacombank',
    address: '126 Hùng Vương, Phường 4, Quận 5',
    latitude: 10.7580,
    longitude: 106.6675,
  },
];

/**
 * Nội dung thuyết minh mẫu cho mỗi loại điểm x 5 ngôn ngữ (nội dung chung, không ghi phí/giờ cụ thể)
 */
export const mockNarrations: Record<
  string,
  Record<string, { text: string; ttsLang: string }>
> = {
  ATM: {
    vi: {
      text: 'Quý khách đang ở gần điểm rút tiền tự động ATM. Điểm giao dịch hỗ trợ rút tiền mặt, chuyển khoản và tra cứu số dư thẻ nội địa và quốc tế.',
      ttsLang: 'vi-VN',
    },
    en: {
      text: 'You are near an automated teller machine (ATM). This location provides cash withdrawals, fund transfers, and balance inquiries for domestic and international cards.',
      ttsLang: 'en-US',
    },
    ja: {
      text: '現在、ATM（現金自動預払機）の近くにいらっしゃいます。国内外のカードによる現金引き出し、送金、残高照会がご利用いただけます。',
      ttsLang: 'ja-JP',
    },
    ko: {
      text: '현재 자동화기기(ATM) 인근에 위치해 있습니다. 국내외 카드 현금 인출, 계좌 이체 및 잔액 조회가 가능합니다.',
      ttsLang: 'ko-KR',
    },
    zh: {
      text: '您目前靠近自动取款机（ATM）。该服务点支持国内外银行卡的现金取款、转账及余额查询。',
      ttsLang: 'zh-CN',
    },
  },
  BRANCH: {
    vi: {
      text: 'Quý khách đang ở gần chi nhánh ngân hàng. Tại đây cung cấp đầy đủ các dịch vụ tài chính, mở tài khoản, chuyển tiền và tư vấn ngân hàng trực tiếp.',
      ttsLang: 'vi-VN',
    },
    en: {
      text: 'You are near a bank branch. This branch provides comprehensive financial services, including account opening, money transfers, and in-person banking consultation.',
      ttsLang: 'en-US',
    },
    ja: {
      text: '現在、銀行の支店近くにいらっしゃいます。口座開設、送金、各種金融相談など総合的な窓口サービスをご利用いただけます。',
      ttsLang: 'ja-JP',
    },
    ko: {
      text: '현재 은행 영업점 인근에 위치해 있습니다. 계좌 개설, 송금 및 대면 금융 상담 등 종합 금융 서비스를 제공합니다.',
      ttsLang: 'ko-KR',
    },
    zh: {
      text: '您目前靠近银行营业网点。这里提供开户、转账、金融咨询等全面的柜面金融服务。',
      ttsLang: 'zh-CN',
    },
  },
  FX_EXCHANGE: {
    vi: {
      text: 'Quý khách đang ở gần quầy đổi ngoại tệ. Điểm hỗ trợ quy đổi các đồng ngoại tệ phổ biến và tư vấn các thủ tục giao dịch tiền tệ cho du khách.',
      ttsLang: 'vi-VN',
    },
    en: {
      text: 'You are near a foreign currency exchange point. This counter supports exchanging popular foreign currencies and assisting travelers with currency transactions.',
      ttsLang: 'en-US',
    },
    ja: {
      text: '現在、外貨両替所の近くにいらっしゃいます。主要な外貨の両替手続きや旅行者向け通貨サービスをご利用いただけます。',
      ttsLang: 'ja-JP',
    },
    ko: {
      text: '현재 환전소 인근에 위치해 있습니다. 주요 외화 환전 및 여행객을 위한 환전 관련 안내 서비스를 제공합니다.',
      ttsLang: 'ko-KR',
    },
    zh: {
      text: '您目前靠近外币兑换点。这里支持常见外币的双向兑换及旅行者货币业务咨询。',
      ttsLang: 'zh-CN',
    },
  },
};

/**
 * Số liệu thống kê lượt ghé thăm mẫu
 */
export const mockVisitStats: VisitStats = {
  total: 1250,
  byLang: {
    vi: 620,
    en: 340,
    ko: 120,
    ja: 110,
    zh: 60,
  },
  topPois: [
    { poiId: 1, name: 'ATM Demo - Nguyễn Huệ', count: 485 },
    { poiId: 3, name: 'Điểm đổi ngoại tệ Demo - Đồng Khởi', count: 320 },
    { poiId: 2, name: 'Chi nhánh Demo - Lê Lợi', count: 215 },
    { poiId: 4, name: 'ATM Demo - Hàm Nghi', count: 140 },
    { poiId: 5, name: 'Chi nhánh Demo - Hai Bà Trưng', count: 90 },
  ],
};

/**
 * Tính khoảng cách đường tròn lớn theo công thức Haversine (kết quả làm tròn theo mét)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Bán kính Trái Đất (mét)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function generateTemplateNarration(poi: Poi, distanceMeters: number, lang: string): { text: string; ttsLang: string } {
  const bank = poi.bankName || 'ngân hàng';
  const address = poi.address;

  switch (lang) {
    case 'en':
      return {
        ttsLang: 'en-US',
        text: `You are near ${bank} ATM at ${address}, ${distanceMeters} meters away. Please shield the keypad when entering your PIN and inspect the card reader.`,
      };
    case 'ja':
      return {
        ttsLang: 'ja-JP',
        text: `現在、約${distanceMeters}メートル先にある${address}の${bank} ATMの近くにいます。暗証番号入力時は手で隠し、カード挿入口をご確認ください。`,
      };
    case 'ko':
      return {
        ttsLang: 'ko-KR',
        text: `현재 약 ${distanceMeters}미터 거리에 있는 ${address}의 ${bank} ATM 근처에 있습니다. 비밀번호 입력 시 키패드를 가리고 카드 투입구를 확인하세요.`,
      };
    case 'zh':
      return {
        ttsLang: 'zh-CN',
        text: `您目前靠近位于${address}的${bank} ATM，距离约${distanceMeters}米。输入密码时请遮挡键盘，并检查插卡口是否有异常。`,
      };
    case 'vi':
    default:
      return {
        ttsLang: 'vi-VN',
        text: `Bạn đang ở gần điểm ATM ${bank} tại ${address}, cách khoảng ${distanceMeters} mét. Hãy che bàn phím khi nhập mã PIN và kiểm tra khe đọc thẻ trước khi đưa thẻ vào.`,
      };
  }
}

/**
 * Tìm điểm POI gần nhất theo tọa độ thực tế, bán kính radius và ngân hàng
 * Nếu không có điểm nào trong radius, trả về null (tương đương HTTP 204)
 */
export function getMockNearby(
  lat: number,
  lng: number,
  lang?: string,
  radius?: number,
  bank?: string
): NearbyResponse | null {
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  // Chuẩn hóa locale (mặc định 'vi' nếu không hợp lệ)
  const normalizedLang = (lang || 'vi').trim().toLowerCase();
  const validLang = ['vi', 'en', 'ja', 'ko', 'zh'].includes(normalizedLang) ? normalizedLang : 'vi';

  // Lọc theo ngân hàng nếu được truyền vào
  let pool = mockPois;
  if (
    bank &&
    bank.trim() &&
    bank.trim().toLowerCase() !== 'all' &&
    bank.trim().toLowerCase() !== 'tất cả'
  ) {
    const searchBank = bank.trim().toLowerCase();
    pool = mockPois.filter(
      (p) =>
        p.bankName.toLowerCase().includes(searchBank) ||
        p.name.toLowerCase().includes(searchBank)
    );
  }

  // Tính khoảng cách Haversine tới từng điểm
  const poisWithDistance = pool.map((poi) => ({
    poi,
    distanceMeters: calculateHaversineDistance(lat, lng, poi.latitude, poi.longitude),
  }));

  // Lọc theo bán kính radius nếu được truyền vào
  const candidates =
    radius !== undefined && radius > 0
      ? poisWithDistance.filter((item) => item.distanceMeters <= radius)
      : poisWithDistance;

  if (candidates.length === 0) {
    return null;
  }

  // Chọn điểm có khoảng cách nhỏ nhất
  candidates.sort((a, b) => a.distanceMeters - b.distanceMeters);
  const closest = candidates[0];

  // Lấy câu thuyết minh theo template cho điểm gần nhất
  const primaryNarration = generateTemplateNarration(closest.poi, closest.distanceMeters, validLang);

  // Tạo danh sách top 5 điểm gần nhất
  const nearbyPois = candidates.slice(0, 5).map((item) => {
    const itemNarration = generateTemplateNarration(item.poi, item.distanceMeters, validLang);
    return {
      poi: item.poi,
      distanceMeters: item.distanceMeters,
      narration: {
        text: itemNarration.text,
        locale: validLang,
        ttsLang: itemNarration.ttsLang,
      },
    };
  });

  return {
    poi: closest.poi,
    distanceMeters: closest.distanceMeters,
    narration: {
      text: primaryNarration.text,
      locale: validLang,
      ttsLang: primaryNarration.ttsLang,
    },
    nearbyPois,
  };
}
