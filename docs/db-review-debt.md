# SỔ NỢ KỸ THUẬT CƠ SỞ DỮ LIỆU (DATABASE REVIEW DEBT) — ECHORA

Tài liệu này tổng hợp toàn bộ các khoản nợ kỹ thuật (technical debt), rủi ro cấu hình và kiến trúc cơ sở dữ liệu được phát hiện trong đợt DB Review toàn diện của dự án Echora.

---

## 1. `init-databases.sql`: `CHECK_POLICY = OFF` cho 3 Login App
- **Hiện trạng:** Tệp `docker/init-databases.sql` hiện đang khởi tạo 3 SQL Server login (`content_user`, `translation_user`, `analytics_user`) với tùy chọn `CHECK_POLICY = OFF`.
- **Rủi ro:** Vô hiệu hóa chính sách kiểm tra độ phức tạp và hết hạn mật khẩu của Windows/SQL Server.
- **Kế hoạch xử lý:** Bật lại `CHECK_POLICY = ON` và áp dụng chính sách mật khẩu mạnh trong môi trường production / staging.

## 2. Cổng `1433` Mở Ra Toàn Mạng LAN và Tài Khoản `sa` Còn Bật
- **Hiện trạng:** Trong `docker-compose.yml`, dịch vụ MSSQL ánh xạ `1433:1433` lắng nghe trên tất cả các network interface (`0.0.0.0`), đồng thời tài khoản quản trị tối cao `sa` vẫn đang kích hoạt.
- **Rủi ro:** Bất kỳ máy nào trong mạng nội bộ (LAN / WiFi) đều có thể truy cập thẳng vào SQL Server nếu biết hoặc brute-force mật khẩu `sa`.
- **Kế hoạch xử lý:** Bind cổng về localhost `127.0.0.1:1433:1433` là ưu tiên hàng đầu của đợt cứng hóa bảo mật (security hardening) tiếp theo.

## 3. DB-02: Chưa Tách Login Migration và Runtime
- **Hiện trạng:** Các application user (`content_user`, `translation_user`, `analytics_user`) hiện đang được gán quyền `db_owner` trong CSDL tương ứng để phục vụ cả việc chạy Flyway migration khi container khởi động.
- **Rủi ro:** Vi phạm nguyên tắc đặc quyền tối thiểu (Least Privilege). Runtime application không nên có quyền DDL (DROP, ALTER, CREATE).
- **Kế hoạch xử lý:** Tách bạch 2 tài khoản riêng: tài khoản migration (quyền `db_owner` hoặc DDLAdmin chỉ dùng khi migrate) và tài khoản runtime (chỉ cấp `db_datareader` và `db_datawriter`).

## 4. Ghim Tag Cố Định Cho Docker Image MSSQL và RabbitMQ
- **Hiện trạng:** `docker-compose.yml` đang sử dụng floating tag: `mcr.microsoft.com/mssql/server:2022-latest` và `rabbitmq:3-management`.
- **Rủi ro:** Khi pull lại image ở thời điểm khác nhau hoặc trên máy khác, phiên bản base image có thể thay đổi ngoài ý muốn dẫn đến sai lệch hành vi hoặc lỗi tương thích.
- **Kế hoạch xử lý:** Ghim chặt chẽ digest hoặc tag phiên bản cụ thể (ví dụ: `2022-CU14-ubuntu-22.04` và `3.13.7-management`).

## 5. `hibernate.jdbc.time_zone` Chưa Được Thiết Lập
- **Hiện trạng:** Các file cấu hình `application.yml` chưa khai báo thuộc tính `spring.jpa.properties.hibernate.jdbc.time_zone=UTC`.
- **Hành vi thực tế:** Trong Docker container, múi giờ hệ thống mặc định là UTC nên các trường `datetime2` lưu đúng UTC. Tuy nhiên, nếu developer chạy trực tiếp `mvn spring-boot:run` trên máy host tại Việt Nam (GMT+7), Hibernate có thể lưu hoặc chuyển đổi timestamp lệch +7 tiếng.
- **Kế hoạch xử lý:** Khai báo tường minh `spring.jpa.properties.hibernate.jdbc.time_zone: UTC` trong cấu hình JPA của tất cả các microservices.

## 6. Lỗi Cắt Chuỗi Dữ Liệu Bị Retry 3 Lần (~7 Giây) Trước Khi Vào DLQ
- **Hiện trạng:** Khi dữ liệu vượt độ dài cột (lỗi SQL 8152 hoặc tương tự), Spring Retry mặc định thử lại 3 lần với backoff (~7 giây) rồi mới đưa message vào DLQ (`analytics.event.dlq` hoặc xử lý lỗi).
- **Đánh giá mức độ:** Mức độ **LOW**, chấp nhận được vì tần suất dữ liệu lỗi định dạng trong thực tế thấp và không gây nghẽn nghiêm trọng cho consumer.

