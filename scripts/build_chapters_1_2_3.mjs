import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  escapeXml,
  h1,
  h2,
  h3,
  p,
  bullet,
  numbered,
  figure,
  table,
  pageBreak
} from './docx_utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let doc = '';

// ==============================================================================
// CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI
// ==============================================================================
doc += h1('CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI');

doc += h2('1.1. Lý do chọn đề tài');
doc += p('Thành phố Hồ Chí Minh là trung tâm kinh tế, văn hóa và du lịch hàng đầu của Việt Nam, mỗi năm đón hàng triệu lượt khách du lịch quốc tế và nội địa ghé thăm các công trình di sản nổi tiếng như Dinh Độc Lập, Nhà thờ Chính tòa Đức Bà, Bưu điện Trung tâm Thành phố, Chợ Bến Thành, Bảo tàng Chứng tích Chiến tranh, Chùa Bà Thiên Hậu hay Di tích Xưởng đóng tàu Ba Son. Tuy nhiên, qua khảo sát thực tế tại các điểm đến, nhóm nghiên cứu nhận thấy du khách độc lập (đặc biệt là khách quốc tế) đang phải đối mặt với nhiều rào cản lớn:');
doc += bullet('**Rào cản bất đồng ngôn ngữ và sự thiếu hụt phương tiện truyền tải chuyên sâu**: Hầu hết các biển chỉ dẫn tại di tích chỉ cung cấp tóm tắt ngắn gọn bằng tiếng Việt và tiếng Anh, thiếu vắng các ngôn ngữ phổ biến của khách du lịch Đông Bắc Á như tiếng Nhật (`ja`) và tiếng Hàn (`ko`). Việc tiếp cận tư liệu văn hóa chi tiết đòi hỏi phải thuê hướng dẫn viên riêng với chi phí cao hoặc tham gia đoàn đông người, làm giảm sự chủ động và tự do khám phá.');
doc += bullet('**Trải nghiệm tham quan bị gián đoạn và phân mảnh**: Du khách di chuyển ngoài thực địa phải liên tục thao tác tra cứu bản đồ trên điện thoại, khó nhận biết chính xác thời điểm mình đã bước vào khuôn viên ảnh hưởng của di tích.');
doc += bullet('**Rào cản cài đặt ứng dụng native truyền thống**: Các ứng dụng du lịch truyền thống trên kho ứng dụng (App Store, Google Play) thường có dung lượng lớn từ 80MB đến 250MB, đòi hỏi cấp quyền hệ thống phức tạp và tạo tâm lý e ngại đối với du khách chỉ tham quan ngắn ngày trong vài giờ.');
doc += bullet('**Hạn chế của trình duyệt di động về chính sách phát âm thanh (Autoplay Policy)**: Các trình duyệt web hiện đại trên thiết bị di động (Safari iOS, Chrome Android) mặc định chặn đứng việc tự động phát âm thanh nếu không có tương tác chạm trực tiếp từ người dùng, gây khó khăn cho việc xây dựng ứng dụng web hướng dẫn viên tự động.');
doc += bullet('**Chi phí biên soạn và cập nhật nội dung đa ngữ tốn kém**: Các ban quản lý di tích gặp thách thức lớn khi phải chi trả ngân sách cao để thuê dịch thuật và phòng thu âm thủ công cho từng bài phát thanh mỗi khi cần cập nhật thông tin.');
doc += p('Từ bối cảnh thực tiễn trên, nhóm nghiên cứu đã lựa chọn và xây dựng đề tài **Echora** — Nền tảng hướng dẫn viên du lịch số tự động thuyết minh di sản Thành phố Hồ Chí Minh. Hệ thống được triển khai dưới dạng ứng dụng web đơn trang (Single Page Application - SPA), kết hợp định vị vệ tinh GPS theo thời gian thực với mã phản hồi nhanh (QR Code), mang đến trải nghiệm thuyết minh âm thanh đa ngôn ngữ tự động và tức thì ngay trên trình duyệt mà không cần cài đặt phần mềm bổ sung.');

doc += h2('1.2. Mục tiêu đề tài');
doc += p('Đề tài xác định rõ ràng giữa mục tiêu tổng quát của hệ thống và các kết quả cụ thể đã hiện thực thành công trong mã nguồn:');
doc += p('**1. Mục tiêu tổng quát**:');
doc += p('Xây dựng một nền tảng du lịch số thông minh hoạt động ổn định trên nền tảng web di động, hỗ trợ du khách tiếp cận thông tin di sản văn hóa Sài Gòn bằng tiếng mẹ đẻ một cách tự động, thuận tiện và an toàn; đồng thời cung cấp công cụ số hóa khép kín cho ban quản lý di tích trong việc biên soạn, dịch thuật tự động, quản trị nội dung và quảng bá đặc sản địa phương.');
doc += p('**2. Mục tiêu kỹ thuật cụ thể đã đạt được (được kiểm chứng từ mã nguồn)**:');
doc += bullet('**Nhận diện không gian và kích hoạt âm thanh tự động qua GPS**: Ứng dụng khai thác `navigator.geolocation.watchPosition` kết hợp công thức Haversine để tính khoảng cách liên tục tới các điểm di tích; tự động kích hoạt bài thuyết minh khi du khách bước vào vùng Geofence có bán kính từ 35m đến 60m mà không cần bấm nghe thủ công (minh chứng: `useAutoNarration.ts:219-240`, `LocationServiceImpl.java:37-81`).');
doc += bullet('**Dự phòng tức thì qua mã QR di sản**: Cung cấp mã QR vật lý tại từng điểm dừng tham quan, cho phép du khách kích hoạt ngay bài thuyết minh tương ứng khi thiết bị mất sóng GPS hoặc người dùng từ chối cấp quyền vị trí (minh chứng: `ScanPage.tsx:30-90`, `LocationController.java:45-51`).');
doc += bullet('**Pipeline dịch thuật và tổng hợp tiếng nói AI khép kín**: Xây dựng quy trình xử lý bất đồng bộ trên RabbitMQ: khi quản trị viên cập nhật bài viết tiếng Việt, hệ thống tự động phân phối dịch sang 3 ngoại ngữ (`en`, `ja`, `ko`) qua MyMemory API / Seed Dictionary và sinh tệp âm thanh MP3 chất lượng cao bằng động cơ Microsoft Edge-TTS (minh chứng: `PoiPipelineServiceImpl.java:39-140`).');
doc += bullet('**Vận hành kiến trúc Microservices phân tán với 5 CSDL cô lập**: Thiết kế 7 dịch vụ độc lập đứng sau Spring Cloud Gateway, liên lạc qua AMQP và lưu trữ dữ liệu trên 5 cơ sở dữ liệu riêng biệt của Microsoft SQL Server 2022 (minh chứng: `docker-compose.yml:1-380`, `init-databases.sql:1-120`).');
doc += bullet('**Tích hợp thương mại điện tử quà lưu niệm và gói Premium qua VNPAY / VietQR**: Cung cấp danh mục quà lưu niệm gắn liền di tích, giỏ hàng lưu trữ cục bộ, chính sách miễn phí vận chuyển cho đơn hàng từ 50,000 VND, và gói thuê bao Premium 500,000 VND/năm mở khóa toàn bộ thuyết minh ngoại ngữ (minh chứng: `OrderService.java:104-215`, `VnPayService.java:40-110`).');
doc += bullet('**Đảm bảo an ninh dữ liệu cấp độ doanh nghiệp**: Triển khai Access Token ngắn hạn (15 phút) lưu trong bộ nhớ RAM JavaScript (`tokenStore.ts`) kết hợp Refresh Token xoay vòng (Token Rotation) trong HttpOnly Cookie có cờ `SameSite=Strict` ngăn chặn triệt để tấn công XSS và CSRF (minh chứng: `RefreshTokenService.java:44-95`).');

doc += h2('1.3. Phạm vi đề tài');
doc += p('Phạm vi của hệ thống được xác định rõ ràng qua 3 ranh giới chức năng:');
doc += h3('1.3.1. Các phân hệ thuộc phạm vi cốt lõi đã hoàn thành');
doc += bullet('**Phân hệ Bản đồ và Định vị Geofence**: Bản đồ Leaflet tương tác hiển thị 7 điểm di tích trung tâm TP.HCM, vòng tròn bán kính kích hoạt (35–60m), vị trí thực tế của du khách, chế độ giả lập tọa độ (Simulation Mode) phục vụ kiểm thử thực địa.');
doc += bullet('**Phân hệ Thuyết minh âm thanh hai tầng**: Trình phát âm thanh phân đoạn HTTP 206 Partial Content phát tệp MP3 sinh bởi Edge-TTS từ máy chủ; tự động rơi về Web Speech API của trình duyệt khi ngoại tuyến hoặc tệp máy chủ chưa sẵn sàng; cơ chế chống phát lặp và cửa sổ bảo vệ 5 giây khi người dùng dừng thủ công.');
doc += bullet('**Phân hệ Dịch thuật và Tổng hợp tiếng nói AI**: Tự động dịch và tổng hợp âm thanh đa ngữ (`vi`, `en`, `ja`, `ko`) qua RabbitMQ, bảo toàn các nội dung biên tập thủ công (`MANUAL`), kiểm soát phân quyền gói ngoại ngữ qua `AudioEntitlementFilter`.');
doc += bullet('**Phân hệ Quản trị di sản (Admin Console)**: Quản lý danh mục điểm đến (POI), khu vực (Zone), lộ trình tham quan (Route), sản phẩm quà lưu niệm, tin tức văn hóa, tài khoản người dùng và thống kê lượt tương tác.');
doc += bullet('**Phân hệ Cổng an ninh API Gateway**: Chặn đứng tấn công duyệt thư mục trái phép (`PathGuardFilter`), bảo vệ các route nội bộ (`InternalPathBlockFilter`), giới hạn tần suất 60 req/phút/IP (`AnalyticsRateLimitGlobalFilter`) và kiểm tra chữ ký HMAC-SHA256 JWT.');

doc += h3('1.3.2. Các phân hệ phụ trợ trải nghiệm');
doc += bullet('**Phân hệ Quà lưu niệm địa phương**: Danh mục 14 sản phẩm quà lưu niệm đặc trưng (bưu thiếp, cà phê rang xay, áo dài cách tân, tranh thêu, nam châm tủ lạnh...) liên kết trực tiếp với điểm di sản.');
doc += bullet('**Phân hệ Đơn hàng & Thanh toán VNPAY / VietQR**: Đặt hàng trực tuyến, thanh toán thử nghiệm qua cổng VNPAY sandbox hoặc xuất mã QR chuẩn chuyển khoản NAPAS VietQR với thời hạn đơn hàng 15 phút.');
doc += bullet('**Phân hệ Bài viết văn hóa & Tin tức**: Xuất bản các bài viết giới thiệu lịch sử, văn hóa và lễ hội đô thị Sài Gòn.');

doc += h3('1.3.3. Các nội dung nằm ngoài phạm vi đề tài hiện tại');
doc += bullet('Hệ thống không thu tiền thật từ tài khoản ngân hàng thực tế, toàn bộ giao dịch thanh toán được thực thi trên môi trường thử nghiệm VNPAY Sandbox.');
doc += bullet('Hệ thống không cung cấp chức năng chỉ đường chi tiết từng ngã rẽ (Turn-by-turn navigation) như các ứng dụng bản đồ giao thông chuyên dụng (Google Maps), mà tập trung vào nhận diện vùng không gian Geofence bao quanh di tích.');

