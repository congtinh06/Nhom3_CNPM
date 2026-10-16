export interface ZoneDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface AdminZoneListItem {
  id: number;
  code: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  poiCount: number;
  version?: number | null;
}

export interface AdminZoneDetail {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  poiCount: number;
  routeCount: number;
  version?: number | null;
}

export interface AdminZoneQueryParams {
  page?: number;
  size?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
}

export interface AdminZonePageResponse {
  content: AdminZoneListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CreateZoneInput {
  code: string;
  name: string;
  description?: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
}

export interface UpdateZoneInput {
  name: string;
  description?: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
  version?: number | null;
}

export const ZONE_RADIUS_MIN = 50;
export const ZONE_RADIUS_MAX = 50000;
