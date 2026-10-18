# BÁO CÁO AUDIT BACKEND — SAIGONVOICE

Phạm vi: backend (6 microservice Spring Boot), hạ tầng Docker Compose, CI/CD GitHub Actions.
Phương pháp: audit chỉ đọc (read-only). Mọi phát hiện kèm bằng chứng `file:line` hoặc kết quả lệnh. Không chạy Maven, không mở `.env` thật. Không commit.

---

## 1. Tổng quan

Backend SaigonVoice đã hình thành kiến trúc microservice tương đối hoàn chỉnh: 6 service Spring Boot 3.3.4 / Java 17 (api-gateway, auth, content, location, translation-tts, analytics) trên nền SQL Server 2022 (4 DB tách riêng) và RabbitMQ, định tuyến qua API Gateway có PathGuard/CORS/AdminAuth. Luồng thuyết minh tự động (POI → dịch → TTS → phát audio) có đầy đủ trạng thái công việc, idempotency theo `content_hash`, xử lý lỗi theo từng ngôn ngữ và DLQ. Bảo mật tầng auth khá tốt: JWT HS256 fail-closed khi thiếu secret, BCrypt cost 12, refresh token xoay vòng + phát hiện tái sử dụng, khóa brute-force lưu DB, chống CSRF bằng Origin + SameSite. Tuy nhiên nhiều điểm yếu vẫn còn ở mức BLOCKER/HIGH cho demo và deploy: TTS phụ thuộc dịch vụ online edge-tts (không có fallback offline), tài khoản/mật khẩu mặc định công khai trong `.env.example` và `docker-compose.yml`, mật khẩu DB mặc định nằm trong git, không có HTTPS, và toàn bộ CD (push image/deploy) chưa tồn tại. CI cũng chưa chạy test frontend và nhiều tính năng admin mới (62 file untracked) chưa được commit nên không được kiểm. Nhìn chung hệ thống đủ chạy demo cục bộ có Internet nhưng chưa sẵn sàng đưa ra ngoài Internet.

Bảng trưởng thành theo khu vực:

| Khu vực | Nội dung | Đánh giá |
|---|---|---|
| A | Giao tiếp service (sync/async) | Tạm được |
| B | Pipeline thuyết minh | Tạm được |
| C | Gateway & bảo mật | Tạm được |
| D | Tầng dữ liệu | Tạm được |
| E | CI/CD | Thiếu (CI tạm được, CD thiếu) |
| F | Độ tin cậy / quan sát | Thiếu |
| G | Kiểm thử | Tạm được |
| H | Tài liệu / vệ sinh repo | Tạm được |
| I | Sẵn sàng deploy | Thiếu |

---

## 2. Inventory (Step 0)

### 2.1. Microservice

| Service | Path | Port | Framework | DB riêng | Dockerfile | Health | Flyway (số / mới nhất) | Test (số file) | Workflow |
|---|---|---|---|---|---|---|---|---|---|
| api-gateway | `backend/api-gateway` | 8080 | Spring Cloud Gateway / Boot 3.3.4, Java 17 | không | có | `/actuator/health` | 0 | 2 | `api-gateway.yml` |
| content-service | `backend/content-service` | 8085 | Spring Boot 3.3.4, JPA, Flyway | `saigonvoice_content_db` | có | `/actuator/health` | 8 / `V7__add_zone_route_version.sql` (+`R__seed_demo.sql`) | 15 | `content-service.yml` |
| location-service | `backend/location-service` | 8082 | Spring Boot 3.3.4, OpenFeign | không | có | `/actuator/health` | 0 | 4 | `location-service.yml` |
| translation-tts-service | `backend/translation-tts-service` | 8083 | Spring Boot 3.3.4, JPA, Flyway, edge-tts | `saigonvoice_translation_db` | có | `/actuator/health` | 2 / `V2__init_translation_tables.sql` | 16 | `translation-tts-service.yml` |
| analytics-service | `backend/analytics-service` | 8081 | Spring Boot 3.3.4, JPA, Flyway | `saigonvoice_analytics_db` | có | `/actuator/health` | 2 / `V2__saigonvoice_analytics_event.sql` | 9 | `analytics-service.yml` |
| auth-service | `backend/auth-service` | 8086 | Spring Boot 3.3.4, Spring Security, JPA, Flyway | `saigonvoice_auth_db` | có | `/actuator/health` | 2 / `V2__google_identity.sql` | 11 | `auth-service.yml` |
| frontend | `frontend` | 5173 (dev) / 80 (nginx) | React 18 + Vite + TS | không | có | không | - | 13 suite | `frontend-ci.yml` |

