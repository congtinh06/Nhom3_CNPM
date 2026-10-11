# SAIGONVOICE — HỆ THỐNG HƯỚNG DẪN VIÊN DU LỊCH ĐA NGÔN NGỮ TỰ ĐỘNG
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

**SaigonVoice** là giải pháp nền tảng du lịch số thông minh dành cho du khách khám phá Thành phố Hồ Chí Minh. Dự án tích hợp công nghệ định vị GPS, bản đồ tương tác mã nguồn mở **Leaflet + OpenStreetMap**, mã QR tại điểm dừng, và hệ thống **thuyết minh âm thanh tự động đa ngôn ngữ** (`vi`, `en`, `ko`, `ja`, `zh`).

Bên cạnh trải nghiệm tham quan di sản, hệ thống còn cung cấp module **Văn hóa ẩm thực & Thức uống bản địa**, cho phép du khách tìm hiểu các món ngon đặc trưng Sài Gòn (cơm tấm, bánh mì, cà phê vợt...), đặt món giao tận nơi hoặc trải nghiệm thanh toán trực tuyến thuận tiện.

### Tính năng nổi bật

1. **Bản đồ Di sản Tương tác (Leaflet + OpenStreetMap)**:
   - Hiển thị 5 điểm di sản nổi tiếng tại trung tâm Sài Gòn (Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện Trung tâm, Chợ Bến Thành, Bảo tàng Chứng tích Chiến tranh).
   - Đánh dấu Marker tròn 1–5 màu nâu đỏ `#8B2E16` sang trọng, phóng to và đổi màu cam vàng `#E9A23B` khi chọn hoặc phát âm thanh.
   - Tự động căn chỉnh vòng bán kính GPS của du khách (`map.fitBounds`) và chống lỗi xám bản đồ (`map.invalidateSize`).

2. **Thuyết minh Tự động & Đa ngôn ngữ (Auto Narration & Multilingual Sync)**:
   - Tự động kích hoạt giọng đọc khi du khách di chuyển vào bán kính kích hoạt (trigger radius 40–55 m).
   - Kiểm soát phát âm thanh chặt chẽ: hàng đợi tuần tự, không phát chồng âm thanh, chống phát lặp lại cùng một địa điểm trong vòng 10 phút.
   - Đồng bộ ngôn ngữ 2 chiều toàn diện giữa Navbar và Audio Player. Hỗ trợ 5 ngôn ngữ (`vi`, `en`, `ko`, `ja`, `zh`) với cơ chế fallback thông minh về tiếng Việt kèm thông báo.
   - Tích hợp Web Speech API chuẩn ngữ điệu bản xứ và tùy chỉnh tốc độ đọc (0.75x, 1x, 1.25x), thanh tua tiến trình và xem văn bản thuyết minh.

3. **Chế độ Thử nghiệm Tọa độ (GPS Simulation Mode)**:
   - Hỗ trợ nhập tọa độ kiểm thử hoặc chọn nhanh các vị trí mẫu (Sát Dinh Độc Lập ≈10m, Sát Nhà thờ Đức Bà ≈10m, Giữa tour, Xa tour) để kích hoạt logic tự động thuyết minh như GPS thực tế.

4. **Khám phá Ẩm thực & Thức uống Sài Gòn**:
   - Danh mục sản phẩm (món ăn đường phố & thức uống thanh nhiệt).
   - Trang chi tiết món ăn, gợi ý món cùng loại, giỏ hàng lưu `localStorage`.
   - Đặt hàng với thông tin giao nhận, ghi chú đơn hàng và hỗ trợ thanh toán (COD hoặc Cổng thanh toán giả lập).

5. **Xác thực Người dùng Hiện đại (Auth Modal & Security)**:
   - Đăng nhập, Đăng ký, Quên mật khẩu, Xác thực email kích hoạt dưới dạng Modal nền nổi (Background Location) không reload trang.
   - Bảo mật phiên làm việc với JWT access token ngắn hạn và Refresh Token lưu trữ an toàn trong `HttpOnly Cookie`, chống tấn công XSS/CSRF.

---

## 2. Kiến trúc hệ thống (Architecture)

