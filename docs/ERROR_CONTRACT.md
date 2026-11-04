# Error Contract (RFC 7807 ProblemDetail)

Tất cả backend (gateway và các service) đều dùng **một schema lỗi duy nhất**:
RFC 7807 ProblemDetail với `Content-Type: application/problem+json`.

## Schema

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `type` | string | yes | Định danh (identifier) của loại lỗi, mẫu: `https://api.echora.dev/problems/{status}` |
| `title` | string | yes | Tên ngắn, dễ đọc của lỗi, ví dụ `Bad Request`, `Not Found` |
| `status` | integer | yes | Mã HTTP tương ứng: 400, 401, 403, 404, 409, 429, 500 |
| `detail` | string | yes | Thông điệp giải thích chi tiết cho người dùng / developer |
| `instance` | string | yes | URI của API bị lỗi |
| `traceId` | string | yes | ID theo dõi lỗi; do gateway truyền từ `X-Request-Id` (normalize thành `X-Trace-Id`) hoặc tự sinh |
| `errors` | object | no | Map `field -> message` khi lỗi validation (vd: `{"slug": "..."}`) |

Ví dụ body lỗi thành công nhất:

```json
{
  "type": "https://api.echora.dev/problems/403",
  "title": "Forbidden",
  "status": 403,
  "detail": "Bạn không có quyền thực hiện thao tác này.",
  "instance": "/api/admin/products",
  "traceId": "smoke-trace-006"
}
```

Header `X-Trace-Id` của response phải khớp với giá trị `traceId` trong body.

> Lưu ý: `type` là **dinh danh** (identifier) của problem type (URI ổn định theo status),
> không phải nội dung mô tả chi tiết.

## Bảng mã lỗi (tham chiếu từ output smoke test)

| Status | Title | Nguồn | Ví dụ body từ smoke test | Ghi chú |
|---|---|---|---|---|
| 400 | Bad Request | analytics | `{"type":"https://api.echora.dev/problems/400","title":"Bad Request","status":400,"detail":"Malformed JSON request body","instance":"/api/analytics/events","traceId":"..."}` | JSON body không hợp lệ |
| 401 | Unauthorized | gateway / auth | `{"type":"https://api.echora.dev/problems/401","title":"Unauthorized","status":401,"detail":"Phiên đăng nhập không hợp lệ hoặc đã hết hạn.","instance":"/api/orders","traceId":"smoke-trace-005"}` | GET endpoint yêu cầu đăng nhập không token qua gateway |
| 403 | Forbidden | gateway / content | `{"type":"https://api.echora.dev/problems/403","title":"Forbidden","status":403,"detail":"Bạn không có quyền thực hiện thao tác này.","instance":"/api/admin/products","traceId":"smoke-trace-006"}` | Gọi `/api/admin/**` bằng token `USER` |
| 403 | Forbidden | content | `{"type":"https://api.echora.dev/problems/403","title":"Forbidden","status":403,"detail":"Ngôn ngữ này yêu cầu gói Premium đang hoạt động.","instance":"/api/content/pois/1","traceId":"..."}` | `lang=en` yêu cầu Premium |
| 404 | Not Found | content | `{"type":"https://api.echora.dev/problems/404","title":"Not Found","status":404,"detail":"Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: khong-ton-tai","instance":"/api/content/products/khong-ton-tai","traceId":"..."}` | Slug không tồn tại |
| 409 | Conflict | content | `{"type":"https://api.echora.dev/problems/409","title":"Conflict","status":409,"detail":"Conflict: stale version","instance":"/api/content/...","traceId":"..."}` | Dữ liệu xung đột version |
| 429 | Too Many Requests | gateway | `{"type":"https://api.echora.dev/problems/429","title":"Too Many Requests","status":429,"detail":"Rate limit exceeded. Retry after 24 seconds.","instance":"/api/analytics/events","traceId":"..."}` | Vượt rate limit analytics (`Retry-After` header: 24) |

## TraceId

- Client có thể gửi `X-Request-Id`; gateway sẽ normalize thành `X-Trace-Id` rồi truyền xuống service.
- Service dùng giá trị `X-Trace-Id` (hoặc sinh UUID) để điền vào `traceId` của body lỗi và set header `X-Trace-Id`.
- Body lỗi và header response `X-Trace-Id` phải giống nhau.

