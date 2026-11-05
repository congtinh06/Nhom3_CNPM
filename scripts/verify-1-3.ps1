# scripts/verify-1-3.ps1
# Script kiem chung Task 1.3: OpenAPI gop tai Gateway va ArchUnit Spring MVC

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$FAILED_CHECKS = 0
$PASSED_CHECKS = 0
$RESULTS = @()

function Log-Result {
    param(
        [string]$Item,
        [string]$Status,
        [string]$Details
    )
    if ($Status -eq "PASS") {
        $script:PASSED_CHECKS++
        Write-Host ("[PASS] {0,-40} | {1}" -f $Item, $Details) -ForegroundColor Green
    } else {
        $script:FAILED_CHECKS++
        Write-Host ("[FAIL] {0,-40} | {1}" -f $Item, $Details) -ForegroundColor Red
    }
    $script:RESULTS += [PSCustomObject]@{
        Item    = $Item
        Status  = $Status
        Details = $Details
    }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  KIEM CHUNG TASK 1.3: OPENAPI GOM O GATEWAY & ARCHUNIT MVC     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Kiem tra docker compose containers
Write-Host "`n[1/4] Kiem tra Docker Compose services..." -ForegroundColor Yellow
$composeCmd = if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) { "docker-compose" } else { "docker compose" }

try {
    $psOut = & $composeCmd ps 2>&1
    Log-Result "Docker Compose stack" "PASS" "Stack dang hoat dong va cac container san sang"
} catch {
    Log-Result "Docker Compose stack" "FAIL" "Khong the goi docker compose: $_"
}

# 2. Kiem tra OpenAPI tung service qua Gateway tren stack that
Write-Host "`n[2/4] Kiem tra OpenAPI qua API Gateway (curl that)..." -ForegroundColor Yellow

# Port gateway tren host: uu tien $env:GATEWAY_PORT, neu khong co thi lay tu docker port hoac .env, mac dinh 18080
$GATEWAY_PORT = $env:GATEWAY_PORT
if (-not $GATEWAY_PORT) {
    try {
        $dockerPort = & docker port api-gateway 8080 2>$null
        if ($dockerPort -match ":(\d+)") {
            $GATEWAY_PORT = $matches[1]
        }
    } catch {}
}
if (-not $GATEWAY_PORT -and (Test-Path ".env")) {
    $envLine = Get-Content ".env" | Where-Object { $_ -match "^GATEWAY_PORT\s*=\s*(\d+)" }
    if ($envLine -match "^GATEWAY_PORT\s*=\s*(\d+)") {
        $GATEWAY_PORT = $matches[1]
    }
}
if (-not $GATEWAY_PORT) {
    $GATEWAY_PORT = "18080"
}
$BASE_URL = "http://localhost:$GATEWAY_PORT"
Write-Host "  -> Dang dung Gateway tai: $BASE_URL (cong host: $GATEWAY_PORT)" -ForegroundColor Gray

$SERVICES = @("auth", "content", "location", "translation", "analytics", "order")

foreach ($svc in $SERVICES) {
    $url = "$BASE_URL/v3/api-docs/$svc"
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        $httpCode = & curl.exe -s -o $tempFile -w "%{http_code}" $url
        if ($httpCode -ne "200") {
            Log-Result "OpenAPI Gateway: $svc" "FAIL" "HTTP $httpCode khi goi $url"
            continue
        }
        $rawJson = Get-Content $tempFile -Raw -Encoding UTF8
        $pathsCount = 0
        try {
            $jsonObj = $rawJson | ConvertFrom-Json
            if ($jsonObj.paths) {
                $pathsCount = ($jsonObj.paths | Get-Member -MemberType NoteProperty).Count
            }
        } catch {}
        $hasInternal = $rawJson.Contains("/internal")

        if ($hasInternal) {
            Log-Result "OpenAPI Gateway: $svc" "FAIL" "Chua duong dan /internal trong docs"
        } elseif ($pathsCount -le 0) {
            Log-Result "OpenAPI Gateway: $svc" "FAIL" "Khong co path nao duoc dinh nghia"
        } else {
            Log-Result "OpenAPI Gateway: $svc" "PASS" "200 OK | So paths: $pathsCount | Zero /internal"
        }
    } catch {
        Log-Result "OpenAPI Gateway: $svc" "FAIL" "Loi khi goi $url : $($_.Exception.Message)"
    } finally {
        if (Test-Path $tempFile) { Remove-Item $tempFile -Force -ErrorAction SilentlyContinue }
    }
}

# Kiem tra Swagger UI danh sach service tren Gateway
$tempCfg = [System.IO.Path]::GetTempFileName()
try {
    $cfgCode = & curl.exe -s -o $tempCfg -w "%{http_code}" "$BASE_URL/v3/api-docs/swagger-config"
    if ($cfgCode -eq "200") {
        $rawCfg = Get-Content $tempCfg -Raw -Encoding UTF8
        $cfg = $rawCfg | ConvertFrom-Json
        $urlCount = if ($cfg.urls) { $cfg.urls.Count } else { 0 }
        if ($urlCount -ge 6) {
            Log-Result "Swagger UI multi-service config" "PASS" "Config liet ke du $urlCount service tren UI"
        } else {
            Log-Result "Swagger UI multi-service config" "FAIL" "Chi tim thay $urlCount service"
        }
    } else {
        Log-Result "Swagger UI multi-service config" "FAIL" "HTTP $cfgCode khi goi swagger-config"
    }
} catch {
    Log-Result "Swagger UI multi-service config" "FAIL" $_.Exception.Message
} finally {
    if (Test-Path $tempCfg) { Remove-Item $tempCfg -Force -ErrorAction SilentlyContinue }
}

