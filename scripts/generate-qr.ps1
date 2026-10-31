param(
    [string]$PublicDomain = $env:ECHORA_PUBLIC_DOMAIN,
    [string]$OutputDir = "docs/qr",
    [switch]$FromSeedOnly,
    [switch]$WhatIf
)

<#
.SYNOPSIS
    Tạo bộ mã QR cho các điểm du lịch (POI) của Echora.
    URL mã QR được mã hóa theo dạng: https://<public-domain>/qr/<qrToken>

.DESCRIPTION
    Script đọc public domain từ biến môi trường ECHORA_PUBLIC_DOMAIN hoặc tham số -PublicDomain.
    Nếu chưa có domain chính thức, script báo rõ yêu cầu và hướng dẫn người dùng cung cấp.
    Hỗ trợ -WhatIf để kiểm tra cấu hình mà không tạo file.

.EXAMPLE
    pwsh scripts/generate-qr.ps1 -WhatIf
    pwsh scripts/generate-qr.ps1 -PublicDomain "https://echora.vercel.app"
    $env:ECHORA_PUBLIC_DOMAIN = "https://echora.vercel.app"; pwsh scripts/generate-qr.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=== Echora QR Code Generator (T5.3) ===" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrWhiteSpace($PublicDomain)) {
    Write-Host "[!] CẢNH BÁO: Chưa có ECHORA_PUBLIC_DOMAIN hoặc tham số -PublicDomain." -ForegroundColor Yellow
    Write-Host "    Để tạo mã QR trỏ đúng domain demo thật, cần domain chính thức từ chủ dự án (Vercel)." -ForegroundColor Yellow
    Write-Host "    Ví dụ: pwsh scripts/generate-qr.ps1 -PublicDomain `"https://echora.vercel.app`"" -ForegroundColor Yellow
    Write-Host "    (Ghi nhận mục này vào 'Needs the owner')." -ForegroundColor Yellow
    Write-Host ""
    if ($WhatIf) {
        Write-Host "[-WhatIf Mode] Kiểm tra giả lập với domain tạm https://echora.example.com..." -ForegroundColor Cyan
        $PublicDomain = "https://echora.example.com"
    } else {
        exit 1
    }
}

if ($WhatIf) {
    Write-Host "[-WhatIf] Dự kiến tạo QR cho các POI trỏ tới: $PublicDomain/qr/<qrToken>" -ForegroundColor Green
    Write-Host "[-WhatIf] Thư mục đầu ra dự kiến: $OutputDir" -ForegroundColor Green
    Write-Host "[-WhatIf] Thành công (dry-run)." -ForegroundColor Green
    exit 0
}

$scriptPath = Join-Path $PSScriptRoot "generate-qr.mjs"
if (-not (Test-Path $scriptPath)) {
    Write-Error "Không tìm thấy file: $scriptPath"
    exit 1
}

$env:ECHORA_PUBLIC_DOMAIN = $PublicDomain
$env:QR_OUTPUT_DIR = $OutputDir

$nodeArgs = @($scriptPath, $PublicDomain)
if ($FromSeedOnly) {
    $nodeArgs += "--from-seed"
}

Write-Host "Đang sinh mã QR với Node.js..." -ForegroundColor Cyan
node @nodeArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Hoàn tất tạo mã QR thành công tại: $OutputDir" -ForegroundColor Green
} else {
    Write-Error "Lỗi khi chạy generate-qr.mjs (ExitCode: $LASTEXITCODE)"
    exit $LASTEXITCODE
}
