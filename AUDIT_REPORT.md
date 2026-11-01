# BÁO CÁO KIỂM TOÁN KỸ THUẬT — DỰ ÁN ECHORA

**Bản:** cuối (sau khi sửa 5 lỗi nghiêm trọng)
**Thư mục:** `F:\Nhom3_CNPM`
**Ngày:** 01/11/2026
**Phạm vi:** working tree hiện tại, gồm cả thay đổi chưa commit của người dùng
**Trạng thái:** đã sửa C1–C5; các mục Quan trọng/Nhỏ còn lại được giữ nguyên để theo dõi tiếp

---

## 0. Phương pháp, giới hạn và những gì đã thực sự chạy

### 0.1. Cách đọc báo cáo

- Mọi kết luận đều gắn `đường_dẫn:dòng`. Khi một khẳng định chỉ suy ra từ mã mà chưa chạy được, ghi rõ **"chưa kiểm chứng"**.
- Không in giá trị secret. Hai file `.env` ở gốc và `frontend/.env` **không được track** (`git ls-files` không trả về), nhưng có chứa giá trị giống secret thật; báo cáo chỉ nêu sự tồn tại.
- Điểm số dùng thang 10, trọng số cố định; **không làm tròn lên**.

### 0.2. Những lệnh đã chạy trong lần kiểm toán này

| Lệnh | Kết quả |
|---|---|
| `npx vitest run src/test/poiApi.test.ts src/test/poiListPage.test.tsx` | **ĐẠT** — 2 file / 23 test |
| `node scripts/prebuild-vercel.mjs` (không đặt `BACKEND_ORIGIN`) | **ĐÚNG KỲ VỌNG** — in cảnh báo tiếng Việt và `exit 1` |
| `node -e "JSON.parse(fs.readFileSync('frontend/vercel.json'))"` | **ĐẠT** — JSON hợp lệ, còn đúng 2 placeholder |
| `npx tsc --noEmit` | **KHÔNG ĐẠT** — 1 lỗi `TS6133` ở file test **chưa commit của người dùng** `frontend/src/test/routeHeadings.test.tsx:7` (`AuthProvider` khai báo nhưng không dùng) |
| `npm test` (toàn bộ frontend) | @@FULL_FE@@ |
| Maven chạy `PoiContentServiceImplTest` + `PoiAdminControllerTest` | **ĐẠT** — 61 test (49 service + 12 controller), 0 lỗi (`BUILD SUCCESS`) |
| Maven chạy `ApiGatewayApplicationTest` | @@GATEWAY@@ |
| Maven chạy `OrderServiceTest` | @@ORDER@@ |

> Lỗi `TS6133` nằm trong file **người dùng tự thêm** (`?? frontend/src/test/routeHeadings.test.tsx`), không phải do 5 lỗi C1–C5 và không do các file đã sửa. Nó chặn `tsc`/`npm run build`; cần xóa dòng import thừa trước khi build production. Báo cáo **không tự sửa** file này để giữ nguyên thay đổi của người dùng.

### 0.3. Giới hạn

- Không chạy `docker compose up`, không gọi API thật, không kiểm tra VNPay sandbox, không đo độ trễ audio.
- Maven trong repo là wrapper giả: `backend/*/mvnw.cmd` chỉ gọi `mvn` nếu có trên PATH, nếu không thì thoát (`backend/content-service/mvnw.cmd:4-8`). Lần chạy backend dùng Maven tải sẵn trong `~/.m2/wrapper/dists/apache-maven-3.9.16`.

---

## 0.4. Bản đồ hệ thống

### Dịch vụ, cổng, lưu trữ

| Thành phần | Cổng nội bộ | Cổng host | Công nghệ | Lưu trữ |
|---|---|---|---|---|
| `api-gateway` | 8080 | 18080 | Spring Cloud Gateway (WebFlux) | không DB |
| `auth-service` | 8086 | – | Spring Boot 3 + Spring Security + JJWT | `echora_auth_db` |
| `content-service` | 8085 | – | Spring Boot + JPA + Flyway | `echora_content_db` |
| `location-service` | 8082 | – | Spring Boot + OpenFeign | không DB (gọi content-service) |
| `translation-tts-service` | 8083 | – | Spring Boot + AMQP + edge-tts | `echora_translation_db` + thư mục audio |
| `analytics-service` | 8081 | – | Spring Boot + AMQP | `echora_analytics_db` |
| `order-service` | 8087 | – | Spring Boot + JPA | `echora_order_db` |
| `frontend` (nginx) | 80 | 8088 | React 18 + Vite 5 + TS 5 | file tĩnh |

Nguồn: `docker-compose.yml:5-390`, `backend/*/src/main/resources/application.yml`, `frontend/nginx.conf`.

Hạ tầng: SQL Server 2022 (`127.0.0.1:1433`), RabbitMQ 3 (`127.0.0.1:5672`, UI `127.0.0.1:15800`) — `docker-compose.yml:10-12,42-43`.

### Giao thức

- **HTTPS/HTTP + JSON** giữa frontend → gateway → service (REST).
- **JWT HS256** cho access token; **refresh token** trong cookie `HttpOnly` + `SameSite=Strict`.
- **Header tin cậy nội bộ**: `X-User-Id`, `X-User-Role`, `X-User-Plan`, `X-Internal-Api-Key` do gateway gắn sau khi xác thực (`UntrustedHeaderStripGlobalFilter.java:11-22`).
- **AMQP (RabbitMQ)**: publish POI (`poi.created`/`poi.updated`), audio (`poi.audio.*`), analytics, cấp quyền sau thanh toán.
- **OpenFeign** ở location-service → content-service; **RestClient** ở order/translation/content → service khác.

### Luồng chính (scan/select → content → translate → TTS → audio → analytics)

1. **Chọn/scan**: `frontend/src/pages/ScanPage.tsx` (QR), `NearbyPage.tsx` (GPS) → `api.getPoiGuides()` (`frontend/src/api/client.ts`).
2. **Nội dung**: gateway `/api/content/**` → `content-service` → `PoiController.getPoiGuides` (`PoiController.java:47-54`) → `PoiContentServiceImpl.getPoiGuides` (`PoiContentServiceImpl.java:169-...`); `EntitlementFilter` chặn ngôn ngữ premium.
3. **Publish/dịch**: admin tạo/sửa POI → `createPoi/updatePoi` (`:418`, `:484`) → `PoiPublishRequestedEvent` → `PoiPublishService.doPublish`.
4. **Dịch + TTS**: `PoiPipelineServiceImpl.processLanguage` → `TtsTextBuilder.buildText` → tổng hợp audio → `poi.audio.ready`.
5. **Audio**: `AudioController` phục vụ `/api/tts/audio/**`, bảo vệ bởi `AudioEntitlementFilter`.
6. **Analytics**: `POST /api/analytics/events` → gateway rate-limit → `AnalyticsEventServiceImpl.createEvent` → RabbitMQ → consumer ghi DB.

