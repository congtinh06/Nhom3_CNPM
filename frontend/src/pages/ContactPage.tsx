import React, { useEffect, useState } from 'react';
import { MapPin, PhoneCall, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { saveFeedbackCredentials, submitFeedback } from '../services/feedbackService';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ContactMap } from '../components/contact/ContactMap';
import { siteContact } from '../content/staticSections';
import { useNavbarLanguage } from '../content/languages';
import { CONTACT_TRANSLATIONS } from '../content/contactI18n';
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
  const { lang } = useNavbarLanguage();
  const c = CONTACT_TRANSLATIONS[lang] || CONTACT_TRANSLATIONS.vi;

  useDocumentMeta(`${c.title} | Echora`, c.subtitle);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Set default topic when language loads or changes
  useEffect(() => {
    if (!topic || topic === CONTACT_TRANSLATIONS.vi.topicFeedback || topic === CONTACT_TRANSLATIONS.en.topicFeedback || topic === CONTACT_TRANSLATIONS.ja.topicFeedback || topic === CONTACT_TRANSLATIONS.ko.topicFeedback) {
      setTopic(c.topicFeedback);
    }
  }, [c.topicFeedback, topic]);

  const messageLength = message.trim().length;

  const fieldErrors: FormErrors = {};
  if (!name.trim()) fieldErrors.name = c.errNameRequired;
  if (!email.trim()) fieldErrors.email = c.errEmailRequired;
  else if (!EMAIL_RE.test(email.trim())) fieldErrors.email = c.errEmailInvalid;
  if (!message.trim()) fieldErrors.message = c.errMessageRequired;
  else if (messageLength < MESSAGE_MIN)
    fieldErrors.message = c.errMessageMin;

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
    setTopic(c.topicFeedback);
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
    if (topic && topic !== c.topicOther) {
      lines.push(`${c.topicLabel}: ${topic}`);
    }
    lines.push(message.trim());
    if (phone.trim()) lines.push(`${c.phoneLabel}: ${phone.trim()}`);

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        name: name.trim(),
        email: email.trim(),
        message: lines.join('\n'),
      });
      if (result.ticket && result.accessToken) {
        saveFeedbackCredentials(result.ticket, result.accessToken);
      }
      resetForm();
      setIsSent(true);
    } catch {
      setSubmitError(c.errSendFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-root">
      <div className="contact-wrap">
        <header className="contact-head">
          <h1 className="contact-head-title">{c.title}</h1>
          <p className="contact-head-subtitle">
            {c.subtitle}
          </p>
        </header>

        <main className="contact-container">
        <div className="contact-grid">
          {/* Cột trái: Thông tin liên hệ & Bản đồ */}
          <div className="contact-info-col">
            {/* Card thông tin liên hệ */}
            <section className="contact-card contact-info-card" aria-labelledby="contact-info-heading">
              <h2 id="contact-info-heading" className="contact-section-title">
                {c.officeTitle}
              </h2>
              <p className="contact-section-desc">
                {c.officeDesc}
              </p>

              <ul className="contact-facts-list">
                <li className="contact-fact-item">
                  <div className="contact-fact-icon" aria-hidden="true">
                    <MapPin size={18} />
                  </div>
                  <div className="contact-fact-content">
                    <span className="contact-fact-label">{c.addressLabel}</span>
                    <span className="contact-fact-value">{CONTACT_FULL_ADDRESS}</span>
                  </div>
                </li>

                <li className="contact-fact-item">
                  <div className="contact-fact-icon" aria-hidden="true">
                    <PhoneCall size={18} />
                  </div>
                  <div className="contact-fact-content">
                    <span className="contact-fact-label">{c.phoneLabel}</span>
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
                    <span className="contact-fact-label">{c.emailLabel}</span>
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
                    <span className="contact-fact-label">{c.hoursLabel}</span>
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
                    {c.locationTitle}
                  </h2>
                  <p className="contact-map-caption">{CONTACT_ADDRESS}</p>
                </div>
                <a
                  className="contact-directions-link"
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {c.directionsLabel}
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
                {c.formHeading}
              </h2>
              <p className="contact-section-desc">
                {c.formSubheading}
              </p>

              {isSent ? (
                <div className="contact-success-state" role="status">
                  <div className="contact-success-icon" aria-hidden="true">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="contact-success-title">{c.successTitle}</h3>
                  <p className="contact-success-text">
                    {c.successNotice}
                  </p>
                  <button type="button" className="contact-submit-btn" onClick={resetForm}>
                    {c.sendAnother}
                  </button>
                </div>
              ) : (
                <form noValidate onSubmit={handleSubmit} id="contact-form" className="contact-form">
                  {/* Họ và tên */}
                  <div className="contact-field">
                    <label htmlFor="contact-name" className="contact-label">
                      {c.nameLabel} <RequiredMark />
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder={c.namePlaceholder || 'Ví dụ: Nguyễn Văn A'}
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
                      {c.emailLabel} <RequiredMark />
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={c.emailPlaceholder || 'name@example.com'}
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
                      <span>{showOptional ? c.optionalPhoneHide : c.optionalPhoneAdd}</span>
                    </button>

                    {showOptional && (
                      <div className="contact-field contact-optional-field">
                        <label htmlFor="contact-phone" className="contact-label">
                          {c.phoneInputLabel}
                        </label>
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder={c.phonePlaceholder || '+84 xxx xxx xxx'}
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
                      {c.topicLabel}
                    </label>
                    <select
                      id="contact-topic"
                      name="topic"
                      className="contact-input contact-select"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      <option value={c.topicFeedback}>{c.topicFeedback}</option>
                      <option value={c.topicReportIssue}>{c.topicReportIssue}</option>
                      <option value={c.topicPartnership}>{c.topicPartnership}</option>
                      <option value={c.topicOther}>{c.topicOther}</option>
                    </select>
                  </div>

                  {/* Nội dung */}
                  <div className="contact-field">
                    <div className="contact-label-row">
                      <label htmlFor="contact-message" className="contact-label">
                        {c.messageLabel} <RequiredMark />
                      </label>
                      <span
                        className={`contact-char-count ${
                          submitAttempted && messageLength < MESSAGE_MIN ? 'is-low' : ''
                        }`}
                        id="contact-message-count"
                        aria-live="polite"
                      >
                        {messageLength} / {MESSAGE_MIN} {lang === 'en' ? 'min characters' : lang === 'ja' ? '文字以上' : lang === 'ko' ? '자 이상' : 'ký tự tối thiểu'}
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder={c.messagePlaceholder || (lang === 'en' ? 'Enter your message...' : lang === 'ja' ? 'お問い合わせ内容を入力してください...' : lang === 'ko' ? '메시지 내용을 입력해 주세요...' : 'Nhập nội dung bạn muốn gửi cho chúng tôi...')}
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
                    {isSubmitting ? c.sendingBtn : c.sendBtn}
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>

        {/* 3 Thẻ Hướng dẫn & Lưu ý */}
        <section className="contact-help-section" aria-label={c.helpSectionTitle}>
          <div className="contact-help-grid">
            <div className="contact-help-card">
              <h3 className="contact-help-title">{c.helpGuide1Title}</h3>
              <p className="contact-help-text">
                {c.helpGuide1Desc}
              </p>
            </div>
            <div className="contact-help-card">
              <h3 className="contact-help-title">{c.helpGuide2Title}</h3>
              <p className="contact-help-text">
                {c.helpGuide2Desc}
              </p>
            </div>
            <div className="contact-help-card">
              <h3 className="contact-help-title">{c.helpGuide3Title}</h3>
              <p className="contact-help-text">
                {c.helpGuide3Desc}
              </p>
            </div>
          </div>
        </section>

        {/* Sự cố thường gặp khi nghe */}
        <section className="contact-fix-section" aria-labelledby="contact-fix-heading">
          <h2 id="contact-fix-heading" className="contact-section-title">
            {c.fixSectionTitle}
          </h2>
          <div className="contact-fix-grid">
            <div className="contact-fix-card">
              <h3 className="contact-fix-title">{c.fix1Title}</h3>
              <p className="contact-fix-text">
                {c.fix1Desc}
              </p>
            </div>
            <div className="contact-fix-card">
              <h3 className="contact-fix-title">{c.fix2Title}</h3>
              <p className="contact-fix-text">
                {c.fix2Desc}
              </p>
            </div>
            <div className="contact-fix-card">
              <h3 className="contact-fix-title">{c.fix3Title}</h3>
              <p className="contact-fix-text">
                {c.fix3Desc}
              </p>
            </div>
          </div>
        </section>

        {/* Để chúng tôi hỗ trợ nhanh hơn */}
        <section className="contact-aid-section" aria-labelledby="contact-aid-heading">
          <h2 id="contact-aid-heading" className="contact-section-title">
            {c.aidSectionTitle}
          </h2>
          <p className="contact-section-desc">
            {c.aidSectionDesc}
          </p>
          <ol className="contact-aid-list">
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">1</span>
              <strong className="contact-aid-label">{c.aid1Label}</strong>
              <span className="contact-aid-desc">{c.aid1Desc}</span>
            </li>
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">2</span>
              <strong className="contact-aid-label">{c.aid2Label}</strong>
              <span className="contact-aid-desc">{c.aid2Desc}</span>
            </li>
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">3</span>
              <strong className="contact-aid-label">{c.aid3Label}</strong>
              <span className="contact-aid-desc">{c.aid3Desc}</span>
            </li>
            <li className="contact-aid-item">
              <span className="contact-aid-item-num">4</span>
              <strong className="contact-aid-label">{c.aid4Label}</strong>
              <span className="contact-aid-desc">{c.aid4Desc}</span>
            </li>
          </ol>
        </section>

        {/* Câu hỏi thường gặp */}
        <section className="contact-faq-section" aria-labelledby="contact-faq-heading">
          <div className="contact-faq-layout">
            <div className="contact-faq-header">
              <h2 id="contact-faq-heading" className="contact-section-title">
                {c.faqHeading}
              </h2>
              <p className="contact-section-desc">
                {c.faqSubheading}
              </p>
            </div>
            <div className="contact-faq-list">
              {c.faqs.map((faq, fIdx) => (
                <details key={fIdx} className="contact-faq-item">
                  <summary className="contact-faq-summary">
                    <span>{faq.q}</span>
                  </summary>
                  <div className="contact-faq-content">
                    <p>{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
};

export default ContactPage;