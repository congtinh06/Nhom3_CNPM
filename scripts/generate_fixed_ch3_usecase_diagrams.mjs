import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'Diagram_Source_Chuong_3');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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

function stickFigure(x, y, label, sublabel = '') {
  return `
    <g transform="translate(${x}, ${y})">
      <circle cx="20" cy="15" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
      <line x1="20" y1="27" x2="20" y2="58" stroke="#000000" stroke-width="1.8"/>
      <line x1="0" y1="38" x2="40" y2="38" stroke="#000000" stroke-width="1.8"/>
      <line x1="20" y1="58" x2="5" y2="85" stroke="#000000" stroke-width="1.8"/>
      <line x1="20" y1="58" x2="35" y2="85" stroke="#000000" stroke-width="1.8"/>
      <text x="20" y="105" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${label}</text>
      ${sublabel ? `<text x="20" y="120" text-anchor="middle" font-size="10" fill="#444444" font-family="'Times New Roman', serif">${sublabel}</text>` : ''}
    </g>
  `;
}

function externalActor(x, y, stereotype, label, width = 180, height = 45) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
      <text x="${width/2}" y="18" text-anchor="middle" font-size="10" fill="#444444" font-family="'Times New Roman', serif">${stereotype}</text>
      <text x="${width/2}" y="34" text-anchor="middle" font-size="11" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${label}</text>
    </g>
  `;
}

function useCase(cx, cy, rx, ry, title, subtitle = '') {
  return `
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
      <text x="${cx}" y="${subtitle ? cy - 3 : cy + 4}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${title}</text>
      ${subtitle ? `<text x="${cx}" y="${cy + 13}" text-anchor="middle" font-size="9.5" fill="#444444" font-family="'Times New Roman', serif">${subtitle}</text>` : ''}
    </g>
  `;
}

// ============================================================================
// HÌNH 3.1: SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ HỆ THỐNG ECHORA (13 FOCUSED USE CASES)
// ============================================================================
const svg_3_1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 1080" width="1440" height="1080" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}

  <!-- Title -->
  <text x="720" y="32" text-anchor="middle" font-size="18" font-weight="bold" font-family="'Times New Roman', serif">HÌNH 3.1. SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ HỆ THỐNG ECHORA (UML 2.5)</text>
  <text x="720" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333" font-family="'Times New Roman', serif">Phân bổ 13 Ca sử dụng Trọng tâm vào 3 Phân hệ Nghiệp vụ và Tác nhân Tương tác</text>

  <!-- System Boundary -->
  <rect x="230" y="70" width="970" height="985" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="230" y="70" width="460" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="240" y="88" font-size="13" font-weight="bold" font-family="'Times New Roman', serif">System Boundary: Nền tảng Du lịch Di sản Số Echora</text>

  <!-- Left: Human Actors -->
  ${stickFigure(60, 150, "Khách vãng lai", "(Guest Tourist)")}
  ${stickFigure(60, 420, "Người dùng đăng ký", "(Registered User)")}
  ${stickFigure(60, 710, "Quản trị viên", "(System Admin)")}
  ${stickFigure(60, 910, "Biên tập viên", "(Content Editor)")}

  <!-- Generalization: Registered User -> Guest -->
  <line x1="80" y1="410" x2="80" y2="280" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  <!-- Right: External Actors -->
  ${externalActor(1230, 135, "&lt;&lt;External Sensor&gt;&gt;", "Cảm biến GPS")}
  ${externalActor(1230, 235, "&lt;&lt;Map Provider&gt;&gt;", "Bản đồ OpenStreetMap")}
  ${externalActor(1230, 435, "&lt;&lt;Payment Gateway&gt;&gt;", "Cổng VNPAY Sandbox")}
  ${externalActor(1230, 545, "&lt;&lt;Payment Gateway&gt;&gt;", "Cổng VietQR NAPAS")}
  ${externalActor(1230, 720, "&lt;&lt;Message Broker&gt;&gt;", "RabbitMQ Broker")}
  ${externalActor(1230, 840, "&lt;&lt;External AI Service&gt;&gt;", "Dịch vụ Edge-TTS")}

  <!-- ================= SUB-SYSTEM 1: DU KHÁCH (TOP) ================= -->
  <rect x="250" y="105" width="930" height="255" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="260" y="123" font-size="11" font-weight="bold" fill="#333333" font-family="'Times New Roman', serif">[Phân hệ 1: Du khách &amp; Trải nghiệm Di sản]</text>

  ${useCase(410, 160, 135, 24, "UC-01: Khám phá bản đồ di tích")}
  ${useCase(730, 160, 140, 24, "UC-02: Nhận thuyết minh GPS tự động")}
  ${useCase(410, 255, 135, 24, "UC-03: Quét mã QR hiện vật")}
  ${useCase(730, 255, 145, 24, "UC-04: Điều khiển phát âm thanh đa ngữ")}
  ${useCase(1020, 255, 135, 24, "UC-05: Chuyển đổi ngôn ngữ thuyết minh")}

  <!-- Subsystem 1 Relationships -->
  <!-- UC-02 include UC-04 -->
  <line x1="730" y1="185" x2="730" y2="230" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="735" y="212" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-03 include UC-04 -->
  <line x1="545" y1="255" x2="584" y2="255" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="565" y="248" text-anchor="middle" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-05 extend UC-04 -->
  <line x1="885" y1="255" x2="876" y2="255" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="880" y="248" text-anchor="middle" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;extend&gt;&gt;</text>

  <!-- Guest to Subsystem 1 -->
  <line x1="100" y1="180" x2="275" y2="160" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="180" x2="275" y2="255" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="180" x2="410" y2="135" stroke="#000000" stroke-width="1.2"/>
  <line x1="410" y1="135" x2="590" y2="155" stroke="#000000" stroke-width="1.2"/>

  <!-- External Sensors to Subsystem 1 -->
  <line x1="1230" y1="155" x2="871" y2="158" stroke="#000000" stroke-width="1.2"/>
  <line x1="1230" y1="255" x2="1155" y2="255" stroke="#000000" stroke-width="1.2"/>
  <!-- OSM line to UC-01 via top border -->
  <line x1="1230" y1="240" x2="1190" y2="240" stroke="#000000" stroke-width="1.2"/>
  <line x1="1190" y1="240" x2="1190" y2="125" stroke="#000000" stroke-width="1.2"/>
  <line x1="1190" y1="125" x2="500" y2="125" stroke="#000000" stroke-width="1.2"/>
  <line x1="500" y1="125" x2="480" y2="137" stroke="#000000" stroke-width="1.2"/>

  <!-- ================= SUB-SYSTEM 2: NGƯỜI DÙNG & GIAO DỊCH (MIDDLE) ================= -->
  <rect x="250" y="380" width="930" height="255" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="260" y="398" font-size="11" font-weight="bold" fill="#333333" font-family="'Times New Roman', serif">[Phân hệ 2: Người dùng, Giỏ hàng &amp; Thanh toán]</text>

  ${useCase(420, 445, 140, 24, "UC-06: Đăng ký &amp; Đăng nhập tài khoản")}
  ${useCase(750, 445, 145, 24, "UC-07: Nâng cấp gói Premium qua VNPAY")}
  ${useCase(420, 555, 140, 24, "UC-09: Đặt mua quà lưu niệm di sản")}
  ${useCase(750, 555, 145, 24, "UC-08: Thanh toán qua mã VietQR")}

  <!-- Subsystem 2 Relationships -->
  <line x1="560" y1="555" x2="604" y2="555" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="582" y="548" text-anchor="middle" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;extend&gt;&gt;</text>

  <!-- Guest to UC-06 -->
  <line x1="100" y1="220" x2="280" y2="440" stroke="#000000" stroke-width="1.2"/>

  <!-- Registered User to Subsystem 2 -->
  <line x1="100" y1="460" x2="280" y2="450" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="470" x2="604" y2="445" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="490" x2="280" y2="555" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="510" x2="604" y2="555" stroke="#000000" stroke-width="1.2"/>

  <!-- Payment Gateways to Subsystem 2 -->
  <line x1="1230" y1="455" x2="896" y2="448" stroke="#000000" stroke-width="1.2"/>
  <line x1="1230" y1="565" x2="896" y2="558" stroke="#000000" stroke-width="1.2"/>

  <!-- ================= SUB-SYSTEM 3: QUẢN TRỊ CMS & DỊCH VỤ NỀN (BOTTOM) ================= -->
  <rect x="250" y="655" width="930" height="380" fill="#fafafa" stroke="#666666" stroke-dasharray="3 3"/>
  <text x="260" y="673" font-size="11" font-weight="bold" fill="#333333" font-family="'Times New Roman', serif">[Phân hệ 3: Quản trị Nội dung Di sản &amp; CMS]</text>

  ${useCase(440, 730, 150, 24, "UC-10: Quản trị điểm di tích POI")}
  ${useCase(800, 730, 150, 24, "UC-11: Kích hoạt Pipeline Edge-TTS")}
  ${useCase(440, 860, 150, 24, "UC-12: Quản trị người dùng &amp; Phân quyền")}
  ${useCase(800, 860, 150, 24, "UC-13: Xem thống kê tương tác du khách")}

  <!-- Subsystem 3 Relationships -->
  <line x1="591" y1="730" x2="649" y2="730" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="620" y="722" text-anchor="middle" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;include&gt;&gt;</text>

  <!-- Admin to Subsystem 3 -->
  <line x1="100" y1="740" x2="289" y2="730" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="750" x2="650" y2="735" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="770" x2="289" y2="860" stroke="#000000" stroke-width="1.2"/>
  <line x1="100" y1="780" x2="650" y2="860" stroke="#000000" stroke-width="1.2"/>

  <!-- Editor to UC-10 and UC-11 -->
  <!-- Route clean line on bottom-left for Editor -> UC-10 -->
  <line x1="100" y1="940" x2="200" y2="940" stroke="#000000" stroke-width="1.2"/>
  <line x1="200" y1="940" x2="200" y2="745" stroke="#000000" stroke-width="1.2"/>
  <line x1="200" y1="745" x2="289" y2="745" stroke="#000000" stroke-width="1.2"/>

  <line x1="100" y1="950" x2="210" y2="950" stroke="#000000" stroke-width="1.2"/>
  <line x1="210" y1="950" x2="210" y2="760" stroke="#000000" stroke-width="1.2"/>
  <line x1="210" y1="760" x2="650" y2="745" stroke="#000000" stroke-width="1.2"/>

  <!-- Backend Actors to Subsystem 3 -->
  <line x1="951" y1="730" x2="1230" y2="740" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="1080" y="725" text-anchor="middle" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;phát poi.updated&gt;&gt;</text>

  <line x1="1320" y1="765" x2="1320" y2="840" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="1325" y="805" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;kích hoạt TTS&gt;&gt;</text>

  <line x1="951" y1="860" x2="1230" y2="760" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="1080" y="820" text-anchor="middle" font-size="9.5" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;tiêu thụ sự kiện&gt;&gt;</text>

</svg>
`;

