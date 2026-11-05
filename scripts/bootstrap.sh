#!/usr/bin/env bash
# bootstrap.sh — Chạy toàn bộ Echora trên Linux/macOS bằng một lệnh.
#   bash scripts/bootstrap.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo '[bootstrap] 1/3 Sinh .env và frontend/.env...'
node scripts/setup-env.mjs

echo '[bootstrap] 2/3 Kiểm tra cấu hình...'
node scripts/check-env.mjs

echo '[bootstrap] 3/3 Build và khởi động Docker Compose...'
docker compose up -d --build
docker compose ps

echo ''
echo '[bootstrap] Xong. Kiểm tra:'
echo '  Gateway : http://localhost:18080/actuator/health'
echo '  Web     : http://localhost:8088/'
