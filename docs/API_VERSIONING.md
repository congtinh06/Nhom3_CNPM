# Quy ước Định phiên bản API (API Versioning)

Tài liệu này xác lập quy chuẩn quản lý phiên bản cho toàn bộ API trong hệ thống Echora.

---

## 1. Nguyên tắc cốt lõi: Không thay đổi đường dẫn URL hiện tại

- Toàn bộ đường dẫn API của các service nghiệp vụ được **giữ nguyên cấu trúc URL hiện tại**, đi qua API Gateway:
  - `auth-service`: `/api/auth/**`
  - `content-service`: `/api/content/**`
  - `location-service`: `/api/location/**`
  - `translation-tts-service`: `/api/tts/**`
  - `analytics-service`: `/api/analytics/**`
  - `order-service`: `/api/orders/**`, `/api/admin/orders/**`
  - `api-gateway`: `/v3/api-docs/**`, `/swagger-ui.html`
- Không đưa version vào URL (như `/api/v1/auth`, `/api/v2/orders`) vì làm phân mảnh client, tăng chi phí bảo trì routing và phá vỡ các hợp đồng đang hoạt động của frontend và thiết bị QR scanner.

---

## 2. Quy ước Version trong OpenAPI Info

Phiên bản của từng service được công bố chính thức qua trường `info.version` trong tài liệu OpenAPI JSON (`/v3/api-docs/<service>`), tuân thủ chuẩn **Semantic Versioning (SemVer 2.0.0)**:

$$\text{MAJOR}.\text{MINOR}.\text{PATCH}$$

- **Phiên bản khởi điểm hiện tại**: `1.0.0` cho toàn bộ 6 microservice.
- **Title**: Đặt đúng tên định danh service (`Echora Auth Service`, `Echora Content Service`, v.v.).

### Khi nào tăng phiên bản?

| Loại | Quy tắc | Ví dụ áp dụng |
|---|---|---|
| **MAJOR** (1.x.x $\to$ 2.0.0) | Có thay đổi **phá vỡ tương thích ngược** (Breaking Change). | Xóa một endpoint công khai; xóa hoặc đổi tên một trường trong JSON response; đổi kiểu dữ liệu (vd: từ `number` sang `string`); bổ sung trường bắt buộc mới trong request body. |
| **MINOR** (1.0.x $\to$ 1.1.0) | Bổ sung tính năng mới nhưng **hoàn toàn tương thích ngược**. | Thêm endpoint mới; thêm trường tùy chọn (optional) trong response; hỗ trợ thêm query parameter tùy chọn; bổ sung mã ngôn ngữ mới (`ko`, `ja`). |
| **PATCH** (1.0.0 $\to$ 1.0.1) | Sửa lỗi (Bug fix) hoặc cập nhật tài liệu nội bộ không ảnh hưởng contract. | Sửa lỗi tính toán logic bên trong service; cập nhật text mô tả trong OpenAPI docs; sửa regex validation không làm hẹp dữ liệu hợp lệ. |

---

## 3. Quy trình Ngừng hỗ trợ Endpoint (Deprecation Strategy)

Khi một endpoint hoặc một trường dữ liệu cần thay thế, hệ thống áp dụng quy trình chuyển tiếp an toàn, không xóa đột ngột:

1. **Đánh dấu lỗi thời (Mark Deprecated)**:
   - Gắn annotation `@Deprecated` trên Java Controller method.
   - Thêm `@Operation(summary = "...", deprecated = true)` để Swagger UI hiển thị gạch ngang và cảnh báo lập trình viên.
2. **Cảnh báo qua HTTP Header chuẩn**:
   - Service trả thêm header:
     - `Deprecation: true` (chuẩn RFC)
     - `Sunset: <HTTP-Date>` (thời điểm chính thức đóng endpoint, tối thiểu **6 tháng** kể từ ngày thông báo).
3. **Thời gian ân hạn (Grace Period)**:
   - Duy trì song song endpoint cũ và endpoint mới trong suốt thời gian ân hạn.
   - Client (Frontend, Third-party) chuyển đổi sang endpoint mới.
4. **Loại bỏ chính thức (Sunset & Removal)**:
   - Chỉ được gỡ bỏ endpoint khi tăng số **MAJOR** của service.
   - Ghi nhận chi tiết trong `CHANGELOG.md` và thông báo tới các bên liên quan.

---

## 4. Bảo mật Tài liệu trên Môi trường Triển khai

- Biến môi trường `ECHORA_DOCS_ENABLED`:
  - **Local (`docker-compose.yml`)**: `true` (truy cập Swagger UI gom tại Gateway `http://localhost:18080/swagger-ui.html`).
  - **Deploy/Production (`docker-compose.deploy.yml`)**: `false` (mặc định bảo mật).
- Khi tắt: mọi lời gọi tới `/v3/api-docs/**` và `/swagger-ui/**` qua Gateway đều bị chặn sớm bởi `OpenApiDocsFilter` và trả về `404 Not Found` theo chuẩn RFC 7807 `ProblemDetail`, không làm lộ thông tin cấu trúc API của hệ thống.
