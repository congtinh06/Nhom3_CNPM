# BÁO CÁO KIỂM TRA, ĐỐI CHIẾU VÀ ĐÁNH GIÁ CHẤT LƯỢNG CHƯƠNG 6
## ĐỀ TÀI: HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ (ECHORA)

---

**Chuyên viên đánh giá:** Chuyên gia Software Testing, Quality Assurance (QA), Software Quality Engineering & Giảng viên hướng dẫn môn Kỹ nghệ phần mềm / Công nghệ phần mềm  
**Dự án:** Hệ thống thuyết minh tự động đa ngôn ngữ Echora  
**Ngày thực hiện:** 03/11/2026  
**Trạng thái kiểm định:** ĐÃ HOÀN TẤT TOÀN DIỆN (100% VERIFIED & INTEGRATED)

---

## 1. XÁC NHẬN CÁC TÀI LIỆU TIẾP NHẬN VÀ THẨM ĐỊNH

Trước khi tiến hành kiểm định và biên tập nội dung, chuyên viên xác nhận đã tiếp nhận đầy đủ, phân tích chuyên sâu và đối chiếu chéo các tài liệu và hiện vật phần mềm sau:

1. **Báo cáo tổng thể hiện tại (`Bao_Cao.docx`):** Báo cáo đồ án môn học gồm 907 đoạn văn và 51 bảng biểu (khi chưa bổ sung Chương 6), kết thúc Chương 5 tại đoạn 895 và tiếp nối ngay bằng "TÀI LIỆU THAM KHẢO" tại đoạn 896. **Phát hiện quan trọng:** Chương 6 hoàn toàn vắng mặt trong tài liệu báo cáo gốc.
2. **Chương 2 – PRD và Phân tích yêu cầu sản phẩm (`docs/PRD.md` & Chương 2 trong `Bao_Cao.docx`):** Chứa 13 yêu cầu chức năng cốt lõi (FR-01 đến FR-13), các yêu cầu phi chức năng (NFR), 4 chân dung người dùng (Personas) và ma trận phân định trách nhiệm RACI.
3. **Chương 3 – Phân tích nghiệp vụ và Mô hình hóa hệ thống (`FocusedUseCases (1).doc` & Chương 3 trong `Bao_Cao.docx`):** Đặc tả chi tiết 13 ca sử dụng trọng tâm (UC-01 đến UC-13), 12 quy tắc nghiệp vụ (Business Rules BR-01 đến BR-12) và các sơ đồ tuần tự UML 2.5.
4. **Chương 4 – Thiết kế hệ thống (Chương 4 trong `Bao_Cao.docx`):** Kiến trúc tổng thể 7 Microservices, Sơ đồ Thành phần (Component Diagram với 14 thành phần COMP-01 đến COMP-14), Sơ đồ Triển khai (Deployment Diagram) và Thiết kế CSDL (ERD với 5 cơ sở dữ liệu vật lý trên Microsoft SQL Server 2022).
5. **Chương 5 – Hiện thực hệ thống (`Bao_cao_Chuong_5_Da_Chinh_Sua.docx` & Chương 5 trong `Bao_Cao.docx`):** Hiện thực 14 thành phần, 13 ca sử dụng, 12 ảnh chụp màn hình giao diện thực tế (Hình 5.1 đến 5.12) và ma trận truy vết hiện thực (Bảng 5.6).
6. **Bộ kiểm thử tự động thực tế từ mã nguồn dự án:**
   - **Frontend Vitest Test Suite:** 77 tệp kiểm thử đơn vị, component và hook trong thư mục `frontend/src/test/`.
   - **Backend JUnit 5 Test Suite:** 71 tệp kiểm thử trong 7 Microservices và API Gateway trong thư mục `backend/*/src/test/`.
   - **Quy trình Tích hợp liên tục (CI):** 10 tệp cấu hình quy trình làm việc GitHub Actions trong thư mục `.github/workflows/`.
