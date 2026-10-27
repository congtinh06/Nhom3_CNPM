import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Guard bảo vệ route: Kiểm tra quyền quản trị, chưa đăng nhập sẽ chuyển hướng
import { AdminRouteGuard } from './routes/AdminRouteGuard';
// Layout khung sườn giao diện admin: Sidebar, Header và khu vực nội dung
import { AdminLayout } from './components/AdminLayout';
// File CSS định kiểu giao diện phân hệ admin
import '../styles/admin.css';

/* ==========================================================================
   1. KHAI BÁO CÁC TRANG BẰNG LAZY LOADING (TẢI LƯỜI)
   Giúp chia nhỏ file mã nguồn (code-splitting), chỉ tải trang khi người dùng truy cập,
   giúp web khởi động nhanh và tiết kiệm dung lượng mạng.
   ========================================================================== */

// [Tổng quan] Trang thống kê Dashboard tổng quan hệ thống
const AdminOverviewPage = lazy(() =>
  import('./pages/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);

// [Đăng nhập] Trang đăng nhập tài khoản quản trị viên
const AdminLoginPage = lazy(() =>
  import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);

// [Sản phẩm] Danh sách sản phẩm / vật phẩm du lịch
const ProductListPage = lazy(() =>
  import('./pages/ProductListPage').then((m) => ({ default: m.ProductListPage }))
);

// [Sản phẩm] Form thêm mới hoặc cập nhật thông tin sản phẩm
const ProductFormPage = lazy(() =>
  import('./pages/ProductFormPage').then((m) => ({ default: m.ProductFormPage }))
);

// [Điểm thuyết minh] Danh sách các điểm thuyết minh (POI - Points of Interest)
const PoiListPage = lazy(() =>
  import('./pages/PoiListPage').then((m) => ({ default: m.PoiListPage }))
);

// [Điểm thuyết minh] Form tạo mới hoặc chỉnh sửa thông tin điểm thuyết minh
const PoiFormPage = lazy(() =>
  import('./pages/PoiFormPage').then((m) => ({ default: m.PoiFormPage }))
);

// [Điểm thuyết minh] Quản lý nội dung bản dịch đa ngôn ngữ cho điểm thuyết minh
const PoiTranslationsPage = lazy(() =>
  import('./pages/PoiTranslationsPage').then((m) => ({ default: m.PoiTranslationsPage }))
);

// [Điểm thuyết minh] Quản lý mã QR gắn với điểm thuyết minh
const PoiQrListPage = lazy(() =>
  import('./pages/PoiQrListPage').then((m) => ({ default: m.PoiQrListPage }))
);

// [Điểm thuyết minh] Nhật ký ghi nhận lỗi (âm thanh thuyết minh, quét QR lỗi,...)
const PoiErrorLogPage = lazy(() =>
  import('./pages/PoiErrorLogPage').then((m) => ({ default: m.PoiErrorLogPage }))
);

// [Khu vực] Danh sách các khu vực / phân khu tham quan
const ZoneListPage = lazy(() =>
  import('./pages/ZoneListPage').then((m) => ({ default: m.ZoneListPage }))
);

// [Khu vực] Form tạo mới hoặc chỉnh sửa thông tin khu vực
const ZoneFormPage = lazy(() =>
  import('./pages/ZoneFormPage').then((m) => ({ default: m.ZoneFormPage }))
);

// [Lộ trình] Danh sách các lộ trình / tour tham quan
const RouteListPage = lazy(() =>
  import('./pages/RouteListPage').then((m) => ({ default: m.RouteListPage }))
);

// [Lộ trình] Form thêm mới hoặc cập nhật thông tin lộ trình
const RouteFormPage = lazy(() =>
  import('./pages/RouteFormPage').then((m) => ({ default: m.RouteFormPage }))
);

// [Lộ trình] Quản lý và sắp xếp thứ tự các điểm dừng trong lộ trình
const RouteStopsPage = lazy(() =>
  import('./pages/RouteStopsPage').then((m) => ({ default: m.RouteStopsPage }))
);

// [Tin tức] Danh sách bài viết tin tức, thông báo
const NewsListPage = lazy(() =>
  import('./pages/NewsListPage').then((m) => ({ default: m.NewsListPage }))
);

// [Tin tức] Form thêm mới hoặc sửa bài viết tin tức
const NewsFormPage = lazy(() =>
  import('./pages/NewsFormPage').then((m) => ({ default: m.NewsFormPage }))
);

// [Người dùng] Danh sách tài khoản người dùng trong hệ thống
const UserListPage = lazy(() =>
  import('./pages/UserListPage').then((m) => ({ default: m.UserListPage }))
);

// [Người dùng] Trang chi tiết thông tin và lịch sử của một người dùng
const UserDetailPage = lazy(() =>
  import('./pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage }))
);

// [Đơn hàng] Danh sách các đơn đặt hàng / mua vé
const OrderListPage = lazy(() =>
  import('./pages/OrderListPage').then((m) => ({ default: m.OrderListPage }))
);

// [Đơn hàng] Trang chi tiết thông tin một đơn hàng (theo mã đơn hàng)
const OrderDetailPage = lazy(() =>
  import('./pages/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage }))
);

// [Thống kê QR] Báo cáo thống kê lượt quét mã QR theo tài khoản hoặc audio
const QrAnalyticsPage = lazy(() => import('./pages/QrAnalyticsPage'));

/* ==========================================================================
   2. GIAO DIỆN CHỜ TRONG KHI TẢI TRANG (FALLBACK LOADER)
   Hiển thị spinner xoay xoay thông báo đang tải trong khi trang con đang được nạp.
   ========================================================================== */
const PageFallback: React.FC = () => (
  <div className="adm-screen-loader" role="status" aria-live="polite">
    <div className="adm-spinner" aria-hidden="true" />
    <p className="adm-loader-text">Đang tải trang quản trị...</p>
  </div>
);

/* ==========================================================================
   3. BỘ ĐIỀU HƯỚNG CHÍNH (ADMIN ROUTES COMPONENT)
   Định nghĩa toàn bộ các URL đường dẫn và component hiển thị tương ứng.
   ========================================================================== */
export const AdminRoutes: React.FC = () => {
  return (
    // Suspense bao bọc các component lazy để hiển thị PageFallback khi chưa tải xong
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* --- [ĐĂNG NHẬP] Tuyến đường đăng nhập admin (công khai, không cần đăng nhập trước) --- */}
        <Route path="dang-nhap" element={<AdminLoginPage />} />

        {/* --- [KHU VỰC BẢO VỆ] Tuyến đường yêu cầu quyền quản trị và sử dụng AdminLayout chung --- */}
        <Route
          path="*"
          element={
            <AdminRouteGuard>
              <AdminLayout />
            </AdminRouteGuard>
          }
        >
          {/* [Trang chủ / Tổng quan] Khi vào /quan-tri hoặc /quan-tri/tong-quan */}
          <Route index element={<AdminOverviewPage />} />
          <Route path="tong-quan" element={<AdminOverviewPage />} />

          {/* [Sản phẩm] Quản lý sản phẩm: Danh sách, Tạo mới, Chỉnh sửa theo ID */}
          <Route path="san-pham" element={<ProductListPage />} />
          <Route path="san-pham/moi" element={<ProductFormPage />} />
          <Route path="san-pham/:id" element={<ProductFormPage />} />

          {/* [Điểm thuyết minh] Quản lý điểm thuyết minh: Danh sách, Bản dịch, Mã QR, Nhật ký lỗi, Thêm/Sửa */}
          <Route path="diem-thuyet-minh" element={<PoiListPage />} />
          <Route path="diem-thuyet-minh/ban-dich" element={<PoiTranslationsPage />} />
          <Route path="diem-thuyet-minh/ma-qr" element={<PoiQrListPage />} />
          <Route path="diem-thuyet-minh/nhat-ky-loi" element={<PoiErrorLogPage />} />
          <Route path="diem-thuyet-minh/moi" element={<PoiFormPage />} />
          <Route path="diem-thuyet-minh/:id" element={<PoiFormPage />} />

          {/* [Khu vực] Quản lý khu vực tham quan: Danh sách, Tạo mới, Chỉnh sửa theo ID */}
          <Route path="khu-vuc" element={<ZoneListPage />} />
          <Route path="khu-vuc/moi" element={<ZoneFormPage />} />
          <Route path="khu-vuc/:id" element={<ZoneFormPage />} />

          {/* [Lộ trình] Quản lý lộ trình: Danh sách, Thứ tự điểm dừng, Tạo mới, Chỉnh sửa theo ID */}
          <Route path="lo-trinh" element={<RouteListPage />} />
          <Route path="lo-trinh/thu-tu-diem-dung" element={<RouteStopsPage />} />
          <Route path="lo-trinh/moi" element={<RouteFormPage />} />
          <Route path="lo-trinh/:id" element={<RouteFormPage />} />

          {/* [Tin tức] Quản lý bài viết tin tức: Danh sách, Tạo mới, Chỉnh sửa theo ID */}
          <Route path="tin-tuc" element={<NewsListPage />} />
          <Route path="tin-tuc/moi" element={<NewsFormPage />} />
          <Route path="tin-tuc/:id" element={<NewsFormPage />} />

          {/* [Người dùng] Quản lý tài khoản: Danh sách người dùng, Chi tiết theo ID */}
          <Route path="nguoi-dung" element={<UserListPage />} />
          <Route path="nguoi-dung/:id" element={<UserDetailPage />} />

          {/* [Đơn hàng] Quản lý đơn hàng: Danh sách đơn hàng, Chi tiết đơn theo mã orderCode */}
          <Route path="don-hang" element={<OrderListPage />} />
          <Route path="don-hang/:orderCode" element={<OrderDetailPage />} />

          {/* [Thống kê QR] Báo cáo quét QR theo tài khoản hoặc audio */}
          <Route path="qr/tai-khoan" element={<QrAnalyticsPage />} />
          <Route path="qr/audio" element={<QrAnalyticsPage />} />

          {/* --- [CHUYỂN HƯỚNG MẶC ĐỊNH] Khi truy cập URL rút gọn hoặc sai đường dẫn --- */}
          {/* Nếu vào /quan-tri/qr thì tự động chuyển hướng sang /quan-tri/qr/tai-khoan */}
          <Route path="qr" element={<Navigate to="/quan-tri/qr/tai-khoan" replace />} />
          {/* Nếu vào bất kỳ đường dẫn lạ nào không khớp thì quay về trang Tổng quan */}
          <Route path="*" element={<Navigate to="/quan-tri/tong-quan" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
