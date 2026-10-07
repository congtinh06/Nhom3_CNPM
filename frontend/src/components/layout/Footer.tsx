import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { footerContent } from '../../content/staticSections';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      const targetId = hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleTopClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="s ftr">
      <div className="gr">
        <div className="col">
          <div className="br">{footerContent.brand}</div>
          <p>{footerContent.blurb}</p>
        </div>

        <div className="col">
          <h3>Khám phá</h3>
          <ul>
            <li>
              <a href="#gioi-thieu" onClick={(e) => handleAnchorClick(e, '#gioi-thieu')}>
                Giới thiệu
              </a>
            </li>
            <li>
              <a href="#van-hoa" onClick={(e) => handleAnchorClick(e, '#van-hoa')}>
                Văn hóa
              </a>
            </li>
            <li>
              <a href="#trang-phuc" onClick={(e) => handleAnchorClick(e, '#trang-phuc')}>
                Trang phục
              </a>
            </li>
            <li>
              <a href="#am-thuc" onClick={(e) => handleAnchorClick(e, '#am-thuc')}>
                Ẩm thực
              </a>
            </li>
          </ul>
        </div>

        <div className="col">
          <h3>Dịch vụ</h3>
          <ul>
            <li>
              <a href="#thuc-uong" onClick={(e) => handleAnchorClick(e, '#thuc-uong')}>
                Thức uống
              </a>
            </li>
            <li>
              <a href="#diem-den" onClick={(e) => handleAnchorClick(e, '#diem-den')}>
                Điểm du lịch
              </a>
            </li>
            <li>
              <a
                href="/don-hang"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/don-hang');
                }}
              >
                Đơn hàng của tôi
              </a>
            </li>
            <li>
              <a href="#lien-he" onClick={(e) => handleAnchorClick(e, '#lien-he')}>
                Gửi góp ý
              </a>
            </li>
          </ul>
        </div>

        <div className="col">
          <h3>Liên hệ</h3>
          <ul>
            <li>
              <a href="mailto:hello@example.com">hello@example.com</a>
            </li>
            <li>
              <a href="tel:0900000000">0900 000 000</a>
            </li>
            <li>TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>

      <div className="bt">
        <span>{footerContent.copyright}</span>
        <a href="#top" onClick={handleTopClick}>
          {footerContent.backToTop}
        </a>
      </div>
    </footer>
  );
};
