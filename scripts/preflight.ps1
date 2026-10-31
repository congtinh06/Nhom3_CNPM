param(
    [string]$BaseUrl = $env:ECHORA_BASE_URL,
    [string]$AdminToken = $env:ECHORA_ADMIN_TOKEN,
    [switch]$WhatIf
)

<#
.SYNOPSIS
    Kiểm tra sức khỏe toàn bộ hệ thống Echora trước demo (GET only, không sửa dữ liệu).
    Thoát với code 0 nếu tất cả pass, code 1 nếu có bất kỳ lỗi nào.

.PARAMETER BaseUrl
    URL gốc gateway. Mặc định: $env:ECHORA_BASE_URL hoặc http://localhost:18080.

.PARAMETER AdminToken
    Bearer token của Admin. Lấy từ $env:ECHORA_ADMIN_TOKEN.

.PARAMETER WhatIf
    In danh sách kiểm tra mà không thực thi.

.EXAMPLE
    $env:ECHORA_ADMIN_TOKEN = '<token>'
    pwsh scripts/preflight.ps1

.EXAMPLE
    pwsh scripts/preflight.ps1 -WhatIf
#>

$ErrorActionPreference = 'Continue'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:18080'
}

$checks = [System.Collections.Generic.List[hashtable]]::new()

$checks.Add(@{
    Name = 'Gateway actuator/health'
    Url  = "$BaseUrl/actuator/health"
    Auth = $false
    Expect = { param($r) $r.status -eq 'UP' }
    ExpectDesc = 'status == UP'
})

$checks.Add(@{
    Name = 'Content API: danh sách POI'
    Url  = "$BaseUrl/api/content/pois/guide"
    Auth = $false
    Expect = { param($r) ($r -is [array] -and $r.Count -gt 0) -or ($r.pois -is [array] -and $r.pois.Count -gt 0) }
    ExpectDesc = 'trả mảng POI không rỗng'
})

$checks.Add(@{
    Name = 'Audio status (admin)'
    Url  = "$BaseUrl/api/content/admin/audio/status"
    Auth = $true
    Expect = { param($r) $r.allReady -eq $true }
    ExpectDesc = 'allReady == true'
})

if ($WhatIf) {
    Write-Host "[WhatIf] Danh sách kiểm tra preflight ($($checks.Count) mục):"
    $checks | ForEach-Object { Write-Host "  - $($_.Name): $($_.Url)" }
    exit 0
}

if ($checks | Where-Object Auth | Select-Object -First 1) {
    if ([string]::IsNullOrWhiteSpace($AdminToken)) {
        Write-Warning 'ECHORA_ADMIN_TOKEN chưa được đặt. Các kiểm tra yêu cầu Admin token sẽ bị bỏ qua.'
    }
}

$passed = 0
$failed = 0
$skipped = 0

foreach ($check in $checks) {
    $headers = @{}
    if ($check.Auth) {
        if ([string]::IsNullOrWhiteSpace($AdminToken)) {
            Write-Host "  [SKIP] $($check.Name) — thiếu Admin token" -ForegroundColor Yellow
            $skipped++
            continue
        }
        $headers['Authorization'] = "Bearer $AdminToken"
    }

    try {
        $response = Invoke-RestMethod -Uri $check.Url -Headers $headers -Method Get -TimeoutSec 15
        if (& $check.Expect $response) {
            Write-Host "  [PASS] $($check.Name)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  [FAIL] $($check.Name) — Kỳ vọng: $($check.ExpectDesc)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  [FAIL] $($check.Name) — $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Kết quả: $passed pass, $failed fail, $skipped skip (trong $($checks.Count) kiểm tra)"

if ($failed -gt 0) {
    Write-Host "Hệ thống chưa sẵn sàng cho demo. Xem chi tiết lỗi ở trên." -ForegroundColor Red
    exit 1
}

Write-Host "Hệ thống sẵn sàng." -ForegroundColor Green
exit 0
