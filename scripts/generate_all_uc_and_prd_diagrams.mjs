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

// Read all use cases from JSON
const ucDataPath = path.join(rootDir, 'scratch', 'all_usecases.json');
const allUseCases = JSON.parse(fs.readFileSync(ucDataPath, 'utf-8'));

// Common SVG definitions for monochrome academic UML 2.5
const svgDefs = `
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
      <circle cx="25" cy="18" r="14" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <line x1="25" y1="32" x2="25" y2="70" stroke="#000000" stroke-width="2"/>
      <line x1="0" y1="46" x2="50" y2="46" stroke="#000000" stroke-width="2"/>
      <line x1="25" y1="70" x2="8" y2="105" stroke="#000000" stroke-width="2"/>
      <line x1="25" y1="70" x2="42" y2="105" stroke="#000000" stroke-width="2"/>
      <text x="25" y="125" text-anchor="middle" font-size="13" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${label}</text>
      ${sublabel ? `<text x="25" y="140" text-anchor="middle" font-size="11" fill="#444444" font-family="'Times New Roman', serif">${sublabel}</text>` : ''}
    </g>
  `;
}

function systemNode(x, y, w, h, stereotype, title) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
      <text x="${w / 2}" y="24" text-anchor="middle" font-size="11" font-style="italic" fill="#444444" font-family="'Times New Roman', serif">&lt;&lt;${stereotype}&gt;&gt;</text>
      <text x="${w / 2}" y="42" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${title}</text>
    </g>
  `;
}

function wrapLines(text, maxChars = 26) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function ellipseBox(cx, cy, rx, ry, id, title, isMain = true) {
  const lines = wrapLines(title, 24);
  const startY = cy - ((lines.length - 1) * 8);
  const textElements = lines.map((line, idx) => 
    `<tspan x="${cx}" y="${startY + (idx * 16)}">${line}</tspan>`
  ).join('');

  return `
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#000000" stroke-width="${isMain ? 2.2 : 1.5}"/>
      <text x="${cx}" y="${startY - 14}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333333" font-family="'Times New Roman', serif">${id}</text>
      <text text-anchor="middle" font-size="${isMain ? 12 : 11}" font-weight="${isMain ? 'bold' : 'normal'}" fill="#000000" font-family="'Times New Roman', serif">
        ${textElements}
      </text>
    </g>
  `;
}

// --------------------------------------------------------------------------
// 1. GENERATE 4 PRD DIAGRAMS
// --------------------------------------------------------------------------

// 1.1. System Context Diagram
const svgContext = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 680" width="1100" height="680" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${svgDefs}
  <text x="550" y="32" text-anchor="middle" font-size="16" font-weight="bold" fill="#000000">HÌNH 3.1. SƠ ĐỒ NGỮ CẢNH HỆ THỐNG DU LỊCH DI SẢN SỐ ECHORA</text>
  <text x="550" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">System Context Diagram — Chuẩn UML 2.5 Monochrome Học thuật</text>

  <!-- Central System Box -->
  <rect x="370" y="210" width="360" height="260" fill="#ffffff" stroke="#000000" stroke-width="2.5"/>
  <rect x="370" y="210" width="360" height="30" fill="#f4f4f4" stroke="#000000" stroke-width="1.2"/>
  <text x="550" y="230" text-anchor="middle" font-size="13" font-weight="bold" fill="#000000">HỆ THỐNG DU LỊCH DI SẢN SỐ ECHORA</text>
  <text x="550" y="250" text-anchor="middle" font-size="11" fill="#444444">(Echora Heritage Platform)</text>
  
  <text x="390" y="290" font-size="12" fill="#000000">• Định vị Geofence &amp; Thuyết minh đa ngữ</text>
  <text x="390" y="315" font-size="12" fill="#000000">• Quét mã QR di sản &amp; Xác thực phiên JWT</text>
  <text x="390" y="340" font-size="12" fill="#000000">• Thương mại điện tử Quà lưu niệm &amp; Premium</text>
  <text x="390" y="365" font-size="12" fill="#000000">• Quản trị CMS Di tích &amp; Lộ trình tham quan</text>
  <text x="390" y="390" font-size="12" fill="#000000">• Pipeline Dịch thuật AI &amp; Tổng hợp Edge-TTS</text>
  <text x="390" y="415" font-size="12" fill="#000000">• Phân tích sự kiện du lịch &amp; Quản trị Claim Code</text>

  <!-- Left: Human Actors -->
  ${stickFigure(60, 110, "Khách vãng lai", "(Visitor / Guest)")}
  <line x1="120" y1="165" x2="370" y2="260" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="210" y="195" font-size="11" fill="#000000">1. Xem bản đồ, nhận audio GPS/QR</text>

  ${stickFigure(60, 310, "Người dùng đăng ký", "(Registered User)")}
  <line x1="120" y1="365" x2="370" y2="350" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="210" y="340" font-size="11" fill="#000000">2. Đặt quà, nâng cấp Premium</text>

  ${stickFigure(60, 510, "Quản trị viên", "(Administrator)")}
  <line x1="120" y1="565" x2="370" y2="440" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="210" y="490" font-size="11" fill="#000000">3. Quản trị POI, duyệt bài, thống kê</text>

  <!-- Right: External Services -->
  ${systemNode(830, 80, 220, 60, "Hardware Sensor", "Thiết bị GPS &amp; Trình duyệt")}
  <line x1="730" y1="240" x2="830" y2="120" stroke="#000000" stroke-width="1.6" marker-start="url(#arrow)"/>
  <text x="750" y="170" font-size="11" fill="#000000">Tọa độ thời gian thực</text>

  ${systemNode(830, 170, 220, 60, "Map Provider", "OpenStreetMap Server")}
  <line x1="730" y1="280" x2="830" y2="200" stroke="#000000" stroke-width="1.6" marker-start="url(#arrow)"/>
  <text x="760" y="235" font-size="11" fill="#000000">Bản đồ nền OSM</text>

  ${systemNode(830, 260, 220, 60, "Payment Gateway", "Cổng VNPAY Sandbox")}
  <line x1="730" y1="340" x2="830" y2="290" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="750" y="310" font-size="11" fill="#000000">Thanh toán VNPAY QR</text>

  ${systemNode(830, 350, 220, 60, "Banking Network", "Ngân hàng VietQR (NAPAS)")}
  <line x1="730" y1="390" x2="830" y2="380" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="750" y="375" font-size="11" fill="#000000">Tạo mã VietQR 24/7</text>

  ${systemNode(830, 440, 220, 60, "AI &amp; Translation", "MyMemory &amp; Edge-TTS")}
  <line x1="730" y1="430" x2="830" y2="470" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="750" y="445" font-size="11" fill="#000000">Dịch thuật &amp; Giọng đọc AI</text>

  ${systemNode(830, 530, 220, 60, "Identity Provider", "Google OAuth 2.0")}
  <line x1="730" y1="460" x2="830" y2="550" stroke="#000000" stroke-width="1.6" marker-end="url(#arrow)"/>
  <text x="760" y="500" font-size="11" fill="#000000">Xác thực ID Token</text>
</svg>
`;

