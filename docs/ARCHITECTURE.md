# Tài liệu Kiến trúc Echora

Tài liệu này mô tả kiến trúc kỹ thuật của nền tảng **Echora** — hướng dẫn viên du lịch số đa ngôn ngữ tự động cho di sản Thành phố Hồ Chí Minh. Mọi phần tử trong các sơ đồ đều có tương ứng trong mã nguồn thực tế.

---

## 1. Sơ đồ thành phần (Component Diagram)

Nguồn: `docker-compose.yml`, `backend/api-gateway/src/main/resources/application.yml`, `frontend/src/api/client.ts`.

```mermaid
flowchart TB
    subgraph ClientLayer["Lớp Khách hàng"]
        SPA["Frontend SPA\nReact 18 + TypeScript + Vite\nLeaflet Map · Audio Player · i18n vi/en/ja/ko"]
        AdminUI["Admin CMS\n/quan-tri\nQuản trị POI, Audio, Đơn hàng"]
    end

    subgraph GatewayLayer["Lớp API Gateway"]
        GW["api-gateway :8080\nInternalPathBlockFilter · AdminAuthGlobalFilter\nUserAuthGlobalFilter · OpenApiDocsFilter\nAnalyticsRateLimitGlobalFilter · SecurityHeadersGlobalFilter"]
    end

    subgraph ServiceLayer["Lớp Microservices"]
        AUTH["auth-service :8086\nJWT · HttpOnly Cookie · Google OAuth2\nEmail verification · Role USER/ADMIN"]
        CONTENT["content-service :8085\nPOI · Lộ trình · Sản phẩm · Audio admin"]
        LOCATION["location-service :8082\nHaversine · QR resolve · OpenFeign"]
        TRANSLATION["translation-tts-service :8083\nMyMemory · Edge-TTS\nAMQP consumer · Bounded retry"]
        ORDER["order-service :8087\nGiỏ hàng · Premium · VNPAY · VietQR"]
        ANALYTICS["analytics-service :8081\nEvent collector · Dashboard · DLQ consumer"]
    end

    subgraph BrokerLayer["Message Broker"]
        MQ["RabbitMQ :5672\nExchange: echora.topic\n  poi.created.queue, poi.updated.queue, poi.dlq\nExchange: echora.analytics\n  analytics.event.queue, analytics.event.dlq"]
    end

    subgraph DataLayer["SQL Server 2022 :1433"]
        DB_AUTH[("echora_auth_db")]
        DB_CONTENT[("echora_content_db")]
        DB_TRANS[("echora_translation_db")]
        DB_ORDER[("echora_order_db")]
        DB_ANALYTICS[("echora_analytics_db")]
    end

    subgraph StorageLayer["Lưu trữ cục bộ"]
        VOL_AUDIO["audio-storage-data"]
        VOL_IMG["product-uploads-data"]
    end

    subgraph ExternalLayer["Dịch vụ ngoài"]
        VNPAY["VNPAY Sandbox"]
        GOOGLE["Google Identity"]
        MYMEMORY["MyMemory API"]
        EDGETTS["Edge-TTS"]
        OSM["OpenStreetMap"]
    end

    SPA -->|HTTP/REST| GW
    AdminUI -->|HTTP/REST| GW
    GW -->|/api/auth/**| AUTH
    GW -->|/api/content/**| CONTENT
    GW -->|/api/location/**| LOCATION
    GW -->|/api/tts/**| TRANSLATION
    GW -->|/api/orders/**| ORDER
    GW -->|/api/analytics/**| ANALYTICS
    GW -->|/img/products/**| CONTENT

    CONTENT -.->|poi.created/updated| MQ
    MQ -.->|Consume| TRANSLATION
    TRANSLATION -.->|audio.ready/failed| MQ
    MQ -.->|Update audioStatus| CONTENT
    ANALYTICS -.->|analytics.event| MQ
    MQ -.->|Consume| ANALYTICS

    AUTH --> DB_AUTH
    CONTENT --> DB_CONTENT
    TRANSLATION --> DB_TRANS
    ORDER --> DB_ORDER
    ANALYTICS --> DB_ANALYTICS
    TRANSLATION --> VOL_AUDIO
    CONTENT --> VOL_IMG

    ORDER --> VNPAY
    AUTH --> GOOGLE
    TRANSLATION --> MYMEMORY
    TRANSLATION --> EDGETTS
    SPA --> OSM
```

