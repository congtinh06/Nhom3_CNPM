import React, { useState } from 'react';
import {
  MapPin,
  PhoneCall,
  Mail,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Navigation,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageHero } from '../components/common/PageHero';
import { HERO_CONFIG } from '../config/heroImages';
import { useNavbarLanguage } from '../content/languages';
import { tContact } from '../content/contactI18n';
import { submitFeedback } from '../services/feedbackService';
import { ContactMap } from '../components/contact/ContactMap';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import '../styles/contact.css';

type TopicKey = 'feedback' | 'reportIssue' | 'partnership' | 'other';

export const ContactPage: React.FC = () => {
  const { lang } = useNavbarLanguage();

  useDocumentMeta(
    `${tContact(lang, 'title')} | Sài Gòn Voice`,
    tContact(lang, 'subtitle'),
    HERO_CONFIG.lienHe.src
  );

  // Form State
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>('feedback');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // FAQ State (first item open by default)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const topicOptions: { key: TopicKey; label: string }[] = [
    { key: 'feedback', label: tContact(lang, 'topicFeedback') },
    { key: 'reportIssue', label: tContact(lang, 'topicReportIssue') },
    { key: 'partnership', label: tContact(lang, 'topicPartnership') },
    { key: 'other', label: tContact(lang, 'topicOther') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !/^\S+@\S+\.\S+$/.test(trimmedEmail) || trimmedMessage.length < 10) {
      setStatus({
        type: 'error',
        message: tContact(lang, 'errorNotice'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitFeedback({
        name: trimmedName,
        email: trimmedEmail,
        message: `[${selectedTopic.toUpperCase()} - ${subject || 'Không có tiêu đề'}] ${trimmedMessage} (SĐT: ${phone || 'Không cung cấp'})`,
      });

      setStatus({
        type: 'success',
        message: res.message || tContact(lang, 'successNotice'),
      });
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch {
      setStatus({
        type: 'error',
        message: tContact(lang, 'errorNotice'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = tContact(lang, 'faqs');

  return (
    <div className="contact-page-root">
      {/* 1. Full-Bleed Editorial Photo Hero */}
      <PageHero
        eyebrow={tContact(lang, 'eyebrow')}
        title={tContact(lang, 'title')}
        subtitle={tContact(lang, 'subtitle')}
        imageSrc={HERO_CONFIG.lienHe.src}
        imageSrcMobile={HERO_CONFIG.lienHe.srcMobile}
        imagePosition={HERO_CONFIG.lienHe.position}
        imageCredit={HERO_CONFIG.lienHe.credit}
      />

      <div className="contact-container">
        {/* 2. Quick Info Cards (Hover Cards with Golden Highlights) */}
        <section className="contact-info-section" aria-label="Thông tin liên hệ nhanh">
          <div className="contact-cards-grid">
            {/* Card 1: Office Address */}
            <div className="contact-card">
              <div className="contact-card-icon-wrap" aria-hidden="true">
                <MapPin size={22} />
              </div>
              <h3 className="contact-card-title">{tContact(lang, 'officeTitle')}</h3>
              <p className="contact-card-val">{tContact(lang, 'officeAddress')}</p>
              <p className="contact-card-desc">{tContact(lang, 'officeDesc')}</p>
            </div>

            {/* Card 2: Hotline */}
            <div className="contact-card">
              <div className="contact-card-icon-wrap" aria-hidden="true">
                <PhoneCall size={22} />
              </div>
              <h3 className="contact-card-title">{tContact(lang, 'hotlineTitle')}</h3>
              <p className="contact-card-val">
                <a href="tel:19001234">1900 1234</a> · <a href="tel:02838220000">028 3822 0000</a>
              </p>
              <p className="contact-card-desc">{tContact(lang, 'hotlineDesc')}</p>
            </div>

            {/* Card 3: Email */}
            <div className="contact-card">
              <div className="contact-card-icon-wrap" aria-hidden="true">
                <Mail size={22} />
              </div>
              <h3 className="contact-card-title">{tContact(lang, 'emailTitle')}</h3>
              <p className="contact-card-val">
                <a href="mailto:contact@saigonvoice.vn">contact@saigonvoice.vn</a>
              </p>
              <p className="contact-card-desc">{tContact(lang, 'emailDesc')}</p>
            </div>

            {/* Card 4: Operating Hours */}
            <div className="contact-card">
              <div className="contact-card-icon-wrap" aria-hidden="true">
                <Clock size={22} />
              </div>
              <h3 className="contact-card-title">{tContact(lang, 'hoursTitle')}</h3>
              <p className="contact-card-val">07:30 – 21:00</p>
              <p className="contact-card-desc">{tContact(lang, 'hoursDesc')}</p>
            </div>
          </div>
        </section>

        {/* 3. Main Interactive Grid: Form (Left) & Heritage Map (Right) */}
        <section className="contact-main-grid" aria-label="Biểu mẫu liên hệ và bản đồ">
          {/* Column A: Interactive Contact Form */}
          <div className="contact-form-col">
            <div className="contact-form-card">
              <span className="contact-section-eyebrow">
                <Sparkles size={14} aria-hidden="true" />
                <span>LIÊN HỆ & ĐỒNG HÀNH</span>
              </span>
              <h2 className="contact-section-heading">{tContact(lang, 'formHeading')}</h2>
              <p className="contact-section-desc">{tContact(lang, 'formSubheading')}</p>

              <form noValidate onSubmit={handleSubmit} id="contact-form">
                {/* Topic Selector Chips */}
                <div className="contact-topic-group">
                  <label className="contact-topic-label" id="topic-group-label">
                    {tContact(lang, 'topicLabel')}
                  </label>
                  <div className="contact-topic-chips" role="radiogroup" aria-labelledby="topic-group-label">
                    {topicOptions.map((opt) => {
                      const isActive = selectedTopic === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          className={`contact-topic-chip ${isActive ? 'is-active' : ''}`}
                          onClick={() => setSelectedTopic(opt.key)}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Email 2-column row */}
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-name" className="contact-label">
                      {tContact(lang, 'nameLabel')} <span className="contact-label-req">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      className="contact-input"
                      placeholder={tContact(lang, 'namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="contact-email" className="contact-label">
                      {tContact(lang, 'emailLabel')} <span className="contact-label-req">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      className="contact-input"
                      placeholder={tContact(lang, 'emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Phone & Subject 2-column row */}
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-phone" className="contact-label">
                      {tContact(lang, 'phoneLabel')}
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      className="contact-input"
                      placeholder={tContact(lang, 'phonePlaceholder')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="contact-subject" className="contact-label">
                      {tContact(lang, 'subjectLabel')}
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      className="contact-input"
                      placeholder={tContact(lang, 'subjectPlaceholder')}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                </div>

                {/* Detailed Message Textarea */}
                <div className="contact-field">
                  <label htmlFor="contact-message" className="contact-label">
                    {tContact(lang, 'messageLabel')} <span className="contact-label-req">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className="contact-textarea"
                    placeholder={tContact(lang, 'messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                  />
                  <div className="contact-textarea-footer">
                    <span>Tối thiểu 10 ký tự</span>
                    <span>{message.length} ký tự</span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={isSubmitting}
                >
                  <Send size={18} aria-hidden="true" />
                  <span>{isSubmitting ? tContact(lang, 'sendingBtn') : tContact(lang, 'sendBtn')}</span>
                </button>

                {/* Real-time Status Alert */}
                {status && (
                  <div
                    className={`contact-status-alert ${status.type === 'success' ? 'is-success' : 'is-error'}`}
                    role="alert"
                  >
                    {status.type === 'success' ? (
                      <CheckCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    ) : (
                      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    )}
                    <div>{status.message}</div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Column B: Heritage Location & Leaflet Interactive Map */}
          <div className="contact-map-col">
            <div className="contact-map-card">
              <div className="contact-map-canvas-wrap">
                <ContactMap lang={lang} />
              </div>

              <div className="contact-map-meta">
                <h3 className="contact-map-station-name">{tContact(lang, 'mapHeading')}</h3>
                <p className="contact-map-station-addr">
                  <MapPin size={17} style={{ flexShrink: 0, marginTop: 2, color: '#c05621' }} aria-hidden="true" />
                  <span>{tContact(lang, 'officeAddress')}</span>
                </p>
                <p style={{ fontSize: '0.84rem', color: '#716259', lineHeight: 1.5 }}>
                  {tContact(lang, 'mapSubheading')}
                </p>

                <a
                  href="https://maps.google.com/?q=10.77978,106.69902"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-map-directions-link"
                >
                  <Navigation size={16} aria-hidden="true" />
                  <span>{tContact(lang, 'directionsBtn')}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Frequently Asked Questions (Accordion FAQs) */}
        <section className="contact-faq-section" aria-label="Câu hỏi thường gặp">
          <div className="contact-faq-header">
            <span className="contact-section-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              <span>HỎI ĐÁP & HƯỚNG DẪN</span>
            </span>
            <h2 className="contact-section-heading">{tContact(lang, 'faqHeading')}</h2>
            <p className="contact-section-desc">{tContact(lang, 'faqSubheading')}</p>
          </div>

          <div className="contact-faq-list">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={`contact-faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="contact-faq-trigger"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={19} className="contact-faq-chevron" aria-hidden="true" />
                  </button>

                  {isOpen && (
                    <div id={`faq-answer-${idx}`} className="contact-faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Trust & Support Commitment Banner */}
        <section className="contact-trust-banner" aria-label="Cam kết hỗ trợ">
          <div className="contact-trust-left">
            <div className="contact-trust-icon" aria-hidden="true">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h3 className="contact-trust-title">{tContact(lang, 'trustCommitment')}</h3>
              <p className="contact-trust-subtitle">
                Mọi thông tin phản hồi đều được lắng nghe nhằm bảo tồn và quảng bá văn hóa Sài Gòn.
              </p>
            </div>
          </div>

          <div className="contact-trust-badge">
            <Clock size={15} aria-hidden="true" />
            <span>{tContact(lang, 'trustResponseTime')}</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