doc += h2('1.4. Đối tượng sử dụng hệ thống');
doc += p('Căn cứ vào mã nguồn phân quyền và giao diện người dùng thực tế, hệ thống phục vụ 3 nhóm tác nhân chính:');
doc += numbered(1, '**Khách vãng lai (Guest / Visitor)**: Du khách tự do truy cập ứng dụng qua trình duyệt web trên điện thoại mà không cần đăng ký tài khoản. Khách vãng lai có quyền xem bản đồ di sản, cho phép định vị GPS để tự động nghe thuyết minh tiếng Việt (`vi`), quét mã QR tại điểm dừng, xem danh mục quà lưu niệm và đọc tin tức văn hóa.');
doc += numbered(2, '**Người dùng đã đăng ký tài khoản (Registered User)**: Du khách đã tạo tài khoản bằng email hoặc đăng nhập nhanh bằng Google OAuth2 ID Token. Nhóm này có thêm quyền mua sắm quà lưu niệm, theo dõi lịch sử đơn hàng, và thanh toán nâng cấp gói `PREMIUM` (500,000 VND/năm) để mở khóa toàn bộ tệp âm thanh thuyết minh bằng ngoại ngữ (`en`, `ja`, `ko`).');
doc += numbered(3, '**Quản trị viên hệ thống (Administrator)**: Cán bộ quản lý di sản được cấp tài khoản vai trò `ADMIN`, đăng nhập qua cổng riêng `/quan-tri` để quản lý POI, duyệt bản dịch, theo dõi hàng đợi sinh âm thanh Edge-TTS, quản lý trạm dừng lộ trình, quản lý sản phẩm quà lưu niệm và tra cứu báo cáo thống kê lượt nghe.');

doc += h2('1.5. Công nghệ sử dụng');
doc += p('Bảng 1.1 tổng hợp toàn bộ các công nghệ, framework, thư viện và hạ tầng kỹ thuật được sử dụng trong dự án Echora, kèm vai trò và minh chứng trực tiếp từ mã nguồn:');

const techHeaders = ['Công nghệ / Thư viện', 'Phiên bản', 'Vai trò kỹ thuật', 'Vị trí sử dụng trong dự án', 'Bằng chứng xác minh trong mã nguồn'];
const techRows = [
  ['Java / Spring Boot', '3.3.4 (Java 17)', 'Nền tảng backend xây dựng 6 microservices nghiệp vụ', 'Toàn bộ thư mục backend/', 'backend/*/pom.xml:8-10 (spring-boot-starter-parent 3.3.4)'],
  ['Spring Cloud Gateway', '2023.0.3', 'Cổng API Gateway trung tâm, định tuyến và an ninh', 'backend/api-gateway/', 'backend/api-gateway/pom.xml:21, application.yml:8-65'],
  ['React', '18.3.1', 'Thư viện xây dựng giao diện người dùng SPA', 'frontend/src/', 'frontend/package.json:22, App.tsx:85-183'],
  ['TypeScript', '5.5.4', 'Ngôn ngữ lập trình frontend an toàn kiểu tĩnh', 'frontend/src/', 'frontend/package.json:36, tsconfig.json:1-25'],
  ['Vite', '5.4.5', 'Công cụ đóng gói và phát triển frontend tốc độ cao', 'frontend/', 'frontend/package.json:37, vite.config.ts:1-35'],
  ['Leaflet & React-Leaflet', '1.9.4 / 4.2.1', 'Bản đồ di sản tương tác và hiển thị vùng Geofence', 'frontend/src/components/map/', 'frontend/package.json:17,24, PoiMap.tsx:1-120'],
  ['Microsoft SQL Server', '2022 (Latest)', 'Hệ quản trị CSDL quan hệ lưu trữ 5 CSDL phân lập', 'Container mssql (:1433)', 'docker-compose.yml:34, docker/init-databases.sql:1-120'],
  ['RabbitMQ', '3.13 Management', 'Bộ điều phối thông điệp AMQP cho xử lý bất đồng bộ', 'Container rabbitmq (:5672, :15800)', 'docker-compose.yml:6-28, application.yml:25-46'],
  ['Microsoft Edge-TTS', 'Python CLI', 'Động cơ AI tổng hợp giọng đọc bản ngữ 4 quốc gia', 'backend/translation-tts-service/', 'backend/translation-tts-service/application.yml:69-76'],
  ['MyMemory Translation API', 'REST API', 'Dịch vụ dịch tự động văn bản POI sang 3 ngoại ngữ', 'backend/translation-tts-service/', 'PoiPipelineServiceImpl.java:39-140, application.yml:60-67'],
  ['VNPAY Sandbox', 'v2.1.0', 'Cổng thanh toán điện tử thử nghiệm qua HMAC-SHA512', 'backend/order-service/', 'VnPayService.java:40-110, application.yml:47-56'],
  ['QR Scanner & qrcode.react', '1.4.2 / 4.2.0', 'Quét camera mã QR và hiển thị QR di sản / VietQR', 'frontend/src/pages/', 'frontend/package.json:20-21, ScanPage.tsx:30-90'],
  ['Vitest & RTL', '2.1.8 / 16.3.3', 'Bộ khung kiểm thử tự động frontend (520 tests)', 'frontend/src/test/', 'frontend/package.json:30,38, kết quả test 66 files passed'],
  ['Docker & Compose', 'Compose v2', 'Đóng gói và điều phối 9 containers phân tán', 'Root repository', 'docker-compose.yml:1-393, Dockerfile ở các services']
];
const techWidths = [2000, 1200, 2600, 2400, 2600];
doc += table(techHeaders, techRows, techWidths, 'Bảng 1.1: Danh mục công nghệ và bằng chứng xác minh trong mã nguồn');

doc += h2('1.6. Phương pháp phát triển');
doc += p('Dự án Echora áp dụng mô hình **Phát triển Phần mềm Lặp và Tăng trưởng (Iterative and Incremental Development)** kết hợp các thực hành linh hoạt của khung làm việc **Agile/Scrum**:');
doc += bullet('Dự án được chia thành các chu kỳ phát triển kế tiếp nhau (vòng đời từ 1 đến 2 tuần). Trong mỗi chu kỳ, nhóm thực hiện đầy đủ chuỗi hoạt động từ phân tích yêu cầu, thiết kế kiến trúc, hiện thực mã nguồn đến kiểm thử tự động.');
doc += bullet('Nhóm sử dụng hệ thống quản lý phiên bản phân tán Git trên nền tảng GitHub (`https://github.com/congtinh06/Nhom3_CNPM`). Chiến lược phân nhánh tuân thủ mô hình Feature Branching: nhánh `main` luôn ở trạng thái sẵn sàng triển khai, các tính năng mới được phát triển trên nhánh `feat/*` và kiểm thử độc lập trước khi tạo Pull Request.');
doc += bullet('Cơ chế tích hợp liên tục (CI) được kích hoạt tự động qua GitHub Actions trong thư mục `.github/workflows/`, tự động biên dịch mã nguồn và chạy toàn bộ bộ kiểm thử tự động mỗi khi có thao tác đẩy code.');

doc += h2('1.7. Kế hoạch thực hiện và phân công');
doc += p('Căn cứ trực tiếp vào lịch sử commit Git và các mốc bàn giao thực tế, tiến độ thực hiện đề tài được ghi nhận qua Bảng 1.2:');

const planHeaders = ['Mốc bàn giao (Milestone)', 'Thời gian hoàn thành', 'Mục tiêu kỹ thuật bàn giao', 'Trạng thái mã nguồn & Bằng chứng Git'];
const planRows = [
  ['M1: Nền tảng Bản đồ & CMS Quản trị', '2026-10-18', 'Hoàn thiện giao diện bản đồ Leaflet, menu quản trị đa cấp, phân hệ POI, Zone và Route', 'Đã hoàn thành (Commit f9cf23e, 652ef81)'],
  ['M2: Quà lưu niệm & Tin tức văn hóa', '2026-10-19', 'Tích hợp danh mục quà lưu niệm gắn với POI, hệ thống tin tức văn hóa Sài Gòn và phục vụ ảnh', 'Đã hoàn thành (Commit bbe4ef5, b466e88)'],
  ['M3: Khóa Ngoại ngữ & Gói Premium', '2026-10-20', 'Triển khai AudioEntitlementFilter khóa âm thanh ngoại ngữ, trang Premium và luồng thanh toán', 'Đã hoàn thành (Commit 1b7d8d2, b5c522c)'],
  ['M4: Đóng gói Hệ thống & VNPAY', '2026-10-22', 'Tích hợp toàn diện cổng VNPAY sandbox, quản lý đơn hàng gắn tài khoản, 520 automated tests', 'Đã hoàn thành (Commit 0a1ac17, 70b71eb)'],
  ['M5: Thử nghiệm thực địa (Pilot Onsite)', 'Chưa xác định', 'Đo đạc độ chính xác Geofence và chất lượng âm thanh ngoài trời tại 7 điểm di tích', 'Chưa triển khai (Kế hoạch thử nghiệm tiếp theo)'],
  ['M6: Phát hành chính thức (Production)', 'Chưa xác định', 'Triển khai máy chủ công khai, cấp phát chứng chỉ HTTPS cho Geolocation và VNPAY thật', 'Chưa triển khai (Kế hoạch tương lai)']
];
const planWidths = [2400, 1600, 3600, 3200];
doc += table(planHeaders, planRows, planWidths, 'Bảng 1.2: Kế hoạch thực hiện các mốc bàn giao theo lịch sử Git');

doc += h2('1.8. Bố cục báo cáo');
doc += p('Báo cáo đồ án môn học Công nghệ Phần mềm được cấu trúc thành 9 chương nội dung hoàn chỉnh:');
doc += bullet('**Chương 1: Tổng quan đề tài**: Trình bày lý do chọn đề tài, mục tiêu, phạm vi, đối tượng người dùng, bảng công nghệ, phương pháp phát triển và phân công công việc.');
doc += bullet('**Chương 2: Khảo sát và cơ sở lý thuyết**: Phân tích các hệ thống tương tự, so sánh giải pháp, giải thích cơ sở lý thuyết kỹ nghệ yêu cầu, mô hình hóa UML 2.5 và nền tảng công nghệ áp dụng.');
doc += bullet('**Chương 3: Phân tích và đặc tả yêu cầu hệ thống**: Trọng tâm phân tích với tài liệu PRD, danh mục yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), quy tắc nghiệp vụ, sơ đồ Use Case, đặc tả chi tiết 7 ca sử dụng, tiêu chí chấp nhận và ma trận truy vết RTM.');
doc += bullet('**Chương 4: Thiết kế kiến trúc và cơ sở dữ liệu**: Trình bày phân rã kiến trúc microservices, sơ đồ tuần tự, mô hình dữ liệu quan hệ (ERD 5 CSDL) và từ điển dữ liệu chi tiết.');
doc += bullet('**Chương 5: Hiện thực và cài đặt hệ thống**: Mô tả chi tiết mã nguồn các service backend, giao diện frontend và các thuật toán cốt lõi (Haversine, Token Rotation, Audio Pipeline).');
doc += bullet('**Chương 6: Kiểm thử và đảm bảo chất lượng**: Trình bày chiến lược kiểm thử tự động, kết quả thực thi 520 unit/integration tests và kịch bản thực nghiệm.');
doc += bullet('**Chương 7: Tích hợp liên tục và triển khai hệ thống**: Phân tích quy trình CI/CD GitHub Actions và kịch bản vận hành Docker Compose 9 containers.');
doc += bullet('**Chương 8: Quản lý dự án và quản trị rủi ro**: Phân tích quy trình làm việc Git, đóng góp thực tế và đánh giá rủi ro an ninh/vận hành.');
doc += bullet('**Chương 9: Kết luận và hướng phát triển**: Đánh giá kết quả đạt được đối chiếu mục tiêu và đề xuất lộ trình hoàn thiện sản phẩm.');

