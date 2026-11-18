param(
    [int]$Port = 0,
    [string]$Domain = $env:NGROK_DOMAIN,
    [switch]$GenerateQrImages,
    [switch]$WhatIf
)

<#
.SYNOPSIS
    Khoi dong ngrok HTTPS tunnel va tu dong dong bo VITE_QR_BASE_URL
    de dien thoai quet ma QR tren trang "Diem du lich" (/diem-du-lich).

.EXAMPLE
    .\scripts\start-ngrok-qr.bat
    powershell -ExecutionPolicy Bypass -File scripts/start-ngrok-qr.ps1
    powershell -ExecutionPolicy Bypass -File scripts/start-ngrok-qr.ps1 -Port 8088
    powershell -ExecutionPolicy Bypass -File scripts/start-ngrok-qr.ps1 -Domain "ten-mien-tinh.ngrok-free.dev"
#>

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendEnvPath = Join-Path $repoRoot 'frontend\.env'
$frontendEnvExamplePath = Join-Path $repoRoot 'frontend\.env.example'

function Test-LocalPortOpen {
    param([int]$CheckPort)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect('127.0.0.1', $CheckPort, $null, $null)
        $connected = $async.AsyncWaitHandle.WaitOne(350, $false)
        if ($connected -and $client.Connected) {
            $client.EndConnect($async)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Set-EnvKeyValue {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )
    $lines = @()
    if (Test-Path $FilePath) {
        $raw = Get-Content -Path $FilePath -Raw -Encoding UTF8
        if ($null -ne $raw -and $raw.Length -gt 0) {
            $lines = $raw -replace "`r`n", "`n" -split "`n"
        }
    }

    $pattern = "^$([Regex]::Escape($Key))="
    $updated = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $pattern) {
            $lines[$i] = "$Key=$Value"
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $lines += "$Key=$Value"
    }

    $content = (($lines -join "`r`n").TrimEnd("`r", "`n")) + "`r`n"
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
}