```
                            ┌──────────────────────────────────────────────┐
                            │      Frontend SPA (React 18 + TS + Vite)     │
                            │  Bản đồ Leaflet, Web Speech Audio, Giỏ hàng  │
                            └──────────────────────┬───────────────────────┘
                                                   │ HTTP / REST (Port 5173)
                                                   ▼
                            ┌──────────────────────────────────────────────┐
                            │            api-gateway (Spring Cloud)        │
                            │  CORS, Path Guard, Rate Limiting, Admin Auth │
                            │           Host: 18080 (Container: 8080)      │
                            └───────┬──────────────┬──────────────┬────────┘
                                    │              │              │
      ┌─────────────────────────────┼──────────────┼──────────────┼────────────────────────┐
      ▼                             ▼              ▼              ▼                        ▼
┌──────────────────┐  ┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│  auth-service    │  │ content-service  ││ location-service ││translation-tts-  ││ analytics-service│
│  (Port: 8086)    │  │ (Port: 8085)     ││ (Port: 8082)     ││service (Port:8083││ (Port: 8081)     │
│ - JWT / Cookie   │  │ - Zone, Route,POI││ - GPS Haversine, ││ - Dịch tự động   ││ - Thu thập sự    │
│ - Xác thực email │  │ - Món ăn/Thức uốn││   quét mã QR     ││ - edge-tts audio ││   kiện quét & play│
└────────┬─────────┘  └────────┬─────────┘└────────┬─────────┘└────────┬─────────┘└────────┬─────────┘
         │                     │                   │                   │                   │
         │                     │  saigonvoice.topic│                   │                   │
         │                     ├───────────────────┼──────────────────▶│                   │
         │                     │ (poi.created/upd) │                   │                   │
         │                     │◀──────────────────┼───────────────────┤                   │
         │                     │ (audio.ready/fail)│                   │                   │
         │                     │                   │                   │                   │
         │                     │                   │                   │                   ▼
         │                     └───────────────────┼───────────────────┼────────▶ RabbitMQ Broker
         │                                         ▼                   ▼           Host: 5672
         ▼                                  OpenFeign Service     AMQP Event       UI: 15800
   Microsoft SQL Server 2022                Communication         Exchange
   Host: 1433 (4 DBs riêng biệt:
   auth, content, translation, analytics)
```

---

## 3. Cấu trúc thư mục (Repository Structure)

```
Nhom3_CNPM/
├── backend/
│   ├── api-gateway/              # Spring Cloud Gateway định tuyến, bảo mật và rate limiting
│   ├── auth-service/             # Quản lý tài khoản, JWT token, xác thực email qua SMTP
│   ├── content-service/          # Quản lý POI, Zone, Route, Danh mục & Sản phẩm Ẩm thực
│   ├── location-service/         # Xử lý tọa độ GPS, bán kính kích hoạt và tra cứu mã QR
│   ├── translation-tts-service/  # Dịch thuật đa ngôn ngữ và tạo file âm thanh TTS
│   └── analytics-service/        # Thống kê lượt nghe, lượt quét QR theo thời gian thực
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios HTTP client, token store và xử lý lỗi tập trung
│   │   ├── components/           # UI Components (Header, AuthModal, CartDialog...)
│   │   ├── content/              # Dữ liệu 5 POIs Sài Gòn, từ điển đa ngôn ngữ (vi, en, ko, ja, zh)
│   │   ├── context/              # React Context (AuthContext, CartContext, ToastContext)
│   │   ├── hooks/                # Custom React hooks (useAudioPlayer, useNavbarLanguage...)
│   │   ├── pages/                # Các trang: NearbyPage (Bản đồ), ScanPage, Shop, Orders...
│   │   ├── styles/               # Design System CSS (bảng màu di sản Sài Gòn, responsive)
│   │   ├── test/                 # 13 Test suites (62 unit & integration tests với Vitest)
│   │   └── types/                # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── docker/
│   └── init-databases.sql        # Script khởi tạo các CSDL phân lập trên SQL Server
├── docs/                         # Tài liệu đặc tả kiến trúc, API và hợp đồng sự kiện
├── docker-compose.yml            # Khởi chạy toàn bộ hệ thống Microservices & Hạ tầng
├── .env.example                  # Mẫu biến môi trường cấu hình
└── README.md
```

---

## 4. Bảng phân bổ cổng dịch vụ (Service Ports)

