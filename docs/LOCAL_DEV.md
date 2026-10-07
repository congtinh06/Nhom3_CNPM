# Chạy local & deploy — quy ước chung

Mỗi cổng chỉ do **một** tiến trình giữ. Chọn **một** trong hai chế độ bên dưới.

## Chế độ A — Chạy cả stack bằng Docker (giống deploy)

```bash
cp .env.example .env        # lần đầu, rồi sửa mật khẩu
docker compose up -d --build
docker compose down         # dừng
```

Không chạy thêm service nào từ IDE trong chế độ này.

## Chế độ B — Debug service bằng IDE (IntelliJ/VS Code)

Chỉ bật hạ tầng bằng Docker, service cần debug chạy từ IDE:

```bash
docker compose up -d mssql mssql-db-init rabbitmq
```

Nếu stack đầy đủ đang chạy, dừng đúng service sắp chạy trong IDE:

```bash
docker stop content-service   # hoặc location-service, ...
```

Cổng mặc định: gateway 8080, analytics 8081, location 8082, translation-tts 8083, content 8085,
auth 8086, SQL Server 1433, RabbitMQ 5672 / 15672.

Tài khoản DB và RabbitMQ: giá trị trong `.env.example` trùng với giá trị mặc định trong
`application.yml` của từng service, nên chạy từ IDE không cần khai báo thêm biến môi trường.
Ngoại lệ là `INTERNAL_API_KEY`: IDE không tự đọc `.env`, nên nếu cần gọi `/api/content/internal/**`
hãy đặt biến này trong Run Configuration (cùng giá trị với `.env`), nếu không endpoint trả về 503.

**`auth-service` (cổng 8086)** cũng cần đọc `.env` khi chạy từ IDE — tối thiểu:

```env
JWT_SECRET=<secret dài tối thiểu 32 ký tự; rỗng thì service không khởi động được>
AUTH_DB_USER=auth_user
AUTH_DB_PASSWORD=Auth!Pass2026
SEED_ADMIN_EMAIL=          # trống = không seed tài khoản ADMIN
SEED_ADMIN_PASSWORD=
MAIL_HOST=                 # trống = không gửi mail thật, token xác thực ghi vào log auth-service
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=SaigonVoice <no-reply@saigonvoice.local>
```

DB của auth là `saigonvoice_auth_db` (tự tạo bởi `docker/init-databases.sql`, idempotent).
Khi chạy IDE chỉ bật hạ tầng: `docker compose up -d mssql mssql-db-init rabbitmq`.

> Nếu bạn đã có volume cũ, tài khoản trong DB/RabbitMQ không đổi theo `.env`. Muốn áp dụng bộ mới,
> chạy `docker compose down -v` (xóa dữ liệu) rồi `docker compose up -d`.

> Gặp `Port ... was already in use`: chạy `docker ps` để xem container nào đang giữ cổng đó.

## Cổng bị chiếm trên máy cá nhân

Ví dụ cổng 8080 bị chiếm bởi dịch vụ Windows. Đừng sửa file compose, chỉ sửa `.env` (không commit):

```env
GATEWAY_PORT=18080
VITE_API_BASE_URL=http://localhost:18080
```

`frontend/.env` cũng cần `VITE_API_BASE_URL` khớp.

## Deploy

- **VPS/Docker:** dùng đúng Chế độ A. Giữ `GATEWAY_PORT` mặc định (8080), đặt `INTERNAL_API_KEY`
  khác rỗng (nếu rỗng, `/api/content/internal/**` trả về 503).
- **Render:** xem `render.yaml`. Mỗi service là một web service riêng, không có tình trạng trùng cổng.
  SQL Server và RabbitMQ không nằm trong file này, phải dựng bên ngoài rồi điền `DB_URL`, `RABBITMQ_HOST`.
- Không commit `docker-compose.override.yml`: Compose tự đọc file này nên nó sẽ đổi hành vi
  của mọi máy và cả môi trường deploy.
