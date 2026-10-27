import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs', 'report', 'diagrams', 'png');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Common SVG styling & defs
const commonDefs = `
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
    <marker id="openArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 8 5 L 0 8" fill="none" stroke="#000000" stroke-width="1.5"/>
    </marker>
    <marker id="genArrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <polygon points="0,1 10,6 0,11" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    </marker>
  </defs>
`;

// Helper for Stick Figure
function stickFigure(x, y, label, sublabel = '') {
  return `
    <g transform="translate(${x}, ${y})">
      <circle cx="20" cy="15" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
      <line x1="20" y1="27" x2="20" y2="58" stroke="#000000" stroke-width="1.8"/>
      <line x1="0" y1="38" x2="40" y2="38" stroke="#000000" stroke-width="1.8"/>
      <line x1="20" y1="58" x2="5" y2="85" stroke="#000000" stroke-width="1.8"/>
      <line x1="20" y1="58" x2="35" y2="85" stroke="#000000" stroke-width="1.8"/>
      <text x="20" y="105" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">${label}</text>
      ${sublabel ? `<text x="20" y="120" text-anchor="middle" font-size="10" fill="#444444">${sublabel}</text>` : ''}
    </g>
  `;
}

// Helper for System / External Actor Box
function systemBox(x, y, w, h, stereotype, title) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
      <text x="${w/2}" y="18" text-anchor="middle" font-size="10" fill="#444444">&lt;&lt;${stereotype}&gt;&gt;</text>
      <text x="${w/2}" y="34" text-anchor="middle" font-size="11" font-weight="bold" fill="#000000">${title}</text>
    </g>
  `;
}

// ---------------------------------------------------------------------------------
// HÌNH 3.2: SƠ ĐỒ PHÁC THẢO KIẾN TRÚC GIẢI PHÁP HỆ THỐNG (SOLUTION ALIGNMENT DIAGRAM)
// ---------------------------------------------------------------------------------
const diagram3_2_solution_alignment_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 860" width="1320" height="860" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="660" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.2. SƠ ĐỒ PHÁC THẢO KIẾN TRÚC GIẢI PHÁP HỆ THỐNG (SOLUTION ALIGNMENT DIAGRAM)</text>
  <text x="660" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Phác thảo Mô hình Giải pháp Tổng thể Kế thừa từ PRD: Web App, Xử lý Thanh toán Kép, Backend Microservices và Quản trị</text>

  <!-- 1. Left Box: Mobile Web App -->
  <rect x="40" y="240" width="300" height="420" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="240" width="300" height="40" fill="#f0f0f0" stroke="#000000" stroke-width="1.5"/>
  <text x="190" y="265" text-anchor="middle" font-size="13" font-weight="bold">Web App cho Thiết bị Di động</text>
  <text x="190" y="300" text-anchor="middle" font-size="11" font-style="italic" fill="#444444">(Mobile Web App / PWA React 18)</text>

  <rect x="60" y="320" width="260" height="320" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="75" y="345" font-size="12" font-weight="bold">Chức năng Chính (Functionalities):</text>
  <text x="75" y="375" font-size="11">• Hiển thị thông tin POI di tích (text &amp; audio)</text>
  <text x="75" y="405" font-size="11">• Tự động phát thuyết minh qua GPS</text>
  <text x="75" y="435" font-size="11">• Bản đồ tương tác &amp; Chỉ đường tham quan</text>
  <text x="75" y="465" font-size="11">• Gợi ý lộ trình (Route recommendation)</text>
  <text x="75" y="495" font-size="11">• Tự động dịch thuật và tổng hợp giọng đọc di sản</text>
  <text x="75" y="525" font-size="11">• Đa ngôn ngữ (15+ ngôn ngữ độc lập)</text>
  <text x="75" y="555" font-size="11">• Tải cache POI 1 lần (Client-side caching)</text>
  <text x="75" y="585" font-size="11">• Giỏ hàng quà lưu niệm &amp; Đặt hàng</text>
  <text x="75" y="615" font-size="11">• Mở khóa quyền nghe (Access Token)</text>

  <!-- 2. Top Middle Box: Payment Processing (Dual Flow) -->
  <rect x="400" y="90" width="520" height="150" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="400" y="90" width="520" height="32" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="660" y="112" text-anchor="middle" font-size="13" font-weight="bold">Xử lý Thanh toán &amp; Cấp quyền (Payment Processing &amp; Authorization)</text>

  <!-- Branch Online -->
  <rect x="420" y="135" width="220" height="85" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="530" y="155" text-anchor="middle" font-size="11" font-weight="bold">1. Trực tuyến (Online Payment)</text>
  <text x="530" y="175" text-anchor="middle" font-size="10">Cổng VNPAY / Payoo / VietQR</text>
  <text x="530" y="195" text-anchor="middle" font-size="9.5" fill="#444444">Webhook IPN &rarr; auth_code &rarr; JWT Token</text>

  <!-- Branch Cash -->
  <rect x="680" y="135" width="220" height="85" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="790" y="155" text-anchor="middle" font-size="11" font-weight="bold">2. Tiền mặt tại quầy (Cash Offline)</text>
  <text x="790" y="175" text-anchor="middle" font-size="10">Thu tiền tại quầy vé di tích</text>
  <text x="790" y="195" text-anchor="middle" font-size="9.5" fill="#444444">Sinh Claim Code (Redis) &rarr; Đổi Token</text>

  <!-- 3. Central Box: Cloud Backend & Microservices -->
  <rect x="400" y="280" width="520" height="230" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="400" y="280" width="520" height="32" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="660" y="302" text-anchor="middle" font-size="13" font-weight="bold">Cloud Backend &amp; Kiến trúc Microservices (Spring Boot / Fast API)</text>

  <rect x="420" y="325" width="220" height="42" fill="#fafafa" stroke="#000000" stroke-width="1"/>
  <text x="530" y="343" text-anchor="middle" font-size="11" font-weight="bold">API Gateway &amp; Security</text>
  <text x="530" y="358" text-anchor="middle" font-size="9.5">Bộ lọc RateLimit, JWT, PathGuard</text>

  <rect x="680" y="325" width="220" height="42" fill="#fafafa" stroke="#000000" stroke-width="1"/>
  <text x="790" y="343" text-anchor="middle" font-size="11" font-weight="bold">Location &amp; Audio Service</text>
  <text x="790" y="358" text-anchor="middle" font-size="9.5">Định vị GPS, Geofence, Stream MP3</text>

  <rect x="420" y="380" width="220" height="42" fill="#fafafa" stroke="#000000" stroke-width="1"/>
  <text x="530" y="398" text-anchor="middle" font-size="11" font-weight="bold">Content &amp; Order Service</text>
  <text x="530" y="413" text-anchor="middle" font-size="9.5">Quản lý POI, Tour, Giỏ hàng &amp; VNPAY</text>

  <rect x="680" y="380" width="220" height="42" fill="#fafafa" stroke="#000000" stroke-width="1"/>
  <text x="790" y="398" text-anchor="middle" font-size="11" font-weight="bold">Translation &amp; TTS Service</text>
  <text x="790" y="413" text-anchor="middle" font-size="9.5">MyMemory Translation &amp; Edge-TTS Worker</text>

  <rect x="420" y="435" width="480" height="55" fill="#f5f5f5" stroke="#000000" stroke-width="1"/>
  <text x="660" y="455" text-anchor="middle" font-size="11" font-weight="bold">Điều phối Hàng đợi &amp; Xử lý Bất đồng bộ (RabbitMQ Broker)</text>
  <text x="660" y="473" text-anchor="middle" font-size="10" fill="#444444">Tách biệt tác vụ nặng: Tự động dịch thuật 15+ ngôn ngữ và tổng hợp âm thanh giọng AI</text>

  <!-- 4. Bottom Box: Database & Persistence -->
  <rect x="400" y="550" width="520" height="160" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="400" y="550" width="520" height="30" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="660" y="570" text-anchor="middle" font-size="13" font-weight="bold">Cơ sở Dữ liệu Đa Mô hình &amp; Bộ nhớ Tạm (Database &amp; Cache)</text>

  <rect x="420" y="590" width="220" height="50" fill="#fcfcfc" stroke="#000000" stroke-width="1"/>
  <text x="530" y="610" text-anchor="middle" font-size="10.5" font-weight="bold">MongoDB / Document DB</text>
  <text x="530" y="628" text-anchor="middle" font-size="9.5">Lưu POI, Tọa độ GPS, Tour, Đa ngữ</text>

  <rect x="680" y="590" width="220" height="50" fill="#fcfcfc" stroke="#000000" stroke-width="1"/>
  <text x="790" y="610" text-anchor="middle" font-size="10.5" font-weight="bold">PostgreSQL / RDBMS</text>
  <text x="790" y="628" text-anchor="middle" font-size="9.5">Người dùng, Đơn hàng, Lịch sử giao dịch</text>

  <rect x="420" y="648" width="220" height="50" fill="#fcfcfc" stroke="#000000" stroke-width="1"/>
  <text x="530" y="668" text-anchor="middle" font-size="10.5" font-weight="bold">Redis In-Memory Cache</text>
  <text x="530" y="686" text-anchor="middle" font-size="9.5">Mã ngắn Claim Code (TTL 15p), Session</text>

  <rect x="680" y="648" width="220" height="50" fill="#fcfcfc" stroke="#000000" stroke-width="1"/>
  <text x="790" y="668" text-anchor="middle" font-size="10.5" font-weight="bold">Audio Storage &amp; Shared Volume</text>
  <text x="790" y="686" text-anchor="middle" font-size="9.5">Tệp MP3, Bản dịch đa ngữ</text>

  <!-- 5. Right Box: Admin Dashboard & Monitoring -->
  <rect x="980" y="240" width="300" height="420" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="980" y="240" width="300" height="40" fill="#f0f0f0" stroke="#000000" stroke-width="1.5"/>
  <text x="1130" y="265" text-anchor="middle" font-size="13" font-weight="bold">Quản trị CMS &amp; Giám sát</text>
  <text x="1130" y="300" text-anchor="middle" font-size="11" font-style="italic" fill="#444444">(Admin Dashboard &amp; Monitoring)</text>

  <rect x="1000" y="320" width="260" height="320" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="1015" y="345" font-size="12" font-weight="bold">Phân hệ Quản trị (Admin):</text>
  <text x="1015" y="375" font-size="11">• Quản lý phiên tham quan (Sessions)</text>
  <text x="1015" y="405" font-size="11">• Xác nhận thu tiền mặt &amp; Sinh Claim Code</text>
  <text x="1015" y="435" font-size="11">• Quản lý POI, Lộ trình, Khu vực di tích</text>
  <text x="1015" y="465" font-size="11">• Biên tập và bảo tồn bản dịch thủ công</text>
  <text x="1015" y="495" font-size="11">• Quản lý mã QR vật lý gắn tại di tích</text>
  <text x="1015" y="525" font-size="11">• Xử lý đơn hàng quà &amp; Doanh thu</text>
  <text x="1015" y="555" font-size="11" font-weight="bold">Giám sát &amp; Nhật ký (Monitoring):</text>
  <text x="1015" y="585" font-size="11">• Quan sát sức khỏe hệ thống thời gian thực</text>
  <text x="1015" y="615" font-size="11">• Nhật ký hoạt động du khách (Real-time logs)</text>

  <!-- Connectors -->
  <!-- App to Payment -->
  <line x1="280" y1="240" x2="430" y2="190" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="320" y="205" font-size="10" font-weight="bold">Yêu cầu thanh toán</text>

  <!-- Payment to Admin (Cash branch) -->
  <line x1="900" y1="180" x2="1050" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="960" y="195" font-size="10" font-weight="bold">Hiển thị Claim Code</text>

  <!-- App to Backend -->
  <line x1="340" y1="400" x2="400" y2="400" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <line x1="400" y1="420" x2="340" y2="420" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="370" y="390" text-anchor="middle" font-size="9.5" font-weight="bold">REST API</text>
  <text x="370" y="440" text-anchor="middle" font-size="9.5" fill="#444444">JSON/MP3</text>

  <!-- Backend to DB -->
  <line x1="660" y1="510" x2="660" y2="550" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="690" y="535" font-size="10" font-weight="bold">Data Ops</text>

  <!-- Admin to Backend/DB -->
  <line x1="980" y1="400" x2="920" y2="400" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="950" y="390" text-anchor="middle" font-size="9.5" font-weight="bold">Data Mgmt</text>

  <!-- Future considerations banner -->
  <rect x="40" y="740" width="1240" height="90" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="60" y="765" font-size="12" font-weight="bold">Định hướng Tối ưu hóa và Mở rộng Kỹ thuật (Future Technical Considerations từ PRD):</text>
  <text x="60" y="790" font-size="11">1. Bộ nhớ đệm Claim Code và phiên đăng nhập: Lưu mã nhận quyền ngắn hạn (TTL 15 phút) trong Redis để đổi quyền truy cập nhanh và chống dùng lại.</text>
  <text x="60" y="812" font-size="11">2. Giám sát thời gian thực (Real-time User Activity Tracking): Tích hợp nhật ký phân tích sự kiện du lịch (SCAN, PLAY) để theo dõi mật độ du khách và hỗ trợ điều phối thực địa.</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// HÌNH 3.8: SƠ ĐỒ PHÁC THẢO LUỒNG VẬN HÀNH HỆ THỐNG (OPERATIONAL FLOW DIAGRAM)
// ---------------------------------------------------------------------------------
const diagram3_8_operational_flow_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1320 880" width="1320" height="880" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="660" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.8. SƠ ĐỒ PHÁC THẢO LUỒNG VẬN HÀNH HỆ THỐNG (OPERATIONAL FLOW DIAGRAM)</text>
  <text x="660" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Phân định Luồng Quản trị Dữ liệu &amp; Thanh toán (Tầng trên) và Luồng Tương tác Thực địa Chính (Tầng dưới - Main Flow)</text>

  <!-- ================= TOP CONTAINER: APPLICATION DATA MANAGEMENT & PAYMENT ================= -->
  <rect x="40" y="80" width="1240" height="250" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="40" y="80" width="1240" height="30" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="660" y="100" text-anchor="middle" font-size="13" font-weight="bold">VÙNG 1: QUẢN TRỊ DỮ LIỆU ỨNG DỤNG &amp; XỬ LÝ THANH TOÁN (DATA MANAGEMENT &amp; PAYMENT PROCESSING)</text>

  <!-- Payment Block Left -->
  <rect x="70" y="130" width="540" height="175" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="85" y="150" font-size="12" font-weight="bold">[Xử lý Thanh toán - Payment Processing]</text>

  <rect x="90" y="170" width="130" height="50" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="155" y="192" text-anchor="middle" font-size="11" font-weight="bold">Du khách / QR</text>
  <text x="155" y="208" text-anchor="middle" font-size="9.5" fill="#444444">Quét mã tại di tích</text>

  <line x1="220" y1="195" x2="270" y2="195" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="270" y="165" width="140" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="340" y="187" text-anchor="middle" font-size="10.5" font-weight="bold">Dịch vụ Cấp quyền</text>
  <text x="340" y="202" text-anchor="middle" font-size="9">(Authorization)</text>
  <text x="340" y="215" text-anchor="middle" font-size="9" fill="#444444">Kiểm tra phiên / Token</text>

  <!-- Branches Online & Offline -->
  <line x1="410" y1="180" x2="470" y2="160" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="440" y="162" font-size="9.5" font-weight="bold">Online</text>
  <rect x="470" y="140" width="125" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="532" y="165" text-anchor="middle" font-size="10" font-weight="bold">Payoo / VNPAY</text>

  <line x1="410" y1="210" x2="470" y2="230" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="435" y="235" font-size="9.5" font-weight="bold">Offline</text>
  <rect x="470" y="215" width="125" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="532" y="240" text-anchor="middle" font-size="10" font-weight="bold">Tiền mặt tại quầy</text>

  <line x1="595" y1="235" x2="680" y2="210" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#arrow)"/>
  <text x="635" y="235" font-size="9" fill="#444444">Sinh mã Claim</text>

  <!-- Admin & Data Pipeline Block Right -->
  <rect x="660" y="130" width="590" height="175" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="675" y="150" font-size="12" font-weight="bold">[Quản trị Dữ liệu &amp; Pipeline Tự động - Data Management &amp; Pipeline]</text>

  <rect x="680" y="170" width="140" height="55" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="750" y="193" text-anchor="middle" font-size="11" font-weight="bold">Admin Dashboard</text>
  <text x="750" y="210" text-anchor="middle" font-size="9.5" fill="#444444">Tạo POI, Quản lý phiên</text>

  <line x1="820" y1="195" x2="890" y2="195" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="855" y="185" text-anchor="middle" font-size="9.5">Sự kiện mới</text>

  <rect x="890" y="165" width="150" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="965" y="187" text-anchor="middle" font-size="11" font-weight="bold">Data Pipeline</text>
  <text x="965" y="203" text-anchor="middle" font-size="9.5">Dịch máy 15+ ngôn ngữ</text>
  <text x="965" y="218" text-anchor="middle" font-size="9" fill="#444444">&amp; Tổng hợp giọng đọc TTS</text>

  <line x1="1040" y1="195" x2="1110" y2="195" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="1075" y="185" text-anchor="middle" font-size="9.5">Lưu trữ</text>

  <rect x="1110" y="165" width="120" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="1170" y="192" text-anchor="middle" font-size="11" font-weight="bold">Database</text>
  <text x="1170" y="210" text-anchor="middle" font-size="9.5" fill="#444444">POI, Audio, Tour</text>

  <!-- Downward arrow to Main Flow -->
  <line x1="340" y1="225" x2="340" y2="350" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="350" y="340" font-size="10" font-weight="bold">Cấp quyền Access Token</text>

  <!-- ================= BOTTOM CONTAINER: MAIN FLOW ================= -->
  <rect x="40" y="350" width="1240" height="500" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="40" y="350" width="1240" height="30" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="660" y="370" text-anchor="middle" font-size="13" font-weight="bold">VÙNG 2: LUỒNG TƯƠNG TÁC THỰC ĐỊA CHÍNH (MAIN FLOW: CLIENT &harr; BACKEND &harr; AI &harr; DATABASE)</text>

  <!-- Column 1: Client -->
  <rect x="70" y="410" width="220" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <text x="180" y="435" text-anchor="middle" font-size="13" font-weight="bold">1. Phía Khách (Client)</text>
  <text x="180" y="455" text-anchor="middle" font-size="10.5" fill="#444444">Du khách cầm điện thoại di động</text>

  <rect x="90" y="480" width="180" height="80" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="180" y="505" text-anchor="middle" font-size="11" font-weight="bold">Yêu cầu POI / Bản đồ</text>
  <text x="180" y="525" text-anchor="middle" font-size="9.5">Tải toàn bộ POI 1 lần duy nhất</text>
  <text x="180" y="542" text-anchor="middle" font-size="9" fill="#444444">(Client NEVER refetches)</text>

  <rect x="90" y="620" width="180" height="120" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="180" y="645" text-anchor="middle" font-size="11" font-weight="bold">Yêu cầu thuyết minh đa ngữ</text>
  <text x="180" y="665" text-anchor="middle" font-size="9.5">Chọn ngôn ngữ en, ja, ko</text>
  <text x="180" y="695" text-anchor="middle" font-size="10" font-weight="bold" fill="#000000">&larr; Nhận bản dịch &amp; audio</text>
  <text x="180" y="715" text-anchor="middle" font-size="9" fill="#444444">Phục vụ tức thì</text>

  <!-- Column 2: Backend -->
  <rect x="370" y="410" width="250" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <text x="495" y="435" text-anchor="middle" font-size="13" font-weight="bold">2. Máy chủ Dịch vụ (Backend)</text>
  <text x="495" y="455" text-anchor="middle" font-size="10.5" fill="#444444">Spring Boot Microservices</text>

  <rect x="390" y="480" width="210" height="80" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="495" y="505" text-anchor="middle" font-size="11" font-weight="bold">Navigation Services</text>
  <text x="495" y="525" text-anchor="middle" font-size="9.5">Định vị GPS, Bán kính Geofence,</text>
  <text x="495" y="542" text-anchor="middle" font-size="9.5">Tuyến đường &amp; Lộ trình tham quan</text>

  <rect x="390" y="620" width="210" height="120" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="495" y="645" text-anchor="middle" font-size="11" font-weight="bold">Translation &amp; TTS Service</text>
  <text x="495" y="665" text-anchor="middle" font-size="9.5">Dịch thuật qua MyMemory</text>
  <text x="495" y="685" text-anchor="middle" font-size="9.5">Tổng hợp giọng Edge-TTS</text>
  <text x="495" y="715" text-anchor="middle" font-size="9" fill="#444444">Lưu MP3 &amp; phát HTTP 206</text>

  <!-- Column 3: Translation / TTS Services -->
  <rect x="700" y="410" width="260" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <text x="830" y="435" text-anchor="middle" font-size="13" font-weight="bold">3. Dịch vụ Ngoại vi (Translation/TTS)</text>
  <text x="830" y="455" text-anchor="middle" font-size="10.5" fill="#444444">MyMemory API &amp; Edge-TTS Engine</text>

  <rect x="720" y="620" width="220" height="55" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="830" y="645" text-anchor="middle" font-size="11" font-weight="bold">MyMemory API</text>
  <text x="830" y="662" text-anchor="middle" font-size="9.5">Dịch văn bản vi -&gt; en, ja, ko</text>

  <rect x="720" y="690" width="220" height="55" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="830" y="715" text-anchor="middle" font-size="11" font-weight="bold">Edge-TTS Engine</text>
  <text x="830" y="732" text-anchor="middle" font-size="9.5">Tổng hợp giọng đọc MP3</text>

  <!-- Column 4: Database -->
  <rect x="1030" y="410" width="220" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <text x="1140" y="435" text-anchor="middle" font-size="13" font-weight="bold">4. Lưu trữ &amp; Phân phối</text>
  <text x="1140" y="455" text-anchor="middle" font-size="10.5" fill="#444444">Lưu trữ Dữ liệu &amp; Tệp Âm thanh</text>

  <rect x="1050" y="480" width="180" height="80" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="1140" y="508" text-anchor="middle" font-size="11" font-weight="bold">Dữ liệu POI / Tour</text>
  <text x="1140" y="528" text-anchor="middle" font-size="9.5">Tọa độ, Bán kính, Đa ngữ,</text>
  <text x="1140" y="545" text-anchor="middle" font-size="9" fill="#444444">Audio URL, Hình ảnh</text>

  <rect x="1050" y="620" width="180" height="120" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="1140" y="650" text-anchor="middle" font-size="11" font-weight="bold">Audio Storage</text>
  <text x="1140" y="675" text-anchor="middle" font-size="9.5">Lưu tệp MP3 trên volume chia sẻ</text>
  <text x="1140" y="700" text-anchor="middle" font-size="9.5">Phân phối qua HTTP 206</text>
  <text x="1140" y="720" text-anchor="middle" font-size="9" fill="#444444">&rarr; Trả luồng âm thanh (Audio Stream)</text>

  <!-- Flow Arrows -->
  <!-- 1. POI Fetch Flow -->
  <line x1="270" y1="510" x2="390" y2="510" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="330" y="502" text-anchor="middle" font-size="10" font-weight="bold">1. Request</text>

  <line x1="390" y1="535" x2="270" y2="535" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="330" y="550" text-anchor="middle" font-size="10">2. Data (POI)</text>

  <line x1="600" y1="520" x2="1050" y2="520" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="825" y="512" text-anchor="middle" font-size="10" font-weight="bold">Fetch POI / Tour Data</text>

  <!-- 2. Translation/TTS Flow -->
  <line x1="270" y1="650" x2="390" y2="650" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="330" y="642" text-anchor="middle" font-size="10" font-weight="bold">3. Language Request</text>

  <line x1="390" y1="710" x2="270" y2="710" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="330" y="725" text-anchor="middle" font-size="10">6. Translated Audio</text>

  <line x1="600" y1="650" x2="720" y2="650" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="660" y="642" text-anchor="middle" font-size="10">POI Text</text>

  <line x1="720" y1="670" x2="600" y2="670" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="660" y="685" text-anchor="middle" font-size="9.5">Translated Text</text>

  <line x1="940" y1="715" x2="1050" y2="675" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="995" y="685" text-anchor="middle" font-size="9.5">Audio Storage</text>

  <line x1="1050" y1="705" x2="830" y2="745" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="960" y="740" text-anchor="middle" font-size="9.5">MP3 File</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// HÌNH 3.12: SƠ ĐỒ TUẦN TỰ XỬ LÝ THANH TOÁN KÉP VÀ CLAIM CODE REDIS (PAYMENT FLOW)
// ---------------------------------------------------------------------------------
const diagram3_12_sequence_dual_payment_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1340 1020" width="1340" height="1020" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="670" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.12. SƠ ĐỒ TUẦN TỰ: XỬ LÝ THANH TOÁN KÉP VÀ MÃ NHẬN QUYỀN QUA REDIS</text>
  <text x="670" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Thanh toán Trực tuyến (VNPAY / Payoo) và Thanh toán Tiền mặt tại Quầy (Shorted Claim Code lưu Redis TTL 15 phút)</text>

  <!-- Lifeline Headers -->
  <rect x="40" y="80" width="120" height="40" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="100" y="105" text-anchor="middle" font-size="12" font-weight="bold">User (Du khách)</text>

  <rect x="230" y="80" width="130" height="40" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="295" y="105" text-anchor="middle" font-size="12" font-weight="bold">Frontend (Web App)</text>

  <rect x="440" y="80" width="140" height="40" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="510" y="105" text-anchor="middle" font-size="12" font-weight="bold">Backend (Echora API)</text>

  <rect x="670" y="80" width="150" height="40" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="745" y="105" text-anchor="middle" font-size="12" font-weight="bold">PaymentService (VNPAY)</text>

  <rect x="910" y="80" width="140" height="40" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="980" y="105" text-anchor="middle" font-size="12" font-weight="bold">Admin / Staff (Quầy vé)</text>

  <rect x="1140" y="80" width="120" height="40" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="1200" y="105" text-anchor="middle" font-size="12" font-weight="bold">Redis Cache</text>

  <!-- Lifeline Lines -->
  <line x1="100" y1="120" x2="100" y2="980" stroke="#888888" stroke-dasharray="4 4"/>
  <line x1="295" y1="120" x2="295" y2="980" stroke="#888888" stroke-dasharray="4 4"/>
  <line x1="510" y1="120" x2="510" y2="980" stroke="#888888" stroke-dasharray="4 4"/>
  <line x1="745" y1="120" x2="745" y2="980" stroke="#888888" stroke-dasharray="4 4"/>
  <line x1="980" y1="120" x2="980" y2="980" stroke="#888888" stroke-dasharray="4 4"/>
  <line x1="1200" y1="120" x2="1200" y2="980" stroke="#888888" stroke-dasharray="4 4"/>

  <!-- ================= SECTION 1: ONLINE PAYMENT FLOW ================= -->
  <rect x="30" y="130" width="1260" height="300" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <rect x="30" y="130" width="300" height="25" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="40" y="147" font-size="11.5" font-weight="bold">=== Online Payment Flow (Thanh toán Trực tuyến) ===</text>

  <!-- 1. User visits web app -->
  <line x1="100" y1="170" x2="295" y2="170" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="165" text-anchor="middle" font-size="10">1. Truy cập Web App, chọn gói tham quan</text>

  <rect x="290" y="170" width="10" height="240" fill="#ffffff" stroke="#000000"/>
  <text x="280" y="195" text-anchor="end" font-size="9.5" fill="#444444">Hiển thị "Pay to Access Features"</text>

  <!-- 2. Click Pay Now Online -->
  <line x1="100" y1="210" x2="295" y2="210" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="205" text-anchor="middle" font-size="10">2. Nhấn "Thanh toán Online (VNPAY)"</text>

  <!-- 3. Request payment link -->
  <line x1="295" y1="230" x2="510" y2="230" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="402" y="225" text-anchor="middle" font-size="10">3. POST /api/payment/create-url</text>

  <rect x="505" y="230" width="10" height="180" fill="#ffffff" stroke="#000000"/>
  <text x="525" y="245" font-size="9.5" fill="#444444">Sinh auth_code &amp; URL thanh toán</text>

  <!-- 4. Create payment URL -->
  <line x1="510" y1="260" x2="745" y2="260" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="627" y="255" text-anchor="middle" font-size="10">4. Gửi yêu cầu khởi tạo giao dịch (kèm auth_code)</text>

  <line x1="745" y1="285" x2="510" y2="285" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="627" y="280" text-anchor="middle" font-size="9.5">5. Trả về payment_url có chữ ký HMAC-SHA512</text>

  <line x1="510" y1="305" x2="295" y2="305" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="402" y="300" text-anchor="middle" font-size="10">6. Chuyển hướng người dùng sang VNPAY</text>

  <line x1="295" y1="325" x2="100" y2="325" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="320" text-anchor="middle" font-size="10">7. Hoàn tất thanh toán trên Cổng VNPAY</text>

  <!-- Webhook IPN -->
  <line x1="745" y1="350" x2="510" y2="350" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="627" y="345" text-anchor="middle" font-size="10" font-weight="bold">8. Webhook IPN: Báo thanh toán thành công (auth_code)</text>

  <!-- Loop / Poll check payment -->
  <rect x="250" y="365" width="280" height="55" fill="#f5f5f5" stroke="#666666" stroke-dasharray="2 2"/>
  <text x="255" y="380" font-size="9" font-weight="bold">[loop / polling: Đổi auth_code lấy Token]</text>
  <line x1="295" y1="395" x2="510" y2="395" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="402" y="390" text-anchor="middle" font-size="9.5">9. POST /api/payment/exchange-token (auth_code)</text>
  <line x1="510" y1="412" x2="295" y2="412" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="402" y="423" text-anchor="middle" font-size="9.5" font-weight="bold">10. Trả về access_token &rarr; Lưu localStorage</text>

  <!-- ================= SECTION 2: CASH PAYMENT FLOW ================= -->
  <rect x="30" y="445" width="1260" height="340" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <rect x="30" y="445" width="370" height="25" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="40" y="462" font-size="11.5" font-weight="bold">=== Cash Payment Flow (Thanh toán Tiền mặt tại Quầy vé) ===</text>

  <!-- 11. User clicks Pay with Cash -->
  <line x1="100" y1="485" x2="295" y2="485" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="480" text-anchor="middle" font-size="10">11. Nhấn "Thanh toán Tiền mặt tại Quầy"</text>

  <rect x="290" y="485" width="10" height="280" fill="#ffffff" stroke="#000000"/>
  <text x="280" y="505" text-anchor="end" font-size="9.5" fill="#444444">Hiển thị "Vui lòng trả tiền mặt" kèm session_id</text>

  <!-- 12. User pays cash -->
  <line x1="100" y1="525" x2="980" y2="525" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="540" y="520" text-anchor="middle" font-size="10" font-weight="bold">12. Du khách đưa tiền mặt tại quầy vé di tích</text>

  <rect x="975" y="525" width="10" height="150" fill="#ffffff" stroke="#000000"/>

  <!-- 13. Admin confirms -->
  <line x1="980" y1="550" x2="510" y2="550" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="745" y="545" text-anchor="middle" font-size="10">13. Xác nhận thu tiền mặt trên Admin Dashboard (session_id)</text>

  <rect x="505" y="550" width="10" height="170" fill="#ffffff" stroke="#000000"/>
  <text x="525" y="565" font-size="9" fill="#444444">Sinh auth_code &amp; Rút ngắn thành shorted_code (6 ký tự)</text>

  <!-- 14. Store to Redis -->
  <line x1="510" y1="585" x2="1200" y2="585" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="855" y="580" text-anchor="middle" font-size="10" font-weight="bold">14. SET shorted_code auth_code EX 900 (Lưu Redis TTL 15 phút)</text>

  <!-- 15. Show shorted code to admin -->
  <line x1="510" y1="615" x2="980" y2="615" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="745" y="610" text-anchor="middle" font-size="10">15. Hiển thị mã ngắn (Claim Code) trên màn hình Admin</text>

  <!-- 16. Admin gives code to user -->
  <line x1="980" y1="645" x2="100" y2="645" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="540" y="640" text-anchor="middle" font-size="10">16. Giao mã nhận quyền (Claim Code, VD: "ECH892") cho du khách</text>

  <!-- 17. User enters code -->
  <line x1="100" y1="675" x2="295" y2="675" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="670" text-anchor="middle" font-size="10">17. Nhập mã nhận quyền trên điện thoại</text>

  <!-- 18. Exchange code -->
  <line x1="295" y1="700" x2="510" y2="700" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="402" y="695" text-anchor="middle" font-size="10">18. POST /api/auth/claim-code (shorted_code)</text>

  <!-- 19. Verify with Redis -->
  <line x1="510" y1="720" x2="1200" y2="720" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="855" y="715" text-anchor="middle" font-size="10">19. GET shorted_code &amp; DEL shorted_code (Xác thực và hủy mã một lần)</text>

  <line x1="510" y1="745" x2="295" y2="745" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="402" y="740" text-anchor="middle" font-size="10" font-weight="bold">20. Trả về access_token &rarr; Lưu localStorage</text>

  <!-- ================= SECTION 3: SHARED FLOW ================= -->
  <rect x="30" y="800" width="1260" height="160" fill="#fafafa" stroke="#000000" stroke-width="1.5"/>
  <rect x="30" y="800" width="370" height="25" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="40" y="817" font-size="11.5" font-weight="bold">=== Use Features (Khai thác Tính năng sau khi có Token) ===</text>

  <line x1="100" y1="845" x2="295" y2="845" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="840" text-anchor="middle" font-size="10">21. Chạm POI / Nghe thuyết minh</text>

  <line x1="295" y1="875" x2="510" y2="875" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="402" y="870" text-anchor="middle" font-size="10">22. Gửi Request kèm Header [Authorization: Bearer access_token]</text>

  <rect x="505" y="875" width="10" height="50" fill="#ffffff" stroke="#000000"/>
  <text x="525" y="895" font-size="9" fill="#444444">Kiểm tra chữ ký JWT &amp; Phân quyền</text>

  <line x1="510" y1="915" x2="295" y2="915" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="402" y="910" text-anchor="middle" font-size="10" font-weight="bold">23. Cho phép truy cập dữ liệu POI và Stream MP3</text>

  <line x1="295" y1="940" x2="100" y2="940" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="197" y="935" text-anchor="middle" font-size="10">24. Trải nghiệm thuyết minh đa ngữ sống động</text>
</svg>
`;

