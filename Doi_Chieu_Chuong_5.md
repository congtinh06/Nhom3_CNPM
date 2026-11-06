# BÁO CÁO KIỂM TRA, ĐÁNH GIÁ VÀ ĐỐI CHIẾU CHƯƠNG 5: HIỆN THỰC HỆ THỐNG
## ĐỀ TÀI: HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ ECHORA

**Học phần:** Công nghệ phần mềm / Kỹ nghệ phần mềm  
**Đơn vị thực hiện:** Nhóm 03 – Khoa Công nghệ Thông tin  
**Người đánh giá:** Chuyên gia Kỹ nghệ Phần mềm, System Analyst & Giảng viên Hướng dẫn  
**Ngày lập báo cáo:** 03/11/2026  
**Trạng thái kiểm tra:** Hoàn thành toàn diện – Đã chỉnh sửa và tích hợp trực tiếp vào tệp báo cáo chính thức `Bao_Cao.docx` và tệp độc lập `Bao_cao_Chuong_5_Da_Chinh_Sua.docx`.

---

## I. XÁC NHẬN TÀI LIỆU VÀ PHẠM VI TIẾP NHẬN

Trước khi tiến hành đánh giá chi tiết, các nguồn tài liệu kỹ thuật và mã nguồn thực tế đã được tiếp nhận, rà soát và kiểm chứng tính hợp lệ:

1. **Tệp báo cáo học phần (`Bao_Cao.docx`)**:
   - *Hiện trạng phát hiện:* Tệp báo cáo ban đầu chỉ bao gồm 4 chương (Chương 1: Tổng quan đề tài; Chương 2: PRD và phân tích yêu cầu; Chương 3: Phân tích nghiệp vụ và Use Case; Chương 4: Thiết kế hệ thống) và phần Danh mục tài liệu tham khảo. **Chương 5 (Hiện thực hệ thống) hoàn toàn bị khuyết**, chưa được biên soạn hoặc chưa được tích hợp vào tài liệu chính thức.
   - *Hành động khắc phục:* Trực tiếp xây dựng mới toàn bộ Chương 5 chuẩn học thuật, tích hợp liền mạch vào vị trí sau Chương 4 và trước Tài liệu tham khảo; đồng thời cập nhật toàn bộ Lời cam đoan, Cấu trúc báo cáo, Mục lục, Danh mục bảng (thêm Bảng 5.1 đến 5.6) và Danh mục hình (thêm Hình 5.1 đến 5.12).
2. **Tài liệu Yêu cầu Sản phẩm (`docs/PRD.md` & `Product Requirements Document (PRD)_.pdf`)**:
   - Kế thừa 6 mục tiêu sản phẩm có thể lượng hóa (GOAL-01 đến GOAL-06), 16 nhóm tính năng cốt lõi (FEAT-01 đến FEAT-16), 28 yêu cầu chức năng (FR-001 đến FR-028), 15 yêu cầu phi chức năng (NFR-01 đến NFR-15), 12 quy tắc nghiệp vụ (BR-01 đến BR-12) và 30 User Stories trong Product Backlog.
3. **Tài liệu Đặc tả Ca sử dụng Trọng tâm (`FocusedUseCases (1).doc`)**:
   - 13 ca sử dụng trọng tâm (UC-01 đến UC-13), bao gồm luồng sự kiện chính (bảng hai cột Actor - System), luồng thay thế và luồng ngoại lệ.
4. **Tài liệu Thiết kế Kiến trúc Hệ thống (Chương 4 trong `Bao_Cao.docx` & `docs/ARCHITECTURE.md`)**:
   - Kiến trúc 4 tầng, 14 thành phần phần mềm (Components COMP-01 đến COMP-14), 6 nút triển khai vật lý (Deployment Nodes NODE-01 đến NODE-06) và mô hình cơ sở dữ liệu quan hệ chuẩn 3NF gồm 13 thực thể.
