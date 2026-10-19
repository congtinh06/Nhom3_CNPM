import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../services/addressService', () => ({
  getAllProvinces: vi.fn().mockResolvedValue([
    { code: '79', name: 'Thành phố Hồ Chí Minh' },
  ]),
  getDistrictsByProvince: vi.fn().mockResolvedValue([
    { code: '760', name: 'Quận 1' },
  ]),
  getWardsByDistrict: vi.fn().mockResolvedValue([
    { code: '26734', name: 'Phường Bến Nghé' },
  ]),
}));

vi.mock('../api/auth', () => ({
  authApi: {
    refresh: vi.fn().mockResolvedValue(null),
  },
}));

import { CheckoutPage } from '../pages/CheckoutPage';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

const renderPage = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <CheckoutPage />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );

const seedCart = () => {
  localStorage.setItem('cart', JSON.stringify({ 101: 1, 102: 2 }));
  localStorage.setItem(
    'cart_meta',
    JSON.stringify({
      101: {
        name: 'Nón lá làng Chuông',
        price: 85000,
        category: 'SOUVENIR',
        imagePath: '/img/non-la.jpg',
        poiSlug: 'cho-ben-thanh',
      },
      102: {
        name: 'Áo bà ba',
        price: 120000,
        category: 'SOUVENIR',
        imagePath: '/img/ao-ba-ba.jpg',
        poiSlug: null,
      },
    })
  );
};

describe('CheckoutPage (redesigned)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the empty cart state when there are no items', () => {
    renderPage();

    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    expect(screen.getByText('Khám phá quà lưu niệm')).toBeInTheDocument();
  });

  it('renders the three form sections and drops the delivery and voucher blocks', async () => {
    seedCart();
    renderPage();

    expect(await screen.findByText('Thông tin liên hệ')).toBeInTheDocument();
    expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
    expect(screen.getByText('Phương thức thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Tóm tắt đơn hàng')).toBeInTheDocument();

    expect(screen.queryByText('Thời gian nhận hàng')).toBeNull();
    expect(screen.queryByText(/Mã giảm giá/)).toBeNull();
  });

  it('groups summary items by souvenir spot with a fallback group', async () => {
    seedCart();
    renderPage();

    expect(await screen.findByText('Từ Chợ Bến Thành')).toBeInTheDocument();
    expect(screen.getByText('Sản phẩm khác')).toBeInTheDocument();
  });

  it('renders the new payment copy with the demo notice', async () => {
    seedCart();
    renderPage();

    expect(await screen.findByText('Chuyển khoản VietQR')).toBeInTheDocument();
    expect(
      screen.getByText('Quét mã QR để thanh toán sau khi đặt hàng.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Thanh toán thử trong môi trường demo, không phát sinh giao dịch thật.')
    ).toBeInTheDocument();
    expect(screen.getByText('Thanh toán khi nhận hàng')).toBeInTheDocument();
    expect(
      screen.getByText('Trả tiền mặt khi nhận được sản phẩm.')
    ).toBeInTheDocument();
  });

  it('keeps the place order button clickable and shows the required fields reason', async () => {
    seedCart();
    renderPage();

    const button = await screen.findByRole('button', { name: 'Đặt hàng' });
    expect(button).toBeEnabled();
    expect(
      screen.getByText('Vui lòng điền đủ các ô có dấu * để đặt hàng.')
    ).toBeInTheDocument();
  });

  it('reveals the field errors when placing an order with an incomplete form', async () => {
    seedCart();
    renderPage();

    const button = await screen.findByRole('button', { name: 'Đặt hàng' });
    fireEvent.click(button);

    expect(await screen.findByText('Vui lòng nhập họ và tên.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập số điện thoại.')).toBeInTheDocument();
  });

  it('renders the optional delivery options', async () => {
    seedCart();
    renderPage();

    expect(await screen.findByText('Tùy chọn giao hàng')).toBeInTheDocument();
    expect(screen.getByLabelText(/Khung giờ giao hàng mong muốn/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ghi chú giao hàng/)).toBeInTheDocument();
    expect(screen.getByLabelText('Giao cho người khác')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Tên người nhận/)).toBeNull();

    fireEvent.click(screen.getByLabelText('Giao cho người khác'));
    expect(await screen.findByLabelText(/Tên người nhận/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại người nhận/)).toBeInTheDocument();
  });

  it('shows a field error after blur and clears it once valid', async () => {
    seedCart();
    renderPage();

    const nameInput = await screen.findByLabelText(/Họ và tên/);
    expect(screen.queryByText('Họ và tên cần ít nhất 2 ký tự.')).toBeNull();

    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.blur(nameInput);
    expect(await screen.findByText('Họ và tên cần ít nhất 2 ký tự.')).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: 'An' } });
    await waitFor(() =>
      expect(screen.queryByText('Họ và tên cần ít nhất 2 ký tự.')).toBeNull()
    );
  });

  it('clears the reason line when the form is valid and terms accepted', async () => {
    seedCart();
    renderPage();

    const nameInput = await screen.findByLabelText(/Họ và tên/);
    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn An' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/), {
      target: { value: '0901234567' },
    });
    fireEvent.change(screen.getByLabelText(/Số nhà, tên đường/), {
      target: { value: '12 Nguyễn Huệ' },
    });

    await screen.findByRole('option', { name: 'Quận 1' });
    fireEvent.change(screen.getByLabelText(/Quận \/ Huyện/), {
      target: { value: '760' },
    });

    await screen.findByRole('option', { name: 'Phường Bến Nghé' });
    fireEvent.change(screen.getByLabelText(/Phường \/ Xã/), {
      target: { value: '26734' },
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Điều khoản/ }));

    await waitFor(() =>
      expect(
        screen.queryByText('Vui lòng điền đủ các ô có dấu * để đặt hàng.')
      ).toBeNull()
    );
    expect(
      screen.queryByText('Vui lòng đồng ý với Điều khoản dịch vụ để đặt hàng.')
    ).toBeNull();
  });

  it('requires the other recipient name and phone when delivering to someone else', async () => {
    seedCart();
    renderPage();

    fireEvent.click(await screen.findByLabelText('Giao cho người khác'));

    const otherName = await screen.findByLabelText(/Tên người nhận/);
    fireEvent.change(otherName, { target: { value: 'A' } });
    fireEvent.blur(otherName);
    fireEvent.blur(screen.getByLabelText(/Số điện thoại người nhận/));

    expect(
      await screen.findByText('Vui lòng nhập tên người nhận (ít nhất 2 ký tự).')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Vui lòng nhập số điện thoại người nhận.')
    ).toBeInTheDocument();
  });
});
