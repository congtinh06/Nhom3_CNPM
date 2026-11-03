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
- Service: mọi lỗi do handler/filter/service (400, 401, 403, 404, 409, 429, 500...) đều qua `ProblemDetailWriter` / `GlobalExceptionHandler`.
