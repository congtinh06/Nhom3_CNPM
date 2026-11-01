# BÁO CÁO AUDIT VÀ CHẤM ĐIỂM — ECHORA / SAIGONVOICE

## 0. Thông tin audit

- Ngày audit: 2026-10-30.
- Repository: `F:\Nhom3_CNPM` (GitHub `congtinh06/Nhom3_CNPM`, hiện là repository **private**).
- Nhánh: `main`; HEAD: `25647d8` — `feat: heartbeat hien dien online, QR chuyen tai khoan va hoan thien trai nghiem quet ma`.
- Phạm vi: audit read-only toàn bộ frontend, backend, migration, Docker Compose, workflow CI và tài liệu. Không sửa code, không commit, không stage, không chạy migration, không gọi `docker compose down`, không gửi POST/PATCH/DELETE tới endpoint đang chạy.
- Không đọc hoặc in giá trị trong `.env` thật. Chỉ kiểm tra sự tồn tại/để trống của khóa trong `.env.example`, và đọc các giá trị đã bị công bố công khai trong tài liệu.
- Working tree tại thời điểm audit có 3 file đang sửa của người dùng, không liên quan tới báo cáo này: `backend/content-service/src/main/java/com/echora/content/service/PoiContentServiceImpl.java`, `frontend/src/pages/NearbyPage.tsx`, `frontend/src/pages/PaymentResultPage.tsx`. Các file này được giữ nguyên.
- Báo cáo này là file untracked, không được `git add`.

### Cách kiểm chứng

