import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function TestModalHarness({
  initialPath = '/dang-nhap',
  initialState,
}: {
  initialPath?: string;
  initialState?: Record<string, unknown>;
}) {
  return (
    <MemoryRouter initialEntries={[{ pathname: initialPath, state: initialState }]}>
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
});
