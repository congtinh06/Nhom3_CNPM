import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { authApi } from '../api/auth';
import { normalizeApiError } from '../api/errors';
import { tokenStore } from '../api/tokenStore';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider } from '../context/CartContext';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { Header } from '../components/layout/Header';

vi.mock('../api/auth', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
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
    approveQrLogin: vi.fn(),
    denyQrLogin: vi.fn(),
    exchangeQrSession: vi.fn(),
    cancelQrSession: vi.fn(),
  },
}));

const USER = {
  id: 7,
  fullName: 'Nguyễn Văn A',
  email: 'a@example.com',
  role: 'USER' as const,
  emailVerified: true,
  plan: 'FREE' as const,
  premiumActive: false,
};

function renderWithAuth(ui: React.ReactElement, initialPath = '/dang-nhap') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>{ui}</CartProvider>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('tokenStore', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('sets, reads and clears the access token', () => {
    expect(tokenStore.get()).toBeNull();
    tokenStore.set('abc.def.ghi');
    expect(tokenStore.get()).toBe('abc.def.ghi');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });
});

describe('normalizeApiError details', () => {
  it('exposes field-level details from a 400 response', () => {
    const norm = normalizeApiError({
      response: {
        status: 400,
        data: { message: 'Dữ liệu không hợp lệ', details: { password: 'Mật khẩu quá yếu.' } },
      },
    });
    expect(norm.details).toEqual({ password: 'Mật khẩu quá yếu.' });
  });

  it('leaves details undefined when the body has none', () => {
    const norm = normalizeApiError({ response: { status: 400, data: { message: 'Lỗi' } } });
    expect(norm.details).toBeUndefined();
  });
});

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
  });

  it('reports guest when the boot refresh call is rejected', async () => {
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });

    function Probe() {
      const { status, isAuthenticated } = useAuth();
      return (
        <span data-testid="probe">
          {status}/{String(isAuthenticated)}
        </span>
      );
    }

    renderWithAuth(<Probe />);

    expect(screen.getByTestId('probe')).toHaveTextContent('loading/false');
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('guest/false'));
  });

  it('restores the session and stores the access token on boot', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'restored.token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: USER,
    });

    function Probe() {
      const { status, user } = useAuth();
      return (
        <span data-testid="probe">
          {status}/{user?.email ?? '-'}
        </span>
      );
    }

    renderWithAuth(<Probe />);

    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('authenticated/a@example.com'));
    expect(tokenStore.get()).toBe('restored.token');
  });
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });
  });

  it('renders the login form', async () => {
    renderWithAuth(<LoginPage />);
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ban@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu', { selector: 'input' })).toBeInTheDocument();
  });

  it('surfaces the server message when login fails with 401', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { status: 401, data: { message: 'Email hoặc mật khẩu không đúng.' } },
    });

    renderWithAuth(<LoginPage />);

    fireEvent.change(await screen.findByPlaceholderText('ban@example.com'), {
      target: { value: 'a@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu', { selector: 'input' }), {
      target: { value: 'matkhau123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Email hoặc mật khẩu không đúng.');
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'a@example.com',
      password: 'matkhau123',
      rememberMe: false,
    });
  });

  it('submits the credentials and rememberMe flag on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'new.token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: USER,
    });

    renderWithAuth(<LoginPage />);

    fireEvent.change(await screen.findByPlaceholderText('ban@example.com'), {
      target: { value: '  a@example.com ' },
    });
    fireEvent.change(screen.getByLabelText('Mật khẩu', { selector: 'input' }), {
      target: { value: 'matkhau123' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /Duy trì đăng nhập/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'a@example.com',
        password: 'matkhau123',
        rememberMe: true,
      })
    );
    await waitFor(() => expect(tokenStore.get()).toBe('new.token'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });
  });

  it('toggles password visibility with the eye icon', async () => {
    renderWithAuth(<RegisterPage />, '/dang-ky');

    const password = await screen.findByPlaceholderText('Tối thiểu 8 ký tự');
    const confirm = screen.getByPlaceholderText('Nhập lại mật khẩu');
    expect(password).toHaveAttribute('type', 'password');
    expect(confirm).toHaveAttribute('type', 'password');

    const eyes = screen.getAllByRole('button', { name: /^(Hiện|Ẩn) mật khẩu$/ });
    expect(eyes).toHaveLength(2);
    const [eyePassword, eyeConfirm] = eyes as [HTMLElement, HTMLElement];

    fireEvent.click(eyePassword);
    expect(password).toHaveAttribute('type', 'text');
    expect(confirm).toHaveAttribute('type', 'password');

    fireEvent.click(eyeConfirm);
    expect(confirm).toHaveAttribute('type', 'text');
    expect(password).toHaveAttribute('type', 'text');
  });

  it('blocks submission when password confirmation does not match', async () => {    renderWithAuth(<RegisterPage />, '/dang-ky');

    expect(await screen.findByRole('heading', { name: 'Tạo tài khoản' })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('ban@example.com'), {
      target: { value: 'a@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tối thiểu 8 ký tự'), {
      target: { value: 'matkhau123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'khacnhau1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(await screen.findByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('registers and shows the verification notice', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    });

    renderWithAuth(<RegisterPage />, '/dang-ky');

    fireEvent.change(await screen.findByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    });
    fireEvent.change(screen.getByPlaceholderText('ban@example.com'), {
      target: { value: 'a@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tối thiểu 8 ký tự'), {
      target: { value: 'matkhau123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), {
      target: { value: 'matkhau123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(await screen.findByRole('heading', { name: 'Kiểm tra email' })).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith({
      fullName: 'Nguyễn Văn A',
      email: 'a@example.com',
      password: 'matkhau123',
      confirmPassword: 'matkhau123',
    });
  });
});

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });
  });

  it('shows both login and register entry points for guests', async () => {
    renderWithAuth(<Header />, '/');
    expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeInTheDocument();
  });

  it('hides the button matching the current auth page', async () => {
    renderWithAuth(<Header />, '/dang-nhap');
    expect(await screen.findByRole('button', { name: 'Đăng ký' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đăng nhập' })).not.toBeInTheDocument();
  });

  it('shows the account entry point once authenticated', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'tok',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: USER,
    });

    renderWithAuth(<Header />);

    const button = await screen.findByRole('button', { name: 'Mở trang tài khoản' });
    expect(button).toBeInTheDocument();
  });
});