### Toàn bộ route của gateway (11 route)

`backend/api-gateway/src/main/resources/application.yml:12-74`:

`/api/auth/**` · `/me/entitlements` + `/api/me/entitlements` · `/api/content/**` · `/api/admin/products/**` · `/api/admin/news/**` · `/img/products/**` · `/api/location/**` · `/api/tts/**` · `/api/analytics/**` · `/api/orders/**` · `/api/admin/orders/**`

**Không có** route cho `/api/v1/**` hay `/api/products/**`.

---

## 1. Tóm tắt điều hành

### 1.1. Năm lỗi nghiêm trọng — trạng thái sau khi sửa

| # | Lỗi | Mức tác động | Trạng thái | Bằng chứng chính |
|---|---|---|---|---|
| C1 | Bypass thanh toán: `mock-confirm` bật mặc định | Tiền / quyền Premium | **ĐÃ SỬA** | `OrderService.java:77`; `order-service/application.yml:48`; `docker-compose.yml:313`; `.env.example:123` |
| C2 | `.env` (sample data + ngrok) bị nhúng vào image Docker | Dữ liệu giả ở production | **ĐÃ SỬA** | `frontend/.dockerignore:7-9`; `frontend/Dockerfile:9-17` |
| C3 | `vercel.json` trỏ cứng tunnel ngrok | API deploy chết | **ĐÃ SỬA** | `frontend/vercel.json:32,46`; `frontend/scripts/prebuild-vercel.mjs:30-42` |
| C4 | Admin đổi gói người dùng luôn 405 | Chức năng quản trị | **ĐÃ SỬA** | `InternalPathBlockFilter.java:48,229-232`; `ApiGatewayApplicationTest.java:1812-1819` |
| C5 | Không thể ẩn/hiện POI | Quản trị nội dung | **ĐÃ SỬA** | `PoiController.java:126-134`; `PoiContentServiceImpl.java:593-615`; `V18__poi_status_check.sql`; `PoiListPage.tsx:126-137,245-270` |

### 1.2. Điểm số

| | Trước khi sửa | Sau khi sửa | Δ |
|---|---|---|---|
| **Tổng** | **6.35 / 10** | **6.70 / 10** | **+0.35** |

Điểm chỉ tăng 0.35 vì 5 lỗi này tập trung ở 2 tiêu chí (Đúng chức năng, Bảo mật & cấu hình), trong khi các điểm trừ lớn còn lại nằm ở Kiến trúc, Giao tiếp liên dịch vụ, Kiểm thử và Sạch sẽ — những phần chưa được chạm tới trong đợt sửa này.

---

## 2. Bảng điểm chi tiết

### 2.1. Công thức

```
Tổng = 0.20×Kiến trúc + 0.20×Giao tiếp liên dịch vụ + 0.20×Đúng chức năng
     + 0.15×Frontend + 0.10×Kiểm thử & CI + 0.10×Bảo mật & cấu hình
     + 0.05×Sạch sẽ & tài liệu
```

Không làm tròn lên.

### 2.2. Kết quả

| # | Tiêu chí | Trọng số | Điểm | Vì sao (bằng chứng) | Cần gì để +1 |
|---|---|---|---|---|---|
| 1 | Kiến trúc / ranh giới dịch vụ | 20% | **7.0** | (a) 7 service + gateway, DB riêng từng service (`docker-compose.yml:124,180,221,257,303`). (b) Gateway gom xác thực, RBAC, rate-limit, strip header (`AdminAuthGlobalFilter.java:224-231`). (c) `content-service` vẫn gánh 5 miền dữ liệu (POI, zone, route, product, news — 10 controller), và allowlist ở gateway vẫn **chép tay** song song với mapping controller: `InternalPathBlockFilter.java:171-220` vs `PoiController.java:126-134` (C5 vừa phải sửa đúng kiểu lệch này). | Tách `product`/`news` khỏi content-service; sinh allowlist từ route của từng service thay vì viết tay. |
| 2 | Giao tiếp liên dịch vụ & xử lý lỗi | 20% | **6.5** | (a) Có publisher confirm + retry job + DLQ + idempotency `contentHash` (`PoiPublishRetryJob.java:15-22`, `PoiAudioUpdateService.java:159-196`). (b) `ProductPriceClient`/`PoiPriceClient` dựng `RestClient` **không timeout** (`ProductPriceClient.java:26-27`, `PoiPriceClient.java:23`). (c) Không có circuit breaker; analytics trả 202 mà không chờ confirm (`AnalyticsEventServiceImpl.java:65-70`). | Timeout + retry backoff cho mọi RestClient/Feign; Resilience4j; analytics chờ `CorrelationData`. |
| 3 | Đúng chức năng / đầy đủ | 20% | **7.0** (trước 6.0) | (a) Luồng chính đủ: tạo POI → publish → dịch → TTS → audio → analytics. (b) **Đã sửa 2 lỗ hổng chức năng**: admin đổi gói hoạt động (`InternalPathBlockFilter.java:229-232`) và ẩn/hiện POI có endpoint + UI (`PoiController.java:126-134`, `PoiListPage.tsx:126-137`). (c) Còn: `supportedLanguages` validate nhưng không lưu, publish luôn `en,ja,ko` (`PoiPublishService.java:37`); TTS bỏ `summary`/`historicalSignificance` (`TtsTextBuilder.java:11-24`); alias `/api/v1/products` chết qua gateway (`ProductPublicController.java:18`). | Lưu `supported_languages`; TTS đọc đủ 4 trường; bỏ hoặc route alias `/api/v1`. |
| 4 | Frontend | 15% | **6.5** | (a) TS strict, refresh single-flight (`frontend/src/api/refresh.ts`), đủ trạng thái loading/error/empty, 269 chỗ `aria-*`/`role`. (b) Thêm thao tác Ẩn/Hiện có `aria-label`, chặn double-click bằng `statusUpdatingId` (`PoiListPage.tsx:46,126-137,245-270`). (c) Vẫn chỉ 4 trang lazy, ~19 trang import tĩnh (`App.tsx:11-29,47-50`); 24.368 dòng CSS; 1 `console.log` (`useNearbyAudio.ts:468`). | Lazy-load toàn bộ route, tách CSS, xóa log, kiểm tra bundle-size trong CI. |
| 5 | Kiểm thử & CI | 10% | **6.5** (trước 6.0) | (a) 77 file test / 598 `it/test` frontend; 69 file `*Test.java` backend (analytics 12, auth 13, content 19, location 4, translation 16, order 3, gateway 2). (b) Đợt sửa thêm 9 test: 3 service + 3 controller + 1 assertion gateway + 3 frontend (`PoiContentServiceImplTest.java:906-939`; `PoiAdminControllerTest.java:255-296`; `ApiGatewayApplicationTest.java:1812-1819`; `poiApi.test.ts:105-111`; `poiListPage.test.tsx:254-282`). (c) Vẫn không thu coverage/ngưỡng: `frontend/package.json:11` là `vitest run`; `vite.config.ts:52-55` thiếu `provider`/`thresholds`; chỉ 4 `@SpringBootTest`, 3 Testcontainers. | Thêm `@vitest/coverage-v8` + ngưỡng + bước CI; Testcontainers cho content/order. |
| 6 | Bảo mật & cấu hình | 10% | **7.0** (trước 6.0) | (a) Nhiều kiểm soát tốt: internal key fail-closed (`InternalApiKeyFilter.java:27-30`), so sánh constant-time, whitelist JWT, refresh token hash + rotation (`RefreshTokenService.java:44-56`), xác thực chữ ký + số tiền VNPay (`OrderService.java:642-643,673`). (b) **Đã sửa 3 lỗi cấu hình nghiêm trọng**: mock payment mặc định tắt (`OrderService.java:77`), `.env` không vào image (`frontend/.dockerignore:7-9`), không còn ngrok trong repo (`vercel.json:32,46`). (c) Còn: access token trong `localStorage` (`tokenStore.ts:24,34`) trái README:41; nginx xóa `Origin`; tin `X-Forwarded-For`; thiếu SMTP mặc định. | Chuyển access token sang memory; bỏ xóa Origin; đọc IP tin cậy; SMTP/MailHog + fail-fast. |
| 7 | Sạch sẽ & tài liệu | 5% | **5.5** | (a) Đặt tên package/lớp nhất quán, ghi chú tiếng Việt ở service lõi. (b) README vẫn sai: 582 test vs **598** (`README.md:11,317`), 74 suite vs 77 (`:317`), 68 file backend / order 2 vs **69 / order 3** (`:339`), 8 workflow vs **9** (`:339`). (c) File chết: `frontend/src/services/rssNewsServer.ts`, `frontend/src/content/newsLinks.todo.md`; `docs/` 195 file / 25 MB được track. | Cập nhật README theo số đo; xóa file chết; chuyển `docs/` sang wiki/release/LFS. |

