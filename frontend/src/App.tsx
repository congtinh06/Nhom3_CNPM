import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDialog } from './components/cart/CartDialog';
import { BackToTop } from './components/common/BackToTop';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';
import { ScanPage } from './pages/ScanPage';
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
import { AuthModal } from './components/auth/AuthModal';

import { useSmoothScroll } from './hooks/useSmoothScroll';

const NearbyPage = lazy(() => import('./pages/NearbyPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const AppContent: React.FC = () => {
  useSmoothScroll();
  const location = useLocation();

  const state = location.state as {
    backgroundLocation?: { pathname: string; search?: string; hash?: string };
    from?: string;
  } | null;

  const isAuthModalRoute = ['/dang-nhap', '/dang-ky', '/quen-mat-khau'].includes(location.pathname);

  // Background location pattern:
  // If on an auth modal route, render either the previous backgroundLocation or fallback to homepage
  const backgroundLocation = isAuthModalRoute
    ? (state?.backgroundLocation || { pathname: '/', search: '', hash: '' })
    : undefined;

  return (
    <>
      <Header />
      <main>
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
            <Route path="/thuyet-minh" element={<NearbyPage />} />
            <Route path="/gan-toi" element={<NearbyPage />} />
            <Route path="/am-thuc" element={<FoodBeveragePage />} />
            <Route path="/thuc-uong" element={<FoodBeveragePage />} />
            <Route path="/am-thuc-thuc-uong" element={<FoodBeveragePage />} />
            <Route path="/huong-dan" element={<GuidePage />} />
            <Route path="/lien-he" element={<ContactPage />} />

            {/* Product detail routes */}
            <Route path="/am-thuc-thuc-uong/:slug" element={<ProductDetailPage />} />
            <Route path="/am-thuc/:slug" element={<ProductDetailPage />} />
            <Route path="/thuc-uong/:slug" element={<ProductDetailPage />} />

            {/* Checkout & Orders */}
            <Route path="/thanh-toan" element={<CheckoutPage />} />
            <Route path="/thanh-toan/qr/:orderCode" element={<VietQrPage />} />
            <Route path="/thanh-toan/ket-qua" element={<PaymentResultPage />} />
            <Route path="/don-hang" element={<OrdersPage />} />

            {/* QR Scan */}
            <Route path="/qr/:token" element={<ScanPage />} />
            <Route path="/quet-ma" element={<ScanPage />} />

            {/* User & Admin */}
            <Route path="/quan-tri" element={<AdminPage />} />
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
        <ToastProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