## Áp dụng

- Gateway: mọi lỗi do filter/gateway handler (401, 403, 429, 500...) đều qua `ProblemDetailSupport`.
- Service: mọi lỗi do handler/filter/service (400, 401, 403, 404, 409, 500...) đều qua `ProblemDetailWriter` / `GlobalExceptionHandler`.

## Chịu lỗi: Circuit Breaker & Retry

Mọi lời gọi liên service/ra ngoài đều được bọc bởi Resilience4j (Circuit Breaker + Retry cho GET idempotent).
Cấu hình chi tiết nằm ở `application.yml` của từng service; phần dưới ghi lại **lý do chọn `max-attempts`**.

### Ngân sách thời gian (worst-case) so với timeout của gateway

Gateway đặt `response-timeout` 15s cho toàn cục và cho các route content/order
(`GATEWAY_RESPONSE_TIMEOUT`, `GATEWAY_CONTENT_RESPONSE_TIMEOUT_MS`, `GATEWAY_ORDER_RESPONSE_TIMEOUT_MS`),
và 60s cho route audio (`GATEWAY_AUDIO_RESPONSE_TIMEOUT_MS`). Điều kiện bắt buộc:

```
(read timeout × max-attempts) + backoff (200ms × (max-attempts − 1) × 2^k) < gateway timeout
```

| Instance (service → đích) | Read timeout | max-attempts | Worst-case | Gateway timeout | Ghi chú |
|---|---|---|---|---|---|
| `locationContentService` (location → content) | 5s | **2** | 2×5s + 0.2s = **10.2s** | 15s | 3 lần thử sẽ là 15.6s > 15s nên chỉ giữ 1 lần retry |
| `contentAuthEntitlement` (content → auth) | 3s | 3 | 3×3s + 0.6s = **9.6s** | 15s | Còn dư ngân sách |
| `orderContentPoiPrice` (order → content, GET) | 3s | 3 | 3×3s + 0.6s = **9.6s** | 15s | Còn dư ngân sách |
| `translationMyMemory` (translation → MyMemory) | 10s | 3 | 3×10s + 0.6s = **30.6s** | 60s (audio) | Còn dư ngân sách |
| `translationEdgeTts` (edge-tts) | **120s** (`TTS_TIMEOUT_MS`) | **1** (không retry) | 120s / lần | không qua gateway (chạy async qua RabbitMQ) | Pipeline đã tự retry; `slow-call-duration-threshold: 115s` > max hợp lệ 112.866s và < timeout 120s |

### Vì sao `locationContentService` dùng `max-attempts: 2` (khác 3)

`location-service` gọi `content-service` bằng Feign với **read timeout 5s** (giữ nguyên timeout cũ, không hạ).
Nếu để 3 lần thử: `3 × 5s + backoff ≈ 15.6s`, **vượt** `response-timeout 15s` của gateway → gateway cắt
trước khi service kịp trả fallback `degraded=true`. Vì vậy giảm xuống **1 lần retry** (tổng 2 attempt),
worst-case `10.2s < 15s`, fallback luôn kịp trả về trong ngân sách của gateway.

> Quy tắc: nếu `read timeout × max-attempts + backoff` không nhỏ hơn timeout gateway, phải **giảm số lần thử
> hoặc giảm timeout**, không được để retry vượt ngân sách (retry sẽ vô nghĩa vì client đã ngắt kết nối).

### Retry chỉ áp dụng cho GET idempotent

`Retry` bọc **ngoài** `CircuitBreaker` (thứ tự: Retry → CircuitBreaker → call) và chỉ bật cho `GET`.
`POST`/`PUT` không retry trừ khi có idempotency key, để tránh tạo trùng đơn/ghi trùng dữ liệu.
Lỗi 4xx (`FeignException$BadRequest`, `$Unauthorized`, `$Forbidden`, `$NotFound`, ...) được đưa vào
`ignore-exceptions` của circuit breaker: lỗi do phía client **không** làm breaker mở.

