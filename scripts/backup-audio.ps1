# Sao lưu volume audio-storage-data ra file tar.gz nằm NGOÀI repo (Windows).
#
# Dùng:
#   powershell -ExecutionPolicy Bypass -File scripts/backup-audio.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/backup-audio.ps1 -BackupDir D:\echora-backups
#
# Mặc định: $HOME\echora-backups. Script stream dữ liệu từ container
# translation-tts-service nên không cần mount đường dẫn host vào Docker.

[CmdletBinding()]
param(
    [string]$BackupDir = (Join-Path $HOME 'echora-backups'),
    [string]$Service = 'translation-tts-service'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    $running = & docker compose ps --status running --services 2>$null
    if ($LASTEXITCODE -ne 0 -or ($running -notcontains $Service)) {
        throw "Service '$Service' chưa chạy. Hãy chạy 'docker compose up -d $Service' trước."
    }

    if (-not (Test-Path -LiteralPath $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    $BackupDir = (Resolve-Path -LiteralPath $BackupDir).Path
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $archive = Join-Path $BackupDir "audio-storage-$stamp.tar.gz"

    Write-Host "Đang sao lưu /app/storage/audio từ $Service..."
    $cmdLine = 'docker compose exec -T {0} tar czf - -C /app/storage/audio . > "{1}"' -f $Service, $archive
    & cmd.exe /d /c $cmdLine
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose exec thất bại (exit $LASTEXITCODE)."
    }
    if (-not (Test-Path -LiteralPath $archive) -or (Get-Item -LiteralPath $archive).Length -eq 0) {
        Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
        throw 'File backup rỗng, đã xoá.'
    }

    $entries = & tar -tzf $archive 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "File backup không phải tar.gz hợp lệ: $archive"
    }
    $mp3Count = @($entries | Where-Object { $_ -match '\.mp3$' }).Count
    $sizeMb = [math]::Round((Get-Item -LiteralPath $archive).Length / 1MB, 2)

    Write-Host "OK: $archive"
    Write-Host "    $mp3Count file .mp3, $sizeMb MB"
    Write-Host "Khôi phục bằng: powershell -ExecutionPolicy Bypass -File scripts/restore-audio.ps1 -Archive `"$archive`""
}
finally {
    Pop-Location
}
