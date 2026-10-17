export interface AdminApiError {
  status: number;
  message: string;
  details?: Record<string, string>;
}

export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
  isUpcoming?: boolean;
}

export interface AdminNavSection {
  id: string;
  label?: string;
  items: AdminNavItem[];
}

export type AdminDensity = 'comfortable' | 'compact';

export * from './product';
export * from './poi';
export * from './zone';
export * from './route';
export * from './user';