// 1.2. Solution Architecture Diagram (PRD)
const svgSolution = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 700" width="1100" height="700" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${svgDefs}
  <text x="550" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#000000">HÌNH 3.2. SƠ ĐỒ PHÁC THẢO KIẾN TRÚC GIẢI PHÁP TỔNG THỂ (PRD SOLUTION ALIGNMENT)</text>
  <text x="550" y="48" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">Kiến trúc 5 Khối: Client Tier, API Gateway, Microservices, Message Broker, Data Storage</text>

  <!-- Tier 1: Client Tier -->
  <rect x="50" y="70" width="1000" height="90" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="70" width="220" height="22" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="60" y="86" font-size="11" font-weight="bold" fill="#000000">TẦNG TRÌNH DIỄN (CLIENT TIER)</text>
  
  <rect x="70" y="102" width="210" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="175" y="122" text-anchor="middle" font-size="11" font-weight="bold">Bản đồ Leaflet &amp; GPS Geofence</text>
  <text x="175" y="138" text-anchor="middle" font-size="10" fill="#444444">NearbyPage, useAutoNarration</text>

  <rect x="300" y="102" width="210" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="122" text-anchor="middle" font-size="11" font-weight="bold">Trình phát Audio HTTP 206</text>
  <text x="405" y="138" text-anchor="middle" font-size="10" fill="#444444">AudioController, Web Speech</text>

  <rect x="530" y="102" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="645" y="122" text-anchor="middle" font-size="11" font-weight="bold">Quét mã QR &amp; Thương mại điện tử</text>
  <text x="645" y="138" text-anchor="middle" font-size="10" fill="#444444">ScanPage, Cart, Checkout, VietQR</text>

  <rect x="780" y="102" width="250" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="905" y="122" text-anchor="middle" font-size="11" font-weight="bold">Bảng điều khiển Quản trị (CMS)</text>
  <text x="905" y="138" text-anchor="middle" font-size="10" fill="#444444">AdminRoutes, POI, Zone, Route, Order</text>

  <!-- Arrow Tier 1 -> Tier 2 -->
  <line x1="550" y1="160" x2="550" y2="195" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="560" y="182" font-size="10" font-style="italic">REST API / HTTPS / WebSocket</text>

  <!-- Tier 2: API Gateway -->
  <rect x="50" y="195" width="1000" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="195" width="280" height="22" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="60" y="211" font-size="11" font-weight="bold" fill="#000000">CỔNG AN NINH API GATEWAY (PORT 8080)</text>

  <rect x="70" y="225" width="210" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="175" y="244" text-anchor="middle" font-size="11" font-weight="bold">PathGuardFilter</text>
  <text x="175" y="259" text-anchor="middle" font-size="10" fill="#444444">Chặn Traversal, Matrix, Malformed</text>

  <rect x="300" y="225" width="210" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="244" text-anchor="middle" font-size="11" font-weight="bold">JWT &amp; Token Rotation</text>
  <text x="405" y="259" text-anchor="middle" font-size="10" fill="#444444">RAM Access Token + HttpOnly Cookie</text>

  <rect x="530" y="225" width="230" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="645" y="244" text-anchor="middle" font-size="11" font-weight="bold">Rate Limit &amp; Header Strip</text>
  <text x="645" y="259" text-anchor="middle" font-size="10" fill="#444444">60 req/min, Xóa Untrusted Headers</text>

  <rect x="780" y="225" width="250" height="45" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="905" y="244" text-anchor="middle" font-size="11" font-weight="bold">AudioEntitlementFilter</text>
  <text x="905" y="259" text-anchor="middle" font-size="10" fill="#444444">Khóa ngoại ngữ nếu chưa có Premium</text>

  <!-- Arrow Tier 2 -> Tier 3 -->
  <line x1="550" y1="280" x2="550" y2="315" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="560" y="302" font-size="10" font-style="italic">Internal Routing (Shared Network)</text>

  <!-- Tier 3: Microservices -->
  <rect x="50" y="315" width="1000" height="110" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="315" width="260" height="22" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="60" y="331" font-size="11" font-weight="bold" fill="#000000">TẦNG DỊCH VỤ BACKEND MICROSERVICES</text>

  <rect x="70" y="345" width="145" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="142" y="365" text-anchor="middle" font-size="11" font-weight="bold">Auth Service</text>
  <text x="142" y="380" text-anchor="middle" font-size="10" fill="#444444">:8081 | JWT, OAuth2</text>
  <text x="142" y="395" text-anchor="middle" font-size="10" fill="#444444">Brute-force limit</text>

  <rect x="230" y="345" width="145" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="302" y="365" text-anchor="middle" font-size="11" font-weight="bold">Content Service</text>
  <text x="302" y="380" text-anchor="middle" font-size="10" fill="#444444">:8082 | POI, Zone</text>
  <text x="302" y="395" text-anchor="middle" font-size="10" fill="#444444">Route, Products</text>

  <rect x="390" y="345" width="145" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="462" y="365" text-anchor="middle" font-size="11" font-weight="bold">Location Service</text>
  <text x="462" y="380" text-anchor="middle" font-size="10" fill="#444444">:8083 | Geofence</text>
  <text x="462" y="395" text-anchor="middle" font-size="10" fill="#444444">Haversine, QR</text>

  <rect x="550" y="345" width="155" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="627" y="365" text-anchor="middle" font-size="11" font-weight="bold">Translation/TTS</text>
  <text x="627" y="380" text-anchor="middle" font-size="10" fill="#444444">:8084 | MyMemory</text>
  <text x="627" y="395" text-anchor="middle" font-size="10" fill="#444444">Edge-TTS, HTTP 206</text>

  <rect x="720" y="345" width="145" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="792" y="365" text-anchor="middle" font-size="11" font-weight="bold">Order Service</text>
  <text x="792" y="380" text-anchor="middle" font-size="10" fill="#444444">:8085 | VNPAY, VietQR</text>
  <text x="792" y="395" text-anchor="middle" font-size="10" fill="#444444">Premium, Claim Code</text>

  <rect x="880" y="345" width="150" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="955" y="365" text-anchor="middle" font-size="11" font-weight="bold">Analytics Service</text>
  <text x="955" y="380" text-anchor="middle" font-size="10" fill="#444444">:8086 | Event Queue</text>
  <text x="955" y="395" text-anchor="middle" font-size="10" fill="#444444">Stats &amp; Reports</text>

  <!-- Tier 4: Message Broker -->
  <rect x="50" y="445" width="1000" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="445" width="310" height="22" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="60" y="461" font-size="11" font-weight="bold" fill="#000000">ĐIỀU PHỐI BẤT ĐỒNG BỘ (RABBITMQ AMQP :5672)</text>

  <rect x="70" y="475" width="280" height="42" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="210" y="493" text-anchor="middle" font-size="11" font-weight="bold">Exchange: echora.topic</text>
  <text x="210" y="508" text-anchor="middle" font-size="10" fill="#444444">Routing: poi.created, poi.updated, poi.audio.ready</text>

  <rect x="380" y="475" width="310" height="42" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="535" y="493" text-anchor="middle" font-size="11" font-weight="bold">Exchange: echora.analytics</text>
  <text x="535" y="508" text-anchor="middle" font-size="10" fill="#444444">Direct Routing: analytics.event (SCAN, AUDIO_PLAY)</text>

  <rect x="720" y="475" width="310" height="42" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="875" y="493" text-anchor="middle" font-size="11" font-weight="bold">Dead-Letter Queue (DLQ)</text>
  <text x="875" y="508" text-anchor="middle" font-size="10" fill="#444444">Lưu vết và Retry tự động khi tiến trình dịch/TTS lỗi</text>

  <!-- Tier 5: Data Storage -->
  <rect x="50" y="550" width="1000" height="120" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="550" width="280" height="22" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="60" y="566" font-size="11" font-weight="bold" fill="#000000">TẦNG LƯU TRỮ DỮ LIỆU &amp; CACHE</text>

  <rect x="70" y="580" width="170" height="75" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="155" y="600" text-anchor="middle" font-size="11" font-weight="bold">saigonvoice_auth_db</text>
  <text x="155" y="618" text-anchor="middle" font-size="10" fill="#444444">Users, Roles, Tokens</text>
  <text x="155" y="635" text-anchor="middle" font-size="10" fill="#444444">LoginAttempts (SQL 2022)</text>

  <rect x="260" y="580" width="175" height="75" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="347" y="600" text-anchor="middle" font-size="11" font-weight="bold">saigonvoice_content_db</text>
  <text x="347" y="618" text-anchor="middle" font-size="10" fill="#444444">POI, Zone, Route, News</text>
  <text x="347" y="635" text-anchor="middle" font-size="10" fill="#444444">Products, Stops, OptimisticLock</text>

  <rect x="455" y="580" width="180" height="75" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="545" y="600" text-anchor="middle" font-size="11" font-weight="bold">saigonvoice_translation_db</text>
  <text x="545" y="618" text-anchor="middle" font-size="10" fill="#444444">PoiTranslation, AudioStatus</text>
  <text x="545" y="635" text-anchor="middle" font-size="10" fill="#444444">TranslationJob, ManualSource</text>

  <rect x="655" y="580" width="175" height="75" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="742" y="600" text-anchor="middle" font-size="11" font-weight="bold">saigonvoice_order_db</text>
  <text x="742" y="618" text-anchor="middle" font-size="10" fill="#444444">Orders, OrderItems, VNPAY</text>
  <text x="742" y="635" text-anchor="middle" font-size="10" fill="#444444">VietQR, IdempotencyKey</text>

  <rect x="850" y="580" width="180" height="75" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="940" y="600" text-anchor="middle" font-size="11" font-weight="bold">Redis &amp; Volume Storage</text>
  <text x="940" y="618" text-anchor="middle" font-size="10" fill="#444444">Claim Code TTL 15 phút</text>
  <text x="940" y="635" text-anchor="middle" font-size="10" fill="#444444">Tệp âm thanh MP3 cục bộ</text>
