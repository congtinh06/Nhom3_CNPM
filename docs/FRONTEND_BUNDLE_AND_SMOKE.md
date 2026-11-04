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
