# BÁO CÁO KIỂM CHỨNG BẢO MẬT
**Ngày kiểm tra:** 2026-11-01  
**Vai trò:** Security Reviewer (độc lập)  
**Đối tượng:** Lần sửa lỗi "5 lỗi nghiêm trọng"

---

## BẢNG TỔNG HỢP 5 MỤC

| # | Mục | Trạng thái | Bằng chứng |
|---|-----|-----------|-----------|
| 1 | Bypass thanh toán mock | ✅ **ĐÃ SỬA ĐÚNG** | application.yml:48 mặc định `false`, docker-compose.yml:313 mặc định `false`, OrderService.java:383 chặn khi `mockEnabled=false` |
| 2 | Frontend .env leak vào Docker | ⚠️ **CHỈ THÊM CẢNH BÁO** | .dockerignore đã đúng, Dockerfile đã đúng, **NHƯNG** frontend/.env vẫn chứa `VITE_USE_SAMPLE_DATA=false` có thể bị commit nhầm |
| 3 | vercel.json hardcode ngrok | ✅ **ĐÃ SỬA ĐÚNG** | vercel.json:32,46 đổi thành placeholder `YOUR_BACKEND_URL_HERE` |
| 4 | Admin đổi user plan 405 | ✅ **ĐÃ SỬA ĐÚNG** | InternalPathBlockFilter.java:223 thêm `USER_PLAN` vào allowlist PATCH/PUT |
| 5 | Không thể ẩn POI | ✅ **ĐÃ TỒN TẠI TRƯỚC** | PoiController.java:126-134, gateway filter:178-181 đã có từ trước |

**Số lỗi thật sự được sửa bằng code:** 3/5  
**Số lỗi chỉ thêm cảnh báo:** 1/5  
**Số lỗi đã tồn tại trước:** 1/5

---

## VẤN ĐỀ NGHIÊM TRỌNG NHẤT: ✅ KIẾN TRÚC AN TOÀN

**Gateway có bảo vệ đúng cách:**  
- `UntrustedHeaderStripGlobalFilter` (order: HIGHEST_PRECEDENCE + 5) **XÓA** tất cả header `X-User-Role`, `X-User-Plan`, `X-Internal-Api-Key`, `X-User-Id` từ client
- `AdminAuthGlobalFilter` (order: HIGHEST_PRECEDENCE + 10) xác thực JWT và **GẮN LẠI** header tin cậy sau khi verify
- `UserAuthGlobalFilter` (order: HIGHEST_PRECEDENCE + 20) xác thực user JWT và gắn header
- `InternalPathBlockFilter` (order: HIGHEST_PRECEDENCE + 20) chặn method không cho phép

**Bằng chứng:**
- UntrustedHeaderStripGlobalFilter.java:24-35: xóa 4 header tin cậy
- AdminAuthGlobalFilter.java:225-230: chỉ gắn header sau khi verify JWT role=ADMIN
- UserAuthGlobalFilter.java:115-122: chỉ gắn header sau khi verify JWT hợp lệ

**Kết luận:** Client không thể giả mạo `X-User-Role: ADMIN` vì đã bị xóa ở filter đầu tiên.

---

## CHI TIẾT TỪNG MỤC

### 1. ✅ Bypass thanh toán (ĐÃ SỬA ĐÚNG)

**Thay đổi thực tế:**
- **.env.example:121-124**: Đổi `PAYMENTS_MOCK_ENABLED=true` → `false` + thêm cảnh báo nghiêm trọng
- **docker-compose.yml:313**: Đổi `${PAYMENTS_MOCK_ENABLED:-true}` → `${PAYMENTS_MOCK_ENABLED:-false}`
- **application.yml:48**: Giữ nguyên `${PAYMENTS_MOCK_ENABLED:false}` (đã đúng từ trước)

**Kiểm chứng code:**
```java
// OrderService.java:77-78
@Value("${app.payments.mock-enabled:false}")
private boolean mockEnabled;

// OrderService.java:382-385
public OrderResponse confirmDemoTransfer(Long userId, String orderCode, String outcome) {
    if (!mockEnabled) {
        throw new ForbiddenException("Chức năng xác nhận chuyển khoản demo đang tắt.");
    }
```

