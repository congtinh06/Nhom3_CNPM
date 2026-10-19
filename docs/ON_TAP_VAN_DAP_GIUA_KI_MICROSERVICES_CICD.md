# TÀI LIỆU TRỌNG TÂM REVIEW CODE & VẤN ĐÁP GIỮA KỲ
## Dự Án: ECHORA / SAIGONVOICE — Nền Tảng Hướng Dẫn Viên Du Lịch Đa Ngôn Ngữ Tự Động
### Chuyên đề: 6 Microservices, Giao tiếp Feign/RabbitMQ, Pipeline Thuyết minh, Bảo mật JWT & CI/CD
**Định dạng: Phông chữ Times New Roman, Màu chữ đen, Kèm đoạn mã nguồn (Code Snippets) thực tế**

---

### CHỦ ĐỀ 01: 6 MICROSERVICES TRONG HỆ THỐNG & HAI LUỒNG GIAO TIẾP CỐT LÕI
* **Câu hỏi của Thầy:** *"Hệ thống gồm những service nào? Mở code chỉ cho thầy chỗ nào GỬI, chỗ nào NHẬN giữa các service?"*

#### 1. Đoạn code Giao tiếp Đồng bộ (Sync) qua REST OpenFeign:
* 📁 File GỬI: `backend/location-service/.../client/ContentServiceClient.java`
```java
@FeignClient(name = "content-service-client", url = "${content-service.url}")
public interface ContentServiceClient {
    @GetMapping("/api/content/internal/pois/bounding-box")
    List<PoiBoundingBoxDto> getPoisInBoundingBox(
            @RequestParam BigDecimal minLat, @RequestParam BigDecimal maxLat,
            @RequestParam BigDecimal minLng, @RequestParam BigDecimal maxLng);
}
```

* 📁 File NHẬN: `backend/content-service/.../controller/PoiController.java` (dòng 58)
```java
@GetMapping("/api/content/internal/pois/bounding-box")
public ResponseEntity<List<PoiBoundingBoxDto>> getPoisInBoundingBox(...) {
    return ResponseEntity.ok(poiContentService.getPoisInBoundingBox(...));
}
```

#### 2. Đoạn code Giao tiếp Bất đồng bộ (Async) qua RabbitMQ:
* 📁 File BẮN TIN: `backend/content-service/.../messaging/PoiEventPublisher.java` (dòng 41)
```java
rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, payload, correlation);
```

* 📁 File HỨNG TIN: `backend/translation-tts-service/.../listener/PoiEventListener.java` (dòng 17)
```java
@RabbitListener(queues = {
    "${app.rabbitmq.queues.poi-created:poi.created.queue}",
    "${app.rabbitmq.queues.poi-updated:poi.updated.queue}"
})
public void onPoiEvent(PoiEventPayload event) {
    pipelineService.processPoiEvent(event);
}
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, hệ thống gồm 6 services (Gateway, Auth, Content, Location, Translation-TTS, Analytics). Trong đó có 2 luồng giao tiếp cốt lõi:  
  (1) `location-service` gọi `content-service` qua **OpenFeign** để lấy dữ liệu tọa độ tức thì cho du khách;  
  (2) `content-service` phát sự kiện sang `translation-tts-service` qua **RabbitMQ** để tự động dịch và sinh giọng đọc ngầm ở phía sau ạ."*

---

### CHỦ ĐỀ 02: BẢN CHẤT CỦA "CỬA NGÕ ĐỊNH TUYẾN" (API GATEWAY)
* **Câu hỏi của Thầy:** *"Cửa ngõ định tuyến là gì? Tại sao các controller như CategoryController có đường dẫn `/api/content/categories` nhưng client lại gọi vào cổng 8080?"*

* 📁 File Controller đích: `backend/content-service/.../controller/CategoryController.java` (dòng 14)
```java
@RestController
@RequestMapping("/api/content/categories")
public class CategoryController {
    @GetMapping
    public ResponseEntity<List<CategoryDto>> getAllCategories() { ... }
}
```

* 📁 Bộ lọc tước bỏ Header giả mạo tại Gateway: `backend/api-gateway/.../UntrustedHeaderStripGlobalFilter.java`
```java
@Override
public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    ServerHttpRequest request = exchange.getRequest().mutate()
            .headers(headers -> {
                headers.remove("X-User-Role");
                headers.remove("X-Internal-Api-Key");
            }).build();
    return chain.filter(exchange.mutate().request(request).build());
}
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, **API Gateway (cổng 8080)** đóng vai trò là cửa ngõ tiếp nhận tập trung duy nhất (Reverse Proxy). Khi Frontend gọi `http://localhost:8080/api/content/categories`, Gateway sẽ nhận diện tiền tố `/api/content/**` và tự động **định tuyến (chuyển tiếp)** yêu cầu sang cổng nội bộ `8085` của `content-service`. Lợi ích là che giấu toàn bộ cổng nội bộ, đồng thời kiểm tra bảo mật, tước bỏ header giả mạo và giới hạn tần suất gọi API ngay tại cửa ngõ."*

