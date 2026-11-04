# Sao lưu và khôi phục audio-storage-data

Audio TTS nằm trong Docker volume `nhom3_cnpm_audio-storage-data`, mount tại
`/app/storage/audio` của `translation-tts-service`. Volume này **không** nằm trong
repo và không được commit. Hai cặp script dưới đây stream dữ liệu qua
`docker compose exec`, nên không cần biết mountpoint thật của Docker Desktop.

| Nền tảng | Sao lưu | Khôi phục |
|---|---|---|
| Bash / Git Bash / Linux | `scripts/backup-audio.sh` | `scripts/restore-audio.sh` |
| Windows PowerShell | `scripts/backup-audio.ps1` | `scripts/restore-audio.ps1` |

Mặc định file backup ghi vào `$HOME/echora-backups` (ngoài repo). Có thể đổi
bằng tham số hoặc biến môi trường `BACKUP_DIR` (bản bash).

## 1. Sao lưu

```bash
./scripts/backup-audio.sh
./scripts/backup-audio.sh /mnt/backups/echora
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup-audio.ps1
powershell -ExecutionPolicy Bypass -File scripts/backup-audio.ps1 -BackupDir D:\echora-backups
```

Kết quả chạy thật (Windows):

```text
Dang sao luu /app/storage/audio tu translation-tts-service...
OK: C:\Users\LENOVO\echora-backups\audio-storage-20261104-095512.tar.gz
    28 file .mp3, 15.46 MB
```

Script kiểm tra:

- service đang chạy;
- file backup khác rỗng;
- `tar -tzf` đọc được archive;
- đếm số file `.mp3`.

## 2. Khôi phục

```bash
./scripts/restore-audio.sh /mnt/backups/echora/audio-storage-20261104-095512.tar.gz
```

```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-audio.ps1 `
  -Archive C:\Users\LENOVO\echora-backups\audio-storage-20261104-095512.tar.gz
```

Restore ghi đè file trùng tên nhưng không xoá file đang có mà archive không chứa.
Muốn khôi phục đúng trạng thái tại thời điểm backup thì nên dừng service, xoá
nội dung volume rồi restore — chỉ làm khi đã xác nhận archive hợp lệ.

### Kiểm chứng hai chiều

Đã xoá một file trong volume rồi restore lại, so sánh SHA-256 trước/sau:

```text
before: fcbf682638b9ad7e854f095a02ad781ef46dce1aa17be455d909d80608a96ad2  /app/storage/audio/poi_5_vi_dc595401.mp3
exists after delete: no
OK: đã khôi phục. Hiện có 28 file trong volume.
after:  fcbf682638b9ad7e854f095a02ad781ef46dce1aa17be455d909d80608a96ad2  /app/storage/audio/poi_5_vi_dc595401.mp3
match: True
```

Bản PowerShell cũng đã được chạy độc lập với file
`poi_6_en_22ff0fff.mp3`: xoá → restore → SHA-256 khớp
`5f499fbfbc56ca1aac9e59e05385e1c40243a0a8aa4b2e172a1ccffe5e930b89`.

## 3. Lưu ý

- Archive chứa nội dung audio có thể phục vụ người dùng; cất ở thư mục ngoài repo
  và phân quyền phù hợp, không đưa lên Git.
- Tên archive có timestamp `audio-storage-YYYYmmdd-HHMMSS.tar.gz`; có thể giữ
  nhiều bản và dọn bản cũ theo chính sách riêng.
- Script không backup database hay ảnh sản phẩm; xem ghi chú volume
  `product-uploads-data` trong `docker-compose.yml` nếu cần.
