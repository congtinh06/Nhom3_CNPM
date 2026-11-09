import { useState, useEffect, useRef, useCallback } from 'react';
import { GeoPoi } from '../pages/NearbyPage';

export interface PositionState {
  lat: number;
  lng: number;
  accuracy?: number;
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
  isLoading?: boolean;
  lastManualStoppedId?: string | null;
  lastManualStopTime?: number;
  playPoi: (poiId: string, isAuto?: boolean) => void;
  stopAllAudio?: () => void;
  gpsErrorMessage: string;
  gpsErrorDeniedText?: string;
  gpsErrorUnavailableText?: string;
  gpsErrorTimeoutText?: string;
  gpsErrorNotSupportedText?: string;
  gpsErrorInsecureText?: string;
}

export function useAutoNarration({
  pois,
  isAutoEnabled,
  currentPlayingId,
  isPlaying,
  isLoading = false,
  lastManualStoppedId = null,
  lastManualStopTime = 0,
  playPoi,
  gpsErrorMessage,
  gpsErrorDeniedText,
  gpsErrorUnavailableText,
  gpsErrorTimeoutText,
  gpsErrorNotSupportedText,
  gpsErrorInsecureText,
}: UseAutoNarrationProps) {
  const [userPos, setUserPos] = useState<PositionState | null>(null);
  const [gpsError, setGpsError] = useState<string>('');
  const [isRequestingGps, setIsRequestingGps] = useState(false);

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
    if (!isPlaying && !isLoading && queueRef.current.length > 0) {
      const nextId = queueRef.current.shift();
      if (nextId) {
        // Guard against auto-popping a stop that the user just stopped manually
        if (
          lastManualStoppedId === nextId &&
          lastManualStopTime &&
          Date.now() - lastManualStopTime < 5000
        ) {
          queueRef.current = [];
          return;
        }
        playPoi(nextId, true);
      }
    }
  }, [isPlaying, isLoading, lastManualStoppedId, lastManualStopTime, playPoi]);

  // Check if position triggers any POI
  const checkAutoTrigger = useCallback(
    (lat: number, lng: number) => {
      if (!isAutoRef.current) return;
      // Never start while any playback is active or loading
      if (isPlaying || isLoading) return;

      const triggerHits = pois
        .map((p) => {
          return {
            poi: p,
            dist: haversine(lat, lng, p.lat, p.lng),
            radius: p.triggerRadius ?? 50,
          };  
        })
        .filter((item) => {
          const alreadyPlayed = autoPlayedSetRef.current.has(item.poi.id);
          return item.dist <= item.radius && !alreadyPlayed;
        })
        .sort((a, b) => a.dist - b.dist);

      if (triggerHits.length > 0) {
        const hit = triggerHits[0];
        if (hit) {
          // Never start the same stop that is already playing
          if (currentPlayingId === hit.poi.id) return;
          
          // Never start a stop that was just stopped manually by the user within 5000ms guard window
          if (
            lastManualStoppedId === hit.poi.id &&
            lastManualStopTime &&
            Date.now() - lastManualStopTime < 5000
          ) {
            return;
          }
          autoPlayedSetRef.current.add(hit.poi.id);
          playPoi(hit.poi.id, true);
        }
      }
      
    },
    [
      pois,
      isPlaying,
      isLoading,
      currentPlayingId,
      lastManualStoppedId,
      lastManualStopTime,
      playPoi,
    ]
  );

  // Unified pipeline to apply position
  const applyPosition = useCallback(
    (lat: number, lng: number, accuracy?: number) => {
      setUserPos({
        lat,
        lng,
        ...(typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy > 0
          ? { accuracy }
          : {}),
      });
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
      setGpsError(
        gpsErrorNotSupportedText || 'Thiết bị hoặc trình duyệt không hỗ trợ định vị GPS.'
      );
      return;
    }

    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setGpsError(gpsErrorInsecureText || 'Định vị GPS yêu cầu kết nối bảo mật HTTPS.');
      return;
    }

    setIsRequestingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsRequestingGps(false);
        applyPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        setIsRequestingGps(false);
        let msg = gpsErrorMessage;
        if (err.code === 1) {
          msg =
            gpsErrorDeniedText ||
            'Quyền truy cập vị trí đã bị từ chối. Bạn vẫn có thể bấm nghe thủ công bình thường.';
        } else if (err.code === 2) {
          msg =
            gpsErrorUnavailableText || 'Không xác định được vị trí GPS. Vui lòng thử lại sau.';
        } else if (err.code === 3) {
          msg = gpsErrorTimeoutText || 'Hết thời gian chờ lấy vị trí GPS.';
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [
    applyPosition,
    gpsErrorMessage,
    gpsErrorDeniedText,
    gpsErrorUnavailableText,
    gpsErrorTimeoutText,
    gpsErrorNotSupportedText,
    gpsErrorInsecureText,
  ]);

  // Keep watching position if auto is enabled and user has real GPS
  const hasUserPos = userPos !== null;
  useEffect(() => {
    if (isAutoEnabled && hasUserPos && navigator.geolocation) {
      clearGpsWatch();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          applyPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        (err) => {
          if (err.code === 1) {
            setGpsError(gpsErrorDeniedText || 'Quyền truy cập GPS bị từ chối.');
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
  }, [isAutoEnabled, hasUserPos, applyPosition, clearGpsWatch, gpsErrorDeniedText]);

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
    isRequestingGps,
    applyPosition,
    requestGps,
    checkAutoTrigger,
    setAutoDirect,
    autoPlayedSetRef,
  };
}
