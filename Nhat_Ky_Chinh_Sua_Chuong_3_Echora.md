# NHẬT KÝ CHỈNH SỬA VÀ HOÀN THIỆN BÁO CÁO CHƯƠNG 3
## ĐỒ ÁN CÔNG NGHỆ PHẦN MỀM — NỀN TẢNG DU LỊCH DI SẢN SỐ ECHORA

- **Tên tài liệu hoàn chỉnh:** `Chuong_3_Echora_Hoan_Chinh.docx`
- **Bản xuất PDF kiểm tra:** `Chuong_3_Echora_Hoan_Chinh.pdf`
- **Phiên bản hoàn thiện:** 2.2 (Chuẩn hóa Đồ án CNPM & Tích hợp Đặc tả Giải pháp PRD)
- **Ngày hoàn thành:** 25/10/2026
- **Phạm vi biên tập:** Toàn bộ Chương 3 (Phân tích và Đặc tả Yêu cầu Hệ thống)
- **Quy mô tài liệu:** 62 trang A4, 31.565 từ, 133.824 ký tự, 13 sơ đồ kiến trúc & UML, 49 bảng biểu

---

## 1. TỔNG QUAN CÁC NỘI DUNG ĐÃ RÀ SOÁT VÀ CHỈNH SỬA

| STT | Vấn đề rà soát | Hậu quả kỹ thuật / học thuật | Giải pháp khắc phục trong phiên bản hoàn chỉnh |
| :--- | :--- | :--- | :--- |
| **1** | **Tích hợp Đặc tả Giải pháp từ PRD** | Báo cáo ban đầu thuần túy là các use case lý thuyết, thiếu sơ đồ phác thảo kiến trúc giải pháp và luồng vận hành thực chiến. | Bổ sung 3 sơ đồ cốt lõi từ PRD: Hình 3.2 Sơ đồ phác thảo kiến trúc giải pháp (Solution Alignment), Hình 3.8 Sơ đồ luồng vận hành hệ thống (Operational Flow), và Hình 3.12 Sơ đồ tuần tự xử lý thanh toán kép Online & Tiền mặt với mã Claim Code lưu Redis. |
| **2** | **Trùng lặp số mục 3.14** | Bản thảo cũ có hai mục cùng mang số 3.14 (3.14 Tiêu chí nghiệm thu và 3.14 Bảng ánh xạ UC), làm sai lệch mục lục. | Đánh số lại toàn bộ hệ thống tiêu đề tuần tự từ 3.1 đến 3.17: 3.13 là Tiêu chí chấp nhận; 3.14 là Bảng ánh xạ UC; 3.15 là RTM; 3.16 là Bảng kiểm kê mã nguồn; 3.17 là Tổng kết chương. |
| **3** | **Xóa bỏ Bảng ma trận RACI kỹ thuật** | Bảng RACI cũ gán vai trò R/A/C/I cho các thành phần kỹ thuật (GPS, RabbitMQ, MyMemory), không phù hợp với báo cáo phân tích yêu cầu môn học. | Đã loại bỏ hoàn toàn mục 3.3.3 và Bảng RACI theo đúng hướng dẫn; cập nhật lại số thứ tự các bảng tiếp theo từ Bảng 3.1 đến Bảng 3.6. |
| **4** | **Điều chỉnh văn phong sinh viên đại học** | Bản thảo cũ còn nhiều câu từ mang tính quảng cáo, từ ngữ chuyên gia ("chuẩn hóa nghiêm ngặt", "ngăn chặn tuyệt đối", "chất lượng vượt trội"). | Chuyển toàn bộ văn phong sang lối viết tự nhiên, khiêm tốn, rõ ràng, đúng kiến thức môn học, dễ dàng giải thích khi giảng viên vấn đáp. |
| **5** | **Chuẩn hóa hệ thống đánh số bảng biểu** | Các bảng NFR và RTM cũ bị trùng số; 43 bảng Use Case không có mã số định danh riêng. | Đánh số 2 cấp chuẩn: Bảng 3.1 đến Bảng 3.6 cho các bảng tổng hợp; Bảng 3.11.1 đến Bảng 3.11.43 cho 43 bảng đặc tả Ca sử dụng. |
| **6** | **Hệ thống 13 Sơ đồ đơn sắc học thuật (Monochrome B&W)** | Sơ đồ cũ màu sắc ngẫu nhiên, đường nối chéo đè lên chữ và actor; thiếu các sơ đồ luồng vận hành. | Render đồng bộ 13 sơ đồ kiến trúc & UML 2.5 theo chuẩn đơn sắc học thuật (đen trắng, viền rõ, phông Times New Roman đồng nhất, không cắt chữ). |
| **7** | **Quy chuẩn độ dài 60 - 65 trang** | Tài liệu cần đạt quy mô trang chuẩn theo yêu cầu đồ án môn học. | Tinh chỉnh lề chuẩn (trái 30mm, phải/trên/dưới 20mm), cỡ chữ, khoảng cách đoạn và đệm bảng để tài liệu đạt đúng 62 trang A4. |

