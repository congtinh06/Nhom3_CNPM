# Đo bundle frontend và smoke test production

Tài liệu này ghi lại số đo thật của `npm run build` trước/sau khi sửa
`manualChunks`, và cách CI kiểm tra bản production bằng Playwright.

## 1. Bối cảnh

Cấu hình cũ tách `node_modules` thành nhiều chunk (`vendor-react`, `vendor-charts`,
`vendor-map`, ...). Rollup cảnh báo vòng chunk:

```text
Circular chunk: vendor -> vendor-react -> vendor
Circular chunk: vendor -> vendor-charts -> vendor
```

Vòng import này làm React chưa khởi tạo khi `recharts` gọi `React.forwardRef` ở
top-level, khiến `/gan-toi` trắng trang trên bản production. Cấu hình hiện tại giữ
toàn bộ `node_modules` trong một chunk `vendor` duy nhất.

## 2. Số đo bundle (cùng mã nguồn, chỉ khác `manualChunks`)

Lệnh: `cd frontend; npm run build` (Vite 5.4.21, 2.711 module).

### Trước — tách nhiều vendor chunk

| Asset | Raw (kB) | Gzip (kB) |
|---|---:|---:|
| `vendor-charts-*.js` | 339,91 | 85,71 |
| `vendor-map-*.js` | 154,90 | 45,28 |
| `vendor-react-*.js` | 138,17 | 44,21 |
| `vendor-motion-*.js` | 134,78 | 50,84 |
| `vendor-*.js` | 86,35 | 31,76 |
| `vendor-qr-*.js` | 77,51 | 22,53 |
| `vendor-http-*.js` | 51,45 | 19,50 |
| `vendor-icons-*.js` | 28,19 | 5,39 |
| `vendor-router-*.js` | 14,22 | 5,17 |
| `index-*.js` | 530,75 | 171,62 |
| **Tổng JS** | **1.556,23** | **482,01** |

Build in `1m 13s`; có 2 cảnh báo circular chunk ở trên.

### Sau — một vendor chunk

| Asset | Raw (kB) | Gzip (kB) |
|---|---:|---:|
| `vendor-*.js` | 1.029,52 | 309,70 |
| `index-*.js` | 530,15 | 171,49 |
| **Tổng JS** | **1.559,67** | **481,19** |

Build in `1m 21s`; không còn cảnh báo circular chunk.

**Kết luận:** thay đổi này gần như không đổi dung lượng (tổng gzip giảm 0,82 kB,
raw tăng 3,44 kB). Giá trị của nó là sửa lỗi thứ tự khởi tạo module, không phải
tối ưu kích thước. Vì vậy không cần kỳ vọng bundle nhỏ hơn sau thay đổi.

## 2b. Code-split route + tách recharts (đo lại 2026-11-04)

Lần này thay đổi thật sự ảnh hưởng kích thước chunk đầu vào:

- Toàn bộ trang (kể cả `HomePage`, `NearbyPage`, các trang admin) được `React.lazy`
  + `Suspense`; `App.tsx` chỉ còn layout/context dùng chung.
- `recharts`, `victory-vendor`, `d3-*` được tách khỏi `vendor` thành `vendor-charts`.
  `index.html` chỉ preload `vendor`; `vendor-charts` chỉ được import bởi
  `AdminOverviewPage`/`QrAnalyticsPage`, nên chỉ tải khi mở trang admin có biểu đồ.
  Không còn vòng import `vendor -> vendor-charts -> vendor` (build không cảnh báo
  circular chunk; smoke `/` và `/gan-toi` xanh).

Cùng mã nguồn, chỉ khác `App.tsx` + `manualChunks`:

### Bảng so sánh thống nhất (Chuẩn đo: `npm run build` — Vite 5.4.21)

| Asset / Thành phần | Raw trước (kB) | Raw sau (kB) | Gzip trước (kB) | Gzip sau (kB) | Biến động Raw | Biến động Gzip |
|---|---:|---:|---:|---:|---:|---:|
| `index-*.js` (entry bundle) | 530,15 | **155,99** | 171,49 | **53,25** | -70,58% | -68,95% |
| `vendor-*.js` (core vendor) | 1.029,52 | 693,11 | 309,70 | 225,25 | -32,68% | -27,27% |
| `vendor-charts-*.js` (charts) | — (gộp trong vendor) | 334,19 | — | 84,22 | Tách mới | Tách mới |
| `NearbyPage-*.js` | — (gộp trong index) | 109,52 | — | 38,90 | Tách mới | Tách mới |
| `PremiumPage-*.js` | — (gộp trong index) | 40,73 | — | 15,07 | Tách mới | Tách mới |
| `HomePage-*.js` | — (gộp trong index) | 30,27 | — | 12,88 | Tách mới | Tách mới |
| **Tải trang ban đầu (`index` + `vendor`)** | **1.559,67** | **849,10** | **481,19** | **278,50** | **-45,56%** | **-42,12%** |
| **Tổng JS (toàn bộ các chunk)** | **1.559,67** | **1.842,67** | **481,19** | **598,63** | **+18,14%** | **+24,41%** |