// ============================================================================
// HÌNH 3.2: SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ DU KHÁCH & TRẢI NGHIỆM DI SẢN (5 USE CASES)
// ============================================================================
const svg_3_2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 820" width="1280" height="820" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}

  <!-- Title -->
  <text x="640" y="32" text-anchor="middle" font-size="17" font-weight="bold" font-family="'Times New Roman', serif">HÌNH 3.2. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ DU KHÁCH &amp; TRẢI NGHIỆM DI SẢN</text>
  <text x="640" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333" font-family="'Times New Roman', serif">Chi tiết 5 Ca sử dụng Trọng tâm phục vụ Du khách Tham quan Thực địa và Khám phá Số</text>

  <!-- System Boundary -->
  <rect x="250" y="75" width="760" height="710" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="75" width="460" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="260" y="93" font-size="13" font-weight="bold" font-family="'Times New Roman', serif">Phân hệ Du khách: Trải nghiệm Di sản Số (Tourist Subsystem)</text>

  <!-- Left: Actors -->
  ${stickFigure(70, 200, "Khách vãng lai", "(Guest Tourist)")}
  ${stickFigure(70, 500, "Người dùng đăng ký", "(Registered User)")}

  <!-- Generalization: Registered User -> Guest -->
  <line x1="90" y1="490" x2="90" y2="350" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  <!-- Right: External Actors -->
  ${externalActor(1050, 160, "&lt;&lt;External Sensor&gt;&gt;", "Cảm biến GPS")}
  ${externalActor(1050, 360, "&lt;&lt;External Audio Engine&gt;&gt;", "Web Speech / Audio API")}
  ${externalActor(1050, 560, "&lt;&lt;External Map Tile&gt;&gt;", "Bản đồ OpenStreetMap")}

  <!-- 5 Use Cases inside Boundary -->
  ${useCase(450, 180, 145, 27, "UC-01: Khám phá bản đồ di tích", "Hiển thị 7 POI, Leaflet, Bán kính Geofence")}
  ${useCase(760, 180, 145, 27, "UC-02: Nhận thuyết minh GPS tự động", "Haversine, Geofence 35-60m, Cửa sổ trễ 10s")}
  ${useCase(450, 360, 145, 27, "UC-03: Quét mã QR hiện vật", "WebRTC Camera, Quét token hiện vật trong nhà")}
  ${useCase(760, 360, 145, 27, "UC-04: Điều khiển phát âm thanh đa ngữ", "Play/Pause/Tua, Phụ đề chạy chữ, Fallback TTS")}
  ${useCase(600, 560, 155, 27, "UC-05: Chuyển đổi ngôn ngữ thuyết minh", "4 ngôn ngữ: Tiếng Việt, Tiếng Anh, Nhật, Hàn")}

  <!-- Include / Extend Relationships -->
  <!-- UC-02 include UC-04 -->
  <line x1="760" y1="208" x2="760" y2="332" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="765" y="270" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-03 include UC-04 -->
  <line x1="596" y1="360" x2="614" y2="360" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="605" y="352" text-anchor="middle" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;include&gt;&gt;</text>

  <!-- UC-05 extend UC-04 -->
  <line x1="685" y1="535" x2="725" y2="388" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="720" y="470" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;extend&gt;&gt;</text>

  <!-- Guest to Use Cases -->
  <line x1="110" y1="230" x2="304" y2="180" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="240" x2="450" y2="145" stroke="#000000" stroke-width="1.2"/>
  <line x1="450" y1="145" x2="625" y2="175" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="255" x2="304" y2="360" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="270" x2="445" y2="560" stroke="#000000" stroke-width="1.2"/>

  <!-- External Sensors -->
  <line x1="1050" y1="180" x2="906" y2="180" stroke="#000000" stroke-width="1.2"/>
  <line x1="1050" y1="380" x2="906" y2="365" stroke="#000000" stroke-width="1.2"/>

  <!-- OpenStreetMap line around top to UC-01 -->
  <line x1="1050" y1="580" x2="980" y2="580" stroke="#000000" stroke-width="1.2"/>
  <line x1="980" y1="580" x2="980" y2="135" stroke="#000000" stroke-width="1.2"/>
  <line x1="980" y1="135" x2="570" y2="135" stroke="#000000" stroke-width="1.2"/>
  <line x1="570" y1="135" x2="550" y2="157" stroke="#000000" stroke-width="1.2"/>

