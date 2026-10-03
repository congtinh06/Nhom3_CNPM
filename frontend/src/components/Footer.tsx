import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', padding: '16px 0', marginTop: 'auto' }}>
      <div className="app-container footer-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <span className="footer-line" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          BankShield · Hướng dẫn giao dịch ngân hàng & phòng chống lừa đảo
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
          <Link to="/settings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Cài đặt trợ năng
          </Link>
          <span style={{ color: 'var(--border)' }}>·</span>
          <Link to="/architecture" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}>
            Kiến trúc
          </Link>
        </div>
      </div>
    </footer>
  );
};

