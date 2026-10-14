import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  const renderContactPage = () => {
    return render(
      <MemoryRouter initialEntries={['/lien-he']}>
        <ContactPage />
      </MemoryRouter>
    );
  };

  it('renders PageHero, H1 title, subtitle and quick reach cards', () => {
    renderContactPage();

    // 1. Heading
    expect(screen.getByRole('heading', { level: 1, name: /Liên hệ/i })).toBeInTheDocument();
    expect(screen.getByText(/HỖ TRỢ & ĐỒNG HÀNH/i)).toBeInTheDocument();

    // 2. 4 Quick Info Cards
    expect(screen.getAllByText(/Trung tâm Thông tin Du khách/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Đường dây nóng du khách/i)).toBeInTheDocument();
    expect(screen.getByText(/Hộp thư điện tử/i)).toBeInTheDocument();
    expect(screen.getByText(/Thời gian phục vụ/i)).toBeInTheDocument();

    // 3. Contact links
    expect(screen.getByRole('link', { name: '1900 1234' })).toHaveAttribute('href', 'tel:19001234');
    expect(screen.getByRole('link', { name: 'contact@saigonvoice.vn' })).toHaveAttribute(
      'href',
      'mailto:contact@saigonvoice.vn'
    );
  });

  it('renders interactive contact form with topic chips and inputs', () => {
    renderContactPage();

    // Topic selector chips
    expect(screen.getByRole('radio', { name: /Góp ý trải nghiệm tour/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Báo lỗi thuyết minh/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Hợp tác truyền thông/i })).toBeInTheDocument();

    // Form inputs
    expect(screen.getByLabelText(/Họ và tên của bạn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Địa chỉ Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tiêu đề thông điệp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nội dung chi tiết/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gửi thông điệp liên hệ/i })).toBeInTheDocument();
  });

  it('validates form: shows error notice when fields are empty or invalid', async () => {
    renderContactPage();

    const submitBtn = screen.getByRole('button', { name: /Gửi thông điệp liên hệ/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Vui lòng điền họ tên, email hợp lệ và nội dung thông điệp ít nhất 10 ký tự/i)
    ).toBeInTheDocument();
  });

  it('submits valid form data via submitFeedback and shows success notice', async () => {
    const spy = vi.spyOn(feedbackService, 'submitFeedback').mockResolvedValueOnce({
      success: true,
      message: 'Cảm ơn bạn đã gửi liên hệ!',
    });

    renderContactPage();

    fireEvent.change(screen.getByLabelText(/Họ và tên của bạn/i), {
      target: { value: 'Trần Minh' },
    });
    fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), {
      target: { value: 'minh@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Nội dung chi tiết/i), {
      target: { value: 'Tôi rất thích tour thuyết minh Dinh Độc Lập hôm nay.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Gửi thông điệp liên hệ/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText(/Cảm ơn bạn đã gửi liên hệ!/i)).toBeInTheDocument();
  });

  it('switches topic chip when clicked', () => {
    renderContactPage();

    const partnershipChip = screen.getByRole('radio', { name: /Hợp tác truyền thông/i });
    fireEvent.click(partnershipChip);

    expect(partnershipChip).toHaveClass('is-active');
    expect(partnershipChip).toHaveAttribute('aria-checked', 'true');
  });

  it('renders FAQ accordion and toggles items on click', () => {
    renderContactPage();

    // First FAQ is open by default
    expect(
      screen.getByText(/Ứng dụng Sài Gòn Voice có thu phí thuyết minh du lịch không\?/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hoàn toàn không. Sài Gòn Voice là dự án số hóa di sản/i)
    ).toBeInTheDocument();

    // Click second FAQ to open it
    const secondFaqTrigger = screen.getByRole('button', {
      name: /Làm thế nào để nghe thuyết minh tự động khi tôi đi bộ gần di tích\?/i,
    });
    fireEvent.click(secondFaqTrigger);

    expect(
      screen.getByText(/Bạn chỉ cần truy cập trang "Điểm du lịch", bật công tắc/i)
    ).toBeInTheDocument();
  });
});