---

### CHỦ ĐỀ 03: REST OPENFEIGN — BẢN CHẤT VÀ KHÁI NIỆM HỌC THUẬT
* **Câu hỏi của Thầy:** *"REST OpenFeign là gì? Tại sao không dùng RestTemplate hay HttpClient thông thường?"*

* 📁 File cấu hình Feign: `backend/location-service/.../ContentServiceClientConfiguration.java`
```java
@Bean
public RequestInterceptor internalApiKeyRequestInterceptor() {
    return template -> {
        if (internalApiKey != null && !internalApiKey.trim().isEmpty()) {
            template.header("X-Internal-Api-Key", internalApiKey);
        }
    };
}
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, **Spring Cloud OpenFeign** là một Declarative REST Client (Client HTTP dạng khai báo). Thay vì phải tự mở kết nối, nối URL và ép kiểu JSON thủ công như RestTemplate, OpenFeign cho phép lập trình viên chỉ cần khai báo một **Java Interface** kèm các chú thích Spring Web. Spring Boot sẽ tự động sinh mã proxy gửi HTTP request bên dưới. Ngoài ra nhóm em cấu hình `RequestInterceptor` để tự động gắn khóa bảo mật nội bộ `X-Internal-Api-Key` sang service đích ạ."*

---

### CHỦ ĐỀ 04: CẤU TRÚC MỘT CLASS JAVA (OOP) & KIẾN TRÚC PHÂN TẦNG DỰ ÁN
* **Câu hỏi của Thầy:** *"Một Class Java về mặt lý thuyết gồm những phần nào? Cây thư mục của service phân chia theo mô hình gì?"*

#### 1. Cấu trúc lý thuyết của một Class Java (OOP):
* **Package Declaration:** Khai báo không gian tên / vị trí gói.
* **Imports:** Nạp các thư viện phụ thuộc.
* **Annotations / Metadata:** Siêu dữ liệu chỉ dẫn hành vi cho Spring Boot (ví dụ: `@RestController`, `@Service`).
* **Class Body:** Gồm *Fields (Thuộc tính trạng thái)*, *Constructors (Hàm khởi tạo)*, và *Methods (Phương thức hành vi)*.

#### 2. Mô hình Kiến trúc Phân tầng (Layered Architecture):
* `controller`: **Presentation Layer** — Tiếp nhận request HTTP, kiểm tra hợp lệ dữ liệu và trả về ResponseEntity.
* `service`: **Business Logic Layer** — Thực thi quy tắc nghiệp vụ và thuật toán tính toán.
* `repository`: **Data Access Layer** — Tương tác trực tiếp với CSDL thông qua JPA/Hibernate (CRUD).
* `entity`: **Domain Model** — Ánh xạ trực tiếp với bảng trong CSDL (ORM).
* `dto`: **Data Transfer Object** — Đối tượng đóng gói dữ liệu truyền tải giữa các tầng.

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, về mặt lập trình hướng đối tượng, một Class Java chuẩn gồm 5 thành phần: khai báo package, imports, annotations, thuộc tính và phương thức. Về mặt kiến trúc phần mềm, nhóm em tuân thủ mô hình phân tầng: Controller nhận request ➔ Service xử lý logic nghiệp vụ ➔ Repository thao tác cơ sở dữ liệu qua các thực thể Entity ạ!"*

---

### CHỦ ĐỀ 05: PIPELINE THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ (DỊCH & TẠO AUDIO AI)
* **Câu hỏi của Thầy:** *"Tính năng thuyết minh tự động hoạt động từ lúc nhập dữ liệu đến lúc tạo file audio ra sao?"*

* 📁 File xử lý pipeline: `backend/translation-tts-service/.../PoiPipelineServiceImpl.java` (dòng 115-148)
```java
// 1. Kiểm tra giọng đọc trước khi gọi API dịch thuật (tiết kiệm quota)
ttsVoiceProvider.getVoice(lang);

// 2. Dịch thuật nội dung sang ngôn ngữ mục tiêu (en, ja, ko)
TranslatedPoiContent translated = translationCacheService.getOrTranslate(
        lang, event.getTitle(), event.getSummary(), event.getDescription(), ...);

