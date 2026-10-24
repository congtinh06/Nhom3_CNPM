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

// 1. SƠ ĐỒ USE CASE TỔNG THỂ (UML 2.5) - ACADEMIC BLACK & WHITE
const useCaseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 980" width="1400" height="980" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
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

  <!-- TITLE -->
  <text x="700" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 3.1. SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ HỆ THỐNG (USE CASE DIAGRAM)</text>
  <text x="700" y="52" text-anchor="middle" font-size="13" font-style="italic" fill="#333333">Hệ thống Nền tảng Hướng dẫn viên Du lịch Đa ngôn ngữ Tự động Echora (Chuẩn UML 2.5)</text>

  <!-- SYSTEM BOUNDARY -->
  <rect x="250" y="70" width="880" height="880" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="70" width="380" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="260" y="88" font-size="13" font-weight="bold" fill="#000000">System Boundary: Nền tảng Du lịch Số Echora</text>

  <!-- LEFT ACTORS -->
  <!-- Actor 1: Khách vãng lai -->
  <g transform="translate(100, 180)">
    <circle cx="20" cy="15" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="27" x2="20" y2="58" stroke="#000000" stroke-width="1.8"/>
    <line x1="0" y1="38" x2="40" y2="38" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="58" x2="5" y2="85" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="58" x2="35" y2="85" stroke="#000000" stroke-width="1.8"/>
    <text x="20" y="105" text-anchor="middle" font-size="13" font-weight="bold" fill="#000000">Khách vãng lai</text>
    <text x="20" y="120" text-anchor="middle" font-size="11" fill="#444444">(Guest / Visitor)</text>
  </g>

  <!-- Actor 2: Người dùng đăng ký -->
  <g transform="translate(100, 430)">
    <circle cx="20" cy="15" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="27" x2="20" y2="58" stroke="#000000" stroke-width="1.8"/>
    <line x1="0" y1="38" x2="40" y2="38" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="58" x2="5" y2="85" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="58" x2="35" y2="85" stroke="#000000" stroke-width="1.8"/>
    <text x="20" y="105" text-anchor="middle" font-size="13" font-weight="bold" fill="#000000">Người dùng đăng ký</text>
    <text x="20" y="120" text-anchor="middle" font-size="11" fill="#444444">(Registered User)</text>
  </g>

  <!-- Generalization: Registered User inherits Guest -->
  <line x1="120" y1="420" x2="120" y2="310" stroke="#000000" stroke-width="1.5" marker-end="url(#genArrow)"/>

  <!-- Actor 3: Quản trị viên -->
  <g transform="translate(100, 720)">
    <circle cx="20" cy="15" r="12" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="27" x2="20" y2="58" stroke="#000000" stroke-width="1.8"/>
    <line x1="0" y1="38" x2="40" y2="38" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="58" x2="5" y2="85" stroke="#000000" stroke-width="1.8"/>
    <line x1="20" y1="58" x2="35" y2="85" stroke="#000000" stroke-width="1.8"/>
    <text x="20" y="105" text-anchor="middle" font-size="13" font-weight="bold" fill="#000000">Quản trị viên</text>
    <text x="20" y="120" text-anchor="middle" font-size="11" fill="#444444">(Administrator)</text>
  </g>

  <!-- RIGHT ACTORS (Secondary / System Actors) -->
  <!-- Actor 4: GPS Device -->
  <g transform="translate(1220, 140)">
    <rect x="0" y="0" width="120" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
    <text x="60" y="18" text-anchor="middle" font-size="11" fill="#444444">&lt;&lt;System&gt;&gt;</text>
    <text x="60" y="34" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">Thiết bị GPS</text>
  </g>

  <!-- Actor 5: Translation & TTS Engine -->
  <g transform="translate(1220, 310)">
    <rect x="0" y="0" width="140" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
    <text x="70" y="18" text-anchor="middle" font-size="11" fill="#444444">&lt;&lt;External Service&gt;&gt;</text>
    <text x="70" y="34" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">MyMemory / Edge-TTS</text>
  </g>

  <!-- Actor 6: VNPAY Gateway -->
  <g transform="translate(1220, 480)">
    <rect x="0" y="0" width="130" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
    <text x="65" y="18" text-anchor="middle" font-size="11" fill="#444444">&lt;&lt;Payment Gateway&gt;&gt;</text>
    <text x="65" y="34" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">Cổng VNPAY / VietQR</text>
  </g>

  <!-- Actor 7: RabbitMQ Broker -->
  <g transform="translate(1220, 680)">
    <rect x="0" y="0" width="125" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1.5"/>
    <text x="62" y="18" text-anchor="middle" font-size="11" fill="#444444">&lt;&lt;Message Broker&gt;&gt;</text>
    <text x="62" y="34" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">RabbitMQ Broker</text>
  </g>

  <!-- ================= SUB-SYSTEM 1: DU KHÁCH (TOP) ================= -->
  <!-- UC01: Khám phá bản đồ di tích -->
  <ellipse cx="420" cy="140" rx="100" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="420" y="144" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC01: Khám phá bản đồ di tích</text>

  <!-- UC02: Nghe thuyết minh đa ngữ -->
  <ellipse cx="690" cy="140" rx="105" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="690" y="144" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC02: Nghe thuyết minh đa ngữ</text>

  <!-- UC03: Nhận thuyết minh GPS tự động -->
  <ellipse cx="980" cy="140" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="980" y="144" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC03: Nhận thuyết minh GPS tự động</text>

  <!-- UC04: Quét mã QR di sản -->
  <ellipse cx="690" cy="225" rx="95" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="690" y="229" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC04: Quét mã QR di sản</text>

  <!-- UC05: Duyệt quà lưu niệm & Tin tức -->
  <ellipse cx="420" cy="225" rx="105" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="420" y="229" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC05: Duyệt quà lưu niệm &amp; tin tức</text>

  <!-- UC06: Đăng ký / Đăng nhập tài khoản -->
  <ellipse cx="420" cy="310" rx="110" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="420" y="314" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC06: Đăng ký / Đăng nhập tài khoản</text>

  <!-- ================= SUB-SYSTEM 2: NGƯỜI DÙNG ĐĂNG KÝ (MIDDLE) ================= -->
  <!-- UC07: Nâng cấp gói Premium ngoại ngữ -->
  <ellipse cx="440" cy="420" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="424" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC07: Nâng cấp gói Premium</text>

  <!-- UC08: Đặt hàng quà lưu niệm -->
  <ellipse cx="440" cy="495" rx="105" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="499" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC08: Đặt hàng quà lưu niệm</text>

  <!-- UC09: Thanh toán VNPAY / VietQR -->
  <ellipse cx="760" cy="460" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="760" y="464" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC09: Thanh toán VNPAY / VietQR</text>

  <!-- UC10: Quản lý hồ sơ & Lịch sử đơn hàng -->
  <ellipse cx="440" cy="570" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="574" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC10: Quản lý hồ sơ &amp; đơn hàng</text>

  <!-- ================= SUB-SYSTEM 3: QUẢN TRỊ VIÊN (BOTTOM) ================= -->
  <!-- UC11: Quản lý điểm tham quan (POI) -->
  <ellipse cx="440" cy="670" rx="110" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="674" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC11: Quản lý điểm tham quan (POI)</text>

  <!-- UC12: Quản lý lộ trình & Trạm dừng -->
  <ellipse cx="440" cy="740" rx="110" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="744" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC12: Quản lý lộ trình tour</text>

  <!-- UC13: Quản lý quà lưu niệm & Tin tức -->
  <ellipse cx="440" cy="810" rx="110" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="814" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC13: Quản lý quà lưu niệm &amp; tin tức</text>

  <!-- UC14: Quản lý tài khoản & Phân quyền -->
  <ellipse cx="440" cy="880" rx="110" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="440" y="884" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC14: Quản lý người dùng &amp; quyền</text>

  <!-- UC15: Xem thống kê & Phân tích lượt nghe -->
  <ellipse cx="760" cy="780" rx="120" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="760" y="784" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC15: Xem báo cáo thống kê du lịch</text>

  <!-- UC16: Xử lý đơn hàng & Xác nhận giao hàng -->
  <ellipse cx="760" cy="860" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="760" y="864" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC16: Xử lý đơn hàng &amp; giao hàng</text>

  <!-- UC17: Tự động dịch & Tổng hợp Edge-TTS -->
  <ellipse cx="980" cy="670" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="980" y="674" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC17: Tự động dịch &amp; tạo âm thanh</text>

  <!-- UC18: Thu thập sự kiện du lịch bất đồng bộ -->
  <ellipse cx="980" cy="270" rx="115" ry="25" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="980" y="274" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000">UC18: Thu thập sự kiện nghe / quét</text>

  <!-- ================= ASSOCIATIONS & RELATIONSHIPS ================= -->
  <!-- Khách vãng lai connections -->
  <line x1="140" y1="210" x2="320" y2="140" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="210" x2="585" y2="140" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="210" x2="315" y2="225" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="210" x2="310" y2="310" stroke="#000000" stroke-width="1.2"/>

  <!-- Registered User connections -->
  <line x1="140" y1="460" x2="325" y2="420" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="460" x2="335" y2="495" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="460" x2="325" y2="570" stroke="#000000" stroke-width="1.2"/>

  <!-- Admin connections -->
  <line x1="140" y1="750" x2="330" y2="670" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="750" x2="330" y2="740" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="750" x2="330" y2="810" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="750" x2="330" y2="880" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="750" x2="645" y2="780" stroke="#000000" stroke-width="1.2"/>
  <line x1="140" y1="750" x2="645" y2="860" stroke="#000000" stroke-width="1.2"/>

  <!-- External Actor connections -->
  <line x1="1220" y1="160" x2="1095" y2="140" stroke="#000000" stroke-width="1.2"/>
  <line x1="1220" y1="330" x2="1095" y2="670" stroke="#000000" stroke-width="1.2"/>
  <line x1="1220" y1="500" x2="875" y2="460" stroke="#000000" stroke-width="1.2"/>
  <line x1="1220" y1="700" x2="1095" y2="670" stroke="#000000" stroke-width="1.2"/>
  <line x1="1220" y1="700" x2="1095" y2="270" stroke="#000000" stroke-width="1.2"/>

  <!-- INCLUDES & EXTENDS -->
  <!-- UC03 include UC02 -->
  <line x1="865" y1="140" x2="795" y2="140" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="830" y="132" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC04 include UC02 -->
  <line x1="690" y1="200" x2="690" y2="165" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="645" y="185" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC07 include UC09 -->
  <line x1="550" y1="435" x2="650" y2="455" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="600" y="438" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC08 include UC09 -->
  <line x1="540" y1="485" x2="650" y2="465" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="595" y="488" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;include&gt;&gt;</text>

  <!-- UC11 triggers UC17 (include / dependency) -->
  <line x1="550" y1="670" x2="865" y2="670" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="700" y="662" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;include / event&gt;&gt;</text>

  <!-- UC03 & UC04 trigger UC18 -->
  <line x1="980" y1="165" x2="980" y2="245" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="1035" y="210" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;include&gt;&gt;</text>