Tất cả service đều khai báo `spring-boot-starter-actuator` (grep trên `backend/*/pom.xml`).

### 2.2. docker-compose.yml (host `F:\Nhom3_CNPM\docker-compose.yml`)

| Service | Image/Build | Ports host | Volume | Ghi chú |
|---|---|---|---|---|
| rabbitmq | `rabbitmq:3-management` | 5672, 15800→15672 | `rabbitmq-data` | healthcheck `rabbitmqctl status` |
| mssql | `mcr.microsoft.com/mssql/server:2022-latest` | 1433 | `mssql-data` | healthcheck `sqlcmd SELECT 1` |
| mssql-db-init | mssql image (one-shot) | - | `./docker/init-databases.sql:ro` | tạo 4 DB + 4 login cô lập |
| content-service | build `./backend/content-service` | - | `product-uploads-data` | depends_on mssql-db-init, rabbitmq |
| location-service | build | - | - | depends_on content-service (started) |
| translation-tts-service | build | - | `audio-storage-data` | depends_on content healthy |
| analytics-service | build | - | - | depends_on mssql-db-init, rabbitmq |
| auth-service | build | - | - | depends_on mssql-db-init |
| api-gateway | build | 8080 | - | depends_on content/location/auth (started) |

Network: `saigonvoice-net` (bridge). Volumes: `mssql-data`, `rabbitmq-data`, `audio-storage-data`, `product-uploads-data`.
`docker-compose.dev.yml`: publish 8085/8082/8083/8081/8086 ra host (chỉ dev).
`docker-compose.override.yml`: map gateway `18080:8080` tạm thời (host 8080 bị `AgentService.exe` chiếm), có ghi chú "Xoa file nay sau test".

### 2.3. Workflows (`.github/workflows`, 7 file)

| Workflow | Trigger | Path filter | JDK/Node | Cache | Test | Build image | Push/Deploy |
|---|---|---|---|---|---|---|---|
| `analytics-service.yml` | push `[main,master,refactor/**]`, PR `[main,master]` | có | JDK17 | maven | `mvn -B test` | có (no push) | không |
| `api-gateway.yml` | như trên | có | JDK17 | maven | có | có | không |
| `auth-service.yml` | như trên | có | JDK17 | maven | có | có | không |
| `content-service.yml` | như trên | có | JDK17 | maven | có | có | không |
| `location-service.yml` | như trên | có | JDK17 | maven | có | có | không |
| `translation-tts-service.yml` | như trên | có | JDK17 | maven | có | có | không |
| `frontend-ci.yml` | push/PR `[main,master]` | **không** | Node 20 | **không** | **không** (`npm run build` only) | không | không |

6 workflow backend đều có `permissions: contents: read`, `concurrency` + `cancel-in-progress`, dùng `actions/checkout@v6` + `actions/setup-java@v5` (temurin 17, cache maven).

---

## 3. Findings

Mức độ: BLOCKER / HIGH / MEDIUM / LOW. Độ tin cậy: cao / vừa / thấp.