- Đọc mã nguồn, migration, cấu hình bằng công cụ đọc file.
- Chạy các kiểm tra an toàn: `npx tsc --noEmit`, `npm test`, `npm run build`.
- Kiểm tra CI bằng `gh run list`, `gh run view --log-failed`.
- Gọi GET read-only tới `http://localhost:18080` và tunnel công khai.
- Truy vấn aggregate read-only trên SQL Server qua `docker exec` với file SQL tạm; không in mật khẩu.
- Chạy Playwright headless với 24 route × 4 viewport: desktop 1440×900, tablet 768×1024, iPhone 12 390×844, Android 360×800. Tổng 96 lượt tải trang.
- Ảnh chụp và dữ liệu Playwright nằm tại `C:\Users\LENOVO\AppData\Local\Temp\opencode\` (`pw-audit.json`, `shot-*.png`).

### Quy ước confidence

- **High**: có bằng chứng trực tiếp từ file/dòng, log, HTTP hoặc trình duyệt.
- **Medium**: có bằng chứng gián tiếp, cần thêm một bước kiểm tra để khẳng định tác động.
- **Low**: chưa đủ bằng chứng; **không dùng để tính điểm**, chỉ ghi nhận trong mục UNVERIFIED.

## 1. Tóm tắt điều hành

**Tổng điểm: 5,25/8,00 (65,6%).**

Đây là một đồ án có độ phủ chức năng và kiến trúc tốt hơn mức trung bình: 6 service nghiệp vụ + gateway, OpenFeign, RabbitMQ, Flyway, phân quyền audio theo ngôn ngữ, thanh toán, QR, admin, 579 test frontend chạy pass local và bộ tài liệu sơ đồ khá đầy đủ. Tuy nhiên, điểm bị kéo xuống mạnh bởi các lỗi ảnh hưởng trực tiếp đến buổi demo và tính an toàn:

1. **Khởi động lạnh và race với RabbitMQ**: content-service mất 255,6 giây và translation-tts-service mất 205,1 giây để start; lần gọi đầu `/api/content/pois` bị gateway trả **504 sau 5,08 giây**; analytics cũng từng bị 504. Đây là lỗi có thể làm giảng viên thấy hệ thống hỏng ngay lần bấm đầu tiên.
2. **Thông tin xác thực bị công bố trong README**: mật khẩu admin, mật khẩu các database, RabbitMQ và hash secret VNPAY sandbox nằm trong tài liệu; đồng thời compose còn hard-code cookie Erlang và có mật khẩu test mặc định. Repo đang private nên giảm mức độ lộ, nhưng đây vẫn là lỗi bảo mật phải xử lý trước khi nộp/bàn giao.
3. **Dữ liệu và audio chưa đủ cho kịch bản đa ngôn ngữ**: chỉ 3/8 POI có audio tiếng Việt `READY`, 3/8 tiếng Anh `READY`, 2 POI `FAILED_TTS`; một POI rác `id=40003`, mã `bb`, tên `bbbbb`, tọa độ 25,25 vẫn xuất hiện trong danh sách public.
4. **CI đang đỏ tại HEAD** (`Frontend CI` fail ở `header.test.tsx:187`), dù chạy local toàn bộ 579 test lại pass. Đây là rủi ro release gate, không phải bằng chứng rằng test local sai.
5. **Triển khai phụ thuộc một tunnel ngrok cá nhân hard-code trong `vercel.json`**, không có registry, không có job deploy, không có domain ổn định.

**Số lượng phát hiện: 2 BLOCKER, 8 HIGH, 9 MEDIUM.** Không có finding nào dùng confidence Low để tính điểm.

## 2. Bảng điểm A–H

| Tiêu chí | Nội dung | Điểm | Thang | Tỷ lệ |
|---|---|---:|---:|---:|
| A | Chức năng và độ phủ nghiệp vụ | 1,10 | 1,50 | 73,3% |
| B | Kiến trúc, tích hợp và độ tin cậy | 1,05 | 1,50 | 70,0% |
| C | Chất lượng mã và kiểm thử | 0,90 | 1,50 | 60,0% |
| D | Bảo mật | 0,55 | 1,00 | 55,0% |
| E | UX/UI và khả năng tiếp cận | 0,65 | 1,00 | 65,0% |
| F | Tài liệu | 0,60 | 0,75 | 80,0% |
| G | CI/CD và quy trình release | 0,25 | 0,50 | 50,0% |
| H | Triển khai và vận hành | 0,15 | 0,25 | 60,0% |
| **Tổng** |  | **5,25** | **8,00** | **65,6%** |

## 3. Chi tiết theo tiêu chí

### A. Chức năng và độ phủ nghiệp vụ — 1,10/1,50

**Điểm mạnh**

- Có đủ nhóm chức năng chính: trang chủ, điểm đến, thuyết minh, ẩm thực, quà lưu niệm, gần tôi, tin tức, hướng dẫn, liên hệ, nâng cấp Premium, tài khoản, đăng nhập/đăng ký, đặt lại mật khẩu, xác thực email, đơn hàng, thanh toán, quét QR và khu vực quản trị.
- 24 route public và 24 route admin được khai báo trong `frontend/src/App.tsx` và `frontend/src/admin/AdminRoutes.tsx`.
- Luồng audio có phân quyền thật: anonymous gọi `GET /api/content/pois/1?lang=en` bị **403**; audio tiếng Nhật không token bị **401**; audio tiếng Việt tải được **200**, `audio/mpeg`, 438.336 byte.
- API public hoạt động: `/api/content/pois/guide` trả 200 và 8 POI; `/api/content/products` trả 200; `/api/location/nearby?lat=...&lng=...&radius=1000` trả 200 với 5 POI.
- Admin API không có token trả 401; internal API path trả 404; tên file audio không hợp lệ trả 404.

**Điểm trừ**

- **Audio đa ngôn ngữ chưa hoàn chỉnh.** Truy vấn read-only trên `echora_content_db` cho thấy:
  - `vi`: 3 READY, 3 PENDING, 2 FAILED_TTS.
  - `en`: 3 READY, 5 PENDING.
  - `ja`: 6 READY, 2 FAILED_TTS.
  - `ko`: 6 READY, 2 FAILED_TTS.
  - POI 1–3 còn `en` và `vi` ở trạng thái `PENDING`; POI 30002 và 30003 có `FAILED_TTS`.
  - Seed `backend/content-service/src/main/resources/db/migration/R__seed_demo.sql` dòng 166–263 đặt audio ban đầu là `PENDING`.
- Frontend chỉ dùng audio remote khi `audioStatusByLanguage[lang] === 'READY'` và có URL; nếu không sẽ rơi về `speechSynthesis` của trình duyệt (`frontend/src/hooks/useNearbyAudio.ts` dòng 59–89). Vì vậy demo tiếng Anh/Nhật/Hàn có thể nghe bằng giọng máy, không phải audio Edge-TTS đã sinh.
- **POI rác trong dữ liệu public**: `GET /api/content/pois` và `/api/content/pois/guide` đều trả 8 bản ghi, trong đó `id=40003`, `code=bb`, `qrToken=bb`, `name=bbbbb`, `latitude=25.0`, `longitude=25.0`, `zoneCode=CHO_LON`, có audio tiếng Việt `READY`. Đây là dữ liệu test bị lọt vào danh sách public.
- **Lần gọi đầu bị 504**: `GET /api/content/pois` lần đầu trả **504 sau 5,08 giây**, lần sau trả 200 sau khoảng 0,25 giây. Gateway log ghi `Response took longer than timeout: PT5S` tại `2026-10-30T07:49:55`.
- **Tin tức và một phần dữ liệu gần tôi đang dùng fixture tĩnh**, không phải dữ liệu API. `frontend/src/services/articleService.ts` dòng 64–69 rơi về fixture khi API lỗi; `frontend/src/api/news.ts` dòng 4 và 63–65 cũng dùng fixture; `deploy.txt` dòng 8 ghi rõ “Chốt news: dùng fixtures”. Điều này giúp demo không trắng trang nhưng tạo cảm giác dữ liệu giả và dễ lệch với backend.

**Kết luận:** chức năng rộng, luồng chính có thật, nhưng chất lượng dữ liệu và độ sẵn sàng của audio chưa đủ để gọi là hoàn thiện. Confidence: **High**.

### B. Kiến trúc, tích hợp và độ tin cậy — 1,05/1,50

**Điểm mạnh**

- Kiến trúc microservice rõ: auth, content, location, translation-tts, analytics, order, api-gateway; frontend riêng; SQL Server dùng chung instance với 5 database độc lập; RabbitMQ làm broker.
- Có OpenFeign thật trong location-service và analytics-service, có `X-Internal-Api-Key`, `Retryer.NEVER_RETRY` để tránh retry mù.
- Có chuỗi RabbitMQ producer/consumer: `PoiEventPublisher`, `PoiEventListener`, `PoiAudioEventListener`, DLQ.
- Pipeline dịch/TTS có idempotency theo `contentHash`, xử lý `DataIntegrityViolationException` bằng cách đọc lại bản ghi; lỗi được cô lập theo từng ngôn ngữ, có `FAILED_TTS`.
- Gateway có `GatewayExceptionHandler` map lỗi kết nối thành 503, timeout thành 504; có strip header không tin cậy, chặn internal path, rate limit analytics.
- Có `TtsTextBuilder`, `TranslationGlossary`; audio streaming có range request và regex tên file chặt.

**Điểm trừ**

- **Race khởi động với RabbitMQ.** `docker-compose.yml` dòng 20–25 dùng `rabbitmqctl status` làm healthcheck; healthcheck này có thể pass trước khi AMQP listener sẵn sàng. Log thực tế:
  - translation-tts-service: `Started ... in 205.1 seconds` lúc `2026-10-30T07:28:14`; trước và ngay sau đó liên tục `Connection refused`.
  - content-service: `Started ... in 255.612 seconds` lúc `2026-10-30T07:29:02`; trước và ngay sau đó cũng `Connection refused`.
  - `depends_on: rabbitmq: condition: service_healthy` vì vậy không bảo đảm được thứ tự thực sự.
- Gateway mặc định `response-timeout: 5s` cho content (`backend/api-gateway/src/main/resources/application.yml` dòng 10–11), trong khi service có thể mất hơn 200 giây để start. Hệ quả là 504 ở lần gọi đầu, và analytics cũng từng bị 504 (`2026-10-30T07:53:36`).
- **Rate limit analytics dùng địa chỉ socket, không dùng danh tính tin cậy.** `AnalyticsRateLimitGlobalFilter.java` dòng 31–32 đặt 60 request/phút; dòng 56 cố ý bỏ qua `X-Forwarded-For`; dòng 85–87 lấy `remoteAddress`. Khi chạy sau nginx/tunnel, mọi client cùng một IP nên dễ bị 429. Audit trình duyệt ghi nhận **5 lần 429** trên `POST /api/analytics/events`; DLQ `analytics.event.dlq` còn **2 message**.
- Không thấy tracing phân tán, metrics Prometheus hay structured logging tập trung trong `pom.xml`/`application.yml`; chỉ có log ứng dụng. Điều này làm khó truy vết lỗi liên service.
- `order-service` không có workflow CI riêng; các thay đổi order không được kiểm tra tự động.

**Kết luận:** thiết kế kiến trúc là điểm mạnh thật, nhưng vận hành và khả năng quan sát chưa theo kịp thiết kế. Confidence: **High**.

### C. Chất lượng mã và kiểm thử — 0,90/1,50

**Điểm mạnh**

- Backend: 358 file Java main, khoảng 19.540 dòng; 66 file test, khoảng 11.711 dòng.
- Phân bố test backend: analytics 12, api-gateway 2, auth 13, content 17, location 4, order 2, translation-tts 16.
- Frontend: 320 file `.ts/.tsx`, khoảng 61.077 dòng, trong đó 73 file test, khoảng 12.993 dòng.
- `npx tsc --noEmit` sạch.
- `npm test` pass **73 file / 579 test** (khoảng 434 giây).
- `npm run build` thành công.
- Có test riêng cho audio player, nearby page, header, payment, auth và nhiều component.

**Điểm trừ**

- **CI đỏ tại HEAD.** `gh run list` cho thấy run `40818656024` — `Frontend CI` — `failure` tại `25647d8`. Log fail ở `src/test/header.test.tsx:187`, `getByRole('menu', ...)` không tìm thấy. Chạy riêng `header.test.tsx` và chạy toàn bộ suite ở local lại pass; đây là dấu hiệu flaky/order-dependent hoặc khác biệt môi trường, nhưng chưa được sửa tại HEAD.
- **Không có lint/format gate.** `frontend/package.json` chỉ có `dev`, `build`, `preview`, `test`; không có ESLint/Prettier, không có script `lint`.
- **Bundle lớn.** `npm run build` tạo main chunk **1.134,59 kB (gzip 384,13 kB)** và cảnh báo vượt 500 kB. Chưa có code splitting theo route.
- **Độ phủ test không được đo.** Không thấy cấu hình coverage threshold hay báo cáo coverage trong CI. 579 test là con số tốt nhưng không chứng minh được độ phủ của các nhánh lỗi, thanh toán, admin và audio.
- **Test backend chưa được xác minh trong audit này** vì không chạy Maven; chỉ đếm file. CI backend xanh cho các service được trigger, nhưng không đủ để kết luận toàn bộ 66 file test đều chạy đúng ở HEAD.
- Frontend rất lớn so với phạm vi đồ án; nhiều page/component và inline dictionary làm chi phí bảo trì cao.

**Kết luận:** nỗ lực kiểm thử đáng ghi nhận, nhưng release gate đang đỏ và thiếu lint/coverage. Confidence: **High** cho CI, **High** cho test local, **Medium** cho chất lượng test backend.

### D. Bảo mật — 0,55/1,00

**Điểm mạnh**

- Refresh cookie là `HttpOnly`, mặc định `SameSite=Strict`, có biến `REFRESH_COOKIE_SECURE`.
- CORS dùng danh sách origin tường minh, không dùng `*` với `allowCredentials=true` (`CorsConfig.java` dòng 46–61).
- Gateway có strip header không tin cậy, chặn internal path, rate limit analytics, mapping 503/504.
- Admin path được bảo vệ tập trung ở `AdminAuthGlobalFilter` với các prefix `/api/admin`, `/api/content/admin`, `/api/auth/admin`, `/api/analytics/summary`.
- Audio premium được kiểm tra thật: anonymous `?lang=en` bị 403; audio ja không token bị 401; internal API path bị 404.
- `git log -S "AIza"` và `git log -S "ghp_"` không tìm thấy API key/ GitHub token bị commit.

**Điểm trừ**

- **BLOCKER: thông tin xác thực bị công bố trong README.** `README.md` dòng 271–303 chứa mật khẩu admin, mật khẩu user mẫu, mật khẩu `sa`, mật khẩu 5 database, mật khẩu RabbitMQ và hash secret VNPAY sandbox. Báo cáo này không lặp lại giá trị, nhưng việc tồn tại các giá trị đó trong tài liệu là bằng chứng trực tiếp. `deploy.txt` dòng 15 cũng yêu cầu đổi toàn bộ khóa/mật khẩu mặc định, tức nhóm đã biết rủi ro nhưng chưa xử lý.
- `docker-compose.yml` dòng 17 hard-code `RABBITMQ_ERLANG_COOKIE`; dòng 278 có mật khẩu test mặc định nếu biến môi trường không được đặt.
- `.env.example` có 56 khóa; các khóa `JWT_SECRET`, `INTERNAL_API_KEY`, toàn bộ mật khẩu DB, `ADMIN_SEED_PASSWORD`, `SEED_TEST_USER_PASSWORD`, `VNPAY_HASH_SECRET` đều có giá trị không rỗng. Đây là file mẫu, nhưng giá trị mẫu không nên trùng với giá trị dùng thật.
- **Không có security header ở nginx.** `frontend/nginx.conf` dòng 8–45 chỉ reverse proxy, không có `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` hoặc HSTS. `frontend/index.html` cũng không có CSP meta.
- **Tunnel công khai không có lớp hạn chế IP.** Tunnel chỉ trỏ tới gateway 18080; admin API vẫn 401 nếu không có token, nhưng bề mặt tấn công vẫn lớn hơn cần thiết cho một buổi demo.
- Repo hiện private là yếu tố giảm nhẹ, nhưng không làm thay đổi việc thông tin đã nằm trong lịch sử/tài liệu và có thể bị chia sẻ khi nộp.

**Kết luận:** các kiểm soát runtime khá tốt, nhưng quản lý bí mật và cấu hình triển khai chưa đạt. Confidence: **High** cho việc lộ tài liệu, **High** cho thiếu security header, **Medium** cho tác động thực tế của tunnel.

### E. UX/UI và khả năng tiếp cận — 0,65/1,00

**Điểm mạnh**

- 96 lượt tải trang không có horizontal overflow.
- Không phát hiện ảnh hỏng; audit không ghi nhận ảnh thiếu `alt`.
- Trang 404 có giao diện thay vì trắng trang.
- Có responsive ở 4 kích thước; bố cục desktop/tablet/mobile nhìn chung giữ được.
- Có `lang="vi"`, title, meta description, favicon SVG inline.

**Điểm trừ**

- **Thiếu `h1` ở 5 route**: `/dat-lai-mat-khau`, `/xac-thuc-email`, `/quet-ma`, `/qr/qr-buu-dien-01`, `/khong-ton-tai-abc`.
- **Touch target nhỏ**: mobile có 14–29 phần tử tương tác < 36 px mỗi trang; desktop 19–42; trang admin chỉ 1. Con số này gồm cả link nhỏ, nhưng vẫn là vấn đề usability trên điện thoại.
- **Hero mobile bị cắt/chồng chữ** ở `/diem-du-lich` tại 390×844: dòng credit chồng lên đoạn văn. Bằng chứng ảnh `shot-mob-nearby.png` và `shot-mob-home.png` trong thư mục tạm.
- **Console noise**: 83 lần `401 /api/auth/refresh` khi người dùng anonymous, do cơ chế refresh tự động chạy ở mỗi page load; 5 lần `429` analytics. Người dùng không thấy trực tiếp, nhưng log nhiễu và tạo tải không cần thiết.
- **i18n chưa tập trung**: `NearbyPage.tsx` dòng 144–174 hard-code 4 ngôn ngữ cho `PREMIUM_GATE_COPY`; các page khác cũng có chuỗi tiếng Việt/tiếng Anh rải rác. Khó bảo trì và dễ lệch khi thêm ngôn ngữ.
- **404 trả HTTP 200**: `/khong-ton-tai-abc` hiển thị trang 404 nhưng status là 200, không tốt cho SEO/monitoring.

**Kết luận:** giao diện khá hoàn thiện về mặt hình ảnh, nhưng accessibility và i18n chưa đạt mức “sẵn sàng bàn giao”. Confidence: **High**.

### F. Tài liệu — 0,60/0,75

**Điểm mạnh**

- `README.md` dài 343 dòng (267 dòng có nội dung), có quick start, kiến trúc, cổng, tài khoản mẫu, troubleshooting.
- Có `docs/PRD.md` và `docs/PRD_Echora.md`.
- `docs/diagrams` có 16 file nguồn `.puml` và 6 file `.mmd`: kiến trúc, ERD, domain model, use case, sequence, activity, state, flow.
- `docs` có khoảng 190 file tài liệu/ảnh (chưa tính báo cáo này), gồm nhiều sơ đồ và ảnh minh họa.
- `frontend/public/privacy.html` và `frontend/public/terms.html` tồn tại.

**Điểm trừ**

- **README lỗi thời về test**: dòng 315 ghi “13 test suites (62 unit & integration tests)”, trong khi thực tế local là 73 file / 579 test. Con số này không khớp và làm giảm độ tin cậy của tài liệu.
- **Không có API contract/OpenAPI**: không tìm thấy `springdoc`, `swagger` hoặc file OpenAPI trong backend. Việc đối chiếu FE–BE phải đọc controller thủ công.
- README chứa thông tin xác thực (đã nêu ở mục D), biến tài liệu thành nguồn rủi ro.
- Một số tài liệu mô tả trạng thái mong muốn nhưng không ghi rõ phần nào là fixture/demo, phần nào là backend thật (đặc biệt news và audio).
- Không có tài liệu vận hành production: backup, rotate secret, monitoring, rollback, domain/HTTPS.

**Kết luận:** tài liệu thiết kế là điểm mạnh, nhưng tài liệu vận hành và API còn thiếu; README cần cập nhật trước khi nộp. Confidence: **High**.

### G. CI/CD và quy trình release — 0,25/0,50

**Điểm mạnh**

- Có 7 workflow: auth, content, analytics, location, translation-tts, api-gateway, frontend.
- 6 workflow backend có path filter, Maven cache, `ubuntu-24.04`, `actions/checkout@v6`.
- Có kiểm tra build/test cơ bản cho từng service.

**Điểm trừ**

- **Không có CD**: không có `ghcr`, `docker push`, `deploy`, `ssh`, `vercel` trong bất kỳ workflow nào. Pipeline dừng ở CI.
- **Frontend CI yếu nhất**: `frontend-ci.yml` dòng 19–27 dùng `actions/checkout@v4`, Node 20, `npm install` thay vì `npm ci`, không có path filter, không có cache. GitHub đã cảnh báo Node 20 deprecated.
- **Thiếu workflow order-service** dù service có trong compose và có 2 file test.
- **CI đỏ tại HEAD** (xem mục C), nên trên thực tế release gate không xanh.
- Không có job kiểm tra migration, không có job build Docker image, không có smoke test sau build.

**Kết luận:** có nền CI nhưng chưa đủ để gọi là quy trình release. Confidence: **High**.

### H. Triển khai và vận hành — 0,15/0,25

**Điểm mạnh**

- `docker-compose.yml` mô tả 10 container: frontend, api-gateway, auth, content, location, translation-tts, analytics, order, rabbitmq, mssql.
- Có healthcheck cho nhiều service, volume cho DB/audio, mạng nội bộ `echora-net`.
- Chỉ publish gateway 18080, frontend 8088; MSSQL và RabbitMQ bind `127.0.0.1`.
- Có `docker-compose.dev.yml`, 8 Dockerfile.
- Frontend có `nginx.conf` proxy `/api/` và `/img/products/`, SPA fallback.

**Điểm trừ**

- **Deploy frontend phụ thuộc tunnel ngrok hard-code**: `frontend/vercel.json` dòng 2–38 rewrite `/api/(.*)` và `/img/products/(.*)` tới `https://affection-smokiness-watch.ngrok-free.dev`, kèm header `ngrok-skip-browser-warning`. Tunnel hiện trả health 200 và `/api/content/pois` 200, nhưng đây là URL tạm, có thể hết hạn/đổi và không phù hợp làm địa chỉ nộp bài.
- **Không có registry/CD**: không có image tag cố định, không có job deploy, không có rollback.
- **Không có SMTP**: `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD` để trống trong `.env.example`; luồng xác thực email không thể demo trọn vẹn nếu không có tài khoản đã xác thực sẵn.
- **Audio storage chỉ local volume**: `AUDIO_PUBLIC_BASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY` để trống; audio không bền ngoài máy và không có CDN.
- `deploy.txt` là checklist thủ công, không phải script; các bước “đổi hết khóa/mật khẩu” và “thêm domain Vercel vào FRONTEND_URLS” vẫn là việc làm tay.
- Chưa có backup/restore, chưa có monitoring, chưa có log aggregation.

