# ECHORA — NỀN TẢNG HƯỚNG DẪN VIÊN DU LỊCH ĐA NGÔN NGỮ TỰ ĐỘNG
## Multilingual Automated Tourist Audio Guide & Local Experience Platform

[![Vite Build](https://img.shields.io/badge/Vite-5.4.21-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React 18](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![SQL Server 2022](https://img.shields.io/badge/SQL_Server-2022-CC292B?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-62_Tests_Passed-green?logo=vitest&logoColor=white)](https://vitest.dev/)

---

## 1. Giới thiệu dự án (Overview)

**Echora** là giải pháp nền tảng du lịch số thông minh hỗ trợ du khách khám phá di sản và văn hóa đô thị Thành phố Hồ Chí Minh. Hệ thống kết hợp công nghệ định vị vệ tinh GPS, bản đồ tương tác mã nguồn mở **Leaflet + OpenStreetMap**, mã QR tại điểm dừng tham quan, cùng cơ chế **thuyết minh âm thanh tự động đa ngôn ngữ** (`vi`, `en`, `ja`, `ko`).

Bên cạnh trải nghiệm audio tour, hệ thống tích hợp phân hệ **Văn hóa ẩm thực & Quà lưu niệm địa phương**, cho phép du khách khám phá các món ăn đặc trưng Sài Gòn, lưu giỏ hàng và trải nghiệm quy trình đặt hàng, thanh toán trực tuyến thuận tiện.

### Tính năng cốt lõi

1. **Bản đồ Di sản Tương tác (Leaflet + OpenStreetMap)**:
   - Hiển thị trực quan các điểm di sản trung tâm (Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện Trung tâm, Chợ Bến Thành, Bảo tàng Chứng tích Chiến tranh).
   - Tự động hiển thị bán kính kích hoạt Geofence và vị trí GPS thực tế của du khách.
2. **Thuyết minh Tự động & Đồng bộ Đa ngữ (Auto Narration & Multilingual Sync)**:
   - Tự động kích hoạt bài thuyết minh khi du khách bước vào vùng ảnh hưởng (bán kính 40–55m).
   - Chống phát lặp âm thanh trong vòng 10 phút, hàng đợi phát tuần tự không chồng chéo.
   - Hỗ trợ 4 ngôn ngữ (`vi`, `en`, `ja`, `ko`) với cơ chế bù trừ từ điển thông minh khi dịch tự động gặp sự cố.
3. **Chế độ Thử nghiệm Tọa độ (GPS Simulation Mode)**:
   - Cho phép chọn vị trí mẫu giả lập (Sát di sản ≈10m, giữa tour, xa tour) để kiểm thử luồng tự động thuyết minh trực tiếp trên trình duyệt mà không cần di chuyển ngoài thực địa.
4. **Khám phá Ẩm thực & Quà lưu niệm**:
   - Danh mục món ăn, thức uống đặc trưng; trang chi tiết sản phẩm; giỏ hàng lưu trữ cục bộ và quy trình đặt hàng an toàn.
5. **Bảo mật Xác thực Kép (JWT & HttpOnly Cookie)**:
   - Phân quyền theo vai trò (`USER`, `ADMIN`); Access Token ngắn hạn lưu trong bộ nhớ và Refresh Token xoay vòng (Rotation) lưu trong HttpOnly Cookie chống tấn công XSS/CSRF.

---

## 2. Kiến trúc hệ thống (Architecture)

Hệ thống được thiết kế theo kiến trúc Microservices phân tán, các dịch vụ nghiệp vụ vận hành độc lập và liên lạc qua REST API cùng Message Broker:

```
                            ┌──────────────────────────────────────────────┐
                            │      Frontend SPA (React 18 + TS + Vite)     │
                            │  Bản đồ Leaflet, Web Speech Audio, Giỏ hàng  │
                            └──────────────────────┬───────────────────────┘
                                                   │ HTTP / REST
                                                   ▼
                            ┌──────────────────────────────────────────────┐
                            │            api-gateway (Spring Cloud)        │
                            │  CORS, JWT Filter, Rate Limiting, Logging    │
                            │           Cổng Host: 18080 (hoặc 8080)       │
                            └───────┬──────────────┬──────────────┬────────┘
                                    │              │              │
       ┌────────────────────────────┼──────────────┼──────────────┼────────────────────────┐
       ▼                            ▼              ▼              ▼                        ▼
┌──────────────────┐  ┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│   auth-service   │  │ content-service  ││ location-service ││translation-tts-  ││ analytics-service│
│   (Port: 8086)   │  │ (Port: 8085)     ││ (Port: 8082)     ││service (Port:8083││ (Port: 8081)     │
│ - JWT / Cookie   │  │ - POI, Lộ trình  ││ - GPS Haversine, ││ - Dịch tự động   ││ - Thu thập sự    │
│ - Xác thực email │  │ - Món ăn/Ẩm thực ││   quét mã QR     ││ - edge-tts audio ││   kiện du lịch   │
└────────┬─────────┘  └────────┬─────────┘└────────┬─────────┘└────────┬─────────┘└────────┬─────────┘
         │                     │                   │                   │                   │
         │                     │  AMQP Topic Exchange                  │                   │
         │                     ├──────────────────────────────────────▶│                   │
         │                     │ (poi.created / poi.updated)           │                   │
         │                     │◀──────────────────────────────────────┤                   │
         │                     │ (audio.ready / audio.failed)          │                   ▼
         │                     └───────────────────────────────────────┼────────▶ RabbitMQ Broker
         ▼                                                             ▼           Port: 5672
   Microsoft SQL Server 2022                                           ▼           Dashboard: 15800
   Host: 1433 (4 CSDL phân lập:
   auth, content, translation, analytics)
```

---

## 3. Cấu trúc thư mục dự án

```text
Nhom3_CNPM/
├── backend/
│   ├── api-gateway/              # Cổng Gateway: kiểm soát an ninh, điều hướng, Rate Limit
│   ├── auth-service/             # Xác thực người dùng, cấp phát JWT và Refresh Token
│   ├── content-service/          # Quản lý điểm tham quan (POI), lộ trình, sản phẩm ẩm thực
│   ├── location-service/         # Xử lý tính toán khoảng cách GPS (Haversine) và mã QR
│   ├── translation-tts-service/  # Xử lý dịch thuật đa ngữ và tổng hợp âm thanh AI
│   └── analytics-service/        # Tiếp nhận sự kiện nghe thuyết minh bất đồng bộ
├── frontend/
│   ├── src/                      # Mã nguồn React SPA (bản đồ, trình phát audio, giỏ hàng)
│   ├── package.json              # Danh mục dependencies Frontend
│   └── vite.config.ts            # Cấu hình đóng gói Vite
├── docker/
│   └── init-databases.sql        # Kịch bản khởi tạo 4 CSDL phân lập trên SQL Server
├── docs/
│   ├── HUONG_DAN_CHAY_DU_AN.docx # Tài liệu hướng dẫn chạy dự án dạng Word
│   └── report/                   # Báo cáo đồ án môn học hoàn chỉnh (Word + PDF)
├── docker-compose.yml            # Khởi chạy toàn bộ hạ tầng CSDL, Broker và Microservices
├── .env.example                  # Mẫu cấu hình biến môi trường
└── README.md                     # Hướng dẫn tổng quan dự án
```

---

## 4. HƯỚNG DẪN CHẠY DỰ ÁN TRÊN MÁY (QUICK START GUIDE)

Phần này hướng dẫn chi tiết cách chạy toàn bộ hệ thống bằng câu lệnh Terminal đơn giản, nhanh gọn.

### 4.1. Điều kiện tiên quyết (Prerequisites)
1. **Git**: Đã cài đặt trên máy ([Tải Git](https://git-scm.com/downloads)).
2. **Docker Desktop**: Đã cài đặt và đang ở trạng thái **Running** ([Tải Docker Desktop](https://www.docker.com/products/docker-desktop/)).
3. **Node.js 18+ & npm**: Cần thiết nếu muốn chạy riêng Frontend chế độ phát triển ([Tải Node.js](https://nodejs.org/)).

---

### 4.2. Bước 1: Kéo mã nguồn mới nhất (Git Clone / Pull)
Mở Terminal (PowerShell trên Windows hoặc Terminal trên macOS/Linux):

```bash
# 1. Tải mã nguồn về máy (nếu chưa clone)
git clone https://github.com/congtinh06/Nhom3_CNPM.git

# 2. Di chuyển vào thư mục dự án
cd Nhom3_CNPM

# 3. Kéo code mới nhất từ nhánh chính
git checkout main
git pull origin main
```

*(Mẹo: Nếu gặp xung đột do có file chỉnh sửa dở dang, chạy: `git stash` $\rightarrow$ `git pull origin main` $\rightarrow$ `git stash pop`)*

---

### 4.3. Bước 2: Thiết lập file cấu hình môi trường (.env)
Dự án sử dụng cơ chế bảo mật thông qua biến môi trường. Sao chép các tệp mẫu sang `.env` trước khi chạy:

* **Trên Windows PowerShell:**
```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

* **Trên Linux / macOS / Git Bash:**
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

> **Lưu ý bảo mật quan trọng:**
> - Mở file `.env` vừa tạo và điền các giá trị bí mật của riêng bạn:
>   - `JWT_SECRET`: Điền chuỗi ngẫu nhiên tối thiểu 32 ký tự (bắt buộc để `auth-service` khởi động).
>   - `MSSQL_SA_PASSWORD`: Đặt mật khẩu quản trị SQL Server mạnh (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt).
>   - `ADMIN_SEED_PASSWORD`: Đặt mật khẩu tài khoản quản trị hệ thống.
> - Tuyệt đối không commit tệp `.env` lên kho mã nguồn công khai (tệp này đã được cấu hình trong `.gitignore`).

---

### 4.4. Bước 3: Khởi động toàn bộ hệ thống với Docker Compose
Đảm bảo **Docker Desktop đang bật**, sau đó chạy lệnh:

```bash
# Build và chạy ngầm toàn bộ dịch vụ (lần đầu có thể mất vài phút tải image)
docker compose up -d --build

# Kiểm tra trạng thái các container
docker compose ps
```

*Kết quả đạt yêu cầu:* Các dịch vụ hiển thị trạng thái `Up` hoặc `Up (healthy)`. Riêng container `mssql-db-init` báo `Exited (0)` là hoàn toàn bình thường (đã hoàn thành việc tạo CSDL ban đầu và tự động thoát).

**Các lệnh hỗ trợ quản lý Docker:**
```bash
# Xem log trực tiếp của hệ thống (nhấn Ctrl+C để thoát)
docker compose logs -f

# Xem log riêng một dịch vụ cụ thể
docker compose logs -f api-gateway

# Dừng hệ thống (vẫn giữ nguyên dữ liệu trong CSDL)
docker compose down

# Khởi động lại hệ thống sạch từ đầu (xóa toàn bộ CSDL và dựng lại)
docker compose down -v
docker compose up -d --build
```

---

### 4.5. Bước 4: Kiểm tra các cổng và địa chỉ truy cập
Sau khi hệ thống khởi động thành công, bạn mở trình duyệt truy cập:

| Phân hệ / Chức năng | Đường dẫn (URL) | Ghi chú |
|---|---|---|
| **Ứng dụng Web (Frontend)** | `http://localhost:8088` | Giao diện du khách & bản đồ di sản (bản Docker) |
| **Cổng API Gateway** | `http://localhost:18080/actuator/health` | Kiểm tra sức khỏe toàn bộ microservices |
| **Bảng quản trị RabbitMQ** | `http://localhost:15800` | Quản lý hàng đợi (đăng nhập bằng tài khoản trong `.env`) |
| **Trang Quản trị (Admin)** | `http://localhost:8088/quan-tri` | Dành cho người quản trị nội dung POI và sản phẩm |

> **Ghi chú về cổng API Gateway:** Mặc định dự án có cấu hình ánh xạ cổng ra `18080` (tránh xung đột với cổng `8080` vốn thường bị các phần mềm Windows khác chiếm dụng).

---

### 4.6. Bước 5: Thao tác CSDL SQL Server 2022 qua Terminal
CSDL SQL Server 2022 đã được đóng gói sẵn trong container `mssql` (lắng nghe cổng `1433`). Bạn có thể thực thi truy vấn trực tiếp qua Terminal mà không cần cài đặt thêm phần mềm quản lý:

```bash
# 1. Liệt kê danh sách các CSDL trong hệ thống:
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd2026" -C -Q "SELECT name FROM sys.databases"

# 2. Xem các bảng dữ liệu trong CSDL nội dung du lịch (saigonvoice_content_db):
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd2026" -C -d saigonvoice_content_db -Q "SELECT name FROM sys.tables"

# 3. Mở cửa sổ dòng lệnh SQL tương tác trực tiếp (SQL Shell):
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd2026" -C
# (Trong shell: gõ lệnh SQL kết thúc bằng GO để thực thi, gõ QUIT để thoát)
```
*(Thay thế `"YourStrong!Passw0rd2026"` bằng giá trị `MSSQL_SA_PASSWORD` bạn đã cấu hình trong tệp `.env`)*.

---

### 4.7. Bước 6: Chạy riêng giao diện phát triển Frontend (Tùy chọn)
Nếu bạn cần chỉnh sửa giao diện web và muốn thấy thay đổi ngay lập tức với Hot Reload của Vite:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Chạy môi trường phát triển (Dev Server)
npm run dev
```
Truy cập giao diện phát triển tại: **http://localhost:5173**

---

### 4.8. Xử lý sự cố thường gặp (Troubleshooting)
1. **Lỗi `JWT_SECRET is required`**: Chưa cấu hình `JWT_SECRET` trong file `.env`. Hãy mở file `.env`, điền chuỗi ký tự ngẫu nhiên tối thiểu 32 ký tự rồi khởi động lại.
2. **Lỗi `Port ... already in use`**: Cổng `18080`, `1433` hoặc `15800` đang bị ứng dụng khác chiếm dụng. Kiểm tra tiến trình đang chạy bằng lệnh: `netstat -ano | findstr :18080`.
3. **Container thoát hoặc unhealthy**: Xem chi tiết nguyên nhân lỗi thông qua lệnh: `docker compose logs <tên_service>`.
4. **Không kết nối được Docker**: Kiểm tra xem ứng dụng **Docker Desktop** đã được mở và khởi động hoàn tất hay chưa.

---

## 5. Tài khoản kiểm thử hệ thống (Test Accounts)

Hệ thống hỗ trợ cơ chế tự động khởi tạo tài khoản mẫu trong môi trường phát triển để phục vụ kiểm thử đồ án:
* **Tài khoản Người dùng (User / Guest)**: Dùng để trải nghiệm đặt món, xem lịch sử đơn hàng và nghe audio tour.
* **Tài khoản Quản trị viên (Admin)**: Dùng để quản lý POI, duyệt bài thuyết minh, quản lý sản phẩm ẩm thực tại `/quan-tri`.

> **Bảo mật tài khoản:** Toàn bộ thông tin email và mật khẩu khởi tạo của tài khoản kiểm thử được định nghĩa an toàn trong tệp `.env` (`ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `SEED_TEST_USER_EMAIL`, `SEED_TEST_USER_PASSWORD`), không công khai trực tiếp trên tài liệu nhằm đảm bảo nguyên tắc bảo mật.

---

## 6. Kiểm thử tự động (Automated Testing)

Dự án tích hợp bộ kiểm thử tự động toàn diện đảm bảo độ ổn định và chất lượng mã nguồn:

### Kiểm thử Frontend (Vitest & React Testing Library)
```bash
cd frontend

# Chạy toàn bộ 13 test suites (62 unit & integration tests)
npm test -- --run

# Kiểm tra kiểu TypeScript và biên dịch bundle
npm run build
```

### Kiểm thử Backend (Maven)
```bash
# Chạy unit test cho từng phân hệ microservice
mvn -f backend/content-service/pom.xml test
mvn -f backend/location-service/pom.xml test
mvn -f backend/translation-tts-service/pom.xml test
mvn -f backend/analytics-service/pom.xml test
mvn -f backend/auth-service/pom.xml test
mvn -f backend/api-gateway/pom.xml test
```

---

## 7. Thông tin đồ án (Project Information)

* **Học phần**: Công nghệ Phần mềm (CNPM) — Nhóm 3
* **Đề tài**: Nền tảng hướng dẫn viên du lịch số tự động thuyết minh di sản Sài Gòn (Echora)
* **Kho mã nguồn (GitHub)**: [https://github.com/congtinh06/Nhom3_CNPM](https://github.com/congtinh06/Nhom3_CNPM)
* **Tài liệu hướng dẫn Word**: [docs/HUONG_DAN_CHAY_DU_AN.docx](file:///f:/Nhom3_CNPM/docs/HUONG_DAN_CHAY_DU_AN.docx)
* **Báo cáo đồ án chính thức**: [docs/report/BaoCao_CNPM_Echora.docx](file:///f:/Nhom3_CNPM/docs/report/BaoCao_CNPM_Echora.docx) và [docs/report/BaoCao_CNPM_Echora.pdf](file:///f:/Nhom3_CNPM/docs/report/BaoCao_CNPM_Echora.pdf)
