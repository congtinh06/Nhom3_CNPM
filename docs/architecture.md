# TÀI LIỆU KIẾN TRÚC HỆ THỐNG SAIGONVOICE
## (Multilingual Automated Tourist Audio Guide Microservices Architecture)

---

## 1. Kiến Trúc Tổng Quan (System Architecture)

Hệ thống **SaigonVoice** cung cấp nền tảng hướng dẫn viên du lịch tự động đa ngôn ngữ tại TP.HCM. Du khách quét mã QR tại điểm dừng tham quan hoặc đi vào vùng định vị GPS (bán kính 30–50 m); trình duyệt web tự động tải dữ liệu và phát âm thanh thuyết minh tương ứng.

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

---

## 2. Bảng Phân Bổ Cổng & Cơ Sở Dữ Liệu

| Service / Thành phần | Cổng Host (Dev) | Cổng Container | Cơ Sở Dữ Liệu | Mục Đích |
|---|---|---|---|---|
| **`api-gateway`** | `18080` | `8080` | *Không có (Stateless)* | Điểm tiếp nhận request tập trung, kiểm soát tuyến, xác thực admin, giới hạn tốc độ gọi |
| **`content-service`** | `8085` | `8085` | `saigonvoice_content_db` | Quản lý Zone, Route, POI, xuất bản sự kiện sang RabbitMQ |
| **`location-service`** | `8082` | `8082` | *Không có (Stateless)* | Xử lý tọa độ GPS, tìm kiếm POI lân cận, tra cứu theo mã QR |
| **`translation-tts-service`** | `8083` | `8083` | `saigonvoice_translation_db` | Dịch đa ngôn ngữ (`en`, `ja`, `ko`) với provider mặc định MyMemory (cấu hình qua email trong .env), fallback provider "seed" ghi placeholder "[en] ..."; TTS dùng edge-tts (nếu lỗi TTS thì POI nhận trạng thái FAILED_TTS và frontend fallback sang Web Speech API); quản lý cache âm thanh |
| **`analytics-service`** | `8081` | `8081` | `saigonvoice_analytics_db` | Tiếp nhận sự kiện quét QR, phát âm thanh, tổng hợp báo cáo tương tác |
| **`mssql`** | `1433` | `1433` | Chứa cả 3 database độc lập | Instance Microsoft SQL Server 2022 |
| **`rabbitmq`** | `5672`, `15800` | `5672`, `15672` | - | AMQP Message Broker và Dashboard quản trị RabbitMQ |

---

## 3. Mô Hình Dữ Liệu Nghiệp Vụ (Data Model)

Mô hình dữ liệu nghiệp vụ được thiết kế theo cấu trúc phân cấp chặt chẽ:

$$\text{Zone (Khu vực du lịch)} \longrightarrow \text{Route (Tuyến tham quan)} \longrightarrow \text{POI (Điểm dừng du lịch)}$$

- **Zone (Khu vực)**: Đại diện cho một vùng du lịch trọng điểm (ví dụ: Trung tâm Quận 1, Khu di tích Chợ Lớn). Quản lý tọa độ tâm (`center_lat`, `center_lng`) và bán kính khu vực (`radius_meters`).
- **Route (Tuyến tham quan)**: Tập hợp các điểm dừng được xâu chuỗi theo lộ trình khám phá, liên kết trực tiếp với Zone và có thứ tự sắp xếp (`display_order`).
- **POI (Điểm dừng du lịch)**: Vị trí tham quan cụ thể gắn với tọa độ chính xác, bán kính kích hoạt tự động (30–50 m), mã nhận diện QR (`qr_token`), danh mục (`category_id`) và nội dung thuyết minh gốc tiếng Việt.
- **Quy trình xuất bản**: Quản trị viên nhập nội dung tiếng Việt 1 lần duy nhất; hệ thống tự động phát tán sự kiện để tạo bản dịch (`en`, `ja`, `ko`), phát sinh âm thanh TTS và cấp phát mã QR.

---

## 4. Hợp Đồng Giao Tiếp Giữa Các Dịch Vụ (Communication Contracts)

### 4.1. Giao Tiếp Đồng Bộ (REST qua OpenFeign)
- **Từ**: `location-service` ➔ `content-service`
- **Method & Endpoint**:
  - `GET /api/content/internal/pois/bounding-box`: Lấy danh sách điểm dừng trong khung tọa độ địa lý.
  - `GET /api/content/internal/pois/qr/{qrToken}`: Tra cứu thông tin điểm dừng từ mã QR.
- **Headers**: Yêu cầu header `X-Internal-Api-Key` để xác thực giao tiếp nội bộ giữa các microservices.
- **Bảo mật**: API Gateway chặn toàn bộ truy cập từ internet vào tiền tố `/api/content/internal/**` (trả về `HTTP 404 Not Found`).