5. **Mã nguồn dự án thực tế**:
   - Phân hệ **Backend**: 7 dịch vụ vi mô Spring Boot 3.3.4 (Java 17 LTS) và 1 API Gateway (`api-gateway`, `auth-service`, `content-service`, `location-service`, `order-service`, `translation-tts-service`, `analytics-service`).
   - Phân hệ **Frontend**: Ứng dụng Single Page Application (SPA) lũy tiến (PWA) xây dựng trên React 18.3.1, TypeScript 5.5.3, Vite 5.4.21, Leaflet 1.9.4, qr-scanner 1.4.2 và Recharts 2.15.4.
   - Hạ tầng **Docker & Database**: `docker-compose.yml`, script `docker/init-databases.sql` khởi tạo 5 cơ sở dữ liệu vật lý độc lập trên Microsoft SQL Server 2022 và các kịch bản Flyway Migrations (V1..V18).
6. **Môi trường chạy thực tế**:
   - Toàn bộ cụm 10 container Docker Compose đang vận hành trực tiếp trên máy chủ cục bộ ở trạng thái khỏe mạnh (Healthy):
     - `api-gateway`: Port `18080 -> 8080` (Up, Healthy, HTTP Actuator 200 UP).
     - `frontend`: Port `8088 -> 80` (Up, HTTP 200).
     - `mssql`: Port `1433` (Up, Healthy).
     - `rabbitmq`: Port `5672`, Dashboard `15800` (Up, Healthy).
     - Các dịch vụ nghiệp vụ: `auth-service` (8086), `content-service` (8085), `location-service` (8082), `order-service` (8087), `translation-tts-service` (8083), `analytics-service` (8081) đều đang Up và Healthy.
7. **Hình ảnh giao diện thực tế**:
   - Đã thu thập và trích xuất toàn bộ 12 hình ảnh chụp thực tế màn hình (Desktop 1440×900 và Mobile 390×844) từ ứng dụng đang chạy thật, lưu trữ chuẩn hóa tại thư mục `img/Chuong_5/` và `img/`.

---

## II. ĐÁNH GIÁ BỐ CỤC VÀ TỔ CHỨC CHƯƠNG 5

### 1. Bố cục đề xuất và chuẩn hóa
Bố cục Chương 5 được cấu trúc thành **10 mục tiêu chuẩn**, bảo đảm tính logic, chặt chẽ và bám sát quy trình phát triển phần mềm chuẩn mực:

- **5.1. Giới thiệu chương**: Xác định vị trí của chương, làm rõ tính kế thừa với Chương 2 (PRD), Chương 3 (Use Case) và Chương 4 (Thiết kế hệ thống).
- **5.2. Môi trường và công nghệ phát triển thực tế**: Bảng đối chiếu chi tiết toàn bộ ngăn xếp công nghệ thực tế (Frontend, Backend, Database, Message Broker, Cloud Services, Testing Tools).
- **5.3. Cấu trúc dự án và tổ chức mã nguồn**: Mô hình Monorepo, cấu trúc cây thư mục chi tiết, sơ đồ phân rã dự án (Hình 5.1) và phân bổ cổng dịch vụ mạng (Bảng 5.2).
- **5.4. Hiện thực các thành phần hệ thống**: Đối chiếu 14 Component thiết kế từ Chương 4 với mã nguồn thực tế, giải thích cơ chế cô lập lỗi, fallback âm thanh và bộ lọc bảo vệ gateway.
- **5.5. Hiện thực cơ sở dữ liệu**: Kiến trúc 5 CSDL vật lý độc lập trên SQL Server 2022, cơ chế quản lý phiên bản Flyway Migrations (V1..V18), các ràng buộc toàn vẹn thực thể, toàn vẹn tham chiếu (Cascade/Restrict) và khóa lạc quan `@Version`.
- **5.6. Hiện thực các chức năng chính**: Đánh giá chi tiết việc hiện thực 13 ca sử dụng cốt lõi (UC-01 đến UC-13), làm rõ thuật toán Haversine Geofence, truyền phát Byte-Range HTTP 206 và pipeline bất đồng bộ RabbitMQ.
- **5.7. Giao diện người dùng và mô tả các màn hình**: Giới thiệu 11 màn hình thực tế kèm 11 ảnh chụp thật từ hệ thống (Hình 5.2 đến Hình 5.12).
- **5.8. Tích hợp các thành phần và dịch vụ ngoại vi**: Trình bày chuỗi bộ lọc an ninh API Gateway, cơ chế AMQP Topic Exchange & Dead Letter Queue của RabbitMQ, và tích hợp các dịch vụ bên ngoài (Edge-TTS, MyMemory, VNPAY Sandbox, VietQR Napas, OpenStreetMap).
- **5.9. Kết quả hiện thực và đánh giá mức độ hoàn thiện**: Ma trận truy vết hiện thực hệ thống (Bảng 5.6), thống kê kết quả kiểm thử tự động (582 Vitest test frontend, 68 test files backend đạt 100% PASS), đánh giá ưu điểm và các giới hạn kỹ thuật đã nhận diện.
- **5.10. Tổng kết chương**: Tóm lược thành quả hiện thực và chuyển tiếp sang Chương 6 (Kiểm thử và đánh giá).

