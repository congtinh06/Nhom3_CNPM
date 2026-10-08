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

export type AnalyticsEventType = 'SCAN' | 'AUDIO_PLAY';
export type SupportedLanguage = 'vi' | 'en' | 'ja' | 'ko' | 'zh';
export type TriggerType = 'QR' | 'GPS' | 'MANUAL';

export interface CreateAnalyticsEventRequest {
  eventType: AnalyticsEventType;
  poiId: number;
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
  totalScans: number;
  scansByTrigger: Record<string, number>;
  totalAudioPlays: number;
  audioCompleted: number;
  playsByLanguage: Record<string, number>;
  topPois: TopPoiStat[];
}

export type ProductCategory = 'FOOD' | 'DRINK';

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
  options?: ProductOptions;
}

export type OrderStatus = 'Chờ xác nhận' | 'Đã hủy';

export type BackendOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'MOCK_GATEWAY';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface BackendOrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface BackendOrder {
  id: number;
  orderCode: string;
  userId?: number;
  totalAmount: number;
  status: BackendOrderStatus;
  receiverName: string;
  phone: string;
  address: string;
  note?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  items: BackendOrderItem[];
  createdAt: string;
  updatedAt: string;
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

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: AuthRole;
  emailVerified: boolean;
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