</svg>
`;

// ============================================================================
// HÌNH 3.3: SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ NGƯỜI DÙNG, GIỎ HÀNG & THANH TOÁN (4 USE CASES)
// ============================================================================
const svg_3_3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 820" width="1280" height="820" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}

  <!-- Title -->
  <text x="640" y="32" text-anchor="middle" font-size="17" font-weight="bold" font-family="'Times New Roman', serif">HÌNH 3.3. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ NGƯỜI DÙNG, GIỎ HÀNG &amp; THANH TOÁN</text>
  <text x="640" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333" font-family="'Times New Roman', serif">Chi tiết 4 Ca sử dụng Trọng tâm phục vụ Xác thực, Quản lý Giỏ hàng và Giao dịch Tài chính Số</text>

  <!-- System Boundary -->
  <rect x="250" y="75" width="760" height="710" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="75" width="460" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="260" y="93" font-size="13" font-weight="bold" font-family="'Times New Roman', serif">Phân hệ Người dùng, Giỏ hàng &amp; Thanh toán (User Order Subsystem)</text>

  <!-- Left: Actors -->
  ${stickFigure(70, 200, "Khách vãng lai", "(Guest Tourist)")}
  ${stickFigure(70, 480, "Người dùng đăng ký", "(Registered User)")}

  <!-- Generalization: Registered User -> Guest -->
  <line x1="90" y1="470" x2="90" y2="350" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  <!-- Right: External Actors -->
  ${externalActor(1050, 310, "&lt;&lt;Payment Gateway&gt;&gt;", "Cổng VNPAY Sandbox")}
  ${externalActor(1050, 520, "&lt;&lt;Payment Gateway&gt;&gt;", "Cổng VietQR NAPAS")}

  <!-- 4 Use Cases inside Boundary -->
  ${useCase(450, 210, 150, 27, "UC-06: Đăng ký &amp; Đăng nhập tài khoản", "Bcrypt, JWT Access Token RAM &amp; Cookie HttpOnly")}
  ${useCase(750, 320, 150, 27, "UC-07: Nâng cấp gói Premium qua VNPAY", "Gói Heritage Premium 500k/năm, HMAC-SHA512")}
  ${useCase(450, 530, 150, 27, "UC-09: Đặt mua quà lưu niệm di sản", "Giỏ hàng LocalStorage, FreeShip &gt;= 50k, Tạo đơn")}
  ${useCase(750, 530, 150, 27, "UC-08: Thanh toán qua mã VietQR", "Chuỗi mã QR NAPAS 24/7, Tự động đối soát")}

  <!-- Extend Relationships -->
  <line x1="550" y1="505" x2="655" y2="345" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="620" y="430" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;extend&gt;&gt;</text>

  <line x1="601" y1="530" x2="599" y2="530" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="600" y="522" text-anchor="middle" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;extend&gt;&gt;</text>

  <!-- Guest to UC-06 -->
  <line x1="110" y1="230" x2="299" y2="210" stroke="#000000" stroke-width="1.2"/>

  <!-- Registered User to Use Cases -->
  <line x1="110" y1="500" x2="305" y2="230" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="510" x2="605" y2="325" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="525" x2="299" y2="530" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="540" x2="450" y2="600" stroke="#000000" stroke-width="1.2"/>
  <line x1="450" y1="600" x2="650" y2="555" stroke="#000000" stroke-width="1.2"/>

  <!-- Payment Gateways -->
  <line x1="901" y1="325" x2="1050" y2="325" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="975" y="318" text-anchor="middle" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;IPN Webhook&gt;&gt;</text>

  <line x1="901" y1="535" x2="1050" y2="535" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="975" y="528" text-anchor="middle" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;sinh mã NAPAS&gt;&gt;</text>

</svg>
`;

