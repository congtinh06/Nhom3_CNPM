import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ChevronUp } from 'lucide-react';
import { useNavbarLanguage } from '../../content/languages';
import { getFooterContent, siteContact } from '../../content/staticSections';
import { scrollToTopInstant } from '../../hooks/useScrollRestoration';

export const Footer: React.FC = () => {
  const { lang } = useNavbarLanguage();
  const footer = getFooterContent(lang);

  const handleTopClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToTopInstant(true);
  };

  const handleLinkClick = () => {
    scrollToTopInstant(false);
  };

  return (
    <footer className="s ftr" aria-label="Footer">
      <div className="ftr-container">
        <div className="ftr-inner">
          <div className="ftr-brand col">
            <div className="ftr-br">Echora</div>
            <p className="ftr-tagline">{footer.tagline}</p>
          </div>

          <nav className="ftr-nav col" aria-label={footer.linksHeading}>
            <h2 className="ftr-heading">{footer.linksHeading}</h2>
            <ul className="ftr-list">
              <li>
                <Link to="/" onClick={handleLinkClick}>{footer.home}</Link>
              </li>
              <li>
                <Link to="/diem-du-lich" onClick={handleLinkClick}>{footer.attractions}</Link>
              </li>
              <li>
                <Link to="/am-thuc" onClick={handleLinkClick}>{footer.souvenirs}</Link>
              </li>
              <li>
                <Link to="/tin-tuc" onClick={handleLinkClick}>{footer.news}</Link>
              </li>
              <li>
                <Link to="/lien-he" onClick={handleLinkClick}>{footer.contact}</Link>
              </li>
            </ul>
          </nav>

          <div className="ftr-contact col">
            <h2 className="ftr-heading">{footer.contactHeading}</h2>
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
          <span>{footer.copyright}</span>
          <span className="ftr-bottom-links">
            <Link to="/chinh-sach-quyen-rieng-tu" onClick={handleLinkClick}>
              {footer.privacyPolicy}
            </Link>
            <a href="#top" onClick={handleTopClick} className="ftr-top-link">
              {footer.backToTop}
              <ChevronUp size={16} aria-hidden="true" />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};