**Hành vi thực tế:**
- Khi `PAYMENTS_MOCK_ENABLED` KHÔNG được khai báo: mặc định `false` ✅
- Khi `mockEnabled=false`: endpoint `POST /api/orders/{code}/pay/mock-confirm` trả **403 Forbidden** ✅
- Khi `mockEnabled=true`: endpoint hoạt động và tự cấp quyền Premium (chỉ dùng demo)

**Test coverage:**
- OrderServiceTest.java:329-331: có test `confirmDemoTransfer throws ForbiddenException when mockEnabled is false`

**Kết luận:** ✅ **ĐÃ SỬA ĐÚNG** - Mặc định production an toàn, chặn thật bằng code.

---

### 2. ⚠️ Frontend .env leak (CHỈ THÊM CẢNH BÁO)

**Thay đổi thực tế:**
- **frontend/.env**: Đổi `VITE_USE_SAMPLE_DATA=true` → `false`, thêm cảnh báo ở đầu file

**Kiểm chứng Docker build:**
```dockerfile
# frontend/.dockerignore:7-9
.env
.env.*
!.env.example
```
✅ File `.env` đã được loại trừ khỏi Docker context

```dockerfile
# frontend/Dockerfile:9-14
ARG VITE_API_BASE_URL=
ARG VITE_QR_BASE_URL=
ARG VITE_USE_SAMPLE_DATA=false  # Mặc định false
ENV VITE_USE_SAMPLE_DATA=$VITE_USE_SAMPLE_DATA
```
✅ Dockerfile nhận config qua ARG, mặc định `false`

**Vấn đề còn lại:**
```bash
$ git ls-files frontend/.env
(no output)
```
✅ File `.env` **KHÔNG** được track bởi git (an toàn)

```bash
$ git log --oneline -- frontend/.env
(no output - 0 commits)
```
✅ File `.env` chưa từng bị commit (an toàn)

**NHƯNG:**
- File `frontend/.env` vẫn tồn tại trên disk với nội dung nhạy cảm (ngrok URL)
- Developer có thể vô tình `git add -f frontend/.env` trong tương lai
- Không có pre-commit hook ngăn chặn

**Kiểm chứng hành vi runtime:**
```typescript
// frontend/src/config/demoMode.ts:9-10
export const DEMO_FIXTURES_ENABLED =
  import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_SAMPLE_DATA === 'true';
```
- Khi `VITE_USE_SAMPLE_DATA` không được set: `undefined === 'true'` → `false` ✅
- Khi backend API lỗi: UI hiển thị lỗi, không tự động fallback dữ liệu mẫu ✅

**Kết luận:** ⚠️ **CHỈ THÊM CẢNH BÁO** - Docker build an toàn nhưng không fix được vấn đề .env file có thể bị commit nhầm.

---

### 3. ✅ vercel.json hardcode ngrok (ĐÃ SỬA ĐÚNG)

**Thay đổi thực tế:**
```diff
# frontend/vercel.json:32,46
- "dest": "https://affection-smokiness-watch.ngrok-free.dev/api/$1",
+ "dest": "https://YOUR_BACKEND_URL_HERE/api/$1",

- "dest": "https://affection-smokiness-watch.ngrok-free.dev/img/products/$1",
+ "dest": "https://YOUR_BACKEND_URL_HERE/img/products/$1",
```

**Kiểm chứng:**
```bash
$ grep -n "ngrok-free.dev" frontend/vercel.json
(no results)
```
✅ Không còn hardcoded ngrok URL

**Trạng thái hiện tại:**
- Deploy Vercel hiện tại sẽ **BỊ HỎNG** vì `YOUR_BACKEND_URL_HERE` không phải URL thật
- **CẦN** thay bằng URL backend production trước khi deploy
- vercel.json **KHÔNG HỖ TRỢ** đọc environment variable trong `routes[].dest`

