import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ReportFormPage } from './pages/ReportFormPage';
import { ReportListPage } from './pages/ReportListPage';
import { StatsDashboardPage } from './pages/StatsDashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ReportFormPage />} />
            <Route path="/reports" element={<ReportListPage />} />
            <Route path="/dashboard" element={<StatsDashboardPage />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>
            BankShield • Hệ Thống Kiểm Tra & Cảnh Báo Web/SMS Giả Mạo Ngân Hàng (Anti-Phishing & Brand Protection)
          </p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
            Kiến trúc Microservices: Spring Cloud Gateway • OpenFeign • RabbitMQ • PostgreSQL • React + Vite
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