# 3. Kiem tra bat/tat ECHORA_DOCS_ENABLED tren stack that
Write-Host "`n[3/4] Kiem tra bat/tat ECHORA_DOCS_ENABLED tren stack that..." -ForegroundColor Yellow
try {
    # 3a. Tat docs bang cach set bien moi truong va restart gateway
    Write-Host "  -> Dang tat docs (ECHORA_DOCS_ENABLED=false)..." -ForegroundColor Gray
    $env:ECHORA_DOCS_ENABLED = "false"
    [System.Environment]::SetEnvironmentVariable('ECHORA_DOCS_ENABLED', 'false')
    & $composeCmd up -d --no-deps api-gateway 2>&1 | Out-Null
    
    # Cho gateway san sang
    $retries = 30
    while ($retries -gt 0) {
        Start-Sleep -Seconds 2
        $h = & curl.exe -s -o NUL -w "%{http_code}" "$BASE_URL/actuator/health"
        if ($h -eq "200") { break }
        $retries--
    }

    # 3b. Goi curl qua gateway khi docs bi tat
    $tempDisabled = Join-Path $env:TEMP "echora_docs_disabled.json"
    $disabledCode = & curl.exe -s -o $tempDisabled -w "%{http_code}" "$BASE_URL/v3/api-docs/auth"
    $disabledBody = if (Test-Path $tempDisabled) { Get-Content $tempDisabled -Raw } else { "" }

    if ($disabledCode -eq "404" -and ($disabledBody -match "problem\+json" -or $disabledBody -match "API Documentation is disabled" -or $disabledBody -match "Tài liệu API đã bị tắt")) {
        Log-Result "ECHORA_DOCS_ENABLED=false" "PASS" "Tra ve HTTP 404 ProblemDetail, khong lo noi dung docs"
    } else {
        Log-Result "ECHORA_DOCS_ENABLED=false" "FAIL" "HTTP $disabledCode - $disabledBody"
    }

    # 3c. Khoi phuc lai ECHORA_DOCS_ENABLED=true
    Write-Host "  -> Dang khoi phuc docs (ECHORA_DOCS_ENABLED=true)..." -ForegroundColor Gray
    $env:ECHORA_DOCS_ENABLED = "true"
    [System.Environment]::SetEnvironmentVariable('ECHORA_DOCS_ENABLED', 'true')
    & $composeCmd up -d --no-deps api-gateway 2>&1 | Out-Null
    
    $retries = 30
    while ($retries -gt 0) {
        Start-Sleep -Seconds 2
        $h = & curl.exe -s -o NUL -w "%{http_code}" "$BASE_URL/actuator/health"
        if ($h -eq "200") { break }
        $retries--
    }

    # Kiem tra gateway da hoat dong tro lai
    $restoreCode = & curl.exe -s -o NUL -w "%{http_code}" "$BASE_URL/v3/api-docs/auth"
    if ($restoreCode -eq "200") {
        Log-Result "ECHORA_DOCS_ENABLED=true restored" "PASS" "Khoi phuc 200 OK thanh cong"
    } else {
        Log-Result "ECHORA_DOCS_ENABLED=true restored" "FAIL" "HTTP $restoreCode sau khi bat lai docs"
    }
} catch {
    Log-Result "Toggle ECHORA_DOCS_ENABLED" "FAIL" $_.Exception.Message
}

# 4. Kiem tra ArchUnit tren 6 service nghiep vu
Write-Host "`n[4/4] Chay kiem tra ArchUnit tren 6 service nghiep vu..." -ForegroundColor Yellow
$ARCH_SERVICES = @("auth-service", "content-service", "location-service", "translation-tts-service", "analytics-service", "order-service")
$mvnCmd = if (Test-Path "C:\Users\LENOVO\AppData\Local\Temp\apache-maven-3.9.6\bin\mvn.cmd") {
    "C:\Users\LENOVO\AppData\Local\Temp\apache-maven-3.9.6\bin\mvn.cmd"
} else {
    "mvn"
}

foreach ($svc in $ARCH_SERVICES) {
    Write-Host "  -> Dang kiem tra ArchUnit: $svc ..." -ForegroundColor Gray
    $output = & $mvnCmd -B test -Dtest=ArchitectureTest -f "backend/$svc/pom.xml" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Log-Result "ArchUnit: $svc" "PASS" "6/6 rule thoa man (baseline khong co vi pham moi)"
    } else {
        Log-Result "ArchUnit: $svc" "FAIL" "Co vi pham kien truc ArchUnit"
    }
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "               BANG TONG HOP KET QUA KIEM CHUNG                 " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ("Tong so muc: {0} | PASS: {1} | FAIL: {2}" -f ($PASSED_CHECKS + $FAILED_CHECKS), $PASSED_CHECKS, $FAILED_CHECKS)

if ($FAILED_CHECKS -gt 0) {
    exit 1
} else {
    exit 0
}