doc += pageBreak();

// ==============================================================================
// CHƯƠNG 2: KHẢO SÁT VÀ CƠ SỞ LÝ THUYẾT
// ==============================================================================
doc += h1('CHƯƠNG 2: KHẢO SÁT VÀ CƠ SỞ LÝ THUYẾT');

doc += h2('2.1. Khảo sát các hệ thống tương tự');
doc += p('Nhằm xác định đúng bài toán nghiệp vụ và tìm kiếm giải pháp kỹ thuật tối ưu cho Echora, nhóm đã tiến hành khảo sát 3 nhóm giải pháp hỗ trợ hướng dẫn du lịch phổ biến trên thị trường hiện nay:');
doc += numbered(1, '**Ứng dụng di động VoiceMap**: VoiceMap là nền tảng audio tour quốc tế hoạt động dựa trên định vị GPS trên thiết bị di động. Ưu điểm của VoiceMap là độ chính xác định vị cao ngoài trời và kho nội dung do người dân bản địa đóng góp. Tuy nhiên, VoiceMap tồn tại các rào cản lớn: người dùng bắt buộc phải tải ứng dụng native từ kho ứng dụng với dung lượng trên 150MB, phải trả phí cho từng tour riêng lẻ (từ 5$ đến 15$), và ứng dụng không có cơ chế dự phòng bằng mã QR khi du khách tham quan bên trong các công trình có mái che dày làm mất sóng GPS.');
doc += numbered(2, '**Nền tảng izi.TRAVEL**: izi.TRAVEL là ứng dụng hướng dẫn âm thanh toàn cầu cho các bảo tàng và thành phố. izi.TRAVEL hỗ trợ cả chế độ ngoài trời qua GPS và chế độ trong nhà qua quét mã QR hoặc nhập số thứ tự hiện vật. Mặc dù tính năng phong phú, nhược điểm của izi.TRAVEL là giao diện cồng kềnh, yêu cầu du khách tải trước toàn bộ gói dữ liệu đa phương tiện của thành phố (thường chiếm từ 300MB đến 1GB bộ nhớ), thiếu cơ chế đồng bộ cuộn phụ đề văn bản theo giọng đọc, và quy trình tạo nội dung mới đòi hỏi đơn vị quản lý phải tự thu âm thủ công từng tệp âm thanh.');
doc += numbered(3, '**Thiết bị Audio Guide cầm tay chuyên dụng tại các bảo tàng**: Một số di tích lớn tại TP.HCM (như Bảo tàng Chứng tích Chiến tranh, Dinh Độc Lập) cung cấp dịch vụ thuê máy phát âm thanh cầm tay (audio handset) tại quầy lễ tân. Du khách đặt cọc giấy tờ tùy thân, nhận máy và bấm số tương ứng gắn tại bảng hiện vật để nghe thuyết minh. Giải pháp này đảm bảo chất lượng âm thanh tốt nhưng phát sinh chi phí đầu tư phần cứng rất lớn, dễ hư hỏng, tốn nhân lực quản lý khử khuẩn thiết bị và hoàn toàn không thể mở rộng cho không gian du lịch ngoài trời trên quy mô toàn thành phố.');

doc += h2('2.2. So sánh và xác định hướng tiếp cận của Echora');
doc += p('Bảng 2.1 đối chiếu chi tiết các tiêu chí kỹ thuật cốt lõi giữa các giải pháp hiện có với nền tảng Echora:');

const compHeaders = ['Tiêu chí so sánh', 'VoiceMap', 'izi.TRAVEL', 'Thiết bị cầm tay chuyên dụng', 'Nền tảng Echora'];
const compRows = [
  ['Nền tảng vận hành', 'Native App (iOS / Android)', 'Native App (iOS / Android)', 'Phần cứng chuyên dụng độc lập', 'Web SPA (Truy cập tức thì qua trình duyệt)'],
  ['Rào cản cài đặt', 'Bắt buộc tải từ App Store (150MB)', 'Bắt buộc tải từ App Store (200MB+)', 'Xếp hàng thuê và đặt cọc tại quầy', 'Không cần cài đặt, mở ngay qua URL / QR'],
  ['Cơ chế định vị kích hoạt', 'Chỉ hỗ trợ GPS ngoài trời', 'GPS ngoài trời + Nhập mã số trong nhà', 'Nhập mã số thủ công tại hiện vật', 'Định vị GPS Geofence tự động + Quét mã QR'],
  ['Cơ chế dự phòng âm thanh', 'Không có (lỗi nếu không có audio)', 'Tải trước dữ liệu offline', 'Cố định trong bộ nhớ máy phát', 'Fallback hai tầng: Edge-TTS -> Web Speech API'],
  ['Đa ngôn ngữ & Phụ đề', 'Phụ thuộc vào tác giả thu âm', 'Có đa ngữ, phụ đề tĩnh không cuộn', 'Hạn chế 2-4 ngôn ngữ nạp sẵn', 'Tự động dịch 4 ngữ (vi/en/ja/ko) + Cuộn phụ đề'],
  ['Quy trình biên soạn nội dung', 'Thu âm thủ công từng tệp MP3', 'Thu âm và tải lên thủ công', 'Nạp thẻ nhớ phần cứng thủ công', 'Pipeline AI tự động: nhập tiếng Việt -> sinh 4 audio'],
  ['Chi phí đầu tư hạ tầng', 'Chi phí phân chia doanh thu cao', 'Phí duy trì kênh đối tác', 'Chi phí phần cứng ban đầu rất lớn', 'Mã nguồn mở, hạ tầng Docker phân tán tối ưu']
];
const compWidths = [1800, 2000, 2000, 2400, 2600];
doc += table(compHeaders, compRows, compWidths, 'Bảng 2.1: Bảng so sánh giải pháp Echora với các hệ thống trên thị trường');

doc += p('**Hướng tiếp cận của đề tài Echora**: Giải quyết triệt để rào cản cài đặt bằng công nghệ Web SPA hiện đại; áp dụng thuật toán định vị Geofence phía máy khách kết hợp cơ chế dự phòng mã QR; và tự động hóa toàn diện quy trình dịch thuật, tạo âm thanh AI đa ngữ thông qua kiến trúc phân tán hướng sự kiện.');

doc += h2('2.3. Cơ sở lý thuyết về kỹ nghệ yêu cầu');
doc += p('Kỹ nghệ yêu cầu (Requirements Engineering) là tiến trình có hệ thống nhằm khám phá, phân tích, đặc tả, thẩm định và quản lý các yêu cầu phần mềm:');
doc += bullet('**Product Requirements Document (PRD)**: Tài liệu định hình sản phẩm ở cấp độ cao nhất, thiết lập sự nhất quán giữa mục tiêu kinh doanh, giá trị mang lại cho người dùng, phạm vi chức năng, mức độ ưu tiên theo mô hình MoSCoW (Must-have, Should-have, Could-have, Won\\\'t-have) và tiêu chí nghiệm thu thành công.');
doc += bullet('**Yêu cầu chức năng (Functional Requirements - FR)**: Xác định các hành vi, dịch vụ cụ thể mà hệ thống phải thực hiện nhằm phản hồi các kích thích đầu vào từ phía người dùng hoặc hệ thống liên kết.');
doc += bullet('**Yêu cầu phi chức năng (Non-Functional Requirements - NFR)**: Định rõ các tiêu chuẩn chất lượng, ràng buộc vận hành bao gồm hiệu năng, an ninh dữ liệu, tính khả dụng, độ tin cậy và khả năng bảo trì theo tiêu chuẩn ISO/IEC 25010.');
doc += bullet('**Câu chuyện người dùng (User Story) và Tiêu chí nghiệm thu (Acceptance Criteria - AC)**: Biểu diễn yêu cầu từ góc nhìn của tác nhân người dùng theo cấu trúc: *Là một [vai trò], tôi muốn [hành động], để [đạt được lợi ích]*. Tiêu chí nghiệm thu được chuẩn hóa theo định dạng *Given [Bối cảnh tiền đề] - When [Hành động kích hoạt] - Then [Kết quả kỳ vọng]* giúp kiểm chứng chính xác hành vi phần mềm.');

doc += h2('2.4. Cơ sở lý thuyết về UML (Unified Modeling Language 2.5)');
doc += p('Ngôn ngữ mô hình hóa thống nhất (UML 2.5) cung cấp hệ thống ký pháp chuẩn quốc tế để biểu diễn trực quan cấu trúc và hành vi của hệ thống phần mềm hướng đối tượng:');
doc += bullet('**Sơ đồ Ca sử dụng (Use Case Diagram)**: Biểu diễn ranh giới hệ thống (System Boundary), các tác nhân bên ngoài (Actors) và các chức năng hệ thống cung cấp (Use Cases). Tuân thủ nghiêm ngặt các quan hệ chuẩn: `<<include>>` (quan hệ bắt buộc phải thực thi), `<<extend>>` (quan hệ mở rộng có điều kiện kèm điểm mở rộng Extension Point), và Generalization (quan hệ kế thừa vai trò giữa các tác nhân).');
doc += bullet('**Sơ đồ Hoạt động (Activity Diagram)**: Trình bày luồng điều khiển nghiệp vụ tuần tự và song song, sử dụng các phân làn bơi (Swimlanes) để phân định trách nhiệm xử lý giữa người dùng, trình duyệt và các dịch vụ backend.');
doc += bullet('**Sơ đồ Tuần tự (Sequence Diagram)**: Thể hiện trình tự tương tác thời gian giữa các đối tượng và dịch vụ phân tán, làm rõ các thông điệp đồng bộ/bất đồng bộ và mã phản hồi HTTP.');

doc += h2('2.5. Cơ sở kỹ thuật liên quan đến Echora');
doc += p('Hệ thống Echora ứng dụng các nguyên lý kỹ thuật phần mềm tiên tiến trong môi trường phân tán:');
doc += bullet('**Kiến trúc Microservices & Spring Cloud Gateway**: Hệ thống tách thành 7 dịch vụ độc lập. Cổng API Gateway tiếp nhận lưu lượng tập trung, áp dụng chuỗi bộ lọc an ninh (`PathGuardFilter`, `AdminAuthGlobalFilter`, `UserAuthGlobalFilter`, `AnalyticsRateLimitGlobalFilter`) bảo vệ hạ tầng nội bộ.');
doc += bullet('**Giao tiếp bất đồng bộ qua RabbitMQ AMQP**: Các dịch vụ liên lạc qua mô hình Xuất bản - Đăng ký (Publish/Subscribe) trên Topic Exchange `echora.topic` và Direct Exchange `echora.analytics`. Cơ chế này giải phóng áp lực tải cho máy chủ, tách rời tiến trình biên soạn POI khỏi tiến trình dịch thuật và sinh âm thanh nặng nề.');
doc += bullet('**Bảo mật xác thực kép & Token Rotation**: Access Token ngắn hạn (15 phút) chỉ lưu trong bộ nhớ RAM JavaScript (`tokenStore.ts`), Refresh Token lưu trong HttpOnly Cookie có cờ `SameSite=Strict`. Khi gia hạn, Refresh Token cũ bị hủy và phát hành token mới; nếu phát hiện token cũ bị sử dụng lại, toàn bộ phiên của tài khoản lập tức bị thu hồi.');
doc += bullet('**Công thức Haversine & Bounding Box Geofencing**: Sử dụng bán kính Trái Đất chuẩn $R = 6,371,000$ m tính khoảng cách cung tròn giữa tọa độ GPS của du khách và điểm di tích. Phía máy chủ lọc nhanh qua hình chữ nhật bao quanh (Bounding Box) $\\Delta Lat = \\frac{r}{111320}$, $\\Delta Lng = \\frac{r}{111320 \\times \\cos(Lat)}$ trước khi duyệt chi tiết.');
doc += bullet('**Truyền phát âm thanh phân đoạn HTTP 206 Range Requests**: Cho phép trình duyệt nạp trước vài kilobyte đầu tiên để phát tức thì với độ trễ dưới 1 giây, hỗ trợ tua thời gian linh hoạt và tiết kiệm băng thông.');
doc += bullet('**Khóa lạc quan (Optimistic Locking)**: Áp dụng trường `@Version` trên các bảng dữ liệu quan trọng (`poi`, `zone`, `route`) để phát hiện và ngăn chặn tranh chấp ghi đè dữ liệu khi hai quản trị viên cùng thao tác.');

