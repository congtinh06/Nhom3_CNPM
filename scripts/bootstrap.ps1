#!/usr/bin/env pwsh
# bootstrap.ps1 — Chạy toàn bộ Echora trên Windows bằng một lệnh.
#   powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '[bootstrap] 1/3 Sinh .env và frontend/.env...'
node scripts/setup-env.mjs

Write-Host '[bootstrap] 2/3 Kiểm tra cấu hình...'
node scripts/check-env.mjs

Write-Host '[bootstrap] 3/3 Build và khởi động Docker Compose...'
docker compose up -d --build
docker compose ps

Write-Host ''
Write-Host '[bootstrap] Xong. Kiểm tra:'
Write-Host '  Gateway : http://localhost:18080/actuator/health'
Write-Host '  Web     : http://localhost:8088/'
