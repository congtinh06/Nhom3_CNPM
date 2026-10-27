# DANH MỤC QUẢN LÝ VÀ CHÚ THÍCH HÌNH ẢNH TOÀN BỘ 4 CHƯƠNG
## ĐỀ TÀI: HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ (ECHORA SMART HERITAGE NARRATION)
**Đơn vị thực hiện**: Nhóm 03 – Lớp Kỹ nghệ Phần mềm  
**Mục tiêu thư mục**: Tập trung toàn bộ 21 sơ đồ và hình ảnh minh họa từ 4 chương báo cáo học phần, kèm tệp chú thích chi tiết cho từng hình giúp việc quản lý, tra cứu và trình chiếu trở nên thuận tiện nhất.

---
## 1. CẤU TRÚC TỔ CHỨC THƯ MỤC `img/`
Thư mục `img/` được thiết kế linh hoạt hỗ trợ 2 cách tiếp cận tra cứu:
- **Tra cứu phẳng trực tiếp (Flat Access)**: Toàn bộ 21 hình ảnh đều được lưu trực tiếp tại thư mục gốc `img/` với tiền tố rõ ràng như `Hinh_1.1_Chuong_1.png`, `Hinh_1.1_Chuong_1.txt`, `Hinh_2.1_Chuong_2.png`, v.v.
- **Tra cứu theo phân hệ chương (Hierarchical Subfolders)**: Phân bổ vào 4 thư mục con chuyên biệt `Chuong_1/`, `Chuong_2/`, `Chuong_3/`, `Chuong_4/`.
- **Mỗi hình ảnh đều có 1 tệp chú thích đi kèm (`.txt`)**: Ghi nhận ký hiệu, tiêu đề, vị trí trang/mục trong báo cáo, danh sách tác nhân/thành phần, tiêu chuẩn kỹ thuật và giải thích chi tiết ý nghĩa nghiệp vụ.

---

## 2. BẢNG TỔNG HỢP 21 HÌNH ẢNH VÀ SƠ ĐỒ XUYÊN SUỐT 4 CHƯƠNG

