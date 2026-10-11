// TODO: Migrate to 2-level administrative structure (Tinh/Phuong) as of 2025-07-01
import { VN_ALL_63_PROVINCES, VN_MAJOR_PROVINCES } from '../data/vn-address';

export interface AddressItem {
  code: string;
  name: string;
}

interface ApiProvinceItem {
  code: number;
  name: string;
}

interface ApiDistrictItem {
  code: number;
  name: string;
}

interface ApiWardItem {
  code: number;
  name: string;
}

interface ApiProvinceDetail {
  code: number;
  name: string;
  districts: ApiDistrictItem[];
}

interface ApiDistrictDetail {
  code: number;
  name: string;
  wards: ApiWardItem[];
}

const memoryCache = {
  provinces: null as AddressItem[] | null,
  districts: new Map<string, AddressItem[]>(),
  wards: new Map<string, AddressItem[]>(),
};

const API_BASE = 'https://provinces.open-api.vn/api';

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Fetch all 63 provinces/cities across all Vietnam
 */
export async function getAllProvinces(): Promise<AddressItem[]> {
  if (memoryCache.provinces && memoryCache.provinces.length > 0) {
    return memoryCache.provinces;
  }

  // Check localStorage cache
  try {
    const local = localStorage.getItem('sv:vn_provinces');
    if (local) {
      const parsed = JSON.parse(local) as AddressItem[];
      if (Array.isArray(parsed) && parsed.length >= 63) {
        memoryCache.provinces = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }

  // Fetch from Vietnam Open-API
  try {
    const res = await fetchWithTimeout(`${API_BASE}/p/`);
    if (res.ok) {
      const data = (await res.json()) as ApiProvinceItem[];
      const list: AddressItem[] = data.map((p) => ({
        code: String(p.code),
        name: p.name,
      }));
      memoryCache.provinces = list;
      try {
        localStorage.setItem('sv:vn_provinces', JSON.stringify(list));
      } catch {
        // Ignore quota
      }
      return list;
    }
  } catch {
    // Fallback if offline / network error
  }

  // Static fallback: all 63 provinces
  memoryCache.provinces = VN_ALL_63_PROVINCES;
  return VN_ALL_63_PROVINCES;
}

/**
 * Fetch all districts of a province
 */
export async function getDistrictsByProvince(provinceCode: string): Promise<AddressItem[]> {
  if (!provinceCode) return [];

  if (memoryCache.districts.has(provinceCode)) {
    return memoryCache.districts.get(provinceCode)!;
  }

  // Check storage
  const storageKey = `sv:vn_districts_${provinceCode}`;
  try {
    const local = localStorage.getItem(storageKey);
    if (local) {
      const parsed = JSON.parse(local) as AddressItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.districts.set(provinceCode, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  // Fetch from Open-API
  try {
    const res = await fetchWithTimeout(`${API_BASE}/p/${encodeURIComponent(provinceCode)}?depth=2`);
    if (res.ok) {
      const data = (await res.json()) as ApiProvinceDetail;
      if (data && Array.isArray(data.districts)) {
        const list: AddressItem[] = data.districts.map((d) => ({
          code: String(d.code),
          name: d.name,
        }));
        memoryCache.districts.set(provinceCode, list);
        try {
          localStorage.setItem(storageKey, JSON.stringify(list));
        } catch {
          // Ignore
        }
        return list;
      }
    }
  } catch {
    // Fallback
  }

  // Local fallback from static data
  const fallbackProv = VN_MAJOR_PROVINCES.find(
    (p) => p.id === provinceCode || p.name.includes(provinceCode)
  );
  if (fallbackProv && fallbackProv.districts.length > 0) {
    const list: AddressItem[] = fallbackProv.districts.map((d) => ({
      code: d.id,
      name: d.name,
    }));
    memoryCache.districts.set(provinceCode, list);
    return list;
  }

  return [];
}

/**
 * Fetch all wards of a district
 */
export async function getWardsByDistrict(districtCode: string): Promise<AddressItem[]> {
  if (!districtCode) return [];

  if (memoryCache.wards.has(districtCode)) {
    return memoryCache.wards.get(districtCode)!;
  }

  // Check storage
  const storageKey = `sv:vn_wards_${districtCode}`;
  try {
    const local = localStorage.getItem(storageKey);
    if (local) {
      const parsed = JSON.parse(local) as AddressItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.wards.set(districtCode, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore
  }

  // Fetch from Open-API
  try {
    const res = await fetchWithTimeout(`${API_BASE}/d/${encodeURIComponent(districtCode)}?depth=2`);
    if (res.ok) {
      const data = (await res.json()) as ApiDistrictDetail;
      if (data && Array.isArray(data.wards)) {
        const list: AddressItem[] = data.wards.map((w) => ({
          code: String(w.code),
          name: w.name,
        }));
        memoryCache.wards.set(districtCode, list);
        try {
          localStorage.setItem(storageKey, JSON.stringify(list));
        } catch {
          // Ignore
        }
        return list;
      }
    }
  } catch {
    // Fallback
  }

  // Local fallback
  for (const prov of VN_MAJOR_PROVINCES) {
    const dist = prov.districts.find((d) => d.id === districtCode || d.name.includes(districtCode));
    if (dist && dist.wards.length > 0) {
      const list: AddressItem[] = dist.wards.map((w) => ({
        code: w.id,
        name: w.name,
      }));
      memoryCache.wards.set(districtCode, list);
      return list;
    }
  }

  return [];
}
