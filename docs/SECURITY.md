# Chính sách Bảo mật — Echora

Tài liệu mô tả các biện pháp bảo mật đang được triển khai trong hệ thống Echora, cùng các giới hạn đã biết và kế hoạch cải thiện.

---

## 1. Xác thực và Phân quyền

### JWT + HttpOnly Cookie

- Access token ngắn hạn (mặc định 15 phút) lưu trong memory, không lưu localStorage.
- Refresh token xoay vòng lưu trong `HttpOnly`, `SameSite=Strict` cookie — không bị XSS đọc.
- `JwtAuthenticationFilter.java` xác minh chữ ký JWT tại gateway trước khi forward.
- `AdminAuthGlobalFilter.java` chặn tất cả path `/api/admin/**`, `/api/content/admin/**`, `/api/auth/admin/**`, `/api/analytics/summary` — yêu cầu role ADMIN.

### Google OAuth2

- Xác minh `id_token` phía server (`auth-service`) qua Google API — không tin vào dữ liệu từ client.

### Phân quyền audio

- `AudioEntitlementFilter.java` kiểm tra `X-User-Plan` và `unlockedPoiIds` trước khi stream audio ngôn ngữ trả phí.
- Anonymous: chỉ được nghe audio tiếng Việt của POI miễn phí.

---

## 2. Quản lý Bí mật

- Không có mật khẩu, token, hash trong mã nguồn được commit (commit `4e46912` xóa toàn bộ giá trị còn lại).
- `.env.example` chứa tên khóa, không chứa giá trị thật.
- File `.env` nằm trong `.gitignore`, không bao giờ được commit.
- `RABBITMQ_ERLANG_COOKIE`, mật khẩu DB, `JWT_SECRET`, `INTERNAL_API_KEY`, `ADMIN_X_KEY` đều lấy từ biến môi trường; service fail-fast khi thiếu (commit `4e46912`).

---

## 3. Security Headers

### API Gateway (Spring)

Được thiết lập trong `SecurityHeadersFilter.java` (commit `7a2baf6`):

| Header | Giá trị |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(self)` |

### Frontend (Vercel)

Được thiết lập trong `vercel.json`:

| Header | Giá trị |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(self), camera=(self)` |
| `Content-Security-Policy-Report-Only` | Chính sách đầy đủ (report-only, chưa enforce) |

---

## 4. CORS

- `CorsConfig.java` chỉ cho phép origin tường minh (danh sách từ biến môi trường `FRONTEND_URLS`), không dùng wildcard với `allowCredentials=true`.
- `OriginCheckFilter.java` trong `auth-service` kiểm tra origin cho các endpoint nhạy cảm.

---

## 5. Rate Limiting

- `AnalyticsRateLimitGlobalFilter.java`: 60 request/phút per IP thật (`X-Forwarded-For` đầu tiên trong danh sách trusted proxy), chỉ áp dụng cho `POST /api/analytics/events`.
- Commit `a95d9fb` đã sửa key resolver từ socket IP sang trusted IP.

---

## 6. Bảo vệ Internal API

- Header `X-Internal-Api-Key` bắt buộc cho tất cả giao tiếp service-to-service (OpenFeign).
- Gateway chặn path nội bộ (`/internal/**`) không cho client bên ngoài truy cập.
- `PathGuardFilter.java` tại gateway loại bỏ header `X-Internal-Api-Key` từ request đến trước khi forward.

---

## 7. Dead-Letter Queue

- `analytics.event.dlq` và `poi.dlq` ghi lại message lỗi sau tối đa 3 lần retry.
- Consumer DLQ (`DlqPoisonMessageConsumer.java`) log và discard poison message — tránh loop vô tận.

---

## 8. Giới hạn đã biết

| # | Giới hạn | Kế hoạch |
|---|---|---|
| 1 | Tunnel ngrok không có IP allowlist — bề mặt tấn công lớn hơn cần thiết | Dùng ngrok IP Restrictions (trả phí) hoặc VPS cố định cho demo |
| 2 | `Content-Security-Policy` ở chế độ `Report-Only`, chưa enforce | Chuyển sang `Content-Security-Policy` sau khi kiểm tra không có lỗi report |
| 3 | Không có SMTP thật → email verification không hoạt động trong demo | Cấu hình SMTP khi triển khai thật |
| 4 | Audio storage trên volume local — không có CDN, không có backup | Tích hợp Supabase Storage hoặc S3 |
| 5 | Chưa có log aggregation / alerting tập trung | Thêm Grafana Loki hoặc ELK sau khi có VPS |
| 6 | Rate limit analytics chỉ áp dụng cho 1 endpoint | Mở rộng rate limit cho các endpoint còn lại nếu cần |

---

## 9. Checklist trước khi nộp / deploy thật

- [ ] Xóa toàn bộ giá trị mẫu trong `.env.example` (thay bằng `<FILL_ME>`)
- [ ] Rotate: `JWT_SECRET`, `INTERNAL_API_KEY`, `ADMIN_X_KEY`, tất cả mật khẩu DB, `RABBITMQ_DEFAULT_PASS`
- [ ] Thêm Vercel domain vào `FRONTEND_URLS` trong `.env`
- [ ] Thêm Vercel domain vào Google OAuth Authorized origins
- [ ] Bật `REFRESH_COOKIE_SECURE=true` khi deploy HTTPS
- [ ] Chuyển `Content-Security-Policy-Report-Only` thành `Content-Security-Policy` sau khi không còn lỗi report
- [ ] Kiểm tra tunnel không còn expose sau buổi demo