| Dịch vụ / Ứng dụng | Cổng Host | Cổng Nội bộ | Công nghệ chính | Chức năng chính |
|---|---|---|---|---|
| **Frontend Web** | `5173` | `5173` | React 18, Vite, TypeScript | Giao diện du khách & bản đồ du lịch |
| **API Gateway** | `18080` | `8080` | Spring Cloud Gateway | Điểm tiếp nhận request tập trung |
| **Content Service** | `8085` | `8085` | Spring Boot 3, Flyway, JPA | Quản lý điểm tham quan, ẩm thực |
| **Location Service** | `8082` | `8082` | Spring Boot 3, OpenFeign | Tính toán GPS và mã QR |
| **Translation & TTS** | `8083` | `8083` | Spring Boot 3, Edge-TTS | Dịch thuật tự động và tạo giọng đọc |
| **Analytics Service** | `8081` | `8081` | Spring Boot 3, RabbitMQ | Thống kê phân tích dữ liệu du lịch |
| **Auth Service** | `8086` | `8086` | Spring Boot 3, JJWT, Mail | Đăng ký, đăng nhập, bảo mật JWT |
| **SQL Server 2022** | `1433` | `1433` | MS SQL Server 2022 | Lưu trữ dữ liệu phân lập (4 DB) |
| **RabbitMQ Broker** | `5672` | `5672` | RabbitMQ 3.13 | Điều phối sự kiện bất đồng bộ |
| **RabbitMQ Dashboard** | `15800` | `15672` | RabbitMQ Management UI | Giao diện giám sát hàng đợi tin nhắn |

---

## 5. Danh sách API Endpoints chính (Core REST APIs)

Toàn bộ các yêu cầu từ Client đều đi qua **API Gateway** (`http://localhost:18080`):

| Phân hệ / Service | Phương thức | Endpoint | Mô tả chức năng |
|---|---|---|---|
| **Auth Service** | `POST` | `/api/auth/register` | Đăng ký tài khoản du khách mới |
| | `POST` | `/api/auth/login` | Đăng nhập, nhận JWT Access Token & Refresh Cookie |
| | `POST` | `/api/auth/refresh` | Làm mới phiên đăng nhập bằng Refresh Token |
| | `POST` | `/api/auth/logout` | Đăng xuất và thu hồi Refresh Token |
| | `GET` | `/api/auth/me` | Lấy thông tin tài khoản đang đăng nhập |
| **Content Service** | `GET` | `/api/content/pois` | Danh sách các điểm tham quan di sản Sài Gòn |
| | `GET` | `/api/content/pois/{slug}` | Chi tiết điểm tham quan và bản dịch đa ngữ |
| | `GET` | `/api/content/products` | Danh sách món ăn ẩm thực và thức uống |
| | `GET` | `/api/content/products/{slug}` | Chi tiết món ăn kèm giá và mô tả |
| **Location Service** | `GET` | `/api/location/nearby` | Tìm điểm du lịch gần nhất dựa theo GPS du khách |
| | `GET` | `/api/location/scan/{code}` | Lấy thông tin thuyết minh khi quét mã QR tại điểm |
| **TTS & Dịch thuật** | `POST` | `/api/tts/synthesize` | Tạo âm thanh thuyết minh đa ngữ qua edge-tts |
| **Analytics Service**| `POST` | `/api/analytics/events` | Ghi nhận lượt nghe thuyết minh và quét mã QR |

---

## 6. Hướng dẫn cài đặt và khởi chạy (Getting Started)

### 6.1. Cấu hình biến môi trường (.env)

Sao chép file cấu hình mẫu từ thư mục gốc:

```bash
cp .env.example .env
```

Các biến môi trường quan trọng:
- `MSSQL_SA_PASSWORD`: Mật khẩu tài khoản quản trị `sa` của SQL Server.
- `CONTENT_DB_USER` / `CONTENT_DB_PASSWORD`: Thông tin truy cập CSDL Content.
- `AUTH_DB_USER` / `AUTH_DB_PASSWORD`: Thông tin truy cập CSDL Auth.
- `JWT_SECRET`: Khóa bí mật dùng ký và xác thực mã JWT Token.
- `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS`: Tài khoản RabbitMQ Broker.

### 6.2. Khởi chạy Backend bằng Docker Compose

**Yêu cầu**: Đã cài đặt Docker Desktop.

```bash
# Khởi chạy toàn bộ hạ tầng CSDL, Message Queue và các Microservices
docker compose up -d --build

# Kiểm tra trạng thái các container đang chạy
docker compose ps
```

### 6.3. Khởi chạy Frontend (React + Vite)

