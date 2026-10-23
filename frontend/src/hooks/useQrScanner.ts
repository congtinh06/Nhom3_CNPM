import { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import qrScannerWorkerUrl from 'qr-scanner/qr-scanner-worker.min.js?url';

QrScanner.WORKER_PATH = qrScannerWorkerUrl;

interface UseQrScannerOptions {
  onScan: (value: string) => void;
  enabled?: boolean;
}

interface UseQrScannerResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  active: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

export function useQrScanner({ onScan, enabled = true }: UseQrScannerOptions): UseQrScannerResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: '', at: 0 });

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onScanRef.current = onScan;

  const stop = useCallback(() => {
    scannerRef.current?.stop();
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }
    setError(null);
    if (!scannerRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          const now = Date.now();
          if (
            result.data === lastScanRef.current.value &&
            now - lastScanRef.current.at < 2500
          ) {
            return;
          }
          lastScanRef.current = { value: result.data, at: now };
          onScanRef.current(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 8,
          returnDetailedScanResult: true,
        }
      );
    }

    try {
      await scannerRef.current.start();
      setActive(true);
    } catch {
      setError('camera');
      setActive(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void start();
    } else {
      stop();
    }
  }, [enabled, start, stop]);

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, []);

  return { videoRef, active, error, start, stop };
}
