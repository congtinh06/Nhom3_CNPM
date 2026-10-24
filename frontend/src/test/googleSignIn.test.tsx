import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

import { authApi } from '../api/auth';
import { AuthProvider } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';

vi.mock('../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    refresh: vi.fn().mockRejectedValue({ response: { status: 401 } }),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resendVerification: vi.fn(),
    me: vi.fn(),
  },
}));

interface GsiConfig {
  client_id: string;
  callback: (response: { credential?: string }) => void | Promise<void>;
}

let capturedConfig: GsiConfig | null = null;
const gsiRenderButton = vi.fn();
const gsiCancel = vi.fn();

function installGoogleMock() {
  capturedConfig = null;
  (window as unknown as { google: unknown }).google = {
    accounts: {
      id: {
        initialize: vi.fn((config: GsiConfig) => {
          capturedConfig = config;
        }),
        renderButton: gsiRenderButton,
        cancel: gsiCancel,
      },
    },
  };
}

function renderButton(onSuccess = vi.fn(), onError = vi.fn()) {
  return render(
    <AuthProvider>
      <GoogleSignInButton onSuccess={onSuccess} onError={onError} />
    </AuthProvider>
  );
}

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installGoogleMock();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as unknown as { google?: unknown }).google;
  });

  it('ẩn hoàn toàn khi chưa cấu hình VITE_GOOGLE_CLIENT_ID', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    renderButton();

    expect(screen.queryByTestId('google-signin')).not.toBeInTheDocument();
    expect(gsiRenderButton).not.toHaveBeenCalled();
  });

  it('khởi tạo GSI với client_id và render nút khi đã cấu hình', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com');
    renderButton();

    expect(await screen.findByTestId('google-signin')).toBeInTheDocument();
    await waitFor(() => expect(gsiRenderButton).toHaveBeenCalledTimes(1));
    expect(capturedConfig?.client_id).toBe('test-client-id.apps.googleusercontent.com');
  });

  it('gửi credential lên server và gọi onSuccess khi thành công', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com');
    const onSuccess = vi.fn();
    const onError = vi.fn();
    vi.mocked(authApi.loginWithGoogle).mockResolvedValue({
      accessToken: 'jwt',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: 1,
        fullName: 'Khách Google',
        email: 'khach@echora.local',
        role: 'USER',
        emailVerified: true,
        plan: 'FREE',
        premiumActive: false,
        createdAt: new Date().toISOString(),
      },
    });

    renderButton(onSuccess, onError);

    await waitFor(() => expect(capturedConfig).not.toBeNull());
    await act(async () => {
      await capturedConfig!.callback({ credential: 'fake-credential' });
    });

    expect(authApi.loginWithGoogle).toHaveBeenCalledWith('fake-credential');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onError).not.toHaveBeenCalled();
  });

  it('hiển thị thông điệp tiếng Việt khi backend trả 503 (chưa cấu hình)', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com');
    const onSuccess = vi.fn();
    const onError = vi.fn();
    vi.mocked(authApi.loginWithGoogle).mockRejectedValue({ response: { status: 503, data: {} } });

    renderButton(onSuccess, onError);

    await waitFor(() => expect(capturedConfig).not.toBeNull());
    await act(async () => {
      await capturedConfig!.callback({ credential: 'fake-credential' });
    });

    expect(onError).toHaveBeenCalledWith('Đăng nhập Google chưa được cấu hình. Vui lòng thử lại sau.');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
