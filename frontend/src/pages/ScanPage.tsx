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
import { useNavbarLanguage } from '../content/languages';
import { PoiDetail, SupportedLanguage, TriggerType } from '../types';
import '../styles/scan.css';

const SCAN_I18N = {
  vi: {
    heroEyebrow: 'Thuyết minh tự động',
    heroTitle: 'Quét mã QR',
    heroIntro: 'Quét mã tại điểm tham quan để nghe thuyết minh ngay trên điện thoại. Tiếng Việt miễn phí cho mọi du khách.',
    cameraOpen: 'Mở camera quét mã',
    cameraClose: 'Tắt camera',
    cameraActiveHint: 'Đang quét, đưa mã QR vào giữa khung hình',
    cameraInactiveHint: 'Đưa mã QR trên bảng hiệu vào khung hình',
    cameraScanning: 'Đang quét mã QR từ camera...',
    orEnterCode: 'hoặc nhập mã',
    inputPlaceholder: 'Nhập mã QR (ví dụ: qr-dinh-doc-lap-01)',
    lookupBtn: 'Tra cứu mã',
    lookingUp: 'Đang tra cứu...',
    tipPhone: 'Mở bằng điện thoại để dùng được camera quét mã.',
    tipListen: 'Bấm "Nghe thuyết minh" sau khi quét để nghe ngay.',
    tipFree: 'Không cần tải ứng dụng, không cần đăng nhập.',
    guestNote: 'Quý khách đang tham quan với tư cách Khách. Thuyết minh tiếng Việt miễn phí; bản dịch tiếng Anh, Nhật, Hàn cần đăng nhập và mở khóa Premium.',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    loadingPoi: 'Đang tải thông tin điểm du lịch từ mã QR...',
    pauseAudio: 'Dừng thuyết minh',
    playAudio: 'Nghe thuyết minh',
    tapToPlay: 'Bấm để nghe',
    chooseLang: 'Chọn ngôn ngữ',
    needPremium: 'cần Premium',
    lockedLangHint: 'Chỉ tiếng Việt được nghe miễn phí. Mở khóa {langs} bằng gói Premium hoặc gói thuyết minh của điểm này.',
    unlockBtn: 'Mở khóa',
  },
  en: {
    heroEyebrow: 'Digital Audio Guide',
    heroTitle: 'Scan QR Code',
    heroIntro: 'Scan the QR code at any attraction to listen to the audio guide on your phone. Vietnamese is free for all visitors.',
    cameraOpen: 'Open camera to scan',
    cameraClose: 'Turn off camera',
    cameraActiveHint: 'Scanning, align the QR code inside the frame',
    cameraInactiveHint: 'Point your camera at the QR code on the sign board',
    cameraScanning: 'Scanning QR code with camera...',
    orEnterCode: 'or enter code manually',
    inputPlaceholder: 'Enter QR code (e.g. qr-dinh-doc-lap-01)',
    lookupBtn: 'Look up code',
    lookingUp: 'Looking up...',
    tipPhone: 'Open on your mobile phone to use the camera scanner.',
    tipListen: 'Tap "Listen to narration" after scanning to listen immediately.',
    tipFree: 'No app download needed, no sign-in required.',
    guestNote: 'You are visiting as a Guest. Vietnamese is free; English, Japanese, and Korean require sign-in and Premium unlock.',
    login: 'Sign in',
    register: 'Sign up',
    loadingPoi: 'Loading attraction details from QR code...',
    pauseAudio: 'Pause narration',
    playAudio: 'Listen to narration',
    tapToPlay: 'Tap to listen',
    chooseLang: 'Choose language',
    needPremium: 'Premium required',
    lockedLangHint: 'Only Vietnamese is free. Unlock {langs} with a Premium plan or this landmark pack.',
    unlockBtn: 'Unlock',
  },
  ja: {
    heroEyebrow: '自動音声ガイド',
    heroTitle: 'QRコードをスキャン',
    heroIntro: '観光スポットのQRコードを読み取って、スマートフォンで音声ガイドをお楽しみください。ベトナム語は無料です。',
    cameraOpen: 'カメラでQRを読み取る',
    cameraClose: 'カメラを停止',
    cameraActiveHint: 'スキャン中、枠内にQRコードを合わせてください',
    cameraInactiveHint: '現地の案内板にあるQRコードを枠内に収めてください',
    cameraScanning: 'カメラからQRコードをスキャン中...',
    orEnterCode: 'またはコードを入力',
    inputPlaceholder: 'QRコードを入力（例：qr-dinh-doc-lap-01）',
    lookupBtn: 'コードを検索',
    lookingUp: '検索中...',
    tipPhone: 'スマートフォンでアクセスするとカメラでスキャンできます。',
    tipListen: 'スキャン後に「音声ガイドを聴く」を押して再生します。',
    tipFree: 'アプリのインストールやログインは不要です。',
    guestNote: 'ゲストとして利用中です。ベトナム語は無料です。英語、日本語、韓国語の利用にはログインとプレミアムの解除が必要です。',
    login: 'ログイン',
    register: '新規登録',
    loadingPoi: 'QRコードからスポット情報を取得しています...',
    pauseAudio: '音声を一時停止',
    playAudio: '音声ガイドを聴く',
    tapToPlay: 'タップして再生',
    chooseLang: '言語を選択',
    needPremium: 'プレミアムが必要',
    lockedLangHint: 'ベトナム語のみ無料です。プレミアムまたは個別パッケージで{langs}をアンロックできます。',
    unlockBtn: 'アンロック',
  },
  ko: {
    heroEyebrow: '디지털 오디오 가이드',
    heroTitle: 'QR 코드 스캔',
    heroIntro: '명소의 QR 코드를 스캔하여 스마트폰에서 바로 오디오 가이드를 들어보세요. 베트남어는 모든 방문객에게 무료입니다.',
    cameraOpen: '카메라로 QR 스캔',
    cameraClose: '카메라 끄기',
    cameraActiveHint: '스캔 중입니다. 화면 중앙 프레임에 QR 코드를 맞춰주세요',
    cameraInactiveHint: '안내판의 QR 코드를 프레임 안에 비춰주세요',
    cameraScanning: '카메라로 QR 코드를 스캔하고 있습니다...',
    orEnterCode: '또는 코드 직접 입력',
    inputPlaceholder: 'QR 코드 입력 (예: qr-dinh-doc-lap-01)',
    lookupBtn: '코드 조회',
    lookingUp: '조회 중...',
    tipPhone: '스마트폰으로 접속하시면 카메라로 QR을 스캔할 수 있습니다.',
    tipListen: '스캔 후 "오디오 가이드 듣기"를 눌러 즉시 감상하세요.',
    tipFree: '앱 설치나 로그인 없이 바로 이용 가능합니다.',
    guestNote: '게스트 모드로 이용 중입니다. 베트남어는 무료이며, 영어/일본어/한국어는 로그인 및 프리미엄 잠금 해제가 필요합니다.',
    login: '로그인',
    register: '회원가입',
    loadingPoi: 'QR 코드에서 명소 정보를 불러오는 중입니다...',
    pauseAudio: '오디오 일시정지',
    playAudio: '오디오 가이드 듣기',
    tapToPlay: '탭하여 재생',
    chooseLang: '언어 선택',
    needPremium: '프리미엄 필요',
    lockedLangHint: '베트남어만 무료로 청취 가능합니다. 프리미엄 플랜 또는 개별 패키지로 {langs}을 잠금 해제하세요.',
    unlockBtn: '잠금 해제',
  },
};

