@echo off
chcp 65001 >nul
title Claude Token-Dashboard
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js wurde nicht gefunden - starte Installation ...
  call "%~dp0install.bat"
  if errorlevel 1 exit /b 1
  where node >nul 2>nul
  if errorlevel 1 (
    echo.
    echo Node.js ist in diesem Fenster weiterhin nicht verfuegbar.
    echo Bitte dieses Fenster schliessen, neu oeffnen und start.bat erneut starten.
    pause
    exit /b 1
  )
)
node server.js --open
pause
