#!/usr/bin/env bash
# Sao lưu volume audio-storage-data ra file tar.gz nằm NGOÀI repo.
#
# Dùng:
#   ./scripts/backup-audio.sh [thư-mục-đích]
#   BACKUP_DIR=/mnt/backups ./scripts/backup-audio.sh
#
# Mặc định: $HOME/echora-backups. Script stream dữ liệu từ container
# translation-tts-service nên không cần mount đường dẫn host vào Docker.

set -euo pipefail

# Git Bash (MSYS) tự đổi /app/... thành C:/...; tắt để docker nhận đúng path container.
export MSYS_NO_PATHCONV=1

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

SERVICE="${TTS_SERVICE:-translation-tts-service}"
BACKUP_DIR="${1:-${BACKUP_DIR:-$HOME/echora-backups}}"
STAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$BACKUP_DIR/audio-storage-$STAMP.tar.gz"

if ! docker compose ps --status running --services | grep -qx "$SERVICE"; then
  echo "LỖI: service '$SERVICE' chưa chạy. Hãy chạy 'docker compose up -d $SERVICE' trước." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Đang sao lưu /app/storage/audio từ $SERVICE..."
docker compose exec -T "$SERVICE" tar czf - -C /app/storage/audio . > "$ARCHIVE"

if [ ! -s "$ARCHIVE" ]; then
  rm -f "$ARCHIVE"
  echo "LỖI: file backup rỗng, đã xoá." >&2
  exit 1
fi

if ! tar -tzf "$ARCHIVE" >/dev/null 2>&1; then
  echo "LỖI: file backup không phải tar.gz hợp lệ: $ARCHIVE" >&2
  exit 1
fi

FILE_COUNT=$(tar -tzf "$ARCHIVE" | grep -c '\.mp3$' || true)
SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "OK: $ARCHIVE"
echo "    $FILE_COUNT file .mp3, $SIZE"
echo "Khôi phục bằng: ./scripts/restore-audio.sh \"$ARCHIVE\""
