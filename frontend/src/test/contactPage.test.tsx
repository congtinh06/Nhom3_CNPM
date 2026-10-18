import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ContactPage } from '../pages/ContactPage';
import * as feedbackService from '../services/feedbackService';

// Mock Leaflet and react-leaflet so they don't break in jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popup">{children}</div>
  ),
  useMap: () => ({
    invalidateSize: vi.fn(),
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

describe('ContactPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderContactPage = () =>
    render(
      <MemoryRouter initialEntries={['/lien-he']}>
        <ContactPage />
      </MemoryRouter>
    );

  const fillValidForm = () => {
    fireEvent.change(screen.getByLabelText(/Họ và tên/), { target: { value: 'Trần Minh' } });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: 'minh@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Nội dung/), {
      target: { value: 'Nội dung đủ dài để gửi liên hệ cho Echora.' },
    });
  };

  it('renders the hero with local photo, title and subtitle', () => {
    renderContactPage();

    expect(screen.getByRole('heading', { level: 1, name: /Liên hệ/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Gọi điện, gửi email hoặc để lại tin nhắn cho Echora\./i)
    ).toBeInTheDocument();

    const heroImg = document.querySelector<HTMLImageElement>('.contact-hero .page-hero-img');
    expect(heroImg).not.toBeNull();
    expect(heroImg?.getAttribute('src')).toBe('/images/pois/buu-dien-trung-tam.jpg');
  });

  it('lists each contact detail once as links and plain facts', () => {
    renderContactPage();

    expect(screen.getAllByText(/338 An Dương Vương/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/8h - 23h/)[0]).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '0346358399' })).toHaveAttribute(
      'href',
      'tel:0346358399'
    );
    expect(screen.getByRole('link', { name: 'congtinh1932006@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:congtinh1932006@gmail.com'
    );
  });

  it('keeps section headings in sentence case', () => {
    renderContactPage();

    const details = screen.getByRole('heading', { name: 'Thông tin liên hệ' });
    const form = screen.getByRole('heading', { name: 'Gửi tin nhắn' });
    const map = screen.getByRole('heading', { name: 'Vị trí' });

    expect(details).toBeInTheDocument();
    expect(form).toBeInTheDocument();
    expect(map).toBeInTheDocument();
  });

  it('renders required form fields and collapsible optional phone field', () => {
    renderContactPage();

    expect(screen.getByLabelText(/Họ và tên/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nội dung/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi tin nhắn' })).toBeInTheDocument();

    // Phone field is collapsed initially
    expect(screen.queryByLabelText(/Số điện thoại \(không bắt buộc\)/)).toBeNull();

    // Click toggle to reveal optional phone input
    const toggleBtn = screen.getByRole('button', { name: /Thêm số điện thoại/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText(/Số điện thoại \(không bắt buộc\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại \(không bắt buộc\)/)).not.toHaveAttribute('required');
  });

  it('updates the character counter and flags low count upon submission', () => {
    renderContactPage();

    const counter = document.getElementById('contact-message-count')!;
    expect(counter).toHaveAttribute('aria-live', 'polite');
    expect(counter.textContent).toContain('0 / 10 ký tự tối thiểu');
    expect(counter.className).not.toContain('is-low');

    fireEvent.change(screen.getByLabelText(/Nội dung/), { target: { value: 'ngan' } });
    expect(counter.textContent).toContain('4 / 10 ký tự tối thiểu');
    expect(counter.className).not.toContain('is-low');

    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));
    expect(counter.className).toContain('is-low');
  });

  it('shows inline Vietnamese validation errors when submitting empty', async () => {
    const spy = vi.spyOn(feedbackService, 'submitFeedback');
    renderContactPage();

    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    expect(await screen.findByText('Vui lòng nhập họ tên.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập email.')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập nội dung.')).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows inline email error after blur when format is invalid', () => {
    renderContactPage();

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: 'khong-hop-le' } });

    expect(screen.queryByText('Email không hợp lệ.')).toBeNull();

    fireEvent.blur(emailInput);
    expect(screen.getByText('Email không hợp lệ.')).toBeInTheDocument();
  });

  it('submits valid form data and replaces the form with a confirmation state', async () => {
    const spy = vi.spyOn(feedbackService, 'submitFeedback').mockResolvedValueOnce({
      success: true,
      message: 'Cảm ơn bạn đã gửi liên hệ!',
    });

    renderContactPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trần Minh',
        email: 'minh@example.com',
        message: expect.stringContaining('Nội dung đủ dài để gửi liên hệ cho Echora.'),
      })
    );

    expect(await screen.findByText(/Cảm ơn bạn đã gửi liên hệ!/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nội dung/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Gửi tin nhắn khác' })).toBeInTheDocument();
  });

  it('disables the button and shows the sending state while submitting', async () => {
    let resolveSubmit: (value: { success: boolean; message: string }) => void = () => {};
    const pending = new Promise<{ success: boolean; message: string }>((resolve) => {
      resolveSubmit = resolve;
    });
    vi.spyOn(feedbackService, 'submitFeedback').mockReturnValueOnce(pending);

    renderContactPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    const sendingButton = await screen.findByRole('button', { name: 'Đang gửi…' });
    expect(sendingButton).toBeDisabled();

    await act(async () => {
      resolveSubmit({ success: true, message: 'Đã gửi.' });
      await pending;
    });

    expect(await screen.findByText(/Cảm ơn bạn đã gửi liên hệ!/i)).toBeInTheDocument();
  });

  it('keeps the form and reports the error when the submit fails', async () => {
    vi.spyOn(feedbackService, 'submitFeedback').mockRejectedValueOnce(new Error('network'));

    renderContactPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));

    expect(
      await screen.findByText('Không gửi được tin nhắn. Vui lòng thử lại.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nội dung/)).toBeInTheDocument();
  });

  it('renders the interactive map container and directions link to Google Maps', () => {
    renderContactPage();

    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();

    const directionsLink = screen.getByRole('link', { name: /Chỉ đường/i });
    expect(directionsLink).toBeInTheDocument();
    expect(directionsLink).toHaveAttribute('target', '_blank');
    expect(directionsLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=10.7599%2C106.6791'
    );
  });
});