| ID | Mức độ | Khu vực | Phát hiện | Bằng chứng | Độ tin cậy | Đề xuất sửa | Công |
|---|---|---|---|---|---|---|---|
| F-01 | HIGH | I | TTS dùng edge-tts (dịch vụ online của Microsoft); không có fallback offline. Không có Internet → toàn bộ tạo audio FAILED_TTS. | `backend/translation-tts-service/Dockerfile:9-18`; `application.yml:66`; `tts/runner/EdgeTtsRunner.java` | cao | Thêm provider TTS offline (piper/espeak) hoặc cache trước; ghi rõ yêu cầu Internet trong tài liệu deploy | L |
| F-02 | HIGH | C | Tài khoản & mật khẩu mặc định công khai: `admin@saigonvoice.local/Admin@123456`, `user@saigonvoice.local/User@123456` (trong `.env.example`, compose defaults và README). Seed ACTIVE sẵn. | `.env.example:78-80`; `docker-compose.yml:256-259`; `README.md:214-215`; `bootstrap/AdminUserSeeder.java:57-128` | cao | Bắt buộc đổi trước khi demo/deploy; cảnh báo fail/ refuse-seed nếu còn giá trị mặc định ở profile prod | S |
| F-03 | HIGH | I | Không có HTTPS/TLS. Gateway chỉ HTTP; camera & Geolocation API trên thiết bị thật yêu cầu secure context (HTTPS). | `docker-compose.yml:277-278`; `api-gateway application.yml:1-11` | cao | Đặt sau reverse proxy TLS (Caddy/Nginx) hoặc dùng tunnel HTTPS; bật `REFRESH_COOKIE_SECURE=true` | M |
| F-04 | HIGH | E | Frontend không được chạy test trong CI (`npm run build` mà không `npm test`); 62 test frontend không bao phủ. | `.github/workflows/frontend-ci.yml:26-30` | cao | Thêm bước `npm test -- --run` | S |
| F-05 | HIGH | E | 62 file tính năng admin mới chưa commit (untracked) → CI không chạy trên chúng; nhánh `refactor/**` được trigger nhưng không tồn tại. | `git status` (62 untracked; V6/V7 migrations, ProductAdmin*, AdminUser*); `content-service.yml:5` | cao | Commit/đẩy tính năng admin; dọn trigger nhánh không tồn tại | M |
| F-06 | MEDIUM | C | Mật khẩu DB/RabbitMQ mặc định nằm trong git (giá trị công khai). | `content-service/application.yml:14,29` (`Saigon@123`, `SgVoice_Rabbit!2026`); `analytics-service/application.yml:10,27`; `auth-service/application.yml:10` | cao | Bắt buộc env ở prod (bỏ default), xoay toàn bộ secret đã lộ | S |
| F-07 | MEDIUM | A | Không có circuit breaker/fallback cho Feign (location→content, analytics→content). Content down → lỗi 5xx lan truyền. | `location/.../ContentServiceClientConfiguration.java:25-29`; `analytics/application.yml:53-63` | cao | Thêm Resilience4j (timeout + circuitbreaker + fallback) | M |
| F-08 | MEDIUM | A | analytics-service dùng exchange riêng `saigonvoice.analytics` (khác `saigonvoice.topic`) và tự publish HTTP→RMQ→tự consume. | `analytics/.../config/RabbitMQConfig.java:25`; `service/AnalyticsEventServiceImpl.java:59-63`; `consumer/AnalyticsEventListener.java:20` | cao | Thống nhất tên exchange hoặc ghi rõ topology; cân nhắc ghi DB trực tiếp | M |
| F-09 | MEDIUM | A | Publish analytics không chờ broker confirm (không `CorrelationData`); message unroutable bị mất im lặng nhưng API trả 202. | `AnalyticsEventServiceImpl.java:59-63` vs `content/.../PoiEventPublisher.java:38-70` | cao | Dùng confirm tương tự PoiEventPublisher hoặc bắt `ReturnsCallback` | S |
| F-10 | MEDIUM | A | Không có consumer/giám sát DLQ; message lỗi nằm chết ở `*.dlq`. | `content RabbitMQConfig.java:122-161` (chỉ khai báo dlq); không có `@RabbitListener` trỏ dlq | cao | Thêm job cảnh báo/đọc DLQ, dashboard | M |
| F-11 | MEDIUM | B | Chỉ hỗ trợ 4 ngôn ngữ TTS (vi/en/ja/ko). README quảng bá 5 (thêm `zh`); ràng buộc analytics cũng chỉ vi/en/ja/ko. | `translation application.yml:69-72`; `analytics V2__...sql:31`; `README.md:17,31` | cao | Bổ sung voice `zh` hoặc sửa tài liệu về 4 ngôn ngữ | S |
| F-12 | MEDIUM | B | Dịch cả `summary` và `historicalSignificance` nhưng TTS chỉ đọc `title` + `description` → tốn quota dịch mà không dùng để đọc. | `service/PoiPipelineServiceImpl.java:133-143`; `tts/TtsTextBuilder.java:16-25`; `PoiPipelineServiceImpl.java:180` | cao | Chỉ dịch trường cần đọc, hoặc đưa summary/history vào kịch bản đọc | S |
| F-13 | MEDIUM | B | Không tách "văn bản hiển thị" vs "kịch bản đọc": số/năm không chuẩn hoá thành dạng đọc cho TTS. | `tts/TtsTextBuilder.java:16-25` (chỉ nối title+description) | vừa | Thêm lớp chuẩn hoá số/năm/viết tắt riêng cho kịch bản đọc | M |
| F-14 | MEDIUM | D | Flyway V1 content từng bị sửa sau commit → lỗi checksum với môi trường cũ. | `docs/db-review-debt.md` (mục 9) | cao | Không sửa migration đã commit; buộc `down -v` khi lệch | S |
| F-15 | MEDIUM | F | Không có `restart` policy trong compose cho bất kỳ service nào. | `docker-compose.yml` (không có key `restart`) | cao | Thêm `restart: unless-stopped` | S |
| F-16 | MEDIUM | F | Không có resource limit (chỉ giới hạn heap `-Xmx256m` qua `JAVA_TOOL_OPTIONS`). | `docker-compose.yml:116,148,169,207,240,280` | cao | Thêm `deploy.resources.limits` / `mem_limit` | S |
| F-17 | MEDIUM | F | Không có correlation/request-id xuyên service; log rời rạc. | `api-gateway/.../filter/RequestLoggingFilter.java`; không thấy header id ở downstream | vừa | Truyền `X-Request-Id` qua gateway + log MDC | M |
| F-18 | MEDIUM | C | Actuator `health` lộ `show-details: always` và được `permitAll` (auth, content). | `auth application.yml:71-73`; `auth/.../config/SecurityConfig.java:49`; `content application.yml:62-64` | cao | Đặt `show-details: never` và/hoặc chỉ mở nội bộ | S |
| F-19 | MEDIUM | C | Cổng DB 1433 và RabbitMQ 5672/15672 mở ra 0.0.0.0; tài khoản `sa` bật. | `docker-compose.yml:9-11,40-41`; `docs/db-review-debt.md` (mục 2) | cao | Bind `127.0.0.1` hoặc không publish ra host ở prod | S |
| F-20 | MEDIUM | I | Frontend không nằm trong docker-compose (chỉ có Dockerfile + nginx.conf) → deploy phải tự cấu hình. | `frontend/Dockerfile`; `frontend/nginx.conf`; `docker-compose.yml` (không có service frontend) | cao | Thêm service frontend vào compose hoặc tài liệu hoá deploy riêng | M |
| F-21 | MEDIUM | E | Không có CD: workflow chỉ build image, không push registry, không tag, không deploy, không rollback. | `.github/workflows/content-service.yml:44-53` | cao | Thêm job push ghcr.io + tag sha/semver, tách môi trường | L |
| F-22 | MEDIUM | D | `R__seed_demo.sql` lớn (83 100 bytes) repeatable — nguy cơ nạp dữ liệu demo vào DB thật. | `content-service/.../db/migration/R__seed_demo.sql` | vừa | Tách seed khỏi migration hoặc bật theo profile | M |
| F-23 | MEDIUM | H | README lệch thực tế: ghi gateway cổng `18080`, 5 ngôn ngữ (gồm zh), trong khi base là 8080 và TTS chỉ 4 ngôn ngữ. | `README.md:128,235` vs `api-gateway application.yml:1`; `README.md:17` vs `translation application.yml:69-72` | cao | Cập nhật README theo cấu hình thực tế | S |
| F-24 | LOW | A | translation-tts không khai báo exchange bean; phụ thuộc content-service đã tạo `saigonvoice.topic`. | `translation/.../config/RabbitMQConfig.java:24` (chỉ hằng số) | cao | Khai báo exchange ở cả 2 phía (khai báo trùng idempotent) | S |
| F-25 | LOW | A | analytics-service không `depends_on` content-service dù gọi Feign tới nó. | `docker-compose.yml:217-221` | cao | Thêm depends_on content-service (healthy) | S |
| F-26 | LOW | B | Bảng `tts_audio_cache` 0 dòng — dead code. | `docs/db-review-debt.md` (mục 12) | cao | Dùng cho caching theo hash hoặc xoá | M |
| F-27 | LOW | B | Tên file audio rút `content_hash` còn 8 hex → nguy cơ va chạm (thấp) và mất yếu tố phiên bản đầy đủ. | `service/AudioStorageServiceImpl.java:55-56,20-21` | cao | Dùng hash dài hơn hoặc kèm version | S |
| F-28 | LOW | D | Wording BankShield còn sót trong comment migration analytics. | `analytics-service/.../V2__saigonvoice_analytics_event.sql:2` | cao | Đổi comment sang ngữ cảnh SaigonVoice | S |
| F-29 | LOW | D | Có migration phá huỷ (DROP TABLE) trong các V2 đã commit. | `analytics V2__...sql:5-15`; `translation V2` (`DROP TABLE dbo.notification_log`,`dbo.translation_job_log`) | cao | Giữ nguyên (đã commit); tránh DROP ở migration tương lai | S |
| F-30 | LOW | F | Hình dạng body lỗi không nhất quán giữa các filter/service. | `api-gateway/.../filter/InternalPathBlockFilter.java:240-258` (`{status,error,message}`); `content/.../config/InternalApiKeyFilter.java:64` (`{status,error}`); `AdminAuthGlobalFilter.java:335-341` (`{...,path}`) | cao | Chuẩn hoá schema lỗi (ProblemDetail/RFC7807) | M |
| F-31 | LOW | C | Origin `localhost:5173`/`127.0.0.1:5173` luôn được thêm vào CORS kể cả prod. | `api-gateway/.../config/CorsConfig.java:30-31`; `auth/.../config/OriginCheckFilter.java:44-45` | cao | Chỉ thêm localhost khi profile dev | S |
| F-32 | LOW | E | `frontend-ci.yml` không có `permissions`, dùng `npm install`, không cache. | `.github/workflows/frontend-ci.yml:1-30` | cao | Thêm `permissions: contents: read`, `npm ci`, cache npm | S |
| F-33 | LOW | E | Không dùng reusable workflow; 6 workflow backend trùng logic. | `.github/workflows/*.yml` | cao | Tách `workflow_call` dùng chung | M |
| F-34 | LOW | D | `hibernate.jdbc.time_zone` chưa khai báo (lệch giờ khi chạy ngoài container). | `docs/db-review-debt.md` (mục 5) | cao | Khai báo `UTC` trong JPA config | S |
| F-35 | LOW | D | `translation_job` phình dần + index dư thừa. | `docs/db-review-debt.md` (mục 10) | cao | Thêm job dọn/archival; bỏ index thừa | M |
| F-36 | LOW | G | Không có test e2e smoke (compose + curl) và test hợp đồng giữa service. | `.github/workflows` (không có bước e2e) | cao | Thêm script smoke e2e chạy sau compose | M |
| F-37 | LOW | H | Ảnh chụp thiết kế lớn (~1.5–2.3 MB × 7) commit trong repo. | `docs/design/shots/*.png` (git ls-files) | cao | Chuyển sang LFS hoặc nén | S |
| F-38 | LOW | H | `deploy.txt` lỗi mã hoá (mojibake), gần như không đọc được. | `deploy.txt` | cao | Lưu UTF-8 hoặc chuyển thành Markdown | S |
| F-39 | LOW | I | Tag image floating (`mssql:2022-latest`, `rabbitmq:3-management`). | `docker-compose.yml:6,33`; `docs/db-review-debt.md` (mục 4) | cao | Ghim tag/digest cụ thể | S |
| F-40 | LOW | I | Không có backup tự động cho MSSQL/audio (chỉ có ghi chú backup volume ở comment). | `docker-compose.yml:314-316` (comment) | cao | Thêm cron `sqlcmd backup` + backup volume định kỳ | M |

