export interface AddressComponents {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
  address?: string;
  [key: string]: unknown;
}

export const formatPrice = (amount: number): string => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0đ';
  }
  return amount.toLocaleString('vi-VN') + 'đ';
};

export const formatPriceWithSpace = (amount: number): string => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0 đ';
  }
  return amount.toLocaleString('vi-VN') + ' đ';
};

export const parseApiDate = (dateVal?: string | number | Date | null): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return Number.isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(dateVal).trim();
  if (!str) return null;
  // If ISO date-time string without timezone (e.g. "2026-11-23T15:00:59" from backend UTC),
  // append 'Z' so JS Date parses it as UTC and automatically converts to client's local timezone.
  const normalized = str.includes('T') && !str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)
    ? `${str}Z`
    : str;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDateTime = (dateStr?: string | number | Date | null): string => {
  if (!dateStr) return '';
  const d = parseApiDate(dateStr);
  if (!d) return String(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
};

export const composeAddress = (components?: AddressComponents | { address?: string } | null): string => {
  if (!components) return '';
  if (typeof components === 'string') return components;
  if ('address' in components && components.address) {
    return components.address;
  }
  const { street, ward, district, province } = components as AddressComponents;
  return [street, ward, district, province]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(', ');
};

export const isValidOrderNote = (note?: string | null): boolean => {
  if (!note) return true;
  return note.trim().length <= 500;
};
