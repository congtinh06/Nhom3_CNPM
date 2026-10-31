# Câu hỏi Bảo vệ — Echora

15 câu hỏi giảng viên có khả năng hỏi cao nhất, kèm câu trả lời ngắn và dẫn chứng trong mã nguồn.

---

## 1. Vì sao chọn kiến trúc microservices thay vì monolith?

**Trả lời ngắn:** Tách bounded context: auth, content, location, translation/TTS, analytics, order cho phép scale pipeline audio độc lập và cô lập lỗi theo service. Chi phí vận hành cao hơn monolith nhưng phù hợp với đề tài yêu cầu tích hợp RabbitMQ và phân quyền audio.

**Dẫn chứng:** `docker-compose.yml` — 8 service; `docs/ARCHITECTURE.md` sơ đồ thành phần.

---

## 2. Một POI đi từ cơ sở dữ liệu đến tai người dùng như thế nào?

**Trả lời ngắn:** Admin lưu POI → content-service publish `poi.created` vào RabbitMQ → translation-tts-service consume, dịch qua MyMemory, tổng hợp audio Edge-TTS, lưu file MP3 → publish `audio.ready` → content-service cập nhật `audioStatus = READY` → frontend gọi API, thấy READY → stream audio.

**Dẫn chứng:** `PoiEventPublisher.java`, `PoiPipelineServiceImpl.java`, `PoiAudioEventListener.java`, `useNearbyAudio.ts` hàm `resolvePlayback`.

---

## 3. Làm sao chống xử lý trùng (idempotency) khi TTS?

**Trả lời ngắn:** Dùng `contentHash` (hash của văn bản nguồn), unique constraint trên `(poi_id, language_code)` trong `poi_translation`. Nếu insert trùng, bắt `DataIntegrityViolationException` và đọc lại bản ghi đã có — không xử lý lại.

**Dẫn chứng:** `PoiPipelineServiceImpl.java`; migration `V*.sql` constraint.

---

## 4. Audio premium có bị tải lậu không?

**Trả lời ngắn:** Audio `_vi_` miễn phí. Ngôn ngữ khác (en/ja/ko) cần Bearer token hợp lệ + `X-User-Plan = PREMIUM` hoặc POI đã mua lẻ. `AudioEntitlementFilter` trong content-service kiểm tra quyền trước khi stream.

**Dẫn chứng:** `AudioEntitlementFilter.java`; live test anonymous GET `/api/content/pois/1?lang=en` → 403.

---

## 5. Vì sao một số POI vẫn PENDING/FAILED_TTS?

**Trả lời ngắn:** Seed đặt trạng thái ban đầu là PENDING. Worker phụ thuộc Internet/Edge-TTS; một số job fail và retry bị giới hạn. Đây là giới hạn đã biết — dùng script `check-audio-status.ps1` trước demo và endpoint `POST /api/content/admin/audio/regenerate` để tạo lại.

**Dẫn chứng:** `R__seed_demo.sql` dòng 166–263; `PoiPipelineServiceImpl` bounded retry.

---

## 6. Vì sao CI từng đỏ mà local test lại pass?

**Trả lời ngắn:** `header.test.tsx:187` dùng `getByRole('menu')` — test này phụ thuộc vào trạng thái DOM trước đó (order-dependent hoặc môi trường jsdom khác). Đã sửa trong commit `577f07d` và `4048569`. Bây giờ CI đang xanh.

**Dẫn chứng:** `.github/workflows/frontend-ci.yml`; git log commit `577f07d`.

---

## 7. Mật khẩu và secret đang nằm ở đâu?

**Trả lời ngắn:** Trong file `.env` trên máy sinh viên (không commit). `.env.example` chỉ chứa tên khóa, không có giá trị thật. README đã được xóa sạch mật khẩu trong commit `4e46912`.

**Dẫn chứng:** `README.md` mục 5; `.env.example`; `git log 4e46912`.

---

## 8. Deploy thật đang chạy ở đâu?