doc += h2('2.6. Tổng kết chương');
doc += p('Chương 2 đã hoàn thành việc khảo sát các hệ thống tương tự, làm rõ ưu thế cạnh tranh của Echora, đồng thời thiết lập vững chắc nền tảng cơ sở lý thuyết về kỹ nghệ yêu cầu, mô hình hóa UML 2.5 và các công nghệ cốt lõi. Đây là tiền đề khoa học trực tiếp để tiến hành phân tích và đặc tả chi tiết yêu cầu hệ thống tại Chương 3.');

doc += pageBreak();

// ==============================================================================
// CHƯƠNG 3: PHÂN TÍCH VÀ ĐẶC TẢ YÊU CẦU HỆ THỐNG
// ==============================================================================
doc += h1('CHƯƠNG 3: PHÂN TÍCH VÀ ĐẶC TẢ YÊU CẦU HỆ THỐNG');

doc += h2('3.1. Mô tả bài toán và bối cảnh nghiệp vụ');
doc += p('Trong kỷ nguyên du lịch thông minh, du khách ngày càng có xu hướng du lịch độc lập, tự do khám phá theo lộ trình cá nhân thay vì phụ thuộc vào các tour du lịch truyền thống. Tuy nhiên, khi tham quan các công trình di sản văn hóa tại Thành phố Hồ Chí Minh, du khách gặp phải rào cản lớn do thiếu phương tiện truyền tải thông tin đa ngữ tự động, các biển chú dẫn chỉ có tiếng Việt và tiếng Anh tóm tắt niên đại, không truyền tải được chiều sâu lịch sử.');
doc += p('Quy trình nghiệp vụ thực tế đòi hỏi một giải pháp công nghệ đáp ứng trọn vẹn chuỗi trải nghiệm:');
doc += numbered(1, 'Du khách mở trình duyệt điện thoại truy cập ứng dụng, chọn ngôn ngữ mẹ đẻ (`vi`, `en`, `ja`, `ko`).');
doc += numbered(2, 'Hệ thống hiển thị bản đồ trực quan với các điểm di sản trung tâm kèm vùng Geofence (35–60m). Khi du khách đi bộ vào vùng này, bài thuyết minh tự động cất lên, phụ đề văn bản cuộn highlight đồng bộ theo câu đọc.');
doc += numbered(3, 'Tại những khu vực bị che khuất sóng vệ tinh GPS, du khách mở camera quét mã QR vật lý gắn tại di tích để nạp bài thuyết minh tương ứng mà không bị gián đoạn chuyến tham quan.');
doc += numbered(4, 'Du khách có nhu cầu nghe thuyết minh ngoại ngữ hoặc mua quà lưu niệm đặc trưng có thể thực hiện thanh toán trực tuyến thuận tiện qua VNPAY hoặc VietQR.');
doc += numbered(5, 'Cán bộ quản lý di sản có bảng điều khiển tập trung để cập nhật bài viết tiếng Việt một lần duy nhất; hệ thống tự động điều phối dịch thuật và tổng hợp âm thanh giọng đọc bản ngữ AI.');

doc += h2('3.2. Product Requirements Document (PRD)');
doc += p('Tài liệu Yêu cầu Sản phẩm (PRD) của Echora được xác lập dựa trên mã nguồn thực tế và tài liệu `docs/PRD.md`:');
doc += bullet('**Tên sản phẩm**: Echora (Nền tảng Hướng dẫn viên Du lịch Đa ngôn ngữ Tự động). Tên mã kỹ thuật: `saigonvoice`.');
doc += bullet('**Mục tiêu sản phẩm**: Tự động hóa trải nghiệm du lịch di sản bằng định vị GPS và mã QR; xóa bỏ rào cản ngôn ngữ trên 4 thứ tiếng; hỗ trợ thương mại điện tử quà lưu niệm và thanh toán số.');
doc += bullet('**Nhóm người dùng mục tiêu**: Du khách tự do trong nước và quốc tế; Cán bộ quản lý di sản và ban biên tập nội dung du lịch.');
doc += bullet('**Danh sách tính năng sản phẩm theo mô hình ưu tiên MoSCoW**:');
doc += bullet('• **Must-have (Bắt buộc phải có)**: Bản đồ Leaflet GPS thời gian thực; Tự động kích hoạt thuyết minh Geofence; Quét mã QR di sản; Pipeline dịch thuật và tổng hợp Edge-TTS đa ngữ; Xác thực kép JWT và Refresh Token Rotation; Quản lý CMS POI, Lộ trình, Quà lưu niệm.', 2);
doc += bullet('• **Should-have (Nên có)**: Chế độ giả lập tọa độ GPS Simulation Mode; Thanh toán trực tuyến VNPAY sandbox và mã VietQR; Mô hình gói thuê bao Premium mở khóa ngoại ngữ; Phân tích thống kê sự kiện du lịch bất đồng bộ qua RabbitMQ.', 2);
doc += bullet('• **Could-have (Có thể bổ sung)**: Hỗ trợ nạp trước dữ liệu ngoại tuyến toàn diện; Tích hợp bình luận đánh giá điểm đến.', 2);
doc += bullet('• **Won\\\'t-have (Chưa triển khai trong phiên bản này)**: Thanh toán thẻ quốc tế thực tế; Dẫn đường giao thông turn-by-turn.', 2);
doc += bullet('**Tiêu chí thành công**: Thời gian bắt đầu phát âm thanh dưới 1.5 giây; 100% các route quản trị được bảo vệ bởi JWT và API key nội bộ; Vượt qua 520 automated tests trong bộ kiểm thử.');

doc += h2('3.3. Tác nhân và các bên liên quan');
doc += p('Hệ thống xác định 3 tác nhân người dùng và 4 tác nhân hệ thống/bên ngoài:');
doc += bullet('**Khách vãng lai (Guest)**: Truy cập web không cần đăng nhập, sử dụng bản đồ, nhận thuyết minh tiếng Việt tự động qua GPS hoặc quét mã QR.');
doc += bullet('**Người dùng đã đăng ký (Registered User)**: Đã xác thực tài khoản, mua quà lưu niệm, theo dõi đơn hàng và nâng cấp gói Premium.');
doc += bullet('**Quản trị viên (Admin)**: Quản lý toàn diện dữ liệu POI, lộ trình, quà lưu niệm, tin tức, tài khoản và báo cáo.');
doc += bullet('**Thiết bị GPS (GPS Device / Geolocation API)**: Tác nhân phần cứng cung cấp tọa độ thời gian thực.');
doc += bullet('**Động cơ Dịch thuật & TTS (Translation & Edge-TTS)**: Dịch vụ ngoại vi dịch văn bản và tổng hợp tệp âm thanh MP3.');
doc += bullet('**Cổng thanh toán VNPAY / VietQR**: Cung cấp dịch vụ thanh toán trực tuyến.');
doc += bullet('**Bộ điều phối RabbitMQ**: Hạ tầng thông điệp phân phối sự kiện bất đồng bộ.');

doc += h2('3.4. Phạm vi và ranh giới hệ thống');
doc += p('Hệ thống phân định rõ ranh giới xử lý nội bộ và tương tác bên ngoài:');
doc += bullet('**Bên trong ranh giới (In-Scope)**: Frontend SPA React 18; API Gateway với chuỗi bộ lọc an ninh; 6 microservices backend; RabbitMQ Broker; 5 CSDL SQL Server 2022; Lưu trữ volume cục bộ.');
doc += bullet('**Bên ngoài ranh giới (Out-of-Scope)**: Vệ tinh GPS; Cổng thanh toán VNPAY; Máy chủ dịch vụ Google OAuth2; Máy chủ OpenStreetMap nạp bản đồ nền.');

doc += h2('3.5. Phân tích quy trình nghiệp vụ');
doc += p('Quy trình nghiệp vụ cốt lõi của hệ thống là **Định vị không gian Geofence và tự động phát bài thuyết minh du lịch (UC03)**, được minh họa chi tiết qua Sơ đồ Hoạt động (Hình 3.2):');

// Embed Figure 3.2 (Activity Diagram GPS Narration)
doc += figure('rId26', 'Hình 3.2. Sơ đồ Hoạt động quy trình định vị GPS và tự động phát thuyết minh', 5600000, 4433333, 102);

doc += p('Diễn giải luồng hoạt động trong sơ đồ Hình 3.2:');
doc += numbered(1, 'Du khách mở bản đồ di sản và bật công tắc "Thuyết minh tự động". Trình duyệt kích hoạt `watchPosition` liên tục thu nhận tọa độ GPS.');
doc += numbered(2, 'Hook `useAutoNarration` tính toán khoảng cách Haversine tới 7 điểm di tích. Khi khoảng cách nhỏ hơn hoặc bằng bán kính Geofence (35–60m) và điểm đó chưa phát, hệ thống bắt đầu quy trình phát âm thanh.');
doc += numbered(3, 'Hệ thống kiểm tra tệp âm thanh máy chủ: nếu có sẵn tệp MP3 Edge-TTS, yêu cầu được gửi qua Gateway; bộ lọc `AudioEntitlementFilter` kiểm tra trạng thái gói cước (miễn phí cho tiếng Việt, yêu cầu `PREMIUM` cho ngoại ngữ); tệp âm thanh được truyền phát phân đoạn qua HTTP 206 Partial Content.');
doc += numbered(4, 'Nếu tệp máy chủ chưa sẵn sàng hoặc du khách ngoại tuyến, hệ thống tự động kích hoạt Web Speech API của trình duyệt để đọc to văn bản thuyết minh dự phòng.');
doc += numbered(5, 'Sự kiện `AUDIO_PLAY` được gửi bất đồng bộ về RabbitMQ để `analytics-service` ghi nhận lượt nghe.');

doc += h2('3.6. Danh mục Yêu cầu chức năng (Functional Requirements - FR)');
doc += p('Bảng 3.1 tổng hợp 14 yêu cầu chức năng cốt lõi của Echora, được mã hóa từ FR-01 đến FR-14 kèm đối soát mã nguồn:');

