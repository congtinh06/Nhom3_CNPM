export interface Category {
  id: number;
  code: string;
  nameVi: string;
  nameEn?: string;
  iconUrl?: string | null;
}

export interface Zone {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface PoiSummary {
  id: number;
  code: string;
  qrToken: string;
  name: string;
  slug?: string | null;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  address?: string | null;
  thumbnailUrl?: string | null;
  zoneId: number;
  zoneCode: string;
  categoryCode: string;
  categoryNameVi?: string;
  routeId?: number | null;
  stopOrder?: number | null;
  audioUrl?: string | null;
  audioStatus?: string;
}

export type AudioStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED_TTS';

export interface PoiDetail extends PoiSummary {
  languageCode: string;
  title: string;
  summary: string;
  description: string;
  historicalSignificance?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  audioStatus: AudioStatus | string;
  fallbackLanguage: boolean;
  /** Giá mua lẻ gói ngoại ngữ cho POI này (null = dùng giá mặc định order-service). */
  premiumPrice?: number | null;
}

/** Một phân đoạn (chap) bài thuyết minh của POI theo từng ngôn ngữ. */
export interface PoiGuideChapter {
  order: number;
  title: string;
  narrationText: string;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  audioStatus?: string | null;
}

export interface PoiGuideTranslation {
  languageCode: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  historicalSignificance?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  audioStatus?: string | null;
  source?: string | null;
  chapters?: PoiGuideChapter[] | null;
}

export interface PoiGuide {
  id: number;
  code: string;
  qrToken: string;
  name: string;
  slug?: string | null;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  address?: string | null;
  thumbnailUrl?: string | null;
  zoneId: number;
  zoneCode: string;
  categoryCode: string;
  categoryNameVi?: string | null;
  routeId?: number | null;
  stopOrder?: number | null;
  /** Giá mua lẻ gói ngoại ngữ cho POI này (null = dùng giá mặc định order-service). */
  premiumPrice?: number | null;
  translations: Record<string, PoiGuideTranslation>;
}

/** Trạng thái gói của du khách: gói Premium toàn tài khoản + POI đã mua lẻ. */
export interface PurchasedPoi {
  poiId: number;
  expiresAt: string;
}

export interface MeEntitlement {
  plan: AuthPlan;
  premiumActive: boolean;
  premiumExpiresAt?: string | null;
  purchasedPois: PurchasedPoi[];
  premium?: boolean;
  unlockedPoiIds?: number[];
  hasAnyPurchase?: boolean;
}

export interface Route {
  id: number;
  zoneId: number;
  zoneCode: string;
  name: string;
  description?: string | null;
  displayOrder?: number | null;
  status?: string;
  stopCount: number;
}

export interface NearbyPoi {
  poiId: number;
  poiCode: string;
  name: string;
  zoneId: number;
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
  distanceMeters: number;
}

export interface ResolvePoiResponse {
  matched: boolean;
  poi: NearbyPoi | null;
}

export type AnalyticsEventType = 'SCAN' | 'AUDIO_PLAY' | 'VISIT';
export type SupportedLanguage = 'vi' | 'en' | 'ja' | 'ko';
export type TriggerType = 'QR' | 'GPS' | 'MANUAL' | 'DIRECT';

export interface CreateAnalyticsEventRequest {
  eventType: AnalyticsEventType;
  /** Bắt buộc với SCAN/AUDIO_PLAY, bỏ trống với VISIT (truy cập website chung). */
  poiId?: number;
  languageCode: SupportedLanguage | string;
  triggerType?: TriggerType;
  completed?: boolean;
  sessionId?: string;
}

export interface TopPoiStat {
  poiId: number;
  name: string;
  scans: number;
  plays: number;
}

export interface AnalyticsSummaryResponse {
  totalVisits: number;
  visitsByTrigger: Record<string, number>;
  /** Số phiên có hoạt động trong 5 phút gần nhất (khách "đang online"). */
  onlineVisitors: number;
  totalScans: number;
  scansByTrigger: Record<string, number>;
  totalAudioPlays: number;
  audioCompleted: number;
  playsByLanguage: Record<string, number>;
  topPois: TopPoiStat[];
}

export interface AnalyticsDailyPoint {
  /** yyyy-MM-dd theo múi giờ Việt Nam. */
  date: string;
  visits: number;
  scans: number;
  plays: number;
}

export interface AnalyticsDailyCounts {
  visits: number;
  scans: number;
  plays: number;
}

export interface AnalyticsTrendsResponse {
  days: number;
  series: AnalyticsDailyPoint[];
  today: AnalyticsDailyCounts;
  yesterday: AnalyticsDailyCounts;
}

export type ProductCategory = 'FOOD' | 'DRINK' | 'SOUVENIR';

export type ProductSubCategory =
  | 'mon-an'
  | 'mon-an-vat'
  | 'dac-san'
  | 'ca-phe'
  | 'tra'
  | 'nuoc-giai-khat'
  | 'sinh-to';

export interface ProductOptions {
  size?: 'M' | 'L';
  sugar?: 'Ít' | 'Vừa' | 'Nhiều';
  ice?: 'Ít' | 'Vừa' | 'Nhiều';
  note?: string;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: ProductCategory;
  subCategory?: ProductSubCategory;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviewsCount?: number;
  badge?: 'Bán chạy' | 'Mới' | 'Đặc sản';
  prepTime?: string;
  portion?: string;
  hasDrinkOptions?: boolean;
  imagePath: string;
  poiId?: number | null;
  poiSlug?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Drink {
  id: number;
  name: string;
  price: number;
  hue: number;
  description: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  slug?: string;
  category?: ProductCategory;
  imagePath?: string;
  poiSlug?: string | null;
  options?: ProductOptions;
}

export type OrderStatus = 'Chờ xác nhận' | 'Đã hủy';

export type BackendOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'MOCK_GATEWAY' | 'VIETQR' | 'VNPAY';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface BackendOrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  imagePath?: string;
  selectedOptions?: string;
}

export interface BackendOrder {
  id: number;
  orderCode: string;
  userId?: number;
  orderType?: 'PRODUCT' | 'PREMIUM' | 'POI';
  premiumPackage?: string;
  poiId?: number | null;
  totalAmount: number;
  status: BackendOrderStatus;
  receiverName: string;
  phone: string;
  address: string;
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  items: BackendOrderItem[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  deliveryTimeType?: string;
  scheduledTime?: string;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  voucherCode?: string;
  paymentUrl?: string;
}

export interface VietQrPaymentInfo {
  bankId?: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  transferContent: string;
  qrUrl: string;
  qrImageUrl?: string;
  expiresAt: string;
  remainingMs?: number;
  status: BackendOrderStatus;
}

export interface CreateOrderPayload {
  receiverName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod: PaymentMethod;
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface OrderItem {
  key: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  name: string;
  phone: string;
  address: string;
  items: OrderItem[];
}

export interface SamplePlace {
  id: number;
  name: string;
  group: 'ls' | 'tl' | 'cp' | 'hd';
  hue: number;
  description: string;
  tip: string;
}

export type AuthRole = 'USER' | 'ADMIN';

export type AuthPlan = 'FREE' | 'PREMIUM';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: AuthRole;
  emailVerified: boolean;
  plan: AuthPlan;
  premiumActive: boolean;
  premiumExpiresAt?: string | null;
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

export interface AuthMessage {
  message: string;
}

export type QrLoginStatus =
  | 'PENDING'
  | 'SCANNED'
  | 'APPROVED'
  | 'GUEST_APPROVED'
  | 'DENIED'
  | 'CONSUMED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface QrLoginSession {
  sessionId: string;
  qrToken: string;
  exchangeToken: string;
  status: QrLoginStatus;
  expiresAt: string;
  expiresInSeconds: number;
  pollIntervalMs: number;
}

export interface QrLoginStatusResponse {
  sessionId: string;
  status: QrLoginStatus;
  expiresAt: string;
  expiresInSeconds: number;
  message?: string;
}

export interface QrScanResponse {
  sessionId: string;
  status: QrLoginStatus;
  createdAt: string;
  expiresAt: string;
  deviceLabel: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
