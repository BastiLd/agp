# Schnürt die beiden Auslieferungen:
#   dist\mittelkap-terminal\  - Ordner zum Weitergeben an Freunde
#   dist\mittelkap-portabel\  - die Anwendung mit Fenster, portabel
#
# Aufruf:  powershell -ExecutionPolicy Bypass -File tools\paket_bauen.ps1
#
# Diese Datei MUSS mit UTF-8-Signatur (BOM) gespeichert bleiben: Windows PowerShell 5.1
# liest .ps1 ohne Signatur als ANSI, wodurch alle Umlaute in den Texten unten zerfallen.
# Fuer die erzeugten .bat-Dateien gilt das Gegenteil - siehe SchreibeText.

$ErrorActionPreference = "Stop"
$Wurzel = Split-Path $PSScriptRoot -Parent
$Dist   = Join-Path $Wurzel "dist"

function Schritt($t) { Write-Host "`n==> $t" -ForegroundColor Cyan }

# .bat-Dateien dürfen keine UTF-8-Signatur haben: cmd.exe liest sie sonst als Teil
# der ersten Zeile und meldet "Befehl nicht gefunden". Außerdem echte CRLF-Enden.
function SchreibeText($pfad, $inhalt) {
    $text = ($inhalt -replace "`r`n", "`n") -replace "`n", "`r`n"
    [System.IO.File]::WriteAllText($pfad, $text, [System.Text.UTF8Encoding]::new($false))
}

