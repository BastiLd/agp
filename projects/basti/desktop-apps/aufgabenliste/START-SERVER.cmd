@echo off
rem ===========================================================================
rem  Aufgabenliste - Server starten (ohne Docker, nur mit Node)
rem  Port 8090, damit "tailscale serve --bg 8090" direkt passt.
rem  Fenster offen lassen. Zum Beenden: Strg+C oder Fenster schliessen.
rem ===========================================================================
title Aufgabenliste - Server
cd /d "%~dp0"

set PORT=8090
set TZ=Europe/Vienna
set DATEN=%~dp0daten

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js wurde nicht gefunden.
  echo   Bitte von https://nodejs.org installieren und dieses Fenster neu oeffnen.
  echo.
  pause
  exit /b 1
)

if not exist "server\server.js" (
  echo.
  echo   server\server.js fehlt. Liegt diese Datei im entpackten Ordner?
  echo.
  pause
  exit /b 1
)

if not exist "public\index.html" (
  echo.
  echo   public\index.html fehlt. Der Ordner "public" gehoert daneben.
  echo.
  pause
  exit /b 1
)

echo.
echo   Server startet auf Port %PORT% ...
echo.
echo   Am PC:        http://localhost:%PORT%/
echo   Im Tailnet:   https://bastian-pc.tailc4f723.ts.net/
echo.
echo   Fenster offen lassen, solange du die App benutzen willst.
echo.

node server\server.js

echo.
echo   Server wurde beendet.
pause