**Kết luận:** chạy được trên máy local và có thể demo qua tunnel, nhưng chưa phải triển khai ổn định. Confidence: **High**.

## 4. Bảng trang desktop và mobile

### 4.1. Phương pháp

- 24 route public/admin khả dụng được tải bằng Playwright headless.
- Viewport: desktop 1440×900, tablet 768×1024, iPhone 12 390×844, Android 360×800.
- Cột “tap” là số phần tử tương tác có ít nhất một chiều < 36 px (không phải tiêu chuẩn WCAG đầy đủ, chỉ là chỉ báo).
- Tất cả route đều trả HTTP 200; không có overflow ngang; 0 ảnh hỏng.

### 4.2. Bảng tổng hợp

| Trang | Desktop: HTTP / H1 / tap / console | Mobile: HTTP / H1 / tap / console | Ghi chú |
|---|---|---|---|
| `/` | 200 / Có / 21 / 0 | 200 / Có / 16 / 0 |  |
| `/diem-du-lich` | 200 / Có / 23 / 0 | 200 / Có / 18 / 1 | Hero mobile bị cắt/chồng chữ |
| `/thuyet-minh` | 200 / Có / 23 / 0 | 200 / Có / 18 / 1 |  |
| `/am-thuc` | 200 / Có / 42 / 0 | 200 / Có / 21 / 1 | Nhiều tap target nhỏ |
| `/qua-luu-niem` | 200 / Có / 42 / 1 | 200 / Có / 29 / 1 |  |
| `/gan-toi` | 200 / Có / 23 / 1 | 200 / Có / 18 / 1 |  |
| `/tin-tuc` | 200 / Có / 19 / 1 | 200 / Có / 14 / 1 |  |
| `/tin-tuc/cho-ben-thanh-di-cho-nhu-nguoi-sai-gon` | 200 / Có / 24 / 1 | 200 / Có / 19 / 1 |  |
| `/am-thuc/mo-hinh-dinh-doc-lap` | 200 / Có / 25 / 1 | 200 / Có / 20 / 1 |  |
| `/huong-dan` | 200 / Có / 19 / 1 | 200 / Có / 14 / 1 |  |
| `/lien-he` | 200 / Có / 25 / 1 | 200 / Có / 20 / 1 |  |
| `/nang-cap` | 200 / Có / 20 / 1 | 200 / Có / 15 / 1 |  |
| `/tai-khoan` | 200 / Có / 26 / 1 | 200 / Có / 22 / 1 |  |
| `/dang-ky` | 200 / Có / 25 / 0 | 200 / Có / 20 / 1 |  |
| `/dang-nhap` | 200 / Có / 26 / 0 | 200 / Có / 22 / 1 |  |
| `/dat-lai-mat-khau` | 200 / Không / 22 / 1 | 200 / Không / 17 / 2 | Thiếu `h1` |
| `/xac-thuc-email` | 200 / Không / 20 / 1 | 200 / Không / 15 / 2 | Thiếu `h1` |
| `/don-hang` | 200 / Có / 26 / 1 | 200 / Có / 24 / 2 |  |
| `/thanh-toan` | 200 / Có / 26 / 1 | 200 / Có / 22 / 2 |  |
| `/quet-ma` | 200 / Không / 21 / 1 | 200 / Không / 16 / 2 | Thiếu `h1` |
| `/qr/qr-buu-dien-01` | 200 / Không / 21 / 1 | 200 / Không / 19 / 1 | Thiếu `h1` |
| `/khong-ton-tai-abc` | 200 / Không / 19 / 1 | 200 / Không / 14 / 1 | Trang 404 nhưng HTTP 200 |
| `/quan-tri/dang-nhap` | 200 / Có / 1 / 1 | 200 / Có / 1 / 1 |  |
| `/quan-tri` | 200 / Có / 1 / 1 | 200 / Có / 1 / 1 |  |

