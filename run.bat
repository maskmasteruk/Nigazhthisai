@echo off
title Nigazhthisai Starter & Tunnel Generator
setlocal enabledelayedexpansion

echo =====================================================================
echo                Nigazhthisai Application Launcher
echo =====================================================================
echo.

:: Step 1: Check dependencies
if not exist "node_modules\" (
    echo [STATUS] node_modules folder not found. Installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed. Please resolve dependencies manually.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

:: Step 2: Start Vite Dev Server
echo [STATUS] Starting Vite development server...
:: start command opens in a new console window to keep logs clean
start "Nigazhthisai - Vite Server" cmd /c "npm run dev"

echo [STATUS] Waiting 3 seconds for Vite server to initialize...
timeout /t 3 /nobreak >nul
echo.

:: Step 3: Check and Run Cloudflare Tunnel
where cloudflared >nul 2>nul
if %errorlevel% equ 0 (
    echo =====================================================================
    echo  [INFO] cloudflared detected!
    echo  Generating a secure, public tunnel URL for local server...
    echo  Look for the line containing "https://*.trycloudflare.com" below.
    echo =====================================================================
    echo.
    cloudflared tunnel --url http://localhost:5173
) else (
    echo =====================================================================
    echo  [WARNING] cloudflared is not installed or not in system PATH.
    echo.
    echo  Your application is running locally at:
    echo  - http://localhost:5173
    echo.
    echo  To generate a public URL automatically next time, install cloudflared:
    echo  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo =====================================================================
    echo.
    pause
)