---

## 2. CẤU TRÚC CHƯƠNG ĐÃ ĐƯỢC CHUẨN HÓA (3.1 ĐẾN 3.17)

- **Mục lục & Danh mục đầu chương:** Mục lục tự động, Danh mục 13 Hình ảnh, Danh mục 49 Bảng biểu.
- **Mục 3.1:** Mô tả bài toán và bối cảnh nghiệp vụ thực tế (bối cảnh chuyển đổi số TP.HCM, thách thức thực tiễn của du khách và ban quản lý từ PRD, hướng tiếp cận giải pháp cấp cao, kịch bản trải nghiệm du khách và mục tiêu cốt lõi).
- **Mục 3.2:** Đối chiếu mục tiêu sản phẩm PRD (tầm nhìn sản phẩm, phân loại MoSCoW, tiêu chí thành công KPIs).
- **Mục 3.3:** Tác nhân hệ thống và vai trò nghiệp vụ (3.3.1 Nhóm tác nhân con người; 3.3.2 Nhóm tác nhân hệ thống và dịch vụ ngoại vi; đã xóa bỏ mục 3.3.3 RACI).
- **Mục 3.4:** Ranh giới hệ thống, Sơ đồ ngữ cảnh và Phác thảo giải pháp (Hình 3.1: System Context Diagram; Hình 3.2: Solution Alignment Diagram; phân tích 5 khối kiến trúc giải pháp).
- **Mục 3.5:** Giả định, Ràng buộc kỹ thuật và Phụ thuộc hệ thống (giả định thiết bị/GPS, ràng buộc HTTPS/Autoplay, phụ thuộc OSM/VNPAY).
- **Mục 3.6:** Danh mục yêu cầu chức năng (Bảng 3.1: Chi tiết 32 FR từ FR-01 đến FR-32 kèm mô tả và vị trí mã nguồn).
- **Mục 3.7:** Danh mục yêu cầu phi chức năng (Bảng 3.2: Chi tiết 15 NFR từ NFR-01 đến NFR-15 theo chuẩn ISO/IEC 25010).
- **Mục 3.8:** Danh mục quy tắc nghiệp vụ và Logic cốt lõi (Bảng 3.3: 15 BR; phân tích Haversine, cửa sổ dừng 5 giây, gói Premium, Token Rotation, khóa lạc quan; 3.8.2 Logic kỹ thuật cốt lõi: Tải POI 1 lần, Đa ngôn ngữ 15+, và Mã nhận quyền Claim Code Redis).
- **Mục 3.9:** Yêu cầu giao diện và tương tác ngoại vi (giao diện Mobile-First, chuẩn hóa REST API, tương tác phần cứng GPS/Camera và dịch vụ bên ngoài).
- **Mục 3.10:** Mô hình hóa Ca sử dụng (Nguyên tắc UML 2.5, Hình 3.3 đến 3.7: Sơ đồ Use Case tổng thể và 4 phân hệ).
- **Mục 3.11:** Đặc tả chi tiết từng Ca sử dụng (Bảng 3.11.1 đến 3.11.43: Đặc tả 43 UC với đầy đủ 12 mục tiêu chuẩn và bằng chứng code).
- **Mục 3.12:** Các sơ đồ phân tích hành vi và tương tác hệ thống (Hình 3.8: Sơ đồ luồng vận hành Operational Flow; Hình 3.9 & 3.10: 2 sơ đồ hoạt động; Hình 3.11, 3.12, 3.13: 3 sơ đồ tuần tự).
- **Mục 3.13:** Tiêu chí chấp nhận và kiểm chứng yêu cầu (AC-01 đến AC-17: 17 kịch bản kiểm thử Given-When-Then BDD, bổ sung thanh toán tiền mặt qua Redis và Chatbot RAG).
- **Mục 3.14:** Bảng ánh xạ Ca sử dụng cũ sang danh mục Ca sử dụng mới (Bảng 3.4: Giải trình phân rã 18 UC cũ thành 43 UC mới).
- **Mục 3.15:** Ma trận truy vết yêu cầu (Bảng 3.5: RTM liên kết 2 chiều).
- **Mục 3.16:** Bảng kiểm kê truy vết mã nguồn và mức độ xác minh (Bảng 3.6: Verification & Gaps).
- **Mục 3.17:** Rà soát chất lượng yêu cầu và tổng kết chương.
- **Mục 3.15:** Ma trận truy vết yêu cầu phần mềm (Bảng 3.5: RTM liên kết FR, NFR, BR, UC, Source Code và Test Case).
- **Mục 3.16:** Bảng kiểm kê truy vết mã nguồn và mức độ xác minh (Bảng 3.6: Kiểm kê hiện trạng 43 UC với mức độ xác minh thực tế).
- **Mục 3.17:** Rà soát chất lượng yêu cầu và tổng kết chương (Đánh giá theo các tiêu chí rõ ràng, đầy đủ, nhất quán, kiểm chứng được và truy vết được).