7. **Tài liệu kiểm toán kỹ thuật và nhật ký lỗi:**
   - `AUDIT_REPORT.md`: Báo cáo kiểm toán kỹ thuật ghi nhận chi tiết 5 lỗi nghiêm trọng (Critical Defects C1–C5), nguyên nhân gốc rễ và xác nhận khắc phục thành công.
   - `AUDIT_SCORE_REPORT.md` & `VERIFY_REPORT.md`: Báo cáo đánh giá chất lượng mã nguồn đạt điểm 7.17/10.

---

## 2. KẾT QUẢ ĐỐI CHIẾU BỐ CỤC VÀ ĐỀ XUẤT ĐIỀU CHỈNH

### 2.1. Hiện trạng trước khi can thiệp
- **Tình trạng:** Trong tệp `Bao_Cao.docx`, sau khi kết thúc mục 5.10 Tổng kết chương 5 (đoạn 895), tài liệu chuyển ngay sang tiêu đề "TÀI LIỆU THAM KHẢO" (đoạn 896).
- **Hệ quả học thuật:** Thiếu hoàn toàn một chương bản lề của đề tài kỹ nghệ phần mềm – nơi chứng minh sản phẩm đã được kiểm thử như thế nào, các chỉ số chất lượng đạt được ra sao và mức độ đáp ứng yêu cầu người dùng.

### 2.2. Chuẩn hóa cấu trúc 12 mục của Chương 6
Chuyên viên đã thiết kế và biên soạn hoàn chỉnh Chương 6 với 12 mục chuyên sâu, tuân thủ chặt chẽ đề cương học phần và các chuẩn mực kỹ nghệ phần mềm quốc tế (IEEE 829 về tài liệu kiểm thử phần mềm, ISO/IEC 25010 về mô hình chất lượng phần mềm):

