param(
    [string]$BaseUrl = $env:ECHORA_BASE_URL,
    [string]$AdminToken = $env:ECHORA_ADMIN_TOKEN
)

# Script chỉ đọc (GET), dùng trước demo để phát hiện POI/ngôn ngữ chưa có audio READY.
# Token lấy từ biến môi trường, không ghi vào file hay log.

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://localhost:18080'
}
if ([string]::IsNullOrWhiteSpace($AdminToken)) {
    [Console]::Error.WriteLine('Thiếu ECHORA_ADMIN_TOKEN. Đặt biến môi trường này bằng token admin trước khi chạy.')
    exit 2
}

$headers = @{ Authorization = "Bearer $AdminToken" }
$url = "$($BaseUrl.TrimEnd('/'))/api/content/admin/audio/status"

try {
    $status = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -TimeoutSec 30
} catch {
    [Console]::Error.WriteLine("Không gọi được $url. Kiểm tra stack, gateway và token admin. Chi tiết: $($_.Exception.Message)")
    exit 2
}

Write-Host "Trạng thái audio lúc $($status.generatedAt)"
Write-Host ("POI: {0} | READY: {1} | PENDING: {2} | FAILED: {3}" -f `
    $status.totalPois, $status.readyLanguages, $status.pendingLanguages, $status.failedLanguages)

$rows = foreach ($poi in $status.pois) {
    foreach ($language in $poi.languages) {

        [pscustomobject]@{
            PoiId = $poi.id
            Code = $poi.code
            Language = $language.languageCode
            Status = $language.audioStatus
            Error = $language.errorReason
        }
    }
}

$rows | Format-Table -AutoSize | Out-String -Width 220 | Write-Host

if ($status.allReady) {
    Write-Host 'Tất cả ngôn ngữ đã READY.'
    exit 0
}

Write-Host 'Có ngôn ngữ chưa READY. Dùng POST /api/content/admin/audio/regenerate hoặc tạo lại theo từng POI.'
exit 1
