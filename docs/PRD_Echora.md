# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## DỰ ÁN: ECHORA — NỀN TẢNG HƯỚNG DẪN VIÊN DU LỊCH ĐA NGÔN NGỮ TỰ ĐỘNG

---

### 1. Tổng quan Sản phẩm (Product Overview)
* **Tên sản phẩm:** Echora
* **Sứ mệnh:** Cung cấp trải nghiệm hướng dẫn viên du lịch số thông minh cho du khách tham quan các điểm di tích lịch sử và văn hóa TP.HCM thông qua công nghệ tự động hóa định vị GPS, quét mã QR và thuyết minh âm thanh đa ngôn ngữ AI.
* **Mục tiêu cốt lõi:**
  * Giúp du khách tự do khám phá di sản mà không cần thuê hướng dẫn viên truyền thống.
  * Tự động phát thuyết minh đa ngữ khi bước vào bán kính di tích.
  * Hỗ trợ quảng bá sản phẩm lưu niệm địa phương và thanh toán trực tuyến thuận tiện.

---

### 2. Đối tượng Người dùng (User Personas)
1. **Khách vãng lai (Guest Tourist):**
   * Du khách tự do, không bắt buộc tạo tài khoản.
   * Nhu cầu: Mở web xem bản đồ, quét QR nghe thuyết minh ngay lập tức bằng tiếng mẹ đẻ (`vi`, `en`, `ja`, `ko`).
2. **Người dùng đăng ký (Registered Member):**
   * Du khách thường xuyên hoặc muốn trải nghiệm đầy đủ.
   * Nhu cầu: Lưu điểm yêu thích (Bookmark), xem lại lịch sử tham quan, đặt mua quà lưu niệm qua VietQR.
3. **Quản trị viên Di sản (Heritage Admin):**
   * Cán bộ quản lý khu di tích/Sở Du lịch.
   * Nhu cầu: Thêm/sửa điểm tham quan (POI), quản lý lộ trình tour, bài viết tin tức và xem báo cáo lưu lượng du khách.

---

### 3. Ma trận Yêu cầu Chức năng (Functional Requirements - Map với 13 Use Cases)

#### Phân hệ 1: Trải nghiệm Du khách & Cá nhân hóa (Tourist Experience)

| Mã FR / UC | Tên tính năng | Mô tả chi tiết & Quy tắc nghiệp vụ | Tác nhân (Actor) |
| :--- | :--- | :--- | :--- |
| **FR-01 (UC01)** | Khám phá bản đồ di tích | Hiển thị bản đồ Leaflet + OpenStreetMap với các điểm POI và bán kính Geofence trực quan. | Khách vãng lai |
| **FR-02 (UC02)** | Nghe thuyết minh đa ngữ | Trình phát audio hỗ trợ 4 ngôn ngữ (`vi`, `en`, `ja`, `ko`), Web Speech Audio và file âm thanh AI. | Khách vãng lai |
| **FR-03 (UC03)** | Thuyết minh GPS tự động | Tính khoảng cách Haversine liên tục; tự động kích hoạt audio khi khách vào bán kính 40–55m; cooldown 10 phút chống phát lặp. | Khách vãng lai & GPS thiết bị |
| **FR-04 (UC04)** | Quét mã QR tại di tích | Quét camera hoặc nhập mã QR token để giải mã POI; dùng làm phương án mở rộng (`extend`) khi GPS yếu. | Khách vãng lai |
| **FR-05 (UC05)** | Đăng ký & Đăng nhập | Đăng nhập bằng Google OAuth2 hoặc Email/Password mã hóa BCrypt; JWT Access Token + HttpOnly Cookie Refresh Token. | Khách vãng lai & Google Identity |
| **FR-06 (UC06)** | Quản lý hồ sơ & Lịch sử | Cập nhật thông tin cá nhân, xem danh sách đơn hàng và lịch sử các điểm di tích đã check-in. | Người dùng đăng ký |
| **FR-07 (UC07)** | Lưu điểm yêu thích (Bookmark) | Lưu trữ danh sách các điểm di tích yêu thích vào bộ nhớ cá nhân để xem lại nhanh. | Người dùng đăng ký |
| **FR-08 (UC08)** | Đặt mua quà lưu niệm | Chọn sản phẩm ẩm thực/quà lưu niệm, đặt hàng và thanh toán qua mã VietQR động; kiểm tra trạng thái thanh toán. | Người dùng đăng ký & Cổng VietQR |