| STT | Ký hiệu hình | Tiêu đề Sơ đồ chi tiết | Thuộc Chương & Mục | Tệp Hình ảnh | Tệp Chú thích | Tệp Vector |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| 1 | **Hinh 1.1 Chuong 1** | Sơ đồ Ranh giới Bối cảnh Hệ thống Echora (System Context Diagram) | Chương 1: Tổng quan Đề tài (Mục 1.6 – Ranh giới Bối cảnh Hệ thống (System Context)) | [`Hinh_1.1_Chuong_1.png`](./Hinh_1.1_Chuong_1.png) | [`Hinh_1.1_Chuong_1.txt`](./Hinh_1.1_Chuong_1.txt) | [`Hinh_1.1_Chuong_1.svg`](./Hinh_1.1_Chuong_1.svg) |
| 2 | **Hinh 1.2 Chuong 1** | Quy trình Vòng đời Kỹ nghệ Phần mềm Đề tài Echora (SE Lifecycle) | Chương 1: Tổng quan Đề tài (Mục 1.6.2 – Quy trình Vòng đời Kỹ nghệ Phần mềm) | [`Hinh_1.2_Chuong_1.png`](./Hinh_1.2_Chuong_1.png) | [`Hinh_1.2_Chuong_1.txt`](./Hinh_1.2_Chuong_1.txt) | [`Hinh_1.2_Chuong_1.svg`](./Hinh_1.2_Chuong_1.svg) |
| 3 | **Hinh 2.1 Chuong 2** | Sơ đồ Kiến trúc Giải pháp Tổng quan Hệ thống Echora (Solution Architecture) | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.7 – Kiến trúc Giải pháp Tổng quan 4 Tầng) | [`Hinh_2.1_Chuong_2.png`](./Hinh_2.1_Chuong_2.png) | [`Hinh_2.1_Chuong_2.txt`](./Hinh_2.1_Chuong_2.txt) | — |
| 4 | **Hinh 2.2 Chuong 2** | Sơ đồ Cây Phân cấp Tính năng Sản phẩm Echora (PRD Feature Tree) | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.9 – Danh mục Tính năng Sản phẩm (Key Features)) | [`Hinh_2.2_Chuong_2.png`](./Hinh_2.2_Chuong_2.png) | [`Hinh_2.2_Chuong_2.txt`](./Hinh_2.2_Chuong_2.txt) | — |
| 5 | **Hinh 2.3 Chuong 2** | Sơ đồ Luồng Vận hành Định vị Geofence GPS và Thuyết minh Tự động | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.10.1 – FLOW-01: Định vị GPS và Thuyết minh Tự động Ngoài trời) | [`Hinh_2.3_Chuong_2.png`](./Hinh_2.3_Chuong_2.png) | [`Hinh_2.3_Chuong_2.txt`](./Hinh_2.3_Chuong_2.txt) | — |
| 6 | **Hinh 2.4 Chuong 2** | Sơ đồ Hoạt động Luồng Đặt hàng và Thanh toán An toàn qua Cổng VNPAY | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.10.3 – FLOW-03: Mua gói Premium và Thanh toán qua VNPAY) | [`Hinh_2.4_Chuong_2.png`](./Hinh_2.4_Chuong_2.png) | [`Hinh_2.4_Chuong_2.txt`](./Hinh_2.4_Chuong_2.txt) | — |
| 7 | **Hinh 2.5 Chuong 2** | Sơ đồ Hoạt động Pipeline Tự động Dịch thuật và Sinh Giọng nói AI Edge-TTS | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.10.5 – FLOW-05: Quản trị POI và Pipeline Dịch thuật & TTS) | [`Hinh_2.5_Chuong_2.png`](./Hinh_2.5_Chuong_2.png) | [`Hinh_2.5_Chuong_2.txt`](./Hinh_2.5_Chuong_2.txt) | — |
| 8 | **Hinh 2.6 Chuong 2** | Sơ đồ Phân rã Phả hệ Product Backlog (Epic - Feature - User Story - AC) | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.14 – Product Backlog và User Stories) | [`Hinh_2.6_Chuong_2.png`](./Hinh_2.6_Chuong_2.png) | [`Hinh_2.6_Chuong_2.txt`](./Hinh_2.6_Chuong_2.txt) | [`Hinh_2.6_Chuong_2.svg`](./Hinh_2.6_Chuong_2.svg) |
| 9 | **Hinh 2.7 Chuong 2** | Sơ đồ Mô hình Ma trận Truy vết Yêu cầu Phần mềm Hai chiều (RTM Model) | Chương 2: PRD và Phân tích Yêu cầu Sản phẩm (Mục 2.16 – Ma trận Truy vết Yêu cầu Phần mềm (RTM)) | [`Hinh_2.7_Chuong_2.png`](./Hinh_2.7_Chuong_2.png) | [`Hinh_2.7_Chuong_2.txt`](./Hinh_2.7_Chuong_2.txt) | [`Hinh_2.7_Chuong_2.svg`](./Hinh_2.7_Chuong_2.svg) |
| 10 | **Hinh 3.1 Chuong 3** | Sơ đồ Ca sử dụng Tổng thể Hệ thống Echora (Overall Use Case Diagram UML 2.5) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.4.1 – Sơ đồ Use Case Tổng thể Hệ thống Echora) | [`Hinh_3.1_Chuong_3.png`](./Hinh_3.1_Chuong_3.png) | [`Hinh_3.1_Chuong_3.txt`](./Hinh_3.1_Chuong_3.txt) | [`Hinh_3.1_Chuong_3.svg`](./Hinh_3.1_Chuong_3.svg) |
| 11 | **Hinh 3.2 Chuong 3** | Sơ đồ Ca sử dụng Phân hệ Du khách & Trải nghiệm Di sản (Tourist Subsystem) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.4.2 – Sơ đồ Use Case Phân hệ Du khách & Trải nghiệm Di sản) | [`Hinh_3.2_Chuong_3.png`](./Hinh_3.2_Chuong_3.png) | [`Hinh_3.2_Chuong_3.txt`](./Hinh_3.2_Chuong_3.txt) | [`Hinh_3.2_Chuong_3.svg`](./Hinh_3.2_Chuong_3.svg) |
| 12 | **Hinh 3.3 Chuong 3** | Sơ đồ Ca sử dụng Phân hệ Người dùng, Giỏ hàng & Thanh toán (User Order Subsystem) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.4.3 – Sơ đồ Use Case Phân hệ Người dùng, Giỏ hàng & Thanh toán) | [`Hinh_3.3_Chuong_3.png`](./Hinh_3.3_Chuong_3.png) | [`Hinh_3.3_Chuong_3.txt`](./Hinh_3.3_Chuong_3.txt) | [`Hinh_3.3_Chuong_3.svg`](./Hinh_3.3_Chuong_3.svg) |
| 13 | **Hinh 3.4 Chuong 3** | Sơ đồ Ca sử dụng Phân hệ Quản trị Nội dung Di sản & CMS (Admin Subsystem) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.4.4 – Sơ đồ Use Case Phân hệ Quản trị Nội dung Di sản & CMS) | [`Hinh_3.4_Chuong_3.png`](./Hinh_3.4_Chuong_3.png) | [`Hinh_3.4_Chuong_3.txt`](./Hinh_3.4_Chuong_3.txt) | [`Hinh_3.4_Chuong_3.svg`](./Hinh_3.4_Chuong_3.svg) |
| 14 | **Hinh 3.5 Chuong 3** | Sơ đồ Hoạt động Nghiệp vụ Thuyết minh Tự động theo Vị trí GPS (Activity Diagram) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.6.1 – Sơ đồ Hoạt động Thuyết minh GPS Tự động) | [`Hinh_3.5_Chuong_3.png`](./Hinh_3.5_Chuong_3.png) | [`Hinh_3.5_Chuong_3.txt`](./Hinh_3.5_Chuong_3.txt) | [`Hinh_3.5_Chuong_3.svg`](./Hinh_3.5_Chuong_3.svg) |
| 15 | **Hinh 3.6 Chuong 3** | Sơ đồ Hoạt động Nghiệp vụ Nâng cấp Gói Premium và Thanh toán VNPAY (Activity Diagram) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.6.2 – Sơ đồ Hoạt động Nâng cấp Premium và Thanh toán VNPAY) | [`Hinh_3.6_Chuong_3.png`](./Hinh_3.6_Chuong_3.png) | [`Hinh_3.6_Chuong_3.txt`](./Hinh_3.6_Chuong_3.txt) | [`Hinh_3.6_Chuong_3.svg`](./Hinh_3.6_Chuong_3.svg) |
| 16 | **Hinh 3.7 Chuong 3** | Sơ đồ Luồng Nghiệp vụ Vận hành Tổng thể Hệ thống (End-to-End Operational Workflow) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.7.1 – Luồng Nghiệp vụ Vận hành Toàn diện Hệ thống) | [`Hinh_3.7_Chuong_3.png`](./Hinh_3.7_Chuong_3.png) | [`Hinh_3.7_Chuong_3.txt`](./Hinh_3.7_Chuong_3.txt) | [`Hinh_3.7_Chuong_3.svg`](./Hinh_3.7_Chuong_3.svg) |
| 17 | **Hinh 3.8 Chuong 3** | Sơ đồ Tuần tự Luồng Xác thực và Luân chuyển Refresh Token (Sequence Diagram) | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.7.2 – Sơ đồ Tuần tự Xác thực JWT và Silent Token Refresh) | [`Hinh_3.8_Chuong_3.png`](./Hinh_3.8_Chuong_3.png) | [`Hinh_3.8_Chuong_3.txt`](./Hinh_3.8_Chuong_3.txt) | [`Hinh_3.8_Chuong_3.svg`](./Hinh_3.8_Chuong_3.svg) |
| 18 | **Hinh 3.9 Chuong 3** | Sơ đồ Tuần tự Pipeline Tự động Dịch thuật và Tổng hợp Giọng nói AI Edge-TTS | Chương 3: Phân tích Nghiệp vụ và Mô hình hóa Hệ thống (Mục 3.7.3 – Sơ đồ Tuần tự Pipeline Dịch thuật và Edge-TTS) | [`Hinh_3.9_Chuong_3.png`](./Hinh_3.9_Chuong_3.png) | [`Hinh_3.9_Chuong_3.txt`](./Hinh_3.9_Chuong_3.txt) | [`Hinh_3.9_Chuong_3.svg`](./Hinh_3.9_Chuong_3.svg) |
| 19 | **Hinh 4.1 Chuong 4** | Sơ đồ Thành phần Phần mềm Hệ thống Echora (Component Diagram UML 2.5) | Chương 4: Thiết kế Hệ thống (Mục 4.3 – Thiết kế Kiến trúc Thành phần Phần mềm (Component Diagram)) | [`Hinh_4.1_Chuong_4.png`](./Hinh_4.1_Chuong_4.png) | [`Hinh_4.1_Chuong_4.txt`](./Hinh_4.1_Chuong_4.txt) | [`Hinh_4.1_Chuong_4.svg`](./Hinh_4.1_Chuong_4.svg) |
| 20 | **Hinh 4.2 Chuong 4** | Sơ đồ Triển khai Vật lý và Môi trường Thực thi Hệ thống Echora (Deployment Diagram UML 2.5) | Chương 4: Thiết kế Hệ thống (Mục 4.4 – Thiết kế Kiến trúc Triển khai Vật lý (Deployment Diagram)) | [`Hinh_4.2_Chuong_4.png`](./Hinh_4.2_Chuong_4.png) | [`Hinh_4.2_Chuong_4.txt`](./Hinh_4.2_Chuong_4.txt) | [`Hinh_4.2_Chuong_4.svg`](./Hinh_4.2_Chuong_4.svg) |
| 21 | **Hinh 4.3 Chuong 4** | Sơ đồ Thực thể Mối quan hệ Cơ sở Dữ liệu Chuẩn Crow's Foot (ERD) | Chương 4: Thiết kế Hệ thống (Mục 4.5 – Thiết kế Cơ sở Dữ liệu Quan hệ Chuẩn hóa 3NF (ERD)) | [`Hinh_4.3_Chuong_4.png`](./Hinh_4.3_Chuong_4.png) | [`Hinh_4.3_Chuong_4.txt`](./Hinh_4.3_Chuong_4.txt) | [`Hinh_4.3_Chuong_4.svg`](./Hinh_4.3_Chuong_4.svg) |

