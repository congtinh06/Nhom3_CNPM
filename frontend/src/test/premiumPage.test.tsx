import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PremiumPage } from '../pages/PremiumPage';
import { PremiumProvider } from '../context/PremiumContext';
import { getStoredLanguage, setStoredLanguage } from '../content/languages';
import { createPremiumOrder } from '../services/orderService';
import { BackendOrder } from '../types';

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

  it('renders Premium benefits, three language packages, and all five stops', () => {
    const { container } = renderPremium();

    expect(screen.getByRole('heading', { name: 'Quyền lợi Premium' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '3 gói ngôn ngữ trong Premium' })).toBeInTheDocument();
    expect(container.querySelectorAll('.premium-package-card')).toHaveLength(3);
    expect(container.querySelectorAll('.premium-poi-card')).toHaveLength(5);
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

  it('moves an active entitlement to the account area', async () => {
    authState.plan = 'PREMIUM';
    authState.premiumActive = true;
    authState.premiumExpiresAt = '2027-10-21T00:00:00';
    renderPremium();

    await waitFor(() => {
      expect(screen.getByText('Khu vực tài khoản')).toBeInTheDocument();
    });
    expect(screen.queryByText('Premium đang hoạt động')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hủy|tắt|deactivate/i })).not.toBeInTheDocument();
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