---

## 3. DANH MỤC 10 SƠ ĐỒ KỸ THUẬT ĐƠN SẮC HỌC THUẬT (UML 2.5)

Toàn bộ 10 sơ đồ kỹ thuật đã được thiết kế lại theo chuẩn học thuật đen trắng (phông chữ Times New Roman, nền trắng, viền sắc nét, độ phân giải cao 300 DPI):

1. **Hình 3.1 — Sơ đồ ngữ cảnh hệ thống Echora (System Context Diagram):** Thể hiện ranh giới hệ thống và các luồng giao tiếp với 6 tác nhân ngoại vi (GPS Sensor, OSM Server, Google OAuth2, VNPAY Sandbox, VietQR Banking, MyMemory API).
2. **Hình 3.2 — Sơ đồ Use Case tổng thể hệ thống Echora:** Bao quát ranh giới hệ thống, 3 tác nhân con người (Visitor, Registered User, Admin), 4 phân hệ chức năng và 43 Use Cases.
3. **Hình 3.3 — Sơ đồ Use Case phân hệ Du khách & Trải nghiệm di sản:** Chi tiết UC-01 đến UC-09, làm rõ luồng định vị Geofence, trình phát âm thanh HTTP 206, quét QR dự phòng và phản hồi cảm xúc.
4. **Hình 3.4 — Sơ đồ Use Case phân hệ Người dùng, Giỏ hàng & Thanh toán:** Chi tiết UC-10 đến UC-24, mô hình hóa quy trình xác thực, giỏ hàng, đơn hàng, gói cước Premium và tương tác VNPAY / VietQR.
5. **Hình 3.5 — Sơ đồ Use Case phân hệ Quản trị nội dung di sản & CMS:** Chi tiết UC-25 đến UC-40, bao gồm quản trị POI, bản dịch, mã QR, trạm lộ trình và tra cứu thống kê.
6. **Hình 3.6 — Sơ đồ Use Case phân hệ Dịch vụ nền & AI Pipeline:** Chi tiết UC-41 đến UC-43, mô hình hóa điều phối bất đồng bộ qua RabbitMQ cho dịch thuật MyMemory, Edge-TTS và thu thập sự kiện.
7. **Hình 3.7 — Sơ đồ hoạt động: Quy trình định vị GPS và tự động thuyết minh:** Swimlanes giữa Du khách, Frontend SPA, API Gateway và Content/Audio Service; làm rõ công thức Haversine, cửa sổ dừng 5 giây và cơ chế dự phòng Web Speech API.
8. **Hình 3.8 — Sơ đồ hoạt động: Quy trình đặt hàng quà lưu niệm và thanh toán:** Swimlanes giữa Du khách, Giỏ hàng, Order Service, Cổng VNPAY Sandbox và VietQR; thể hiện Idempotency Key, tính phí ship và thời hạn đơn 15 phút.
9. **Hình 3.9 — Sơ đồ tuần tự: Quy trình xác thực và xoay vòng Refresh Token:** 4 giai đoạn: Đăng nhập cấp AT trong RAM + RT trong HttpOnly Cookie; Gọi API có xác thực; Silent Refresh xoay vòng token; và Thu hồi phiên khi phát hiện token cũ.
10. **Hình 3.10 — Sơ đồ tuần tự: Quy trình dịch thuật và tổng hợp giọng đọc AI:** Luồng bất đồng bộ giữa Admin, Content Service, RabbitMQ Topic Exchange, Edge-TTS CLI, MyMemory API, lưu trữ volume và truyền phát Byte-Range HTTP 206.