// Vietnamese narration is free for everyone. English / Japanese / Korean need
// Premium (or a purchase of this specific POI), so the list is filtered against
// the user's entitlement at play time — on-device speech must not bypass that.
const SCAN_SPEECH_LANGS: SupportedLanguage[] = ['vi', 'en', 'ja', 'ko'];

/** Ánh xạ hai chiều giữa slug và qrToken để fallback tức thì khi quét QR trên di động */
const POI_SLUG_TOKEN_MAP: Record<string, string> = {
  'dinh-doc-lap': 'qr-dinh-doc-lap-01',
  'nha-tho-duc-ba': 'qr-duc-ba-01',
  'buu-dien-trung-tam': 'qr-buu-dien-01',
  'cho-ben-thanh': 'qr-ben-thanh-01',
  'bao-tang-chung-tich-chien-tranh': 'qr-bao-tang-chung-tich-01',
  'chua-ba-thien-hau': 'qr-thien-hau-01',
  'cau-ba-son': 'qr-ba-son-01',
};

const POI_TOKEN_SLUG_MAP: Record<string, string> = {
  'qr-dinh-doc-lap-01': 'dinh-doc-lap',
  'qr-duc-ba-01': 'nha-tho-duc-ba',
  'qr-buu-dien-01': 'buu-dien-trung-tam',
  'qr-ben-thanh-01': 'cho-ben-thanh',
  'qr-bao-tang-chung-tich-01': 'bao-tang-chung-tich-chien-tranh',
  'qr-thien-hau-01': 'chua-ba-thien-hau',
  'qr-ba-son-01': 'cau-ba-son',
};