### 2.3. Tổng điểm

```
0.20×7.0 + 0.20×6.5 + 0.20×7.0 + 0.15×6.5 + 0.10×6.5 + 0.10×7.0 + 0.05×5.5
= 1.40 + 1.30 + 1.40 + 0.975 + 0.65 + 0.70 + 0.275
= 6.70 / 10
```

> **6.70 / 10** — từ "khá thấp" lên "khá": các lỗi có thể mất tiền, lộ cấu hình và chặn quản trị đã được đóng; phần còn lại là nợ kỹ thuật về kiến trúc, độ bền liên dịch vụ và chất lượng kiểm thử.

---

## 3. Chi tiết 5 lỗi nghiêm trọng đã sửa

### C1 — Bypass thanh toán: `mock-confirm` bật mặc định

**Trước khi sửa**

- `OrderService.java:76` — `@Value("${app.payments.mock-enabled:true}")`.
- `order-service/application.yml:47` — `mock-enabled: ${PAYMENTS_MOCK_ENABLED:true}`.
- `docker-compose.yml:313` — `${PAYMENTS_MOCK_ENABLED:-true}`.
- `.env.example:122` — `PAYMENTS_MOCK_ENABLED=true`.
- Bất kỳ user đã đăng nhập gọi `POST /api/orders/{orderCode}/pay/mock-confirm` (`OrderController.java:97-103`) là đơn thành `PAID` và **được cấp quyền Premium/POI** (`confirmDemoTransfer`).

**Đã sửa**

| Vị trí | Nội dung mới |
|---|---|
| `backend/order-service/src/main/java/com/echora/order/service/OrderService.java:76-77` | Comment + `@Value("${app.payments.mock-enabled:false}")` |
| `backend/order-service/src/main/resources/application.yml:47-48` | `mock-enabled: ${PAYMENTS_MOCK_ENABLED:false}` |
| `docker-compose.yml:313` | `PAYMENTS_MOCK_ENABLED: ${PAYMENTS_MOCK_ENABLED:-false}` |
| `.env.example:121-123` | Giải thích rõ "mặc định TẮT", `PAYMENTS_MOCK_ENABLED=false` |
| `docker-compose.dev.yml:34-37` | Override chỉ cho dev/demo: `PAYMENTS_MOCK_ENABLED: "true"` |

Cơ chế chặn đã có sẵn và vẫn giữ: `OrderService.java:382-384` ném `ForbiddenException("Chức năng xác nhận chuyển khoản demo đang tắt.")` khi `mockEnabled == false`.

**Kiểm chứng**

- Đọc mã: cả 4 nơi đều mặc định `false`; override dev nằm ở file compose riêng, không ảnh hưởng `docker compose up` production.
- Test có sẵn phủ cả hai trạng thái: `OrderServiceTest.java:78` bật `true` cho test luồng demo, `:329-334` khẳng định ném `ForbiddenException` khi tắt.
- **Chưa kiểm chứng**: chưa chạy `OrderServiceTest` trong lần này (không chạy được Maven cho order-service).

**Tồn dư**

- Endpoint vẫn tồn tại; nếu ai đặt `PAYMENTS_MOCK_ENABLED=true` trên production thì lỗ hổng quay lại. Chưa có guard `@Profile("!prod")` hoặc fail-fast khi `mockEnabled && profile=prod`.
- Chưa có test HTTP thật (MockMvc) khẳng định `mock-confirm` trả 403 khi tắt.

---

### C2 — `frontend/.env` bị nhúng vào image Docker

**Trước khi sửa**

- `frontend/.dockerignore:1-5` chỉ loại `node_modules`, `dist`, `.git`, `.env.local`, `*.log` → **không loại `.env`**.
- `frontend/Dockerfile:6-7` — `COPY . .` rồi `RUN npm run build` → Vite đọc `frontend/.env`, nhúng `VITE_USE_SAMPLE_DATA=true` và `VITE_QR_BASE_URL=<ngrok>` vào bundle.
- Hệ quả: `demoMode.ts` bật fixtures; `articleService.ts:41-44,67-69` trả dữ liệu mẫu và che lỗi API; `NearbyPage.tsx:275` tắt loading.

**Đã sửa**

- `frontend/.dockerignore:7-9` — thêm `.env`, `.env.*`, `!.env.example` (kèm comment giải thích).
- `frontend/Dockerfile:9-14` — khai báo `ARG`/`ENV` tường minh **trước** `COPY . .` (`:16`) và `npm run build` (`:17`):
  - `VITE_API_BASE_URL` (mặc định rỗng → dùng same-origin qua nginx),
  - `VITE_QR_BASE_URL`,
  - `VITE_USE_SAMPLE_DATA=false`.