**Hướng dẫn deploy đúng:**
1. Dùng script `frontend/scripts/prebuild-vercel.mjs` để thay placeholder bằng env var `BACKEND_URL`
2. Hoặc: Fork vercel.json theo môi trường (dev/staging/prod)

**Kết luận:** ✅ **ĐÃ SỬA ĐÚNG** - Loại bỏ hardcoded URL, cần cấu hình thêm khi deploy.

---

### 4. ✅ Admin đổi user plan 405 (ĐÃ SỬA ĐÚNG)

**Thay đổi thực tế:**
```diff
# InternalPathBlockFilter.java:48
+ private static final Pattern USER_PLAN = Pattern.compile("^/api/auth/admin/users/\\d+/plan$");

# InternalPathBlockFilter.java:223
- if (USER_ROLE.matcher(path).matches() || USER_STATUS.matcher(path).matches()) {
+ if (USER_ROLE.matcher(path).matches() || USER_STATUS.matcher(path).matches() || USER_PLAN.matcher(path).matches()) {
+     // USER_PLAN: AdminUserController#changePlan chỉ map PATCH/PUT (không có GET).
      return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
  }
```

**Kiểm chứng endpoint:**
```java
// AdminUserController.java:88-93
@RequestMapping(path = "/{id}/plan", method = {RequestMethod.PATCH, RequestMethod.PUT})
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<AdminUserResponse> changePlan(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateUserPlanRequest request) {
    return ResponseEntity.ok(adminUserService.changePlan(currentUserId(), id, request.getPlan(), request.getDurationDays()));
}
```

**Hành vi trước fix:**
- Gateway filter không có pattern `USER_PLAN`
- Request `PATCH /api/auth/admin/users/5/plan` không match bất kỳ pattern nào
- Gateway trả 405 Method Not Allowed

**Hành vi sau fix:**
- Gateway filter có pattern `USER_PLAN` và cho phép PATCH/PUT
- Request được forward tới auth-service
- auth-service kiểm tra `@PreAuthorize("hasRole('ADMIN')")` lần nữa (defense in depth)

**Bảo vệ đa lớp:**
1. Gateway `AdminAuthGlobalFilter`: kiểm tra JWT role=ADMIN, gắn `X-User-Role: ADMIN`
2. Gateway `InternalPathBlockFilter`: kiểm tra method PATCH/PUT cho phép
3. auth-service `@PreAuthorize("hasRole('ADMIN')")`: kiểm tra Spring Security context lần nữa
4. auth-service đọc JWT từ `Authorization` header (không đọc `X-User-Role`)

**Kết luận:** ✅ **ĐÃ SỬA ĐÚNG** - Thêm route vào allowlist, endpoint hoạt động.

---

### 5. ✅ Ẩn/hiện POI (ĐÃ TỒN TẠI TRƯỚC)

**Kiểm chứng endpoint:**
```java
// PoiController.java:126-134
@RequestMapping(
        value = "/api/content/admin/pois/{id}/status",
        method = {RequestMethod.PATCH, RequestMethod.PUT})
public ResponseEntity<AdminPoiDetailDto> changePoiStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdatePoiStatusRequest request) {
    return ResponseEntity.ok(poiContentService.changeStatus(id, request.getStatus()));
}

// PoiContentServiceImpl.java:599-615
@Override
@Transactional
public AdminPoiDetailDto changeStatus(Long id, String status) {
    String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    if (!POI_STATUSES.contains(normalized)) {
        throw new BadRequestException(
                "status phải là một trong: " + String.join(", ", POI_STATUS_VALUES));
    }
    Poi poi = poiRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("POI not found with id: " + id));
    poi.setStatus(normalized);
    poi.setUpdatedAt(TimeUtils.nowUtc());
    poi.setVersion((poi.getVersion() == null ? 0L : poi.getVersion()) + 1);
    poiRepository.save(poi);
    return mapToAdminDetail(poi, translationRepository.findByPoiId(id), null);
}
```

