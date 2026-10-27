import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'Diagram_Source');

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

// -----------------------------------------------------------------------------
// 1. HÌNH 1.1: SƠ ĐỒ RANH GIỚI BỐI CẢNH HỆ THỐNG ECHORA (SYSTEM CONTEXT DIAGRAM)
// -----------------------------------------------------------------------------
const svg_1_1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="600" y="35" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 1.1. SƠ ĐỒ RANH GIỚI BỐI CẢNH HỆ THỐNG ECHORA (SYSTEM CONTEXT DIAGRAM)</text>
  <text x="600" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Biểu diễn Ranh giới Hệ thống, Tác nhân Người dùng và các Hệ thống Bên ngoài Tương tác</text>

  <!-- Central System Box -->
  <rect x="420" y="240" width="360" height="260" fill="#ffffff" stroke="#000000" stroke-width="2.5"/>
  <rect x="420" y="240" width="360" height="45" fill="#f0f0f0" stroke="#000000" stroke-width="1.5"/>
  <text x="600" y="268" text-anchor="middle" font-size="14" font-weight="bold" fill="#000000">HỆ THỐNG ECHORA</text>
  <text x="600" y="295" text-anchor="middle" font-size="11" font-style="italic" fill="#444444">(Nền tảng Thuyết minh Tự động &amp; Du lịch Di sản)</text>
  
  <text x="440" y="330" font-size="11" fill="#000000">• Định vị Geofence &amp; Tự động phát thuyết minh</text>
  <text x="440" y="355" font-size="11" fill="#000000">• Quét mã QR tại điểm dừng di tích</text>
  <text x="440" y="380" font-size="11" fill="#000000">• Đa ngôn ngữ (Tiếng Việt, Anh, Nhật, Hàn)</text>
  <text x="440" y="405" font-size="11" fill="#000000">• Mở khóa gói Premium &amp; Giỏ hàng lưu niệm</text>
  <text x="440" y="430" font-size="11" fill="#000000">• Quản lý nội dung di sản &amp; Pipeline Dịch/TTS</text>
  <text x="440" y="455" font-size="11" fill="#000000">• Thu thập thống kê tương tác thời gian thực</text>
  <text x="440" y="480" font-size="11" fill="#000000">• Xác thực phân quyền &amp; Bảo mật API Gateway</text>

  <!-- Left: Tourist Actor -->
  ${stickFigure(80, 280, 'Du khách (Tourist)', 'Khách nội địa & quốc tế')}
  <line x1="140" y1="350" x2="420" y2="350" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <line x1="420" y1="375" x2="140" y2="375" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="280" y="340" text-anchor="middle" font-size="11" font-weight="bold">Tọa độ GPS, Quét QR, Mua gói</text>
  <text x="280" y="395" text-anchor="middle" font-size="10.5" fill="#444444">Audio thuyết minh, Bản đồ, Phụ đề</text>

  <!-- Right: Admin Actor -->
  ${stickFigure(1020, 280, 'Quản trị viên (Admin)', 'Cán bộ di tích & Vận hành')}
  <line x1="1000" y1="350" x2="780" y2="350" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <line x1="780" y1="375" x2="1000" y2="375" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="890" y="340" text-anchor="middle" font-size="11" font-weight="bold">Biên tập POI, Duyệt đơn, Quản lý gói</text>
  <text x="890" y="395" text-anchor="middle" font-size="10.5" fill="#444444">Báo cáo thống kê, Cảnh báo hệ thống</text>

  <!-- Top Left External: GPS Satellite System -->
  <rect x="80" y="90" width="220" height="70" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="190" y="115" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;External System&gt;&gt;</text>
  <text x="190" y="135" text-anchor="middle" font-size="12" font-weight="bold">Hệ thống Định vị GPS / Web API</text>
  <line x1="260" y1="160" x2="440" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="325" y="195" font-size="10" font-weight="bold">Tọa độ WGS84</text>

  <!-- Top Middle External: VNPAY & VietQR -->
  <rect x="490" y="90" width="220" height="70" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="600" y="115" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;External Payment&gt;&gt;</text>
  <text x="600" y="135" text-anchor="middle" font-size="12" font-weight="bold">Cổng VNPAY &amp; Napas VietQR</text>
  <line x1="600" y1="160" x2="600" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="615" y1="240" x2="615" y2="160" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="640" y="195" font-size="10" font-weight="bold">IPN Webhook</text>

  <!-- Top Right External: OpenStreetMap / Nominatim -->
  <rect x="900" y="90" width="220" height="70" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="1010" y="115" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;External Map&gt;&gt;</text>
  <text x="1010" y="135" text-anchor="middle" font-size="12" font-weight="bold">OpenStreetMap &amp; Leaflet Tiles</text>
  <line x1="940" y1="160" x2="760" y2="240" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="870" y="195" font-size="10" font-weight="bold">Bản đồ nền (Map Tiles)</text>

  <!-- Bottom Left External: Google OAuth2 -->
  <rect x="80" y="580" width="220" height="70" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="190" y="605" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;External Auth&gt;&gt;</text>
  <text x="190" y="625" text-anchor="middle" font-size="12" font-weight="bold">Google Identity OAuth2.0</text>
  <line x1="260" y1="580" x2="440" y2="500" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="325" y="555" font-size="10" font-weight="bold">Xác thực ID Token</text>

  <!-- Bottom Middle External: Edge-TTS & MyMemory AI -->
  <rect x="490" y="580" width="220" height="70" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="600" y="605" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;External AI Service&gt;&gt;</text>
  <text x="600" y="625" text-anchor="middle" font-size="12" font-weight="bold">Microsoft Edge-TTS &amp; MyMemory</text>
  <line x1="600" y1="500" x2="600" y2="580" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="615" y1="580" x2="615" y2="500" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="640" y="545" font-size="10" font-weight="bold">Dịch thuật &amp; File MP3</text>

  <!-- Bottom Right External: SMTP Mail Notification -->
  <rect x="900" y="580" width="220" height="70" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <text x="1010" y="605" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">&lt;&lt;External Mail&gt;&gt;</text>
  <text x="1010" y="625" text-anchor="middle" font-size="12" font-weight="bold">Hệ thống Thư điện tử SMTP</text>
  <line x1="760" y1="500" x2="940" y2="580" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="870" y="555" font-size="10" font-weight="bold">Email xác thực &amp; Đơn hàng</text>
