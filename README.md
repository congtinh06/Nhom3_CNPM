# ECHORA — NỀN TẢNG HƯỚNG DẪN VIÊN DU LỊCH ĐA NGÔN NGỮ TỰ ĐỘNG
## Multilingual Automated Tourist Audio Guide & Local Experience Platform

[![Vite Build](https://img.shields.io/badge/Vite-5.4.21-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React 18](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![SQL Server 2022](https://img.shields.io/badge/SQL_Server-2022-CC292B?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-622_Tests_Passed-green?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Frontend CI](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/frontend-ci.yml)
[![CD](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/cd.yml/badge.svg)](https://github.com/congtinh06/Nhom3_CNPM/actions/workflows/cd.yml)

> **Tài liệu kỹ thuật:** [Kiến trúc](docs/ARCHITECTURE.md) · [Bảo mật](docs/SECURITY.md) · [Kịch bản demo](docs/DEMO_SCRIPT.md) · [Q&A bảo vệ](docs/DEFENSE_QA.md)

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
                            │           Cổng Host: 18080                   │
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
   Host: 1433 (5 CSDL phân lập:
   auth, content, translation, analytics, order)
```

> Ngoài các dịch vụ trong sơ đồ, hệ thống còn có **`order-service`** (Port: `8087`) phụ trách giỏ hàng, đơn hàng và thanh toán VNPAY.

### 3.1. Contract API (OpenAPI / Swagger)

- Tất cả backend service (auth, content, location, translation-tts, analytics, order, api-gateway) cài `springdoc-openapi` 2.6.0 (webmvc-ui cho service servlet, webflux-ui cho gateway).
- api-gateway route: `Path=/v3/api-docs/**` → content-service.
- Endpoint đang chạy thật: `GET http://localhost:18080/v3/api-docs` qua gateway (xác nhận **200**; payload chứa các path như `/api/content/pois/guide`, `/api/content/pois/{id}`, `/api/orders/**` và schema DTO tương ứng).

```text
Cổng host mặc định:
- api-gateway: 18080 (điều khiển qua GATEWAY_PORT trong .env)
- frontend:    8088  (điều khiển qua FRONTEND_HOST_PORT trong .env)
- mssql:       1433
- rabbitmq:    5672 | dashboard 15800
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
│   ├── analytics-service/        # Tiếp nhận sự kiện nghe thuyết minh bất đồng bộ
│   └── order-service/            # Giỏ hàng, đơn hàng và thanh toán VNPAY
├── frontend/
│   ├── src/                      # Mã nguồn React SPA (bản đồ, trình phát audio, giỏ hàng)
│   ├── package.json              # Danh mục dependencies Frontend
│   └── vite.config.ts            # Cấu hình đóng gói Vite
├── docker/
│   ├── init-databases.sql        # Khởi tạo 5 CSDL + 5 login riêng biệt trên SQL Server
│   └── seed-46-users.sql         # (Tùy chọn) Seed thêm người dùng mẫu vào echora_auth_db
├── docs/
│   ├── PRD.md                    # Đặc tả yêu cầu sản phẩm (Product Requirements Document)
│   ├── diagrams/                 # Sơ đồ Mermaid (kiến trúc, ERD, luồng nghiệp vụ)
│   ├── images/                   # Ảnh sơ đồ đã render (PNG/SVG)
│   └── report/                   # Báo cáo đồ án môn học (tài liệu nội bộ, không đưa lên Git)
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

**Cách khuyến nghị — một lệnh, secret ngẫu nhiên:**

```powershell
# Windows PowerShell (từ thư mục gốc repo)
powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1
```

```bash
# Linux / macOS / Git Bash
bash scripts/bootstrap.sh
```

Script `scripts/bootstrap.ps1|sh` sẽ: sinh `.env` + `frontend/.env`, kiểm tra cấu hình bằng `scripts/check-env.mjs`, rồi chạy `docker compose up -d --build`. Không cần sửa tay file `.env`.

**Cách thủ công (nếu muốn tự chỉnh cấu hình):**

```powershell
node scripts/setup-env.mjs     # sinh .env với secret ngẫu nhiên
node scripts/check-env.mjs     # kiểm tra trước khi chạy
```

> **Ghi chú:** `.env.example` chứa placeholder hợp lệ để `Copy-Item .env.example .env` vẫn khởi động được ở local. Tuyệt đối không dùng nguyên trạng cho production. `JWT_SECRET` phải dài tối thiểu 32 ký tự, nếu không `auth-service` sẽ từ chối khởi động (fail-closed).

---

### 4.4. Bước 3: Khởi động toàn bộ hệ thống với Docker Compose
Đảm bảo **Docker Desktop đang bật** (trạng thái Engine Running màu xanh), sau đó mở Terminal tại thư mục dự án và chạy lệnh:

```bash
# Build và chạy ngầm toàn bộ dịch vụ (lần đầu có thể mất 2-4 phút tải images)
docker compose up -d --build

# Kiểm tra trạng thái các container
docker compose ps
```

*Kết quả đạt yêu cầu:* Toàn bộ các dịch vụ hiển thị trạng thái `Up` hoặc `Up (healthy)`. File `init-databases.sql` sẽ tự động khởi tạo 5 CSDL độc lập trên SQL Server ngay trong lần chạy đầu tiên.

> **Quan trọng về mật khẩu CSDL:** `MSSQL_SA_PASSWORD` chỉ được áp dụng khi volume `mssql-data` còn trống (lần chạy đầu). Nếu máy đã từng chạy với mật khẩu khác rồi mới sửa `.env`, SQL Server vẫn giữ mật khẩu cũ. Khi đó phải xoá volume và khởi tạo lại: `docker compose down -v` rồi `docker compose up -d --build` (lệnh này xoá toàn bộ dữ liệu CSDL hiện có).

**Các lệnh hỗ trợ quản lý Docker:**
```bash
# Xem log trực tiếp của hệ thống (nhấn Ctrl+C để thoát)
docker compose logs -f

# Xem log riêng một dịch vụ cụ thể
docker compose logs -f api-gateway

# Dừng hệ thống (vẫn giữ nguyên dữ liệu trong CSDL)
docker compose down

# Khởi động lại hệ thống sạch từ đầu (xóa toàn bộ CSDL và dựng lại mới)
docker compose down -v
docker compose up -d --build
```

#### Nâng cấp từ bản cũ (Docker hardening — NHIỆM VỤ 1.2)

Từ phiên bản này, các service backend chạy bằng user/group **`app` (uid/gid 10001)** và frontend chạy bằng **`nginx` (uid 101)**. Nếu máy bạn đã từng chạy bản cũ, các volume `audio-storage-data` và `product-uploads-data` được tạo bởi `root` sẽ khiến service không ghi được file (`Permission denied`). Chọn một trong hai cách sau:

```bash
# 1) Giữ dữ liệu cũ: chown lại volume cho uid/gid 10001
docker compose down
docker run --rm -v nhom3_cnpm_audio-storage-data:/data alpine chown -R 10001:10001 /data
docker run --rm -v nhom3_cnpm_product-uploads-data:/data alpine chown -R 10001:10001 /data
docker compose up -d --build

# 2) Không cần dữ liệu cũ: xoá volume để Docker tạo lại với đúng owner
docker compose down
docker volume rm nhom3_cnpm_audio-storage-data nhom3_cnpm_product-uploads-data
docker compose up -d --build
```

> Tên volume có tiền tố tên project Compose. Nếu project của bạn khác `nhom3_cnpm`, xem tên thật bằng `docker volume ls` rồi thay vào lệnh trên. Chỉ cần chown/xoá các volume liên quan tới file (audio, ảnh sản phẩm); volume CSDL `mssql-data` giữ nguyên.

---

### 4.5. Bước 4: Kiểm tra các cổng và địa chỉ truy cập
Sau khi hệ thống khởi động thành công, bạn mở trình duyệt truy cập:

| Phân hệ / Dịch vụ | Đường dẫn (URL) | Tài khoản / Ghi chú |
|---|---|---|
| **Ứng dụng Web (Frontend Docker)** | `http://localhost:8088` | Giao diện du khách & bản đồ di sản |
| **Giao diện Dev (Hot Reload)** | `http://localhost:5173` | Chạy khi gõ `npm run dev` ở thư mục frontend |
| **Trang Quản trị (Admin)** | `http://localhost:8088/quan-tri` | Đăng nhập bằng tài khoản Quản trị viên (xem mục 5) |
| **Cổng API Gateway** | `http://localhost:18080/actuator/health` | Kiểm tra sức khỏe toàn bộ microservices |
| **Bảng quản trị RabbitMQ** | `http://localhost:15800` | User: `echora_app` / Pass: `<xem RABBITMQ_DEFAULT_PASS trong .env>` |
| **Cơ sở dữ liệu SQL Server** | `localhost:1433` | User: `sa` / Pass: `<xem MSSQL_SA_PASSWORD trong .env>` |

> **Ghi chú về cổng API Gateway:** `docker-compose.yml` ánh xạ cổng host `${GATEWAY_PORT}` (mặc định `18080`) vào cổng `8080` bên trong container, tránh xung đột với cổng `8080` thường bị tiến trình nội bộ của Windows chiếm dụng. Muốn đổi cổng host, sửa `GATEWAY_PORT` trong `.env` rồi chạy lại `docker compose up -d`; Vite dev proxy cũng đang trỏ tới `http://localhost:18080`.

> **Ghi chú về cổng Frontend:** container frontend dùng `nginxinc/nginx-unprivileged` chạy bằng uid 101 nên **lắng nghe cổng nội bộ `8080`** (không phải `80`). `docker-compose.yml` chỉ publish ra host qua `${FRONTEND_HOST_PORT}` (mặc định `8088` → `8080`). Khi gọi trực tiếp từ trình duyệt luôn dùng `http://localhost:8088`.

---

### 4.5b. Cấu trúc Hàng đợi RabbitMQ & Dead-Letter Queue (DLQ)
Hệ thống sử dụng RabbitMQ để xử lý bất đồng bộ các sự kiện phân tích du khách và tiến trình tổng hợp audio:

| Dịch vụ | Exchange | Hàng đợi chính | Dead-Letter Exchange (DLX) | Dead-Letter Queue (DLQ) |
|---|---|---|---|---|
| **Analytics Service** | `echora.analytics` (topic, key: `analytics.event`) | `analytics.event.queue` | `echora.analytics.dlx` (direct) | `analytics.event.dlq` (key: `analytics.event.dlq`) |
| **Translation TTS** | `echora.topic` (topic) | `poi.created.queue`, `poi.updated.queue` | `echora.dlx` (direct) | `poi.dlq` |

> **Lưu ý xử lý lỗi PRECONDITION_FAILED (thao tác 1 lần khi cập nhật hàng đợi):**
> Nếu broker RabbitMQ đã tồn tại hàng đợi `analytics.event.queue` từ phiên bản cũ (chưa được cấu hình đối số Dead-Letter Exchange `x-dead-letter-exchange`), việc khởi động `analytics-service` có thể báo lỗi `PRECONDITION_FAILED - inequivalent arg 'x-dead-letter-exchange'`.
> Để khắc phục:
> 1. Truy cập RabbitMQ Management tại `http://localhost:15800` (đăng nhập bằng tài khoản `echora_app`).
> 2. Vào tab **Queues**, chọn hàng đợi `analytics.event.queue`.
> 3. Kéo xuống mục **Delete / Purge**, chọn **Delete Queue**.
> 4. Chạy lại `analytics-service` (`docker compose restart --no-deps analytics-service`); Spring AMQP sẽ tự động khởi tạo lại hàng đợi với đầy đủ cấu hình DLX & DLQ.

---

### 4.6. Bước 5: Thao tác CSDL SQL Server 2022 qua Terminal
CSDL SQL Server 2022 đã được đóng gói sẵn trong container `mssql` (lắng nghe cổng `1433`). Bạn có thể thực thi truy vấn trực tiếp qua Terminal (thay `$MSSQL_SA_PASSWORD` bằng mật khẩu đã cấu hình trong `.env`):

```bash
# 1. Liệt kê danh sách các CSDL trong hệ thống:
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT name FROM sys.databases;"

# 2. Xem các bảng dữ liệu trong CSDL nội dung du lịch (echora_content_db):
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d echora_content_db -Q "SELECT name FROM sys.tables;"

# 3. Xem danh sách 7 điểm du lịch kèm bán kính kích hoạt tự động (35m - 60m):
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d echora_content_db -Q "SELECT id, name, trigger_radius_meters FROM dbo.poi;"

# 4. Mở cửa sổ dòng lệnh SQL tương tác trực tiếp (SQL Shell):
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C
# (Trong shell: gõ lệnh SQL kết thúc bằng GO để thực thi, gõ QUIT để thoát)
```

> **Tùy chọn seed thêm người dùng mẫu:** `docker/seed-46-users.sql` thêm các tài khoản `dukhach24@echora.vn` … `dukhach46@echora.vn` vào bảng `dbo.users` của `echora_auth_db` (chạy được trên cả PowerShell):
```bash
docker cp docker/seed-46-users.sql mssql:/tmp/seed-46-users.sql
docker exec -it mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d echora_auth_db -i /tmp/seed-46-users.sql
```

---

### 4.7. Bước 6: Chạy riêng giao diện phát triển Frontend (Tùy chọn)
Nếu bạn cần chỉnh sửa giao diện web và muốn thấy thay đổi tức thì với Hot Reload của Vite:

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
1. **Lỗi `JWT_SECRET is required`**: Chưa có file `.env`. Hãy chạy `Copy-Item .env.example .env` (hoặc `cp .env.example .env`) rồi khởi động lại.
2. **Lỗi `Port ... already in use`**: Cổng `18080`, `1433` hoặc `15800` đang bị ứng dụng khác chiếm dụng. Kiểm tra tiến trình bằng lệnh: `netstat -ano | findstr :18080`.
3. **Container thoát hoặc unhealthy**: Xem chi tiết nguyên nhân lỗi qua: `docker compose logs <tên_service>`.
4. **Không kết nối được Docker**: Kiểm tra xem ứng dụng **Docker Desktop** đã được mở và khởi động hoàn tất hay chưa.
5. **Sai mật khẩu CSDL dù đã sửa `.env`**: volume `mssql-data` vẫn giữ mật khẩu của lần khởi tạo đầu tiên. Chạy `docker compose down -v` rồi `docker compose up -d --build` để khởi tạo lại (mất dữ liệu cũ).
6. **Code không đồng bộ sau khi pull**: kiểm tra đang ở nhánh `main` (`git branch --show-current`), không còn thay đổi chưa commit (`git status`) và đã pull mới nhất (`git pull origin main`). Các nhánh `feat/*`, `fix/*`, `vercel-test` có thể đang lỗi thời so với `main`.

---

## 5. Tài khoản & Mật khẩu hệ thống

Tài liệu này **không lưu** mật khẩu, hash, token hay khóa bí mật. Mọi giá trị nhạy cảm phải được khai báo trong `.env` (không commit) và sinh ngẫu nhiên theo hướng dẫn ở đầu `.env.example`.

Tài khoản seed chỉ được tạo khi đặt biến môi trường tương ứng:
- `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD`: tạo tài khoản ADMIN đầu tiên.
- `SEED_TEST_USER_EMAIL` + `SEED_TEST_USER_PASSWORD`: tạo tài khoản USER kiểm thử (để trống để bỏ qua).

Để tạo thêm ADMIN, dùng chức năng quản lý người dùng trong `/quan-tri` bằng tài khoản ADMIN hiện có, hoặc đổi `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` sang email mới rồi khởi động lại `auth-service` (seeder chỉ tạo khi email chưa tồn tại).

Thông tin VNPAY Sandbox (mã website, hash secret, thẻ test) tra cứu tại tài liệu chính thức của VNPAY; không lưu trong repo.

---

## 6. Kiểm thử tự động (Automated Testing)

Dự án tích hợp bộ kiểm thử tự động toàn diện đảm bảo độ ổn định và chất lượng mã nguồn:

### Kiểm thử Frontend (Vitest & React Testing Library)
```bash
cd frontend

# Chạy toàn bộ 77 test suites (622 unit & integration tests)
npm test

# Kiểm tra danh sách route SPA khớp giữa App.tsx, nginx.conf và vercel.json
npm run check:spa-routes

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
mvn -f backend/order-service/pom.xml test
mvn -f backend/api-gateway/pom.xml test
```

Backend hiện có 70 file kiểm thử (708 test, 0 failure): content 19, translation-tts 16, auth 13, analytics 12, location 5, api-gateway 2, order 3. Frontend có 77 file test với 622 test (Vitest + React Testing Library). Repo có 10 workflow trong `.github/workflows/` (7 microservice, frontend, `config-check` kiểm tra clean-machine bootstrap, và `cd` build/push image + deploy khi cấu hình secret).

### Kiểm tra trạng thái audio trước demo
```powershell
$env:ECHORA_BASE_URL = 'http://localhost:18080'
$env:ECHORA_ADMIN_TOKEN = '<token ADMIN>'
pwsh -File scripts/check-audio-status.ps1
```

Script chỉ gửi GET tới `/api/content/admin/audio/status` và in ma trận POI × ngôn ngữ (READY/PENDING/FAILED...). Các endpoint quản trị audio khác đều yêu cầu Bearer token ADMIN:
- `GET /api/content/admin/audio/status`
- `POST /api/content/admin/pois/{id}/audio/regenerate` (tùy chọn `?languages=vi,en`)
- `POST /api/content/admin/audio/regenerate` (tạo lại cho mọi ngôn ngữ chưa READY)

### Dữ liệu mẫu khi demo offline
Frontend mặc định gọi API thật. Chỉ khi đặt `VITE_USE_SAMPLE_DATA=true` (hoặc chạy test) mới dùng fixture cho Tin tức và Điểm du lịch gần bạn; không bật biến này trên production.

---

## 7. Thông tin đồ án (Project Information)

* **Học phần**: Công nghệ Phần mềm (CNPM) — Nhóm 3
* **Đề tài**: Nền tảng hướng dẫn viên du lịch số tự động thuyết minh di sản Sài Gòn (Echora)
* **Kho mã nguồn (GitHub)**: [https://github.com/congtinh06/Nhom3_CNPM](https://github.com/congtinh06/Nhom3_CNPM)
* **Tài liệu đặc tả sản phẩm**: [docs/PRD.md](docs/PRD.md)
* **Sơ đồ kiến trúc, ERD, luồng nghiệp vụ**: [docs/diagrams/](docs/diagrams/) (Mermaid) và ảnh render tại [docs/images/](docs/images/)
* **Báo cáo đồ án (Word/PDF)**: tài liệu nội bộ trong `docs/report/`, không đưa lên GitHub theo `.gitignore` (`*.docx`, `*.pdf`).
