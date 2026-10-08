import { useState, useEffect, useRef, useCallback } from 'react';
import { GeoPoi } from '../pages/NearbyPage';

export interface PositionState {
  lat: number;
  lng: number;
  label: string;
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDist(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

interface UseAutoNarrationProps {
  pois: GeoPoi[];
  isAutoEnabled: boolean;
  currentPlayingId: string | null;
  isPlaying: boolean;
  playPoi: (poiId: string, isAuto?: boolean) => void;
  gpsErrorMessage: string;
}

export function useAutoNarration({
  pois,
  isAutoEnabled,
  currentPlayingId,
  isPlaying,
  playPoi,
  gpsErrorMessage,
}: UseAutoNarrationProps) {
  const [userPos, setUserPos] = useState<PositionState | null>(null);
  const [gpsError, setGpsError] = useState<string>('');

  const autoPlayedSetRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<string[]>([]);
  const isAutoRef = useRef<boolean>(isAutoEnabled);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    isAutoRef.current = isAutoEnabled;
  }, [isAutoEnabled]);

  const setAutoDirect = useCallback((val: boolean) => {
    isAutoRef.current = val;
  }, []);

  // When playing finishes and queue is not empty, pop the next POI
  useEffect(() => {
    if (!isPlaying && queueRef.current.length > 0) {
      const nextId = queueRef.current.shift();
      if (nextId) {
        playPoi(nextId, true);
      }
    }
  }, [isPlaying, playPoi]);

  // Check if position triggers any POI
  const checkAutoTrigger = useCallback(
    (lat: number, lng: number) => {
      if (!isAutoRef.current) return;

      const triggerHits = pois
        .map((p) => ({
          poi: p,
          dist: haversine(lat, lng, p.lat, p.lng),
        }))
        .filter((item) => {
          const alreadyPlayed = autoPlayedSetRef.current.has(item.poi.id);
          return item.dist <= item.poi.triggerRadius && !alreadyPlayed;
        })
        .sort((a, b) => a.dist - b.dist);

      if (triggerHits.length > 0) {
        const hit = triggerHits[0];
        if (hit) {
          autoPlayedSetRef.current.add(hit.poi.id);

          if (isPlaying && currentPlayingId !== hit.poi.id) {
            if (!queueRef.current.includes(hit.poi.id)) {
              queueRef.current.push(hit.poi.id);
            }
          } else {
            playPoi(hit.poi.id, true);
          }
        }
      }
    },
    [pois, isPlaying, currentPlayingId, playPoi]
  );

  // Unified pipeline to apply position
  const applyPosition = useCallback(
    (lat: number, lng: number, label: string) => {
      setUserPos({ lat, lng, label });
      setGpsError('');
      checkAutoTrigger(lat, lng);
    },
    [checkAutoTrigger]
  );

  // Clear GPS watcher
  const clearGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Request single GPS position
  const requestGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Thiết bị hoặc trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setGpsError('Định vị GPS yêu cầu kết nối bảo mật HTTPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(pos.coords.latitude, pos.coords.longitude, 'Vị trí GPS');
      },
      (err) => {
        let msg = gpsErrorMessage;
        if (err.code === 1) {
          msg = 'Quyền truy cập vị trí đã bị từ chối. Bạn vẫn có thể bấm nghe thủ công bình thường.';
        } else if (err.code === 2) {
          msg = 'Không xác định được vị trí GPS. Vui lòng thử lại sau.';
        } else if (err.code === 3) {
          msg = 'Hết thời gian chờ lấy vị trí GPS.';
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [applyPosition, gpsErrorMessage]);

  // Keep watching position if auto is enabled and user has real GPS
  useEffect(() => {
    if (isAutoEnabled && userPos?.label === 'Vị trí GPS' && navigator.geolocation) {
      clearGpsWatch();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          applyPosition(pos.coords.latitude, pos.coords.longitude, 'Vị trí GPS');
        },
        (err) => {
          if (err.code === 1) {
            setGpsError('Quyền truy cập GPS bị từ chối.');
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    } else {
      clearGpsWatch();
    }

    return () => {
      clearGpsWatch();
    };
  }, [isAutoEnabled, userPos?.label, applyPosition, clearGpsWatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearGpsWatch();
    };
  }, [clearGpsWatch]);

  return {
    userPos,
    gpsError,
    setGpsError,
    applyPosition,
    requestGps,
    checkAutoTrigger,
    setAutoDirect,
    autoPlayedSetRef,
  };
}
