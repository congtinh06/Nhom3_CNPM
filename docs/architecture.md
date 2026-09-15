# TÀI LIỆU KIẾN TRÚC HỆ THỐNG KIỂM TRA & CẢNH BÁO WEB/SMS GIẢ MẠO NGÂN HÀNG
## (Anti-Phishing / Brand Protection System)

---

## 1. Kiến Trúc Tổng Quan (System Architecture)

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
└───────────┬────────────┘   └───────────┬────────────┘   └───────────┬────────────┘
            │                            │                            │
            ▼                            ▼                            ▼
┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
│       report_db        │   │  link_verification_db  │   │    notification_db     │
│  PostgreSQL (Port:5434)│   │  PostgreSQL (Port:5433)│   │  PostgreSQL (Port:5435)│
└───────────┬────────────┘   └────────────────────────┘   └───────────▲────────────┘
            │                                                         │
            │ publish                                                 │ consume
            └────────────────────▶ RabbitMQ Broker ───────────────────┘
                                   exchange: report.exchange (topic)
                                   routing key: report.created
                                   queue: report.created.queue
```

---

## 2. Bảng Phân Bổ Cổng & Cơ Sở Dữ Liệu

| Service / Container | Cổng Host (Dev) | Cổng Container | Database | Mục Đích |
|---|---|---|---|---|
| **`api-gateway`** | `8080` | `8080` | *Không dùng (Stateless)* | Định tuyến request tập trung, xử lý CORS, log request |
| **`report-service`** | `8081` | `8081` | `report_db` | Tiếp nhận báo cáo, điều phối xác thực qua Feign, đẩy sự kiện RabbitMQ |
| **`link-verification-service`** | `8082` | `8082` | `link_verification_db` | Phân tích URL qua Google Safe Browsing, Phishunt, PhishTank |
| **`notification-service`** | `8083` | `8083` | `notification_db` | Lắng nghe RabbitMQ, gửi cảnh báo Email (Mailtrap/Gmail) & SMS, ghi log audit |
| **`postgres-link`** | `5433` | `5432` | `link_verification_db` | Lưu kết quả xác thực liên kết |
| **`postgres-report`** | `5434` | `5432` | `report_db` | Lưu trữ báo cáo của người dùng |
| **`postgres-notification`**| `5435` | `5432` | `notification_db` | Lưu trữ log gửi thông báo cảnh báo |
| **`rabbitmq`** | `5672`, `15672` | `5672`, `15672` | - | Message Broker & Dashboard quản trị |
| **`frontend`** | `5173` | `5173` | - | Giao diện người dùng Web SPA (Vite + React) |

---

## 3. Kiến Trúc 3 Lớp Chuẩn (Controller – Service – Repository)

Cả 3 service nghiệp vụ (`link-verification-service`, `report-service`, `notification-service`) đều tuân thủ kiến trúc 3 lớp nghiêm ngặt:
- **Lớp Controller / Listener**: Tiếp nhận HTTP Request (hoặc RabbitMQ Message) và kiểm tra tính hợp lệ của dữ liệu đầu vào thông qua các annotations `@Valid`.
- **Lớp Service**: Chứa toàn bộ nghiệp vụ xử lý logic, tính toán điểm rủi ro, phân loại, cô lập lỗi và điều phối các client tích hợp ngoài.
- **Lớp Repository**: Tương tác với PostgreSQL thông qua Spring Data JPA, bảo đảm tính toàn vẹn dữ liệu.

---

## 4. Hợp Đồng Giao Tiếp Giữa Các Dịch Vụ (Communication Contracts)

### 4.1. Giao Tiếp Đồng Bộ (REST qua OpenFeign)
- **Từ**: `report-service` ➔ `link-verification-service`
- **Method / Endpoint**: `POST /api/v1/verify`
- **Headers**: `Content-Type: application/json`, `X-Internal-Api-Key: <SECRET_KEY>`
- **Request Body**:
  ```json
  {
    "url": "https://fake-bank-login.com/auth"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "url": "https://fake-bank-login.com/auth",
    "domain": "fake-bank-login.com",
    "isPhishing": true,
    "riskScore": 0.67,
    "sources": "PHISHUNT,GOOGLE_SAFE_BROWSING",
    "checkedAt": "2026-09-15T14:40:00Z"
  }
  ```

### 4.2. Giao Tiếp Bất Đồng Bộ (RabbitMQ Topic Exchange)
- **Publisher**: `report-service`
- **Consumer**: `notification-service`
- **Exchange**: `report.exchange` (Type: `topic`)
- **Routing Key**: `report.created`
- **Queue**: `report.created.queue` (Binding: `report.created`)
- **Event Payload (`ReportCreatedEvent`)**:
  ```json
  {
    "reportId": 1024,
    "targetUrl": "https://fake-bank-login.com/auth",
    "channel": "WEB",
    "reporterContact": "victim@example.com",
    "isPhishing": true,
    "riskScore": 0.67,
    "createdAt": "2026-09-15T14:40:01Z"
  }
  ```

---

## 5. Thiết Kế Cơ Sở Dữ Liệu & Ràng Buộc (Schema & Constraints)

### 5.1. Database `link_verification_db`
```sql
CREATE TABLE verification_result (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    risk_score NUMERIC(3, 2) NOT NULL CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
    sources TEXT,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### 5.2. Database `report_db`
```sql
CREATE TABLE report (
    id BIGSERIAL PRIMARY KEY,
    target_url TEXT NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('WEB', 'SMS')),
    reporter_contact VARCHAR(255) NOT NULL,
    description TEXT,
    is_phishing BOOLEAN,
    risk_score NUMERIC(3, 2) CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'NOTIFIED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### 5.3. Database `notification_db`
```sql
CREATE TABLE notification_log (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('EMAIL', 'SMS')),
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SENT', 'FAILED')),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    error_message TEXT
);
```

---

## 6. Các Lớp Bảo Mật & Ràng Buộc Nghiệp Vụ (Defense-in-Depth)

1. **Validation Chặt Chẽ**: DTO sử dụng `@NotBlank`, `@URL`, `@NotNull`, `@Size` và ràng buộc liên kết ngữ cảnh (nếu kênh `WEB` thì contact bắt buộc phải là email, nếu kênh `SMS` phải là số điện thoại).
2. **Rate Limiting (Chống Spam API)**: Tích hợp thư viện Bucket4j trên `POST /api/v1/reports`, giới hạn 5 request/phút cho mỗi IP client. Khi vượt ngưỡng, trả về HTTP 429 JSON rõ ràng.
3. **Internal API Authentication**: Kiểm tra header bí mật `X-Internal-Api-Key` đối với các API nội bộ như `/api/v1/verify`.
4. **Cơ chế Chịu Lỗi & Graceful Degradation**:
   - Từng client xác thực liên kết bên thứ 3 (Google Safe Browsing, Phishunt, PhishTank) được bọc trong khối try-catch độc lập, lỗi từ một nguồn không làm sập tiến trình.
   - Khi `link-verification-service` không phản hồi, `report-service` vẫn ghi nhận bản ghi với trạng thái `PENDING` và trả về mã thành công kèm cảnh báo thay vì báo lỗi hệ thống 500.
