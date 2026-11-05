# Kịch bản Demo — Echora (10 phút)

Tài liệu hướng dẫn trình bày hệ thống trong buổi bảo vệ đồ án. Người trình bày đọc cột **Hành động**, người hỗ trợ (nếu có) chuẩn bị bước tiếp theo.

---

## Trước demo (T−15 phút)

| Bước | Hành động | Kiểm tra |
|---|---|---|
| 1 | Chạy `pwsh scripts/check-audio-status.ps1` | Tất cả ngôn ngữ READY (exit 0) |
| 2 | Mở trình duyệt tại Vercel URL công khai | Trang chủ tải trong ≤ 3 giây |
| 3 | Kiểm tra ngrok tunnel còn hoạt động | `GET /api/content/pois` trả 200 |
| 4 | Đăng nhập sẵn tài khoản Admin | Dashboard `/quan-tri` hiển thị |
| 5 | Mở tab GitHub Actions | CI xanh tại HEAD |

---

## Kịch bản chính (10 phút)

### Phút 1–2: Giới thiệu kiến trúc

- Mở `docs/ARCHITECTURE.md` hoặc ảnh sơ đồ thành phần.
- Nêu: 6 microservice + gateway, RabbitMQ async, 5 CSDL độc lập, frontend Vercel + backend Docker qua ngrok.
- Mở tab CI/CD: chỉ 8 workflow, nêu CD build Docker image và đẩy lên GHCR.

### Phút 3–4: Thuyết minh đa ngôn ngữ

1. Mở `/diem-du-lich` trên Vercel.
2. Nhấn **"Giả lập vị trí → Sát di sản (≈10m)"** — audio tiếng Việt tự phát.
3. Chuyển ngôn ngữ sang **Tiếng Anh** — audio Edge-TTS tiếng Anh phát (nếu READY) hoặc speechSynthesis với thông báo rõ ràng.
4. Quét mã QR (camera thật hoặc ảnh test) → POI mở đúng.

### Phút 5: Phân quyền audio

- Mở tab ẩn (anonymous): `GET /api/content/pois/1?lang=en` → **403** (hiển thị trong Network).
- Giải thích: audio tiếng Anh/Nhật/Hàn yêu cầu tài khoản Premium hoặc mua lẻ.

### Phút 6: Admin — trạng thái audio

- Đăng nhập `/quan-tri`, mở mục Audio hoặc chạy script `check-audio-status.ps1`.
- Hiển thị bảng POI × ngôn ngữ.
- Nhấn "Tạo lại audio" cho một POI → trạng thái chuyển GENERATING → READY.

### Phút 7: Đặt hàng và thanh toán

- Thêm sản phẩm vào giỏ → `/thanh-toan` → chọn phương thức MOCK.
- Cổng mock hiển thị → nhấn "Thành công" → trang kết quả hiện "Đặt hàng thành công".

### Phút 8: CI/CD live

- Mở GitHub Actions, chọn run gần nhất.
- Chỉ: frontend CI (vitest 582 tests, tsc, build), backend CI, CD push image lên GHCR.
- Chỉ tab Packages trên GitHub: image `ghcr.io/<owner>/Nhom3_CNPM-frontend:sha-...`.

### Phút 9: Bảo mật

- Network → Headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` từ `vercel.json`.
- Chỉ `.env.example`: không có giá trị mật khẩu thật; README không còn mật khẩu.
- Giải thích rate limit analytics (60 req/phút per trusted IP), admin key qua gateway.

### Phút 10: Tổng kết và Q&A

- Nêu điểm mạnh: phủ chức năng rộng, 582 test pass, kiến trúc thực tế.
- Nêu giới hạn biết trước: audio một số POI chưa READY (phụ thuộc Edge-TTS internet), tunnel ngrok không ổn định.
- Mời hội đồng đặt câu hỏi → xem `docs/DEFENSE_QA.md`.

---

## Kế hoạch dự phòng (nếu tunnel hỏng)

| Tình huống | Xử lý |
|---|---|
| Tunnel ngrok hết hạn | Chạy `pwsh scripts/start-demo.ps1` → ngrok URL mới → cập nhật `VITE_API_BASE_URL` → build lại hoặc dùng localhost |
| Audio không phát | Chuyển về speechSynthesis — vẫn có thuyết minh, giải thích rõ fallback |
| CI đỏ | Mở log `gh run view --log-failed`, giải thích flaky test môi trường |
| Vercel không tải | Dùng `http://localhost:8088` (Docker frontend) làm backup |