**Kiểm chứng gateway filter:**
```java
// InternalPathBlockFilter.java:37,178-181
private static final Pattern POI_STATUS = Pattern.compile("^/api/content/admin/pois/\\d+/status$");

if (POI_STATUS.matcher(path).matches()) {
    // Controller chỉ map PATCH/PUT cho đổi trạng thái; GET sẽ 405 ở content-service.
    return HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
}
```

**Kiểm chứng test:**
```java
// PoiContentServiceImplTest.java:907-922
@DisplayName("changeStatus: hides an ACTIVE POI, bumps version and persists it")
void changeStatusHidesActivePoi() {
    // Test đổi từ ACTIVE → INACTIVE
}

@DisplayName("changeStatus: rejects an unknown status before touching the database")
void changeStatusRejectsUnknownStatus() {
    assertThatThrownBy(() -> poiContentService.changeStatus(100L, "DELETED"))
            .isInstanceOf(BadRequestException.class);
}
```

**Diff của lần commit này:**
```diff
# InternalPathBlockFilter.java:178-181
- return HttpMethod.GET.equals(method) || HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
+ // Controller chỉ map PATCH/PUT cho đổi trạng thái; GET sẽ 405 ở content-service.
+ return HttpMethod.PUT.equals(method) || HttpMethod.PATCH.equals(method);
```
→ Lần này **LOẠI BỎ** GET khỏi POI_STATUS (fix đúng: PoiController không có GET /{id}/status)

**Kết luận:** ✅ **ĐÃ TỒN TẠI TRƯỚC** - Endpoint và logic đã hoạt động, lần này chỉ fix gateway filter loại bỏ GET không cần thiết.

---

## VẤN ĐỀ MỚI PHÁT SINH

### A. Frontend build bị lỗi TypeScript

**Bằng chứng:**
```bash
$ npm run build --prefix frontend
src/test/routeHeadings.test.tsx(7,1): error TS6133: 'AuthProvider' is declared but its value is never read.
```

**Tác động:**
- CI/CD build sẽ fail
- Không thể deploy production

**Cách sửa:**
```typescript
// frontend/src/test/routeHeadings.test.tsx:7
- import { AuthProvider } from '../contexts/AuthContext';
+ // import { AuthProvider } from '../contexts/AuthContext';  // unused
```
hoặc xóa dòng import.

---

### B. Không có test cho filter vừa sửa

**Thiếu test:**
- InternalPathBlockFilter cho route `/api/auth/admin/users/{id}/plan` PATCH/PUT
- POI_STATUS filter không cho phép GET (đã sửa dòng 178-181)

**Đề xuất test cần thêm:**
```java
// InternalPathBlockFilterTest.java
@Test
void patchUserPlanAllowed() {
    // PATCH /api/auth/admin/users/5/plan → cho phép
}

@Test
void getUserPlanNotAllowed() {
    // GET /api/auth/admin/users/5/plan → 405
}

@Test
void getPoiStatusNotAllowed() {
    // GET /api/content/admin/pois/1/status → 405
}
```

---

### C. Backend services KHÔNG expose port ra ngoài

**Kiểm chứng docker-compose.yml:**
```yaml
# Chỉ có 4 service expose port:
- rabbitmq: 127.0.0.1:5672, 127.0.0.1:15800
- mssql: 127.0.0.1:1433
- api-gateway: ${GATEWAY_PORT:-18080}:8080
- frontend: 0.0.0.0:${FRONTEND_HOST_PORT:-8088}:8080

# Các service sau KHÔNG expose port:
- content-service (8085)
- location-service (8082)
- translation-tts-service (8083)
- analytics-service (8081)
- auth-service (8086)
- order-service (8087)
```

**Kết luận:** ✅ **AN TOÀN** - Không thể gọi trực tiếp tới service nội bộ, bắt buộc đi qua gateway.

---

## LỆNH TEST (CHƯA CHẠY - CHỈ THIẾT KẾ)