</svg>
`;

// -----------------------------------------------------------------------------
// 2. HÌNH 1.2: SƠ ĐỒ QUY TRÌNH KỸ NGHỆ PHẦN MỀM ÁP DỤNG TRONG ĐỀ TÀI
// -----------------------------------------------------------------------------
const svg_1_2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 680" width="1200" height="680" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="600" y="35" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 1.2. SƠ ĐỒ QUY TRÌNH KỸ NGHỆ PHẦN MỀM ÁP DỤNG TRONG DỰ ÁN ECHORA</text>
  <text x="600" y="58" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Quy trình Công nghệ Phần mềm Lặp theo Mô hình Lai Agile/Scrum kết hợp Đặc tả Chuẩn IEEE 830</text>

  <!-- Stage 1 -->
  <rect x="60" y="110" width="190" height="180" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="60" y="110" width="190" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="155" y="133" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 1</text>
  <text x="155" y="165" text-anchor="middle" font-size="12" font-weight="bold">Khảo sát &amp; Thu thập</text>
  <text x="155" y="185" text-anchor="middle" font-size="12" font-weight="bold">Yêu cầu Thực tế</text>
  <text x="75" y="215" font-size="10.5">• Nghiên cứu 7 di tích trung tâm</text>
  <text x="75" y="235" font-size="10.5">• Khảo sát trải nghiệm du khách</text>
  <text x="75" y="255" font-size="10.5">• Xác định rào cản GPS &amp; Ngôn ngữ</text>
  <text x="75" y="275" font-size="10.5">• Đầu ra: Báo cáo khảo sát vấn đề</text>

  <!-- Arrow 1->2 -->
  <line x1="250" y1="200" x2="280" y2="200" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Stage 2 -->
  <rect x="280" y="110" width="190" height="180" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="280" y="110" width="190" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="375" y="133" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 2</text>
  <text x="375" y="165" text-anchor="middle" font-size="12" font-weight="bold">Đặc tả Yêu cầu</text>
  <text x="375" y="185" text-anchor="middle" font-size="12" font-weight="bold">Sản phẩm (PRD)</text>
  <text x="295" y="215" font-size="10.5">• Xác định Problem Alignment</text>
  <text x="295" y="235" font-size="10.5">• Thiết lập Product Goals (KPI)</text>
  <text x="295" y="255" font-size="10.5">• Định nghĩa Scope (In/Out Scope)</text>
  <text x="295" y="275" font-size="10.5">• Đầu ra: Tài liệu PRD chuẩn</text>

  <!-- Arrow 2->3 -->
  <line x1="470" y1="200" x2="500" y2="200" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Stage 3 -->
  <rect x="500" y="110" width="190" height="180" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="500" y="110" width="190" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="595" y="133" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 3</text>
  <text x="595" y="165" text-anchor="middle" font-size="12" font-weight="bold">Phân rã Backlog</text>
  <text x="595" y="185" text-anchor="middle" font-size="12" font-weight="bold">&amp; Quy tắc Nghiệp vụ</text>
  <text x="515" y="215" font-size="10.5">• Phân rã Epic - Feature - Story</text>
  <text x="515" y="235" font-size="10.5">• Viết Acceptance Criteria (G-W-T)</text>
  <text x="515" y="255" font-size="10.5">• Xây dựng quy tắc nghiệp vụ BR</text>
  <text x="515" y="275" font-size="10.5">• Đầu ra: Product Backlog &amp; MoSCoW</text>

  <!-- Arrow 3->4 -->
  <line x1="690" y1="200" x2="720" y2="200" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Stage 4 -->
  <rect x="720" y="110" width="190" height="180" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="720" y="110" width="190" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="815" y="133" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 4</text>
  <text x="815" y="165" text-anchor="middle" font-size="12" font-weight="bold">Mô hình hóa Nghiệp vụ</text>
  <text x="815" y="185" text-anchor="middle" font-size="12" font-weight="bold">&amp; Phân tích Hệ thống</text>
  <text x="735" y="215" font-size="10.5">• Xây dựng Sơ đồ Use Case tổng thể</text>
  <text x="735" y="235" font-size="10.5">• Đặc tả chi tiết các Use Case chính</text>
  <text x="735" y="255" font-size="10.5">• Vẽ Sơ đồ Hoạt động &amp; Tuần tự</text>
  <text x="735" y="275" font-size="10.5">• Đầu ra: Đặc tả Phân tích Ch.3</text>

  <!-- Arrow 4->5 -->
  <line x1="910" y1="200" x2="940" y2="200" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Stage 5 -->
  <rect x="940" y="110" width="200" height="180" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="940" y="110" width="200" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="1040" y="133" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 5</text>
  <text x="1040" y="165" text-anchor="middle" font-size="12" font-weight="bold">Thiết kế Kiến trúc</text>
  <text x="1040" y="185" text-anchor="middle" font-size="12" font-weight="bold">&amp; Mô hình Dữ liệu</text>
  <text x="955" y="215" font-size="10.5">• Thiết kế Microservices &amp; Gateway</text>
  <text x="955" y="235" font-size="10.5">• Thiết kế 5 Schemas CSDL cô lập</text>
  <text x="955" y="255" font-size="10.5">• Thiết kế bảo mật Token Rotation</text>
  <text x="955" y="275" font-size="10.5">• Đầu ra: ERD &amp; Kiến trúc phân tán</text>

  <!-- Feedback Loop Arrow from Stage 5 to Stage 2/3 -->
  <path d="M 1040 290 L 1040 340 L 375 340 L 375 290" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 4" marker-end="url(#openArrow)"/>
  <text x="700" y="330" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">Vòng lặp Phản hồi Tinh chỉnh Yêu cầu &amp; Backlog (Agile Feedback Loop)</text>

  <!-- Bottom Row: Implementation, Verification, Delivery -->
  <!-- Stage 6 -->
  <rect x="180" y="390" width="240" height="170" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="180" y="390" width="240" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="300" y="413" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 6: Hiện thực Mã nguồn</text>
  <text x="195" y="445" font-size="10.5">• Frontend SPA: React 18, Leaflet, Vite</text>
  <text x="195" y="468" font-size="10.5">• Backend: 6 Microservices Spring Boot</text>
  <text x="195" y="491" font-size="10.5">• Tích hợp VNPAY, RabbitMQ, Edge-TTS</text>
  <text x="195" y="514" font-size="10.5">• Đóng gói 9 Docker Containers</text>
  <text x="195" y="537" font-size="10.5">• Đầu ra: Hệ thống phần mềm hoàn chỉnh</text>

  <!-- Arrow 6->7 -->
  <line x1="420" y1="475" x2="480" y2="475" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Stage 7 -->
  <rect x="480" y="390" width="240" height="170" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="480" y="390" width="240" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="600" y="413" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 7: Kiểm thử &amp; Đánh giá</text>
  <text x="495" y="445" font-size="10.5">• Unit Tests &amp; Integration Tests (62+ test cases)</text>
  <text x="495" y="468" font-size="10.5">• Kiểm thử an ninh Gateway &amp; RateLimit</text>
  <text x="495" y="491" font-size="10.5">• Kiểm thử giao diện di động &amp; A11y</text>
  <text x="495" y="514" font-size="10.5">• Đo đạc hiệu năng &amp; bộ nhớ</text>
  <text x="495" y="537" font-size="10.5">• Đầu ra: Test Report &amp; CI/CD Green</text>

  <!-- Arrow 7->8 -->
  <line x1="720" y1="475" x2="780" y2="475" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Stage 8 -->
  <rect x="780" y="390" width="240" height="170" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="780" y="390" width="240" height="35" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="900" y="413" text-anchor="middle" font-size="12" font-weight="bold">GIAI ĐOẠN 8: Bàn giao &amp; Đánh giá</text>
  <text x="795" y="445" font-size="10.5">• Xây dựng Ma trận Truy vết (RTM)</text>
  <text x="795" y="468" font-size="10.5">• Đối chiếu tiêu chí chấp nhận (AC)</text>
  <text x="795" y="491" font-size="10.5">• Soạn thảo Báo cáo Học thuật hoàn chỉnh</text>
  <text x="795" y="514" font-size="10.5">• Hướng dẫn vận hành &amp; Triển khai</text>
  <text x="795" y="537" font-size="10.5">• Đầu ra: Báo cáo Ch.1-3 &amp; Bộ tài liệu</text>

  <!-- Bottom Quality Assurance Banner -->
  <rect x="60" y="590" width="1080" height="60" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="600" y="615" text-anchor="middle" font-size="11.5" font-weight="bold">Nguyên tắc Đảm bảo Chất lượng Kỹ nghệ (Quality Assurance &amp; Governance):</text>
  <text x="600" y="635" text-anchor="middle" font-size="10.5" fill="#333333">100% Yêu cầu được định danh duy nhất (Goal, Feature, FR, NFR, Epic, US, BR, Risk) và kiểm chứng qua Ma trận Truy vết hai chiều.</text>
</svg>
`;