async function main() {
  console.log('Rendering 3 New PRD Diagrams via Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 1200 });

  const newDiagrams = [
    { id: 'hinh_3_2_solution_alignment_sketch', svg: diagram3_2_solution_alignment_svg, title: 'Hình 3.2: Solution Alignment Diagram' },
    { id: 'hinh_3_8_operational_flow', svg: diagram3_8_operational_flow_svg, title: 'Hình 3.8: Operational Flow Diagram' },
    { id: 'hinh_3_12_sequence_dual_payment_redis_claim', svg: diagram3_12_sequence_dual_payment_svg, title: 'Hình 3.12: Dual Payment Sequence Diagram' },
  ];

  for (const diag of newDiagrams) {
    console.log(`Rendering ${diag.title}...`);
    const svgPath = path.join(outDir, `${diag.id}.svg`);
    fs.writeFileSync(svgPath, diag.svg, 'utf8');

    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#ffffff;display:flex;justify-content:center;">${diag.svg}</body></html>`);
    const el = await page.$('svg');
    const buf = await el.screenshot();
    const pngPath = path.join(outDir, `${diag.id}.png`);
    fs.writeFileSync(pngPath, buf);
    console.log(`Saved: ${pngPath}`);
  }

  await browser.close();
  console.log('Successfully generated and rendered all 3 New PRD Diagrams!');
}

main().catch(err => {
  console.error('Error rendering diagrams:', err);
  process.exit(1);
});
