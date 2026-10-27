import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const outDir = 'f:/Nhom3_CNPM/docs/report/diagrams/png';

// SVG 1: Activity Diagram - Auth & Session (Dang nhap & Xac thuc)
const svgAuth = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 850" width="1100" height="850" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="550" y="35" text-anchor="middle" font-size="20" font-weight="bold" fill="#000000">Sơ đồ Hoạt động (Activity Diagram): Đăng nhập và Quản lý Phiên Người dùng</text>

  <!-- Swimlane / Subsystem headers -->
  <rect x="50" y="55" width="480" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <rect x="530" y="55" width="520" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="80" text-anchor="middle" font-size="16" font-weight="bold">Phía Người dùng (Client / Browser)</text>
  <text x="790" y="80" text-anchor="middle" font-size="16" font-weight="bold">Phía Máy chủ Echora (Auth Service &amp; Redis)</text>
  <line x1="50" y1="95" x2="1050" y2="95" stroke="#000000" stroke-width="1"/>

  <!-- Initial Node -->
  <circle cx="290" cy="125" r="12" fill="#000000"/>
  <line x1="290" y1="137" x2="290" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Mo form dang nhap -->
  <rect x="180" y="165" width="220" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="192" text-anchor="middle" font-size="14">Mở biểu mẫu Đăng nhập</text>

  <line x1="290" y1="210" x2="290" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Nhap email & pass -->
  <rect x="170" y="240" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="262" text-anchor="middle" font-size="14">Nhập thông tin Email &amp; Mật khẩu</text>
  <text x="290" y="280" text-anchor="middle" font-size="13" font-style="italic">(Hoặc bấm Đăng nhập bằng Google)</text>

  <!-- Flow across swimlanes -->
  <line x1="410" y1="265" x2="670" y2="265" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Nhan payload & validate cu phap -->
  <rect x="670" y="240" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="262" text-anchor="middle" font-size="14">Tiếp nhận yêu cầu xác thực</text>
  <text x="790" y="280" text-anchor="middle" font-size="13">Kiểm tra cú pháp &amp; Rate Limit</text>

  <line x1="790" y1="290" x2="790" y2="325" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Cu phap hop le? -->
  <polygon points="790,325 845,355 790,385 735,355" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="359" text-anchor="middle" font-size="12">Cú pháp hợp lệ?</text>

  <!-- False branch: Cu phap loi -> Tra ve loi 400 -->
  <line x1="735" y1="355" x2="620" y2="355" stroke="#000000" stroke-width="1.5"/>
  <line x1="620" y1="355" x2="620" y2="200" stroke="#000000" stroke-width="1.5"/>
  <line x1="620" y1="200" x2="400" y2="200" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="645" y="345" font-size="12">[Không hợp lệ - 400]</text>

  <!-- True branch: Kiem tra credentials trong DB -->
  <line x1="790" y1="385" x2="790" y2="420" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="800" y="405" font-size="12">[Hợp lệ]</text>

  <rect x="670" y="420" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="442" text-anchor="middle" font-size="14">Truy vấn người dùng &amp; Đối chiếu</text>
  <text x="790" y="460" text-anchor="middle" font-size="13">Băm mật khẩu BCrypt / Google Token</text>

  <line x1="790" y1="470" x2="790" y2="505" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Thong tin chinh xac? -->
  <polygon points="790,505 845,535 790,565 735,535" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="539" text-anchor="middle" font-size="12">Khớp mật khẩu?</text>

  <!-- False branch: Sai pass -> Tang bo dem that bai, tra ve 401 -->
  <line x1="845" y1="535" x2="970" y2="535" stroke="#000000" stroke-width="1.5"/>
  <line x1="970" y1="535" x2="970" y2="265" stroke="#000000" stroke-width="1.5"/>
  <line x1="970" y1="265" x2="910" y2="265" stroke="#000000" stroke-width="1.5"/>
  <text x="860" y="525" font-size="12">[Sai - Tăng đếm lỗi]</text>

  <!-- True branch: Khoi tao phien va ky JWT -->
  <line x1="790" y1="565" x2="790" y2="600" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="800" y="585" font-size="12">[Khớp thông tin]</text>

  <rect x="660" y="600" width="260" height="55" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="622" text-anchor="middle" font-size="14">Khởi tạo Token: Access Token (JWT 1h)</text>
  <text x="790" y="642" text-anchor="middle" font-size="13">&amp; Refresh Token (Redis TTL 7 ngày)</text>

  <line x1="790" y1="655" x2="790" y2="690" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Tra ve phan hoi JSON -->
  <rect x="670" y="690" width="240" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="718" text-anchor="middle" font-size="14">Trả về HTTP 200 OK &amp; User Info</text>

  <!-- Flow back to Client -->
  <line x1="670" y1="712" x2="410" y2="712" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Luu session vao LocalStorage & redirect -->
  <rect x="170" y="690" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="712" text-anchor="middle" font-size="14">Lưu JWT vào Storage &amp; Cookie</text>
  <text x="290" y="730" text-anchor="middle" font-size="13">Cập nhật trạng thái người dùng</text>

  <line x1="290" y1="740" x2="290" y2="775" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Final Node -->
  <circle cx="290" cy="790" r="14" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="290" cy="790" r="8" fill="#000000"/>