// 3. Gọi công cụ AI edge-tts sinh file âm thanh .mp3 lưu vào ổ đĩa
TtsAudioResult audioResult = ttsAudioService.synthesize(lang, ttsScript, ...);

// 4. Bắn sự kiện báo hoàn thành về cho content-service
eventPublisher.publishAudioReady(PoiAudioReadyEvent.builder()
        .poiId(event.getPoiId()).languageCode(lang).audioUrl(publicUrl)...build());
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, Quản trị viên chỉ cần nhập bài viết tiếng Việt 1 lần duy nhất. Sau khi commit DB, `PoiPublishRelay` phát sự kiện sang RabbitMQ. Service `translation-tts-service` nhận tin, tự động dịch sang 3 ngôn ngữ (Anh, Nhật, Hàn) và gọi công cụ AI **edge-tts** để xuất ra các file âm thanh `.mp3` lưu trong Docker Volume. Hoàn tất thì bắn sự kiện `poi.audio.ready` để cập nhật trạng thái địa điểm ạ."*

---

### CHỦ ĐỀ 06: KÍCH HOẠT ÂM THANH TỰ ĐỘNG (GPS HAVERSINE & CHỐNG PHÁT LẶP)
* **Câu hỏi của Thầy:** *"Làm sao web tự phát âm thanh khi du khách đến gần? Nếu du khách đứng mãi ở một điểm thì loa có bị phát lặp lại không?"*

* 📁 File tính khoảng cách: `backend/location-service/.../service/LocationServiceImpl.java`
```java
// Áp dụng công thức lượng giác Haversine tính khoảng cách theo mét
double distance = HaversineGeoUtils.calculateDistanceMeters(
        userLat, userLng, poi.getLatitude(), poi.getLongitude());

// Kiểm tra với bán kính kích hoạt (30m - 50m)
if (distance <= poi.getTriggerRadiusMeters()) {
    return Optional.of(poi); // Kích hoạt phát thuyết minh
}
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, khi du khách đi dạo, GPS gửi tọa độ về để `location-service` tính khoảng cách theo **công thức Haversine**. Khi khoảng cách nhỏ hơn bán kính kích hoạt (30–50m), Audio Player sẽ tự động phát. Phía Frontend có cơ chế **chống phát lặp trong vòng 10 phút (Cooldown)**, và nếu mạng yếu không tải được file MP3 thì hệ thống tự chuyển sang **Web Speech API** đọc văn bản trực tiếp ạ."*

---

### CHỦ ĐỀ 07: ĐIỀU KIỆN KÍCH HOẠT & CƠ CHẾ CHỐNG XỬ LÝ TRÙNG LẶP (IDEMPOTENCY)
* **Câu hỏi của Thầy:** *"Tại chỗ @RabbitListener nhận tin, cần điều kiện gì để tạo được file? Nếu RabbitMQ gửi lặp tin nhắn thì sao?"*

* 📁 File kiểm tra mã băm: `backend/translation-tts-service/.../PoiPipelineServiceImpl.java` (dòng 75-87)
```java
// Tính mã băm nội dung SHA-256
String contentHash = ContentHashUtils.computeHash(lang, event.getTitle(), event.getDescription(), ...);

// Kiểm tra tính Idempotent trên bảng translation_job
TranslationJob job = getOrCreateJob(event.getPoiId(), lang, contentHash);
if ("DONE".equals(job.getStatus())) {
    log.info("Job already DONE for poiId={}, lang={}, hash={}. Skipping.", event.getPoiId(), lang, contentHash);
    return; // BỎ QUA NGAY LẬP TỨC - KHÔNG DỊCH LẠI
}
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy:  
  (1) **Về mặt điều kiện chạy:** Dữ liệu phải có đầy đủ ID và tiêu đề; máy tính bắt buộc phải có kết nối Internet (vì AI `edge-tts` gọi dịch vụ Microsoft) và các container Docker (RabbitMQ, SQL Server) đang hoạt động.  
  (2) **Chống xử lý trùng (Idempotent):** Hệ thống tính mã băm `content_hash` (SHA-256). Nếu bài viết đã có trạng thái `DONE` với hash trùng khớp, service lập tức bỏ qua, không dịch lại, giúp tiết kiệm 100% quota và RAM máy chủ ạ."*

---

### CHỦ ĐỀ 08: CƠ CHẾ BẢO MẬT, JWT TOKEN & PHÁT HIỆN TÁI SỬ DỤNG (REUSE DETECTION)
* **Câu hỏi của Thầy:** *"Làm sao phân biệt Admin với Khách? Token lưu ở đâu? Lỡ Refresh Token bị hack thì sao?"*