### 4.3. Ghi chú từ Playwright

- Tổng console error: **83 lần 401** trên `/api/auth/refresh` và **5 lần 429** trên `POST /api/analytics/events`.
- Không có page error (uncaught exception) trong 96 lượt tải.
- Các route admin khác ngoài `/quan-tri` và `/quan-tri/dang-nhap` không được audit vì cần đăng nhập; xem UNVERIFIED.
- Ảnh chụp chính: `shot-desk-home.png`, `shot-desk-nearby.png`, `shot-mob-home.png`, `shot-mob-nearby.png`, `shot-mob-nearby-en.png`, `shot-mob-news.png`, `shot-mob-amthuc.png`, `shot-mob-scan.png`, `shot-en-scrolled.png`.

## 5. Đối chiếu FE–BE và cấu hình

### 5.1. Những điểm khớp

- FE gọi đúng các path chính:
  - `GET /api/content/pois/guide` (`frontend/src/api/client.ts` dòng 115–121).
  - `GET /api/content/pois/{id}?lang=...` (`client.ts` dòng 132–137).
  - `GET /api/location/nearby?lat=&lng=&radius=` (`client.ts` dòng 148–158).
  - `POST /api/analytics/events` (`client.ts` dòng 204–206).
  - `POST /api/orders`, `/api/orders/premium`, `/api/orders/poi` (`frontend/src/services/orderService.ts` dòng 126–162).