// -----------------------------------------------------------------------------
// 3. HÌNH 2.7: SƠ ĐỒ PHÂN RÃ PRODUCT BACKLOG (EPIC - FEATURE - USER STORY)
// -----------------------------------------------------------------------------
const svg_2_7 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="600" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 2.7. SƠ ĐỒ CẤU TRÚC PHÂN RÃ PRODUCT BACKLOG (EPIC - FEATURE - USER STORY)</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Phân rã Hệ thống Yêu cầu từ Tầm nhìn Sản phẩm đến 5 Epic, 16 Feature và 30 User Story có Kiểm chứng</text>

  <!-- Top Root Node: Product Vision -->
  <rect x="420" y="75" width="360" height="50" fill="#f0f0f0" stroke="#000000" stroke-width="2"/>
  <text x="600" y="96" text-anchor="middle" font-size="13" font-weight="bold">ECHORA PRODUCT BACKLOG</text>
  <text x="600" y="114" text-anchor="middle" font-size="10.5" font-style="italic" fill="#333333">Hệ thống Thuyết minh Tự động Đa ngôn ngữ</text>

  <!-- 5 Epic Nodes -->
  <!-- Epic 1 -->
  <rect x="30" y="170" width="210" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="135" y="195" text-anchor="middle" font-size="12" font-weight="bold">EPIC-01: THUYẾT MINH</text>
  <text x="135" y="215" text-anchor="middle" font-size="10.5" fill="#444444">&amp; ĐỊNH VỊ DI SẢN</text>

  <!-- Epic 2 -->
  <rect x="270" y="170" width="210" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="375" y="195" text-anchor="middle" font-size="12" font-weight="bold">EPIC-02: THƯƠNG MẠI</text>
  <text x="375" y="215" text-anchor="middle" font-size="10.5" fill="#444444">&amp; GÓI THUÊ BAO</text>

  <!-- Epic 3 -->
  <rect x="510" y="170" width="210" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="615" y="195" text-anchor="middle" font-size="12" font-weight="bold">EPIC-03: DỊCH THUẬT</text>
  <text x="615" y="215" text-anchor="middle" font-size="10.5" fill="#444444">&amp; TỔNG HỢP GIỌNG NÓI</text>

  <!-- Epic 4 -->
  <rect x="750" y="170" width="210" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="855" y="195" text-anchor="middle" font-size="12" font-weight="bold">EPIC-04: QUẢN TRỊ CMS</text>
  <text x="855" y="215" text-anchor="middle" font-size="10.5" fill="#444444">&amp; VẬN HÀNH DI SẢN</text>

  <!-- Epic 5 -->
  <rect x="990" y="170" width="180" height="60" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <text x="1080" y="195" text-anchor="middle" font-size="12" font-weight="bold">EPIC-05: AN NINH</text>
  <text x="1080" y="215" text-anchor="middle" font-size="10.5" fill="#444444">&amp; PHÂN TÍCH DỮ LIỆU</text>

  <!-- Lines from Root to Epics -->
  <line x1="600" y1="125" x2="600" y2="150" stroke="#000000" stroke-width="1.5"/>
  <line x1="135" y1="150" x2="1080" y2="150" stroke="#000000" stroke-width="1.5"/>
  <line x1="135" y1="150" x2="135" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="375" y1="150" x2="375" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="615" y1="150" x2="615" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="855" y1="150" x2="855" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1080" y1="150" x2="1080" y2="170" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Features & Stories Column 1 (Epic 1) -->
  <rect x="30" y="250" width="210" height="520" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="40" y="272" font-size="11" font-weight="bold">FEAT-01: Bản đồ Định vị GPS</text>
  <text x="50" y="292" font-size="9.5">• US-01: Xem vị trí bản đồ (Must)</text>
  <text x="50" y="310" font-size="9.5">• US-02: Định vị GPS thời gian thực</text>
  <text x="40" y="335" font-size="11" font-weight="bold">FEAT-02: Kích hoạt Geofence</text>
  <text x="50" y="355" font-size="9.5">• US-03: Tự phát khi vào vùng (Must)</text>
  <text x="50" y="373" font-size="9.5">• US-04: Chống phát lặp âm thanh</text>
  <text x="40" y="398" font-size="11" font-weight="bold">FEAT-03: Thuyết minh Đa ngữ</text>
  <text x="50" y="418" font-size="9.5">• US-05: Chuyển ngôn ngữ VI/EN/JA/KO</text>
  <text x="50" y="436" font-size="9.5">• US-06: Highlight phụ đề theo audio</text>
  <text x="40" y="461" font-size="11" font-weight="bold">FEAT-04: Quét mã QR Di sản</text>
  <text x="50" y="481" font-size="9.5">• US-07: Quét camera mở POI (Must)</text>
  <text x="50" y="499" font-size="9.5">• US-08: Nhập mã token thủ công</text>
  <text x="40" y="524" font-size="11" font-weight="bold">FEAT-05: Lộ trình Tham quan</text>
  <text x="50" y="544" font-size="9.5">• US-09: Xem tour gợi ý di sản</text>
  <text x="50" y="562" font-size="9.5">• US-10: Điều hướng giữa các trạm</text>

  <!-- Features & Stories Column 2 (Epic 2) -->
  <rect x="270" y="250" width="210" height="520" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="280" y="272" font-size="11" font-weight="bold">FEAT-06: Danh mục Quà lưu niệm</text>
  <text x="290" y="292" font-size="9.5">• US-11: Duyệt đặc sản theo điểm (Should)</text>
  <text x="290" y="310" font-size="9.5">• US-12: Xem chi tiết xuất xứ món</text>
  <text x="280" y="335" font-size="11" font-weight="bold">FEAT-07: Giỏ hàng &amp; Đặt hàng</text>
  <text x="290" y="355" font-size="9.5">• US-13: Thêm giỏ hàng lưu RAM (Must)</text>
  <text x="290" y="373" font-size="9.5">• US-14: Miễn phí ship đơn từ 50k</text>
  <text x="280" y="398" font-size="11" font-weight="bold">FEAT-08: Gói Thuê bao Premium</text>
  <text x="290" y="418" font-size="9.5">• US-15: Nâng cấp gói 500k/năm</text>
  <text x="290" y="436" font-size="9.5">• US-16: Mua lẻ mở khóa 1 POI</text>
  <text x="280" y="461" font-size="11" font-weight="bold">FEAT-09: Cổng Thanh toán VNPAY</text>
  <text x="290" y="481" font-size="9.5">• US-17: Thanh toán VNPAY sandbox</text>
  <text x="290" y="499" font-size="9.5">• US-18: Quét mã chuyển khoản VietQR</text>

  <!-- Features & Stories Column 3 (Epic 3) -->
  <rect x="510" y="250" width="210" height="520" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="520" y="272" font-size="11" font-weight="bold">FEAT-10: Dịch thuật Tự động</text>
  <text x="530" y="292" font-size="9.5">• US-19: Pipeline dịch 3 ngoại ngữ</text>
  <text x="530" y="310" font-size="9.5">• US-20: Bảo tồn bài dịch thủ công</text>
  <text x="520" y="335" font-size="11" font-weight="bold">FEAT-11: Tổng hợp Giọng đọc AI</text>
  <text x="530" y="355" font-size="9.5">• US-21: Sinh file MP3 bằng Edge-TTS</text>
  <text x="530" y="373" font-size="9.5">• US-22: Giọng đọc bản địa 4 quốc gia</text>
  <text x="520" y="398" font-size="11" font-weight="bold">FEAT-12: Sự kiện RabbitMQ</text>
  <text x="530" y="418" font-size="9.5">• US-23: Xếp hàng xử lý bất đồng bộ</text>
  <text x="530" y="436" font-size="9.5">• US-24: Cập nhật audio trạng thái READY</text>

  <!-- Features & Stories Column 4 (Epic 4) -->
  <rect x="750" y="250" width="210" height="520" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="760" y="272" font-size="11" font-weight="bold">FEAT-13: Quản lý Di tích &amp; Khu vực</text>
  <text x="770" y="292" font-size="9.5">• US-25: Thêm/Sửa/Xóa POI di tích</text>
  <text x="770" y="310" font-size="9.5">• US-26: Quản lý mã QR &amp; In tem</text>
  <text x="760" y="335" font-size="11" font-weight="bold">FEAT-14: Quản lý Đơn &amp; Người dùng</text>
  <text x="770" y="355" font-size="9.5">• US-27: Duyệt đơn &amp; Cấp gói Premium</text>
  <text x="770" y="373" font-size="9.5">• US-28: Khóa tài khoản &amp; Thu hồi token</text>

  <!-- Features & Stories Column 5 (Epic 5) -->
  <rect x="990" y="250" width="180" height="520" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="1000" y="272" font-size="11" font-weight="bold">FEAT-15: Bảo mật Gateway</text>
  <text x="1010" y="292" font-size="9.5">• US-29: Token Rotation Cookie</text>
  <text x="1010" y="310" font-size="9.5">• US-30: Chặn Brute-Force &amp; XSS</text>
  <text x="1000" y="335" font-size="11" font-weight="bold">FEAT-16: Thu thập Phân tích</text>
  <text x="1010" y="355" font-size="9.5">• Ghi nhận sự kiện SCAN/PLAY</text>
  <text x="1010" y="373" font-size="9.5">• Báo cáo tần suất tương tác</text>
