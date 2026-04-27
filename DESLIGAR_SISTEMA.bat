@echo off
title BacksRobo - DESLIGANDO SISTEMA
echo ======================================================
echo           DESLIGANDO SISTEMA BACKSROBO
echo ======================================================
echo.

echo Limpando processos...
taskkill /F /IM node.exe /T
echo.
echo ======================================================
echo          SISTEMA DESLIGADO COM SUCESSO!
echo ======================================================
timeout /t 3
exit
