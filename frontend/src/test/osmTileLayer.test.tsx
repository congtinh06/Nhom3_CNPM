import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import L from 'leaflet';
import {
  OsmTileLayer,
  TILE_PROVIDERS,
  KNOWN_TILE_PROVIDERS,
  getTileProviders,
  getInitialProviderIndex,
  saveWorkingProvider,
  STORAGE_KEY_WORKING_PROVIDER,
} from '../components/nearby/PoiMap';

// Mock react-leaflet's useMap hook to control and inspect the Leaflet map instance
const mockMapInstances = new Map<string, any>();

vi.mock('react-leaflet', () => ({
  useMap: () => mockMapInstances.get('current'),
}));

describe('Tile Provider Failover Chain & Lifecycle', () => {
  let map: any;
  let addedLayers: Set<L.TileLayer>;
  let setPrefixSpy: any;

  beforeEach(() => {
    addedLayers = new Set<L.TileLayer>();
    setPrefixSpy = vi.fn();

    map = {
      attributionControl: {
        setPrefix: setPrefixSpy,
      },
      addLayer: vi.fn((layer: L.TileLayer) => {
        addedLayers.add(layer);
      }),
      removeLayer: vi.fn((layer: L.TileLayer) => {
        addedLayers.delete(layer);
      }),
      hasLayer: vi.fn((layer: L.TileLayer) => addedLayers.has(layer)),
      eachLayer: vi.fn((fn: (layer: any) => void) => {
        addedLayers.forEach(fn);
      }),
    };

    mockMapInstances.set('current', map);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('parses chain order from env and configures all provider attributes and links', () => {
    // 1. Default chain: google, osm, hot, opentopo
    const defaultChain = getTileProviders();
    expect(defaultChain.map((p) => p.key)).toEqual(['google', 'osm', 'hot', 'opentopo']);

    // 2. Custom chain from env parameter
    const customChain = getTileProviders('opentopo, hot');
    expect(customChain.map((p) => p.key)).toEqual(['opentopo', 'hot']);

    // 3. Provider details: Google Maps
    const google = KNOWN_TILE_PROVIDERS.google;
    expect(google.url).toBe('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}');
    expect(google.subdomains).toEqual(['mt0', 'mt1', 'mt2', 'mt3']);
    expect(google.maxZoom).toBe(20);
    expect(google.attribution).toContain('Google Maps');
    expect(google.referrerPolicy).toBe('strict-origin-when-cross-origin');

    // 4. Provider details: OSM
    const osm = KNOWN_TILE_PROVIDERS.osm;
    expect(osm.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(osm.maxZoom).toBe(19);
    expect(osm.attribution).toContain('OpenStreetMap');
    expect(osm.attribution).toContain('https://www.openstreetmap.org/copyright');
    expect(osm.referrerPolicy).toBe('strict-origin-when-cross-origin');

    // 5. Provider details: HOT (Humanitarian)
    const hot = KNOWN_TILE_PROVIDERS.hot;
    expect(hot.url).toBe('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png');
    expect(hot.subdomains).toEqual(['a', 'b', 'c']);
    expect(hot.maxZoom).toBe(19);
    expect(hot.attribution).toContain('Humanitarian OpenStreetMap Team');
    expect(hot.attribution).toContain('OpenStreetMap France');
    expect(hot.referrerPolicy).toBe('strict-origin-when-cross-origin');

    // 6. Provider details: OpenTopoMap
    const opentopo = KNOWN_TILE_PROVIDERS.opentopo;
    expect(opentopo.url).toBe('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png');
    expect(opentopo.subdomains).toEqual(['a', 'b', 'c']);
    expect(opentopo.maxZoom).toBe(17);
    expect(opentopo.attribution).toContain('OpenTopoMap');
    expect(opentopo.attribution).toContain('SRTM');
    expect(opentopo.referrerPolicy).toBe('strict-origin-when-cross-origin');
  });

  it('guarantees mount-unmount-mount under React StrictMode leaves exactly ONE tile layer', () => {
    const tileLayerRef = { current: null as L.TileLayer | null };

    const { unmount } = render(
      <React.StrictMode>
        <OsmTileLayer
          isSchematic={false}
          onEnterSchematic={vi.fn()}
          onExitSchematic={vi.fn()}
          retryTrigger={0}
          tileLayerRef={tileLayerRef}
        />
      </React.StrictMode>
    );

    expect(addedLayers.size).toBe(1);
    expect(tileLayerRef.current).not.toBeNull();
    expect(map.hasLayer(tileLayerRef.current!)).toBe(true);

    let tileLayerCount = 0;
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        tileLayerCount += 1;
      }
    });
    expect(tileLayerCount).toBe(1);

    unmount();
    expect(addedLayers.size).toBe(0);
    expect(tileLayerRef.current).toBeNull();
  });

  it('fails over to next provider after 3 consecutive errors and leaves exactly one layer after each switch', () => {
    const onEnterSchematic = vi.fn();
    const onExitSchematic = vi.fn();
    const tileLayerRef = { current: null as L.TileLayer | null };

    render(
      <OsmTileLayer
        isSchematic={false}
        onEnterSchematic={onEnterSchematic}
        onExitSchematic={onExitSchematic}
        retryTrigger={0}
        tileLayerRef={tileLayerRef}
      />
    );

    // Initial provider: google
    let activeLayer = tileLayerRef.current!;
    expect((activeLayer as any)._url).toBe(KNOWN_TILE_PROVIDERS.google.url);
    expect(addedLayers.size).toBe(1);

    // 1st and 2nd errors on google: no switch
    act(() => {
      activeLayer.fire('tileerror', { tile: { src: 'https://mt0.google.com/vt/lyrs=m&x=1&y=1&z=15' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://mt1.google.com/vt/lyrs=m&x=1&y=2&z=15' } });
    });
    expect((tileLayerRef.current as any)._url).toBe(KNOWN_TILE_PROVIDERS.google.url);
    expect(onEnterSchematic).not.toHaveBeenCalled();

    // 3rd consecutive error: switches to provider 2 (osm)
    act(() => {
      activeLayer.fire('tileerror', { tile: { src: 'https://mt2.google.com/vt/lyrs=m&x=1&y=3&z=15' } });
    });
    expect(addedLayers.size).toBe(1);
    activeLayer = tileLayerRef.current!;
    expect((activeLayer as any)._url).toBe(KNOWN_TILE_PROVIDERS.osm.url);
    expect(onEnterSchematic).not.toHaveBeenCalled();

    // 3 consecutive errors on osm: switches to provider 3 (hot)
    act(() => {
      activeLayer.fire('tileerror', { tile: { src: 'https://tile.openstreetmap.org/15/1/1.png' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://tile.openstreetmap.org/15/1/2.png' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://tile.openstreetmap.org/15/1/3.png' } });
    });
    expect(addedLayers.size).toBe(1);
    activeLayer = tileLayerRef.current!;
    expect((activeLayer as any)._url).toBe(KNOWN_TILE_PROVIDERS.hot.url);
    expect(onEnterSchematic).not.toHaveBeenCalled();

    // 3 consecutive errors on hot: switches to provider 4 (opentopo)
    act(() => {
      activeLayer.fire('tileerror', { tile: { src: 'https://a.tile.openstreetmap.fr/hot/15/1/1.png' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://a.tile.openstreetmap.fr/hot/15/1/2.png' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://a.tile.openstreetmap.fr/hot/15/1/3.png' } });
    });
    expect(addedLayers.size).toBe(1);
    activeLayer = tileLayerRef.current!;
    expect((activeLayer as any)._url).toBe(KNOWN_TILE_PROVIDERS.opentopo.url);
    expect(onEnterSchematic).not.toHaveBeenCalled();

    // 3 consecutive errors on opentopo (end of chain): enters schematic state
    act(() => {
      activeLayer.fire('tileerror', { tile: { src: 'https://a.tile.opentopomap.org/15/1/1.png' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://a.tile.opentopomap.org/15/1/2.png' } });
      activeLayer.fire('tileerror', { tile: { src: 'https://a.tile.opentopomap.org/15/1/3.png' } });
    });
    expect(onEnterSchematic).toHaveBeenCalledTimes(1);
  });

  it('resets error counter and saves working provider to sessionStorage on tileload', () => {
    const onEnterSchematic = vi.fn();
    const onExitSchematic = vi.fn();
    const tileLayerRef = { current: null as L.TileLayer | null };

    render(
      <OsmTileLayer
        isSchematic={false}
        onEnterSchematic={onEnterSchematic}
        onExitSchematic={onExitSchematic}
        retryTrigger={0}
        tileLayerRef={tileLayerRef}
      />
    );

    const layer = tileLayerRef.current!;
    expect((layer as any)._url).toBe(KNOWN_TILE_PROVIDERS.google.url);

    // 2 errors occur
    act(() => {
      layer.fire('tileerror', { tile: { src: 'https://mt0.google.com/vt/lyrs=m&x=1&y=1&z=15' } });
      layer.fire('tileerror', { tile: { src: 'https://mt1.google.com/vt/lyrs=m&x=1&y=2&z=15' } });
    });
    expect((tileLayerRef.current as any)._url).toBe(KNOWN_TILE_PROVIDERS.google.url);

    // Successful tileload resets counter and saves provider
    act(() => {
      layer.fire('tileload');
    });
    expect(onExitSchematic).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(STORAGE_KEY_WORKING_PROVIDER)).toBe('google');

    // Next single error does NOT switch because counter was reset to 0
    act(() => {
      layer.fire('tileerror', { tile: { src: 'https://mt2.google.com/vt/lyrs=m&x=1&y=3&z=15' } });
    });
    expect((tileLayerRef.current as any)._url).toBe(KNOWN_TILE_PROVIDERS.google.url);
  });

  it('remembers last working provider in sessionStorage and starts from it on next visit', () => {
    // Simulate previous visit where "hot" worked
    saveWorkingProvider('hot');
    expect(getInitialProviderIndex(TILE_PROVIDERS)).toBe(2);

    const tileLayerRef = { current: null as L.TileLayer | null };

    render(
      <OsmTileLayer
        isSchematic={false}
        onEnterSchematic={vi.fn()}
        onExitSchematic={vi.fn()}
        retryTrigger={0}
        tileLayerRef={tileLayerRef}
      />
    );

    // Starts directly with hot provider
    expect((tileLayerRef.current as any)._url).toBe(KNOWN_TILE_PROVIDERS.hot.url);
  });

  it('restarts the chain from the first provider when user clicks retry ("Thử lại")', () => {
    const tileLayerRef = { current: null as L.TileLayer | null };

    const { rerender } = render(
      <OsmTileLayer
        isSchematic={false}
        onEnterSchematic={vi.fn()}
        onExitSchematic={vi.fn()}
        retryTrigger={0}
        tileLayerRef={tileLayerRef}
      />
    );

    // Cause failover to osm
    act(() => {
      tileLayerRef.current!.fire('tileerror', { tile: { src: 'https://mt0.google.com/vt/lyrs=m&x=1&y=1&z=15' } });
      tileLayerRef.current!.fire('tileerror', { tile: { src: 'https://mt1.google.com/vt/lyrs=m&x=1&y=2&z=15' } });
      tileLayerRef.current!.fire('tileerror', { tile: { src: 'https://mt2.google.com/vt/lyrs=m&x=1&y=3&z=15' } });
    });
    expect((tileLayerRef.current as any)._url).toBe(KNOWN_TILE_PROVIDERS.osm.url);

    // User clicks "Thử lại" (retryTrigger increments)
    rerender(
      <OsmTileLayer
        isSchematic={false}
        onEnterSchematic={vi.fn()}
        onExitSchematic={vi.fn()}
        retryTrigger={1}
        tileLayerRef={tileLayerRef}
      />
    );

    // Restarts from first provider (google)
    expect((tileLayerRef.current as any)._url).toBe(KNOWN_TILE_PROVIDERS.google.url);
    expect(addedLayers.size).toBe(1);
  });
});
