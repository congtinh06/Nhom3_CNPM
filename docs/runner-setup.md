# Self-hosted runner cho CD

CD deploy chạy trên máy chủ của nhóm qua GitHub Actions self-hosted runner.
Runner chạy trong phiên đăng nhập của chủ máy để dùng được Docker Desktop.

## 1. Cài runner

1. GitHub repo > Settings > Actions > Runners > New self-hosted runner > Windows x64.
2. Tạo thư mục `C:\actions-runner`, tải và giải nén gói runner vào đó.
3. Trong PowerShell tại `C:\actions-runner`:

   ```powershell
   .\config.cmd --url https://github.com/congtinh06/Nhom3_CNPM --token <TOKEN> --labels echora --name echora-win
   ```

   `<TOKEN>` lấy từ trang New self-hosted runner (hết hạn sau khoảng 1 giờ).
4. Kiểm tra: `.\run.cmd` hiện "Listening for Jobs", runner ở trạng thái Idle trong Settings > Actions > Runners.

## 2. Chạy khi đăng nhập (Task Scheduler)

1. Task Scheduler > Create Task.
2. General: chọn "Run only when user is logged on".
3. Triggers: "At log on" của tài khoản chủ máy.
4. Actions: Start a program `C:\actions-runner\run.cmd`, Start in `C:\actions-runner`.
5. Không cài thành Windows service: Docker Desktop chạy theo phiên người dùng.

## 3. Nhãn và biến

- Nhãn: mặc định `self-hosted`, `Windows`, `X64`; thêm `echora`.
- `cd.yml` dùng `runs-on: [self-hosted, echora]`.
- Repo variables: `HEALTH_URL` (URL công khai qua ngrok dùng cho smoke test, ví dụ
  `https://<id>.ngrok-free.dev/api/content/products?size=1&sortBy=sortOrder`), `DEPLOY_DIR`
  (ví dụ `F:\echora-deploy`).
- Tunnel ngrok phải trỏ vào **frontend container** (`FRONTEND_HOST_PORT`, mặc định `8088`),
  không trỏ vào Vite dev `5173`: nginx của frontend phục vụ cả SPA lẫn proxy `/api/**`
  sang gateway, và container luôn chạy sau deploy. Nếu tunnel trỏ vào Vite mà Vite đã tắt,
  ngrok trả `502 Bad Gateway`.
- Job `deploy` có step `Ensure public tunnel points at the deployed frontend`
  (`scripts/deploy/ensure-ngrok-tunnel.ps1`) tự kiểm tra và khởi động lại ngrok đúng port
  trước khi chạy smoke test.

## 4. Cài đặt repo

- Settings > Actions > General > Fork pull request workflows: "Require approval for all outside collaborators".
- Settings > Environments > `production`: required reviewer và deployment branches chỉ `main`.
- Repo là public nên không workflow nào được chạy `pull_request` từ fork trên runner này.
  Hiện chỉ job deploy trong `cd.yml` dùng self-hosted và chỉ chạy khi push lên `main`.