</svg>
`;

// -----------------------------------------------------------------------------
// 4. HÌNH 2.8: SƠ ĐỒ MÔ HÌNH MA TRẬN TRUY VẾT YÊU CẦU PHẦN MỀM (RTM MODEL)
// -----------------------------------------------------------------------------
const svg_2_8 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 680" width="1200" height="680" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="600" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">HÌNH 2.8. SƠ ĐỒ MÔ HÌNH MA TRẬN TRUY VẾT YÊU CẦU PHẦN MỀM (RTM MODEL)</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Mô hình Truy vết Hai chiều đảm bảo Tính Hoàn chỉnh, Tính Nhất quán và Khả năng Kiểm chứng của Yêu cầu</text>

  <!-- Level 1: Business Goals -->
  <rect x="50" y="90" width="220" height="90" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="50" y="90" width="220" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="160" y="110" text-anchor="middle" font-size="12" font-weight="bold">1. MỤC TIÊU SẢN PHẨM</text>
  <text x="65" y="135" font-size="10.5">• GOAL-01: Tự động hóa thuyết minh</text>
  <text x="65" y="155" font-size="10.5">• GOAL-02: Chuẩn hóa 4 ngôn ngữ</text>
  <text x="65" y="175" font-size="10.5">• GOAL-03: Thương mại di sản &amp; Thuê bao</text>

  <!-- Arrow L1 -> L2 -->
  <line x1="270" y1="135" x2="340" y2="135" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <line x1="340" y1="145" x2="270" y2="145" stroke="#000000" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>

  <!-- Level 2: Features (PRD) -->
  <rect x="340" y="90" width="240" height="150" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="340" y="90" width="240" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="460" y="110" text-anchor="middle" font-size="12" font-weight="bold">2. TÍNH NĂNG CỐT LÕI (FEAT)</text>
  <text x="355" y="135" font-size="10.5">• FEAT-01: Bản đồ GPS Leaflet</text>
  <text x="355" y="155" font-size="10.5">• FEAT-02: Geofence Kích hoạt tự động</text>
  <text x="355" y="175" font-size="10.5">• FEAT-04: Quét mã QR di sản</text>
  <text x="355" y="195" font-size="10.5">• FEAT-08: Gói Premium ngoại ngữ</text>
  <text x="355" y="215" font-size="10.5">• FEAT-09: Thanh toán VNPAY / VietQR</text>
  <text x="355" y="235" font-size="10.5">• FEAT-11: Tổng hợp giọng nói Edge-TTS</text>

  <!-- Arrow L2 -> L3 -->
  <line x1="580" y1="165" x2="650" y2="165" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <line x1="650" y1="175" x2="580" y2="175" stroke="#000000" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>

  <!-- Level 3: Requirements (FR / NFR / BR) -->
  <rect x="650" y="90" width="240" height="180" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="650" y="90" width="240" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="770" y="110" text-anchor="middle" font-size="12" font-weight="bold">3. YÊU CẦU PHẦN MỀM</text>
  <text x="665" y="135" font-size="10.5" font-weight="bold">Yêu cầu Chức năng (FR):</text>
  <text x="665" y="153" font-size="10">• FR-001 .. FR-028 (28 Yêu cầu)</text>
  <text x="665" y="173" font-size="10.5" font-weight="bold">Yêu cầu Phi chức năng (NFR):</text>
  <text x="665" y="191" font-size="10">• NFR-01 .. NFR-15 (15 Yêu cầu)</text>
  <text x="665" y="211" font-size="10.5" font-weight="bold">Quy tắc Nghiệp vụ (BR):</text>
  <text x="665" y="229" font-size="10">• BR-01 .. BR-12 (12 Quy tắc logic)</text>
  <text x="665" y="255" font-size="9.5" fill="#555555">Ràng buộc: Bán kính, Token, Freeship...</text>

  <!-- Arrow L3 -> L4 -->
  <line x1="890" y1="180" x2="960" y2="180" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <line x1="960" y1="190" x2="890" y2="190" stroke="#000000" stroke-width="1.8" stroke-dasharray="3 3" marker-end="url(#openArrow)"/>

  <!-- Level 4: Backlog & User Stories -->
  <rect x="960" y="90" width="200" height="180" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="960" y="90" width="200" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="1060" y="110" text-anchor="middle" font-size="12" font-weight="bold">4. PRODUCT BACKLOG</text>
  <text x="975" y="135" font-size="10.5">• 5 Epics Lớn</text>
  <text x="975" y="155" font-size="10.5">• 30 User Stories (US-01..30)</text>
  <text x="975" y="175" font-size="10.5">• Phân hạng MoSCoW</text>
  <text x="975" y="195" font-size="10.5">• Acceptance Criteria (G-W-T)</text>
  <text x="975" y="215" font-size="10.5">• Ước lượng Story Points</text>
  <text x="975" y="235" font-size="10.5">• Phân bổ Sprint 1 - 4</text>

  <!-- Vertical Connection from Level 4 to Verification & Test -->
  <line x1="1060" y1="270" x2="1060" y2="350" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1075" y="315" font-size="10" font-weight="bold">Ánh xạ Nghiệm thu</text>

  <!-- Level 5: Acceptance Criteria & Tests -->
  <rect x="800" y="350" width="360" height="160" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="800" y="350" width="360" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="980" y="370" text-anchor="middle" font-size="12" font-weight="bold">5. TIÊU CHÍ NGHIỆM THU &amp; TEST SUITE</text>
  <text x="815" y="398" font-size="10.5">• AC-01: Độ trễ Geofence &lt; 1.5s, cờ autoPlayedSetRef</text>
  <text x="815" y="420" font-size="10.5">• AC-02: Khóa an toàn 5s khi dừng thủ công</text>
  <text x="815" y="442" font-size="10.5">• AC-03: HTTP 403 Forbidden nếu chưa mua Premium</text>
  <text x="815" y="464" font-size="10.5">• AC-04: Xoay vòng Refresh Token HttpOnly Cookie</text>
  <text x="815" y="486" font-size="10.5">• 62+ Unit &amp; Integration Tests (Vitest &amp; JUnit 5)</text>

  <!-- Left Bottom: Use Cases & Architecture -->
  <line x1="800" y1="430" x2="650" y2="430" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <rect x="340" y="350" width="310" height="160" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="340" y="350" width="310" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="495" y="370" text-anchor="middle" font-size="12" font-weight="bold">6. ĐẶC TẢ CA SỬ DỤNG (USE CASE)</text>
  <text x="355" y="398" font-size="10.5">• UC-01: Định vị &amp; Thuyết minh tự động GPS</text>
  <text x="355" y="420" font-size="10.5">• UC-02: Quét mã QR tại điểm dừng di tích</text>
  <text x="355" y="442" font-size="10.5">• UC-03: Nâng cấp gói Premium &amp; Thanh toán VNPAY</text>
  <text x="355" y="464" font-size="10.5">• UC-04: Đặt mua quà lưu niệm địa phương</text>
  <text x="355" y="486" font-size="10.5">• UC-05: Quản trị POI &amp; Tự động dịch thuật Edge-TTS</text>

  <line x1="340" y1="430" x2="270" y2="430" stroke="#000000" stroke-width="1.8" marker-end="url(#arrow)"/>

  <!-- Code Implementation Artifacts -->
  <rect x="50" y="350" width="220" height="160" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <rect x="50" y="350" width="220" height="28" fill="#f0f0f0" stroke="#000000" stroke-width="1.2"/>
  <text x="160" y="370" text-anchor="middle" font-size="12" font-weight="bold">7. HIỆN THỰC MÃ NGUỒN</text>
  <text x="65" y="398" font-size="10">• NearbyPage.tsx, useAutoNarration.ts</text>
  <text x="65" y="420" font-size="10">• ScanPage.tsx, PlaceQR.tsx</text>
  <text x="65" y="442" font-size="10">• PremiumContext.tsx, OrderService.java</text>
  <text x="65" y="464" font-size="10">• VnPayService.java, tokenStore.ts</text>
  <text x="65" y="486" font-size="10">• PoiPipelineServiceImpl.java (RabbitMQ)</text>

  <!-- Bidirectional verification bar -->
  <rect x="50" y="550" width="1110" height="90" fill="#fcfcfc" stroke="#000000" stroke-width="1.5"/>
  <text x="605" y="575" text-anchor="middle" font-size="12" font-weight="bold">Nguyên tắc Kiểm tra Tính Nhất quán Hai chiều (Bidirectional Traceability Assurance):</text>
  <text x="605" y="600" text-anchor="middle" font-size="11">✓ Truy vết xuôi (Forward Traceability): 100% Mục tiêu kinh doanh đều được chuyển hóa thành Tính năng, Yêu cầu và User Story có mã nguồn hiện thực.</text>
  <text x="605" y="622" text-anchor="middle" font-size="11">✓ Truy vết ngược (Backward Traceability): 100% Đoạn mã và Ca kiểm thử đều có căn cứ trực tiếp từ Yêu cầu chức năng và Tiêu chí chấp nhận được phê duyệt.</text>
</svg>
`;