### 1.1. Chuỗi bộ lọc API Gateway và Hợp đồng OpenAPI gộp

**Chuỗi Bộ lọc API Gateway (Spring Cloud Gateway WebFlux):**
1. `TraceIdGlobalFilter`: Đính kèm và chuẩn hóa header `X-Trace-Id` (UUID) xuyên suốt toàn bộ vòng đời request.
2. `UntrustedHeaderStripGlobalFilter`: Loại bỏ các header đặc quyền giả mạo từ bên ngoài gửi vào (`X-User-Id`, `X-User-Role`, `X-Internal-Api-Key`).
3. `InternalPathBlockFilter`: Chặn tuyệt đối mọi request từ client cố tình truy cập vào các đường dẫn nội bộ (`/internal/**`, `/api/**/internal/**`).
4. `PathGuardFilter`: Kiểm tra và ngăn chặn các hành vi tấn công Path Traversal (`..`, `%2e%2e`).
5. `OpenApiDocsFilter`: Kiểm soát truy cập tài liệu API dựa trên biến môi trường `ECHORA_DOCS_ENABLED` (mặc định tắt trên môi trường deploy). Khi tắt, trả về HTTP 404 với chuẩn `application/problem+json` (`RFC 7807`), không làm lộ cấu trúc hệ thống.
6. `UserAuthGlobalFilter`: Xác thực JWT token từ HttpOnly Cookie `auth_token`, trích xuất thông tin người dùng và chuyển tiếp tới downstream services.
7. `AdminAuthGlobalFilter`: Kiểm tra quyền hạn `ADMIN` cho các endpoint quản trị (`/api/auth/admin/**`, `/api/admin/**`, `/api/content/admin/**`, `/api/orders/admin/**`).
8. `AnalyticsRateLimitGlobalFilter`: Áp dụng Rate Limiting bảo vệ endpoint thu thập sự kiện phân tích.
9. `SecurityHeadersGlobalFilter`: Gắn các header bảo mật HTTP nghiêm ngặt (CSP, HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).

**Hợp đồng OpenAPI gộp (OpenAPI 3.0 / Swagger UI):**
- Gateway cung cấp Swagger UI thống nhất tại `http://localhost:18080/swagger-ui.html` cho phép xem và thử nghiệm API của toàn bộ 6 microservices thông qua menu chọn:
  - **Auth Service** (`/v3/api-docs/auth`): **30 public paths** (xác thực, đăng ký/đăng nhập, đổi mật khẩu, xác thực email, quản trị tài khoản, phiên QR Login).
  - **Content Service** (`/v3/api-docs/content`): **40 public paths** (điểm tham quan POI, lộ trình du lịch, ẩm thực & quà lưu niệm, tin tức di sản, audio admin).
  - **Location Service** (`/v3/api-docs/location`): **3 public paths** (tính khoảng cách Haversine, tìm POI lân cận theo tọa độ GPS, quét mã QR điểm đến).
  - **Translation & TTS Service** (`/v3/api-docs/translation`): **1 public path** (phát luồng âm thanh thuyết minh audio đa ngữ theo định dạng byte-range).
  - **Analytics Service** (`/v3/api-docs/analytics`): **6 public paths** (tiếp nhận sự kiện nghe thuyết minh, thống kê tương tác du khách, biểu đồ xu hướng).
  - **Order Service** (`/v3/api-docs/order`): **18 public paths** (giỏ hàng, tạo đơn hàng mua gói Premium / quà lưu niệm, thanh toán VNPAY, VietQR).
- **Tổng số public paths**: **98 endpoints** (toàn bộ endpoint nội bộ được ẩn với `@Hidden`, số endpoint `/internal` lộ ra = 0). Mọi URL máy chủ trong tài liệu đều trỏ về API Gateway (`http://localhost:18080`).

---

## 2. Sơ đồ triển khai (Deployment Diagram)

Nguồn: `frontend/vercel.json`, `docker-compose.yml`.