</svg>`;

// SVG 2: Activity Diagram - Map & POI Discovery (Kham pha Ban do & Tra cuu Di tich)
const svgMap = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 850" width="1100" height="850" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="550" y="35" text-anchor="middle" font-size="20" font-weight="bold" fill="#000000">Sơ đồ Hoạt động (Activity Diagram): Khám phá Bản đồ và Tra cứu Điểm Di tích</text>

  <!-- Swimlane / Subsystem headers -->
  <rect x="50" y="55" width="480" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <rect x="530" y="55" width="520" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="80" text-anchor="middle" font-size="16" font-weight="bold">Phía Du khách (Ứng dụng Di động / Web)</text>
  <text x="790" y="80" text-anchor="middle" font-size="16" font-weight="bold">Phía Hệ thống Echora (POI Service &amp; Map Tiles)</text>
  <line x1="50" y1="95" x2="1050" y2="95" stroke="#000000" stroke-width="1"/>

  <!-- Initial Node -->
  <circle cx="290" cy="125" r="12" fill="#000000"/>
  <line x1="290" y1="137" x2="290" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Mo tab Ban do -->
  <rect x="180" y="165" width="220" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="192" text-anchor="middle" font-size="14">Truy cập giao diện Bản đồ</text>

  <!-- Send request for POIs -->
  <line x1="400" y1="187" x2="680" y2="187" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Fetch POIs & Map Tiles -->
  <rect x="680" y="165" width="240" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="192" text-anchor="middle" font-size="14">Tải danh sách POI &amp; Tọa độ Geofence</text>

  <line x1="800" y1="210" x2="800" y2="245" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Render on client -->
  <line x1="680" y1="265" x2="410" y2="265" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Hien thi Marker tren ban do -->
  <rect x="170" y="240" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="262" text-anchor="middle" font-size="14">Hiển thị bản đồ Leaflet / OSM</text>
  <text x="290" y="280" text-anchor="middle" font-size="13">Đánh dấu Marker các di tích</text>

  <line x1="290" y1="290" x2="290" y2="330" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Hanh dong tiep theo? (Tim kiem hoac Chon Marker) -->
  <polygon points="290,330 350,360 290,390 230,360" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="364" text-anchor="middle" font-size="12">Thao tác?</text>

  <!-- Branch 1: Nhap tu khoa tim kiem / bo loc danh muc -->
  <line x1="230" y1="360" x2="110" y2="360" stroke="#000000" stroke-width="1.5"/>
  <line x1="110" y1="360" x2="110" y2="430" stroke="#000000" stroke-width="1.5"/>
  <line x1="110" y1="430" x2="170" y2="430" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="140" y="350" font-size="12">[Tìm kiếm / Lọc]</text>

  <rect x="170" y="410" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="432" text-anchor="middle" font-size="14">Nhập từ khóa hoặc chọn danh mục</text>
  <text x="290" y="450" text-anchor="middle" font-size="13">(Ví dụ: "Dinh Độc Lập", "Bảo tàng")</text>

  <line x1="290" y1="460" x2="290" y2="500" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Loc va highlight marker -->
  <rect x="170" y="500" width="240" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="527" text-anchor="middle" font-size="14">Lọc danh sách &amp; Highlight Marker</text>

  <!-- Branch 2: Chon Marker truc tiep tren ban do -->
  <line x1="350" y1="360" x2="440" y2="360" stroke="#000000" stroke-width="1.5"/>
  <line x1="440" y1="360" x2="440" y2="570" stroke="#000000" stroke-width="1.5"/>
  <line x1="440" y1="570" x2="410" y2="570" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="360" y="350" font-size="12">[Bấm chọn Marker]</text>

  <line x1="290" y1="545" x2="290" y2="570" stroke="#000000" stroke-width="1.5"/>
  <line x1="290" y1="570" x2="290" y2="590" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Mo xem chi tiet POI -->
  <rect x="170" y="590" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="612" text-anchor="middle" font-size="14">Mở bảng tóm tắt di tích (Bottom Sheet)</text>
  <text x="290" y="630" text-anchor="middle" font-size="13">Hiển thị hình ảnh, địa chỉ, khoảng cách</text>

  <!-- Fetch full detail if clicked -->
  <line x1="410" y1="615" x2="680" y2="615" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Fetch rich content & audio preview -->
  <rect x="680" y="590" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="612" text-anchor="middle" font-size="14">Trả về bài thuyết minh đa ngữ</text>
  <text x="800" y="630" text-anchor="middle" font-size="13">&amp; Danh sách hiện vật / hình ảnh gốc</text>

  <!-- Flow back to client display -->
  <line x1="800" y1="640" x2="800" y2="690" stroke="#000000" stroke-width="1.5"/>
  <line x1="800" y1="690" x2="410" y2="690" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Phat audio hoac dan duong -->
  <rect x="170" y="670" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="692" text-anchor="middle" font-size="14">Xem chi tiết bài thuyết minh</text>
  <text x="290" y="710" text-anchor="middle" font-size="13">Lựa chọn: Nghe thử / Chỉ đường</text>

  <line x1="290" y1="720" x2="290" y2="760" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Final Node -->
  <circle cx="290" cy="775" r="14" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="290" cy="775" r="8" fill="#000000"/>
</svg>`;