const frHeaders = ['Mã FR', 'Tên chức năng', 'Mô tả hành vi chi tiết', 'Tác nhân', 'Điều kiện & Kết quả mong đợi', 'Trạng thái xác minh'];
const frRows = [
  ['FR-01', 'Bản đồ di sản tương tác', 'Hiển thị bản đồ trung tâm Sài Gòn trên nền Leaflet OSM, định vị tọa độ du khách và bán kính kích hoạt Geofence', 'Du khách', 'Đồng ý cấp quyền GPS -> Hiển thị marker vị trí thực và 7 điểm di tích', 'Đã xác minh (NearbyPage.tsx:160-220, PoiMap.tsx:1-120)'],
  ['FR-02', 'Thuyết minh âm thanh đa ngữ', 'Truyền phát âm thanh 4 ngôn ngữ (vi, en, ja, ko) kèm thanh điều khiển audio và cuộn phụ đề văn bản theo câu', 'Du khách', 'Bấm nghe -> Phát MP3 HTTP 206, highlight văn bản đồng bộ', 'Đã xác minh (useNearbyAudio.ts:1-180, AudioController.java:45-80)'],
  ['FR-03', 'Thuyết minh GPS tự động', 'Tự động kích hoạt âm thanh khi vào bán kính Geofence (35-60m), chống phát lặp và áp dụng cửa sổ bảo vệ 5 giây', 'Du khách / GPS', 'Bước vào Geofence -> Tự động phát âm thanh, ghi nhận autoPlayedSet', 'Đã xác minh (useAutoNarration.ts:97-140, GeoUtils.java:49-60)'],
  ['FR-04', 'Quét mã QR di sản', 'Quét camera hoặc nhập token giải mã thông tin di sản tức thì tại điểm dừng có sóng GPS yếu', 'Du khách', 'Quét mã QR -> Điều hướng /qr/{token}, nạp POI và phát audio ngay', 'Đã xác minh (ScanPage.tsx:30-90, LocationController.java:45-51)'],
  ['FR-05', 'Chế độ giả lập tọa độ', 'Cho phép chọn điểm dừng mẫu hoặc nhập kinh/vĩ độ để kiểm thử kích hoạt Geofence trực tiếp trên trình duyệt', 'Du khách / Dev', 'Chọn điểm dừng mẫu -> Đặt vị trí ảo, kích hoạt Geofence như thực địa', 'Đã xác minh (ToolbarControls.tsx:1-150, NearbyPage.tsx:240-280)'],
  ['FR-06', 'Duyệt quà lưu niệm & Tin tức', 'Xem danh mục sản phẩm lưu niệm gắn với POI, xem chi tiết và đọc các bài viết văn hóa lịch sử', 'Du khách', 'Chọn danh mục -> Hiển thị danh sách sản phẩm, giá bán, ảnh minh họa', 'Đã xác minh (FoodBeveragePage.tsx:1-200, NewsListPage.tsx:1-150)'],
  ['FR-07', 'Xác thực & Quản lý phiên', 'Đăng ký, đăng nhập tài khoản cục bộ, Google OAuth2, cấp phát Access Token bộ nhớ và Refresh Token HttpOnly', 'Du khách / Admin', 'Đăng nhập đúng -> Cấp JWT 15m trong RAM, Cookie Refresh Token 7d', 'Đã xác minh (AuthController.java:30-110, tokenStore.ts:1-21)'],
  ['FR-08', 'Đăng nhập mã QR', 'Cho phép quét mã QR trên điện thoại để đăng nhập tài khoản trên thiết bị khác', 'Người dùng', 'Quét mã QR đăng nhập -> Phiên làm việc được đồng bộ an toàn', 'Đã xác minh (QrLoginController.java:1-120, QrLoginScanPage.tsx:1-90)'],
  ['FR-09', 'Giỏ hàng quà lưu niệm', 'Thêm sản phẩm lưu niệm vào giỏ, cập nhật số lượng, lưu trữ cục bộ tại LocalStorage của trình duyệt', 'Người dùng', 'Bấm Thêm vào giỏ -> Cập nhật giỏ hàng, tự động tính tổng tiền', 'Đã xác minh (CartContext.tsx:1-180, CartDialog.tsx:1-150)'],
  ['FR-10', 'Nâng cấp gói Premium', 'Mua gói dịch vụ Premium (500,000 VND/năm) mở khóa toàn bộ thuyết minh ngoại ngữ trên hệ thống', 'Người dùng', 'Thanh toán thành công -> Tài khoản chuyển sang hạng PREMIUM', 'Đã xác minh (PremiumPage.tsx:1-160, OrderService.java:154-215)'],
  ['FR-11', 'Thanh toán VNPAY & VietQR', 'Khởi tạo giao dịch thanh toán chuyển hướng sang VNPAY Sandbox hoặc xuất mã chuyển khoản ngân hàng NAPAS', 'Người dùng', 'Chọn VNPAY -> Nhận URL chuyển hướng sandbox kèm chữ ký SHA512', 'Đã xác minh (VnPayService.java:40-110, VietQrPage.tsx:1-120)'],
  ['FR-12', 'Quản lý điểm tham quan (CMS)', 'Quản trị viên thêm mới, cập nhật tọa độ, bán kính Geofence, ảnh và nội dung thuyết minh điểm di sản', 'Quản trị viên', 'Lưu POI -> Ghi CSDL content_db, phát sự kiện vào RabbitMQ', 'Đã xác minh (PoiController.java:74-122, PoiFormPage.tsx:1-250)'],
  ['FR-13', 'Pipeline Dịch & TTS tự động', 'Tự động dịch nội dung POI sang 3 ngoại ngữ và gọi Edge-TTS sinh file MP3 lưu tại volume cục bộ', 'Hệ thống', 'Nhận sự kiện poi.created -> Dịch, sinh MP3, gửi poi.audio.ready', 'Đã xác minh (PoiPipelineServiceImpl.java:39-140, RabbitMQConfig.java)'],
  ['FR-14', 'Thu thập thống kê sự kiện', 'Ghi nhận bất đồng bộ sự kiện SCAN và AUDIO_PLAY qua RabbitMQ, tổng hợp báo cáo lượt nghe cho quản trị', 'Hệ thống / Admin', 'Phát audio -> Gửi sự kiện, lưu analytics_db, tổng hợp tỷ lệ nghe', 'Đã xác minh (AnalyticsEventController.java, AdminQrStatsController.java)']
];
const frWidths = [1200, 2200, 3200, 1400, 2400, 2400];
doc += table(frHeaders, frRows, frWidths, 'Bảng 3.1: Danh mục Yêu cầu chức năng (FR) của hệ thống Echora');

doc += h2('3.7. Danh mục Yêu cầu phi chức năng (Non-Functional Requirements - NFR)');
doc += p('Bảng 3.2 tổng hợp 10 yêu cầu phi chức năng cốt lõi kèm ngưỡng đo lường và bằng chứng xác minh:');

const nfrHeaders = ['Mã NFR', 'Tiêu chuẩn chất lượng', 'Chỉ số đo lường & Ràng buộc kỹ thuật', 'Vị trí hiện thực trong mã nguồn', 'Trạng thái xác minh'];
const nfrRows = [
  ['NFR-01', 'An ninh cổng kết nối', 'Chặn 100% yêu cầu chứa ký tự duyệt thư mục (..), mã hóa URL bất thường hoặc tham số ma trận (;)', 'PathGuardFilter.java:35-80', 'Đã xác minh (Pass toàn bộ bộ test PathGuard)'],
  ['NFR-02', 'Chống giả mạo định danh', 'Loại bỏ hoàn toàn các header nhạy cảm do client tự ý gắn (X-User-Id, X-User-Role, X-User-Plan)', 'UntrustedHeaderStripGlobalFilter.java:1-50', 'Đã xác minh (Được lọc tại tầng Gateway đầu tiên)'],
  ['NFR-03', 'Giới hạn tần suất (Rate Limit)', 'Giới hạn tối đa 60 yêu cầu/phút trên mỗi IP đối với endpoint tiếp nhận sự kiện phân tích (/api/analytics/events)', 'AnalyticsRateLimitGlobalFilter.java:30-81', 'Đã xác minh (Trả về HTTP 429 khi vượt ngưỡng)'],
  ['NFR-04', 'Cô lập cơ sở dữ liệu', 'Phân tách 5 CSDL vật lý với 5 tài khoản đăng nhập riêng biệt, không có quyền truy cập chéo', 'docker/init-databases.sql:1-120', 'Đã xác minh (5 databases, 5 logins độc lập)'],
  ['NFR-05', 'Độ bền hàng đợi AMQP', 'Cấu hình hàng đợi Durable, thông điệp Persistent, hỗ trợ Dead-Letter Queue (DLQ) khi retry quá 3 lần', 'application.yml:30-46, RabbitMQConfig.java', 'Đã xác minh (Xử lý lỗi bất đồng bộ bền vững)'],
  ['NFR-06', 'Toàn vẹn dữ liệu đồng thời', 'Phát hiện xung đột ghi đè dữ liệu điểm di sản bằng khóa lạc quan thông qua trường @Version', 'Poi.java, PoiController.java (trả về HTTP 409)', 'Đã xác minh (Ném OptimisticLockException khi trùng)'],
  ['NFR-07', 'Hiệu năng truyền phát âm thanh', 'Thời gian bắt đầu phát âm thanh dưới 1.5 giây thông qua cơ chế phân đoạn HTTP 206 Range Stream', 'AudioController.java:45-80', 'Đã xác minh (Nạp tức thì vài KB đầu tiên)'],
  ['NFR-08', 'Tự động kiểm tra sức khỏe', 'Chu kỳ kiểm tra sức khỏe container định kỳ 15 giây cho microservices và 10 giây cho hạ tầng', 'docker-compose.yml (healthcheck blocks)', 'Đã xác minh (Toàn bộ container có trạng thái healthy)'],
  ['NFR-09', 'Tương thích di động', 'Giao diện tương thích chuẩn Mobile Web (390x844), hỗ trợ đầy đủ Safari iOS và Chrome Android', 'frontend/src/styles/', 'Đã xác minh (Responsive CSS và Web Speech fallback)'],
  ['NFR-10', 'Bảo vệ chống Brute-Force', 'Khóa tài khoản 15 phút nếu nhập sai mật khẩu 5 lần; giới hạn tối đa 20 lần thử sai từ một IP trong 15 phút', 'backend/auth-service/application.yml:58-64', 'Đã xác minh (LoginAttemptService kiểm soát)']
];
const nfrWidths = [1200, 2200, 3400, 3000, 2000];
doc += table(nfrHeaders, nfrRows, nfrWidths, 'Bảng 3.2: Danh mục Yêu cầu phi chức năng (NFR) của hệ thống Echora');

