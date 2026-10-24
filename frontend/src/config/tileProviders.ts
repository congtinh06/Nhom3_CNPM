import L from 'leaflet';

export interface TileProviderConfig {
  key: string;
  name: string;
  url: string;
  subdomains?: string[] | string;
  maxZoom?: number;
  attribution: string;
  referrerPolicy: L.ReferrerPolicy | boolean;
}

export const KNOWN_TILE_PROVIDERS = {
  google: {
    key: 'google',
    name: 'Google Maps',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution:
      'Map data &copy; <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Google Maps</a>',
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
  },
  osm: {
    key: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
  },
  hot: {
    key: 'hot',
    name: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noopener noreferrer">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank" rel="noopener noreferrer">OpenStreetMap France</a>',
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
  },
  opentopo: {
    key: 'opentopo',
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC-BY-SA</a>)',
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
  },
};

export type KnownTileProviderKey = keyof typeof KNOWN_TILE_PROVIDERS;

export const DEFAULT_PROVIDERS_ORDER = 'google,osm,hot,opentopo';

export const getTileProviders = (customEnvOrder?: string): TileProviderConfig[] => {
  const rawOrder = customEnvOrder ?? (import.meta.env.VITE_TILE_PROVIDERS || DEFAULT_PROVIDERS_ORDER);
  const keys: string[] = rawOrder
    .split(',')
    .map((k: string) => k.trim().toLowerCase())
    .filter(Boolean);

  const matched: TileProviderConfig[] = [];
  for (const key of keys) {
    if (key in KNOWN_TILE_PROVIDERS) {
      matched.push(KNOWN_TILE_PROVIDERS[key as KnownTileProviderKey]);
    }
  }

  return matched.length > 0 ? matched : [KNOWN_TILE_PROVIDERS.osm];
};

export const TILE_PROVIDERS: TileProviderConfig[] = getTileProviders();

export const STORAGE_KEY_WORKING_PROVIDER = 'echora_working_tile_provider';

export const getInitialProviderIndex = (providers: TileProviderConfig[]): number => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedKey = window.sessionStorage.getItem(STORAGE_KEY_WORKING_PROVIDER);
      if (storedKey) {
        const foundIndex = providers.findIndex((p) => p.key === storedKey);
        if (foundIndex !== -1) {
          return foundIndex;
        }
      }
    }
  } catch {
    // sessionStorage may throw under security sandbox or private browsing
  }
  return 0;
};

export const saveWorkingProvider = (providerKey: string): void => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY_WORKING_PROVIDER, providerKey);
    }
  } catch {
    // ignore storage exceptions
  }
};
