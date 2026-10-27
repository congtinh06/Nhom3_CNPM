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
    <marker id="diamond" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <polygon points="0,6 5,2 10,6 5,10" fill="#000000" stroke="#000000" stroke-width="1"/>
    </marker>
    <marker id="openDiamond" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <polygon points="0,6 5,2 10,6 5,10" fill="#ffffff" stroke="#000000" stroke-width="1"/>
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

function systemBox(x, y, w, h, stereotype, title) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
      <text x="${w/2}" y="18" text-anchor="middle" font-size="10" fill="#444444" font-family="'Times New Roman', serif">&lt;&lt;${stereotype}&gt;&gt;</text>
      <text x="${w/2}" y="34" text-anchor="middle" font-size="11" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${title}</text>
    </g>
  `;
}

function useCaseEllipse(cx, cy, rx, ry, id, text, extra = '') {
  return `
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
      <text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${id}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="10.5" fill="#000000" font-family="'Times New Roman', serif">${text}</text>
      ${extra ? `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-size="9" fill="#444444" font-family="'Times New Roman', serif">${extra}</text>` : ''}
    </g>
  `;
}

// ---------------------------------------------------------------------------------
// 1. HÌNH 3.1: SYSTEM CONTEXT DIAGRAM (SƠ ĐỒ NGỮ CẢNH HỆ THỐNG)
// ---------------------------------------------------------------------------------
const diagram3_1_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1250 860" width="1250" height="860" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="625" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.1. SƠ ĐỒ NGỮ CẢNH HỆ THỐNG DU LỊCH DI SẢN SỐ ECHORA</text>
  <text x="625" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Ranh giới Hệ thống và Luồng Giao tiếp Hai chiều với 4 Tác nhân Con người &amp; 7 Hệ thống Ngoại vi</text>

  <!-- Central System Boundary -->
  <rect x="420" y="240" width="410" height="380" fill="#fcfcfc" stroke="#000000" stroke-width="2.5" rx="4"/>
  <rect x="420" y="240" width="410" height="35" fill="#eeeeee" stroke="#000000" stroke-width="1.5"/>
  <text x="625" y="263" text-anchor="middle" font-size="13" font-weight="bold">&lt;&lt;System Boundary&gt;&gt; HỆ THỐNG DU LỊCH DI SẢN ECHORA</text>
  
  <text x="625" y="320" text-anchor="middle" font-size="13" font-weight="bold">Nền tảng Thuyết minh Tự động &amp; Khám phá Di sản Đô thị</text>
  <text x="625" y="345" text-anchor="middle" font-size="11" fill="#444444">• Web App Du khách (React SPA + Leaflet + HTTP 206 Audio)</text>
  <text x="625" y="365" text-anchor="middle" font-size="11" fill="#444444">• CMS Quản trị Nội dung Di sản &amp; Quầy vé Thực địa</text>
  <text x="625" y="385" text-anchor="middle" font-size="11" fill="#444444">• Cổng API Gateway: Bộ lọc an ninh, Giới hạn tần suất, JWT</text>
  <text x="625" y="405" text-anchor="middle" font-size="11" fill="#444444">• 6 Microservices: Content, Location, Translation, Analytics, Auth, Order</text>
  <text x="625" y="425" text-anchor="middle" font-size="11" fill="#444444">• Hàng đợi RabbitMQ &amp; 5 CSDL SQL Server 2022 phân lập</text>
  <text x="625" y="445" text-anchor="middle" font-size="11" fill="#444444">• Phân hệ Dịch thuật &amp; TTS tự động (MyMemory + Edge-TTS)</text>
  <text x="625" y="465" text-anchor="middle" font-size="11" fill="#444444">• Cơ chế thanh toán kép: Online Sandbox &amp; Tiền mặt quầy Claim Code</text>

  <!-- Human Actors Left -->
  ${stickFigure(70, 240, 'Khách vãng lai', '(Anonymous Visitor)')}
  ${stickFigure(70, 480, 'Người dùng đăng ký', '(Registered User)')}

  <!-- Human Actors Right -->
  ${stickFigure(1110, 240, 'Nhân viên quầy vé', '(Ticket Staff)')}
  ${stickFigure(1110, 480, 'Quản trị viên', '(CMS Admin)')}

  <!-- External Systems Top & Bottom -->
  ${systemBox(160, 90, 190, 48, 'Hardware Sensor', 'Thiết bị GPS & Trình duyệt')}
  ${systemBox(530, 90, 190, 48, 'Map Service', 'OpenStreetMap Tile Server')}
  ${systemBox(900, 90, 190, 48, 'Identity Provider', 'Google OAuth 2.0')}

  ${systemBox(100, 720, 180, 48, 'Payment Gateway', 'Cổng VNPAY Sandbox')}
  ${systemBox(390, 720, 180, 48, 'Banking Network', 'Ngân hàng VietQR NAPAS')}
  ${systemBox(680, 720, 180, 48, 'Machine Translation', 'MyMemory Translation API')}
  ${systemBox(970, 720, 180, 48, 'TTS Engine', 'Microsoft Edge-TTS (Python CLI)')}

  <!-- Connections & Labels -->
  <!-- Visitor -> System -->
  <line x1="120" y1="280" x2="420" y2="330" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <line x1="420" y1="345" x2="120" y2="295" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="260" y="305" text-anchor="middle" font-size="9.5" fill="#222222">Quét QR, xem bản đồ / Audio tiếng Việt</text>

  <!-- RegUser -> System -->
  <line x1="120" y1="520" x2="420" y2="480" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <line x1="420" y1="495" x2="120" y2="535" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="260" y="525" text-anchor="middle" font-size="9.5" fill="#222222">Đăng nhập, nghe đa ngữ, đặt quà</text>

  <!-- TicketStaff -> System -->
  <line x1="1100" y1="280" x2="830" y2="330" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <line x1="830" y1="345" x2="1100" y2="295" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="975" y="305" text-anchor="middle" font-size="9.5" fill="#222222">Xác nhận thu tiền mặt / Sinh Claim Code 15m</text>

  <!-- Admin -> System -->
  <line x1="1100" y1="520" x2="830" y2="480" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <line x1="830" y1="495" x2="1100" y2="535" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="975" y="525" text-anchor="middle" font-size="9.5" fill="#222222">Quản trị POI, dịch thuật, duyệt đơn, báo cáo</text>

  <!-- GPS -> System -->
  <line x1="255" y1="138" x2="470" y2="240" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="320" y="180" text-anchor="middle" font-size="9.5">Tọa độ GPS (Lat, Lng)</text>

  <!-- OSM -> System -->
  <line x1="625" y1="138" x2="625" y2="240" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="675" y="190" text-anchor="middle" font-size="9.5">Map Tiles OSM</text>

  <!-- Google -> System -->
  <line x1="995" y1="138" x2="780" y2="240" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="925" y="180" text-anchor="middle" font-size="9.5">Xác thực Google ID Token</text>

  <!-- System -> VNPAY -->
  <line x1="480" y1="620" x2="220" y2="720" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <line x1="230" y1="730" x2="490" y2="630" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="310" y="665" text-anchor="middle" font-size="9.5">URL ký HMAC / Webhook IPN</text>

  <!-- System -> VietQR -->
  <line x1="560" y1="620" x2="490" y2="720" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="500" y="675" text-anchor="middle" font-size="9.5">Chuỗi mã QR NAPAS</text>

  <!-- System -> MyMemory -->
  <line x1="690" y1="620" x2="760" y2="720" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="760" y="675" text-anchor="middle" font-size="9.5">Văn bản vi / Bản dịch en,ja,ko</text>

  <!-- System -> Edge-TTS -->
  <line x1="770" y1="620" x2="1030" y2="720" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <line x1="1040" y1="730" x2="780" y2="630" stroke="#000000" stroke-width="1.3" marker-end="url(#arrow)"/>
  <text x="940" y="665" text-anchor="middle" font-size="9.5">Sinh giọng đọc MP3</text>
</svg>
`;