---

## 3. CHI TIẾT NỘI DUNG CHÚ THÍCH THEO TỪNG CHƯƠNG


### CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI

#### 1. Hinh 1.1 Chuong 1: Sơ đồ Ranh giới Bối cảnh Hệ thống Echora (System Context Diagram)
- **Vị trí báo cáo**: Mục 1.6 – Ranh giới Bối cảnh Hệ thống (System Context)
- **Tệp hình ảnh**: [`img/Hinh_1.1_Chuong_1.png`](./Hinh_1.1_Chuong_1.png) | **Tệp chú thích**: [`img/Hinh_1.1_Chuong_1.txt`](./Hinh_1.1_Chuong_1.txt)
- **Ý nghĩa nghiệp vụ**: Sơ đồ mô tả tường minh ranh giới bối cảnh (System Boundary) của Hệ thống Thuyết minh Tự động Echora. Hệ thống giữ vị trí trung tâm, tiếp nhận yêu cầu định vị GPS, quét mã QR và tương tác âm thanh từ Du khách; tiếp nhận thao tác quản trị POI, duyệt đơn và theo dõi thống kê từ Quản trị viên. Hệ thống kết nối đa chiều với 4 dịch vụ ngoại vi: Cảm biến GPS, Bản đồ OpenStreetMap, Cổng thanh toán VNPAY/VietQR, và Động cơ tổng hợp tiếng nói AI Microsoft Edge-TTS.

