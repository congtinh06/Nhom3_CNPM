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

// Helper for Use Case Ellipse
function useCaseEllipse(cx, cy, rx, ry, id, text, extra = '') {
  return `
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
      <text x="${cx}" y="${extra ? cy - 3 : cy + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#000000">${id}: ${text}</text>
      ${extra ? `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9.5" fill="#444444">${extra}</text>` : ''}
    </g>
  `;
}

// ---------------------------------------------------------------------------------
// 1. HÌNH 3.1: SƠ ĐỒ NGỮ CẢNH HỆ THỐNG (SYSTEM CONTEXT DIAGRAM)
// ---------------------------------------------------------------------------------
const diagram3_1_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1300 860" width="1300" height="860" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="650" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.1. SƠ ĐỒ NGỮ CẢNH HỆ THỐNG ECHORA (SYSTEM CONTEXT DIAGRAM)</text>
  <text x="650" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Ranh giới Hệ thống và Các Tác nhân Tương tác Bên ngoài qua Giao thức Mạng</text>

  <!-- Central System Boundary -->
  <rect x="360" y="100" width="580" height="680" fill="#ffffff" stroke="#000000" stroke-width="2.5"/>
  <rect x="360" y="100" width="580" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.5"/>
  <text x="650" y="123" text-anchor="middle" font-size="14" font-weight="bold">RANH GIỚI HỆ THỐNG: NỀN TẢNG DU LỊCH SỐ ECHORA</text>

  <!-- Internal Components Container -->
  <rect x="390" y="160" width="520" height="100" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="650" y="185" text-anchor="middle" font-size="13" font-weight="bold">1. Tầng Trình diễn &amp; Cổng kết nối (Frontend &amp; API Gateway)</text>
  <text x="650" y="205" text-anchor="middle" font-size="11">Frontend SPA React 18 / TypeScript / Vite | API Gateway Spring Cloud Gateway (:8080)</text>
  <text x="650" y="222" text-anchor="middle" font-size="10.5" fill="#444444">Chuỗi bộ lọc an ninh: PathGuardFilter, HeaderStrip, RateLimit, JWT Authentication</text>

  <rect x="390" y="280" width="520" height="230" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="650" y="305" text-anchor="middle" font-size="13" font-weight="bold">2. Tầng Dịch vụ Nghiệp vụ (6 Microservices Phân tán)</text>
  
  <rect x="410" y="325" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="525" y="345" text-anchor="middle" font-size="11" font-weight="bold">auth-service (:8081)</text>
  <text x="525" y="360" text-anchor="middle" font-size="9.5">Xác thực JWT, Token Rotation, QR Login</text>

  <rect x="660" y="325" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="775" y="345" text-anchor="middle" font-size="11" font-weight="bold">content-service (:8082)</text>
  <text x="775" y="360" text-anchor="middle" font-size="9.5">CMS POI, Zone, Route, Quà lưu niệm, Tin tức</text>

  <rect x="410" y="380" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="525" y="400" text-anchor="middle" font-size="11" font-weight="bold">location-service (:8083)</text>
  <text x="525" y="415" text-anchor="middle" font-size="9.5">Giải mã QR di sản, Tìm điểm lân cận</text>

  <rect x="660" y="380" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="775" y="400" text-anchor="middle" font-size="11" font-weight="bold">order-service (:8084)</text>
  <text x="775" y="415" text-anchor="middle" font-size="9.5">Giỏ hàng, Đơn hàng, VNPAY, VietQR</text>

  <rect x="410" y="435" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="525" y="455" text-anchor="middle" font-size="11" font-weight="bold">translation-tts-service (:8085)</text>
  <text x="525" y="470" text-anchor="middle" font-size="9.5">Dịch đa ngữ, Tổng hợp Edge-TTS, MP3 Stream</text>

  <rect x="660" y="435" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1"/>
  <text x="775" y="455" text-anchor="middle" font-size="11" font-weight="bold">analytics-service (:8086)</text>
  <text x="775" y="470" text-anchor="middle" font-size="9.5">Thu thập sự kiện SCAN / PLAY, Báo cáo</text>

  <rect x="390" y="530" width="520" height="110" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="650" y="555" text-anchor="middle" font-size="13" font-weight="bold">3. Tầng Hạ tầng Dữ liệu &amp; Điều phối Bất đồng bộ</text>
  <text x="650" y="575" text-anchor="middle" font-size="11">RabbitMQ 3.13 (AMQP Topic Exchange echora.topic, Direct Exchange echora.analytics)</text>
  <text x="650" y="593" text-anchor="middle" font-size="11">5 Cơ sở dữ liệu vật lý MS SQL Server 2022 phân lập hoàn toàn</text>
  <text x="650" y="610" text-anchor="middle" font-size="10.5" fill="#444444">Lưu trữ Volume: /app/storage/audio (file MP3) và /app/uploads/products (ảnh quà lưu niệm)</text>

  <rect x="390" y="660" width="520" height="80" fill="#f5f5f5" stroke="#000000" stroke-width="1"/>
  <text x="650" y="685" text-anchor="middle" font-size="12" font-weight="bold">Ranh giới Triển khai Nội bộ (Docker Compose Network)</text>
  <text x="650" y="705" text-anchor="middle" font-size="10.5">Các dịch vụ giao tiếp qua mạng nội bộ Docker echora-network (DNS service discovery)</text>
  <text x="650" y="722" text-anchor="middle" font-size="10.5" fill="#444444">Chỉ có Gateway (:8080) và Frontend (:80/:5173) mở cổng công khai ra Internet</text>

  <!-- Left: Human Actors -->
  ${stickFigure(70, 150, 'Khách vãng lai', '(Guest / Visitor)')}
  ${stickFigure(70, 360, 'Người dùng đăng ký', '(Registered User)')}
  ${stickFigure(70, 580, 'Quản trị viên', '(Administrator)')}

  <!-- Generalization Guest -> Registered User -->
  <line x1="90" y1="350" x2="90" y2="280" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  <!-- Left Connections -->
  <line x1="150" y1="180" x2="360" y2="180" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="250" y="172" text-anchor="middle" font-size="10" font-weight="bold">HTTPS / Web</text>
  <text x="250" y="195" text-anchor="middle" font-size="9" fill="#444444">(Bản đồ, QR, Audio vi)</text>

  <line x1="150" y1="410" x2="360" y2="210" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="240" y="300" text-anchor="middle" font-size="10" font-weight="bold">HTTPS / Auth JWT</text>
  <text x="240" y="315" text-anchor="middle" font-size="9" fill="#444444">(Giỏ hàng, Đơn, Premium)</text>

  <line x1="150" y1="620" x2="360" y2="230" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="235" y="470" text-anchor="middle" font-size="10" font-weight="bold">HTTPS / Admin JWT</text>
  <text x="235" y="485" text-anchor="middle" font-size="9" fill="#444444">(CMS, POI, Quyền, Báo cáo)</text>

  <!-- Right: External Systems -->
  ${systemBox(1030, 110, 220, 55, 'External Hardware', 'Vệ tinh GPS (Geolocation API)')}
  <line x1="1030" y1="137" x2="940" y2="180" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="150" text-anchor="middle" font-size="9">Tọa độ GPS (WGS84)</text>

  ${systemBox(1030, 200, 220, 55, 'External Map Tile', 'OpenStreetMap (OSM Tile Server)')}
  <line x1="1030" y1="227" x2="940" y2="200" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="210" text-anchor="middle" font-size="9">PNG Map Tiles</text>

  ${systemBox(1030, 290, 220, 55, 'External Identity Provider', 'Google Identity (OAuth2)')}
  <line x1="940" y1="350" x2="1030" y2="317" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="330" text-anchor="middle" font-size="9">Verify ID Token</text>

  ${systemBox(1030, 380, 220, 55, 'External Payment Gateway', 'Cổng VNPAY Sandbox')}
  <line x1="940" y1="400" x2="1030" y2="407" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="395" text-anchor="middle" font-size="9">URL redirect / IPN</text>

  ${systemBox(1030, 470, 220, 55, 'External Banking Network', 'Hệ thống NAPAS VietQR')}
  <line x1="940" y1="420" x2="1030" y2="497" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="465" text-anchor="middle" font-size="9">Chuẩn mã VietQR</text>

  ${systemBox(1030, 560, 220, 55, 'External Translation API', 'MyMemory Translation API')}
  <line x1="940" y1="460" x2="1030" y2="587" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="525" text-anchor="middle" font-size="9">Dịch vi -&gt; en,ja,ko</text>

  ${systemBox(1030, 650, 220, 55, 'External AI TTS Engine', 'Microsoft Edge-TTS (Python CLI)')}
  <line x1="940" y1="475" x2="1030" y2="677" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="985" y="590" text-anchor="middle" font-size="9">Sinh MP3 giọng AI</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 2. HÌNH 3.2: SƠ ĐỒ USE CASE TỔNG THỂ HỆ THỐNG (OVERALL USE CASE DIAGRAM)
// ---------------------------------------------------------------------------------
const diagram3_2_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 1020" width="1440" height="1020" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="720" y="32" text-anchor="middle" font-size="18" font-weight="bold">HÌNH 3.2. SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ HỆ THỐNG ECHORA (UML 2.5)</text>
  <text x="720" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Phân bổ 43 Ca sử dụng vào 4 Phân hệ Nghiệp vụ và Tác nhân Tương tác</text>

  <!-- System Boundary -->
  <rect x="230" y="70" width="970" height="925" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="230" y="70" width="450" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="240" y="88" font-size="13" font-weight="bold">System Boundary: Nền tảng Du lịch Số Echora</text>

  <!-- Left: Human Actors -->
  ${stickFigure(60, 150, 'Khách vãng lai', '(Guest)')}
  ${stickFigure(60, 420, 'Người dùng đăng ký', '(Registered User)')}
  ${stickFigure(60, 750, 'Quản trị viên', '(Administrator)')}

  <!-- Generalization: Registered User -> Guest -->
  <line x1="80" y1="410" x2="80" y2="280" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  <!-- Right: External Actors -->
  ${systemBox(1230, 130, 180, 45, 'External Sensor', 'Thiết bị GPS')}
  ${systemBox(1230, 260, 180, 45, 'Payment Gateway', 'VNPAY / VietQR')}
  ${systemBox(1230, 680, 180, 45, 'External AI Service', 'MyMemory / Edge-TTS')}
  ${systemBox(1230, 850, 180, 45, 'Message Broker', 'RabbitMQ Broker')}

  <!-- ================= SUB-SYSTEM 1: DU KHÁCH (TOP) ================= -->
  <rect x="250" y="105" width="930" height="235" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="260" y="123" font-size="11" font-weight="bold" fill="#333333">[Phân hệ 1: Du khách &amp; Trải nghiệm Di sản]</text>

  ${useCaseEllipse(400, 160, 110, 22, 'UC-01', 'Khám phá bản đồ di tích')}
  ${useCaseEllipse(670, 160, 115, 22, 'UC-02', 'Nghe thuyết minh đa ngữ')}
  ${useCaseEllipse(950, 160, 125, 22, 'UC-03', 'Nhận thuyết minh GPS tự động')}
  ${useCaseEllipse(670, 230, 105, 22, 'UC-04', 'Quét mã QR di sản')}
  ${useCaseEllipse(400, 230, 110, 22, 'UC-05', 'Chế độ giả lập tọa độ')}
  ${useCaseEllipse(400, 300, 120, 22, 'UC-06/07', 'Duyệt & Xem quà lưu niệm')}
  ${useCaseEllipse(670, 300, 115, 22, 'UC-08/09', 'Xem tin tức & Bài viết di sản')}

  <!-- ================= SUB-SYSTEM 2: NGƯỜI DÙNG & GIAO DỊCH (MIDDLE) ================= -->
  <rect x="250" y="355" width="930" height="240" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="260" y="373" font-size="11" font-weight="bold" fill="#333333">[Phân hệ 2: Người dùng, Giỏ hàng &amp; Thanh toán]</text>

  ${useCaseEllipse(420, 410, 120, 22, 'UC-10..14', 'Đăng ký / Đăng nhập / Google')}
  ${useCaseEllipse(700, 410, 115, 22, 'UC-15', 'Đăng nhập quét mã QR')}
  ${useCaseEllipse(420, 480, 120, 22, 'UC-18', 'Quản lý giỏ hàng quà')}
  ${useCaseEllipse(700, 480, 115, 22, 'UC-19', 'Đặt hàng quà lưu niệm')}
  ${useCaseEllipse(420, 550, 120, 22, 'UC-20', 'Mua gói ngoại ngữ Premium')}
  ${useCaseEllipse(700, 550, 125, 22, 'UC-21/22', 'Thanh toán VNPAY / VietQR')}
  ${useCaseEllipse(980, 480, 120, 22, 'UC-23/24', 'Hủy đơn & Lịch sử đơn hàng')}

  <!-- ================= SUB-SYSTEM 3: QUẢN TRỊ & NỀN (BOTTOM) ================= -->
  <rect x="250" y="610" width="930" height="370" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="260" y="628" font-size="11" font-weight="bold" fill="#333333">[Phân hệ 3 &amp; 4: Quản trị CMS &amp; Tự động hóa Dịch vụ Nền AI]</text>

  ${useCaseEllipse(420, 660, 120, 22, 'UC-25/26', 'Đăng nhập & Tổng quan CMS')}
  ${useCaseEllipse(420, 725, 120, 22, 'UC-27..29', 'Quản lý điểm di tích (POI)')}
  ${useCaseEllipse(700, 660, 120, 22, 'UC-30/32', 'Quản lý bản dịch & Sửa lỗi')}
  ${useCaseEllipse(700, 725, 120, 22, 'UC-31', 'Quản lý mã QR di sản')}
  ${useCaseEllipse(420, 790, 120, 22, 'UC-33/34/35', 'Quản lý Khu vực & Lộ trình')}
  ${useCaseEllipse(700, 790, 120, 22, 'UC-36/37', 'Quản lý Quà lưu niệm & Tin tức')}
  ${useCaseEllipse(420, 855, 120, 22, 'UC-38', 'Quản lý tài khoản & Quyền')}
  ${useCaseEllipse(700, 855, 120, 22, 'UC-39', 'Xử lý đơn & Giao hàng')}
  ${useCaseEllipse(700, 920, 120, 22, 'UC-40', 'Báo cáo thống kê du lịch')}

  ${useCaseEllipse(990, 680, 125, 22, 'UC-41', 'Tự động dịch thuật AI (MyMemory)')}
  ${useCaseEllipse(990, 745, 125, 22, 'UC-42', 'Tự động sinh audio (Edge-TTS)')}
  ${useCaseEllipse(990, 855, 125, 22, 'UC-43', 'Thu thập sự kiện du lịch')}

  <!-- Actor Associations -->
  <!-- Guest to Subsystem 1 -->
  <line x1="100" y1="180" x2="290" y2="160" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="180" x2="555" y2="160" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="180" x2="290" y2="230" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="180" x2="280" y2="300" stroke="#000000" stroke-width="1.2"/>

  <!-- Registered User to Subsystem 2 -->
  <line x1="100" y1="460" x2="300" y2="410" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="460" x2="300" y2="480" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="460" x2="300" y2="550" stroke="#000000" stroke-width="1.2"/>

  <!-- Admin to Subsystem 3 -->
  <line x1="100" y1="780" x2="300" y2="660" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="780" x2="300" y2="725" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="780" x2="300" y2="790" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="780" x2="300" y2="855" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="780" x2="580" y2="855" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="780" x2="580" y2="920" stroke="#000000" stroke-width="1.2"/>

  <!-- External Actor Associations -->
  <line x1="1230" y1="150" x2="1075" y2="160" stroke="#000000" stroke-width="1.2"/>
  <line x1="1230" y1="280" x2="825" y2="550" stroke="#000000" stroke-width="1.2"/>
  <line x1="1230" y1="700" x2="1115" y2="680" stroke="#000000" stroke-width="1.2"/>
  <line x1="1230" y1="700" x2="1115" y2="745" stroke="#000000" stroke-width="1.2"/>
  <line x1="1230" y1="870" x2="1115" y2="855" stroke="#000000" stroke-width="1.2"/>

  <!-- Includes & Extends -->
  <!-- UC-03 includes UC-02 -->
  <line x1="825" y1="160" x2="785" y2="160" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="805" y="152" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-04 includes UC-02 -->
  <line x1="670" y1="208" x2="670" y2="182" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="635" y="198" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-19 includes UC-21/22 -->
  <line x1="700" y1="502" x2="700" y2="528" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="665" y="518" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-20 includes UC-21/22 -->
  <line x1="540" y1="550" x2="575" y2="550" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="557" y="542" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-28..29 triggers UC-41 & UC-42 -->
  <line x1="540" y1="725" x2="865" y2="685" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="680" y="700" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include / async event&gt;&gt;</text>

  <!-- UC-03/04 triggers UC-43 -->
  <line x1="950" y1="182" x2="990" y2="833" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="945" y="450" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include / event&gt;&gt;</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 3. HÌNH 3.3: PHÂN HỆ DU KHÁCH & TRẢI NGHIỆM DI SẢN (UC-01 .. UC-09)
// ---------------------------------------------------------------------------------
const diagram3_3_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.3. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ DU KHÁCH &amp; TRẢI NGHIỆM DI SẢN</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Chi tiết Quan hệ giữa Khách vãng lai, Người dùng đăng ký và Các chức năng Khám phá</text>

  <!-- System Boundary -->
  <rect x="250" y="75" width="700" height="700" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="75" width="400" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="260" y="93" font-size="13" font-weight="bold">Phân hệ Du khách: Trải nghiệm Di sản Số</text>

  <!-- Actors -->
  ${stickFigure(70, 180, 'Khách vãng lai', '(Guest)')}
  ${stickFigure(70, 480, 'Người dùng đăng ký', '(Registered User)')}
  <line x1="90" y1="470" x2="90" y2="330" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  ${systemBox(1000, 180, 160, 45, 'External Sensor', 'Thiết bị GPS')}
  ${systemBox(1000, 320, 160, 45, 'External Audio', 'Edge-TTS Stream')}
  ${systemBox(1000, 520, 160, 45, 'External Map Tile', 'OpenStreetMap')}

  <!-- Use Cases -->
  ${useCaseEllipse(460, 150, 125, 24, 'UC-01', 'Khám phá bản đồ di tích', 'Hiển thị 7 POI, Leaflet, Geofence')}
  ${useCaseEllipse(720, 240, 130, 24, 'UC-02', 'Nghe thuyết minh đa ngữ', 'Phát HTTP 206, Highlight phụ đề')}
  ${useCaseEllipse(720, 150, 130, 24, 'UC-03', 'Nhận thuyết minh GPS tự động', 'Haversine, Geofence 35-60m, Cửa sổ 5s')}
  ${useCaseEllipse(460, 270, 120, 24, 'UC-04', 'Quét mã QR di sản', 'Giải mã QR token -> nạp POI')}
  ${useCaseEllipse(460, 360, 125, 24, 'UC-05', 'Chế độ giả lập tọa độ', 'Simulation Mode, Chọn điểm dừng')}
  ${useCaseEllipse(460, 450, 125, 24, 'UC-06', 'Duyệt danh mục quà lưu niệm', 'Lọc danh mục, Tìm kiếm')}
  ${useCaseEllipse(720, 450, 125, 24, 'UC-07', 'Xem chi tiết quà lưu niệm', 'Giá bán, Mô tả, Di tích liên kết')}
  ${useCaseEllipse(460, 560, 125, 24, 'UC-08', 'Duyệt bài viết tin tức di sản', 'Danh sách bài viết văn hóa')}
  ${useCaseEllipse(720, 560, 125, 24, 'UC-09', 'Đọc chi tiết tin tức di sản', 'Nội dung chi tiết theo slug')}
  ${useCaseEllipse(720, 360, 125, 24, 'UC-Ext', 'Kiểm tra bản quyền ngoại ngữ', 'Khóa cước FREE -&gt; yêu cầu Premium')}

  <!-- Associations -->
  <line x1="110" y1="210" x2="335" y2="150" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="210" x2="590" y2="240" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="210" x2="340" y2="270" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="210" x2="335" y2="360" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="210" x2="335" y2="450" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="210" x2="335" y2="560" stroke="#000000" stroke-width="1.2"/>

  <!-- External Associations -->
  <line x1="1000" y1="200" x2="850" y2="155" stroke="#000000" stroke-width="1.2"/>
  <line x1="1000" y1="340" x2="850" y2="250" stroke="#000000" stroke-width="1.2"/>
  <line x1="1000" y1="540" x2="585" y2="160" stroke="#000000" stroke-width="1.2"/>

  <!-- Relations -->
  <!-- UC-03 includes UC-02 -->
  <line x1="720" y1="174" x2="720" y2="216" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="755" y="198" text-anchor="middle" font-size="9.5" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-04 includes UC-02 -->
  <line x1="575" y1="260" x2="595" y2="250" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="590" y="275" text-anchor="middle" font-size="9.5" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-02 extends UC-Ext -->
  <line x1="720" y1="264" x2="720" y2="336" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="755" y="305" text-anchor="middle" font-size="9.5" font-style="italic">&lt;&lt;extend&gt;&gt;</text>

  <!-- UC-06 extends UC-07 -->
  <line x1="585" y1="450" x2="595" y2="450" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="590" y="442" text-anchor="middle" font-size="9.5" font-style="italic">&lt;&lt;extend&gt;&gt;</text>

  <!-- UC-08 extends UC-09 -->
  <line x1="585" y1="560" x2="595" y2="560" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="590" y="552" text-anchor="middle" font-size="9.5" font-style="italic">&lt;&lt;extend&gt;&gt;</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 4. HÌNH 3.4: PHÂN HỆ NGƯỜI DÙNG, GIỎ HÀNG & THANH TOÁN (UC-10 .. UC-24)
// ---------------------------------------------------------------------------------
const diagram3_4_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 860" width="1200" height="860" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.4. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ TÀI KHOẢN, GIỎ HÀNG &amp; THANH TOÁN</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Chi tiết Luồng Xác thực Kép, Quản lý Giỏ hàng, Gói Premium và Cổng Thanh toán VNPAY/VietQR</text>

  <!-- System Boundary -->
  <rect x="240" y="75" width="720" height="760" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="240" y="75" width="430" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="250" y="93" font-size="13" font-weight="bold">Phân hệ Người dùng, Giỏ hàng &amp; Giao dịch Tài chính</text>

  <!-- Actors -->
  ${stickFigure(60, 360, 'Người dùng đăng ký', '(Registered User)')}

  ${systemBox(1010, 160, 160, 45, 'External Auth', 'Google Identity')}
  ${systemBox(1010, 520, 160, 45, 'Payment Gateway', 'VNPAY Sandbox')}
  ${systemBox(1010, 640, 160, 45, 'Banking Network', 'NAPAS VietQR')}

  <!-- Use Cases: Auth & Profile -->
  ${useCaseEllipse(430, 140, 120, 22, 'UC-10', 'Đăng ký tài khoản mới')}
  ${useCaseEllipse(730, 140, 120, 22, 'UC-11/12', 'Xác thực email & Quên MK')}
  ${useCaseEllipse(430, 210, 120, 22, 'UC-13', 'Đăng nhập mật khẩu', 'RAM Token + HttpOnly Cookie')}
  ${useCaseEllipse(730, 210, 120, 22, 'UC-14', 'Đăng nhập Google OAuth2')}
  ${useCaseEllipse(430, 280, 120, 22, 'UC-15', 'Đăng nhập quét mã QR', 'Phiên làm việc QrLogin')}
  ${useCaseEllipse(730, 280, 120, 22, 'UC-16/17', 'Hồ sơ cá nhân & Đăng xuất')}

  <!-- Use Cases: Cart, Order & Payment -->
  ${useCaseEllipse(430, 380, 125, 24, 'UC-18', 'Quản lý giỏ hàng quà', 'Thêm, sửa số lượng, FreeShip &gt;=50k')}
  ${useCaseEllipse(430, 480, 125, 24, 'UC-19', 'Đặt hàng quà lưu niệm', 'Địa chỉ nhận, Idempotency-Key')}
  ${useCaseEllipse(430, 580, 125, 24, 'UC-20', 'Mua gói ngoại ngữ Premium', 'Gói 500,000 VND/năm, Hạn 15m')}
  
  ${useCaseEllipse(730, 530, 130, 24, 'UC-21', 'Thanh toán online VNPAY', 'HMAC-SHA512, Return URL, IPN')}
  ${useCaseEllipse(730, 630, 130, 24, 'UC-22', 'Thanh toán chuyển khoản VietQR', 'Chuẩn NAPAS, Chờ xác nhận')}

  ${useCaseEllipse(430, 690, 125, 24, 'UC-23', 'Hủy đơn hàng chờ xử lý', 'Chuyển sang CANCELLED')}
  ${useCaseEllipse(730, 730, 130, 24, 'UC-24', 'Xem lịch sử & Chi tiết đơn', 'Tra cứu mã đơn, Trạng thái')}

  <!-- Associations -->
  <line x1="100" y1="400" x2="310" y2="140" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="400" x2="310" y2="210" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="400" x2="310" y2="280" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="400" x2="305" y2="380" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="400" x2="305" y2="480" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="400" x2="305" y2="580" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="400" x2="305" y2="690" stroke="#000000" stroke-width="1.2"/>

  <!-- External Associations -->
  <line x1="1010" y1="180" x2="850" y2="210" stroke="#000000" stroke-width="1.2"/>
  <line x1="1010" y1="540" x2="860" y2="530" stroke="#000000" stroke-width="1.2"/>
  <line x1="1010" y1="660" x2="860" y2="630" stroke="#000000" stroke-width="1.2"/>

  <!-- Includes -->
  <!-- UC-19 includes UC-21 -->
  <line x1="550" y1="495" x2="630" y2="515" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="590" y="495" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-19 includes UC-22 -->
  <line x1="540" y1="500" x2="640" y2="615" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="575" y="560" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-20 includes UC-21 -->
  <line x1="550" y1="565" x2="620" y2="545" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="585" y="568" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-20 includes UC-22 -->
  <line x1="550" y1="595" x2="620" y2="615" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="585" y="618" text-anchor="middle" font-size="9" font-style="italic">&lt;&lt;include&gt;&gt;</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 5. HÌNH 3.5: PHÂN HỆ QUẢN TRỊ NỘI DUNG DI SẢN & CMS (UC-25 .. UC-40)
// ---------------------------------------------------------------------------------
const diagram3_5_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 950" width="1280" height="950" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="640" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.5. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ QUẢN TRỊ NỘI DUNG DI SẢN &amp; CMS</text>
  <text x="640" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Các Chức năng Độc lập dành riêng cho Quản trị viên Di sản (Administrator)</text>

  <!-- System Boundary -->
  <rect x="260" y="75" width="760" height="850" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="75" width="460" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="270" y="93" font-size="13" font-weight="bold">Phân hệ Quản trị Di sản (Admin Console /quan-tri)</text>

  <!-- Actors -->
  ${stickFigure(70, 430, 'Quản trị viên', '(Administrator)')}
  ${systemBox(1070, 240, 180, 45, 'External Storage', 'Storage Volume (Ảnh/Audio)')}
  ${systemBox(1070, 600, 180, 45, 'Message Broker', 'RabbitMQ Exchange')}

  <!-- Column 1 Use Cases -->
  ${useCaseEllipse(460, 140, 130, 22, 'UC-25', 'Đăng nhập cổng quản trị', '/quan-tri/dang-nhap')}
  ${useCaseEllipse(460, 210, 130, 22, 'UC-26', 'Xem bảng điều khiển tổng quan', 'KPI POI, Doanh thu, User')}
  ${useCaseEllipse(460, 280, 130, 22, 'UC-27', 'Xem danh mục điểm di tích (POI)', 'Bảng danh sách, Lọc khu vực')}
  ${useCaseEllipse(460, 350, 130, 22, 'UC-28', 'Thêm mới điểm tham quan (POI)', 'Tọa độ, Bán kính, Thuyết minh vi')}
  ${useCaseEllipse(460, 420, 130, 22, 'UC-29', 'Cập nhật điểm tham quan (POI)', 'Khóa lạc quan @Version, Publish')}
  ${useCaseEllipse(460, 490, 130, 22, 'UC-30', 'Quản lý bản dịch đa ngữ POI', 'Duyệt 4 ngữ, Nguồn AUTO/MANUAL')}
  ${useCaseEllipse(460, 560, 130, 22, 'UC-31', 'Quản lý và xuất mã QR POI', 'Tải mã QR in ấn biển chỉ dẫn')}
  ${useCaseEllipse(460, 630, 130, 22, 'UC-32', 'Theo dõi lỗi dịch &amp; Kích hoạt lại', 'PoiErrorLog, Republish audio')}
  ${useCaseEllipse(460, 700, 130, 22, 'UC-33', 'Quản lý khu vực di tích (Zone)', 'Danh sách, Thêm, Sửa khu vực')}
  ${useCaseEllipse(460, 770, 130, 22, 'UC-34', 'Quản lý lộ trình tour (Route)', 'Danh sách, Thêm, Sửa lộ trình')}
  ${useCaseEllipse(460, 840, 130, 22, 'UC-35', 'Sắp xếp trạm dừng lộ trình', 'Route Stops, Thứ tự tham quan')}

  <!-- Column 2 Use Cases -->
  ${useCaseEllipse(780, 210, 135, 22, 'UC-36A', 'Xem danh sách quà lưu niệm', 'Giá bán, Tồn kho, Trạng thái')}
  ${useCaseEllipse(780, 280, 135, 22, 'UC-36B', 'Thêm &amp; Cập nhật quà lưu niệm', 'Upload ảnh, Sort order')}
  ${useCaseEllipse(780, 360, 135, 22, 'UC-37A', 'Xem &amp; Thêm tin tức văn hóa', 'Soạn thảo bài viết di sản')}
  ${useCaseEllipse(780, 430, 135, 22, 'UC-37B', 'Sửa &amp; Xóa bài viết tin tức', 'Chuyển DRAFT / PUBLISHED')}
  ${useCaseEllipse(780, 520, 135, 22, 'UC-38A', 'Quản lý tài khoản người dùng', 'Danh sách, Khóa/Mở tài khoản')}
  ${useCaseEllipse(780, 590, 135, 22, 'UC-38B', 'Phân quyền vai trò người dùng', 'Gán quyền USER / ADMIN')}
  ${useCaseEllipse(780, 680, 135, 22, 'UC-39A', 'Quản lý danh sách đơn hàng', 'Lọc đơn PENDING, PAID, DELIVERED')}
  ${useCaseEllipse(780, 750, 135, 22, 'UC-39B', 'Xác nhận thanh toán &amp; Giao hàng', 'Xác nhận VietQR, Chuyển DELIVERED')}
  ${useCaseEllipse(780, 840, 135, 22, 'UC-40', 'Báo cáo thống kê lượt tương tác', 'Thống kê QR scan, Tỷ lệ nghe audio')}

  <!-- Associations Admin to Use Cases -->
  <line x1="120" y1="460" x2="330" y2="140" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="210" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="280" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="350" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="420" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="490" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="560" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="630" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="700" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="770" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="330" y2="840" stroke="#000000" stroke-width="1.2"/>

  <!-- Connect Admin to Column 2 -->
  <line x1="120" y1="460" x2="645" y2="210" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="645" y2="360" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="645" y2="520" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="645" y2="680" stroke="#000000" stroke-width="1.2"/>
  <line x1="120" y1="460" x2="645" y2="840" stroke="#000000" stroke-width="1.2"/>

  <!-- External Connections -->
  <line x1="915" y1="280" x2="1070" y2="260" stroke="#000000" stroke-width="1.2"/>
  <line x1="590" y1="420" x2="1070" y2="620" stroke="#000000" stroke-width="1.2"/>
  <line x1="590" y1="630" x2="1070" y2="625" stroke="#000000" stroke-width="1.2"/>
</svg>
`;

// ---------------------------------------------------------------------------------
// 6. HÌNH 3.6: PHÂN HỆ TỰ ĐỘNG HÓA DỊCH VỤ NỀN & AI PIPELINE (UC-41 .. UC-43)
// ---------------------------------------------------------------------------------
const diagram3_6_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 680" width="1200" height="680" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.6. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ TỰ ĐỘNG HÓA DỊCH VỤ NỀN &amp; AI PIPELINE</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Xử lý Bất đồng bộ qua RabbitMQ: Dịch thuật, Tổng hợp Âm thanh Edge-TTS &amp; Phân tích Sự kiện</text>

  <!-- System Boundary -->
  <rect x="260" y="80" width="680" height="560" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="260" y="80" width="460" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="270" y="98" font-size="13" font-weight="bold">Phân hệ Tự động hóa &amp; Dịch vụ Xử lý Nền (Background Workers)</text>

  <!-- Left: Triggering Services / Events -->
  ${systemBox(40, 160, 180, 55, 'Service Publisher', 'Content Service (PoiEventPublisher)')}
  ${systemBox(40, 420, 180, 55, 'Service Publisher', 'Gateway / Frontend (Analytics Event)')}

  <!-- Right: External Services -->
  ${systemBox(980, 160, 180, 50, 'External Translation', 'MyMemory Translation API')}
  ${systemBox(980, 270, 180, 50, 'External AI TTS', 'Microsoft Edge-TTS CLI')}
  ${systemBox(980, 380, 180, 50, 'Local Volume', 'Audio Storage Volume')}
  ${systemBox(980, 490, 180, 50, 'Database System', 'echora_analytics_db')}

  <!-- Use Cases -->
  ${useCaseEllipse(600, 180, 160, 30, 'UC-41', 'Tự động dịch thuật nội dung POI', 'RabbitMQ -&gt; Dịch en,ja,ko (Bảo toàn MANUAL)')}
  ${useCaseEllipse(600, 320, 160, 30, 'UC-42', 'Tự động tổng hợp âm thanh AI', 'Edge-TTS -&gt; Sinh MP3 -&gt; PoiAudioReadyEvent')}
  ${useCaseEllipse(600, 480, 160, 30, 'UC-43', 'Thu thập sự kiện phân tích du lịch', 'Event SCAN / PLAY -&gt; Lưu Analytics Event')}

  <!-- Flow Associations -->
  <line x1="220" y1="187" x2="440" y2="180" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="330" y="175" text-anchor="middle" font-size="9.5" font-weight="bold">poi.updated (AMQP)</text>

  <line x1="600" y1="210" x2="600" y2="290" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="655" y="255" text-anchor="middle" font-size="9.5" font-style="italic">&lt;&lt;include / pipeline&gt;&gt;</text>

  <line x1="760" y1="180" x2="980" y2="185" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="870" y="172" text-anchor="middle" font-size="9">REST JSON / Seed</text>

  <line x1="760" y1="320" x2="980" y2="295" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="870" y="295" text-anchor="middle" font-size="9">CLI Process</text>

  <line x1="760" y1="335" x2="980" y2="400" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="870" y="380" text-anchor="middle" font-size="9">Ghi tệp MP3</text>

  <line x1="220" y1="447" x2="440" y2="480" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="330" y="450" text-anchor="middle" font-size="9.5" font-weight="bold">POST /events (JSON)</text>

  <line x1="760" y1="480" x2="980" y2="510" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="870" y="485" text-anchor="middle" font-size="9">Ghi bản ghi CSDL</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 7. HÌNH 3.7: SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — ĐỊNH VỊ GPS VÀ PHÁT AUDIO
// ---------------------------------------------------------------------------------
const diagram3_7_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 960" width="1200" height="960" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="30" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.7. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — UC-03: THUYẾT MINH GPS TỰ ĐỘNG</text>
  <text x="600" y="50" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Định vị Không gian, Kiểm tra Geofence, Khóa Cước Ngoại ngữ và Dự phòng Hai tầng</text>

  <!-- SWIMLANES -->
  <!-- Lane 1: Du khách -->
  <rect x="40" y="70" width="220" height="860" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="40" y="70" width="220" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="90" text-anchor="middle" font-size="12" font-weight="bold">1. Du khách (Guest / User)</text>

  <!-- Lane 2: Frontend Hook / Geolocation -->
  <rect x="260" y="70" width="360" height="860" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="260" y="70" width="360" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="90" text-anchor="middle" font-size="12" font-weight="bold">2. Trình duyệt &amp; Hook useAutoNarration</text>

  <!-- Lane 3: Gateway & Content/TTS Service -->
  <rect x="620" y="70" width="340" height="860" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="620" y="70" width="340" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="790" y="90" text-anchor="middle" font-size="12" font-weight="bold">3. API Gateway &amp; TTS Service</text>

  <!-- Lane 4: Analytics / RabbitMQ -->
  <rect x="960" y="70" width="200" height="860" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="960" y="70" width="200" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="1060" y="90" text-anchor="middle" font-size="12" font-weight="bold">4. RabbitMQ &amp; Analytics</text>

  <!-- Flow 1: Start -->
  <circle cx="150" cy="130" r="10" fill="#000000"/>
  <line x1="150" y1="140" x2="150" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="70" y="170" width="160" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="195" text-anchor="middle" font-size="10.5">Bật "Thuyết minh tự động"</text>

  <line x1="230" y1="190" x2="310" y2="190" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="310" y="170" width="260" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="188" text-anchor="middle" font-size="10.5">Gọi navigator.geolocation</text>
  <text x="440" y="202" text-anchor="middle" font-size="10" fill="#444444">watchPosition(enableHighAccuracy)</text>

  <line x1="440" y1="210" x2="440" y2="245" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="310" y="245" width="260" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="263" text-anchor="middle" font-size="10.5">Nhận tọa độ GPS (lat, lng)</text>
  <text x="440" y="278" text-anchor="middle" font-size="10" fill="#444444">Tính khoảng cách Haversine tới 7 POI</text>

  <line x1="440" y1="290" x2="440" y2="320" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision 1: d <= r? -->
  <polygon points="440,320 500,345 440,370 380,345" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="348" text-anchor="middle" font-size="10" font-weight="bold">d &le; r (35-60m)?</text>

  <line x1="500" y1="345" x2="570" y2="345" stroke="#000000" stroke-width="1.2"/>
  <line x1="570" y1="345" x2="570" y2="267" stroke="#000000" stroke-width="1.2"/>
  <line x1="570" y1="267" x2="570" y2="267" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="535" y="338" font-size="9" fill="#555555">[Không: Di chuyển tiếp]</text>

  <line x1="440" y1="370" x2="440" y2="400" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="455" y="388" font-size="9" fill="#000000">[Có]</text>

  <!-- Decision 2: Guard window & autoPlayedSet -->
  <polygon points="440,400 520,430 440,460 360,430" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="427" text-anchor="middle" font-size="9.5" font-weight="bold">manualStopGuard (5s)?</text>
  <text x="440" y="440" text-anchor="middle" font-size="9" font-weight="bold">hoặc đã phát POI này?</text>

  <line x1="520" y1="430" x2="590" y2="430" stroke="#000000" stroke-width="1.2"/>
  <line x1="590" y1="430" x2="590" y2="267" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="555" y="422" font-size="9" fill="#555555">[Có: Bỏ qua kích hoạt]</text>

  <line x1="440" y1="460" x2="440" y2="495" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="455" y="480" font-size="9" fill="#000000">[Không: Đủ điều kiện]</text>

  <rect x="310" y="495" width="260" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="513" text-anchor="middle" font-size="10.5">Thêm POI vào autoPlayedSetRef</text>
  <text x="440" y="527" text-anchor="middle" font-size="10" fill="#444444">Khởi động trình phát audio</text>

  <line x1="570" y1="515" x2="650" y2="515" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Lane 3: Gateway check -->
  <rect x="650" y="495" width="280" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="790" y="513" text-anchor="middle" font-size="10.5">GET /api/tts/audio/{filename}</text>
  <text x="790" y="527" text-anchor="middle" font-size="10" fill="#444444">AudioEntitlementFilter kiểm tra gói</text>

  <line x1="790" y1="535" x2="790" y2="565" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision 3: Language & Plan -->
  <polygon points="790,565 870,595 790,625 710,595" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="592" text-anchor="middle" font-size="9.5" font-weight="bold">Ngôn ngữ = 'vi'</text>
  <text x="790" y="605" text-anchor="middle" font-size="9" font-weight="bold">hoặc Plan = PREMIUM?</text>

  <!-- Forbidden Branch -->
  <line x1="710" y1="595" x2="570" y2="595" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="640" y="587" font-size="9" fill="#000000">[Không: HTTP 403]</text>

  <rect x="310" y="575" width="260" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="593" text-anchor="middle" font-size="10.5">Hiện modal thông báo khóa cước</text>
  <text x="440" y="607" text-anchor="middle" font-size="10" fill="#444444">Gợi ý nâng cấp Premium 500k/năm</text>

  <line x1="310" y1="595" x2="230" y2="595" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <rect x="70" y="575" width="160" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="598" text-anchor="middle" font-size="10.5">Xem trang /nang-cap</text>

  <!-- Success Branch -->
  <line x1="790" y1="625" x2="790" y2="655" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="805" y="643" font-size="9" fill="#000000">[Hợp lệ]</text>

  <rect x="650" y="655" width="280" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="790" y="673" text-anchor="middle" font-size="10.5">Truyền luồng MP3 HTTP 206 Partial</text>
  <text x="790" y="688" text-anchor="middle" font-size="10" fill="#444444">Range Stream nạp vài KB đầu tiên</text>

  <line x1="790" y1="700" x2="790" y2="735" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision 4: File ready? -->
  <polygon points="790,735 860,760 790,785 720,760" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="790" y="763" text-anchor="middle" font-size="9.5" font-weight="bold">File MP3 sẵn sàng?</text>

  <!-- Fallback Web Speech API -->
  <line x1="720" y1="760" x2="570" y2="760" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="645" y="752" font-size="9" fill="#555555">[Không: Fallback]</text>

  <rect x="310" y="740" width="260" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="758" text-anchor="middle" font-size="10.5">Kích hoạt Web Speech API</text>
  <text x="440" y="772" text-anchor="middle" font-size="10" fill="#444444">Đọc văn bản dự phòng trên trình duyệt</text>

  <!-- Server Audio Stream -->
  <line x1="790" y1="785" x2="790" y2="815" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="805" y="802" font-size="9" fill="#000000">[Có]</text>

  <rect x="650" y="815" width="280" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="790" y="833" text-anchor="middle" font-size="10.5">Phát âm thanh Edge-TTS bản ngữ</text>
  <text x="790" y="847" text-anchor="middle" font-size="10" fill="#444444">Highlight câu phụ đề đồng bộ</text>

  <!-- Notify Analytics -->
  <line x1="930" y1="835" x2="980" y2="835" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="980" y="815" width="160" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="1060" y="833" text-anchor="middle" font-size="10.5">Gửi AUDIO_PLAY</text>
  <text x="1060" y="847" text-anchor="middle" font-size="9.5" fill="#444444">RabbitMQ -&gt; Analytics</text>

  <line x1="650" y1="835" x2="230" y2="835" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="70" y="815" width="160" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="838" text-anchor="middle" font-size="10.5">Nghe thuyết minh di sản</text>

  <line x1="150" y1="855" x2="150" y2="890" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <circle cx="150" cy="902" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="150" cy="902" r="7" fill="#000000"/>
</svg>
`;

// ---------------------------------------------------------------------------------
// 8. HÌNH 3.8: SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — ĐẶT HÀNG VÀ THANH TOÁN
// ---------------------------------------------------------------------------------
const diagram3_8_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 950" width="1200" height="950" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="30" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.8. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — ĐẶT HÀNG &amp; THANH TOÁN (VNPAY / VIETQR)</text>
  <text x="600" y="50" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Kiểm tra Phí Vận chuyển, Thời hạn Đơn 15 phút, Chữ ký HMAC-SHA512 và Kích hoạt Gói</text>

  <!-- SWIMLANES -->
  <rect x="40" y="70" width="220" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="40" y="70" width="220" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="90" text-anchor="middle" font-size="12" font-weight="bold">1. Người dùng (Buyer)</text>

  <rect x="260" y="70" width="290" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="260" y="70" width="290" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="90" text-anchor="middle" font-size="12" font-weight="bold">2. Frontend Giỏ hàng &amp; Thanh toán</text>

  <rect x="550" y="70" width="350" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="550" y="70" width="350" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="725" y="90" text-anchor="middle" font-size="12" font-weight="bold">3. Order Service &amp; Auth Service</text>

  <rect x="900" y="70" width="260" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="900" y="70" width="260" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="1030" y="90" text-anchor="middle" font-size="12" font-weight="bold">4. Cổng VNPAY / Ngân hàng NAPAS</text>

  <!-- Start -->
  <circle cx="150" cy="125" r="10" fill="#000000"/>
  <line x1="150" y1="135" x2="150" y2="160" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="60" y="160" width="180" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="178" text-anchor="middle" font-size="10.5">Chọn Quà lưu niệm</text>
  <text x="150" y="192" text-anchor="middle" font-size="10" fill="#444444">hoặc bấm Nâng cấp Premium</text>

  <line x1="240" y1="180" x2="280" y2="180" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="280" y="160" width="250" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="178" text-anchor="middle" font-size="10.5">Thêm vào giỏ &amp; Tính tổng tiền</text>
  <text x="405" y="192" text-anchor="middle" font-size="10" fill="#444444">Kiểm tra miễn phí ship &gt;= 50,000 VND</text>

  <line x1="405" y1="200" x2="405" y2="235" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Free shipping? -->
  <polygon points="405,235 485,260 405,285 325,260" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="405" y="263" text-anchor="middle" font-size="10" font-weight="bold">Tạm tính &ge; 50k?</text>

  <line x1="325" y1="260" x2="285" y2="260" stroke="#000000" stroke-width="1.2"/>
  <line x1="285" y1="260" x2="285" y2="305" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="290" y="250" font-size="9" fill="#555555">[Không: Phí 20k]</text>

  <line x1="485" y1="260" x2="525" y2="260" stroke="#000000" stroke-width="1.2"/>
  <line x1="525" y1="260" x2="525" y2="305" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="495" y="250" font-size="9" fill="#000000">[Có: Free Ship]</text>

  <rect x="280" y="305" width="250" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="323" text-anchor="middle" font-size="10.5">Xác nhận đơn &amp; Chọn thanh toán</text>
  <text x="405" y="337" text-anchor="middle" font-size="10" fill="#444444">Gửi kèm Idempotency-Key</text>

  <line x1="530" y1="325" x2="570" y2="325" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="570" y="305" width="310" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="725" y="323" text-anchor="middle" font-size="10.5">Tạo bản ghi Order (Trạng thái PENDING)</text>
  <text x="725" y="338" text-anchor="middle" font-size="10" fill="#444444">Hạn đơn 15 phút (expires_at = now + 15m)</text>

  <line x1="725" y1="350" x2="725" y2="385" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Payment Method -->
  <polygon points="725,385 815,410 725,435 635,410" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="725" y="413" text-anchor="middle" font-size="10" font-weight="bold">Phương thức TT?</text>

  <!-- Branch 1: VNPAY -->
  <line x1="815" y1="410" x2="920" y2="410" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="860" y="400" font-size="9" font-weight="bold">[VNPAY]</text>

  <rect x="920" y="390" width="220" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="1030" y="408" text-anchor="middle" font-size="10.5">Tạo Signed URL (HMAC-SHA512)</text>
  <text x="1030" y="422" text-anchor="middle" font-size="10" fill="#444444">Chuyển hướng cổng VNPAY Sandbox</text>

  <line x1="1030" y1="435" x2="1030" y2="470" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="920" y="470" width="220" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="1030" y="488" text-anchor="middle" font-size="10.5">Khách nhập thẻ test &amp; OTP</text>
  <text x="1030" y="502" text-anchor="middle" font-size="10" fill="#444444">VNPAY gọi return callback &amp; IPN</text>

  <!-- Branch 2: VietQR -->
  <line x1="635" y1="410" x2="405" y2="410" stroke="#000000" stroke-width="1.5"/>
  <line x1="405" y1="410" x2="405" y2="470" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="520" y="400" font-size="9" font-weight="bold">[VietQR Chuyển khoản]</text>

  <rect x="280" y="470" width="250" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="488" text-anchor="middle" font-size="10.5">Hiển thị mã QR chuẩn NAPAS</text>
  <text x="405" y="502" text-anchor="middle" font-size="10" fill="#444444">Số TK + Số tiền + Mã đơn hàng</text>

  <!-- Convergence to Order Verification -->
  <line x1="1030" y1="510" x2="1030" y2="570" stroke="#000000" stroke-width="1.5"/>
  <line x1="1030" y1="570" x2="880" y2="570" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="570" y="550" width="310" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="725" y="568" text-anchor="middle" font-size="10.5">Đối soát chữ ký vnp_SecureHash</text>
  <text x="725" y="582" text-anchor="middle" font-size="10" fill="#444444">Kiểm tra vnp_ResponseCode == "00"</text>

  <line x1="725" y1="595" x2="725" y2="630" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Decision: Success? -->
  <polygon points="725,630 805,655 725,680 645,655" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
  <text x="725" y="658" text-anchor="middle" font-size="10" font-weight="bold">Thanh toán OK?</text>

  <line x1="645" y1="655" x2="520" y2="655" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="585" y="645" font-size="9" fill="#555555">[Lỗi/Hủy]</text>

  <rect x="280" y="635" width="240" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="400" y="653" text-anchor="middle" font-size="10.5">Báo lỗi giao dịch thất bại</text>
  <text x="400" y="667" text-anchor="middle" font-size="10" fill="#444444">Đơn chuyển FAILED, cho thử lại</text>

  <line x1="725" y1="680" x2="725" y2="715" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="740" y="700" font-size="9" fill="#000000">[Thành công]</text>

  <rect x="570" y="715" width="310" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="725" y="733" text-anchor="middle" font-size="10.5">Cập nhật order_status = PAID</text>
  <text x="725" y="748" text-anchor="middle" font-size="10" fill="#444444">Nếu đơn Premium: Nâng hạn tài khoản 1 năm</text>

  <line x1="570" y1="737" x2="230" y2="737" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="60" y="715" width="170" height="45" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="145" y="733" text-anchor="middle" font-size="10.5">Nhận thông báo Thành công</text>
  <text x="145" y="748" text-anchor="middle" font-size="10" fill="#444444">Xem đơn hàng hoặc nghe audio</text>

  <line x1="145" y1="760" x2="145" y2="800" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <circle cx="145" cy="812" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="145" cy="812" r="7" fill="#000000"/>
</svg>
`;

// ---------------------------------------------------------------------------------
// 9. HÌNH 3.9: SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) — XÁC THỰC KÉP VÀ TOKEN ROTATION
// ---------------------------------------------------------------------------------
const diagram3_9_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 840" width="1200" height="840" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="30" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.9. SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) — XÁC THỰC KÉP VÀ TOKEN ROTATION</text>
  <text x="600" y="50" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Đăng nhập, Cấp phát Token RAM/Cookie, Gia hạn Âm thầm và Phát hiện Tái sử dụng</text>

  <!-- LIFELINES -->
  <!-- 1. Client UI -->
  <rect x="50" y="80" width="140" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="120" y="102" text-anchor="middle" font-size="12" font-weight="bold">:Client UI (React)</text>
  <line x1="120" y1="115" x2="120" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 2. Client RAM Store -->
  <rect x="250" y="80" width="160" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="330" y="102" text-anchor="middle" font-size="12" font-weight="bold">:RAM Store (tokenStore)</text>
  <line x1="330" y1="115" x2="330" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 3. API Gateway -->
  <rect x="470" y="80" width="160" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="550" y="102" text-anchor="middle" font-size="12" font-weight="bold">:API Gateway (:8080)</text>
  <line x1="550" y1="115" x2="550" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 4. Auth Service -->
  <rect x="710" y="80" width="160" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="790" y="102" text-anchor="middle" font-size="12" font-weight="bold">:auth-service (:8081)</text>
  <line x1="790" y1="115" x2="790" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 5. Auth Database -->
  <rect x="940" y="80" width="170" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="1025" y="102" text-anchor="middle" font-size="12" font-weight="bold">:echora_auth_db</text>
  <line x1="1025" y1="115" x2="1025" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- PHASE 1: LOGIN -->
  <rect x="40" y="130" width="1100" height="180" fill="#fafafa" stroke="#888888" stroke-dasharray="3 3"/>
  <text x="50" y="145" font-size="11" font-weight="bold">[Giai đoạn 1: Đăng nhập Khởi tạo &amp; Phát hành Cặp Token]</text>

  <line x1="120" y1="165" x2="550" y2="165" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="330" y="158" text-anchor="middle" font-size="10.5">1. POST /api/auth/login {email, password}</text>

  <line x1="550" y1="180" x2="790" y2="180" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="670" y="173" text-anchor="middle" font-size="10">2. Strip untrusted headers &amp; forward</text>

  <line x1="790" y1="195" x2="1025" y2="195" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="900" y="190" text-anchor="middle" font-size="10">3. SELECT user BY email</text>

  <line x1="1025" y1="215" x2="790" y2="215" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="900" y="210" text-anchor="middle" font-size="9.5">user info &amp; password_hash</text>

  <rect x="785" y="225" width="10" height="40" fill="#000000"/>
  <text x="800" y="240" font-size="10">4. BCrypt check &amp; Tạo token pair:</text>
  <text x="800" y="255" font-size="9.5" fill="#444444">Access Token (15m) + Refresh Token (7d)</text>

  <line x1="790" y1="275" x2="120" y2="275" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="440" y="270" text-anchor="middle" font-size="10.5">5. HTTP 200 {accessToken, user} + Set-Cookie: refreshToken (HttpOnly, Strict)</text>

  <line x1="120" y1="295" x2="330" y2="295" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="225" y="290" text-anchor="middle" font-size="10">6. Lưu Access Token vào RAM</text>

  <!-- PHASE 2: NORMAL REQUEST -->
  <rect x="40" y="325" width="1100" height="130" fill="#fafafa" stroke="#888888" stroke-dasharray="3 3"/>
  <text x="50" y="340" font-size="11" font-weight="bold">[Giai đoạn 2: Gọi API Nghiệp vụ với Access Token]</text>

  <line x1="120" y1="365" x2="330" y2="365" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="225" y="360" text-anchor="middle" font-size="10">7. Lấy token từ RAM</text>

  <line x1="120" y1="390" x2="550" y2="390" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="330" y="385" text-anchor="middle" font-size="10.5">8. GET /api/orders/my [Authorization: Bearer &lt;accessToken&gt;]</text>

  <rect x="545" y="400" width="10" height="25" fill="#000000"/>
  <text x="560" y="415" font-size="10">9. Gateway decode &amp; verify HMAC-SHA256 JWT</text>

  <line x1="550" y1="435" x2="120" y2="435" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="330" y="430" text-anchor="middle" font-size="10">10. Trả dữ liệu đơn hàng (HTTP 200)</text>

  <!-- PHASE 3: SILENT REFRESH -->
  <rect x="40" y="470" width="1100" height="180" fill="#fafafa" stroke="#888888" stroke-dasharray="3 3"/>
  <text x="50" y="485" font-size="11" font-weight="bold">[Giai đoạn 3: Gia hạn Âm thầm (Silent Refresh) &amp; Xoay vòng Token (Rotation)]</text>

  <text x="130" y="510" font-size="10" font-style="italic" fill="#555555">(Sau 14 phút: Access Token sắp hết hạn, Axios Interceptor tự động gia hạn)</text>

  <line x1="120" y1="530" x2="790" y2="530" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="440" y="525" text-anchor="middle" font-size="10.5">11. POST /api/auth/refresh (Cookie: refreshToken=RT_1)</text>

  <rect x="785" y="540" width="10" height="40" fill="#000000"/>
  <text x="800" y="555" font-size="10">12. Kiểm tra RT_1 hợp lệ, chưa revoked</text>
  <text x="800" y="570" font-size="9.5" fill="#444444">Đánh dấu RT_1.revoked = true, phát hành RT_2 mới</text>

  <line x1="790" y1="595" x2="1025" y2="595" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="900" y="590" text-anchor="middle" font-size="10">13. UPDATE refresh_tokens SET replaced_by=RT_2</text>

  <line x1="790" y1="620" x2="120" y2="620" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="440" y="615" text-anchor="middle" font-size="10.5">14. Trả Access Token mới + Set-Cookie: refreshToken=RT_2</text>

  <!-- PHASE 4: COMPROMISE DETECTION -->
  <rect x="40" y="665" width="1100" height="100" fill="#fafafa" stroke="#888888" stroke-dasharray="3 3"/>
  <text x="50" y="680" font-size="11" font-weight="bold">[Giai đoạn 4: Phát hiện Token bị Đánh cắp (Compromise Detection)]</text>

  <line x1="120" y1="705" x2="790" y2="705" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="440" y="700" text-anchor="middle" font-size="10.5">15. Kẻ tấn công gửi lại RT_1 cũ đã revoked</text>

  <rect x="785" y="715" width="10" height="25" fill="#000000"/>
  <text x="800" y="730" font-size="10">16. Phát hiện token cũ bị tái sử dụng! Thu hồi toàn bộ phiên của user</text>

  <line x1="790" y1="745" x2="120" y2="745" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="440" y="740" text-anchor="middle" font-size="10.5">17. HTTP 401 Unauthorized (Force Logout all sessions)</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 10. HÌNH 3.10: SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) — PIPELINE DỊCH & TTS