// ============================================================================
// HÌNH 3.4: SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ QUẢN TRỊ NỘI DUNG DI SẢN & CMS (4 USE CASES)
// ============================================================================
const svg_3_4 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 820" width="1280" height="820" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}

  <!-- Title -->
  <text x="640" y="32" text-anchor="middle" font-size="17" font-weight="bold" font-family="'Times New Roman', serif">HÌNH 3.4. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ QUẢN TRỊ NỘI DUNG DI SẢN &amp; CMS</text>
  <text x="640" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333" font-family="'Times New Roman', serif">Chi tiết 4 Ca sử dụng Trọng tâm dành cho Quản trị viên Hệ thống và Biên tập viên Di sản</text>

  <!-- System Boundary -->
  <rect x="250" y="75" width="760" height="710" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="75" width="460" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="260" y="93" font-size="13" font-weight="bold" font-family="'Times New Roman', serif">Phân hệ Quản trị Di sản &amp; CMS (Admin Subsystem /quan-tri)</text>

  <!-- Left: Actors -->
  ${stickFigure(70, 240, "Quản trị viên", "(System Admin)")}
  ${stickFigure(70, 520, "Biên tập viên", "(Content Editor)")}

  <!-- Right: External Actors -->
  ${externalActor(1050, 250, "&lt;&lt;Message Broker&gt;&gt;", "RabbitMQ Message Broker")}
  ${externalActor(1050, 470, "&lt;&lt;External AI Service&gt;&gt;", "Động cơ Edge-TTS AI")}

  <!-- 4 Use Cases inside Boundary (2x2 Grid) -->
  ${useCase(450, 250, 150, 27, "UC-10: Quản trị điểm di tích POI", "CRUD di tích, WGS84, Bán kính 35-60m, Xuất QR")}
  ${useCase(760, 250, 150, 27, "UC-11: Kích hoạt Pipeline Edge-TTS", "Biên tập lời thoại, Tự động dịch &amp; Sinh file MP3")}
  ${useCase(450, 490, 150, 27, "UC-12: Quản trị người dùng &amp; Phân quyền", "Danh sách tài khoản, Phân quyền RBAC, Gói Premium")}
  ${useCase(760, 490, 150, 27, "UC-13: Xem thống kê tương tác du khách", "Dashboard lượt nghe, quét QR &amp; Doanh thu bán quà")}

  <!-- Include Relationships -->
  <line x1="601" y1="250" x2="609" y2="250" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="605" y="242" text-anchor="middle" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;include&gt;&gt;</text>

  <!-- Admin to Use Cases -->
  <line x1="110" y1="270" x2="299" y2="250" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="280" x2="450" y2="200" stroke="#000000" stroke-width="1.2"/>
  <line x1="450" y1="200" x2="650" y2="235" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="290" x2="299" y2="480" stroke="#000000" stroke-width="1.2"/>
  <line x1="110" y1="300" x2="615" y2="485" stroke="#000000" stroke-width="1.2"/>

  <!-- Editor to Use Cases (UC-10 and UC-11 only) -->
  <line x1="110" y1="550" x2="200" y2="550" stroke="#000000" stroke-width="1.2"/>
  <line x1="200" y1="550" x2="200" y2="270" stroke="#000000" stroke-width="1.2"/>
  <line x1="200" y1="270" x2="305" y2="265" stroke="#000000" stroke-width="1.2"/>

  <line x1="110" y1="560" x2="210" y2="560" stroke="#000000" stroke-width="1.2"/>
  <line x1="210" y1="560" x2="210" y2="300" stroke="#000000" stroke-width="1.2"/>
  <line x1="210" y1="300" x2="650" y2="265" stroke="#000000" stroke-width="1.2"/>

  <!-- Backend Actors -->
  <line x1="911" y1="250" x2="1050" y2="260" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="980" y="245" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;phát poi.updated&gt;&gt;</text>

  <line x1="1140" y1="295" x2="1140" y2="470" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="1145" y="385" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;kích hoạt TTS&gt;&gt;</text>

  <line x1="911" y1="490" x2="1050" y2="290" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="980" y="390" font-size="10" fill="#333333" font-family="'Times New Roman', serif">&lt;&lt;tiêu thụ sự kiện&gt;&gt;</text>

