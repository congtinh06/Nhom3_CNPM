# Khôi phục volume audio-storage-data từ file tar.gz do backup-audio.ps1 tạo.
#
# Dùng:
#   powershell -ExecutionPolicy Bypass -File scripts/restore-audio.ps1 -Archive C:\echora-backups\audio-storage-....tar.gz
#
# Script ghi đè file trùng tên trong /app/storage/audio nhưng không xoá file
# đang có mà archive không chứa.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Archive,
    [string]$Service = 'translation-tts-service'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    if (-not (Test-Path -LiteralPath $Archive -PathType Leaf)) {
        throw "Không tìm thấy file backup: $Archive"
    }
    $Archive = (Resolve-Path -LiteralPath $Archive).Path

    $null = & tar -tzf $Archive 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "File không phải tar.gz hợp lệ: $Archive"
    }

    $running = & docker compose ps --status running --services 2>$null
    if ($LASTEXITCODE -ne 0 -or ($running -notcontains $Service)) {
        throw "Service '$Service' chưa chạy. Hãy chạy 'docker compose up -d $Service' trước."
    }

    Write-Host "Đang khôi phục $Archive vào /app/storage/audio của $Service..."
    $cmdLine = 'docker compose exec -T {0} tar xzf - -C /app/storage/audio < "{1}"' -f $Service, $Archive
    & cmd.exe /d /c $cmdLine
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose exec thất bại (exit $LASTEXITCODE)."
    }

    $fileCount = (& docker compose exec -T $Service sh -c 'find /app/storage/audio -type f | wc -l').Trim()
    Write-Host "OK: đã khôi phục. Hiện có $fileCount file trong volume."
}
finally {
    Pop-Location
}