```mermaid
flowchart LR
    subgraph UserDevice["Thiết bị du khách"]
        Browser["Trình duyệt"]
    end

    subgraph Vercel["Vercel Edge Network"]
        FE["Frontend SPA tĩnh\nvercel.json:\n/api/** → ngrok tunnel\n/img/products/** → ngrok tunnel\n/* → index.html"]
    end

    subgraph StudentMachine["Docker Host (máy sinh viên)"]
        subgraph DockerNet["echora-net"]
            GW_C["api-gateway :18080"]
            SVC["6 microservices"]
            MQ_C["rabbitmq :5672"]
            DB_C["mssql :1433 (127.0.0.1)"]
        end
        Ngrok["ngrok tunnel\nPublic URL → :18080"]
    end

    Browser -->|HTTPS| Vercel
    FE -->|Rewrite HTTPS| Ngrok
    Ngrok -->|HTTP| GW_C
    GW_C --> SVC
    SVC --> MQ_C
    SVC --> DB_C
```

> URL ngrok thay đổi theo phiên. Xem `scripts/start-demo.ps1` để biết cách cập nhật. Header `ngrok-skip-browser-warning: 1` đã được thêm trong `vercel.json`.

---

## 3. Luồng thuyết minh (Narration Sequence)

Nguồn: `PoiEventPublisher.java`, `PoiAudioEventListener.java`, `PoiPipelineServiceImpl.java`, `useNearbyAudio.ts`.

```mermaid
sequenceDiagram
    autonumber
    actor User as Du khách
    participant FE as Frontend SPA
    participant GW as api-gateway
    participant CS as content-service
    participant MQ as RabbitMQ
    participant TTS as translation-tts-service
    participant Vol as Audio Volume

    User->>FE: Bước vào vùng geofence (GPS / Quét QR)
    FE->>GW: GET /api/content/pois/{id}?lang=vi
    GW->>CS: forward (JWT filter)
    CS-->>FE: 200 { audioStatusByLanguage, audio[lang] }

    alt audioStatus === READY
        FE->>GW: GET /api/tts/audio/{file}
        GW->>TTS: AudioEntitlementFilter kiểm tra quyền
        TTS-->>FE: audio/mpeg
        FE->>User: Phát audio Edge-TTS
    else Chưa READY
        FE->>User: speechSynthesis fallback + thông báo
    end

    Note over CS,MQ: Khi Admin lưu POI
    CS->>MQ: Publish poi.created
    MQ->>TTS: Deliver poi.created.queue
    TTS->>TTS: Dịch MyMemory + Synthesize Edge-TTS
    TTS->>Vol: Lưu file MP3
    TTS->>MQ: Publish audio.ready
    MQ->>CS: Update audioStatus = READY
```

---

## 4. Luồng đăng nhập / Google OAuth

Nguồn: `AuthController.java`, `JwtAuthenticationFilter.java`, `AuthContext.tsx`.

```mermaid
sequenceDiagram
    autonumber
    actor User as Du khách
    participant FE as Frontend SPA
    participant GW as api-gateway
    participant AUTH as auth-service
    participant GOOGLE as Google Identity

    User->>FE: Nhập email + mật khẩu
    FE->>GW: POST /api/auth/login
    GW->>AUTH: forward
    AUTH-->>FE: { accessToken } + Set-Cookie: refreshToken (HttpOnly)

    User->>FE: Nhấn Đăng nhập Google
    FE->>GOOGLE: Google Identity popup
    GOOGLE-->>FE: credential id_token
    FE->>GW: POST /api/auth/google
    GW->>AUTH: forward
    AUTH->>GOOGLE: Verify id_token
    AUTH-->>FE: { accessToken } + Set-Cookie: refreshToken

    Note over FE,AUTH: Token tự động gia hạn
    FE->>GW: POST /api/auth/refresh
    AUTH-->>FE: { accessToken mới } + refreshToken mới
```

---

## 5. ERD theo database

Nguồn: Flyway migration trong `backend/*/src/main/resources/db/migration/`.

### 5.1. echora_auth_db

```mermaid
erDiagram
    users {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        varchar plan
        bit premium_active
        bit email_verified
        varchar google_id
        varchar refresh_token_hash
        datetime2 refresh_token_expires_at
        datetime2 created_at
    }
    email_verifications {
        bigint id PK
        bigint user_id FK
        varchar token UK
        datetime2 expires_at
        bit used
    }
    password_reset_tokens {
        bigint id PK
        bigint user_id FK
        varchar token UK
        datetime2 expires_at
        bit used
    }
    users ||--o{ email_verifications : "user_id"
    users ||--o{ password_reset_tokens : "user_id"
```

