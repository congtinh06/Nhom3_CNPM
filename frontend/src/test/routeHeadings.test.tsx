import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { PremiumProvider } from '../context/PremiumContext';

// Import pages
import { HomePage } from '../pages/HomePage';
import { FoodBeveragePage } from '../pages/FoodBeveragePage';
import { NewsListPage } from '../pages/NewsListPage';
import { NewsDetailPage } from '../pages/NewsDetailPage';
import { GuidePage } from '../pages/GuidePage';
import { ContactPage } from '../pages/ContactPage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { PremiumPage } from '../pages/PremiumPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrdersPage } from '../pages/OrdersPage';
import { ScanPage } from '../pages/ScanPage';
import { QrLoginScanPage } from '../pages/QrLoginScanPage';
import { QrHandoffReceivePage } from '../pages/QrHandoffReceivePage';
import { AccountLoginQrPage } from '../pages/AccountLoginQrPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { AccountPage } from '../pages/AccountPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { VietQrPage } from '../pages/VietQrPage';

// Mock Worker and URL for qr-scanner
class MockWorker {
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}
(globalThis as unknown as { Worker: typeof MockWorker }).Worker = MockWorker;
if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
}
if (!globalThis.URL.revokeObjectURL) {
  globalThis.URL.revokeObjectURL = vi.fn();
}

// Mock canvas for CoverSection
beforeEach(() => {
  window.scrollTo = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  });
});

vi.mock('../api/client', () => ({
  api: {
    recordAnalyticsEvent: vi.fn().mockResolvedValue({}),
    recordPresence: vi.fn().mockResolvedValue({}),
    getProducts: vi.fn().mockResolvedValue({ content: [], totalPages: 1 }),
    getProductBySlug: vi.fn().mockResolvedValue({
      id: 1,
      slug: 'com-tam-ba-ghien',
      name: 'Cơm tấm Ba Ghiền',
      price: 65000,
      description: 'Món ăn đặc trưng Sài Gòn',
      category: 'FOOD',
      poiId: 1,
      isActive: true,
      images: [],
    }),
    getPois: vi.fn().mockResolvedValue([]),
    getMyOrders: vi.fn().mockResolvedValue([]),
    getOrder: vi.fn().mockResolvedValue({
      orderCode: 'ECH-123456',
      totalAmount: 100000,
      orderStatus: 'PENDING_PAYMENT',
      paymentMethod: 'VIETQR',
      items: [],
    }),
  },
}));

vi.mock('../services/vietQrService', () => ({
  getVietQrPaymentInfo: vi.fn().mockResolvedValue({
    orderCode: 'ECH-123456',
    amount: 100000,
    qrDataUrl: 'data:image/png;base64,mock',
    transferContent: 'ECH123456',
    bankName: 'MB Bank',
    accountNumber: '999999999',
    accountName: 'CONG TY ECHORA',
    expiresAt: new Date(Date.now() + 900000).toISOString(),
  }),
  getVietQrPaymentStatus: vi.fn().mockResolvedValue({
    status: 'PENDING_PAYMENT',
    paymentStatus: 'UNPAID',
    expiresAt: new Date(Date.now() + 900000).toISOString(),
  }),
  isVietQrPaid: vi.fn().mockReturnValue(false),
  VietQrError: class VietQrError extends Error {},
}));

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 1, email: 'test@echora.local', fullName: 'Tester', role: 'USER' },
    isAuthenticated: true,
    status: 'authenticated',
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  useAuthOptional: () => ({
    user: { id: 1, email: 'test@echora.local', fullName: 'Tester', role: 'USER' },
    isAuthenticated: true,
    status: 'authenticated',
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const renderRoute = (pattern: string, initialPath: string, element: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <CartProvider>
          <PremiumProvider>
            <Routes>
              <Route path={pattern} element={element} />
            </Routes>
          </PremiumProvider>
        </CartProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Route Headings Verification (TASK 4: exactly one h1 per route)', () => {
  const routes = [
    { name: 'HomePage', pattern: '/', path: '/', element: <HomePage /> },
    { name: 'FoodBeveragePage', pattern: '/am-thuc', path: '/am-thuc', element: <FoodBeveragePage /> },
    { name: 'NewsListPage', pattern: '/tin-tuc', path: '/tin-tuc', element: <NewsListPage /> },
    { name: 'NewsDetailPage', pattern: '/tin-tuc/:slug', path: '/tin-tuc/cho-ben-thanh-dem', element: <NewsDetailPage /> },
    { name: 'GuidePage', pattern: '/huong-dan', path: '/huong-dan', element: <GuidePage /> },
    { name: 'ContactPage', pattern: '/lien-he', path: '/lien-he', element: <ContactPage /> },
    { name: 'PrivacyPolicyPage', pattern: '/chinh-sach-quyen-rieng-tu', path: '/chinh-sach-quyen-rieng-tu', element: <PrivacyPolicyPage /> },
    { name: 'PremiumPage', pattern: '/nang-cap', path: '/nang-cap', element: <PremiumPage /> },
    { name: 'ProductDetailPage', pattern: '/am-thuc/:slug', path: '/am-thuc/com-tam-ba-ghien', element: <ProductDetailPage /> },
    { name: 'CheckoutPage', pattern: '/thanh-toan', path: '/thanh-toan', element: <CheckoutPage /> },
    { name: 'OrdersPage', pattern: '/don-hang', path: '/don-hang', element: <OrdersPage /> },
    { name: 'ScanPage', pattern: '/quet-ma', path: '/quet-ma', element: <ScanPage /> },
    { name: 'QrLoginScanPage', pattern: '/quet-qr-dang-nhap', path: '/quet-qr-dang-nhap', element: <QrLoginScanPage /> },
    { name: 'QrHandoffReceivePage', pattern: '/nhan-dang-nhap', path: '/nhan-dang-nhap', element: <QrHandoffReceivePage /> },
    { name: 'AccountLoginQrPage', pattern: '/qr-tai-khoan', path: '/qr-tai-khoan', element: <AccountLoginQrPage /> },
    { name: 'ResetPasswordPage', pattern: '/dat-lai-mat-khau', path: '/dat-lai-mat-khau', element: <ResetPasswordPage /> },
    { name: 'VerifyEmailPage', pattern: '/xac-thuc-email', path: '/xac-thuc-email', element: <VerifyEmailPage /> },
    { name: 'AccountPage', pattern: '/tai-khoan', path: '/tai-khoan', element: <AccountPage /> },
    { name: 'VietQrPage', pattern: '/thanh-toan/qr/:orderCode', path: '/thanh-toan/qr/ECH-123456', element: <VietQrPage /> },
    { name: 'NotFoundPage', pattern: '/404', path: '/404', element: <NotFoundPage /> },
  ];

  routes.forEach(({ name, pattern, path, element }) => {
    it(`route [${path}] (${name}) has exactly 1 <h1> heading`, async () => {
      const { container } = renderRoute(pattern, path, element);
      await waitFor(() => {
        const h1Elements = container.querySelectorAll('h1');
        expect(h1Elements.length).toBe(1);
      }, { timeout: 2000 });
      const h1 = container.querySelector('h1');
      expect(h1).not.toBeNull();
      console.log(`PASS: Route [${path}] has 1 h1: "${h1?.textContent?.trim()}"`);
    });
  });
});

