import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, MapPin, Database, Cookie, Mail, ArrowLeft } from 'lucide-react';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import '../styles/contact.css';

export const PrivacyPolicyPage: React.FC = () => {
  useDocumentMeta(
    'Chính sách quyền riêng tư | Echora',
    'Chính sách quyền riêng tư và minh bạch dữ liệu thu thập trên nền tảng thuyết minh du lịch Echora.'
  );

  return (
    <div className="s contact-page" style={{ paddingTop: 96, paddingBottom: 64 }}>
      <div className="s-in" style={{ maxWidth: 840, margin: '0 auto', padding: '0 20px' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 24,
            color: 'var(--fb-color-muted, #64748b)',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Về trang chủ</span>
        </Link>

        <header style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              lineHeight: 1.25,
              color: 'var(--fb-color-text, #0f172a)',
              marginBottom: 12,
            }}
          >
            Chính sách quyền riêng tư Echora
          </h1>
          <p style={{ color: 'var(--fb-color-muted, #64748b)', fontSize: '0.95rem' }}>
            Cập nhật lần cuối: Tháng 10/2026. Áp dụng cho toàn bộ dịch vụ thuyết minh và đặt quà lưu niệm trên Echora.
          </p>
        </header>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            lineHeight: 1.65,
            color: 'var(--fb-color-text, #1e293b)',
          }}
        >
          <section
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--fb-card-bg, #ffffff)',
              border: '1px solid var(--fb-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={20} style={{ color: 'var(--fb-color-primary, #0284c7)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>1. Nguyên tắc chung</h2>
            </div>
            <p>
              Echora là ứng dụng du lịch số hỗ trợ du khách khám phá di sản văn hóa Thành phố Hồ Chí Minh qua thuyết minh tự động đa ngôn ngữ. Chúng tôi cam kết bảo vệ quyền riêng tư của bạn và chỉ thu thập các dữ liệu kỹ thuật thực sự cần thiết để vận hành hệ thống. Echora không bán, không thương mại hóa và không chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba quảng cáo nào.
            </p>
          </section>

          <section
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--fb-card-bg, #ffffff)',
              border: '1px solid var(--fb-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Lock size={20} style={{ color: 'var(--fb-color-primary, #0284c7)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>2. Dữ liệu tài khoản & Xác thực (Auth)</h2>
            </div>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <strong>Đăng ký tài khoản nội bộ:</strong> Chúng tôi lưu trữ địa chỉ email, họ tên, mật khẩu được băm một chiều bằng thuật toán an toàn BCrypt (hệ thống không bao giờ lưu hay nhìn thấy mật khẩu gốc của bạn), vai trò tài khoản (USER hoặc ADMIN) và trạng thái kích hoạt tài khoản.
              </li>
              <li>
                <strong>Đăng nhập qua Google (Google Identity Services):</strong> Khi bạn chọn đăng nhập bằng Google, trình duyệt gửi ID token trực tiếp từ Google. Hệ thống Echora chỉ đọc email, tên hiển thị và liên kết ảnh đại diện công khai từ token này để tạo hoặc gắn kết tài khoản. Chúng tôi không truy cập vào bất kỳ dữ liệu cá nhân nào khác trong tài khoản Google của bạn.
              </li>
            </ul>
          </section>

          <section
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--fb-card-bg, #ffffff)',
              border: '1px solid var(--fb-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MapPin size={20} style={{ color: 'var(--fb-color-primary, #0284c7)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>3. Quyền truy cập vị trí (Browser Geolocation)</h2>
            </div>
            <p style={{ marginBottom: 10 }}>
              Tính năng thuyết minh tự động khi đến gần di tích chỉ hoạt động khi bạn đồng ý cấp quyền truy cập vị trí trên trình duyệt:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Tọa độ GPS chỉ được sử dụng tại máy khách (phía trình duyệt) để đo khoảng cách tới 7 điểm di tích và kích hoạt đoạn audio tương ứng khi bạn bước vào vùng bán kính định vị.</li>
              <li>Hệ thống máy chủ <strong>không ghi lại nhật ký lộ trình di chuyển</strong> của bạn. Tọa độ thực của thiết bị không bao giờ được gửi hay lưu trữ trong cơ sở dữ liệu phân tích.</li>
            </ul>
          </section>

          <section
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--fb-card-bg, #ffffff)',
              border: '1px solid var(--fb-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Database size={20} style={{ color: 'var(--fb-color-primary, #0284c7)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>4. Dữ liệu phân tích & Đơn hàng</h2>
            </div>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <strong>Sự kiện phân tích (Analytics):</strong> Hệ thống ghi nhận các chỉ số tổng hợp gồm lượt truy cập (VISIT), lượt nghe audio (AUDIO_PLAY), mã điểm di tích (poiId), ngôn ngữ thuyết minh đã chọn, loại thiết bị (desktop, mobile hoặc tablet) và một chuỗi định danh phiên ngẫu nhiên (sessionId). Dữ liệu này chỉ phục vụ bảng điều khiển quản trị thời gian thực để đánh giá mức độ quan tâm của du khách.
              </li>
              <li>
                <strong>Thông tin đơn hàng (Orders):</strong> Khi bạn đặt mua quà lưu niệm, hệ thống lưu mã đơn hàng, họ tên người nhận, số điện thoại liên hệ, địa chỉ giao hàng, danh sách sản phẩm và trạng thái thanh toán. Chúng tôi không lưu trữ thông tin thẻ ngân hàng hay tài khoản tài chính của người dùng.
              </li>
            </ul>
          </section>

          <section
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--fb-card-bg, #ffffff)',
              border: '1px solid var(--fb-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Cookie size={20} style={{ color: 'var(--fb-color-primary, #0284c7)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>5. Cookies & Lưu trữ cục bộ (localStorage)</h2>
            </div>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <strong>Cookie refresh_token:</strong> Được gắn cờ <code>HttpOnly</code>, <code>SameSite=Strict</code> (hoặc <code>Lax</code>) và tự động bật cờ <code>Secure</code> khi hoạt động trên môi trường HTTPS. Cookie này chỉ máy chủ xác thực đọc được nhằm làm mới phiên làm việc ngắn hạn, ngăn chặn tấn công đánh cắp mã phiên qua XSS.
              </li>
              <li>
                <strong>Khóa lưu trữ cục bộ (localStorage):</strong> Trình duyệt lưu giữ một số tùy chọn cá nhân nhằm nâng cao trải nghiệm:
                <ul style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li><code>echora_token</code>: Mã truy cập ngắn hạn (15 phút) dùng gửi kèm các yêu cầu API cần quyền.</li>
                  <li><code>echora_cart</code>: Danh sách sản phẩm bạn đang lưu trong giỏ quà lưu niệm.</li>
                  <li><code>echora_audio_lang</code>: Ngôn ngữ thuyết minh ưu tiên đã chọn (vi, en, ja, ko).</li>
                  <li><code>echora_theme</code> / <code>theme</code>: Chế độ màu sắc giao diện sáng hoặc tối.</li>
                  <li><code>echora_guest_mode</code>: Đánh dấu trạng thái trải nghiệm thử với tư cách khách.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section
            style={{
              padding: 24,
              borderRadius: 12,
              background: 'var(--fb-card-bg, #ffffff)',
              border: '1px solid var(--fb-border, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Mail size={20} style={{ color: 'var(--fb-color-primary, #0284c7)' }} aria-hidden="true" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>6. Quyền của bạn & Liên hệ</h2>
            </div>
            <p style={{ marginBottom: 12 }}>
              Bạn có quyền yêu cầu tra cứu, chỉnh sửa thông tin cá nhân hoặc yêu cầu xóa tài khoản khỏi hệ thống bất kỳ lúc nào. Nếu có bất kỳ câu hỏi nào về chính sách quyền riêng tư hoặc việc xử lý dữ liệu, vui lòng liên hệ ban quản trị dự án:
            </p>
            <div
              style={{
                padding: 16,
                background: 'var(--fb-bg-subtle, #f8fafc)',
                borderRadius: 8,
                border: '1px dashed var(--fb-border, #cbd5e1)',
              }}
            >
              <p style={{ margin: 0, fontWeight: 500 }}>
                Email phụ trách quyền riêng tư: <code>[contact-email-placeholder@echora.local]</code>
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--fb-color-muted, #64748b)' }}>
                (Lưu ý: Đây là địa chỉ email placeholder, chủ dự án cần cập nhật hòm thư chính thức trước khi phát hành diện rộng).
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