// ---------------------------------------------------------------------------------
// 2. HÌNH 3.2: SOLUTION ARCHITECTURE DIAGRAM (SƠ ĐỒ KIẾN TRÚC GIẢI PHÁP)
// ---------------------------------------------------------------------------------
const diagram3_2_svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="600" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 3.2. SƠ ĐỒ KIẾN TRÚC GIẢI PHÁP HỆ THỐNG ECHORA</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Phân tầng Khối Giải pháp theo Chuẩn Microservices, API Gateway, Message Broker và 5 CSDL Độc lập</text>

  <!-- LAYER 1: CLIENT TIER -->
  <rect x="50" y="75" width="1100" height="95" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <rect x="50" y="75" width="220" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="90" font-size="11" font-weight="bold">1. CLIENT TIER (TẦNG TRÌNH DIỄN)</text>

  <rect x="80" y="105" width="480" height="52" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="320" y="125" text-anchor="middle" font-size="12" font-weight="bold">Web App Du khách (Mobile Web / PWA)</text>
  <text x="320" y="145" text-anchor="middle" font-size="10" fill="#444444">React 18 + TS + Vite + Leaflet OSM + Byte-Range Audio + RAM Token</text>

  <rect x="640" y="105" width="480" height="52" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="880" y="125" text-anchor="middle" font-size="12" font-weight="bold">CMS Quản trị Nội dung Di sản &amp; Quầy vé</text>
  <text x="880" y="145" text-anchor="middle" font-size="10" fill="#444444">React SPA + Dashboard + Quản lý POI/Tour/Đơn + Quầy vé thu tiền mặt</text>

  <!-- LAYER 2: API GATEWAY TIER -->
  <rect x="50" y="195" width="1100" height="105" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <rect x="50" y="195" width="270" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="210" font-size="11" font-weight="bold">2. API GATEWAY TIER (CỔNG AN NINH TẬP TRUNG)</text>

  <rect x="80" y="225" width="1040" height="62" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="600" y="245" text-anchor="middle" font-size="12" font-weight="bold">api-gateway (Spring Cloud Gateway — Port 18080/8080)</text>
  <text x="600" y="265" text-anchor="middle" font-size="10.5" fill="#333333">• PathGuardFilter (Chặn ../, ;)  • UntrustedHeaderStripFilter (Loại bỏ X-User-*)  • AnalyticsRateLimitFilter (60 req/min)  • JwtFilter (Verify Bearer AT trong RAM)</text>

  <!-- LAYER 3: MICROSERVICES TIER -->
  <rect x="50" y="325" width="1100" height="160" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <rect x="50" y="325" width="270" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="340" font-size="11" font-weight="bold">3. MICROSERVICES TIER (DỊCH VỤ NGHIỆP VỤ ĐỘC LẬP)</text>

  <rect x="70" y="355" width="160" height="60" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="375" text-anchor="middle" font-size="11" font-weight="bold">content-service</text>
  <text x="150" y="392" text-anchor="middle" font-size="9.5" fill="#444444">Port 8085</text>
  <text x="150" y="405" text-anchor="middle" font-size="9" fill="#666666">POI, Zone, Route, Quà</text>

  <rect x="245" y="355" width="160" height="60" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="325" y="375" text-anchor="middle" font-size="11" font-weight="bold">location-service</text>
  <text x="325" y="392" text-anchor="middle" font-size="9.5" fill="#444444">Port 8082</text>
  <text x="325" y="405" text-anchor="middle" font-size="9" fill="#666666">Giải mã QR, Geofence</text>

  <rect x="420" y="355" width="170" height="60" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="505" y="375" text-anchor="middle" font-size="11" font-weight="bold">translation-tts-service</text>
  <text x="505" y="392" text-anchor="middle" font-size="9.5" fill="#444444">Port 8083</text>
  <text x="505" y="405" text-anchor="middle" font-size="9" fill="#666666">Dịch đa ngữ, Edge-TTS</text>

  <rect x="605" y="355" width="160" height="60" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="685" y="375" text-anchor="middle" font-size="11" font-weight="bold">analytics-service</text>
  <text x="685" y="392" text-anchor="middle" font-size="9.5" fill="#444444">Port 8081</text>
  <text x="685" y="405" text-anchor="middle" font-size="9" fill="#666666">Ghi SCAN/PLAY, Báo cáo</text>

  <rect x="780" y="355" width="160" height="60" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="860" y="375" text-anchor="middle" font-size="11" font-weight="bold">auth-service</text>
  <text x="860" y="392" text-anchor="middle" font-size="9.5" fill="#444444">Port 8086</text>
  <text x="860" y="405" text-anchor="middle" font-size="9" fill="#666666">JWT RAM, Cookie 7d</text>

  <rect x="955" y="355" width="175" height="60" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="1042" y="375" text-anchor="middle" font-size="11" font-weight="bold">order-service</text>
  <text x="1042" y="392" text-anchor="middle" font-size="9.5" fill="#444444">Port 8087</text>
  <text x="1042" y="405" text-anchor="middle" font-size="9" fill="#666666">Đơn hàng, VNPAY/VietQR</text>

  <rect x="350" y="425" width="500" height="48" fill="#f5f5f5" stroke="#000000" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="600" y="445" text-anchor="middle" font-size="11" font-weight="bold">Phân hệ Dịch thuật &amp; TTS tự động</text>
  <text x="600" y="462" text-anchor="middle" font-size="9.5" fill="#555555">Điều phối RabbitMQ, MyMemory API và Edge-TTS Worker</text>

  <!-- LAYER 4: INFRASTRUCTURE & PERSISTENCE -->
  <rect x="50" y="510" width="1100" height="190" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <rect x="50" y="510" width="310" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="525" font-size="11" font-weight="bold">4. INFRASTRUCTURE &amp; DATA TIER (HẠ TẦNG &amp; CSDL)</text>

  <rect x="75" y="545" width="220" height="140" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="185" y="568" text-anchor="middle" font-size="11" font-weight="bold">RabbitMQ 3 (AMQP)</text>
  <text x="185" y="586" text-anchor="middle" font-size="9.5" fill="#444444">Port 5672 / 15800</text>
  <text x="185" y="605" text-anchor="middle" font-size="9" fill="#333333">Exchange: echora.exchange</text>
  <text x="185" y="625" text-anchor="middle" font-size="9" fill="#666666">• poi.updated (Dịch thuật)</text>
  <text x="185" y="643" text-anchor="middle" font-size="9" fill="#666666">• poi.audio.ready (Sẵn sàng)</text>
  <text x="185" y="661" text-anchor="middle" font-size="9" fill="#666666">• analytics.events (Sự kiện)</text>

  <rect x="315" y="545" width="460" height="140" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="545" y="568" text-anchor="middle" font-size="11" font-weight="bold">Microsoft SQL Server 2022 (Port 1433 — 5 CSDL Phân lập)</text>
  <text x="545" y="588" text-anchor="middle" font-size="9.5" fill="#444444">1 Instance duy nhất, cô lập 5 logins và 5 schemas độc lập:</text>
  <text x="545" y="612" text-anchor="middle" font-size="9" fill="#333333">1. echora_content_db (content_user)  2. echora_translation_db (translation_user)</text>
  <text x="545" y="632" text-anchor="middle" font-size="9" fill="#333333">3. echora_analytics_db (analytics_user)  4. echora_auth_db (auth_user)</text>
  <text x="545" y="652" text-anchor="middle" font-size="9" fill="#333333">5. echora_order_db (order_user) — Khóa lạc quan @Version</text>
  <text x="545" y="672" text-anchor="middle" font-size="9" fill="#666666">Cấu hình cấp phát bộ nhớ JVM: -Xms128m -Xmx256m cho từng container</text>

  <rect x="795" y="545" width="335" height="140" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="962" y="568" text-anchor="middle" font-size="11" font-weight="bold">Lưu trữ Volume &amp; Redis Cache</text>
  <text x="962" y="588" text-anchor="middle" font-size="9.5" fill="#444444">• audio-storage-data (/app/storage/audio)</text>
  <text x="962" y="608" text-anchor="middle" font-size="9.5" fill="#444444">• product-uploads-data (/app/uploads)</text>
  <text x="962" y="632" text-anchor="middle" font-size="10" font-weight="bold" fill="#000000">Redis In-Memory Cache (Dự kiến):</text>
  <text x="962" y="650" text-anchor="middle" font-size="9" fill="#333333">Mã nhận quyền Claim Code (TTL 15m)</text>
  <text x="962" y="668" text-anchor="middle" font-size="9" fill="#333333">Phiên đăng nhập &amp; Claim Code (TTL 15m)</text>

  <!-- LAYER 5: EXTERNAL SERVICES -->
  <rect x="50" y="725" width="1100" height="120" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <rect x="50" y="725" width="280" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="740" font-size="11" font-weight="bold">5. EXTERNAL SERVICES TIER (DỊCH VỤ BÊN NGOÀI)</text>

  <rect x="70" y="760" width="165" height="65" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="152" y="785" text-anchor="middle" font-size="11" font-weight="bold">OpenStreetMap</text>
  <text x="152" y="805" text-anchor="middle" font-size="9.5" fill="#444444">Bản đồ nền Tile Server</text>

  <rect x="255" y="760" width="165" height="65" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="337" y="785" text-anchor="middle" font-size="11" font-weight="bold">Google OAuth 2.0</text>
  <text x="337" y="805" text-anchor="middle" font-size="9.5" fill="#444444">Xác thực ID Token</text>

  <rect x="440" y="760" width="165" height="65" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="522" y="785" text-anchor="middle" font-size="11" font-weight="bold">Cổng VNPAY Sandbox</text>
  <text x="522" y="805" text-anchor="middle" font-size="9.5" fill="#444444">Chữ ký HMAC-SHA512</text>

  <rect x="625" y="760" width="165" height="65" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="707" y="785" text-anchor="middle" font-size="11" font-weight="bold">Mạng VietQR NAPAS</text>
  <text x="707" y="805" text-anchor="middle" font-size="9.5" fill="#444444">Chuỗi QR 24/7</text>

  <rect x="810" y="760" width="165" height="65" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="892" y="785" text-anchor="middle" font-size="11" font-weight="bold">MyMemory API</text>
  <text x="892" y="805" text-anchor="middle" font-size="9.5" fill="#444444">Máy dịch tự động vi-&gt;en</text>

  <rect x="995" y="760" width="140" height="65" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="1065" y="785" text-anchor="middle" font-size="11" font-weight="bold">Edge-TTS Engine</text>
  <text x="1065" y="805" text-anchor="middle" font-size="9.5" fill="#444444">Tổng hợp giọng đọc MP3</text>

  <!-- Connectors -->
  <line x1="320" y1="157" x2="320" y2="225" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="880" y1="157" x2="880" y2="225" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="287" x2="600" y2="355" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="415" x2="600" y2="510" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="700" x2="600" y2="725" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>
`;

console.log("Diagrams 1 and 2 ready. Building remaining 15 diagrams...");