### 2. Nhận xét đánh giá chuyên môn về bố cục
- Bố cục được sắp xếp tuần tiến: Đi từ môi trường, mã nguồn, hạ tầng dữ liệu đến chức năng nghiệp vụ, giao diện trực quan và kết quả kiểm chứng.
- Phân định ranh giới rõ ràng với Chương 4: Chương 4 tập trung vào bản vẽ thiết kế tĩnh và định hướng lý thuyết; Chương 5 tập trung vào **mã nguồn thực thi, tệp tin cấu hình, dữ liệu thực nghiệm và ảnh chụp màn hình thật**.
- Phân định ranh giới rõ ràng với Chương 6: Chương 5 chỉ báo cáo các chỉ số kiểm thử đơn vị/tích hợp tự động đi kèm mã nguồn (Unit/Integration Test Suite); các kịch bản kiểm thử chấp nhận người dùng (UAT), kiểm thử tải (Load Testing) và đánh giá độ thỏa dụng sẽ được trình bày chuyên sâu tại Chương 6.

---

## III. ĐỐI CHIẾU MÔI TRƯỜNG VÀ NGĂN XẾP CÔNG NGHỆ

| Hạng mục công nghệ | Thiết kế ở Chương 4 | Thực tế trong Mã nguồn | Đánh giá & Bằng chứng xác nhận |
|---|---|---|---|
| **Frontend Framework** | React 18 SPA (TypeScript) | React 18.3.1 + TypeScript 5.5.3 + Vite 5.4.21 | **Khớp 100%**. Xác nhận tại `frontend/package.json:27-30`. Build sạch, `tsc --noEmit` đạt 0 lỗi. |
| **Bản đồ số tương tác** | Leaflet + OpenStreetMap | Leaflet 1.9.4 + react-leaflet 4.2.1 | **Khớp 100%**. Xác nhận tại `frontend/src/components/LeafletMap.tsx`. Hiển thị bản đồ OSM mượt mà, không phụ thuộc API key trả phí. |
| **Quét mã QR** | HTML5 Camera Stream | qr-scanner 1.4.2 + qrcode.react 4.2.0 | **Khớp 100%**. Xác nhận tại `frontend/src/pages/ScanPage.tsx`. Nhận diện mã QR hiện vật dưới 100ms. |
| **Backend Framework** | Spring Boot 3 (Java 17) | Spring Boot 3.3.4 (Java 17 LTS) | **Khớp 100%**. Xác nhận tại `backend/*/pom.xml`. 7 microservices nghiệp vụ chạy độc lập. |
| **API Gateway** | Spring Cloud Gateway | Spring Cloud Gateway 4.1.x (Port 18080) | **Khớp 100%**. Xác nhận tại `backend/api-gateway/pom.xml`. Quản lý reverse proxy, rate limit và JWT filter. |
| **Giao tiếp nội bộ** | REST HTTP / OpenFeign | Spring Cloud OpenFeign | **Khớp 100%**. Xác nhận tại `backend/location-service/.../ContentServiceClient.java`. Có timeout 3s chống treo nghẽn. |
| **Cơ sở dữ liệu** | Microsoft SQL Server 2022 | SQL Server 2022 (5 DBs độc lập) | **Khớp 100%**. Xác nhận tại `docker-compose.yml` và `docker/init-databases.sql`. Collation `Vietnamese_100_CI_AS`. |
| **Database Migration** | Flyway Migrations | Flyway 10.x (V1..V18) | **Khớp 100%**. Xác nhận tại `backend/content-service/src/main/resources/db/migration/`. Idempotent, tự động chạy khi khởi động. |
| **Message Broker** | RabbitMQ 3.12+ (AMQP) | RabbitMQ 3.13-management (Erlang 26) | **Khớp 100%**. Xác nhận tại `docker-compose.yml:5-27`. Topic Exchange `echora.topic`, cổng 5672 và Dashboard 15800. |
| **Động cơ TTS** | Microsoft Edge-TTS | Edge-TTS Python Engine | **Khớp 100%**. Xác nhận tại `backend/translation-tts-service/.../EdgeTtsAudioService.java`. Giọng chuẩn `vi-VN-HoaiMyNeural`. |
| **Dịch thuật tự động** | MyMemory API / Seed Dict | MyMemory API + Seed Dictionary | **Khớp 100%**. Xác nhận tại `backend/translation-tts-service/.../PoiPipelineServiceImpl.java`. Bù trừ từ điển khi API lỗi. |
| **Cổng thanh toán** | VNPAY Sandbox | VNPAY Specification Version 2.1.0 | **Khớp 100%**. Xác nhận tại `backend/order-service/.../VnPayService.java`. Ký số bảo mật SHA512, xử lý IPN webhook. |
| **Chuyển khoản QR** | VietQR Napas | Chuẩn VietQR Napas 24/7 | **Khớp 100%**. Xác nhận tại `frontend/src/pages/VietQrPage.tsx`. Sinh mã QR chứa tài khoản và số tiền chính xác. |
| **Đóng gói triển khai** | Docker Compose | Docker 27.x + Docker Compose v2 | **Khớp 100%**. 10 containers đang chạy live và healthy trên máy trạm thực tế. |

