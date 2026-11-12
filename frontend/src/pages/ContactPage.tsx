import React, { useEffect, useState } from 'react';
import { MapPin, PhoneCall, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { getFeedbackThread, loadFeedbackCredentials, saveFeedbackCredentials, submitFeedback, FeedbackThread } from '../services/feedbackService';
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
  const [topic, setTopic] = useState('Hỗ trợ sử dụng thuyết minh');
  const [message, setMessage] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [thread, setThread] = useState<FeedbackThread | null>(null);
  const [savedTicket] = useState(loadFeedbackCredentials);

  useEffect(() => {
    if (!savedTicket) return;
    let active = true;
    const refresh = async () => {
      try { const data = await getFeedbackThread(savedTicket.ticket, savedTicket.accessToken); if (active) setThread(data); } catch { /* keep last known reply during transient offline periods */ }
    };
    void refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [savedTicket]);

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
    setTopic('Hỗ trợ sử dụng thuyết minh');
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

    const lines: string[] = [];
    if (topic && topic !== 'Khác') {
      lines.push(`Chủ đề: ${topic}`);
    }
    lines.push(message.trim());
    if (phone.trim()) lines.push(`SĐT: ${phone.trim()}`);

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        name: name.trim(),
        email: email.trim(),
        message: lines.join('\n'),
      });
      if (result.ticket && result.accessToken) {
        saveFeedbackCredentials(result.ticket, result.accessToken);
        setThread(await getFeedbackThread(result.ticket, result.accessToken));
      }
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
      <div className="contact-wrap">
        <header className="contact-head">
          <h1 className="contact-head-title">Liên hệ</h1>
          <p className="contact-head-subtitle">
            Bạn cần hỗ trợ khi nghe thuyết minh, muốn hỏi về đơn hàng quà lưu niệm, hay muốn góp ý cho Echora? Chúng tôi lắng nghe bạn.
          </p>
        </header>

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
                    Tin nhắn đã được tiếp nhận. Bạn có thể xem phản hồi tại đây hoặc trong mục Tin nhắn hỗ trợ sau khi đăng nhập bằng trình duyệt này.
                  </p>
                  {thread && <div className="contact-status-box" aria-live="polite">
                    <strong>Mã theo dõi: {thread.ticket}</strong>
                    <p>Hội thoại sẽ tự cập nhật khi đội ngũ Echora phản hồi.</p>
                    {thread.messages.map((item) => <p key={item.id}><b>{item.sender === 'ADMIN' ? 'Echora' : 'Bạn'}:</b> {item.content}</p>)}
                  </div>}
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
                      <span className="contact-toggle-plus">{showOptional ? '-' : '+'}</span>
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

                  {/* Chủ đề */}
                  <div className="contact-field">
                    <label htmlFor="contact-topic" className="contact-label">
                      Chủ đề
                    </label>
                    <select
                      id="contact-topic"
                      name="topic"
                      className="contact-input contact-select"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      <option value="Hỗ trợ sử dụng thuyết minh">Hỗ trợ sử dụng thuyết minh</option>
                      <option value="Quà lưu niệm và đơn hàng">Quà lưu niệm và đơn hàng</option>
                      <option value="Hợp tác hoặc góp ý">Hợp tác hoặc góp ý</option>
                      <option value="Khác">Khác</option>
                    </select>
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

        {/* 3 Thẻ Hướng dẫn & Lưu ý */}
        <section className="contact-help-section" aria-label="Hướng dẫn liên hệ">
          <div className="contact-help-grid">
            <div className="contact-help-card">
              <h3 className="contact-help-title">Sử dụng thuyết minh</h3>
              <p className="contact-help-text">
                Chọn ngôn ngữ, bật tự động phát hoặc quét mã QR ở từng điểm tham quan.
              </p>
            </div>
            <div className="contact-help-card">
              <h3 className="contact-help-title">Đơn hàng quà lưu niệm</h3>
              <p className="contact-help-text">
                Ghi mã đơn hàng vào nội dung tin nhắn để chúng tôi kiểm tra nhanh hơn.
              </p>
            </div>
            <div className="contact-help-card">
              <h3 className="contact-help-title">Hợp tác và góp ý</h3>
              <p className="contact-help-text">
                Chọn chủ đề "Hợp tác hoặc góp ý" trong biểu mẫu, chúng tôi rất muốn lắng nghe bạn.
              </p>
            </div>
          </div>
        </section>

        {/* Sự cố thường gặp khi nghe */}
        <section className="contact-fix-section" aria-labelledby="contact-fix-heading">
          <h2 id="contact-fix-heading" className="contact-section-title">
            Sự cố thường gặp khi nghe
          </h2>
          <div className="contact-fix-grid">
            <div className="contact-fix-card">
              <h3 className="contact-fix-title">Không nghe thấy âm thanh</h3>
              <p className="contact-fix-text">
                Kiểm tra âm lượng, tai nghe và chế độ im lặng của điện thoại, rồi thử bấm phát lại.
              </p>
            </div>
            <div className="contact-fix-card">
              <h3 className="contact-fix-title">Thuyết minh không tự phát</h3>
              <p className="contact-fix-text">
                Hãy bật "Tự động phát" và cho phép trình duyệt truy cập vị trí. Bạn vẫn bấm nghe thủ công được.
              </p>
            </div>
            <div className="contact-fix-card">
              <h3 className="contact-fix-title">Không đổi được ngôn ngữ</h3>
              <p className="contact-fix-text">
                Ngôn ngữ có biểu tượng khóa cần gói Premium. Tiếng Việt luôn dùng được miễn phí.
              </p>
            </div>
          </div>
        </section>

        {/* Để chúng tôi hỗ trợ nhanh hơn */}
        <section className="contact-aid-section" aria-labelledby="contact-aid-heading">
          <h2 id="contact-aid-heading" className="contact-section-title">
            Để chúng tôi hỗ trợ nhanh hơn
          </h2>
          <p className="contact-section-desc">
            Khi nhắn về một sự cố, hãy cho biết vài thông tin sau.
          </p>
          <ol className="contact-aid-list">
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">1</span>
              <strong className="contact-aid-label">Điểm dừng</strong>
              <span className="contact-aid-desc">Bạn đang nghe hoặc đang xem điểm nào.</span>
            </li>
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">2</span>
              <strong className="contact-aid-label">Ngôn ngữ</strong>
              <span className="contact-aid-desc">Ngôn ngữ thuyết minh bạn đang chọn.</span>
            </li>
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">3</span>
              <strong className="contact-aid-label">Thiết bị</strong>
              <span className="contact-aid-desc">Loại điện thoại và trình duyệt bạn đang dùng.</span>
            </li>
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">4</span>
              <strong className="contact-aid-label">Ảnh chụp màn hình</strong>
              <span className="contact-aid-desc">Nếu có, ảnh giúp chúng tôi hiểu vấn đề nhanh hơn.</span>
            </li>
          </ol>
        </section>

        {/* Câu hỏi thường gặp */}
        <section className="contact-faq-section" aria-labelledby="contact-faq-heading">
          <div className="contact-faq-layout">
            <div className="contact-faq-header">
              <h2 id="contact-faq-heading" className="contact-section-title">
                Câu hỏi thường gặp
              </h2>
              <p className="contact-section-desc">
                Giải đáp nhanh các thắc mắc phổ biến về trải nghiệm thuyết minh và quà lưu niệm.
              </p>
            </div>
            <div className="contact-faq-list">
              <details className="contact-faq-item">
                <summary className="contact-faq-summary">
                  <span>Echora hỗ trợ những ngôn ngữ nào?</span>
                </summary>
                <div className="contact-faq-content">
                  <p>Tiếng Việt miễn phí. Tiếng Anh, Nhật, Hàn mở bằng gói Premium.</p>
                </div>
              </details>

              <details className="contact-faq-item">
                <summary className="contact-faq-summary">
                  <span>Tôi có thể ghé trực tiếp không?</span>
                </summary>
                <div className="contact-faq-content">
                  <p>Bạn có thể ghé địa chỉ ở trên trong giờ làm việc, từ 8h đến 23h.</p>
                </div>
              </details>

              <details className="contact-faq-item">
                <summary className="contact-faq-summary">
                  <span>Tôi cần hỗ trợ về một đơn hàng?</span>
                </summary>
                <div className="contact-faq-content">
                  <p>Hãy ghi mã đơn hàng vào tin nhắn, chúng tôi sẽ kiểm tra giúp bạn.</p>
                </div>
              </details>

              <details className="contact-faq-item">
                <summary className="contact-faq-summary">
                  <span>Tôi muốn góp ý về nội dung thuyết minh?</span>
                </summary>
                <div className="contact-faq-content">
                  <p>Rất hoan nghênh. Chọn chủ đề góp ý và cho chúng tôi biết điểm dừng bạn muốn nói tới.</p>
                </div>
              </details>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
};

export default ContactPage;
