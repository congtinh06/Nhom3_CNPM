import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'Diagram_Source_Chuong_4');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Common Monochrome SVG Definitions
const commonDefs = `
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000000"/>
    </marker>
    <marker id="openArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 8 5 L 0 8" fill="none" stroke="#000000" stroke-width="1.5"/>
    </marker>
    <marker id="crowFoot" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 1 L 10 6 L 0 11 M 10 1 L 10 11" fill="none" stroke="#000000" stroke-width="1.5"/>
    </marker>
  </defs>
`;

function umlComponentBox(x, y, w, h, name, subtext = '', stereotype = 'component') {
  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
      <!-- UML Component Icon (top right or top left) -->
      <rect x="${w - 22}" y="4" width="16" height="12" fill="#ffffff" stroke="#000000" stroke-width="1"/>
      <rect x="${w - 26}" y="6" width="6" height="3" fill="#ffffff" stroke="#000000" stroke-width="1"/>
      <rect x="${w - 26}" y="11" width="6" height="3" fill="#ffffff" stroke="#000000" stroke-width="1"/>
      
      <text x="${w / 2}" y="20" text-anchor="middle" font-size="10" font-style="italic" fill="#555555" font-family="'Times New Roman', serif">&lt;&lt;${stereotype}&gt;&gt;</text>
      <text x="${w / 2}" y="36" text-anchor="middle" font-size="12" font-weight="bold" fill="#000000" font-family="'Times New Roman', serif">${name}</text>
      ${subtext ? `<text x="${w / 2}" y="52" text-anchor="middle" font-size="10" fill="#444444" font-family="'Times New Roman', serif">${subtext}</text>` : ''}
    </g>
  `;
}

// -----------------------------------------------------------------------------
// 1. HÌNH 4.1: SƠ ĐỒ THÀNH PHẦN PHẦN MỀM (COMPONENT DIAGRAM)
// -----------------------------------------------------------------------------
const svg_4_1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1350 980" width="1350" height="980" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="675" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 4.1. SƠ ĐỒ THÀNH PHẦN PHẦN MỀM HỆ THỐNG ECHORA (COMPONENT DIAGRAM)</text>
  <text x="675" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Mô hình hóa Kiến trúc Hướng Dịch vụ Đa tầng, Quan hệ Phụ thuộc và Giao diện Cung cấp / Yêu cầu</text>

  <!-- Package 1: Presentation Layer (PWA / Client SPA) -->
  <rect x="40" y="80" width="1270" height="175" fill="#ffffff" stroke="#000000" stroke-width="2" stroke-dasharray="5 3"/>
  <rect x="40" y="80" width="300" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="190" y="98" text-anchor="middle" font-size="12" font-weight="bold">TẦNG TRÌNH DIỄN CLIENT (REACT 18 PWA SPA)</text>

  ${umlComponentBox(60, 120, 185, 75, "NearbyMapModule", "Bản đồ Leaflet & Markers")}
  ${umlComponentBox(265, 120, 185, 75, "AudioPlayerModule", "Floating Player & Fallback")}
  ${umlComponentBox(470, 120, 185, 75, "QrScannerModule", "Camera WebRTC & Decoder")}
  ${umlComponentBox(675, 120, 185, 75, "SouvenirCartModule", "Catalog, Cart & Checkout")}
  ${umlComponentBox(880, 120, 185, 75, "PremiumPayModule", "Gói cước & VNPAY/VietQR")}
  ${umlComponentBox(1085, 120, 205, 75, "AdminCmsConsole", "Quản trị POI, User & TTS")}

  <!-- Shared Client ApiClient -->
  <rect x="520" y="210" width="310" height="35" fill="#f9f9f9" stroke="#000000" stroke-width="1.5"/>
  <text x="675" y="232" text-anchor="middle" font-size="11" font-weight="bold">ApiClient (Axios Interceptor, JWT Bearer in RAM, Error Boundary)</text>

  <!-- Connectors from components to ApiClient -->
  <line x1="152" y1="195" x2="520" y2="225" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#arrow)"/>
  <line x1="357" y1="195" x2="520" y2="225" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#arrow)"/>
  <line x1="562" y1="195" x2="600" y2="210" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#arrow)"/>
  <line x1="767" y1="195" x2="750" y2="210" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#arrow)"/>
  <line x1="972" y1="195" x2="830" y2="225" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#arrow)"/>
  <line x1="1187" y1="195" x2="830" y2="225" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#arrow)"/>

  <!-- Package 2: API Gateway & Security Layer -->
  <rect x="360" y="295" width="630" height="100" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="360" y="295" width="630" height="25" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="675" y="312" text-anchor="middle" font-size="12" font-weight="bold">TẦNG CỔNG GIAO TIẾP &amp; BẢO MẬT (SPRING CLOUD API GATEWAY)</text>
  
  ${umlComponentBox(380, 330, 280, 55, "SecurityAuthFilter", "JWT HMAC-SHA256, RBAC Guard")}
  ${umlComponentBox(690, 330, 280, 55, "TrafficRoutingFilter", "RateLimit 60r/m, PathGuard, CORS")}

  <!-- Line from Client ApiClient to Gateway -->
  <line x1="675" y1="245" x2="675" y2="295" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="760" y="275" font-size="11" font-weight="bold">HTTPS / REST JSON</text>

  <!-- Package 3: Business Microservices Tier -->
  <rect x="40" y="440" width="1270" height="235" fill="#ffffff" stroke="#000000" stroke-width="2" stroke-dasharray="5 3"/>
  <rect x="40" y="440" width="340" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="210" y="458" text-anchor="middle" font-size="12" font-weight="bold">TẦNG DỊCH VỤ VI MÔ NGHIỆP VỤ (SPRING BOOT 3 SERVICES)</text>

  ${umlComponentBox(60, 485, 220, 85, "AuthServiceComponent", "User CRUD, Bcrypt, TokenRotation\n(Port 8081)")}
  ${umlComponentBox(305, 485, 230, 85, "ContentServiceComponent", "POI, Zone, Route, Translation\n(Port 8082)")}
  ${umlComponentBox(560, 485, 230, 85, "LocationServiceComponent", "Haversine Distance, Geofence\n(Port 8082 / Lib)")}
  ${umlComponentBox(815, 485, 235, 85, "OrderPaymentService", "Orders, VNPAY HMAC, VietQR\n(Port 8083)")}
  ${umlComponentBox(1075, 485, 215, 85, "AnalyticsService", "Event Collection, Stats CMS\n(Port 8085)")}

  ${umlComponentBox(440, 585, 470, 75, "TranslationTtsPipelineComponent", "RabbitMQ Consumer, MyMemory API, Edge-TTS CLI, MP3 Stream\n(Port 8084)")}

  <!-- Gateway to Microservices dispatch lines -->
  <line x1="500" y1="395" x2="170" y2="485" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="395" x2="420" y2="485" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="675" y1="395" x2="675" y2="485" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="750" y1="395" x2="930" y2="485" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="850" y1="395" x2="1180" y2="485" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- ContentService to Pipeline via RabbitMQ event -->
  <line x1="420" y1="570" x2="520" y2="585" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 2" marker-end="url(#arrow)"/>
  <text x="410" y="582" font-size="10" font-weight="bold">AMQP: poi.created</text>

  <!-- Package 4: Persistence, Broker & External Integration Tier -->
  <rect x="40" y="720" width="1270" height="220" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="40" y="720" width="370" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="225" y="738" text-anchor="middle" font-size="12" font-weight="bold">TẦNG DỮ LIỆU &amp; TÍCH HỢP HỆ THỐNG NGOÀI</text>

  <!-- RabbitMQ Broker -->
  <rect x="60" y="765" width="230" height="80" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="175" y="788" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;message broker&gt;&gt;</text>
  <text x="175" y="808" text-anchor="middle" font-size="12" font-weight="bold">RabbitMQ AMQP 3.12</text>
  <text x="175" y="828" text-anchor="middle" font-size="10" fill="#444444">Exchange: poi.events (Durable)</text>

  <!-- Microsoft SQL Server 2022 -->
  <rect x="320" y="765" width="380" height="150" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="320" y="765" width="380" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="510" y="783" text-anchor="middle" font-size="12" font-weight="bold">Microsoft SQL Server 2022 (5 Cô lập DB)</text>
  <text x="340" y="810" font-size="10.5">• auth_db: users, refresh_tokens, qr_login_sessions</text>
  <text x="340" y="830" font-size="10.5">• content_db: pois, zones, poi_translations, chapters, products</text>
  <text x="340" y="850" font-size="10.5">• order_db: orders, order_items, payments, entitlements</text>
  <text x="340" y="870" font-size="10.5">• translation_db: translation_jobs, translation_cache</text>
  <text x="340" y="890" font-size="10.5">• analytics_db: analytics_events, qr_scan_stats</text>

  <!-- Local Media Storage -->
  <rect x="730" y="765" width="180" height="80" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="820" y="788" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;file storage&gt;&gt;</text>
  <text x="820" y="808" text-anchor="middle" font-size="12" font-weight="bold">Local Volume Storage</text>
  <text x="820" y="828" text-anchor="middle" font-size="10" fill="#444444">MP3 Files (HTTP 206)</text>

  <!-- External Cloud APIs -->
  <rect x="940" y="765" width="350" height="150" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="940" y="765" width="350" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="1115" y="783" text-anchor="middle" font-size="12" font-weight="bold">Hệ thống &amp; Dịch vụ Ngoại vi (External APIs)</text>
  <text x="960" y="815" font-size="11" font-weight="bold">• Cổng thanh toán VNPAY Sandbox (HMAC-SHA512)</text>
  <text x="960" y="840" font-size="11" font-weight="bold">• Bản đồ nền OpenStreetMap / Leaflet CDN</text>
  <text x="960" y="865" font-size="11" font-weight="bold">• Microsoft Edge-TTS Engine (Voice Synthesis)</text>
  <text x="960" y="890" font-size="11" font-weight="bold">• MyMemory Translation API &amp; Seed Dictionary</text>

  <!-- Microservices to DB lines -->
  <line x1="170" y1="570" x2="350" y2="765" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="420" y1="570" x2="450" y2="765" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="930" y1="570" x2="600" y2="765" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1180" y1="570" x2="650" y2="765" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="675" y1="660" x2="820" y2="765" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="675" y1="660" x2="1050" y2="765" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

</svg>
`;

// -----------------------------------------------------------------------------
// 2. HÌNH 4.2: SƠ ĐỒ TRIỂN KHAI HỆ THỐNG (DEPLOYMENT DIAGRAM)
// -----------------------------------------------------------------------------
const svg_4_2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1350 960" width="1350" height="960" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="675" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 4.2. SƠ ĐỒ TRIỂN KHAI VẬT LÝ VÀ MÔI TRƯỜNG THỰC THI (DEPLOYMENT DIAGRAM)</text>
  <text x="675" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Mô hình hóa Các Node Thiết bị Client, Máy chủ Ứng dụng Docker, Cơ sở Dữ liệu SQL Server và Dịch vụ Cloud</text>

  <!-- Node 1: Mobile Device (Tourist Client) -->
  <g transform="translate(50, 90)">
    <!-- 3D Node box -->
    <polygon points="0,15 15,0 350,0 350,260 335,275 0,275" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <line x1="335" y1="15" x2="350" y2="0" stroke="#000000" stroke-width="1.5"/>
    <line x1="335" y1="15" x2="0" y2="15" stroke="#000000" stroke-width="1.5"/>
    <line x1="335" y1="15" x2="335" y2="275" stroke="#000000" stroke-width="1.5"/>
    
    <text x="165" y="32" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;device&gt;&gt;</text>
    <text x="165" y="48" text-anchor="middle" font-size="13" font-weight="bold">Điện thoại Di động Du khách</text>
    <text x="165" y="64" text-anchor="middle" font-size="10.5" fill="#444444">(Apple iOS / Google Android)</text>

    <!-- Execution Environment: Web Browser -->
    <rect x="20" y="80" width="295" height="180" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
    <text x="167" y="100" text-anchor="middle" font-size="10.5" font-style="italic">&lt;&lt;execution environment&gt;&gt;</text>
    <text x="167" y="115" text-anchor="middle" font-size="11.5" font-weight="bold">Trình duyệt Web (Safari / Chrome)</text>
    
    <!-- Artifacts -->
    <rect x="35" y="130" width="265" height="42" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="167" y="148" text-anchor="middle" font-size="10.5" font-weight="bold">&lt;&lt;artifact&gt;&gt; echora-pwa-spa.js</text>
    <text x="167" y="162" text-anchor="middle" font-size="9.5" fill="#444444">(React 18 SPA Bundle, Leaflet, AudioPlayer)</text>

    <text x="40" y="195" font-size="10">• Phần cứng: Cảm biến GPS Geolocation API</text>
    <text x="40" y="215" font-size="10">• Phần cứng: Camera quét mã QR WebRTC</text>
    <text x="40" y="235" font-size="10">• Bộ nhớ: LocalStorage (Cart), RAM (JWT)</text>
    <text x="40" y="252" font-size="10">• API: HTML5 Audio, Web Speech Synthesis</text>
  </g>

  <!-- Node 2: Desktop PC (Admin CMS Console) -->
  <g transform="translate(50, 420)">
    <polygon points="0,15 15,0 350,0 350,220 335,235 0,235" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <line x1="335" y1="15" x2="350" y2="0" stroke="#000000" stroke-width="1.5"/>
    <line x1="335" y1="15" x2="0" y2="15" stroke="#000000" stroke-width="1.5"/>
    <line x1="335" y1="15" x2="335" y2="235" stroke="#000000" stroke-width="1.5"/>

    <text x="165" y="32" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;device&gt;&gt;</text>
    <text x="165" y="48" text-anchor="middle" font-size="13" font-weight="bold">Máy trạm Quản trị viên (Admin PC)</text>
    <text x="165" y="64" text-anchor="middle" font-size="10.5" fill="#444444">(Windows 11 / macOS Workstation)</text>

    <rect x="20" y="80" width="295" height="140" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
    <text x="167" y="100" text-anchor="middle" font-size="10.5" font-style="italic">&lt;&lt;execution environment&gt;&gt;</text>
    <text x="167" y="115" text-anchor="middle" font-size="11.5" font-weight="bold">Trình duyệt Web Desktop</text>

    <rect x="35" y="130" width="265" height="42" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="167" y="148" text-anchor="middle" font-size="10.5" font-weight="bold">&lt;&lt;artifact&gt;&gt; echora-admin-cms.js</text>
    <text x="167" y="162" text-anchor="middle" font-size="9.5" fill="#444444">(Admin Dashboard, POI Editor, Order Manager)</text>

    <text x="40" y="195" font-size="10">• Giao thức: HTTPS / TLS 1.3</text>
    <text x="40" y="212" font-size="10">• Xác thực: JWT Admin Bearer Token</text>
  </g>

  <!-- Node 3: Application Server Node (Docker Host) -->
  <g transform="translate(480, 80)">
    <polygon points="0,15 15,0 470,0 470,580 455,595 0,595" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <line x1="455" y1="15" x2="470" y2="0" stroke="#000000" stroke-width="1.5"/>
    <line x1="455" y1="15" x2="0" y2="15" stroke="#000000" stroke-width="1.5"/>
    <line x1="455" y1="15" x2="455" y2="595" stroke="#000000" stroke-width="1.5"/>

    <text x="227" y="32" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;device&gt;&gt;</text>
    <text x="227" y="48" text-anchor="middle" font-size="13" font-weight="bold">Máy chủ Ứng dụng (Application Server)</text>
    <text x="227" y="64" text-anchor="middle" font-size="10.5" fill="#444444">Linux Ubuntu 22.04 LTS / Docker Engine 24.0</text>

    <!-- Docker Container 1: Gateway -->
    <rect x="25" y="80" width="405" height="65" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
    <text x="227" y="98" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;execution environment&gt;&gt; Docker: api-gateway (Port 8080)</text>
    <text x="227" y="115" text-anchor="middle" font-size="11" font-weight="bold">&lt;&lt;artifact&gt;&gt; api-gateway.jar (Spring Cloud Gateway)</text>
    <text x="227" y="132" text-anchor="middle" font-size="9.5" fill="#555555">RateLimiter, SecurityFilter, TokenValidation</text>

    <!-- Docker Container 2: Auth -->
    <rect x="25" y="155" width="405" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="227" y="173" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;execution environment&gt;&gt; Docker: auth-service (Port 8081)</text>
    <text x="227" y="190" text-anchor="middle" font-size="11" font-weight="bold">&lt;&lt;artifact&gt;&gt; auth-service.jar (Spring Boot 3)</text>
    <text x="227" y="207" text-anchor="middle" font-size="9.5" fill="#555555">User Registration, Login, TokenRotation, RBAC</text>

    <!-- Docker Container 3: Content -->
    <rect x="25" y="230" width="405" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="227" y="248" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;execution environment&gt;&gt; Docker: content-service (Port 8082)</text>
    <text x="227" y="265" text-anchor="middle" font-size="11" font-weight="bold">&lt;&lt;artifact&gt;&gt; content-service.jar (Spring Boot 3)</text>
    <text x="227" y="282" text-anchor="middle" font-size="9.5" fill="#555555">POI Guide, Zones, Routes, Souvenir Products, Audio Stream HTTP 206</text>

    <!-- Docker Container 4: Order -->
    <rect x="25" y="305" width="405" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="227" y="323" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;execution environment&gt;&gt; Docker: order-service (Port 8083)</text>
    <text x="227" y="340" text-anchor="middle" font-size="11" font-weight="bold">&lt;&lt;artifact&gt;&gt; order-service.jar (Spring Boot 3)</text>
    <text x="227" y="357" text-anchor="middle" font-size="9.5" fill="#555555">Cart, Orders, VNPAY HMAC-SHA512, VietQR Builder</text>

    <!-- Docker Container 5: Translation & TTS -->
    <rect x="25" y="380" width="405" height="65" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="227" y="398" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;execution environment&gt;&gt; Docker: translation-tts-service (Port 8084)</text>
    <text x="227" y="415" text-anchor="middle" font-size="11" font-weight="bold">&lt;&lt;artifact&gt;&gt; translation-tts-service.jar (Edge-TTS Worker)</text>
    <text x="227" y="432" text-anchor="middle" font-size="9.5" fill="#555555">AMQP Listener, Multi-language Translator, Edge-TTS CLI</text>

    <!-- Docker Container 6: RabbitMQ -->
    <rect x="25" y="455" width="405" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <text x="227" y="473" text-anchor="middle" font-size="10" font-style="italic">&lt;&lt;execution environment&gt;&gt; Docker: rabbitmq (Port 5672, 15672)</text>
    <text x="227" y="490" text-anchor="middle" font-size="11" font-weight="bold">RabbitMQ Message Broker 3.12 (AMQP Protocol)</text>
    <text x="227" y="505" text-anchor="middle" font-size="9.5" fill="#555555">Durable Exchange: poi.events, Queue: poi.processing.queue</text>

    <!-- Volume -->
    <rect x="25" y="525" width="405" height="45" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="227" y="543" text-anchor="middle" font-size="10.5" font-weight="bold">&lt;&lt;storage volume&gt;&gt; /var/echora/audio_media/</text>
    <text x="227" y="558" text-anchor="middle" font-size="9.5" fill="#444444">Chứa toàn bộ các tệp MP3 sinh bởi Edge-TTS phục vụ truyền phát</text>
  </g>

  <!-- Node 4: Database Server Node -->
  <g transform="translate(1010, 80)">
    <polygon points="0,15 15,0 300,0 300,380 285,395 0,395" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <line x1="285" y1="15" x2="300" y2="0" stroke="#000000" stroke-width="1.5"/>
    <line x1="285" y1="15" x2="0" y2="15" stroke="#000000" stroke-width="1.5"/>
    <line x1="285" y1="15" x2="285" y2="395" stroke="#000000" stroke-width="1.5"/>

    <text x="142" y="32" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;device&gt;&gt;</text>
    <text x="142" y="48" text-anchor="middle" font-size="13" font-weight="bold">Máy chủ Cơ sở Dữ liệu</text>
    <text x="142" y="64" text-anchor="middle" font-size="10.5" fill="#444444">Microsoft SQL Server 2022</text>

    <rect x="20" y="80" width="250" height="295" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
    <text x="145" y="102" text-anchor="middle" font-size="11" font-weight="bold">5 CSDL Phân tách Độc lập</text>
    
    <rect x="30" y="120" width="230" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
    <text x="145" y="138" text-anchor="middle" font-size="10.5" font-weight="bold">1. auth_db</text>
    <text x="145" y="152" text-anchor="middle" font-size="9" fill="#555555">users, refresh_tokens, qr_login</text>

    <rect x="30" y="170" width="230" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
    <text x="145" y="188" text-anchor="middle" font-size="10.5" font-weight="bold">2. content_db</text>
    <text x="145" y="202" text-anchor="middle" font-size="9" fill="#555555">pois, translations, chapters, products</text>

    <rect x="30" y="220" width="230" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
    <text x="145" y="238" text-anchor="middle" font-size="10.5" font-weight="bold">3. order_db</text>
    <text x="145" y="252" text-anchor="middle" font-size="9" fill="#555555">orders, order_items, payments</text>

    <rect x="30" y="270" width="230" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
    <text x="145" y="288" text-anchor="middle" font-size="10.5" font-weight="bold">4. translation_db</text>
    <text x="145" y="302" text-anchor="middle" font-size="9" fill="#555555">translation_jobs, translation_cache</text>

    <rect x="30" y="320" width="230" height="40" fill="#ffffff" stroke="#000000" stroke-width="1"/>
    <text x="145" y="338" text-anchor="middle" font-size="10.5" font-weight="bold">5. analytics_db</text>
    <text x="145" y="352" text-anchor="middle" font-size="9" fill="#555555">analytics_events, qr_scan_stats</text>
  </g>

  <!-- External Cloud Systems Box -->
  <g transform="translate(1010, 500)">
    <polygon points="0,15 15,0 300,0 300,210 285,225 0,225" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <line x1="285" y1="15" x2="300" y2="0" stroke="#000000" stroke-width="1.5"/>
    <line x1="285" y1="15" x2="0" y2="15" stroke="#000000" stroke-width="1.5"/>
    <line x1="285" y1="15" x2="285" y2="225" stroke="#000000" stroke-width="1.5"/>

    <text x="142" y="32" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;cloud services&gt;&gt;</text>
    <text x="142" y="48" text-anchor="middle" font-size="13" font-weight="bold">Hạ tầng Dịch vụ Bên ngoài</text>

    <rect x="20" y="65" width="250" height="145" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
    <text x="35" y="90" font-size="10.5" font-weight="bold">• Cổng thanh toán VNPAY Sandbox</text>
    <text x="45" y="105" font-size="9.5" fill="#555555">(Giao thức HTTPS, IPN Webhook)</text>

    <text x="35" y="130" font-size="10.5" font-weight="bold">• Cổng Ngân hàng VietQR Napas</text>
    <text x="45" y="145" font-size="9.5" fill="#555555">(Sinh mã chuyển khoản 24/7)</text>

    <text x="35" y="170" font-size="10.5" font-weight="bold">• Dịch vụ Bản đồ OpenStreetMap</text>
    <text x="45" y="185" font-size="9.5" fill="#555555">(Leaflet Tiles CDN qua HTTPS)</text>

    <text x="35" y="200" font-size="10.5" font-weight="bold">• Microsoft Edge-TTS Engine</text>
  </g>

  <!-- Network Communication Paths -->
  <!-- Tourist to Gateway -->
  <line x1="385" y1="200" x2="480" y2="200" stroke="#000000" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="432" y="190" text-anchor="middle" font-size="10" font-weight="bold">HTTPS 443</text>

  <!-- Admin to Gateway -->
  <line x1="385" y1="520" x2="480" y2="220" stroke="#000000" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="410" y="420" text-anchor="middle" font-size="10" font-weight="bold">HTTPS 443</text>

  <!-- App Server to DB Server -->
  <line x1="935" y1="260" x2="1010" y2="260" stroke="#000000" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="972" y="250" text-anchor="middle" font-size="10" font-weight="bold">TDS / JDBC:1433</text>

  <!-- App Server to External Cloud -->
  <line x1="935" y1="530" x2="1010" y2="560" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="965" y="520" text-anchor="middle" font-size="10" font-weight="bold">HTTPS REST</text>

</svg>
`;

// -----------------------------------------------------------------------------
// 3. HÌNH 4.3: SƠ ĐỒ THỰC THỂ MỐI QUAN HỆ CƠ SỞ DỮ LIỆU (ERD)
// -----------------------------------------------------------------------------
const svg_4_3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1450 1080" width="1450" height="1080" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="725" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 4.3. SƠ ĐỒ THỰC THỂ MỐI QUAN HỆ CƠ SỞ DỮ LIỆU CHUẨN CROW'S FOOT (ERD)</text>
  <text x="725" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Mô hình hóa 12 Thực thể Cốt lõi, Khóa chính (PK), Khóa ngoại (FK), Kiểu dữ liệu và Ràng buộc Toàn vẹn 3NF</text>

  <!-- 1. USERS Table -->
  <g transform="translate(50, 90)">
    <rect x="0" y="0" width="230" height="205" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="230" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="115" y="18" text-anchor="middle" font-size="12" font-weight="bold">USERS</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5">    email : VARCHAR(255) [UQ]</text>
    <text x="10" y="84" font-size="10.5">    password_hash : VARCHAR(255)</text>
    <text x="10" y="104" font-size="10.5">    full_name : NVARCHAR(100)</text>
    <text x="10" y="124" font-size="10.5">    role : VARCHAR(20) [USER/ADMIN]</text>
    <text x="10" y="144" font-size="10.5">    plan : VARCHAR(20) [FREE/PREM]</text>
    <text x="10" y="164" font-size="10.5">    status : VARCHAR(20) [ACTIVE]</text>
    <text x="10" y="184" font-size="10.5">    created_at : DATETIME2</text>
  </g>

  <!-- 2. REFRESH_TOKENS Table -->
  <g transform="translate(50, 340)">
    <rect x="0" y="0" width="230" height="145" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <rect x="0" y="0" width="230" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="115" y="18" text-anchor="middle" font-size="12" font-weight="bold">REFRESH_TOKENS</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  user_id : INT</text>
    <text x="10" y="84" font-size="10.5">    token_hash : VARCHAR(255) [UQ]</text>
    <text x="10" y="104" font-size="10.5">    expires_at : DATETIME2</text>
    <text x="10" y="124" font-size="10.5">    revoked : BIT (0/1)</text>
  </g>

  <!-- USERS to REFRESH_TOKENS line (1:N) -->
  <line x1="165" y1="295" x2="165" y2="340" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 3. ZONES Table -->
  <g transform="translate(370, 90)">
    <rect x="0" y="0" width="230" height="130" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <rect x="0" y="0" width="230" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="115" y="18" text-anchor="middle" font-size="12" font-weight="bold">ZONES</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5">    name : NVARCHAR(150)</text>
    <text x="10" y="84" font-size="10.5">    center_latitude : FLOAT</text>
    <text x="10" y="104" font-size="10.5">    center_longitude : FLOAT</text>
    <text x="10" y="122" font-size="10.5">    radius : FLOAT</text>
  </g>

  <!-- 4. POIS Table -->
  <g transform="translate(370, 270)">
    <rect x="0" y="0" width="240" height="225" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="240" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="120" y="18" text-anchor="middle" font-size="12" font-weight="bold">POIS (Điểm Di tích)</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  zone_id : INT</text>
    <text x="10" y="84" font-size="10.5">    name : NVARCHAR(150)</text>
    <text x="10" y="104" font-size="10.5">    slug : VARCHAR(150) [UQ]</text>
    <text x="10" y="124" font-size="10.5">    latitude : FLOAT</text>
    <text x="10" y="144" font-size="10.5">    longitude : FLOAT</text>
    <text x="10" y="164" font-size="10.5">    radius : FLOAT (35 - 60m)</text>
    <text x="10" y="184" font-size="10.5">    status : VARCHAR(20) [PUBLISHED]</text>
    <text x="10" y="204" font-size="10.5">    version : INT (Optimistic Lock)</text>
  </g>

  <!-- ZONES to POIS (1:N) -->
  <line x1="485" y1="220" x2="485" y2="270" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 5. POI_TRANSLATIONS Table -->
  <g transform="translate(680, 270)">
    <rect x="0" y="0" width="250" height="205" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="250" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="125" y="18" text-anchor="middle" font-size="12" font-weight="bold">POI_TRANSLATIONS</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  poi_id : INT</text>
    <text x="10" y="84" font-size="10.5">    language_code : VARCHAR(5) [vi/en/ja/ko]</text>
    <text x="10" y="104" font-size="10.5">    title : NVARCHAR(200)</text>
    <text x="10" y="124" font-size="10.5">    short_description : NVARCHAR(500)</text>
    <text x="10" y="144" font-size="10.5">    full_history : NVARCHAR(MAX)</text>
    <text x="10" y="164" font-size="10.5">    audio_url : VARCHAR(500) (MP3)</text>
    <text x="10" y="184" font-size="10.5">    translation_source : VARCHAR(20) [MANUAL/AI]</text>
  </g>

  <!-- POIS to POI_TRANSLATIONS (1:N) -->
  <line x1="610" y1="350" x2="680" y2="350" stroke="#000000" stroke-width="1.8" marker-end="url(#crowFoot)"/>

  <!-- 6. POI_CHAPTERS Table -->
  <g transform="translate(370, 540)">
    <rect x="0" y="0" width="240" height="150" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <rect x="0" y="0" width="240" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="120" y="18" text-anchor="middle" font-size="12" font-weight="bold">POI_CHAPTERS (Chương Thuyết minh)</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  poi_id : INT</text>
    <text x="10" y="84" font-size="10.5">    chapter_index : INT</text>
    <text x="10" y="104" font-size="10.5">    title : NVARCHAR(150)</text>
    <text x="10" y="124" font-size="10.5">    duration_seconds : INT</text>
  </g>

  <!-- POIS to POI_CHAPTERS (1:N) -->
  <line x1="485" y1="495" x2="485" y2="540" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 7. POI_CHAPTER_TRANSLATIONS Table -->
  <g transform="translate(680, 540)">
    <rect x="0" y="0" width="250" height="150" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <rect x="0" y="0" width="250" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="125" y="18" text-anchor="middle" font-size="12" font-weight="bold">POI_CHAPTER_TRANSLATIONS</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  chapter_id : INT</text>
    <text x="10" y="84" font-size="10.5">    language_code : VARCHAR(5)</text>
    <text x="10" y="104" font-size="10.5">    title : NVARCHAR(200)</text>
    <text x="10" y="124" font-size="10.5">    script_text : NVARCHAR(MAX)</text>
  </g>

  <!-- POI_CHAPTERS to POI_CHAPTER_TRANSLATIONS (1:N) -->
  <line x1="610" y1="615" x2="680" y2="615" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 8. CATEGORIES Table -->
  <g transform="translate(1000, 90)">
    <rect x="0" y="0" width="210" height="110" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <rect x="0" y="0" width="210" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="105" y="18" text-anchor="middle" font-size="12" font-weight="bold">CATEGORIES (Loại Quà)</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5">    name : NVARCHAR(100)</text>
    <text x="10" y="84" font-size="10.5">    slug : VARCHAR(100) [UQ]</text>
  </g>

  <!-- 9. PRODUCTS Table -->
  <g transform="translate(1000, 250)">
    <rect x="0" y="0" width="240" height="190" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="240" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="120" y="18" text-anchor="middle" font-size="12" font-weight="bold">PRODUCTS (Quà Lưu niệm)</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  poi_id : INT</text>
    <text x="10" y="84" font-size="10.5" font-weight="bold">FK  category_id : INT</text>
    <text x="10" y="104" font-size="10.5">    name : NVARCHAR(150)</text>
    <text x="10" y="124" font-size="10.5">    price : DECIMAL(18,2)</text>
    <text x="10" y="144" font-size="10.5">    stock_quantity : INT</text>
    <text x="10" y="164" font-size="10.5">    status : VARCHAR(20) [ACTIVE]</text>
  </g>

  <!-- CATEGORIES to PRODUCTS (1:N) -->
  <line x1="1105" y1="200" x2="1105" y2="250" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>
  <!-- POIS to PRODUCTS (1:N) -->
  <line x1="610" y1="310" x2="1000" y2="310" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 10. ORDERS Table -->
  <g transform="translate(50, 540)">
    <rect x="0" y="0" width="250" height="245" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="250" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="125" y="18" text-anchor="middle" font-size="12" font-weight="bold">ORDERS (Đơn hàng &amp; Gói)</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5">    order_code : VARCHAR(50) [UQ]</text>
    <text x="10" y="84" font-size="10.5" font-weight="bold">FK  user_id : INT</text>
    <text x="10" y="104" font-size="10.5">    total_amount : DECIMAL(18,2)</text>
    <text x="10" y="124" font-size="10.5">    shipping_fee : DECIMAL(18,2)</text>
    <text x="10" y="144" font-size="10.5">    final_amount : DECIMAL(18,2)</text>
    <text x="10" y="164" font-size="10.5">    status : VARCHAR(30) [PAID/PEND]</text>
    <text x="10" y="184" font-size="10.5">    payment_method : VARCHAR(30)</text>
    <text x="10" y="204" font-size="10.5">    idempotency_key : VARCHAR(100)</text>
    <text x="10" y="224" font-size="10.5">    created_at : DATETIME2</text>
  </g>

  <!-- USERS to ORDERS (1:N) -->
  <line x1="110" y1="295" x2="110" y2="540" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 11. ORDER_ITEMS Table -->
  <g transform="translate(370, 750)">
    <rect x="0" y="0" width="240" height="170" fill="#ffffff" stroke="#000000" stroke-width="2"/>
    <rect x="0" y="0" width="240" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="120" y="18" text-anchor="middle" font-size="12" font-weight="bold">ORDER_ITEMS</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  order_id : INT</text>
    <text x="10" y="84" font-size="10.5" font-weight="bold">FK  product_id : INT (Nullable)</text>
    <text x="10" y="104" font-size="10.5">    item_type : VARCHAR(30) [SOUV/PREM]</text>
    <text x="10" y="124" font-size="10.5">    unit_price : DECIMAL(18,2)</text>
    <text x="10" y="144" font-size="10.5">    quantity : INT</text>
  </g>

  <!-- ORDERS to ORDER_ITEMS (1:N) -->
  <line x1="300" y1="720" x2="370" y2="800" stroke="#000000" stroke-width="1.8" marker-end="url(#crowFoot)"/>
  <!-- PRODUCTS to ORDER_ITEMS (1:N) -->
  <line x1="1120" y1="440" x2="610" y2="820" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#crowFoot)"/>

  <!-- 12. PAYMENTS Table -->
  <g transform="translate(50, 840)">
    <rect x="0" y="0" width="250" height="185" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <rect x="0" y="0" width="250" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="125" y="18" text-anchor="middle" font-size="12" font-weight="bold">PAYMENTS (Giao dịch Thanh toán)</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5" font-weight="bold">FK  order_id : INT</text>
    <text x="10" y="84" font-size="10.5">    provider : VARCHAR(30) [VNPAY/VIETQR]</text>
    <text x="10" y="104" font-size="10.5">    transaction_ref : VARCHAR(100) [UQ]</text>
    <text x="10" y="124" font-size="10.5">    amount : DECIMAL(18,2)</text>
    <text x="10" y="144" font-size="10.5">    status : VARCHAR(30) [SUCCESS/FAIL]</text>
    <text x="10" y="164" font-size="10.5">    response_code : VARCHAR(50)</text>
  </g>

  <!-- ORDERS to PAYMENTS (1:1 / 1:N) -->
  <line x1="175" y1="785" x2="175" y2="840" stroke="#000000" stroke-width="1.5" marker-end="url(#crowFoot)"/>

  <!-- 13. ANALYTICS_EVENTS Table -->
  <g transform="translate(680, 750)">
    <rect x="0" y="0" width="250" height="170" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
    <rect x="0" y="0" width="250" height="26" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
    <text x="125" y="18" text-anchor="middle" font-size="12" font-weight="bold">ANALYTICS_EVENTS</text>
    <text x="10" y="44" font-size="10.5" font-weight="bold">PK  id : INT (Identity)</text>
    <text x="10" y="64" font-size="10.5">    event_type : VARCHAR(30) [SCAN/PLAY]</text>
    <text x="10" y="84" font-size="10.5" font-weight="bold">FK  poi_id : INT</text>
    <text x="10" y="104" font-size="10.5">    language_code : VARCHAR(5)</text>
    <text x="10" y="124" font-size="10.5">    client_ip : VARCHAR(45)</text>
    <text x="10" y="144" font-size="10.5">    timestamp : DATETIME2</text>
  </g>

  <!-- POIS to ANALYTICS_EVENTS (1:N) -->
  <line x1="570" y1="495" x2="720" y2="750" stroke="#000000" stroke-width="1.2" stroke-dasharray="3 2" marker-end="url(#crowFoot)"/>

  <!-- Crow's Foot Legend Box -->
  <rect x="1000" y="750" width="400" height="170" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="1200" y="775" text-anchor="middle" font-size="11.5" font-weight="bold">CHÚ GIẢI KÝ PHÁP CROW'S FOOT CHUẨN</text>
  <text x="1015" y="805" font-size="10.5">||------||  : Quan hệ 1 - 1 Bắt buộc (One to Exactly One)</text>
  <text x="1015" y="830" font-size="10.5">||------o|  : Quan hệ 1 - 1 Tùy chọn (One to Zero or One)</text>
  <text x="1015" y="855" font-size="10.5">||------|&lt;  : Quan hệ 1 - N Bắt buộc (One to Many, At least One)</text>
  <text x="1015" y="880" font-size="10.5">||------o&lt;  : Quan hệ 1 - N Tùy chọn (One to Many, Zero Allowed)</text>
  <text x="1015" y="905" font-size="10" font-style="italic">PK = Primary Key (Khóa chính) | FK = Foreign Key (Khóa ngoại)</text>
</svg>
`;

async function processDiagram(name, svgContent) {
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
  console.log('Rendering Chapter 4 diagrams to Diagram_Source_Chuong_4/ ...');
  await processDiagram('hinh_4_1_component_diagram', svg_4_1);
  await processDiagram('hinh_4_2_deployment_diagram', svg_4_2);
  await processDiagram('hinh_4_3_erd_database', svg_4_3);
  console.log('Finished rendering Chapter 4 diagrams!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