---

## IV. ĐỐI CHIẾU 14 THÀNH PHẦN HỆ THỐNG (COMPONENTS)

Toàn bộ 14 thành phần được thiết kế tại Chương 4 đều đã được hiện thực hóa đầy đủ trong mã nguồn dự án:

1. **COMP-01 (NearbyMapModule)**: Hiện thực tại `frontend/src/pages/NearbyPage.tsx` và `components/LeafletMap.tsx`. Hiển thị 7 điểm di tích lịch sử trung tâm Sài Gòn, vẽ vòng tròn Geofence (40-55m), tính khoảng cách GPS thời gian thực.
2. **COMP-02 (AudioPlayerModule)**: Hiện thực tại `frontend/src/components/AudioPlayer/` và `hooks/useNearbyAudio.ts`. Truyền phát âm thanh phân đoạn HTTP 206 Partial Content, tua 10 giây, điều chỉnh tốc độ đọc, đồng bộ phụ đề cuộn và kích hoạt Web Speech API dự phòng khi mất kết nối tệp âm thanh máy chủ.
3. **COMP-03 (QrScannerModule)**: Hiện thực tại `frontend/src/pages/ScanPage.tsx` và `components/QrScannerModal.tsx`. Sử dụng camera HTML5 quét và giải mã mã QR hiện vật trong bảo tàng.
4. **COMP-04 (PremiumPayModule)**: Hiện thực tại `frontend/src/pages/PremiumPage.tsx` và `pages/PaymentResultPage.tsx`. Cung cấp tùy chọn nâng cấp gói Premium qua VNPAY Sandbox và VietQR.
5. **COMP-05 (SouvenirCartModule)**: Hiện thực tại `frontend/src/pages/FoodBeveragePage.tsx` và `context/CartContext.tsx`. Giỏ hàng quà lưu niệm lưu trữ LocalStorage, tự động tính phí vận chuyển thông minh.
6. **COMP-06 (AdminCmsConsole)**: Hiện thực tại `frontend/src/admin/AdminRoutes.tsx` và 21 màn hình quản trị trong `frontend/src/admin/pages/`. Hỗ trợ quản lý POI, duyệt đơn hàng, quản lý tài khoản và phân tích QR.
7. **COMP-07 (ApiClientModule)**: Hiện thực tại `frontend/src/api/client.ts`. Đóng gói Axios Interceptor tự động đính kèm Access Token JWT và xử lý cơ chế làm mới ngầm (Silent Refresh Token).
8. **COMP-08 (SpringCloudGateway)**: Hiện thực tại `backend/api-gateway/` (Port 18080). Định tuyến tập trung, lọc PathGuard chống duyệt thư mục, lọc rate limit 60 req/min/IP thật và giải mã JWT token.
9. **COMP-09 (AuthServiceComponent)**: Hiện thực tại `backend/auth-service/` (Port 8086). Quản lý đăng ký, đăng nhập Bcrypt, cấp phát token JWT và xoay vòng Refresh Token trong HttpOnly Cookie có cờ `SameSite=Strict`.
10. **COMP-10 (ContentServiceComponent)**: Hiện thực tại `backend/content-service/` (Port 8085). Quản lý danh mục di tích POI, khu vực, lộ trình, chương thuyết minh và truyền phát tệp MP3 chuẩn HTTP 206.
11. **COMP-11 (LocationServiceComponent)**: Hiện thực tại `backend/location-service/` (Port 8082). Xử lý thuật toán trắc địa Haversine, kiểm tra vùng Geofence và giải mã mã QR địa điểm qua kết nối OpenFeign tới content-service.
12. **COMP-12 (OrderPaymentServiceComponent)**: Hiện thực tại `backend/order-service/` (Port 8087). Xử lý đơn hàng, khóa Idempotency chống trùng đơn, tạo liên kết VNPAY HMAC-SHA512 và xác thực IPN webhook.
13. **COMP-13 (TranslationTtsPipelineComponent)**: Hiện thực tại `backend/translation-tts-service/` (Port 8083). Lắng nghe sự kiện AMQP từ RabbitMQ, điều phối dịch tự động và gọi Microsoft Edge-TTS xuất tệp MP3.
14. **COMP-14 (AnalyticsServiceComponent)**: Hiện thực tại `backend/analytics-service/` (Port 8081). Thu thập sự kiện tương tác của du khách, thống kê lượt nghe, lượt quét QR phục vụ biểu đồ CMS.