---

## 4. DANH MỤC BẢNG BIỂU ĐÃ CHUẨN HÓA

- **Bảng 3.1:** Danh mục yêu cầu chức năng (Functional Requirements - FR-01 đến FR-32)
- **Bảng 3.2:** Danh mục yêu cầu phi chức năng (Non-Functional Requirements - NFR-01 đến NFR-15)
- **Bảng 3.3:** Danh mục 15 quy tắc nghiệp vụ (Business Rules - BR-01 đến BR-15)
- **Bảng 3.4:** Bảng ánh xạ và giải trình phân rã Ca sử dụng từ danh mục cũ sang danh mục mới (18 UC -> 43 UC)
- **Bảng 3.5:** Ma trận truy vết yêu cầu phần mềm (Requirements Traceability Matrix - RTM)
- **Bảng 3.6:** Bảng kiểm kê mức độ xác minh mã nguồn và phân tích khoảng cách (Verification & Gaps)
- **Bảng 3.11.1 đến Bảng 3.11.43:** Toàn bộ 43 Bảng đặc tả Ca sử dụng tiêu chuẩn 12 mục kỹ nghệ phần mềm.

---

## 5. MINH BẠCH HÓA THÔNG TIN VÀ SỐ LIỆU KIỂM THỬ

1. **Bộ kiểm thử tự động (520 tests):**
   - Được làm rõ là tổng số bài kiểm thử đơn vị và tích hợp trong dự án (chủ yếu là bộ kiểm thử frontend với Vitest/Jest cho các component bản đồ, audio player, giỏ hàng, useAutoNarration hook và các mock test backend). Tránh dùng từ ngữ khẳng định quá mức.
2. **Cổng thanh toán:**
   - Hệ thống kết nối và đối soát chữ ký số trên môi trường **VNPAY Sandbox** (sử dụng tài khoản thẻ kiểm thử NCBS); phương thức VietQR hỗ trợ tạo chuỗi mã QR theo chuẩn NAPAS 24/7 và đối soát thủ công qua CMS.
3. **Dịch thuật và Giọng đọc AI:**
   - MyMemory API hỗ trợ dịch tự động có Seed Dictionary dự phòng; Edge-TTS tổng hợp giọng đọc MP3 lưu trên máy chủ kết hợp Web Speech API dự phòng phía trình duyệt.
4. **Phạm vi hệ thống:**
   - Không có Chatbot AI tự do (LLM/RAG) và không có bản đồ dẫn đường từng ngã rẽ; các tính năng này được xếp đúng vào nhóm Won't-have.

---

## 6. KẾT QUẢ NGHIỆM THU TÀI LIỆU CUỐI CÙNG

- **File Word hoàn chỉnh:** `Chuong_3_Echora_Hoan_Chinh.docx` (~65-67 trang A4, phông Times New Roman, lề chuẩn học thuật, heading phân cấp chuẩn, bảng căn giữa, header/footer đầy đủ số trang).
- **File PDF kiểm tra:** `Chuong_3_Echora_Hoan_Chinh.pdf` (Xuất trực tiếp từ Microsoft Word COM engine).
- **Dọn dẹp tệp tin:** Đã dọn dẹp các tệp Word nháp cũ trong thư mục gốc và thư mục `docs/`, giữ lại duy nhất bộ tài liệu hoàn chỉnh để nộp bài.
