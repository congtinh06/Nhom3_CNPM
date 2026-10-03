export type PoiType = 'ATM' | 'BRANCH' | 'FX_EXCHANGE' | (string & {});

export interface Locale {
  code: string;
  label: string;
  ttsLang: string;
}

export interface Poi {
  id: number | string;
  name: string;
  type: PoiType;
  bankName: string;
  address: string;
  latitude: number;
  longitude: number;
  // Facility & Safety enhancements
  hasCrmDeposit?: boolean;
  acceptsInternationalCards?: boolean;
  hasSecurityGuard?: boolean;
  isOpen247?: boolean;
  isIndoor?: boolean;
  incidentReportsCount?: number;
  incidentAlerts?: string[];
}

export interface Narration {
  text: string;
  locale: string;
  ttsLang: string;
}

export interface NearbyItem {
  poi: Poi;
  distanceMeters: number;
  narration: Narration;
}

export interface NearbyResponse {
  poi: Poi;
  distanceMeters: number;
  narration: Narration;
  nearbyPois?: NearbyItem[];
}

export interface NearbyParams {
  lat: number;
  lng: number;
  lang?: string;
  radius?: number;
  bank?: string;
}

export interface TopPoi {
  poiId: number | string;
  name: string;
  count: number;
}

export interface VisitStats {
  total: number;
  byLang: Record<string, number>;
  topPois: TopPoi[];
}