- Backend dùng đúng `radius` (mét) cho `/api/location/nearby`, đúng `lang` cho POI detail; không thấy lệch tên tham số cơ bản.
- Gateway route cho auth, content, location, tts, analytics, orders, admin orders và ảnh sản phẩm đều có trong `backend/api-gateway/src/main/resources/application.yml`.

### 5.2. Lệch ngữ nghĩa và cấu hình

| # | Loại | Bằng chứng | Tác động | Confidence |
|---|---|---|---|---|
| 1 | Dữ liệu dịch | `/api/content/pois/guide` anonymous chỉ trả translation `vi`; FE cần `translations[en/ja/ko]` để hiển thị | FE lấy bù từ `nearbyPois.json`; nội dung EN trên UI không hoàn toàn từ DB | High |
| 2 | Trạng thái audio | Seed đặt `PENDING`; FE chỉ phát remote khi `READY` | Nhiều POI rơi về `speechSynthesis`, không phải audio đã sinh | High |
| 3 | Nguồn news | `articleService.ts` dòng 64–69 và `news.ts` dòng 63–65 fallback fixture | Khi API lỗi, UI vẫn hiển thị bài mẫu; dễ tưởng là dữ liệu thật | High |
| 4 | Nguồn nearby | `NearbyPage.tsx` dòng 271–306 fallback `nearbyPois.json` | Danh sách có thể khác DB; audio fixture là ambience `.ogg`, không phải narration | High |
| 5 | Timeout | Gateway 5 s; service cold start 205–255 s; analytics có request 3,5 s | 504 ở lần gọi đầu và khi tải | High |
| 6 | Deploy | `vercel.json` rewrite cứng sang ngrok; `nginx.conf` proxy nội bộ | Hai topology khác nhau; tunnel hết hạn là FE mất API | High |
| 7 | CORS/cookie | `CorsConfig` origin tường minh; cookie `SameSite=Strict`; Vercel dùng rewrite same-origin | Nếu gọi API trực tiếp cross-origin, cookie refresh có thể không được gửi | Medium |
| 8 | Storage audio | `AUDIO_PUBLIC_BASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY` trống | Audio chỉ nằm volume local; không có CDN/độ bền | High |
| 9 | Email/OAuth | `MAIL_HOST/USERNAME/PASSWORD` trống; `GOOGLE_CLIENT_ID` có trong `.env.example` | Luồng xác thực email không demo được nếu không có SMTP; OAuth phụ thuộc cấu hình Google | High |

