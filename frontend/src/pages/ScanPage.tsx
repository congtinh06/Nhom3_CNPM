import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Pause, Volume2 } from 'lucide-react';
import { api } from '../api/client';
import { normalizeApiError } from '../api/errors';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { PoiDetail, SupportedLanguage } from '../types';

export const ScanPage: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();

  const [inputToken, setInputToken] = useState(token || '');
  const [poiDetail, setPoiDetail] = useState<PoiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [lang, setLang] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('sv:lang');
      if (saved && ['vi', 'en', 'ja', 'ko'].includes(saved)) {
        return saved as SupportedLanguage;
      }
    } catch {
      // Ignore
    }
    return 'vi';
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

  const handleResolveQr = useCallback(
    (qrTokenToResolve: string) => {
      const trimmed = qrTokenToResolve.trim();
      if (!trimmed) return;

      setLoading(true);
      setErrorMessage(null);

      api
        .getPoiByQr(trimmed, lang)
        .then((detail) => {
          setPoiDetail(detail);
          playAudio({
            poiId: detail.id,
            audioUrl: detail.audioUrl,
            audioStatus: detail.audioStatus,
            title: detail.title || detail.name,
            textToSpeak: detail.description || detail.summary,
            lang,
          });
        })
        .catch((err: unknown) => {
          const norm = normalizeApiError(err);
          if (norm.status === 404) {
            setErrorMessage('Không tìm thấy mã QR này.');
          } else {
            setErrorMessage(norm.message);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [lang, playAudio]
  );

  useEffect(() => {
    if (token) {
      handleResolveQr(token);
    }
  }, [token, handleResolveQr]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      stopAudio();
    };
  }, [stopCamera, stopAudio]);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Trình duyệt không hỗ trợ truy cập máy ảnh (cần chạy trên HTTPS hoặc localhost).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      const hasBarcodeDetector = 'BarcodeDetector' in window;
      if (hasBarcodeDetector) {
        interface Detector {
          detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
        }
        const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => Detector }).BarcodeDetector;
        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });

        const interval = setInterval(async () => {
          if (!streamRef.current || !videoRef.current) {
            clearInterval(interval);
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0]?.rawValue) {
              clearInterval(interval);
              stopCamera();
              const val = barcodes[0].rawValue;
              const extracted = val.includes('/qr/') ? val.split('/qr/')[1]?.split('?')[0] : val;
              if (extracted) {
                setInputToken(extracted);
                handleResolveQr(extracted);
              }
            }
          } catch {
            // Processing frame
          }
        }, 500);
      }
    } catch {
      setCameraError('Không thể mở máy ảnh. Vui lòng cấp quyền truy cập hoặc nhập mã bằng tay.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim()) {
      handleResolveQr(inputToken.trim());
    }
  };

  return (
    <section className="s sp" style={{ minHeight: '60vh', marginTop: 80 }}>
      <h2>Quét mã QR</h2>
      <p style={{ marginBottom: 16 }}>
        Nhập mã QR của điểm du lịch hoặc sử dụng máy ảnh để quét mã trực tiếp. (Lưu ý: Camera và GPS yêu cầu HTTPS hoặc localhost).
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Nhập mã QR (ví dụ: DINH_DOC_LAP_VI)..."
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          style={{ flex: '1 1 240px', padding: '10px 14px', border: '2px solid var(--brown)', borderRadius: 999 }}
        />
        <button type="submit" className="tb" disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tra cứu mã'}
        </button>
        <button
          type="button"
          className="tb"
          onClick={cameraActive ? stopCamera : startCamera}
        >
          <Camera size={15} strokeWidth={1.75} aria-hidden="true" />
          {cameraActive ? 'Tắt camera' : 'Bật camera'}
        </button>
      </form>

      {cameraError && (
        <p style={{ color: '#c0392b', marginBottom: 12 }}>{cameraError}</p>
      )}

      {cameraActive && (
        <div style={{ maxWidth: 400, margin: '16px 0', border: '2px solid var(--brown)', borderRadius: 14, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: 'auto', display: 'block' }} muted playsInline />
          <p style={{ padding: 8, fontSize: 13, textAlign: 'center', background: 'var(--cream)', color: 'var(--ink)' }}>
            Đang quét mã QR từ camera...
          </p>
        </div>
      )}

      {loading && <p className="cn">Đang tải thông tin điểm du lịch từ mã QR...</p>}

      {errorMessage && (
        <div style={{ margin: '16px 0', padding: 16, background: '#fcebe6', border: '1px solid #c0392b', borderRadius: 12 }}>
          <p style={{ color: '#c0392b' }}>{errorMessage}</p>
        </div>
      )}

      {poiDetail && (
        <div style={{ marginTop: 24, padding: 20, border: '2px solid #e7dcc6', borderRadius: 14, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, color: 'var(--brown)', fontSize: 24 }}>
              {poiDetail.title || poiDetail.name}
            </h3>

            <div style={{ display: 'flex', gap: 4 }}>
              {(['vi', 'en', 'ja', 'ko'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className="tb"
                  style={{
                    padding: '3px 8px',
                    fontSize: 12,
                    background: lang === l ? 'var(--brown)' : 'transparent',
                    color: lang === l ? 'var(--cream)' : 'var(--brown)',
                  }}
                  aria-pressed={lang === l}
                  onClick={() => {
                    setLang(l);
                    if (poiDetail.qrToken) {
                      api.getPoiByQr(poiDetail.qrToken, l).then(setPoiDetail);
                    }
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <p style={{ marginTop: 12 }}>{poiDetail.description || poiDetail.summary}</p>
          {poiDetail.address && <p style={{ fontSize: 13, color: '#666' }}>Địa chỉ: {poiDetail.address}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              className="tb"
              aria-pressed={isPlaying(poiDetail.id)}
              onClick={() => {
                playAudio({
                  poiId: poiDetail.id,
                  audioUrl: poiDetail.audioUrl,
                  audioStatus: poiDetail.audioStatus,
                  title: poiDetail.title || poiDetail.name,
                  textToSpeak: poiDetail.description || poiDetail.summary,
                  lang,
                });
              }}
            >
              {isPlaying(poiDetail.id) ? (
                <>
                  <Pause size={15} strokeWidth={1.75} aria-hidden="true" />
                  Dừng thuyết minh
                </>
              ) : (
                <>
                  <Volume2 size={15} strokeWidth={1.75} aria-hidden="true" />
                  Nghe thuyết minh
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <p style={{ marginTop: 24 }}>
        <button
          type="button"
          className="tb"
          onClick={() => navigate('/')}
        >
          ← Về trang chủ
        </button>
      </p>
    </section>
  );
};