doc += h2('3.8. Yêu cầu dữ liệu và Quy tắc nghiệp vụ (Business Rules - BR)');
doc += p('Hệ thống vận hành dựa trên 8 quy tắc nghiệp vụ bất biến được mã hóa trực tiếp trong logic phần mềm:');
doc += numbered(1, '**BR-01 (Khoảng cách kích hoạt Geofence)**: Bán kính kích hoạt thuyết minh tự động được cấu hình riêng cho từng điểm di tích, dao động từ 35 mét đến 60 mét tùy thuộc vào quy mô công trình (ví dụ: Chùa Bà Thiên Hậu 35m, Bưu điện Trung tâm 40m, Dinh Độc Lập 50m, Nhà thờ Đức Bà 60m). Khoảng cách được tính bằng công thức Haversine với $R = 6,371,000$ m (minh chứng: `R__seed_demo.sql:79-155`, `GeoUtils.java:49-60`).');
doc += numbered(2, '**BR-02 (Chống phát lặp âm thanh & Cửa sổ bảo vệ)**: Mỗi bài thuyết minh chỉ được tự động kích hoạt một lần duy nhất qua GPS trong suốt phiên tham quan thông qua tập hợp `autoPlayedSetRef`. Khi du khách chủ động bấm dừng nghe thủ công (Manual Stop), hệ thống thiết lập cửa sổ bảo vệ 5 giây (`guard window = 5000ms`), bộ định vị GPS tuyệt đối không tự ý bật lại bài đọc đó trong 5 giây này dù du khách vẫn đang đứng trong vùng Geofence (minh chứng: `useAutoNarration.ts:83-135`).');
doc += numbered(3, '**BR-03 (Bản quyền âm thanh ngoại ngữ Premium Entitlement)**: Bài thuyết minh tiếng Việt (`vi`) được miễn phí toàn bộ cho mọi du khách. Các bài thuyết minh ngoại ngữ (`en`, `ja`, `ko`) yêu cầu tài khoản phải có trạng thái gói `PREMIUM` (`X-User-Plan: PREMIUM`). Người dùng thuộc gói `FREE` yêu cầu tải tệp âm thanh ngoại ngữ sẽ bị bộ lọc `AudioEntitlementFilter` từ chối với mã lỗi HTTP 403 Forbidden (minh chứng: `AudioEntitlementFilter.java:71-77`).');
doc += numbered(4, '**BR-04 (Bảo vệ đăng nhập chống Brute-Force)**: Khóa tài khoản 15 phút nếu nhập sai mật khẩu 5 lần liên tiếp. Giới hạn tối đa 20 lần thử đăng nhập sai từ cùng một địa chỉ IP trong khung thời gian 15 phút (minh chứng: `auth-service/application.yml:59-62`).');
doc += numbered(5, '**BR-05 (Chính sách phí vận chuyển quà lưu niệm)**: Phí vận chuyển mặc định cho đơn hàng quà lưu niệm là 20,000 VND. Toàn bộ đơn hàng có giá trị tạm tính từ 50,000 VND trở lên được miễn phí vận chuyển hoàn toàn (`free-shipping-threshold = 50000`) (minh chứng: `order-service/application.yml:40-41`, `OrderService.java:122`).');
doc += numbered(6, '**BR-06 (Thời hạn đơn hàng & Tính độc bản Idempotency)**: Thời gian chờ thanh toán cho đơn hàng trực tuyến là 15 phút (`PAYMENT_EXPIRE_MINUTES = 15`), quá thời gian này đơn tự động chuyển sang trạng thái hết hạn (`EXPIRED`). Khi gửi yêu cầu tạo đơn kèm header `Idempotency-Key`, hệ thống trả về ngay đơn hàng cũ nếu trùng khóa mà không tạo thêm bản ghi mới trong cơ sở dữ liệu (minh chứng: `OrderService.java:78-84, 130`).');
doc += numbered(7, '**BR-07 (Bảo toàn nội dung biên soạn thủ công - Manual Priority)**: Trong quy trình dịch thuật tự động, nếu quản trị viên đã trực tiếp viết nội dung cho một ngôn ngữ cụ thể (được đánh dấu nguồn `translation_source = "MANUAL"`), hệ thống ưu tiên giữ nguyên văn bản của người viết và tuyệt đối không cho phép máy dịch ghi đè lên (minh chứng: `PoiPipelineServiceImpl.java:63-104`, `V5__add_poi_slug_and_translation_source.sql:1-15`).');
doc += numbered(8, '**BR-08 (Đồng bộ danh mục điểm đến một lần - Single-Shot POI Retrieval)**: Danh mục toàn bộ điểm di tích kèm nội dung đa ngữ được tải một lần duy nhất qua endpoint `/api/content/pois/guide` ngay khi mở trang bản đồ và lưu trong bộ nhớ React state. Nếu máy chủ mất kết nối, hệ thống tự động rơi về nạp tệp cấu hình tĩnh `nearbyPois.json` dự phòng sẵn trong mã nguồn frontend (minh chứng: `NearbyPage.tsx:194-226`).');

doc += h2('3.9. Yêu cầu giao diện và Tương tác bên ngoài');
doc += p('Hệ thống thiết lập các yêu cầu chuẩn hóa về giao diện người dùng và giao tiếp ngoại vi:');
doc += bullet('**Giao diện người dùng (User Interface)**: Thiết kế chuẩn Responsive tương thích trên mọi kích thước màn hình từ di động (390px) đến máy tính bảng (768px) và màn hình máy tính bàn (1200px+). Tích hợp phông chữ hiện đại, biểu tượng trực quan từ thư viện `lucide-react`, thanh điều khiển audio nổi dưới đáy màn hình di động.');
doc += bullet('**Giao tiếp dịch vụ ngoại vi**: Tích hợp với dịch vụ bản đồ OpenStreetMap qua giao thức HTTPS; tích hợp xác thực danh tính Google qua thư viện `@react-oauth/google` và ID Token verification; kết nối cổng thanh toán VNPAY Sandbox qua chữ ký số HMAC-SHA512; kết nối MyMemory Translation API qua định dạng JSON.');

doc += h2('3.10. Giả định, Ràng buộc và Phụ thuộc');
doc += bullet('**Giả định (Assumptions)**: Du khách sử dụng thiết bị di động có tích hợp chip định vị GPS và camera hỗ trợ quét mã QR; thiết bị có kết nối mạng Internet (3G/4G/5G hoặc Wi-Fi công cộng).');
doc += bullet('**Ràng buộc kỹ thuật (Constraints)**: Trình duyệt di động bắt buộc phải chạy dưới giao thức bảo mật `https://` (hoặc `localhost` trong môi trường phát triển) thì mới được phép truy cập Geolocation API; tệp âm thanh tải lên không vượt quá 2MB; dung lượng bộ nhớ cấp phát cho mỗi container backend là 256MB RAM (`-Xms128m -Xmx256m`).');
doc += bullet('**Phụ thuộc (Dependencies)**: Phụ thuộc vào tính sẵn sàng của dịch vụ bản đồ nền OpenStreetMap; phụ thuộc vào dịch vụ cổng thanh toán VNPAY Sandbox; phụ thuộc vào API dịch thuật MyMemory.');

doc += h2('3.11. Sơ đồ Ca sử dụng (Use Case Diagram)');
doc += p('Sơ đồ Ca sử dụng tổng thể của hệ thống Echora được xây dựng theo chuẩn UML 2.5, khắc phục triệt để các sai lầm thường gặp trong mô hình hóa Use Case, được trình bày tại Hình 3.1:');

// Embed Figure 3.1 (Use Case Diagram)
doc += figure('rId5', 'Hình 3.1. Sơ đồ Ca sử dụng tổng thể hệ thống Echora (UML 2.5)', 5600000, 3920000, 101);

doc += p('**Phân tích quan hệ mô hình hóa trong Sơ đồ Use Case Hình 3.1**:');
doc += bullet('**Quan hệ kế thừa (Generalization)** giữa *Người dùng đăng ký* và *Khách vãng lai*: Người dùng đã đăng ký kế thừa toàn bộ các ca sử dụng của Khách vãng lai (xem bản đồ, nghe thuyết minh, quét QR), đồng thời mở rộng thêm các ca sử dụng cá nhân hóa (đặt hàng, nâng cấp Premium, quản lý lịch sử).');
doc += bullet('**Quan hệ `<<include>>`**:');
doc += bullet('• UC03 (Nhận thuyết minh GPS tự động) và UC04 (Quét mã QR di sản) bắt buộc phải `<<include>>` UC02 (Nghe thuyết minh đa ngữ) vì mục đích cuối cùng của việc định vị hay quét mã là khởi động luồng truyền phát âm thanh.', 2);
doc += bullet('• UC07 (Nâng cấp gói Premium) và UC08 (Đặt hàng quà lưu niệm) bắt buộc phải `<<include>>` UC09 (Thanh toán VNPAY / VietQR) để hoàn tất quy trình giao dịch tài chính.', 2);
doc += bullet('• UC03 và UC04 bắt buộc phải `<<include>>` UC18 (Thu thập sự kiện du lịch) để hệ thống ghi nhận thống kê lượt nghe một cách tự động.', 2);
doc += bullet('**Ranh giới hệ thống (System Boundary)**: Toàn bộ 18 ca sử dụng nghiệp vụ được đóng gói gọn trong ranh giới hệ thống Echora; các tác nhân con người (Khách vãng lai, Người dùng đăng ký, Quản trị viên) và tác nhân hệ thống/ngoại vi (Thiết bị GPS, MyMemory/Edge-TTS, Cổng VNPAY, RabbitMQ Broker) nằm hoàn toàn bên ngoài ranh giới.');

doc += h2('3.12. Focused Use Case Specifications (Đặc tả Ca sử dụng Trọng tâm)');
doc += p('Dưới đây là đặc tả chi tiết 7 Ca sử dụng cốt lõi của hệ thống, tuân thủ cấu trúc chuẩn học thuật kỹ nghệ phần mềm:');

// --- UC01 ---
doc += h3('3.12.1. Đặc tả Ca sử dụng UC01: Khám phá bản đồ di tích');
doc += bullet('**Mã ca sử dụng**: UC-01 | **Tên ca sử dụng**: Khám phá bản đồ di tích');
doc += bullet('**Tác nhân chính**: Khách vãng lai, Người dùng đã đăng ký | **Tác nhân hỗ trợ**: Thiết bị GPS, OpenStreetMap');
doc += bullet('**Mục tiêu**: Cho phép du khách theo dõi trực quan vị trí bản thân và các điểm di sản trung tâm TP.HCM.');
doc += bullet('**Điều kiện tiên quyết**: Thiết bị có kết nối mạng và trình duyệt hỗ trợ HTML5 Geolocation.');
doc += bullet('**Sự kiện kích hoạt**: Du khách truy cập vào trang Bản đồ (`/diem-du-lich`).');
doc += bullet('**Luồng sự kiện chính (Main Flow)**:');
doc += numbered(1, 'Hệ thống gửi yêu cầu lấy danh mục điểm đến qua API `/api/content/pois/guide`.');
doc += numbered(2, 'Hệ thống khởi tạo bản đồ Leaflet, hiển thị 7 điểm di tích kèm biểu tượng trạng thái và vòng tròn Geofence.');
doc += numbered(3, 'Trình duyệt yêu cầu du khách cấp quyền định vị GPS.');
doc += numbered(4, 'Du khách chấp thuận; hệ thống định vị tọa độ và hiển thị chấm tròn xanh đại diện vị trí du khách.');
doc += numbered(5, 'Khi du khách di chuyển, vị trí trên bản đồ được cập nhật liên tục theo thời gian thực.');
doc += bullet('**Luồng thay thế (Alternative Flow)**:');
doc += bullet('• 1a. Máy chủ mất kết nối: Hệ thống tự động nạp tệp dữ liệu tĩnh `nearbyPois.json` dự phòng để du khách tiếp tục xem bản đồ.', 2);
doc += bullet('• 4a. Du khách từ chối quyền GPS: Hệ thống hiển thị thông báo hướng dẫn và chuyển sang chế độ xem bản đồ tĩnh.', 2);
doc += bullet('• 4b. Du khách bật chế độ Giả lập (Simulation Mode): Du khách chọn 1 trong các điểm dừng mẫu hoặc nhập kinh/vĩ độ tùy ý để kiểm thử.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Du khách quan sát được toàn cảnh bản đồ di sản và vị trí không gian của mình.');