**Kết luận:** không có sai lệch path/param nghiêm trọng; vấn đề chính là **dữ liệu, trạng thái audio, fallback tĩnh và cấu hình triển khai**. Đây là loại lỗi khó thấy khi demo một máy nhưng dễ lộ khi giảng viên hỏi “dữ liệu này từ đâu”.

## 6. Phát hiện và kế hoạch sửa

### 6.1. Định nghĩa severity

- **BLOCKER**: phải sửa trước khi demo/nộp; có thể làm hỏng buổi demo hoặc lộ dữ liệu.
- **HIGH**: phải sửa trước demo hoặc phải công bố rõ là giới hạn đã biết.
- **MEDIUM**: nên sửa nếu còn thời gian; ảnh hưởng chất lượng/bảo trì nhưng không chặn demo.

### 6.2. Danh sách phát hiện

| ID | Severity | Tiêu chí | Phát hiện | Bằng chứng | Confidence |
|---|---|---|---|---|---|
| BLK-01 | BLOCKER | D | Thông tin xác thực và mật khẩu mặc định bị công bố trong README; compose hard-code cookie Erlang và có mật khẩu test mặc định | `README.md` 271–303; `docker-compose.yml` 17, 278; `deploy.txt` 15 | High |
| BLK-02 | BLOCKER | B | Cold start/race RabbitMQ làm service mất 205–255 giây; lần gọi đầu bị 504 | `docker logs` content/translation; gateway log 07:49:55; `application.yml` 10–11; `docker-compose.yml` 20–25, 136–146 | High |
| HIGH-01 | HIGH | H | Frontend deploy phụ thuộc tunnel ngrok hard-code, không có domain/registry/CD ổn định | `frontend/vercel.json` 2–38; `deploy.txt` 3–13; không có `ghcr/deploy` trong 7 workflow | High |
| HIGH-02 | HIGH | A | POI rác `id=40003` (`bb`/`bbbbb`, 25,25) xuất hiện trong public list | `GET /api/content/pois` và `/guide` trả 8 bản ghi; bản ghi 40003 có audio vi READY | High |
| HIGH-03 | HIGH | A | Audio đa ngôn ngữ chưa đủ; nhiều PENDING/FAILED_TTS | DB aggregate: vi 3 READY/3 PENDING/2 FAILED; en 3 READY/5 PENDING; ja/ko 6 READY/2 FAILED; seed `R__seed_demo.sql` 166–263 | High |
| HIGH-04 | HIGH | C/G | CI đỏ tại HEAD; frontend CI thiếu path filter/cache/`npm ci`; không có workflow order-service | `gh run list` run 40818656024; log `header.test.tsx:187`; `frontend-ci.yml` 19–27; 7 workflow | High |
| HIGH-05 | HIGH | B/D | Rate limit analytics 60/phút theo socket IP, mọi client sau proxy dùng chung IP | `AnalyticsRateLimitGlobalFilter.java` 31–32, 56, 85–87; 5 lần 429; `analytics.event.dlq` 2 message | High |
| HIGH-06 | HIGH | E | Thiếu `h1` ở 5 route; touch target nhỏ; hero mobile bị cắt | Playwright 96 lượt; 5 route không có h1; mobile 14–29 tap <36 px; `shot-mob-nearby.png` | High |
| HIGH-07 | HIGH | A/F | News và một phần nearby dùng fixture tĩnh, có thể che lỗi API và tạo dữ liệu giả | `articleService.ts` 64–69; `news.ts` 4, 63–65; `NearbyPage.tsx` 271–306; `deploy.txt` 8; `nearbyPois.json` 5 POI/20 ambience | High |
| HIGH-08 | HIGH | D | Thiếu security header/CSP ở nginx và index | `frontend/nginx.conf` 8–45; `frontend/index.html` không có CSP/OG | High |
| MED-01 | MEDIUM | C | Không có ESLint/Prettier/lint script | `frontend/package.json` chỉ có dev/build/preview/test | High |
| MED-02 | MEDIUM | C | Main bundle 1.134,59 kB, chưa code split | `npm run build` warning >500 kB | High |
| MED-03 | MEDIUM | E | 401 refresh lặp lại mỗi page load; i18n hard-code rải rác | 83 lần 401; `NearbyPage.tsx` 144–174 | High |
| MED-04 | MEDIUM | F | README ghi 13 suite/62 test, thực tế 73 file/579 test | `README.md` 315; `npm test` | High |
| MED-05 | MEDIUM | F | Không có OpenAPI/API contract | Không tìm thấy springdoc/swagger/openapi trong backend | High |
| MED-06 | MEDIUM | B | Không có tracing/metrics/log tập trung | Không thấy sleuth/micrometer-tracing/zipkin/otel/prometheus trong pom/config | High |
| MED-07 | MEDIUM | H | Thiếu SMTP; email verification không demo trọn vẹn | `.env.example` `MAIL_HOST/USERNAME/PASSWORD` trống | High |
| MED-08 | MEDIUM | H | Audio storage local, `AUDIO_PUBLIC_BASE_URL` trống | `.env.example`; volume `product-uploads-data`/audio local | High |
| MED-09 | MEDIUM | E | Trang 404 trả HTTP 200 | Playwright `/khong-ton-tai-abc` status 200 | High |