// ---------------------------------------------------------------------------------
const diagram3_10_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 840" width="1200" height="840" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <!-- Title -->
  <text x="600" y="30" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.10. SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) — PIPELINE DỊCH &amp; TỔNG HỢP TIẾNG NÓI AI</text>
  <text x="600" y="50" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Xử lý Bất đồng bộ qua RabbitMQ, Bảo toàn Bản dịch Thủ công và Phục vụ Luồng Âm thanh HTTP 206</text>

  <!-- LIFELINES -->
  <rect x="40" y="80" width="140" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="110" y="102" text-anchor="middle" font-size="12" font-weight="bold">:Admin Browser</text>
  <line x1="110" y1="115" x2="110" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <rect x="220" y="80" width="150" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="295" y="102" text-anchor="middle" font-size="12" font-weight="bold">:content-service</text>
  <line x1="295" y1="115" x2="295" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <rect x="410" y="80" width="170" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="495" y="102" text-anchor="middle" font-size="12" font-weight="bold">:RabbitMQ (echora.topic)</text>
  <line x1="495" y1="115" x2="495" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <rect x="620" y="80" width="170" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="705" y="102" text-anchor="middle" font-size="12" font-weight="bold">:translation-tts-service</text>
  <line x1="705" y1="115" x2="705" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <rect x="830" y="80" width="150" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="905" y="102" text-anchor="middle" font-size="12" font-weight="bold">:MyMemory / Edge-TTS</text>
  <line x1="905" y1="115" x2="905" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <rect x="1020" y="80" width="140" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="1090" y="102" text-anchor="middle" font-size="12" font-weight="bold">:Audio Storage Vol</text>
  <line x1="1090" y1="115" x2="1090" y2="780" stroke="#000000" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- Step 1: Admin Save POI -->
  <line x1="110" y1="150" x2="295" y2="150" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="200" y="143" text-anchor="middle" font-size="10.5">1. PUT /api/admin/pois/{id} {version: 3, vi_content: "..."}</text>

  <rect x="290" y="160" width="10" height="35" fill="#000000"/>
  <text x="310" y="175" font-size="10">2. Kiểm tra @Version (Khóa lạc quan) &amp; Lưu CSDL</text>
  <text x="310" y="190" font-size="9.5" fill="#444444">Tăng version lên 4</text>

  <line x1="295" y1="210" x2="110" y2="210" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="200" y="205" text-anchor="middle" font-size="10">3. HTTP 200 OK (Phản hồi tức thì cho Quản trị viên)</text>

  <!-- Step 4: Publish to RabbitMQ -->
  <line x1="295" y1="240" x2="495" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="395" y="233" text-anchor="middle" font-size="10.5">4. Publish PoiUpdatedEvent [routingKey: poi.updated]</text>

  <!-- Step 5: RabbitMQ dispatch to Consumer -->
  <line x1="495" y1="270" x2="705" y2="270" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="600" y="263" text-anchor="middle" font-size="10.5">5. Consume message từ queue echora.content.poi.updated</text>

  <rect x="700" y="285" width="10" height="40" fill="#000000"/>
  <text x="715" y="300" font-size="10">6. Kiểm tra translation_source từng ngôn ngữ</text>
  <text x="715" y="315" font-size="9.5" fill="#444444">Nếu = 'MANUAL' -&gt; Giữ nguyên, không dịch đè</text>

  <!-- Step 7: Call Translation API -->
  <line x1="705" y1="340" x2="905" y2="340" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="805" y="333" text-anchor="middle" font-size="10">7. Dịch tiếng Việt sang en, ja, ko (MyMemory API)</text>

  <line x1="905" y1="365" x2="705" y2="365" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="805" y="360" text-anchor="middle" font-size="9.5">Trả về văn bản dịch đa ngữ</text>

  <!-- Step 8: Call Edge-TTS CLI -->
  <line x1="705" y1="400" x2="905" y2="400" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="805" y="393" text-anchor="middle" font-size="10">8. Gọi Edge-TTS CLI sinh file MP3 từng ngôn ngữ</text>

  <line x1="905" y1="430" x2="1090" y2="430" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="995" y="423" text-anchor="middle" font-size="10">9. Ghi file MP3 vào volume /app/storage/audio</text>

  <line x1="905" y1="460" x2="705" y2="460" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="805" y="455" text-anchor="middle" font-size="9.5">Hoàn thành sinh file MP3</text>

  <rect x="700" y="480" width="10" height="30" fill="#000000"/>
  <text x="715" y="495" font-size="10">10. Cập nhật audio_status = 'READY'</text>
  <text x="715" y="510" font-size="9.5" fill="#444444">và audio_file = filename.mp3</text>

  <!-- Step 11: Notify Ready -->
  <line x1="705" y1="535" x2="495" y2="535" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="600" y="528" text-anchor="middle" font-size="10">11. Publish PoiAudioReadyEvent [poi.audio.ready]</text>

  <line x1="495" y1="565" x2="295" y2="565" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="395" y="558" text-anchor="middle" font-size="10">12. Đồng bộ trạng thái audio vào content_db</text>

  <!-- PHASE: DU KHÁCH NGHE AUDIO -->
  <rect x="40" y="605" width="1120" height="150" fill="#fcfcfc" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="50" y="625" font-size="11" font-weight="bold">[Du khách yêu cầu phát âm thanh]</text>

  <line x1="110" y1="655" x2="705" y2="655" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="400" y="648" text-anchor="middle" font-size="10.5">13. GET /api/tts/audio/{filename} [Range: bytes=0-102400]</text>

  <line x1="705" y1="680" x2="1090" y2="680" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="900" y="675" text-anchor="middle" font-size="10">14. Đọc phân đoạn MP3 từ volume</text>

  <line x1="705" y1="710" x2="110" y2="710" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>
  <text x="400" y="703" text-anchor="middle" font-size="10.5">15. HTTP 206 Partial Content (Audio bắt đầu phát dưới 1.5s)</text>