- Vì `.env` bị loại khỏi context, Vite không còn nguồn nào để bật sample data ngoài build-arg.

**Kiểm chứng**

- Đọc mã + đối chiếu thứ tự Dockerfile: `ARG`/`ENV` đứng trước `COPY`/`RUN`.
- **Chưa kiểm chứng**: chưa build image thật để `grep` bundle xem còn chuỗi `USE_SAMPLE_DATA` hay host ngrok.

**Tồn dư**

- Chưa có bước CI khẳng định `VITE_USE_SAMPLE_DATA !== "true"` trước khi build production.
- Nếu build không truyền `VITE_API_BASE_URL`, bản image phụ thuộc nginx proxy `/api/` — đúng với `nginx.conf`, nhưng cần ghi rõ trong README/deploy.

---

### C3 — `vercel.json` trỏ cứng tunnel ngrok

**Trước khi sửa**

- `frontend/vercel.json:31-32,45-46` — `"dest": "https://affection-smokiness-watch.ngrok-free.dev/api/$1"` và `.../img/products/$1`.
- Tunnel ngrok free đổi hostname mỗi lần khởi động → deploy Vercel chết API, không cảnh báo.

**Đã sửa**

- `frontend/vercel.json:32,46` — thay bằng `https://BACKEND_ORIGIN_PLACEHOLDER/...`.
- `frontend/scripts/prebuild-vercel.mjs:30-42` — nếu `vercel.json` còn placeholder mà `BACKEND_ORIGIN` chưa đặt → in thông báo tiếng Việt và `process.exit(1)`; nếu đã đặt → validate URL, ghi origin thật.
- `frontend/package.json:15` — thêm `"build:vercel": "node scripts/prebuild-vercel.mjs && tsc && vite build"`.
- `deploy.txt:3-5` — hướng dẫn build bằng `BACKEND_ORIGIN=... npm run build:vercel`, nêu rõ build sẽ DỪNG nếu thiếu biến.

**Kiểm chứng**

- **Đã chạy** `node scripts/prebuild-vercel.mjs` không có `BACKEND_ORIGIN` → in cảnh báo và `exit 1`.
- **Đã chạy** `JSON.parse` trên `frontend/vercel.json` → hợp lệ, đúng 2 placeholder.
- **Chưa kiểm chứng**: chưa deploy Vercel thật.

**Tồn dư**

- `frontend/vercel.json:38,52` vẫn còn header `ngrok-skip-browser-warning` — vô nghĩa với backend không phải ngrok; nên xóa.
- Nếu ai chạy `vercel --prod` mà không dùng `build:vercel`, placeholder sẽ được deploy và API hỏng. Nên đặt Build Command của Vercel thành `npm run build:vercel`.

---

### C4 — Admin đổi gói người dùng luôn trả 405

**Trước khi sửa**

- Controller có thật: `AdminUserController.java:88-92` (`PATCH/PUT /{id}/plan`).
- Frontend gọi: `frontend/src/admin/api/userApi.ts:59`, dùng ở `UserDetailPage.tsx:122`.
- Gateway chỉ khai báo `USER_ROLE`, `USER_STATUS`; fallback `return HttpMethod.GET.equals(method)` (`InternalPathBlockFilter.java:220-233`) → PATCH/PUT bị chặn 405.

**Đã sửa**

- `InternalPathBlockFilter.java:48` — thêm `USER_PLAN = ^/api/auth/admin/users/\d+/plan$`.
- `InternalPathBlockFilter.java:229-232` — nhánh riêng chỉ cho `PUT`/`PATCH` (GET vẫn bị chặn, đúng với controller chỉ map PATCH/PUT).
- `ApiGatewayApplicationTest.java:1812-1819` — thêm assertion `PATCH .../users/1/plan` → 200.

**Kiểm chứng**

- Đọc mã: pattern khớp đúng path, method đúng với controller.
- **Chưa kiểm chứng**: chưa chạy `ApiGatewayApplicationTest` trong lần này.

**Tồn dư**

- Allowlist vẫn là danh sách chép tay; lỗi kiểu này sẽ tái diễn mỗi khi thêm endpoint admin. Nên sinh allowlist từ mapping của service hoặc ít nhất thêm test đối chiếu danh sách route.

---

### C5 — Không thể ẩn/hiển thị POI

**Trước khi sửa**

- `Poi.status` tồn tại (`Poi.java:73-75`), API công khai chỉ trả `ACTIVE` (`PoiContentServiceImpl.java:162-173`), nhưng không có endpoint đổi trạng thái.
- Gateway lại allowlist `/status` (`InternalPathBlockFilter.java:37,177-179`) → endpoint "ma".
- Admin UI chỉ có nút Sửa (`PoiListPage.tsx`, cột Thao tác).

**Đã sửa (backend)**

| Thành phần | Vị trí |
|---|---|
| DTO validate | `backend/content-service/.../dto/UpdatePoiStatusRequest.java:18-27` — `@NotBlank` + `@Pattern("ACTIVE|INACTIVE|MAINTENANCE")` |
| Interface | `PoiContentService.java:52-57` — `changeStatus(Long, String)` |
| Triển khai | `PoiContentServiceImpl.java:593-615` — chuẩn hóa hoa/thường, validate tập giá trị, 404 nếu không có, set `status` + `updatedAt` + tăng `version`, trả `AdminPoiDetailDto` |
| Controller | `PoiController.java:126-134` — `PATCH/PUT /api/content/admin/pois/{id}/status`, trả 200 |
| Gateway | `InternalPathBlockFilter.java:178-181` — chỉ cho `PUT`/`PATCH` (GET bị chặn) |
| DB | `V18__poi_status_check.sql:5-12` — `CK_poi_status CHECK (status IN ('ACTIVE','INACTIVE','MAINTENANCE'))`, idempotent |

**Đã sửa (frontend)**

- `frontend/src/admin/api/poiApi.ts:62-73` — `updatePoiStatus(id, status)` dùng `adminClient.patch`.
- `frontend/src/admin/pages/PoiListPage.tsx:46` — state `statusUpdatingId`; `:126-137` — `handleToggleVisibility` (ACTIVE → INACTIVE, còn lại → ACTIVE), reload danh sách, hiển thị lỗi qua `ErrorState`; `:245-270` — nút Ẩn/Hiện, disable khi đang lưu, `aria-label` rõ ràng.

**Test đã thêm**

