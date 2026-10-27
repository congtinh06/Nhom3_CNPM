import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PremiumPage } from '../pages/PremiumPage';
import { PremiumProvider } from '../context/PremiumContext';
import { getStoredLanguage, setStoredLanguage } from '../content/languages';
import { createPremiumOrder, getOrderByCode } from '../services/orderService';
import { BackendOrder, PoiGuide } from '../types';

const apiFixtures = vi.hoisted(() => {
  const poiNames = [
    'Dinh Độc Lập',
    'Bảo tàng Chứng tích Chiến tranh',
    'Bưu điện Trung tâm',
    'Nhà thờ Đức Bà',
    'Chợ Bến Thành',
    'Phố đi bộ Nguyễn Huệ',
    'Bến Nhà Rồng',
  ];

  const guides = poiNames.map((name, index) => ({
    id: index + 1,
    code: `POI-${index + 1}`,
    qrToken: `token-${index + 1}`,
    name,
    slug: `poi-${index + 1}`,
    latitude: 10.77,
    longitude: 106.7,
    triggerRadiusMeters: 40,
    zoneId: 1,
    zoneCode: 'ZONE-1',
    categoryCode: 'HISTORY',
    categoryNameVi: 'Di tích',
    translations: {
      en: {
        languageCode: 'en',
        title: `${name} (EN)`,
        description: 'English narration',
        audioUrl: '/audio/en.mp3',
      },
      ja: {
        languageCode: 'ja',
        title: `${name} (JA)`,
        description: 'Japanese narration',
        audioUrl: '/audio/ja.mp3',
      },
      ko: {
        languageCode: 'ko',
        title: `${name} (KO)`,
        description: 'Korean narration',
        audioUrl: '/audio/ko.mp3',
      },
    },
  })) as unknown as PoiGuide[];

  return { guides };
});

const authState = vi.hoisted(() => ({
  plan: 'FREE' as 'FREE' | 'PREMIUM',
  premiumActive: false,
  premiumExpiresAt: null as string | null,
  isAuthenticated: true,
  status: 'authenticated' as 'authenticated' | 'guest',
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    status: authState.status,
    isAuthenticated: authState.isAuthenticated,
    user: {
      id: 1,
      email: 'user@example.com',
      fullName: 'Người dùng Echora',
      role: 'USER',
      emailVerified: true,
      plan: authState.plan,
      premiumActive: authState.premiumActive,
      premiumExpiresAt: authState.premiumExpiresAt,
    },
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../services/orderService', () => ({
  createPremiumOrder: vi.fn(),
  createVnPayPayment: vi.fn(),
  getOrderByCode: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: {
    getPoiGuides: vi.fn(async () => apiFixtures.guides),
    getMeEntitlements: vi.fn(async () => ({
      plan: authState.plan,
      premiumActive: authState.premiumActive,
      premiumExpiresAt: authState.premiumExpiresAt,
      purchasedPois: [],
    })),
  },
}));

function renderPremium(initialRoute = '/nang-cap') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <PremiumProvider>
        <Routes>
          <Route path="/nang-cap" element={<PremiumPage />} />
          <Route path="/diem-du-lich" element={<div>Danh sách điểm đến</div>} />
          <Route path="/dang-nhap" element={<div>Trang đăng nhập</div>} />
          <Route path="/tai-khoan" element={<div>Khu vực tài khoản</div>} />
        </Routes>
      </PremiumProvider>
    </MemoryRouter>
  );
}

