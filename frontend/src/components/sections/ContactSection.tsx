import React, { useState } from 'react';
import { contactContent } from '../../content/staticSections';
import { saveFeedbackCredentials, submitFeedback } from '../../services/feedbackService';
import { useNavbarLanguage } from '../../content/languages';
import { CONTACT_TRANSLATIONS } from '../../content/contactI18n';

export const ContactSection: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const c = CONTACT_TRANSLATIONS[lang] || CONTACT_TRANSLATIONS.vi;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !/^\S+@\S+\.\S+$/.test(trimmedEmail) || trimmedMessage.length < 10) {
      setStatusText(c.errorNotice);
      return;
    }

    try {
      const res = await submitFeedback({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });
      if (res.ticket && res.accessToken) {
        saveFeedbackCredentials(res.ticket, res.accessToken);
      }
      setStatusText(c.successNotice);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatusText(c.errSendFailed);
    }
  };

  const areaLabel =
    lang === 'en'
      ? 'Ho Chi Minh City'
      : lang === 'ja'
        ? 'ホーチミン市'
        : lang === 'ko'
          ? '호찌민시'
          : contactContent.area;

  return (
    <section className="s ft" id="lien-he">
      <div>
        <h2>{c.title}</h2>
        <p>{c.subtitle}</p>
        <ul>
          <li>
            <b>{c.emailLabel}</b> <a href={`mailto:${contactContent.email}`}>{contactContent.email}</a>
          </li>
          <li>
            <b>{c.phoneLabel}</b> <a href={`tel:${contactContent.phone}`}>{contactContent.phone}</a>
          </li>
          <li>
            <b>{lang === 'en' ? 'Region' : lang === 'ja' ? 'エリア' : lang === 'ko' ? '지역' : 'Khu vực'}</b> {areaLabel}
          </li>
        </ul>
      </div>

      <form id="fm" noValidate onSubmit={handleSubmit}>
        <input
          name="nm"
          placeholder={c.namePlaceholder || (lang === 'en' ? 'Your name' : lang === 'ja' ? 'お名前' : lang === 'ko' ? '성함' : 'Tên của bạn')}
          aria-label={c.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          name="em"
          type="email"
          placeholder={c.emailPlaceholder || 'Email'}
          aria-label={c.emailLabel}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          name="ms"
          placeholder={c.messagePlaceholder || (lang === 'en' ? 'Feedback (at least 10 characters)' : lang === 'ja' ? 'お問い合わせ内容（10文字以上）' : lang === 'ko' ? '의견 내용 (최소 10자 이상)' : 'Góp ý (ít nhất 10 ký tự)')}
          aria-label={c.messageLabel}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="tb" type="submit">
          {c.sendBtn}
        </button>
        {statusText && (
          <p id="fs" role="status">
            {statusText}
          </p>
        )}
      </form>
    </section>
  );
};