* 📁 File kiểm tra tái sử dụng token: `backend/auth-service/.../service/AuthServiceImpl.java` (dòng 320-326)
```java
RefreshToken token = found.get();
if (token.isRevoked()) {
    // Phát hiện token đã bị thu hồi mà vẫn gửi lại -> DẤU HIỆU BỊ HACK / TÁI SỬ DỤNG
    log.warn("Phát hiện refresh token reuse, thu hồi toàn bộ phiên userId={}", token.getUser().getId());
    refreshTokenService.revokeAllForUser(token.getUser().getId(), RefreshToken.REASON_REUSE_DETECTED);
    throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
}
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy:  
  - Phân quyền bằng **Access Token (JWT)** chứa claim `role: ADMIN`, do Gateway kiểm tra ở bộ lọc `AdminAuthGlobalFilter`. Khách thường vào trang quản trị bị chặn ngay với mã HTTP 403 Forbidden.  
  - **Refresh Token** lưu trong **HttpOnly Cookie** để chống rò rỉ qua tấn công XSS.  
  - Áp dụng chuẩn RFC 6819 với cơ chế **Reuse Detection**: Nếu một Refresh Token cũ bị kẻ gian dùng lại, hệ thống lập tức thu hồi toàn bộ các phiên đăng nhập của tài khoản đó, buộc đăng nhập lại để bảo vệ tài khoản ạ!"*

---

### CHỦ ĐỀ 09: CÁC TRANG XÁC THỰC TRÊN GIAO DIỆN FRONTEND
* **Câu hỏi của Thầy:** *"Trang nào trên website thực hiện đăng nhập và bảo vệ tuyến đường (Route Guard)?"*

* 📁 File chặn tuyến quản trị: `frontend/src/admin/routes/AdminRouteGuard.tsx` (dòng 23-26)
```typescript
if (!isAdmin) {
    return <Navigate to="/quan-tri/dang-nhap" replace state={{ from: location }} />;
}
return <Outlet />;
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy, trên web có 2 khu vực xác thực rõ rệt:  
  (1) **Khu vực Quản trị:** Trang đăng nhập riêng tại `/quan-tri/dang-nhap`. Nếu người dùng thường hoặc khách vãng lai cố tình gõ link `/quan-tri`, component `AdminRouteGuard` sẽ chặn lại và tự động chuyển hướng về trang đăng nhập này.  
  (2) **Khu vực Du khách:** Hộp thoại Modal nổi tại `/dang-nhap`, cho phép đăng nhập mà không cần reload lại bản đồ ạ."*

---

### CHỦ ĐỀ 10: THỰC TRẠNG CI/CD, TRIỂN KHAI VERCEL & XỬ LÝ SỰ CỐ HÀNG ĐỢI (DLQ)
* **Câu hỏi của Thầy:** *"Dự án đã có CI/CD hoàn chỉnh chưa? Deploy lên Vercel là gì? Nếu RabbitMQ sập thì tin nhắn đi về đâu?"*

#### 1. File Workflow CI: `.github/workflows/content-service.yml` (dòng 41-53)
```yaml
- name: Run tests
  run: mvn -B test

- name: Build Docker image (no push)
  run: docker build -t content-service:ci backend/content-service
```

#### 2. Cấu hình Dead Letter Queue (DLQ): `backend/content-service/.../RabbitMQConfig.java`
```java
args.put("x-dead-letter-exchange", "saigonvoice.dlx");
args.put("x-dead-letter-routing-key", "poi.created.dlq");
```

* 🗣️ **Câu trả lời mẫu với Thầy:**  
  *"Dạ thưa thầy:  
  - **Thực trạng CI/CD:** Hiện tại ở giữa kỳ, nhóm em đã hoàn thiện **CI (Continuous Integration)** trên GitHub Actions để tự động chạy Unit Test và đóng gói thử Docker image. Việc đẩy lên Vercel chính là **CD cho phần Frontend**. Còn phần CD tự động deploy Backend lên VPS nhóm em lên kế hoạch hoàn thiện vào cuối kỳ.  
  - **Xử lý lỗi RabbitMQ:** Mọi hàng đợi đều gắn kèm **Dead Letter Exchange (DLX)**. Khi tin nhắn bị lỗi hoặc container sập, tin nhắn sẽ tự động rơi vào **Dead Letter Queue (DLQ)** chứ không bao giờ bị mất dữ liệu ạ!"*
