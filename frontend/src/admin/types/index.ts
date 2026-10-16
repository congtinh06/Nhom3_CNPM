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

export * from './product';
export * from './poi';
export * from './zone';
export * from './route';
export * from './user';
