$path = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $path

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "           INICIANDO SISTEMA BACKSROBO" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Limpeza
Write-Host "[1/4] Limpando processos antigos..." -ForegroundColor Yellow
Stop-Process -Name node -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Backend
Write-Host "[2/4] Ligando o Motor (Backend)..." -ForegroundColor Yellow
Set-Location "$path\backend"
Start-Process cmd -ArgumentList "/c set NODE_OPTIONS=--openssl-legacy-provider && npm run dev:server" -WindowStyle Hidden

# Frontend
Write-Host "[3/4] Ligando a Interface (Frontend)..." -ForegroundColor Yellow
Set-Location "$path\frontend"
$env:NODE_OPTIONS = "--openssl-legacy-provider"
$env:BROWSER = "none"
$env:CI = "true"
Start-Process cmd -ArgumentList "/c set NODE_OPTIONS=--openssl-legacy-provider && set BROWSER=none && set CI=true && npm start" -WindowStyle Hidden

# Final
Write-Host "[4/4] Quase pronto! Abrindo o sistema..." -ForegroundColor Green
Start-Sleep -Seconds 25
Start-Process "http://127.0.0.1:3000"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "    SISTEMA LIGADO! PODE FECHAR ESTA JANELA." -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Read-Host "Pressione Enter para fechar"
