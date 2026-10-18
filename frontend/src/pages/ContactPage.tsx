import React, { useState } from 'react';
import { MapPin, PhoneCall, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import { submitFeedback } from '../services/feedbackService';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ContactMap } from '../components/contact/ContactMap';
import { siteContact } from '../content/staticSections';
import '../styles/contact.css';

const CONTACT_ADDRESS = siteContact.address;
const CONTACT_FULL_ADDRESS = siteContact.fullAddress;
const CONTACT_PHONE = siteContact.phone;
const CONTACT_EMAIL = siteContact.email;
const CONTACT_HOURS = siteContact.hours;

const DIRECTIONS_URL = siteContact.directionsUrl;

const MESSAGE_MIN = 10;

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const RequiredMark: React.FC = () => (
  <span className="contact-req" aria-hidden="true">*</span>
);

export const ContactPage: React.FC = () => {
  useDocumentMeta('Liên hệ | Echora', 'Thông tin liên hệ và biểu mẫu gửi tin nhắn cho Echora.');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const messageLength = message.trim().length;

  const fieldErrors: FormErrors = {};
  if (!name.trim()) fieldErrors.name = 'Vui lòng nhập họ tên.';
  if (!email.trim()) fieldErrors.email = 'Vui lòng nhập email.';
  else if (!EMAIL_RE.test(email.trim())) fieldErrors.email = 'Email không hợp lệ.';
  if (!message.trim()) fieldErrors.message = 'Vui lòng nhập nội dung.';
  else if (messageLength < MESSAGE_MIN)
    fieldErrors.message = `Nội dung cần ít nhất ${MESSAGE_MIN} ký tự.`;

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const visibleError = (field: keyof FormErrors): string | undefined => {
    const err = fieldErrors[field];
    if (!err) return undefined;
    return touched[field] || submitAttempted ? err : undefined;
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setShowOptional(false);
    setTouched({});
    setSubmitAttempted(false);
    setSubmitError('');
    setIsSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (Object.keys(fieldErrors).length > 0) {
      setSubmitAttempted(true);
      return;
    }
    setSubmitAttempted(true);

    const lines = [message.trim()];
    if (phone.trim()) lines.push(`SĐT: ${phone.trim()}`);

    setIsSubmitting(true);
    try {
      await submitFeedback({
        name: name.trim(),
        email: email.trim(),
        message: lines.join('\n'),
      });
      resetForm();
      setIsSent(true);
    } catch {
      setSubmitError('Không gửi được tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-root">
      <PageHero
        className="contact-hero"
        eyebrow=""
        title="Liên hệ"
        subtitle="Gọi điện, gửi email hoặc để lại tin nhắn cho Echora."
        imageSrc="/images/pois/buu-dien-trung-tam.jpg"
        imagePosition="center"
      />

      <main className="contact-container">
        <div className="contact-grid">
          {/* Cột trái: Thông tin liên hệ & Bản đồ */}
          <div className="contact-info-col">
            {/* Card thông tin liên hệ */}
            <section className="contact-card contact-info-card" aria-labelledby="contact-info-heading">
              <h2 id="contact-info-heading" className="contact-section-title">
                Thông tin liên hệ
              </h2>
              <p className="contact-section-desc">
                Bạn có thể ghé thăm trực tiếp, liên lạc qua điện thoại hoặc gửi email cho chúng tôi.
              </p>

              <ul className="contact-facts-list">
                <li className="contact-fact-item">
                  <div className="contact-fact-icon" aria-hidden="true">
                    <MapPin size={18} />
                  </div>
                  <div className="contact-fact-content">
                    <span className="contact-fact-label">Địa chỉ</span>
                    <span className="contact-fact-value">{CONTACT_FULL_ADDRESS}</span>
                  </div>
                </li>

                <li className="contact-fact-item">
                  <div className="contact-fact-icon" aria-hidden="true">
                    <PhoneCall size={18} />
                  </div>
                  <div className="contact-fact-content">
                    <span className="contact-fact-label">Điện thoại</span>
                    <a href={`tel:${CONTACT_PHONE}`} className="contact-fact-link">
                      {CONTACT_PHONE}
                    </a>
                  </div>
                </li>

                <li className="contact-fact-item">
                  <div className="contact-fact-icon" aria-hidden="true">
                    <Mail size={18} />
                  </div>
                  <div className="contact-fact-content">
                    <span className="contact-fact-label">Email</span>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="contact-fact-link">
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </li>

                <li className="contact-fact-item">
                  <div className="contact-fact-icon" aria-hidden="true">
                    <Clock size={18} />
                  </div>
                  <div className="contact-fact-content">
                    <span className="contact-fact-label">Thời gian làm việc</span>
                    <span className="contact-fact-value">{CONTACT_HOURS}</span>
                  </div>
                </li>
              </ul>
            </section>

            {/* Card Bản đồ */}
            <section className="contact-card contact-map-card" aria-labelledby="contact-map-heading">
              <div className="contact-map-header">
                <div>
                  <h2 id="contact-map-heading" className="contact-section-title">
                    Vị trí
                  </h2>
                  <p className="contact-map-caption">{CONTACT_ADDRESS}</p>
                </div>
                <a
                  className="contact-directions-link"
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chỉ đường
                </a>
              </div>

              <div className="contact-map-wrapper">
                <ContactMap />
              </div>
            </section>
          </div>

          {/* Cột phải: Biểu mẫu gửi tin nhắn */}
          <div className="contact-form-col">
            <section className="contact-card contact-form-card" aria-labelledby="contact-form-heading">
              <h2 id="contact-form-heading" className="contact-section-title">
                Gửi tin nhắn
              </h2>
              <p className="contact-section-desc">
                Điền thông tin vào biểu mẫu bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất.
              </p>

              {isSent ? (
                <div className="contact-success-state" role="status">
                  <div className="contact-success-icon" aria-hidden="true">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="contact-success-title">Cảm ơn bạn đã gửi liên hệ!</h3>
                  <p className="contact-success-text">
                    Tin nhắn của bạn đã được tiếp nhận. Đội ngũ Echora sẽ phản hồi qua email hoặc số điện thoại của bạn sớm nhất có thể.
                  </p>
                  <button type="button" className="contact-submit-btn" onClick={resetForm}>
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form noValidate onSubmit={handleSubmit} id="contact-form" className="contact-form">
                  {/* Họ và tên */}
                  <div className="contact-field">
                    <label htmlFor="contact-name" className="contact-label">
                      Họ và tên <RequiredMark />
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className={`contact-input ${visibleError('name') ? 'is-invalid' : ''}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => markTouched('name')}
                      required
                      aria-invalid={visibleError('name') ? true : undefined}
                      aria-describedby={visibleError('name') ? 'contact-name-error' : undefined}
                    />
                    {visibleError('name') && (
                      <p className="contact-error-msg" id="contact-name-error">
                        {visibleError('name')}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="contact-field">
                    <label htmlFor="contact-email" className="contact-label">
                      Email <RequiredMark />
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Ví dụ: ban@vidu.com"
                      className={`contact-input ${visibleError('email') ? 'is-invalid' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched('email')}
                      required
                      aria-invalid={visibleError('email') ? true : undefined}
                      aria-describedby={visibleError('email') ? 'contact-email-error' : undefined}
                    />
                    {visibleError('email') && (
                      <p className="contact-error-msg" id="contact-email-error">
                        {visibleError('email')}
                      </p>
                    )}
                  </div>

                  {/* Optional phone toggle */}
                  <div className="contact-optional-group">
                    <button
                      type="button"
                      className="contact-optional-toggle"
                      aria-expanded={showOptional}
                      onClick={() => setShowOptional((v) => !v)}
                    >
                      <span className="contact-toggle-plus">{showOptional ? '−' : '+'}</span>
                      <span>{showOptional ? 'Ẩn số điện thoại' : 'Thêm số điện thoại (không bắt buộc)'}</span>
                    </button>

                    {showOptional && (
                      <div className="contact-field contact-optional-field">
                        <label htmlFor="contact-phone" className="contact-label">
                          Số điện thoại (không bắt buộc)
                        </label>
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="Ví dụ: 0912 345 678"
                          className="contact-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Nội dung */}
                  <div className="contact-field">
                    <div className="contact-label-row">
                      <label htmlFor="contact-message" className="contact-label">
                        Nội dung <RequiredMark />
                      </label>
                      <span
                        className={`contact-char-count ${
                          submitAttempted && messageLength < MESSAGE_MIN ? 'is-low' : ''
                        }`}
                        id="contact-message-count"
                        aria-live="polite"
                      >
                        {messageLength} / {MESSAGE_MIN} ký tự tối thiểu
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Nhập nội dung bạn muốn gửi cho chúng tôi…"
                      className={`contact-textarea ${visibleError('message') ? 'is-invalid' : ''}`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onBlur={() => markTouched('message')}
                      required
                      aria-invalid={visibleError('message') ? true : undefined}
                      aria-describedby={[
                        'contact-message-count',
                        visibleError('message') ? 'contact-message-error' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                    {visibleError('message') && (
                      <p className="contact-error-msg" id="contact-message-error">
                        {visibleError('message')}
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div className="contact-status-box is-error" role="alert">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="contact-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang gửi…' : 'Gửi tin nhắn'}
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
