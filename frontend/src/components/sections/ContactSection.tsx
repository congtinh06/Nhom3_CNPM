import React, { useEffect, useState } from 'react';
import { contactContent } from '../../content/staticSections';
import { getFeedbackThread, loadFeedbackCredentials, saveFeedbackCredentials, submitFeedback, FeedbackThread } from '../../services/feedbackService';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [statusText, setStatusText] = useState('');
  const [thread, setThread] = useState<FeedbackThread | null>(null);
  const [credentials] = useState(loadFeedbackCredentials);
  useEffect(() => {
    if (!credentials) return;
    let active = true;
    const refresh = async () => { try { const value = await getFeedbackThread(credentials.ticket, credentials.accessToken); if (active) setThread(value); } catch { /* retry on next poll */ } };
    void refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [credentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !/^\S+@\S+\.\S+$/.test(trimmedEmail) || trimmedMessage.length < 10) {
      setStatusText('Vui lòng nhập tên, email hợp lệ và góp ý ít nhất 10 ký tự.');
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
      setThread(await getFeedbackThread(res.ticket, res.accessToken));
    }
    setStatusText(res.message);
    setName('');
    setEmail('');
    setMessage('');
    } catch {
      setStatusText('Không gửi được tin nhắn. Vui lòng thử lại.');
    }
  };

  return (
    <section className="s ft" id="lien-he">
      <div>
        <h2>{contactContent.title}</h2>
        <p>{contactContent.paragraph}</p>
        <ul>
          <li>
            <b>Email</b> <a href={`mailto:${contactContent.email}`}>{contactContent.email}</a>
          </li>
          <li>
            <b>Điện thoại</b> <a href="tel:0900000000">{contactContent.phone}</a>
          </li>
          <li>
            <b>Khu vực</b> {contactContent.area}
          </li>
        </ul>
      </div>

      <form id="fm" noValidate onSubmit={handleSubmit}>
        <input
          name="nm"
          placeholder="Tên của bạn"
          aria-label="Tên của bạn"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          name="em"
          type="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          name="ms"
          placeholder="Góp ý (ít nhất 10 ký tự)"
          aria-label="Góp ý"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="tb" type="submit">
          Gửi góp ý
        </button>
        {statusText && (
          <p id="fs" role="status">
            {statusText}
          </p>
        )}
        {thread && <div role="log" aria-live="polite"><b>Mã theo dõi: {thread.ticket}</b><p>Đăng nhập trên trình duyệt này để xem hội thoại trong Tài khoản - Tin nhắn hỗ trợ.</p>{thread.messages.map((item) => <p key={item.id}><b>{item.sender === 'ADMIN' ? 'Echora' : 'Bạn'}:</b> {item.content}</p>)}</div>}
      </form>
    </section>
  );
};
