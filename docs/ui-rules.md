# QUY TẮC HIỂN THỊ VĂN BẢN & ICON (UI TEXT RULES)

Áp dụng cho toàn bộ giao diện **Echora** (trang du khách và khu vực `/quan-tri`).
Mục tiêu: giao diện tối giản, không dùng ký tự trang trí trong nội dung hiển thị.

---

## 1. Ký tự bị cấm trong văn bản hiển thị

Không dùng các ký tự sau trong chuỗi i18n, JSX text, placeholder, aria-label, title:

| Ký tự | Tên | Ghi chú |
| --- | --- | --- |
| `·` `•` `‣` `‧` | dấu phân cách giữa | tách thông tin bằng khoảng trắng / dòng mới / dấu phẩy |
| `—` `–` `―` | gạch ngang dài | không dùng làm ký tự trang trí / nối từ |
| `← → ↑ ↓ ↗ ↘ ↖ ↙` | mũi tên chữ | thay bằng icon SVG (mục 3) |
| `› ‹ » «` | ngoặc nhọn | breadcrumb dùng icon/`/` hoặc bỏ |
| `✓ ✔ ✗ ✘` | dấu tick / chéo | thay bằng icon (mục 3) |
| `★ ☆` | ngôi sao | dùng icon |
| `▶ ◀ ■ ● ▪ ❘ ❙ ❚` | ký hiệu play/pause/ô | thay bằng icon |
| emoji | mọi emoji | không dùng |

## 2. Quy tắc tách thông tin & giá trị rỗng

- Tách các mảnh thông tin bằng **khoảng trắng / dòng mới / dấu phẩy**. Ví dụ:
  - `Điểm dừng, 7 địa điểm`
  - `điểm dừng #2, Tuyến trung tâm`
  - `TP. Hồ Chí Minh, 10/2026`
- Ô bảng **không có giá trị**: hiển thị dấu `-` (hyphen), không dùng `—`.
- Khoảng giá / khoảng thời gian: dùng `-` (hyphen). Ví dụ `50.000đ - 100.000đ`, `8h - 23h`.
- Dấu `/` trong `Tuyến / Thứ tự`, `n / 5` được phép giữ.

## 3. Icon thay cho ký tự

- Chỉ dùng bộ icon **`lucide-react`** (đã có sẵn trong dự án) để đồng nhất bộ icon, kích thước và màu.
- Mũi tên điều hướng: `ChevronLeft`, `ChevronRight`, `ChevronUp`, `ChevronDown`.
- Dấu tick: `Check` / `CheckCircle2`.
- `BackToTop` và link "về đầu trang": chữ + `ChevronUp`, không dùng `↑`.
- Nút "Quay lại": dùng `ChevronLeft` + nhãn chữ, không dùng `←`.
- Icon trang trí phải có `aria-hidden="true"` (hoặc `aria-hidden` khi là SVG thủ công).

## 4. Dấu `...`

- **Placeholder / nhãn tĩnh**: **bỏ** dấu `...`.
  - `Nhập tên điểm đến` (không phải `Nhập tên điểm đến...`)
- **Trạng thái đang tải**: **giữ** dấu `...`.
  - `Đang tải...`, `Đang xử lý...`, `Loading...`

## 5. Nội dung demo (đang chờ duyệt)

Các nội dung sau **cố ý giữ nguyên** (chưa đổi), đang chờ duyệt:
- `frontend/src/content/newsFixtures.ts`: gạch ngang trong tiêu đề/prose bài viết demo.
- `frontend/src/content/staticSections.ts`: câu `introContent.paragraph` (chứa `Sài Gòn – TP. Hồ Chí Minh`).

Nếu duyệt bỏ, xử lý và gỡ khỏi allowlist trong guard (mục 6).

## 6. Cơ chế kiểm tra tự động (guard)

Test guard: `frontend/src/test/uiTextGuard.test.ts`

- Quét mọi file `.ts` / `.tsx` trong `frontend/src` (bỏ qua thư mục `test/`), gồm:
  1. Chuỗi ký tự (string literals).
  2. JSX text nodes.
  3. `placeholder="..."` và key `*Placeholder` (chặn dấu `...`).
- Bỏ qua nội dung trong comment.
- Allowlist: `newsFixtures.ts` và câu prose nêu ở mục 5.

Chạy:

```bash
cd frontend
npx vitest run src/test/uiTextGuard.test.ts
```

Guard fail nghĩa là có ký tự trang trí mới được thêm vào UI.

## 7. Checklist khi thêm/sửa UI

- [ ] Không thêm ký tự trong mục 1 vào chuỗi hiển thị.
- [ ] Mũi tên / tick dùng icon `lucide-react`, có `aria-hidden`.
- [ ] Ô rỗng dùng `-`; khoảng giá/thời gian dùng `-`.
- [ ] Placeholder không có `...`; trạng thái tải giữ `...`.
- [ ] Chạy guard ở mục 6 trước khi commit.

## 8. Quy tắc riêng khu vực quản trị (`/quan-tri`)

### 8.1. Nhãn trạng thái (chip/badge)

- **Bỏ hoàn toàn chấm tròn** trong mọi chip, badge, nhãn trạng thái. Không thay bằng ký tự nào khác.
- Dùng chung một component `frontend/src/admin/components/StatusBadge.tsx` cho tất cả trang admin, với 4 biến thể:
  - `neutral`: trạng thái bình thường, chữ trơn màu xám, **không nền, không viền**.
  - `muted`: trạng thái ẩn / tạm ngưng, chữ xám đậm hơn, không nền, không viền.
  - `warning`: trạng thái cần chú ý, **nền vàng nhạt**, không viền.
  - `danger`: trạng thái lỗi, **nền đỏ nhạt**, không viền.
- Chỉ trạng thái **cần chú ý / lỗi** mới có nền; mọi trạng thái còn lại chỉ là chữ trơn.
- Không dùng icon cho nhãn trạng thái (trừ khi có yêu cầu riêng).

### 8.2. Nhãn & thuật ngữ

- Toàn bộ nhãn admin dùng **tiếng Việt**.
- **Không lộ thuật ngữ kỹ thuật** ra giao diện: `code` (mã kỹ thuật), `qrToken`, `thumbnail`, `v0`/`v1`... (phiên bản), tên trường DB.
- Tách thông tin phụ bằng khoảng trắng / xuống dòng / dấu phẩy, không dùng dấu phân cách trang trí.

### 8.3. Ô "Thuyết minh đa ngôn ngữ" (trang điểm thuyết minh)

- Hiển thị chữ trơn tóm tắt số ngôn ngữ sẵn sàng (ví dụ `2/4 sẵn sàng`); chỉ thêm nhãn `danger` `N lỗi` khi có lỗi.
- Rê chuột hoặc bấm mở popover liệt kê từng ngôn ngữ: tên tiếng Việt, trạng thái, thời lượng, lý do lỗi, thời điểm thử gần nhất.

### 8.4. Trạng thái tổng hợp của điểm

- `Đang hoạt động` (neutral): không có lý do cần chú ý.
- `Cần chú ý` (warning): có ít nhất một lý do (lỗi audio, phát hành lỗi, chờ quá lâu, thiếu nội dung tiếng Việt, đang bảo trì).
- `Đã ẩn` (muted): điểm đang ở trạng thái `INACTIVE`.