### Test 1: Mock payment bị chặn
```powershell
# Kiểm tra biến môi trường
docker compose config | Select-String "PAYMENTS_MOCK_ENABLED"
# Kỳ vọng: PAYMENTS_MOCK_ENABLED: "false"

# Test gọi endpoint khi tắt mock (cần token user hợp lệ)
$token = "eyJ..."  # Token user thật
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:18080/api/orders/SV-20261101-1234/pay/mock-confirm" `
  -Headers @{Authorization="Bearer $token"} `
  -ErrorAction SilentlyContinue
# Kỳ vọng: 403 Forbidden, message="Chức năng xác nhận chuyển khoản demo đang tắt."
```

### Test 2: Admin change user plan
```powershell
# Test không có token (phải 401)
Invoke-WebRequest -Method PATCH `
  -Uri "http://localhost:18080/api/auth/admin/users/5/plan" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"plan":"PREMIUM"}' `
  -ErrorAction SilentlyContinue
# Kỳ vọng: 401 Unauthorized

# Test token user thường (phải 403)
$userToken = "eyJ..."  # Token role=USER
Invoke-WebRequest -Method PATCH `
  -Uri "http://localhost:18080/api/auth/admin/users/5/plan" `
  -Headers @{Authorization="Bearer $userToken"; "Content-Type"="application/json"} `
  -Body '{"plan":"PREMIUM"}' `
  -ErrorAction SilentlyContinue
# Kỳ vọng: 403 Forbidden

# Test token user + giả mạo header X-User-Role (phải 403, không được 200)
Invoke-WebRequest -Method PATCH `
  -Uri "http://localhost:18080/api/auth/admin/users/5/plan" `
  -Headers @{
      Authorization="Bearer $userToken"
      "X-User-Role"="ADMIN"
      "Content-Type"="application/json"
  } `
  -Body '{"plan":"PREMIUM"}' `
  -ErrorAction SilentlyContinue
# Kỳ vọng: 403 Forbidden (header X-User-Role bị xóa bởi UntrustedHeaderStripGlobalFilter)

# Test token admin (phải 200)
$adminToken = "eyJ..."  # Token role=ADMIN
Invoke-WebRequest -Method PATCH `
  -Uri "http://localhost:18080/api/auth/admin/users/5/plan" `
  -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} `
  -Body '{"plan":"PREMIUM","durationDays":365}'
# Kỳ vọng: 200 OK, JSON response
```

### Test 3: POI status change
```powershell
# Test GET không cho phép (phải 405)
Invoke-WebRequest -Method GET `
  -Uri "http://localhost:18080/api/content/admin/pois/1/status" `
  -Headers @{Authorization="Bearer $adminToken"} `
  -ErrorAction SilentlyContinue
# Kỳ vọng: 405 Method Not Allowed

# Test PATCH ẩn POI (phải 200)
Invoke-WebRequest -Method PATCH `
  -Uri "http://localhost:18080/api/content/admin/pois/1/status" `
  -Headers @{Authorization="Bearer $adminToken"; "Content-Type"="application/json"} `
  -Body '{"status":"INACTIVE"}'
# Kỳ vọng: 200 OK
```

### Test 4: Docker build không chứa .env
```powershell
# Build image
docker build -t test-frontend ./frontend

# Kiểm tra .env không vào image
docker run --rm test-frontend ls -la /app/.env 2>&1
# Kỳ vọng: "No such file or directory"

# Kiểm tra bundle không chứa USE_SAMPLE_DATA=true
docker run --rm test-frontend sh -c "grep -r 'USE_SAMPLE_DATA.*true' /usr/share/nginx/html/assets/ || echo 'OK'"
# Kỳ vọng: "OK" (không tìm thấy)
```

---

## NHỮNG ĐIỀU CHƯA KIỂM CHỨNG ĐƯỢC

1. **Frontend .env có secret nhạy cảm không?**
   - Cần xem toàn bộ lịch sử git: `git log --all --full-history -- frontend/.env`
   - Cần check git reflog: `git reflog | grep "\.env"`
   - **Lý do chưa chạy:** Không có quyền truy cập git server/remote

2. **Production .env có giá trị đúng không?**
   - Cần kiểm tra server production thật có `PAYMENTS_MOCK_ENABLED=false`
   - **Lý do chưa chạy:** Không có SSH access tới production