function Get-ActiveNgrokUrl {
    param([int]$ExpectedPort)
    try {
        $resp = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -Method Get -TimeoutSec 2
        foreach ($tunnel in $resp.tunnels) {
            if ($tunnel.public_url -like 'https://*') {
                $addr = [string]$tunnel.config.addr
                if ($ExpectedPort -le 0 -or $addr -match "(:|/)$ExpectedPort($|/)") {
                    return ([string]$tunnel.public_url).TrimEnd('/')
                }
            }
        }
    } catch {
        return $null
    }
    return $null
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ECHORA - NGROK TUNNEL CHO QUET MA QR DIEM DU LICH" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra ngrok CLI
$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokCmd) {
    Write-Host "[LOI] Khong tim thay lenh 'ngrok' trong PATH." -ForegroundColor Red
    Write-Host "  -> Cai dat tai: https://ngrok.com/download (hoac: choco install ngrok)" -ForegroundColor Yellow
    Write-Host "  -> Sau do dang nhap token 1 lan: ngrok config add-authtoken <TOKEN_CUA_BAN>" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Tim thay ngrok: $($ngrokCmd.Source)" -ForegroundColor Green

# 2. Tu dong chon cong frontend (5173 Vite dev hoac 8088 Docker Nginx)
$viteUp = Test-LocalPortOpen -CheckPort 5173
$dockerFrontendUp = Test-LocalPortOpen -CheckPort 8088
$gatewayUp = Test-LocalPortOpen -CheckPort 18080

if ($Port -le 0) {
    if ($viteUp) {
        $Port = 5173
    } elseif ($dockerFrontendUp) {
        $Port = 8088
    } else {
        $Port = 5173
    }
}

if ($Port -eq 5173) {
    if ($viteUp) {
        Write-Host "[OK] Frontend Vite dev server dang chay tai http://localhost:5173" -ForegroundColor Green
    } else {
        Write-Host "[!] Cong 5173 chua bat. Hay mo 1 terminal khac va chay:" -ForegroundColor Yellow
        Write-Host "      cd frontend && npm run dev" -ForegroundColor White
    }
} elseif ($Port -eq 8088) {
    if ($dockerFrontendUp) {
        Write-Host "[OK] Frontend Docker Nginx dang chay tai http://localhost:8088" -ForegroundColor Green
    } else {
        Write-Host "[!] Cong 8088 chua bat. Hay chay: docker compose up -d" -ForegroundColor Yellow
    }
}

if ($gatewayUp) {
    Write-Host "[OK] API Gateway dang chay tai http://localhost:18080 (san sang giai ma /qr/<token>)" -ForegroundColor Green
} else {
    Write-Host "[!] API Gateway (18080) chua phan hoi. Trang /qr/<token> tren dien thoai can backend:" -ForegroundColor Yellow
    Write-Host "      docker compose up -d" -ForegroundColor White
}

if ($WhatIf) {
    Write-Host ""
    Write-Host "[-WhatIf] Se mo ngrok http $Port va cap nhat VITE_QR_BASE_URL trong frontend/.env." -ForegroundColor Cyan
    exit 0
}

# 3. Khoi dong hoac tai su dung tunnel ngrok dang chay
$publicUrl = Get-ActiveNgrokUrl -ExpectedPort $Port
$ngrokProcess = $null

if ($publicUrl) {
    Write-Host "[OK] Tai su dung tunnel ngrok dang mo cho cong ${Port}: $publicUrl" -ForegroundColor Green
} else {
    # Neu co ngrok cu dang tro sang cong khac thi dung de mo dung cong
    $existingAny = Get-ActiveNgrokUrl -ExpectedPort 0
    if ($existingAny) {
        Write-Host "[i] Dang dong phien ngrok cu de chuyen sang cong $Port..." -ForegroundColor Yellow
        Get-Process -Name 'ngrok' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 600
    }

    $ngrokArgs = @('http')
    if (-not [string]::IsNullOrWhiteSpace($Domain)) {
        $cleanDomain = $Domain.Trim() -replace '^https?://', '' -replace '/+$', ''
        $ngrokArgs += "--url=$cleanDomain"
    }
    $ngrokArgs += "$Port"

    Write-Host ""
    Write-Host "Dang khoi dong: ngrok $($ngrokArgs -join ' ') ..." -ForegroundColor Cyan
    $ngrokProcess = Start-Process -FilePath $ngrokCmd.Source -ArgumentList $ngrokArgs -PassThru -WindowStyle Minimized

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        if ($ngrokProcess.HasExited) {
            Write-Host ""
            Write-Host "[LOI] ngrok da thoat som (ExitCode: $($ngrokProcess.ExitCode))." -ForegroundColor Red
            Write-Host "Kiem tra xem ban da them authtoken chua:" -ForegroundColor Yellow
            Write-Host "  ngrok config add-authtoken <TOKEN_CUA_BAN>" -ForegroundColor White
            Write-Host "Lay token mien phi tai: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Gray
            exit 1
        }
        $publicUrl = Get-ActiveNgrokUrl -ExpectedPort $Port
        if ($publicUrl) {
            break
        }
    }

    if (-not $publicUrl) {
        Write-Host "[LOI] Khong doc duoc URL HTTPS tu http://127.0.0.1:4040/api/tunnels sau 15 giay." -ForegroundColor Red
        if ($ngrokProcess -and -not $ngrokProcess.HasExited) {
            Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

# 4. Cap nhat frontend/.env de ma QR tren trang Diem du lich tro dung link HTTPS cua ngrok
if (-not (Test-Path $frontendEnvPath) -and (Test-Path $frontendEnvExamplePath)) {
    Copy-Item -Path $frontendEnvExamplePath -Destination $frontendEnvPath
}

if (Test-Path $frontendEnvPath) {
    # De trong VITE_API_BASE_URL de dien thoai goi /api qua tunnel thay vi localhost:18080
    Set-EnvKeyValue -FilePath $frontendEnvPath -Key 'VITE_API_BASE_URL' -Value ''
    Set-EnvKeyValue -FilePath $frontendEnvPath -Key 'VITE_QR_BASE_URL' -Value $publicUrl
    Write-Host "[OK] Da cap nhat frontend/.env -> VITE_QR_BASE_URL=$publicUrl" -ForegroundColor Green
}

if ($GenerateQrImages) {
    $genScript = Join-Path $PSScriptRoot 'generate-qr.ps1'
    if (Test-Path $genScript) {
        & $genScript -PublicDomain $publicUrl -FromSeedOnly
    }
}

$tourUrl = "$publicUrl/diem-du-lich"
try {
    Set-Clipboard -Value $tourUrl
    $copiedNote = " (da copy vao Clipboard)"
} catch {
    $copiedNote = ""
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host " SAN SANG QUET MA QR TREN DIEN THOAI!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  URL Tunnel HTTPS : $publicUrl" -ForegroundColor White
Write-Host "  Trang Diem du lich: $tourUrl$copiedNote" -ForegroundColor Cyan
if ($Port -eq 5173) {
    Write-Host "  Tren may tinh    : http://localhost:5173/diem-du-lich (Vite tu nap URL QR moi)" -ForegroundColor Gray
} else {
    Write-Host "  Luu y Docker 8088: Hay mo $tourUrl tren trinh duyet de ma QR lay dung domain HTTPS" -ForegroundColor Yellow
}
Write-Host "  Ngrok Inspector  : http://127.0.0.1:4040" -ForegroundColor Gray
Write-Host ""
Write-Host "Cach test nhanh:" -ForegroundColor Yellow
Write-Host "  1. Mo trang Diem du lich -> chon 1 diem dung -> bam 'Tren dien thoai'." -ForegroundColor White
Write-Host "  2. Dung camera dien thoai quet ma QR -> bam 'Visit Site' (neu ngrok hoi lan dau)." -ForegroundColor White
Write-Host "  3. Nhan Ctrl + C tai cua so nay khi muon tat ngrok." -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if ($ngrokProcess) {
    try {
        Wait-Process -Id $ngrokProcess.Id
    } finally {
        if (-not $ngrokProcess.HasExited) {
            Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "Tunnel ngrok dang chay san o tien trinh khac. Dong cua so ngrok do khi ket thuc." -ForegroundColor Gray
}
