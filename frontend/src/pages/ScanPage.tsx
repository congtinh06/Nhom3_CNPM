/**
 * ============================================================================
 * TRANG QUÉT MÃ QR & TRÌNH PHÁT THUYẾT MINH ĐỊA ĐIỂM (QR Scan & Detail Page)
 * ============================================================================
 * 
 * Mục đích module:
 * - Tiếp nhận mã QR từ camera du khách hoặc nhập thủ công token QR.
 * - Tải thông tin chi tiết địa điểm (PoiDetail) và phát audio thuyết minh đa ngôn ngữ.
 * 
 * Các thay đổi cốt lõi (Core Changes):
 * 1. [Quyền truy cập ngoại ngữ]: Sử dụng kết hợp `isPremium` và `canAccessPoiLanguage(poiDetail.id, lang)`
 *    để kiểm tra quyền nghe/đọc tiếng Anh (EN), Nhật (JA), Hàn (KO).
 * 2. [Hỗ trợ mua lẻ từng điểm]: Nếu du khách đã mua lẻ gói POI này, giao diện lập tức mở khóa
 *    thuyết minh ngoại ngữ tương tự như tài khoản Premium.
 * 3. [Điều hướng mở khóa]: Nút CTA mở khóa ngoại ngữ chuyển hướng thông minh đến `buildPoiPremiumPath`
 *    để người dùng có thể chọn mua lẻ điểm hiện tại hoặc nâng cấp toàn diện Premium.
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Camera,
  Lock,
  Pause,
  Volume2,
  ChevronLeft,
  Eye,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { api } from '../api/client';
import { normalizeApiError } from '../api/errors';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAuth } from '../context/AuthContext';
import { usePremium, buildPremiumPath, buildPoiPremiumPath } from '../context/PremiumContext';
import { unlockAudio } from '../lib/audioUnlock';
import { getAnalyticsSessionId } from '../lib/analytics';
import { detectDeviceType } from '../lib/device';
import { PoiDetail, SupportedLanguage, TriggerType } from '../types';
import '../styles/scan.css';

// Vietnamese narration is free for everyone. English / Japanese / Korean need
// Premium (or a purchase of this specific POI), so the list is filtered against
// the user's entitlement at play time — on-device speech must not bypass that.
const SCAN_SPEECH_LANGS: SupportedLanguage[] = ['vi', 'en', 'ja', 'ko'];

/** Extract the POI slug from a "/diem/<slug>" scan value. */
const parseScanSlug = (raw: string): string | undefined => {
  try {
    const url = new URL(raw, window.location.origin);
    const path = url.pathname.replace(/\/+$/, '');
    const diemMatch = path.match(/^\/diem\/([^/]+)$/);
    const slugFromPath = diemMatch?.[1];
    if (slugFromPath) {
      return decodeURIComponent(slugFromPath);
    }
  } catch {
    // Không phải URL hợp lệ: bỏ qua.
  }
  return undefined;
};