## 7. DB-01: Ghi Nợ Composite Index, Không Tạo Index `occurred_at`
- **Ghi nợ:** Composite index `(event_type, trigger_type)` và `(event_type, language_code)` trên bảng `analytics_event` để tối ưu cho các truy vấn tổng hợp báo cáo (`/api/analytics/summary`).
- **Quyết định:** KHÔNG tạo index đơn lẻ trên `occurred_at`.
- **Lý do:** Trạng thái **Không PROVEN**. Thử nghiệm đo đạc thực tế chỉ tốn 2–5 logical reads trên tập dữ liệu hiện tại (121–141 dòng), chưa chứng minh được sự suy giảm hiệu năng để biện minh cho chi phí bảo trì thêm index.

## 8. DB-03: Đóng Vấn Đề Lộ Biến Môi Trường Trong Container, Không Sửa
- **Quyết định:** Đóng (Closed), không sửa.
- **Lý do:** Bất kỳ ai đã có quyền truy cập vào Docker host và thực thi lệnh `docker exec` / `ps` thì theo mô hình bảo mật của hệ điều hành đều đã có toàn quyền đọc `/proc/<pid>/environ` của container. Việc che giấu biến môi trường trong tiến trình không mang lại giá trị gia tăng về an ninh ở tầng ứng dụng.

## 9. DB-04: Sửa File Flyway V1 Sau Commit Dẫn Đến Lỗi Checksum
- **Hiện trạng:** File Flyway migration `V1__init_content_schema.sql` từng bị chỉnh sửa sau commit ban đầu.
- **Hệ quả:** Bất kỳ thành viên nào trong nhóm hoặc môi trường CI đã dựng CSDL từ bản V1 cũ sẽ gặp lỗi `FlywayChecksumValidateException` khi pull mã nguồn mới.
- **Cách khắc phục:** Máy phát sinh lỗi bắt buộc phải chạy `docker compose down -v` để xóa volume dữ liệu cũ và khởi tạo lại từ đầu. Tuyệt đối không sửa lại các file V1/V2 đã commit; mọi thay đổi schema trong tương lai phải là migration mới (`V3__...`).

## 10. Bảng `translation_job` Phình Dần & Dư Thừa Index
- **Hiện trạng 1 (Phình dữ liệu):** Bảng `translation_job` ghi nhận mỗi job theo hash nội dung (`content_hash`) nhưng hiện chưa có cơ chế dọn dẹp (cleanup / pruning / archival) các job cũ đã hoàn thành (`DONE`). Dữ liệu sẽ phình to theo thời gian.
- **Hiện trạng 2 (Dư thừa Index):** Bảng hiện có index `idx_job_poi_lang (poi_id, language_code)`. Tuy nhiên, ràng buộc duy nhất `UQ_translation_job` được định nghĩa trên `(poi_id, language_code, content_hash)`. Do `(poi_id, language_code)` là tiền tố bên trái (leftmost prefix) của `UQ_translation_job`, nên index riêng `idx_job_poi_lang` gần như dư thừa và tiêu tốn thêm tài nguyên ghi.

## 11. Các Hạng Mục Giữ Nguyên Trạng Thái Nợ (Chưa Kiểm)
Các hạng mục sau chưa đủ điều kiện kiểm tra trong đợt review này và tiếp tục được theo dõi trong sổ nợ:
- Thiếu index cho một số cột khóa ngoại (`FK`) hoặc cột thường xuyên xuất hiện trong mệnh đề `WHERE`.
- Nguy cơ Race Condition tiềm ẩn khi nhiều luồng cùng ghi nhận cache TTS đồng thời với cùng một `content_hash`.
- Đánh giá và kiểm tra trạng thái chi tiết của tài khoản `sa` trên hệ điều hành host.

## 12. Bảng `tts_audio_cache` Có 0 Dòng (TTS-06 Dead Code)
- **Bằng chứng thực tế:**
  - `SELECT COUNT(*) FROM dbo.tts_audio_cache` trả về đúng **0 dòng**.
  - `audio_url` và trạng thái TTS thực tế đang được lưu và cập nhật trực tiếp tại bảng `poi_translation` (`saigonvoice_content_db`).
  - Các tệp âm thanh thực tế được lưu thẳng trên volume vật lý `nhom3_cnpm_audio-storage-data` tại đường dẫn `/app/storage/audio` trong container `translation-tts-service`.
- **Kết luận:** Bảng `tts_audio_cache` trong `saigonvoice_translation_db` hoàn toàn không được sử dụng ở luồng nghiệp vụ hiện tại (Dead Code / Unused Table), cần được xem xét tái sử dụng để caching TTS theo hash nội dung hoặc dọn bỏ ở phiên bản tiếp theo.