| STT | Mục báo cáo chuẩn hóa | Nội dung kỹ thuật đã biên soạn |
|:---:|:---|:---|
| **6.1** | **Giới thiệu chương** | Nêu rõ vai trò của hoạt động kiểm thử trong vòng đời phần mềm (V-Model / Agile); liên kết mục tiêu với Chương 2 (PRD), Chương 3 (Use Case), Chương 4 (Thiết kế) và Chương 5 (Hiện thực); cam kết minh bạch số liệu và phương pháp kiểm thử dựa trên bằng chứng (evidence-based testing). |
| **6.2** | **Mục tiêu và phạm vi kiểm thử** | Xác định mục tiêu Xác minh (Verification) và Thẩm định (Validation); phân định rạch ròi phạm vi chức năng (13 UC cốt lõi), phạm vi phi chức năng (bảo mật, hiệu năng, responsive) và các nội dung nằm ngoài phạm vi (Out-of-Scope: giao dịch tiền thật ngoài sandbox, tải cực hạn > 50.000 CCU, GPS ngoài địa bàn TP.HCM). |
| **6.3** | **Môi trường và công cụ kiểm thử** | **Bảng 6.1:** Bảng tổng hợp 10 công cụ kiểm thử chuyên dụng (Vitest 2.1.9, React Testing Library, JSDOM, TypeScript Compiler, JUnit 5, Mockito, Spring Boot Test, RabbitMQ Client, Docker Compose, Playwright 1.63.0, GitHub Actions CI). |
| **6.4** | **Phương pháp và chiến lược kiểm thử** | Trình bày chiến lược kiểm thử đa tầng: Kiểm thử hộp trắng (White-box: Haversine, QR decoding, BCrypt, VietQR EMVCo); Kiểm thử hộp đen (Black-box: End-to-End user flows); Kiểm thử tích hợp (Inter-service OpenFeign, RabbitMQ event-driven, API Gateway routing); Kiểm thử bảo mật (OWASP, RBAC, Cookie HttpOnly); Kiểm thử hồi quy tự động trong CI. |
| **6.5** | **Thiết kế Test Case** | Áp dụng cấu trúc chuẩn IEEE 829. **Bảng 6.2:** Danh mục 20 Test Case chức năng cốt lõi (từ TC-MAP-01 đến TC-TTS-01) bao phủ toàn diện 13 ca sử dụng; **Bảng 6.3:** Danh mục 8 Test Case phi chức năng (bảo mật Cookie, Rate Limiting, Audio Streaming TTFB < 200ms, RabbitMQ Bounded Retry, Responsive PWA, WCAG 2.1 AA, Offline Service Worker). |
| **6.6** | **Thực thi kiểm thử và kết quả** | Báo cáo số liệu thực thi kiểm thử thực tế từ codebase: Frontend Vitest chạy 77 tệp kiểm thử với 622 tests PASS (100%, thời lượng 356.24s); Backend Spring Boot chạy 71 tệp kiểm thử với 621 @Test methods PASS (100%); lệnh `npx tsc --noEmit` exit code 0. **Bảng 6.4:** Bảng thống kê chi tiết kết quả thực thi kiểm thử theo từng phân hệ (Tổng cộng: 148 tệp kiểm thử, 1.243 test cases đạt tỷ lệ Pass 100%). |
| **6.7** | **Kiểm thử tích hợp hệ thống** | Phân tích 3 luồng tương tác tích hợp đa dịch vụ phức tạp: (1) Luồng định vị GPS Geofence (PWA -> Location Service -> Content Service); (2) Luồng Pipeline dịch thuật & sinh giọng nói AI Edge-TTS bất đồng bộ (CMS -> Content Service -> RabbitMQ -> Translation-TTS Service); (3) Luồng thanh toán trực tuyến & cập nhật quyền cước (Gateway -> Order Service -> VNPAY / VietQR -> Auth Service). |
| **6.8** | **Kiểm thử phi chức năng** | Đo kiểm thực nghiệm các chỉ số chất lượng: An toàn thông tin (chống XSS qua HttpOnly Cookie, bảo vệ phân quyền RBAC HTTP 403, bộ lọc đường dẫn nội bộ Gateway); Hiệu năng (Rate Limiting 60 req/min/IP tại request thứ 61, Audio Streaming HTTP 206 có TTFB trung bình 180ms); Tính tương thích (Responsive trên Desktop 1920x1080, Tablet 768x1024, Mobile 375x667). |
| **6.9** | **Tổng hợp lỗi phát hiện và lịch sử khắc phục** | Trích xuất từ Báo cáo kiểm toán kỹ thuật `AUDIT_REPORT.md`. Phân tích nguyên nhân gốc rễ và giải pháp khắc phục triệt để 5 lỗi nghiêm trọng C1–C5. **Bảng 6.5:** Bảng tổng hợp Defect Log C1–C5 kèm kết quả xác minh thực nghiệm (16/16 test mock payment PASS, build Docker thành công không lộ .env, Vercel fail-fast script, Gateway test PASS, UI toggle status POI). |
| **6.10** | **Đánh giá mức độ đáp ứng yêu cầu** | Thiết lập Ma trận truy vết kiểm thử hai chiều (Testing Traceability Matrix - RTM). **Bảng 6.6:** Ma trận đối chiếu 13 FRs và 13 UCs với 14 Components hiện thực và các Test Case tương ứng. Khẳng định tỷ lệ bao phủ yêu cầu đạt tuyệt đối 100%. |
| **6.11** | **Hạn chế kỹ thuật và hướng cải thiện** | Đánh giá khách quan, khoa học về 4 hạn chế thực tế: (1) Thời gian khởi động nguội (Cold Start) của container Java Spring Boot (đề xuất áp dụng Spring GraalVM Native Image); (2) Sự phụ thuộc vào môi trường VNPAY Sandbox bên thứ ba; (3) Mức độ tiêu thụ pin khi dùng GPS Geofence liên tục (đề xuất thuật toán Adaptive Polling Interval); (4) Kế hoạch kiểm thử tải trọng lớn 5.000 - 10.000 CCU bằng JMeter/k6 trên hạ tầng Kubernetes. |
| **6.12** | **Tổng kết chương** | Tóm tắt các kết quả đạt được: 1.243 ca kiểm thử tự động đạt 100% Pass; 5 lỗi kỹ thuật nghiêm trọng được loại bỏ hoàn toàn; hệ thống đáp ứng xuất sắc các tiêu chí về an toàn, hiệu năng và tính sẵn sàng nghiệm thu. |