### 6.3. Kế hoạch sửa ưu tiên

| Thứ tự | ID | Severity | Tiêu chí | Effort | File/hành động | Phụ thuộc |
|---:|---|---|---|---|---|---|
| 1 | BLK-01 | BLOCKER | D | M | Xóa toàn bộ mật khẩu/hash khỏi `README.md`; thay bằng hướng dẫn “xem `.env`”; rotate toàn bộ secret; bỏ hard-code cookie Erlang; bỏ default password trong compose | Không |
| 2 | BLK-02 | BLOCKER | B | M | Đổi healthcheck RabbitMQ sang kiểm tra AMQP thật; thêm retry/backoff; tăng `start_period`; tăng timeout content hoặc thêm warm-up; kiểm tra lại 504 | BLK-01 (ổn định cấu hình) |
| 3 | HIGH-01 | HIGH | H | M | Thay ngrok bằng domain/tunnel cố định hoặc reverse proxy có kiểm soát; đưa URL vào biến môi trường; thêm healthcheck/rollback | Domain hoặc VPS |
| 4 | HIGH-02 | HIGH | A | S | Xóa/ẩn POI 40003; thêm validation `code/name/lat/lng`; thêm test seed/public list | Không |
| 5 | HIGH-03 | HIGH | A | L | Sinh lại audio cho 8 POI × 4 ngôn ngữ; xử lý FAILED_TTS; thêm job kiểm tra trạng thái audio trước demo | Internet/Edge-TTS |
| 6 | HIGH-04 | HIGH | C/G | M | Sửa `header.test.tsx`/Header; dùng `npm ci`, cache, path filter; thêm workflow order-service; yêu cầu CI xanh trước merge | Không |
| 7 | HIGH-05 | HIGH | B/D | M | Dùng identity tin cậy từ nginx hoặc rate limit theo user/session; tăng ngưỡng; thêm Redis nếu nhiều instance; xử lý DLQ | HIGH-01 |
| 8 | HIGH-06 | HIGH | E | M | Thêm `h1` cho 5 route; tăng touch target; sửa CSS hero mobile; kiểm tra lại 390×844 | Không |
| 9 | HIGH-07 | HIGH | A/F | L | Bỏ fallback fixture cho news/nearby hoặc gắn nhãn “dữ liệu demo”; hiển thị lỗi API rõ ràng | HIGH-03, HIGH-01 |
| 10 | HIGH-08 | HIGH | D | S | Thêm CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` trong nginx; cân nhắc HSTS | HIGH-01 |
| 11 | MED-01 | MEDIUM | C | S | Thêm ESLint/Prettier và script `lint`; chạy trong CI | Không |
| 12 | MED-02 | MEDIUM | C | M | Code split theo route, lazy load admin/audio/map; kiểm tra lại bundle | Không |
| 13 | MED-03 | MEDIUM | E | M | Chỉ refresh khi có session; gom i18n vào file dictionary | Không |
| 14 | MED-04 | MEDIUM | F | S | Cập nhật README theo số test thật; thêm lệnh kiểm tra | Không |
| 15 | MED-05 | MEDIUM | F | M | Thêm springdoc/OpenAPI hoặc file contract; sinh tài liệu API | Không |
| 16 | MED-06 | MEDIUM | B | M | Thêm Micrometer/Prometheus, trace ID, log aggregation | HIGH-01 |
| 17 | MED-07 | MEDIUM | H | M | Cấu hình SMTP hoặc tài khoản demo đã xác thực; ghi rõ trong README | SMTP |
| 18 | MED-08 | MEDIUM | H | M | Cấu hình storage bền (S3/Supabase) hoặc backup volume; đặt `AUDIO_PUBLIC_BASE_URL` | Hạ tầng |
| 19 | MED-09 | MEDIUM | E | S | Trả HTTP 404 thật cho route không tồn tại; giữ SPA fallback cho route hợp lệ | Không |

## 7. UNVERIFIED

Các mục sau **không được dùng để tính điểm**; lý do là chưa có bằng chứng đủ mạnh hoặc bị giới hạn bởi phạm vi read-only.

| # | Nội dung | Lý do |
|---|---|---|
| 1 | Chạy toàn bộ test Maven của 7 module | Không chạy Maven trong audit; chỉ đếm 66 file test và đọc CI |
| 2 | Đăng nhập admin bằng tài khoản trong README | Không gửi POST; không xác minh mật khẩu thực tế |
| 3 | Thanh toán VNPAY end-to-end | Không gửi POST/PATCH; không tạo order thật |
| 4 | Xác thực email qua SMTP | `MAIL_HOST/USERNAME/PASSWORD` trống; không có hộp thư thật |
| 5 | Google OAuth end-to-end | Cần cấu hình Google Cloud và trình duyệt thật; không kiểm tra |
| 6 | GPS/geofence và autoplay audio trên điện thoại thật | Chỉ dùng Playwright emulation; không có thiết bị thật |
| 7 | Deploy thực tế trên Vercel | Không có URL Vercel; chỉ kiểm tra tunnel ngrok |
| 8 | Tải đồng thời nhiều IP thật | Không có môi trường load test; chỉ thấy 429 trên một IP |
| 9 | Giá trị secret thực tế trong `.env` | Theo quy định không đọc/in `.env` |
| 10 | CI backend cho order/location/translation/gateway tại HEAD | `gh run list` chỉ thấy 4 run cho HEAD; các workflow còn lại không được trigger |
| 11 | 22 route admin còn lại | Cần đăng nhập/admin token; audit chỉ vào `/quan-tri` và `/quan-tri/dang-nhap` |
| 12 | Sinh lại audio Edge-TTS | Không chạy job TTS; chỉ đọc trạng thái DB |
| 13 | Xóa/khôi phục dữ liệu | Không chạy migration/cleanup để bảo toàn môi trường |

## 8. 10 câu hỏi giảng viên có thể hỏi

| # | Câu hỏi | Gợi ý trả lời ngắn | Bằng chứng nên mở |
|---:|---|---|---|
| 1 | Vì sao chọn microservices thay vì monolith? | Tách bounded context: auth, content, location, translation/TTS, analytics, order; cho phép scale pipeline audio và cô lập lỗi theo service. Thừa nhận chi phí vận hành cao hơn monolith. | `README.md` mục kiến trúc; `docs/diagrams/architecture.mmd` |
| 2 | Một POI đi từ DB đến tai người dùng như thế nào? | Content publish event → RabbitMQ → translation/TTS worker → lưu audio → FE đọc `audioStatusByLanguage`/`audio[lang]` → phát remote hoặc fallback speech. | `PoiPipelineServiceImpl.java`; `PoiEventPublisher`; `PoiAudioEventListener`; `useNearbyAudio.ts` 40–89 |
| 3 | Làm sao chống xử lý trùng job dịch/TTS? | Dùng `contentHash`, unique constraint, bắt `DataIntegrityViolationException` và đọc lại bản ghi; retry có kiểm soát. | `PoiPipelineServiceImpl.java`; migration translation |
| 4 | Audio premium có bị tải lậu không? | Audio `_vi_` miễn phí; ngôn ngữ khác cần Bearer + `X-User-Plan` + internal key; `AudioEntitlementFilter` kiểm tra quyền; đã thấy 401/403 thực tế. | `AudioEntitlementFilter.java`; live GET audio ja 401; POI en 403 |
| 5 | Vì sao nhiều POI vẫn PENDING/FAILED? | Seed đặt PENDING; worker phụ thuộc Internet/Edge-TTS; một số job fail và chưa retry; đây là giới hạn đã biết, không phải “đã xong”. | DB aggregate; `R__seed_demo.sql` 166–263; log TTS |
| 6 | Vì sao CI đỏ mà nhóm nói test pass? | Local pass 579 test; CI fail ở `header.test.tsx:187` do khác môi trường/order; chưa sửa tại HEAD. Không nên nói “đã fix”. | `gh run view 40818656024 --log-failed`; `npm test` local |
| 7 | Mật khẩu, secret đang nằm ở đâu? | Trong `.env` local (không commit); README đang lộ một số giá trị và cần xóa/rotate; repo private nhưng vẫn phải xử lý. | `README.md` 271–303; `.env.example`; `deploy.txt` 15 |
| 8 | Deploy thật đang chạy ở đâu? | Frontend Vercel rewrite sang tunnel ngrok; backend chạy Docker trên máy nhóm; không có CD. Đây là điểm yếu, không phải “production”. | `frontend/vercel.json`; `deploy.txt`; `docker ps` |
| 9 | Vì sao tin tức vẫn hiển thị khi backend lỗi? | Có fallback fixture trong `articleService`/`news.ts`; tiện demo nhưng dễ che lỗi và tạo dữ liệu giả. | `articleService.ts` 64–69; `news.ts` 63–65 |
| 10 | Đo chất lượng và độ tin cậy bằng gì? | 579 test FE, 66 file test BE, tsc sạch, build được; nhưng thiếu coverage/lint, CI đỏ, backend test chưa chạy trong audit. | `package.json`; test counts; CI |

## 9. Các quan sát khác

- Mã nguồn backend chính: 358 file Java, khoảng 19.540 dòng; 66 file test, khoảng 11.711 dòng; 107 khai báo mapping endpoint.
- Frontend: 320 file `.ts/.tsx`, khoảng 61.077 dòng; 73 file test, khoảng 12.993 dòng.
- Có 10 container đang chạy; `GET /actuator/health` trả 200 `{"status":"UP"}`; frontend root trả 200.
- Có 8 Dockerfile, `docker-compose.yml` và `docker-compose.dev.yml`.
- Có 16 file `.puml` + 6 file `.mmd` trong `docs/diagrams`; `docs` có khoảng 190 file tài liệu/ảnh (chưa tính báo cáo này).
- `README.md` 343 dòng (267 dòng có nội dung), không có khối Mermaid; sơ đồ nằm trong `docs/diagrams`.
- `frontend/index.html` có `lang="vi"`, title, meta description, favicon SVG inline; thiếu Open Graph/Twitter Card.
- `frontend/public/privacy.html` và `frontend/public/terms.html` tồn tại; cần kiểm tra link footer hiển thị đúng.
- Không còn thương hiệu `BankShield`/`AntiPhishing` trong source; chỉ còn tên file migration cũ `backend/analytics-service/src/main/resources/db/migration/V2__saigonvoice_analytics_event.sql` dòng 2.
- `order-service` có 2 file test nhưng không có workflow CI.
- `analytics.event.dlq` có 2 message chưa xử lý; nên có consumer/alert cho DLQ.
- `docker-compose.yml` dùng `container_name` cố định, thuận tiện demo nhưng khó scale ngang.
- `frontend/.vercel`, `Bao_Cao.docx`, `Data_Dictionary.xlsx` là file untracked/ignored; không ảnh hưởng điểm nhưng cần kiểm tra trước khi nộp.
- `deploy.txt` là checklist thủ công, có ghi “tunnel chỉ trỏ gateway 18080” và “chốt news: dùng fixtures”; đây là bằng chứng nhóm đã biết các giới hạn này.
- Không có `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` trong nginx; nếu demo qua tunnel HTTPS vẫn nên thêm.
- Rate limit analytics chỉ áp dụng cho `POST /api/analytics/events`; các endpoint khác không bị giới hạn tương tự.
- Gateway dùng timeout 60 giây cho `/api/tts/**`, 15 giây cho order, 5 giây cho content/analytics; đây là cấu hình hợp lý cho audio nhưng quá thấp cho cold start content.
- `docker-compose.yml` healthcheck của content/translation có `start_period: 30s`, thấp hơn nhiều so với thời gian start thực tế 205–255 giây; container có thể bị đánh dấu unhealthy tạm thời.
- Không thấy `springdoc`/`swagger`/OpenAPI trong backend; tài liệu API hiện dựa vào controller và README.
- Không thấy ESLint/Prettier; đây là khoảng trống dễ sửa và nên đưa vào CI.
- Không thấy job build Docker image hay deploy trong 7 workflow; pipeline hiện chỉ là CI.
- Repo private giúp giảm rủi ro lộ secret, nhưng không thay thế việc rotate và xóa secret khỏi README.
