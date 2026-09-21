import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ViewerBar } from './components/ViewerBar';

import { CheckPage } from './pages/CheckPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportListPage } from './pages/ReportListPage';
import { StatsDashboardPage } from './pages/StatsDashboardPage';
import { NotificationLogPage } from './pages/NotificationLogPage';
import { ForbiddenPage } from './pages/ForbiddenPage';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (role !== 'admin') {
    return <ForbiddenPage />;
  }
  return <>{children}</>;
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
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/check" replace />} />
            <Route path="/check" element={<CheckPage />} />
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
              path="/notifications"
              element={
                <AdminRoute>
                  <NotificationLogPage />
                </AdminRoute>
              }
            />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="*" element={<Navigate to="/check" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
