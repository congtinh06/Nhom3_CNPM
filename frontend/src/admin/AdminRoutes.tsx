import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRouteGuard } from './routes/AdminRouteGuard';
import { AdminLayout } from './components/AdminLayout';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProductListPage } from './pages/ProductListPage';
import { ProductFormPage } from './pages/ProductFormPage';
import '../styles/admin.css';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="dang-nhap" element={<AdminLoginPage />} />
      <Route
        path="*"
        element={
          <AdminRouteGuard>
            <AdminLayout />
          </AdminRouteGuard>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="tong-quan" element={<AdminOverviewPage />} />
        <Route path="san-pham" element={<ProductListPage />} />
        <Route path="san-pham/moi" element={<ProductFormPage />} />
        <Route path="san-pham/:id" element={<ProductFormPage />} />
        <Route path="*" element={<Navigate to="/quan-tri/tong-quan" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