</svg>
`;

// 1.3. PRD Feature Tree (Cây phân cấp tính năng MoSCoW)
const svgFeatureTree = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 680" width="1100" height="680" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${svgDefs}
  <text x="550" y="32" text-anchor="middle" font-size="16" font-weight="bold" fill="#000000">HÌNH 3.3. SƠ ĐỒ CÂY PHÂN CẤP TÍNH NĂNG SẢN PHẨM (PRD FEATURE HIERARCHY TREE)</text>
  <text x="550" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">Phân loại tính năng theo khung đánh giá ưu tiên MoSCoW chuẩn PRD</text>

  <!-- Root Node -->
  <rect x="400" y="70" width="300" height="45" fill="#f4f4f4" stroke="#000000" stroke-width="2.2"/>
  <text x="550" y="92" text-anchor="middle" font-size="13" font-weight="bold">NỀN TẢNG DU LỊCH DI SẢN SỐ ECHORA</text>
  <text x="550" y="106" text-anchor="middle" font-size="10" fill="#444444">Hệ thống Yêu cầu Sản phẩm PRD</text>

  <!-- Tree Lines from Root -->
  <line x1="550" y1="115" x2="550" y2="140" stroke="#000000" stroke-width="1.5"/>
  <line x1="150" y1="140" x2="950" y2="140" stroke="#000000" stroke-width="1.5"/>
  <line x1="150" y1="140" x2="150" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="420" y1="140" x2="420" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="680" y1="140" x2="680" y2="165" stroke="#000000" stroke-width="1.5"/>
  <line x1="950" y1="140" x2="950" y2="165" stroke="#000000" stroke-width="1.5"/>

  <!-- Branch 1: MUST-HAVE -->
  <rect x="40" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="150" y="185" text-anchor="middle" font-size="12" font-weight="bold">1. MUST-HAVE (BẮT BUỘC)</text>
  <text x="150" y="198" text-anchor="middle" font-size="10" fill="#444444">Tính năng cốt lõi bắt buộc hoàn thành</text>

  <rect x="40" y="215" width="220" height="420" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="50" y="240" font-size="11" font-weight="bold">• Định vị GPS Geofence (35-60m)</text>
  <text x="50" y="260" font-size="10" fill="#555555">  Khai thác Haversine, chống phát lặp</text>
  
  <text x="50" y="290" font-size="11" font-weight="bold">• Thuyết minh đa ngữ tự động</text>
  <text x="50" y="310" font-size="10" fill="#555555">  Phát HTTP 206, cuộn phụ đề text</text>

  <text x="50" y="340" font-size="11" font-weight="bold">• Quét mã QR giải mã di tích</text>
  <text x="50" y="360" font-size="10" fill="#555555">  Dự phòng khi mất sóng vệ tinh GPS</text>

  <text x="50" y="390" font-size="11" font-weight="bold">• Pipeline Dịch thuật &amp; Edge-TTS</text>
  <text x="50" y="410" font-size="10" fill="#555555">  Tự động sinh audio 4 ngôn ngữ</text>

  <text x="50" y="440" font-size="11" font-weight="bold">• Xác thực kép JWT &amp; Refresh Cookie</text>
  <text x="50" y="460" font-size="10" fill="#555555">  Xoay vòng token, bảo mật XSS/CSRF</text>

  <text x="50" y="490" font-size="11" font-weight="bold">• Bảng điều khiển Quản trị CMS</text>
  <text x="50" y="510" font-size="10" fill="#555555">  Quản lý POI, Zone, Route, Đơn hàng</text>

  <text x="50" y="540" font-size="11" font-weight="bold">• Cổng an ninh Spring Cloud Gateway</text>
  <text x="50" y="560" font-size="10" fill="#555555">  PathGuard, RateLimit, UntrustedStrip</text>

  <text x="50" y="590" font-size="11" font-weight="bold">• Phân tách 5 Schema SQL Server</text>
  <text x="50" y="610" font-size="10" fill="#555555">  Cô lập dữ liệu các microservices</text>

  <!-- Branch 2: SHOULD-HAVE -->
  <rect x="310" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="420" y="185" text-anchor="middle" font-size="12" font-weight="bold">2. SHOULD-HAVE (NÊN CÓ)</text>
  <text x="420" y="198" text-anchor="middle" font-size="10" fill="#444444">Tính năng giá trị cao nâng cao trải nghiệm</text>

  <rect x="310" y="215" width="220" height="420" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="320" y="240" font-size="11" font-weight="bold">• Chế độ Giả lập Tọa độ (Simulation)</text>
  <text x="320" y="260" font-size="10" fill="#555555">  Kiểm thử Geofence không cần thực địa</text>

  <text x="320" y="295" font-size="11" font-weight="bold">• Thương mại quà lưu niệm địa phương</text>
  <text x="320" y="315" font-size="10" fill="#555555">  Danh mục 14 sản phẩm, giỏ hàng</text>

  <text x="320" y="350" font-size="11" font-weight="bold">• Thanh toán trực tuyến VNPAY</text>
  <text x="320" y="370" font-size="10" fill="#555555">  Môi trường Sandbox, ký SHA-512</text>

  <text x="320" y="405" font-size="11" font-weight="bold">• Thanh toán chuyển khoản VietQR</text>
  <text x="320" y="425" font-size="10" fill="#555555">  Mã VietQR chuẩn NAPAS 24/7</text>

  <text x="320" y="460" font-size="11" font-weight="bold">• Thuê bao Premium ngoại ngữ</text>
  <text x="320" y="480" font-size="10" fill="#555555">  Mở khóa audio en, ja, ko trong 1 năm</text>

  <text x="320" y="515" font-size="11" font-weight="bold">• Thu tiền mặt &amp; Cấp Claim Code</text>
  <text x="320" y="535" font-size="10" fill="#555555">  Xử lý tại quầy vé, mã lưu Redis 15m</text>

  <text x="320" y="570" font-size="11" font-weight="bold">• Phân tích thống kê lượt nghe</text>
  <text x="320" y="590" font-size="10" fill="#555555">  Ghi nhận sự kiện qua RabbitMQ</text>

  <!-- Branch 3: COULD-HAVE -->
  <rect x="570" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="680" y="185" text-anchor="middle" font-size="12" font-weight="bold">3. COULD-HAVE (CÓ THỂ CÓ)</text>
  <text x="680" y="198" text-anchor="middle" font-size="10" fill="#444444">Tính năng mở rộng nếu đủ thời gian</text>

  <rect x="570" y="215" width="220" height="420" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
  <text x="580" y="250" font-size="11" font-weight="bold">• Tải dữ liệu trước ngoại tuyến</text>
  <text x="580" y="270" font-size="10" fill="#555555">  Lưu trữ Service Worker Cache toàn bộ</text>

  <text x="580" y="320" font-size="11" font-weight="bold">• Hệ thống Đánh giá &amp; Bình luận</text>
  <text x="580" y="340" font-size="10" fill="#555555">  Du khách gửi feedback và chấm sao</text>

  <text x="580" y="390" font-size="11" font-weight="bold">• Chia sẻ di tích lên mạng xã hội</text>
  <text x="580" y="410" font-size="10" fill="#555555">  Tạo liên kết chia sẻ Facebook, Zalo</text>

  <text x="580" y="460" font-size="11" font-weight="bold">• Hỗ trợ thêm ngôn ngữ (Pháp, Hoa)</text>
  <text x="580" y="480" font-size="10" fill="#555555">  Mở rộng pipeline TTS sang zh-CN, fr</text>

  <!-- Branch 4: WON'T-HAVE -->
  <rect x="840" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="950" y="185" text-anchor="middle" font-size="12" font-weight="bold">4. WON'T-HAVE (CHƯA LÀM)</text>
  <text x="950" y="198" text-anchor="middle" font-size="10" fill="#444444">Nằm ngoài phạm vi của đề tài hiện tại</text>

  <text x="850" y="250" font-size="11" font-weight="bold">• Dẫn đường từng ngã rẽ (Turn-by-turn)</text>
  <text x="850" y="270" font-size="10" fill="#555555">  Không cạnh tranh với Google Maps</text>

  <text x="850" y="320" font-size="11" font-weight="bold">• Đặt vé tham quan trực tuyến</text>
  <text x="850" y="340" font-size="10" fill="#555555">  Không can thiệp cổng vé vật lý di tích</text>

  <text x="850" y="390" font-size="11" font-weight="bold">• Thanh toán thẻ tín dụng thật</text>
  <text x="850" y="410" font-size="10" fill="#555555">  Toàn bộ giao dịch ở chế độ Sandbox</text>

  <text x="850" y="460" font-size="11" font-weight="bold">• Ứng dụng Di động Native (iOS/Android)</text>
  <text x="850" y="480" font-size="10" fill="#555555">  Tập trung 100% vào giải pháp Web SPA</text>
</svg>
`;