/** Phân tích thông minh chuỗi quét hoặc URL thành slug / token */
const parseScanInput = (
  raw: string
): { slug?: string; token?: string; cleanValue: string } => {
  const trimmed = raw.trim();
  if (!trimmed) return { cleanValue: '' };

  try {
    const url = new URL(trimmed, window.location.origin);
    const stopParam =
      url.searchParams.get('stop') ||
      url.searchParams.get('poi') ||
      url.searchParams.get('slug');
    if (stopParam) {
      const decoded = decodeURIComponent(stopParam).trim();
      if (decoded.startsWith('qr-')) {
        return {
          token: decoded,
          cleanValue: decoded,
        };
      }
      return {
        slug: decoded,
        cleanValue: decoded,
      };
    }

    const path = url.pathname.replace(/\/+$/, '');
    const diemMatch = path.match(/^\/(?:diem|diem-du-lich)\/([^/?#]+)/);
    if (diemMatch?.[1]) {
      const slug = decodeURIComponent(diemMatch[1]);
      return { slug, cleanValue: slug };
    }
    const qrMatch = path.match(/^\/qr\/([^/?#]+)/);
    if (qrMatch?.[1]) {
      const token = decodeURIComponent(qrMatch[1]);
      return { token, cleanValue: token };
    }
  } catch {
    // Không phải URL hợp lệ: tiếp tục xử lý chuỗi thường
  }

  if (trimmed.includes('stop=')) {
    const stopMatch = trimmed.match(/[?&]stop=([^&#]+)/);
    if (stopMatch?.[1]) {
      const decoded = decodeURIComponent(stopMatch[1]);
      if (decoded.startsWith('qr-')) {
        return { token: decoded, cleanValue: decoded };
      }
      return { slug: decoded, cleanValue: decoded };
    }
  }

  if (trimmed.includes('/diem/') || trimmed.includes('/diem-du-lich/')) {
    const slugPart = trimmed.split(/\/(?:diem|diem-du-lich)\//)[1]?.split(/[?#/]/)[0];
    if (slugPart) {
      const slug = decodeURIComponent(slugPart);
      return { slug, cleanValue: slug };
    }
  }

  if (trimmed.includes('/qr/')) {
    const tokenPart = trimmed.split('/qr/')[1]?.split(/[?#/]/)[0];
    if (tokenPart) {
      const token = decodeURIComponent(tokenPart);
      return { token, cleanValue: token };
    }
  }

  if (trimmed.startsWith('qr-')) {
    return { token: trimmed, cleanValue: trimmed };
  }

  if (POI_SLUG_TOKEN_MAP[trimmed]) {
    return { slug: trimmed, cleanValue: trimmed };
  }

  if (POI_TOKEN_SLUG_MAP[trimmed]) {
    return { token: trimmed, cleanValue: trimmed };
  }

  return { cleanValue: trimmed };
};

export const ScanPage: React.FC = () => {
  const { token, slug } = useParams<{ token?: string; slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const isGuest = status === 'guest';
  const { canAccessPoiLanguage } = usePremium();
  const { lang: navLang } = useNavbarLanguage();
  const tScan = SCAN_I18N[navLang] || SCAN_I18N.vi;

  const [inputToken, setInputToken] = useState<string>(token ?? '');
  const [poiDetail, setPoiDetail] = useState<PoiDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mặc định ngôn ngữ theo thanh điều hướng
  const [lang, setLang] = useState<SupportedLanguage>(navLang || 'vi');

  useEffect(() => {
    if (navLang) {
      setLang(navLang);
    }
  }, [navLang]);

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
      const targetPath = poiDetail
        ? buildPoiPremiumPath(poiDetail.id, returnTo, language)
        : buildPremiumPath(language, returnTo);
      if (isGuest) {
        navigate('/dang-ky', {
          state: {
            backgroundLocation: location,
            from: targetPath,
          },
        });
        return;
      }
      navigate(targetPath);
    },
    [isGuest, location, navigate, poiDetail, stopAudio]
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
      const parsed = parseScanInput(rawValue);
      const targetSlug = options?.slug?.trim() || parsed.slug;
      const targetToken = parsed.token;
      const cleanVal = parsed.cleanValue || (targetSlug ?? targetToken ?? rawValue).trim();
      if (!cleanVal && !targetSlug && !targetToken) return;

      const isAuto = options?.auto ?? false;
      const triggerType = options?.triggerType ?? 'QR';

      setLoading(true);
      setErrorMessage(null);

      const fetchWithFallback = async (): Promise<PoiDetail> => {
        if (targetToken && !options?.slug) {
          try {
            return await api.getPoiByQr(targetToken, lang);
          } catch (err: unknown) {
            const norm = normalizeApiError(err);
            if (norm.status === 404) {
              const mappedSlug = POI_TOKEN_SLUG_MAP[targetToken];
              if (mappedSlug) {
                return await api.getPoiBySlug(mappedSlug, lang);
              }
              return await api.getPoiBySlug(targetToken, lang);
            }
            throw err;
          }
        }

        if (targetSlug) {
          try {
            return await api.getPoiBySlug(targetSlug, lang);
          } catch (err: unknown) {
            const norm = normalizeApiError(err);
            if (norm.status === 404) {
              const mappedToken = POI_SLUG_TOKEN_MAP[targetSlug] || targetToken;
              if (mappedToken) {
                return await api.getPoiByQr(mappedToken, lang);
              }
              return await api.getPoiByQr(targetSlug, lang);
            }
            throw err;
          }
        }

        try {
          return await api.getPoiByQr(cleanVal, lang);
        } catch (err: unknown) {
          const norm = normalizeApiError(err);
          if (norm.status === 404) {
            return await api.getPoiBySlug(cleanVal, lang);
          }
          throw err;
        }
      };

      fetchWithFallback()
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
              const parsed = parseScanInput(val);
              const target = parsed.slug ?? parsed.token ?? parsed.cleanValue;
              if (target) {
                navigate(`/diem-du-lich?stop=${encodeURIComponent(target)}`);
                return;
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
    const parsed = parseScanInput(raw);
    const target = parsed.slug ?? parsed.token ?? parsed.cleanValue;
    if (target) {
      navigate(`/diem-du-lich?stop=${encodeURIComponent(target)}`);
      return;
    }
    handleResolveQr(
      target,
      { triggerType: 'MANUAL', ...(parsed.slug ? { slug: parsed.slug } : {}) }
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
      <span className="scan-eyebrow">{tScan.heroEyebrow}</span>
      <h2>{tScan.heroTitle}</h2>
      <p className="scan-intro">
        {tScan.heroIntro}
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
          <strong>{cameraActive ? tScan.cameraClose : tScan.cameraOpen}</strong>
          <small>
            {cameraActive
              ? tScan.cameraActiveHint
              : tScan.cameraInactiveHint}
          </small>
        </span>
      </button>

      {cameraError && <p className="scan-camera-error">{cameraError}</p>}

      {cameraActive && (
        <div className="scan-camera-frame">
          <video ref={videoRef} className="scan-camera-video" muted playsInline />
          <p className="scan-camera-note">{tScan.cameraScanning}</p>
        </div>
      )}

      <div className="scan-divider" aria-hidden="true">
        <span>{tScan.orEnterCode}</span>
      </div>

      <form onSubmit={handleSubmit} className="scan-form">
        <input
          type="text"
          aria-label={tScan.orEnterCode}
          placeholder={tScan.inputPlaceholder}
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          className="scan-input"
        />
        <button type="submit" className="scan-submit-btn" disabled={loading}>
          {loading ? tScan.lookingUp : tScan.lookupBtn}
        </button>
      </form>

      <ul className="scan-tips">
        <li>
          <Smartphone size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>{tScan.tipPhone}</span>
        </li>
        <li>
          <Volume2 size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>{tScan.tipListen}</span>
        </li>
        <li>
          <ShieldCheck size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>{tScan.tipFree}</span>
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
            <span>{tScan.guestNote}</span>
          </span>
          <span className="scan-guest-auth">
            <button
              type="button"
              className="scan-guest-link"
              onClick={() => navigate('/dang-nhap', { state: { backgroundLocation: location } })}
            >
              {tScan.login}
            </button>
            <button
              type="button"
              className="scan-guest-link is-strong"
              onClick={() => navigate('/dang-ky', { state: { backgroundLocation: location } })}
            >
              {tScan.register}
            </button>
          </span>
        </div>
      )}
      {!poiDetail && renderLanding()}

      {loading && <p className="cn">{tScan.loadingPoi}</p>}

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
                      {tScan.pauseAudio}
                    </>
                  ) : (
                    <>
                      <Volume2 size={18} strokeWidth={1.75} aria-hidden="true" />
                      {pendingPlay ? tScan.tapToPlay : tScan.playAudio}
                    </>
                  )}
                </button>

                <div className="scan-lang-chips" role="group" aria-label={tScan.chooseLang}>
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
                        aria-label={locked ? `${l.toUpperCase()} (${tScan.needPremium})` : undefined}
                        title={
                          locked
                            ? tScan.needPremium
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
                    {tScan.lockedLangHint.replace('{langs}', lockedLanguages.map((l) => l.toUpperCase()).join(', '))}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      openUnlockForLanguage(
                        lockedLanguages.find((l) => l !== 'vi') ?? 'en'
                      )
                    }
                  >
                    {tScan.unlockBtn}
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
                  onClick={() =>
                    navigate(
                      `/diem-du-lich?stop=${encodeURIComponent(poiDetail.slug || poiDetail.qrToken || String(poiDetail.id))}`
                    )
                  }
                >
                  Xem trên bản đồ & Lộ trình đầy đủ
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
