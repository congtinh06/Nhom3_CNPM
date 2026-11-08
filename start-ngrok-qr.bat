@echo off
chcp 65001 >nul
title Echora - Ngrok QR Tunnel (Diem du lich)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-ngrok-qr.ps1" %*
if errorlevel 1 (
    echo.
    pause
)

