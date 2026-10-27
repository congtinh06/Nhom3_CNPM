import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ch3Dir = path.join(rootDir, 'Diagram_Source_Chuong_3');
const ch2Dir = path.join(rootDir, 'Diagram_Source');
const imgCentralDir = path.join(rootDir, 'img');

// Common monochrome defs
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

function fixCommonXml(str) {
  let res = str;
  res = res.replace(/&le;/g, '&#8804;');
  res = res.replace(/&ge;/g, '&#8805;');
  res = res.replace(/&harr;/g, '&#8596;');
  res = res.replace(/&larr;/g, '&#8592;');
  res = res.replace(/&rarr;/g, '&#8594;');
  // Replace unescaped & with &amp;
  res = res.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  return res;
}

// -----------------------------------------------------------------------------
// 1. FIX CHAPTER 3 SVGs
// -----------------------------------------------------------------------------

function fixChapter3Svgs() {
  console.log("=== FIXING CHAPTER 3 SVGs ===");

  // 1.1 Hinh 3.1 Use Case Tổng Quan
  const p3_1 = path.join(ch3Dir, 'hinh_3_1_use_case_tong_quan.svg');
  let c3_1 = fs.readFileSync(p3_1, 'utf-8');
  c3_1 = fixCommonXml(c3_1);
  c3_1 = c3_1.replace(/HÌNH 3\.2\. SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ HỆ THỐNG ECHORA \(UML 2\.5\)/g,
                      'HÌNH 3.1. SƠ ĐỒ CA SỬ DỤNG TỔNG THỂ HỆ THỐNG ECHORA (UML 2.5)');
  fs.writeFileSync(p3_1, c3_1, 'utf-8');
  console.log('Fixed hinh_3_1_use_case_tong_quan.svg');

  // 1.2 Hinh 3.2 Tourist Subsystem
  const p3_2 = path.join(ch3Dir, 'hinh_3_2_uc_tourist.svg');
  let c3_2 = fs.readFileSync(p3_2, 'utf-8');
  c3_2 = fixCommonXml(c3_2);
  c3_2 = c3_2.replace(/HÌNH 3\.3\. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ DU KHÁCH/g,
                      'HÌNH 3.2. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ DU KHÁCH');
  fs.writeFileSync(p3_2, c3_2, 'utf-8');
  console.log('Fixed hinh_3_2_uc_tourist.svg');

  // 1.3 Hinh 3.3 User Order Subsystem
  const p3_3 = path.join(ch3Dir, 'hinh_3_3_uc_user_order.svg');
  let c3_3 = fs.readFileSync(p3_3, 'utf-8');
  c3_3 = fixCommonXml(c3_3);
  c3_3 = c3_3.replace(/HÌNH 3\.4\. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ TÀI KHOẢN/g,
                      'HÌNH 3.3. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ NGƯỜI DÙNG, GIỎ HÀNG &amp; THANH TOÁN');
  fs.writeFileSync(p3_3, c3_3, 'utf-8');
  console.log('Fixed hinh_3_3_uc_user_order.svg');

  // 1.4 Hinh 3.4 Admin Subsystem
  const p3_4 = path.join(ch3Dir, 'hinh_3_4_uc_admin.svg');
  let c3_4 = fs.readFileSync(p3_4, 'utf-8');
  c3_4 = fixCommonXml(c3_4);
  c3_4 = c3_4.replace(/HÌNH 3\.5\. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ QUẢN TRỊ/g,
                      'HÌNH 3.4. SƠ ĐỒ CA SỬ DỤNG PHÂN HỆ QUẢN TRỊ NỘI DUNG DI SẢN &amp; CMS');
  fs.writeFileSync(p3_4, c3_4, 'utf-8');
  console.log('Fixed hinh_3_4_uc_admin.svg');

  // 1.5 Hinh 3.5 Activity GPS Narration (Critical geometric disconnection fix!)
  const p3_5 = path.join(ch3Dir, 'hinh_3_5_activity_gps_narration.svg');
  let c3_5 = fs.readFileSync(p3_5, 'utf-8');
  c3_5 = fixCommonXml(c3_5);
  c3_5 = c3_5.replace(/HÌNH 3\.7\. SƠ ĐỒ HOẠT ĐỘNG \(ACTIVITY DIAGRAM\) — UC-03: THUYẾT MINH GPS TỰ ĐỘNG/g,
                      'HÌNH 3.5. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — UC-02: THUYẾT MINH GPS TỰ ĐỘNG');

  // Fix lines 66-70: broken zero-length feedback loop from d <= r?
  const oldLoop1 = `<line x1="500" y1="345" x2="570" y2="345" stroke="#000000" stroke-width="1.2"/>
  <line x1="570" y1="345" x2="570" y2="267" stroke="#000000" stroke-width="1.2"/>
  <line x1="570" y1="267" x2="570" y2="267" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="535" y="338" font-size="9" fill="#555555">[Không: Di chuyển tiếp]</text>`;

  const newLoop1 = `<line x1="500" y1="345" x2="610" y2="345" stroke="#000000" stroke-width="1.2"/>
  <line x1="610" y1="345" x2="610" y2="260" stroke="#000000" stroke-width="1.2"/>
  <line x1="610" y1="260" x2="570" y2="260" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="540" y="338" font-size="9" fill="#555555">[Không: Di chuyển tiếp]</text>`;

  c3_5 = c3_5.replace(oldLoop1, newLoop1);

  // Fix lines 79-82: loop from manualStopGuard
  const oldLoop2 = `<line x1="520" y1="430" x2="590" y2="430" stroke="#000000" stroke-width="1.2"/>
  <line x1="590" y1="430" x2="590" y2="267" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="555" y="422" font-size="9" fill="#555555">[Có: Bỏ qua kích hoạt]</text>`;

  const newLoop2 = `<line x1="520" y1="430" x2="635" y2="430" stroke="#000000" stroke-width="1.2"/>
  <line x1="635" y1="430" x2="635" y2="275" stroke="#000000" stroke-width="1.2"/>
  <line x1="635" y1="275" x2="570" y2="275" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="555" y="422" font-size="9" fill="#555555">[Có: Bỏ qua kích hoạt]</text>`;

  c3_5 = c3_5.replace(oldLoop2, newLoop2);

  // Connect Web Speech fallback to listen action
  const oldFallback = `<rect x="310" y="740" width="260" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="758" text-anchor="middle" font-size="10.5">Kích hoạt Web Speech API</text>
  <text x="440" y="772" text-anchor="middle" font-size="10" fill="#444444">Đọc văn bản dự phòng trên trình duyệt</text>`;

  const newFallback = `<rect x="310" y="740" width="260" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="440" y="758" text-anchor="middle" font-size="10.5">Kích hoạt Web Speech API</text>
  <text x="440" y="772" text-anchor="middle" font-size="10" fill="#444444">Đọc văn bản dự phòng trên trình duyệt</text>
  <line x1="310" y1="760" x2="230" y2="825" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="270" y="790" font-size="8.5" fill="#444444">Audio phát ra loa</text>`;

  c3_5 = c3_5.replace(oldFallback, newFallback);

  // Add final node for 403 Forbidden modal
  const oldModal = `<rect x="70" y="575" width="160" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="598" text-anchor="middle" font-size="10.5">Xem trang /nang-cap</text>`;

  const newModal = `<rect x="70" y="575" width="160" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="150" y="598" text-anchor="middle" font-size="10.5">Xem trang /nang-cap</text>
  <line x1="150" y1="615" x2="150" y2="640" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <circle cx="150" cy="652" r="10" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
  <circle cx="150" cy="652" r="6" fill="#000000"/>`;

  c3_5 = c3_5.replace(oldModal, newModal);

  fs.writeFileSync(p3_5, c3_5, 'utf-8');
  console.log('Fixed and fully connected hinh_3_5_activity_gps_narration.svg');

  // 1.6 Hinh 3.6 Activity Order Payment
  const p3_6 = path.join(ch3Dir, 'hinh_3_6_activity_order_payment.svg');
  let c3_6 = fs.readFileSync(p3_6, 'utf-8');
  c3_6 = fixCommonXml(c3_6);
  c3_6 = c3_6.replace(/HÌNH 3\.8\. SƠ ĐỒ HOẠT ĐỘNG \(ACTIVITY DIAGRAM\) — ĐẶT HÀNG &amp; THANH TOÁN \(VNPAY \/ VIETQR\)/g,
                      'HÌNH 3.6. SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) — UC-07 &amp; UC-08: NÂNG CẤP GÓI PREMIUM VÀ THANH TOÁN VNPAY');

  // Connect VietQR box to verification
  const oldVietQr = `<rect x="280" y="470" width="250" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="488" text-anchor="middle" font-size="10.5">Hiển thị mã QR chuẩn NAPAS</text>
  <text x="405" y="502" text-anchor="middle" font-size="10" fill="#444444">Số TK + Số tiền + Mã đơn hàng</text>`;

  const newVietQr = `<rect x="280" y="470" width="250" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="405" y="488" text-anchor="middle" font-size="10.5">Hiển thị mã QR chuẩn NAPAS</text>
  <text x="405" y="502" text-anchor="middle" font-size="10" fill="#444444">Số TK + Số tiền + Mã đơn hàng</text>
  <line x1="530" y1="490" x2="550" y2="490" stroke="#000000" stroke-width="1.2"/>
  <line x1="550" y1="490" x2="550" y2="560" stroke="#000000" stroke-width="1.2"/>
  <line x1="550" y1="560" x2="570" y2="560" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="555" y="525" font-size="8.5" fill="#444444">Quét QR chuyển khoản</text>`;

  c3_6 = c3_6.replace(oldVietQr, newVietQr);

  // Connect error retry loop from FAILED box back to Order confirmation
  const oldFail = `<rect x="280" y="635" width="240" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="400" y="653" text-anchor="middle" font-size="10.5">Báo lỗi giao dịch thất bại</text>
  <text x="400" y="667" text-anchor="middle" font-size="10" fill="#444444">Đơn chuyển FAILED, cho thử lại</text>`;

  const newFail = `<rect x="280" y="635" width="240" height="40" rx="6" fill="#fcfcfc" stroke="#000000" stroke-width="1.2"/>
  <text x="400" y="653" text-anchor="middle" font-size="10.5">Báo lỗi giao dịch thất bại</text>
  <text x="400" y="667" text-anchor="middle" font-size="10" fill="#444444">Đơn chuyển FAILED, cho thử lại</text>
  <line x1="280" y1="655" x2="255" y2="655" stroke="#000000" stroke-width="1.2"/>
  <line x1="255" y1="655" x2="255" y2="325" stroke="#000000" stroke-width="1.2"/>
  <line x1="255" y1="325" x2="280" y2="325" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>
  <text x="245" y="490" font-size="9" fill="#555555" transform="rotate(-90 245 490)">[Thử lại thanh toán]</text>`;

  c3_6 = c3_6.replace(oldFail, newFail);

  fs.writeFileSync(p3_6, c3_6, 'utf-8');
  console.log('Fixed and fully connected hinh_3_6_activity_order_payment.svg');

  // 1.7 Hinh 3.7 Operational Workflow
  const p3_7 = path.join(ch3Dir, 'hinh_3_7_operational_workflow.svg');
  let c3_7 = fs.readFileSync(p3_7, 'utf-8');
  c3_7 = fixCommonXml(c3_7);
  c3_7 = c3_7.replace(/HÌNH 3\.8\. SƠ ĐỒ PHÁC THẢO LUỒNG VẬN HÀNH HỆ THỐNG/g,
                      'HÌNH 3.7. SƠ ĐỒ LUỒNG VẬN HÀNH NGHIỆP VỤ TOÀN DIỆN HỆ THỐNG ECHORA');

  // Connect Audio Storage return arrow directly to Backend
  const oldStorageRet = `<line x1="1050" y1="705" x2="830" y2="745" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="960" y="740" text-anchor="middle" font-size="9.5">MP3 File</text>`;

  const newStorageRet = `<line x1="1050" y1="705" x2="600" y2="705" stroke="#000000" stroke-width="1.8" stroke-dasharray="4 3" marker-end="url(#openArrow)"/>
  <text x="825" y="700" text-anchor="middle" font-size="9.5">Nạp MP3 Stream HTTP 206</text>`;

  c3_7 = c3_7.replace(oldStorageRet, newStorageRet);
  fs.writeFileSync(p3_7, c3_7, 'utf-8');
  console.log('Fixed and fully connected hinh_3_7_operational_workflow.svg');

  // 1.8 Hinh 3.8 Sequence Auth Token
  const p3_8 = path.join(ch3Dir, 'hinh_3_8_sequence_auth_token.svg');
  let c3_8 = fs.readFileSync(p3_8, 'utf-8');
  c3_8 = fixCommonXml(c3_8);
  c3_8 = c3_8.replace(/HÌNH 3\.9\. SƠ ĐỒ TUẦN TỰ \(SEQUENCE DIAGRAM\) — XÁC THỰC KÉP VÀ TOKEN ROTATION/g,
                      'HÌNH 3.8. SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) — UC-06: XÁC THỰC KÉP VÀ TOKEN ROTATION');
  fs.writeFileSync(p3_8, c3_8, 'utf-8');
  console.log('Fixed hinh_3_8_sequence_auth_token.svg');

  // 1.9 Hinh 3.9 Sequence TTS Pipeline
  const p3_9 = path.join(ch3Dir, 'hinh_3_9_sequence_tts_pipeline.svg');
  let c3_9 = fs.readFileSync(p3_9, 'utf-8');
  c3_9 = fixCommonXml(c3_9);
  c3_9 = c3_9.replace(/HÌNH 3\.10\. SƠ ĐỒ TUẦN TỰ \(SEQUENCE DIAGRAM\) — PIPELINE DỊCH &amp; TỔNG HỢP TIẾNG NÓI AI/g,
                      'HÌNH 3.9. SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) — UC-11: PIPELINE DỊCH &amp; TỔNG HỢP TIẾNG NÓI AI');
  fs.writeFileSync(p3_9, c3_9, 'utf-8');
  console.log('Fixed hinh_3_9_sequence_tts_pipeline.svg');
}

