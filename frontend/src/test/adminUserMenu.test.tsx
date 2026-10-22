import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('UserMenu Admin Link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    localStorage.clear();
  });

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

  it('hiển thị liên kết Quản trị hệ thống khi người dùng có vai trò ADMIN', async () => {
    const adminUser: AuthUser = {
      id: 1,
      email: 'admin@saigonvoice.local',
      fullName: 'Quản Trị Viên',
      role: 'ADMIN',
      emailVerified: true,
      plan: 'FREE',
      premiumActive: false,
    };
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'admin-token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: adminUser,
    });

    renderUserMenu();
    await openMenu();

    const adminLink = screen.getByRole('menuitem', { name: 'Quản trị hệ thống' });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/quan-tri');
  });

  it('KHÔNG hiển thị liên kết Quản trị hệ thống khi người dùng có vai trò USER', async () => {
    const regularUser: AuthUser = {
      id: 2,
      email: 'khach@saigonvoice.local',
      fullName: 'Khách Du Lịch',
      role: 'USER',
      emailVerified: true,
      plan: 'FREE',
      premiumActive: false,
    };
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'user-token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: regularUser,
    });

    renderUserMenu();
    await openMenu();

    expect(screen.queryByRole('menuitem', { name: 'Quản trị hệ thống' })).not.toBeInTheDocument();
  });
});
