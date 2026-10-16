export type RouteStatusValue = 'ACTIVE' | 'INACTIVE';

export interface RouteDto {
  id: number;
  zoneId: number;
  zoneCode: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  stopCount: number;
}

export interface AdminRouteStop {
  id: number;
  code: string;
  name: string;
  stopOrder?: number | null;
}

export interface AdminRouteListItem {
  id: number;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  name: string;
  displayOrder: number;
  status: string;
  stopCount: number;
  version?: number | null;
}

export interface AdminRouteDetail {
  id: number;
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  stopCount: number;
  stops: AdminRouteStop[];
  version?: number | null;
}

export interface AdminRouteQueryParams {
  page?: number;
  size?: number;
  zoneId?: number;
  status?: string;
  search?: string;
  sort?: string;
}

export interface AdminRoutePageResponse {
  content: AdminRouteListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CreateRouteInput {
  zoneId: number;
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateRouteInput {
  name: string;
  description?: string;
  displayOrder?: number;
  status?: string;
  version?: number | null;
}

export interface UpdateRouteStopsInput {
  poiIds: number[];
  version?: number | null;
}

/** Kết quả trả về của PUT /routes/{id}/stops (AdminRouteDetailDto). */
export interface RouteStopsResult {
  id: number;
  zoneId: number;
  zoneCode: string;
  zoneName?: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  status: string;
  stopCount?: number;
  stops: AdminRouteStop[];
  version?: number | null;
}