Ghi chú điểm đã tốt (không tạo finding): 
- Gateway có PathGuard + strip header giả + admin JWT tự xác minh (fail-closed khi secret < 32 ký tự): `AdminAuthGlobalFilter.java:89-239`, `PathGuardFilter.java`.
- Auth: BCrypt cost 12, refresh token rotation + phát hiện reuse, khóa brute-force theo email+IP lưu DB, chống dò email bằng dummy hash: `SecurityConfig.java:37-41`, `AuthServiceImpl.java:168-218`, `RefreshTokenService.java:96-121`.
- Narration: idempotency theo `content_hash`, xử lý lỗi theo từng ngôn ngữ, publish `audio.ready` trước khi set DONE (at-least-once): `PoiPipelineServiceImpl.java:82-231`.
- Publisher content-service chờ ACK + kiểm tra message return: `PoiEventPublisher.java:38-70`.
- `.gitignore` chặn `.env`, `target/`, `dist/`: `.gitignore`; `git ls-files` xác nhận `.env` và `target/`,`frontend/dist/` không được track.

---

## 4. Danh sách "chưa kiểm chứng được"

- Trạng thái CI thực tế (số run pass/fail, branch protection, required checks): `gh` chưa đăng nhập ("You are not logged into any GitHub hosts") → không xác minh.
- Kết quả test backend: không chạy được Maven trong môi trường audit → không khẳng định pass/fail.
- Test cần Docker/Testcontainers hay mock: chưa xác định đầy đủ nội dung từng test.
- Giá trị bí mật thật trong `.env`: không mở (theo yêu cầu) → không biết cấu hình runtime thực tế.
- Số dòng/khối lượng bảng thật, thời gian khởi động container, kích thước image thực tế: không đo.
- `setup-java@v5` / `checkout@v6` có tồn tại và hợp lệ tại thời điểm chạy: chưa kiểm (chỉ ghi nhận không nhất quán với `@v4` của frontend).
- Nội dung đầy đủ `docs/architecture.md`, `docs/event-contract.md`, `docs/LOCAL_DEV.md`: chưa đọc hết.

