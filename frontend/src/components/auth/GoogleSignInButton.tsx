import React, { useEffect, useRef } from 'react';
import { normalizeApiError } from '../../api/errors';
import { useAuth } from '../../context/AuthContext';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_ID = 'google-gsi-client';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

let gsiScriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Không tải được Google Identity Services.')));
        return;
      }
      const script = document.createElement('script');
      script.id = GSI_SCRIPT_ID;
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không tải được Google Identity Services.'));
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

/** Thông điệp tiếng Việt cho lỗi đăng nhập Google (ưu tiên mã 503/401/403). */
export function googleLoginErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.status === 503) {
    return 'Đăng nhập Google chưa được cấu hình. Vui lòng thử lại sau.';
  }
  if (normalized.status === 401 || normalized.status === 403) {
    return 'Không thể đăng nhập bằng tài khoản Google này.';
  }
  return normalized.message;
}

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

/**
 * Nút "Đăng nhập bằng Google" theo chuẩn Google Identity Services.
 *
 * <p>Ẩn hoàn toàn khi chưa cấu hình {@code VITE_GOOGLE_CLIENT_ID}. Script GSI chỉ được
 * nạp một lần cho cả trang; component an toàn với React StrictMode (khởi tạo lại và
 * xóa nội dung trước khi render để không nhân đôi nút).</p>
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess, onError, disabled = false }) => {
  const { loginWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Giữ callback mới nhất trong ref để effect không phải chạy lại mỗi lần re-render.
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      return;
    }
    let cancelled = false;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      if (!response || !response.credential) {
        onErrorRef.current('Không nhận được thông tin đăng nhập từ Google.');
        return;
      }
      try {
        await loginWithGoogle(response.credential);
        onSuccessRef.current();
      } catch (err) {
        onErrorRef.current(googleLoginErrorMessage(err));
      }
    };

    void loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) {
          return;
        }
        const gsi = window.google?.accounts?.id;
        if (!gsi) {
          return;
        }
        gsi.initialize({ client_id: clientId, callback: handleCredential });
        containerRef.current.innerHTML = '';
        gsi.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320,
        });
      })
      .catch(() => {
        // Không tải được GSI: giữ im lặng, người dùng vẫn đăng nhập bằng mật khẩu.
      });

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // bỏ qua lỗi cleanup
      }
    };
  }, [clientId, loginWithGoogle]);

  if (!clientId) {
    return null;
  }

  return (
    <div
      className={`google-signin${disabled ? ' google-signin--disabled' : ''}`}
      data-testid="google-signin"
      aria-busy={disabled}
    >
      <div ref={containerRef} className="google-signin-host" />
    </div>
  );
};

export default GoogleSignInButton;