// --- UC02 ---
doc += h3('3.12.2. Đặc tả Ca sử dụng UC02: Nghe thuyết minh đa ngữ');
doc += bullet('**Mã ca sử dụng**: UC-02 | **Tên ca sử dụng**: Nghe thuyết minh đa ngữ');
doc += bullet('**Tác nhân chính**: Khách vãng lai, Người dùng đã đăng ký | **Tác nhân hỗ trợ**: Translation/TTS Service');
doc += bullet('**Mục tiêu**: Cung cấp nội dung âm thanh và văn bản thuyết minh di tích theo ngôn ngữ du khách lựa chọn.');
doc += bullet('**Điều kiện tiên quyết**: Du khách đã chọn một điểm di tích trên bản đồ hoặc danh sách.');
doc += bullet('**Sự kiện kích hoạt**: Du khách nhấn nút "Nghe thuyết minh" trên thẻ thông tin điểm đến.');
doc += bullet('**Luồng sự kiện chính (Main Flow)**:');
doc += numbered(1, 'Hệ thống xác định ngôn ngữ hiện tại (`vi`, `en`, `ja`, `ko`) và mã định danh của POI.');
doc += numbered(2, 'Hệ thống gửi yêu cầu tải luồng âm thanh phân đoạn tới `/api/tts/audio/{filename}` qua HTTP 206.');
doc += numbered(3, 'Thanh phát âm thanh mở ra ở đáy màn hình, bắt đầu phát giọng đọc AI chất lượng cao.');
doc += numbered(4, 'Khung phụ đề văn bản cuộn tự động và đánh dấu câu văn bản tương ứng với mốc thời gian âm thanh.');
doc += numbered(5, 'Du khách có thể thao tác tạm dừng, tiếp tục, tua tiến/lùi 10 giây hoặc chọn nghe bản tóm tắt/chi tiết.');
doc += bullet('**Luồng thay thế / Ngoại lệ (Alternative / Exception Flow)**:');
doc += bullet('• 2a. Du khách chọn ngoại ngữ (`en`, `ja`, `ko`) nhưng tài khoản chưa có gói Premium: Bộ lọc `AudioEntitlementFilter` trả về HTTP 403 Forbidden. Hệ thống hiển thị hộp thoại thông báo khóa bản quyền và điều hướng du khách tới trang `/nang-cap`.', 2);
doc += bullet('• 2b. Tệp âm thanh máy chủ chưa sẵn sàng hoặc mất mạng: Hệ thống tự động kích hoạt Web Speech API của trình duyệt để đọc to văn bản thuyết minh dự phòng.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Bài thuyết minh được phát trọn vẹn, sự kiện nghe được ghi nhận.');

// --- UC03 ---
doc += h3('3.12.3. Đặc tả Ca sử dụng UC03: Nhận thuyết minh GPS tự động');
doc += bullet('**Mã ca sử dụng**: UC-03 | **Tên ca sử dụng**: Nhận thuyết minh GPS tự động');
doc += bullet('**Tác nhân chính**: Khách vãng lai, Người dùng | **Tác nhân hỗ trợ**: Thiết bị GPS, Hook useAutoNarration');
doc += bullet('**Mục tiêu**: Tự động phát âm thanh giới thiệu khi du khách đi bộ vào phạm vi vùng Geofence của di tích.');
doc += bullet('**Điều kiện tiên quyết**: Du khách đang ở trang bản đồ và đã bật công tắc "Thuyết minh tự động".');
doc += bullet('**Sự kiện kích hoạt**: Tọa độ GPS thiết bị gửi tín hiệu cập nhật mới.');
doc += bullet('**Luồng sự kiện chính (Main Flow)**:');
doc += numbered(1, 'Hook `useAutoNarration` nhận tọa độ (lat, lng) mới từ `watchPosition`.');
doc += numbered(2, 'Hệ thống áp dụng công thức Haversine tính khoảng cách $d$ tới tất cả 7 điểm di tích.');
doc += numbered(3, 'Phát hiện du khách có khoảng cách $d \\le r$ (trong đó $r$ là bán kính Geofence của điểm đến, từ 35m đến 60m).');
doc += numbered(4, 'Hệ thống kiểm tra `autoPlayedSetRef`: điểm di sản chưa từng được tự động phát trong phiên tham quan hiện tại.');
doc += numbered(5, 'Hệ thống ghi nhận mã POI vào `autoPlayedSetRef` để chống phát lặp.');
doc += numbered(6, 'Hệ thống kích hoạt ca sử dụng UC02 để phát bài thuyết minh tương ứng.');
doc += numbered(7, 'Hệ thống kích hoạt ca sử dụng UC18 phát sự kiện `AUDIO_PLAY` với `triggerType = "GPS"` vào RabbitMQ.');
doc += bullet('**Luồng thay thế (Alternative Flow)**:');
doc += bullet('• 4a. Điểm đến đã có trong `autoPlayedSetRef`: Hệ thống bỏ qua, không phát lặp lại âm thanh.', 2);
doc += bullet('• 4b. Du khách vừa bấm dừng nghe thủ công (Manual Stop): Hệ thống kích hoạt cửa sổ bảo vệ 5 giây (`guard window`), tuyệt đối không tự ý phát lại bài đọc dù du khách vẫn đang đứng trong vùng Geofence.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Du khách được nghe thuyết minh tự động mà không cần chạm tay vào màn hình.');

// --- UC04 ---
doc += h3('3.12.4. Đặc tả Ca sử dụng UC04: Quét mã QR di sản');
doc += bullet('**Mã ca sử dụng**: UC-04 | **Tên ca sử dụng**: Quét mã QR di sản');
doc += bullet('**Tác nhân chính**: Khách vãng lai, Người dùng | **Tác nhân hỗ trợ**: Camera thiết bị, Location Service');
doc += bullet('**Mục tiêu**: Kích hoạt nhanh thông tin di sản tại các khu vực mất sóng GPS hoặc thiết bị không có GPS.');
doc += bullet('**Điều kiện tiên quyết**: Du khách đứng trước biển chỉ dẫn có in mã QR tại điểm di tích.');
doc += bullet('**Sự kiện kích hoạt**: Du khách truy cập trang Quét mã (`/quet-ma`) và hướng camera vào mã QR.');
doc += bullet('**Luồng sự kiện chính (Main Flow)**:');
doc += numbered(1, 'Trình quét `qr-scanner` giải mã chuỗi URL hoặc token từ mã QR (ví dụ `qr-dinh-doc-lap-01`).');
doc += numbered(2, 'Hệ thống điều hướng sang trang kết quả quét `/qr/{token}`.');
doc += numbered(3, 'Frontend gọi API `/api/location/resolve-qr?token={token}` để tra cứu thông tin POI tương ứng.');
doc += numbered(4, 'Dịch vụ trả về dữ liệu POI; hệ thống nạp thông tin điểm đến và tự động mở trình phát âm thanh UC02.');
doc += numbered(5, 'Hệ thống kích hoạt UC18 gửi sự kiện `SCAN` vào RabbitMQ để ghi nhận thống kê.');
doc += bullet('**Luồng ngoại lệ (Exception Flow)**:');
doc += bullet('• 1a. Camera không mở được do bị chặn quyền: Hệ thống hiển thị ô nhập mã token thủ công để du khách tự gõ mã in trên biển.', 2);
doc += bullet('• 3a. Token không hợp lệ hoặc không tồn tại: Hệ thống hiển thị thông báo lỗi "Mã QR không đúng định dạng di sản Echora" kèm nút quay về trang chủ.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Du khách tiếp cận được bài thuyết minh di tích tức thì.');

// --- UC06 ---
doc += h3('3.12.5. Đặc tả Ca sử dụng UC06: Đăng nhập & Xác thực phiên JWT');
doc += bullet('**Mã ca sử dụng**: UC-06 | **Tên ca sử dụng**: Đăng nhập & Xác thực phiên JWT');
doc += bullet('**Tác nhân chính**: Người dùng, Quản trị viên | **Tác nhân hỗ trợ**: Auth Service, Google Identity');
doc += bullet('**Mục tiêu**: Cấp quyền truy cập an toàn cho người dùng và quản trị viên, bảo vệ chống rò rỉ phiên.');
doc += bullet('**Điều kiện tiên quyết**: Người dùng đã có tài khoản trên hệ thống hoặc sở hữu tài khoản Google.');
doc += bullet('**Sự kiện kích hoạt**: Người dùng bấm "Đăng nhập" trên thanh điều hướng hoặc hộp thoại xác thực.');
doc += bullet('**Luồng sự kiện chính (Main Flow - Đăng nhập truyền thống)**:');
doc += numbered(1, 'Người dùng điền email và mật khẩu, nhấn nút "Đăng nhập".');
doc += numbered(2, 'Frontend gửi `POST /api/auth/login` qua Gateway tới `auth-service`.');
doc += numbered(3, '`auth-service` kiểm tra số lần đăng nhập sai của IP và tài khoản: nếu chưa vượt ngưỡng, tiến hành đối soát mật khẩu với mã băm BCrypt trong CSDL `echora_auth_db`.');
doc += numbered(4, 'Mật khẩu chính xác: Hệ thống tạo cặp token: Access Token (TTL 15 phút) và Refresh Token (TTL 7 ngày).');
doc += numbered(5, '`auth-service` trả Access Token trong payload JSON và đính kèm Refresh Token trong HttpOnly Cookie có cờ `Secure` và `SameSite=Strict`.');
doc += numbered(6, 'Frontend lưu Access Token vào biến bộ nhớ RAM `tokenStore.ts` (không lưu vào LocalStorage); giao diện chuyển sang trạng thái đã đăng nhập.');
doc += bullet('**Luồng thay thế (Alternative Flow)**:');
doc += bullet('• 1a. Đăng nhập qua Google: Du khách chọn "Đăng nhập bằng Google", thư viện `@react-oauth/google` mở cửa sổ định danh, trả về Google ID Token. Frontend gửi ID Token tới `POST /api/auth/google`; `auth-service` xác thực chữ ký token với máy chủ Google, tự động tạo tài khoản mới nếu chưa tồn tại và phát hành cặp token Echora.', 2);
doc += bullet('• 3a. Nhập sai mật khẩu 5 lần liên tiếp: Hệ thống kích hoạt BR-04, tạm thời khóa đăng nhập tài khoản trong 15 phút và trả về thông báo lỗi chi tiết.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Phiên làm việc được thiết lập an toàn, người dùng truy cập được các chức năng nâng cao.');

// --- UC07 & UC09 ---
doc += h3('3.12.6. Đặc tả Ca sử dụng UC07/UC09: Nâng cấp gói Premium & Thanh toán VNPAY');
doc += bullet('**Mã ca sử dụng**: UC-07/09 | **Tên ca sử dụng**: Nâng cấp gói Premium & Thanh toán VNPAY');
doc += bullet('**Tác nhân chính**: Người dùng đã đăng ký | **Tác nhân hỗ trợ**: Order Service, Cổng VNPAY Sandbox');
doc += bullet('**Mục tiêu**: Mua gói thuê bao ngoại ngữ Premium giá 500,000 VND/năm và thanh toán trực tuyến bảo đảm.');
doc += bullet('**Điều kiện tiên quyết**: Du khách đã đăng nhập tài khoản.');
doc += bullet('**Sự kiện kích hoạt**: Du khách truy cập `/nang-cap` và nhấn nút "Nâng cấp Premium ngay".');
doc += bullet('**Luồng sự kiện chính (Main Flow)**:');
doc += numbered(1, 'Frontend gửi yêu cầu `POST /api/orders/premium` kèm Access Token tới `order-service`.');
doc += numbered(2, '`order-service` tạo đơn hàng loại `PREMIUM` với giá 500,000 VND, trạng thái `PENDING`, thời hạn 15 phút.');
doc += numbered(3, 'Dịch vụ gọi `VnPayService` tạo chuỗi URL thanh toán chứa mã TMN Code `SQYS1VK9`, số tiền nhân 100, mã tham chiếu đơn hàng và chữ ký số băm HMAC-SHA512.');
doc += numbered(4, 'Frontend nhận liên kết thanh toán và chuyển hướng du khách sang cổng VNPAY Sandbox.');
doc += numbered(5, 'Du khách nhập thông tin thẻ kiểm thử (Ngân hàng NCB, số thẻ 9704198526191432198, OTP 123456) và xác nhận.');
doc += numbered(6, 'VNPAY chuyển hướng du khách về URL callback `/api/orders/vnpay/return`.');
doc += numbered(7, '`order-service` xác thực chữ ký số phản hồi từ VNPAY; kiểm tra mã phản hồi `vnp_ResponseCode == "00"` (thành công).');
doc += numbered(8, '`order-service` đổi trạng thái đơn sang `PAID`, đồng thời gọi REST API nội bộ sang `auth-service` để cập nhật trường `plan = "PREMIUM"` và gia hạn `premium_expires_at` thêm 365 ngày.');
doc += numbered(9, 'Du khách được điều hướng về trang kết quả `/thanh-toan/ket-qua`, hiển thị thông báo nâng cấp thành công và mở khóa toàn bộ âm thanh ngoại ngữ.');
doc += bullet('**Luồng thay thế / Ngoại lệ (Alternative / Exception Flow)**:');
doc += bullet('• 5a. Du khách chọn phương thức chuyển khoản ngân hàng: Hệ thống hiển thị mã VietQR kèm số tài khoản, tên người thụ hưởng, số tiền 500,000 VND và nội dung chuyển khoản chuẩn hóa.', 2);
doc += bullet('• 7a. Chữ ký băm sai lệch hoặc du khách hủy giao dịch: Đơn hàng chuyển sang trạng thái thất bại, hệ thống hiển thị thông báo lỗi và nút thử lại.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Tài khoản được nâng hạng Premium, quyền nghe audio ngoại ngữ có hiệu lực ngay lập tức.');

