import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Clean, professional, orthogonal Use Case Diagram avoiding overlapping lines
const useCaseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1560 1100" width="1560" height="1100" style="background:#ffffff; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
  <defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="systemBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    
    <!-- Bubble Gradients -->
    <linearGradient id="touristUc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="coreUc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f3ff"/>
      <stop offset="100%" stop-color="#ede9fe"/>
    </linearGradient>
    <linearGradient id="adminUc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
    <linearGradient id="systemUc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ecfdf5"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>

    <!-- Filters -->
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.1"/>
    </filter>

    <!-- Markers -->
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569"/>
    </marker>
    <marker id="includeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 8 5 L 0 8 z" fill="#0284c7"/>
    </marker>
    <marker id="extendArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 8 5 L 0 8 z" fill="#d97706"/>
    </marker>
    <marker id="generalizeArrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <polygon points="0,1 10,6 0,11" fill="#ffffff" stroke="#475569" stroke-width="1.8"/>
    </marker>
  </defs>

  <!-- TITLE -->
  <rect x="30" y="20" width="1500" height="60" rx="8" fill="url(#headerGrad)"/>
  <text x="780" y="46" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="700">SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ (USE CASE DIAGRAM) - HỆ THỐNG ECHORA</text>
  <text x="780" y="66" text-anchor="middle" fill="#94a3b8" font-size="12">Tuân thủ chuẩn UML 2.5 &amp; Khắc phục triệt để 5 sai lầm thường gặp trong phân tích Use Case (Thinhnotes)</text>

  <!-- SYSTEM BOUNDARY -->
  <rect x="290" y="100" width="970" height="970" rx="14" fill="url(#systemBg)" stroke="#3b82f6" stroke-width="2" stroke-dasharray="8 5" filter="url(#cardShadow)"/>
  <rect x="310" y="112" width="540" height="28" rx="5" fill="#2563eb"/>
  <text x="580" y="131" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700">System Boundary: Hệ thống Hướng dẫn viên Du lịch Đa ngôn ngữ Echora</text>

  <!-- ================= SECTION 1: PHÂN HỆ DU KHÁCH & THÀNH VIÊN ================= -->
  <rect x="310" y="150" width="930" height="370" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
  <text x="330" y="172" fill="#1e40af" font-size="12" font-weight="700">1. PHÂN HỆ TRẢI NGHIỆM DU KHÁCH &amp; CÁ NHÂN HÓA (TOURIST &amp; MEMBER)</text>

  <!-- Row 1: UC01, UC02, UC03 -->
  <!-- UC01: Khám phá bản đồ di tích -->
  <g transform="translate(330, 195)" filter="url(#shadow)">
    <ellipse cx="115" cy="35" rx="105" ry="32" fill="url(#touristUc)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="115" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">UC01: Khám phá</text>
    <text x="115" y="47" text-anchor="middle" font-size="12" fill="#1e40af">bản đồ di tích</text>
  </g>

  <!-- UC02: Nghe thuyết minh đa ngữ -->
  <g transform="translate(640, 195)" filter="url(#shadow)">
    <ellipse cx="130" cy="35" rx="120" ry="32" fill="url(#touristUc)" stroke="#3b82f6" stroke-width="2"/>
    <text x="130" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">UC02: Nghe thuyết minh</text>
    <text x="130" y="47" text-anchor="middle" font-size="12" fill="#1e40af">đa ngữ (vi/en/ja/ko)</text>
  </g>

  <!-- UC03: Nhận thuyết minh GPS tự động -->
  <g transform="translate(970, 195)" filter="url(#shadow)">
    <ellipse cx="125" cy="35" rx="115" ry="32" fill="url(#coreUc)" stroke="#8b5cf6" stroke-width="2"/>
    <text x="125" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#581c87">UC03: Nhận thuyết minh</text>
    <text x="125" y="47" text-anchor="middle" font-size="12" fill="#6b21a8">GPS tự động (Geofence)</text>
  </g>

  <!-- Row 2: UC04, UC07 -->
  <!-- UC04: Quét mã QR di sản -->
  <g transform="translate(640, 305)" filter="url(#shadow)">
    <ellipse cx="130" cy="35" rx="120" ry="32" fill="url(#touristUc)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="130" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">UC04: Quét mã QR</text>
    <text x="130" y="47" text-anchor="middle" font-size="12" fill="#1e40af">tại điểm di sản</text>
  </g>

  <!-- UC07: Đặt mua quà lưu niệm VietQR -->
  <g transform="translate(330, 305)" filter="url(#shadow)">
    <ellipse cx="115" cy="35" rx="105" ry="32" fill="url(#touristUc)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="115" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">UC07: Đặt mua quà</text>
    <text x="115" y="47" text-anchor="middle" font-size="12" fill="#1e40af">lưu niệm VietQR</text>
  </g>

  <!-- Row 3: UC05, UC06 (Dành cho Người dùng đăng ký) -->
  <!-- UC05: Quản lý hồ sơ & Lịch sử -->
  <g transform="translate(330, 415)" filter="url(#shadow)">
    <ellipse cx="115" cy="35" rx="105" ry="32" fill="url(#touristUc)" stroke="#0284c7" stroke-width="1.5"/>
    <text x="115" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#0369a1">UC05: Quản lý hồ sơ &amp;</text>
    <text x="115" y="47" text-anchor="middle" font-size="12" fill="#0284c7">lịch sử tham quan</text>
  </g>

  <!-- UC06: Lưu điểm yêu thích -->
  <g transform="translate(640, 415)" filter="url(#shadow)">
    <ellipse cx="130" cy="35" rx="120" ry="32" fill="url(#touristUc)" stroke="#0284c7" stroke-width="1.5"/>
    <text x="130" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#0369a1">UC06: Lưu điểm di tích</text>
    <text x="130" y="47" text-anchor="middle" font-size="12" fill="#0284c7">ưa thích (Bookmark)</text>
  </g>


  <!-- ================= SECTION 2: PHÂN HỆ QUẢN TRỊ DI SẢN (ADMIN) ================= -->
  <rect x="310" y="535" width="930" height="230" rx="10" fill="#fffdf5" stroke="#fde047" stroke-width="1"/>
  <text x="330" y="557" fill="#854d0e" font-size="12" font-weight="700">2. PHÂN HỆ BẢO TỒN &amp; QUẢN TRỊ NỘI DUNG DI SẢN (HERITAGE MANAGEMENT)</text>

  <!-- Row 1 Admin: UC08, UC09, UC10 -->
  <!-- UC08: Quản lý Điểm tham quan (Gom CRUD) -->
  <g transform="translate(330, 580)" filter="url(#shadow)">
    <ellipse cx="115" cy="35" rx="105" ry="32" fill="url(#adminUc)" stroke="#d97706" stroke-width="2"/>
    <text x="115" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">UC08: Quản lý Điểm</text>
    <text x="115" y="47" text-anchor="middle" font-size="12" fill="#92400e">tham quan (POI)</text>
  </g>

  <!-- UC09: Quản lý tuyến lộ trình tham quan -->
  <g transform="translate(640, 580)" filter="url(#shadow)">
    <ellipse cx="130" cy="35" rx="120" ry="32" fill="url(#adminUc)" stroke="#d97706" stroke-width="1.5"/>
    <text x="130" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">UC09: Quản lý Tuyến</text>
    <text x="130" y="47" text-anchor="middle" font-size="12" fill="#92400e">lộ trình tham quan</text>
  </g>

  <!-- UC10: Xem Báo cáo thống kê -->
  <g transform="translate(970, 580)" filter="url(#shadow)">
    <ellipse cx="125" cy="35" rx="115" ry="32" fill="url(#adminUc)" stroke="#d97706" stroke-width="1.5"/>
    <text x="125" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">UC10: Xem Báo cáo</text>
    <text x="125" y="47" text-anchor="middle" font-size="12" fill="#92400e">thống kê tương tác</text>
  </g>

  <!-- Row 2 Admin: UC14 -->
  <!-- UC14: Quản lý bài viết văn hóa -->
  <g transform="translate(640, 680)" filter="url(#shadow)">
    <ellipse cx="130" cy="35" rx="120" ry="32" fill="url(#adminUc)" stroke="#d97706" stroke-width="1.5"/>
    <text x="130" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">UC14: Quản lý bài viết</text>
    <text x="130" y="47" text-anchor="middle" font-size="12" fill="#92400e">văn hóa &amp; tin tức</text>
  </g>


  <!-- ================= SECTION 3: PHÂN HỆ NỀN TẢNG & TỰ ĐỘNG HÓA ================= -->
  <rect x="310" y="780" width="930" height="135" rx="10" fill="#f0fdf4" stroke="#86efac" stroke-width="1"/>
  <text x="330" y="802" fill="#166534" font-size="12" font-weight="700">3. PHÂN HỆ DỊCH VỤ NỀN TẢNG &amp; AN NINH HỆ THỐNG (SYSTEM &amp; INFRASTRUCTURE)</text>

  <!-- UC11: Tự động dịch và TTS -->
  <g transform="translate(330, 825)" filter="url(#shadow)">
    <ellipse cx="115" cy="35" rx="105" ry="32" fill="url(#systemUc)" stroke="#10b981" stroke-width="2"/>
    <text x="115" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#065f46">UC11: Tự động dịch &amp;</text>
    <text x="115" y="47" text-anchor="middle" font-size="12" fill="#047857">tổng hợp âm thanh</text>
  </g>

  <!-- UC12: Ghi nhận sự kiện phân tích -->
  <g transform="translate(640, 825)" filter="url(#shadow)">
    <ellipse cx="130" cy="35" rx="120" ry="32" fill="url(#systemUc)" stroke="#10b981" stroke-width="1.5"/>
    <text x="130" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#065f46">UC12: Ghi nhận sự kiện</text>
    <text x="130" y="47" text-anchor="middle" font-size="12" fill="#047857">phân tích du lịch</text>
  </g>

  <!-- UC13: Xác thực JWT & Phiên làm việc -->
  <g transform="translate(970, 825)" filter="url(#shadow)">
    <ellipse cx="125" cy="35" rx="115" ry="32" fill="url(#systemUc)" stroke="#10b981" stroke-width="1.5"/>
    <text x="125" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#065f46">UC13: Xác thực an toàn &amp;</text>
    <text x="125" y="47" text-anchor="middle" font-size="12" fill="#047857">Xoay vòng phiên (JWT)</text>
  </g>


  <!-- ================= BA BEST PRACTICES CALLOUT BOX ================= -->
  <g transform="translate(310, 930)">
    <rect x="0" y="0" width="930" height="120" rx="8" fill="#ffffff" stroke="#64748b" stroke-width="1" stroke-dasharray="4 2"/>
    <text x="20" y="22" font-size="12" font-weight="700" fill="#0f172a">TUÂN THỦ NGUYÊN TẮC THIẾT KẾ USE CASE CHUẨN (KHẮC PHỤC 5 SAI LẦM THƯỜNG GẶP - THINHNOTES):</text>
    <text x="30" y="42" font-size="11" fill="#334155"><tspan font-weight="700" fill="#0284c7">1. Đặt tên Verb + Noun:</tspan> Toàn bộ tên Use Case mang tính hành động hướng mục tiêu người dùng (User Goal), không đặt tên thao tác giao diện.</text>
    <text x="30" y="60" font-size="11" fill="#334155"><tspan font-weight="700" fill="#0284c7">2. Không phân rã luồng quy trình (Functional Decomposition):</tspan> Luồng các bước quy trình chi tiết được chuyển giao sang Activity Diagram.</text>
    <text x="30" y="78" font-size="11" fill="#334155"><tspan font-weight="700" fill="#0284c7">3. Không lạm dụng Include Đăng nhập:</tspan> Đăng nhập là Precondition (điều kiện tiền đề) trong tài liệu đặc tả, không vẽ mạng nhện nối vào mọi UC.</text>
    <text x="30" y="96" font-size="11" fill="#334155"><tspan font-weight="700" fill="#0284c7">4. Gom nhóm CRUD:</tspan> Thao tác Thêm, Sửa, Xóa, Xem POI được chuẩn hóa gọn trong 1 ca sử dụng "UC08: Quản lý Điểm tham quan (POI)".</text>
    <text x="30" y="112" font-size="11" fill="#334155"><tspan font-weight="700" fill="#0284c7">5. Ranh giới rõ ràng:</tspan> System Boundary bao trọn gói giải pháp, Actor đặt hoàn toàn bên ngoài, hạn chế tối đa các đường chéo nhau.</text>
  </g>


  <!-- ================= HUMAN ACTORS (LEFT) ================= -->
  <!-- ACTOR 1: Khách vãng lai -->
  <g transform="translate(60, 200)">
    <circle cx="50" cy="25" r="16" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2"/>
    <line x1="50" y1="41" x2="50" y2="80" stroke="#1d4ed8" stroke-width="2"/>
    <line x1="25" y1="56" x2="75" y2="56" stroke="#1d4ed8" stroke-width="2"/>
    <line x1="50" y1="80" x2="28" y2="115" stroke="#1d4ed8" stroke-width="2"/>
    <line x1="50" y1="80" x2="72" y2="115" stroke="#1d4ed8" stroke-width="2"/>
    <text x="50" y="135" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">Khách vãng lai</text>
    <text x="50" y="152" text-anchor="middle" font-size="11" fill="#64748b">(Guest Tourist)</text>
  </g>

  <!-- ACTOR 2: Người dùng đăng ký -->
  <g transform="translate(60, 400)">
    <circle cx="50" cy="25" r="16" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
    <line x1="50" y1="41" x2="50" y2="80" stroke="#15803d" stroke-width="2"/>
    <line x1="25" y1="56" x2="75" y2="56" stroke="#15803d" stroke-width="2"/>
    <line x1="50" y1="80" x2="28" y2="115" stroke="#15803d" stroke-width="2"/>
    <line x1="50" y1="80" x2="72" y2="115" stroke="#15803d" stroke-width="2"/>
    <text x="50" y="135" text-anchor="middle" font-size="13" font-weight="700" fill="#14532d">Người dùng đăng ký</text>
    <text x="50" y="152" text-anchor="middle" font-size="11" fill="#64748b">(Registered User)</text>
  </g>

  <!-- ACTOR INHERITANCE: Registered User -> Guest Tourist -->
  <path d="M 110 400 L 110 365" fill="none" stroke="#475569" stroke-width="1.8" marker-end="url(#generalizeArrow)"/>
  <text x="115" y="388" font-size="10" fill="#475569" font-style="italic">kế thừa</text>

  <!-- ACTOR 3: Quản trị viên di sản -->
  <g transform="translate(60, 620)">
    <circle cx="50" cy="25" r="16" fill="#fef3c7" stroke="#b45309" stroke-width="2"/>
    <line x1="50" y1="41" x2="50" y2="80" stroke="#b45309" stroke-width="2"/>
    <line x1="25" y1="56" x2="75" y2="56" stroke="#b45309" stroke-width="2"/>
    <line x1="50" y1="80" x2="28" y2="115" stroke="#b45309" stroke-width="2"/>
    <line x1="50" y1="80" x2="72" y2="115" stroke="#b45309" stroke-width="2"/>
    <text x="50" y="135" text-anchor="middle" font-size="13" font-weight="700" fill="#78350f">Quản trị viên di sản</text>
    <text x="50" y="152" text-anchor="middle" font-size="11" fill="#64748b">(Heritage Admin)</text>
  </g>


  <!-- ================= SYSTEM ACTORS (RIGHT) ================= -->
  <!-- ACTOR 4: GPS Device -->
  <g transform="translate(1310, 195)">
    <rect x="0" y="0" width="180" height="70" rx="8" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="90" y="24" text-anchor="middle" font-size="10" fill="#64748b">&lt;&lt;system actor&gt;&gt;</text>
    <text x="90" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Định vị GPS thiết bị</text>
    <text x="90" y="58" text-anchor="middle" font-size="11" fill="#475569">(Device Geolocation)</text>
  </g>

  <!-- ACTOR 5: Translation & TTS Service -->
  <g transform="translate(1310, 580)">
    <rect x="0" y="0" width="180" height="70" rx="8" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="90" y="24" text-anchor="middle" font-size="10" fill="#64748b">&lt;&lt;external service&gt;&gt;</text>
    <text x="90" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Động cơ Dịch &amp; TTS</text>
    <text x="90" y="58" text-anchor="middle" font-size="11" fill="#475569">(Edge-TTS Service)</text>
  </g>

  <!-- ACTOR 6: RabbitMQ Broker -->
  <g transform="translate(1310, 825)">
    <rect x="0" y="0" width="180" height="70" rx="8" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" filter="url(#shadow)"/>
    <text x="90" y="24" text-anchor="middle" font-size="10" fill="#64748b">&lt;&lt;infrastructure&gt;&gt;</text>
    <text x="90" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">Bộ điều phối sự kiện</text>
    <text x="90" y="58" text-anchor="middle" font-size="11" fill="#475569">(RabbitMQ Broker)</text>
  </g>


  <!-- ================= ASSOCIATIONS & CONNECTIONS (CLEAN ORTHOGONAL) ================= -->
  <!-- Khách vãng lai connections -->
  <line x1="160" y1="240" x2="330" y2="230" stroke="#1d4ed8" stroke-width="1.5"/> <!-- to UC01 -->
  <path d="M 160 240 Q 230 200 640 220" fill="none" stroke="#1d4ed8" stroke-width="1.5"/> <!-- to UC02 -->
  <line x1="160" y1="260" x2="330" y2="340" stroke="#1d4ed8" stroke-width="1.5"/> <!-- to UC07 -->
  <path d="M 160 260 Q 230 320 640 335" fill="none" stroke="#1d4ed8" stroke-width="1.5"/> <!-- to UC04 -->

  <!-- Người dùng đăng ký connections -->
  <line x1="160" y1="445" x2="330" y2="450" stroke="#15803d" stroke-width="1.5"/> <!-- to UC05 -->
  <line x1="160" y1="455" x2="640" y2="450" stroke="#15803d" stroke-width="1.5"/> <!-- to UC06 -->

  <!-- Quản trị viên di sản connections -->
  <line x1="160" y1="670" x2="330" y2="615" stroke="#b45309" stroke-width="1.5"/> <!-- to UC08 -->
  <path d="M 160 670 Q 240 600 640 615" fill="none" stroke="#b45309" stroke-width="1.5"/> <!-- to UC09 -->
  <path d="M 160 670 Q 260 560 970 610" fill="none" stroke="#b45309" stroke-width="1.5"/> <!-- to UC10 -->
  <path d="M 160 680 Q 240 700 640 710" fill="none" stroke="#b45309" stroke-width="1.5"/> <!-- to UC14 -->

  <!-- GPS Device to UC03 -->
  <line x1="1310" y1="230" x2="1210" y2="230" stroke="#64748b" stroke-width="1.5"/>

  <!-- Edge-TTS to UC11 -->
  <path d="M 1310 615 Q 1280 615 1280 720 Q 1280 840 550 840" fill="none" stroke="#64748b" stroke-width="1.5"/>

  <!-- RabbitMQ to UC11 & UC12 -->
  <line x1="1310" y1="860" x2="900" y2="860" stroke="#64748b" stroke-width="1.5"/>


  <!-- ================= UML RELATIONSHIPS (INCLUDE & EXTEND) ================= -->
  <!-- <<include>>: UC03 (GPS) -> UC02 (Nghe thuyết minh) -->
  <path d="M 970 230 L 890 230" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#includeArrow)"/>
  <rect x="900" y="213" width="62" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="931" y="226" text-anchor="middle" font-size="10" font-weight="700" fill="#0284c7">&lt;&lt;include&gt;&gt;</text>

  <!-- <<include>>: UC04 (Quét QR) -> UC02 (Nghe thuyết minh) -->
  <path d="M 770 305 L 770 265" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#includeArrow)"/>
  <rect x="775" y="275" width="62" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="806" y="288" text-anchor="middle" font-size="10" font-weight="700" fill="#0284c7">&lt;&lt;include&gt;&gt;</text>

  <!-- <<extend>>: UC04 (Quét QR) -> UC03 (GPS auto) with extension point [GPS weak] -->
  <path d="M 890 325 Q 1070 325 1070 265" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#extendArrow)"/>
  <rect x="980" y="300" width="62" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="1011" y="313" text-anchor="middle" font-size="10" font-weight="700" fill="#d97706">&lt;&lt;extend&gt;&gt;</text>
  <text x="1080" y="305" font-size="9" fill="#b45309" font-style="italic">[GPS yếu/che khuất]</text>

  <!-- <<include>>: UC02 (Nghe thuyết minh) -> UC12 (Ghi nhận Analytics) -->
  <path d="M 870 245 Q 920 380 920 600 Q 920 840 890 840" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#includeArrow)"/>
  <rect x="895" y="470" width="62" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="926" y="483" text-anchor="middle" font-size="10" font-weight="700" fill="#0284c7">&lt;&lt;include&gt;&gt;</text>

  <!-- ASYNC TRIGGER: UC08 (Quản lý POI) -> UC11 (Dịch thuật & TTS) -->
  <path d="M 445 645 L 445 825" fill="none" stroke="#059669" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <rect x="450" y="725" width="130" height="18" rx="3" fill="#ffffff" stroke="#a7f3d0"/>
  <text x="515" y="738" text-anchor="middle" font-size="10" font-weight="700" fill="#059669">&lt;&lt;async event trigger&gt;&gt;</text>

</svg>
`;

// Define SVG for Activity Diagram
const activitySvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1150" width="1500" height="1150" style="background:#ffffff; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <linearGradient id="headerGrad2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="swimlane1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="swimlane2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="swimlane3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fefce8"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <linearGradient id="swimlane4" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#faf5ff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>

    <!-- Node Gradient -->
    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
    <linearGradient id="decisionGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>

    <!-- Shadow -->
    <filter id="nodeShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.1"/>
    </filter>

    <!-- Arrow Marker -->
    <marker id="actArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155"/>
    </marker>
    <marker id="branchArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
    </marker>
  </defs>

  <!-- TITLE HEADER -->
  <rect x="30" y="20" width="1440" height="60" rx="8" fill="url(#headerGrad2)"/>
  <text x="750" y="46" text-anchor="middle" fill="#ffffff" font-size="20" font-weight="700">SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) - UC03: KÍCH HOẠT THUYẾT MINH GPS</text>
  <text x="750" y="66" text-anchor="middle" fill="#94a3b8" font-size="12">Mô hình hóa luồng xử lý chi tiết theo làn trách nhiệm (Swimlanes) &amp; Chiến lược bù trừ rủi ro định vị</text>

  <!-- ================= SWIMLANES ================= -->
  <!-- Lane 1: Du khách -->
  <rect x="30" y="90" width="310" height="1030" fill="url(#swimlane1)" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="30" y="90" width="310" height="40" fill="#1e40af"/>
  <text x="185" y="115" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">Du khách (Tourist)</text>

  <!-- Lane 2: Frontend Client -->
  <rect x="340" y="90" width="410" height="1030" fill="url(#swimlane2)" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="340" y="90" width="410" height="40" fill="#15803d"/>
  <text x="545" y="115" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">Ứng dụng Web / SPA Client (Frontend)</text>

  <!-- Lane 3: Gateway & Backend -->
  <rect x="750" y="90" width="390" height="1030" fill="url(#swimlane3)" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="750" y="90" width="390" height="40" fill="#b45309"/>
  <text x="945" y="115" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">Cổng API Gateway &amp; Microservices</text>

  <!-- Lane 4: Audio Engine -->
  <rect x="1140" y="90" width="330" height="1030" fill="url(#swimlane4)" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="1140" y="90" width="330" height="40" fill="#6b21a8"/>
  <text x="1305" y="115" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">Trình phát Audio (Web Audio Engine)</text>


  <!-- ================= ACTIVITY FLOW ================= -->

  <!-- START NODE (Lane 1) -->
  <circle cx="185" cy="160" r="14" fill="#0f172a"/>
  <text x="185" y="190" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Bắt đầu hành trình</text>

  <!-- Step 1: Du khách mở trình duyệt & chọn bật định vị (Lane 1) -->
  <g transform="translate(75, 205)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="220" height="45" rx="8" fill="url(#actGrad)" stroke="#3b82f6" stroke-width="1.5"/>
    <text x="110" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Truy cập Echora trên di động</text>
    <text x="110" y="36" text-anchor="middle" font-size="11" fill="#475569">&amp; nhấn "Bật tự động phát"</text>
  </g>
  <line x1="185" y1="174" x2="185" y2="205" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Step 2: Client yêu cầu quyền Geolocation & Mở khóa Audio (Lane 2) -->
  <g transform="translate(425, 205)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="240" height="45" rx="8" fill="url(#actGrad)" stroke="#10b981" stroke-width="1.5"/>
    <text x="120" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Yêu cầu quyền truy cập GPS</text>
    <text x="120" y="36" text-anchor="middle" font-size="11" fill="#475569">&amp; Mở khóa AudioContext (Gesture)</text>
  </g>
  <line x1="295" y1="227" x2="425" y2="227" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Decision 1: Người dùng có cấp quyền GPS không? (Lane 2) -->
  <g transform="translate(500, 275)" filter="url(#nodeShadow)">
    <polygon points="45,0 90,25 45,50 0,25" fill="url(#decisionGrad)" stroke="#d97706" stroke-width="1.5"/>
    <text x="45" y="23" text-anchor="middle" font-size="10" font-weight="700" fill="#78350f">Cấp quyền</text>
    <text x="45" y="35" text-anchor="middle" font-size="10" font-weight="700" fill="#78350f">GPS?</text>
  </g>
  <line x1="545" y1="250" x2="545" y2="275" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Branch: [Không cấp quyền] -> Chuyển sang chế độ Quét mã QR (Lane 1/2) -->
  <g transform="translate(85, 278)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="200" height="45" rx="8" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>
    <text x="100" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#991b1b">Hiển thị nhắc nhở &amp;</text>
    <text x="100" y="36" text-anchor="middle" font-size="11" fill="#b91c1c">Gợi ý chuyển sang Quét QR</text>
  </g>
  <line x1="500" y1="300" x2="285" y2="300" stroke="#ef4444" stroke-width="1.8" marker-end="url(#actArrow)"/>
  <text x="380" y="293" text-anchor="middle" font-size="10" font-weight="700" fill="#dc2626">[Từ chối / Lỗi GPS]</text>

  <!-- Step 3: [Có cấp quyền] -> Bật watchPosition theo dõi tọa độ (Lane 2) -->
  <g transform="translate(425, 355)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="240" height="45" rx="8" fill="url(#actGrad)" stroke="#10b981" stroke-width="1.5"/>
    <text x="120" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Kích hoạt watchPosition()</text>
    <text x="120" y="36" text-anchor="middle" font-size="11" fill="#475569">Liên tục nhận (lat, lng, accuracy)</text>
  </g>
  <line x1="545" y1="325" x2="545" y2="355" stroke="#0284c7" stroke-width="1.8" marker-end="url(#branchArrow)"/>
  <text x="565" y="342" font-size="10" font-weight="700" fill="#0284c7">[Cho phép]</text>

  <!-- Step 4: Tính toán khoảng cách Haversine (Lane 2) -->
  <g transform="translate(425, 430)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="240" height="50" rx="8" fill="url(#actGrad)" stroke="#10b981" stroke-width="1.5"/>
    <text x="120" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Tính khoảng cách Haversine</text>
    <text x="120" y="35" text-anchor="middle" font-size="11" fill="#475569">đến tất cả POI đang hoạt động</text>
    <text x="120" y="46" text-anchor="middle" font-size="9" fill="#059669" font-style="italic">d = 2R · arcsin(√[sin²(Δφ/2) + cos·cos·sin²(Δλ/2)])</text>
  </g>
  <line x1="545" y1="400" x2="545" y2="430" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Decision 2: Khoảng cách <= Bán kính kích hoạt (40-55m)? (Lane 2) -->
  <g transform="translate(495, 510)" filter="url(#nodeShadow)">
    <polygon points="50,0 100,25 50,50 0,25" fill="url(#decisionGrad)" stroke="#d97706" stroke-width="1.5"/>
    <text x="50" y="23" text-anchor="middle" font-size="10" font-weight="700" fill="#78350f">d &le; Bán kính</text>
    <text x="50" y="35" text-anchor="middle" font-size="10" font-weight="700" fill="#78350f">(40–55m)?</text>
  </g>
  <line x1="545" y1="480" x2="545" y2="510" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Loop back if d > radius -->
  <path d="M 595 535 Q 690 535 690 380 Q 690 380 665 380" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#actArrow)"/>
  <text x="700" y="460" font-size="10" fill="#64748b" font-style="italic">[Chưa vào vùng: d > R]</text>

  <!-- Decision 3: Kiểm tra Cooldown & Đã phát chưa? (Lane 2) -->
  <g transform="translate(490, 590)" filter="url(#nodeShadow)">
    <polygon points="55,0 110,25 55,50 0,25" fill="url(#decisionGrad)" stroke="#d97706" stroke-width="1.5"/>
    <text x="55" y="22" text-anchor="middle" font-size="10" font-weight="700" fill="#78350f">Đang Cooldown</text>
    <text x="55" y="34" text-anchor="middle" font-size="10" font-weight="700" fill="#78350f">hoặc đã phát?</text>
  </g>
  <line x1="545" y1="560" x2="545" y2="590" stroke="#0284c7" stroke-width="1.8" marker-end="url(#branchArrow)"/>
  <text x="565" y="578" font-size="10" font-weight="700" fill="#0284c7">[d &le; R]</text>

  <!-- Loop back if in cooldown -->
  <path d="M 600 615 Q 715 615 715 370 Q 715 370 665 370" fill="none" stroke="#eab308" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#actArrow)"/>
  <text x="725" y="500" font-size="10" fill="#ca8a04" font-style="italic">[Đang làm nguội &lt; 180s: Bỏ qua]</text>

  <!-- Step 5: Cập nhật bộ đệm đã phát & Đặt mốc Cooldown 180s (Lane 2) -->
  <g transform="translate(425, 675)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="240" height="45" rx="8" fill="url(#actGrad)" stroke="#10b981" stroke-width="1.5"/>
    <text x="120" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Cập nhật autoPlayedSetRef</text>
    <text x="120" y="36" text-anchor="middle" font-size="11" fill="#475569">&amp; Thiết lập Cooldown 180 giây</text>
  </g>
  <line x1="545" y1="640" x2="545" y2="675" stroke="#0284c7" stroke-width="1.8" marker-end="url(#branchArrow)"/>
  <text x="565" y="660" font-size="10" font-weight="700" fill="#0284c7">[Hợp lệ để phát]</text>

  <!-- Step 6: Hiển thị Toast thông báo nhận diện điểm di tích (Lane 1 & 2) -->
  <g transform="translate(85, 675)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="200" height="45" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
    <text x="100" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#0369a1">Hiển thị thông báo nổi</text>
    <text x="100" y="36" text-anchor="middle" font-size="11" fill="#0284c7">"Đã đến di tích [Tên POI]"</text>
  </g>
  <line x1="425" y1="697" x2="285" y2="697" stroke="#0284c7" stroke-width="1.5" marker-end="url(#actArrow)"/>

  <!-- FORK BAR (Thanh phân tách song song: Phát Audio và Ghi nhận Analytics) -->
  <rect x="525" y="750" width="370" height="8" rx="4" fill="#0f172a"/>
  <line x1="545" y1="720" x2="545" y2="750" stroke="#334155" stroke-width="2"/>

  <!-- PARALLEL BRANCH A: Phát âm thanh (Lane 3 & Lane 4) -->
  <!-- Step A1: Gửi HTTP Range Request (Lane 3) -->
  <g transform="translate(800, 785)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="290" height="55" rx="8" fill="url(#actGrad)" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="145" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">API Gateway tiếp nhận</text>
    <text x="145" y="35" text-anchor="middle" font-size="11" fill="#475569">GET /api/tts/audio/{fileName}</text>
    <text x="145" y="48" text-anchor="middle" font-size="10" fill="#d97706" font-style="italic">Trả về HTTP 206 Partial Content (Bytes 0-65535)</text>
  </g>
  <line x1="620" y1="758" x2="800" y2="812" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Step A2: Audio Engine nạp buffer & phát loa (Lane 4) -->
  <g transform="translate(1170, 785)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="270" height="55" rx="8" fill="url(#actGrad)" stroke="#9333ea" stroke-width="1.5"/>
    <text x="135" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Nạp phân đoạn byte vào đệm,</text>
    <text x="135" y="35" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">giải mã &amp; phát qua loa thiết bị</text>
    <text x="135" y="48" text-anchor="middle" font-size="10" fill="#7e22ce" font-style="italic">Độ trễ khởi động &lt; 500ms</text>
  </g>
  <line x1="1090" y1="812" x2="1170" y2="812" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Du khách lắng nghe thuyết minh (Lane 1) -->
  <g transform="translate(75, 870)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="220" height="45" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
    <text x="110" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#15803d">Du khách lắng nghe</text>
    <text x="110" y="36" text-anchor="middle" font-size="11" fill="#166534">thuyết minh di tích bản ngữ</text>
  </g>
  <path d="M 1305 840 Q 1305 892 295 892" fill="none" stroke="#16a34a" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- PARALLEL BRANCH B: Ghi nhận sự kiện phân tích (Lane 3) -->
  <g transform="translate(425, 870)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="260" height="55" rx="8" fill="url(#actGrad)" stroke="#10b981" stroke-width="1.5"/>
    <text x="130" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Gửi POST /api/analytics/events</text>
    <text x="130" y="35" text-anchor="middle" font-size="11" fill="#475569">Loại sự kiện: AUTO_TRIGGERED</text>
    <text x="130" y="48" text-anchor="middle" font-size="10" fill="#059669" font-style="italic">Nhận mã HTTP 202 Accepted (&lt; 50ms)</text>
  </g>
  <line x1="545" y1="758" x2="545" y2="870" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- Lưu vào RabbitMQ bất đồng bộ (Lane 3) -->
  <g transform="translate(780, 870)" filter="url(#nodeShadow)">
    <rect x="0" y="0" width="310" height="55" rx="8" fill="url(#actGrad)" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="155" y="20" text-anchor="middle" font-size="12" font-weight="600" fill="#0f172a">Đẩy thông điệp vào RabbitMQ</text>
    <text x="155" y="35" text-anchor="middle" font-size="11" fill="#475569">Lắng nghe &amp; lưu bất đồng bộ CSDL</text>
    <text x="155" y="48" text-anchor="middle" font-size="10" fill="#d97706" font-style="italic">Không chặn luồng giao diện người dùng</text>
  </g>
  <line x1="685" y1="897" x2="780" y2="897" stroke="#334155" stroke-width="1.8" marker-end="url(#actArrow)"/>

  <!-- JOIN BAR (Thanh kết hợp đồng bộ luồng song song) -->
  <rect x="525" y="965" width="450" height="8" rx="4" fill="#0f172a"/>
  <line x1="545" y1="925" x2="545" y2="965" stroke="#334155" stroke-width="2"/>
  <line x1="935" y1="925" x2="935" y2="965" stroke="#334155" stroke-width="2"/>

  <!-- FINAL STATE (Lane 2) -->
  <g transform="translate(685, 1005)">
    <circle cx="20" cy="20" r="15" fill="none" stroke="#0f172a" stroke-width="2"/>
    <circle cx="20" cy="20" r="10" fill="#0f172a"/>
  </g>
  <line x1="705" y1="973" x2="705" y2="1005" stroke="#334155" stroke-width="2" marker-end="url(#actArrow)"/>
  <text x="705" y="1045" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Kết thúc chu kỳ kích hoạt</text>
  <text x="705" y="1060" text-anchor="middle" font-size="10" fill="#64748b">(Sẵn sàng cho chu kỳ định vị tiếp theo)</text>

</svg>
`;

async function main() {
  console.log('Rendering polished diagrams with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1650, height: 1200 },
    deviceScaleFactor: 2
  });

  // 1. Render Use Case Diagram
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>body { margin: 0; padding: 0; background: #ffffff; display: flex; justify-content: center; }</style>
      </head>
      <body>${useCaseSvg}</body>
    </html>
  `);
  const ucElement = await page.$('svg');
  const ucPath = path.resolve('../docs/report/diagrams/png/hinh_01_so_do_use_case_tong_the.png');
  const ucBuffer = await ucElement.screenshot();
  fs.writeFileSync(ucPath, ucBuffer);
  console.log('Saved clean Use Case Diagram to:', ucPath);

  const img1Path = path.resolve('../scratch/docx_unpacked/word/media/image1.png');
  if (fs.existsSync(path.dirname(img1Path))) {
    fs.writeFileSync(img1Path, ucBuffer);
    console.log('Updated scratch/docx_unpacked/word/media/image1.png');
  }

  // 2. Render Activity Diagram
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>body { margin: 0; padding: 0; background: #ffffff; display: flex; justify-content: center; }</style>
      </head>
      <body>${activitySvg}</body>
    </html>
  `);
  const actElement = await page.$('svg');
  const actPath = path.resolve('../docs/report/diagrams/png/hinh_18_activity_diagram_thuyet_minh_gps.png');
  const actBuffer = await actElement.screenshot();
  fs.writeFileSync(actPath, actBuffer);
  console.log('Saved clean Activity Diagram to:', actPath);

  const img18Path = path.resolve('../scratch/docx_unpacked/word/media/image18.png');
  if (fs.existsSync(path.dirname(img18Path))) {
    fs.writeFileSync(img18Path, actBuffer);
    console.log('Saved scratch/docx_unpacked/word/media/image18.png');
  }

  await browser.close();
  console.log('Polished diagrams rendered successfully!');
}

main().catch(err => console.error('Generation failed:', err));