// SVG 3: Activity Diagram - CMS Content Management (Quan tri Diem di tich & Bien tap Noi dung Thuyet minh)
const svgCmsContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 850" width="1100" height="850" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="550" y="35" text-anchor="middle" font-size="20" font-weight="bold" fill="#000000">Sơ đồ Hoạt động (Activity Diagram): Quản trị Điểm Di tích và Nội dung Thuyết minh (CMS)</text>

  <!-- Swimlane / Subsystem headers -->
  <rect x="50" y="55" width="480" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <rect x="530" y="55" width="520" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="80" text-anchor="middle" font-size="16" font-weight="bold">Quản trị viên / Biên tập viên CMS</text>
  <text x="790" y="80" text-anchor="middle" font-size="16" font-weight="bold">Hệ thống Echora CMS &amp; Pipeline Xử lý Tự động</text>
  <line x1="50" y1="95" x2="1050" y2="95" stroke="#000000" stroke-width="1"/>

  <!-- Initial Node -->
  <circle cx="290" cy="125" r="12" fill="#000000"/>
  <line x1="290" y1="137" x2="290" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Dang nhap CMS & Mo quan tri POI -->
  <rect x="180" y="165" width="220" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="192" text-anchor="middle" font-size="14">Truy cập Quản lý Điểm Di tích</text>

  <line x1="290" y1="210" x2="290" y2="245" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Nhap thong tin POI -->
  <rect x="160" y="245" width="260" height="55" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="267" text-anchor="middle" font-size="14">Nhập Tên, Tọa độ Lat/Long, Bán kính Geofence</text>
  <text x="290" y="287" text-anchor="middle" font-size="13">&amp; Soạn thảo văn bản thuyết minh tiếng Việt</text>

  <!-- Submit to server -->
  <line x1="420" y1="272" x2="680" y2="272" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Validate & Luu POI Master -->
  <rect x="680" y="245" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="267" text-anchor="middle" font-size="14">Kiểm tra hợp lệ dữ liệu nhập</text>
  <text x="800" y="287" text-anchor="middle" font-size="13">Lưu bản ghi POI gốc (trạng thái DRAFT)</text>

  <line x1="800" y1="295" x2="800" y2="330" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Co yeu cau sinh da ngu tu dong? -->
  <polygon points="800,330 860,360 800,390 740,360" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="364" text-anchor="middle" font-size="12">Dịch tự động?</text>

  <!-- Branch 1: Khong dich tu dong -> Nguoi dung tu upload file audio thu am thu cong -->
  <line x1="740" y1="360" x2="610" y2="360" stroke="#000000" stroke-width="1.5"/>
  <line x1="610" y1="360" x2="610" y2="430" stroke="#000000" stroke-width="1.5"/>
  <line x1="610" y1="430" x2="420" y2="430" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="640" y="350" font-size="12">[Tự tải lên]</text>

  <rect x="170" y="410" width="250" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="295" y="437" text-anchor="middle" font-size="14">Tải lên tệp âm thanh thu âm MP3/WAV</text>

  <line x1="295" y1="455" x2="295" y2="520" stroke="#000000" stroke-width="1.5"/>
  <line x1="295" y1="520" x2="680" y2="520" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Branch 2: Kich hoat Pipeline tu dong: MyMemory + Edge-TTS -->
  <line x1="800" y1="390" x2="800" y2="430" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="810" y="410" font-size="12">[Kích hoạt Pipeline]</text>

  <rect x="670" y="430" width="260" height="55" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="452" text-anchor="middle" font-size="14">Đẩy Job dịch thuật vào hàng đợi</text>
  <text x="800" y="472" text-anchor="middle" font-size="13">MyMemory: vi -> en, ja, ko</text>

  <line x1="800" y1="485" x2="800" y2="515" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Merge point and TTS synthesis -->
  <rect x="670" y="515" width="260" height="55" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="537" text-anchor="middle" font-size="14">Gọi Edge-TTS sinh file âm thanh</text>
  <text x="800" y="557" text-anchor="middle" font-size="13">Lưu trữ tệp âm thanh và phụ đề VTT</text>

  <line x1="800" y1="570" x2="800" y2="605" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Sinh ma QR di tich tu dong -->
  <rect x="670" y="605" width="260" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="632" text-anchor="middle" font-size="14">Tự động sinh mã QR dự phòng cho di tích</text>

  <line x1="800" y1="650" x2="800" y2="685" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Notify client -->
  <line x1="670" y1="710" x2="420" y2="710" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="680" y="685" width="240" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="712" text-anchor="middle" font-size="14">Cập nhật POI sang trạng thái PUBLISHED</text>

  <!-- Action: QTV xem ket qua & in ma QR -->
  <rect x="170" y="685" width="250" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="295" y="707" text-anchor="middle" font-size="14">Kiểm tra kết quả bản dịch, nghe thử audio</text>
  <text x="295" y="725" text-anchor="middle" font-size="13">&amp; Xuất tệp mã QR để in biển vật lý</text>

  <line x1="295" y1="735" x2="295" y2="775" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Final Node -->
  <circle cx="295" cy="790" r="14" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="295" cy="790" r="8" fill="#000000"/>
