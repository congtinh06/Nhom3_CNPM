import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { authApi } from '../api/auth';
import { tokenStore } from '../api/tokenStore';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { QrLoginScanPage } from '../pages/QrLoginScanPage';
import { QrLoginPanel } from '../components/auth/QrLoginPanel';
import { AuthUser } from '../types';

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
    createQrSession: vi.fn(() => new Promise(() => {})),
    qrSessionStatus: vi.fn(),
    scanQrLogin: vi.fn(),
    guestScanQrLogin: vi.fn(),
    approveQrLogin: vi.fn(),
    denyQrLogin: vi.fn(),
    exchangeQrSession: vi.fn(),
    cancelQrSession: vi.fn(),
  },
}));

// Camera trong trang không chạy được trong jsdom: mock hook trả về trạng thái idle.
vi.mock('../hooks/useQrScanner', () => ({
  useQrScanner: () => ({
    videoRef: { current: null },
    active: false,
    error: null,
    start: vi.fn(async () => {}),
    stop: vi.fn(),
  }),
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

const UNVERIFIED_USER: AuthUser = { ...USER, emailVerified: false };

const QR_SCAN_RESULT = {
  sessionId: '11111111-1111-1111-1111-111111111111',
  status: 'SCANNED' as const,
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2026-01-01T00:01:00Z',
  deviceLabel: 'Chrome - Windows',
};

function renderPage(path = '/quet-qr-dang-nhap') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <QrLoginScanPage />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function submitManualToken(token: string) {
  const input = await screen.findByLabelText(/hoặc nhập mã QR/i);
  fireEvent.change(input, { target: { value: token } });
  fireEvent.click(screen.getByRole('button', { name: /tiếp tục/i }));
}

describe('QrLoginScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
  });

  it('khách quét mã sẽ ghi nhận phiên khách và hiển thị thông báo chế độ Khách', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });
    vi.mocked(authApi.guestScanQrLogin).mockResolvedValue({
      ...QR_SCAN_RESULT,
      status: 'GUEST_APPROVED',
    });

    renderPage();

    // Đợi AuthContext kết thúc bootstrap (khách) rồi mới submit token thủ công.
    expect(await screen.findByText(/Bạn chưa có tài khoản/i)).toBeInTheDocument();
    await submitManualToken('tok-guest-1');

    await waitFor(() => expect(authApi.guestScanQrLogin).toHaveBeenCalledWith('tok-guest-1'));
    expect(await screen.findByText('Đã chuyển sang chế độ Khách')).toBeInTheDocument();
    expect(authApi.scanQrLogin).not.toHaveBeenCalled();
  });

  it('tài khoản thật đã xác thực email quét mã sẽ tới màn hình xác nhận rồi duyệt', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'access.token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: USER,
    });
    vi.mocked(authApi.scanQrLogin).mockResolvedValue(QR_SCAN_RESULT);
    vi.mocked(authApi.approveQrLogin).mockResolvedValue({
      ...QR_SCAN_RESULT,
      status: 'APPROVED',
    });

    renderPage();

    // Đợi AuthContext kết thúc bootstrap (tài khoản thật) rồi mới submit.
    expect(await screen.findByText(/Tài khoản thật của bạn:/i)).toBeInTheDocument();
    await submitManualToken('tok-real-1');

    expect(
      await screen.findByRole('heading', { name: 'Xác nhận đăng nhập' })
    ).toBeInTheDocument();
    expect(screen.getByText('Chrome - Windows')).toBeInTheDocument();
    // Email xuất hiện cả ở banner tài khoản thật và bảng thông tin xác nhận.
    expect(screen.getAllByText('a@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Đã xác thực').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /xác nhận đăng nhập/i }));

    await waitFor(() => expect(authApi.approveQrLogin).toHaveBeenCalledWith('tok-real-1'));
    expect(await screen.findByText('Đã xác nhận đăng nhập')).toBeInTheDocument();
  });

  it('tài khoản chưa xác thực email hiển thị cảnh báo và không cho chuyển phiên', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'access.token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: UNVERIFIED_USER,
    });
    vi.mocked(authApi.scanQrLogin).mockResolvedValue(QR_SCAN_RESULT);

    renderPage();

    // Đợi bootstrap xong (role banner của tài khoản thật) rồi mới thấy cảnh báo.
    expect(await screen.findByText(/Tài khoản thật của bạn:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Tài khoản chưa xác thực email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gửi lại email xác thực/i })).toBeInTheDocument();
  });
});

describe('QrLoginPanel - chế độ khách', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
  });

  it('khi poll thấy GUEST_APPROVED sẽ gọi onGuestSuccess và không exchange token', async () => {
    // Người dùng thật đã đăng nhập trên desktop để mở modal... nhưng phiên bị
    // đánh dấu GUEST_APPROVED bởi thiết bị di động ở chế độ khách.
    vi.mocked(authApi.createQrSession).mockResolvedValue({
      sessionId: '22222222-2222-2222-2222-222222222222',
      qrToken: 'qr-raw',
      exchangeToken: 'exch-raw',
      status: 'PENDING',
      expiresAt: '2026-01-01T00:01:00Z',
      expiresInSeconds: 60,
      pollIntervalMs: 100,
    });
    vi.mocked(authApi.qrSessionStatus).mockResolvedValue({
      sessionId: '22222222-2222-2222-2222-222222222222',
      status: 'GUEST_APPROVED',
      expiresAt: '2026-01-01T00:01:00Z',
      expiresInSeconds: 30,
      message: 'Thiet bi di dong da chon che do khach.',
    });

    const onSuccess = vi.fn();
    const onGuestSuccess = vi.fn();

    render(
      <AuthProvider>
        <QrLoginPanel onSuccess={onSuccess} onGuestSuccess={onGuestSuccess} />
      </AuthProvider>
    );

    await waitFor(() => expect(onGuestSuccess).toHaveBeenCalled(), { timeout: 5000 });

    expect(authApi.exchangeQrSession).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