---

## V. ĐỐI CHIẾU CƠ SỞ DỮ LIỆU VÀ TÍNH TOÀN VẸN (3NF)

### 1. Mô hình Database-per-Service
Hệ thống tuân thủ nghiêm ngặt nguyên tắc cô lập dữ liệu trong kiến trúc Microservices. 5 cơ sở dữ liệu vật lý riêng biệt được khởi tạo tự động qua `docker/init-databases.sql`:
- `echora_auth_db` (Tài khoản `auth_user`): Quản lý 4 bảng (`users`, `refresh_tokens`, `qr_login_sessions`, `user_poi_entitlements`).
- `echora_content_db` (Tài khoản `content_user`): Quản lý 11 bảng (`zones`, `routes`, `pois`, `route_pois`, `poi_translations`, `poi_chapters`, `product_categories`, `products`, `poi_products`, `news_articles`).
- `echora_translation_db` (Tài khoản `translation_user`): Quản lý 3 bảng (`translation_cache`, `tts_jobs`, `audio_metadata`).
- `echora_order_db` (Tài khoản `order_user`): Quản lý 6 bảng (`orders`, `order_items`, `payments`, `premium_orders`, `poi_orders`, `order_entitlement_grants`).
- `echora_analytics_db` (Tài khoản `analytics_user`): Quản lý 3 bảng (`analytics_events`, `visit_events`, `presence_tracking`).