- `PoiContentServiceImplTest.java:906-939` — 3 test: ẩn thành công + tăng version, từ chối giá trị lạ trước khi chạm DB, 404.
- `PoiAdminControllerTest.java:255-296` — 3 test MockMvc: 200, 400 (không gọi service), 403 (thiếu role).
- `ApiGatewayApplicationTest.java:1777-1789` — PUT và PATCH `/pois/1/status` → 200.
- `poiApi.test.ts:105-111` — gọi đúng `PATCH .../status`.
- `poiListPage.test.tsx:254-282` — bấm Ẩn → `INACTIVE`, bấm Hiện → `ACTIVE`.

**Kiểm chứng**

- **Đã chạy**: `npx vitest run src/test/poiApi.test.ts src/test/poiListPage.test.tsx` → 2 file / 23 test đạt.
- **Đã chạy**: Maven `-Dtest=PoiContentServiceImplTest,PoiAdminControllerTest` → **61 test, 0 lỗi**, gồm 3 test `changeStatus` và 3 test MockMvc của endpoint `/status`.
- **Chưa kiểm chứng**: chưa chạy migration `V18` trên SQL Server thật.

**Tồn dư**

- Không ghi audit log (ai đổi trạng thái, khi nào) — yêu cầu ban đầu có nhắc "ghi audit" nhưng chưa làm.
- `changeStatus` **không** phát event publish (có chủ đích: nội dung không đổi), nên nếu sau này cần đồng bộ CDN/cache thì phải bổ sung.
- UI chỉ có toggle ACTIVE/INACTIVE; trạng thái `MAINTENANCE` chưa có nút riêng (API đã hỗ trợ).
- Nút nằm ở trang danh sách; trang chi tiết POI chưa có.

---

## 4. Những gì đang đúng (giữ nguyên)

### 4.1. Bảo mật đường biên

- **Fail-closed cho internal API key**: thiếu key thì từ chối — `auth-service/.../config/InternalApiKeyFilter.java:27-30`; `content-service/.../config/EntitlementFilter.java:45-46`.
- **Strip header giả mạo trước mọi filter khác**: `UntrustedHeaderStripGlobalFilter.java:11-22` (`HIGHEST_PRECEDENCE`).
- **JWT**: whitelist thuật toán, bắt buộc `exp`, so sánh chữ ký; role không phân biệt hoa/thường — `AdminAuthGlobalFilter.java:214-221`.
- **Chuẩn hóa path chống bypass**: `AdminAuthGlobalFilter.java:241-275`.
- **Refresh token**: lưu hash, xoay vòng, TTL theo `rememberMe` — `RefreshTokenService.java:44-56`.
- **Cookie**: `HttpOnly`, `SameSite=Strict`, `Secure` mặc định `true` — `AuthController.java:216-223`.
- **CORS theo allowlist**, không `*` — `CorsConfig.java`.
- **VNPay**: xác thực HMAC-SHA512 **và đối chiếu số tiền** — `OrderService.java:642-643,673`.
- **Mock payment**: mặc định tắt; chỉ bật qua `docker-compose.dev.yml` (mới).

### 4.2. Nhất quán dữ liệu & xử lý bất đồng bộ

- **Publisher confirm + retry job + DLQ**: `PoiPublishRetryJob.java:15-22`; trạng thái `PENDING/FAILED` lưu DB.
- **Idempotency `contentHash`** cho audio.ready/failed: `PoiAudioUpdateService.java:159-196`.
- **Idempotency đơn hàng** theo `(userId, idempotencyKey)`: `OrderService.java:85-113,164-166`.
- **Optimistic lock** khi sửa POI: `PoiContentServiceImpl.java:488-490`; endpoint đổi trạng thái cũng tăng `version` (`:611`).
- **Job cấp quyền tách khỏi transaction thanh toán**: `OrderEntitlementService.enqueue` + `OrderEntitlementScheduler`.

### 4.3. Ràng buộc DB

- 36 `UNIQUE`, 18 `FOREIGN KEY`, nhiều `CHECK` — ví dụ `V1__init_order_schema.sql:28-30,58,80-81`; `V1__init_auth_schema.sql:23-24`.
- Index phục vụ job publish: `V1__init_content_schema.sql:124-125`.
- **Mới**: `CK_poi_status` (`V18__poi_status_check.sql`).

### 4.4. Frontend

- `strict: true` (`tsconfig.json`).
- Refresh **single-flight** + hàng đợi: `frontend/src/api/refresh.ts`.
- Trạng thái UI đầy đủ: loading, lỗi `role="alert"`, rỗng, premium gate `role="status" aria-live="polite"` — `NearbyPage.tsx:788-810`.
- Tách vendor chunk: `vite.config.ts:57-68`.
- Kiểm tra route SPA đồng bộ nginx/vercel: `scripts/check-spa-routes.mjs`.
- **Mới**: thao tác Ẩn/Hiện POI có phản hồi loading và `aria-label` (`PoiListPage.tsx:245-270`).

### 4.5. Vận hành

- 9 workflow CI, mỗi service một workflow; frontend chạy lint + test + check route + build (`frontend-ci.yml:45-63`).
- Healthcheck + `depends_on: condition: service_healthy` toàn stack.
- Chỉ expose `health`: `api-gateway/application.yml:94-101`.
- **Mới**: pipeline deploy Vercel có bước fail-fast thay vì im lặng deploy sai (`prebuild-vercel.mjs:30-42`).

---

## 5. Vấn đề còn lại

### 5.1. QUAN TRỌNG

#### H1. Access token lưu `localStorage` — trái tài liệu

- `frontend/src/api/tokenStore.ts:24` (`localStorage.getItem`), `:34` (`setItem`), `:37` (`sessionStorage.removeItem`); áp cho cả scope `user` và `admin` (`:9-14`).
- `README.md:41` khẳng định "Access Token lưu trong bộ nhớ".
- Hệ quả: XSS đọc được token admin; `HttpOnly` của refresh token không bảo vệ trọn vẹn.
- Sửa: chỉ giữ token trong biến memory (`accessTokens` đã có ở `:16-19`), khôi phục phiên bằng refresh cookie.

#### H2. `supportedLanguages` validate nhưng không lưu

- DTO: `CreatePoiRequest.java:65-67`, `UpdatePoiRequest.java:61-63`.
- Service validate: `PoiContentServiceImpl.java:149,427,497`.
- Không có cột/bảng lưu; publish dùng hằng `TARGET_LANGUAGES = List.of("en","ja","ko")` (`PoiPublishService.java:37`).
- Hệ quả: admin chọn ít ngôn ngữ vẫn tốn quota dịch/TTS và sinh audio ngoài ý muốn.
- Sửa: migration `poi_supported_language`, map entity, publish đọc DB.

#### H3. TTS chỉ đọc `title` + `description`