// -----------------------------------------------------------------------------
// 2. FIX CHAPTER 1 & 2 SVGs IN Diagram_Source
// -----------------------------------------------------------------------------

function fixChapter1And2Svgs() {
  console.log("=== FIXING CHAPTER 1 & 2 SVGs ===");

  // 2.1 Hinh 1.1 System Context
  const p1_1 = path.join(ch2Dir, 'hinh_1_1_system_context.svg');
  let c1_1 = fs.readFileSync(p1_1, 'utf-8');
  c1_1 = fixCommonXml(c1_1);
  fs.writeFileSync(p1_1, c1_1, 'utf-8');
  console.log('Fixed hinh_1_1_system_context.svg');

  // 2.2 Hinh 1.2 SE Lifecycle
  const p1_2 = path.join(ch2Dir, 'hinh_1_2_se_lifecycle.svg');
  let c1_2 = fs.readFileSync(p1_2, 'utf-8');
  c1_2 = fixCommonXml(c1_2);
  fs.writeFileSync(p1_2, c1_2, 'utf-8');
  console.log('Fixed hinh_1_2_se_lifecycle.svg');

  // 2.3 Hinh 2.1 Solution Architecture (Create dedicated clean SVG!)
  const p2_1 = path.join(ch2Dir, 'hinh_2_1_solution_architecture.svg');
  const c2_1 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="600" y="32" text-anchor="middle" font-size="17" font-weight="bold">HÌNH 2.1. SƠ ĐỒ KIẾN TRÚC GIẢI PHÁP TỔNG QUAN HỆ THỐNG ECHORA (SOLUTION ARCHITECTURE)</text>
  <text x="600" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#333333">Phân tầng Khối Giải pháp theo Chuẩn 4 Tầng Doanh nghiệp: Trình diễn, API Gateway, Microservices và Hạ tầng CSDL</text>

  <!-- LAYER 1: CLIENT TIER -->
  <rect x="50" y="75" width="1100" height="95" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="75" width="240" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="90" font-size="11" font-weight="bold">1. CLIENT TIER (TẦNG TRÌNH DIỄN)</text>

  <rect x="80" y="105" width="480" height="52" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="320" y="125" text-anchor="middle" font-size="12" font-weight="bold">Web App Du khách (Mobile Web / PWA)</text>
  <text x="320" y="145" text-anchor="middle" font-size="10" fill="#444444">React 18 + TS + Vite + Leaflet OSM + Byte-Range Audio + RAM Token</text>

  <rect x="640" y="105" width="480" height="52" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="880" y="125" text-anchor="middle" font-size="12" font-weight="bold">CMS Quản trị Nội dung Di sản &amp; Quầy vé</text>
  <text x="880" y="145" text-anchor="middle" font-size="10" fill="#444444">React SPA + Dashboard + Quản lý POI/Tour/Đơn + Quầy vé thu tiền mặt</text>

  <!-- LAYER 2: API GATEWAY TIER -->
  <rect x="50" y="195" width="1100" height="105" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="195" width="290" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
  <text x="60" y="210" font-size="11" font-weight="bold">2. API GATEWAY TIER (CỔNG AN NINH TẬP TRUNG)</text>

  <rect x="80" y="225" width="1040" height="62" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="600" y="245" text-anchor="middle" font-size="12" font-weight="bold">api-gateway (Spring Cloud Gateway — Port 8080)</text>
  <text x="600" y="265" text-anchor="middle" font-size="10.5" fill="#333333">• PathGuardFilter (Chặn ../, ;)  • UntrustedHeaderStripFilter (Loại bỏ X-User-*)  • RateLimitFilter (60 req/min)  • JwtFilter (Verify Bearer AT)</text>

  <!-- LAYER 3: MICROSERVICES TIER -->
  <rect x="50" y="325" width="1100" height="160" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
  <rect x="50" y="325" width="290" height="22" fill="#eeeeee" stroke="#000000" stroke-width="1"/>
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

  <!-- LAYER 4: INFRASTRUCTURE & DATA TIER -->
  <rect x="50" y="510" width="1100" height="190" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
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
  <text x="962" y="632" text-anchor="middle" font-size="10" font-weight="bold" fill="#000000">Redis In-Memory Cache:</text>
  <text x="962" y="650" text-anchor="middle" font-size="9" fill="#333333">Mã nhận quyền Claim Code (TTL 15m)</text>
  <text x="962" y="668" text-anchor="middle" font-size="9" fill="#333333">Phiên đăng nhập &amp; Cache trạng thái (TTL 15m)</text>

  <!-- LAYER 5: EXTERNAL SERVICES -->
  <rect x="50" y="725" width="1100" height="120" fill="#ffffff" stroke="#000000" stroke-width="1.8"/>
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

  <!-- Connectors between tiers -->
  <line x1="320" y1="157" x2="320" y2="225" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="880" y1="157" x2="880" y2="225" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="287" x2="600" y2="355" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="415" x2="600" y2="510" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="600" y1="700" x2="600" y2="725" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>
`;
  fs.writeFileSync(p2_1, c2_1.trim(), 'utf-8');
  console.log('Created dedicated hinh_2_1_solution_architecture.svg');

  // 2.4 Hinh 2.2 PRD Feature Tree
  const p2_2 = path.join(ch2Dir, 'hinh_2_2_prd_feature_tree.svg');
  const c2_2 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 680" width="1100" height="680" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="550" y="32" text-anchor="middle" font-size="16" font-weight="bold" fill="#000000">HÌNH 2.2. SƠ ĐỒ CÂY PHÂN CẤP TÍNH NĂNG SẢN PHẨM ECHORA (PRD FEATURE TREE)</text>
  <text x="550" y="52" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">Phân loại 16 tính năng sản phẩm (FEAT-01 đến FEAT-16) theo khung đánh giá MoSCoW</text>

  <!-- Root Node -->
  <rect x="400" y="70" width="300" height="45" fill="#f4f4f4" stroke="#000000" stroke-width="2.2"/>
  <text x="550" y="92" text-anchor="middle" font-size="13" font-weight="bold">NỀN TẢNG DU LỊCH DI SẢN SỐ ECHORA</text>
  <text x="550" y="106" text-anchor="middle" font-size="10" fill="#444444">Hệ thống Yêu cầu Sản phẩm PRD</text>

  <!-- Tree Lines from Root -->
  <line x1="550" y1="115" x2="550" y2="140" stroke="#000000" stroke-width="1.5"/>
  <line x1="150" y1="140" x2="950" y2="140" stroke="#000000" stroke-width="1.5"/>
  <line x1="150" y1="140" x2="150" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="420" y1="140" x2="420" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="680" y1="140" x2="680" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="950" y1="140" x2="950" y2="165" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Branch 1: MUST-HAVE -->
  <rect x="40" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="150" y="185" text-anchor="middle" font-size="12" font-weight="bold">1. MUST-HAVE (BẮT BUỘC)</text>
  <text x="150" y="198" text-anchor="middle" font-size="10" fill="#444444">Tính năng cốt lõi bắt buộc hoàn thành</text>

  <line x1="150" y1="205" x2="150" y2="235" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="40" y="235" width="220" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="50" y="258" font-size="11" font-weight="bold">• FEAT-01: Bản đồ GPS tương tác</text>
  <text x="60" y="274" font-size="10" fill="#444444">Tọa độ WGS84, 7 điểm POI</text>

  <text x="50" y="300" font-size="11" font-weight="bold">• FEAT-02: Geofence tự động</text>
  <text x="60" y="316" font-size="10" fill="#444444">Bán kính 35-60m, Haversine</text>

  <text x="50" y="342" font-size="11" font-weight="bold">• FEAT-03: Thuyết minh đa ngữ</text>
  <text x="60" y="358" font-size="10" fill="#444444">Audio HTTP 206, Highlight phụ đề</text>

  <text x="50" y="384" font-size="11" font-weight="bold">• FEAT-04: Quét mã QR di sản</text>
  <text x="60" y="400" font-size="10" fill="#444444">Dự phòng quét mã mở POI</text>

  <text x="50" y="426" font-size="11" font-weight="bold">• FEAT-08: Gói Premium 500k/năm</text>
  <text x="60" y="442" font-size="10" fill="#444444">Mở khóa ngôn ngữ quốc tế</text>

  <text x="50" y="468" font-size="11" font-weight="bold">• FEAT-09: Thanh toán VNPAY/VietQR</text>
  <text x="60" y="484" font-size="10" fill="#444444">Chữ ký HMAC, Webhook IPN</text>

  <text x="50" y="510" font-size="11" font-weight="bold">• FEAT-11: Tổng hợp Edge-TTS</text>
  <text x="60" y="526" font-size="10" fill="#444444">Sinh file MP3 tự động</text>

  <text x="50" y="552" font-size="11" font-weight="bold">• FEAT-13: Quản trị POI &amp; Geofence</text>
  <text x="60" y="568" font-size="10" fill="#444444">CRUD điểm di tích, Cấu hình</text>

  <text x="50" y="594" font-size="11" font-weight="bold">• FEAT-15: Xác thực Token Rotation</text>
  <text x="60" y="610" font-size="10" fill="#444444">RAM Access + HttpOnly Cookie</text>

  <!-- Branch 2: SHOULD-HAVE -->
  <rect x="310" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="420" y="185" text-anchor="middle" font-size="12" font-weight="bold">2. SHOULD-HAVE (NÊN CÓ)</text>
  <text x="420" y="198" text-anchor="middle" font-size="10" fill="#444444">Giá trị gia tăng trải nghiệm cao</text>

  <line x1="420" y1="205" x2="420" y2="235" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="310" y="235" width="220" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="320" y="258" font-size="11" font-weight="bold">• FEAT-05: Lộ trình tham quan</text>
  <text x="330" y="274" font-size="10" fill="#444444">Tour gợi ý, Điều hướng trạm</text>

  <text x="320" y="300" font-size="11" font-weight="bold">• FEAT-06: Danh mục quà lưu niệm</text>
  <text x="330" y="316" font-size="10" fill="#444444">Đặc sản địa phương gắn liền di tích</text>

  <text x="320" y="342" font-size="11" font-weight="bold">• FEAT-07: Giỏ hàng lưu niệm</text>
  <text x="330" y="358" font-size="10" fill="#444444">Đặt quà, Miễn phí ship từ 50k</text>

  <text x="320" y="384" font-size="11" font-weight="bold">• FEAT-10: Pipeline Dịch thuật AI</text>
  <text x="330" y="400" font-size="10" fill="#444444">Dịch tự động qua MyMemory</text>

  <text x="320" y="426" font-size="11" font-weight="bold">• FEAT-14: Quản lý người dùng</text>
  <text x="330" y="442" font-size="10" fill="#444444">Phân quyền RBAC, Khóa tài khoản</text>

  <!-- Branch 3: COULD-HAVE -->
  <rect x="570" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="680" y="185" text-anchor="middle" font-size="12" font-weight="bold">3. COULD-HAVE (CÓ THỂ)</text>
  <text x="680" y="198" text-anchor="middle" font-size="10" fill="#444444">Tính năng mở rộng nếu đủ thời gian</text>

  <line x1="680" y1="205" x2="680" y2="235" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="570" y="235" width="220" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="580" y="258" font-size="11" font-weight="bold">• FEAT-12: Sự kiện RabbitMQ</text>
  <text x="590" y="274" font-size="10" fill="#444444">Xếp hàng tác vụ bất đồng bộ</text>

  <text x="580" y="300" font-size="11" font-weight="bold">• FEAT-16: Phân tích tương tác</text>
  <text x="590" y="316" font-size="10" fill="#444444">Dashboard thống kê lượt quét / nghe</text>

  <text x="580" y="342" font-size="11" font-weight="bold">• Tin tức văn hóa di sản</text>
  <text x="590" y="358" font-size="10" fill="#444444">Bài viết giới thiệu lịch sử chuyên sâu</text>

  <!-- Branch 4: WON'T-HAVE -->
  <rect x="840" y="165" width="220" height="40" fill="#ffffff" stroke="#000000" stroke-width="2"/>
  <text x="950" y="185" text-anchor="middle" font-size="12" font-weight="bold">4. WON'T-HAVE (GIAI ĐOẠN SAU)</text>
  <text x="950" y="198" text-anchor="middle" font-size="10" fill="#444444">Chuyển sang Phase 2 tương lai</text>

  <line x1="950" y1="205" x2="950" y2="235" stroke="#000000" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="840" y="235" width="220" height="410" fill="#fafafa" stroke="#000000" stroke-width="1.2"/>
  <text x="850" y="258" font-size="11" font-weight="bold">• Thực tế tăng cường (AR 3D)</text>
  <text x="860" y="274" font-size="10" fill="#444444">Tái hiện hiện vật 3D thực địa</text>

  <text x="850" y="300" font-size="11" font-weight="bold">• AI Chatbot hướng dẫn viên</text>
  <text x="860" y="316" font-size="10" fill="#444444">Đối thoại trực tiếp qua LLM</text>

  <text x="850" y="342" font-size="11" font-weight="bold">• Tải offline toàn bộ bản đồ</text>
  <text x="860" y="358" font-size="10" fill="#444444">Cache dung lượng lớn trên thiết bị</text>
</svg>
`;
  fs.writeFileSync(p2_2, c2_2.trim(), 'utf-8');
  console.log('Created dedicated hinh_2_2_prd_feature_tree.svg');

  // 2.5 Hinh 2.3 GPS Narration Flow
  const p2_3 = path.join(ch2Dir, 'hinh_2_3_gps_narration_flow.svg');
  const c2_3 = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 660" width="1100" height="660" style="background:#ffffff; font-family:'Times New Roman', Times, serif;">
  ${commonDefs}
  <text x="550" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#000000">HÌNH 2.3. SƠ ĐỒ LUỒNG VẬN HÀNH ĐỊNH VỊ GEOFENCE GPS VÀ THUYẾT MINH TỰ ĐỘNG</text>
  <text x="550" y="48" text-anchor="middle" font-size="12" font-style="italic" fill="#444444">Hành trình trải nghiệm từ tiếp cận, định vị, nghe thuyết minh, kiểm tra cước đến quản trị</text>

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
  <text x="630" y="285" text-anchor="middle" font-size="11">• Haversine tính d &#8804; r</text>
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
  fs.writeFileSync(p2_3, c2_3.trim(), 'utf-8');
  console.log('Created dedicated hinh_2_3_gps_narration_flow.svg');

  // 2.6 Hinh 2.5 Order Payment Flow (For Figure 2.4 in report)
  const p2_5 = path.join(ch2Dir, 'hinh_2_5_order_payment_flow.svg');
  // Copy the fixed activity order payment SVG with updated title for Chapter 2
  let c2_5 = fs.readFileSync(path.join(ch3Dir, 'hinh_3_6_activity_order_payment.svg'), 'utf-8');
  c2_5 = c2_5.replace(/HÌNH 3\.6\. SƠ ĐỒ HOẠT ĐỘNG \(ACTIVITY DIAGRAM\) — UC-07 &amp; UC-08: NÂNG CẤP GÓI PREMIUM VÀ THANH TOÁN VNPAY/g,
                      'HÌNH 2.4. SƠ ĐỒ HOẠT ĐỘNG LUỒNG ĐẶT HÀNG VÀ THANH TOÁN AN TOÀN QUA CỔNG VNPAY');
  fs.writeFileSync(p2_5, c2_5, 'utf-8');
  console.log('Created dedicated hinh_2_5_order_payment_flow.svg (Figure 2.4)');

  // 2.7 Hinh 2.6 Translation TTS Flow (For Figure 2.5 in report - The TRUE TTS Pipeline!)
  const p2_6 = path.join(ch2Dir, 'hinh_2_6_translation_tts_flow.svg');
  let c2_6 = fs.readFileSync(path.join(ch3Dir, 'hinh_3_9_sequence_tts_pipeline.svg'), 'utf-8');
  c2_6 = c2_6.replace(/HÌNH 3\.9\. SƠ ĐỒ TUẦN TỰ \(SEQUENCE DIAGRAM\) — UC-11: PIPELINE DỊCH &amp; TỔNG HỢP TIẾNG NÓI AI/g,
                      'HÌNH 2.5. SƠ ĐỒ HOẠT ĐỘNG PIPELINE TỰ ĐỘNG DỊCH THUẬT VÀ SINH GIỌNG NÓI AI EDGE-TTS');
  fs.writeFileSync(p2_6, c2_6, 'utf-8');
  console.log('Created dedicated hinh_2_6_translation_tts_flow.svg (Figure 2.5)');

  // 2.8 Hinh 2.7 Backlog Breakdown (For Figure 2.6 in report)
  const p2_7 = path.join(ch2Dir, 'hinh_2_7_backlog_breakdown.svg');
  let c2_7 = fs.readFileSync(p2_7, 'utf-8');
  c2_7 = fixCommonXml(c2_7);
  c2_7 = c2_7.replace(/HÌNH 2\.7\. SƠ ĐỒ CẤU TRÚC PHÂN RÃ PRODUCT BACKLOG/g,
                      'HÌNH 2.6. SƠ ĐỒ CẤU TRÚC PHÂN RÃ PRODUCT BACKLOG (EPIC - FEATURE - USER STORY - AC)');

  // Add the 5 connecting vertical arrows from Epics to Feature columns
  const epicLines = `  <!-- Connecting arrows from Epics to Features -->
  <line x1="135" y1="230" x2="135" y2="250" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="375" y1="230" x2="375" y2="250" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="615" y1="230" x2="615" y2="250" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="855" y1="230" x2="855" y2="250" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1080" y1="230" x2="1080" y2="250" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>`;

  if (!c2_7.includes('Connecting arrows from Epics to Features')) {
    c2_7 = c2_7.replace('<!-- Features & Stories Column 1 (Epic 1) -->', epicLines + '\n\n  <!-- Features & Stories Column 1 (Epic 1) -->');
  }
  fs.writeFileSync(p2_7, c2_7, 'utf-8');
  console.log('Fixed and fully connected hinh_2_7_backlog_breakdown.svg (Figure 2.6)');

  // 2.9 Hinh 2.8 RTM Model (For Figure 2.7 in report)
  const p2_8 = path.join(ch2Dir, 'hinh_2_8_rtm_model.svg');
  let c2_8 = fs.readFileSync(p2_8, 'utf-8');
  c2_8 = fixCommonXml(c2_8);
  c2_8 = c2_8.replace(/HÌNH 2\.8\. SƠ ĐỒ MÔ HÌNH MA TRẬN TRUY VẾT YÊU CẦU PHẦN MỀM/g,
                      'HÌNH 2.7. SƠ ĐỒ MÔ HÌNH MA TRẬN TRUY VẾT YÊU CẦU PHẦN MỀM HAI CHIỀU (RTM MODEL)');
  fs.writeFileSync(p2_8, c2_8, 'utf-8');
  console.log('Fixed and verified hinh_2_8_rtm_model.svg (Figure 2.7)');
}