// Helper to save SVG and render to PNG
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
  console.log('Rendering Chapter 1 & Chapter 2 diagrams to Diagram_Source/ ...');
  await processDiagram('hinh_1_1_system_context', svg_1_1);
  await processDiagram('hinh_1_2_se_lifecycle', svg_1_2);
  await processDiagram('hinh_2_7_backlog_breakdown', svg_2_7);
  await processDiagram('hinh_2_8_rtm_model', svg_2_8);

  // Copy existing diagrams from docs/report/diagrams/png/ if available
  const existingFiles = [
    { src: 'hinh_3_1_system_context.png', dest: 'hinh_2_1_solution_architecture.png' },
    { src: 'hinh_3_2_solution_alignment_sketch.png', dest: 'hinh_2_1_solution_architecture_sketch.png' },
    { src: 'hinh_3_3_prd_feature_tree.png', dest: 'hinh_2_2_prd_feature_tree.png' },
    { src: 'hinh_3_4_operational_flow.png', dest: 'hinh_2_3_gps_narration_flow.png' },
    { src: 'hinh_3_8_activity_order_payment.png', dest: 'hinh_2_5_order_payment_flow.png' },
    { src: 'hinh_3_9_activity_gps_narration.png', dest: 'hinh_2_6_translation_tts_flow.png' }
  ];

  const srcDir = path.join(rootDir, 'docs', 'report', 'diagrams', 'png');
  for (const item of existingFiles) {
    const srcPath = path.join(srcDir, item.src);
    const destPath = path.join(outDir, item.dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${item.src} -> ${item.dest}`);
    }
  }

  console.log('Finished preparing all diagrams in Diagram_Source/ !');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