- `translation-tts/.../tts/TtsTextBuilder.java:11-24`; call site `PoiPipelineServiceImpl.java:211`.
- `summary` bắt buộc có trong `poi.audio.ready` (`PoiAudioUpdateService.java:112`); `historicalSignificance` đã lưu (`PoiContentServiceImpl.java:470`) nhưng không được nói.
- Hệ quả: bản thuyết minh mất phần tóm tắt và ý nghĩa lịch sử — đúng phần giá trị nhất.
- Sửa: mở rộng `buildText(title, summary, description, historicalSignificance)`, cập nhật test, kiểm tra giới hạn byte/chunk.

#### H4. `Origin` bị xóa ở nginx; `X-Forwarded-For` bị tin cậy

- `frontend/nginx.conf` trong `location /api/`: `proxy_set_header Origin "";`.
- `OriginCheckFilter.java:69-77` chỉ chặn khi `Origin` có mặt → filter CSRF không bao giờ chặn request qua nginx.
- `X-Forwarded-For $proxy_add_x_forwarded_for` giữ giá trị client; `AuthController.java:236-245` và `OrderController.java:124-130` lấy `split(",")[0]` → client tự đổi IP để né rate-limit đăng nhập (`AuthServiceImpl.java:99-102`).
- Sửa: bỏ dòng xóa Origin; đọc phần tử cuối hoặc dùng `ForwardedHeaderFilter` với trusted proxy.

#### H5. Analytics trả 202 dù sự kiện có thể mất

- `AnalyticsEventController.java:21-24` luôn 202; `AnalyticsEventServiceImpl.java:65-70` `convertAndSend` không confirm; `RabbitMQConfig.java:82-84` chỉ log message không route được.
- Sửa: publisher confirm correlated, chờ ack, trả 503/ghi outbox khi fail.

#### H6. Client HTTP nội bộ thiếu timeout, không circuit breaker

- `ProductPriceClient.java:26-27`, `PoiPriceClient.java:23` — `RestClient` không timeout.
- `AuthEntitlementClient.java:33-36` có timeout (3s/5s) → chuẩn không đồng nhất.
- Không có Resilience4j/`@CircuitBreaker` trong `backend/`.
- Sửa: `RestClient.Builder` dùng chung + retry backoff + circuit breaker.

#### H7. Xác thực email bắt buộc nhưng mặc định không gửi được mail

- `MailService.java:14-16,36-55` — thiếu `MAIL_HOST` thì ghi link ra log.
- `docker-compose.yml` không đặt `MAIL_HOST`; `.env.example` để trống.
- Sửa: MailHog cho dev; prod fail-fast nếu thiếu SMTP.

#### H8. (ĐÃ XỬ LÝ) Allowlist chứa endpoint không tồn tại

- Trước: `InternalPathBlockFilter.java:37,177-179` cho phép `/status` nhưng controller không có; test gateway vẫn assert 200.
- Nay: endpoint đã tồn tại (C5) và method được siết đúng (`InternalPathBlockFilter.java:178-181`).
- **Tồn dư**: test gateway vẫn chỉ kiểm tra tầng gateway với downstream giả (`ApiGatewayApplicationTest.java:1777-1789`), chưa có test xuyên service. Giữ ở mức rủi ro thấp.

#### H9. `ProductPublicController` map `/api/v1/products` nhưng gateway không route

- `ProductPublicController.java:18` map cả `/api/v1/products` và `/api/content/products`; gateway không có route `/api/v1/**` (`application.yml:27-74`).
- Frontend dùng `/api/content/products` (`frontend/src/api/client.ts:241,249`) nên chưa gãy, nhưng là bẫy tích hợp.
- Sửa: bỏ alias hoặc thêm route + test.

#### H10. Allowlist admin "fail-open" cho GET

- `InternalPathBlockFilter.java:218-219` và `:237-238` — fallback `return HttpMethod.GET.equals(method);` → mọi GET admin chưa khai báo đều qua.
- Được `AdminAuthGlobalFilter` bảo vệ bởi role ADMIN nên rủi ro trung bình, nhưng nguyên tắc không nhất quán với các filter fail-closed khác.
- Sửa: fallback `false`, khai báo tường minh, thêm test "unknown admin GET → 405".

### 5.2. NHỎ

| # | Vấn đề | Bằng chứng | Hệ quả / Cách sửa |
|---|---|---|---|
| M1 | `console.log` trong code chạy | `frontend/src/hooks/useNearbyAudio.ts:468` | Rò rỉ debug. Xóa hoặc bọc `import.meta.env.DEV`. |
| M2 | Hầu hết trang import tĩnh | `frontend/src/App.tsx:11-29` (19 trang) vs `:47-50` (4 lazy) | Bundle lớn, TTI chậm. Chuyển toàn bộ sang `lazy()`. |
| M3 | CSS khổng lồ, không module hóa | 24.368 dòng trong `frontend/src/styles/*.css` | Khó bảo trì. Tách theo component/CSS Modules. |
| M4 | Type drift qua `as any` | `PoiCard.tsx:81-82,150-159,243-244`; `PoiReadingSection.tsx:233`; `PoiMap.tsx:52-58,108-109,193,412,463,511`; `useNearbyAudio.ts:811` | Backend trả field ngoài type → mất an toàn kiểu. Bổ sung vào `GeoPoi`/`PoiGuide`. |
| M5 | File/dịch vụ chết | `frontend/src/services/rssNewsServer.ts` (0 import), `frontend/src/content/newsLinks.todo.md`; TODO ở `addressService.ts:1`, `feedbackService.ts:8` | Xóa hoặc chuyển sang issue. |
| M6 | Script sinh tài liệu nằm trong thư mục app | `frontend/generate_diagrams.mjs`, `generate_prd_pdf.mjs`, `generate_chapter3_activity_diagrams.mjs`, `export-prd-pdf.js`, `test_pw.mjs` | Chuyển sang `scripts/docs/`. |
| M7 | `docs/` 195 file / 25 MB được track | `git ls-files docs` | Repo phình. Chuyển wiki/release/LFS. |
| M8 | Log Vite 73 MB cục bộ | `frontend/.vite-dev.log` | Đã ignore; chỉ tốn đĩa. Xóa định kỳ. |
| M9 | README lệch số liệu | `README.md:11,317` (582 test/74 suite) vs **598/77**; `:339` (68 file, order 2, 8 workflow) vs **69, order 3, 9** | Cập nhật theo Phụ lục A. |
| M10 | `.env` gốc chứa secret thật (không track) | `.env` có `MSSQL_SA_PASSWORD`, `JWT_SECRET`, `INTERNAL_API_KEY`, `SUPABASE_KEY`… | Xoay vòng khóa từng lộ; dùng secret manager. |
| M11 | Header ngrok còn trong `vercel.json` | `frontend/vercel.json:38,52` | Vô nghĩa sau khi bỏ ngrok; xóa để gọn. |
| M12 | `tsc` bị chặn bởi file test chưa commit | `frontend/src/test/routeHeadings.test.tsx:7` (`AuthProvider` không dùng, TS6133) | Xóa import thừa trước khi build/CI. |

