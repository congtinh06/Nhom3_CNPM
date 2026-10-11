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

export const formatDateTime = (dateStr?: string | number | Date | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
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