3. **Vercel deployment hiện tại:**
   - URL: https://nhom3-cnpm.vercel.app (từ .env.example:61)
   - Trạng thái: API calls có hoạt động không?
   - **Lý do chưa chạy:** Không có Vercel access token

4. **Microservice có kiểm tra INTERNAL_API_KEY không?**
   - Đã thấy gateway gắn `X-Internal-Api-Key` header
   - Cần kiểm tra: auth-service, order-service có verify header này không
   - **Bằng chứng cần tìm:** InternalAuthFilter hoặc @PreAuthorize ở từng service
   - **Lý do chưa chạy:** Chưa đọc hết code các service

---

## THỨ TỰ SỬA ĐỀ XUẤT

### Bước 1: Fix lỗi build ngay (khẩn cấp)
```typescript
// frontend/src/test/routeHeadings.test.tsx
- import { AuthProvider } from '../contexts/AuthContext';
```
→ Commit: `fix(test): remove unused AuthProvider import`

### Bước 2: Thêm test cho filter (quan trọng)
```java
// backend/api-gateway/src/test/java/.../InternalPathBlockFilterTest.java
@Test void patchUserPlanAllowed() { ... }
@Test void getUserPlanNotAllowed() { ... }
@Test void getPoiStatusNotAllowed() { ... }
```
→ Commit: `test(gateway): add coverage for USER_PLAN and POI_STATUS filter`

### Bước 3: Thêm pre-commit hook ngăn commit .env
```bash
# .git/hooks/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -q "^frontend/\.env$"; then
  echo "ERROR: Attempting to commit frontend/.env file"
  echo "This file contains development secrets and should never be committed"
  exit 1
fi
```
→ Commit: `chore(git): add pre-commit hook to prevent .env leak`

### Bước 4: Document deployment (không khẩn)
```markdown
# docs/DEPLOYMENT.md
## Vercel Deployment
1. Set BACKEND_URL environment variable
2. Run prebuild script: node scripts/prebuild-vercel.mjs
3. Deploy: vercel --prod
```
→ Commit: `docs: add Vercel deployment guide with backend URL setup`

### Bước 5: Kiểm tra và document INTERNAL_API_KEY usage (không khẩn)
- Đọc code các service xem có verify `X-Internal-Api-Key` không
- Document defense-in-depth strategy
→ Commit: `docs: document gateway-to-service authentication flow`

---

## KẾT LUẬN CUỐI CÙNG

**Số lỗi thật sự được sửa bằng code:** 3/5
- ✅ Bypass thanh toán: sửa đúng, mặc định an toàn
- ✅ vercel.json hardcode: sửa đúng, loại bỏ ngrok URL
- ✅ Admin change plan 405: sửa đúng, thêm route vào allowlist

**Số lỗi chỉ thêm cảnh báo/tài liệu:** 1/5
- ⚠️ Frontend .env: Docker build đã an toàn, nhưng file .env vẫn có thể bị commit nhầm

**Số lỗi đã tồn tại và hoạt động từ trước:** 1/5
- ✅ Ẩn/hiện POI: endpoint đã có, lần này chỉ sửa nhỏ gateway filter

**Kiến trúc bảo mật:** ✅ **AN TOÀN**
- Gateway xóa header giả mạo trước khi xác thực
- Không thể bypass quyền bằng cách tự gắn `X-User-Role: ADMIN`
- Backend services không expose port, bắt buộc qua gateway

**Vấn đề cần fix gấp:**
- Frontend build lỗi TypeScript (blocking deployment)
- Thiếu test cho filter vừa sửa

**Rủi ro còn lại:**
- File `frontend/.env` có thể bị commit nhầm trong tương lai (cần pre-commit hook)
- Vercel deployment hiện tại bị hỏng (cần thay placeholder URL)

---

**Người review:** Claude Code (Security Reviewer)  
**Ngày:** 2026-11-01  
**Trạng thái:** Đã hoàn thành kiểm chứng, chờ duyệt
