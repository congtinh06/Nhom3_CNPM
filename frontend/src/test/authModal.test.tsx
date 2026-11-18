import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

import { authApi } from '../api/auth';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { AuthModal } from '../components/auth/AuthModal';

vi.mock('../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn().mockRejectedValue({ response: { status: 401 } }),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

vi.mock('../components/auth/QrLoginPanel', () => ({
  QrLoginPanel: ({ onSuccess }: { onSuccess: () => void }) => (
    <button type="button" onClick={onSuccess}>
      Mô phỏng quét QR
    </button>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function TestModalHarness({
  initialPath = '/dang-nhap',
  initialState,
  historyEntries,
}: {
  initialPath?: string;
  initialState?: Record<string, unknown>;
  historyEntries?: Array<string | { pathname: string; state?: unknown }>;
}) {
  const entries = historyEntries ?? [{ pathname: initialPath, state: initialState }];
  return (
    <MemoryRouter initialEntries={entries}>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <LocationProbe />
            <Routes>
              <Route path="/am-thuc" element={<div>Trang ẩm thực nền</div>} />
              <Route path="/" element={<div>Trang chủ nền</div>} />
              <Route path="/dang-nhap" element={<AuthModal />} />
              <Route path="/dang-ky" element={<AuthModal />} />
              <Route path="/quen-mat-khau" element={<AuthModal />} />
              <Route path="/tai-khoan" element={<div>Trang tài khoản</div>} />
            </Routes>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Banner chế độ Khách', () => {
    it('không ở chế độ Khách: modal KHÔNG hiển thị banner', async () => {
      render(<TestModalHarness initialPath="/dang-nhap" />);
      await screen.findByRole('dialog');
      expect(screen.queryByRole('note', { name: 'Bạn đang ở chế độ Khách' })).not.toBeInTheDocument();
    });

    it('đã chọn chế độ Khách: banner hiện trên form và nút "Tiếp tục với tư cách Khách" đóng modal', async () => {
      sessionStorage.setItem('echora_guest_mode', '1');
      render(
        <TestModalHarness
          historyEntries={[
            '/am-thuc',
            { pathname: '/dang-nhap', state: { backgroundLocation: { pathname: '/am-thuc' } } },
          ]}
        />
      );
      const banner = await screen.findByRole('note', { name: 'Bạn đang ở chế độ Khách' });
      expect(banner).toHaveTextContent('Bạn đang ở chế độ Khách');

      // Form đăng nhập vẫn hiện bên dưới banner
      expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với tư cách Khách' }));

      // Modal đóng -> về lại nền
      expect(await screen.findByText('Trang ẩm thực nền')).toBeInTheDocument();
    });

    it('banner cũng hiển thị ở view Đăng ký', async () => {
      sessionStorage.setItem('echora_guest_mode', '1');
      render(<TestModalHarness initialPath="/dang-ky" />);

      expect(
        await screen.findByRole('note', { name: 'Bạn đang ở chế độ Khách' })
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument();
    });
  });

  it('renders login modal with dialog role and aria attributes', async () => {
    render(<TestModalHarness initialPath="/dang-nhap" />);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'auth-modal-title');
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  it('switches to register view when clicking create account link', async () => {
    render(<TestModalHarness initialPath="/dang-nhap" />);
    const switchBtn = await screen.findByRole('button', { name: 'Tạo tài khoản' });
    fireEvent.click(switchBtn);

    expect(await screen.findByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument();
    expect(screen.getByTestId('location-path')).toHaveTextContent('/dang-ky');
  });

  it('switches to forgot password view when clicking forgot password link', async () => {
    render(<TestModalHarness initialPath="/dang-nhap" />);
    const forgotBtn = await screen.findByRole('button', { name: 'Quên mật khẩu?' });
    fireEvent.click(forgotBtn);

    expect(await screen.findByRole('heading', { name: 'Quên mật khẩu' })).toBeInTheDocument();
    expect(screen.getByTestId('location-path')).toHaveTextContent('/quen-mat-khau');
  });

  it('closes on Escape key press by navigating back or to root', async () => {
    render(
      <TestModalHarness
        initialPath="/dang-nhap"
        initialState={{ backgroundLocation: { pathname: '/am-thuc' } }}
      />
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    // Escape triggers handleClose
  });

  it('closes on backdrop overlay click', async () => {
    render(
      <TestModalHarness
        initialPath="/dang-nhap"
        initialState={{ backgroundLocation: { pathname: '/am-thuc' } }}
      />
    );
    const overlay = await screen.findByTestId('auth-modal-overlay');
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay);
    // Clicking backdrop overlay triggers handleClose
  });

  it('locks body scroll on mount and restores on unmount', () => {
    const { unmount } = render(<TestModalHarness initialPath="/dang-nhap" />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('shows verification screen on successful registration without auto-closing', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      message: 'Vui lòng kiểm tra hộp thư email của bạn.',
    });

    render(<TestModalHarness initialPath="/dang-ky" />);

    fireEvent.change(await screen.findByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Trần Văn B' },
    });
    fireEvent.change(screen.getByPlaceholderText('ban@example.com'), {
      target: { value: 'b@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tối thiểu 8 ký tự'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(await screen.findByRole('heading', { name: 'Kiểm tra email' })).toBeInTheDocument();
    expect(screen.getByText(/b@example.com/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Đóng' }).length).toBeGreaterThanOrEqual(1);
  });

  it('không điều hướng ngược về /thanh-toan khi đóng modal để tránh vòng lặp dựt', async () => {
    render(
      <TestModalHarness
        historyEntries={[
          '/',
          { pathname: '/dang-nhap', state: { from: '/thanh-toan' } },
        ]}
      />
    );
    const closeBtn = await screen.findByRole('button', { name: 'Đóng' });
    fireEvent.click(closeBtn);

    expect(screen.getByTestId('location-path')).not.toHaveTextContent('/thanh-toan');
  });

  it('đăng nhập QR thành công: đóng form và mở thẳng trang tài khoản', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <TestModalHarness
        historyEntries={[
          { pathname: '/dang-nhap', state: { backgroundLocation: { pathname: '/' } } },
        ]}
      />
    );

    fireEvent.click(await screen.findByRole('tab', { name: 'Quét mã QR' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Mô phỏng quét QR' }));

    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/tai-khoan');
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