### 5.2. echora_content_db (bảng chính)

```mermaid
erDiagram
    poi {
        bigint id PK
        varchar code UK
        varchar name
        varchar zone_code
        float latitude
        float longitude
        int trigger_radius_meters
        bit active
        varchar qr_token
    }
    poi_translation {
        bigint id PK
        bigint poi_id FK
        varchar language_code
        nvarchar narration_script
        nvarchar display_text
        varchar audio_file_path
        varchar audio_status
        varchar content_hash
        varchar error_reason
    }
    poi ||--o{ poi_translation : "poi_id"
```

### 5.3. echora_order_db (bảng chính)

```mermaid
erDiagram
    orders {
        bigint id PK
        varchar order_code UK
        bigint user_id
        varchar order_type
        varchar status
        varchar payment_status
        varchar payment_method
        bigint total_amount
        varchar receiver_name
        varchar phone
        varchar address
        bigint poi_id
        varchar note
        datetime2 created_at
    }
    order_items {
        bigint id PK
        bigint order_id FK
        bigint product_id
        varchar product_name
        int quantity
        bigint unit_price
    }
    orders ||--o{ order_items : "order_id"
```

---

## 6. Sơ đồ CI/CD Pipeline

Nguồn: `.github/workflows/`.

```mermaid
flowchart LR
    subgraph Trigger["Trigger"]
        PUSH["git push main\nor tag v*"]
        PR["Pull Request"]
    end

    subgraph CI["CI — 9 workflows"]
        FE_CI["frontend-ci.yml\nnpm ci · vitest · tsc · build · smoke"]
        BE_CI["7 backend CI\nmvn test · ArchUnit · docker build"]
        ENV_CI["config-check.yml\nclean-machine env verification"]
    end

    subgraph CD["CD — cd.yml"]
        GUARD["check-ci\nworkflow_run guard"]
        MATRIX["Matrix 8 services\nbuildx → ghcr.io\nsha-SHORT + latest"]
    end

    PUSH --> CI
    PR --> CI
    CI -->|"workflow_run completed=success"| GUARD
    PUSH -->|"direct push"| GUARD
    GUARD --> MATRIX
```

---

## 7. Danh sách Use Case

Nguồn: `frontend/src/App.tsx`, `frontend/src/admin/AdminRoutes.tsx`, backend controllers.

| # | Actor | Use Case | Route / Endpoint |
|---|---|---|---|
| UC-01 | Khách | Xem bản đồ và danh sách điểm đến | `/diem-du-lich` |
| UC-02 | Khách | Nghe thuyết minh tự động khi gần POI | GPS geofence → audio |
| UC-03 | Khách | Quét mã QR tại điểm tham quan | `/quet-ma`, `/qr/:token` |
| UC-04 | Khách | Chọn ngôn ngữ thuyết minh | Header selector |
| UC-05 | Khách | Xem ẩm thực và quà lưu niệm | `/am-thuc`, `/am-thuc/:slug` |
| UC-06 | Người dùng | Đặt hàng và thanh toán | `/thanh-toan`, `POST /api/orders` |
| UC-07 | Người dùng | Xem lịch sử đơn hàng | `/don-hang`, `GET /api/orders` |
| UC-08 | Người dùng | Nâng cấp Premium | `/nang-cap`, `POST /api/orders/premium` |
| UC-09 | Người dùng | Đăng nhập / Đăng ký / Google OAuth | `POST /api/auth/login` |
| UC-10 | Người dùng | Đặt lại mật khẩu qua email | `POST /api/auth/reset-password` |
| UC-11 | Admin | Quản lý POI, sản phẩm, tin tức | `/quan-tri`, `/api/content/admin/**` |
| UC-12 | Admin | Xem thống kê real-time | `/quan-tri/thong-ke`, `/api/analytics/summary` |
| UC-13 | Admin | Tạo lại audio | `POST /api/content/admin/audio/regenerate` |
| UC-14 | Admin | Xem trạng thái audio | `GET /api/content/admin/audio/status` |
| UC-15 | Admin | Quản lý đơn hàng | `/api/admin/orders` |
