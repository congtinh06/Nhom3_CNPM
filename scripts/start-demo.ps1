#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Hiển thị lệnh khởi động ngrok cho buổi demo Echora.
    Script này KHÔNG khởi động ngrok tự động vì token ngrok là secret của chủ dự án.

.DESCRIPTION
    Sau khi chạy lệnh dưới đây, sao chép URL ngrok (dạng https://*.ngrok-free.dev)
    và cập nhật vào BACKEND_ORIGIN trong .env.local của frontend trước khi build lại,
    hoặc cập nhật trực tiếp trong frontend/vercel.json nếu dùng URL tĩnh từ gói trả phí.

.NOTES
    Cần cài ngrok: https://ngrok.com/download
    Cần set NGROK_AUTHTOKEN trong môi trường hoặc chạy: ngrok config add-authtoken <TOKEN>

.EXAMPLE
    pwsh scripts/start-demo.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=== Khởi động ngrok cho demo Echora ==="
Write-Host ""
Write-Host "Chạy lệnh sau trong terminal riêng (không đóng terminal này):"
Write-Host ""
Write-Host "  ngrok http 18080"
Write-Host ""
Write-Host "Sau khi ngrok khởi động, sao chép URL dạng:"
Write-Host "  https://xxxx-xxxx-xxxx.ngrok-free.dev"
Write-Host ""
Write-Host "Rồi cập nhật URL đó vào frontend/vercel.json dòng 32 và 46 (src rewrite dest)."
Write-Host "Sau đó deploy lại frontend hoặc chạy: vercel --prod"
Write-Host ""
Write-Host "Kiểm tra gateway đang chạy:"
try {
    $health = Invoke-RestMethod -Uri "http://localhost:18080/actuator/health" -Method Get -TimeoutSec 5
    Write-Host "  Gateway: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  Gateway chưa phản hồi tại localhost:18080. Kiểm tra docker compose." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Kiểm tra audio trước demo:"
Write-Host "  `$env:ECHORA_ADMIN_TOKEN = '<token admin>'"
Write-Host "  pwsh scripts/check-audio-status.ps1"
Write-Host ""

# NEEDS THE OWNER: Lệnh ngrok thật cần NGROK_AUTHTOKEN và không được hard-code vào script.
# Nếu dùng ngrok trả phí (domain tĩnh), thêm: ngrok http --domain=<your-domain> 18080