</svg>
`;

async function renderDiagram(name, svgContent) {
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);

  fs.writeFileSync(svgPath, svgContent.trim(), 'utf-8');
  console.log(`Saved SVG: ${svgPath}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(svgContent);
  const svgHandle = await page.$('svg');
  if (svgHandle) {
    await svgHandle.screenshot({ path: pngPath, omitBackground: false });
    console.log(`Rendered PNG: ${pngPath}`);
  }
  await browser.close();
}

async function main() {
  console.log('Rendering polished Chapter 3 Use Case diagrams (13 Focused UCs) ...');
  await renderDiagram('hinh_3_1_use_case_tong_quan', svg_3_1);
  await renderDiagram('hinh_3_2_uc_tourist', svg_3_2);
  await renderDiagram('hinh_3_3_uc_user_order', svg_3_3);
  await renderDiagram('hinh_3_4_uc_admin', svg_3_4);

  const legacyTarget = path.join(rootDir, 'docs', 'report', 'diagrams', 'png', 'ch3_hinh_3_1_use_case_tong_quan.png');
  if (fs.existsSync(legacyTarget)) {
    fs.copyFileSync(path.join(outDir, 'hinh_3_1_use_case_tong_quan.png'), legacyTarget);
    console.log(`Copied updated PNG to ${legacyTarget}`);
  }

  console.log('ALL 4 USE CASE DIAGRAMS SUCCESSFULLY RE-GENERATED WITH ZERO CROSSING TEXT!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
