import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ViewerBar } from './components/ViewerBar';

import { PreferencesProvider } from './context/PreferencesContext';
import { LearnPage } from './pages/LearnPage';
import { EmergencyHelpPage } from './pages/EmergencyHelpPage';
import { SettingsPage } from './pages/SettingsPage';

import { CheckPage } from './pages/CheckPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportListPage } from './pages/ReportListPage';
import { StatsDashboardPage } from './pages/StatsDashboardPage';
import { NotificationLogPage } from './pages/NotificationLogPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { GuidePage } from './pages/GuidePage';
import { VisitStatsPage } from './pages/VisitStatsPage';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (role !== 'admin') {
    return <ForbiddenPage />;
  }
  return (
    <div data-theme="dark" style={{ minHeight: '100%', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {children}
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <div className="app-frame">
      <Navbar />
      <main className="page-content">
        <Outlet />
      </main>
      <Footer />
      <ViewerBar />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/guide" replace />} />
              <Route path="/guide" element={<GuidePage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/check" element={<CheckPage />} />
              <Route path="/help" element={<EmergencyHelpPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/history" element={<HistoryPage />} />
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <ReportListPage />
                </AdminRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <AdminRoute>
                  <StatsDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/visits"
              element={
                <AdminRoute>
                  <VisitStatsPage />
                </AdminRoute>
              }
            />
            <Route path="/visits" element={<Navigate to="/admin/visits" replace />} />
            <Route
              path="/notifications"
              element={
                <AdminRoute>
                  <NotificationLogPage />
                </AdminRoute>
              }
            />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="*" element={<Navigate to="/guide" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PreferencesProvider>
  </AuthProvider>
  );
};

export default App;