</svg>`;

// SVG 4: Activity Diagram - CMS Order Management & Reconciliation (Quan tri Don hang & Doi soat Doanh thu)
const svgCmsOrders = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 850" width="1100" height="850" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="550" y="35" text-anchor="middle" font-size="20" font-weight="bold" fill="#000000">Sơ đồ Hoạt động (Activity Diagram): Quản trị Đơn hàng Lưu niệm và Đối soát Doanh thu (CMS)</text>

  <!-- Swimlane / Subsystem headers -->
  <rect x="50" y="55" width="480" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <rect x="530" y="55" width="520" height="770" fill="none" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="80" text-anchor="middle" font-size="16" font-weight="bold">Quản trị viên Tài chính / Quản lý Đơn hàng</text>
  <text x="790" y="80" text-anchor="middle" font-size="16" font-weight="bold">Hệ thống Echora Backend &amp; Dịch vụ Báo cáo</text>
  <line x1="50" y1="95" x2="1050" y2="95" stroke="#000000" stroke-width="1"/>

  <!-- Initial Node -->
  <circle cx="290" cy="125" r="12" fill="#000000"/>
  <line x1="290" y1="137" x2="290" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Truy cap quan ly don hang -->
  <rect x="180" y="165" width="220" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="192" text-anchor="middle" font-size="14">Mở bảng Quản lý Đơn hàng</text>

  <!-- Fetch orders -->
  <line x1="400" y1="187" x2="680" y2="187" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Truy van danh sach don hang -->
  <rect x="680" y="165" width="240" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="192" text-anchor="middle" font-size="14">Truy vấn cơ sở dữ liệu đơn hàng</text>

  <!-- Return list -->
  <line x1="680" y1="210" x2="410" y2="265" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Xem danh sach & Chon bo loc -->
  <rect x="160" y="245" width="260" height="55" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="267" text-anchor="middle" font-size="14">Thiết lập bộ lọc tìm kiếm đơn hàng</text>
  <text x="290" y="287" text-anchor="middle" font-size="13">(Theo ngày, Trạng thái: PAID, PENDING, SHIPPED)</text>

  <line x1="290" y1="300" x2="290" y2="340" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Chon nghiep vu nao? -->
  <polygon points="290,340 350,370 290,400 230,370" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="374" text-anchor="middle" font-size="12">Nghiệp vụ?</text>

  <!-- Branch 1: Cap nhat trang thai van chuyen don hang luu niem -->
  <line x1="230" y1="370" x2="110" y2="370" stroke="#000000" stroke-width="1.5"/>
  <line x1="110" y1="370" x2="110" y2="440" stroke="#000000" stroke-width="1.5"/>
  <line x1="110" y1="440" x2="160" y2="440" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="130" y="360" font-size="12">[Xử lý giao hàng]</text>

  <rect x="160" y="420" width="260" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="442" text-anchor="middle" font-size="14">Cập nhật mã vận đơn &amp; chuyển trạng thái</text>
  <text x="290" y="460" text-anchor="middle" font-size="13">PAID -> PROCESSING -> SHIPPED</text>

  <line x1="420" y1="445" x2="680" y2="445" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="680" y="420" width="240" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="442" text-anchor="middle" font-size="14">Ghi nhận log cập nhật trạng thái</text>
  <text x="800" y="460" text-anchor="middle" font-size="13">&amp; Bắn thông báo Email / SMS cho khách</text>

  <!-- Branch 2: Doi soat va Xuat bao cao tai chinh -->
  <line x1="350" y1="370" x2="450" y2="370" stroke="#000000" stroke-width="1.5"/>
  <line x1="450" y1="370" x2="450" y2="520" stroke="#000000" stroke-width="1.5"/>
  <line x1="450" y1="520" x2="420" y2="520" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="360" y="360" font-size="12">[Đối soát doanh thu]</text>

  <rect x="160" y="500" width="260" height="50" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="290" y="522" text-anchor="middle" font-size="14">Yêu cầu Kết xuất Báo cáo Doanh thu</text>
  <text x="290" y="540" text-anchor="middle" font-size="13">(Theo VNPAY, VietQR và Tiền mặt quầy vé)</text>

  <line x1="420" y1="525" x2="680" y2="525" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Aggregate revenue & cross-check -->
  <rect x="680" y="500" width="240" height="55" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="522" text-anchor="middle" font-size="14">Tổng hợp dữ liệu giao dịch</text>
  <text x="800" y="542" text-anchor="middle" font-size="13">Đối soát mã tham chiếu cổng VNPAY</text>

  <line x1="800" y1="555" x2="800" y2="590" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Action: Xuat bao cao Excel / PDF -->
  <rect x="680" y="590" width="240" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="800" y="618" text-anchor="middle" font-size="14">Kết xuất tệp Báo cáo Excel / PDF</text>

  <!-- Flow back to client download -->
  <line x1="680" y1="612" x2="420" y2="612" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="170" y="590" width="250" height="45" rx="8" ry="8" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="295" y="618" text-anchor="middle" font-size="14">Tải về tệp bảng kê &amp; Lưu trữ kế toán</text>

  <line x1="295" y1="635" x2="295" y2="700" stroke="#000000" stroke-width="1.5"/>
  <line x1="800" y1="470" x2="800" y2="700" stroke="#000000" stroke-width="1.5"/>
  <line x1="800" y1="700" x2="295" y2="700" stroke="#000000" stroke-width="1.5"/>
  <line x1="295" y1="700" x2="295" y2="745" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Final Node -->
  <circle cx="295" cy="760" r="14" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="295" cy="760" r="8" fill="#000000"/>
</svg>`;

