import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { footerContent, siteContact } from '../../content/staticSections';

export const Footer: React.FC = () => {
  const handleTopClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="s ftr" aria-label="Chân trang">
      <div className="ftr-inner">
        <div className="ftr-brand col">
          <div className="ftr-br">{footerContent.brand}</div>
          <p className="ftr-tagline">
            Nghe kể chuyện Sài Gòn qua từng điểm đến và món ăn.
          </p>
        </div>

        <nav className="ftr-nav col" aria-label="Liên kết nhanh">
          <h2 className="ftr-heading">Liên kết</h2>
          <ul className="ftr-list">
            <li>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>
              <Link to="/diem-du-lich">Điểm du lịch</Link>
            </li>
            <li>
              <Link to="/am-thuc">Ẩm thực</Link>
            </li>
            <li>
              <Link to="/tin-tuc">Tin tức</Link>
            </li>
            <li>
              <Link to="/lien-he">Liên hệ</Link>
            </li>
          </ul>
        </nav>

        <div className="ftr-contact col">
          <h2 className="ftr-heading">Liên hệ</h2>
          <ul className="ftr-list">
            <li className="ftr-line">
              <MapPin size={14} aria-hidden="true" />
              <span>{siteContact.address}</span>
            </li>
            <li className="ftr-line">
              <Phone size={14} aria-hidden="true" />
              <a href={`tel:${siteContact.phone}`}>{siteContact.phone}</a>
            </li>
            <li className="ftr-line">
              <Mail size={14} aria-hidden="true" />
              <a href={`mailto:${siteContact.email}`}>{siteContact.email}</a>
            </li>
            <li className="ftr-line">
              <Clock size={14} aria-hidden="true" />
              <span>{siteContact.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="ftr-bottom">
        <span>{footerContent.copyright}</span>
        <a href="#top" onClick={handleTopClick}>
          {footerContent.backToTop}
        </a>
      </div>
    </footer>
  );
};