---

## 5. Lộ trình đề xuất

### 5.1. Làm trước khi demo (≤10)
1. F-02: Đổi mật khẩu admin/test mặc định; xác nhận không dùng giá trị trong `.env.example`.
2. F-01: Chuẩn bị Internet cho máy demo (edge-tts) hoặc cache sẵn audio cho các POI demo.
3. F-05: Commit/đẩy tính năng admin mới để CI và demo đồng bộ.
4. F-20: Chạy được frontend (dev hoặc container) và trỏ `FRONTEND_URL(S)` đúng.
5. F-25: Thêm `depends_on` content-service cho analytics để tránh lỗi khởi động.
6. F-04: Bật chạy test frontend trong CI (nếu demo cần nhánh CI xanh).
7. F-11: Xác nhận số ngôn ngữ thực tế (4) để tránh hứa hẹn sai tính năng.
8. F-15: Thêm `restart: unless-stopped` để container tự phục hồi khi demo.
9. Xoá `docker-compose.override.yml` (map 18080) sau khi test xong.
10. F-10: Chuẩn bị cách xem DLQ để xử lý sự cố khi demo.

### 5.2. Làm trước khi deploy (≤10)
1. F-03: Đặt sau HTTPS (reverse proxy/tunnel); bật `REFRESH_COOKIE_SECURE=true`.
2. F-02/F-06: Xoay toàn bộ secret/mật khẩu đã lộ; loại bỏ mọi default credential ở prod.
3. F-19: Không publish 1433/5672/15672 ra host; bind localhost.
4. F-18: Tắt `show-details`, giới hạn actuator.
5. F-21: Xây CD push image + tag + deploy + rollback.
6. F-01: Phương án TTS offline hoặc SLA Internet.
7. F-40: Backup định kỳ MSSQL + volume audio.
8. F-15/F-16: Restart policy + resource limit.
9. F-39: Ghim tag/digest image.
10. F-36: Smoke test e2e sau khi deploy.