#### Phân hệ 2: Bảo tồn & Quản trị Nội dung Di sản (Heritage CMS)

| Mã FR / UC | Tên tính năng | Mô tả chi tiết & Quy tắc nghiệp vụ | Tác nhân (Actor) |
| :--- | :--- | :--- | :--- |
| **FR-09 (UC09)** | Quản lý Điểm tham quan (POI) | CRUD điểm di tích, tọa độ GPS, bán kính kích hoạt; tự động kích hoạt tiến trình dịch và sinh âm thanh AI đa ngữ. | Quản trị viên & Edge-TTS Service |
| **FR-10 (UC10)** | Quản lý Tuyến lộ trình | Tạo và sắp xếp thứ tự các điểm dừng (stops) cho các tour di sản theo chuyên đề. | Quản trị viên |
| **FR-11 (UC11)** | Quản lý Sản phẩm lưu niệm | Quản lý danh mục quà tặng, món ăn đặc sản, đơn giá, tồn kho và hình ảnh sản phẩm. | Quản trị viên |
| **FR-12 (UC12)** | Quản lý Tin tức văn hóa | Đăng tải bài viết giới thiệu lịch sử, tin tức sự kiện du lịch và văn hóa ẩm thực Sài Gòn. | Quản trị viên |
| **FR-13 (UC13)** | Báo cáo thống kê tương tác | Dashboard tổng quan: số lượt quét QR, lượt nghe audio, phân loại theo ngôn ngữ và nguồn (QR/GPS/Manual). | Quản trị viên |

---

### 4. Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)

1. **Hiệu năng & Độ trễ (Performance):**
   * Thời gian phát âm thanh thuyết minh $\le 1.5$ giây sau khi bước vào Geofence hoặc quét QR.
   * Tính toán khoảng cách tọa độ GPS thực thi ở Client/Edge để giảm tải cho Server.
2. **Bảo mật & Quyền riêng tư (Security & Privacy):**
   * Định danh ẩn danh du khách qua `sessionId` mà không ép thu thập danh tính (chuẩn GDPR).
   * Cơ chế xoay vòng Refresh Token (Token Rotation) và phát hiện tái sử dụng trái phép (`REUSE_DETECTED` $\rightarrow$ `LOGOUT_ALL`).
   * Chống tấn công brute-force với Rate Limiting (tối đa 5 lần thử đăng nhập sai).
3. **Khả năng mở rộng (Scalability):**
   * Kiến trúc Microservices phân tán với Spring Cloud Gateway, RabbitMQ Broker tách biệt luồng xử lý AI/TTS nặng nhọc khỏi luồng tra cứu API của du khách.
4. **Độ tương thích (Compatibility):**
   * Hoạt động mượt mà trên trình duyệt di động (iOS Safari, Android Chrome) không cần cài app native qua cửa hàng ứng dụng.

---

### 5. Tích hợp Hệ thống ngoài (External Services)
* **Device Geolocation (GPS):** Trích xuất tọa độ kinh độ/vĩ độ liên tục từ API `navigator.geolocation`.
* **Google Identity (OAuth2):** Xác thực người dùng nhanh chóng và an toàn.
* **Cổng thanh toán VietQR:** Tạo mã QR thanh toán động kèm mã đơn hàng duy nhất theo tiêu chuẩn NAPAS 247.
* **Động cơ Dịch thuật & Edge-TTS:** Xử lý dịch thuật ngôn ngữ tự động và tổng hợp giọng nói AI tự nhiên cho các ngôn ngữ `vi`, `en`, `ja`, `ko`.

---

### 6. Chỉ số Đo lường Hiệu quả (Success Metrics / KPIs)
* **Tổng lượt quét QR & Geofence triggers:** Đo lường mức độ tương tác thực tế của du khách tại điểm di tích.
* **Tỷ lệ nghe hoàn tất audio (Audio Completion Rate):** Đo lường mức độ hấp dẫn của nội dung thuyết minh.
* **Tỷ lệ chuyển đổi đơn hàng lưu niệm (Conversion Rate):** Đo lường hiệu quả quảng bá đặc sản địa phương.