// Save all SVGs and render with Playwright
const diagrams = [
  { id: 'ch3_hinh_3_3_act_xac_thuc_dang_nhap', svg: svgAuth },
  { id: 'ch3_hinh_3_4_act_kham_pha_ban_do', svg: svgMap },
  { id: 'ch3_hinh_3_7_act_cms_quan_tri_di_tich', svg: svgCmsContent },
  { id: 'ch3_hinh_3_8_act_cms_doi_soat_doanh_thu', svg: svgCmsOrders }
];

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  for (const d of diagrams) {
    const svgPath = path.join(outDir, `${d.id}.svg`);
    const pngPath = path.join(outDir, `${d.id}.png`);
    fs.writeFileSync(svgPath, d.svg, 'utf-8');
    console.log(`Saved SVG: ${svgPath}`);

    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#ffffff;">${d.svg}</body></html>`);
    const svgEl = await page.$('svg');
    await svgEl.screenshot({ path: pngPath, scale: 'device' });
    console.log(`Rendered PNG: ${pngPath}`);
  }

  // Also copy/symlink existing 5 figures into consistent names
  const mapping = [
    { src: 'hinh_3_2_overall_use_case.png', dst: 'ch3_hinh_3_1_use_case_tong_quan.png' },
    { src: 'hinh_3_9_activity_gps_narration.png', dst: 'ch3_hinh_3_2_act_gps_thuyet_minh.png' },
    { src: 'hinh_3_8_activity_order_payment.png', dst: 'ch3_hinh_3_5_act_thanh_toan_vnpay.png' },
    { src: 'hinh_3_11_activity_cash_claim_code.png', dst: 'ch3_hinh_3_6_act_kich_hoat_claim_code.png' },
    { src: 'hinh_3_17_domain_model.png', dst: 'ch3_hinh_3_9_so_do_domain_model.png' }
  ];

  for (const m of mapping) {
    const srcPath = path.join(outDir, m.src);
    const dstPath = path.join(outDir, m.dst);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, dstPath);
      console.log(`Copied ${m.src} -> ${m.dst}`);
    } else {
      console.warn(`Source not found: ${srcPath}`);
    }
  }

  await browser.close();
  console.log('ALL 9 CHAPTER 3 DIAGRAMS READY!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