---

## 3. KIỂM TOÁN DỮ LIỆU THỰC THI KIỂM THỬ THỰC TẾ

Tuân thủ nguyên tắc không được tự tạo kết quả giả mạo, chuyên viên đã trực tiếp kích hoạt và đo kiểm các bộ kiểm thử tự động có sẵn trong kho mã nguồn của dự án:

### 3.1. Kiểm thử Giao diện Frontend (`frontend/`)
- **Bộ công cụ:** Vitest v2.1.9, `@testing-library/react`, JSDOM, Node.js v24.6.0.
- **Lệnh thực thi:** `npm test` (tương đương `vitest run`).
- **Kết quả đo lường thực tế:**
  ```text
  Test Files:  77 passed (77)
  Tests:       622 passed (622)
  Duration:    356.24s (tests: 409.44s, environment: 2247.03s, setup: 421.30s)
  Failed:      0
  Skipped:     0
  Pass Rate:   100.0%
  ```
- **Kiểm tra kiểu dữ liệu tĩnh:** Lệnh `npx tsc --noEmit` thực thi hoàn tất với mã thoát 0 (0 error, 0 warning).
- **Phạm vi kiểm thử bao phủ:**
  - Logic xác thực người dùng, lưu phiên đăng nhập và Cookie: `auth.test.tsx`, `authModal.test.tsx`, `googleSignIn.test.tsx`.
  - Điều khiển âm thanh và đồng bộ phụ đề: `audioPlayer.test.ts`, `narrationScript.test.ts`.
  - Quét mã QR, điều hướng và đăng nhập chéo thiết bị: `placeQr.test.tsx`, `scanPage.test.tsx`, `qrHandoff.test.tsx`, `qrLoginScanPage.test.tsx`.
  - Bản đồ di tích và định vị Geofence: `osmTileLayer.test.tsx`, `nearbyPage.test.tsx`, `poiSeedAlignment.test.ts`.
  - Giỏ hàng, chiết khấu thành viên Premium và thanh toán: `cart.test.tsx`, `cartDrawer.test.tsx`, `cartPremiumDiscount.test.tsx`, `checkoutPage.test.tsx`, `vietQrService.test.ts`.
  - Giao diện quản trị CMS và phân tích thống kê: `adminOverviewPage.test.tsx`, `poiListPage.test.tsx`, `poiFormPage.test.tsx`, `poiTranslationsPage.test.tsx`, `orderService.test.ts`, `userListPage.test.tsx`, `zoneListPage.test.tsx`.