**Trả lời ngắn:** Frontend deploy trên Vercel (tĩnh), `vercel.json` rewrite `/api/**` sang tunnel ngrok. Backend chạy Docker Compose trên máy sinh viên, ngrok expose gateway port 18080 ra internet. Không có CD tự động đưa lên server — CD chỉ build và push image lên GHCR.

**Dẫn chứng:** `frontend/vercel.json`; `docker-compose.yml`; `.github/workflows/cd.yml`.

---

## 9. Tại sao tin tức vẫn hiển thị khi backend lỗi?

**Trả lời ngắn:** Trước đây có fallback fixture tĩnh. Đã xóa fallback tự động trong commit `f7bb034`. Bây giờ khi API lỗi, trang hiển thị thông báo lỗi và nút thử lại. Fixture chỉ được bật khi đặt `VITE_USE_SAMPLE_DATA=true` trong `.env` frontend.

**Dẫn chứng:** `frontend/src/services/articleService.ts`; `frontend/src/config/demoMode.ts`.

---

## 10. Đo chất lượng và độ tin cậy bằng gì?

**Trả lời ngắn:** 582 test frontend (vitest), 68 file test backend (Maven), `tsc --noEmit` sạch, build thành công. 8 workflow CI. Chưa có coverage threshold — biết là thiếu sót.

**Dẫn chứng:** `npm test` output; GitHub Actions; `README.md` mục 6.

---

## 11. Cơ chế refresh token hoạt động thế nào?

**Trả lời ngắn:** Access token ngắn hạn lưu trong memory. Refresh token xoay vòng (rotation) lưu trong HttpOnly cookie `SameSite=Strict`. Khi access token hết hạn, frontend tự gọi `POST /api/auth/refresh` — cookie được gửi tự động (same-origin qua Vercel rewrite). Sau mỗi lần refresh, server phát refresh token mới và vô hiệu hóa token cũ.

**Dẫn chứng:** `AuthController.java`; `AuthContext.tsx`; `JwtAuthenticationFilter.java`.

---

## 12. Cơ chế rate limit analytics có gây 429 không?

**Trả lời ngắn:** Trước đây dùng socket IP — khi qua ngrok mọi client cùng IP bị throttle chung. Đã sửa trong commit `a95d9fb`: dùng `X-Forwarded-For` đầu tiên (trusted proxy) để lấy IP thật. Ngưỡng 60 req/phút áp dụng per IP thật, không phải per proxy.

**Dẫn chứng:** `AnalyticsRateLimitGlobalFilter.java`; commit `a95d9fb`.

---

## 13. Hệ thống có thể phục hồi khi một service chết không?

**Trả lời ngắn:** Gateway map lỗi kết nối → 503, timeout → 504. RabbitMQ có DLQ cho analytics và TTS. Content-service và translation-tts-service cấu hình `restart: unless-stopped`. Chưa có health-gate tự động retry service dead.

**Dẫn chứng:** `GatewayExceptionHandler.java`; `docker-compose.yml` restart policy; DLQ config.

---

## 14. Vì sao chọn Edge-TTS thay vì Google Cloud TTS?

**Trả lời ngắn:** Edge-TTS miễn phí, không cần credit card, phát âm tiếng Việt tốt (giọng `vi-VN-HoaiMyNeural`). Phụ thuộc Microsoft nhưng không có chi phí phát sinh trong môi trường đồ án.

**Dẫn chứng:** `translation-tts-service application.yml`; `PoiPipelineServiceImpl.java`.

---

## 15. Làm sao kiểm tra toàn bộ hệ thống trước demo?

**Trả lời ngắn:**
1. `pwsh scripts/check-audio-status.ps1` — kiểm tra ma trận POI × ngôn ngữ, exit non-zero nếu có PENDING/FAILED.
2. `GET http://localhost:18080/actuator/health` — gateway lên và route được.
3. Mở Vercel URL → trang chủ tải → thử GPS simulation.
4. Kiểm tra tab CI/CD trên GitHub — tất cả workflow xanh tại HEAD.

**Dẫn chứng:** `scripts/check-audio-status.ps1`; `scripts/start-demo.ps1`.
