param(
    [string]$BaseUrl = $env:ECHORA_BASE_URL,
    [string]$AdminToken = $env:ECHORA_ADMIN_TOKEN,
    [switch]$WhatIf
)

<#
.SYNOPSIS
    Kiem tra suc khoe toan bo he thong Echora truoc demo (GET only, khong sua du lieu).
    Thoat voi code 0 neu tat ca pass, code 1 neu co bat ky loi nao.

.PARAMETER BaseUrl
    URL goc gateway. Mac dinh: $env:ECHORA_BASE_URL hoac http://localhost:18080.

.PARAMETER AdminToken
    Bearer token cua Admin. Lay tu $env:ECHORA_ADMIN_TOKEN.

.PARAMETER WhatIf
    In danh sach kiem tra ma khong thuc thi.

.EXAMPLE
    $env:ECHORA_ADMIN_TOKEN = '<token>'
    powershell -File scripts/preflight.ps1

.EXAMPLE
    powershell -File scripts/preflight.ps1 -WhatIf
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
    Name = 'Content API: danh sach POI'
    Url  = "$BaseUrl/api/content/pois/guide"
    Auth = $false
    Expect = { param($r) ($r -is [array] -and $r.Count -gt 0) -or ($r.pois -is [array] -and $r.pois.Count -gt 0) }
    ExpectDesc = 'tra mang POI khong rong'
})

$checks.Add(@{
    Name = 'Audio status (admin)'
    Url  = "$BaseUrl/api/content/admin/audio/status"
    Auth = $true
    Expect = { param($r) $r.allReady -eq $true }
    ExpectDesc = 'allReady == true'
})

if ($WhatIf) {
    Write-Host "[WhatIf] Danh sach kiem tra preflight ($($checks.Count) muc):"
    $checks | ForEach-Object { Write-Host "  - $($_.Name): $($_.Url)" }
    exit 0
}

if ($checks | Where-Object { $_.Auth } | Select-Object -First 1) {
    if ([string]::IsNullOrWhiteSpace($AdminToken)) {
        Write-Warning 'ECHORA_ADMIN_TOKEN chua duoc dat. Cac kiem tra yeu cau Admin token se bi bo qua.'
    }
}

$passed = 0
$failed = 0
$skipped = 0

foreach ($check in $checks) {
    $headers = @{}
    if ($check.Auth) {
        if ([string]::IsNullOrWhiteSpace($AdminToken)) {
            Write-Host "  [SKIP] $($check.Name) - thieu Admin token" -ForegroundColor Yellow
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
            Write-Host "  [FAIL] $($check.Name) - Ky vong: $($check.ExpectDesc)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  [FAIL] $($check.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Ket qua: $passed pass, $failed fail, $skipped skip (trong $($checks.Count) kiem tra)"

if ($failed -gt 0) {
    Write-Host 'He thong chua san sang cho demo. Xem chi tiet loi o tren.' -ForegroundColor Red
    exit 1
}

Write-Host 'He thong san sang.' -ForegroundColor Green
exit 0
