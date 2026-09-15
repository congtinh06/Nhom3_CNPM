@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Batch Script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal
where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    mvn %*
) else (
    echo [ERROR] Maven is not installed or not in PATH. Please install Maven or Java 17.
    exit /b 1
)
