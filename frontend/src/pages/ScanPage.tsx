import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Pause, Volume2, ChevronLeft } from 'lucide-react';
import { api } from '../api/client';
import { normalizeApiError } from '../api/errors';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { unlockAudio } from '../lib/audioUnlock';
import { PoiDetail, SupportedLanguage } from '../types';
import '../styles/scan.css';

// Scan detail text is translated per language, so on-device speech is offered for
// every supported language (unlike the map section, which only speaks Vietnamese).
const SCAN_SPEECH_LANGS: SupportedLanguage[] = ['vi', 'en', 'ja', 'ko'];

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
  const [pendingPlay, setPendingPlay] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

  const handleResolveQr = useCallback(
    (qrTokenToResolve: string, options?: { auto?: boolean }) => {
      const trimmed = qrTokenToResolve.trim();
      if (!trimmed) return;
      const isAuto = options?.auto ?? false;

      setLoading(true);
      setErrorMessage(null);

      api
        .getPoiByQr(trimmed, lang)
        .then((detail) => {
          setPoiDetail(detail);
          setExpanded(false);
          setImgError(false);
          if (isAuto) {
            // Resolved after an await, so browsers block autoplay (no user gesture).
            // Prompt with an explicit button instead of playing silently.
            setPendingPlay(true);
            return;
          }
          unlockAudio();
          setPendingPlay(false);
          playAudio({
            poiId: detail.id,
            audioUrl: detail.audioUrl,
            audioStatus: detail.audioStatus,
            title: detail.title || detail.name,
            textToSpeak: detail.description || detail.summary,
            lang,
            speechLangs: SCAN_SPEECH_LANGS,
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
      handleResolveQr(token, { auto: true });
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
                handleResolveQr(extracted, { auto: true });
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

  const handleScanAnother = () => {
    stopCamera();
    stopAudio();
    setPoiDetail(null);
    setErrorMessage(null);
    setPendingPlay(false);
    setInputToken('');
    setExpanded(false);
    setShowScanner(true);
  };

  const renderScanner = () => (
    <>
      <form onSubmit={handleSubmit} className="scan-form">
        <input
          type="text"
          placeholder="Nhập mã QR (ví dụ: qr-dinh-doc-lap-01)"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          className="scan-input"
        />
        <button type="submit" className="tb" disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tra cứu mã'}
        </button>
        <button type="button" className="tb" onClick={cameraActive ? stopCamera : startCamera}>
          <Camera size={15} strokeWidth={1.75} aria-hidden="true" />
          {cameraActive ? 'Tắt camera' : 'Bật camera'}
        </button>
      </form>

      {cameraError && <p className="scan-camera-error">{cameraError}</p>}

      {cameraActive && (
        <div className="scan-camera-frame">
          <video ref={videoRef} className="scan-camera-video" muted playsInline />
          <p className="scan-camera-note">Đang quét mã QR từ camera...</p>
        </div>
      )}
    </>
  );

  const displayName = poiDetail ? poiDetail.title || poiDetail.name : '';
  const narrativeText = poiDetail ? poiDetail.description || poiDetail.summary : '';

  return (
    <section className="s sp scan-page">
      {!poiDetail && (
        <header className="scan-header">
          <h2>Quét mã QR</h2>
          <p className="scan-intro">
            Nhập mã QR của điểm du lịch hoặc sử dụng máy ảnh để quét mã trực tiếp.
            (Lưu ý: Camera và GPS yêu cầu HTTPS hoặc localhost).
          </p>
        </header>
      )}

      {!poiDetail && renderScanner()}

      {loading && <p className="cn">Đang tải thông tin điểm du lịch từ mã QR...</p>}

      {errorMessage && (
        <div className="scan-error" role="alert">
          <p>{errorMessage}</p>
        </div>
      )}

      {poiDetail && (
        <article className="scan-result">
          <div className="scan-result-grid">
            <div className="scan-media">
              {poiDetail.thumbnailUrl && !imgError ? (
                <img
                  className="scan-media-img"
                  src={poiDetail.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="scan-media-fallback" aria-hidden="true">
                  <Volume2 size={40} strokeWidth={1.25} />
                </div>
              )}
              {poiDetail.categoryNameVi && (
                <span className="scan-category">{poiDetail.categoryNameVi}</span>
              )}
              <h3 className="scan-title">{displayName}</h3>
            </div>

            <div className="scan-content">
              <div className="scan-audio-row">
                <button
                  type="button"
                  className="scan-listen-btn"
                  aria-pressed={isPlaying(poiDetail.id)}
                  onClick={() => {
                    unlockAudio();
                    setPendingPlay(false);
                    playAudio({
                      poiId: poiDetail.id,
                      audioUrl: poiDetail.audioUrl,
                      audioStatus: poiDetail.audioStatus,
                      title: poiDetail.title || poiDetail.name,
                      textToSpeak: poiDetail.description || poiDetail.summary,
                      lang,
                      speechLangs: SCAN_SPEECH_LANGS,
                    });
                  }}
                >
                  {isPlaying(poiDetail.id) ? (
                    <>
                      <Pause size={18} strokeWidth={1.75} aria-hidden="true" />
                      Dừng thuyết minh
                    </>
                  ) : (
                    <>
                      <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
                      {pendingPlay ? 'Bấm để nghe' : 'Nghe thuyết minh'}
                    </>
                  )}
                </button>

                <div className="scan-lang-chips" role="group" aria-label="Chọn ngôn ngữ">
                  {(['vi', 'en', 'ja', 'ko'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={`scan-lang-btn ${lang === l ? 'is-active' : ''}`}
                      aria-pressed={lang === l}
                      onClick={() => {
                        if (l === lang) return;
                        stopAudio();
                        setPendingPlay(false);
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

              {poiDetail.address && (
                <p className="scan-address">
                  <span className="scan-address-label">Địa chỉ:</span> {poiDetail.address}
                </p>
              )}

              {narrativeText && (
                <div className="scan-narrative-wrap">
                  <p className={`scan-narrative ${expanded ? 'is-expanded' : 'is-clamped'}`}>
                    {narrativeText}
                  </p>
                  <button
                    type="button"
                    className="scan-more-btn"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((v) => !v)}
                  >
                    {expanded ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                </div>
              )}

              <div className="scan-result-actions">
                <button type="button" className="tb" onClick={handleScanAnother}>
                  Quét mã khác
                </button>
                <button
                  type="button"
                  className="tb"
                  onClick={() => navigate('/diem-du-lich')}
                >
                  Xem trên bản đồ
                </button>
              </div>
            </div>
          </div>

          <div className="scan-secondary">
            <button
              type="button"
              className="scan-secondary-toggle"
              aria-expanded={showScanner}
              onClick={() => {
                if (showScanner) stopCamera();
                setShowScanner((v) => !v);
              }}
            >
              {showScanner ? 'Ẩn nhập mã / camera' : 'Nhập mã hoặc bật camera'}
            </button>
            {showScanner && <div className="scan-secondary-body">{renderScanner()}</div>}
          </div>
        </article>
      )}

      {!poiDetail && (
        <p className="scan-home">
          <button type="button" className="tb" onClick={() => navigate('/')}>
            <ChevronLeft /> Về trang chủ
          </button>
        </p>
      )}
    </section>
  );
};

export default ScanPage;
