# CI/CD pipeline

```mermaid
flowchart LR
  P[push main hoặc tag v*] --> C1[CI frontend]
  P --> C2[CI 7 backend<br/>path filter]
  P --> C3[Config & Environment Check]
  C1 --> BP[build-push<br/>8 image GHCR<br/>latest + sha-7]
  C2 --> BP
  C3 --> BP
  BP --> V[verify-ci<br/>gh run list theo SHA<br/>bỏ workflow không chạy]
  V --> D[self-hosted runner echora<br/>deploy-local.sh<br/>pull + up -d]
  D --> S[Smoke test<br/>vars.HEALTH_URL]
  S -- OK --> SUM[Job summary<br/>tag + kết quả]
  S -- fail --> RB[Rollback<br/>.deployed-image-tag]
  RB --> F[job fail, cần can thiệp tay]
  V -- CI đỏ --> F
  U[Vercel: nhom3-cnpm.vercel.app] -- rewrite /api --> S
```

1. Push lên `main` (hoặc tag `v*`) kích hoạt CD một lần cho mỗi ref, không chạy trên pull request.
2. CI chạy theo path filter cho từng service; workflow không được trigger cho SHA đó là bỏ qua, không phải lỗi.
3. `build-push` build 8 image và đẩy GHCR với hai tag: `latest` và `sha-<7>`.
4. `verify-ci` poll `gh run list` của đúng SHA, lấy attempt mới nhất mỗi workflow, fail nếu có workflow đã chạy mà không xanh.
5. Deploy chạy trên self-hosted runner `echora` của máy chủ, chỉ khi push `main`, qua environment `production`.
6. `deploy-local.sh` pull đúng tag `sha-<7>` rồi chạy Compose với `docker-compose.deploy.yml`, không build lại.
7. Smoke test gọi `vars.HEALTH_URL` (ngrok công khai) có retry; fail thì job fail.
8. Nếu health fail sau deploy, script rollback về tag trong `.deployed-image-tag` rồi thoát khác 0.
9. Frontend Vercel `https://nhom3-cnpm.vercel.app` rewrite `/api/*` sang backend ngrok.
10. Job summary ghi commit, image tag, deploy dir, health URL, kết quả smoke test và trạng thái job.
