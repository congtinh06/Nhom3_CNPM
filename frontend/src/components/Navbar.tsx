import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ListFilter, BarChart3 } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand-logo">
        <ShieldCheck size={30} color="#2563eb" />
        <span>BankShield</span>
        <span className="brand-badge">Bảo Vệ Thương Hiệu</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
          <AlertTriangle size={18} />
          <span>Kiểm Tra & Báo Cáo</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <ListFilter size={18} />
          <span>Lịch Sử Báo Cáo</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>Bảng Thống Kê</span>
        </NavLink>
      </nav>
    </header>
  );
};
