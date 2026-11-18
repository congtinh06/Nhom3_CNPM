import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { authApi } from '../api/auth';
import { tokenStore } from '../api/tokenStore';
import { AuthProvider } from '../context/AuthContext';
import { QrHandoffReceivePage } from '../pages/QrHandoffReceivePage';
import { QrLoginScanPage } from '../pages/QrLoginScanPage';
import { buildHandoffUrl } from '../components/auth/AccountLoginQr';
import { AuthUser } from '../types';

vi.mock('../hooks/useQrScanner', () => ({
  useQrScanner: () => ({
    videoRef: { current: null },
    active: false,
    error: null,
    start: vi.fn(async () => {}),
    stop: vi.fn(),
  }),
}));

vi.mock('../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    me: vi.fn(),
    createQrSession: vi.fn(),
    qrSessionStatus: vi.fn(),
    scanQrLogin: vi.fn(),
    approveQrLogin: vi.fn(),
    denyQrLogin: vi.fn(),
    exchangeQrSession: vi.fn(),
    cancelQrSession: vi.fn(),
  },
}));

const USER: AuthUser = {
  id: 7,
  fullName: 'Nguyễn Văn A',
  email: 'a@example.com',
  role: 'USER',
  emailVerified: true,
  plan: 'FREE',
  premiumActive: false,
};

const SESSION = {
  sessionId: '44444444-4444-4444-4444-444444444444',
  qrToken: 'handoff-raw',
  exchangeToken: 'handoff-exchange',
  status: 'PENDING' as const,
  expiresAt: '2026-01-01T00:01:00Z',
  expiresInSeconds: 60,
  pollIntervalMs: 1500,
};

function renderReceivePage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <QrHandoffReceivePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('buildHandoffUrl', () => {
  it('tạo URL nhận đăng nhập với token, sessionId và exchangeToken', () => {
    const url = buildHandoffUrl(SESSION, 'https://affection-smokiness-watch.ngrok-free.dev/');
    expect(url).toBe(
      'https://affection-smokiness-watch.ngrok-free.dev/nhan-dang-nhap' +
        '?t=handoff-raw&s=44444444-4444-4444-4444-444444444444&e=handoff-exchange'
    );
  });
});

describe('QrHandoffReceivePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    tokenStore.clear();
  });

  it('điện thoại khách xác nhận sẽ đăng nhập bằng tài khoản của máy tính', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });
    vi.mocked(authApi.exchangeQrSession).mockResolvedValue({
      accessToken: 'access.token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: USER,
    });

    renderReceivePage(
      '/nhan-dang-nhap?t=handoff-raw&s=44444444-4444-4444-4444-444444444444&e=handoff-exchange'
    );

    expect(
      await screen.findByRole('heading', { name: 'Nhận đăng nhập từ máy tính' })
    ).toBeInTheDocument();
    // Không hiển thị email/tên tài khoản trước khi người dùng xác nhận.
    expect(screen.queryByText('a@example.com')).not.toBeInTheDocument();

    const confirmButton = await screen.findByRole('button', { name: /xác nhận đăng nhập/i });
    await waitFor(() => expect(confirmButton).toBeEnabled());
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(authApi.exchangeQrSession).toHaveBeenCalledWith(
        '44444444-4444-4444-4444-444444444444',
        'handoff-exchange'
      )
    );
    expect(
      await screen.findByText('Điện thoại đã đăng nhập cùng tài khoản.')
    ).toBeInTheDocument();
  });

  it('thiết bị đã đăng nhập không tự đổi sang tài khoản khác', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'access.token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: USER,
    });

    renderReceivePage(
      '/nhan-dang-nhap?t=handoff-raw&s=44444444-4444-4444-4444-444444444444&e=handoff-exchange'
    );

    expect(
      await screen.findByText(
        'Thiết bị này đã đăng nhập. Hãy đăng xuất trước khi nhận tài khoản khác.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
    expect(authApi.exchangeQrSession).not.toHaveBeenCalled();
  });

  it('báo lỗi khi thiếu token trong đường dẫn', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });

    renderReceivePage('/nhan-dang-nhap');

    expect(await screen.findByText('Mã QR đã hết hạn.')).toBeInTheDocument();
    expect(authApi.exchangeQrSession).not.toHaveBeenCalled();
  });

  it('mã QR tài khoản mở qua đường dẫn sẽ chuyển sang trang nhận đăng nhập', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });

    const handoffUrl =
      'https://affection-smokiness-watch.ngrok-free.dev/nhan-dang-nhap' +
      '?t=handoff-raw&s=44444444-4444-4444-4444-444444444444&e=handoff-exchange';

    render(
      <MemoryRouter
        initialEntries={[`/quet-qr-dang-nhap?t=${encodeURIComponent(handoffUrl)}`]}
      >
        <AuthProvider>
          <Routes>
            <Route path="/quet-qr-dang-nhap" element={<QrLoginScanPage />} />
            <Route path="/nhan-dang-nhap" element={<QrHandoffReceivePage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { name: 'Nhận đăng nhập từ máy tính' })
    ).toBeInTheDocument();
    // Không gọi nhầm API quét mã của luồng đăng nhập máy tính.
    expect(authApi.scanQrLogin).not.toHaveBeenCalled();
  });
});