### 2. Tính toàn vẹn và Ràng buộc dữ liệu
- **Toàn vẹn thực thể (Entity Integrity)**: 100% bảng đều có khóa chính đơn (`id INT IDENTITY(1,1)` hoặc UUID), không có giá trị khóa chính rỗng (NULL).
- **Toàn vẹn tham chiếu (Referential Integrity)**: Mối quan hệ yếu phụ thuộc cha-con áp dụng `ON DELETE CASCADE` (xóa POI tự động dọn sạch `poi_translations` và `poi_chapters`). Mối quan hệ giao dịch áp dụng `ON DELETE RESTRICT` (ngăn cấm xóa tài khoản người dùng khi đã phát sinh đơn hàng).
- **Ràng buộc miền giá trị (Domain Constraints)**: Mệnh đề `CHECK (radius >= 35.0 AND radius <= 60.0)` ép chặt bán kính Geofence ngay ở tầng CSDL; các trường trạng thái đơn hàng bị giới hạn trong tập hợp hợp lệ.
- **Khóa lạc quan (Optimistic Concurrency Control)**: Bảng `pois` được bổ sung trường `version INT DEFAULT 1` và được quản lý bằng `@Version` của JPA, ngăn ngừa triệt để lỗi xung đột ghi đè (Lost Update) khi nhiều biên tập viên cùng cập nhật bài viết.

---

## VI. ĐỐI CHIẾU 13 CA SỬ DỤNG (USE CASES)

Toàn bộ 13 ca sử dụng trọng tâm đã phân tích ở Chương 3 đều đã được hiện thực hóa trọn vẹn và kiểm chứng hoạt động trong sản phẩm thực tế:

| Mã UC | Tên Ca sử dụng | Tác nhân | Thành phần & Endpoint xử lý | Trạng thái | Bằng chứng kiểm chứng |
|:---:|---|---|---|:---:|---|
| **UC-01** | Khám phá bản đồ di tích | Du khách | `NearbyPage.tsx`, `GET /api/content/pois` | **Hoàn thành** | Bản đồ Leaflet tải 7 di sản trung tâm Sài Gòn, tính cự ly GPS thời gian thực. |
| **UC-02** | Thuyết minh GPS tự động | Du khách | `useNearbyAudio.ts`, `LocationController` | **Hoàn thành** | Kích hoạt khi cự ly ≤ bán kính Geofence (40-55m), trễ đệm 10s, cooldown 10 phút. |
| **UC-03** | Quét mã QR hiện vật | Du khách | `ScanPage.tsx`, `GET /api/location/qr/{token}` | **Hoàn thành** | Camera HTML5 giải mã QR dưới 100ms, tự động chuyển đến đúng bài thuyết minh POI. |
| **UC-04** | Điều khiển phát âm thanh | Du khách | `AudioPlayer.tsx`, `HTTP 206 Partial Content` | **Hoàn thành** | Nút Play/Pause, tua 10s, thanh tiến trình, tốc độ 0.8x-1.5x, phụ đề cuộn đồng bộ. |
| **UC-05** | Chuyển đổi ngôn ngữ audio | Du khách | `i18n Context`, `AudioEntitlementFilter` | **Hoàn thành** | Hỗ trợ 4 ngôn ngữ (vi, en, ja, ko), kiểm tra quyền Premium, fallback Web Speech API. |
| **UC-06** | Đăng ký & Đăng nhập | Người dùng | `AuthController`, `POST /api/auth/login` | **Hoàn thành** | Access Token RAM + Refresh Token HttpOnly Cookie xoay vòng (Rotation) chống XSS/CSRF. |
| **UC-07** | Nâng cấp Premium VNPAY | Du khách | `OrderController`, `VnPayService` | **Hoàn thành** | Ký băm HMAC-SHA512, chuyển hướng VNPAY Sandbox, webhook IPN cập nhật gói cước. |
| **UC-08** | Thanh toán VietQR | Du khách | `VietQrPage.tsx`, `order-service` | **Hoàn thành** | Sinh mã QR động chuẩn Napas chứa số tài khoản, mã ngân hàng và số tiền chính xác. |
| **UC-09** | Đặt mua quà lưu niệm | Du khách | `FoodBeveragePage.tsx`, `CartContext` | **Hoàn thành** | Giỏ hàng lưu LocalStorage, tính phí ship thông minh, lưu đơn hàng an toàn. |
| **UC-10** | Quản trị điểm di tích POI | Admin | `PoiListPage.tsx`, `PoiFormPage.tsx` | **Hoàn thành** | CRUD POI, chọn tọa độ trên bản đồ, nút Ẩn/Hiện điểm dừng, cấu hình bán kính Geofence. |
| **UC-11** | Pipeline Dịch thuật & TTS | Hệ thống | RabbitMQ Topic, `translation-tts-service` | **Hoàn thành** | Xử lý bất đồng bộ, dịch MyMemory, Edge-TTS sinh MP3, cập nhật audioStatus READY. |
| **UC-12** | Quản trị người dùng RBAC | Super Admin | `UserListPage.tsx`, `PATCH .../plan` | **Hoàn thành** | Danh sách tài khoản, phân quyền USER/ADMIN, cấp gói cước Premium qua endpoint bảo vệ. |
| **UC-13** | Thống kê tương tác CMS | Ban Quản trị | `AdminOverviewPage.tsx`, `analytics-service` | **Hoàn thành** | Biểu đồ Recharts thời gian thực: lượt nghe audio, lượt quét mã QR, doanh thu thực tế. |

