import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../components/layout/UserMenu';
import { AuthProvider } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { tokenStore } from '../api/tokenStore';
import { AuthUser } from '../types';

vi.mock('../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

const MOCK_USER: AuthUser = {
  id: 1,
  email: 'nguyenvana@gmail.com',
  fullName: 'Nguyễn Văn A',
  role: 'USER',
  emailVerified: true,
  plan: 'FREE',
  premiumActive: false,
};

function renderUserMenu() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <UserMenu />
      </AuthProvider>
    </MemoryRouter>
  );
}

async function openMenu() {
  const trigger = await screen.findByRole('button', { name: 'Mở trang tài khoản' });
  fireEvent.click(trigger);
  return trigger;
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    localStorage.clear();
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'tok',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: MOCK_USER,
    });
  });

  it('đóng menu mặc định', async () => {
    renderUserMenu();

    const trigger = await screen.findByRole('button', { name: 'Mở trang tài khoản' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('mở menu khi bấm trigger', async () => {
    renderUserMenu();

    const trigger = await openMenu();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Tùy chọn người dùng' })).toBeInTheDocument();
  });

  it('đóng menu bằng Escape và trả focus về trigger', async () => {
    renderUserMenu();

    const trigger = await openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('gọi handler đăng xuất đúng một lần', async () => {
    renderUserMenu();

    await openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));

    await waitFor(() => {
      expect(authApi.logout).toHaveBeenCalledTimes(1);
    });
  });

  it('liên kết đơn hàng trỏ tới đúng route', async () => {
    renderUserMenu();

    await openMenu();
    const ordersLink = screen.getByRole('menuitem', { name: 'Đơn hàng của tôi' });
    expect(ordersLink).toHaveAttribute('href', '/don-hang');
  });

  it('liên kết tài khoản trỏ tới đúng route', async () => {
    renderUserMenu();

    await openMenu();
    const accountLink = screen.getByRole('menuitem', { name: 'Tài khoản của tôi' });
    expect(accountLink).toHaveAttribute('href', '/tai-khoan');
  });

  it('liên kết đăng nhập nhanh trên điện thoại không còn hiển thị', async () => {
    renderUserMenu();

    await openMenu();
    expect(
      screen.queryByRole('menuitem', { name: 'Đăng nhập thiết bị khác bằng QR' })
    ).not.toBeInTheDocument();
  });

  it('di chuyển focus giữa các mục bằng phím mũi tên', async () => {
    renderUserMenu();

    const trigger = await openMenu();
    const accountLink = screen.getByRole('menuitem', { name: 'Tài khoản của tôi' });
    const ordersLink = screen.getByRole('menuitem', { name: 'Đơn hàng của tôi' });
    const signOutBtn = screen.getByRole('menuitem', { name: 'Đăng xuất' });

    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(accountLink).toHaveFocus();

    fireEvent.keyDown(accountLink, { key: 'ArrowDown' });
    expect(ordersLink).toHaveFocus();

    fireEvent.keyDown(ordersLink, { key: 'ArrowDown' });
    expect(signOutBtn).toHaveFocus();

    fireEvent.keyDown(signOutBtn, { key: 'ArrowUp' });
    expect(ordersLink).toHaveFocus();
  });
});