**Yêu cầu**: Node.js 18+ và npm.

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Khởi chạy môi trường phát triển (Dev Server)
npm run dev
```

Truy cập giao diện tại: **http://localhost:5173**

### 6.4. Tài khoản kiểm thử & Quản trị mặc định (Test & Admin Credentials)

Hệ thống cung cấp sẵn các tài khoản kiểm thử đã được kích hoạt sẵn (`ACTIVE`), cho phép đăng nhập trực tiếp tại modal **Đăng nhập** (`/dang-nhap`) mà không cần trải qua bước xác thực email:

| Vai trò | Tài khoản (Email) | Mật khẩu | Chức năng kiểm thử chính |
|---|---|---|---|
| **Người dùng / Du khách (USER)** | `user@saigonvoice.local` | `User@123456` | Trải nghiệm đặt món ẩm thực, xem lịch sử đơn hàng, nghe audio thuyết minh di sản |
| **Quản trị viên (ADMIN)** | `admin@saigonvoice.local` | `Admin@123456` | Quản lý sản phẩm món ăn, duyệt trạng thái điểm tham quan POI |
| **Khóa Quản trị (Admin Key)** | `saigonvoice_admin_secret_key_2026` | *(Dùng cho ô X-Admin-Key)* | Truy cập trang Thống kê & Quản trị hệ thống (`http://localhost:5173/quan-tri`) |

> **Cấu hình tự động khởi tạo trong `.env`**:
> Khi `auth-service` khởi động, hệ thống sẽ tự động tạo sẵn 2 tài khoản trên nếu chưa có trong CSDL:
> ```env
> SEED_ADMIN_EMAIL=admin@saigonvoice.local
> SEED_ADMIN_PASSWORD=Admin@123456
> SEED_TEST_USER_EMAIL=user@saigonvoice.local
> SEED_TEST_USER_PASSWORD=User@123456
> ADMIN_API_KEY=saigonvoice_admin_secret_key_2026
> ```
> *(Ngoài ra, người dùng vẫn có thể đăng ký tài khoản mới tự do tại `/dang-ky`. Trong môi trường dev không có SMTP thật, link/token xác thực email sẽ được ghi trực tiếp vào log của container `auth-service`)*.

---

## 7. Kiểm thử hệ thống (Automated Testing)

Dự án trang bị hệ thống kiểm thử tự động toàn diện cho cả Backend và Frontend:

### 7.1. Kiểm thử Frontend (Vitest & React Testing Library)

```bash
cd frontend

# Chạy toàn bộ 13 test suites (62 tests)
npm test -- --run

# Kiểm tra kiểu dữ liệu TypeScript và build bundle sản xuất
npm run build
```

> **Kết quả kiểm thử Frontend**:
> - **13/13 Test Files passed (100%)**
> - **62/62 Tests passed (100%)** bao gồm:
>   - Kiểm tra bản đồ di sản Leaflet & OpenStreetMap.
>   - Kiểm tra chuyển đổi đa ngôn ngữ và phát thuyết minh tiếng Anh `en-US`.
>   - Kiểm tra fallback ngôn ngữ khi thiếu file giọng đọc.
>   - Kiểm tra giả lập GPS và tự động thuyết minh khi tới gần.
>   - Kiểm tra luồng xác thực Auth Modal, giỏ hàng CartContext, và điều hướng Header.

### 7.2. Kiểm thử Backend (Maven)

```bash
# Chạy kiểm thử cho từng microservice
mvn -f backend/content-service/pom.xml test
mvn -f backend/location-service/pom.xml test
mvn -f backend/translation-tts-service/pom.xml test
mvn -f backend/analytics-service/pom.xml test
mvn -f backend/auth-service/pom.xml test
mvn -f backend/api-gateway/pom.xml test
```

---

## 8. Thông tin đồ án (Project Information)

- **Môn học**: Công nghệ Phần mềm (CNPM) — Nhóm 3
- **Đề tài**: Nền tảng hướng dẫn viên du lịch số tự động thuyết minh Sài Gòn (SaigonVoice)
- **Repository**: [https://github.com/congtinh06/Nhom3_CNPM](https://github.com/congtinh06/Nhom3_CNPM)
- **Công nghệ**: React 18, TypeScript, Vite, Spring Boot 3, SQL Server 2022, RabbitMQ, Docker Compose, Leaflet OSM.