// 1.4. Operational Flow Diagram (PRD)
const svgOperational = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 660" width="1100" height="660" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${svgDefs}
  <text x="550" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#000000">HÌNH 3.4. SƠ ĐỒ LUỒNG VẬN HÀNH TRẢI NGHIỆM DU KHÁCH (PRD OPERATIONAL FLOW)</text>
  <text x="550" y="48" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">Hành trình trải nghiệm từ tiếp cận, định vị, nghe thuyết minh, thanh toán đến quản trị</text>

  <!-- Step 1 -->
  <rect x="50" y="80" width="180" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="140" y="105" text-anchor="middle" font-size="12" font-weight="bold">BƯỚC 1: TIẾP CẬN</text>
  <text x="140" y="125" text-anchor="middle" font-size="11">• Mở web qua trình duyệt</text>
  <text x="140" y="145" text-anchor="middle" font-size="11">• Không cần cài đặt app</text>
  <text x="140" y="160" text-anchor="middle" font-size="10" fill="#444444">Chọn ngôn ngữ mẹ đẻ</text>

  <line x1="230" y1="122" x2="270" y2="122" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Step 2 -->
  <rect x="270" y="80" width="220" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="380" y="105" text-anchor="middle" font-size="12" font-weight="bold">BƯỚC 2: ĐỊNH VỊ KHÔNG GIAN</text>
  <text x="380" y="125" text-anchor="middle" font-size="11">• Bật công tắc "Thuyết minh tự động"</text>
  <text x="380" y="145" text-anchor="middle" font-size="11">• Cấp quyền GPS cho trình duyệt</text>
  <text x="380" y="160" text-anchor="middle" font-size="10" fill="#444444">Bản đồ Leaflet hiển thị 7 điểm POI</text>

  <line x1="490" y1="122" x2="530" y2="122" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Step 3 Decision: GPS vs QR -->
  <polygon points="630,80 730,122 630,165 530,122" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="630" y="118" text-anchor="middle" font-size="11" font-weight="bold">Tín hiệu GPS</text>
  <text x="630" y="132" text-anchor="middle" font-size="11" font-weight="bold">ổn định?</text>

  <!-- GPS Path (Yes) -->
  <line x1="630" y1="165" x2="630" y2="220" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="640" y="195" font-size="11" font-weight="bold">Có (GPS OK)</text>

  <rect x="520" y="220" width="220" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="630" y="245" text-anchor="middle" font-size="12" font-weight="bold">BƯỚC 3A: TỰ ĐỘNG GEOFENCE</text>
  <text x="630" y="265" text-anchor="middle" font-size="11">• Đi vào bán kính 35m - 60m</text>
  <text x="630" y="285" text-anchor="middle" font-size="11">• Haversine tính d &lt;= r</text>
  <text x="630" y="300" text-anchor="middle" font-size="10" fill="#444444">Chống phát lặp, bảo vệ 5 giây</text>

  <!-- QR Path (No) -->
  <line x1="730" y1="122" x2="830" y2="122" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="750" y="115" font-size="11" font-weight="bold">Mất sóng / Từ chối</text>

  <rect x="830" y="80" width="220" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="940" y="105" text-anchor="middle" font-size="12" font-weight="bold">BƯỚC 3B: QUÉT MÃ QR DỰ PHÒNG</text>
  <text x="940" y="125" text-anchor="middle" font-size="11">• Mở camera quét mã QR di sản</text>
  <text x="940" y="145" text-anchor="middle" font-size="11">• Hoặc tự nhập token thủ công</text>
  <text x="940" y="160" text-anchor="middle" font-size="10" fill="#444444">Giải mã POI ngay tức thì</text>

  <line x1="940" y1="165" x2="940" y2="262" stroke="#000000" stroke-width="1.8"/>
  <line x1="940" y1="262" x2="740" y2="262" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Step 4: Audio Narration -->
  <line x1="630" y1="305" x2="630" y2="350" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <rect x="520" y="350" width="220" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="630" y="375" text-anchor="middle" font-size="12" font-weight="bold">BƯỚC 4: THUYẾT MINH ÂM THANH</text>
  <text x="630" y="395" text-anchor="middle" font-size="11">• Phát giọng đọc Edge-TTS MP3</text>
  <text x="630" y="415" text-anchor="middle" font-size="11">• Cuộn highlight phụ đề text</text>
  <text x="630" y="430" text-anchor="middle" font-size="10" fill="#444444">Dự phòng Web Speech API nếu lỗi</text>

  <!-- Step 5: Decision Language / Premium -->
  <line x1="520" y1="392" x2="440" y2="392" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <polygon points="360,350 440,392 360,435 280,392" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="360" y="388" text-anchor="middle" font-size="11" font-weight="bold">Ngôn ngữ</text>
  <text x="360" y="402" text-anchor="middle" font-size="11" font-weight="bold">ngoại ngữ?</text>

  <!-- Free Vietnamese -->
  <line x1="360" y1="435" x2="360" y2="500" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="370" y="465" font-size="11" font-weight="bold">Tiếng Việt (Miễn phí)</text>

  <rect x="250" y="500" width="220" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="360" y="525" text-anchor="middle" font-size="12" font-weight="bold">KẾT THÚC THUYẾT MINH</text>
  <text x="360" y="545" text-anchor="middle" font-size="11">• Nghe trọn vẹn bài giới thiệu</text>
  <text x="360" y="565" text-anchor="middle" font-size="11">• Gửi sự kiện AUDIO_PLAY</text>
  <text x="360" y="580" text-anchor="middle" font-size="10" fill="#444444">Chuyển sang POI tiếp theo</text>

  <!-- Foreign Lang (Premium) -->
  <line x1="280" y1="392" x2="200" y2="392" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="210" y="385" font-size="11" font-weight="bold">Ngoại ngữ</text>

  <rect x="20" y="350" width="180" height="85" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="110" y="375" text-anchor="middle" font-size="12" font-weight="bold">BƯỚC 5: NÂNG CẤP PREMIUM</text>
  <text x="110" y="395" text-anchor="middle" font-size="11">• Thanh toán VNPAY / VietQR</text>
  <text x="110" y="415" text-anchor="middle" font-size="11">• Hoặc nhập mã Claim Code</text>
  <text x="110" y="430" text-anchor="middle" font-size="10" fill="#444444">Mở khóa audio 365 ngày</text>

  <line x1="110" y1="435" x2="110" y2="542" stroke="#000000" stroke-width="1.8"/>
  <line x1="110" y1="542" x2="250" y2="542" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Step 6: Shopping & Admin Management -->
  <rect x="790" y="350" width="260" height="235" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="790" y="350" width="260" height="24" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>
  <text x="920" y="367" text-anchor="middle" font-size="11" font-weight="bold">CÁC PHÂN HỆ ĐỒNG HÀNH KHÉP KÍN</text>

  <text x="805" y="400" font-size="11" font-weight="bold">• Thương mại quà lưu niệm:</text>
  <text x="815" y="418" font-size="10" fill="#444444">Duyệt 14 món quà gắn liền di tích</text>
  <text x="815" y="434" font-size="10" fill="#444444">Giỏ hàng LocalStorage, FreeShip từ 50k</text>

  <text x="805" y="465" font-size="11" font-weight="bold">• Quản trị di sản tập trung (CMS):</text>
  <text x="815" y="483" font-size="10" fill="#444444">Biên tập tiếng Việt 1 lần, tự động dịch</text>
  <text x="815" y="499" font-size="10" fill="#444444">Theo dõi hàng đợi RabbitMQ sinh MP3</text>

  <text x="805" y="530" font-size="11" font-weight="bold">• Báo cáo phân tích tương tác:</text>
  <text x="815" y="548" font-size="10" fill="#444444">Đếm lượt quét QR, lượt nghe theo nguồn</text>
  <text x="815" y="564" font-size="10" fill="#444444">Xuất báo cáo thống kê cho ban quản lý</text>
