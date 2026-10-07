import React, { useState } from 'react';
import { contactContent } from '../../content/staticSections';
import { submitFeedback } from '../../services/feedbackService';

export const ContactSection: React.FC = () => {
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
      setStatusText('Vui lòng nhập tên, email hợp lệ và góp ý ít nhất 10 ký tự.');
      return;
    }

    const res = await submitFeedback({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });

    setStatusText(res.message);
    setName('');
    setEmail('');
    setMessage('');
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
      </form>
    </section>
  );
};
