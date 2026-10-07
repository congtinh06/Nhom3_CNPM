// ============================================================================
// SaigonVoice Types & DTO Interfaces (khớp trực tiếp với Backend Spring Boot)
// ============================================================================

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

export interface Zone {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface Route {
  id: number;
  zoneId: number;
  zoneCode: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  stopCount: number;
}

export interface RouteDetail extends Route {
  stops: PoiSummary[];
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
export type SupportedLanguage = 'vi' | 'en' | 'ja' | 'ko';
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