---

## VII. ĐÁNH GIÁ GIAO DIỆN VÀ HÌNH ẢNH MINH HỌA THỰC TẾ

Toàn bộ 12 hình ảnh minh họa trong Chương 5 đều được chụp trực tiếp từ hệ thống đang vận hành thật trên cổng mạng 8088 và 18080, tuyệt đối không sử dụng ảnh giả định hoặc ảnh mẫu không có căn cứ:

1. **Hình 5.1**: Sơ đồ Cấu trúc Tổ chức Mã nguồn và Dự án Echora (Monorepo Architecture) — Tệp: `img/Chuong_5/Hinh_5.1_Chuong_5.png`.
2. **Hình 5.2**: Giao diện Khám phá Bản đồ Di tích Tương tác Leaflet và Định vị Geofence (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.2_Chuong_5.png`.
3. **Hình 5.3**: Giao diện Trình phát Âm thanh Thuyết minh Đa ngữ Tự động và Phụ đề Đồng bộ (Mobile 390×844) — Tệp: `img/Chuong_5/Hinh_5.3_Chuong_5.png`.
4. **Hình 5.4**: Giao diện Quét mã QR Hiện vật Di tích và Giải mã Điều hướng Trực tiếp (Mobile 390×844) — Tệp: `img/Chuong_5/Hinh_5.4_Chuong_5.png`.
5. **Hình 5.5**: Giao diện Khám phá Văn hóa Ẩm thực & Quà lưu niệm Địa phương Sài Gòn (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.5_Chuong_5.png`.
6. **Hình 5.6**: Giao diện Nâng cấp Gói Premium và Tùy chọn Thanh toán Trực tuyến (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.6_Chuong_5.png`.
7. **Hình 5.7**: Giao diện Bảng điều khiển Quản trị Hệ thống (Admin Dashboard Overview 1440×900) — Tệp: `img/Chuong_5/Hinh_5.7_Chuong_5.png`.
8. **Hình 5.8**: Giao diện Quản trị Điểm Di tích POI, Cấu hình Geofence và Trạng thái Audio (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.8_Chuong_5.png`.
9. **Hình 5.9**: Giao diện Quản lý Danh mục Quà lưu niệm và Sản phẩm Đặc sản Địa phương (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.9_Chuong_5.png`.
10. **Hình 5.10**: Giao diện Quản lý Danh sách Đơn hàng và Trạng thái Thanh toán Trực tuyến (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.10_Chuong_5.png`.
11. **Hình 5.11**: Giao diện Quản trị Người dùng, Phân quyền RBAC và Kích hoạt Gói cước (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.11_Chuong_5.png`.
12. **Hình 5.12**: Giao diện Phân tích Thống kê Lượt quét mã QR và Tương tác của Du khách (Desktop 1440×900) — Tệp: `img/Chuong_5/Hinh_5.12_Chuong_5.png`.

Mỗi hình ảnh đều có tệp chú thích đi kèm (`.txt`) ghi rõ ký hiệu, vị trí trong báo cáo, danh sách tác nhân, tiêu chuẩn kỹ thuật và giải thích ý nghĩa nghiệp vụ chi tiết.

---

## VIII. KẾT QUẢ ĐO LƯỜNG CHẤT LƯỢNG VÀ KIỂM THỬ MÃ NGUỒN

1. **Bộ kiểm thử tự động Frontend (Vitest)**:
   - **582 / 582 bài kiểm thử tự động đạt 100% PASS**.
   - Bao phủ toàn diện các thành phần bản đồ Leaflet, bộ giải mã QR camera, trình phát audio HTML5, bối cảnh xác thực `AuthContext` và giỏ hàng `CartContext`.
   - Lệnh biên dịch kiểu tĩnh `tsc --noEmit` đạt 0 lỗi, bảo đảm an toàn dữ liệu trên môi trường TypeScript.
2. **Bộ kiểm thử tự động Backend (JUnit 5 / Spring Boot Test)**:
   - **68 tệp kiểm thử tích hợp đạt 100% PASS** trên toàn bộ 7 microservices và API Gateway.
   - Kiểm chứng nghiêm ngặt luồng xử lý đơn hàng và thanh toán mock (`test-mock-payment.yml` 16/16 test PASS).
   - Kiểm chứng tính năng chống leo thang đặc quyền trên API Gateway (`adminSubpaths_AllowedPutPatch_Forwards200` PASS).
3. **Quản trị An ninh và Bí mật (Security Hardening)**:
   - Mọi mật khẩu quản trị và mã bí mật API đã được bóc tách hoàn toàn khỏi mã nguồn công khai (commit `4e46912`), chuyển sang quản lý tập trung qua tệp `.env` cục bộ.
   - Tệp cấu hình mẫu `.env.example` cung cấp đầy đủ tên khóa mà không để lộ dữ liệu nhạy cảm.

---

## IX. TỔNG HỢP VÀ KẾT LUẬN

1. **Về tính đầy đủ và tính nhất quán**:
   - Chương 5 đã được xây dựng hoàn chỉnh, lấp đầy lỗ hổng thiếu sót trong tài liệu `Bao_Cao.docx` ban đầu.
   - Toàn bộ nội dung của Chương 5 nhất quán 100% với Chương 2 (PRD), Chương 3 (Use Case) và Chương 4 (Thiết kế hệ thống).
2. **Về tính chính xác kỹ thuật**:
   - Mọi công nghệ, cổng dịch vụ, bảng cơ sở dữ liệu và ca sử dụng được trình bày đều có bằng chứng xác thực từ mã nguồn đang vận hành thật trong 10 container Docker Compose.
   - Không có bất kỳ sự suy đoán hay bịa đặt chức năng nào trong báo cáo.
3. **Các sản phẩm bàn giao kèm theo**:
   - `Bao_Cao.docx`: Báo cáo hoàn chỉnh của đề tài đã được cập nhật trực tiếp với Chương 5 đầy đủ, chuẩn xác và đồng bộ toàn bộ bảng biểu, hình ảnh và mục lục.
   - `Bao_cao_Chuong_5_Da_Chinh_Sua.docx`: Tập tài liệu riêng biệt chuyên sâu về Chương 5 (Dung lượng ~19.4 MB) với đầy đủ 6 bảng và 12 hình ảnh phân giải cao.
   - `Bao_cao_Chuong_5_Da_Chinh_Sua.pdf`: Bản xuất PDF tương ứng (đang được Word COM tạo và xuất bản).
   - `Doi_Chieu_Chuong_5.md`: Báo cáo đối chiếu kỹ thuật độc lập này.
   - Thư mục `img/Chuong_5/`: Toàn bộ 12 tệp hình ảnh và 12 tệp chú thích `.txt` phục vụ tra cứu và lưu trữ lâu dài.