*Ghi chú đánh giá*:
1. Entry bundle `index-*.js` giảm từ **530,15 kB xuống 155,99 kB** (gzip từ 171,49 kB xuống 53,25 kB), vượt xa mục tiêu dưới 300 kB (giảm hơn 70%).
2. Khối lượng tải khởi tạo ban đầu cho người dùng giảm gần một nửa (từ 1,56 MB xuống 849 kB raw; gzip chỉ còn 278 kB).
3. Tổng JS toàn ứng dụng tăng 18,14% do phân rã thành 86 chunk tải lười riêng biệt (chi phí runtime wrapper và metadata import của Vite/Rollup), nhưng người dùng thông thường chỉ tải các chunk thuộc route mà họ ghé thăm, tiết kiệm đáng kể tài nguyên mạng.

## 2c. Đo lượng JS tải thực tế qua mạng khi mở trang đầu (Playwright)

Để đo chính xác lượng JavaScript mà trình duyệt tải về trong lần truy cập đầu tiên (cold load) mà không tính các chunk tải lười của các trang khác, script `frontend/scripts/measure-bundle-network.mjs` sử dụng Playwright (Chromium headless) mở từng route trong browser context mới:

- **Phương pháp đo**:
  1. Khởi chạy `vite preview` ở chế độ production trên cổng cách ly `4175`.
  2. Dùng Playwright tạo context mới (cache trống, giả lập người dùng mới truy cập).
  3. Lắng nghe toàn bộ sự kiện network `response` đối với các file `.js` từ `/assets/`.
  4. Truy cập tuyến đường (`/` hoặc `/gan-toi`), chờ `networkidle` và React render xong.
  5. Tính tổng dung lượng raw bytes và gzip bytes (compression level 9) của tất cả chunk JS thực tế được tải.

### Kết quả đo thực tế cho `/` và `/gan-toi`

| Tuyến đường (Route) | Số chunk JS tải | Danh sách chunk tải về | JS Raw tải thực tế (kB) | JS Gzip tải thực tế (kB) | So với trước khi code-split (1.559,67 kB raw / 481,19 kB gzip) |
|---|---:|---|---:|---:|---:|
| `/` (Trang chủ) | 7 | `index`, `vendor`, `HomePage`, `NewsCardLink`, `domain`, `feedbackService`, `demoMode` | **894,66** | **289,15** | **Giảm 42,64% raw (-665,01 kB)**<br>**Giảm 39,91% gzip (-192,04 kB)** |
| `/gan-toi` (Bản đồ / POI) | 8 | `index`, `vendor`, `NearbyPage`, `souvenir`, `PageHero`, `useFavorites`, `placeQrContent`, `demoMode` | **969,34** | **311,45** | **Giảm 37,85% raw (-590,33 kB)**<br>**Giảm 35,28% gzip (-169,74 kB)** |

*Nhận xét*:
- `vendor-charts-*.js` (326 kB raw / 82 kB gzip) và toàn bộ các trang quản trị admin hoàn toàn **không bị tải** khi người dùng truy cập trang chủ hoặc bản đồ lân cận.
- Lượng dữ liệu mạng chuyển tải trên mỗi phiên duyệt giảm từ ~481 kB gzip xuống dưới 312 kB gzip, giúp thời gian tương tác (TTI - Time to Interactive) trên thiết bị di động được cải thiện rõ rệt.

## 3. Smoke test production bằng Playwright

Script: `frontend/scripts/smoke-preview.mjs` (chạy bằng `npm run smoke:preview`).

Script tự:

1. spawn `vite preview` ở `127.0.0.1:4173` (strict port);
2. mở Chromium headless, cấp geolocation Hà Nội;
3. stub `**/api/**`, `/img/**`, Google Fonts và tile OSM để test không phụ thuộc
   backend/mạng ngoài;
4. mở `/` và `/gan-toi`;
5. fail nếu HTTP khác 200, `#root` không có con, nội dung render < 20 ký tự
   (trang trắng), có `console.error` hoặc `pageerror`.

Kết quả chạy thật:

```text
[smoke] / status=200 rootChildren=4 rootText=2257 bodyText=2257 consoleErrors=0 pageErrors=0
[smoke] /gan-toi status=200 rootChildren=4 rootText=901 bodyText=901 consoleErrors=0 pageErrors=0

[smoke] PASSED: / and /gan-toi render without console errors.
```

CI `.github/workflows/frontend-ci.yml` chạy sau bước build:

```yaml
- name: Install Playwright Chromium
  run: npx playwright install --with-deps chromium

- name: Smoke Test Production Preview
  run: npm run smoke:preview
```

Với build tách vendor cũ, `/gan-toi` ném lỗi
`Cannot access '...' before initialization` và `#root` rỗng, nên bước smoke sẽ
fail đúng như thiết kế.
