import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  TileProviderConfig,
  TILE_PROVIDERS,
  KNOWN_TILE_PROVIDERS,
  saveWorkingProvider,
  getInitialProviderIndex,
} from '../../config/tileProviders';

export interface OsmTileLayerProps {
  isSchematic: boolean;
  onEnterSchematic: () => void;
  onExitSchematic: () => void;
  retryTrigger: number;
  tileLayerRef?: React.MutableRefObject<L.TileLayer | null>;
  providers?: TileProviderConfig[];
}

export const OsmTileLayer: React.FC<OsmTileLayerProps> = ({
  isSchematic: _isSchematic,
  onEnterSchematic,
  onExitSchematic,
  retryTrigger,
  tileLayerRef: externalTileLayerRef,
  providers: customProviders,
}) => {
  const map = useMap();
  const internalTileLayerRef = useRef<L.TileLayer | null>(null);
  const tileLayerRef = externalTileLayerRef || internalTileLayerRef;
  const providers = customProviders && customProviders.length > 0 ? customProviders : TILE_PROVIDERS;

  const [providerIndex, setProviderIndex] = useState<number>(() =>
    getInitialProviderIndex(providers)
  );
  const consecutiveErrorsRef = useRef<number>(0);
  const lastRetryRef = useRef<number>(retryTrigger);

  useEffect(() => {
    if (retryTrigger !== lastRetryRef.current) {
      lastRetryRef.current = retryTrigger;
      consecutiveErrorsRef.current = 0;
      setProviderIndex(0);
      onExitSchematic();
    }
  }, [retryTrigger, onExitSchematic]);

  useEffect(() => {
    const currentProvider: TileProviderConfig =
      providers[providerIndex] ?? providers[0] ?? KNOWN_TILE_PROVIDERS.osm;
    const layerOptions: L.TileLayerOptions = {
      maxZoom: currentProvider.maxZoom ?? 19,
      referrerPolicy: currentProvider.referrerPolicy,
      subdomains: currentProvider.subdomains ?? 'abc',
    };

    if (tileLayerRef.current) {
      tileLayerRef.current.off('tileerror');
      tileLayerRef.current.off('tileload');
      if (map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
      }
      tileLayerRef.current = null;
    }

    const layer = L.tileLayer(currentProvider.url, layerOptions);

    const handleTileError = (e: any) => {
      consecutiveErrorsRef.current += 1;
      const tileSrc = e?.tile?.src || e?.url || '';

      if (import.meta.env.DEV) {
        console.warn('[PoiMap DEV Diagnostic] Tile error event:', {
          provider: currentProvider.key,
          tileSrc,
          onLine: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
          consecutiveErrors: consecutiveErrorsRef.current,
        });
      }

      if (consecutiveErrorsRef.current >= 3) {
        const nextIndex = providerIndex + 1;
        const nextProvider = providers[nextIndex];
        if (nextIndex < providers.length && nextProvider) {
          consecutiveErrorsRef.current = 0;
          setProviderIndex(nextIndex);
        } else {
          onEnterSchematic();
        }
      }
    };

    const handleTileLoad = () => {
      consecutiveErrorsRef.current = 0;
      saveWorkingProvider(currentProvider.key);
      onExitSchematic();
    };

    layer.on('tileerror', handleTileError);
    layer.on('tileload', handleTileLoad);

    layer.addTo(map);
    tileLayerRef.current = layer;

    return () => {
      if (tileLayerRef.current) {
        tileLayerRef.current.off('tileerror', handleTileError);
        tileLayerRef.current.off('tileload', handleTileLoad);
        if (map.hasLayer(tileLayerRef.current)) {
          map.removeLayer(tileLayerRef.current);
        }
        tileLayerRef.current = null;
      }
    };
  }, [map, providerIndex, retryTrigger, providers, onEnterSchematic, onExitSchematic]);

  return null;
};