### 5.3. Làm sau (≤10)
1. F-07: Circuit breaker/fallback cho Feign.
2. F-08/F-09: Chuẩn hoá topology analytics + publish confirm.
3. F-17: Correlation-id + log tập trung + metrics (Micrometer/Prometheus).
4. F-30: Chuẩn hoá schema lỗi (RFC7807).
5. F-12/F-13: Tối ưu kịch bản đọc (chỉ dịch trường cần, chuẩn hoá số/năm).
6. F-22/F-26/F-35: Dọn seed/dead table/dọn job định kỳ.
7. F-14/F-34: Kỷ luật Flyway + timezone.
8. F-33: Reusable workflow.
9. F-31/F-32: Siết CORS theo môi trường, cải thiện CI frontend.
10. F-37/F-38: Dọn artefact lớn, sửa encoding tài liệu.

---

## 6. Câu hỏi cần quyết định

1. Demo có Internet ổn định không? Nếu không, chọn giải pháp TTS offline nào (piper/espeak) hay cache audio trước?
2. Số ngôn ngữ chính thức là 4 (vi/en/ja/ko) hay 5 (thêm zh)? Cần bổ sung voice `zh`?
3. Môi trường deploy mục tiêu: 1 VPS + reverse proxy, hay tunnel (ngrok/Vercel) như `deploy.txt`?
4. Có bắt buộc CD tự động (push image + deploy) hay deploy thủ công bằng `docker compose`?
5. Có cần lưu vết analytics theo người dùng không (hiện chỉ theo POI/session)? ảnh hưởng thiết kế DB.
6. Ngân sách/chiến lược cho dịch máy: dùng MyMemory miễn phí hay provider trả phí? ảnh hưởng quota.
7. Có yêu cầu lưu trữ audio tập trung (Supabase/S3) thay vì volume local?
