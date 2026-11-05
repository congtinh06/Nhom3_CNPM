#!/usr/bin/env bash
# Khôi phục volume audio-storage-data từ file tar.gz do backup-audio.sh tạo.
#
# Dùng:
#   ./scripts/restore-audio.sh /duong/dan/audio-storage-YYYYmmdd-HHMMSS.tar.gz
#
# Script ghi đè file trùng tên trong /app/storage/audio nhưng không xoá file
# đang có mà archive không chứa.

set -euo pipefail

# Git Bash (MSYS) tự đổi /app/... thành C:/...; tắt để docker nhận đúng path container.
export MSYS_NO_PATHCONV=1

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

ARCHIVE="${1:?Dùng: ./scripts/restore-audio.sh <file.tar.gz>}"
SERVICE="${TTS_SERVICE:-translation-tts-service}"

if [ ! -f "$ARCHIVE" ]; then
  echo "LỖI: không tìm thấy file backup: $ARCHIVE" >&2
  exit 1
fi

if ! tar -tzf "$ARCHIVE" >/dev/null 2>&1; then
  echo "LỖI: file không phải tar.gz hợp lệ: $ARCHIVE" >&2
  exit 1
fi

if ! docker compose ps --status running --services | grep -qx "$SERVICE"; then
  echo "LỖI: service '$SERVICE' chưa chạy. Hãy chạy 'docker compose up -d $SERVICE' trước." >&2
  exit 1
fi

echo "Đang khôi phục $ARCHIVE vào /app/storage/audio của $SERVICE..."
docker compose exec -T "$SERVICE" tar xzf - -C /app/storage/audio < "$ARCHIVE"

FILE_COUNT=$(docker compose exec -T "$SERVICE" sh -c 'find /app/storage/audio -type f | wc -l' | tr -d '\r')
echo "OK: đã khôi phục. Hiện có $FILE_COUNT file trong volume."