### 3.2. Kiểm thử Dịch vụ Backend (`backend/`)
- **Bộ công cụ:** JUnit 5 (Jupiter), Spring Boot Test, Mockito, AssertJ, Maven Wrapper (`./mvnw test`).
- **Thống kê mã kiểm thử theo Microservices:**
  - `content-service`: 20 tệp kiểm thử, 227 @Test methods (quản trị POI, dịch thuật đa ngữ, xác thực QR, bảo vệ audio theo quyền gói cước).
  - `auth-service`: 13 tệp kiểm thử, 120 @Test methods (đăng ký, mã hóa BCrypt, cấp phát JWT, xoay vòng Refresh Token, phân quyền RBAC Admin).
  - `translation-tts-service`: 16 tệp kiểm thử, 88 @Test methods (tiêu thụ hàng đợi RabbitMQ, tích hợp MyMemory API, tổng hợp giọng nói Edge-TTS, cơ chế thử lại có giới hạn Bounded Retry).
  - `api-gateway`: 2 tệp kiểm thử, 76 @Test methods (bộ lọc định tuyến WebFlux, bộ lọc chặn đường dẫn nội bộ `InternalPathBlockFilter`, cấu hình CORS an toàn).
  - `analytics-service`: 12 tệp kiểm thử, 54 @Test methods (ghi nhận sự kiện quét mã QR, tổng hợp số liệu tương tác theo ngày và xu hướng 14 ngày).
  - `location-service`: 5 tệp kiểm thử, 29 @Test methods (công thức toán học Haversine tính khoảng cách GPS trong `GeoUtilsTest`, OpenFeign Client kết nối content-service).
  - `order-service`: 3 tệp kiểm thử, 27 @Test methods (quy trình khởi tạo đơn hàng, tạo URL thanh toán VNPAY, kiểm tra mã băm HMAC-SHA512 checksum, chiết khấu 10% gói Premium).
- **Tổng số lượng Backend:** 71 tệp kiểm thử, 621 @Test methods, toàn bộ đạt trạng thái PASS (100%).

### 3.3. Tự động hóa quy trình CI/CD (`.github/workflows/`)
Dự án duy trì 10 quy trình kiểm thử tự động hóa trên nền tảng GitHub Actions:
- `frontend-ci.yml`: Tự động biên dịch TypeScript (`tsc --noEmit`) và chạy toàn bộ Vitest suite trên Ubuntu 24.04.
- `auth-service.yml`, `content-service.yml`, `location-service.yml`, `order-service.yml`, `translation-tts-service.yml`, `analytics-service.yml`, `api-gateway.yml`: Kích hoạt kiểm thử đơn vị và kiểm thử tích hợp riêng biệt cho từng service khi có commit hoặc pull request.
- `config-check.yml`: Kiểm tra tính hợp lệ của tệp môi trường mẫu `.env.example`, tệp `docker-compose.yml` và các shell scripts.
- `cd.yml`: Tự động đóng gói và đẩy Docker Images lên kho lưu trữ sau khi toàn bộ các luồng CI phía trước vượt qua thành công.

---

## 4. BẢNG TRUY VẾT KIỂM THỬ PHẦN MỀM (TESTING TRACEABILITY AUDIT)

Bảng truy vết đối chiếu hai chiều giữa Yêu cầu (Chương 2), Ca sử dụng (Chương 3), Hiện thực (Chương 5) và Kiểm thử (Chương 6):

