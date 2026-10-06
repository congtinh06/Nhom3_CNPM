# SAIGONVOICE — HỆ THỐNG HƯỚNG DẪN VIÊN DU LỊCH ĐA NGÔN NGỮ TỰ ĐỘNG
## (Multilingual Automated Tourist Audio Guide System)

[![Content Service CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/content-service.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/content-service.yml)
[![Location Service CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/location-service.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/location-service.yml)
[![Translation & TTS Service CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/translation-tts-service.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/translation-tts-service.yml)
[![Analytics Service CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/analytics-service.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/analytics-service.yml)
[![API Gateway CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/api-gateway.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/api-gateway.yml)

Hệ thống thuyết minh tự động đa ngôn ngữ cho các điểm du lịch tại TP.HCM. Du khách quét mã QR tại điểm dừng (hoặc đi vào vùng định vị GPS 30–50 m); một trang WEB (không cần cài đặt ứng dụng) sẽ tự động phát âm thanh thuyết minh. Quản trị viên chỉ cần nhập nội dung tiếng Việt một lần; hệ thống tự động dịch đa ngôn ngữ (`en`, `ja`, `ko`), tạo tệp âm thanh (TTS), và xuất mã QR.

Mô hình dữ liệu phân cấp: **Zone (Khu vực)** ➔ **Route (Tuyến tham quan)** ➔ **POI (Điểm dừng du lịch)**.

Dự án được xây dựng theo kiến trúc Microservices với:
- **Công nghệ nền tảng**: Java 17, Spring Boot 3.3.4, Spring Cloud Gateway 2023.0.3, OpenFeign, Maven.
- **Hệ cơ sở dữ liệu**: Microsoft SQL Server 2022 (1 instance trên cổng `1433`, gồm 3 database độc lập: `saigonvoice_content_db`, `saigonvoice_translation_db`, `saigonvoice_analytics_db`), quản lý migration qua Flyway.
- **Message Broker**: RabbitMQ điều phối bất đồng bộ.
- **Giao diện**: Frontend React + TypeScript (chưa được xây dựng).

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống (Architecture Overview)

```
                            ┌────────────────────────┐
                            │    Trình duyệt WEB     │
                            │ (Khách quét QR / GPS)  │
                            └───────────┬────────────┘
                                        │ HTTP / REST
                                        ▼
                            ┌────────────────────────┐
                            │      api-gateway       │
                            │  Spring Cloud Gateway  │
                            │ Host: 18080 (Port:8080)│
                            └─────┬───────────┬──────┘
                                  │           │
         ┌────────────────────────┼───────────┼────────────────────────┐
         ▼                        ▼           ▼                        ▼
┌──────────────────┐    ┌──────────────────┐┌──────────────────┐┌──────────────────┐
│ content-service  │    │ location-service ││translation-tts-  ││analytics-service │
│ (Port: 8085)     │◀───│ (Port: 8082)     ││service           ││ (Port: 8081)     │
│ - Quản lý POI,   │Feign- Tính toán GPS,  ││ (Port: 8083)     ││ - Thu thập sự    │
│   Zone, Route    │    │   resolve POI    ││ - Dịch tự động   ││   kiện quét QR,  │
│ - Publisher sự   │    └──────────────────┘│ - Sinh audio TTS ││   phát âm thanh  │
│   kiện xuất bản  │                        └────────┬─────────┘└────────┬─────────┘
└────────┬─────────┘                                 │                   │
         │                                           │                   │
         │ saigonvoice.topic (poi.created / updated) │                   │
         ├──────────────────────────────────────────▶│                   │
         │◀──────────────────────────────────────────┤                   │
         │ (poi.audio.ready / poi.audio.failed)      │                   │
         │                                                               │
         │                                       saigonvoice.analytics   │
         │                                       (analytics.event.queue) │
         │                                                               ▼
         └───────────────────▶ RabbitMQ Broker ◀─────────────────────────┘
                               Host: 5672 | UI: 15800
                               DLX: saigonvoice.dlx
```

Xem tài liệu hợp đồng sự kiện chi tiết tại [docs/event-contract.md](docs/event-contract.md).

---

## 2. Hệ Thống Ràng Buộc Kỹ Thuật & Bảo Mật (Constraints & Defense-in-Depth)

Hệ thống tuân thủ mô hình phòng thủ theo chiều sâu (Defense-in-Depth):

### 2.1. Phân Lập Cơ Sở Dữ Liệu (Database Isolation)
- **1 Instance SQL Server 2022** sở hữu 3 cơ sở dữ liệu riêng biệt:
  - `saigonvoice_content_db`: quản lý dữ liệu khu vực (`zone`), danh mục (`category`), tuyến (`route`), điểm dừng (`poi`), và bản dịch gốc.
  - `saigonvoice_translation_db`: quản lý bản dịch (`poi_translation`), cache âm thanh TTS (`tts_audio_cache`).
  - `saigonvoice_analytics_db`: lưu trữ nhật ký sự kiện tương tác (`analytics_event`).
- **Tài khoản riêng biệt**: Mỗi service chỉ được cấp quyền trên database tương ứng (`content_user`, `translation_user`, `analytics_user`), ngăn chặn hoàn toàn truy cập chéo.

### 2.2. Kiểm Soát Cổng Vào Tại API Gateway
- **Chặn đường dẫn bất thường (`PathGuardFilter`)**: Chạy ở mức ưu tiên cao nhất (`HIGHEST_PRECEDENCE`), từ chối ngay lập tức với mã `HTTP 400 Bad Request` đối với các request chứa ký tự mã hóa URL (`%`), tham số ma trận (`;`), ký tự gạch chéo ngược (`\`), dấu chấm lùi thư mục (`/../`, `/./`), ký tự điều khiển hoặc ký tự non-ASCII.
- **Tuyến công khai giới hạn**: Dưới tiền tố `/api/content`, chỉ cho phép phương thức `GET` đối với các tài nguyên `categories`, `pois`, `routes`, `zones`.
- **Bảo vệ endpoint nội bộ (`InternalPathBlockFilter`)**: Mọi request từ bên ngoài vào `/api/content/internal/**` đều bị chặn và trả về `HTTP 404 Not Found`. Header `X-Internal-Api-Key` từ client bị loại bỏ trước khi chuyển tiếp.
- **Xác thực quản trị viên (`AdminAuthGlobalFilter`)**: Các tuyến `/api/content/admin/**` và `/api/analytics/summary` bắt buộc phải có header `X-Admin-Key` hợp lệ (so sánh bằng `MessageDigest.isEqual` theo thời gian hằng số để chống timing attack). Header này không được chuyển tiếp downstream.
- **Giới hạn tần suất gọi (`AnalyticsRateLimitGlobalFilter`)**: Tuyến `POST /api/analytics/events` áp dụng bộ lọc giới hạn 60 request/phút theo từng địa chỉ IP của client. Request vượt ngưỡng sẽ nhận mã lỗi `HTTP 429 Too Many Requests` kèm header `Retry-After`.

---

## 3. Cấu Trúc Thư Mục Dự Án

```
Nhom3_CNPM/
├── backend/
│   ├── api-gateway/              # Spring Cloud Gateway (Port container: 8080, host: 18080)
│   ├── content-service/          # Quản lý Zone, Route, POI, xuất bản sự kiện (Port: 8085)
│   ├── location-service/         # Xử lý tọa độ GPS, tìm điểm lân cận, quét QR (Port: 8082)
│   ├── translation-tts-service/  # Dịch (provider MyMemory qua email trong .env, fallback "seed" ghi placeholder "[en] ..."), TTS (edge-tts; nếu lỗi TTS thì POI nhận trạng thái FAILED_TTS và frontend fallback sang Web Speech API) (Port: 8083)
│   └── analytics-service/        # Thu thập và tổng hợp sự kiện tương tác (Port: 8081)
├── docker/
│   └── init-databases.sql        # Script khởi tạo 3 CSDL và 3 user trên SQL Server
├── docs/
│   ├── architecture.md           # Tài liệu kiến trúc hệ thống chi tiết
│   ├── event-contract.md         # Đặc tả hợp đồng sự kiện RabbitMQ giữa các service
│   ├── analytics-contract.md     # Đặc tả API và sự kiện của analytics-service
│   └── LOCAL_DEV.md              # Hướng dẫn quy ước chạy môi trường local
├── .github/workflows/            # 5 CI workflows kiểm thử và build Docker cho từng service
├── docker-compose.yml            # Khởi chạy toàn bộ hạ tầng và các microservices
├── .env.example                  # File mẫu khai báo các biến môi trường
└── README.md
```

---

## 4. Hướng Dẫn Chạy Toàn Bộ Hệ Thống (Local Run)

### 4.1. Khởi chạy bằng Docker Compose
Yêu cầu: Đã cài đặt **Docker Desktop**.

```bash
# 1. Tạo file cấu hình môi trường từ mẫu
cp .env.example .env

# 2. Khởi chạy toàn bộ stack hạ tầng và services
docker compose up -d --build

# 3. Hoặc khởi chạy từng service theo tên
docker compose up -d rabbitmq mssql mssql-db-init content-service location-service translation-tts-service analytics-service api-gateway
```

### 4.2. Bảng Phân Bổ Cổng Dịch Vụ

| Service | Cổng Host | Cổng Container | Ghi chú |
|---|---|---|---|
| `api-gateway` | `18080` | `8080` | Điểm tiếp nhận request tập trung |
| `content-service` | `8085` | `8085` | Quản lý nội dung và xuất bản sự kiện |
| `location-service` | `8082` | `8082` | Xử lý tọa độ GPS và QR token |
| `translation-tts-service` | `8083` | `8083` | Dịch thuật đa ngôn ngữ (provider MyMemory cấu hình qua email trong .env, fallback "seed" ghi placeholder "[en] ..."); sinh âm thanh qua edge-tts (nếu lỗi TTS thì POI nhận trạng thái FAILED_TTS và frontend fallback sang Web Speech API) |
| `analytics-service` | `8081` | `8081` | Thống kê và theo dõi tương tác |
| `mssql` | `1433` | `1433` | Microsoft SQL Server 2022 (chứa 3 DB) |
| `rabbitmq` | `5672` | `5672` | AMQP Message Broker |
| RabbitMQ Management | `15800` | `15672` | Dashboard quản trị hàng đợi |

### 4.3. Trạng Thái Triển Khai
Deploy: chưa chốt

---

## 5. Hướng Dẫn Kiểm Thử & Xác Minh (Verification)

### 5.1. Chạy Kiểm Thử Tự Động (Maven)
Tests run: NOT EXECUTED (chạy trong môi trường container JDK 17).

Các lệnh chạy kiểm thử cho từng module khi có Maven:
```bash
mvn -f backend/content-service/pom.xml test
mvn -f backend/location-service/pom.xml test
mvn -f backend/translation-tts-service/pom.xml test
mvn -f backend/analytics-service/pom.xml test
mvn -f backend/api-gateway/pom.xml test
```

### 5.2. Kiểm Tra Các Tuyến API Qua Gateway
```bash
# 1. Lấy danh mục điểm dừng (Công khai - HTTP 200)
curl -X GET http://localhost:18080/api/content/categories

# 2. Lấy danh sách điểm dừng du lịch (Công khai - HTTP 200)
curl -X GET http://localhost:18080/api/content/pois

# 3. Tra cứu điểm dừng theo mã QR qua location-service (HTTP 200 hoặc HTTP 404 nếu không tìm thấy)
curl -X GET http://localhost:18080/api/location/qr/sample-token

# 4. Gọi endpoint quản trị không kèm header khóa (Kỳ vọng: HTTP 401 Unauthorized)
curl -X GET http://localhost:18080/api/analytics/summary

# 5. Gửi sự kiện thống kê tương tác (Kỳ vọng: HTTP 202 Accepted)
curl -X POST http://localhost:18080/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"eventType":"SCAN","poiId":1,"languageCode":"vi","triggerType":"QR"}'
```

---

## 6. Kịch Bản Thuyết Trình & Chấm Điểm Đồ Án
Sẽ viết sau khi chạy E2E