</svg>
`;

// 2. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) - UC03: KÍCH HOẠT THUYẾT MINH GPS TỰ ĐỘNG
const activityGpsSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 950" width="1200" height="950" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <defs>
    <marker id="actArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- TITLE -->
  <text x="600" y="30" text-anchor="middle" font-size="17" font-weight="bold" fill="#000000">HÌNH 3.2. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — UC03: THUYẾT MINH GPS TỰ ĐỘNG</text>
  <text x="600" y="50" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Định vị Không gian, Kiểm tra Geofence, Truyền phát Đa ngữ và Fallback Hai tầng</text>

  <!-- SWIMLANES -->
  <!-- Lane 1: Du khách -->
  <rect x="50" y="70" width="220" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="50" y="70" width="220" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="160" y="90" text-anchor="middle" font-size="13" font-weight="bold">Du khách (Client UI)</text>

  <!-- Lane 2: Hook useAutoNarration -->
  <rect x="270" y="70" width="280" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="270" y="70" width="280" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="410" y="90" text-anchor="middle" font-size="13" font-weight="bold">Frontend (useAutoNarration)</text>

  <!-- Lane 3: Gateway & Backend -->
  <rect x="550" y="70" width="340" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="550" y="70" width="340" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="720" y="90" text-anchor="middle" font-size="13" font-weight="bold">API Gateway &amp; TTS Service</text>

  <!-- Lane 4: Analytics Service -->
  <rect x="890" y="70" width="260" height="850" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <rect x="890" y="70" width="260" height="30" fill="#f5f5f5" stroke="#000000" stroke-width="1.2"/>
  <text x="1020" y="90" text-anchor="middle" font-size="13" font-weight="bold">Analytics Service (RabbitMQ)</text>

  <!-- START NODE -->
  <circle cx="160" cy="130" r="10" fill="#000000"/>
  <line x1="160" y1="140" x2="160" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- Action 1: Bật thuyết minh tự động -->
  <rect x="80" y="170" width="160" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="160" y="195" text-anchor="middle" font-size="11">Bật "Thuyết minh tự động"</text>
  <line x1="160" y1="210" x2="160" y2="240" stroke="#000000" stroke-width="1.5"/>
  <line x1="160" y1="240" x2="350" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- Action 2: Lấy GPS liên tục qua watchPosition -->
  <rect x="350" y="220" width="160" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="430" y="245" text-anchor="middle" font-size="11">Theo dõi tọa độ GPS thiết bị</text>
  <line x1="430" y1="260" x2="430" y2="290" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- Action 3: Tính khoảng cách Haversine -->
  <rect x="350" y="290" width="160" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="430" y="315" text-anchor="middle" font-size="11">Tính khoảng cách Haversine</text>
  <line x1="430" y1="330" x2="430" y2="360" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- Decision 1: Khoảng cách <= Bán kính Geofence? -->
  <polygon points="430,360 480,385 430,410 380,385" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="430" y="388" text-anchor="middle" font-size="10">Vào Geofence?</text>

  <!-- Loop back if No -->
  <line x1="480" y1="385" x2="525" y2="385" stroke="#000000" stroke-width="1.2"/>
  <line x1="525" y1="385" x2="525" y2="240" stroke="#000000" stroke-width="1.2"/>
  <line x1="525" y1="240" x2="510" y2="240" stroke="#000000" stroke-width="1.2" marker-end="url(#actArrow)"/>
  <text x="500" y="375" font-size="10" font-style="italic">[Không]</text>

  <!-- Yes -> Decision 2: Đã phát hoặc trong cooldown? -->
  <line x1="430" y1="410" x2="430" y2="445" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>
  <text x="435" y="425" font-size="10" font-style="italic">[Có (d &lt;= r)]</text>

  <polygon points="430,445 480,470 430,495 380,470" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="430" y="473" text-anchor="middle" font-size="10">Đã phát / Chờ?</text>

  <!-- Ignore if already played -->
  <line x1="380" y1="470" x2="310" y2="470" stroke="#000000" stroke-width="1.2"/>
  <line x1="310" y1="470" x2="310" y2="240" stroke="#000000" stroke-width="1.2"/>
  <line x1="310" y1="240" x2="350" y2="240" stroke="#000000" stroke-width="1.2" marker-end="url(#actArrow)"/>
  <text x="330" y="460" font-size="10" font-style="italic">[Bỏ qua]</text>

  <!-- Chưa phát -> Action 4: Ghi nhận autoPlayedSet & Khởi tạo phát -->
  <line x1="430" y1="495" x2="430" y2="530" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>
  <text x="435" y="510" font-size="10" font-style="italic">[Chưa phát]</text>

  <rect x="340" y="530" width="180" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="430" y="555" text-anchor="middle" font-size="11">Ghi nhận Set &amp; kiểm tra file MP3</text>
  <line x1="430" y1="570" x2="430" y2="600" stroke="#000000" stroke-width="1.5"/>
  <line x1="430" y1="600" x2="620" y2="600" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- Decision 3: File Edge-TTS có sẵn trên máy chủ? -->
  <polygon points="700,580 750,605 700,630 650,605" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="700" y="608" text-anchor="middle" font-size="10">Có file MP3?</text>

  <!-- Yes -> Kiểm tra quyền Premium & Stream Range HTTP 206 -->
  <line x1="750" y1="605" x2="780" y2="605" stroke="#000000" stroke-width="1.5"/>
  <line x1="780" y1="605" x2="780" y2="640" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>
  <text x="755" y="595" font-size="10" font-style="italic">[Có file]</text>

  <rect x="690" y="640" width="180" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="780" y="660" text-anchor="middle" font-size="11">AudioEntitlementFilter duyệt</text>
  <text x="780" y="674" text-anchor="middle" font-size="10">Stream file qua HTTP 206</text>
  <line x1="780" y1="680" x2="780" y2="720" stroke="#000000" stroke-width="1.5"/>
  <line x1="780" y1="720" x2="230" y2="720" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- No -> Fallback sang Web Speech API trên điện thoại -->
  <line x1="650" y1="605" x2="520" y2="605" stroke="#000000" stroke-width="1.5"/>
  <line x1="520" y1="605" x2="520" y2="650" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>
  <text x="560" y="595" font-size="10" font-style="italic">[Không có file]</text>

  <rect x="430" y="650" width="180" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="520" y="670" text-anchor="middle" font-size="11">Kích hoạt Web Speech API</text>
  <text x="520" y="684" text-anchor="middle" font-size="10">(Đọc văn bản offline cục bộ)</text>
  <line x1="520" y1="690" x2="520" y2="720" stroke="#000000" stroke-width="1.5"/>
  <line x1="520" y1="720" x2="230" y2="720" stroke="#000000" stroke-width="1.5"/>

  <!-- Action 5: Du khách nghe & cuộn chữ đồng bộ -->
  <rect x="70" y="700" width="160" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="720" text-anchor="middle" font-size="11">Phát âm thanh thuyết minh</text>
  <text x="150" y="734" text-anchor="middle" font-size="10">&amp; Cuộn phụ đề theo câu</text>

  <!-- Ghi nhận sự kiện Analytics bất đồng bộ -->
  <line x1="150" y1="740" x2="150" y2="780" stroke="#000000" stroke-width="1.5"/>
  <line x1="150" y1="780" x2="940" y2="780" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <rect x="940" y="760" width="180" height="40" rx="8" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="1030" y="780" text-anchor="middle" font-size="11">Gửi sự kiện AUDIO_PLAY</text>
  <text x="1030" y="794" text-anchor="middle" font-size="10">vào RabbitMQ (Rate Limit 60/m)</text>

  <!-- END NODE -->
  <line x1="1030" y1="800" x2="1030" y2="850" stroke="#000000" stroke-width="1.5"/>
  <line x1="1030" y1="850" x2="160" y2="850" stroke="#000000" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <circle cx="160" cy="880" r="14" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="160" cy="880" r="9" fill="#000000"/>
</svg>
`;