### 4.2. Giao Tiếp Bất Đồng Bộ (RabbitMQ Topic Exchange)
- **Exchange chính**: `saigonvoice.topic` (Type: `topic`, durable: `true`)
- **Dead Letter Exchange**: `saigonvoice.dlx` (Type: `direct`, durable: `true`)
- **Các luồng sự kiện chính**:
  - `poi.created` ➔ `poi.created.queue`: Kích hoạt khi POI mới được tạo; `translation-tts-service` tiếp nhận để tiến hành dịch và tạo file âm thanh.
  - `poi.updated` ➔ `poi.updated.queue`: Kích hoạt khi nội dung POI được cập nhật.
  - `poi.audio.ready` ➔ `poi.audio.ready.queue`: `translation-tts-service` phản hồi về `content-service` khi âm thanh đã tạo thành công.
  - `poi.audio.failed` ➔ `poi.audio.failed.queue`: Phản hồi về `content-service` khi quá trình tạo âm thanh gặp sự cố.
  - Mỗi queue đều có Dead Letter Queue tương ứng (`.dlq`) được liên kết qua `saigonvoice.dlx`.
- **Luồng phân tích thống kê**:
  - `analytics-service` sở hữu topology riêng: Exchange `saigonvoice.analytics` (topic), Routing key: `analytics.event`, Queue: `analytics.event.queue`, DLX: `saigonvoice.analytics.dlx`, DLQ: `analytics.event.dlq`.
- **Đặc tả chi tiết**: Xem thêm tài liệu hợp đồng sự kiện tại [docs/event-contract.md](docs/event-contract.md).

---

## 5. Thiết Kế Cơ Sở Dữ Liệu & Phân Quyền Cô Lập

Hệ thống sử dụng một máy chủ **Microsoft SQL Server 2022** duy nhất nhưng được phân chia thành 3 cơ sở dữ liệu riêng biệt:

### 5.1. Database `saigonvoice_content_db`
- Phục vụ `content-service`.
- Quản lý các bảng: `zone`, `category`, `route`, `route_stop`, `poi`, `poi_translation`.
- Login chuyên dụng: `content_user` (chỉ có quyền trên `saigonvoice_content_db`).

### 5.2. Database `saigonvoice_translation_db`
- Phục vụ `translation-tts-service`.
- Quản lý các bảng: `poi_translation`, `tts_audio_cache`.
- Login chuyên dụng: `translation_user` (chỉ có quyền trên `saigonvoice_translation_db`).

### 5.3. Database `saigonvoice_analytics_db`
- Phục vụ `analytics-service`.
- Quản lý bảng: `analytics_event` (lưu trữ nhật ký sự kiện quét QR và phát audio, không lưu thông tin định danh cá nhân của du khách).
- Login chuyên dụng: `analytics_user` (chỉ có quyền trên `saigonvoice_analytics_db`).

---

## 6. Các Lớp Bảo Mật & Ràng Buộc Hệ Thống (Defense-in-Depth)

1. **Kiểm Soát Đường Dẫn Tuyệt Đối (`PathGuardFilter`)**:
   - Chặn đứng các hành vi dò quét và vượt quyền thông qua đường dẫn bất thường (chứa `%`, `;`, `\`, `//`, `/../`, `/./`, ký tự điều khiển, ký tự non-ASCII).
   - Trả về mã lỗi chung `HTTP 400 Bad Request` không kèm thông tin cấu trúc nội bộ.

2. **Cách Ly Tuyến Nội Bộ (`InternalPathBlockFilter`)**:
   - Chặn toàn bộ truy cập công khai vào `/api/content/internal/**` với mã `HTTP 404 Not Found`.
   - Lọc bỏ mọi header `X-Internal-Api-Key` do client tự gửi lên.
   - Giới hạn các endpoint công khai thuộc `/api/content` chỉ chấp nhận phương thức `GET` cho `categories`, `pois`, `routes`, `zones`.

3. **Xác Thực Quản Trị Viên An Toàn (`AdminAuthGlobalFilter`)**:
   - Yêu cầu header `X-Admin-Key` đối với `/api/content/admin/**` và `/api/analytics/summary`.
   - Cơ chế so sánh chuỗi thời gian hằng số (`MessageDigest.isEqual`) nhằm ngăn ngừa tấn công kênh bên (timing attack).
   - Không chuyển tiếp header `X-Admin-Key` xuống các dịch vụ backend.

4. **Giới Hạn Tần Suất Gọi API (`AnalyticsRateLimitGlobalFilter`)**:
   - Giới hạn tối đa 60 request/phút theo IP trên endpoint ghi nhận sự kiện `POST /api/analytics/events`.
   - Sử dụng địa chỉ IP kết nối TCP trực tiếp (không tin cậy header X-Forwarded-For để tránh giả mạo).
   - Trả về `HTTP 429 Too Many Requests` kèm chỉ dẫn thời gian thử lại trong header `Retry-After`.
