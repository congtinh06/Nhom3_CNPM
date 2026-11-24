import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider } from './context/PremiumContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDialog } from './components/cart/CartDialog';
import { BackToTop } from './components/common/BackToTop';
import { AuthModal } from './components/auth/AuthModal';
import { RequireAuth } from './components/auth/RequireAuth';

import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useScrollReveal } from './hooks/useScrollReveal';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import { api } from './api/client';
import { detectDeviceType } from './lib/device';
import {
  getAnalyticsSessionId,
  getClientLanguage,
  getVisitTrigger,
  markVisitRecorded,
} from './lib/analytics';

/** Nhịp heartbeat hiện diện (1 phút/lần). */
const PRESENCE_HEARTBEAT_MS = 60_000;

const NearbyPage = lazy(() => import('./pages/NearbyPage'));
const AdminRoutes = lazy(() => import('./admin/AdminRoutes'));
const AccountLoginQrPage = lazy(() => import('./pages/AccountLoginQrPage'));
const QrHandoffReceivePage = lazy(() => import('./pages/QrHandoffReceivePage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));
// Trang chủ và các trang nặng được tải lười để chunk index ban đầu nhẹ.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ScanPage = lazy(() => import('./pages/ScanPage'));
const QrLoginScanPage = lazy(() => import('./pages/QrLoginScanPage'));
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const FoodBeveragePage = lazy(() => import('./pages/FoodBeveragePage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'));
const VietQrPage = lazy(() => import('./pages/VietQrPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const NewsListPage = lazy(() => import('./pages/NewsListPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));

const PoiRedirect: React.FC = () => {
  const { slug, token } = useParams<{ slug?: string; token?: string }>();
  const target = slug || token;
  return <Navigate to={target ? `/diem-du-lich?stop=${encodeURIComponent(target)}` : '/diem-du-lich'} replace />;
};

const NearbyRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const stop = searchParams.get('stop') || searchParams.get('poi') || searchParams.get('slug');
  return <Navigate to={stop ? `/diem-du-lich?stop=${encodeURIComponent(stop)}` : '/diem-du-lich'} replace />;
};

// Legacy souvenir URLs now forward into the "Quà lưu niệm" page at /am-thuc.
const SouvenirTabRedirect: React.FC = () => <Navigate to="/am-thuc" replace />;

const SouvenirSlugRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/am-thuc/${slug}` : '/am-thuc'} replace />;
};

const AppContent: React.FC = () => {
  useSmoothScroll();
  useScrollReveal();
  useScrollRestoration();
  const location = useLocation();
  const { status: authStatus } = useAuth();

  // Đếm 1 lượt truy cập website (VISIT) mỗi phiên tab - phục vụ dashboard
  // quản trị realtime. Trang /quan-tri (admin) không được tính là lượt truy cập.
  // Lượt từ QR (/qr/..., /quet-ma, ?src=qr) chỉ được tính sau khi đã đăng nhập.
  useEffect(() => {
    if (location.pathname.startsWith('/quan-tri')) return;
    if (authStatus === 'loading') return;
    const triggerType = getVisitTrigger(location.pathname, location.search);
    if (triggerType === 'QR' && authStatus !== 'authenticated') return;
    if (!markVisitRecorded()) return;
    void api
      .recordAnalyticsEvent({
        eventType: 'VISIT',
        languageCode: getClientLanguage(),
        triggerType,
        sessionId: getAnalyticsSessionId(),
      })
      .catch(() => {
        // Analytics lỗi tạm thời không chặn người dùng.
      });
    // Chỉ chạy một lần mỗi phiên tab (markVisitRecorded tự chống lặp StrictMode).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  // Heartbeat hiện diện: VISIT chỉ gửi 1 lần khi mở tab, nên nếu khách ngồi xem
  // quá 5 phút thì dashboard admin sẽ tưởng đã offline. Gửi heartbeat mỗi phút
  // khi tab còn mở (và ngay khi quay lại tab) để "Đang online (5 phút)" đúng.
  useEffect(() => {
    if (location.pathname.startsWith('/quan-tri')) return;

    const sendPresence = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      void api
        .recordPresence({
          sessionId: getAnalyticsSessionId(),
          languageCode: getClientLanguage(),
          deviceType: detectDeviceType(),
        })
        .catch(() => {
          // Presence lỗi không ảnh hưởng trải nghiệm người dùng.
        });
    };

    sendPresence();
    const timer = window.setInterval(sendPresence, PRESENCE_HEARTBEAT_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  const state = location.state as {
    backgroundLocation?: { pathname: string; search?: string; hash?: string };
    from?: string;
  } | null;

  const isAuthModalRoute = ['/dang-nhap', '/dang-ky', '/quen-mat-khau'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/quan-tri');

  // Background location pattern:
  // If on an auth modal route, render either the previous backgroundLocation or fallback to homepage
  const backgroundLocation = isAuthModalRoute
    ? (state?.backgroundLocation || { pathname: '/', search: '', hash: '' })
    : undefined;

  if (isAdminRoute) {
    return (
      <Suspense
        fallback={
          <div className="adm-screen-loader" role="status" aria-label="Đang tải dữ liệu">
            <div className="adm-spinner" />
            <p className="adm-loader-text">Đang tải giao diện quản trị...</p>
          </div>
        }
      >
        <Routes>
          <Route path="/quan-tri/*" element={<AdminRoutes />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <>
      <Header />
      <main className={`app-main${location.pathname === '/' ? ' home-route' : ' inner-route'}`}>
        <Suspense fallback={<div className="s sp" style={{ minHeight: '60vh', marginTop: 100 }}><p>Đang tải dữ liệu...</p></div>}>
          <Routes location={backgroundLocation || location}>
            <Route path="/" element={<HomePage />} />
            {/* Legacy redirects */}
            <Route path="/van-hoa" element={<Navigate to="/diem-du-lich" replace />} />
            <Route path="/culture" element={<Navigate to="/diem-du-lich" replace />} />
            <Route path="/kham-pha" element={<Navigate to="/diem-du-lich" replace />} />
            <Route path="/explore" element={<Navigate to="/diem-du-lich" replace />} />

            {/* Core Navigation Routes */}
            <Route path="/diem-du-lich" element={<NearbyPage />} />
            <Route path="/diem-du-lich/:slug" element={<PoiRedirect />} />
            <Route path="/nearby" element={<NearbyRedirect />} />
            <Route path="/nearby/:slug" element={<PoiRedirect />} />
            <Route path="/thuyet-minh" element={<NearbyPage />} />
            <Route path="/gan-toi" element={<NearbyPage />} />
            {/* "Quà lưu niệm" page (trước đây là trang Ẩm thực) */}
            <Route path="/am-thuc" element={<FoodBeveragePage />} />
            <Route path="/thuc-uong" element={<FoodBeveragePage />} />
            <Route path="/am-thuc-thuc-uong" element={<FoodBeveragePage />} />
            {/* /qua-luu-niem only forwards into the page above */}
            <Route path="/qua-luu-niem" element={<SouvenirTabRedirect />} />
            <Route path="/tin-tuc" element={<NewsListPage />} />
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
            <Route path="/huong-dan" element={<GuidePage />} />
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/chinh-sach-quyen-rieng-tu" element={<PrivacyPolicyPage />} />
            <Route path="/nang-cap" element={<PremiumPage />} />

            {/* Product detail routes (all legacy paths stay real) */}
            <Route path="/am-thuc-thuc-uong/:slug" element={<ProductDetailPage />} />
            <Route path="/am-thuc/:slug" element={<ProductDetailPage />} />
            <Route path="/thuc-uong/:slug" element={<ProductDetailPage />} />
            <Route path="/qua-luu-niem/:slug" element={<SouvenirSlugRedirect />} />

            {/* Checkout & Orders */}
            <Route
              path="/thanh-toan"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route
              path="/thanh-toan/qr/:orderCode"
              element={
                <RequireAuth>
                  <VietQrPage />
                </RequireAuth>
              }
            />
            <Route
              path="/thanh-toan/ket-qua"
              element={
                <RequireAuth>
                  <PaymentResultPage />
                </RequireAuth>
              }
            />
            <Route
              path="/don-hang"
              element={
                <RequireAuth>
                  <Navigate to="/tai-khoan#orders" replace />
                </RequireAuth>
              }
            />

            {/* QR Scan & Shortcuts */}
            <Route path="/qr/:token" element={<PoiRedirect />} />
            <Route path="/diem/:slug" element={<PoiRedirect />} />
            <Route path="/quet-ma" element={<ScanPage />} />
            {/* Trang quét QR đăng nhập: chỉ cho tài khoản đã đăng ký + xác thực
                email (kiểu Zalo) được quét; khách dùng mật khẩu/guest mode. */}
            <Route path="/quet-qr-dang-nhap" element={<QrLoginScanPage />} />
            <Route path="/nhan-dang-nhap" element={<QrHandoffReceivePage />} />
            <Route path="/qr-tai-khoan" element={<AccountLoginQrPage />} />

            {/* User & Auth */}
            <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />
            <Route path="/xac-thuc-email" element={<VerifyEmailPage />} />
            <Route path="/tai-khoan" element={<AccountPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartDialog />
      <BackToTop />

      {/* Auth Modal renders as floating layer above the current / background route */}
      {isAuthModalRoute && <AuthModal />}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PremiumProvider>
          <ToastProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </ToastProvider>
        </PremiumProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
