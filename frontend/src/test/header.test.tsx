import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
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

function renderHeader(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <CartProvider>
          <Header />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Header Navigation Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore.clear();
    localStorage.clear();
    vi.mocked(authApi.refresh).mockRejectedValue({ response: { status: 401 } });
  });

  describe('Phần giữa: Cấu trúc điều hướng desktop', () => {
    it('hiển thị đúng 5 mục: Trang chủ, Điểm du lịch, Quà lưu niệm, Tin tức, Liên hệ', async () => {
      renderHeader('/');

      const nav = await screen.findByRole('navigation', { name: 'Chính' });
      expect(nav).toBeInTheDocument();

      // Trang chủ
      const homeLink = screen.getByRole('link', { name: 'Trang chủ' });
      expect(homeLink).toHaveAttribute('href', '/');
      expect(homeLink).toHaveAttribute('aria-current', 'page');

      // Điểm du lịch trỏ tới /diem-du-lich với title/ghi chú Thuyết minh
      const attractionsLink = screen.getByRole('link', { name: 'Điểm du lịch' });
      expect(attractionsLink).toBeInTheDocument();
      expect(attractionsLink).toHaveAttribute('href', '/diem-du-lich');
      expect(attractionsLink).toHaveAttribute('title', 'Thuyết minh');
      expect(attractionsLink).toHaveAttribute('data-nav', 'thuyet-minh');

      // Quà lưu niệm trỏ tới /am-thuc
      const foodLink = screen.getByRole('link', { name: 'Quà lưu niệm' });
      expect(foodLink).toBeInTheDocument();
      expect(foodLink).toHaveAttribute('href', '/am-thuc');

      // Tin tức (trang riêng) trỏ tới /tin-tuc
      const newsLink = screen.getByRole('link', { name: 'Tin tức' });
      expect(newsLink).toBeInTheDocument();
      expect(newsLink).toHaveAttribute('href', '/tin-tuc');

      // Liên hệ (trang riêng) trỏ tới /lien-he
      const contactLink = screen.getByRole('link', { name: 'Liên hệ' });
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute('href', '/lien-he');

      // Danh sách thứ tự chính xác: Trang chủ, Điểm du lịch, Quà lưu niệm, Tin tức, Liên hệ
      const directLinks = Array.from(nav.children)
        .filter((el) => el.tagName === 'A')
        .map((el) => el.textContent?.trim());
      expect(directLinks).toEqual([
        'Trang chủ',
        'Điểm du lịch',
        'Quà lưu niệm',
        'Tin tức',
        'Liên hệ',
      ]);

      // Không còn Giới thiệu, Khám phá hay Văn hóa
      expect(directLinks).not.toContain('Giới thiệu');
      expect(directLinks).not.toContain('Khám phá');
      expect(directLinks).not.toContain('Văn hóa');
    });

    it('gạch chân màu nhấn và aria-current cho mục active tương ứng với trang hiện tại', async () => {
      renderHeader('/am-thuc');

      const foodLink = await screen.findByRole('link', { name: 'Quà lưu niệm' });
      expect(foodLink).toHaveClass('active');
      expect(foodLink).toHaveAttribute('aria-current', 'page');
    });

    it('đánh dấu active cho trang Tin tức khi truy cập /tin-tuc', async () => {
      renderHeader('/tin-tuc');

      const newsLink = await screen.findByRole('link', { name: 'Tin tức' });
      expect(newsLink).toHaveClass('active');
      expect(newsLink).toHaveAttribute('aria-current', 'page');
    });

    it('đánh dấu active cho trang Liên hệ khi truy cập /lien-he', async () => {
      renderHeader('/lien-he');

      const contactLink = await screen.findByRole('link', { name: 'Liên hệ' });
      expect(contactLink).toHaveClass('active');
      expect(contactLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Cụm bên phải: Trạng thái giỏ hàng và auth', () => {
    it('giỏ hàng chỉ icon, không hiện badge khi số lượng bằng 0', async () => {
      renderHeader('/');

      const cartBtn = await screen.findByLabelText(/Giỏ hàng/i);
      expect(cartBtn).toBeInTheDocument();
      expect(cartBtn.querySelector('#cc')).not.toBeInTheDocument();
    });

    it('giỏ hàng hiện badge tròn nhỏ với số lượng khi totalCount > 0', async () => {
      localStorage.setItem('cart', JSON.stringify({ 1: 3 }));
      renderHeader('/');

      const cartBtn = await screen.findByLabelText(/Giỏ hàng: 3/i);
      expect(cartBtn).toBeInTheDocument();
      const badge = cartBtn.querySelector('#cc');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('3');
      expect(badge).toHaveClass('cart-badge');
    });

    it('chưa đăng nhập: Đăng nhập là chữ trơn, Đăng ký là nút đặc nâu, không có khung bao ngoài quầng sáng', async () => {
      renderHeader('/');

      // Không còn class .auth-inline-group
      expect(document.querySelector('.auth-inline-group')).not.toBeInTheDocument();

      const loginBtn = await screen.findByRole('button', { name: 'Đăng nhập' });
      expect(loginBtn).toBeInTheDocument();
      expect(loginBtn).toHaveClass('hd-login-btn');
      expect(loginBtn).not.toHaveClass('hd-auth--ghost');

      const registerBtn = screen.getByRole('button', { name: 'Đăng ký' });
      expect(registerBtn).toBeInTheDocument();
      expect(registerBtn).toHaveClass('hd-register-btn');
      expect(registerBtn).not.toHaveClass('hd-auth--solid');
    });

    it('đã đăng nhập: thay Đăng nhập/Đăng ký bằng tên người dùng kèm menu Đơn hàng của tôi và Đăng xuất', async () => {
      vi.mocked(authApi.refresh).mockResolvedValue({
        accessToken: 'tok',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: MOCK_USER,
      });

      renderHeader('/');

      // Nút tài khoản có tên người dùng xuất hiện sau khi auth resolve
      const userBtn = await screen.findByRole('button', { name: 'Mở trang tài khoản' });
      expect(userBtn).toBeInTheDocument();
      expect(userBtn).toHaveTextContent('Nguyễn Văn A');

      // Không còn nút Đăng nhập / Đăng ký
      expect(screen.queryByRole('button', { name: 'Đăng nhập' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Đăng ký' })).not.toBeInTheDocument();

      // Dropdown menu tài khoản (mở bằng cách bấm trigger)
      fireEvent.click(userBtn);
      const accountMenu = screen.getByRole('menu', { name: 'Tùy chọn người dùng' });
      expect(accountMenu).toBeInTheDocument();

      // Mục Đơn hàng của tôi
      const ordersLink = screen.getByRole('menuitem', { name: 'Đơn hàng của tôi' });
      expect(ordersLink).toBeInTheDocument();
      expect(ordersLink).toHaveAttribute('href', '/don-hang');

      // Mục Đăng xuất
      const logoutBtn = screen.getByRole('menuitem', { name: 'Đăng xuất' });
      expect(logoutBtn).toBeInTheDocument();
    });
  });

  describe('Menu chế độ Khách', () => {
    it('người chưa đăng nhập thường (chưa chọn Khách): hiển thị Đăng nhập/Đăng ký, KHÔNG có GuestMenu', async () => {
      renderHeader('/');

      await screen.findByRole('button', { name: 'Đăng nhập' });
      expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeInTheDocument();
      expect(screen.queryByTestId('header-guest-menu')).not.toBeInTheDocument();
    });

    it('đã chọn chế độ Khách: GuestMenu thay thế hoàn toàn cụm Đăng nhập/Đăng ký ở thanh điều hướng', async () => {
      sessionStorage.setItem('echora_guest_mode', '1');
      renderHeader('/');

      const guestMenu = await screen.findByTestId('header-guest-menu');
      expect(guestMenu).toBeInTheDocument();
      expect(guestMenu).toHaveTextContent('Khách');

      // Nút Đăng nhập/Đăng ký ở thanh ngoài bị thay thế hoàn toàn
      expect(screen.queryByRole('button', { name: 'Đăng nhập' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Đăng ký' })).not.toBeInTheDocument();

      // Bấm vào GuestMenu sẽ mở dropdown chứa Đăng nhập, Đăng ký và Thoát chế độ Khách
      act(() => {
        fireEvent.click(guestMenu);
      });
      expect(await screen.findByRole('menuitem', { name: /Đăng nhập/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Đăng ký/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Thoát chế độ Khách/i })).toBeInTheDocument();
    });

    it('gỡ chế độ Khách liền tay khi cờ bị xóa (event echora-guest-mode-changed)', async () => {
      sessionStorage.setItem('echora_guest_mode', '1');
      renderHeader('/');

      const guestMenu = await screen.findByTestId('header-guest-menu');
      expect(guestMenu).toBeInTheDocument();

      act(() => {
        sessionStorage.clear();
        localStorage.clear();
        window.dispatchEvent(new Event('echora-guest-mode-changed'));
      });

      expect(screen.queryByTestId('header-guest-menu')).not.toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeInTheDocument();
    });
  });

  describe('Mobile Menu (< 900px)', () => {
    it('nút menu hamburger mở/đóng mobile panel chứa các mục điều hướng', async () => {
      renderHeader('/');

      const menuToggle = await screen.findByRole('button', { name: 'Mở menu' });
      expect(menuToggle).toBeInTheDocument();

      const mobilePanel = document.getElementById('mobile-nav-panel');
      expect(mobilePanel).toBeInTheDocument();
      expect(mobilePanel).not.toHaveClass('open');

      // Bấm mở menu
      act(() => {
        fireEvent.click(menuToggle);
      });
      expect(mobilePanel).toHaveClass('open');
      expect(screen.getByRole('button', { name: 'Đóng menu' })).toBeInTheDocument();
    });
  });
});