// 3. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG PHÂN TÁN (ACADEMIC BLACK & WHITE)
const architectureSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 860" width="1200" height="860" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  <defs>
    <marker id="arcArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
  </defs>

  <!-- TITLE -->
  <text x="600" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 1.1. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG PHÂN TÁN (MICROSERVICES ARCHITECTURE)</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Kiến trúc Microservices, API Gateway, Message Broker và 5 Cơ sở Dữ liệu Cô lập</text>

  <!-- LAYER 1: CLIENT LAYER -->
  <rect x="50" y="75" width="1100" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="95" font-size="13" font-weight="bold">1. CLIENT LAYER (Giao diện Người dùng)</text>
  
  <rect x="180" y="105" width="380" height="42" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="370" y="125" text-anchor="middle" font-size="12" font-weight="bold">Frontend SPA Du khách (React 18 + TS + Leaflet)</text>
  <text x="370" y="140" text-anchor="middle" font-size="10">Web Speech API, AudioContext, Single-Shot Guide Cache (Port: 8088)</text>

  <rect x="640" y="105" width="380" height="42" fill="#f8f8f8" stroke="#000000" stroke-width="1.2"/>
  <text x="830" y="125" text-anchor="middle" font-size="12" font-weight="bold">Admin Web Console (/quan-tri)</text>
  <text x="830" y="140" text-anchor="middle" font-size="10">Quản lý POI, Lộ trình, Quà lưu niệm, Đơn hàng, Thống kê lượt nghe</text>

  <!-- LAYER 2: API GATEWAY -->
  <line x1="600" y1="160" x2="600" y2="195" stroke="#000000" stroke-width="1.5" marker-end="url(#arcArrow)"/>

  <rect x="50" y="195" width="1100" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="215" font-size="13" font-weight="bold">2. API GATEWAY LAYER (Cổng Trung tâm - Spring Cloud Gateway :18080)</text>
  
  <rect x="80" y="225" width="230" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="195" y="244" text-anchor="middle" font-size="11" font-weight="bold">PathGuardFilter</text>
  <text x="195" y="258" text-anchor="middle" font-size="10">Chặn Directory Traversal, XSS</text>

  <rect x="340" y="225" width="230" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="455" y="244" text-anchor="middle" font-size="11" font-weight="bold">Admin / User Auth Filters</text>
  <text x="455" y="258" text-anchor="middle" font-size="10">Kiểm tra JWT HMAC-SHA256</text>

  <rect x="600" y="225" width="230" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="715" y="244" text-anchor="middle" font-size="11" font-weight="bold">AnalyticsRateLimitFilter</text>
  <text x="715" y="258" text-anchor="middle" font-size="10">Giới hạn 60 req/phút/IP</text>

  <rect x="860" y="225" width="260" height="45" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="990" y="244" text-anchor="middle" font-size="11" font-weight="bold">UntrustedHeaderStripFilter</text>
  <text x="990" y="258" text-anchor="middle" font-size="10">Gỡ bỏ X-User-Id / Gắn Internal-Key</text>

  <!-- LAYER 3: MICROSERVICES LAYER -->
  <line x1="600" y1="280" x2="600" y2="315" stroke="#000000" stroke-width="1.5" marker-end="url(#arcArrow)"/>

  <rect x="50" y="315" width="1100" height="150" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="335" font-size="13" font-weight="bold">3. BACKEND MICROSERVICES LAYER (Java 17 / Spring Boot 3.3.4)</text>

  <rect x="70" y="350" width="160" height="95" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="150" y="370" text-anchor="middle" font-size="11" font-weight="bold">auth-service (:8086)</text>
  <text x="150" y="388" text-anchor="middle" font-size="10">• JWT &amp; Refresh Rotation</text>
  <text x="150" y="402" text-anchor="middle" font-size="10">• Google OAuth2 Identity</text>
  <text x="150" y="416" text-anchor="middle" font-size="10">• Đăng nhập mã QR</text>
  <text x="150" y="430" text-anchor="middle" font-size="10">• Chống Brute-Force IP</text>

  <rect x="250" y="350" width="165" height="95" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="332" y="370" text-anchor="middle" font-size="11" font-weight="bold">content-service (:8085)</text>
  <text x="332" y="388" text-anchor="middle" font-size="10">• Điểm tham quan (POI)</text>
  <text x="332" y="402" text-anchor="middle" font-size="10">• Khu vực &amp; Lộ trình tour</text>
  <text x="332" y="416" text-anchor="middle" font-size="10">• Quà lưu niệm &amp; Tin tức</text>
  <text x="332" y="430" text-anchor="middle" font-size="10">• Khóa lạc quan @Version</text>

  <rect x="435" y="350" width="160" height="95" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="515" y="370" text-anchor="middle" font-size="11" font-weight="bold">location-service (:8082)</text>
  <text x="515" y="388" text-anchor="middle" font-size="10">• Tính Haversine R=6.371km</text>
  <text x="515" y="402" text-anchor="middle" font-size="10">• Bounding Box Filter</text>
  <text x="515" y="416" text-anchor="middle" font-size="10">• Giải mã QR Token</text>
  <text x="515" y="430" text-anchor="middle" font-size="10">• Không lưu trữ (Stateless)</text>

  <rect x="615" y="350" width="175" height="95" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="702" y="370" text-anchor="middle" font-size="11" font-weight="bold">translation-tts (:8083)</text>
  <text x="702" y="388" text-anchor="middle" font-size="10">• Pipeline dịch MyMemory</text>
  <text x="702" y="402" text-anchor="middle" font-size="10">• Microsoft Edge-TTS (4 giọng)</text>
  <text x="702" y="416" text-anchor="middle" font-size="10">• AudioEntitlementFilter</text>
  <text x="702" y="430" text-anchor="middle" font-size="10">• Phục vụ stream MP3</text>

  <rect x="810" y="350" width="160" height="95" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="890" y="370" text-anchor="middle" font-size="11" font-weight="bold">order-service (:8087)</text>
  <text x="890" y="388" text-anchor="middle" font-size="10">• Giỏ hàng quà lưu niệm</text>
  <text x="890" y="402" text-anchor="middle" font-size="10">• Gói Premium 500k/365d</text>
  <text x="890" y="416" text-anchor="middle" font-size="10">• Cổng thanh toán VNPAY</text>
  <text x="890" y="430" text-anchor="middle" font-size="10">• Idempotency-Key Header</text>

  <rect x="990" y="350" width="145" height="95" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="1062" y="370" text-anchor="middle" font-size="11" font-weight="bold">analytics (:8081)</text>
  <text x="1062" y="388" text-anchor="middle" font-size="10">• Xếp hàng RabbitMQ</text>
  <text x="1062" y="402" text-anchor="middle" font-size="10">• Ghi nhận SCAN / PLAY</text>
  <text x="1062" y="416" text-anchor="middle" font-size="10">• Tổng hợp tỷ lệ nghe</text>
  <text x="1062" y="430" text-anchor="middle" font-size="10">• Báo cáo quản trị</text>

  <!-- LAYER 4: MESSAGE BROKER & AMQP -->
  <line x1="332" y1="445" x2="332" y2="495" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3"/>
  <line x1="702" y1="445" x2="702" y2="495" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3"/>
  <line x1="1062" y1="445" x2="1062" y2="495" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 3"/>

  <rect x="50" y="495" width="1100" height="75" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="515" font-size="13" font-weight="bold">4. ASYNCHRONOUS MESSAGE BROKER (RabbitMQ 3.13 - Port: 5672 / Dash: 15800)</text>

  <rect x="150" y="525" width="400" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="350" y="545" text-anchor="middle" font-size="11" font-weight="bold">Topic Exchange: echora.topic</text>
  <text x="350" y="556" text-anchor="middle" font-size="10">poi.created, poi.updated, poi.audio.ready, poi.audio.failed</text>

  <rect x="650" y="525" width="400" height="35" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="850" y="545" text-anchor="middle" font-size="11" font-weight="bold">Direct Exchange: echora.analytics</text>
  <text x="850" y="556" text-anchor="middle" font-size="10">analytics.event.queue (Sự kiện du lịch bất đồng bộ)</text>

  <!-- LAYER 5: DATA PERSISTENCE LAYER -->
  <line x1="150" y1="445" x2="150" y2="600" stroke="#000000" stroke-width="1.2"/>
  <line x1="332" y1="570" x2="332" y2="600" stroke="#000000" stroke-width="1.2"/>
  <line x1="702" y1="570" x2="702" y2="600" stroke="#000000" stroke-width="1.2"/>
  <line x1="890" y1="445" x2="890" y2="600" stroke="#000000" stroke-width="1.2"/>
  <line x1="1062" y1="570" x2="1062" y2="600" stroke="#000000" stroke-width="1.2"/>

  <rect x="50" y="600" width="1100" height="100" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="620" font-size="13" font-weight="bold">5. DATA PERSISTENCE LAYER (Microsoft SQL Server 2022 - 5 CSDL Phân lập)</text>

  <rect x="70" y="635" width="190" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="165" y="655" text-anchor="middle" font-size="11" font-weight="bold">echora_auth_db</text>
  <text x="165" y="670" text-anchor="middle" font-size="10">users, refresh_tokens, qr_sessions</text>

  <rect x="290" y="635" width="190" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="385" y="655" text-anchor="middle" font-size="11" font-weight="bold">echora_content_db</text>
  <text x="385" y="670" text-anchor="middle" font-size="10">poi, zone, route, products, news</text>

  <rect x="510" y="635" width="190" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="605" y="655" text-anchor="middle" font-size="11" font-weight="bold">echora_translation_db</text>
  <text x="605" y="670" text-anchor="middle" font-size="10">translation_jobs, audio_cache</text>

  <rect x="730" y="635" width="180" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="820" y="655" text-anchor="middle" font-size="11" font-weight="bold">echora_order_db</text>
  <text x="820" y="670" text-anchor="middle" font-size="10">orders, order_items, payments</text>

  <rect x="940" y="635" width="190" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="1035" y="655" text-anchor="middle" font-size="11" font-weight="bold">echora_analytics_db</text>
  <text x="1035" y="670" text-anchor="middle" font-size="10">analytics_events (SCAN, PLAY)</text>

  <!-- LAYER 6: STORAGE & EXTERNAL SERVICES -->
  <rect x="50" y="730" width="530" height="100" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="65" y="750" font-size="12" font-weight="bold">6A. STORAGE VOLUMES (Lưu trữ Cục bộ)</text>
  <rect x="70" y="765" width="220" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="180" y="785" text-anchor="middle" font-size="11" font-weight="bold">audio-storage-data</text>
  <text x="180" y="800" text-anchor="middle" font-size="10">/app/storage/audio (File MP3)</text>
  
  <rect x="320" y="765" width="240" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="440" y="785" text-anchor="middle" font-size="11" font-weight="bold">product-uploads-data</text>
  <text x="440" y="800" text-anchor="middle" font-size="10">/app/uploads/products (Ảnh)</text>

  <rect x="620" y="730" width="530" height="100" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="635" y="750" font-size="12" font-weight="bold">6B. EXTERNAL SERVICES (Dịch vụ Bên ngoài)</text>
  <rect x="640" y="765" width="150" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="715" y="785" text-anchor="middle" font-size="11" font-weight="bold">VNPAY Sandbox</text>
  <text x="715" y="800" text-anchor="middle" font-size="10">Cổng thanh toán điện tử</text>

  <rect x="810" y="765" width="155" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="887" y="785" text-anchor="middle" font-size="11" font-weight="bold">MyMemory &amp; Edge-TTS</text>
  <text x="887" y="800" text-anchor="middle" font-size="10">Dịch thuật &amp; giọng đọc AI</text>

  <rect x="985" y="765" width="150" height="50" fill="#f8f8f8" stroke="#000000" stroke-width="1"/>
  <text x="1060" y="785" text-anchor="middle" font-size="11" font-weight="bold">Google Identity</text>
  <text x="1060" y="800" text-anchor="middle" font-size="10">Google OAuth2 Sign-In</text>