// -----------------------------------------------------------------------------
// 3. RENDER ALL TO HIGH-RESOLUTION PNGs VIA PLAYWRIGHT
// -----------------------------------------------------------------------------

async function renderAllPngs() {
  const { chromium } = await import('../frontend/node_modules/playwright/index.mjs');
  console.log("\nKhởi động Playwright Chromium để render toàn bộ sơ đồ học thuật đơn sắc...");
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();

  async function renderSvgFile(svgPath, pngPath, fallbackW = 1200, fallbackH = 800) {
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    const widthMatch = svgContent.match(/width="([^"]+)"/);
    const heightMatch = svgContent.match(/height="([^"]+)"/);
    const w = widthMatch ? parseInt(widthMatch[1], 10) : fallbackW;
    const h = heightMatch ? parseInt(heightMatch[1], 10) : fallbackH;

    await page.setViewportSize({ width: w, height: h });
    await page.setContent(svgContent);
    const svgElem = await page.$('svg');
    if (svgElem) {
      await svgElem.screenshot({ path: pngPath, omitBackground: false });
      console.log(`Rendered: ${path.basename(pngPath)} (${w}x${h})`);
    } else {
      console.error(`SVG element not found for ${svgPath}`);
    }
  }

  // Render Chapter 3 diagrams
  console.log("\n=== RENDERING CHAPTER 3 DIAGRAMS ===");
  const ch3Files = [
    'hinh_3_1_use_case_tong_quan',
    'hinh_3_2_uc_tourist',
    'hinh_3_3_uc_user_order',
    'hinh_3_4_uc_admin',
    'hinh_3_5_activity_gps_narration',
    'hinh_3_6_activity_order_payment',
    'hinh_3_7_operational_workflow',
    'hinh_3_8_sequence_auth_token',
    'hinh_3_9_sequence_tts_pipeline'
  ];

  for (const name of ch3Files) {
    const sPath = path.join(ch3Dir, `${name}.svg`);
    const pPath = path.join(ch3Dir, `${name}.png`);
    await renderSvgFile(sPath, pPath);
  }

  // Render Chapter 1 & 2 diagrams
  console.log("\n=== RENDERING CHAPTER 1 & 2 DIAGRAMS ===");
  const ch2Files = [
    'hinh_1_1_system_context',
    'hinh_1_2_se_lifecycle',
    'hinh_2_1_solution_architecture',
    'hinh_2_2_prd_feature_tree',
    'hinh_2_3_gps_narration_flow',
    'hinh_2_5_order_payment_flow',
    'hinh_2_6_translation_tts_flow',
    'hinh_2_7_backlog_breakdown',
    'hinh_2_8_rtm_model'
  ];

  for (const name of ch2Files) {
    const sPath = path.join(ch2Dir, `${name}.svg`);
    const pPath = path.join(ch2Dir, `${name}.png`);
    await renderSvgFile(sPath, pPath);
  }

  await browser.close();
  console.log("\nAll diagrams successfully rendered to high-resolution PNGs!");
}

async function main() {
  fixChapter3Svgs();
  fixChapter1And2Svgs();
  await renderAllPngs();
}

main().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