// --- UC11 ---
doc += h3('3.12.7. Đặc tả Ca sử dụng UC11: Quản lý điểm tham quan (POI)');
doc += bullet('**Mã ca sử dụng**: UC-11 | **Tên ca sử dụng**: Quản lý điểm tham quan (POI)');
doc += bullet('**Tác nhân chính**: Quản trị viên (Admin) | **Tác nhân hỗ trợ**: Content Service, RabbitMQ Broker');
doc += bullet('**Mục tiêu**: Cho phép cán bộ quản lý di sản thêm mới, chỉnh sửa thông tin tọa độ, bán kính Geofence và bài thuyết minh.');
doc += bullet('**Điều kiện tiên quyết**: Quản trị viên đã đăng nhập tài khoản có quyền `ADMIN`.');
doc += bullet('**Sự kiện kích hoạt**: Quản trị viên truy cập bảng điều khiển `/quan-tri/diem-thuyet-minh` và nhấn "Thêm mới" hoặc "Chỉnh sửa".');
doc += bullet('**Luồng sự kiện chính (Main Flow)**:');
doc += numbered(1, 'Hệ thống hiển thị biểu mẫu quản lý POI gồm các trường: Mã điểm đến, Tên di tích, Khu vực trực thuộc, Danh mục, Tọa độ kinh/vĩ độ, Bán kính kích hoạt (m), Ảnh đại diện, và Nội dung thuyết minh tiếng Việt.');
doc += numbered(2, 'Quản trị viên điền dữ liệu và nhấn nút "Lưu thay đổi".');
doc += numbered(3, 'Frontend gửi `PUT /api/admin/pois/{id}` kèm mã số phiên bản dữ liệu `version` hiện tại.');
doc += numbered(4, '`content-service` kiểm tra khóa lạc quan: số phiên bản gửi lên trùng khớp với số phiên bản trong CSDL `echora_content_db`.');
doc += numbered(5, 'Hệ thống cập nhật thông tin điểm đến, tăng phiên bản lên 1 đơn vị, và ghi nhận trạng thái bản dịch tiếng Việt.');
doc += numbered(6, '`PoiEventPublisher` đóng gói sự kiện `PoiUpdatedEvent` và xuất bản vào Topic Exchange `echora.topic` của RabbitMQ.');
doc += numbered(7, 'Hệ thống hiển thị thông báo thành công; hàng đợi RabbitMQ tiếp nhận thông điệp để kích hoạt pipeline dịch thuật tự động (UC17).');
doc += bullet('**Luồng ngoại lệ (Exception Flow)**:');
doc += bullet('• 4a. Xung đột phiên bản dữ liệu (Optimistic Locking): Nếu một quản trị viên khác đã sửa và lưu bản ghi này trước đó, số phiên bản không khớp. `content-service` trả về mã lỗi HTTP 409 Conflict. Hệ thống hiển thị hộp thoại cảnh báo xung đột và hướng dẫn người dùng nạp lại dữ liệu mới nhất trước khi chỉnh sửa tiếp.', 2);
doc += bullet('**Điều kiện sau thực hiện**: Thông tin di sản được lưu an toàn, tiến trình dịch thuật tự động được kích hoạt ngầm.');

doc += h2('3.13. Tiêu chí chấp nhận và Xác nhận yêu cầu');
doc += p('Mỗi yêu cầu phần mềm của Echora đều được kiểm chứng thông qua các tiêu chí nghiệm thu định lượng (Acceptance Criteria - AC) được chuẩn hóa theo mẫu *Given - When - Then*:');
doc += bullet('**AC-01 (Kích hoạt Geofence)**: *Given* du khách đang mở bản đồ di sản và đã bật chế độ thuyết minh tự động; *When* tọa độ GPS của du khách di chuyển vào khoảng cách $\\le 50$m đối với Dinh Độc Lập; *Then* bài thuyết minh tiếng Việt tự động phát với độ trễ dưới 1.5 giây, mã POI được thêm vào `autoPlayedSetRef`, và không tự động phát lặp lại trong suốt phiên tham quan.');
doc += bullet('**AC-02 (Cửa sổ bảo vệ dừng thủ công)**: *Given* bài thuyết minh đang tự động phát trong vùng Geofence; *When* du khách chủ động bấm nút Tạm dừng (Pause/Stop); *Then* âm thanh dừng ngay lập tức và hệ thống thiết lập cửa sổ bảo vệ 5 giây; bộ định vị GPS không tự động bật lại bài đọc trong 5 giây này.');
doc += bullet('**AC-03 (Bản quyền gói ngoại ngữ)**: *Given* tài khoản người dùng có trạng thái gói `FREE`; *When* người dùng yêu cầu tải tệp âm thanh tiếng Anh (`/api/tts/audio/poi_1_en_xxx.mp3`); *Then* hệ thống trả về HTTP 403 Forbidden kèm thông báo yêu cầu nâng cấp Premium.');
doc += bullet('**AC-04 (Xoay vòng Refresh Token)**: *Given* phiên làm việc của người dùng đang hoạt động; *When* máy khách gửi Refresh Token cũ để gia hạn Access Token; *Then* hệ thống cấp cặp token mới, đồng thời hủy hiệu lực Refresh Token cũ; nếu token cũ bị gửi lại lần thứ hai, toàn bộ phiên của tài khoản bị thu hồi ngay lập tức.');
doc += bullet('**AC-05 (Miễn phí vận chuyển đơn hàng)**: *Given* giỏ hàng quà lưu niệm của du khách; *When* tổng giá trị tạm tính của các sản phẩm $\\ge 50,000$ VND; *Then* phí vận chuyển tự động tính bằng 0 VND; nếu dưới 50,000 VND thì áp dụng phí cố định 20,000 VND.');

doc += h2('3.14. Ma trận truy vết yêu cầu (Requirements Traceability Matrix - RTM)');
doc += p('Bảng 3.3 thiết lập ma trận truy vết hai chiều liên kết chặt chẽ giữa Mục tiêu sản phẩm, Yêu cầu chức năng/phi chức năng, Ca sử dụng, Thành phần thiết kế/mã nguồn và Ca kiểm thử tự động tương ứng:');

const rtmHeaders = ['Mục tiêu đề tài', 'Mã yêu cầu (FR/NFR)', 'Ca sử dụng (Use Case)', 'Thành phần mã nguồn hiện thực', 'Ca kiểm thử tự động (Test Cases)'];
const rtmRows = [
  ['Tự động hóa thuyết minh GPS', 'FR-01, FR-03, NFR-07', 'UC-01, UC-03', 'NearbyPage.tsx, useAutoNarration.ts, GeoUtils.java', 'nearbyPage.test.tsx, autoNarration.test.ts'],
  ['Dự phòng định vị qua mã QR', 'FR-04, NFR-09', 'UC-04', 'ScanPage.tsx, LocationController.java', 'scanPage.test.tsx, placeQr.test.tsx'],
  ['Thuyết minh âm thanh đa ngữ', 'FR-02, BR-03, NFR-07', 'UC-02', 'useNearbyAudio.ts, AudioController.java, EntitlementFilter', 'audioPlayer.test.ts, poiAudioStatusPanel.test.tsx'],
  ['Pipeline AI Dịch thuật & TTS', 'FR-13, BR-07, NFR-05', 'UC-17', 'PoiPipelineServiceImpl.java, RabbitMQConfig.java', 'PoiPipelineServiceTest.java, rabbitmq.test'],
  ['Thương mại điện tử & VNPAY', 'FR-06, FR-09, FR-10, FR-11, BR-05', 'UC-07, UC-08, UC-09', 'CartContext.tsx, OrderService.java, VnPayService.java', 'orderService.test.ts, premiumPage.test.tsx'],
  ['An ninh xác thực & Token Rotation', 'FR-07, NFR-01, NFR-02, NFR-10', 'UC-06', 'AuthController.java, RefreshTokenService.java, tokenStore.ts', 'auth.test.tsx, tokenStore.test.ts, pathGuard.test'],
  ['Quản trị CMS & Khóa lạc quan', 'FR-12, NFR-06', 'UC-11, UC-12, UC-13', 'PoiController.java, AdminRoutes.tsx, PoiFormPage.tsx', 'poiFormPage.test.tsx, zoneFormPage.test.tsx'],
  ['Phân tích thống kê sự kiện', 'FR-14, NFR-03', 'UC-18, UC-15', 'AnalyticsEventController.java, RateLimitGlobalFilter', 'analytics.test.tsx, rateLimit.test']
];
const rtmWidths = [2000, 1800, 1600, 3600, 3000];
doc += table(rtmHeaders, rtmRows, rtmWidths, 'Bảng 3.3: Ma trận truy vết yêu cầu phần mềm (Requirements Traceability Matrix)');

doc += h2('3.15. Rà soát chất lượng yêu cầu và Tổng kết chương');
doc += p('Tiến trình phân tích yêu cầu tại Chương 3 đã được rà soát đối chiếu toàn diện theo các tiêu chuẩn chất lượng kỹ nghệ phần mềm IEEE 830:');
doc += bullet('**Tính đầy đủ (Completeness)**: Toàn bộ 14 yêu cầu chức năng (FR), 10 yêu cầu phi chức năng (NFR), 8 quy tắc nghiệp vụ (BR) và 7 đặc tả Use Case trọng tâm đều được bao phủ trọn vẹn, không để sót các ranh giới xử lý quan trọng.');
doc += bullet('**Tính nhất quán (Consistency)**: Danh mục thuật ngữ, mã định danh yêu cầu, tên ca sử dụng và các thông số kỹ thuật (bán kính Geofence 35–60m, giá Premium 500,000 VND, phí vận chuyển 20,000 VND) hoàn toàn đồng nhất xuyên suốt từ PRD, Sơ đồ Use Case đến Ma trận truy vết.');
doc += bullet('**Tính kiểm chứng được (Verifiability)**: 100% các yêu cầu đều có tiêu chí nghiệm thu định lượng (Acceptance Criteria) và được liên kết trực tiếp với các ca kiểm thử tự động (Unit / Integration Tests) đã chạy thành công trong mã nguồn.');
doc += bullet('**Tính khả thi và truy vết được (Feasibility & Traceability)**: Toàn bộ các yêu cầu được đặc tả đều phản ánh trung thực mã nguồn hiện có của dự án Echora, được chứng thực qua bảng kiểm kê bằng chứng và sơ đồ kỹ thuật chuẩn mực.');

const outPath = path.join(rootDir, 'scratch', 'chapters_1_2_3.xml');
fs.writeFileSync(outPath, doc, 'utf8');
console.log(`Generated chapters 1, 2, 3 XML successfully! Size: ${doc.length} bytes. Written to: ${outPath}`);