export const ScanPage: React.FC = () => {
  const { token, slug } = useParams<{ token?: string; slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const isGuest = status === 'guest';
  const { canAccessPoiLanguage } = usePremium();

  const [inputToken, setInputToken] = useState<string>(token ?? '');
  const [poiDetail, setPoiDetail] = useState<PoiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mặc định tiếng Việt: đây là ngôn ngữ duy nhất miễn phí. Người dùng Premium
  // có thể chuyển sang EN/JA/KO bằng các chip ngôn ngữ bên dưới.
  const [lang, setLang] = useState<SupportedLanguage>('vi');

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imgError, setImgError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTriggerRef = useRef<TriggerType>('QR');
  const lastRecordedScanRef = useRef<string | null>(null);
  const resolvedTokenRef = useRef<string | null>(null);
  const resolvedSlugRef = useRef<string | null>(null);

  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

  // Ngoại ngữ chỉ mở khi tài khoản Premium hoặc đã mua lẻ đúng POI này.
  const canListenLanguage = useCallback(
    (language: SupportedLanguage) =>
      canAccessPoiLanguage(poiDetail?.id ?? null, language),
    [canAccessPoiLanguage, poiDetail?.id]
  );

  const allowedSpeechLangs = SCAN_SPEECH_LANGS.filter(canListenLanguage);
  const lockedLanguages = SCAN_SPEECH_LANGS.filter((l) => !canListenLanguage(l));

  const openUnlockForLanguage = useCallback(
    (language: SupportedLanguage) => {
      stopAudio();
      const returnTo = `${location.pathname}${location.search}`;
      navigate(
        poiDetail
          ? buildPoiPremiumPath(poiDetail.id, returnTo)
          : buildPremiumPath(language, returnTo)
      );
    },
    [location.pathname, location.search, navigate, poiDetail, stopAudio]
  );

  const handleResolveQr = useCallback(
    (
      rawValue: string,
      options?: {
        auto?: boolean;
        autoplay?: boolean;
        triggerType?: TriggerType;
        slug?: string;
      }
    ) => {
      const targetSlug = options?.slug?.trim() || undefined;
      const trimmed = (targetSlug ?? rawValue).trim();
      if (!trimmed) return;
      const isAuto = options?.auto ?? false;
      const triggerType = options?.triggerType ?? 'QR';

      setLoading(true);
      setErrorMessage(null);

      const request = targetSlug
        ? api.getPoiBySlug(targetSlug, lang)
        : api.getPoiByQr(trimmed, lang);

      request
        .then((detail) => {
          setPoiDetail(detail);
          setExpanded(false);
          setImgError(false);
          scanTriggerRef.current = triggerType;

          const scanKey = `${triggerType}:${detail.id}`;
          if (lastRecordedScanRef.current !== scanKey) {
            lastRecordedScanRef.current = scanKey;
            void api
              .recordAnalyticsEvent({
                eventType: 'SCAN',
                poiId: detail.id,
                languageCode: lang,
                triggerType,
                deviceType: detectDeviceType(),
                sessionId: getAnalyticsSessionId(),
              })
              .catch(() => {
                // Không chặn trải nghiệm quét QR nếu analytics tạm thời lỗi.
              });
          }

          if (isAuto && !options?.autoplay) {
            // Direct QR links resolve after an await with no user gesture, so
            // browsers block autoplay. Prompt with an explicit button instead.
            setPendingPlay(true);
            return;
          }
          unlockAudio();
          setPendingPlay(false);
          playAudio({
            poiId: detail.id,
            audioUrl: canAccessPoiLanguage(detail.id, lang) ? detail.audioUrl : undefined,
            audioStatus: detail.audioStatus,
            title: detail.title || detail.name,
            textToSpeak: detail.description || detail.summary,
            lang,
            speechLangs: SCAN_SPEECH_LANGS.filter((l) =>
              canAccessPoiLanguage(detail.id, l)
            ),
            triggerType,
          });
        })
        .catch((err: unknown) => {
          const norm = normalizeApiError(err);
          if (norm.status === 404) {
            setErrorMessage('Không tìm thấy mã QR này.');
          } else if (norm.status === 403) {
            setErrorMessage(
              'Ngôn ngữ này cần gói Premium hoặc mua gói thuyết minh của điểm này.'
            );
          } else {
            setErrorMessage(norm.message);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [canAccessPoiLanguage, lang, playAudio]
  );

  useEffect(() => {
    if (!token) return;
    // Chỉ tra cứu 1 lần cho mỗi token trong URL. Nếu effect chạy lại (do
    // callback đổi identity sau mỗi lần render) thì không được tra lại mã,
    // tránh việc bật lại trạng thái "Bấm để nghe" giữa lúc đang phát.
    if (resolvedTokenRef.current === token) return;
    resolvedTokenRef.current = token;
    handleResolveQr(token, { auto: true, triggerType: 'QR' });
  }, [token, handleResolveQr]);

  useEffect(() => {
    const targetSlug = slug?.trim();
    if (!targetSlug) return;
    // Link /diem/<slug> của QR điểm du lịch: tra cứu đúng điểm bằng slug,
    // mở trực tiếp trang thuyết minh mà không cần đăng nhập.
    if (resolvedSlugRef.current === targetSlug) return;
    resolvedSlugRef.current = targetSlug;
    handleResolveQr(targetSlug, { auto: true, triggerType: 'QR', slug: targetSlug });
  }, [slug, handleResolveQr]);

  // Nếu quyền ngoại ngữ mất đi (đăng xuất, gói hết hạn) thì quay về tiếng Việt,
  // tránh giữ lại bản dịch đã tải trước đó.
  useEffect(() => {
    if (lang === 'vi' || !poiDetail) return;
    if (canAccessPoiLanguage(poiDetail.id, lang)) return;
    stopAudio();
    setPendingPlay(false);
    setLang('vi');
    if (poiDetail.qrToken) {
      api
        .getPoiByQr(poiDetail.qrToken, 'vi')
        .then(setPoiDetail)
        .catch(() => {
          // Giữ nội dung hiện tại nếu không tải lại được.
        });
    }
  }, [lang, poiDetail, canAccessPoiLanguage, stopAudio]);

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
    unlockAudio();
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
              const extractedSlug = val.includes('/diem/')
                ? val.split('/diem/')[1]?.split('?')[0]
                : undefined;
              const extractedToken = extractedSlug
                ? undefined
                : val.includes('/qr/')
                  ? val.split('/qr/')[1]?.split('?')[0]
                  : val;
              const target = extractedSlug ?? extractedToken;
              if (target) {
                setInputToken(target);
                handleResolveQr(target, {
                  auto: true,
                  autoplay: true,
                  triggerType: 'QR',
                  ...(extractedSlug ? { slug: extractedSlug } : {}),
                });
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
    const raw = inputToken.trim();
    if (!raw) return;
    const targetSlug = raw.includes('/')
      ? parseScanSlug(raw)
      : undefined;
    handleResolveQr(
      raw,
      { triggerType: 'MANUAL', ...(targetSlug ? { slug: targetSlug } : {}) }
    );
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
    lastRecordedScanRef.current = null;
    resolvedTokenRef.current = null;
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

  const renderLanding = () => (
    <header className="scan-header scan-hero">
      <span className="scan-hero-glow" aria-hidden="true" />
      <span className="scan-hero-icon" aria-hidden="true">
        <QrCode size={30} strokeWidth={1.6} />
      </span>
      <span className="scan-eyebrow">Thuyết minh tự động</span>
      <h2>Quét mã QR</h2>
      <p className="scan-intro">
        Quét mã tại điểm tham quan để nghe thuyết minh ngay trên điện thoại.
        Tiếng Việt miễn phí cho mọi du khách.
      </p>

      <button
        type="button"
        className={`scan-camera-btn ${cameraActive ? 'is-active' : ''}`}
        onClick={cameraActive ? stopCamera : startCamera}
      >
        <span className="scan-camera-btn-icon" aria-hidden="true">
          <Camera size={22} strokeWidth={1.75} />
        </span>
        <span className="scan-camera-btn-text">
          <strong>{cameraActive ? 'Tắt camera' : 'Mở camera quét mã'}</strong>
          <small>
            {cameraActive
              ? 'Đang quét, đưa mã QR vào giữa khung hình'
              : 'Đưa mã QR trên bảng hiệu vào khung hình'}
          </small>
        </span>
      </button>

      {cameraError && <p className="scan-camera-error">{cameraError}</p>}

      {cameraActive && (
        <div className="scan-camera-frame">
          <video ref={videoRef} className="scan-camera-video" muted playsInline />
          <p className="scan-camera-note">Đang quét mã QR từ camera...</p>
        </div>
      )}

      <div className="scan-divider" aria-hidden="true">
        <span>hoặc nhập mã</span>
      </div>

      <form onSubmit={handleSubmit} className="scan-form">
        <input
          type="text"
          aria-label="hoặc nhập mã QR"
          placeholder="Nhập mã QR (ví dụ: qr-dinh-doc-lap-01)"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          className="scan-input"
        />
        <button type="submit" className="scan-submit-btn" disabled={loading}>
          {loading ? 'Đang tra cứu...' : 'Tra cứu mã'}
        </button>
      </form>

      <ul className="scan-tips">
        <li>
          <Smartphone size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Mở bằng điện thoại để dùng được camera quét mã.</span>
        </li>
        <li>
          <Volume2 size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Bấm “Nghe thuyết minh” sau khi quét để nghe ngay.</span>
        </li>
        <li>
          <ShieldCheck size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Không cần tải ứng dụng, không cần đăng nhập.</span>
        </li>
      </ul>
    </header>
  );

  const displayName = poiDetail ? poiDetail.title || poiDetail.name : '';
  const narrativeText = poiDetail ? poiDetail.description || poiDetail.summary : '';

  return (
    <section className="s sp scan-page">
      <h1 className="sr-only">
        {displayName ? `${displayName} - Thuyết minh tự động` : 'Quét mã QR thuyết minh'}
      </h1>
      {isGuest && (
        <div className="scan-guest-bar" role="note">
          <span className="scan-guest-text">
            <Eye size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>
              Quý khách đang tham quan với tư cách <strong>Khách</strong>. Thuyết
              minh tiếng Việt miễn phí; bản dịch tiếng Anh, Nhật, Hàn cần đăng nhập
              và mở khóa Premium.
            </span>
          </span>
          <span className="scan-guest-auth">
            <button
              type="button"
              className="scan-guest-link"
              onClick={() => navigate('/dang-nhap', { state: { backgroundLocation: location } })}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className="scan-guest-link is-strong"
              onClick={() => navigate('/dang-ky', { state: { backgroundLocation: location } })}
            >
              Đăng ký
            </button>
          </span>
        </div>
      )}
      {!poiDetail && renderLanding()}

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
                      audioUrl: canAccessPoiLanguage(poiDetail.id, lang)
                        ? poiDetail.audioUrl
                        : undefined,
                      audioStatus: poiDetail.audioStatus,
                      title: poiDetail.title || poiDetail.name,
                      textToSpeak: poiDetail.description || poiDetail.summary,
                      lang,
                      speechLangs: allowedSpeechLangs,
                      triggerType: scanTriggerRef.current,
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
                  {SCAN_SPEECH_LANGS.map((l) => {
                    const locked = !canListenLanguage(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        className={`scan-lang-btn ${lang === l ? 'is-active' : ''} ${
                          locked ? 'is-locked' : ''
                        }`}
                        aria-pressed={lang === l}
                        aria-label={locked ? `${l.toUpperCase()} (cần Premium)` : undefined}
                        title={
                          locked
                            ? 'Ngôn ngữ này cần Premium hoặc mua gói của điểm này'
                            : undefined
                        }
                        onClick={() => {
                          if (locked) {
                            openUnlockForLanguage(l);
                            return;
                          }
                          if (l === lang) return;
                          stopAudio();
                          // Nội dung vừa đổi ngôn ngữ nên cần một cú bấm mới để
                          // phát (tránh tự phát khi người dùng chưa sẵn sàng).
                          setPendingPlay(true);
                          setLang(l);
                          if (poiDetail.qrToken) {
                            api
                              .getPoiByQr(poiDetail.qrToken, l)
                              .then(setPoiDetail)
                              .catch((err: unknown) => {
                                setErrorMessage(normalizeApiError(err).message);
                              });
                          }
                        }}
                      >
                        {locked && <Lock size={12} strokeWidth={2} aria-hidden="true" />}
                        {l.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {lockedLanguages.length > 0 && (
                <p className="scan-premium-note">
                  <Lock size={14} strokeWidth={1.9} aria-hidden="true" />
                  <span>
                    Chỉ tiếng Việt được nghe miễn phí. Mở khóa{' '}
                    {lockedLanguages.map((l) => l.toUpperCase()).join(', ')} bằng gói
                    Premium hoặc gói thuyết minh của điểm này.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openUnlockForLanguage(
                        lockedLanguages.find((l) => l !== 'vi') ?? 'en'
                      )
                    }
                  >
                    Mở khóa
                  </button>
                </p>
              )}

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
