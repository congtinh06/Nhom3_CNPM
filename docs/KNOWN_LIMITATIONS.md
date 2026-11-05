# Known Limitations & Technical Debt (Hạn chế kỹ thuật đã ghi nhận)

Tài liệu này ghi nhận các điểm hạn chế kiến trúc và nợ kỹ thuật (technical debt) còn tồn đọng trong hệ thống đã được kiểm chứng và đóng băng trong baseline ArchUnit.

---

## 1. Chu trình phụ thuộc gói trong `content-service` (Cyclic Package Dependency)

- **Vị trí**: `backend/content-service`
- **Gói liên quan**: `com.echora.content.service` $\longleftrightarrow$ `com.echora.content.messaging`
- **Chi tiết chu trình**:
  1. `com.echora.content.messaging` gọi `com.echora.content.service`:
     - `PoiAudioEventListener` gọi `PoiAudioUpdateService`
     - `PoiPublishRelay` gọi `PoiPublishService`
     - `PoiPublishRetryJob` gọi `PoiPublishService`
  2. `com.echora.content.service` gọi `com.echora.content.messaging`:
     - `PoiPublishService` inject và gọi `PoiEventPublisher`
     - `PoiContentServiceImpl` khởi tạo `PoiPublishRequestedEvent`
- **Tình trạng kiểm soát**:
  - Đã được đóng băng vào baseline ArchUnit (`archunit_store/fa4725ef-0893-444d-beb9-c3ec704cddfd`).
  - Kiểm thử CI chỉ bắt lỗi khi phát sinh chu trình mới hoặc vi phạm mới; không phá vỡ bản build hiện tại.
- **Phương án giải quyết dài hạn (khi có kế hoạch refactor)**:
  - Tách các event và interface publisher sang package `port` / `event` dùng chung độc lập theo kiến trúc Hexagonal / Clean Architecture.
  - Tầng `service` chỉ phụ thuộc vào interface `EventPublisherPort`, việc triển khai RabbitMQ trong `messaging` sẽ đóng vai trò adapter.

---

## 2. Thống kê vi phạm kiến trúc theo Service (ArchUnit Baseline Summary)

Sau khi hoàn tất tái cấu trúc (loại bỏ truy cập trực tiếp repository và tách enum model):

| Service | Tổng số vi phạm quy tắc MVC | Chi tiết vi phạm |
|---|:---:|---|
| `auth-service` | **0** | Đã chuyển `AdminUserSeeder` sang gọi `UserSeedService`. Không còn truy cập repo trực tiếp. |
| `location-service` | **0** | Tuân thủ 100% quy tắc phân lớp. |
| `translation-tts-service` | **0** | Tuân thủ 100% quy tắc phân lớp. |
| `analytics-service` | **0** | Đã chuyển `AnalyticsEventListener` sang gọi `AnalyticsEventIngestionService`. |
| `order-service` | **0** | Tuân thủ 100% quy tắc phân lớp. |
| `content-service` | **1 rule** (chu trình `messaging` $\leftrightarrow$ `service`) | Đã chuyển `ProductCategory` sang package `model`; `EntitlementFilter` & `PoiPublishRetryJob` gọi qua Service. |