# Löscht einen Paketordner gefahrlos. Wichtig: Remove-Item -Recurse läuft unter
# Windows PowerShell in Verzeichnisverknüpfungen hinein und würde dann echte Daten
# außerhalb des Pakets mitlöschen - etwa einen verlinkten Modellordner.
function EntferneOrdner($pfad) {
    if (-not (Test-Path $pfad)) { return }
    Get-ChildItem $pfad -Recurse -Force -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.LinkType } |
        ForEach-Object {
            Write-Host "    Verknüpfung gelöst: $($_.FullName)" -ForegroundColor DarkGray
            cmd /c rmdir "`"$($_.FullName)`"" | Out-Null
        }
    Remove-Item $pfad -Recurse -Force
}

# ---------------------------------------------------------------- Terminal-Paket

Schritt "Terminal-Paket zusammenstellen"
$T = Join-Path $Dist "mittelkap-terminal"
EntferneOrdner $T
New-Item -ItemType Directory -Force $T | Out-Null

Copy-Item (Join-Path $Wurzel "core") (Join-Path $T "core") -Recurse
Get-ChildItem (Join-Path $T "core") -Recurse -Include "__pycache__" -Directory |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Force (Join-Path $T "tools") | Out-Null
Copy-Item (Join-Path $PSScriptRoot "einrichten.ps1") (Join-Path $T "tools\einrichten.ps1")

@'
@echo off
chcp 65001 >nul
title mittelkap - Einrichtung
echo.
echo   mittelkap wird eingerichtet.
echo   Das dauert beim ersten Mal einige Minuten - danach nie wieder.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\einrichten.ps1"
echo.
echo   Fertig. Du kannst dieses Fenster schließen.
echo   Ab jetzt: mittelkap.bat benutzen.
echo.
pause
'@ | ForEach-Object { SchreibeText (Join-Path $T "EINRICHTEN.bat") $_ }

@'
@echo off
chcp 65001 >nul
setlocal
set "MITTELKAP_DATEN=%~dp0mittelkap-daten"
set "PYTHONPATH=%~dp0core"
set "PY=%~dp0mittelkap-daten\runtime\Scripts\python.exe"

if not exist "%PY%" (
    echo.
    echo   mittelkap ist noch nicht eingerichtet.
    echo   Bitte zuerst EINRICHTEN.bat doppelklicken.
    echo.
    pause
    exit /b 1
)

if "%~1"=="" (
    "%PY%" -m mittelkap hilfe
    echo.
    echo   Tipp: Ziehe eine Sprachnachricht auf diese Datei -
    echo         oder rufe im Terminal auf:  mittelkap.bat nachricht.opus --txt
    echo.
    pause
    exit /b 0
)

"%PY%" -m mittelkap %* --txt
if errorlevel 1 pause
'@ | ForEach-Object { SchreibeText (Join-Path $T "mittelkap.bat") $_ }

@'
mittelkap - Sprachnachrichten in Text verwandeln
================================================

Wandelt deutsche Sprachnachrichten (WhatsApp, Discord, Sprachmemos) in Text um.
Läuft komplett auf deinem eigenen Rechner: kein Konto, keine Kosten, keine
Internetverbindung nötig - deine Aufnahmen verlassen den Rechner nie.


SO FÄNGST DU AN
----------------

1. EINRICHTEN.bat doppelklicken.
   Läuft einmalig durch und lädt alles Nötige herunter (einige Minuten,
   mehrere Gigabyte). Danach nie wieder nötig.

   Falls dabei steht, dass Python fehlt: unter python.org herunterladen,
   installieren, dabei unten "Add python.exe to PATH" ankreuzen - und
   EINRICHTEN.bat nochmal starten.

2. Sprachnachricht auf mittelkap.bat ziehen.
   Der Text erscheint im Fenster und liegt danach als .txt neben der
   Audiodatei.


IM TERMINAL
-----------

Ordner hier öffnen (Rechtsklick "Im Terminal öffnen"), dann:

  mittelkap.bat nachricht.opus          eine Datei
  mittelkap.bat C:\Sprachnachrichten    einen ganzen Ordner
  mittelkap.bat hilfe                   alle Befehle erklärt

Und das Beste - lass dir jeden Befehl Stück für Stück erklären:

  mittelkap.bat erklaere "mittelkap beobachte C:\Sprachis --txt"


WAS ES VERSTEHT
---------------

opus (WhatsApp), ogg (Discord), m4a, mp3, wav, mp4, aac, flac, webm


WIE SCHNELL
-----------

Mit NVIDIA-Grafikkarte: eine Minute Aufnahme in wenigen Sekunden.
Ohne Grafikkarte: läuft trotzdem, dauert etwa so lang wie die Aufnahme
selbst. Die Einrichtung wählt das passende Modell automatisch.


FALLS ETWAS KLEMMT
------------------

  mittelkap.bat zustand      zeigt Grafikkarte, Modelle, Speicher
  mittelkap.bat protokoll    zeigt, was zuletzt passiert ist

Alles liegt im Ordner "mittelkap-daten" direkt daneben. Zum vollständigen
Entfernen: diesen Ordner löschen. Es wurde nichts im System installiert.
'@ | ForEach-Object { SchreibeText (Join-Path $T "LIESMICH.txt") $_ }

Write-Host "    $T" -ForegroundColor Green

# ---------------------------------------------------------------- Portables Paket

Schritt "Portable Anwendung zusammenstellen"
$Exe = Join-Path $Wurzel "gui\src-tauri\target\release\mittelkap.exe"
if (-not (Test-Path $Exe)) {
    Write-Host "    Die Anwendung wurde noch nicht gebaut." -ForegroundColor Yellow
    Write-Host "    Zuerst ausführen:  cd gui\src-tauri; cargo build --release" -ForegroundColor Yellow
    exit 1
}

$P = Join-Path $Dist "mittelkap-portabel"
EntferneOrdner $P
New-Item -ItemType Directory -Force $P | Out-Null

Copy-Item $Exe (Join-Path $P "mittelkap.exe")
Copy-Item (Join-Path $T "core") (Join-Path $P "core") -Recurse
Copy-Item (Join-Path $T "tools") (Join-Path $P "tools") -Recurse

@'
@echo off
chcp 65001 >nul
title mittelkap - Einrichtung
echo.
echo   mittelkap wird eingerichtet.
echo   Einmalig einige Minuten - danach startet die App sofort.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\einrichten.ps1"
echo.
echo   Fertig. Du kannst jetzt mittelkap.exe starten.
echo.
pause
'@ | ForEach-Object { SchreibeText (Join-Path $P "ZUERST-EINRICHTEN.bat") $_ }

@'
mittelkap - Sprachnachrichten offline in Text
=============================================

1. ZUERST-EINRICHTEN.bat doppelklicken (einmalig, lädt alles Nötige).
2. mittelkap.exe starten.
3. Sprachnachricht ins Fenster ziehen.

Alles liegt im Ordner "mittelkap-daten" daneben - diesen Ordner mitnehmen
heißt die ganze App mitnehmen. Es wird nichts im System installiert.

Zum Entfernen: den kompletten Ordner löschen.
'@ | ForEach-Object { SchreibeText (Join-Path $P "LIESMICH.txt") $_ }

Write-Host "    $P" -ForegroundColor Green

Schritt "Fertig"
Get-ChildItem $Dist -Directory | ForEach-Object {
    $groesse = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
    Write-Host ("    {0,-24} {1,7:N1} MB" -f $_.Name, $groesse)
}