</svg>
`;

const diagrams = [
  { id: 'hinh_3_1_system_context', svg: diagram3_1_svg, title: 'Hình 3.1: System Context Diagram' },
  { id: 'hinh_3_2_overall_use_case', svg: diagram3_2_svg, title: 'Hình 3.2: Overall Use Case Diagram' },
  { id: 'hinh_3_3_uc_tourist_subsystem', svg: diagram3_3_svg, title: 'Hình 3.3: Tourist Subsystem Use Case' },
  { id: 'hinh_3_4_uc_user_order_subsystem', svg: diagram3_4_svg, title: 'Hình 3.4: User & Order Subsystem Use Case' },
  { id: 'hinh_3_5_uc_admin_subsystem', svg: diagram3_5_svg, title: 'Hình 3.5: Admin Subsystem Use Case' },
  { id: 'hinh_3_6_uc_background_subsystem', svg: diagram3_6_svg, title: 'Hình 3.6: Background Automation Subsystem Use Case' },
  { id: 'hinh_3_7_activity_gps_narration', svg: diagram3_7_svg, title: 'Hình 3.7: Activity Diagram GPS Narration' },
  { id: 'hinh_3_8_activity_order_payment', svg: diagram3_8_svg, title: 'Hình 3.8: Activity Diagram Order & Payment' },
  { id: 'hinh_3_9_sequence_auth_token_rotation', svg: diagram3_9_svg, title: 'Hình 3.9: Sequence Diagram Auth & Token Rotation' },
  { id: 'hinh_3_10_sequence_translation_tts_pipeline', svg: diagram3_10_svg, title: 'Hình 3.10: Sequence Diagram Translation & TTS Pipeline' },
];

async function main() {
  console.log('Rendering 10 Academic B&W Diagrams via Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 1200 });

  for (const diag of diagrams) {
    console.log(`Rendering ${diag.title}...`);
    // Save SVG file
    const svgPath = path.join(outDir, `${diag.id}.svg`);
    fs.writeFileSync(svgPath, diag.svg, 'utf8');

    // Render to PNG
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#ffffff;display:flex;justify-content:center;">${diag.svg}</body></html>`);
    const el = await page.$('svg');
    const buf = await el.screenshot();
    const pngPath = path.join(outDir, `${diag.id}.png`);
    fs.writeFileSync(pngPath, buf);
    console.log(`Saved: ${pngPath}`);
  }

  await browser.close();
  console.log('Successfully generated and rendered all 10 Academic B&W Diagrams!');
}

main().catch(err => {
  console.error('Error rendering diagrams:', err);
  process.exit(1);
});