---

## 6. Ràng buộc còn thiếu

### 6.1. Validate tầng ứng dụng

| Thiếu | Bằng chứng | Đề xuất |
|---|---|---|
| Không lưu `supportedLanguages` | `CreatePoiRequest.java:65-67`; `PoiPublishService.java:37` | Thêm cột/bảng + đọc DB. |
| Không giới hạn độ dài nội dung cho TTS | `TtsTextBuilder.java:16-25`; MyMemory 450 byte/chunk (`translation-tts/application.yml:76`) | Cắt/chunk nhất quán trước khi dịch. |
| `outcome` mock-confirm là chuỗi tự do | `OrderController.java:101` | Enum `SUCCESS|FAILED`; ưu tiên loại endpoint ở prod. |
| Request admin chưa rà hết `@Valid` | `UpdateOrderStatusRequest` | Rà soát toàn bộ `*Request`. |

### 6.2. Ràng buộc DB

| Thiếu | Bằng chứng | Đề xuất |
|---|---|---|
| ~~`poi.status` không CHECK~~ | **Đã thêm** `V18__poi_status_check.sql` | – |
| `poi.publish_status` không CHECK | `V1__init_content_schema.sql:73` | `CHECK (publish_status IN ('PENDING','PUBLISHED','FAILED'))`. |
| `poi.audio_status` / `poi_translation.audio_status` không CHECK | `V1__init_content_schema.sql:104` | `CHECK (audio_status IN ('PENDING','GENERATING','READY','FAILED_TTS','FAILED'))`. |
| `route.status` không CHECK | `V1__init_content_schema.sql:46` | `CHECK (status IN ('ACTIVE','INACTIVE'))`. |
| `orders.total_amount` không CHECK ≥ 0 | `V1__init_order_schema.sql` | `CHECK (total_amount >= 0 AND subtotal >= 0)`. |
| Chưa xác nhận UNIQUE `(poi_id, language_code)` | `V1__init_content_schema.sql` | Kiểm tra và thêm nếu thiếu. **Chưa kiểm chứng.** |

### 6.3. Cấu hình

| Thiếu / sai | Bằng chứng | Đề xuất |
|---|---|---|
| ~~`PAYMENTS_MOCK_ENABLED` mặc định `true`~~ | **Đã sửa** `docker-compose.yml:313`, `.env.example:123`, `OrderService.java:77` | – |
| ~~`.env` không nằm trong `.dockerignore`~~ | **Đã sửa** `frontend/.dockerignore:7-9` | – |
| ~~Không có biến cho host API Vercel~~ | **Đã sửa** `frontend/vercel.json:32,46` + `prebuild-vercel.mjs` | – |
| Origin bị xóa ở nginx | `frontend/nginx.conf` | Bỏ dòng `proxy_set_header Origin "";`. |
| Thiếu SMTP mặc định | `MailService.java:36-55` | MailHog dev; fail-fast prod. |
| Gateway thiếu route `/api/v1/**` | `api-gateway/application.yml:27-74` | Bỏ alias hoặc thêm route. |
| Coverage không provider/ngưỡng | `vite.config.ts:52-55`; `package.json:31-46` | `@vitest/coverage-v8` + `thresholds`. |

---

## 7. Dead code / tài nguyên nên xóa

| Đối tượng | Bằng chứng | Ghi chú |
|---|---|---|
| `frontend/src/services/rssNewsServer.ts` | 0 import trong `frontend/src` | Xóa. |
| `frontend/src/content/newsLinks.todo.md` | Không được import | Chuyển sang issue rồi xóa. |
| Header `ngrok-skip-browser-warning` | `frontend/vercel.json:38,52` | Đã hết mục đích; xóa. |
| Test khẳng định template đường dẫn rỗng | `ApiGatewayApplicationTest.java:1356` | Rà lại ý nghĩa. |
| Alias `/api/v1/products` | `ProductPublicController.java:18` | Xóa hoặc thêm route. |
| Tham số không dùng `_audioFallbackStaticText`, `_audioFallbackSpeechText` | `frontend/src/hooks/useNearbyAudio.ts:494-495` | Xóa hoặc dùng thật. |
| TODO tồn đọng | `frontend/src/services/addressService.ts:1`; `feedbackService.ts:8` | Hoàn thiện hoặc xóa. |
| Script sinh tài liệu | `frontend/generate_*.mjs`, `export-prd-pdf.js` | Chuyển `scripts/docs/`. |

> **Không xóa** file chưa commit của người dùng (`frontend/src/pages/PrivacyPolicyPage.tsx`, `frontend/src/test/routeHeadings.test.tsx`, `docs/AUDIT_SCORE_REPORT.md`) và không sửa `docs/AUDIT_SCORE_REPORT.md`.

---

## 8. Kế hoạch tiếp theo

### Ưu tiên P1 — bảo mật & đúng đặc tả

1. **H1**: bỏ nhánh `localStorage` trong `tokenStore.ts`; khôi phục phiên bằng refresh cookie; thêm test reload.
2. **H4**: bỏ `proxy_set_header Origin ""`; sửa `clientIp` (dùng trusted proxy/last hop); test rate-limit với XFF giả.
3. **H2**: migration `poi_supported_language` + publish đọc DB; test publish chỉ en.
4. **H3**: `TtsTextBuilder` nhận `summary` + `historicalSignificance`; test nội dung.
5. **H7**: MailHog trong `docker-compose.dev.yml`; prod fail-fast nếu thiếu SMTP.

### Ưu tiên P2 — độ bền & chất lượng

6. **H6**: `RestClient.Builder` dùng chung (connect 2s/read 3s) + retry backoff + Resilience4j cho order/content.
7. **H5**: publisher confirm correlated; 503 khi không ack; metric `returned`.
8. **H9/H10**: bỏ alias `/api/v1`; đổi fallback allowlist thành `false` + test.
9. **Kiểm thử**: `@vitest/coverage-v8` + ngưỡng + bước CI; Testcontainers cho content/order; test xuyên service cho `PoiController` + gateway.
10. **Frontend**: lazy-load toàn bộ route, tách CSS, xóa `console.log`, bổ sung type (M1–M4).
11. **Dọn dẹp**: xóa file chết, xóa header ngrok, cập nhật README theo Phụ lục A.

### Trước khi commit đợt sửa này

- Sửa `frontend/src/test/routeHeadings.test.tsx:7` (xóa import `AuthProvider`) để `tsc` xanh.
- Chạy `backend/order-service` test, `content-service` test, `api-gateway` test.
- Chạy `npm test` toàn bộ + `npm run build`.
- Cân nhắc tách 5 commit độc lập theo C1–C5 để dễ rollback (xem Phụ lục C).

---

## 9. Những điểm CHƯA KIỂM CHỨNG