#### 2. Hinh 1.2 Chuong 1: Quy trình Vòng đời Kỹ nghệ Phần mềm Đề tài Echora (SE Lifecycle)
- **Vị trí báo cáo**: Mục 1.6.2 – Quy trình Vòng đời Kỹ nghệ Phần mềm
- **Tệp hình ảnh**: [`img/Hinh_1.2_Chuong_1.png`](./Hinh_1.2_Chuong_1.png) | **Tệp chú thích**: [`img/Hinh_1.2_Chuong_1.txt`](./Hinh_1.2_Chuong_1.txt)
- **Ý nghĩa nghiệp vụ**: Minh họa trực quan chu trình khép kín của quy trình kỹ nghệ phần mềm áp dụng cho toàn bộ đồ án: Khảo sát thực địa di tích TP.HCM -> Xây dựng PRD & Product Backlog (Chương 2) -> Phân tích Nghiệp vụ & Mô hình hóa Use Case (Chương 3) -> Thiết kế Kiến trúc & Cơ sở dữ liệu 3NF (Chương 4) -> Lập trình nguyên mẫu thử nghiệm (React/Node.js/Spring Boot) -> Kiểm thử nghiệm thu (UAT) -> Đóng gói Docker và Báo cáo tổng kết.


### CHƯƠNG 2: PRD VÀ PHÂN TÍCH YÊU CẦU SẢN PHẨM

