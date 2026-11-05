#!/usr/bin/env bash
# remote-deploy.sh — Deploy image GHCR lên host đích, kiểm tra health và rollback.
#
# Biến môi trường:
#   IMAGE_TAG   (bắt buộc) tag image, ví dụ sha-abc1234
#   HEALTH_URL  endpoint health, mặc định http://localhost:18080/actuator/health
#   HEALTH_RETRIES / HEALTH_INTERVAL_SECONDS: tuỳ chỉnh thời gian chờ
#
# Chạy từ thư mục gốc repo trên server:
#   IMAGE_TAG=sha-abc1234 ./scripts/deploy/remote-deploy.sh
set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:?IMAGE_TAG is required}"
HEALTH_URL="${HEALTH_URL:-http://localhost:18080/actuator/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-36}"
HEALTH_INTERVAL_SECONDS="${HEALTH_INTERVAL_SECONDS:-5}"
TAG_FILE=".deployed-image-tag"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.deploy.yml)

PREVIOUS_TAG="$(cat "$TAG_FILE" 2>/dev/null || true)"

deploy() {
  local tag="$1"
  echo "[deploy] Pull image tag=${tag}"
  IMAGE_TAG="$tag" "${COMPOSE[@]}" pull
  echo "[deploy] Apply tag=${tag}"
  IMAGE_TAG="$tag" "${COMPOSE[@]}" up -d --no-build --remove-orphans
}

wait_healthy() {
  local attempt
  for ((attempt = 1; attempt <= HEALTH_RETRIES; attempt++)); do
    if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
      echo "[deploy] Health OK sau ${attempt} lần thử."
      return 0
    fi
    sleep "$HEALTH_INTERVAL_SECONDS"
  done
  return 1
}

echo "[deploy] Bắt đầu deploy tag=${IMAGE_TAG}"
deploy "$IMAGE_TAG"

if wait_healthy; then
  echo "$IMAGE_TAG" > "$TAG_FILE"
  echo "[deploy] Deploy thành công tag=${IMAGE_TAG}"
  exit 0
fi

echo "[deploy] Health check thất bại cho tag=${IMAGE_TAG}" >&2

if [[ -n "$PREVIOUS_TAG" && "$PREVIOUS_TAG" != "$IMAGE_TAG" ]]; then
  echo "[deploy] Rollback về tag=${PREVIOUS_TAG}" >&2
  deploy "$PREVIOUS_TAG"
  if wait_healthy; then
    echo "[deploy] Rollback thành công về tag=${PREVIOUS_TAG}" >&2
  else
    echo "[deploy] Rollback cũng thất bại — cần can thiệp thủ công." >&2
  fi
else
  echo "[deploy] Không có tag trước đó để rollback." >&2
fi

exit 1