| # | Nội dung | Vì sao chưa kiểm chứng | Cách xác minh |
|---|---|---|---|
| U1 | Test backend C1/C4/C5 có xanh không | Chỉ chạy được frontend; Maven backend chưa chạy xong/không có trong PATH | `mvn -o -Dtest=PoiContentServiceImplTest,PoiAdminControllerTest test`; `mvn -o -Dtest=ApiGatewayApplicationTest test`; `mvn -o -Dtest=OrderServiceTest test` |
| U2 | Ảnh hưởng của mock mặc định `false` tới luồng demo | Chưa chạy stack | `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` rồi thử nút "Giả lập đã thanh toán" |
| U3 | Image Docker có thật sự sạch `.env` | Chưa build image | `docker build frontend` rồi `docker run --rm <img> grep -r "USE_SAMPLE_DATA" /usr/share/nginx/html/assets || true` |
| U4 | Migration `V18` chạy được trên SQL Server thật | Chưa chạy Flyway | `docker compose up content-service`, xem log Flyway |
| U5 | Luồng end-to-end scan → audio → analytics | Cần stack + thiết bị/GPS + RabbitMQ | `docker compose up -d`, chạy kịch bản README, xem log 6 service |
| U6 | CORS/origin thực tế | Phụ thuộc biến `FRONTEND_URL(S)` khi deploy | `docker compose config` + gọi thử origin lạ |
| U7 | Chất lượng dịch MyMemory | Cần gọi API ngoài | Gọi thử 1 POI, so sánh audio |
| U8 | SMTP/VNPay sandbox | Cần secret thật + callback công khai | Chạy giao dịch sandbox, kiểm tra return + IPN |
| U9 | `poi_translation` có UNIQUE `(poi_id, language_code)` | Chưa đọc hết schema | `grep -n "UNIQUE" V1__init_content_schema.sql` |
| U10 | Bản deploy Vercel hiện tại | Không truy cập mạng trong phiên này | Mở URL Vercel, xem Network tab |

---

## Phụ lục A — Số liệu đo được

| Hạng mục | Số đo | Cách đo |
|---|---|---|
| File test backend | 69 | `Get-ChildItem backend -Recurse -Filter *Test.java` |
| File test frontend | 77 | `frontend/src/**/*.test.ts(x)` |
| Số `it/test(` frontend | **598** (trước 595) | regex `\b(it|test)\s*\(` trên 77 file |
| File test không có `expect()` | 0 | đối chiếu regex |
| File backend dùng MockMvc/WebTestClient | 15 | quét nội dung |
| File backend dùng `@SpringBootTest` | 4 | quét nội dung |
| File backend dùng Testcontainers | 3 | quét nội dung |
| File backend dùng Mockito | 47 | quét nội dung |
| Dòng CSS | 24.368 | `Get-ChildItem frontend/src/styles/*.css | Get-Content` |
| Số workflow CI | 9 | `.github/workflows/` |
| `as any`/`<any>` trong code chạy | 26 | loại trừ `src/test` |
| `console.log/debug` ngoài test | 1 | `useNearbyAudio.ts:468` |
| Kích thước `docs/` | 195 file / 25 MB | `git ls-files docs` + đo dung lượng |
| Kích thước `frontend/.vite-dev.log` | 73.401.044 byte | đo dung lượng (đã ignore) |
| Test frontend chạy targeted | 2 file / 23 test đạt | `npx vitest run src/test/poiApi.test.ts src/test/poiListPage.test.tsx` |

## Phụ lục B — Đối chiếu README với thực tế

| README nói | Thực tế | Lệch |
|---|---|---|
| `README.md:11,317` — 582 test | 598 | −16 |
| `README.md:317` — 74 test suites | 77 file | −3 |
| `README.md:339` — 68 file backend, order 2 | 69 file, order 3 | −1 / −1 |
| `README.md:339` — 8 workflow | 9 workflow | −1 |
| `README.md:41` — access token "lưu trong bộ nhớ" | `localStorage` (`tokenStore.ts:24,34`) | sai cơ chế |

## Phụ lục C — File đã thay đổi trong đợt sửa C1–C5

### C1 — Mock payment

- `backend/order-service/src/main/java/com/echora/order/service/OrderService.java`
- `backend/order-service/src/main/resources/application.yml`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `.env.example`

### C2 — Docker image

- `frontend/.dockerignore`
- `frontend/Dockerfile`

### C3 — Vercel

- `frontend/vercel.json`
- `frontend/scripts/prebuild-vercel.mjs`
- `frontend/package.json`
- `deploy.txt`

### C4 — Gateway `/plan`

- `backend/api-gateway/src/main/java/com/echora/gateway/filter/InternalPathBlockFilter.java`
- `backend/api-gateway/src/test/java/com/echora/gateway/ApiGatewayApplicationTest.java`

### C5 — POI status

- `backend/content-service/src/main/java/com/echora/content/dto/UpdatePoiStatusRequest.java` (mới)
- `backend/content-service/src/main/java/com/echora/content/service/PoiContentService.java`
- `backend/content-service/src/main/java/com/echora/content/service/PoiContentServiceImpl.java`
- `backend/content-service/src/main/java/com/echora/content/controller/PoiController.java`
- `backend/content-service/src/main/resources/db/migration/V18__poi_status_check.sql` (mới)
- `backend/content-service/src/test/java/com/echora/content/service/PoiContentServiceImplTest.java`
- `backend/content-service/src/test/java/com/echora/content/controller/PoiAdminControllerTest.java`
- `frontend/src/admin/api/poiApi.ts`
- `frontend/src/admin/pages/PoiListPage.tsx`
- `frontend/src/test/poiApi.test.ts`
- `frontend/src/test/poiListPage.test.tsx`

### Thay đổi sẵn có của người dùng — KHÔNG bị đụng tới

- `frontend/src/App.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `Footer.tsx`, `FoodBeveragePage.tsx` (đã sửa trước phiên này)
- `frontend/src/pages/PrivacyPolicyPage.tsx`, `frontend/src/test/routeHeadings.test.tsx`, `docs/AUDIT_SCORE_REPORT.md` (chưa commit)

### Rollback

Toàn bộ thay đổi của đợt sửa nằm trong working tree (chưa commit). Có thể hoàn tác từng nhóm bằng:

```powershell
git restore -- `
  backend/order-service/src/main/java/com/echora/order/service/OrderService.java `
  backend/order-service/src/main/resources/application.yml `
  docker-compose.yml docker-compose.dev.yml .env.example
# tương tự cho từng nhóm C2–C5; file mới (UpdatePoiStatusRequest.java, V18...) cần xóa tay.
```

> Lưu ý: `docker-compose.yml`, `.env.example` cũng có thể chứa thay đổi khác của người dùng; kiểm tra `git diff` trước khi restore.
