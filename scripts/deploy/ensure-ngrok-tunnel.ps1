<#
.SYNOPSIS
    Dam bao tunnel ngrok cong khai dang tro dung vao frontend Docker (port 8088).

.DESCRIPTION
    CD smoke test goi URL cong khai qua ngrok. Neu tunnel dang tro vao Vite dev
    (5173) ma Vite da tat, ngrok tra 502 Bad Gateway. Script nay kiem tra tunnel
    hien tai, va neu sai port / port khong mo thi khoi dong lai ngrok tro vao
    container frontend (mac dinh 8088) - port nay luon song sau khi deploy.

    Tien trinh ngrok duoc tao qua WMI de khong bi GitHub Actions runner kill khi
    job ket thuc.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/deploy/ensure-ngrok-tunnel.ps1 `
        -PublicHost wolf-morse-boasting.ngrok-free.dev -Port 8088
#>
param(
    [Parameter(Mandatory = $true)][string]$PublicHost,
    [int]$Port = 8088,
    [int]$InspectorPort = 4040,
    [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = 'Stop'

# Chap nhan ca "domain", "https://domain" hoac "https://domain/".
$PublicHost = ($PublicHost -replace '^https?://', '').TrimEnd('/')
if ([string]::IsNullOrWhiteSpace($PublicHost)) {
    throw "PublicHost is required (example: ten-mien.ngrok-free.dev)"
}

function Get-NgrokTunnels {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$InspectorPort/api/tunnels" -TimeoutSec 3
        return @($resp.tunnels)
    } catch {
        return @()
    }
}

function Test-LocalPort {
    param([int]$CheckPort)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect('127.0.0.1', $CheckPort, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(500, $false) -and $client.Connected) {
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

function Get-AddrPort {
    param([string]$Addr)
    try {
        return ([uri]$Addr).Port
    } catch {
        return 0
    }
}

function Find-Tunnel {
    foreach ($tunnel in Get-NgrokTunnels) {
        if ($tunnel.proto -ne 'https') { continue }
        $urlHost = ''
        try { $urlHost = ([uri]$tunnel.public_url).Host } catch { }
        if ($urlHost -eq $PublicHost) { return $tunnel }
    }
    return $null
}

function Stop-NgrokAgents {
    # Dung tat ca agent ngrok dang chay tren may runner truoc khi mo tunnel moi.
    Get-CimInstance Win32_Process -Filter "Name='ngrok.exe'" -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

function Start-DetachedNgrok {
    param([string]$Exe, [int]$TargetPort)
    $commandLine = '"{0}" http 127.0.0.1:{1} --url={2}' -f $Exe, $TargetPort, $PublicHost
    # Win32_Process.Create: tien trinh thuoc WmiPrvSE, khong nam trong job object
    # cua runner nen khong bi kill khi step/job ket thuc.
    $result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $commandLine }
    if ($result.ReturnValue -ne 0) {
        throw "Cannot start ngrok (Win32_Process.Create returned $($result.ReturnValue))."
    }
}

$existing = Find-Tunnel
if ($existing) {
    $addrPort = Get-AddrPort $existing.config.addr
    if ($addrPort -eq $Port -and (Test-LocalPort $Port)) {
        Write-Host "[tunnel] OK: $PublicHost -> 127.0.0.1:$Port"
        exit 0
    }
    Write-Host "[tunnel] $PublicHost dang tro vao '$($existing.config.addr)' (can 127.0.0.1:$Port); khoi dong lai..."
}

if (-not (Test-LocalPort $Port)) {
    throw "Port $Port is not listening; deploy the frontend container before starting the tunnel."
}

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
    throw "ngrok CLI not found in PATH on the runner machine."
}

Stop-NgrokAgents
Start-Sleep -Seconds 2

Write-Host "[tunnel] Starting: ngrok http 127.0.0.1:$Port --url=$PublicHost"
Start-DetachedNgrok -Exe $ngrok.Source -TargetPort $Port

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $tunnel = Find-Tunnel
    if ($tunnel -and (Get-AddrPort $tunnel.config.addr) -eq $Port) {
        Write-Host "[tunnel] OK: $($tunnel.public_url) -> 127.0.0.1:$Port"
        exit 0
    }
}

throw "ngrok tunnel for $PublicHost -> 127.0.0.1:$Port did not come up within $TimeoutSeconds seconds."