#### 3. Hinh 2.1 Chuong 2: Sơ đồ Kiến trúc Giải pháp Tổng quan Hệ thống Echora (Solution Architecture)
- **Vị trí báo cáo**: Mục 2.7 – Kiến trúc Giải pháp Tổng quan 4 Tầng
- **Tệp hình ảnh**: [`img/Hinh_2.1_Chuong_2.png`](./Hinh_2.1_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.1_Chuong_2.txt`](./Hinh_2.1_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Minh họa kiến trúc giải pháp 4 tầng chuẩn Enterprise: Tầng 1 (Presentation): Progressive Web App (PWA) du khách và Bảng điều khiển quản trị Admin; Tầng 2 (Gateway & Security): Spring Cloud Gateway kiểm tra chữ ký JWT, điều phối lưu lượng và giới hạn tần suất Rate Limit; Tầng 3 (Business Microservices): AuthService, ContentService, OrderPaymentService, TranslationTtsPipeline, AnalyticsService; Tầng 4 (Data & External Providers): RDBMS SQL Server / PostgreSQL, Redis Caching, RabbitMQ Broker, VNPAY Sandbox, OSM, Edge-TTS.

#### 4. Hinh 2.2 Chuong 2: Sơ đồ Cây Phân cấp Tính năng Sản phẩm Echora (PRD Feature Tree)
- **Vị trí báo cáo**: Mục 2.9 – Danh mục Tính năng Sản phẩm (Key Features)
- **Tệp hình ảnh**: [`img/Hinh_2.2_Chuong_2.png`](./Hinh_2.2_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.2_Chuong_2.txt`](./Hinh_2.2_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Biểu diễn cấu trúc phân cấp cây tính năng toàn diện của hệ sinh thái Echora, phân rã 16 tính năng nghiệp vụ (FEAT-01 đến FEAT-16) thành 4 nhánh chức năng chính: (1) Nhóm Trải nghiệm Tham quan Du khách; (2) Nhóm Thương mại & Thanh toán Số; (3) Nhóm Quản trị Nội dung Di sản; (4) Nhóm Quản trị Nền tảng & Hệ thống.

#### 5. Hinh 2.3 Chuong 2: Sơ đồ Luồng Vận hành Định vị Geofence GPS và Thuyết minh Tự động
- **Vị trí báo cáo**: Mục 2.10.1 – FLOW-01: Định vị GPS và Thuyết minh Tự động Ngoài trời
- **Tệp hình ảnh**: [`img/Hinh_2.3_Chuong_2.png`](./Hinh_2.3_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.3_Chuong_2.txt`](./Hinh_2.3_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Mô tả quy trình lấy tọa độ không gian WGS84 mỗi 3 giây, áp dụng công thức Haversine tính khoảng cách tới các POI, so sánh với ngưỡng bán kính Geofence (35m - 60m). Khi thỏa điều kiện sau 10 giây trễ chống rung chấn, hệ thống tự động kích hoạt Floating Audio Player phát âm thanh MP3 kèm phụ đề chạy chữ đa ngữ đồng bộ.

#### 6. Hinh 2.4 Chuong 2: Sơ đồ Hoạt động Luồng Đặt hàng và Thanh toán An toàn qua Cổng VNPAY
- **Vị trí báo cáo**: Mục 2.10.3 – FLOW-03: Mua gói Premium và Thanh toán qua VNPAY
- **Tệp hình ảnh**: [`img/Hinh_2.4_Chuong_2.png`](./Hinh_2.4_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.4_Chuong_2.txt`](./Hinh_2.4_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Minh họa luồng đặt hàng và thanh toán trực tuyến bảo mật: Tạo đơn hàng PENDING, ký số HMAC-SHA512 với HashSecret, chuyển hướng sang VNPAY, người dùng nhập OTP thẻ ngân hàng, VNPAY phản hồi IPN Webhook hai chiều ngầm, Backend đối soát chữ ký số, cập nhật trạng thái PAID và nâng quyền Premium ngay lập tức.

#### 7. Hinh 2.5 Chuong 2: Sơ đồ Hoạt động Pipeline Tự động Dịch thuật và Sinh Giọng nói AI Edge-TTS
- **Vị trí báo cáo**: Mục 2.10.5 – FLOW-05: Quản trị POI và Pipeline Dịch thuật & TTS
- **Tệp hình ảnh**: [`img/Hinh_2.5_Chuong_2.png`](./Hinh_2.5_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.5_Chuong_2.txt`](./Hinh_2.5_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Mô tả quy trình xử lý nội dung di sản bất đồng bộ: Biên tập viên nhập lời thoại tiếng Việt gốc; hệ thống lưu CSDL và đẩy sự kiện 'poi.pipeline.start' vào RabbitMQ; Worker Service tiếp nhận dịch thuật tự động sang Tiếng Anh, Nhật, Hàn; gọi động cơ Microsoft Edge-TTS tổng hợp 3 tệp MP3 và cập nhật đường dẫn vào hệ thống.

#### 8. Hinh 2.6 Chuong 2: Sơ đồ Phân rã Phả hệ Product Backlog (Epic - Feature - User Story - AC)
- **Vị trí báo cáo**: Mục 2.14 – Product Backlog và User Stories
- **Tệp hình ảnh**: [`img/Hinh_2.6_Chuong_2.png`](./Hinh_2.6_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.6_Chuong_2.txt`](./Hinh_2.6_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Trực quan hóa cấu trúc phân rã phả hệ Product Backlog theo phương pháp luận Agile/Scrum: Từ 6 Epic nghiệp vụ lớn -> Phân rã thành 16 Feature chức năng -> Phân rã thành 30 User Stories được viết theo chuẩn quốc tế (As a... I want to... So that...) đi kèm Tiêu chí chấp nhận (AC) định dạng Given-When-Then.

#### 9. Hinh 2.7 Chuong 2: Sơ đồ Mô hình Ma trận Truy vết Yêu cầu Phần mềm Hai chiều (RTM Model)
- **Vị trí báo cáo**: Mục 2.16 – Ma trận Truy vết Yêu cầu Phần mềm (RTM)
- **Tệp hình ảnh**: [`img/Hinh_2.7_Chuong_2.png`](./Hinh_2.7_Chuong_2.png) | **Tệp chú thích**: [`img/Hinh_2.7_Chuong_2.txt`](./Hinh_2.7_Chuong_2.txt)
- **Ý nghĩa nghiệp vụ**: Minh họa mô hình khái niệm truy vết yêu cầu hai chiều theo chuẩn IEEE 830 và CMMI: Truy vết xuôi (Forward Traceability) bảo đảm 100% mục tiêu ban đầu (Goal) đều được hiện thực hóa trong mã nguồn; Truy vết ngược (Backward Traceability) bảo đảm mọi đoạn mã và test case đều có lý do tồn tại chính đáng, chống Gold-plating.


### CHƯƠNG 3: PHÂN TÍCH NGHIỆP VỤ VÀ MÔ HÌNH HÓA HỆ THỐNG

#### 10. Hinh 3.1 Chuong 3: Sơ đồ Ca sử dụng Tổng thể Hệ thống Echora (Overall Use Case Diagram UML 2.5)
- **Vị trí báo cáo**: Mục 3.4.1 – Sơ đồ Use Case Tổng thể Hệ thống Echora
- **Tệp hình ảnh**: [`img/Hinh_3.1_Chuong_3.png`](./Hinh_3.1_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.1_Chuong_3.txt`](./Hinh_3.1_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Sơ đồ ca sử dụng toàn cảnh xác lập ranh giới hệ thống (System Boundary) Echora. Toàn bộ 13 ca sử dụng cốt lõi nằm bên trong ranh giới; 4 tác nhân con người và 6 tác nhân hệ thống ngoại vi nằm bên ngoài. Thể hiện mối quan hệ kế thừa tác nhân (Actor Generalization) giữa Người dùng đăng ký và Khách vãng lai, cùng các mối quan hệ <<include>> có căn cứ nghiệp vụ chặt chẽ.

#### 11. Hinh 3.2 Chuong 3: Sơ đồ Ca sử dụng Phân hệ Du khách & Trải nghiệm Di sản (Tourist Subsystem)
- **Vị trí báo cáo**: Mục 3.4.2 – Sơ đồ Use Case Phân hệ Du khách & Trải nghiệm Di sản
- **Tệp hình ảnh**: [`img/Hinh_3.2_Chuong_3.png`](./Hinh_3.2_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.2_Chuong_3.txt`](./Hinh_3.2_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Mô hình hóa chi tiết phân hệ trải nghiệm thực địa của du khách: UC-01 Khám phá bản đồ di tích; UC-02 Nhận thuyết minh GPS tự động (ngoài trời); UC-03 Quét mã QR hiện vật (trong nhà); UC-04 Điều khiển phát âm thanh đa ngữ; UC-05 Chuyển đổi ngôn ngữ thuyết minh. Thể hiện mối quan hệ kích hoạt kép giữa GPS và QR cùng quan hệ <<include>> tới trình phát âm thanh.

#### 12. Hinh 3.3 Chuong 3: Sơ đồ Ca sử dụng Phân hệ Người dùng, Giỏ hàng & Thanh toán (User Order Subsystem)
- **Vị trí báo cáo**: Mục 3.4.3 – Sơ đồ Use Case Phân hệ Người dùng, Giỏ hàng & Thanh toán
- **Tệp hình ảnh**: [`img/Hinh_3.3_Chuong_3.png`](./Hinh_3.3_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.3_Chuong_3.txt`](./Hinh_3.3_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Mô hình hóa các ca sử dụng phục vụ tài khoản và giao dịch tài chính số: UC-06 Đăng ký & Đăng nhập; UC-07 Nâng cấp gói Heritage Premium 500k/năm qua cổng VNPAY; UC-08 Thanh toán chuyển khoản tự động qua mã VietQR; UC-09 Đặt mua quà lưu niệm di sản địa phương. Cả UC-07 và UC-09 đều <<include>> quy trình xử lý thanh toán trực tuyến.

#### 13. Hinh 3.4 Chuong 3: Sơ đồ Ca sử dụng Phân hệ Quản trị Nội dung Di sản & CMS (Admin Subsystem)
- **Vị trí báo cáo**: Mục 3.4.4 – Sơ đồ Use Case Phân hệ Quản trị Nội dung Di sản & CMS
- **Tệp hình ảnh**: [`img/Hinh_3.4_Chuong_3.png`](./Hinh_3.4_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.4_Chuong_3.txt`](./Hinh_3.4_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Mô hình hóa các chức năng của cán bộ quản lý di tích và biên tập viên: UC-10 Quản trị điểm di tích POI & Geofence; UC-11 Kích hoạt Pipeline Edge-TTS dịch tự động và sinh âm thanh MP3; UC-12 Quản trị người dùng & Phân quyền RBAC; UC-13 Theo dõi Dashboard thống kê lượt nghe và doanh thu theo thời gian thực.

#### 14. Hinh 3.5 Chuong 3: Sơ đồ Hoạt động Nghiệp vụ Thuyết minh Tự động theo Vị trí GPS (Activity Diagram)
- **Vị trí báo cáo**: Mục 3.6.1 – Sơ đồ Hoạt động Thuyết minh GPS Tự động
- **Tệp hình ảnh**: [`img/Hinh_3.5_Chuong_3.png`](./Hinh_3.5_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.5_Chuong_3.txt`](./Hinh_3.5_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Activity Diagram phân làn 3 Swimlanes làm rõ trách nhiệm giữa người dùng, client và dịch vụ hệ thống. Thể hiện đầy đủ Initial Node, Action nodes, Decision nodes (d <= R, POI đã phát chưa, mạng có khả dụng không), Merge nodes, Fork/Join đồng bộ phụ đề với audio, và cơ chế Fallback Web Speech API khi mất mạng.

#### 15. Hinh 3.6 Chuong 3: Sơ đồ Hoạt động Nghiệp vụ Nâng cấp Gói Premium và Thanh toán VNPAY (Activity Diagram)
- **Vị trí báo cáo**: Mục 3.6.2 – Sơ đồ Hoạt động Nâng cấp Premium và Thanh toán VNPAY
- **Tệp hình ảnh**: [`img/Hinh_3.6_Chuong_3.png`](./Hinh_3.6_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.6_Chuong_3.txt`](./Hinh_3.6_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Activity Diagram phân làn 4 Swimlanes thể hiện toàn bộ quy trình giao dịch thanh toán: Người dùng chọn gói -> Client gửi request -> Backend tạo đơn PENDING và ký số HMAC-SHA512 -> VNPAY hiển thị giao diện nhập thẻ NCBS -> Người dùng xác nhận OTP -> VNPAY gửi IPN Webhook về Backend -> Backend kiểm tra chữ ký số, cập nhật trạng thái PAID, nâng quyền tài khoản và mở khóa ngôn ngữ quốc tế.

#### 16. Hinh 3.7 Chuong 3: Sơ đồ Luồng Nghiệp vụ Vận hành Tổng thể Hệ thống (End-to-End Operational Workflow)
- **Vị trí báo cáo**: Mục 3.7.1 – Luồng Nghiệp vụ Vận hành Toàn diện Hệ thống
- **Tệp hình ảnh**: [`img/Hinh_3.7_Chuong_3.png`](./Hinh_3.7_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.7_Chuong_3.txt`](./Hinh_3.7_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Sơ đồ dòng chảy nghiệp vụ vận hành toàn diện kết nối 3 luồng hoạt động chính của hệ sinh thái Echora: (1) Luồng Tham quan Du khách Ngoài thực địa (Bản đồ số, GPS Geofence, Quét mã QR, Đổi ngôn ngữ); (2) Luồng Thương mại & Giao dịch Số (Nâng cấp Premium qua VNPAY/VietQR, Giỏ hàng lưu niệm); (3) Luồng Quản trị Di sản & Phân tích (CMS nhập liệu di tích, Pipeline RabbitMQ TTS, Dashboard thống kê).

#### 17. Hinh 3.8 Chuong 3: Sơ đồ Tuần tự Luồng Xác thực và Luân chuyển Refresh Token (Sequence Diagram)
- **Vị trí báo cáo**: Mục 3.7.2 – Sơ đồ Tuần tự Xác thực JWT và Silent Token Refresh
- **Tệp hình ảnh**: [`img/Hinh_3.8_Chuong_3.png`](./Hinh_3.8_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.8_Chuong_3.txt`](./Hinh_3.8_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Sequence Diagram diễn giải luồng xác thực bảo mật hiện đại: Đăng nhập thành công cấp Access Token (hạn 15 phút, lưu trong RAM) và Refresh Token (hạn 7 ngày, lưu trong Cookie HttpOnly có cờ Secure và SameSite=Strict). Khi Access Token hết hạn, Axios Interceptor tự động gửi yêu cầu '/auth/refresh' ngầm để nhận Access Token mới mà không làm gián đoạn trải nghiệm nghe thuyết minh của du khách.

#### 18. Hinh 3.9 Chuong 3: Sơ đồ Tuần tự Pipeline Tự động Dịch thuật và Tổng hợp Giọng nói AI Edge-TTS
- **Vị trí báo cáo**: Mục 3.7.3 – Sơ đồ Tuần tự Pipeline Dịch thuật và Edge-TTS
- **Tệp hình ảnh**: [`img/Hinh_3.9_Chuong_3.png`](./Hinh_3.9_Chuong_3.png) | **Tệp chú thích**: [`img/Hinh_3.9_Chuong_3.txt`](./Hinh_3.9_Chuong_3.txt)
- **Ý nghĩa nghiệp vụ**: Sequence Diagram mô tả sự phối hợp bất đồng bộ giữa các thành phần phân tán: Admin gửi yêu cầu biên tập POI -> ContentService lưu DB và đẩy thông điệp vào RabbitMQ -> Translation Worker tiêu thụ thông điệp, dịch đa ngữ -> TTS Worker kết nối Microsoft Edge-TTS engine sinh âm thanh MP3 truyền cảm -> Lưu tệp tĩnh phục vụ phân đoạn Byte-Range HTTP 206 -> Báo cáo hoàn tất tới Admin Dashboard.


### CHƯƠNG 4: THIẾT KẾ HỆ THỐNG

#### 19. Hinh 4.1 Chuong 4: Sơ đồ Thành phần Phần mềm Hệ thống Echora (Component Diagram UML 2.5)
- **Vị trí báo cáo**: Mục 4.3 – Thiết kế Kiến trúc Thành phần Phần mềm (Component Diagram)
- **Tệp hình ảnh**: [`img/Hinh_4.1_Chuong_4.png`](./Hinh_4.1_Chuong_4.png) | **Tệp chú thích**: [`img/Hinh_4.1_Chuong_4.txt`](./Hinh_4.1_Chuong_4.txt)
- **Ý nghĩa nghiệp vụ**: Mô hình hóa 12 Component phần mềm độc lập tuân thủ nguyên tắc Single Responsibility (SRP) và High Cohesion, Low Coupling: NearbyMapModule, AudioPlayerModule, QrScannerModule, PremiumPayModule, SouvenirCartModule, AdminCmsConsole, ApiGatewayComponent, AuthService, ContentService, OrderPaymentService, TranslationTtsPipeline, AnalyticsService. Thể hiện đầy đủ các Port và Interface (IAuthService, IContentService, IOrderService, ITranslationPipeline).

#### 20. Hinh 4.2 Chuong 4: Sơ đồ Triển khai Vật lý và Môi trường Thực thi Hệ thống Echora (Deployment Diagram UML 2.5)
- **Vị trí báo cáo**: Mục 4.4 – Thiết kế Kiến trúc Triển khai Vật lý (Deployment Diagram)
- **Tệp hình ảnh**: [`img/Hinh_4.2_Chuong_4.png`](./Hinh_4.2_Chuong_4.png) | **Tệp chú thích**: [`img/Hinh_4.2_Chuong_4.txt`](./Hinh_4.2_Chuong_4.txt)
- **Ý nghĩa nghiệp vụ**: Mô hình hóa các Node triển khai vật lý và môi trường thực thi (Execution Environment): Node Thiết bị di động của du khách (chạy trình duyệt Safari/Chrome hỗ trợ Service Worker); Node Reverse Proxy Nginx cân bằng tải và kết thúc TLS; Cụm máy chủ Docker chứa các Container Spring Boot và Node.js; Node Cơ sở dữ liệu quan hệ SQL Server / PostgreSQL; Node Hàng đợi thông điệp RabbitMQ Server; và các liên kết mạng bảo mật HTTPS/WSS/AMQP/TDS.

#### 21. Hinh 4.3 Chuong 4: Sơ đồ Thực thể Mối quan hệ Cơ sở Dữ liệu Chuẩn Crow's Foot (ERD)
- **Vị trí báo cáo**: Mục 4.5 – Thiết kế Cơ sở Dữ liệu Quan hệ Chuẩn hóa 3NF (ERD)
- **Tệp hình ảnh**: [`img/Hinh_4.3_Chuong_4.png`](./Hinh_4.3_Chuong_4.png) | **Tệp chú thích**: [`img/Hinh_4.3_Chuong_4.txt`](./Hinh_4.3_Chuong_4.txt)
- **Ý nghĩa nghiệp vụ**: Mô hình dữ liệu quan hệ đạt chuẩn chuẩn hóa bậc 3 (Third Normal Form - 3NF): Loại bỏ hoàn toàn dị thường thêm, xóa, sửa (Insert, Delete, Update Anomalies); Thể hiện đầy đủ 7 thực thể dữ liệu cốt lõi, thuộc tính, kiểu dữ liệu, ràng buộc khóa chính (PK), khóa ngoại (FK) và bản số quan hệ Crow's Foot (Một - Một, Một - Nhiều, Một - Tùy chọn).