</svg>
`;

// --------------------------------------------------------------------------
// 2. GENERATE 46 INDIVIDUAL USE CASE DIAGRAMS
// --------------------------------------------------------------------------

function generateIndividualUcSvg(uc, index) {
  const ucId = uc.id; // e.g. "UC-01"
  const ucNum = index + 1;
  const figNum = (index + 5).toString(); // Figure 3.5 to Figure 3.50
  const title = uc.name;
  const actorName = uc.primary_actor || "Người dùng";
  const secActorName = uc.secondary_actor || "";
  const subsystem = uc.subsystem || "Hệ thống Echora";

  // Determine included or extended use case if applicable
  let relType = "";
  let relId = "";
  let relTitle = "";

  if (ucId === "UC-01") { relType = "<<extend>>"; relId = "UC-05"; relTitle = "Chế độ giả lập tọa độ GPS"; }
  else if (ucId === "UC-02") { relType = "<<include>>"; relId = "UC-41"; relTitle = "Tự động dịch thuật nội dung"; }
  else if (ucId === "UC-03") { relType = "<<include>>"; relId = "UC-02"; relTitle = "Nghe thuyết minh di tích đa ngữ"; }
  else if (ucId === "UC-04") { relType = "<<include>>"; relId = "UC-02"; relTitle = "Nghe thuyết minh di tích đa ngữ"; }
  else if (ucId === "UC-07") { relType = "<<extend>>"; relId = "UC-18"; relTitle = "Thêm sản phẩm vào giỏ hàng"; }
  else if (ucId === "UC-10") { relType = "<<include>>"; relId = "UC-11"; relTitle = "Xác thực email đăng ký"; }
  else if (ucId === "UC-13") { relType = "<<include>>"; relId = "UC-17"; relTitle = "Khởi tạo phiên làm việc JWT"; }
  else if (ucId === "UC-18") { relType = "<<extend>>"; relId = "UC-19"; relTitle = "Tiến hành đặt hàng lưu niệm"; }
  else if (ucId === "UC-19") { relType = "<<include>>"; relId = "UC-21"; relTitle = "Thanh toán trực tuyến VNPAY"; }
  else if (ucId === "UC-20") { relType = "<<include>>"; relId = "UC-21"; relTitle = "Thanh toán trực tuyến VNPAY"; }
  else if (ucId === "UC-28") { relType = "<<include>>"; relId = "UC-41"; relTitle = "Tự động phân phối dịch AI"; }
  else if (ucId === "UC-29") { relType = "<<include>>"; relId = "UC-41"; relTitle = "Cập nhật bản dịch tự động"; }
  else if (ucId === "UC-32") { relType = "<<include>>"; relId = "UC-41"; relTitle = "Kích hoạt lại hàng đợi dịch"; }
  else if (ucId === "UC-34") { relType = "<<extend>>"; relId = "UC-35"; relTitle = "Sắp xếp thứ tự trạm dừng"; }
  else if (ucId === "UC-44") { relType = "<<include>>"; relId = "UC-45"; relTitle = "Kích hoạt quyền bằng Claim Code"; }

  const hasRel = Boolean(relType && relId);
  const hasSecActor = Boolean(secActorName && secActorName !== "Không" && secActorName !== "N/A");

  // Center coordinates
  const mainCx = 480;
  const mainCy = hasRel ? 190 : 250;
  const relCx = 480;
  const relCy = 360;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 520" width="1000" height="520" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${svgDefs}
  
  <!-- TITLE BAR -->
  <text x="500" y="30" text-anchor="middle" font-size="15" font-weight="bold" fill="#000000">HÌNH 3.${figNum}. SƠ ĐỒ USE CASE ${ucId}: ${title.toUpperCase()}</text>
  <text x="500" y="48" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">Phân hệ: ${subsystem} | Tiêu chuẩn mô hình hóa UML 2.5 Monochrome Học thuật</text>

  <!-- SYSTEM BOUNDARY BOX -->
  <rect x="250" y="70" width="470" height="420" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="250" y="70" width="300" height="24" fill="#f4f4f4" stroke="#000000" stroke-width="1"/>
  <text x="260" y="86" font-size="11" font-weight="bold" fill="#000000">System Boundary: Nền tảng Echora</text>

  <!-- PRIMARY ACTOR (LEFT) -->
  ${stickFigure(70, mainCy - 55, actorName, `(Tác nhân chính)`)}
  
  <!-- ASSOCIATION LINE FROM ACTOR TO MAIN UC -->
  <line x1="145" y1="${mainCy}" x2="335" y2="${mainCy}" stroke="#000000" stroke-width="1.8"/>

  <!-- MAIN USE CASE ELLIPSE -->
  ${ellipseBox(mainCx, mainCy, 145, 42, ucId, title, true)}

  <!-- SECONDARY USE CASE (IF ANY) -->
  ${hasRel ? `
    <!-- Dashed dependency arrow -->
    <line x1="${mainCx}" y1="${mainCy + 42}" x2="${relCx}" y2="${relCy - 36}" stroke="#000000" stroke-width="1.6" stroke-dasharray="6,4" marker-end="url(#openArrow)"/>
    <rect x="${mainCx - 45}" y="${(mainCy + 42 + relCy - 36) / 2 - 10}" width="90" height="20" fill="#ffffff" stroke="#000000" stroke-width="0.8"/>
    <text x="${mainCx}" y="${(mainCy + 42 + relCy - 36) / 2 + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="#000000">${relType}</text>

    <!-- Secondary Ellipse -->
    ${ellipseBox(relCx, relCy, 135, 36, relId, relTitle, false)}
  ` : `
    <!-- Notes / Constraints Box -->
    <g transform="translate(320, 360)">
      <polygon points="0,0 290,0 310,20 310,75 0,75" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
      <polygon points="290,0 290,20 310,20" fill="#e8e8e8" stroke="#000000" stroke-width="1.2"/>
      <text x="15" y="24" font-size="11" font-weight="bold" fill="#000000">Đặc tả Kỹ thuật &amp; Ràng buộc:</text>
      <text x="15" y="44" font-size="10" fill="#333333">• Đảm bảo tính toàn vẹn trạng thái &amp; phân quyền truy cập</text>
      <text x="15" y="62" font-size="10" fill="#333333">• Xác minh qua bộ kiểm thử tự động (Unit / Integration Test)</text>
    </g>
  `}

  <!-- SUPPORTING ACTOR (RIGHT) -->
  ${hasSecActor ? `
    ${systemNode(765, mainCy - 35, 185, 70, "Hệ thống hỗ trợ", secActorName)}
    <line x1="625" y1="${mainCy}" x2="765" y2="${mainCy}" stroke="#000000" stroke-width="1.8"/>
  ` : `
    ${systemNode(765, mainCy - 35, 185, 70, "Dịch vụ nội bộ", "API Gateway &amp; DB")}
    <line x1="625" y1="${mainCy}" x2="765" y2="${mainCy}" stroke="#000000" stroke-width="1.8" stroke-dasharray="4,4"/>
  `}
</svg>
`;
}

