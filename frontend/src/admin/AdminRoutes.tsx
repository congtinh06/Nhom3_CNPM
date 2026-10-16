import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminRouteGuard } from './routes/AdminRouteGuard';
import { AdminLayout } from './components/AdminLayout';
import '../styles/admin.css';

const AdminOverviewPage = lazy(() =>
  import('./pages/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const ProductListPage = lazy(() =>
  import('./pages/ProductListPage').then((m) => ({ default: m.ProductListPage }))
);
const ProductFormPage = lazy(() =>
  import('./pages/ProductFormPage').then((m) => ({ default: m.ProductFormPage }))
);
const PoiListPage = lazy(() =>
  import('./pages/PoiListPage').then((m) => ({ default: m.PoiListPage }))
);
const PoiFormPage = lazy(() =>
  import('./pages/PoiFormPage').then((m) => ({ default: m.PoiFormPage }))
);
const ZoneListPage = lazy(() =>
  import('./pages/ZoneListPage').then((m) => ({ default: m.ZoneListPage }))
);
const ZoneFormPage = lazy(() =>
  import('./pages/ZoneFormPage').then((m) => ({ default: m.ZoneFormPage }))
);
const RouteListPage = lazy(() =>
  import('./pages/RouteListPage').then((m) => ({ default: m.RouteListPage }))
);
const RouteFormPage = lazy(() =>
  import('./pages/RouteFormPage').then((m) => ({ default: m.RouteFormPage }))
);
const UserListPage = lazy(() =>
  import('./pages/UserListPage').then((m) => ({ default: m.UserListPage }))
);
const UserDetailPage = lazy(() =>
  import('./pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage }))
);

const PageFallback: React.FC = () => (
  <div className="adm-screen-loader" role="status" aria-live="polite">
    <div className="adm-spinner" aria-hidden="true" />
    <p className="adm-loader-text">Đang tải trang quản trị...</p>
  </div>
);

export const AdminRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
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
          <Route path="diem-thuyet-minh" element={<PoiListPage />} />
          <Route path="diem-thuyet-minh/moi" element={<PoiFormPage />} />
          <Route path="diem-thuyet-minh/:id" element={<PoiFormPage />} />
          <Route path="khu-vuc" element={<ZoneListPage />} />
          <Route path="khu-vuc/moi" element={<ZoneFormPage />} />
          <Route path="khu-vuc/:id" element={<ZoneFormPage />} />
          <Route path="lo-trinh" element={<RouteListPage />} />
          <Route path="lo-trinh/moi" element={<RouteFormPage />} />
          <Route path="lo-trinh/:id" element={<RouteFormPage />} />
          <Route path="nguoi-dung" element={<UserListPage />} />
          <Route path="nguoi-dung/:id" element={<UserDetailPage />} />
          <Route path="*" element={<Navigate to="/quan-tri/tong-quan" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