describe('PremiumPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    setStoredLanguage('vi');
    authState.plan = 'FREE';
    authState.premiumActive = false;
    authState.premiumExpiresAt = null;
    authState.isAuthenticated = true;
    authState.status = 'authenticated';
    vi.clearAllMocks();
    vi.mocked(createPremiumOrder).mockResolvedValue({
      id: 1,
      orderCode: 'SV-PREMIUM-1000',
      totalAmount: 500000,
      status: 'PENDING_PAYMENT',
      receiverName: 'Echora Premium',
      phone: '0000000000',
      address: 'Goi ky thuat so',
      items: [],
      createdAt: '2026-10-21T00:00:00',
      updatedAt: '2026-10-21T00:00:00',
      orderType: 'PREMIUM',
      paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?demo=1',
    } as BackendOrder);
  });

  it('renders the unified Premium package, discount, and all seven stops', async () => {
    const { container } = renderPremium();

    expect(screen.getByRole('heading', { name: 'Quyền lợi Premium' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Một gói Premium, bốn ngôn ngữ' })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Giảm 10% quà lưu niệm/).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(container.querySelectorAll('.premium-poi-card')).toHaveLength(7);
    });
    expect(container.querySelectorAll('.premium-plan-card')).toHaveLength(1);
    expect(
      container.querySelectorAll('.premium-plan-card .premium-language-badges span')
    ).toHaveLength(4);
    expect(screen.getAllByText(/21 bản thuyết minh/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/7 điểm đến/).length).toBeGreaterThan(0);
    expect(screen.getByText('Dinh Độc Lập')).toBeInTheDocument();
    expect(screen.getByText('Bảo tàng Chứng tích Chiến tranh')).toBeInTheDocument();
    expect(screen.getAllByText('Gói Premium').length).toBeGreaterThan(0);
  });

  it('keeps the requested language and starts a VNPAY checkout', async () => {
    renderPremium('/nang-cap?lang=en&returnTo=/diem-du-lich');

    expect(screen.getByText(/Bạn đã chọn ngôn ngữ cần Premium/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Thanh toán 500.000đ qua VNPAY' })[0]!
    );

    await waitFor(() => {
      expect(createPremiumOrder).toHaveBeenCalledTimes(1);
    });
    expect(getStoredLanguage()).toBe('en');
    expect(localStorage.getItem('echora:premium')).toBeNull();
  });

  it('renders active entitlement state on Premium card when user is premium', () => {
    authState.plan = 'PREMIUM';
    authState.premiumActive = true;
    authState.premiumExpiresAt = '2027-10-21T00:00:00';
    const { container } = renderPremium();

    expect(screen.getByText('Premium đang hoạt động')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tiếp tục trải nghiệm' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Thanh toán 500\.000đ/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Có hiệu lực đến/i)).toBeInTheDocument();
    const offerBadges = container.querySelectorAll('.premium-offer .premium-language-badges .is-open');
    expect(offerBadges.length).toBe(3);
  });

  it('polls order status on return from payment and handles success', async () => {
    const mockGetOrder = vi.mocked(getOrderByCode);
    mockGetOrder.mockResolvedValueOnce({
      id: 1,
      orderCode: 'SV-PREMIUM-1000',
      totalAmount: 500000,
      status: 'PAID',
      paymentStatus: 'SUCCESS',
      receiverName: 'Echora Premium',
      phone: '0000000000',
      address: 'Goi ky thuat so',
      orderType: 'PREMIUM',
      items: [],
      createdAt: '2026-10-21T00:00:00',
      updatedAt: '2026-10-21T00:00:00',
    } as BackendOrder);

    sessionStorage.setItem('echora:pending_premium_order', 'SV-PREMIUM-1000');
    renderPremium('/nang-cap?orderCode=SV-PREMIUM-1000&status=success');

    await waitFor(() => {
      expect(mockGetOrder).toHaveBeenCalledWith('SV-PREMIUM-1000');
    });
  });

  it('displays cancellation feedback when returning from cancelled payment', () => {
    renderPremium('/nang-cap?status=cancelled');

    expect(screen.getAllByText(/Giao dịch đã bị hủy/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('routes guests through sign-in before creating a Premium order', () => {
    authState.isAuthenticated = false;
    authState.status = 'guest';
    renderPremium('/nang-cap?lang=ja');

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Thanh toán 500.000đ qua VNPAY' })[0]!
    );

    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(createPremiumOrder).not.toHaveBeenCalled();
  });
});