// --------------------------------------------------------------------------
// 3. MAIN RUNNER: RENDER ALL TO PNG VIA PLAYWRIGHT
// --------------------------------------------------------------------------

async function renderAll() {
  console.log("Khởi động Playwright Chromium để render toàn bộ sơ đồ học thuật đơn sắc...");
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 }); // High DPI
  const page = await context.newPage();

  // 1. Render 4 PRD Diagrams
  console.log("1. Render 4 sơ đồ PRD & Ngữ cảnh...");
  
  await page.setViewportSize({ width: 1100, height: 680 });
  await page.setContent(svgContext);
  await page.screenshot({ path: path.join(outDir, "hinh_3_1_system_context.png") });
  console.log(" -> Đã xuất Hình 3.1: System Context Diagram");

  await page.setViewportSize({ width: 1100, height: 700 });
  await page.setContent(svgSolution);
  await page.screenshot({ path: path.join(outDir, "hinh_3_2_solution_architecture.png") });
  console.log(" -> Đã xuất Hình 3.2: Solution Architecture Diagram");

  await page.setViewportSize({ width: 1100, height: 680 });
  await page.setContent(svgFeatureTree);
  await page.screenshot({ path: path.join(outDir, "hinh_3_3_prd_feature_tree.png") });
  console.log(" -> Đã xuất Hình 3.3: PRD Feature Tree Diagram");

  await page.setViewportSize({ width: 1100, height: 660 });
  await page.setContent(svgOperational);
  await page.screenshot({ path: path.join(outDir, "hinh_3_4_operational_flow.png") });
  console.log(" -> Đã xuất Hình 3.4: Operational Flow Diagram");

  // 2. Render 45 Individual Use Case Diagrams
  console.log("2. Render 45 sơ đồ chi tiết cho từng Ca sử dụng (UC-01 đến UC-45)...");
  await page.setViewportSize({ width: 1000, height: 520 });

  for (let i = 0; i < allUseCases.length; i++) {
    const uc = allUseCases[i];
    const ucIdStr = (i + 1).toString().padStart(2, '0');
    const filename = `hinh_uc_${ucIdStr}.png`;
    const svgContent = generateIndividualUcSvg(uc, i);
    
    await page.setContent(svgContent);
    await page.screenshot({ path: path.join(outDir, filename) });
    
    if ((i + 1) % 10 === 0 || i === allUseCases.length - 1) {
      console.log(` -> Đã xuất ${i + 1}/45: ${filename} (${uc.id}: ${uc.name})`);
    }
  }

  await browser.close();
  console.log("HOÀN TẤT XUẤT 49 SƠ ĐỒ ĐƠN SẮC HỌC THUẬT VÀO THƯ MỤC docs/report/diagrams/png/!");
}

renderAll().catch(err => {
  console.error("Lỗi khi render sơ đồ:", err);
  process.exit(1);
});