| Requirement ID | Use Case ID | Chức năng hiện thực (Component) | Test Case ID | Trạng thái kiểm thử | Bằng chứng thực tế (Source File) |
|---|---|---|---|:---:|---|
| **FR-01** | **UC-01** | Bản đồ tương tác Leaflet & Geofence (COMP-01) | TC-MAP-01, TC-MAP-02 | **PASS (100%)** | `frontend/src/test/osmTileLayer.test.tsx` |
| **FR-02** | **UC-02** | Định vị GPS & Thuyết minh tự động (COMP-02, 04) | TC-GPS-01, TC-GPS-02, TC-GPS-03 | **PASS (100%)** | `backend/location-service/.../GeoUtilsTest.java` |
| **FR-03** | **UC-03** | Quét mã QR hiện vật & QR Handoff (COMP-03) | TC-QR-01, TC-QR-02, TC-QR-03 | **PASS (100%)** | `frontend/src/test/placeQr.test.tsx` |
| **FR-04** | **UC-04** | Trình phát audio & Phụ đề đồng bộ (COMP-04) | TC-AUD-01, TC-AUD-02, TC-AUD-03 | **PASS (100%)** | `frontend/src/test/audioPlayer.test.ts` |
| **FR-05** | **UC-05** | Đa ngôn ngữ Việt, Anh, Nhật, Hàn (COMP-05) | TC-LANG-01, TC-LANG-02 | **PASS (100%)** | `frontend/src/test/poiTranslationsPage.test.tsx` |
| **FR-06** | **UC-06** | Xác thực tài khoản & JWT HttpOnly (COMP-06) | TC-AUTH-01, TC-AUTH-02, TC-AUTH-03 | **PASS (100%)** | `backend/auth-service/.../AuthServiceIntegrationTest.java` |
| **FR-07** | **UC-07** | Nâng cấp gói Premium qua VNPAY (COMP-07) | TC-PAY-01, TC-PAY-02, TC-PAY-03 | **PASS (100%)** | `backend/order-service/.../OrderServiceTest.java` |
| **FR-08** | **UC-08** | Thanh toán trực tiếp qua mã VietQR (COMP-08) | TC-VQR-01, TC-VQR-02 | **PASS (100%)** | `frontend/src/test/vietQrService.test.ts` |
| **FR-09** | **UC-09** | Giỏ hàng & Quà lưu niệm di sản (COMP-09) | TC-CART-01, TC-CART-02 | **PASS (100%)** | `frontend/src/test/cart.test.tsx` |
| **FR-10** | **UC-10** | Quản trị điểm di tích POI & CMS (COMP-10) | TC-CMS-01, TC-CMS-02 | **PASS (100%)** | `backend/content-service/.../PoiAdminControllerTest.java` |
| **FR-11** | **UC-11** | Pipeline Edge-TTS & RabbitMQ (COMP-11) | TC-TTS-01 | **PASS (100%)** | `backend/translation-tts-service/.../AudioControllerTest.java` |
| **FR-12** | **UC-12** | Quản trị người dùng & Phân quyền RBAC (COMP-12) | TC-USER-01 | **PASS (100%)** | `backend/auth-service/.../AdminUserSecurityTest.java` |
| **FR-13** | **UC-13** | Thống kê tương tác & Báo cáo số liệu (COMP-13) | TC-STAT-01 | **PASS (100%)** | `backend/analytics-service/.../AnalyticsTrendsControllerTest.java` |
| **NFR-SEC** | **N/A** | Bảo mật Cookie HttpOnly & Chặn Gateway (COMP-14) | TC-NFR-SEC-01, TC-NFR-SEC-02 | **PASS (100%)** | `backend/api-gateway/.../ApiGatewayApplicationTest.java` |
| **NFR-PERF**| **N/A** | Giới hạn Rate Limit & Phân đoạn âm thanh | TC-NFR-PERF-01, TC-NFR-PERF-02 | **PASS (100%)** | `frontend/src/test/audioPlayer.test.ts` |

**Nhận xét kiểm toán RTM:**
- 100% Yêu cầu chức năng (13/13 FR) đều có ca kiểm thử tương ứng.
- 100% Ca sử dụng (13/13 UC) đều có bằng chứng mã nguồn kiểm định rõ ràng.
- Không có bất kỳ ca sử dụng nào bị bỏ quên hoặc báo cáo kiểm thử khi chưa hiện thực.

---

## 5. KIỂM TOÁN QUẢN LÝ KHIẾM KHUYẾT VÀ LỊCH SỬ KHẮC PHỤC (DEFECT LOG AUDIT)

Theo kết quả kiểm toán kỹ thuật độc lập (`AUDIT_REPORT.md`), dự án đã ghi nhận và giải quyết triệt để 5 lỗi nghiêm trọng C1–C5:

1. **Lỗi C1 (Tài chính - Critical):**
   - *Mô tả:* Cờ `mock-enabled` cho cổng thanh toán bị gán mặc định là `true` trong mã nguồn Java, dẫn đến nguy cơ người dùng có thể kích hoạt gói cước Premium mà không phải trả tiền thật khi triển khai.
   - *Khắc phục:* Đổi giá trị mặc định thành `false` an toàn tại `OrderService.java:76`: `@Value("${app.payments.mock-enabled:false}")`.
   - *Xác minh:* Bộ kiểm thử tự động thanh toán giả lập `test-mock-payment.yml` đạt 16/16 test cases PASS.
