# SAIGONVOICE — HỆ THỐNG HƯỚNG DẪN VIÊN DU LỊCH ĐA NGÔN NGỮ TỰ ĐỘNG
## (Multilingual Audio Tourist Guide Microservices System)

[![Backend CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/frontend-ci.yml)

Hệ thống thuyết minh và chỉ dẫn du lịch tự động tại TP.HCM qua mã QR và định vị GPS. Dự án được thiết kế chuẩn theo mô hình kiến trúc **Microservices** (Java 17, Spring Boot 3.3.4, Spring Cloud 2023.0.3), CSDL **Microsoft SQL Server 2022**, điều phối sự kiện qua **RabbitMQ**, lưu trữ âm thanh local offline first (và Supabase Storage), cùng giao diện **React + TypeScript (Vite)**.

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống (Architecture Overview)

```
                            ┌────────────────────────┐
                            │   Trình duyệt / SPA    │
                            │  React + TS (Vite)     │
                            │  Port: 5173 (Vercel)   │
                            └───────────┬────────────┘
                                        │ HTTPS (REST)
                                        ▼
                            ┌────────────────────────┐
                            │      api-gateway       │
                            │  Spring Cloud Gateway  │
                            │  Port: 8080 (Render)   │
                            └───────────┬────────────┘
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│     report-service     │   │ link-verification-svc  │   │    notification-svc    │
│  Spring Boot (Port:8081│──▶│  Spring Boot (Port:8082│   │  Spring Boot (Port:8083│
│  - OpenFeign gọi verify│   │  - Google Safe Browsing│   │  - RabbitMQ Consumer   │
│  - RabbitMQ Publisher  │   │  - Phishunt / PhishTank│   │  - Mailtrap / Twilio   │
│  - RateLimit (Bucket4j)│   │  - Mock Mode Dự Phòng  │   │  - Audit Log Gửi Tin   │
└───────────┬────────────┘   └───────────┬────────────┘   └───────────┬────────────┘
            │                            │                            │
            ▼                            ▼                            ▼
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│       report_db        │   │  link_verification_db  │   │    notification_db     │
│  PostgreSQL (Port:5434)│   │  PostgreSQL (Port:5433)│   │  PostgreSQL (Port:5435)│
└───────────┬────────────┘   └────────────────────────┘   └───────────▲────────────┘
            │                                                         │
            │ publish: report.exchange (topic)                        │ consume
            └────────────────────▶ RabbitMQ Broker ───────────────────┘
                                   routing key: report.created
                                   queue: report.created.queue

                                        ┌────────────────────────┐
                                        │   narration-service    │
                                        │  Spring Boot (Port:8084│
                                        │  - MessageSource i18n  │
                                        │  - vi/en templates     │
                                        └───────────▲────────────┘
                                                    │ OpenFeign
                                                    │ POST /api/v1/narrate
                                        ┌───────────┴────────────┐
                                        │    notification-svc    │
                                        └────────────────────────┘
```

---

## 2. Hệ Thống Ràng Buộc Kỹ Thuật (Constraints & Defense-in-Depth)

Hệ thống được thiết kế với các ràng buộc nghiêm ngặt ở mọi tầng theo tiêu chuẩn ứng dụng bảo mật:

### 2.1. Ràng Buộc Cơ Sở Dữ Liệu (Database Constraints)
- **Độc lập dữ liệu**: Mỗi service sở hữu 1 cơ sở dữ liệu PostgreSQL riêng biệt, nghiêm cấm JOIN chéo giữa các service (Database-per-service pattern).
- **Ràng buộc toàn vẹn Schema**:
  - `report_db.report`: `CHECK (channel IN ('WEB', 'SMS'))`, `CHECK (status IN ('PENDING', 'VERIFIED', 'NOTIFIED', 'FAILED'))`, `risk_score NUMERIC(3,2) CHECK (risk_score >= 0.00 AND risk_score <= 1.00)`.
  - `notification_db.notification_log`: `CHECK (channel IN ('EMAIL', 'SMS'))`, `CHECK (status IN ('SENT', 'FAILED'))`.
  - `link_verification_db.verification_result`: `NOT NULL` trên các trường `url`, `domain`, `is_phishing`, `risk_score`, `checked_at`.

### 2.2. Ràng Buộc DTO & Dữ Liệu Đầu Vào (Input Validation)
- `@URL(protocol = "http|https")`: Bắt buộc URL phân tích phải đúng cú pháp web.
- `@NotBlank`, `@Size(max = 1000)`: Kiểm soát chặt chẽ độ dài chuỗi, ngăn ngừa lỗi tràn bộ nhớ hoặc injection.
- **Ràng buộc ngữ cảnh theo kênh (`@ValidReporterContact`)**:
  - Khi người dùng chọn kênh **`WEB`**: Trường `reporterContact` bắt buộc phải là địa chỉ **Email** hợp lệ theo tiêu chuẩn RFC 5322.
  - Khi người dùng chọn kênh **`SMS`**: Trường `reporterContact` bắt buộc phải là **Số điện thoại** hợp lệ (từ 8 đến 15 chữ số).
- **Global Exception Handling**: Mọi vi phạm validation đều trả về mã lỗi `HTTP 400 Bad Request` với danh sách trường lỗi rõ ràng, tuyệt đối không lộ stack trace.

### 2.3. Ràng Buộc An Toàn & Bảo Mật (Security Constraints)
- **Chống Spam API (Rate Limiting)**: Tích hợp thư viện Bucket4j trên `POST /api/v1/reports`, giới hạn nghiêm ngặt **5 request/phút** cho từng địa chỉ IP. Request thứ 6 sẽ lập tức bị chặn với mã `HTTP 429 Too Many Requests`.
- **Phòng thủ đa tầng (Defense in Depth)**: Endpoint nội bộ `/api/v1/verify` kiểm tra header bí mật `X-Internal-Api-Key` nhằm ngăn chặn kẻ xấu gọi trực tiếp vào service nghiệp vụ bỏ qua API Gateway.
- **Quản lý bí mật (Zero-secret in Git)**: Không lưu trữ API key hay mật khẩu trong mã nguồn. Toàn bộ cấu hình được nạp từ biến môi trường thông qua `.env`.

### 2.4. Ràng Buộc Khả Năng Chịu Lỗi & Dự Phòng (Fault Tolerance)
- **Cô lập nguồn bên ngoài**: Từng lời gọi tới Google Safe Browsing, Phishunt, PhishTank được bọc try/catch độc lập; sự cố từ 1 dịch vụ miễn phí không ảnh hưởng đến toàn bộ kết quả.
- **Chế độ Mock Demo (`VERIFICATION_MOCK_MODE=true`)**: Cho phép chạy demo ổn định các kịch bản lừa đảo ngân hàng ngay cả khi phòng thi rớt mạng hoặc các API bên ngoài vượt hạn mức.
- **Graceful Degradation**: Khi `link-verification-service` không phản hồi, `report-service` ghi nhận báo cáo với trạng thái `PENDING` thay vì gây lỗi 500 cho người dùng.
- **Bắt buộc Audit Log**: Mọi thao tác gửi thông báo cảnh báo đều bắt buộc ghi nhận trạng thái (`SENT` hoặc `FAILED`) và thông tin lỗi vào `notification_log`.

---

## 3. Cấu Trúc Thư Mục Dự Án

```
anti-phishing-system/
├── backend/                     # Toàn bộ microservices Spring Boot
│   ├── api-gateway/             # Spring Cloud Gateway (:8080)
│   ├── report-service/          # Nghiệp vụ quản lý báo cáo, Feign, RabbitMQ (:8081)
│   ├── link-verification-service/ # Nghiệp vụ kiểm tra phishing, 3 clients (:8082)
│   ├── notification-service/    # Nghiệp vụ consumer gửi mail, SMS demo, audit (:8083)
│   └── narration-service/       # Thuyết minh tự động đa ngôn ngữ vi/en (:8084)
├── frontend/                    # Giao diện người dùng React + TS (Vite) (:5173)
├── docs/
│   ├── architecture.md          # Tài liệu chi tiết kiến trúc & API contract
│   └── schema.sql               # Toàn bộ DDL, CHECK constraints và seed data
├── .github/workflows/
│   ├── backend-ci.yml           # CI kiểm thử JUnit 5 cho 4 microservices
│   └── frontend-ci.yml          # CI kiểm tra TypeScript & Vite build
├── docker-compose.yml           # Dựng trọn bộ 8 containers chỉ với 1 lệnh
├── render.yaml                  # Blueprint tự động triển khai hạ tầng Render
├── .env.example                 # Danh sách mô tả biến môi trường
└── README.md                    # Tài liệu hướng dẫn sử dụng và kịch bản demo
```

---

## 4. Hướng Dẫn Chạy Toàn Bộ Hệ Thống (Local Run)

### Cách 1: Khởi chạy bằng Docker Compose (Khuyến nghị - Nhanh nhất)
Yêu cầu: Máy đã cài đặt **Docker Desktop** (khuyến nghị cấp từ 6-8 GB RAM).

```bash
# 1. Clone mã nguồn
git clone https://github.com/congtinh06/Nhom3_CNPM.git
cd Nhom3_CNPM

# 2. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env

# 3. Dựng toàn bộ 9 containers (5 Spring Boot + 3 PostgreSQL + RabbitMQ)
docker compose up --build -d

# 4. Kiểm tra trạng thái toàn bộ containers
docker compose ps
```

Khi hoàn tất, các dịch vụ sẽ sẵn sàng tại:
- **API Gateway**: `http://localhost:8080`
- **RabbitMQ Management**: `http://localhost:15672` (Tài khoản: `guest` / `guest`)
- **Frontend SPA**: `cd frontend && npm install && npm run dev` ➔ Mở `http://localhost:5173`

---

### Cách 2: Chạy Từng Service Bằng Mã Nguồn (Local Dev)
Cần có JDK 17, Maven và Node.js:

1. **Khởi chạy RabbitMQ & 3 Database Postgres**:
   ```bash
   docker compose up -d rabbitmq postgres-link postgres-report postgres-notification
   ```
2. **Khởi chạy từng Microservice**:
   - `link-verification-service`: `cd backend/link-verification-service && ./mvnw spring-boot:run` (Cổng 8082)
   - `report-service`: `cd backend/report-service && ./mvnw spring-boot:run` (Cổng 8081)
   - `notification-service`: `cd backend/notification-service && ./mvnw spring-boot:run` (Cổng 8083)
   - `narration-service`: `cd backend/narration-service && ./mvnw spring-boot:run` (Cổng 8084)
   - `api-gateway`: `cd backend/api-gateway && ./mvnw spring-boot:run` (Cổng 8080)
3. **Khởi chạy Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 5. Hướng Dẫn Kiểm Thử & Kiểm Chứng Ràng Buộc (Verification)

### 5.1. Chạy Tự Động Toàn Bộ Unit Test Backend
```bash
mvn -f backend/link-verification-service/pom.xml test
mvn -f backend/report-service/pom.xml test
mvn -f backend/notification-service/pom.xml test
mvn -f backend/narration-service/pom.xml test
mvn -f backend/api-gateway/pom.xml test
```

### 5.2. Kiểm Tra Ràng Buộc Đầu Vào Bằng `curl`
```bash
# Test 1: Gửi URL sai định dạng (Kỳ vọng: HTTP 400 Bad Request)
curl -X POST http://localhost:8080/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"not-a-valid-url","channel":"WEB","reporterContact":"test@bank.com"}'

# Test 2: Gửi sai định dạng liên hệ theo kênh (Kênh WEB nhưng gửi số điện thoại) (Kỳ vọng: HTTP 400)
curl -X POST http://localhost:8080/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://test-bank.com","channel":"WEB","reporterContact":"0912345678"}'

# Test 3: Gửi thành công báo cáo hợp lệ (Kỳ vọng: HTTP 201 Created)
curl -X POST http://localhost:8080/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://example-bank-fake.com/login","channel":"WEB","reporterContact":"user@bank.com","description":"Mạo danh cổng đăng nhập"}'

# Test 4: Kiểm tra Rate Limit (Gửi liên tiếp 6 lần -> Lần 6 nhận HTTP 429 Too Many Requests)
```

### 5.3. Test Luồng Thuyết Minh Tự Động Đa Ngôn Ngữ (narration-service)

**Test trực tiếp narration-service (demo độc lập):**
```bash
# Thuyết minh tiếng Việt (Kỳ vọng: HTTP 200 với explanation tiếng Việt)
curl -X POST http://localhost:8084/api/v1/narrate \
  -H "Content-Type: application/json" \
  -d '{"reasonCodes":["DOMAIN_TOO_NEW","SSL_INVALID","BRAND_KEYWORD_MATCH"],"riskScore":0.87,"locale":"vi"}'

# Thuyết minh tiếng Anh (Kỳ vọng: HTTP 200 với explanation tiếng Anh)
curl -X POST http://localhost:8084/api/v1/narrate \
  -H "Content-Type: application/json" \
  -d '{"reasonCodes":["DOMAIN_TOO_NEW","SSL_INVALID","BRAND_KEYWORD_MATCH"],"riskScore":0.87,"locale":"en"}'

# Locale không hỗ trợ (Kỳ vọng: HTTP 400)
curl -X POST http://localhost:8084/api/v1/narrate \
  -H "Content-Type: application/json" \
  -d '{"reasonCodes":["NO_HTTPS"],"riskScore":0.5,"locale":"fr"}'

# reasonCodes rỗng (Kỳ vọng: HTTP 400)
curl -X POST http://localhost:8084/api/v1/narrate \
  -H "Content-Type: application/json" \
  -d '{"reasonCodes":[],"riskScore":0.5,"locale":"vi"}'
```

**Demo qua API Gateway:**
```bash
curl -X POST http://localhost:8080/api/v1/narrate \
  -H "Content-Type: application/json" \
  -d '{"reasonCodes":["BLACKLISTED_DOMAIN","SHORT_URL_OBFUSCATION"],"riskScore":0.9,"locale":"en"}'
```

**Demo luồng end-to-end (report → verify → RabbitMQ → notification → narration):**
```bash
# 1. Gửi báo cáo kèm locale="en" (người nhận muốn nhận cảnh báo tiếng Anh)
curl -X POST http://localhost:8080/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"targetUrl":"https://vietcombank-login.fake.com/otp","channel":"WEB","reporterContact":"user@bank.com","description":"Mạo danh Vietcombank","locale":"en"}'

# 2. Quan sát log notification-service: nó consume sự kiện từ RabbitMQ,
#    gọi narration-service POST /api/v1/narrate (locale=en), rồi ghép câu
#    thuyết minh tiếng Anh vào email cảnh báo gửi đi.
#
# 3. Xem email trong Mailtrap inbox (hoặc log của notification-service).
#    Nếu dừng notification-service rồi gửi lại báo cáo, hệ thống vẫn gửi
#    cảnh báo với nội dung mặc định (fallback) - chứng minh Graceful Degradation.
```

---

## 6. Kịch Bản Thuyết Trình & Chấm Điểm Đồ Án (5–7 Phút)

1. **Bước 1 (1 phút) - Trình bày cấu trúc 3 lớp & Ràng buộc**:
   - Mở mã nguồn `report-service` hoặc `link-verification-service`.
   - Chỉ rõ 3 lớp: `controller/`, `service/`, `repository/`.
   - Giới thiệu các ràng buộc chặt chẽ: DTO Validation `@ValidReporterContact`, Rate Limit Filter Bucket4j (chống spam), và 3 Database PostgreSQL độc lập.
2. **Bước 2 (1 phút) - Minh chứng CI/CD tự động**:
   - Mở tab **Actions** trên GitHub repository, chỉ ra workflow `Backend CI` và `Frontend CI` màu xanh pass 100%.
   - Mở file `render.yaml` chỉ ra kiến trúc Infrastructure-as-Code triển khai tự động.
3. **Bước 3 (3 phút) - Demo trực tiếp trên giao diện**:
   - Mở trang web tại `http://localhost:5173`.
   - Bấm nút **"Nạp mẫu URL An toàn"** ➔ Nhận kết quả an toàn (màu xanh).
   - Bấm nút **"Nạp mẫu URL Giả mạo"** (`https://example-bank-fake.com/login`) ➔ Hệ thống lập tức phát hiện nguy cơ lừa đảo, thanh Risk Score hiển thị cảnh báo đỏ.
4. **Bước 4 (1 phút) - Kiểm tra luồng bất đồng bộ RabbitMQ & Audit Log**:
   - Mở RabbitMQ UI `http://localhost:15672`, chỉ ra exchange `report.exchange` và queue `report.created.queue`.
   - Mở cơ sở dữ liệu `notification_db` (hoặc log của `notification-service`) để chỉ ra dòng audit log `SENT` đã được tạo tương ứng.