</svg>
`;

async function main() {
  console.log('Launching Playwright Chromium to render academic B&W diagrams...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set device scale factor 2 for crisp print quality
  await page.setViewportSize({ width: 1500, height: 1100 });

  // 1. Render Use Case Diagram
  console.log('Rendering Hình 3.1: Sơ đồ Use Case tổng thể...');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#ffffff;display:flex;justify-content:center;">${useCaseSvg}</body></html>`);
  const ucEl = await page.$('svg');
  const ucBuf = await ucEl.screenshot();
  const ucPath = path.join(outDir, 'hinh_01_so_do_use_case_tong_the.png');
  fs.writeFileSync(ucPath, ucBuf);
  console.log('Saved:', ucPath);

  // Also update image1.png in docx_unpacked media if present
  const img1Path = path.join(rootDir, 'scratch', 'docx_unpacked', 'word', 'media', 'image1.png');
  if (fs.existsSync(img1Path)) {
    fs.writeFileSync(img1Path, ucBuf);
    console.log('Updated scratch/docx_unpacked/word/media/image1.png');
  }

  // 2. Render Activity Diagram
  console.log('Rendering Hình 3.2: Sơ đồ Hoạt động UC03 GPS Narration...');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#ffffff;display:flex;justify-content:center;">${activityGpsSvg}</body></html>`);
  const actEl = await page.$('svg');
  const actBuf = await actEl.screenshot();
  const actPath = path.join(outDir, 'hinh_02_activity_diagram_thuyet_minh_gps.png');
  fs.writeFileSync(actPath, actBuf);
  console.log('Saved:', actPath);

  const img18Path = path.join(rootDir, 'scratch', 'docx_unpacked', 'word', 'media', 'image18.png');
  if (fs.existsSync(img18Path)) {
    fs.writeFileSync(img18Path, actBuf);
    console.log('Updated scratch/docx_unpacked/word/media/image18.png');
  }

  // 3. Render Architecture Diagram
  console.log('Rendering Hình 1.1 / 2.1: Sơ đồ Kiến trúc phân tán...');
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:#ffffff;display:flex;justify-content:center;">${architectureSvg}</body></html>`);
  const arcEl = await page.$('svg');
  const arcBuf = await arcEl.screenshot();
  const arcPath = path.join(outDir, 'hinh_03_kien_truc_tong_the_microservices.png');
  fs.writeFileSync(arcPath, arcBuf);
  console.log('Saved:', arcPath);

  const img2Path = path.join(rootDir, 'scratch', 'docx_unpacked', 'word', 'media', 'image2.png');
  if (fs.existsSync(img2Path)) {
    fs.writeFileSync(img2Path, arcBuf);
    console.log('Updated scratch/docx_unpacked/word/media/image2.png');
  }

  await browser.close();
  console.log('All academic black & white diagrams generated successfully!');
}

main().catch(err => {
  console.error('Diagram generation error:', err);
  process.exit(1);
});
