# TÀI LIỆU ÔN TẬP GIỮA KỲ — 50 CÂU HỎI REVIEW CODE BACKEND & CI/CD
## Dự Án: ECHORA / SAIGONVOICE — Nền Tảng Hướng Dẫn Viên Du Lịch Đa Ngôn Ngữ Tự Động
### Định dạng: Phông chữ Times New Roman, Màu chữ đen, Trình bày học thuật chuẩn mực

---

> **Thông tin chuyên đề:**
> - **Môn học:** Công nghệ Phần mềm (CNPM) — Nhóm 3
> - **Phạm vi mã nguồn:** 6 Microservices Spring Boot 3.3.4 (Java 17), RabbitMQ 3.13, MS SQL Server 2022 (4 DBs phân lập), Docker Compose, GitHub Actions Workflows (7 CI files).
> - **Mục tiêu:** Chuẩn bị trọn vẹn cho buổi Review Code, Phản biện Kiến trúc và Vấn đáp Đồ án Giữa kỳ.

---

## MỤC LỤC TỔNG QUAN

1. [Phần 1: Kiến trúc Tổng thể & Phân rã Microservices (Câu 01 – 08)](#phần-1-kiến-trúc-tổng-thể--phân-rã-microservices-8-câu)
2. [Phần 2: Giao tiếp Đồng bộ (Sync) qua REST & OpenFeign (Câu 09 – 15)](#phần-2-giao-tiếp-đồng-bộ-sync-qua-rest--openfeign-7-câu)
3. [Phần 3: Giao tiếp Bất đồng bộ (Async) qua RabbitMQ & Event-Driven (Câu 16 – 25)](#phần-3-giao-tiếp-bất-đồng-bộ-async-qua-rabbitmq--event-driven-10-câu)
4. [Phần 4: Cơ sở Dữ liệu, Transaction & Tính nhất quán Dữ liệu (Câu 26 – 32)](#phần-4-cơ-sở-dữ-liệu-transaction--tính-nhất-quán-dữ-liệu-7-câu)
5. [Phần 5: API Gateway, Bảo mật, Xác thực & Phân quyền (Câu 33 – 40)](#phần-5-api-gateway-bảo-mật-xác-thực--phân-quyền-8-câu)
6. [Phần 6: Tự động hóa CI/CD & Hạ tầng Container Docker (Câu 41 – 46)](#phần-6-tự-động-hóa-cicd--hạ-tầng-container-docker-6-câu)
7. [Phần 7: Kiểm thử, Xử lý Lỗi & Vận hành / Giám sát Hệ thống (Câu 47 – 50)](#phần-7-kiểm-thử-xử-lý-lỗi--vận-hành--giám-sát-hệ-thống-4-câu)

---

## PHẦN 1: KIẾN TRÚC TỔNG THỂ & PHÂN RÃ MICROSERVICES (8 CÂU)

### Câu 1: Tiêu chí phân rã 6 dịch vụ độc lập và nguyên lý Bounded Context trong Domain-Driven Design (DDD)
- **Tham chiếu mã nguồn:** `backend/` (`api-gateway`, `auth-service`, `content-service`, `location-service`, `translation-tts-service`, `analytics-service`), tài liệu kiến trúc [architecture.md](file:///f:/Nhom3_CNPM/docs/architecture.md).
- **Góc nhìn Review Code / Vấn đáp:** Tại sao hệ thống lại chia làm 6 service riêng biệt mà không gom thành một khối Monolith? Căn cứ vào nghiệp vụ nào để xác định ranh giới (Bounded Context) của từng service?
- **Gợi ý trả lời chuẩn:**
  - **Phân rã theo Bounded Context:**
    - `auth-service`: Quản lý người dùng, định danh (Identity & Access Management), bảo mật phiên làm việc và xác thực email.
    - `content-service`: Quản lý nghiệp vụ dữ liệu lõi du lịch (Zone, Route, POI, Thực đơn đặc sản) và vai trò Publisher chính.
    - `location-service`: Xử lý bài toán không gian địa lý (Geo-spatial), tính khoảng cách GPS thực thời và phân giải mã QR.
    - `translation-tts-service`: Chịu tải tính toán nặng (Compute-intensive & I/O-bound) với tác vụ dịch máy và tổng hợp giọng nói AI (`edge-tts`).
    - `analytics-service`: Ingestion log sự kiện lưu lượng cao (High-throughput event tracking) độc lập với luồng đọc nội dung.
    - `api-gateway`: Reverse proxy đơn điểm tập trung xác thực, giới hạn tốc độ và định tuyến.
  - **Lợi ích kỹ thuật:** Khả năng mở rộng độc lập (ví dụ TTS tải cao có thể scale riêng mà không tốn RAM của content-service); cô lập lỗi (lỗi dịch thuật không làm sập chức năng xem bản đồ).

### Câu 2: Bản chất Stateless của Location Service và đánh giá ưu/nhược điểm trong thiết kế
- **Tham chiếu mã nguồn:** `backend/location-service` (không có Flyway, không cấu hình DataSource trong `application.yml`; phụ thuộc `content-service` qua OpenFeign).
- **Góc nhìn Review Code / Vấn đáp:** Tại sao `location-service` lại được thiết kế hoàn toàn Stateless (không sở hữu database riêng)? Thiết kế này mang lại lợi ích gì và đối mặt với rủi ro gì?
- **Gợi ý trả lời chuẩn:**
  - **Ưu điểm:**
    - **Dễ dàng scale ngang (Horizontal Scalability):** Khi hàng ngàn du khách cùng gửi tọa độ GPS định kỳ (3-5 giây/lần), ta có thể nhân bản thành 10-20 container `location-service` phía sau Gateway mà không lo xung đột kết nối CSDL.
    - **Bảo đảm nguyên tắc Single Source of Truth:** Tọa độ POI do `content-service` quản lý; nếu `location-service` lưu CSDL riêng sẽ xảy ra bài toán phân tán dữ liệu và mất đồng bộ (Data Stale).
  - **Nhược điểm & Rủi ro:** Tạo ra sự phụ thuộc chặt (Tight Coupling) vào `content-service` qua mạng. Nếu `content-service` chậm hoặc gián đoạn, `location-service` sẽ bị lỗi dây chuyền (Cascading Failure). Cần khắc phục bằng Local In-Memory Cache (Caffeine/Redis) hoặc Circuit Breaker.

### Câu 3: Mô hình Database-per-Service: Tách biệt Logic vs Tách biệt Physical
- **Tham chiếu mã nguồn:** `docker-compose.yml` (dịch vụ `mssql` và `mssql-db-init`, script [init-databases.sql](file:///f:/Nhom3_CNPM/docker/init-databases.sql)).
- **Góc nhìn Review Code / Vấn đáp:** Hệ thống dùng chung một máy chủ SQL Server 2022 nhưng lại phân tách thành 4 database riêng biệt (`saigonvoice_content_db`, `translation_db`, `analytics_db`, `auth_db`). Tại sao không gộp chung vào 1 database để dễ JOIN bảng?
- **Gợi ý trả lời chuẩn:**
  - **Nguyên tắc Database-per-Service trong Microservices:** Mỗi service phải toàn quyền sở hữu schema dữ liệu của mình. Ngăn chặn triệt để việc viết câu lệnh SQL JOIN xuyên service, phá vỡ tính đóng gói (loose coupling).
  - **Giải pháp cân đối tài nguyên đồ án (Logical Isolation):** Thay vì chạy 4 container SQL Server riêng (gây tràn RAM máy chủ dev), nhóm triển khai 1 SQL Server Instance nhưng tạo 4 Database độc lập và cấp 4 User Login riêng biệt (`content_user`, `translation_user`, `analytics_user`, `auth_user`). Mỗi user chỉ có quyền đọc/ghi trên database của mình, ngăn chặn truy cập chéo ở mức phân quyền DBMS.

### Câu 4: Cơ chế khởi tạo CSDL tự động bằng container mssql-db-init và tính Idempotency
- **Tham chiếu mã nguồn:** `docker-compose.yml:60-108` và file `docker/init-databases.sql`.
- **Góc nhìn Review Code / Vấn đáp:** Container `mssql-db-init` đóng vai trò gì? Tại sao không dùng Flyway của các service để tự tạo database?
- **Gợi ý trả lời chuẩn:**
  - **Lý do Flyway không thể tự tạo database:** Flyway chỉ chạy sau khi đã kết nối thành công vào một database cụ thể (thông qua chuỗi JDBC URL). Khi SQL Server mới khởi động lần đầu, các database con chưa hề tồn tại, kết nối JDBC của service sẽ lập tức bị từ chối với lỗi `Unknown Database`.
  - **Cơ chế hoạt động của mssql-db-init:** Chờ SQL Server chính healthy -> Dùng tài khoản `sa` kết nối vào master -> Thực thi script `init-databases.sql` với các lệnh kiểm tra tồn tại `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = ...) CREATE DATABASE ...`.
  - **Tính Idempotent:** Container có thể chạy lại nhiều lần mà không làm mất dữ liệu cũ hay gây lỗi trùng lặp login/user.

### Câu 5: Rủi ro Single Point of Failure (SPOF) tại API Gateway và phương án chịu lỗi
- **Tham chiếu mã nguồn:** `backend/api-gateway`, cấu hình `docker-compose.yml:281-315`.
- **Góc nhìn Review Code / Vấn đáp:** Mọi request từ Frontend đều đổ về duy nhất một cổng `8080` của `api-gateway`. Nếu gateway gặp sự cố, toàn bộ hệ thống bị tê liệt. Trong thực tế, làm thế nào để giải quyết nút thắt cổ chai và SPOF này?
- **Gợi ý trả lời chuẩn:**
  - **Bản chất:** API Gateway là cửa ngõ duy nhất (Edge Service). Tuy Gateway là Stateless (dễ scale), nhưng chạy duy nhất 1 container là SPOF về mặt hạ tầng.
  - **Giải pháp sản xuất (Production):**
    - Chạy tối thiểu 2-3 container API Gateway phân tán.
    - Đặt một tầng Reverse Proxy / Load Balancer lớp trước như Nginx, HAProxy, AWS ALB hoặc Cloudflare với cơ chế Round-Robin / Least Connections.
    - Sử dụng DNS Failover (Keepalived / Virtual IP) để chuyển hướng tự động khi một gateway node bị chết.

### Câu 6: Quản lý biến môi trường, cơ chế Fail-Closed và rủi ro lộ Secret trong Git
- **Tham chiếu mã nguồn:** `.env.example`, `docker-compose.yml:15,39,122,254` (cú pháp `${VAR:?error}`), Audit Finding F-02, F-06.
- **Góc nhìn Review Code / Vấn đáp:** Cú pháp `${JWT_SECRET:?JWT_SECRET is required in .env}` trong Docker Compose có ý nghĩa gì? Những rủi ro bảo mật nào đã được ghi nhận trong báo cáo audit liên quan đến thông tin nhạy cảm?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế Fail-Closed:** Dấu `:?` yêu cầu biến môi trường bắt buộc phải có giá trị. Nếu lập trình viên quên khai báo `JWT_SECRET` hoặc `MSSQL_SA_PASSWORD` trong file `.env`, lệnh `docker compose up` sẽ dừng ngay lập tức kèm thông báo lỗi cụ thể, ngăn hệ thống khởi chạy ở trạng thái thiếu bảo mật.
  - **Điểm yếu phát hiện (Finding F-02 / F-06):**
    - Một số file `application.yml` (content, analytics) vẫn còn giá trị mật khẩu DB/RabbitMQ mặc định được commit vào Git (`Saigon@123`, `SgVoice_Rabbit!2026`).
    - Mật khẩu tài khoản seed admin mặc định (`admin@echora.local / Admin@123456`) bị công khai trong README và mã nguồn seeder, cần phải ghi đè bắt buộc ở môi trường Production.

### Câu 7: Quản lý tài nguyên bộ nhớ JVM (Heap Limit) trong môi trường Docker Container
- **Tham chiếu mã nguồn:** `docker-compose.yml` (biến `JAVA_TOOL_OPTIONS: "-Xms128m -Xmx256m"` ở các service Java).
- **Góc nhìn Review Code / Vấn đáp:** Tại sao cần chỉ định `JAVA_TOOL_OPTIONS: "-Xms128m -Xmx256m"` cho từng container Spring Boot? Điều gì sẽ xảy ra nếu chạy 6 microservice Java trên một máy tính cá nhân 8GB hoặc 16GB RAM mà không cấu hình cờ này?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế mặc định của JVM trong Docker:** Theo mặc định (Ergonomics), JVM sẽ nhận diện RAM của máy chủ host và tự động cấp phát Heap tối đa (Max Heap) lên tới 25% hoặc thậm chí 50% tổng RAM máy chủ.
  - **Hậu quả nếu thiếu cấu hình:** Khi chạy đồng thời 6 service Java, mỗi service có thể ngốn từ 1GB đến 2GB RAM, dẫn đến cạn kiệt bộ nhớ hệ thống (OOM Killer của Linux hoặc OS treo đơ).
  - **Lợi ích của cấu hình hiện tại:** Ép mỗi microservice khởi động với 128MB Heap và giới hạn tối đa không quá 256MB Heap. Cả hệ thống 6 backend service chỉ chiếm khoảng 1.5GB – 2GB RAM vật lý, chạy mượt mà ngay cả trên máy tính cá nhân cấu hình trung bình.

### Câu 8: Thiết lập Healthcheck và điều kiện phụ thuộc khởi động giữa các Microservice
- **Tham chiếu mã nguồn:** `docker-compose.yml:190-203` (`translation-tts-service` có `depends_on` với `condition: service_healthy`).
- **Góc nhìn Review Code / Vấn đáp:** Phân biệt `condition: service_started` và `condition: service_healthy` trong Docker Compose? Tại sao `translation-tts-service` lại cần đợi `content-service` đạt trạng thái `healthy`?
- **Gợi ý trả lời chuẩn:**
  - **Phân biệt cơ chế depends_on:**
    - `service_started`: Chỉ kiểm tra container đã được tạo và process chính đã fork chạy (chưa chắc ứng dụng Spring Boot đã khởi động xong hoặc đã sẵn sàng nhận kết nối).
    - `service_healthy`: Chờ cho đến khi lệnh kiểm tra trong khối `healthcheck` (gọi `/actuator/health`) trả về mã trạng thái thành công (HTTP 200).
  - **Ý nghĩa với translation-tts-service:** Dịch vụ này phụ thuộc vào việc các Exchange và Queue RabbitMQ của `content-service` đã được tạo lập xong. Nếu `translation-tts-service` khởi động trước khi Broker sẵn sàng hoặc trước khi schema đồng bộ, ứng dụng có thể gặp lỗi kết nối hoặc crash vòng lặp (CrashLoopBackOff).

---

## PHẦN 2: GIAO TIẾP ĐỒNG BỘ (SYNC) QUA REST & OPENFEIGN (7 CÂU)

### Câu 9: Thiết kế OpenFeign Client và kỹ thuật trừu tượng hóa giao tiếp HTTP
- **Tham chiếu mã nguồn:** `backend/location-service/.../client/ContentServiceClient.java`.
- **Góc nhìn Review Code / Vấn đáp:** Spring Cloud OpenFeign giúp giải quyết bài toán gì trong giao tiếp liên dịch vụ? Cấu hình `url = "${content-service.url}"` mang lại sự linh hoạt nào?
- **Gợi ý trả lời chuẩn:**
  - **Bản chất của OpenFeign:** Là một Declarative REST Client. Lập trình viên chỉ cần khai báo một Java Interface kèm các Annotation của Spring Web (`@GetMapping`, `@PathVariable`, `@RequestParam`); Spring Cloud sẽ tự động sinh code proxy thực hiện serialize JSON, mở kết nối HTTP và deserialize response.
  - **Linh hoạt cấu hình URL:** Cho phép tách rời mã nguồn khỏi địa chỉ mạng:
    - Trong Docker Compose: cấu hình trỏ tới tên container `http://content-service:8085`.
    - Khi chạy Dev cục bộ ngoài container: trỏ tới `http://localhost:8085`.
    - Khi tích hợp Eureka/Consul (Service Discovery): có thể bỏ `url` và dùng `name = "content-service"` kèm cân bằng tải Ribbon/Spring Cloud LoadBalancer.

### Câu 10: Cơ chế bảo vệ endpoint nội bộ bằng Feign RequestInterceptor và phòng chống Timing Attack
- **Tham chiếu mã nguồn:** `backend/location-service/.../ContentServiceClientConfiguration.java:17-23` và `backend/content-service/.../config/InternalApiKeyFilter.java:53-55`.
- **Góc nhìn Review Code / Vấn đáp:** Giao tiếp giữa Location Service và Content Service được bảo mật như thế nào? Tại sao trong `InternalApiKeyFilter` lại sử dụng hàm `MessageDigest.isEqual()` thay vì `incoming.equals(expected)`?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế truyền khóa nội bộ:** Phía `location-service` dùng Feign `RequestInterceptor` để tự động gắn thêm HTTP Header `X-Internal-Api-Key` vào mọi request gửi sang `content-service`.
  - **Phòng chống tấn công Timing Attack:**
    - Hàm `String.equals()` thông thường so sánh ký tự tuần tự và dừng ngay lập tức (early return) khi gặp ký tự sai đầu tiên. Kẻ tấn công có thể đo thời gian phản hồi ở mức nano-giây để dò đoán từng ký tự của mật khẩu/API key.
    - Hàm `MessageDigest.isEqual()` thực hiện so sánh theo thời gian không đổi (Constant-Time Comparison), luôn duyệt qua toàn bộ mảng byte bất kể ký tự sai ở vị trí nào, triệt tiêu hoàn toàn rủi ro rò rỉ thông tin qua độ trễ thời gian.

### Câu 11: Nguyên tắc thiết kế an toàn Fail-Closed trong bộ lọc InternalApiKeyFilter
- **Tham chiếu mã nguồn:** `backend/content-service/.../config/InternalApiKeyFilter.java:33-36, 48-51`.
- **Góc nhìn Review Code / Vấn đáp:** Phân tích nguyên tắc "Fail-Closed" được cài đặt trong `InternalApiKeyFilter`. Điều gì xảy ra nếu quản trị viên vô tình để trống biến môi trường `INTERNAL_API_KEY`?
- **Gợi ý trả lời chuẩn:**
  - **Nguyên tắc Fail-Closed (Đóng khi lỗi):** Là nguyên tắc bảo mật tối quan trọng trong phát triển phần mềm an toàn. Khi hệ thống gặp lỗi cấu hình hoặc thiếu thông số bảo mật, trạng thái mặc định phải là *từ chối toàn bộ* thay vì *mở cửa tự do*.
  - **Cài đặt cụ thể trong code:**
    ```java
    if (isBlank(expectedApiKey)) {
        reject(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE, "Internal API key is not configured");
        return;
    }
    ```
  - Nếu `INTERNAL_API_KEY` rỗng, filter lập tức trả về mã **HTTP 503 Service Unavailable** cho mọi request nội bộ. Nhờ đó, kẻ tấn công không thể lợi dụng việc thiếu cấu hình để truy cập trái phép dữ liệu.

### Câu 12: Đánh giá chính sách Retry trong giao tiếp Feign và nguy cơ Retry Storm
- **Tham chiếu mã nguồn:** `backend/location-service/.../ContentServiceClientConfiguration.java:26-29` (cấu hình `Retryer.NEVER_RETRY`).
- **Góc nhìn Review Code / Vấn đáp:** Tại sao `location-service` lại cấu hình `Retryer.NEVER_RETRY`? Khi nào thì nên bật Retry và làm thế nào để tránh hiện tượng bão yêu cầu (Retry Storm)?
- **Gợi ý trả lời chuẩn:**
  - **Lý do chọn NEVER_RETRY:** Endpoint tính toán GPS lân cận phục vụ du khách theo thời gian thực (request gửi liên tục mỗi 3-5 giây). Nếu một request bị lỗi mạng tạm thời, request tiếp theo của du khách sẽ gửi lại ngay sau đó. Việc retry tự động bên dưới có thể làm nghẽn luồng xử lý và tăng độ trễ (latency).
  - **Nguy cơ Retry Storm:** Nếu `content-service` đang bị quá tải (CPU 100%), hàng loạt request Feign đồng loạt retry 3-5 lần mà không có giãn cách thời gian sẽ dội ngược tải gấp bội, khiến dịch vụ sụp đổ hoàn toàn (Thundering Herd / Cascading Collapse).
  - **Best Practice khi bật Retry:** Chỉ retry các phương thức Idempotent (như `GET`), kết hợp cơ chế lùi thời gian theo cấp số nhân (Exponential Backoff) và cộng thêm độ trễ ngẫu nhiên (Jitter).

### Câu 13: Thiếu hụt Circuit Breaker trong hệ thống và giải pháp khắc phục với Resilience4j
- **Tham chiếu mã nguồn:** Audit Finding F-07 trong [BE_AUDIT_REPORT.md](file:///f:/Nhom3_CNPM/docs/BE_AUDIT_REPORT.md), các file Feign client tại `location-service` và `analytics-service`.
- **Góc nhìn Review Code / Vấn đáp:** Báo cáo Audit ghi nhận hệ thống thiếu Circuit Breaker cho các giao tiếp Feign (Finding F-07). Hậu quả khi `content-service` bị gián đoạn là gì? Hãy trình bày giải pháp bổ sung Resilience4j.
- **Gợi ý trả lời chuẩn:**
  - **Hậu quả thực tế:** Khi `content-service` bị treo, các luồng (threads) của `location-service` sẽ bị khóa chờ cho đến khi hết thời gian Socket Timeout. Hàng đợi Tomcat của `location-service` nhanh chóng cạn kiệt pool luồng, dẫn tới `location-service` cũng ngừng hoạt động theo (hiện tượng lỗi lan truyền).
  - **Giải pháp chuẩn kiến trúc:** Tích hợp thư viện **Resilience4j Circuit Breaker** vào Feign Client:
    - Khi tỷ lệ lỗi vượt ngưỡng (ví dụ > 50% trong 10 request), mạch sẽ chuyển sang trạng thái **OPEN**, lập tức trả về lỗi hoặc kích hoạt phương thức **Fallback** mà không cần gửi request qua mạng nữa.
    - Sau một khoảng thời gian chờ (Cool-down period), mạch chuyển sang **HALF-OPEN** để gửi thử một vài request thăm dò. Nếu thành công, mạch tự động đóng lại (**CLOSED**).

### Câu 14: Chiến lược tối ưu hóa truy vấn GPS: Bounding Box ở CSDL kết hợp tính Haversine ở RAM
- **Tham chiếu mã nguồn:** `backend/content-service/.../controller/PoiController.java:58-66` và `backend/location-service/.../service/LocationServiceImpl.java`.
- **Góc nhìn Review Code / Vấn đáp:** Tại sao `location-service` không tải toàn bộ danh sách POI về để tự tính khoảng cách? Ngược lại, tại sao không để CSDL SQL Server tự tính công thức Haversine?
- **Gợi ý trả lời chuẩn:**
  - **Mô hình lọc 2 bước tối ưu (Two-tier Filtering Strategy):**
    - **Bước 1 (Tại SQL Server):** Lọc sơ bộ bằng khung chữ nhật tọa độ địa lý (Bounding Box: `minLat <= lat <= maxLat AND minLng <= lng <= maxLng`). Thao tác này tận dụng tối đa Index `(lat, lng)` của CSDL, loại bỏ 99% các POI nằm ngoài phạm vi quan tâm với tốc độ mili-giây.
    - **Bước 2 (Tại RAM của Location Service):** Chỉ với vài POI vượt qua bước 1, `location-service` mới áp dụng công thức lượng giác phức tạp **Haversine** (tính khoảng cách đường cong trên mặt cầu Trái Đất) để tìm POI gần nhất và so sánh với bán kính kích hoạt (trigger radius 30–50m).
  - **Lợi ích:** Giải phóng tải tính toán hàm số học cho CSDL; giảm thiểu dung lượng dữ liệu truyền qua mạng mạng giữa 2 service.

### Câu 15: Thiết kế hợp đồng API tra cứu mã QR và tính nhất quán dữ liệu
- **Tham chiếu mã nguồn:** `GET /api/location/scan/{code}` và `GET /api/content/internal/pois/qr/{qrToken}`.
- **Góc nhìn Review Code / Vấn đáp:** So sánh hai endpoint tra cứu theo mã QR trên. Tại sao cần tách biệt endpoint công khai cho du khách và endpoint nội bộ giữa các service?
- **Gợi ý trả lời chuẩn:**
  - **Endpoint công khai (`/api/location/scan/{code}`):** Tiếp nhận yêu cầu từ ứng dụng Frontend du khách. Trả về DTO chứa thông tin tổng hợp gồm dữ liệu địa điểm, nội dung thuyết minh và URL phát âm thanh.
  - **Endpoint nội bộ (`/api/content/internal/pois/qr/{qrToken}`):** Phục vụ trực tiếp cho Feign Client của `location-service`. Endpoint này chỉ trả về các trường dữ liệu tối thiểu cần thiết để xác định POI, đồng thời được bảo vệ nghiêm ngặt bằng khóa `X-Internal-Api-Key` và bị API Gateway chặn từ bên ngoài.
  - **Bảo mật:** Du khách không thể gọi trực tiếp vào endpoint nội bộ của `content-service` để bypass kiểm tra tọa độ hay rate limit.

---

## PHẦN 3: GIAO TIẾP BẤT ĐỒNG BỘ (ASYNC) QUA RABBITMQ & EVENT-DRIVEN (10 CÂU)

### Câu 16: Cấu trúc Topology RabbitMQ: Phân tích Topic Exchange và cơ chế định tuyến tin nhắn
- **Tham chiếu mã nguồn:** `backend/content-service/.../config/RabbitMQConfig.java` và tài liệu [event-contract.md](file:///f:/Nhom3_CNPM/docs/event-contract.md).
- **Góc nhìn Review Code / Vấn đáp:** Hệ thống sử dụng loại Exchange nào trong RabbitMQ? Hãy giải thích quy tắc gán tên routing key và cơ chế liên kết (Binding) với các queue.
- **Gợi ý trả lời chuẩn:**
  - **Loại Exchange:** Sử dụng **Topic Exchange** với tên `saigonvoice.topic` (durable = true).
  - **Cơ chế Routing Key phân cấp:**
    - Khi POI được tạo mới: gửi với routing key `poi.created`.
    - Khi nội dung POI thay đổi: gửi với routing key `poi.updated`.
    - Khi hoàn tất tạo file audio: gửi phản hồi với `poi.audio.ready`.
    - Khi tạo audio thất bại: gửi phản hồi với `poi.audio.failed`.
  - **Lợi ích của Topic Exchange:** Khác với Direct Exchange (so khớp chính xác 1:1), Topic Exchange cho phép các service trong tương lai có thể lắng nghe theo mẫu ký tự đại diện (ví dụ `poi.*` để bắt toàn bộ sự kiện POI hoặc `*.failed` để ghi log sự cố tập trung).

### Câu 17: Giải quyết bài toán Dual-Write bằng TransactionalEventListener (phase = AFTER_COMMIT)
- **Tham chiếu mã nguồn:** `backend/content-service/.../messaging/PoiPublishRelay.java:23-36`.
- **Góc nhìn Review Code / Vấn đáp:** Phân tích đoạn code sau trong `PoiPublishRelay`:
  ```java
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onPoiPublishRequested(PoiPublishRequestedEvent event) { ... }
  ```
  Tại sao không gửi tin nhắn RabbitMQ ngay bên trong Service method lưu POI? Hiện tượng "Message Ma" (Phantom Event) là gì?
- **Gợi ý trả lời chuẩn:**
  - **Vấn đề Dual-Write (Ghi CSDL và Gửi Message):** Trong kiến trúc phân tán, CSDL và Message Broker là 2 hệ thống độc lập, không thể dùng chung một Transaction ACID nếu không có 2PC (Two-Phase Commit).
  - **Hiện tượng "Message Ma" (Phantom Event):** Nếu gửi message lên RabbitMQ *trước khi* lệnh `commit` CSDL hoàn tất:
    - Nếu transaction DB bị rollback (do lỗi ràng buộc dữ liệu, mất kết nối DB): Message đã bay sang Broker, Consumer nhận được và truy vấn DB thì POI hoàn toàn không tồn tại -> Lỗi logic nghiêm trọng.
    - Nếu Consumer chạy quá nhanh: Consumer đọc DB khi transaction của Publisher vẫn chưa commit xong -> Consumer đọc không ra dữ liệu (Dirty Read/Missing Record).
  - **Giải pháp AFTER_COMMIT:** Đảm bảo chỉ khi nào CSDL đã lưu thành công 100%, sự kiện mới được đẩy sang Broker. Nếu xảy ra lỗi khi gửi message, POI vẫn an toàn trong DB và sẽ được retry sau bởi background job.

### Câu 18: Đảm bảo độ tin cậy xuất bản tin nhắn với Publisher Confirms và Mandatory Flag
- **Tham chiếu mã nguồn:** `backend/content-service/.../messaging/PoiEventPublisher.java:38-71`.
- **Góc nhìn Review Code / Vấn đáp:** Làm thế nào để chắc chắn tin nhắn đã đến được Broker và đã vào được ít nhất một hàng đợi? Trình bày cách `PoiEventPublisher` sử dụng `CorrelationData` và `ReturnedMessage`.
- **Gợi ý trả lời chuẩn:**
  - **Cấu hình bắt buộc:** `publisher-confirm-type = correlated`, `publisher-returns = true`, và `template.mandatory = true`.
  - **Quy trình xác nhận 2 tầng:**
    - **Tầng 1 (Broker ACK):** Dùng `correlation.getFuture().get(timeout)` để đợi phản hồi ACK từ RabbitMQ Server. Nếu nhận NACK hoặc quá thời gian chờ (Timeout), ném `EventPublishException`.
    - **Tầng 2 (Unroutable Message Check):** Cờ `mandatory = true` bắt buộc RabbitMQ nếu không tìm thấy queue nào khớp với routing key thì phải trả lại message cho Publisher. Code kiểm tra `correlation.getReturned()`; nếu khác `null` tức là message bị vô thừa nhận, ném lỗi cảnh báo ngay.

### Câu 19: Khắc phục lỗi xuất bản bằng cơ chế Outbox Pattern giản lược (PoiPublishRetryJob)
- **Tham chiếu mã nguồn:** `backend/content-service/.../messaging/PoiPublishRetryJob.java` và các endpoint `/api/content/admin/pois/{id}/republish`.
- **Góc nhìn Review Code / Vấn đáp:** Nếu RabbitMQ bị mất kết nối đột ngột tại thời điểm `PoiPublishRelay` thực thi, hệ thống xử lý ra sao để không làm mất sự kiện xuất bản?
- **Gợi ý trả lời chuẩn:**
  - **Lưu trạng thái xuất bản vào CSDL:** POI có các trường theo dõi trạng thái: `publish_status` (PENDING / FAILED / PUBLISHED) và `publish_error`.
  - **Cơ chế tự phục hồi định kỳ:** `PoiPublishRetryJob` là một tiến trình chạy ngầm (Scheduled Task) quét định kỳ các POI có trạng thái `PENDING` hoặc `FAILED` để tiến hành gửi lại sự kiện lên RabbitMQ.
  - **Can thiệp quản trị viên:** Cung cấp API `POST /api/content/admin/pois/{id}/republish` cho phép quản trị viên kích hoạt lại tiến trình xuất bản thủ công trên giao diện khi RabbitMQ đã hoạt động trở lại.

### Câu 20: Thiết kế Idempotent Consumer bằng mã băm nội dung (content_hash)
- **Tham chiếu mã nguồn:** `backend/translation-tts-service/.../service/PoiPipelineServiceImpl.java:70-87`.
- **Góc nhìn Review Code / Vấn đáp:** RabbitMQ chỉ đảm bảo ngữ nghĩa gửi tin *At-least-once* (ít nhất một lần), có thể xảy ra trường hợp gửi trùng tin nhắn. Phía `translation-tts-service` xử lý trùng lặp (Idempotency) như thế nào?
- **Gợi ý trả lời chuẩn:**
  - **Tính toán content_hash:** Tạo chuỗi SHA-256 từ các trường nội dung: `lang`, `title`, `summary`, `description`, `historicalSignificance`.
  - **Kiểm tra trạng thái công việc (translation_job):**
    - Truy vấn bảng `translation_job` theo `(poi_id, language_code, content_hash)`.
    - Nếu đã tồn tại bản ghi với trạng thái `DONE`, dịch vụ ghi log và **bỏ qua ngay lập tức** (Skip processing).
  - **Lợi ích vượt trội:** Ngăn ngừa việc gọi lặp lại API dịch thuật bên ngoài (tiết kiệm chi phí/quota) và tránh gọi lại dịch vụ AI sinh âm thanh tốn CPU và thời gian.

### Câu 21: Phân tích luồng vòng lặp sự kiện (Event Loopback) và biện pháp chống lặp vô tận
- **Tham chiếu mã nguồn:** Luồng `poi.created` ➔ `poi.audio.ready` ➔ cập nhật POI trong `content-service`.
- **Góc nhìn Review Code / Vấn đáp:** Khi `content-service` nhận được sự kiện `poi.audio.ready` và cập nhật trạng thái âm thanh của POI, có nguy cơ nào nó lại phát sinh sự kiện `poi.updated` dẫn tới vòng lặp vô tận (Infinite Event Loop) hay không? Đội ngũ phát triển đã phòng ngừa điều này thế nào?
- **Gợi ý trả lời chuẩn:**
  - **Nguy cơ tiềm ẩn:** Nếu mọi thao tác cập nhật POI đều kích hoạt `PoiPublishRequestedEvent`, việc cập nhật trạng thái audio có thể kích hoạt dịch thuật lại, tạo ra vòng lặp vô tận làm tê liệt hệ thống.
  - **Biện pháp phòng ngừa trong mã nguồn:**
    - Tách biệt phương thức: Sự kiện cập nhật trạng thái audio được xử lý qua phương thức chuyên biệt trong repository, chỉ cập nhật cột `audio_status` mà **không** phát ra sự kiện nghiệp vụ `poi.updated`.
    - Sự kiện `poi.updated` chỉ được kích hoạt duy nhất khi Quản trị viên chủ động chỉnh sửa nội dung thuyết minh trên giao diện Admin Console.

### Câu 22: Thiết kế Dead Letter Queue (DLQ) và rủi ro nghẽn thông điệp lỗi (Finding F-10)
- **Tham chiếu mã nguồn:** `saigonvoice.dlx` trong `content-service/.../RabbitMQConfig.java`, Audit Finding F-10.
- **Góc nhìn Review Code / Vấn đáp:** Mục đích của Dead Letter Exchange (DLX) và Dead Letter Queue (DLQ) là gì? Báo cáo audit đã chỉ ra thiếu sót gì trong việc giám sát DLQ?
- **Gợi ý trả lời chuẩn:**
  - **Mục đích của DLQ:** Khi một tin nhắn bị Consumer từ chối (NACK/Reject với `requeue = false`) hoặc vượt quá số lần thử lại tối đa (TTL expired), nó sẽ được tự động chuyển hướng sang DLX và lưu vào DLQ. Giúp hàng đợi chính không bị tắc nghẽn bởi các "tin nhắn độc" (Poison Messages).
  - **Thiếu sót hiện tại (Finding F-10):** Hệ thống mới chỉ khai báo cấu trúc DLQ nhưng *chưa hề có bất kỳ Consumer hoặc tiến trình nào lắng nghe và giám sát các hàng đợi DLQ này*. Hậu quả là các tin nhắn lỗi sẽ nằm "chết" trong DLQ mà không có cảnh báo nào gửi về cho lập trình viên để xử lý.

### Câu 23: So sánh kiến trúc xuất bản tin nhắn giữa Content Service và Analytics Service (Finding F-09)
- **Tham chiếu mã nguồn:** `AnalyticsEventServiceImpl.java:59-63` vs `PoiEventPublisher.java:38-70`.
- **Góc nhìn Review Code / Vấn đáp:** Báo cáo Audit chỉ ra sự thiếu nhất quán trong việc xuất bản tin nhắn của `analytics-service` (Finding F-09). Hãy phân tích sự khác biệt này và rủi ro mất mát dữ liệu.
- **Gợi ý trả lời chuẩn:**
  - **Khác biệt trong mã nguồn:**
    - `PoiEventPublisher`: Sử dụng `CorrelationData`, đồng bộ chờ Broker ACK và kiểm tra trả về (ReturnsCallback) trước khi kết thúc.
    - `AnalyticsEventServiceImpl`: Gọi hàm `rabbitTemplate.convertAndSend()` kiểu "Fire-and-Forget" (bắn xong bỏ qua), hoàn toàn không truyền `CorrelationData`.
  - **Rủi ro:** API của Analytics trả về mã **HTTP 202 Accepted** cho Client nhưng nếu tin nhắn unroutable (sai tên exchange/queue), tin nhắn sẽ bị hủy âm thầm mà không ai hay biết, gây thất thoát dữ liệu thống kê du lịch.

### Câu 24: Kỹ thuật Pre-validation để tối ưu hóa hạn ngạch (Quota Optimization) trong Pipeline
- **Tham chiếu mã nguồn:** `backend/translation-tts-service/.../service/PoiPipelineServiceImpl.java:115-129`.
- **Góc nhìn Review Code / Vấn đáp:** Tại sao `PoiPipelineServiceImpl` lại kiểm tra `ttsVoiceProvider.getVoice(lang)` TRƯỚC KHI gọi API dịch thuật?
- **Gợi ý trả lời chuẩn:**
  - **Ngữ cảnh:** Hệ thống sử dụng dịch vụ AI để dịch thuật đa ngôn ngữ (có giới hạn số ký tự miễn phí mỗi ngày hoặc tính phí theo API quota). Tiếp sau đó, hệ thống cần một Voice Engine tương ứng để đọc ngôn ngữ đó.
  - **Tối ưu hóa:** Nếu một ngôn ngữ không có giọng đọc hỗ trợ (ví dụ ngôn ngữ hiếm chưa cài voice), việc dịch trước sẽ trở nên vô nghĩa và gây lãng phí hạn ngạch API. Bằng cách kiểm tra tính khả dụng của Voice trước, nếu không hỗ trợ thì dừng ngay và đánh dấu trạng thái `FAILED_TTS`, tiết kiệm 100% quota dịch thuật.

### Câu 25: Chiến lược xử lý sự cố từng phần (Partial Failure Handling) theo ngôn ngữ
- **Tham chiếu mã nguồn:** `backend/translation-tts-service/.../service/PoiPipelineServiceImpl.java`.
- **Gợi ý trả lời chuẩn:** Khi tiến trình tạo thuyết minh xử lý đồng thời 4 ngôn ngữ (`vi`, `en`, `ja`, `ko`), nếu ngôn ngữ tiếng Hàn (`ko`) gặp sự cố mạng hoặc lỗi dịch thuật, toàn bộ tiến trình có bị hủy bỏ không?
- **Gợi ý trả lời chuẩn:**
  - **Thiết kế cô lập lỗi:** Pipeline sử dụng cấu trúc vòng lặp độc lập cho từng ngôn ngữ mục tiêu kèm khối `try-catch` riêng biệt.
  - **Kết quả:** Sự cố tại một ngôn ngữ (ví dụ `ko` bị lỗi TTS) chỉ ghi nhận trạng thái thất bại cho riêng ngôn ngữ đó (gửi `PoiAudioFailedEvent` của `ko`). Các ngôn ngữ khác (`vi`, `en`, `ja`) vẫn được tạo thành công và xuất bản sự kiện `poi.audio.ready` bình thường. Trải nghiệm của du khách nói tiếng Anh hay tiếng Việt không bị ảnh hưởng.

---

## PHẦN 4: CƠ SỞ DỮ LIỆU, TRANSACTION & TÍNH NHẤT QUÁN DỮ LIỆU (7 CÂU)

### Câu 26: Cơ chế Khóa Lạc Quan (Optimistic Locking) và xử lý xung đột đồng thời (Concurrency Control)
- **Tham chiếu mã nguồn:** `backend/content-service/.../entity/Poi.java` (trường `@Version private Long version;`) và `PoiContentServiceImpl.java`.
- **Góc nhìn Review Code / Vấn đáp:** Trường `version` có tác dụng gì trong các bảng `poi`, `zone`, `route`? Khi hai Quản trị viên cùng mở màn hình chỉnh sửa một POI và cùng bấm Lưu, hiện tượng gì sẽ xảy ra?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế Optimistic Locking với @Version:** Mỗi khi một bản ghi được cập nhật, Hibernate sẽ tự động so sánh version: `UPDATE poi SET title = ..., version = version + 1 WHERE id = ? AND version = ?`.
  - **Kịch bản 2 Admin cùng sửa:**
    - Admin A tải POI (version = 1).
    - Admin B tải POI (version = 1).
    - Admin A bấm Lưu trước: CSDL cập nhật thành công, version tăng lên 2.
    - Admin B bấm Lưu sau (với dữ liệu dựa trên version 1 cũ): CSDL thấy version hiện tại là 2 khác 1 -> Số dòng cập nhật = 0 -> Hibernate ném ra ngoại lệ `OptimisticLockException`.
  - **Phản hồi HTTP:** Service bắt ngoại lệ và ném `ConflictException`, trả về mã **HTTP 409 Conflict**. Giao diện Admin Console hiển thị thông báo dữ liệu đã bị thay đổi bởi người khác và yêu cầu tải lại, ngăn chặn việc ghi đè mất dữ liệu âm thầm (Lost Update Problem).

### Câu 27: Thiết kế Chỉ mục (Indexing) cho bài toán tìm kiếm không gian địa lý
- **Tham chiếu mã nguồn:** Flyway migration `V1__init_content_schema.sql` tại `content-service`.
- **Góc nhìn Review Code / Vấn đáp:** Bảng `poi` cần đánh chỉ mục (Index) như thế nào để phục vụ câu truy vấn lọc Bounding Box `WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?` đạt hiệu năng cao nhất?
- **Gợi ý trả lời chuẩn:**
  - **Composite Index trên (lat, lng):** Cần tạo chỉ mục kết hợp `CREATE INDEX idx_poi_coords ON poi (lat, lng) INCLUDE (status, id);`.
  - **Giải thích:** Giúp SQL Server sử dụng Index Seek để định vị nhanh chóng các bản ghi nằm trong phạm vi tọa độ thay vì phải quét toàn bộ bảng (Table Scan). Mệnh đề `INCLUDE` giúp câu truy vấn đạt trạng thái Covering Index, không cần tốn chi phí Bookmark Lookup vào dữ liệu gốc.

### Câu 28: Kỷ luật Quản lý Migration CSDL với Flyway và rủi ro của Repeatable Migration
- **Tham chiếu mã nguồn:** `R__seed_demo.sql` (83 KB) tại `content-service`, Audit Finding F-22.
- **Góc nhìn Review Code / Vấn đáp:** Phân biệt file migration dạng phiên bản (`V__*.sql`) và file dạng lặp lại (`R__*.sql`) trong Flyway. Báo cáo audit đã cảnh báo điều gì về file `R__seed_demo.sql`?
- **Gợi ý trả lời chuẩn:**
  - **Phân biệt:**
    - `V__*.sql` (Versioned): Chỉ chạy duy nhất một lần theo thứ tự tăng dần. Không bao giờ được phép sửa nội dung sau khi đã commit.
    - `R__*.sql` (Repeatable): Tự động chạy lại bất cứ khi nào mã checksum của file bị thay đổi (thường dùng cho Stored Procedure, Views hoặc Seed Data).
  - **Rủi ro của R__seed_demo.sql (Finding F-22):** File seed này chứa lượng dữ liệu mẫu rất lớn (83KB). Nếu triển khai lên môi trường Production, mỗi lần sửa file có thể làm nạp lại dữ liệu demo hoặc ghi đè dữ liệu thật của khách hàng. Giải pháp chuẩn là tách dữ liệu seed ra khỏi migration hoặc chỉ kích hoạt theo Spring Profile `dev`/`test`.

### Câu 29: Xử lý lỗi Checksum Mismatch trong Flyway khi làm việc nhóm
- **Tham chiếu mã nguồn:** `docs/db-review-debt.md` (mục 9), Audit Finding F-14.
- **Góc nhìn Review Code / Vấn đáp:** Điều gì xảy ra khi một thành viên trong nhóm tự ý chỉnh sửa nội dung file `V1` đã commit và đẩy lên Git? Tại sao Flyway ném lỗi `Checksum mismatch` và cách giải quyết chuẩn là gì?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế kiểm soát của Flyway:** Mỗi file `V__` khi thực thi xong sẽ được Flyway lưu mã băm (CRC32 Checksum) vào bảng `flyway_schema_history`. Ở các lần khởi động sau, Flyway sẽ tính toán lại checksum của file trong mã nguồn và so khớp với bảng lịch sử.
  - **Khi sửa file cũ:** Checksum không khớp, Flyway lập tức dừng khởi động ứng dụng để bảo vệ tính toàn vẹn của CSDL.
  - **Cách xử lý đúng chuẩn:**
    - **Tuyệt đối không sửa file V cũ đã commit lên Git.** Mọi thay đổi cấu trúc bảng hoặc sửa dữ liệu bắt buộc phải tạo một file migration mới (ví dụ `V8__fix_column.sql`).
    - Nếu đang ở máy cá nhân (chưa push Git): có thể xóa volume DB (`docker compose down -v`) để chạy lại từ đầu.

### Câu 30: Nguyên tắc đặc quyền tối thiểu (Least Privilege) trong phân quyền CSDL
- **Tham chiếu mã nguồn:** `docker/init-databases.sql` và `docs/architecture.md` (mục 5).
- **Gợi ý trả lời chuẩn:** Nếu kẻ tấn công khai thác được một lỗ hổng SQL Injection trên `content-service`, liệu họ có thể đọc trộm mật khẩu người dùng trong bảng `users` của `auth-service` không?
- **Gợi ý trả lời chuẩn:**
  - **Hoàn toàn không thể:** Nhờ chính sách phân quyền cô lập người dùng trong `init-databases.sql`.
  - Tài khoản `content_user` chỉ được cấp quyền `db_owner` (hoặc `db_datareader / db_datawriter`) trên duy nhất database `saigonvoice_content_db`.
  - Khi kẻ tấn công cố gắng thực hiện truy vấn chéo database `SELECT * FROM saigonvoice_auth_db.dbo.users`, máy chủ SQL Server sẽ chặn đứng và trả về lỗi `The server principal "content_user" is not able to access the database "saigonvoice_auth_db" under the current security context`.

### Câu 31: Vấn đề lệch múi giờ (Timezone Debt) và chuẩn hóa UTC trong JPA
- **Tham chiếu mã nguồn:** Audit Finding F-34, `docs/db-review-debt.md` (mục 5).
- **Góc nhìn Review Code / Vấn đáp:** Tại sao cần khai báo thuộc tính `spring.jpa.properties.hibernate.jdbc.time_zone = UTC`? Lệch múi giờ giữa máy chủ database và ứng dụng gây ra hậu quả gì đối với dữ liệu Analytics?
- **Gợi ý trả lời chuẩn:**
  - **Hậu quả lệch múi giờ:** SQL Server lưu kiểu `DATETIME2` không kèm thông tin Timezone Offset. Nếu máy tính lập trình viên chạy múi giờ GMT+7 trong khi container Docker chạy múi giờ UTC+0:
    - Dữ liệu sự kiện du khách quét mã QR có thể bị lệch 7 tiếng.
    - Các biểu đồ thống kê lượt nghe theo giờ trong ngày của Admin Console sẽ bị sai lệch hoàn toàn về mặt thời gian thực.
  - **Chuẩn hóa:** Luôn ép buộc Hibernate lưu và đọc thời gian theo chuẩn **UTC** ở tầng CSDL, và chỉ chuyển đổi sang múi giờ địa phương (GMT+7) khi hiển thị lên giao diện Frontend.

### Câu 32: Chiến lược lưu trữ dữ liệu tệp nhị phân (Binary Files): Docker Volume vs BLOB CSDL
- **Tham chiếu mã nguồn:** `docker-compose.yml:334-342` (các volume `audio-storage-data` và `product-uploads-data`).
- **Góc nhìn Review Code / Vấn đáp:** Tại sao file âm thanh TTS (.mp3) và ảnh sản phẩm (.jpg) lại được lưu trữ trên Docker Volume/File System mà không lưu trực tiếp dưới dạng chuỗi nhị phân (VARBINARY/BLOB) trong CSDL?
- **Gợi ý trả lời chuẩn:**
  - **Lý do không lưu BLOB trong CSDL:**
    - Làm phình to dung lượng CSDL một cách nhanh chóng, khiến việc sao lưu (backup) và phục hồi (restore) mất nhiều giờ.
    - Chiếm dụng bộ nhớ đệm Buffer Pool của SQL Server, làm giảm hiệu năng của các truy vấn đọc bảng thông thường.
  - **Lợi ích lưu trên Volume/File System:** Cho phép Nginx hoặc Spring Boot phục vụ tệp tĩnh (Static File Serving) với cơ chế HTTP Range Requests (phục vụ thanh tua âm thanh) và HTTP Caching (ETag, Cache-Control) mà không cần truy vấn qua CSDL. Trong môi trường đám mây thực tế, volume này dễ dàng thay thế bằng AWS S3 hoặc Cloudflare R2.

---

## PHẦN 5: API GATEWAY, BẢO MẬT, XÁC THỰC & PHÂN QUYỀN (8 CÂU)

### Câu 33: Thứ tự ưu tiên bộ lọc (Filter Order) và cơ chế bóc tách Header giả mạo
- **Tham chiếu mã nguồn:** `backend/api-gateway/.../filter/UntrustedHeaderStripGlobalFilter.java:36-38`.
- **Góc nhìn Review Code / Vấn đáp:** Phân tích vai trò của `UntrustedHeaderStripGlobalFilter`. Tại sao bộ lọc này phải chạy ở thứ tự `Ordered.HIGHEST_PRECEDENCE + 5`?
- **Gợi ý trả lời chuẩn:**
  - **Bảo vệ biên giới hệ thống (Perimeter Defense):** Kẻ tấn công từ ngoài Internet có thể tự gắn các header nhạy cảm như `X-User-Role: ADMIN` hoặc `X-Internal-Api-Key: secret` vào request hòng qua mặt các service backend.
  - **Xóa bỏ header giả mạo ngay cửa ngõ:** Filter này tước bỏ (strip) toàn bộ các header trên ngay khi request vừa chạm vào API Gateway.
  - **Thứ tự ưu tiên cao nhất:** Chạy trước tất cả các Filter xác thực khác. Sau khi request đã được Gateway kiểm tra JWT hợp lệ, chính Gateway mới là đối tượng duy nhất được quyền gắn lại header `X-User-Role: ADMIN` tin cậy để chuyển tiếp xuống các microservice nội bộ.

### Câu 34: Bộ lọc Path Guard: Phòng chống Path Traversal và các ký tự điều khiển bất thường
- **Tham chiếu mã nguồn:** `backend/api-gateway/.../filter/PathGuardFilter.java`.
- **Góc nhìn Review Code / Vấn đáp:** Bộ lọc `PathGuardFilter` kiểm tra những dấu hiệu bất thường nào trên URL? Tại sao lại trả về mã lỗi HTTP 400 chung mà không nêu chi tiết lý do?
- **Gợi ý trả lời chuẩn:**
  - **Các mẫu ký tự bị chặn đứng:**
    - Dấu hiệu Path Traversal: `/../`, `/./`, ký tự gạch chéo ngược `\`.
    - Ký tự kỹ thuật dò quét lỗ hổng: Dấu chấm phẩy `;` (Spring path truncation), dấu gạch chéo kép `//`.
    - Ký tự điều khiển (ASCII < 32) và ký tự non-ASCII không hợp lệ.
  - **Nguyên tắc không lộ thông tin (Information Leakage Prevention):** Trả về mã chung **HTTP 400 Bad Request** không kèm stack trace hay mô tả nội bộ, khiến kẻ tấn công không thể dựa vào thông điệp lỗi để tinh chỉnh các payload tấn công tiếp theo.

### Câu 35: Cách ly tuyến nội bộ: Tại sao trả về HTTP 404 thay vì HTTP 403?
- **Tham chiếu mã nguồn:** `backend/api-gateway/.../filter/InternalPathBlockFilter.java`.
- **Góc nhìn Review Code / Vấn đáp:** Khi người dùng từ Internet cố tình truy cập vào đường dẫn `/api/content/internal/pois/bounding-box`, API Gateway sẽ phản hồi mã trạng thái nào? Tại sao lại chọn mã đó?
- **Gợi ý trả lời chuẩn:**
  - **Mã phản hồi:** Trả về **HTTP 404 Not Found**.
  - **Lý do bảo mật:**
    - Nếu trả về **HTTP 403 Forbidden**, kẻ tấn công sẽ biết chắc chắn rằng endpoint này *thực sự tồn tại* và đang được bảo vệ, thôi thúc chúng tiếp tục tìm cách khai thác hoặc brute-force quyền truy cập.
    - Trả về **HTTP 404 Not Found** biến endpoint nội bộ thành "vô hình" trước thế giới bên ngoài (Security through Obscurity kết hợp Defense-in-Depth).

### Câu 36: Thiết kế Fail-Closed khi xác thực chữ ký JWT Secret
- **Tham chiếu mã nguồn:** `backend/api-gateway/.../filter/AdminAuthGlobalFilter.java:89-105` và `docker-compose.yml:254`.
- **Góc nhìn Review Code / Vấn đáp:** Tại sao hệ thống bắt buộc độ dài `JWT_SECRET` phải từ 32 ký tự (256 bits) trở lên? Nếu secret ngắn hơn hoặc bị thiếu, hệ thống ứng xử thế nào?
- **Gợi ý trả lời chuẩn:**
  - **Tiêu chuẩn mật mã học:** Thuật toán ký HMAC-SHA256 yêu cầu khóa bí mật có độ dài tối thiểu 256 bits (tương đương 32 ký tự ASCII) để đảm bảo độ bền vững toán học trước các cuộc tấn công Brute-force và Dictionary Attack ngoại tuyến.
  - **Hành vi Fail-Closed:** Trong mã nguồn, nếu độ dài secret < 32 ký tự, bean xác thực sẽ từ chối hoạt động hoặc ném ngoại lệ khi khởi động. Không chấp nhận các secret yếu kém kiểu `"123456"` hay `"secret"`.

### Câu 37: Cơ chế Refresh Token Rotation và Phát hiện Tái sử dụng (Reuse Detection)
- **Tham chiếu mã nguồn:** `backend/auth-service/.../service/AuthServiceImpl.java:319-326` và `RefreshTokenService.java`.
- **Góc nhìn Review Code / Vấn đáp:** Hãy giải thích quy trình Refresh Token Rotation theo chuẩn RFC 6819. Khi một Refresh Token đã bị sử dụng trong quá khứ bất ngờ được gửi lại lần thứ hai, hệ thống sẽ thực hiện hành động gì?
- **Gợi ý trả lời chuẩn:**
  - **Quy trình xoay vòng (Rotation):** Mỗi khi client gọi endpoint `/api/auth/refresh`, Refresh Token hiện tại sẽ bị thu hồi ngay lập tức và một cặp Access Token + Refresh Token hoàn toàn mới sẽ được phát hành.
  - **Phát hiện tái sử dụng (Reuse Detection - Dấu hiệu bị đánh cắp):**
    - Nếu Token cũ đã bị thu hồi (isRevoked = true) mà lại xuất hiện trong request refresh, hệ thống nhận diện rằng kẻ tấn công hoặc nạn nhân đang dùng lại token cũ (dấu hiệu rò rỉ token).
    - **Biện pháp tức thời:** Hệ thống lập tức **thu hồi toàn bộ mọi phiên đăng nhập đang hoạt động của người dùng đó** (`revokeAllForUser` với lý do `REUSE_DETECTED`) và trả về lỗi 401. Buộc người dùng hợp pháp phải đăng nhập lại và đổi mật khẩu.

### Câu 38: Chống tấn công Dò quét Email (Account Enumeration) bằng kỹ thuật Dummy Hash
- **Tham chiếu mã nguồn:** `backend/auth-service/.../service/AuthServiceImpl.java:180-186`.
- **Góc nhìn Review Code / Vấn đáp:** Phân tích đoạn code sau trong `AuthServiceImpl`:
  ```java
  boolean passwordSet = foundUser != null && foundUser.getPasswordHash() != null;
  String candidateHash = passwordSet ? foundUser.getPasswordHash() : dummyHash;
  boolean passwordMatches = passwordEncoder.matches(password, candidateHash);
  ```
  Tại sao khi không tìm thấy người dùng trong CSDL, hệ thống vẫn thực hiện so sánh mật khẩu với một chuỗi `dummyHash`?
- **Gợi ý trả lời chuẩn:**
  - **Nguyên lý thuật toán BCrypt:** Hàm băm BCrypt với Work Factor = 12 tốn khoảng 150 – 300ms tính toán CPU cho mỗi lần so khớp.
  - **Lỗ hổng Timing Attack nếu không dùng Dummy Hash:**
    - Nếu email tồn tại: hệ thống chạy BCrypt -> phản hồi mất 200ms.
    - Nếu email không tồn tại: hệ thống return lỗi ngay -> phản hồi mất 5ms.
    - Kẻ tấn công có thể đo thời gian phản hồi để biết email nào đã đăng ký tài khoản trong hệ thống (Account Enumeration).
  - **Tác dụng của Dummy Hash:** Đảm bảo thời gian phản hồi luôn đồng nhất (~200ms) trong mọi trường hợp, triệt tiêu khả năng dò quét tài khoản.

### Câu 39: Giới hạn tần suất gọi API (Rate Limiting) và tin cậy địa chỉ IP kết nối TCP
- **Tham chiếu mã nguồn:** `backend/api-gateway/.../filter/AnalyticsRateLimitGlobalFilter.java`.
- **Gợi ý trả lời chuẩn:** Tại sao bộ lọc Rate Limiter của Gateway lại sử dụng địa chỉ TCP Remote Address trực tiếp thay vì đọc header `X-Forwarded-For`? Header `Retry-After` trả về mã HTTP nào?
- **Gợi ý trả lời chuẩn:**
  - **Rủi ro của X-Forwarded-For:** Header này có thể dễ dàng bị kẻ tấn công làm giả (Spoofing) bằng cách gửi các IP ngẫu nhiên trong mỗi request, khiến cơ chế đếm số lần gọi bị vô hiệu hóa. Sử dụng trực tiếp địa chỉ IP kết nối Socket TCP đảm bảo tính xác thực tuyệt đối của nguồn phát.
  - **Phản hồi HTTP:** Khi vượt ngưỡng (60 req/phút), Gateway trả về mã **HTTP 429 Too Many Requests** kèm theo header `Retry-After: 60` chỉ dẫn cho client biết số giây cần phải chờ trước khi được gửi lại.

### Câu 40: Bảo mật Cookie: Cờ HttpOnly, SameSite và cấu hình REFRESH_COOKIE_SECURE
- **Tham chiếu mã nguồn:** `backend/auth-service/.../config/SecurityConfig.java` và `docker-compose.yml:259`.
- **Gợi ý trả lời chuẩn:** Tại sao Refresh Token lại được lưu trong Cookie với các thuộc tính `HttpOnly` và `SameSite=Strict/Lax` thay vì lưu ở `localStorage` của trình duyệt?
- **Gợi ý trả lời chuẩn:**
  - **Chống tấn công XSS (Cross-Site Scripting):** Thuộc tính `HttpOnly` ngăn không cho mã JavaScript độc hại trên trình duyệt (thông qua `document.cookie`) có thể đọc trộm Refresh Token nếu ứng dụng bị dính lỗi XSS.
  - **Chống tấn công CSRF (Cross-Site Request Forgery):** Thuộc tính `SameSite=Lax` đảm bảo cookie không bị tự động gửi kèm trong các request cross-site xuất phát từ các trang web độc hại của bên thứ ba.
  - **Cờ Secure:** Trong môi trường dev cục bộ chưa có HTTPS, cờ `Secure` được đặt bằng `false`. Khi lên môi trường sản xuất có chứng chỉ TLS/HTTPS, bắt buộc phải bật `REFRESH_COOKIE_SECURE=true` để ngăn truyền tải cookie trên kênh không mã hóa.

---

## PHẦN 6: TỰ ĐỘNG HÓA CI/CD & HẠ TẦNG CONTAINER DOCKER (6 CÂU)

### Câu 41: Tối ưu hóa kích hoạt Workflow bằng bộ lọc đường dẫn (Path Filtering)
- **Tham chiếu mã nguồn:** `.github/workflows/content-service.yml:6-8`.
- **Góc nhìn Review Code / Vấn đáp:** Phân tích đoạn cấu hình sau trong GitHub Actions:
  ```yaml
  paths:
    - 'backend/content-service/**'
    - '.github/workflows/content-service.yml'
  ```
  Điều gì xảy ra khi một lập trình viên thực hiện commit chỉ chỉnh sửa giao diện trong thư mục `frontend/`?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế Path Filtering:** GitHub Actions chỉ kích hoạt workflow của `content-service` khi có sự thay đổi trong thư mục mã nguồn của chính service đó hoặc thay đổi chính file workflow định nghĩa nó.
  - **Khi sửa frontend:** Workflow của `content-service` hoàn toàn không bị kích hoạt.
  - **Lợi ích trong kiến trúc Monorepo:** Tiết kiệm hạn ngạch tính toán (Action Runner Minutes) của tài khoản GitHub; tránh việc build lại và chạy test lãng phí cho các microservice không có bất kỳ thay đổi mã nguồn nào.

### Câu 42: Quản lý hàng đợi thực thi với Concurrency và Cancel-in-progress
- **Tham chiếu mã nguồn:** `.github/workflows/*.yml` (khối `concurrency`).
- **Góc nhìn Review Code / Vấn đáp:** Ý nghĩa của cấu hình sau là gì:
  ```yaml
  concurrency:
    group: api-gateway-${{ github.ref }}
    cancel-in-progress: true
  ```
- **Gợi ý trả lời chuẩn:**
  - **Ngữ cảnh:** Lập trình viên thường push code liên tục nhiều commit trong thời gian ngắn lên cùng một nhánh (Pull Request).
  - **Tác dụng:** Cấu hình này nhóm các lần chạy theo tên nhánh (`github.ref`). Khi có một commit mới được đẩy lên, lệnh `cancel-in-progress: true` sẽ tự động hủy ngay lập tức các job CI đang chạy dở dang của commit trước đó.
  - **Hiệu quả:** Giúp hệ thống CI luôn ưu tiên tài nguyên để kiểm thử commit mới nhất, giảm thời gian chờ đợi hàng đợi của nhóm.

### Câu 43: Cơ chế Cache Dependencies trong GitHub Actions
- **Tham chiếu mã nguồn:** `.github/workflows/content-service.yml:33-39`.
- **Gợi ý trả lời chuẩn:** Bước `actions/setup-java@v5` với cấu hình `cache: maven` và `cache-dependency-path: backend/content-service/pom.xml` giúp cải thiện hiệu năng CI như thế nào?
- **Gợi ý trả lời chuẩn:**
  - **Cơ chế hoạt động:** GitHub Actions sẽ tính mã băm (hash) của file `pom.xml` làm Cache Key. Toàn bộ thư mục `~/.m2/repository` chứa các thư viện JAR của Spring Boot sẽ được nén và lưu trữ trên bộ nhớ đệm đám mây của GitHub.
  - **Lợi ích:** Trong các lần chạy tiếp theo, nếu `pom.xml` không đổi, bước build sẽ tái sử dụng lại toàn bộ các file JAR cũ thay vì phải tải lại hàng trăm MB thư viện qua mạng Internet. Giúp giảm thời gian chạy test từ 5-7 phút xuống chỉ còn dưới 1-2 phút.

### Câu 44: Ranh giới giữa CI và CD: Đánh giá thực trạng đường ống và các bước bổ sung để hoàn thiện CD (Finding F-21)
- **Tham chiếu mã nguồn:** `.github/workflows/*.yml`, Audit Finding F-21 trong [BE_AUDIT_REPORT.md](file:///f:/Nhom3_CNPM/docs/BE_AUDIT_REPORT.md).
- **Góc nhìn Review Code / Vấn đáp:** Báo cáo Audit nhận xét hệ thống hiện tại mới chỉ có "CI tạm được" nhưng "hoàn toàn thiếu CD". Hãy chỉ ra bằng chứng trong file workflow và đề xuất các bước cần bổ sung để trở thành một hệ thống CI/CD hoàn chỉnh.
- **Gợi ý trả lời chuẩn:**
  - **Bằng chứng thiếu CD:**
    ```yaml
    - name: Build Docker image (no push)
      run: docker build -t content-service:ci backend/content-service
    ```
    Các workflow hiện tại chỉ chạy `mvn test` và build image cục bộ trên runner của GitHub rồi kết thúc; không có bước gắn nhãn phiên bản (Semantic Tagging), không đẩy image lên kho lưu trữ (Container Registry) và không có bước deploy lên máy chủ.
  - **Các bước cần bổ sung để hoàn thiện CD:**
    - **Bước 1 (Registry Push):** Đăng nhập và đẩy image lên GitHub Container Registry (`ghcr.io`) hoặc Docker Hub với tag tương ứng mã Git Commit SHA.
    - **Bước 2 (Security Scan):** Quét lỗ hổng bảo mật của Docker image bằng công cụ như Trivy hoặc Snyk.
    - **Bước 3 (Continuous Deployment):** Tự động kích hoạt Webhook hoặc SSH vào máy chủ VPS để chạy `docker compose pull` và `docker compose up -d` với cơ chế cập nhật không gián đoạn (Rolling Update / Zero Downtime).

### Câu 45: Kỹ thuật Multi-stage Build trong Dockerfile tối ưu hóa kích thước và bảo mật
- **Tham chiếu mã nguồn:** `backend/content-service/Dockerfile`.
- **Góc nhìn Review Code / Vấn đáp:** Tại sao một Dockerfile cho ứng dụng Spring Boot chuẩn nên sử dụng kỹ thuật Multi-stage Build thay vì gom tất cả lệnh vào một giai đoạn duy nhất?
- **Gợi ý trả lời chuẩn:**
  - **Cấu trúc 2 giai đoạn (Multi-stage):**
    - **Stage 1 (Builder):** Sử dụng image đầy đủ `maven:3.9-eclipse-temurin-17` chứa trình biên dịch JDK và công cụ Maven để biên dịch code và đóng gói file JAR.
    - **Stage 2 (Runtime):** Chỉ sử dụng image rút gọn siêu nhẹ `eclipse-temurin:17-jre-alpine`, sau đó chỉ sao chép duy nhất file `.jar` đã build từ Stage 1 sang.
  - **Lợi ích kép:**
    - **Giảm dung lượng:** Kích thước Docker Image giảm từ ~800MB xuống chỉ còn ~150-200MB, giúp tải và triển khai siêu tốc.
    - **Tăng cường bảo mật:** Loại bỏ hoàn toàn mã nguồn gốc, trình biên dịch và các công cụ phát triển khỏi image chạy thực tế, thu hẹp tối đa bề mặt tấn công của hacker.

### Câu 46: Tái cấu trúc Workflow trùng lặp bằng Reusable Workflows (Finding F-33)
- **Tham chiếu mã nguồn:** 6 file workflow backend trong `.github/workflows/`, Audit Finding F-33.
- **Gợi ý trả lời chuẩn:** Cả 6 microservice backend đều có nội dung workflow gần như giống hệt nhau (chỉ khác thư mục làm việc). Giải pháp chuẩn của GitHub Actions để tái sử dụng mã (DRY - Don't Repeat Yourself) là gì?
- **Gợi ý trả lời chuẩn:**
  - **Sử dụng GitHub Actions Reusable Workflows (workflow_call):**
    - Tạo một file template chung `.github/workflows/_backend-service-template.yml` với sự kiện kích hoạt `on: workflow_call: inputs: service-name: ...`.
    - Các file workflow của từng service chỉ cần gọi lại template này với cú pháp ngắn gọn `uses: ./.github/workflows/_backend-service-template.yml with: service-name: content-service`.
  - **Lợi ích bảo trì:** Khi cần nâng cấp phiên bản JDK từ 17 lên 21 hoặc thêm bước kiểm tra mã nguồn (SonarQube/Checkstyle), ta chỉ cần sửa đúng 1 file template duy nhất thay vì phải chỉnh sửa thủ công cả 6 file workflow.

---

## PHẦN 7: KIỂM THỬ, XỬ LÝ LỖI & VẬN HÀNH / GIÁM SÁT HỆ THỐNG (4 CÂU)

### Câu 47: Chuẩn hóa Schema phản hồi lỗi API theo chuẩn RFC 7807 (Problem Details)
- **Tham chiếu mã nguồn:** Audit Finding F-30 trong [BE_AUDIT_REPORT.md](file:///f:/Nhom3_CNPM/docs/BE_AUDIT_REPORT.md), cấu trúc trả lời lỗi tại Gateway và các Service.
- **Góc nhìn Review Code / Vấn đáp:** Báo cáo Audit ghi nhận sự không nhất quán trong định dạng lỗi trả về giữa các Filter và các Controller (Finding F-30). Tại sao điều này gây khó khăn cho Frontend và chuẩn RFC 7807 giải quyết điều này như thế nào?
- **Gợi ý trả lời chuẩn:**
  - **Thực trạng bất cập:** Gateway trả về `{"status": 404, "error": "...", "message": "..."}`; Filter nội bộ trả về `{"status": 401, "error": "..."}`; còn Spring Controller lại trả về format khác kèm `path`. Phía Frontend rất khó viết một Axios Interceptor bắt lỗi đồng nhất.
  - **Chuẩn hóa với RFC 7807 (Problem Details for HTTP APIs):** Spring Boot 3 đã hỗ trợ sẵn class `ProblemDetail` với cấu trúc chuẩn quốc tế:
    ```json
    {
      "type": "https://echora.local/errors/unauthorized",
      "title": "Unauthorized",
      "status": 401,
      "detail": "Missing or invalid internal API key",
      "instance": "/api/content/internal/pois/bounding-box"
    }
    ```
  - Giúp toàn bộ hệ thống trả về một cấu trúc lỗi duy nhất, dễ dàng xử lý hiển thị Toast/Alert trên giao diện người dùng.

### Câu 48: Giải pháp Truy vết phân tán (Distributed Tracing) xuyên suốt các Microservice
- **Tham chiếu mã nguồn:** Audit Finding F-17 trong [BE_AUDIT_REPORT.md](file:///f:/Nhom3_CNPM/docs/BE_AUDIT_REPORT.md).
- **Gợi ý trả lời chuẩn:** Khi một yêu cầu của du khách đi từ `api-gateway` ➔ `location-service` ➔ `content-service` và gặp lỗi, làm thế nào để lần theo dấu vết của request trong hàng triệu dòng log rời rạc nếu thiếu Correlation ID?
- **Gợi ý trả lời chuẩn:**
  - **Giải pháp Correlation ID (X-Request-Id):**
    - Tại **API Gateway**: Bộ lọc đầu vào tự động tạo một mã UUID định danh duy nhất (ví dụ `X-Request-Id: a1b2c3d4-...`) nếu client chưa có.
    - Gắn mã này vào **MDC (Mapped Diagnostic Context)** của log framework (Logback) để mọi dòng log in ra đều có tiền tố `[a1b2c3d4-...]`.
    - Truyền tiếp header này qua các lệnh gọi Feign sang các service downstream.
  - **Công cụ giám sát cao cấp:** Tích hợp **Micrometer Tracing** kết hợp OpenTelemetry và Zipkin/Jaeger, cho phép xem biểu đồ trực quan về thời gian thực thi của từng chặng mạng trong chuỗi microservices.

### Câu 49: Rủi ro rò rỉ thông tin hạ tầng từ Spring Boot Actuator (Finding F-18)
- **Tham chiếu mã nguồn:** `content-service/application.yml:62-64` (cấu hình `management.endpoint.health.show-details: always`), Audit Finding F-18.
- **Gợi ý trả lời chuẩn:** Tại sao không nên cấu hình `show-details: always` cho endpoint `/actuator/health` trên môi trường công khai?
- **Gợi ý trả lời chuẩn:**
  - **Rủi ro lộ thông tin trinh sát (Reconnaissance):** Khi bật `always`, endpoint `/actuator/health` sẽ hiển thị toàn bộ chi tiết nội bộ: phiên bản CSDL, IP máy chủ SQL Server, dung lượng ổ đĩa còn trống, trạng thái kết nối RabbitMQ Broker...
  - Kẻ tấn công có thể lợi dụng các thông tin nhạy cảm này để lên kịch bản tấn công hạ tầng chính xác.
  - **Khắc phục:** Cấu hình `show-details: never` hoặc `when-authorized`, và sử dụng API Gateway để chặn toàn bộ các endpoint `/actuator/**` không cho truy cập từ mạng Internet bên ngoài.

### Câu 50: Chiến lược Kiểm thử Tích hợp (Integration Testing) với Testcontainers trong Microservices
- **Tham chiếu mã nguồn:** Cấu trúc kiểm thử tại `backend/*/src/test/java/`.
- **Góc nhìn Review Code / Vấn đáp:** Tại sao việc chỉ viết Unit Test sử dụng Mockito (mock CSDL và mock RabbitMQ) là chưa đủ an toàn để đưa hệ thống vào vận hành? Thư viện **Testcontainers** mang lại giá trị gì cho quy trình CI/CD?
- **Gợi ý trả lời chuẩn:**
  - **Hạn chế của Mocking thông thường:** Mockito chỉ kiểm tra tính đúng đắn của logic code trong điều kiện giả định hoàn hảo. Nó không thể phát hiện được các lỗi thực tế như:
    - Lỗi cú pháp SQL Server đặc thù (T-SQL syntax error).
    - Lỗi chạy migration Flyway.
    - Lỗi sai lệch cấu hình Binding giữa Exchange và Queue của RabbitMQ.
  - **Sức mạnh của Testcontainers:** Cho phép khởi động các Docker Container thật (SQL Server thật, RabbitMQ thật) ngay trong quá trình chạy `mvn test` trên máy dev hoặc GitHub Actions runner.
  - **Kết quả:** Đảm bảo 100% tính tương thích thực tế của hệ thống trước khi đóng gói thành sản phẩm hoàn chỉnh, mang lại sự tự tin tuyệt đối cho đội ngũ kỹ thuật khi bảo vệ đồ án giữa kỳ.

---

> **Tài liệu hoàn thành:** Bộ 50 câu hỏi bám sát từng file code và dòng lệnh trong repository `Nhom3_CNPM`. Bạn có thể mở trực tiếp file HTML [ON_TAP_GIUA_KI_50_CAU_HOI_CODE_REVIEW.html](file:///f:/Nhom3_CNPM/docs/ON_TAP_GIUA_KI_50_CAU_HOI_CODE_REVIEW.html) trên trình duyệt để in ra PDF hoặc lưu trữ với phông chữ Times New Roman và định dạng màu chữ đen tiêu chuẩn!
