export type PublishStatusValue = 'PENDING' | 'PUBLISHED' | 'FAILED';

export type AudioStatusValue = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED_TTS';

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
  categoryNameVi?: string | null;
  routeId?: number | null;
  stopOrder?: number | null;
}

export interface PoiDetail extends PoiSummary {
  languageCode: string;
  title: string;
  summary: string;
  description: string;
  historicalSignificance?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  audioStatus: AudioStatusValue | string;
  fallbackLanguage?: boolean;
}

export interface PoiPublishStatus {
  poiId: number;
  poiCode: string;
  publishStatus: PublishStatusValue | string;
  publishAttempts?: number | null;
  lastPublishError?: string | null;
  lastPublishAttemptAt?: string | null;
}

export interface PoiZoneOption {
  id: number;
  code: string;
  name: string;
}

export interface PoiCategoryOption {
  id: number;
  code: string;
  nameVi: string;
  nameEn?: string | null;
  children?: PoiCategoryOption[];
}

export interface PoiRouteOption {
  id: number;
  zoneId: number;
  zoneCode?: string;
  name: string;
  status?: string;
}

export interface CreatePoiInput {
  zoneId: number;
  categoryId: number;
  code: string;
  qrToken: string;
  name: string;
  latitude: number;
  longitude: number;
  triggerRadiusMeters?: number;
  address?: string;
  thumbnailUrl?: string;
  routeId?: number;
  stopOrder?: number;
  title: string;
  summary: string;
  description: string;
  historicalSignificance?: string;
}

export interface UpdatePoiInput {
  version: number;
  categoryId: number;
  name: string;
  latitude: number;
  longitude: number;
  triggerRadiusMeters?: number;
  address?: string;
  thumbnailUrl?: string;
  routeId?: number;
  stopOrder?: number;
  title: string;
  summary: string;
  description: string;
  historicalSignificance?: string;
}

export interface AdminPoiTranslation {
  languageCode: string;
  title: string;
  summary: string;
  description: string;
  historicalSignificance?: string | null;
  audioUrl?: string | null;
  audioDurationSeconds?: number | null;
  audioStatus: AudioStatusValue | string;
  source?: string | null;
}

export interface AdminPoiListItem {
  id: number;
  code: string;
  name: string;
  slug?: string | null;
  zoneId: number;
  zoneCode: string;
  routeId?: number | null;
  routeName?: string | null;
  stopOrder?: number | null;
  status: string;
  version: number;
  publishStatus: PublishStatusValue | string;
  audioStatusByLanguage: Record<string, string>;
}

export interface AdminPoiDetail {
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
  categoryId: number;
  categoryCode: string;
  categoryNameVi?: string | null;
  routeId?: number | null;
  routeName?: string | null;
  stopOrder?: number | null;
  status: string;
  version: number;
  publishStatus: PublishStatusValue | string;
  publishAttempts?: number | null;
  lastPublishAttemptAt?: string | null;
  translations: Record<string, AdminPoiTranslation>;
}

export interface AdminPoiQueryParams {
  page?: number;
  size?: number;
  search?: string;
  zoneId?: number;
  routeId?: number;
  audioStatus?: AudioStatusValue;
  sort?: string;
}

export interface AdminPoiPageResponse {
  content: AdminPoiListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const POI_LANGUAGES: { code: string; label: string }[] = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'Tiếng Anh' },
  { code: 'ja', label: 'Tiếng Nhật' },
  { code: 'ko', label: 'Tiếng Hàn' },
];