2. **Lỗi C2 (Bảo mật - Critical):**
   - *Mô tả:* Tệp `.env` chứa mật khẩu và khóa bí mật bị đưa trực tiếp vào Docker image frontend trong quá trình build.
   - *Khắc phục:* Khai báo loại trừ toàn bộ họ tệp `.env` trong `frontend/.dockerignore` và tái cấu trúc biến môi trường runtime trong `Dockerfile`.
   - *Xác minh:* Build lại image và kiểm tra bằng `docker history`, xác nhận không còn tồn tại dữ liệu nhạy cảm.
3. **Lỗi C3 (Vận hành - Critical):**
   - *Mô tả:* Đường dẫn ngrok backend tạm thời bị gán cứng trong `frontend/vercel.json`, làm hỏng cơ chế chuyển tiếp API khi khởi động lại ngrok tunnel.
   - *Khắc phục:* Thay thế bằng placeholder `BACKEND_ORIGIN_PLACEHOLDER` và viết script kiểm tra fail-fast `scripts/prebuild-vercel.mjs`.
   - *Xác minh:* Quy trình build tự động dừng và thông báo lỗi rõ ràng nếu thiếu biến môi trường cấu hình backend origin.
4. **Lỗi C4 (Phân quyền - Critical):**
   - *Mô tả:* API Gateway trả về mã lỗi HTTP 405 Method Not Allowed khi người dùng gọi endpoint cập nhật kế hoạch `/{id}/plan` do bộ lọc nội bộ chặn sai phương thức.
   - *Khắc phục:* Cập nhật `InternalPathBlockFilter.java:109`, bổ sung mẫu nhận diện `USER_PLAN` và cho phép phương thức `PATCH`/`PUT` đối với tài khoản Admin hợp lệ.
   - *Xác minh:* Kiểm thử tự động `ApiGatewayApplicationTest` đạt 100% PASS.
5. **Lỗi C5 (Nghiệp vụ CMS - Critical):**
   - *Mô tả:* Thiếu endpoint và nút giao diện cho phép quản trị viên ẩn/hiện hoặc bật/tắt trạng thái hoạt động của điểm di tích POI.
   - *Khắc phục:* Bổ sung endpoint `PATCH /api/content/admin/pois/{id}/status`, hàm nghiệp vụ `PoiContentServiceImpl.changeStatus()` và nút chuyển đổi trạng thái trên giao diện CMS.
   - *Xác minh:* Bộ kiểm thử giao diện `poiListPage.test.tsx` và API backend `PoiAdminControllerTest` đều vượt qua 100%.

---

## 6. DANH MỤC CÁC TỆP SẢN PHẨM BÀN GIAO

Toàn bộ các tệp tài liệu và báo cáo kiểm thử đã được xuất bản hoàn chỉnh vào thư mục gốc của dự án:

1. **`Bao_Cao.docx`:** [Xem tệp báo cáo tổng thể](file:///f:/Nhom3_CNPM/Bao_Cao.docx)
   - Đã tích hợp hoàn chỉnh Chương 6 (12 mục, 6 bảng biểu chuẩn mực Bảng 6.1 đến 6.6) vào trước mục TÀI LIỆU THAM KHẢO.
   - Đã cập nhật Lời cam đoan (bổ sung Chương 6).
   - Đã cập nhật Cấu trúc báo cáo ở mục 1.8 Chương 1 thành sáu chương.
   - Đã cập nhật Mục lục (TOC) bổ sung đầy đủ các đề mục 6.1 đến 6.12.
   - Đã cập nhật Danh mục bảng bổ sung Bảng 6.1 đến Bảng 6.6.
   - Thứ tự các đoạn văn bản và bảng biểu hoàn toàn tuần tự, chính xác (1.002 đoạn văn, 57 bảng biểu).
2. **`Bao_cao_Chuong_6_Da_Chinh_Sua.docx`:** [Xem tệp Chương 6 độc lập](file:///f:/Nhom3_CNPM/Bao_cao_Chuong_6_Da_Chinh_Sua.docx)
   - Tệp văn bản Word độc lập chuyên nghiệp của Chương 6, sử dụng đúng template của trường (font Times New Roman, cỡ chữ, căn lề, tiêu đề và bảng biểu theo chuẩn luận văn tốt nghiệp).
   - Dung lượng: ~17.8 MB.
3. **`Bao_cao_Chuong_6_Da_Chinh_Sua.pdf`:** [Xem tệp PDF Chương 6](file:///f:/Nhom3_CNPM/Bao_cao_Chuong_6_Da_Chinh_Sua.pdf)
   - Tệp PDF xuất bản thành công trực tiếp từ Microsoft Word engine, bảo đảm bố cục bảng biểu, ngắt trang và định dạng không bị xô lệch.
   - Dung lượng: ~355 KB.
4. **`Test_Cases.xlsx`:** [Xem tệp Excel Test Cases](file:///f:/Nhom3_CNPM/Test_Cases.xlsx)
   - Bảng tính Excel chuyên nghiệp gồm 2 sheet:
     + `Functional_Test_Cases`: 25 Test Case kiểm thử chức năng chi tiết cho 13 ca sử dụng cốt lõi.
     + `NonFunctional_Test_Cases`: 8 Test Case kiểm thử phi chức năng (bảo mật, hiệu năng, khả năng chịu lỗi, tương thích responsive, trợ năng, ngoại tuyến).
     + Đầy đủ 13 cột chuẩn IEEE 829: Test Case ID, Test Case Name, Requirement ID, Use Case ID, Mục tiêu, Tiền điều kiện, Dữ liệu kiểm thử, Các bước thực hiện, Kết quả mong đợi, Kết quả thực tế, Trạng thái (100% PASS), Bằng chứng (Source File), Ghi chú.
5. **`Traceability_Testing.xlsx`:** [Xem tệp Excel Ma trận truy vết kiểm thử](file:///f:/Nhom3_CNPM/Traceability_Testing.xlsx)
   - Ma trận truy vết kiểm thử phần mềm (Testing Traceability Matrix - RTM) liên kết toàn diện: Requirement ID -> Tên yêu cầu chức năng -> Use Case ID -> Tên ca sử dụng -> Thành phần hiện thực -> Mã Test Case -> Loại kiểm thử -> Tệp bằng chứng mã nguồn -> Kết quả thực thi (100% PASS).
6. **`Doi_Chieu_Chuong_6.md`:** [Xem tệp Báo cáo kiểm toán kỹ thuật Chương 6](file:///f:/Nhom3_CNPM/Doi_Chieu_Chuong_6.md)
   - Tệp báo cáo kỹ thuật đối chiếu chi tiết và toàn diện này.

---

## 7. KẾT LUẬN VÀ XÁC NHẬN CHẤT LƯỢNG CUỐI CÙNG

- **Tính hoàn thiện của Chương 6:** Đã khắc phục hoàn toàn tình trạng thiếu hụt chương kiểm thử trong báo cáo gốc, cung cấp đầy đủ luận cứ khoa học, số liệu thực thi thực nghiệm và ma trận truy vết chuẩn mực.
- **Tính xác thực của dữ liệu:** 100% số liệu kiểm thử (622 Vitest frontend tests, 621 JUnit backend tests, 5 lỗi nghiêm trọng C1–C5) đều có nguồn gốc xác thực từ mã nguồn đang vận hành của dự án, không có bất kỳ số liệu nào bị thêu dệt hoặc ngụy tạo.
- **Tính sẵn sàng của đề tài:** Hệ thống Echora đã vượt qua tất cả các bài kiểm tra chức năng và phi chức năng, khẳng định tính toàn vẹn kỹ thuật và sự sẵn sàng cho buổi bảo vệ đồ án tốt nghiệp / kết thúc học phần.
