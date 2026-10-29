import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { PremiumProvider } from './context/PremiumContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDialog } from './components/cart/CartDialog';
import { BackToTop } from './components/common/BackToTop';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { ScanPage } from './pages/ScanPage';
import { QrLoginScanPage } from './pages/QrLoginScanPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AccountPage } from './pages/AccountPage';
import { FoodBeveragePage } from './pages/FoodBeveragePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentResultPage } from './pages/PaymentResultPage';
import { VietQrPage } from './pages/VietQrPage';
import { GuidePage } from './pages/GuidePage';
import { ContactPage } from './pages/ContactPage';
import { NewsListPage } from './pages/NewsListPage';
import { NewsDetailPage } from './pages/NewsDetailPage';
import { PremiumPage } from './pages/PremiumPage';
import { AuthModal } from './components/auth/AuthModal';
import { RequireAuth } from './components/auth/RequireAuth';

import { useSmoothScroll } from './hooks/useSmoothScroll';
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

const PoiRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/diem-du-lich?stop=${slug}` : '/diem-du-lich'} replace />;
};

// Legacy souvenir URLs now forward into the "Quà lưu niệm" page at /am-thuc.
const SouvenirTabRedirect: React.FC = () => <Navigate to="/am-thuc" replace />;

const SouvenirSlugRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/am-thuc/${slug}` : '/am-thuc'} replace />;
};

const AppContent: React.FC = () => {
  useSmoothScroll();
  useScrollRestoration();
  const location = useLocation();

  // Đếm 1 lượt truy cập website (VISIT) mỗi phiên tab — phục vụ dashboard
  // quản trị realtime. Trang /quan-tri (admin) không được tính là lượt truy cập.
  useEffect(() => {
    if (location.pathname.startsWith('/quan-tri')) return;
    if (!markVisitRecorded()) return;
    void api
      .recordAnalyticsEvent({
        eventType: 'VISIT',
        languageCode: getClientLanguage(),
        triggerType: getVisitTrigger(location.pathname),
        sessionId: getAnalyticsSessionId(),
      })
      .catch(() => {
        // Analytics lỗi tạm thời không chặn người dùng.
      });
    // Chỉ chạy một lần mỗi phiên tab (markVisitRecorded tự chống lặp StrictMode).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  <OrdersPage />
                </RequireAuth>
              }
            />

            {/* QR Scan */}
            <Route path="/qr/:token" element={<ScanPage />} />
            <Route path="/quet-ma" element={<ScanPage />} />
            {/* Trang quét QR đăng nhập mở cho cả khách: khách quét sẽ chuyển
                máy tính sang chế độ Khách, tài khoản thật quét để chuyển phiên. */}
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
